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
const { requireFullAccess, requireEditor } = require('../auth');
const db = require('../db');
const editable = require('../decision-tools/editable');
const { quota } = require('../limits');
const { pointsOf } = require('../decision-tools/lib');

const router = express.Router();
router.use(requireFullAccess); // not for readers with the POEMs only

const DIR = path.join(__dirname, '..', 'decision-tools');
let eeEvidence = {};
try { eeEvidence = JSON.parse(fs.readFileSync(path.join(DIR, 'ee-evidence.json'), 'utf8')); } catch (err) { console.warn(`Risk score evidence not loaded (${err.message}).`); }

const codeTools = new Map(); // the modules in decision-tools/tools
const tools = new Map();     // what is shown: code tools, with editors' published versions in their place
for (const f of fs.readdirSync(path.join(DIR, 'tools')).filter(f => f.endsWith('.js'))) {
  try {
    const t = require(path.join(DIR, 'tools', f));
    const ee = eeEvidence[t.eeId] || {};
    t.categories = t.categories || ee.categories || ['Other'];
    t.evidence = { ...ee, ...(t.evidence || {}) };
    delete t.evidence.title; delete t.evidence.categories;
    if (codeTools.has(t.id)) throw new Error(`duplicate id ${t.id}`);
    codeTools.set(t.id, t);
  } catch (err) {
    console.warn(`Risk score ${f} not loaded: ${err.message}`);
  }
}
// Every EE+ category, with how many of its tools are available here so far (retired ones
// are not counted). A converted tool counts in the categories it is shown in, which may
// differ from EE+'s (e.g. SJS/TEN, moved to Skin).
let excluded = {};
try { excluded = JSON.parse(fs.readFileSync(path.join(DIR, 'excluded.json'), 'utf8')); } catch { /* none */ }
function buildCategories() {
  const total = new Map(), available = new Map();
  for (const [id, e] of Object.entries(eeEvidence)) {
    if (excluded[id] && excluded[id].decision === 'retired') continue;
    const live = [...tools.values()].find(t => String(t.eeId) === id);
    for (const c of (live ? live.categories : e.categories) || []) total.set(c, (total.get(c) || 0) + 1);
  }
  for (const t of tools.values()) for (const c of t.categories) available.set(c, (available.get(c) || 0) + 1);
  return [...new Set([...total.keys(), ...available.keys()])].sort((a, b) => a.localeCompare(b))
    .map(name => ({ name, available: available.get(name) || 0, total: Math.max(total.get(name) || 0, available.get(name) || 0) }));
}

// The tools shown: each code tool, or its published edit; and tools added by editors.
let list = [], categories = [];
function rebuild() {
  tools.clear();
  for (const [id, t] of codeTools) tools.set(id, t);
  for (const id of editable.editedIds()) {
    const spec = editable.published(id);
    if (spec === undefined) continue;          // only drafts so far
    const made = editable.toolFromSpec(spec, codeTools.get(id));
    if (made) tools.set(id, made); else tools.delete(id);
  }
  list = [...tools.values()]
    .map(t => ({ id: t.id, title: t.title, subtitle: t.subtitle || '', categories: t.categories }))
    .sort((a, b) => a.title.localeCompare(b.title, undefined, { sensitivity: 'base' }));
  categories = buildCategories();
}
rebuild();

// An editor's draft of a tool, as a working tool (null when there is none).
function draftTool(id) {
  const d = editable.draft(id);
  if (!d) return null;
  return editable.toolFromSpec(d.spec, codeTools.get(id));
}
// Whether each code tool can be edited as a point score (worked out once, when first asked).
const asPoints = new Map();
const pointsSpec = id => {
  if (!asPoints.has(id)) asPoints.set(id, editable.specFromTool(codeTools.get(id)));
  return asPoints.get(id);
};
const isEditor = req => req.session && req.session.role === 'editor';
// The tool a request means: an editor asking for ?draft=1 gets the draft.
const toolFor = req => {
  const id = String(req.params.id);
  return (req.query.draft === '1' && isEditor(req) && draftTool(id)) || tools.get(id);
};

// What the page needs to show a tool (not its formulas).
function publicTool(t) {
  const inputs = t.inputs.map(i => {
    const { ee, ...rest } = i;
    return rest;
  });
  return { id: t.id, title: t.title, subtitle: t.subtitle, question: t.question, inputs, points: t.points || null, evidence: t.evidence, categories: t.categories, footnote: t.footnote || null };
  // (functions such as `when` are dropped by JSON)
}

// The answers, checked against the tool's inputs. Returns { a, missing: [labels], problems: [messages] }.
// Lower-case a label for use mid-sentence, keeping abbreviations (HDL, BP, eGFR, NT-proBNP).
const lowerWords = label => label.replace(/\S+/g, w => (/^[A-Z][a-z]*$/.test(w) ? w.toLowerCase() : w));

function readAnswers(t, raw) {
  const a = {}, missing = [], problems = [], hidden = [];
  for (const i of t.inputs) {
    if (i.when && !i.when(a)) { if (i.id) hidden.push(i.id); continue; } // not asked on this path
    const v = raw ? raw[i.id] : undefined;
    if (i.type === 'choice') {
      const k = Number(v);
      const given = v !== undefined && v !== null && v !== '' && Number.isInteger(k) && k >= 0 && k < i.options.length;
      // An unanswered choice takes its default (its first option unless the tool says otherwise),
      // except a required one, which must be answered.
      if (given) a[i.id] = k;
      else if (i.required) missing.push(i.label);
      else a[i.id] = i.default || 0;
    } else if (i.type === 'check') {
      a[i.id] = v === true;
    } else if (i.type === 'date') {
      if (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v) && !isNaN(Date.parse(v))) a[i.id] = v;
      else missing.push(i.label);
    } else if (i.type === 'number') {
      const n = v === '' || v === null || v === undefined ? NaN : Number(v);
      if (isFinite(n)) {
        if ((i.min !== undefined && n < i.min) || (i.max !== undefined && n > i.max)) problems.push(`${i.label} must be between ${i.min} and ${i.max}${i.unit ? ` ${i.unit}` : ''}.`);
        else a[i.id] = n;
      } else if (i.default !== undefined) a[i.id] = i.default;
      else if (!i.optional) missing.push(i.label);
    }
  }
  return { a, missing, problems, hidden };
}

const joinList = xs => (xs.length === 1 ? xs[0] : `${xs.slice(0, -1).join(', ')} and ${xs[xs.length - 1]}`);

function score(t, raw) {
  const { a, missing, problems, hidden } = readAnswers(t, raw);
  const partial = t.points ? { value: pointsOf(t, a), max: t.points.max, label: t.points.label } : null;
  if (problems.length) return { problems, score: partial, hidden };
  if (missing.length) {
    const numbers = t.inputs.filter(i => (i.type === 'number' || i.type === 'date') && missing.includes(i.label)).length === missing.length;
    return { missing, wait: numbers ? `Enter ${joinList(missing.map(lowerWords))} to see the result.` : `Answer: ${missing[0]}`, score: partial, hidden };
  }
  const r = t.compute(a) || {};
  if (partial && !r.score) r.score = partial;
  r.hidden = hidden;
  return r;
}

router.get('/', (req, res) => {
  // Editors also see tools added here that are not published yet.
  let shown = list;
  if (isEditor(req)) {
    const drafts = editable.editedIds().filter(id => !tools.has(id) && editable.draft(id)).map(id => draftTool(id)).filter(Boolean)
      .map(t => ({ id: t.id, title: `${t.title} (draft)`, subtitle: t.subtitle || '', categories: t.categories, draftOnly: true }));
    shown = [...list, ...drafts];
  }
  res.json({ tools: shown, categories });
});

// ---------- Editing (editors only) ----------
const editorName = req => {
  const u = db.prepare('SELECT display_name FROM users WHERE id = ?').get(req.session.userId);
  return (u && u.display_name) || req.session.username;
};
const slug = title => String(title).toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'score';
const CATEGORY_NAMES = () => [...new Set([...categories.map(c => c.name)])];

// What the editor needs: the spec to edit (the draft, else the published edit, else the
// code tool turned into one), whether it can be edited as a point score, and its history.
router.get('/:id/edit', requireEditor, (req, res) => {
  const id = String(req.params.id);
  const code = codeTools.get(id);
  const d = editable.draft(id);
  const pub = editable.published(id);
  if (!code && !d && !pub) return res.status(404).json({ error: 'Risk score not found.' });
  let spec, source, reason = null;
  if (d) { spec = d.spec; source = 'draft'; }
  else if (pub) { spec = pub; source = 'published'; }
  else {
    const made = pointsSpec(id);
    if (made.spec) spec = JSON.parse(JSON.stringify(made.spec)); else { spec = editable.textSpecFromTool(code); reason = made.error; }
    source = 'code';
  }
  if (code && spec && spec.kind === 'text' && !reason) reason = pointsSpec(id).error || null;
  res.json({
    spec, source, reason,
    isCode: !!code, hasDraft: !!d, hasPublished: pub !== undefined && pub !== null,
    canPoints: !code || !!pointsSpec(id).spec || !!(pub && pub.kind === 'points'),
    history: editable.history(id), categories: CATEGORY_NAMES()
  });
});

// A blank point score to start from, with a new id from its title.
router.post('/', requireEditor, (req, res) => {
  const title = String((req.body && req.body.title) || '').trim();
  if (!title) return res.status(400).json({ error: 'Give the new score a title.' });
  let id = slug(title), k = 2;
  while (codeTools.has(id) || editable.editedIds().includes(id)) id = `${slug(title)}-${k++}`;
  const spec = editable.cleanSpec({ kind: 'points', title, categories: ['Other'], scoreLabel: 'Score', inputs: [], bands: [{ level: 1, headline: '', lines: [] }] }, id);
  editable.saveVersion(id, spec, 'draft', editorName(req));
  res.json({ id });
});

// Saves the draft. Body: { spec }.
router.put('/:id/draft', requireEditor, (req, res) => {
  const id = String(req.params.id);
  if (!codeTools.has(id) && !editable.editedIds().includes(id)) return res.status(404).json({ error: 'Risk score not found.' });
  const spec = editable.cleanSpec(req.body && req.body.spec, id);
  if (spec.kind === 'points' && codeTools.has(id) && !pointsSpec(id).spec && !(editable.published(id) && editable.published(id).kind === 'points')) {
    return res.status(400).json({ error: 'Only the words of this score can be edited here.' });
  }
  const { errors, warnings } = editable.checkSpec(spec);
  if (errors.length) return res.status(400).json({ error: errors.join(' '), errors, warnings });
  const d = editable.draft(id);
  if (d) db.prepare('UPDATE risk_tool_versions SET spec = ?, created_by = ?, created_at = ? WHERE id = ?').run(JSON.stringify(spec), editorName(req), new Date().toISOString(), d.id);
  else editable.saveVersion(id, spec, 'draft', editorName(req));
  res.json({ ok: true, warnings });
});

// Publishes the draft: everyone sees it from now on.
router.post('/:id/publish', requireEditor, (req, res) => {
  const id = String(req.params.id);
  const d = editable.draft(id);
  if (!d) return res.status(400).json({ error: 'There is no draft to publish.' });
  const { errors } = editable.checkSpec(d.spec);
  if (errors.length) return res.status(400).json({ error: errors.join(' ') });
  editable.saveVersion(id, d.spec, 'published', editorName(req));
  rebuild();
  res.json({ ok: true });
});

router.delete('/:id/draft', requireEditor, (req, res) => {
  editable.discardDraft(String(req.params.id));
  res.json({ ok: true });
});

// Back to the code version (a tool added here is removed). Earlier versions are kept.
router.post('/:id/revert', requireEditor, (req, res) => {
  const id = String(req.params.id);
  editable.discardDraft(id);
  if (editable.published(id) === undefined && !codeTools.has(id)) { return res.json({ ok: true }); }
  editable.saveVersion(id, null, 'published', editorName(req));
  rebuild();
  res.json({ ok: true, removed: !codeTools.has(id) });
});

router.get('/:id', quota('calc'), (req, res) => {
  const t = toolFor(req);
  if (!t) return res.status(404).json({ error: 'Risk score not found.' });
  const out = { tool: publicTool(t) };
  if (isEditor(req)) out.edit = { hasDraft: !!editable.draft(t.id), isDraft: req.query.draft === '1' && !!editable.draft(t.id), edited: !!t.edited };
  res.json(out);
});

router.post('/:id/score', (req, res) => {
  const t = toolFor(req);
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
