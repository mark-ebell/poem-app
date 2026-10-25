// Each chapter's update plan (chapter_plan): the PubMed search terms used to find new
// evidence for it (blank = its title), the month of the year it is updated, and the editor
// who reviews it. Every chapter gets a month when first seen, choosing the month with the
// fewest chapters, so the yearly updates are spread evenly (about 1/12 each month).
const db = require('./db');
const store = require('./chapter-store');

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

function ensurePlans() {
  const have = new Set(db.prepare('SELECT chapter_id FROM chapter_plan').all().map(r => r.chapter_id));
  const missing = store.index().filter(c => !have.has(c.id));
  if (!missing.length) return;
  const counts = Array(13).fill(0);
  for (const r of db.prepare('SELECT month, COUNT(*) AS n FROM chapter_plan WHERE month BETWEEN 1 AND 12 GROUP BY month').all()) counts[r.month] = r.n;
  const insert = db.prepare('INSERT INTO chapter_plan (chapter_id, month, updated_by, updated_at) VALUES (?, ?, ?, ?)');
  const now = new Date().toISOString();
  db.transaction(() => {
    for (const c of missing) {
      let month = 1;
      for (let m = 2; m <= 12; m++) if (counts[m] < counts[month]) month = m;
      counts[month]++;
      insert.run(c.id, month, 'automatic', now);
    }
  })();
  console.log(`Chapter plans: ${missing.length} chapter(s) given an update month.`);
}

const plans = () => new Map(db.prepare('SELECT * FROM chapter_plan').all().map(r => [r.chapter_id, r]));
const plan = id => db.prepare('SELECT * FROM chapter_plan WHERE chapter_id = ?').get(id) || null;

function savePlan(id, { searchTerms, month, editor }, user) {
  db.prepare(`INSERT INTO chapter_plan (chapter_id, search_terms, month, editor, updated_by, updated_at) VALUES (?, ?, ?, ?, ?, ?)
    ON CONFLICT(chapter_id) DO UPDATE SET search_terms = excluded.search_terms, month = excluded.month, editor = excluded.editor,
      updated_by = excluded.updated_by, updated_at = excluded.updated_at`)
    .run(id, searchTerms || null, month || null, editor || null, user, new Date().toISOString());
}

// The editors who can be assigned chapters.
const editors = () => db.prepare("SELECT username, display_name FROM users WHERE role = 'editor' AND status = 'active' ORDER BY display_name")
  .all().map(u => ({ username: u.username, name: u.display_name || u.username }));

ensurePlans();

module.exports = { ensurePlans, plans, plan, savePlan, editors, MONTHS };
