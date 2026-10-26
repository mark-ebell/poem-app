// The Decision Tools tab: clinical decision rules and risk scores (from the former
// Essential Evidence Plus decision support tools). Each tool is a JSON file in
// decision-tools/, read when the server starts:
//
//   { id, eeId, title, subtitle, category, question,
//     inputs: [{ id, label, type: 'choice', note?, options: [{ label, points }] }],
//     score: { type: 'sum', label, max },
//     outcome, pretest: { default (%), source },
//     bands: [{ min, max, label, level (1 lowest risk .. 4), lr }],
//     evidence: { population, validation, prevalence, comment },
//     references: [{ citation, pmid }] }
//
// A band's probability is worked out on the page from its likelihood ratio and the
// pretest probability (the study's own, which the user can change for their setting).
// As with the calculators, the list is sent without the tools' contents, and opening a
// tool counts toward a reader's calculator look-ups.
const fs = require('fs');
const path = require('path');
const express = require('express');
const { requireAuth } = require('../auth');
const { quota } = require('../limits');

const router = express.Router();
router.use(requireAuth);

const DIR = path.join(__dirname, '..', 'decision-tools');
const tools = new Map();
try {
  for (const f of fs.readdirSync(DIR).filter(f => f.endsWith('.json'))) {
    try {
      const t = JSON.parse(fs.readFileSync(path.join(DIR, f), 'utf8'));
      tools.set(t.id, t);
    } catch (err) {
      console.warn(`Decision tool ${f} not loaded: ${err.message}`);
    }
  }
} catch (err) {
  console.warn(`Decision tools not loaded (${err.message}).`);
}
const list = [...tools.values()]
  .map(t => ({ id: t.id, title: t.title, subtitle: t.subtitle, category: t.category }))
  .sort((a, b) => a.title.localeCompare(b.title, undefined, { sensitivity: 'base' }));

router.get('/', (req, res) => res.json({ tools: list }));

router.get('/:id', quota('calc'), (req, res) => {
  const t = tools.get(String(req.params.id));
  if (!t) return res.status(404).json({ error: 'Tool not found.' });
  res.json({ tool: t });
});

module.exports = router;
