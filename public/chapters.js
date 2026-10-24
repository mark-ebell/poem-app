// The Chapters tab: the Essential Evidence textbook, one chapter at a time. The
// chapters are prepared by build_chapters.py; their content arrives as ready-made
// HTML whose links carry data attributes handled here (POEMs, calculators, figures,
// SORT ratings). External links (PubMed, Cochrane, web sites) are ordinary links.

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
function openInfo(title, body) {
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

// A figure (an algorithm) drawn from its boxes: each box in turn, with where its arrows lead.
function showFigure(id) {
  const fig = current && current.figures.find(f => f.id === id);
  if (!fig) return;
  const number = new Map(fig.cells.map((c, i) => [c.id, i + 1]));
  const body = el('div', 'flow');
  fig.cells.forEach((c, i) => {
    const box = el('div', `flow-cell flow-${c.type}`);
    const head = el('div', 'flow-step', `${i + 1}`);
    const label = el('div', 'flow-label');
    label.innerHTML = c.html; // prepared by build_chapters.py from escaped text
    box.append(head, label);
    if (c.paths.length) {
      const paths = el('ul', 'flow-paths');
      for (const p of c.paths) {
        const li = el('li');
        li.innerHTML = p.html || 'Next';
        const to = number.get(p.target);
        if (to) li.append(` → box ${to}`);
        paths.appendChild(li);
      }
      box.appendChild(paths);
    }
    body.appendChild(box);
  });
  for (const note of fig.notes || []) {
    const p = el('p', 'hint');
    p.innerHTML = note;
    body.appendChild(p);
  }
  openInfo(`Figure ${fig.n}. ${fig.title}`, body);
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
async function openChapter(id) {
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
    box.appendChild(content);
    view.appendChild(box);
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
      part.appendChild(content);
      body.appendChild(part);
    }
    det.appendChild(body);
    view.appendChild(det);
  }

  if (c.figures.length) {
    const det = el('details', 'chapter-section');
    det.appendChild(el('summary', '', c.figures.length === 1 ? 'Figure' : 'Figures'));
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
  if (t.dataset.poem) { e.preventDefault(); hooks.showPoemByNumber(t.dataset.poem); return; }
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
$('infoModalClose').addEventListener('click', closeInfo);
$('infoModal').addEventListener('mousedown', (e) => { if (e.target === $('infoModal')) closeInfo(); });
document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !$('infoModal').classList.contains('hidden')) closeInfo(); });
