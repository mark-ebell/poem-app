// The Risk Scores tab: clinical decision rules and risk scores (from the former Essential
// Evidence Plus decision support tools). Each is a module in decision-tools/tools/ (the
// format is described in decision-tools/lib.js); its evidence (reference, population,
// validation) comes from decision-tools/ee-evidence.json unless the module overrides it.
//
// The page gets a tool's questions, and sends the answers here to be scored, so the
// formulas stay on the server. As with the calculators, the list is sent without the
// tools' contents, and opening a tool counts toward a reader's calculator look-ups.
const fs = require('fs');
const path = require('path');
const express = require('express');
const { requireAuth } = require('../auth');
const { quota } = require('../limits');
const { pointsOf } = require('../decision-tools/lib');

const router = express.Router();
router.use(requireAuth);

const DIR = path.join(__dirname, '..', 'decision-tools');
let eeEvidence = {};
try { eeEvidence = JSON.parse(fs.readFileSync(path.join(DIR, 'ee-evidence.json'), 'utf8')); } catch (err) { console.warn(`Risk score evidence not loaded (${err.message}).`); }

const tools = new Map();
for (const f of fs.readdirSync(path.join(DIR, 'tools')).filter(f => f.endsWith('.js'))) {
  try {
    const t = require(path.join(DIR, 'tools', f));
    const ee = eeEvidence[t.eeId] || {};
    t.categories = t.categories || ee.categories || ['Other'];
    t.evidence = { ...ee, ...(t.evidence || {}) };
    delete t.evidence.title; delete t.evidence.categories;
    if (tools.has(t.id)) throw new Error(`duplicate id ${t.id}`);
    tools.set(t.id, t);
  } catch (err) {
    console.warn(`Risk score ${f} not loaded: ${err.message}`);
  }
}
// Every EE+ category, with how many of its tools are available here so far (retired ones
// are not counted).
let excluded = {};
try { excluded = JSON.parse(fs.readFileSync(path.join(DIR, 'excluded.json'), 'utf8')); } catch { /* none */ }
const categories = (() => {
  const total = new Map(), available = new Map();
  for (const [id, e] of Object.entries(eeEvidence)) {
    if (excluded[id] && excluded[id].decision === 'retired') continue;
    for (const c of e.categories || []) total.set(c, (total.get(c) || 0) + 1);
  }
  for (const t of tools.values()) for (const c of t.categories) available.set(c, (available.get(c) || 0) + 1);
  return [...new Set([...total.keys(), ...available.keys()])].sort((a, b) => a.localeCompare(b))
    .map(name => ({ name, available: available.get(name) || 0, total: Math.max(total.get(name) || 0, available.get(name) || 0) }));
})();

const list = [...tools.values()]
  .map(t => ({ id: t.id, title: t.title, subtitle: t.subtitle || '', categories: t.categories }))
  .sort((a, b) => a.title.localeCompare(b.title, undefined, { sensitivity: 'base' }));

// What the page needs to show a tool (not its formulas).
function publicTool(t) {
  const inputs = t.inputs.map(i => {
    const { ee, ...rest } = i;
    return rest;
  });
  return { id: t.id, title: t.title, subtitle: t.subtitle, question: t.question, inputs, points: t.points || null, evidence: t.evidence, categories: t.categories, footnote: t.footnote || null };
}

// The answers, checked against the tool's inputs. Returns { a, missing: [labels], problems: [messages] }.
function readAnswers(t, raw) {
  const a = {}, missing = [], problems = [];
  for (const i of t.inputs) {
    const v = raw ? raw[i.id] : undefined;
    if (i.type === 'choice') {
      const k = Number(v);
      // An unanswered choice takes its default (its first option unless the tool says otherwise).
      a[i.id] = v !== undefined && v !== null && v !== '' && Number.isInteger(k) && k >= 0 && k < i.options.length ? k : (i.default || 0);
    } else if (i.type === 'check') {
      a[i.id] = v === true;
    } else if (i.type === 'number') {
      const n = v === '' || v === null || v === undefined ? NaN : Number(v);
      if (isFinite(n)) {
        if ((i.min !== undefined && n < i.min) || (i.max !== undefined && n > i.max)) problems.push(`${i.label} must be between ${i.min} and ${i.max}${i.unit ? ` ${i.unit}` : ''}.`);
        else a[i.id] = n;
      } else if (i.default !== undefined) a[i.id] = i.default;
      else if (!i.optional) missing.push(i.label);
    }
  }
  return { a, missing, problems };
}

function score(t, raw) {
  const { a, missing, problems } = readAnswers(t, raw);
  const partial = t.points ? { value: pointsOf(t, a), max: t.points.max, label: t.points.label } : null;
  if (problems.length) return { problems, score: partial };
  if (missing.length) return { missing, score: partial };
  const r = t.compute(a) || {};
  if (partial && !r.score) r.score = partial;
  return r;
}

router.get('/', (req, res) => res.json({ tools: list, categories }));

router.get('/:id', quota('calc'), (req, res) => {
  const t = tools.get(String(req.params.id));
  if (!t) return res.status(404).json({ error: 'Risk score not found.' });
  res.json({ tool: publicTool(t) });
});

router.post('/:id/score', (req, res) => {
  const t = tools.get(String(req.params.id));
  if (!t) return res.status(404).json({ error: 'Risk score not found.' });
  try {
    res.json({ result: score(t, (req.body && req.body.answers) || {}) });
  } catch (err) {
    console.error(`Risk score ${t.id} failed`, err);
    res.status(500).json({ error: 'This score could not be worked out.' });
  }
});

module.exports = router;
module.exports.tools = tools;
module.exports.score = score;
