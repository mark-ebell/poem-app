// The Derm Expert tab: a visual guide to diagnosing skin conditions (routes/derm.js).
// Step 1: the main type of lesion (primary morphology). Step 2 (and sometimes 3 and 4):
// its features. Then the conditions that fit, and each condition's photos, with links to
// its chapter and to a search of InfoRetriever. "Find a condition" skips the steps.

import { t as tr } from './i18n.js';

const $ = id => document.getElementById(id);
let api = null;
let hooks = {};
let data = null;      // { morphologies, conditions }
let loading = null;
let trail = [];       // the steps chosen: morphology node, then characteristic nodes
let current = null;   // the open condition: { id, list (condition ids to step through), image }
let typicalOnly = false;

const el = (tag, className, text) => {
  const e = document.createElement(tag);
  if (className) e.className = className;
  if (text !== undefined) e.textContent = text;
  return e;
};
const imgUrl = file => `/api/derm/images/${encodeURIComponent(file)}`;
const photosOf = id => {
  const imgs = data.conditions[id].images;
  return typicalOnly && imgs.some(i => i.typical) ? imgs.filter(i => i.typical) : imgs;
};

export function loadDerm(apiFn, hookFns) {
  api = apiFn;
  hooks = hookFns || {};
  loading = loading || api('/derm').then(d => { data = d; render(); })
    .catch(err => { loading = null; $('dermBody').textContent = tr('Could not load the Derm Expert: {msg}', { msg: tr(err.message) }); });
  return loading;
}

// ---------- Drawing ----------
function render() {
  if (!data) return;
  const body = $('dermBody');
  body.textContent = '';
  $('dermFind').closest('.derm-find').classList.toggle('hidden', !!current || trail.length > 0);
  if ($('dermFind').value.trim() && !current && !trail.length) return renderFound(body);
  if (current) return renderCondition(body);
  if (!trail.length) return renderMorphologies(body);
  renderStep(body);
}

function breadcrumb(box) {
  const nav = el('nav', 'derm-trail');
  nav.setAttribute('aria-label', tr('Steps chosen'));
  const crumb = (label, onClick) => {
    const b = el('button', 'link-btn', label);
    b.type = 'button';
    b.addEventListener('click', onClick);
    nav.appendChild(b);
  };
  crumb(tr('All lesion types'), () => { trail = []; current = null; render(); });
  trail.forEach((node, i) => {
    nav.appendChild(el('span', 'derm-sep', '›'));
    if (i === trail.length - 1 && !current) nav.appendChild(el('span', 'derm-here', node.name));
    else crumb(node.name, () => { trail = trail.slice(0, i + 1); current = null; render(); });
  });
  box.appendChild(nav);
}

function renderMorphologies(body) {
  body.appendChild(el('p', 'hint', tr('Choose the main type of lesion.')));
  const grid = el('div', 'derm-morphs');
  for (const m of data.morphologies) {
    const b = el('button', 'derm-morph');
    b.type = 'button';
    if (m.image) {
      const img = el('img');
      img.src = imgUrl(m.image);
      img.alt = '';
      img.loading = 'lazy';
      b.appendChild(img);
    }
    b.appendChild(el('span', 'derm-morph-name', m.name));
    if (m.description) b.appendChild(el('span', 'derm-morph-desc', m.description));
    b.addEventListener('click', () => { trail = [m]; render(); });
    grid.appendChild(b);
  }
  body.appendChild(grid);
}

function renderStep(body) {
  breadcrumb(body);
  const node = trail[trail.length - 1];
  if (trail.length === 1 && node.description) body.appendChild(el('p', 'derm-desc', node.description));
  if (node.children) {
    body.appendChild(el('p', 'hint', tr('Choose the feature that best describes the lesions.')));
    const ul = el('ul', 'tools-items');
    for (const child of node.children) {
      const li = el('li');
      const b = el('button', 'tools-item');
      b.type = 'button';
      b.appendChild(el('span', 'tools-item-title', child.name));
      b.addEventListener('click', () => { trail = [...trail, child]; render(); });
      li.appendChild(b);
      ul.appendChild(li);
    }
    body.appendChild(ul);
    return;
  }
  body.appendChild(el('p', 'hint', tr('These conditions fit the features chosen. Choose one to see its photos.')));
  body.appendChild(typicalToggle());
  conditionList(body, node.conditions);
}

function typicalToggle() {
  const label = el('label', 'derm-typical');
  const box = el('input');
  box.type = 'checkbox';
  box.checked = typicalOnly;
  box.addEventListener('change', () => { typicalOnly = box.checked; if (current) current.image = 0; render(); });
  label.append(box, ' ', tr('Typical photos only'));
  return label;
}

function conditionList(body, ids) {
  const sorted = [...ids].sort((a, b) => data.conditions[a].name.localeCompare(data.conditions[b].name));
  const ul = el('ul', 'tools-items derm-conditions');
  for (const id of sorted) {
    const c = data.conditions[id];
    const photos = photosOf(id);
    const li = el('li');
    const b = el('button', 'tools-item derm-condition');
    b.type = 'button';
    const thumb = el('img');
    thumb.src = imgUrl(photos[0].file);
    thumb.alt = '';
    thumb.loading = 'lazy';
    const text = el('span', 'derm-condition-text');
    text.appendChild(el('span', 'tools-item-title', c.name));
    text.appendChild(el('span', 'tools-item-sub', photos.length === 1 ? tr('1 photo') : tr('{n} photos', { n: photos.length })));
    b.append(thumb, text);
    b.addEventListener('click', () => openCondition(id, sorted));
    li.appendChild(b);
    ul.appendChild(li);
  }
  body.appendChild(ul);
}

// "Find a condition": every condition whose name has the words typed.
function renderFound(body) {
  const words = $('dermFind').value.trim().toLowerCase().split(/\s+/);
  const ids = Object.keys(data.conditions).filter(id => {
    const name = data.conditions[id].name.toLowerCase();
    return words.every(w => name.includes(w));
  });
  if (!ids.length) { body.appendChild(el('p', 'hint', tr('No condition matches.'))); return; }
  conditionList(body, ids);
}

function openCondition(id, list) {
  current = { id, list, image: 0 };
  render();
  $('dermBody').scrollIntoView({ block: 'start' });
}

function renderCondition(body) {
  if (trail.length) breadcrumb(body);
  else {
    const back = el('button', 'link-btn', tr('Back to the list'));
    back.type = 'button';
    back.addEventListener('click', () => { current = null; render(); });
    body.appendChild(back);
  }
  const c = data.conditions[current.id];
  const photos = photosOf(current.id);
  current.image = Math.min(current.image, photos.length - 1);
  const pos = current.list.indexOf(current.id);

  const head = el('div', 'derm-cond-head');
  head.appendChild(el('h3', 'derm-cond-name', c.name));
  if (current.list.length > 1) {
    const nav = el('div', 'derm-cond-nav');
    const step = (label, to) => {
      const b = el('button', 'secondary', label);
      b.type = 'button';
      b.addEventListener('click', () => { current = { ...current, id: current.list[to], image: 0 }; render(); });
      return b;
    };
    nav.append(step(tr('‹ Previous condition'), (pos - 1 + current.list.length) % current.list.length),
      el('span', 'hint', tr('{n} of {total}', { n: pos + 1, total: current.list.length })),
      step(tr('Next condition ›'), (pos + 1) % current.list.length));
    head.appendChild(nav);
  }
  body.appendChild(head);

  const links = el('div', 'derm-links');
  if (c.chapter) {
    const b = el('button', 'link-btn', tr('Chapter: {title}', { title: c.chapter.title }));
    b.type = 'button';
    b.addEventListener('click', () => hooks.openChapter && hooks.openChapter(c.chapter.id));
    links.appendChild(b);
  }
  const s = el('button', 'link-btn', tr('Search InfoRetriever for {name}', { name: c.name.replace(/\s*\(.*?\)\s*/g, ' ').trim() }));
  s.type = 'button';
  s.addEventListener('click', () => hooks.search && hooks.search(c.name.replace(/\s*\(.*?\)\s*/g, ' ').trim()));
  links.appendChild(s);
  body.appendChild(links);

  if (c.images.some(i => i.typical) && c.images.some(i => !i.typical)) body.appendChild(typicalToggle());

  const photo = photos[current.image];
  const viewer = el('figure', 'derm-viewer');
  const big = el('img', 'derm-photo');
  big.src = imgUrl(photo.file);
  big.alt = tr('{name}, photo {n} of {total}', { name: c.name, n: current.image + 1, total: photos.length });
  viewer.appendChild(big);
  const cap = el('figcaption', 'derm-caption');
  if (photos.length > 1) {
    const prev = el('button', 'secondary', '‹');
    prev.type = 'button';
    prev.setAttribute('aria-label', tr('Previous photo'));
    prev.addEventListener('click', () => showImage(current.image - 1));
    const next = el('button', 'secondary', '›');
    next.type = 'button';
    next.setAttribute('aria-label', tr('Next photo'));
    next.addEventListener('click', () => showImage(current.image + 1));
    cap.append(prev, el('span', 'derm-count', tr('{n} of {total}', { n: current.image + 1, total: photos.length })), next);
  }
  if (photo.credit) cap.appendChild(el('span', 'derm-credit', tr('Photo courtesy of {who}', { who: photo.credit })));
  viewer.appendChild(cap);
  body.appendChild(viewer);

  if (photos.length > 1) {
    const strip = el('div', 'derm-thumbs');
    photos.forEach((p, i) => {
      const b = el('button', 'derm-thumb' + (i === current.image ? ' active' : ''));
      b.type = 'button';
      b.setAttribute('aria-label', tr('Photo {n}', { n: i + 1 }));
      const img = el('img');
      img.src = imgUrl(p.file);
      img.alt = '';
      img.loading = 'lazy';
      b.appendChild(img);
      b.addEventListener('click', () => showImage(i));
      strip.appendChild(b);
    });
    body.appendChild(strip);
  }
}

function showImage(i) {
  const n = photosOf(current.id).length;
  current.image = (i + n) % n;
  render();
}

// ---------- Events ----------
$('dermFind').addEventListener('input', () => render());
document.addEventListener('keydown', (e) => {
  // Left and right arrows step through the photos while a condition is open.
  if (!current || $('tabDerm').classList.contains('hidden')) return;
  if (e.target.closest && e.target.closest('input, textarea, select, [contenteditable="true"]')) return;
  if (document.querySelector('.modal-backdrop:not(.hidden)')) return;
  if (e.key === 'ArrowLeft') { showImage(current.image - 1); e.preventDefault(); }
  if (e.key === 'ArrowRight') { showImage(current.image + 1); e.preventDefault(); }
});
