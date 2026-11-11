// Builds the diagnostic calculators' data (calculator-data.json) from the Diagnostic App
// project's two spreadsheets, and checks them. A port of that project's build/build.py
// and build/build_differential.py, so the spreadsheets can be uploaded in the app
// (Upload tab, administrators) instead of being built on a Mac.
//
//   DiagnosticCalculatorApp.xlsx: sheets "Diagnostic Tests" and "Signs and Symptoms", one
//     row per test or finding (a multi-level test is several rows with Multi = 1, one per
//     range, joined by TestMultiName).
//   DifferentialDiagnosisData.xlsx: sheet "Differential Diagnosis", one row per diagnosis
//     (ItemID, ItemName, Category, Aliases, Rank, Diagnosis, Tier, RedFlag).
//
// Command line (same output as build.py's calculator-data.json):
//   node calculator-build.js DiagnosticCalculatorApp.xlsx DifferentialDiagnosisData.xlsx [out.json]
const fs = require('fs');
const ExcelJS = require('exceljs');

const SPECIALTY_MAP = {
  Dermatologic: 'Dermatology',
  'Ear, nose and throat': 'ENT',
  'Ear, nose throat': 'ENT',
  Gyncology: 'Gynecology',
  Cardiovacular: 'Cardiovascular'
};
const PANELS = [
  { key: 'diagnosticTests', label: 'Diagnostic Tests', sheet: 'Diagnostic Tests', refCol: 'Reference', itemLabel: 'test' },
  { key: 'signsSymptoms', label: 'Signs and Symptoms', sheet: 'Signs and Symptoms', refCol: 'Ref', itemLabel: 'finding' }
];
const DDX_SHEET = 'Differential Diagnosis';
const DDX_HEADER = ['ItemID', 'ItemName', 'Category', 'Aliases', 'Rank', 'Diagnosis', 'Tier', 'RedFlag'];
const VALID_TIERS = new Set(['very-common', 'common', 'less-common', 'uncommon', 'rare']);
const VALID_CATEGORIES = new Set(['Symptom', 'Sign', 'Test Abnormality']);

// A cell's value as openpyxl gives it with data_only=True: formulas as their cached
// result, rich text as plain text, dates as dates.
function cellValue(v) {
  if (v === null || v === undefined) return null;
  if (typeof v === 'object' && !(v instanceof Date)) {
    if ('result' in v) return cellValue(v.result);
    if (Array.isArray(v.richText)) return v.richText.map(r => r.text).join('');
    if ('text' in v) return cellValue(v.text);
    if ('error' in v) return null;
    if ('sharedFormula' in v || 'formula' in v) return null;
  }
  return v;
}
const clean = v => {
  if (v === null || v === undefined) return null;
  if (typeof v === 'string') { const s = v.trim(); return s || null; }
  return v;
};
// round(float(v), 4) as Python does it (to the nearest, ties to even, close enough here).
const num = v => {
  if (v === null || v === undefined || v === '') return null;
  const n = typeof v === 'number' ? v : Number(String(v).trim());
  if (!Number.isFinite(n) || (typeof v === 'string' && !String(v).trim())) return null;
  // An exact half (e.g. 2.40625) goes to the even digit, as Python's round() does.
  const scaled = n * 1e4, low = Math.floor(scaled);
  let r;
  if (scaled - low === 0.5 && (low + 0.5) / 1e4 === n) r = (low % 2 === 0 ? low : low + 1) / 1e4;
  else r = Number(n.toFixed(4));
  return r === 0 ? 0 : r;
};
const firstAuthor = ref => { const m = /^[A-Za-z][A-Za-z\-']+/.exec(String(ref || '').trim()); return ref && m ? m[0] : null; };
// Python's int(n) for the "n=" in a disambiguation, or the value itself.
const nText = n => (typeof n === 'number' ? `n=${Math.trunc(n)}` : `n=${n}`);

function sheetRows(ws) {
  const rows = [];
  const width = ws.columnCount;
  ws.eachRow({ includeEmpty: true }, (row, r) => {
    const vals = [];
    for (let c = 1; c <= width; c++) vals.push(cellValue(row.getCell(c).value));
    rows[r - 1] = vals;
  });
  for (let i = 0; i < rows.length; i++) if (!rows[i]) rows[i] = new Array(width).fill(null);
  return rows;
}

// One calculator panel (build.py extract_panel), with what was skipped and why.
function extractPanel(wb, p, report) {
  const ws = wb.getWorksheet(p.sheet);
  if (!ws) { report.errors.push(`The calculator spreadsheet has no "${p.sheet}" sheet.`); return { specialties: [], tests: [] }; }
  const [headers, ...rows] = sheetRows(ws);
  const need = ['Specialty', 'Symptom', 'Disease', 'Multi', 'SxDxNum', 'Pretest', 'LOE', 'Number', p.refCol, 'PMID', 'Setting_Demos', 'Comment', 'TestMultiName', 'MultiRange', 'SSLR', 'TestName', 'Sensitivity', 'Specificity', 'PositiveLR', 'NegativeLR'];
  const missingCols = need.filter(n => !headers.includes(n));
  if (missingCols.length) { report.errors.push(`"${p.sheet}" is missing column${missingCols.length === 1 ? '' : 's'} ${missingCols.join(', ')}.`); return { specialties: [], tests: [] }; }
  const col = name => headers.indexOf(name);
  const skipped = { noSpecialty: [], noName: [], noNumbers: [] };
  const warn = report.panelWarnings[p.key] = [];
  const binary = [];
  const multiGroups = new Map();
  rows.forEach((r, k) => {
    const rowNo = k + 2;
    let specialty = clean(r[col('Specialty')]);
    const symptom = clean(r[col('Symptom')]);
    const disease = clean(r[col('Disease')]);
    if (!specialty || !symptom || !disease) {
      if ((symptom || disease) && !specialty) skipped.noSpecialty.push(rowNo);
      return;
    }
    specialty = SPECIALTY_MAP[specialty] || specialty;
    const multi = r[col('Multi')];
    const rawNum = r[col('SxDxNum')];
    const sxdxNum = typeof rawNum === 'number' ? Math.trunc(rawNum) : null;
    const base = {
      pretest: num(r[col('Pretest')]),
      loe: clean(r[col('LOE')]),
      number: r[col('Number')],
      reference: clean(r[col(p.refCol)]),
      pmid: r[col('PMID')],
      setting: clean(r[col('Setting_Demos')]),
      comment: clean(r[col('Comment')])
    };
    if (multi === 1) {
      const name = clean(r[col('TestMultiName')]);
      if (!name) { skipped.noName.push(rowNo); return; }
      const key = JSON.stringify([specialty, symptom, disease, rawNum, name]);
      let g = multiGroups.get(key);
      if (!g) {
        g = { specialty, symptom, disease, name, sxdxNum, multi: 1, pretest: base.pretest, loe: base.loe, number: base.number, reference: base.reference, pmid: base.pmid, setting: base.setting, comment: base.comment, options: [], _row: rowNo };
        multiGroups.set(key, g);
      }
      const range = clean(r[col('MultiRange')]);
      const sslr = num(r[col('SSLR')]);
      if (range !== null && sslr !== null) g.options.push({ range, sslr });
      if (sslr !== null && sslr < 0) warn.push(`Row ${rowNo}: "${name}" has a negative likelihood ratio (${sslr}).`);
    } else {
      const name = clean(r[col('TestName')]);
      const sens = num(r[col('Sensitivity')]);
      const spec = num(r[col('Specificity')]);
      const plr = num(r[col('PositiveLR')]);
      const nlr = num(r[col('NegativeLR')]);
      if (!name) { skipped.noName.push(rowNo); return; }
      if ((sens === null || spec === null) && (plr === null || nlr === null)) { skipped.noNumbers.push(`${rowNo} (${name})`); return; }
      binary.push({ specialty, symptom, disease, name, sxdxNum, multi: 0, pretest: base.pretest, sens, spec, plr, nlr, loe: base.loe, number: base.number, reference: base.reference, pmid: base.pmid, setting: base.setting, comment: base.comment });
      // Numbers that look wrong.
      const where = `Row ${rowNo}: "${name}" (${symptom} → ${disease})`;
      // Sensitivity and specificity are percentages.
      for (const [v, label] of [[sens, 'sensitivity'], [spec, 'specificity']]) if (v !== null && (v < 0 || v > 100)) warn.push(`${where}: ${label} ${v} is not a percentage.`);
      // Both likelihood ratios on the same side of 1 contradict each other (a finding whose
      // presence lowers the probability has LR+ below 1 and LR- above 1, which is fine).
      if (plr !== null && nlr !== null && ((plr < 1 && nlr < 1) || (plr > 1 && nlr > 1))) warn.push(`${where}: positive (${plr}) and negative (${nlr}) likelihood ratios are both ${plr < 1 ? 'below' : 'above'} 1.`);
      if ((plr !== null && plr < 0) || (nlr !== null && nlr < 0)) warn.push(`${where}: a likelihood ratio is negative.`);
      if (sens !== null && spec !== null && plr !== null && spec < 100 && sens > 0) {
        const want = (sens / 100) / (1 - spec / 100);
        if (Math.abs(want - plr) / want > 0.25 && Math.abs(want - plr) > 0.3) warn.push(`${where}: positive likelihood ratio ${plr} does not match sensitivity and specificity (about ${Number(want.toPrecision(2))}).`);
      }
      if (base.pretest !== null && (base.pretest < 0 || base.pretest > 100)) warn.push(`${where}: pretest probability ${base.pretest} is not a percentage.`);
    }
    if (sxdxNum === null) warn.push(`Row ${rowNo}: no SxDxNum, so chapters cannot link to it.`);
  });
  const multiTests = [...multiGroups.values()].filter(g => {
    if (g.options.length >= 2) return true;
    skipped.noNumbers.push(`${g._row} (${g.name}: fewer than two ranges)`);
    return false;
  });
  multiTests.forEach(g => delete g._row);
  const all = [...binary, ...multiTests];
  const groups = new Map();
  for (const t of all) {
    const k = JSON.stringify([t.specialty, t.symptom, t.disease, t.name]);
    (groups.get(k) || groups.set(k, []).get(k)).push(t);
  }
  for (const group of groups.values()) {
    if (group.length <= 1) continue;
    for (const t of group) {
      const bits = [];
      const author = firstAuthor(t.reference);
      if (author) bits.push(author);
      if (t.number) bits.push(nText(t.number));
      t.disambig = bits.length ? bits.join(', ') : null;
    }
  }
  all.forEach((t, i) => { t.id = i; });
  if (skipped.noSpecialty.length) report.errors.push(`"${p.sheet}": ${skipped.noSpecialty.length} row${skipped.noSpecialty.length === 1 ? ' has' : 's have'} no specialty and would be left out (row${skipped.noSpecialty.length === 1 ? '' : 's'} ${skipped.noSpecialty.slice(0, 15).join(', ')}${skipped.noSpecialty.length > 15 ? ', ...' : ''}).`);
  if (skipped.noNumbers.length) report.notes.push(`"${p.sheet}": ${skipped.noNumbers.length} row${skipped.noNumbers.length === 1 ? '' : 's'} left out for lack of sensitivity and specificity or likelihood ratios: ${skipped.noNumbers.slice(0, 10).join('; ')}${skipped.noNumbers.length > 10 ? '; ...' : ''}.`);
  if (skipped.noName.length) report.notes.push(`"${p.sheet}": ${skipped.noName.length} row${skipped.noName.length === 1 ? '' : 's'} left out for lack of a test name (rows ${skipped.noName.slice(0, 15).join(', ')}${skipped.noName.length > 15 ? ', ...' : ''}).`);
  // Specialties that differ only in case or spacing are probably typos.
  const specialties = [...new Set(all.map(t => t.specialty))].sort(pyCompare);
  const norm = s => s.toLowerCase().replace(/[^a-z]/g, '');
  const seen = new Map();
  for (const s of specialties) { const n = norm(s); if (seen.has(n)) warn.push(`Specialties "${seen.get(n)}" and "${s}" look like the same one spelled two ways.`); else seen.set(n, s); }
  return { specialties, tests: all };
}
// Python's default string ordering (by code point).
const pyCompare = (a, b) => (a < b ? -1 : a > b ? 1 : 0);

const truthy = v => (typeof v === 'boolean' ? v : v === null || v === undefined ? false : ['true', '1', 'yes', 'y'].includes(String(v).trim().toLowerCase()));

// The differential diagnosis lists (build_differential.py build_items).
function extractDifferentials(wb, report) {
  const ws = wb.getWorksheet(DDX_SHEET);
  if (!ws) { report.errors.push(`The differential diagnosis spreadsheet has no "${DDX_SHEET}" sheet.`); return []; }
  const [head, ...rows] = sheetRows(ws);
  const header = head.map(c => (c === null ? '' : String(c).trim()));
  if (DDX_HEADER.some((h, i) => header[i] !== h)) { report.errors.push(`"${DDX_SHEET}" should start with the columns ${DDX_HEADER.join(', ')}.`); return []; }
  const items = new Map();
  rows.forEach((row, k) => {
    const i = k + 2;
    if (!row || row.every(c => c === null)) return;
    const [itemIdRaw, itemName, categoryRaw, aliases, rank, diagnosis, tierRaw, redFlag] = [...row, ...new Array(8).fill(null)].slice(0, 8);
    if (!itemIdRaw || !itemName || !diagnosis) { report.errors.push(`Differential row ${i}: missing ItemID, ItemName, or Diagnosis.`); return; }
    const itemId = String(itemIdRaw).trim();
    const category = String(categoryRaw || '').trim();
    const tier = String(tierRaw || '').trim();
    if (!VALID_CATEGORIES.has(category)) report.errors.push(`Differential row ${i} (${itemId}): Category "${category}" should be Symptom, Sign or Test Abnormality.`);
    if (!VALID_TIERS.has(tier)) report.errors.push(`Differential row ${i} (${itemId}): Tier "${tier}" should be one of ${[...VALID_TIERS].join(', ')}.`);
    let rankVal = Number(rank);
    if (rank === null || rank === '' || !Number.isFinite(rankVal)) { report.errors.push(`Differential row ${i} (${itemId}): Rank "${rank}" is not a number.`); rankVal = 999999; }
    if (!items.has(itemId)) {
      items.set(itemId, { id: itemId, name: String(itemName).trim(), category, aliases: aliases ? String(aliases).split(',').map(a => a.trim()).filter(Boolean) : [], ddx: [] });
    } else {
      const ex = items.get(itemId);
      if (ex.name !== String(itemName).trim()) report.errors.push(`Differential row ${i} (${itemId}): ItemName "${itemName}" does not match "${ex.name}" earlier for this ItemID.`);
      if (ex.category !== category) report.errors.push(`Differential row ${i} (${itemId}): Category "${category}" does not match "${ex.category}" earlier for this ItemID.`);
    }
    const entry = { dx: String(diagnosis).trim(), tier, _rank: rankVal };
    if (truthy(redFlag)) entry.redFlag = true;
    items.get(itemId).ddx.push(entry);
  });
  for (const item of items.values()) {
    item.ddx.sort((a, b) => a._rank - b._rank); // stable, as Python's sort is
    item.ddx.forEach(e => delete e._rank);
    if (item.ddx.length > 20) report.warnings.push(`Differential "${item.id}" has ${item.ddx.length} diagnoses (the cap is 20).`);
  }
  return [...items.values()];
}

async function loadWorkbook(buf) {
  const wb = new ExcelJS.Workbook();
  try {
    await wb.xlsx.load(buf);
  } catch (err) {
    throw new Error(`That file could not be read as an Excel workbook (.xlsx): ${String(err.message).split(" : ")[0].split(". ")[0]}.`);
  }
  return wb;
}

// calcBuf / ddxBuf: the spreadsheets (either may be null: that part is taken from `current`).
// Returns { data, report: { errors, warnings, notes, panelWarnings, counts } }.
async function build({ calcBuf, ddxBuf, current }) {
  const report = { errors: [], warnings: [], notes: [], panelWarnings: {}, counts: {} };
  const data = { panels: current ? current.panels : [], differentials: current ? current.differentials : [] };
  if (calcBuf) {
    const wb = await loadWorkbook(calcBuf);
    data.panels = PANELS.map(p => ({ key: p.key, label: p.label, itemLabel: p.itemLabel, ...extractPanel(wb, p, report) }));
  }
  if (ddxBuf) {
    const wb = await loadWorkbook(ddxBuf);
    data.differentials = extractDifferentials(wb, report);
  }
  for (const p of data.panels) report.counts[p.label] = `${p.tests.length} entries, ${p.specialties.length} specialties`;
  report.counts['Differential Diagnosis'] = `${data.differentials.length} items`;
  return { data, report };
}

// What changed from the current data: entries added, removed and changed in each panel.
function compare(before, after) {
  const out = [];
  const key = t => JSON.stringify([t.specialty, t.symptom, t.disease, t.name, t.reference || '', t.number || '']);
  const body = t => { const { id, ...rest } = t; return JSON.stringify(rest); };
  for (const p of after.panels) {
    const old = (before.panels || []).find(x => x.key === p.key) || { tests: [] };
    const a = new Map(old.tests.map(t => [key(t), t]));
    const b = new Map(p.tests.map(t => [key(t), t]));
    const added = [...b.keys()].filter(k => !a.has(k)).map(k => b.get(k));
    const removed = [...a.keys()].filter(k => !b.has(k)).map(k => a.get(k));
    const changed = [...b.keys()].filter(k => a.has(k) && body(a.get(k)) !== body(b.get(k))).map(k => b.get(k));
    const name = t => `${t.name} (${t.symptom} → ${t.disease}${t.disambig ? `; ${t.disambig}` : ''})`;
    out.push({ label: p.label, before: old.tests.length, after: p.tests.length, added: added.length, removed: removed.length, changed: changed.length, examples: { added: added.slice(0, 8).map(name), removed: removed.slice(0, 8).map(name), changed: changed.slice(0, 8).map(name) } });
  }
  const da = new Map((before.differentials || []).map(d => [d.id, JSON.stringify(d)]));
  const db = new Map(after.differentials.map(d => [d.id, JSON.stringify(d)]));
  out.push({
    label: 'Differential Diagnosis',
    before: da.size,
    after: db.size,
    added: [...db.keys()].filter(k => !da.has(k)).length,
    removed: [...da.keys()].filter(k => !db.has(k)).length,
    changed: [...db.keys()].filter(k => da.has(k) && da.get(k) !== db.get(k)).length,
    examples: { added: [...db.keys()].filter(k => !da.has(k)).slice(0, 8), removed: [...da.keys()].filter(k => !db.has(k)).slice(0, 8), changed: [...db.keys()].filter(k => da.has(k) && da.get(k) !== db.get(k)).slice(0, 8) }
  });
  return out;
}

module.exports = { build, compare, PANELS };

if (require.main === module) {
  (async () => {
    const [calc, ddx, out] = process.argv.slice(2);
    if (!calc || !ddx) { console.error('Usage: node calculator-build.js DiagnosticCalculatorApp.xlsx DifferentialDiagnosisData.xlsx [out.json]'); process.exit(1); }
    const { data, report } = await build({ calcBuf: fs.readFileSync(calc), ddxBuf: fs.readFileSync(ddx) });
    for (const [k, v] of Object.entries(report.counts)) console.log(`${k}: ${v}`);
    for (const e of report.errors) console.log(`ERROR: ${e}`);
    for (const w of [...report.warnings, ...Object.values(report.panelWarnings).flat()]) console.log(`Warning: ${w}`);
    for (const n of report.notes) console.log(`Note: ${n}`);
    if (out) { fs.writeFileSync(out, JSON.stringify(data)); console.log(`Wrote ${out}`); }
  })().catch(err => { console.error(err.message); process.exit(1); });
}
