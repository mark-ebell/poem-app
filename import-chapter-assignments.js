// Reads the editor assignment spreadsheet (columns: Topic ID, Topic Title, Editor,
// Annual/ Biennial) into chapter-assignments.json, which chapter-plan.js uses to give each
// chapter its editor and whether it is updated every year or every other year:
//
//     npm run chapter-assignments -- "/path/to/Final 2025 editor assignments.xlsx"
//
// Then commit chapter-assignments.json. Chapters already planned keep their month; their
// editor and frequency are filled in only where they are still blank.
const path = require('path');
const fs = require('fs');
const ExcelJS = require('exceljs');

async function main(file) {
  if (!file) throw new Error('Give the spreadsheet: npm run chapter-assignments -- /path/to/file.xlsx');
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(file);
  const ws = wb.worksheets[0];
  const head = ws.getRow(1).values.map(v => String(v || '').toLowerCase());
  const col = re => head.findIndex(h => re.test(h));
  const cId = col(/topic id/), cEditor = col(/editor/), cFreq = col(/annual|biennial/);
  if (cId < 0 || cFreq < 0) throw new Error('Expected columns "Topic ID" and "Annual/ Biennial".');
  const out = {};
  ws.eachRow((row, i) => {
    if (i === 1) return;
    const num = Number(row.getCell(cId).value);
    if (!num) return;
    const freq = String(row.getCell(cFreq).value || '').trim().toLowerCase();
    let editor = cEditor > 0 ? String(row.getCell(cEditor).value || '').replace(/\s+/g, ' ').trim() : '';
    if (/^(tba|tbd)$/i.test(editor)) editor = '';
    out[`eee${String(num).padStart(4, '0')}`] = { editor: editor || null, annual: freq.startsWith('an') };
  });
  const target = path.join(__dirname, 'chapter-assignments.json');
  fs.writeFileSync(target, JSON.stringify(out, null, 1) + '\n');
  const n = Object.keys(out).length, annual = Object.values(out).filter(a => a.annual).length;
  console.log(`${n} chapters: ${annual} annual, ${n - annual} every other year. Written to ${target}`);
}

main(process.argv[2]).catch(err => { console.error(err.message); process.exit(1); });
