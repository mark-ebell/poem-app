// The Chapters tab: the Essential Evidence textbook, one chapter at a time. The
// chapters are prepared by build_chapters.py; their content arrives as ready-made
// HTML whose links carry data attributes handled here (POEMs, calculators, figures,
// SORT ratings). External links (PubMed, Cochrane, web sites) are ordinary links.
import { markCiteRuns } from './cite-runs.js';
import { pretestStart, pretestNote, renderSummaryTables } from './summary-table.js';

const $ = id => document.getElementById(id);
let api = null;
let hooks = {}; // { showPoemByNumber(num), openCalculator(which, num) } from app.js
let chapters = [];
let current = null; // the chapter being shown
let loaded = null;
let openSeq = 0;

// ---------- Strength of Recommendation Taxonomy ----------
const SORT = [
  ['A', 'Consistent, good-quality patient-oriented evidence'],
  ['B', 'Inconsistent or limited-quality patient-oriented evidence'],
  ['C', 'Consensus, disease-oriented evidence, usual practice, expert opinion, or case series for studies of diagnosis, treatment, prevention, or screening']
];

function el(tag, className, text) {
  const e = document.createElement(tag);
  if (className) e.className = className;
  if (text !== undefined) e.textContent = text;
  return e;
}

// ---------- Pop-up (SORT definitions, figures) ----------
function openInfo(title, body, { small = false } = {}) {
  document.querySelector('#infoModal .modal').classList.toggle('modal-small', small);
  $('infoModalTitle').textContent = title;
  $('infoModalBody').textContent = '';
  $('infoModalBody').appendChild(body);
  $('infoModal').classList.remove('hidden');
  document.body.classList.add('modal-open');
  $('infoModalClose').focus();
}

function closeInfo() {
  $('infoModal').classList.add('hidden');
  document.body.classList.remove('modal-open');
}

function showSort(rating) {
  const body = el('div');
  const list = el('dl', 'sort-list');
  for (const [r, text] of SORT) {
    const row = el('div', `sort-row${r === rating ? ' current' : ''}`);
    row.append(el('dt', '', `SORT ${r}`), el('dd', '', text));
    list.appendChild(row);
  }
  body.appendChild(list);
  body.appendChild(el('p', 'hint', 'Ebell MH, Siwek J, Weiss BD, et al. Strength of Recommendation Taxonomy (SORT): a patient-centered approach to grading evidence in the medical literature. Am Fam Physician. 2004;69(3):548-556.'));
  openInfo('Strength of Recommendation Taxonomy (SORT)', body);
}

// A citation number opens a small pop-up: the abbreviated reference and where to read it.
function showReference(n) {
  const ref = current && current.references.find(r => r.n === Number(n));
  if (!ref) return;
  const body = el('div', 'ref-pop');
  body.appendChild(el('p', 'ref-pop-text', ref.short));
  if (ref.links.length) {
    const links = el('div', 'ref-pop-links');
    for (const l of ref.links) {
      const a = el('a', 'ref-pop-link', l.label);
      if (l.href) { a.href = l.href; a.target = '_blank'; a.rel = 'noopener'; }
      else {
        a.href = '#';
        if (l.poem) a.dataset.poem = l.poem;
        if (l.calc) { a.dataset.calc = l.calc; a.dataset.num = l.num; }
      }
      links.appendChild(a);
    }
    body.appendChild(links);
  }
  openInfo(`Reference ${ref.n}`, body, { small: true });
}

async function showSummary(which, num) {
  const key = which === 'signs' ? 'signsSymptoms' : 'diagnosticTests';
  let data;
  try {
    data = await api(`/calculator/${key}/number/${encodeURIComponent(num)}/summary`);
  } catch (err) {
    alert(err.message);
    return;
  }
  const { start } = pretestStart(data.tests);

  const body = el('div', 'summary-pop');
  body.appendChild(el('p', 'hint summary-specialty', data.specialty));
  const pre = el('div', 'summary-pretest');
  const preLabel = el('label', '', 'Pre-test probability ');
  const input = el('input');
  input.type = 'number';
  input.min = '0.1';
  input.max = '99.9';
  input.step = '0.1';
  input.value = start;
  input.setAttribute('aria-label', 'Pre-test probability (%)');
  preLabel.appendChild(input);
  preLabel.append(' %');
  pre.appendChild(preLabel);
  pre.appendChild(el('p', 'hint summary-pretest-note', pretestNote(data.tests, 'Enter')));
  body.appendChild(pre);
  const tables = el('div');
  body.appendChild(tables);

  const render = () => {
    let p = Number(input.value);
    if (!Number.isFinite(p)) p = start;
    p = Math.min(Math.max(p, 0.1), 99.9);
    renderSummaryTables(tables, data.tests, which, p);
  };
  input.addEventListener('input', render);
  render();

  const open = el('a', 'ref-pop-link', `Open the ${which === 'signs' ? 'H & P' : 'Tests'} calculator`);
  open.href = '#';
  open.dataset.calc = which;
  open.dataset.num = num;
  const links = el('div', 'ref-pop-links');
  links.appendChild(open);
  body.appendChild(links);
  openInfo(`${data.symptom} → ${data.disease}`, body);
}

// A figure (an algorithm), drawn as a column of steps that reads the same on a phone
// as on a wide screen. The order comes from the arrows: each step after the steps that
// lead to it. A box with no arrows of its own (an outcome) is shown inside the step that
// leads to it, as "If <arrow label>: <outcome>". When a step leads to exactly one later
// step, and that step comes next, the two are joined by a labelled arrow; otherwise its
// choices are buttons that jump to the step they lead to. Boxes no arrow reaches (some
// older algorithms list boxes without arrows) are shown as steps at the end.
function layoutFigure(fig) {
  const cells = new Map(fig.cells.map(c => [c.id, c]));
  const out = id => (cells.get(id) ? cells.get(id).paths.filter(p => cells.has(p.target) && p.target !== id) : []);
  const isOutcome = id => out(id).length === 0;
  const incoming = new Map(fig.cells.map(c => [c.id, 0]));
  fig.cells.forEach(c => out(c.id).forEach(p => incoming.set(p.target, incoming.get(p.target) + 1)));

  // Longest distance from the start, so a step comes after every step that leads to it.
  const start = (fig.cells.find(c => c.type === 'start') || fig.cells[0] || {}).id;
  const rank = new Map();
  if (start) {
    rank.set(start, 0);
    for (let pass = 0; pass < fig.cells.length; pass++) { // bounded, so a loop in the arrows can't hang
      let changed = false;
      for (const [id, r] of [...rank]) {
        for (const p of out(id)) {
          if (!rank.has(p.target) || rank.get(p.target) < r + 1) { rank.set(p.target, r + 1); changed = true; }
        }
      }
      if (!changed) break;
    }
  }
  const idNum = id => Number(String(id).replace(/\D/g, '')) || 0;
  const reached = fig.cells.filter(c => rank.has(c.id) && (!isOutcome(c.id) || c.id === start))
    .sort((a, b) => rank.get(a.id) - rank.get(b.id) || idNum(a.id) - idNum(b.id));
  const leftover = fig.cells.filter(c => !reached.includes(c) && !(isOutcome(c.id) && incoming.get(c.id) > 0))
    .sort((a, b) => idNum(a.id) - idNum(b.id));
  const steps = [...reached, ...leftover];
  const stepNo = new Map(steps.map((c, i) => [c.id, i + 1]));
  return { cells, out, isOutcome, steps, stepNo };
}

function showFigure(id) {
  const fig = current && current.figures.find(f => f.id === id);
  if (!fig) return;
  const { cells, out, isOutcome, steps, stepNo } = layoutFigure(fig);
  const body = el('div', 'flow');

  steps.forEach((c, i) => {
    const step = el('section', `flow-step flow-${c.type}`);
    step.id = `flow-step-${stepNo.get(c.id)}`;
    const num = el('div', 'flow-num', String(stepNo.get(c.id)));
    const text = el('div', 'flow-text');
    text.innerHTML = c.html; // prepared by build_chapters.py from escaped text
    step.append(num, text);

    const paths = out(c.id);
    const outcomes = paths.filter(p => isOutcome(p.target));
    const onward = paths.filter(p => !isOutcome(p.target));
    const next = steps[i + 1];
    const joined = onward.length === 1 && next && onward[0].target === next.id;

    if (outcomes.length) {
      const list = el('div', 'flow-outcomes');
      for (const p of outcomes) {
        const o = el('div', 'flow-outcome');
        const when = el('div', 'flow-when');
        when.innerHTML = p.html ? `If ${p.html.charAt(0).toLowerCase()}${p.html.slice(1)}` : 'Then';
        const what = el('div', 'flow-what');
        what.innerHTML = cells.get(p.target).html;
        o.append(when, what);
        list.appendChild(o);
      }
      step.appendChild(list);
    }
    if (onward.length && !joined) {
      const choices = el('div', 'flow-choices');
      for (const p of onward) {
        const b = el('button', 'flow-jump');
        b.type = 'button';
        b.dataset.step = stepNo.get(p.target);
        b.innerHTML = `${p.html || 'Next'} <span class="flow-go">→ Step ${stepNo.get(p.target)}</span>`;
        choices.appendChild(b);
      }
      step.appendChild(choices);
    }
    body.appendChild(step);

    if (joined) {
      const arrow = el('div', 'flow-arrow');
      const label = el('span', 'flow-arrow-label');
      label.innerHTML = onward[0].html || '';
      arrow.appendChild(label);
      body.appendChild(arrow);
    }
  });

  if (fig.notes && fig.notes.length) {
    const notes = el('ul', 'flow-notes');
    for (const n of fig.notes) {
      const li = el('li');
      li.innerHTML = n;
      notes.appendChild(li);
    }
    body.appendChild(notes);
  }
  openInfo(`Figure ${fig.n}. ${fig.title}`, body);
}

// A step's choice button scrolls to the step it leads to.
function onFlowJump(e) {
  const b = e.target.closest('.flow-jump');
  if (!b) return;
  const target = document.getElementById(`flow-step-${b.dataset.step}`);
  if (!target) return;
  target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  target.classList.add('flash');
  setTimeout(() => target.classList.remove('flash'), 1200);
}

// ---------- Chapter list ----------
function renderList() {
  const q = $('chapterFilter').value.trim().toLowerCase();
  const list = $('chapterList');
  list.textContent = '';
  const matches = chapters.filter(c => !q || c.title.toLowerCase().includes(q));
  $('chapterCount').textContent = q
    ? `${matches.length} of ${chapters.length} chapter${chapters.length === 1 ? '' : 's'}`
    : `${chapters.length} chapter${chapters.length === 1 ? '' : 's'}`;
  if (!matches.length) {
    list.appendChild(el('li', 'chapter-none', 'No chapter titles match.'));
    return;
  }
  for (const c of matches) {
    const li = el('li');
    const btn = el('button', current && current.id === c.id ? 'current' : '', c.title);
    btn.type = 'button';
    btn.addEventListener('click', () => openChapter(c.id));
    li.appendChild(btn);
    list.appendChild(li);
  }
}

// ---------- One chapter ----------
export async function openChapter(id) {
  const seq = ++openSeq;
  $('chapterStatus').textContent = 'Loading…';
  let chapter;
  try {
    chapter = await api(`/chapters/${encodeURIComponent(id)}`);
  } catch (err) {
    if (seq === openSeq) $('chapterStatus').textContent = err.message;
    return;
  }
  if (seq !== openSeq) return;
  current = chapter;
  $('chapterStatus').textContent = '';
  renderChapter(chapter);
  renderList();
  $('chapterView').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function formatDate(s) {
  const m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(s || '');
  if (!m) return s || '';
  return new Date(Number(m[3]), Number(m[1]) - 1, Number(m[2])).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

function renderChapter(c) {
  const view = $('chapterView');
  view.textContent = '';
  view.classList.remove('hidden');

  const head = el('div', 'card chapter-head');
  head.appendChild(el('h2', 'chapter-title', c.title));
  if (c.updated) head.appendChild(el('p', 'hint', `Last updated ${formatDate(c.updated)}`));
  if (c.authors.length) {
    const box = el('div', 'chapter-people');
    box.appendChild(el('h3', '', c.authors.length === 1 ? 'Author' : 'Authors'));
    for (const a of c.authors) {
      const p = el('p');
      p.appendChild(el('strong', '', a.name));
      const rest = [a.title, a.department, a.institution, a.city, a.state].filter(Boolean).join(', ');
      if (rest) p.append(`, ${rest}`);
      box.appendChild(p);
    }
    head.appendChild(box);
  }
  if (c.editors.length) {
    const box = el('div', 'chapter-people');
    box.appendChild(el('h3', '', c.editors.length === 1 ? 'Editor' : 'Editors'));
    box.appendChild(el('p', '', c.editors.join('; ')));
    head.appendChild(box);
  }
  view.appendChild(head);

  if (c.overallBottomLine) {
    const box = el('div', 'card chapter-overall');
    box.appendChild(el('h3', '', 'Overall Bottom Line'));
    const content = el('div', 'chapter-content');
    content.innerHTML = c.overallBottomLine; // prepared by build_chapters.py from escaped text
    markCiteRuns(content);
    box.appendChild(content);
    view.appendChild(box);
  }

  // Decision support: the chapter's algorithms, calculators and risk scores in one place.
  const ds = c.decisionSupport || {};
  const groups = [
    ['Algorithms', c.figures.map(f => ({ text: `Figure ${f.n}. ${f.title}`, data: { fig: f.id } }))],
    ['History and physical calculators', (ds.signs || []).map(x => ({ text: x.label, data: { calc: 'signs', num: x.num } }))],
    ['Diagnostic test calculators', (ds.tests || []).map(x => ({ text: x.label, data: { calc: 'tests', num: x.num } }))],
    ['Risk scores', (ds.riskScores || []).map(x => ({ text: x.label, href: x.href }))]
  ].filter(([, items]) => items.length);
  if (groups.length) {
    const det = el('details', 'chapter-section chapter-decision');
    det.appendChild(el('summary', '', 'Decision support'));
    const body = el('div', 'chapter-section-body');
    for (const [label, items] of groups) {
      const part = el('div', 'chapter-part');
      part.appendChild(el('h4', '', label));
      const ul = el('ul', 'calc-links');
      for (const item of items) {
        const li = el('li');
        const a = el('a', item.data && item.data.calc ? 'calc-link' : 'fig-link', item.text);
        if (item.href) { a.href = item.href; a.target = '_blank'; a.rel = 'noopener'; }
        else { a.href = '#'; Object.assign(a.dataset, item.data); }
        li.appendChild(a);
        if (item.data && item.data.calc) {
          const b = el('button', 'summary-btn', 'Summary data');
          b.type = 'button';
          b.dataset.summaryCalc = item.data.calc;
          b.dataset.num = item.data.num;
          li.appendChild(b);
        }
        ul.appendChild(li);
      }
      part.appendChild(ul);
      body.appendChild(part);
    }
    det.appendChild(body);
    view.appendChild(det);
  }

  // Sections start closed; click a heading to open it.
  for (const s of c.sections) {
    const det = el('details', 'chapter-section');
    det.appendChild(el('summary', '', s.label));
    const body = el('div', 'chapter-section-body');
    for (const p of s.parts) {
      const part = el('div', `chapter-part${p.bottomLine ? ' bottom-line' : ''}`);
      if (p.label) part.appendChild(el('h4', '', p.label));
      const content = el('div', 'chapter-content');
      content.innerHTML = p.html; // prepared by build_chapters.py from escaped text
      markCiteRuns(content);
      part.appendChild(content);
      body.appendChild(part);
    }
    det.appendChild(body);
    view.appendChild(det);
  }

  if (c.figures.length) {
    const det = el('details', 'chapter-section');
    det.appendChild(el('summary', '', 'Figures'));
    const body = el('div', 'chapter-section-body');
    const ul = el('ul');
    for (const f of c.figures) {
      const li = el('li');
      const a = el('a', 'fig-link', `Figure ${f.n}. ${f.title}`);
      a.href = '#';
      a.dataset.fig = f.id;
      li.appendChild(a);
      ul.appendChild(li);
    }
    body.appendChild(ul);
    det.appendChild(body);
    view.appendChild(det);
  }

  if (c.references.length) {
    const det = el('details', 'chapter-section chapter-references');
    det.id = 'chapterReferences';
    det.appendChild(el('summary', '', 'References'));
    const ol = el('ol', 'chapter-ref-list');
    for (const r of c.references) {
      const li = el('li');
      li.id = `ref-${r.n}`;
      li.value = r.n;
      li.innerHTML = r.html; // prepared by build_chapters.py from escaped text
      ol.appendChild(li);
    }
    det.appendChild(ol);
    view.appendChild(det);
  }
}

// Links inside a chapter (and in the figure pop-up).
function onChapterClick(e) {
  const t = e.target.closest('a, button');
  if (!t) return;
  if (t.classList.contains('sort-tag')) { e.preventDefault(); showSort(t.dataset.sort); return; }
  if (t.dataset.summaryCalc) { e.preventDefault(); showSummary(t.dataset.summaryCalc, t.dataset.num); return; }
  if (t.dataset.ref) { e.preventDefault(); showReference(t.dataset.ref); return; }
  if (t.dataset.poem) { e.preventDefault(); closeInfo(); hooks.showPoemByNumber(t.dataset.poem); return; }
  if (t.dataset.calc) { e.preventDefault(); closeInfo(); hooks.openCalculator(t.dataset.calc, t.dataset.num); return; }
  if (t.dataset.fig) { e.preventDefault(); showFigure(t.dataset.fig); return; }
  const href = t.getAttribute('href') || '';
  if (href.startsWith('#ref-')) {
    e.preventDefault();
    $('chapterReferences').open = true;
    const target = document.getElementById(href.slice(1));
    if (target) { target.scrollIntoView({ behavior: 'smooth', block: 'center' }); target.classList.add('flash'); setTimeout(() => target.classList.remove('flash'), 1500); }
  }
}

// ---------- Setup ----------
export function loadChapters(apiFn, hookFns) {
  api = apiFn;
  hooks = hookFns;
  loaded = loaded || api('/chapters').then(({ chapters: list }) => {
    chapters = list;
    renderList();
  }).catch(err => { loaded = null; $('chapterCount').textContent = `Could not load the chapters: ${err.message}`; });
  return loaded;
}

$('chapterFilter').addEventListener('input', renderList);
$('chapterView').addEventListener('click', onChapterClick);
$('infoModalBody').addEventListener('click', onChapterClick);
$('infoModalBody').addEventListener('click', onFlowJump);
$('infoModalClose').addEventListener('click', closeInfo);
$('infoModal').addEventListener('mousedown', (e) => { if (e.target === $('infoModal')) closeInfo(); });
document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !$('infoModal').classList.contains('hidden')) closeInfo(); });
