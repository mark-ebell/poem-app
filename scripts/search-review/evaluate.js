// Checks the Search tab's ranking against an editor's review (round1.json): for each result
// the editor marked, whether it now moves the way they asked, and how many unmarked top
// results stay in the top (10 chapters, 5 of the others). Run after changing the weights in
// routes/site-search.js:   node scripts/search-review/evaluate.js [round1.json] [--lists]
process.env.NODE_ENV = 'test'; // no background chapter warm-up
const fs = require('fs');
const path = require('path');
const { compileQuery } = require('../../search');
const site = require('../../routes/site-search');

const file = process.argv.slice(2).find(a => !a.startsWith('--')) || path.join(__dirname, 'round1.json');
const showLists = process.argv.includes('--lists');
const review = JSON.parse(fs.readFileSync(file, 'utf8'));
const safe = k => k.replace(/[^A-Za-z0-9_-]/g, '_').slice(0, 120);
const SKIP = new Set(['more harms than']); // a test of a phrase, not of relevance (editor's request)

const tally = {};
for (const s of review.searches) {
  if (SKIP.has(s.q)) continue;
  const q = compileQuery(s.q, true);
  const pairKey = (c, p) => safe(c + JSON.stringify([p.specialty, p.symptom, p.disease]));
  const now = {
    chapters: site.searchChapters(q, s.q).map(c => ({ k: safe('c' + c.id), t: c.title })),
    risk: site.searchTools(q, s.q).map(t => ({ k: safe('t' + t.id), t: t.title })),
    tests: site.searchCalculator('diagnosticTests', q, s.q).map(p => ({ k: pairKey('d', p), t: `${p.symptom} → ${p.disease}` })),
    hp: site.searchCalculator('signsSymptoms', q, s.q).map(p => ({ k: pairKey('s', p), t: `${p.symptom} → ${p.disease}` }))
  };
  for (const kind of Object.keys(now)) {
    const top = kind === 'chapters' ? 10 : 5;
    const rank = new Map(now[kind].map((x, j) => [x.k, j + 1]));
    const T = tally[kind] || (tally[kind] = { up: 0, upN: 0, down: 0, downN: 0, kept: 0, keptN: 0 });
    s.shown[kind].forEach(({ key }, j) => {
      const m = s.marks[key] && s.marks[key].kind === kind ? s.marks[key].m : null;
      const r = rank.get(key) || Infinity;
      if (m === 'high') { T.upN++; if (r < j + 1) T.up++; }
      else if (m === 'low' || m === 'out') { T.downN++; if (r > j + 1) T.down++; }
      else if (j < top) { T.keptN++; if (r <= top) T.kept++; }
    });
    if (showLists && kind === 'chapters') {
      const was = new Map(s.shown.chapters.map((x, j) => [x.key, j + 1]));
      console.log(`\n${s.q}`);
      now.chapters.slice(0, 10).forEach((x, j) => {
        const m = s.marks[x.k] ? ` [${s.marks[x.k].m}]` : '';
        console.log(`  ${j + 1}. ${x.t} (${was.has(x.k) ? 'was ' + was.get(x.k) : 'new'})${m}`);
      });
    }
  }
}
console.log('');
for (const [kind, T] of Object.entries(tally)) {
  console.log(`${kind.padEnd(9)} marked higher, now higher: ${T.up}/${T.upN}   marked lower, now lower: ${T.down}/${T.downN}   unmarked top results kept: ${T.kept}/${T.keptN}`);
}
