// The summary table of every test or finding for a symptom / disease pair, with LR+, LR-,
// post-test probabilities and sensitivity and specificity. Tests with several result levels
// get a small table of their own (result, likelihood ratio). Used by the chapters' Decision
// support pop-up and the calculator tabs' "Compare all" panel.

import { t as tr, nm } from './i18n.js';

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

// head: [[label, className, colspan?, rowspan?], ...] rows (one or two); body: [[content, className], ...]
// rows, where content is text or an element.
export function summaryTable(headRows, rows) {
  const wrap = el('div', 'chapter-table-wrap');
  const table = el('table', 'chapter-table summary-table');
  for (const hr of headRows) {
    const row = el('tr');
    for (const [text, cls, colspan, rowspan] of hr) {
      const th = el('th', cls || '', text);
      if (colspan) th.colSpan = colspan;
      if (rowspan) th.rowSpan = rowspan;
      row.appendChild(th);
    }
    table.appendChild(row);
  }
  for (const cells of rows) {
    const r = el('tr');
    for (const [content, cls] of cells) {
      const td = el('td', cls || '');
      if (content instanceof Node) td.appendChild(content); else td.textContent = content ?? '';
      r.appendChild(td);
    }
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
  // Whole sentences, so that each language can word them in its own way.
  const slider = /slider/.test(verb);
  if (median === null) return slider ? tr('No pre-test probability was reported; 50% is used. Move the slider or enter your own estimate.') : tr('No pre-test probability was reported; 50% is used. Enter your own estimate.');
  if (count === 1) return slider ? tr('From the cited study. Move the slider or enter your own estimate to update the table.') : tr('From the cited study. Enter your own estimate to update the table.');
  if (distinct > 1) return slider ? tr('From the cited studies (median). Move the slider or enter your own estimate to update the table.') : tr('From the cited studies (median). Enter your own estimate to update the table.');
  return slider ? tr('From the cited studies. Move the slider or enter your own estimate to update the table.') : tr('From the cited studies. Enter your own estimate to update the table.');
}

const label = test => nm(test.name) + (test.disambig ? ` (${test.disambig})` : '');

// A test's name: a link that calls open(test) when open is given, else plain text.
function nameOf(test, open) {
  if (!open) return label(test);
  const link = el('span', 'library-title-link', label(test));
  link.tabIndex = 0;
  link.setAttribute('role', 'link');
  link.addEventListener('click', () => open(test));
  link.addEventListener('keydown', e => { if (e.key === 'Enter') open(test); });
  return link;
}

// Draws the tables into container for pre-test probability p (%). which: 'signs' or 'tests'.
// Highest LR+ first (as the result tables of multi-level tests are); a missing LR+ goes last.
// open (optional): makes each name a link that calls open(test).
export function renderSummaryTables(container, tests, which, p, open = null) {
  const byLR = t => (Number.isFinite(t.plr) ? t.plr : -Infinity);
  const simple = tests.filter(t => t.multi !== 1).sort((a, b) => byLR(b) - byLR(a));
  const multi = tests.filter(t => t.multi === 1);
  container.textContent = '';
  if (simple.length) {
    container.appendChild(summaryTable([
      [[which === 'signs' ? 'Sign or symptom' : 'Test Name', '', 0, 2], ['LR+', 'num', 0, 2], ['LR-', 'num', 0, 2], ['Post-test probability', 'num', 2], ['Sens', 'num wide-only', 0, 2], ['Spec', 'num wide-only', 0, 2]],
      [['If +', 'num'], ['If −', 'num']]
    ], simple.map(t => [[nameOf(t, open)], [fmtLR(t.plr), 'num'], [fmtLR(t.nlr), 'num'], [fmtPost(postTest(p, t.plr)), 'num post'], [fmtPost(postTest(p, t.nlr)), 'num post'], [fmtPct(t.sens), 'num wide-only'], [fmtPct(t.spec), 'num wide-only']])));
  }
  for (const t of multi) {
    const heading = el('h4', 'summary-multi');
    heading.appendChild(open ? nameOf(t, open) : document.createTextNode(label(t)));
    container.appendChild(heading);
    container.appendChild(summaryTable([[['Result'], ['LR', 'num'], ['Post-test probability', 'num']]],
      t.options.slice().sort((a, b) => b.sslr - a.sslr).map(o => [[nm(o.range)], [fmtLR(o.sslr), 'num'], [fmtPost(postTest(p, o.sslr)), 'num post']])));
  }
}
