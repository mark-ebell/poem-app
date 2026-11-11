// Risk scores editors can change in the Risk Scores tab, without code.
//
// Two kinds of spec, kept in the database (risk_tool_versions, every version kept):
//
//   Point scores ({ kind: 'points' }): the score is the sum of the points of the chosen
//   options and checked items, and the result depends only on that sum, through bands:
//     { kind: 'points', id, title, subtitle, question, categories: [..], footnote,
//       inputs: [{ id, type: 'choice', label, note?, options: [{ label, points }] }
//                | { id, type: 'check', label, note?, points }
//                | { type: 'heading', label } | { type: 'text', text }],
//       scoreLabel,                      // e.g. "ABC score"
//       bands: [{ max?, level?, headline?, lines: [string | { label, value }], note?, row? }],
//       table: { head: [..], rows: [[..]] } | null,   // a band's `row` is its row in the table
//       evidence: { reference, pmid, population, validation, prevalence, developed, validated, comment } }
//     Bands are in increasing order of score; each covers scores up to its `max` (the
//     last one has none). A new point score is added this way, and any existing tool whose
//     result depends only on its points (171 of them) can be turned into one exactly
//     (specFromTool), so editors can change it.
//
//   Text only ({ kind: 'text' }): for the tools with formulas (logistic models, numbers,
//   branching), only the words: title, subtitle, question, footnote, evidence. The tool's
//   code still works out the result.
//
// A version is a draft (seen by editors only, who can try it in the Risk Scores tab) or
// published (seen by everyone, replacing the tool's code version). A published version
// with no spec takes the tool back to its code version (or removes a tool added here).
const db = require('../db');
const { pointsOf, band } = require('./lib');

db.exec(`
  CREATE TABLE IF NOT EXISTS risk_tool_versions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tool_id TEXT NOT NULL,
    spec TEXT,                  -- JSON, or NULL: back to the code version / removed
    state TEXT NOT NULL,        -- 'draft' or 'published'
    created_by TEXT NOT NULL,
    created_at TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_risk_tool_versions ON risk_tool_versions(tool_id, id);
`);

const EVIDENCE_FIELDS = ['reference', 'pmid', 'population', 'validation', 'prevalence', 'developed', 'validated', 'comment'];
const TEXT_FIELDS = ['title', 'subtitle', 'question', 'footnote'];

// ---------- Versions ----------
function latest(toolId, state) {
  const row = db.prepare(`SELECT * FROM risk_tool_versions WHERE tool_id = ? ${state ? 'AND state = ?' : ''} ORDER BY id DESC LIMIT 1`)
    .get(...(state ? [toolId, state] : [toolId]));
  return row ? { ...row, spec: row.spec ? JSON.parse(row.spec) : null } : null;
}
// The published spec, or undefined when the tool has never been edited (null = reverted).
function published(toolId) {
  const p = latest(toolId, 'published');
  return p ? p.spec : undefined;
}
// The draft in progress: the newest version, when it is a draft.
function draft(toolId) {
  const v = latest(toolId);
  return v && v.state === 'draft' ? v : null;
}
function saveVersion(toolId, spec, state, user) {
  db.prepare('INSERT INTO risk_tool_versions (tool_id, spec, state, created_by, created_at) VALUES (?, ?, ?, ?, ?)')
    .run(toolId, spec ? JSON.stringify(spec) : null, state, user, new Date().toISOString());
}
function discardDraft(toolId) {
  const d = draft(toolId);
  if (d) db.prepare('DELETE FROM risk_tool_versions WHERE id = ?').run(d.id);
}
// Every edited tool id, with its published spec (possibly null) and whether it has a draft.
function editedIds() {
  return db.prepare('SELECT DISTINCT tool_id FROM risk_tool_versions').all().map(r => r.tool_id);
}
function history(toolId) {
  return db.prepare('SELECT id, state, created_by, created_at, spec IS NULL AS reverted FROM risk_tool_versions WHERE tool_id = ? ORDER BY id DESC').all(toolId);
}

// ---------- Specs ----------
const scoringInputs = inputs => inputs.filter(i => i.type === 'choice' || i.type === 'check');

// The highest and lowest possible totals.
function range(inputs) {
  let lo = 0, hi = 0;
  for (const i of scoringInputs(inputs)) {
    const pts = i.type === 'check' ? [0, i.points || 0] : i.options.map(o => o.points || 0);
    lo += Math.min(...pts); hi += Math.max(...pts);
  }
  return { lo, hi };
}

// Problems that stop a spec being saved (errors) or are worth a look (warnings).
function checkSpec(spec) {
  const errors = [], warnings = [];
  if (!spec || !['points', 'text'].includes(spec.kind)) return { errors: ['Unknown kind of risk score.'], warnings };
  if (!String(spec.title || '').trim()) errors.push('The score needs a title.');
  if (spec.kind === 'text') return { errors, warnings };
  const inputs = Array.isArray(spec.inputs) ? spec.inputs : [];
  const ids = new Set();
  for (const i of inputs) {
    if (!['choice', 'check', 'heading', 'text'].includes(i.type)) { errors.push(`Unknown item type ${i.type}.`); continue; }
    if (i.type === 'heading' || i.type === 'text') continue;
    if (!i.id || ids.has(i.id)) errors.push(`Item "${i.label}" needs a unique id.`);
    ids.add(i.id);
    if (!String(i.label || '').trim()) errors.push('Every item needs a label.');
    if (i.type === 'choice') {
      if (!Array.isArray(i.options) || i.options.length < 2) errors.push(`"${i.label}" needs at least two options.`);
      else for (const o of i.options) {
        if (!String(o.label || '').trim()) errors.push(`An option of "${i.label}" has no label.`);
        if (!Number.isFinite(Number(o.points))) errors.push(`An option of "${i.label}" has no points.`);
      }
    } else if (!Number.isFinite(Number(i.points))) errors.push(`"${i.label}" has no points.`);
  }
  if (!scoringInputs(inputs).length) errors.push('Add at least one item that scores points.');
  const bands = Array.isArray(spec.bands) ? spec.bands : [];
  if (!bands.length) errors.push('Add at least one result band.');
  let prev = -Infinity;
  bands.forEach((b, k) => {
    const last = k === bands.length - 1;
    if (!last && !Number.isFinite(Number(b.max))) errors.push(`Result band ${k + 1} needs the highest score it covers.`);
    if (!last && Number(b.max) <= prev) errors.push(`Result band ${k + 1} must cover higher scores than the band before it.`);
    if (!last) prev = Number(b.max);
    if (!String(b.headline || '').trim() && !(b.lines || []).some(l => String(typeof l === 'string' ? l : l.value || '').trim())) warnings.push(`Result band ${k + 1} has no text.`);
    if (spec.table && b.row !== undefined && b.row !== null && !(spec.table.rows || [])[b.row]) errors.push(`Result band ${k + 1} points to a table row that does not exist.`);
  });
  if (!errors.length) {
    const { lo, hi } = range(inputs);
    const finite = bands.filter((b, k) => k < bands.length - 1);
    if (finite.length && finite[finite.length - 1].max >= hi) warnings.push(`Scores only go up to ${hi}, so the last band is never reached.`);
    if (finite.length && finite[0].max < lo) warnings.push(`Scores start at ${lo}, so the first band is never reached.`);
  }
  if (!String(spec.scoreLabel || '').trim()) warnings.push('The score has no name (shown beside the total, e.g. "ABC score").');
  return { errors, warnings };
}

// A tidy copy of what the editor sent, keeping only known fields.
function cleanSpec(raw, id) {
  const s = raw || {};
  const str = v => String(v === undefined || v === null ? '' : v).trim();
  const evidence = {};
  for (const f of EVIDENCE_FIELDS) {
    const v = s.evidence && s.evidence[f];
    if (v === undefined || v === null || v === '') continue;
    evidence[f] = ['prevalence', 'developed', 'validated'].includes(f) && Number.isFinite(Number(v)) ? Number(v) : str(v);
  }
  const out = { kind: s.kind === 'text' ? 'text' : 'points', id };
  for (const f of TEXT_FIELDS) if (str(s[f])) out[f] = str(s[f]);
  out.evidence = evidence;
  if (Array.isArray(s.categories)) out.categories = s.categories.map(str).filter(Boolean);
  if (out.kind === 'text') return out;
  out.scoreLabel = str(s.scoreLabel);
  out.inputs = (s.inputs || []).map(i => {
    if (i.type === 'heading') return { type: 'heading', label: str(i.label) };
    if (i.type === 'text') return { type: 'text', text: str(i.text) };
    const base = { id: str(i.id), type: i.type, label: str(i.label) };
    if (str(i.note)) base.note = str(i.note);
    if (i.type === 'choice') base.options = (i.options || []).map(o => ({ label: str(o.label), points: Number(o.points) }));
    else base.points = Number(i.points);
    return base;
  });
  out.bands = (s.bands || []).map((b, k, all) => {
    const o = {};
    if (k < all.length - 1) o.max = Number(b.max);
    if ([1, 2, 3, 4].includes(Number(b.level))) o.level = Number(b.level);
    if (str(b.headline)) o.headline = str(b.headline);
    o.lines = (b.lines || []).map(l => (typeof l === 'string' ? str(l) : str(l.label) ? { label: str(l.label), value: str(l.value) } : str(l.value))).filter(l => (typeof l === 'string' ? l : l.value));
    if (str(b.note)) o.note = str(b.note);
    if (b.row !== undefined && b.row !== null && b.row !== '' && Number.isInteger(Number(b.row))) o.row = Number(b.row);
    return o;
  });
  const t = s.table;
  out.table = t && Array.isArray(t.head) && t.head.some(h => str(h)) ? { head: t.head.map(str), rows: (t.rows || []).map(r => (r || []).map(str)) } : null;
  return out;
}

// ---------- Tools from specs ----------
// A working tool (as in decision-tools/lib.js) from a point-score spec.
function toolFromPoints(spec, base) {
  const { hi } = range(spec.inputs);
  const tool = {
    id: spec.id,
    eeId: base ? base.eeId : undefined,
    title: spec.title,
    subtitle: spec.subtitle || '',
    question: spec.question || '',
    footnote: spec.footnote || null,
    categories: spec.categories && spec.categories.length ? spec.categories : base ? base.categories : ['Other'],
    inputs: spec.inputs,
    points: { label: spec.scoreLabel || 'Score', max: hi },
    evidence: { ...(base ? base.evidence : {}), ...spec.evidence },
    edited: true,
    compute(a) {
      const s = pointsOf(tool, a);
      const b = band(s, spec.bands.map((x, k) => (k === spec.bands.length - 1 ? { ...x, max: undefined } : x))) || {};
      const r = {};
      if (b.level) r.level = b.level;
      if (b.headline) r.headline = b.headline;
      if (b.lines && b.lines.length) r.lines = b.lines;
      if (b.note) r.note = b.note;
      if (spec.table) r.table = { head: spec.table.head, rows: spec.table.rows, current: b.row !== undefined ? b.row : undefined };
      return r;
    }
  };
  return tool;
}

// A code tool with its words changed.
function toolWithText(spec, base) {
  const t = Object.create(base);
  for (const f of TEXT_FIELDS) if (spec[f] !== undefined) t[f] = spec[f];
  t.evidence = { ...base.evidence, ...spec.evidence };
  if (spec.categories && spec.categories.length) t.categories = spec.categories;
  t.edited = true;
  return t;
}

function toolFromSpec(spec, base) {
  if (!spec) return base || null;
  if (spec.kind === 'text') return base ? toolWithText(spec, base) : null;
  return toolFromPoints(spec, base);
}

// ---------- Existing tools as specs ----------
// Every answer combination (or 20,000 random ones when there are more).
function answerSets(inputs) {
  const ins = scoringInputs(inputs);
  const size = ins.reduce((s, i) => s * (i.type === 'check' ? 2 : i.options.length), 1);
  const sets = [];
  if (size <= 20000) {
    const rec = (k, a) => {
      if (k === ins.length) { sets.push({ ...a }); return; }
      const i = ins[k];
      const n = i.type === 'check' ? 2 : i.options.length;
      for (let v = 0; v < n; v++) { a[i.id] = i.type === 'check' ? v === 1 : v; rec(k + 1, a); }
    };
    rec(0, {});
  } else {
    let seed = 1;
    const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    for (let r = 0; r < 20000; r++) {
      const a = {};
      for (const i of ins) a[i.id] = i.type === 'check' ? rnd() < 0.5 : Math.floor(rnd() * i.options.length);
      sets.push(a);
    }
  }
  return sets;
}

// Why an existing tool cannot be edited as a point score (null when it can).
function whyNotPoints(t) {
  if (!t.points) return 'it is not a sum of points';
  if (t.inputs.some(i => i.when)) return 'some of its questions depend on earlier answers';
  if (t.inputs.some(i => !['choice', 'check', 'heading', 'text'].includes(i.type) || i.adjust)) return 'it asks for numbers or dates';
  if (t.inputs.some(i => i.required)) return 'some of its questions have no preset answer';
  return null;
}

// The point-score spec that gives exactly the same results as tool t, or { error }.
function specFromTool(t) {
  const why = whyNotPoints(t);
  if (why) return { error: `Only its words can be edited here: ${why}.` };
  const byScore = new Map();
  for (const a of answerSets(t.inputs)) {
    let r;
    try { r = t.compute(a) || {}; } catch (err) { return { error: `Only its words can be edited here: its result could not be worked out (${err.message}).` }; }
    const s = pointsOf(t, a);
    const json = JSON.stringify(r);
    if (byScore.has(s) && byScore.get(s).json !== json) return { error: 'Only its words can be edited here: its result depends on more than the total score.' };
    byScore.set(s, { json, r });
  }
  const scores = [...byScore.keys()].sort((x, y) => x - y);
  // One table for the whole tool, when every result carries the same one.
  const tables = new Set(scores.map(s => { const tb = byScore.get(s).r.table; return tb ? JSON.stringify({ head: tb.head, rows: tb.rows }) : ''; }));
  const table = tables.size === 1 && [...tables][0] ? JSON.parse([...tables][0]) : null;
  if (tables.size > 1) return { error: 'Only its words can be edited here: its results show different tables.' };
  const bands = [];
  for (const s of scores) {
    const r = byScore.get(s).r;
    if (r.score && (r.score.value !== s || r.score.label !== t.points.label)) return { error: 'Only its words can be edited here: it shows its score in its own way.' };
    const b = {};
    if (r.level) b.level = r.level;
    if (r.headline) b.headline = r.headline;
    b.lines = r.lines || [];
    if (r.note) b.note = r.note;
    if (table && r.table.current !== undefined) b.row = r.table.current;
    const prev = bands[bands.length - 1];
    if (prev && JSON.stringify({ ...prev, max: undefined }) === JSON.stringify({ ...b, max: undefined })) { prev.max = s; continue; }
    bands.push({ ...b, max: s });
  }
  delete bands[bands.length - 1].max;
  const inputs = t.inputs.map(i => {
    if (i.type === 'heading') return { type: 'heading', label: i.label };
    if (i.type === 'text') return { type: 'text', text: i.text };
    const o = { id: i.id, type: i.type, label: i.label };
    if (i.note) o.note = i.note;
    if (i.type === 'choice') o.options = i.options.map(x => ({ label: x.label, points: x.points || 0 }));
    else o.points = i.points || 0;
    return o;
  });
  const evidence = {};
  for (const f of EVIDENCE_FIELDS) if (t.evidence && t.evidence[f] !== undefined && t.evidence[f] !== '') evidence[f] = t.evidence[f];
  const spec = { kind: 'points', id: t.id, title: t.title, subtitle: t.subtitle || '', question: t.question || '', footnote: t.footnote || '', categories: t.categories, scoreLabel: t.points.label, inputs, bands, table, evidence };
  // Check: the spec scores every answer set exactly as the tool does.
  const made = toolFromPoints(spec, t);
  for (const a of answerSets(t.inputs).slice(0, 5000)) {
    const want = { ...(t.compute(a) || {}) }; delete want.score;
    if (JSON.stringify(normal(made.compute(a))) !== JSON.stringify(normal(want))) return { error: 'Only its words can be edited here: it could not be turned into bands exactly.' };
  }
  return { spec };
}
// Results compared without empty fields.
function normal(r) {
  const o = {};
  for (const k of ['level', 'headline', 'lines', 'note', 'table']) {
    if (r[k] === undefined || (Array.isArray(r[k]) && !r[k].length)) continue;
    o[k] = k === 'table' ? { head: r[k].head, rows: r[k].rows, current: r[k].current } : r[k];
  }
  return o;
}

// The words of a code tool, as a text-only spec.
function textSpecFromTool(t) {
  const evidence = {};
  for (const f of EVIDENCE_FIELDS) if (t.evidence && t.evidence[f] !== undefined && t.evidence[f] !== '') evidence[f] = t.evidence[f];
  return { kind: 'text', id: t.id, title: t.title, subtitle: t.subtitle || '', question: t.question || '', footnote: t.footnote || '', categories: t.categories, evidence };
}

module.exports = { published, draft, saveVersion, discardDraft, editedIds, history, checkSpec, cleanSpec, toolFromSpec, specFromTool, textSpecFromTool, range, EVIDENCE_FIELDS };
