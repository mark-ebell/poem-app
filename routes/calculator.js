// The Diagnostic Tests, Signs and Symptoms and Differential Diagnosis tabs (the
// Bayesian diagnostic calculator from the Diagnostic App project). Their data,
// calculator-data.json, is written by that project's build/build.py from its
// spreadsheets.
//
// To keep the data from being copied wholesale, the page never receives all of
// it: the menus are fetched one level at a time, and an entry's numbers and
// source only when someone picks it, which counts toward a reader's usage limits.
const path = require('path');
const fs = require('fs');
const express = require('express');
const { requireAuth } = require('../auth');
const { quota } = require('../limits');

const router = express.Router();
router.use(requireAuth);

const DATA_FILE = path.join(__dirname, '..', 'calculator-data.json');
let data = { panels: [], differentials: [] };
try {
  data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
} catch (err) {
  console.warn(`Calculator data not loaded (${err.message}); the calculator tabs will be empty.`);
}
const panels = new Map(data.panels.map(p => [p.key, p]));

function panelFor(req, res) {
  const panel = panels.get(req.params.panel);
  if (!panel) res.status(404).json({ error: 'Not found.' });
  return panel;
}

const byText = (a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' });

// Differential Diagnosis: the list of signs, symptoms and test abnormalities...
router.get('/differential', (req, res) => {
  res.json({ items: data.differentials.map(d => ({ id: d.id, name: d.name, category: d.category, aliases: d.aliases || [] })) });
});

// ...and one item's ranked differential.
router.get('/differential/:id', quota('calc'), (req, res) => {
  const item = data.differentials.find(d => d.id === req.params.id);
  if (!item) return res.status(404).json({ error: 'Not found.' });
  res.json({ item });
});

// Where an SxDxNum is (for links from textbook chapters): its specialty and symptom /
// disease pair. A number used for more than one pair gives the pair with the most entries.
router.get('/:panel/number/:num', (req, res) => {
  const panel = panelFor(req, res);
  if (!panel) return;
  const num = Number(req.params.num);
  const counts = new Map();
  for (const t of panel.tests) {
    if (t.sxdxNum !== num) continue;
    const k = JSON.stringify([t.specialty, t.symptom, t.disease]);
    counts.set(k, (counts.get(k) || 0) + 1);
  }
  if (!counts.size) return res.status(404).json({ error: 'That calculator entry was not found.' });
  const [specialty, symptom, disease] = JSON.parse([...counts].sort((a, b) => b[1] - a[1])[0][0]);
  res.json({ specialty, symptom, disease });
});

// Summary data for an SxDxNum (Decision support in a chapter): every test or finding
// for that presentation with its likelihood ratios, sensitivity and specificity, or for a
// multi-level one its result levels. Counts as one calculator look-up for a reader.
router.get('/:panel/number/:num/summary', quota('calc'), (req, res) => {
  const panel = panelFor(req, res);
  if (!panel) return;
  const num = Number(req.params.num);
  const tests = panel.tests.filter(t => t.sxdxNum === num);
  if (!tests.length) return res.status(404).json({ error: 'That calculator entry was not found.' });
  const counts = new Map();
  for (const t of tests) {
    const k = JSON.stringify([t.specialty, t.symptom, t.disease]);
    counts.set(k, (counts.get(k) || 0) + 1);
  }
  const [specialty, symptom, disease] = JSON.parse([...counts].sort((a, b) => b[1] - a[1])[0][0]);
  const lr = (given, value) => (given !== null && given !== undefined ? given : (Number.isFinite(value) ? value : null));
  const rows = tests.map(t => {
    if (t.multi === 1) return { name: t.name, disambig: t.disambig || null, multi: 1, options: t.options };
    const sens = t.sens === null || t.sens === undefined ? null : t.sens / 100;
    const spec = t.spec === null || t.spec === undefined ? null : t.spec / 100;
    return {
      name: t.name, disambig: t.disambig || null, multi: 0, sens: t.sens ?? null, spec: t.spec ?? null,
      plr: lr(t.plr, sens !== null && spec !== null && spec < 1 ? sens / (1 - spec) : NaN),
      nlr: lr(t.nlr, sens !== null && spec !== null && spec > 0 ? (1 - sens) / spec : NaN)
    };
  }).sort((a, b) => byText(a.name, b.name));
  res.json({ specialty, symptom, disease, itemLabel: panel.itemLabel, tests: rows });
});

// The two calculator panels and their specialties.
router.get('/panels', (req, res) => {
  res.json({ panels: data.panels.map(p => ({ key: p.key, label: p.label, itemLabel: p.itemLabel, specialties: p.specialties })) });
});

// Step 2 menu: the symptom / disease pairs in a specialty.
router.get('/:panel/pairs', (req, res) => {
  const panel = panelFor(req, res);
  if (!panel) return;
  const specialty = String(req.query.specialty || '');
  const seen = new Map();
  for (const t of panel.tests) {
    if (t.specialty !== specialty) continue;
    const key = `${t.symptom}|||${t.disease}`;
    if (!seen.has(key)) seen.set(key, { symptom: t.symptom, disease: t.disease });
  }
  const pairs = [...seen.values()].sort((a, b) => byText(a.symptom + a.disease, b.symptom + b.disease));
  res.json({ pairs });
});

// Step 3 menu: the tests (or findings) for a specialty and symptom / disease pair.
router.get('/:panel/items', (req, res) => {
  const panel = panelFor(req, res);
  if (!panel) return;
  const { specialty, symptom, disease } = req.query;
  const items = panel.tests
    .filter(t => t.specialty === specialty && t.symptom === symptom && t.disease === disease)
    .map(t => ({ id: t.id, name: t.name, disambig: t.disambig || null, multi: t.multi }))
    .sort((a, b) => byText(a.name, b.name));
  res.json({ items });
});

// One entry, with its numbers and source.
router.get('/:panel/items/:id', quota('calc'), (req, res) => {
  const panel = panelFor(req, res);
  if (!panel) return;
  const test = panel.tests[Number(req.params.id)];
  if (!test || String(test.id) !== String(req.params.id)) return res.status(404).json({ error: 'Not found.' });
  res.json({ test });
});

module.exports = router;
