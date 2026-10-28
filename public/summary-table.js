// The summary table of every test or finding for a symptom / disease pair, with LR+, LR-,
// post-test probabilities and sensitivity and specificity. Tests with several result levels
// get a small table of their own (result, likelihood ratio). Used by the chapters' Decision
// support pop-up and the calculator tabs' "Compare all" panel.

function el(tag, className, text) {
  const e = document.createElement(tag);
  if (className) e.className = className;
  if (text !== undefined) e.textContent = text;
  return e;
}

export function fmtLR(x) {
  if (x === null || x === undefined || !Number.isFinite(x)) return '–';
  const s = x >= 10 ? x.toFixed(0) : x >= 1 ? x.toFixed(1) : x.toFixed(2);
  return s.includes('.') ? s.replace(/\.?0+$/, '') : s;
}
export const fmtPct = x => (x === null || x === undefined || !Number.isFinite(x) ? '–' : `${Math.round(x)}%`);

// Post-test probability (%) from a pre-test probability (%) and a likelihood ratio.
export function postTest(pretest, lr) {
  if (!Number.isFinite(lr)) return null;
  const p = Math.min(Math.max(pretest / 100, 0.0001), 0.9999);
  const odds = (p / (1 - p)) * lr;
  return (odds / (1 + odds)) * 100;
}
// One decimal under 10% (1.6%), whole numbers above (60%).
export const fmtPost = x => (x === null || !Number.isFinite(x) ? '–' : `${x < 10 ? x.toFixed(1) : Math.round(x)}%`);

// head: [[label, className, colspan?, rowspan?], ...] rows (one or two); body: [[text, className], ...] rows.
export function summaryTable(headRows, rows) {
  const wrap = el('div', 'chapter-table-wrap');
  const table = el('table', 'chapter-table summary-table');
  for (const hr of headRows) {
    const tr = el('tr');
    for (const [text, cls, colspan, rowspan] of hr) {
      const th = el('th', cls || '', text);
      if (colspan) th.colSpan = colspan;
      if (rowspan) th.rowSpan = rowspan;
      tr.appendChild(th);
    }
    table.appendChild(tr);
  }
  for (const cells of rows) {
    const r = el('tr');
    for (const [text, cls] of cells) r.appendChild(el('td', cls || '', text));
    table.appendChild(r);
  }
  wrap.appendChild(table);
  return wrap;
}

// One pre-test probability for the table: the cited studies' (their median if they
// differ), else 50%. Returns { median, count, distinct, start }.
export function pretestStart(tests) {
  const reported = tests.map(t => t.pretest).filter(Number.isFinite).sort((a, b) => a - b);
  const n = reported.length;
  const median = n ? (n % 2 ? reported[(n - 1) / 2] : (reported[n / 2 - 1] + reported[n / 2]) / 2) : null;
  return { median, count: n, distinct: new Set(reported).size, start: median === null ? 50 : Math.round(median * 10) / 10 };
}

// Where the starting pre-test probability came from. verb: 'Enter' or 'Move the slider or enter'.
export function pretestNote(tests, verb) {
  const { median, count, distinct } = pretestStart(tests);
  return median === null
    ? `No pre-test probability was reported; 50% is used. ${verb} your own estimate.`
    : `From the cited ${count === 1 ? 'study' : 'studies'}${distinct > 1 ? ' (median)' : ''}. ${verb} your own estimate to update the table.`;
}

const label = test => test.name + (test.disambig ? ` (${test.disambig})` : '');

// Draws the tables into container for pre-test probability p (%). which: 'signs' or 'tests'.
// Highest LR+ first (as the result tables of multi-level tests are); a missing LR+ goes last.
export function renderSummaryTables(container, tests, which, p) {
  const byLR = t => (Number.isFinite(t.plr) ? t.plr : -Infinity);
  const simple = tests.filter(t => t.multi !== 1).sort((a, b) => byLR(b) - byLR(a));
  const multi = tests.filter(t => t.multi === 1);
  container.textContent = '';
  if (simple.length) {
    container.appendChild(summaryTable([
      [[which === 'signs' ? 'Finding' : 'Test Name', '', 0, 2], ['LR+', 'num', 0, 2], ['LR-', 'num', 0, 2], ['Post-test probability', 'num', 2], ['Sens', 'num wide-only', 0, 2], ['Spec', 'num wide-only', 0, 2]],
      [['If +', 'num'], ['If −', 'num']]
    ], simple.map(t => [[label(t)], [fmtLR(t.plr), 'num'], [fmtLR(t.nlr), 'num'], [fmtPost(postTest(p, t.plr)), 'num post'], [fmtPost(postTest(p, t.nlr)), 'num post'], [fmtPct(t.sens), 'num wide-only'], [fmtPct(t.spec), 'num wide-only']])));
  }
  for (const t of multi) {
    container.appendChild(el('h4', 'summary-multi', label(t)));
    container.appendChild(summaryTable([[['Result'], ['LR', 'num'], ['Post-test probability', 'num']]],
      t.options.slice().sort((a, b) => b.sslr - a.sslr).map(o => [[o.range], [fmtLR(o.sslr), 'num'], [fmtPost(postTest(p, o.sslr)), 'num post']])));
  }
}
