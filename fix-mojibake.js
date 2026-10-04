#!/usr/bin/env node
// Repairs text in the imported POEMs where UTF-8 characters were read as
// Windows-1252 (e.g. "â€™" instead of an apostrophe, "â€“" instead of a dash).
// Only rows that contain the telltale sequences are examined, and a repair is
// kept only if it decodes cleanly. Run before export-archive.js.
//
//   node fix-mojibake.js --dry-run    show what would change
//   node fix-mojibake.js              repair (a copy of the database is saved first)
const path = require('path');
const fs = require('fs');
const db = require('./db');

const dryRun = process.argv.includes('--dry-run');
const FIELDS = ['title', 'reference', 'clinical_question', 'synopsis', 'bottom_line'];

// Windows-1252 bytes 0x80-0x9F that are not the same code point in Latin-1.
const CP1252 = { '€': 0x80, '‚': 0x82, 'ƒ': 0x83, '„': 0x84, '…': 0x85, '†': 0x86, '‡': 0x87, 'ˆ': 0x88, '‰': 0x89,
  'Š': 0x8a, '‹': 0x8b, 'Œ': 0x8c, 'Ž': 0x8e, '‘': 0x91, '’': 0x92, '“': 0x93, '”': 0x94, '•': 0x95, '–': 0x96,
  '—': 0x97, '˜': 0x98, '™': 0x99, 'š': 0x9a, '›': 0x9b, 'œ': 0x9c, 'ž': 0x9e, 'Ÿ': 0x9f };

function repair(s) {
  if (!/[âÃÂ]/.test(s)) return s;
  const bytes = [];
  for (const ch of s) {
    const code = ch.codePointAt(0);
    if (code < 256) bytes.push(code);
    else if (CP1252[ch] !== undefined) bytes.push(CP1252[ch]);
    else return s; // contains a real non-Latin character: leave alone
  }
  const fixed = Buffer.from(bytes).toString('utf8');
  return fixed.includes('�') ? s : fixed;
}

const rows = db.prepare(`SELECT id, ${FIELDS.join(', ')} FROM poems`).all();
const changes = [];
for (const r of rows) {
  const upd = {};
  for (const f of FIELDS) {
    const fixed = r[f] ? repair(r[f]) : r[f];
    if (fixed !== r[f]) upd[f] = fixed;
  }
  if (Object.keys(upd).length) changes.push({ id: r.id, before: r, upd });
}

console.log(`${changes.length} POEM(s) with repairable text.`);
for (const c of changes.slice(0, 5)) {
  const f = Object.keys(c.upd)[0];
  console.log(`  ${f}: ${c.before[f].slice(0, 90)}\n     -> ${c.upd[f].slice(0, 90)}`);
}

if (!dryRun && changes.length) {
  const backupDir = path.join(db.dataDir, 'backups');
  fs.mkdirSync(backupDir, { recursive: true });
  db.backup(path.join(backupDir, `poems-before-mojibake-fix-${new Date().toISOString().replace(/[:.]/g, '-')}.db`)).then(() => {
    db.transaction(() => {
      for (const c of changes) {
        const cols = Object.keys(c.upd);
        db.prepare(`UPDATE poems SET ${cols.map(k => `${k} = @${k}`).join(', ')} WHERE id = @id`).run({ ...c.upd, id: c.id });
      }
    })();
    console.log('Repaired.');
  });
}
