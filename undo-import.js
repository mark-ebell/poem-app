// Takes back a monthly Word import (Upload tab, Administrator panel). Run in Render's Shell:
//   npm run undo-import                 lists the imports (newest first)
//   npm run undo-import -- latest       removes the POEMs added by the newest import
//   npm run undo-import -- 2026-11-10T14:03:22.123Z   removes the import made at that time
// A POEM edited since the import is not removed unless --force is added. A copy of the
// database is saved to backups/ first. The POEMs' Daily InfoPOEM days and send records go too.
const path = require('path');
const fs = require('fs');
const db = require('./db');

// The POEMs of one import were all saved at the same moment (created_at) by the Word import.
function imports() {
  return db.prepare(`
    SELECT created_at, created_by, COUNT(*) AS n,
      MIN(publication_date) AS first_month, MAX(publication_date) AS last_month,
      SUM(updated_at <> created_at) AS edited
    FROM poems
    WHERE source = 'app' AND created_at IS NOT NULL
    GROUP BY created_at, created_by
    HAVING COUNT(*) > 1
    ORDER BY created_at DESC
  `).all();
}

async function main(args) {
  const list = imports();
  const which = args.find(a => !a.startsWith('--'));
  const force = args.includes('--force');
  if (!which) {
    if (!list.length) return console.log('No Word imports found.');
    console.log('Word imports, newest first (POEMs saved together):\n');
    for (const i of list) {
      const months = i.first_month === i.last_month ? i.first_month : `${i.first_month} to ${i.last_month}`;
      console.log(`  ${i.created_at}  ${String(i.n).padStart(3)} POEMs  ${months}  by ${i.created_by}${i.edited ? `  (${i.edited} edited since)` : ''}`);
    }
    console.log('\nTo remove one: npm run undo-import -- latest   (or the time shown)');
    return;
  }
  const target = which === 'latest' ? list[0] : list.find(i => i.created_at === which);
  if (!target) throw new Error(`No import found for "${which}". Run npm run undo-import to list them.`);

  const poems = db.prepare('SELECT id, poem_id, title, updated_at, created_at FROM poems WHERE source = ? AND created_at = ? AND created_by = ?')
    .all('app', target.created_at, target.created_by);
  const edited = poems.filter(p => p.updated_at !== p.created_at);
  if (edited.length && !force) {
    console.log(`${edited.length} of these POEMs ${edited.length === 1 ? 'was' : 'were'} edited after the import:`);
    edited.forEach(p => console.log(`  #${p.poem_id} ${p.title}`));
    console.log('Nothing was removed. Add --force to remove them anyway.');
    return;
  }

  const backupDir = path.join(db.dataDir, 'backups');
  fs.mkdirSync(backupDir, { recursive: true });
  const backup = path.join(backupDir, `poems-before-undo-import-${new Date().toISOString().replace(/[:.]/g, '-')}.db`);
  await db.backup(backup);

  const tables = new Set(db.prepare("SELECT name FROM sqlite_master WHERE type = 'table'").all().map(r => r.name));
  db.transaction(() => {
    for (const p of poems) {
      for (const t of ['daily_sends', 'daily_edition_sends']) if (tables.has(t)) db.prepare(`DELETE FROM ${t} WHERE poem_id = ?`).run(p.id);
      db.prepare('DELETE FROM poems WHERE id = ?').run(p.id);
    }
  })();
  console.log(`Removed ${poems.length} POEMs imported at ${target.created_at} (${target.first_month}).`);
  console.log(`Backup saved first: ${backup}`);
}

main(process.argv.slice(2)).then(() => process.exit(0), err => { console.error(err.message); process.exit(1); });
