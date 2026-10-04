#!/usr/bin/env node
// Loads the POEMs repository spreadsheet (sheet "EBP_Data") into the poems
// table, one POEM per row with each element in its own column.
//
//   node import-spreadsheet.js "/path/to/POEMs repository.xlsx"            import
//   node import-spreadsheet.js "/path/to/POEMs repository.xlsx" --dry-run  report only, write nothing
//   node import-spreadsheet.js "/path/to/POEMs repository.xlsx" --replace  re-import: removes the
//                                                       previously imported rows first (POEMs written in the app are never touched)
//
// A copy of the database is saved to <data dir>/backups/ before anything is written.
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const ExcelJS = require('exceljs');

const args = process.argv.slice(2);
const file = args.find(a => !a.startsWith('--'));
const dryRun = args.includes('--dry-run');
const replace = args.includes('--replace');
if (!file) {
  console.error('Usage: node import-spreadsheet.js <spreadsheet.xlsx> [--dry-run] [--replace]');
  process.exit(1);
}

const db = require('./db');
const { textToHtml, poetFromInitials, pubmedUrlFor, generatePoemId } = require('./poem-model');

// ---------- cell helpers ----------
function cellText(v) {
  if (v === null || v === undefined) return '';
  if (typeof v === 'object') {
    if (v instanceof Date) return v.toISOString();
    if (Array.isArray(v.richText)) return v.richText.map(r => r.text).join('');
    if (v.text !== undefined) return cellText(v.text);       // hyperlink cell
    if (v.result !== undefined) return cellText(v.result);   // formula cell
    if (v.hyperlink) return String(v.hyperlink);
    return '';
  }
  return String(v);
}
const clean = (v) => cellText(v).replace(/ /g, ' ').trim();
const optional = (v) => clean(v) || null;

function toInt(v) {
  const s = clean(v);
  if (!/^-?\d+(\.0+)?$/.test(s)) return null;
  return parseInt(s, 10);
}

function isoDate(v) {
  const d = v instanceof Date ? v : null;
  if (!d || isNaN(d)) return null;
  if (d.getUTCFullYear() < 1990) return null; // 1900-01-01 is a placeholder in the source
  return d.toISOString().slice(0, 10);
}

async function main() {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(file);
  const ws = wb.getWorksheet('EBP_Data') || wb.worksheets[0];
  const headers = {};
  ws.getRow(1).eachCell((cell, col) => { headers[clean(cell.value)] = col; });
  const required = ['Title', 'Reference', 'Question', 'Synopsis', 'BottomLine', 'POET', 'MonthNum', 'Year', 'PubMedID'];
  const missing = required.filter(h => !headers[h]);
  if (missing.length) throw new Error(`Spreadsheet is missing expected columns: ${missing.join(', ')}`);
  const get = (row, name) => (headers[name] ? row.getCell(headers[name]).value : null);

  const now = new Date().toISOString();
  const records = [];
  const problems = [];
  let urlMismatch = 0;
  const stats = { poemIdBlank: 0, noPubMed: 0, naPubMed: 0, sourceLinkOnNA: 0, tagsKept: 0 };

  ws.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    if (rowNumber === 1) return;
    const title = clean(get(row, 'Title'));
    if (!title && !clean(get(row, 'Synopsis'))) return; // blank spreadsheet row
    const where = `row ${rowNumber}`;
    if (!title) { problems.push(`${where}: no title, skipped`); return; }

    const year = toInt(get(row, 'Year'));
    const month = toInt(get(row, 'MonthNum'));
    const exact = isoDate(get(row, 'PubDate'));
    let publicationDate = null;
    if (year && month && month >= 1 && month <= 12) publicationDate = `${year}-${String(month).padStart(2, '0')}`;
    else if (exact) publicationDate = exact.slice(0, 7);
    if (!publicationDate) { problems.push(`${where}: "${title.slice(0, 50)}" has no usable year/month, skipped`); return; }

    const initials = optional(get(row, 'POET'));
    const poemId = toInt(get(row, 'POEM_ID'));

    let pubmedId = clean(get(row, 'PubMedID'));
    const rawUrl = optional(get(row, 'PubMedURL'));
    const sheetUrl = rawUrl && /^https?:\/\//i.test(rawUrl) ? rawUrl : null; // "NA" etc. is not a link
    if (/^na$/i.test(pubmedId)) { pubmedId = 'NA'; stats.naPubMed++; }
    else if (/^\d{1,9}$/.test(pubmedId)) { /* ok */ }
    else { if (pubmedId) problems.push(`${where}: unusual PubMedID "${pubmedId}" ignored`); pubmedId = null; stats.noPubMed++; }
    let pubmedUrl = pubmedUrlFor(pubmedId);
    if (pubmedUrl && sheetUrl && sheetUrl !== pubmedUrl) urlMismatch++;
    if (!pubmedUrl && pubmedId === 'NA' && sheetUrl) { pubmedUrl = sheetUrl; stats.sourceLinkOnNA++; }

    const age = toInt(get(row, 'AgeGroup'));
    const synopsis = textToHtml(clean(get(row, 'Synopsis')));
    const bottomLine = textToHtml(clean(get(row, 'BottomLine')));
    if (/<(a|sub|sup|i|b)\b/.test(synopsis + bottomLine)) stats.tagsKept++;

    records.push({
      id: crypto.randomUUID(),
      poem_id: poemId,
      title,
      poet: poetFromInitials(initials) || 'Unknown',
      poet_initials: initials,
      publication_date: publicationDate,
      pub_date_exact: exact,
      reference: clean(get(row, 'Reference')),
      clinical_question: clean(get(row, 'Question')),
      allocation: optional(get(row, 'AllocationCocealment')),
      funding: optional(get(row, 'Funding')),
      study_design: optional(get(row, 'StudyDesign')),
      loe: optional(get(row, 'LOE')),
      setting: optional(get(row, 'Setting')),
      age_group: age !== null && age >= 0 && age <= 3 ? age : null,
      supertype: optional(get(row, 'Supertype')),
      category: optional(get(row, 'Category')),
      synopsis,
      bottom_line: bottomLine,
      pubmed_id: pubmedId,
      pubmed_url: pubmedUrl,
      source: 'import',
      legacy_html: null,
      created_by: 'import',
      updated_by: 'import',
      created_at: now,
      updated_at: now
    });
  });

  // Blank POEM_IDs get a unique random 6-digit number that no other POEM (in the
  // spreadsheet or already in the database) uses.
  const used = new Set(records.map(r => r.poem_id).filter(n => n !== null));
  db.prepare("SELECT poem_id FROM poems WHERE source <> 'import' AND poem_id IS NOT NULL").all().forEach(r => used.add(r.poem_id));
  for (const r of records) {
    if (r.poem_id !== null) continue;
    r.poem_id = generatePoemId(n => used.has(n));
    used.add(r.poem_id);
    stats.poemIdBlank++;
  }
  const counts = new Map();
  records.forEach(r => counts.set(r.poem_id, (counts.get(r.poem_id) || 0) + 1));
  const duplicateIds = [...counts].filter(([, n]) => n > 1).map(([id, n]) => `${id} (x${n})`);

  console.log(`Read ${records.length} POEMs from "${path.basename(file)}".`);
  console.log(`  blank POEM_IDs given a new unique 6-digit number: ${stats.poemIdBlank} | duplicated POEM_IDs left as they were: ${duplicateIds.join(', ') || 'none'}`);
  console.log(`  PubMedID "NA": ${stats.naPubMed} (${stats.sourceLinkOnNA} with a source link) | no PubMedID: ${stats.noPubMed}`);
  console.log(`  rows with links/sub/superscripts kept as formatting: ${stats.tagsKept} | spreadsheet URL differing from PubMedID: ${urlMismatch} (URL rebuilt from PubMedID)`);
  if (problems.length) { console.log(`  ${problems.length} problem(s):`); problems.slice(0, 25).forEach(p => console.log('   - ' + p)); }

  if (dryRun) { console.log('Dry run: nothing was written.'); return; }

  const existingImported = db.prepare("SELECT COUNT(*) AS n FROM poems WHERE source = 'import'").get().n;
  if (existingImported && !replace) {
    console.error(`The database already holds ${existingImported} imported POEMs. Re-run with --replace to replace them.`);
    process.exit(1);
  }

  const backupDir = path.join(db.dataDir, 'backups');
  fs.mkdirSync(backupDir, { recursive: true });
  const backupFile = path.join(backupDir, `poems-before-import-${now.replace(/[:.]/g, '-')}.db`);
  db.exec(`VACUUM INTO '${backupFile.replace(/'/g, "''")}'`);
  console.log(`Backup of the current database saved: ${backupFile}`);

  const cols = Object.keys(records[0]);
  const insert = db.prepare(`INSERT INTO poems (${cols.join(', ')}) VALUES (${cols.map(c => '@' + c).join(', ')})`);
  db.transaction(() => {
    if (replace) db.prepare("DELETE FROM poems WHERE source = 'import'").run();
    for (const r of records) insert.run(r);
  })();

  const total = db.prepare('SELECT COUNT(*) AS n FROM poems').get().n;
  console.log(`Imported ${records.length} POEMs. The database now holds ${total} POEMs in total.`);
}

main().catch(err => { console.error(err); process.exit(1); });
