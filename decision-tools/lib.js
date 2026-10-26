// Helpers for the Risk Scores tools (decision-tools/tools/*.js).
//
// A tool is a module exporting:
//   { id, eeId, title, subtitle, question,
//     inputs: [ ... ],            // see below
//     points: { label, max },     // when the score is a sum of the inputs' points (optional)
//     compute(a) -> result,       // a: the answers (see below); called once every required input is answered
//     evidence: { ... } }         // fields overriding those from EE+ (ee-evidence.json), e.g. a corrected reference
//
// Inputs (each may have `note`, shown under it, and `ee`, the EE+ control it came from):
//   { id, type: 'choice', label, options: [{ label, points? }], default? }   answer: the option's index (default: the first)
//   { id, type: 'check', label, points? }                          answer: true / false
//   { id, type: 'number', label, unit?, min, max, step? }          answer: a number in range
//   { id, type: 'number', ..., default, adjust: true }             shown under the result (e.g. a pretest probability)
//   { type: 'heading', label }  /  { type: 'text', text }         layout only
// Choices start on their default option and checks unchecked, so a result shows at once;
// numbers must be entered (unless they have a `default`, or `optional: true`).
// A choice with `required: true` has no preset and must be answered (e.g. the steps of an
// algorithm). An input with `when: a => …` is asked only when that is true of the answers
// so far (a branching algorithm); otherwise it is hidden and ignored.
//
// A result: { score?: { value, max?, label }, level?: 1 (lowest risk) .. 4, headline?: 'Low risk',
//   lines?: [string | { label, value }], table?: { head: [], rows: [[]], current?: row index }, note? }

const pct = (p, digits) => {
  if (p === null || p === undefined || !isFinite(p)) return '—';
  const d = digits !== undefined ? digits : p < 1 ? 2 : p < 10 ? 1 : 0;
  return `${Number(p.toFixed(d))}%`;
};
const logistic = x => 100 / (1 + Math.exp(-x));
const postTest = (pre, lr) => { const o = (pre / (100 - pre)) * lr; return (100 * o) / (1 + o); };
const count = (a, ids) => ids.filter(id => a[id]).length;
// The sum of the points of the chosen options and the checked items.
const pointsOf = (tool, a) => tool.inputs.reduce((s, i) => {
  if (i.type === 'choice' && a[i.id] !== undefined) return s + (i.options[a[i.id]].points || 0);
  if (i.type === 'check' && a[i.id]) return s + (i.points || 0);
  return s;
}, 0);
// The band a value falls in: bands = [{ max, ... }] in increasing order (the last may omit max).
const band = (value, bands) => bands.find(b => b.max === undefined || value <= b.max);

module.exports = { pct, logistic, postTest, count, pointsOf, band };
