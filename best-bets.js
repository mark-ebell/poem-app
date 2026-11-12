// Best bets: results the editors choose for a search, which are then shown first for it,
// before the other results: seeded ones in their set order, then those editors add, by score. They apply when the search is the same words (in any case and spacing), or a MeSH
// synonym of them (best bets for "heart attack" also apply to "myocardial infarction").
// Editors set them with the star beside each result on the Search tab (routes/site-search.js).
//
// best-bets-seed.json holds the first set, from the editor's review of 40 searches in
// November 2026: the results marked "should be higher", and the chapters whose title is the
// search that were not marked down ("Chest pain (evaluation)" for chest pain, so that it stays
// first). It is loaded once into the database.
const fs = require('fs');
const path = require('path');
const db = require('./db');
const { meshGroup } = require('./search');

const KINDS = ['chapters', 'tools', 'tests', 'signs'];
const normTerm = q => String(q || '').replace(/[“”"]/g, '').replace(/\s+/g, ' ').trim().toLowerCase();

let cache = null; // term -> { kind -> Map(item_key -> position or null) }
function all() {
  if (!cache) {
    cache = new Map();
    for (const r of db.prepare('SELECT term, kind, item_key, position FROM best_bets').all()) {
      if (!cache.has(r.term)) cache.set(r.term, Object.fromEntries(KINDS.map(k => [k, new Map()])));
      if (cache.get(r.term)[r.kind]) cache.get(r.term)[r.kind].set(r.item_key, r.position);
    }
  }
  return cache;
}

// The best bets for a search: { kind -> Map(item_key -> position or null) } (empty when none).
function betsFor(query) {
  const out = Object.fromEntries(KINDS.map(k => [k, new Map()]));
  const term = normTerm(query);
  if (!term) return out;
  const group = meshGroup(term);
  for (const [t, kinds] of all()) {
    if (t !== term && !(group && meshGroup(t) === group)) continue;
    for (const k of KINDS) kinds[k].forEach((pos, key) => { if (!out[k].has(key) || out[k].get(key) == null) out[k].set(key, pos); });
  }
  return out;
}

// Puts the best bets first in a list sorted best first (each gets bestBet: true): those with
// a position in its order, then the others in the list's order; the rest follow.
function promote(list, kind, bets, keyOf) {
  const chosen = bets[kind];
  if (!chosen || !chosen.size) return list;
  const first = [], rest = [];
  list.forEach((x, i) => (chosen.has(keyOf(x)) ? first.push([x, chosen.get(keyOf(x)), i]) : rest.push(x)));
  first.sort((a, b) => (a[1] ?? Infinity) - (b[1] ?? Infinity) || a[2] - b[2]);
  return [...first.map(([x]) => ({ ...x, bestBet: true })), ...rest];
}

function setBet({ query, kind, key, title, on, by }) {
  const term = normTerm(query);
  if (!term || !KINDS.includes(kind) || !key) throw new Error('A search, a kind of result and the result are needed.');
  if (on) {
    db.prepare('INSERT OR IGNORE INTO best_bets (term, kind, item_key, title, created_by, created_at) VALUES (?, ?, ?, ?, ?, ?)')
      .run(term, kind, String(key), title ? String(title).slice(0, 300) : null, by || null, new Date().toISOString());
  } else {
    db.prepare('DELETE FROM best_bets WHERE term = ? AND kind = ? AND item_key = ?').run(term, kind, String(key));
  }
  cache = null;
}

// Loads best-bets-seed.json once (recorded in best_bet_seeds).
function loadSeed(file = path.join(__dirname, 'best-bets-seed.json'), name = 'review-2026-11') {
  if (db.prepare('SELECT 1 FROM best_bet_seeds WHERE name = ?').get(name)) return 0;
  let seed;
  try { seed = JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return 0; }
  const insert = db.prepare('INSERT OR IGNORE INTO best_bets (term, kind, item_key, title, position, created_by, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)');
  const now = new Date().toISOString();
  let n = 0;
  db.transaction(() => {
    for (const b of seed.bets || []) if (KINDS.includes(b.kind)) n += insert.run(normTerm(b.term), b.kind, String(b.key), b.title || null, Number.isInteger(b.position) ? b.position : null, seed.by || 'review', now).changes;
    db.prepare('INSERT INTO best_bet_seeds (name, applied_at) VALUES (?, ?)').run(name, now);
  })();
  cache = null;
  return n;
}

const list = () => db.prepare('SELECT term, kind, item_key AS key, title, position, created_by AS createdBy, created_at AS createdAt FROM best_bets ORDER BY term, kind, position IS NULL, position, title').all();

module.exports = { KINDS, normTerm, betsFor, promote, setBet, loadSeed, list };

// npm run best-bets [-- list]
if (require.main === module) {
  const added = loadSeed();
  if (added) console.log(`Loaded ${added} best bets from best-bets-seed.json.`);
  const rows = list();
  let term = null;
  for (const r of rows) {
    if (r.term !== term) { term = r.term; console.log(`\n${term}`); }
    console.log(`  ${r.kind.padEnd(8)} ${r.title || r.key}`);
  }
  console.log(`\n${rows.length} best bets.`);
}
