// Each chapter's update plan (chapter_plan): the PubMed search terms used to find new
// evidence for it (blank = its title), the month it is updated, how often (years: 'every'
// year, or every other year in 'even' or 'odd' years), and the editor who reviews it.
//
// The editor and the frequency come from chapter-assignments.json (made from the editor
// assignment spreadsheet by import-chapter-assignments.js); a chapter not listed there is
// updated every other year and has no editor yet. Every chapter gets a month (and, if
// every other year, even or odd years) when first seen, choosing the slot with the fewest
// updates, then the fewest for that editor, so each month has about the same number of
// updates in every year and an editor's chapters are spread through the year.
const fs = require('fs');
const path = require('path');
const db = require('./db');
const store = require('./chapter-store');

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const YEARS = ['every', 'even', 'odd'];

if (!db.prepare("PRAGMA table_info('chapter_plan')").all().some(c => c.name === 'years')) {
  db.exec('ALTER TABLE chapter_plan ADD COLUMN years TEXT');
}

function assignments() {
  try {
    return JSON.parse(fs.readFileSync(path.join(__dirname, 'chapter-assignments.json'), 'utf8'));
  } catch {
    return {};
  }
}

// An editor named in the spreadsheet ("Brian Z. Rayala") is the editor account with that
// last name when there is one; otherwise the name itself is kept.
function editorFor(name) {
  if (!name) return null;
  const last = name.trim().split(/\s+/).pop().toLowerCase().replace(/[^a-z]/g, '');
  const user = db.prepare("SELECT username FROM users WHERE role = 'editor' AND (lower(username) = ? OR lower(display_name) = ?)").get(last, last);
  return user ? user.username : name.trim();
}

// Is the plan due in this month ('YYYY-MM')?
function isDue(p, ym) {
  if (!p || p.month !== Number(ym.slice(5, 7))) return false;
  const even = Number(ym.slice(0, 4)) % 2 === 0;
  return p.years === 'even' ? even : p.years === 'odd' ? !even : true;
}

// The next month ('YYYY-MM', this one included) the plan is due.
function nextDue(p, ym) {
  if (!p || !p.month) return null;
  let y = Number(ym.slice(0, 4));
  if (p.month < Number(ym.slice(5, 7))) y++;
  const want = p.years === 'even' ? 0 : p.years === 'odd' ? 1 : null;
  if (want !== null && y % 2 !== want) y++;
  return `${y}-${String(p.month).padStart(2, '0')}`;
}

function ensurePlans() {
  const all = assignments();
  const rows = db.prepare('SELECT * FROM chapter_plan').all();
  const have = new Set(rows.map(r => r.chapter_id));
  const missing = store.index().filter(c => !have.has(c.id)).map(c => c.id);
  const blank = rows.filter(r => !r.years);
  if (!missing.length && !blank.length) return;

  // Updates per month in even (0) and odd (1) years, overall and for each editor.
  const load = Array.from({ length: 13 }, () => [0, 0]);
  const edLoad = new Map();
  const ed = e => edLoad.get(e) || edLoad.set(e, Array.from({ length: 13 }, () => [0, 0])).get(e);
  const add = (month, years, editor) => {
    for (const p of [0, 1]) {
      if (years === 'every' || (years === 'even') === (p === 0)) {
        load[month][p]++;
        if (editor) ed(editor)[month][p]++;
      }
    }
  };
  for (const r of rows) if (r.years && r.month) add(r.month, r.years, r.editor);

  const now = new Date().toISOString();
  const insert = db.prepare('INSERT INTO chapter_plan (chapter_id, month, years, editor, updated_by, updated_at) VALUES (?, ?, ?, ?, ?, ?)');
  const fill = db.prepare('UPDATE chapter_plan SET month = ?, years = ?, editor = ? WHERE chapter_id = ?');
  // Annual chapters first (they count in every year), each editor's together.
  const todo = [
    ...blank.map(r => ({ id: r.chapter_id, month: r.month, editor: r.editor || editorFor((all[r.chapter_id] || {}).editor), annual: !!(all[r.chapter_id] || {}).annual, existing: true })),
    ...missing.map(id => ({ id, month: null, editor: editorFor((all[id] || {}).editor), annual: !!(all[id] || {}).annual, existing: false }))
  ].sort((a, b) => (b.annual - a.annual) || String(a.editor).localeCompare(String(b.editor)) || a.id.localeCompare(b.id));

  db.transaction(() => {
    for (const t of todo) {
      let best = null;
      for (let m = 1; m <= 12; m++) {
        if (t.month && m !== t.month) continue; // a chapter already planned keeps its month
        const choices = t.annual ? [['every', Math.max(...load[m])]] : [['even', load[m][0]], ['odd', load[m][1]]];
        for (const [years, n] of choices) {
          const e = t.editor ? ed(t.editor)[m] : [0, 0];
          const en = years === 'every' ? Math.max(...e) : e[years === 'even' ? 0 : 1];
          const score = n + 2 * en;
          if (!best || score < best.score) best = { month: m, years, score };
        }
      }
      add(best.month, best.years, t.editor);
      if (t.existing) fill.run(best.month, best.years, t.editor || null, t.id);
      else insert.run(t.id, best.month, best.years, t.editor || null, 'automatic', now);
    }
  })();
  console.log(`Chapter plans: ${missing.length} chapter(s) given an update month${blank.length ? `, ${blank.length} given a frequency` : ''}.`);
}

const plans = () => new Map(db.prepare('SELECT * FROM chapter_plan').all().map(r => [r.chapter_id, r]));
const plan = id => db.prepare('SELECT * FROM chapter_plan WHERE chapter_id = ?').get(id) || null;

function savePlan(id, { searchTerms, month, years, editor }, user) {
  db.prepare(`INSERT INTO chapter_plan (chapter_id, search_terms, month, years, editor, updated_by, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(chapter_id) DO UPDATE SET search_terms = excluded.search_terms, month = excluded.month, years = excluded.years,
      editor = excluded.editor, updated_by = excluded.updated_by, updated_at = excluded.updated_at`)
    .run(id, searchTerms || null, month || null, YEARS.includes(years) ? years : 'every', editor || null, user, new Date().toISOString());
}

// The editors who can be assigned chapters.
const editors = () => db.prepare("SELECT username, display_name FROM users WHERE role = 'editor' AND status = 'active' ORDER BY display_name")
  .all().map(u => ({ username: u.username, name: u.display_name || u.username }));

ensurePlans();

module.exports = { ensurePlans, plans, plan, savePlan, editors, isDue, nextDue, MONTHS, YEARS };
