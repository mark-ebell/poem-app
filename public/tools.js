// The Risk Scores tab: clinical decision rules and risk scores. Each tool's questions
// come from the server (routes/tools.js); the answers are sent back to be scored, so
// this page draws every tool the same way: the items to answer (choices as buttons, or a
// list when there are many; checkboxes; numbers), the result as the answers come in (kept
// in view at the bottom of the screen), any adjustable value such as a pretest
// probability, a table of the risk groups where the tool has one, and "About this score".

const $ = id => document.getElementById(id);
let api = null;
let tools = [];
let categories = [];  // [{ name, available, total }]
let tool = null;      // the open tool's questions
let answers = {};     // input id -> option index, true/false, or number
let seq = 0;          // the latest scoring request (older replies are ignored)
let timer = null;

const el = (tag, className, text) => {
  const e = document.createElement(tag);
  if (className) e.className = className;
  if (text !== undefined) e.textContent = text;
  return e;
};
const signed = p => `${p >= 0 ? '+' : '−'}${Math.abs(p)}`;

// ---------- The list ----------
export async function loadTools(apiFn) {
  api = apiFn;
  ({ tools, categories } = await api('/tools'));
  const sel = $('toolsCategory');
  for (const c of categories) {
    const o = el('option', '', c.available === c.total ? `${c.name} (${c.total})` : `${c.name} (${c.available} of ${c.total} so far)`);
    o.value = c.name;
    o.disabled = !c.available;
    sel.appendChild(o);
  }
  renderList();
}

function renderList() {
  const q = $('toolsFilter').value.trim().toLowerCase();
  const cat = $('toolsCategory').value;
  const box = $('toolsList');
  box.textContent = '';
  const shown = tools.filter(t => (!cat || t.categories.includes(cat)) && (!q || `${t.title} ${t.subtitle} ${t.categories.join(' ')}`.toLowerCase().includes(q)));
  $('toolsCount').textContent = `${shown.length} of ${tools.length} risk scores${cat ? ` in ${cat}` : ''}.`;
  if (!shown.length) { box.appendChild(el('p', 'hint', q ? 'No risk score matches.' : 'No risk scores yet.')); return; }
  // A tool appears under each of its categories, as in EE+.
  const groups = new Map();
  for (const t of shown) for (const c of t.categories) if (!cat || c === cat) (groups.get(c) || groups.set(c, []).get(c)).push(t);
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
  answers = defaults();
  renderTool();
  changed();
  $('toolsListCard').classList.add('hidden');
  $('toolCard').classList.remove('hidden');
  window.scrollTo(0, 0);
}

// Choices start on their default option (the first unless the tool says otherwise); checks unchecked.
function defaults() {
  const a = {};
  for (const i of tool.inputs) if (i.type === 'choice' && !i.required) a[i.id] = i.default || 0;
  return a;
}

function closeTool() {
  tool = null;
  $('toolCard').classList.add('hidden');
  $('toolsListCard').classList.remove('hidden');
}

function choiceButtons(input) {
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
    if (o.points !== undefined) b.appendChild(el('span', 'tool-option-pts', signed(o.points)));
    b.addEventListener('click', () => { answers[input.id] = k; changed(); });
    opts.appendChild(b);
  });
  return opts;
}

function choiceList(input) {
  const s = el('select', 'tool-select');
  s.setAttribute('aria-label', input.label);
  s.dataset.input = input.id;
  input.options.forEach((o, k) => {
    const opt = el('option', '', o.points !== undefined ? `${o.label} (${signed(o.points)})` : o.label);
    opt.value = String(k);
    s.appendChild(opt);
  });
  s.value = String(answers[input.id] || 0);
  s.addEventListener('change', () => { answers[input.id] = Number(s.value); changed(); });
  return s;
}

function checkButton(input) {
  const b = el('button', 'tool-check');
  b.type = 'button';
  b.setAttribute('role', 'checkbox');
  b.setAttribute('aria-checked', 'false');
  b.dataset.input = input.id;
  b.appendChild(el('span', 'tool-check-box'));
  b.appendChild(el('span', 'tool-option-label', input.label));
  if (input.points !== undefined) b.appendChild(el('span', 'tool-option-pts', signed(input.points)));
  b.addEventListener('click', () => { answers[input.id] = !answers[input.id]; changed(); });
  return b;
}

function numberField(input) {
  const wrap = el('label', 'tool-number');
  wrap.appendChild(el('span', 'tool-number-label', input.label));
  const n = el('input');
  if (input.type === 'date') {
    n.type = 'date';
    n.dataset.input = input.id;
    n.addEventListener('input', () => { if (n.value === '') delete answers[input.id]; else answers[input.id] = n.value; changed(true); });
    wrap.appendChild(n);
    return wrap;
  }
  n.type = 'number';
  n.inputMode = 'decimal';
  if (input.min !== undefined) n.min = String(input.min);
  if (input.max !== undefined) n.max = String(input.max);
  n.step = String(input.step || 'any');
  if (input.default !== undefined) n.value = String(input.default);
  n.dataset.input = input.id;
  n.addEventListener('input', () => { if (n.value === '') delete answers[input.id]; else answers[input.id] = Number(n.value); changed(true); });
  wrap.appendChild(n);
  if (input.unit) wrap.appendChild(el('span', 'tool-unit', input.unit));
  if (input.adjust) {
    const reset = el('button', 'secondary small-btn', 'Reset');
    reset.type = 'button';
    reset.addEventListener('click', e => { e.preventDefault(); n.value = String(input.default); delete answers[input.id]; changed(); });
    wrap.appendChild(reset);
  }
  return wrap;
}

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

  // The items, in order; checkboxes under one heading share a box.
  let group = null;
  const adjust = [];
  for (const input of tool.inputs) {
    if (input.type === 'heading') { group = el('fieldset', 'tool-item tool-checks'); if (input.id) group.dataset.for = input.id; group.appendChild(el('legend', '', input.label)); card.appendChild(group); continue; }
    if (input.type === 'text') { card.appendChild(el('p', 'hint', input.text)); continue; }
    if (input.adjust) { adjust.push(input); continue; }
    if (input.type === 'check') {
      if (!group) { group = el('fieldset', 'tool-item tool-checks'); card.appendChild(group); }
      const cb = checkButton(input);
      cb.dataset.for = input.id;
      group.appendChild(cb);
      if (input.note) group.appendChild(el('p', 'hint tool-note', input.note));
      continue;
    }
    group = null;
    const set = el('fieldset', 'tool-item');
    set.dataset.for = input.id;
    if (input.type === 'choice') {
      set.appendChild(el('legend', '', input.label));
      set.appendChild(input.options.length > 5 ? choiceList(input) : choiceButtons(input));
    } else if (input.type === 'number' || input.type === 'date') {
      set.appendChild(numberField(input));
    }
    if (input.note) set.appendChild(el('p', 'hint tool-note', input.note));
    card.appendChild(set);
  }
  if (tool.footnote) card.appendChild(el('p', 'hint tool-note', tool.footnote));

  const result = el('div', 'tool-result');
  result.id = 'toolResult';
  result.setAttribute('aria-live', 'polite');
  card.appendChild(result);
  card.appendChild(el('p', 'tool-disclaimer', DISCLAIMER));

  for (const input of adjust) {
    const row = el('div', 'tool-pretest');
    row.appendChild(numberField(input));
    if (input.note) row.appendChild(el('p', 'hint', input.note));
    card.appendChild(row);
  }

  const table = el('table', 'tool-bands');
  table.id = 'toolBands';
  card.appendChild(table);

  card.appendChild(aboutSection());

  const clear = el('button', 'secondary', 'Reset answers');
  clear.type = 'button';
  clear.addEventListener('click', () => { answers = defaults(); renderTool(); changed(); });
  card.appendChild(clear);
}

// Shown under the result of every score, never folded away.
const DISCLAIMER = 'For clinicians, as an aid to clinical judgment, not a substitute for it. ' +
  'Each score was developed in particular populations and settings, and its estimates may not apply to every patient. ' +
  'This is not a diagnosis or a treatment recommendation, and not for use by patients to make their own care decisions. ' +
  'This tool simplifies the calculations in the study above. Its result is not medical advice; decisions should take into account all relevant information about the patient and clinical judgment.';

function aboutSection() {
  const ev = tool.evidence || {};
  const about = el('details', 'tool-about');
  about.appendChild(el('summary', '', 'About this score'));
  const dl = el('dl');
  const add = (term, text) => { if (text) { dl.appendChild(el('dt', '', term)); dl.appendChild(el('dd', '', text)); } };
  add('Population', ev.population);
  add('Validation', ev.validation);
  add('Prevalence of the outcome', ev.prevalence ? `${ev.prevalence}%` : '');
  const n = [ev.developed && `${ev.developed.toLocaleString()} to develop the rule`, ev.validated && `${ev.validated.toLocaleString()} to validate it`].filter(Boolean).join('; ');
  add('Patients', n);
  add('Comment', ev.comment);
  about.appendChild(dl);
  if (ev.reference) {
    const p = el('p', 'tool-ref', `${ev.reference} `);
    if (ev.pmid) {
      const a = el('a', '', 'PubMed');
      a.href = `https://pubmed.ncbi.nlm.nih.gov/${encodeURIComponent(ev.pmid)}/`;
      a.target = '_blank';
      a.rel = 'noopener';
      p.appendChild(a);
    }
    about.appendChild(p);
  }
  about.appendChild(el('p', 'hint', 'This tool simplifies the calculations in the study above. Its result is not medical advice; decisions should take into account all relevant information about the patient and clinical judgment.'));
  return about;
}

// ---------- Scoring ----------
function changed(typing) {
  const card = $('toolCard');
  card.querySelectorAll('.tool-option').forEach(b => {
    const on = answers[b.dataset.input] === Number(b.dataset.k);
    b.classList.toggle('selected', on);
    b.setAttribute('aria-checked', on ? 'true' : 'false');
  });
  card.querySelectorAll('.tool-check').forEach(b => {
    const on = !!answers[b.dataset.input];
    b.classList.toggle('selected', on);
    b.setAttribute('aria-checked', on ? 'true' : 'false');
  });
  clearTimeout(timer);
  timer = setTimeout(score, typing ? 300 : 0);
}

async function score() {
  if (!tool) return;
  const mine = ++seq;
  let data;
  try {
    data = await api(`/tools/${encodeURIComponent(tool.id)}/score`, { method: 'POST', body: { answers } });
  } catch (err) {
    if (mine === seq) showResult({ problems: [err.message] });
    return;
  }
  if (mine === seq && tool) showResult(data.result);
}

function showResult(r) {
  // Questions that do not apply on this path of an algorithm are hidden.
  const hidden = new Set(r.hidden || []);
  $('toolCard').querySelectorAll('[data-for]').forEach(e => e.classList.toggle('hidden', hidden.has(e.dataset.for)));
  const box = $('toolResult');
  box.textContent = '';
  box.className = `tool-result${r.level ? ` level-${r.level}` : ''}`;
  if (r.score) {
    const head = el('div', 'tool-score');
    head.appendChild(el('span', 'tool-score-num', String(r.score.value)));
    if (r.score.max !== undefined && r.score.max !== null) head.appendChild(el('span', 'tool-score-max', `/${r.score.max}`));
    head.appendChild(el('span', 'tool-score-label', r.score.label));
    box.appendChild(head);
  }
  if (r.problems) {
    for (const p of r.problems) box.appendChild(el('p', 'tool-problem', p));
  } else if (r.missing) {
    box.appendChild(el('p', 'tool-score-wait', r.wait || 'Answer the remaining items to see the result.'));
  } else {
    if (r.headline) box.appendChild(el('div', 'tool-band', r.headline));
    for (const l of r.lines || []) {
      if (typeof l === 'string') { box.appendChild(el('p', 'tool-prob', l)); continue; }
      const p = el('p', 'tool-prob');
      p.appendChild(document.createTextNode(`${l.label}: `));
      p.appendChild(el('strong', '', l.value));
      box.appendChild(p);
    }
    if (r.note) box.appendChild(el('p', 'tool-result-note', r.note));
  }

  const table = $('toolBands');
  table.textContent = '';
  if (r.table) {
    const hr = el('tr');
    r.table.head.forEach(h => hr.appendChild(el('th', '', h)));
    table.appendChild(hr);
    r.table.rows.forEach((row, k) => {
      const tr = el('tr', k === r.table.current ? 'current' : '');
      row.forEach(c => tr.appendChild(el('td', '', c)));
      table.appendChild(tr);
    });
  }
}

$('toolsFilter').addEventListener('input', renderList);
$('toolsCategory').addEventListener('change', renderList);
