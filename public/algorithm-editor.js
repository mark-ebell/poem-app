// The algorithm editor (Edit Chapter tab, editors only): change, add or remove a chapter's
// algorithms.
//
// An algorithm is a set of numbered boxes (Start, Question or Action) joined by arrows,
// each arrow with an optional label ("Yes", "Low surgical hemorrhagic risk"). The chapter
// page draws it as numbered steps, and the editor shows that drawing as a live preview
// beside the boxes, with the original image (when there is one) for comparison. The
// problems list says what would keep the algorithm from being drawn (a box no arrow
// reaches) or would read badly (a box with several unlabeled arrows shows "Next").
// Saving writes the algorithm into the chapter's XML as a new version of the chapter;
// a text review in progress is kept.

import { flowBody } from './chapters.js';

const $ = id => document.getElementById(id);
const ZWSP = '​';
const TYPES = [['start', 'Start'], ['decision', 'Question'], ['action', 'Action or outcome']];
let api = null;
let chapterId = null;
let onSaved = null;
let alg = null;       // { id, n, title, image, isNew, cells: [{ id, type, html, paths: [{ target, html }] }], notes: [html] }
let dirty = false;
let previewTimer = null;
let lastFocus = null; // the text field the formatting buttons act on

const el = (tag, className, text) => {
  const e = document.createElement(tag);
  if (className) e.className = className;
  if (text !== undefined) e.textContent = text;
  return e;
};
const num = id => Number(String(id).replace(/\D/g, '')) || 0;
// Boxes are numbered 1, 2, 3... in the order listed (and renumbered so when saved).
const pos = id => alg.cells.findIndex(c => c.id === id) + 1;
const plain = html => { const d = document.createElement('div'); d.innerHTML = html || ''; return d.textContent.replace(/\s+/g, ' ').trim(); };

// ---------- The list in the Edit Chapter tab ----------
export async function loadAlgorithms(apiFn, id, savedFn) {
  api = apiFn;
  chapterId = id;
  onSaved = savedFn;
  const box = $('ceAlgs');
  box.textContent = '';
  let data;
  try {
    data = await api(`/chapter-edit/${encodeURIComponent(id)}/algorithms`);
  } catch (err) {
    box.appendChild(el('p', 'hint', `Algorithms not loaded: ${err.message}`));
    return;
  }
  const ul = el('ul', 'ce-alg-list');
  for (const a of data.algorithms) {
    const li = el('li');
    const name = el('span', 'ce-alg-name', `Figure ${a.n}. ${a.title || '(no title)'}`);
    li.appendChild(name);
    const tag = a.kind === 'picture' ? 'image only' : a.drawable ? `${a.cells.length} boxes` : `${a.cells.length} boxes, not drawn (see problems)`;
    li.appendChild(el('span', 'hint', ` · ${tag}`));
    const btn = el('button', 'secondary', 'Edit');
    btn.type = 'button';
    btn.addEventListener('click', () => open(a));
    li.appendChild(btn);
    ul.appendChild(li);
  }
  if (!data.algorithms.length) box.appendChild(el('p', 'hint', 'This chapter has no algorithms.'));
  else box.appendChild(ul);
  const add = el('button', 'secondary', 'Add algorithm');
  add.type = 'button';
  add.addEventListener('click', () => open({
    id: data.nextId, n: null, title: '', image: '', isNew: true, links: 0,
    cells: [{ id: 'cell-1', type: 'start', html: '', paths: [] }], notes: []
  }));
  box.appendChild(add);
}

// ---------- The editor ----------
function open(a) {
  alg = JSON.parse(JSON.stringify(a));
  if (!alg.cells.length) alg.cells = [{ id: 'cell-1', type: 'start', html: '', paths: [] }];
  dirty = false;
  $('algModalTitle').textContent = alg.isNew ? 'New algorithm' : `Edit Figure ${alg.n}`;
  $('algDelete').classList.toggle('hidden', !!alg.isNew);
  $('algTitle').value = alg.title || '';
  $('algStatus').textContent = '';
  const img = $('algImage');
  img.textContent = '';
  if (alg.image) {
    const i = el('img', 'figure-image');
    i.src = alg.image;
    i.alt = 'Original figure';
    img.appendChild(i);
  } else {
    img.appendChild(el('p', 'hint', 'This algorithm has no image.'));
  }
  showSide(alg.image && alg.kind === 'picture' ? 'image' : 'preview');
  renderBoxes();
  renderNotes();
  refresh();
  $('algModal').classList.remove('hidden');
  $('algTitle').focus();
}

function close() {
  if (dirty && !confirm('Close without saving your changes to this algorithm?')) return;
  $('algModal').classList.add('hidden');
  alg = null;
  dirty = false;
}

function showSide(which) {
  $('algPreviewTab').classList.toggle('active', which === 'preview');
  $('algImageTab').classList.toggle('active', which === 'image');
  $('algPreview').classList.toggle('hidden', which !== 'preview');
  $('algImage').classList.toggle('hidden', which !== 'image');
}

// A small rich-text field (bold, italic, sub/superscript; citations and SORT ratings are
// kept as single units).
function textField(html, className, placeholder, onInput) {
  const f = el('div', `alg-text ${className || ''}`);
  f.contentEditable = 'true';
  f.spellcheck = true;
  f.innerHTML = html || '';
  f.dataset.placeholder = placeholder || '';
  f.querySelectorAll('a.cite, button.sort-tag, a.fig-link, a.table-link').forEach(a => { a.contentEditable = 'false'; });
  f.addEventListener('focus', () => { lastFocus = f; });
  f.addEventListener('input', () => { onInput(f.innerHTML); changed(); });
  f.addEventListener('click', e => { if (e.target.closest('a')) e.preventDefault(); });
  f.addEventListener('keydown', e => {
    if (e.key === 'Enter' && f.classList.contains('alg-oneline')) e.preventDefault();
  });
  return f;
}

function boxName(c) {
  const t = plain(c.html);
  return `Box ${pos(c.id)}${t ? `: ${t.length > 50 ? `${t.slice(0, 50)}…` : t}` : ''}`;
}

function renderBoxes() {
  const list = $('algBoxes');
  list.textContent = '';
  alg.cells.sort((a, b) => num(a.id) - num(b.id));
  for (const c of alg.cells) {
    const card = el('div', `alg-box alg-${c.type}`);
    card.id = `alg-box-${num(c.id)}`;
    const head = el('div', 'alg-box-head');
    head.appendChild(el('span', 'alg-box-num', String(pos(c.id))));
    const type = el('select');
    type.setAttribute('aria-label', 'Box type');
    for (const [v, label] of TYPES) { const o = el('option', '', label); o.value = v; type.appendChild(o); }
    type.value = c.type;
    type.addEventListener('change', () => { c.type = type.value; card.className = `alg-box alg-${c.type}`; changed(); });
    head.appendChild(type);
    const after = el('button', 'secondary', '+ Box after');
    after.type = 'button';
    after.title = 'Add a new box with an arrow from this one';
    after.addEventListener('click', () => addBox(c));
    head.appendChild(after);
    const del = el('button', 'secondary alg-del', 'Delete box');
    del.type = 'button';
    del.addEventListener('click', () => deleteBox(c));
    head.appendChild(del);
    card.appendChild(head);
    card.appendChild(textField(c.html, '', 'Box text', h => { c.html = h; refreshTargets(); }));

    const arrows = el('div', 'alg-arrows');
    c.paths.forEach((p, i) => arrows.appendChild(arrowRow(c, p, i)));
    card.appendChild(arrows);
    const addArrow = el('button', 'secondary alg-add-arrow', '+ Arrow');
    addArrow.type = 'button';
    addArrow.addEventListener('click', () => {
      const other = alg.cells.find(x => x.id !== c.id && !c.paths.some(p => p.target === x.id));
      if (!other) { alert('Add another box first.'); return; }
      c.paths.push({ target: other.id, html: '' });
      renderBoxes();
      changed();
    });
    card.appendChild(addArrow);
    list.appendChild(card);
  }
}

function arrowRow(c, p, i) {
  const row = el('div', 'alg-arrow');
  row.appendChild(el('span', 'alg-arrow-sign', '→'));
  const label = textField(p.html, 'alg-oneline', 'Label (e.g. Yes)', h => { p.html = h; });
  label.setAttribute('aria-label', 'Arrow label');
  row.appendChild(label);
  const target = el('select', 'alg-target');
  target.setAttribute('aria-label', 'Arrow leads to');
  fillTargets(target, c, p.target);
  target.addEventListener('change', () => { p.target = target.value; changed(); });
  row.appendChild(target);
  const rm = el('button', 'secondary', '×');
  rm.type = 'button';
  rm.title = 'Remove this arrow';
  rm.addEventListener('click', () => { c.paths.splice(i, 1); renderBoxes(); changed(); });
  row.appendChild(rm);
  return row;
}

function fillTargets(select, from, value) {
  select.textContent = '';
  for (const x of alg.cells) {
    if (x.id === from.id) continue;
    const o = el('option', '', boxName(x));
    o.value = x.id;
    select.appendChild(o);
  }
  select.value = value;
}

// Box text changed: the arrows' target menus show box text, so refresh them.
function refreshTargets() {
  document.querySelectorAll('#algBoxes .alg-box').forEach(card => {
    const c = alg.cells.find(x => `alg-box-${num(x.id)}` === card.id);
    card.querySelectorAll('select.alg-target').forEach((s, i) => fillTargets(s, c, c.paths[i].target));
  });
}

function addBox(from) {
  const id = `cell-${Math.max(0, ...alg.cells.map(c => num(c.id))) + 1}`;
  alg.cells.push({ id, type: 'action', html: '', paths: [] });
  if (from) from.paths.push({ target: id, html: '' });
  renderBoxes();
  changed();
  const card = $(`alg-box-${num(id)}`);
  if (card) { card.scrollIntoView({ behavior: 'smooth', block: 'center' }); card.querySelector('.alg-text').focus(); }
}

function deleteBox(c) {
  const into = alg.cells.filter(x => x.paths.some(p => p.target === c.id)).length;
  if (alg.cells.length === 1) { alert('An algorithm needs at least one box.'); return; }
  if (!confirm(`Delete box ${pos(c.id)}${into ? ` and the ${into === 1 ? 'arrow' : `${into} arrows`} leading to it` : ''}?`)) return;
  alg.cells = alg.cells.filter(x => x !== c);
  for (const x of alg.cells) x.paths = x.paths.filter(p => p.target !== c.id);
  renderBoxes();
  changed();
}

function renderNotes() {
  const box = $('algNotes');
  box.textContent = '';
  alg.notes.forEach((n, i) => {
    const row = el('div', 'alg-note');
    row.appendChild(textField(n, '', 'Footnote (source, abbreviations...)', h => { alg.notes[i] = h; }));
    const rm = el('button', 'secondary', '×');
    rm.type = 'button';
    rm.title = 'Remove this footnote';
    rm.addEventListener('click', () => { alg.notes.splice(i, 1); renderNotes(); changed(); });
    row.appendChild(rm);
    box.appendChild(row);
  });
}

function changed() {
  dirty = true;
  clearTimeout(previewTimer);
  previewTimer = setTimeout(refresh, 250);
}

// ---------- Problems and preview ----------
function problems() {
  const out = [];
  const errors = [];
  const ids = new Set(alg.cells.map(c => c.id));
  const starts = alg.cells.filter(c => c.type === 'start');
  if (starts.length !== 1) errors.push(starts.length ? `There are ${starts.length} Start boxes (${starts.map(c => pos(c.id)).join(', ')}); make one of them the Start.` : 'No box is the Start box.');
  if (!$('algTitle').value.trim()) errors.push('The algorithm needs a title.');
  for (const c of alg.cells) {
    if (!plain(c.html)) out.push(`Box ${pos(c.id)} has no text.`);
    const unl = c.paths.filter(p => !plain(p.html));
    if (c.paths.length > 1 && unl.length) out.push(`Box ${pos(c.id)} has ${c.paths.length} arrows but ${unl.length === 1 ? 'one has' : `${unl.length} have`} no label; the page would show "Next".`);
    const seen = new Set();
    for (const p of c.paths) {
      if (!ids.has(p.target)) errors.push(`An arrow from box ${pos(c.id)} leads nowhere.`);
      if (seen.has(p.target)) out.push(`Box ${pos(c.id)} has two arrows to box ${pos(p.target)}.`);
      seen.add(p.target);
    }
  }
  if (starts.length === 1) {
    const seen = new Set([starts[0].id]);
    const queue = [starts[0]];
    while (queue.length) {
      for (const p of queue.shift().paths) {
        const t = alg.cells.find(x => x.id === p.target);
        if (t && !seen.has(t.id)) { seen.add(t.id); queue.push(t); }
      }
    }
    const lost = alg.cells.filter(c => !seen.has(c.id));
    if (lost.length) errors.push(`No arrows lead from the Start to box${lost.length === 1 ? '' : 'es'} ${lost.map(c => pos(c.id)).join(', ')}, so the page would show only the image. Add arrows to ${lost.length === 1 ? 'it' : 'them'}, or delete ${lost.length === 1 ? 'it' : 'them'}.`);
  }
  return { errors, warnings: out };
}

function refresh() {
  if (!alg) return;
  const { errors, warnings } = problems();
  const p = $('algProblems');
  p.textContent = '';
  if (errors.length || warnings.length) {
    const ul = el('ul');
    for (const e of errors) ul.appendChild(el('li', 'alg-error', e));
    for (const w of warnings) ul.appendChild(el('li', 'alg-warning', w));
    p.appendChild(ul);
  } else {
    p.appendChild(el('p', 'hint', 'No problems found.'));
  }
  const prev = $('algPreview');
  prev.textContent = '';
  const fig = { id: alg.id, title: $('algTitle').value, image: '', cells: alg.cells.map(c => ({ ...c, paths: c.paths.map(x => ({ ...x })) })), notes: alg.notes.filter(n => plain(n)) };
  try {
    prev.appendChild(flowBody(fig));
  } catch (err) {
    prev.appendChild(el('p', 'hint', `Preview not available: ${err.message}`));
  }
}

// ---------- Saving ----------
function domToTree(n) {
  if (n.nodeType === 3) return { text: n.nodeValue.replace(new RegExp(ZWSP, 'g'), '') };
  if (n.nodeType !== 1) return null;
  return { tag: n.nodeName.toLowerCase(), cls: n.className || '', data: { ...n.dataset }, children: Array.from(n.childNodes).map(domToTree).filter(Boolean) };
}
const treeOf = html => { const d = document.createElement('div'); d.innerHTML = html || ''; return domToTree(d); };

async function save() {
  const { errors } = problems();
  if (errors.length) { alert(`Fix these first:\n\n${errors.join('\n')}`); return; }
  const body = {
    title: $('algTitle').value.trim(),
    // Saved as cell-1, cell-2, ... in the order listed, matching the numbers shown.
    cells: alg.cells.map(c => ({ id: `cell-${pos(c.id)}`, type: c.type, tree: treeOf(c.html), paths: c.paths.map(p => ({ target: `cell-${pos(p.target)}`, tree: treeOf(p.html) })) })),
    notes: alg.notes.filter(n => plain(n)).map(treeOf)
  };
  $('algSave').disabled = true;
  $('algStatus').textContent = 'Saving…';
  try {
    const r = await api(`/chapter-edit/${encodeURIComponent(chapterId)}/algorithms/${encodeURIComponent(alg.id)}`, { method: 'PUT', body });
    dirty = false;
    $('algModal').classList.add('hidden');
    alg = null;
    if (onSaved) onSaved(`Algorithm saved (chapter version ${r.version}).`);
  } catch (err) {
    $('algStatus').textContent = `Not saved: ${err.message}`;
  } finally {
    $('algSave').disabled = false;
  }
}

async function remove() {
  if (alg.links) { alert(`The chapter's text links to this algorithm in ${alg.links} place${alg.links === 1 ? '' : 's'}. Remove those links in the review, save the chapter, and then delete the algorithm.`); return; }
  if (!confirm(`Delete Figure ${alg.n} from this chapter? The figures after it are renumbered. (Earlier versions of the chapter are kept.)`)) return;
  try {
    const r = await api(`/chapter-edit/${encodeURIComponent(chapterId)}/algorithms/${encodeURIComponent(alg.id)}`, { method: 'DELETE' });
    dirty = false;
    $('algModal').classList.add('hidden');
    alg = null;
    if (onSaved) onSaved(`Algorithm deleted (chapter version ${r.version}).`);
  } catch (err) {
    $('algStatus').textContent = err.message;
  }
}

$('algClose').addEventListener('click', close);
$('algSave').addEventListener('click', save);
$('algDelete').addEventListener('click', remove);
$('algAddBox').addEventListener('click', () => addBox(null));
$('algAddNote').addEventListener('click', () => { alg.notes.push(''); renderNotes(); const f = $('algNotes').lastChild; if (f) f.querySelector('.alg-text').focus(); });
$('algTitle').addEventListener('input', changed);
$('algPreviewTab').addEventListener('click', () => showSide('preview'));
$('algImageTab').addEventListener('click', () => showSide('image'));
[['algBold', 'bold'], ['algItalic', 'italic'], ['algSup', 'superscript'], ['algSub', 'subscript']].forEach(([id, cmd]) => {
  $(id).addEventListener('mousedown', e => e.preventDefault());
  $(id).addEventListener('click', () => { if (lastFocus && lastFocus.isConnected) { document.execCommand(cmd); lastFocus.dispatchEvent(new Event('input')); } });
});
// SORT ratings: inserted at the cursor as a single unit.
['A', 'B', 'C'].forEach(r => {
  $(`algSort${r}`).addEventListener('mousedown', e => e.preventDefault());
  $(`algSort${r}`).addEventListener('click', () => {
    const sel = window.getSelection();
    if (!lastFocus || !sel.rangeCount || !lastFocus.contains(sel.anchorNode)) { alert('Click in a box first, where the SORT rating should go.'); return; }
    const b = el('button', 'sort-tag', `(SORT ${r})`);
    b.type = 'button';
    b.dataset.sort = r;
    b.contentEditable = 'false';
    const range = sel.getRangeAt(0);
    range.deleteContents();
    range.insertNode(b);
    range.setStartAfter(b);
    range.collapse(true);
    sel.removeAllRanges();
    sel.addRange(range);
    lastFocus.dispatchEvent(new Event('input'));
  });
});
// The preview's choice buttons scroll to their step.
$('algPreview').addEventListener('click', e => {
  const b = e.target.closest('.flow-jump');
  if (!b) return;
  const t = $('algPreview').querySelector(`#flow-step-${b.dataset.step}`);
  if (t) t.scrollIntoView({ behavior: 'smooth', block: 'start' });
});
$('algModal').addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
