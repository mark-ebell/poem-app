// The Risk Scores tab: clinical decision rules and risk scores. Each tool is a data
// file (decision-tools/*.json, described in routes/tools.js); this page draws any of
// them the same way: the items to answer, the score as it adds up, the risk group, and
// the probability of the outcome from the group's likelihood ratio and a pretest
// probability (the study's own, which can be changed to fit the user's setting).

const $ = id => document.getElementById(id);
let api = null;
let tools = [];
let tool = null;      // the open tool
let answers = {};     // input id -> chosen option index
let pretest = null;   // %

const el = (tag, className, text) => {
  const e = document.createElement(tag);
  if (className) e.className = className;
  if (text !== undefined) e.textContent = text;
  return e;
};

// ---------- The list ----------
export async function loadTools(apiFn) {
  api = apiFn;
  ({ tools } = await api('/tools'));
  renderList();
}

function renderList() {
  const q = $('toolsFilter').value.trim().toLowerCase();
  const box = $('toolsList');
  box.textContent = '';
  const shown = tools.filter(t => !q || `${t.title} ${t.subtitle} ${t.category}`.toLowerCase().includes(q));
  if (!shown.length) { box.appendChild(el('p', 'hint', q ? 'No risk score matches.' : 'No risk scores yet.')); return; }
  const groups = new Map();
  for (const t of shown) (groups.get(t.category) || groups.set(t.category, []).get(t.category)).push(t);
  for (const [category, list] of [...groups].sort((a, b) => a[0].localeCompare(b[0]))) {
    box.appendChild(el('h3', 'tools-cat', category));
    const ul = el('ul', 'tools-items');
    for (const t of list) {
      const li = el('li');
      const b = el('button', 'tools-item');
      b.type = 'button';
      b.appendChild(el('span', 'tools-item-title', t.title));
      if (t.subtitle) b.appendChild(el('span', 'tools-item-sub', t.subtitle));
      b.addEventListener('click', () => openTool(t.id));
      li.appendChild(b);
      ul.appendChild(li);
    }
    box.appendChild(ul);
  }
}

// ---------- One tool ----------
export async function openTool(id) {
  let data;
  try {
    data = await api(`/tools/${encodeURIComponent(id)}`);
  } catch (err) {
    alert(err.message);
    return;
  }
  tool = data.tool;
  answers = {};
  pretest = tool.pretest ? tool.pretest.default : null;
  renderTool();
  $('toolsListCard').classList.add('hidden');
  $('toolCard').classList.remove('hidden');
  window.scrollTo(0, 0);
}

function closeTool() {
  tool = null;
  $('toolCard').classList.add('hidden');
  $('toolsListCard').classList.remove('hidden');
}

const postTest = (pre, lr) => {
  const odds = (pre / (100 - pre)) * lr;
  return (100 * odds) / (1 + odds);
};
const pct = p => (p < 10 ? p.toFixed(1) : String(Math.round(p))).replace(/\.0$/, '') + '%';
const range = b => (b.min === b.max ? String(b.min) : `${b.min}–${b.max}`);

function renderTool() {
  const card = $('toolCard');
  card.textContent = '';
  const back = el('button', 'link-btn tool-back', '← All risk scores');
  back.type = 'button';
  back.addEventListener('click', closeTool);
  card.appendChild(back);
  card.appendChild(el('h2', 'tool-title', tool.title));
  if (tool.subtitle) card.appendChild(el('p', 'tool-subtitle', tool.subtitle));
  if (tool.question) card.appendChild(el('p', 'tool-question', tool.question));

  // The items.
  tool.inputs.forEach(input => {
    const set = el('fieldset', 'tool-item');
    const legend = el('legend');
    legend.appendChild(el('span', '', input.label));
    set.appendChild(legend);
    const opts = el('div', 'tool-options');
    opts.setAttribute('role', 'radiogroup');
    opts.setAttribute('aria-label', input.label);
    opts.style.setProperty('--n', String(Math.min(input.options.length, 4)));
    input.options.forEach((o, k) => {
      const b = el('button', 'tool-option');
      b.type = 'button';
      b.setAttribute('role', 'radio');
      b.setAttribute('aria-checked', 'false');
      b.dataset.input = input.id;
      b.dataset.k = String(k);
      b.appendChild(el('span', 'tool-option-label', o.label));
      b.appendChild(el('span', 'tool-option-pts', `${o.points >= 0 ? '+' : ''}${o.points}`));
      b.addEventListener('click', () => { answers[input.id] = k; update(); });
      opts.appendChild(b);
    });
    set.appendChild(opts);
    if (input.note) set.appendChild(el('p', 'hint tool-note', input.note));
    card.appendChild(set);
  });

  // The result.
  const result = el('div', 'tool-result');
  result.id = 'toolResult';
  result.setAttribute('aria-live', 'polite');
  card.appendChild(result);

  // Pretest probability.
  if (tool.pretest) {
    const row = el('div', 'tool-pretest');
    const label = el('label', '', `Pretest probability of ${tool.outcome} `);
    const num = el('input');
    num.type = 'number';
    num.id = 'toolPretest';
    num.min = '0.1'; num.max = '99.9'; num.step = '0.1';
    num.value = String(pretest);
    num.addEventListener('input', () => {
      const v = Number(num.value);
      if (v > 0 && v < 100) { pretest = v; update(); }
    });
    label.appendChild(num);
    label.appendChild(document.createTextNode(' %'));
    row.appendChild(label);
    const reset = el('button', 'secondary small-btn', 'Reset');
    reset.type = 'button';
    reset.addEventListener('click', () => { pretest = tool.pretest.default; num.value = String(pretest); update(); });
    row.appendChild(reset);
    row.appendChild(el('p', 'hint', `${tool.pretest.default}% is ${tool.pretest.source}. Change it to match your patient or setting; the probabilities below follow.`));
    card.appendChild(row);
  }

  // All the risk groups.
  const table = el('table', 'tool-bands');
  table.id = 'toolBands';
  card.appendChild(table);

  // About the tool.
  const about = el('details', 'tool-about');
  about.appendChild(el('summary', '', 'About this tool'));
  const dl = el('dl');
  const add = (term, text) => { if (text) { dl.appendChild(el('dt', '', term)); dl.appendChild(el('dd', '', text)); } };
  const ev = tool.evidence || {};
  add('Population', ev.population);
  add('Validation', ev.validation);
  add(`Prevalence of ${tool.outcome}`, ev.prevalence);
  add('Comment', ev.comment);
  about.appendChild(dl);
  for (const r of tool.references || []) {
    const p = el('p', 'tool-ref', r.citation + ' ');
    if (r.pmid) {
      const a = el('a', '', 'PubMed');
      a.href = `https://pubmed.ncbi.nlm.nih.gov/${encodeURIComponent(r.pmid)}/`;
      a.target = '_blank';
      a.rel = 'noopener';
      p.appendChild(a);
    }
    about.appendChild(p);
  }
  about.appendChild(el('p', 'hint', 'This tool simplifies the calculations in the study above. Its result is not medical advice; decisions should take into account all relevant information about the patient and clinical judgment.'));
  card.appendChild(about);

  const resetAll = el('button', 'secondary', 'Clear answers');
  resetAll.type = 'button';
  resetAll.addEventListener('click', () => { answers = {}; update(); });
  card.appendChild(resetAll);

  update();
}

function update() {
  const card = $('toolCard');
  card.querySelectorAll('.tool-option').forEach(b => {
    const on = answers[b.dataset.input] === Number(b.dataset.k);
    b.classList.toggle('selected', on);
    b.setAttribute('aria-checked', on ? 'true' : 'false');
  });
  const answered = tool.inputs.filter(i => answers[i.id] !== undefined);
  const score = answered.reduce((s, i) => s + i.options[answers[i.id]].points, 0);
  const complete = answered.length === tool.inputs.length;
  const band = complete ? tool.bands.find(b => score >= b.min && score <= b.max) : null;

  const result = $('toolResult');
  result.textContent = '';
  result.className = `tool-result${band ? ` level-${band.level}` : ''}`;
  const head = el('div', 'tool-score');
  head.appendChild(el('span', 'tool-score-num', String(score)));
  head.appendChild(el('span', 'tool-score-max', `/${tool.score.max}`));
  head.appendChild(el('span', 'tool-score-label', tool.score.label));
  result.appendChild(head);
  if (!complete) {
    const left = tool.inputs.length - answered.length;
    result.appendChild(el('p', 'tool-score-wait', `Answer ${left === tool.inputs.length ? 'each item' : `${left} more item${left === 1 ? '' : 's'}`} to see the risk.`));
  } else if (band) {
    result.appendChild(el('div', 'tool-band', band.label));
    if (band.lr && pretest) {
      const p = el('p', 'tool-prob');
      p.appendChild(document.createTextNode(`Probability of ${tool.outcome}: `));
      p.appendChild(el('strong', '', pct(postTest(pretest, band.lr))));
      p.appendChild(document.createTextNode(` (likelihood ratio ${band.lr}, pretest probability ${pretest}%)`));
      result.appendChild(p);
    }
  }

  // The groups, with the patient's highlighted.
  const table = $('toolBands');
  table.textContent = '';
  const hr = el('tr');
  ['Score', 'Risk group', 'Likelihood ratio', `Probability of ${tool.outcome}`].forEach(h => hr.appendChild(el('th', '', h)));
  table.appendChild(hr);
  for (const b of tool.bands) {
    const tr = el('tr', `level-${b.level}${b === band ? ' current' : ''}`);
    tr.appendChild(el('td', '', range(b)));
    tr.appendChild(el('td', '', b.label));
    tr.appendChild(el('td', '', String(b.lr)));
    tr.appendChild(el('td', '', pretest ? pct(postTest(pretest, b.lr)) : '—'));
    table.appendChild(tr);
  }
}

$('toolsFilter').addEventListener('input', renderList);
