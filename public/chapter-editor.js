// The Edit Chapter tab (editors only): review a textbook chapter with tracked changes.
//
// The chapter's parts are shown as editable blocks. Every change is tracked, whoever
// makes it: Claude's suggestions (from "Update with Claude") and the editor's own typing
// and deleting appear as insertions (<ins>, green) and deletions (<del>, struck through),
// each with its author, and each can be accepted or rejected. Citations and SORT ratings
// are single units. "Insert reference" adds a POEM or PubMed article at the cursor. The
// review is saved as you work; "Save chapter" (once every change is accepted or rejected)
// writes the chapter back as XML, removing references that are no longer cited.

const $ = id => document.getElementById(id);
const ZWSP = '​';
let api = null;
let me = 'Editor';
let chapters = [];
let current = null;      // { id, title, updated, state, ... }
let changes = [];        // the <ins>/<del> elements, in document order
let changeIndex = -1;
let dirty = false;
let saveTimer = null;
let pollTimer = null;
let savedRange = null;   // where "Insert reference" puts the citation
const undoStacks = new Map(); // part element -> earlier contents

const el = (tag, className, text) => {
  const e = document.createElement(tag);
  if (className) e.className = className;
  if (text !== undefined) e.textContent = text;
  return e;
};

// ---------- Chapter list ----------
async function loadList() {
  try {
    ({ chapters } = await api('/chapter-edit'));
  } catch (err) {
    $('ceCount').textContent = `Could not load the chapters: ${err.message}`;
    return;
  }
  renderList();
}

function renderList() {
  const q = $('ceFilter').value.trim().toLowerCase();
  const list = $('ceList');
  list.textContent = '';
  const matches = chapters.filter(c => !q || c.title.toLowerCase().includes(q));
  $('ceCount').textContent = `${matches.length} of ${chapters.length} chapter${chapters.length === 1 ? '' : 's'}`;
  for (const c of matches) {
    const li = el('li');
    const b = el('button', current && current.id === c.id ? 'current' : '');
    b.type = 'button';
    b.appendChild(el('span', 'ce-list-title', c.title));
    const tags = el('span', 'ce-list-tags');
    tags.appendChild(el('span', 'ce-tag', `Updated ${c.updated || '—'}`));
    if (c.draft && c.draft.status === 'running') tags.appendChild(el('span', 'ce-tag ce-tag-busy', 'Claude updating…'));
    else if (c.draft && c.draft.hasState) tags.appendChild(el('span', 'ce-tag ce-tag-draft', 'Review in progress'));
    if (c.edited) tags.appendChild(el('span', 'ce-tag ce-tag-edited', `Edited by ${c.edited.by}`));
    if (c.newerFile) tags.appendChild(el('span', 'ce-tag ce-tag-warn', 'Newer file from content transfer'));
    b.appendChild(tags);
    b.addEventListener('click', () => openChapter(c.id));
    li.appendChild(b);
    list.appendChild(li);
  }
}

// ---------- Opening a chapter ----------
async function openChapter(id) {
  if (current && dirty) await saveDraft();
  let data;
  try {
    data = await api(`/chapter-edit/${encodeURIComponent(id)}`);
  } catch (err) {
    alert(err.message);
    return;
  }
  current = data;
  undoStacks.clear();
  render();
  renderList();
  $('ceEditor').classList.remove('hidden');
  $('ceEditor').scrollIntoView({ behavior: 'smooth', block: 'start' });
  if (data.job && data.job.status === 'running') startPolling();
}

function setStatus(text) { $('ceStatus').textContent = text || ''; }

function render() {
  const { state } = current;
  $('ceTitle').textContent = current.title;
  $('ceUpdated').textContent = `Last updated ${current.updated || '—'}${current.versions.length ? ` · saved ${current.versions.length} time${current.versions.length === 1 ? '' : 's'} in InfoRetriever` : ''}`;
  const job = current.job;
  setStatus(job && job.message ? job.message : '');
  $('ceStale').classList.toggle('hidden', !current.staleDraft);

  // Claude's summary, and suggestions that could not be placed.
  const sum = $('ceSummary');
  sum.textContent = '';
  if (state.summary) {
    sum.appendChild(el('h3', '', 'Claude\'s summary'));
    sum.appendChild(el('p', '', state.summary));
  }
  if (state.unplaced && state.unplaced.length) {
    const det = el('details', 'ce-unplaced');
    det.appendChild(el('summary', '', `${state.unplaced.length} suggestion${state.unplaced.length === 1 ? '' : 's'} that could not be placed automatically`));
    const ul = el('ul');
    for (const u of state.unplaced) {
      const li = el('li');
      const what = u.action === 'insert_item' ? `Add to ${u.part}${u.item ? ` after ${u.item}` : ''}: “${u.text}”`
        : u.action === 'replace_text' ? `In ${u.item}, replace “${u.find}” with “${u.replace}”` : `Delete ${u.item}`;
      li.appendChild(el('div', '', what));
      li.appendChild(el('div', 'hint', u.noteText || u.note || ''));
      ul.appendChild(li);
    }
    det.appendChild(ul);
    sum.appendChild(det);
  }
  sum.classList.toggle('hidden', !sum.childNodes.length);

  // The parts, grouped by section.
  const body = $('ceBody');
  body.textContent = '';
  let section = null, sectionBody = null;
  state.parts.forEach((p, i) => {
    if (p.sectionLabel !== section) {
      section = p.sectionLabel;
      const s = el('section', 'ce-section');
      s.appendChild(el('h3', 'ce-section-title', section));
      sectionBody = el('div');
      s.appendChild(sectionBody);
      body.appendChild(s);
    }
    const part = el('div', `ce-part${p.bottomLine ? ' bottom-line' : ''}`);
    if (p.label !== p.sectionLabel) part.appendChild(el('h4', '', p.label));
    const content = el('div', `ce-content chapter-content${p.editable ? '' : ' ce-readonly'}`);
    content.innerHTML = p.html; // the chapter's own markup, from the server
    content.dataset.part = String(i);
    if (p.editable) {
      content.contentEditable = 'true';
      content.spellcheck = true;
      content.addEventListener('beforeinput', onBeforeInput);
      content.addEventListener('keydown', onKeyDown);
    } else {
      part.appendChild(el('p', 'hint', 'Shown for reference; this part is not edited here.'));
    }
    part.appendChild(content);
    sectionBody.appendChild(part);
  });
  prepareAtoms(body);
  renderReferences();
  collectChanges();
  updateButtons();
}

// Citations and SORT ratings are single, non-editable units; citations show their number.
function prepareAtoms(root) {
  root.querySelectorAll('a.cite, button.sort-tag, a.fig-link').forEach(a => { a.contentEditable = 'false'; });
  renumber();
}

function allRefs() {
  return [...current.state.references, ...current.state.newReferences];
}

function renumber() {
  const num = new Map(allRefs().map((r, i) => [r.id, i + 1]));
  const byId = new Map(allRefs().map(r => [r.id, r]));
  $('ceBody').querySelectorAll('a.cite').forEach(a => {
    const k = a.dataset.key;
    a.textContent = num.has(k) ? String(num.get(k)) : '?';
    a.title = byId.has(k) ? byId.get(k).short : 'Reference not found';
    a.href = '#';
    a.classList.toggle('cite-poem', /^poem/.test(k));
  });
}

function citedKeys() {
  const keys = new Set();
  $('ceBody').querySelectorAll('a.cite').forEach(a => { if (!a.closest('del')) keys.add(a.dataset.key); });
  return keys;
}

function renderReferences() {
  const list = $('ceRefs');
  list.textContent = '';
  const cited = citedKeys();
  const newIds = new Set(current.state.newReferences.map(r => r.id));
  allRefs().forEach((r, i) => {
    const li = el('li');
    li.value = i + 1;
    li.appendChild(el('span', '', r.short || r.citation || r.id));
    if (newIds.has(r.id)) li.appendChild(el('span', 'ce-tag ce-tag-draft', 'New'));
    if (!cited.has(r.id)) li.appendChild(el('span', 'ce-tag ce-tag-warn', 'Not cited: removed on save'));
    list.appendChild(li);
  });
}

// ---------- Tracked changes ----------
function makeMark(tag) {
  const m = document.createElement(tag);
  m.className = `tc tc-${tag}`;
  m.dataset.author = me;
  m.dataset.date = new Date().toISOString();
  m.dataset.change = `u${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
  return m;
}
const mine = node => node && node.dataset && node.dataset.author === me;
const markOf = (node, tag) => {
  for (let n = node; n && !(n.classList && n.classList.contains('ce-content')); n = n.parentNode) {
    if (n.nodeName === tag.toUpperCase()) return n;
  }
  return null;
};
const partOf = node => {
  for (let n = node; n; n = n.parentNode) if (n.classList && n.classList.contains('ce-content')) return n;
  return null;
};

function snapshot(part) {
  if (!undoStacks.has(part)) undoStacks.set(part, []);
  const stack = undoStacks.get(part);
  if (stack[stack.length - 1] !== part.innerHTML) stack.push(part.innerHTML);
  if (stack.length > 100) stack.shift();
}

function changed() {
  dirty = true;
  clearTimeout(saveTimer);
  saveTimer = setTimeout(saveDraft, 2500);
  collectChanges();
  renderReferences();
  updateButtons();
}

// Inserts text at the cursor as a tracked insertion by the current editor.
function insertTracked(text, range) {
  const part = partOf(range.startContainer);
  if (!part) return;
  range.collapse(true);
  // Never type inside a deletion: move out of it, past its end.
  const inDel = markOf(range.startContainer, 'del');
  if (inDel) range.setStartAfter(inDel), range.collapse(true);
  const inIns = markOf(range.startContainer, 'ins');
  if (inIns && mine(inIns)) {
    range.insertNode(document.createTextNode(text));
  } else {
    // Continue a tracked insertion of mine right before the cursor, or start a new one.
    const prev = range.startContainer.nodeType === 3 && range.startOffset === 0 ? range.startContainer.previousSibling
      : range.startContainer.nodeType === 1 ? range.startContainer.childNodes[range.startOffset - 1] : null;
    if (range.startContainer.nodeType === 3 && range.startOffset < range.startContainer.length && range.startOffset > 0) {
      range.startContainer.splitText(range.startOffset);
    }
    if (prev && prev.nodeName === 'INS' && mine(prev)) {
      prev.appendChild(document.createTextNode(text));
      placeCaret(prev, 'end');
      return;
    }
    const ins = makeMark('ins');
    ins.textContent = text;
    range.insertNode(ins);
    placeCaret(ins, 'end');
    return;
  }
  const sel = window.getSelection();
  sel.collapseToEnd();
}

function placeCaret(node, where) {
  const r = document.createRange();
  if (where === 'end') { r.selectNodeContents(node); r.collapse(false); } else { r.setStartBefore(node); r.collapse(true); }
  const sel = window.getSelection();
  sel.removeAllRanges();
  sel.addRange(r);
}

// Marks a range as deleted: text the editor inserted is simply removed; anything else is
// wrapped in a tracked deletion. Returns the node the cursor should sit beside.
function deleteTracked(range) {
  const part = partOf(range.commonAncestorContainer);
  if (!part) return null;
  // Text pieces and single units (citations, SORT ratings) inside the range.
  const pieces = [];
  const walker = document.createTreeWalker(part, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT, {
    acceptNode: n => {
      if (!range.intersectsNode(n)) return NodeFilter.FILTER_REJECT;
      if (n.nodeType === 1 && n.contentEditable === 'false') return NodeFilter.FILTER_ACCEPT;
      if (n.nodeType === 1) return NodeFilter.FILTER_SKIP;
      return NodeFilter.FILTER_ACCEPT;
    }
  });
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    if (n.nodeType === 1) { pieces.push(n); continue; }
    if (n.parentNode && n.parentNode.contentEditable === 'false') continue;
    let start = n === range.startContainer ? range.startOffset : 0;
    let end = n === range.endContainer ? range.endOffset : n.length;
    if (end <= start) continue;
    let node = n;
    if (end < node.length) node.splitText(end);
    if (start > 0) node = node.splitText(start);
    pieces.push(node);
  }
  let anchor = null;
  for (const p of pieces) {
    if (markOf(p, 'del')) { anchor = p; continue; } // already deleted
    const ins = markOf(p, 'ins');
    if (ins && mine(ins)) { // my own insertion: just remove it
      anchor = ins;
      p.remove();
      if (!ins.textContent.replace(new RegExp(ZWSP, 'g'), '') && !ins.querySelector('a,button')) { anchor = ins.nextSibling || ins.parentNode; ins.remove(); }
      continue;
    }
    const prev = p.previousSibling, next = p.nextSibling;
    if (prev && prev.nodeName === 'DEL' && mine(prev)) { prev.appendChild(p); anchor = mergeDeletions(prev); continue; }
    if (next && next.nodeName === 'DEL' && mine(next)) { next.insertBefore(p, next.firstChild); anchor = mergeDeletions(next); continue; }
    const del = makeMark('del');
    p.parentNode.insertBefore(del, p);
    del.appendChild(p);
    anchor = mergeDeletions(del);
  }
  return anchor;
}

// Neighbouring deletions by the same editor become one change (as a run of Backspaces does in Word).
function mergeDeletions(del) {
  const next = del.nextSibling;
  if (next && next.nodeName === 'DEL' && mine(next)) { del.append(...Array.from(next.childNodes)); next.remove(); }
  const prev = del.previousSibling;
  if (prev && prev.nodeName === 'DEL' && mine(prev)) { prev.append(...Array.from(del.childNodes)); del.remove(); del = prev; }
  del.normalize();
  return del;
}

function onBeforeInput(e) {
  const t = e.inputType;
  const part = e.currentTarget;
  if (t === 'historyUndo') { e.preventDefault(); undo(part); return; }
  if (t === 'historyRedo') { e.preventDefault(); return; }
  if (t.startsWith('format')) return; // bold, italic, ... (not tracked)
  const sel = window.getSelection();
  if (!sel.rangeCount) return;
  e.preventDefault();
  snapshot(part);
  const ranges = e.getTargetRanges ? e.getTargetRanges() : [];
  const target = () => {
    if (ranges.length) { const r = document.createRange(); r.setStart(ranges[0].startContainer, ranges[0].startOffset); r.setEnd(ranges[0].endContainer, ranges[0].endOffset); return r; }
    return sel.getRangeAt(0).cloneRange();
  };

  if (t.startsWith('insert') && t !== 'insertParagraph' && t !== 'insertLineBreak') {
    let text = e.data;
    if (text == null && e.dataTransfer) text = e.dataTransfer.getData('text/plain');
    if (!text) return;
    text = text.replace(/\s*\n\s*/g, ' ');
    const r = target();
    if (!r.collapsed) {
      const anchor = deleteTracked(r);
      if (anchor) { const c = document.createRange(); c.setStartAfter(anchor); c.collapse(true); insertTracked(text, c); }
    } else {
      insertTracked(text, r);
    }
    changed();
    return;
  }
  if (t.startsWith('delete')) {
    let r = target();
    if (r.collapsed) { // e.g. a deletion the browser gave no range for: one character
      sel.modify && sel.modify('extend', t.endsWith('Forward') ? 'forward' : 'backward', t.includes('Word') ? 'word' : 'character');
      r = sel.getRangeAt(0).cloneRange();
    }
    const anchor = deleteTracked(r);
    if (anchor && anchor.isConnected) {
      const c = document.createRange();
      if (t.endsWith('Forward')) c.setStartAfter(anchor); else c.setStartBefore(anchor);
      c.collapse(true);
      sel.removeAllRanges();
      sel.addRange(c);
    }
    changed();
    return;
  }
  if (t === 'insertParagraph' || t === 'insertLineBreak') {
    // Enter in a bullet starts a new (inserted) bullet after it.
    const li = (() => { for (let n = sel.anchorNode; n && n !== part; n = n.parentNode) if (n.nodeName === 'LI') return n; return null; })();
    if (!li) return;
    const newLi = document.createElement('li');
    const ins = makeMark('ins');
    ins.textContent = ZWSP;
    newLi.appendChild(ins);
    li.parentNode.insertBefore(newLi, li.nextSibling);
    placeCaret(ins, 'end');
    changed();
  }
}

function onKeyDown(e) {
  if ((e.metaKey || e.ctrlKey) && !e.shiftKey && e.key.toLowerCase() === 'z') { e.preventDefault(); undo(e.currentTarget); }
}

function undo(part) {
  const stack = undoStacks.get(part);
  if (!stack || !stack.length) return;
  part.innerHTML = stack.pop();
  prepareAtoms(part);
  changed();
}

// All tracked changes, in order; the current one is highlighted in the review bar.
function collectChanges() {
  changes = Array.from($('ceBody').querySelectorAll('ins.tc, del.tc'));
  if (changeIndex >= changes.length) changeIndex = changes.length - 1;
  showCurrent();
}

function showCurrent(scroll) {
  $('ceBody').querySelectorAll('.tc-current').forEach(n => n.classList.remove('tc-current'));
  const c = changes[changeIndex];
  $('ceChangeCount').textContent = changes.length
    ? (c ? `Change ${changeIndex + 1} of ${changes.length}` : `${changes.length} change${changes.length === 1 ? '' : 's'} to review`)
    : 'No changes to review';
  $('ceChangeNote').textContent = '';
  if (c) {
    c.classList.add('tc-current');
    const who = c.dataset.author || 'Unknown';
    $('ceChangeNote').textContent = `${c.nodeName === 'INS' ? 'Inserted' : 'Deleted'} by ${who}${c.dataset.note ? ` — ${c.dataset.note}` : ''}`;
    if (scroll) c.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
  ['ceAccept', 'ceReject'].forEach(id => { $(id).disabled = !c; });
  ['cePrev', 'ceNext', 'ceAcceptAll', 'ceRejectAll'].forEach(id => { $(id).disabled = !changes.length; });
}

function go(step) {
  if (!changes.length) return;
  changeIndex = changeIndex < 0 ? (step > 0 ? 0 : changes.length - 1) : (changeIndex + step + changes.length) % changes.length;
  showCurrent(true);
}

// Accepting an insertion keeps its content; accepting a deletion removes it (rejecting is
// the reverse). A bullet left empty is removed.
function resolve(node, accept) {
  const keep = (node.nodeName === 'INS') === accept;
  const li = node.closest('li');
  if (keep) node.replaceWith(...Array.from(node.childNodes)); else node.remove();
  if (li && !li.textContent.replace(new RegExp(`[\\s${ZWSP}]`, 'g'), '') && !li.querySelector('a,button')) li.remove();
}

function resolveCurrent(accept) {
  const c = changes[changeIndex];
  if (!c) return;
  snapshot(partOf(c));
  resolve(c, accept);
  changed();
  if (changeIndex >= changes.length) changeIndex = changes.length - 1;
  showCurrent(true);
}

function resolveAll(accept) {
  if (!changes.length) return;
  if (!confirm(`${accept ? 'Accept' : 'Reject'} all ${changes.length} changes?`)) return;
  $('ceBody').querySelectorAll('.ce-content[contenteditable="true"]').forEach(snapshot);
  changes.slice().reverse().forEach(n => resolve(n, accept));
  changeIndex = -1;
  changed();
}

// ---------- Saving ----------
function currentState() {
  const state = current.state;
  $('ceBody').querySelectorAll('.ce-content[contenteditable="true"]').forEach(c => {
    state.parts[Number(c.dataset.part)].html = c.innerHTML;
  });
  return state;
}

async function saveDraft() {
  clearTimeout(saveTimer);
  if (!current || !dirty) return;
  dirty = false;
  try {
    await api(`/chapter-edit/${current.id}/draft`, { method: 'PUT', body: { state: currentState() } });
    current.hasDraft = true;
    setStatus(`Review saved ${new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}.`);
    updateButtons();
  } catch (err) {
    dirty = true;
    setStatus(`Could not save the review: ${err.message}`);
  }
}

function domToTree(n) {
  if (n.nodeType === 3) return { text: n.nodeValue.replace(new RegExp(ZWSP, 'g'), '') };
  if (n.nodeType !== 1) return null;
  const data = { ...n.dataset };
  if (n.getAttribute('colspan')) data.colspan = n.getAttribute('colspan');
  return { tag: n.nodeName.toLowerCase(), cls: n.className || '', data, children: Array.from(n.childNodes).map(domToTree).filter(Boolean) };
}

async function saveChapter() {
  if (changes.length) {
    alert(`There ${changes.length === 1 ? 'is 1 change' : `are ${changes.length} changes`} still to accept or reject. Review every change before saving the chapter.`);
    return;
  }
  const state = currentState();
  const parts = [];
  $('ceBody').querySelectorAll('.ce-content[contenteditable="true"]').forEach(c => {
    const p = state.parts[Number(c.dataset.part)];
    parts.push({ section: p.section, tag: p.tag, tree: domToTree(c) });
  });
  const cited = citedKeys();
  const newReferences = state.newReferences.filter(r => cited.has(r.id));
  const removed = state.references.filter(r => !cited.has(r.id)).length;
  if (!confirm(`Save this chapter as a new version?${removed ? ` ${removed} reference${removed === 1 ? '' : 's'} no longer cited will be removed and the rest renumbered.` : ''} The chapter's "Last updated" date becomes today.`)) return;
  $('ceSave').disabled = true;
  setStatus('Saving the chapter…');
  try {
    let result;
    try {
      result = await api(`/chapter-edit/${current.id}/save`, { method: 'POST', body: { parts, newReferences } });
    } catch (err) {
      if (!/saved by someone else/.test(err.message) || !confirm(`${err.message}\n\nSave anyway?`)) throw err;
      result = await api(`/chapter-edit/${current.id}/save`, { method: 'POST', body: { parts, newReferences, overwrite: true } });
    }
    dirty = false;
    await openChapter(current.id);
    setStatus(`Chapter saved (version ${result.version}): ${result.referencesKept} references${result.referencesRemoved ? `, ${result.referencesRemoved} removed` : ''}.`);
    loadList();
  } catch (err) {
    setStatus(`Not saved: ${err.message}`);
  } finally {
    updateButtons();
  }
}

async function discardReview() {
  if (!confirm('Discard this review, including all of Claude\'s suggestions and your changes? The chapter itself is not changed.')) return;
  dirty = false;
  clearTimeout(saveTimer);
  await api(`/chapter-edit/${current.id}/draft`, { method: 'DELETE' });
  await openChapter(current.id);
  setStatus('Review discarded.');
  loadList();
}

// ---------- Claude's update ----------
async function startUpdate() {
  if (current.hasDraft && !confirm('Running an update starts a new review. Discard the review in progress first?')) return;
  if (current.hasDraft) {
    await api(`/chapter-edit/${current.id}/draft`, { method: 'DELETE' });
    current.hasDraft = false;
  }
  try {
    await api(`/chapter-edit/${current.id}/update`, { method: 'POST' });
  } catch (err) {
    setStatus(err.message);
    return;
  }
  current.job = { status: 'running', message: 'Starting…' };
  updateButtons();
  startPolling();
}

function startPolling() {
  clearInterval(pollTimer);
  const id = current.id;
  pollTimer = setInterval(async () => {
    if (!current || current.id !== id) { clearInterval(pollTimer); return; }
    let data;
    try { data = await api(`/chapter-edit/${id}/job`); } catch { return; }
    const job = data.job || {};
    setStatus(job.message || '');
    if (job.status !== 'running') {
      clearInterval(pollTimer);
      await openChapter(id);
      setStatus(job.message || '');
      loadList();
    }
  }, 4000);
}

function updateButtons() {
  const running = !!(current && current.job && current.job.status === 'running');
  $('ceUpdate').disabled = running;
  $('ceUpdate').textContent = running ? 'Claude is updating…' : 'Update with Claude';
  $('ceSave').disabled = running;
  $('ceDiscard').disabled = running || !current || !current.hasDraft;
  $('ceBody').querySelectorAll('.ce-content[contenteditable]').forEach(c => { if (c.dataset.part) c.contentEditable = running ? 'false' : 'true'; });
}

// ---------- Insert reference ----------
function rememberCursor() {
  const sel = window.getSelection();
  if (sel.rangeCount && partOf(sel.anchorNode) && partOf(sel.anchorNode).isContentEditable) savedRange = sel.getRangeAt(0).cloneRange();
}

function openRefDialog() {
  if (!savedRange || !savedRange.startContainer.isConnected) {
    alert('First click in the chapter where the citation should go.');
    return;
  }
  $('refResults').textContent = '';
  $('refSearch').value = '';
  $('refStatus').textContent = '';
  $('refModal').classList.remove('hidden');
  $('refSearch').focus();
}

async function searchRefs(e) {
  e.preventDefault();
  const q = $('refSearch').value.trim();
  const kind = $('refKind').value;
  $('refStatus').textContent = 'Searching…';
  $('refResults').textContent = '';
  let results;
  try {
    ({ results } = await api(`/chapter-edit/refs/${kind}?${new URLSearchParams({ q })}`));
  } catch (err) {
    $('refStatus').textContent = err.message;
    return;
  }
  $('refStatus').textContent = results.length ? `${results.length} found. Choose one to insert.` : 'Nothing found.';
  for (const r of results) {
    const li = el('li');
    const b = el('button', 'ref-result', r.short);
    b.type = 'button';
    b.addEventListener('click', () => insertReference(r));
    li.appendChild(b);
    $('refResults').appendChild(li);
  }
}

async function insertReference(r) {
  const state = current.state;
  let id = r.id;
  // A POEM with a PMID is cited by its POEM; fill in the article details from PubMed.
  let ref = state.references.find(x => x.id === id) || state.newReferences.find(x => x.id === id);
  if (!ref && r.poem && r.pmid) {
    const same = state.references.find(x => x.id === `pubmed${r.pmid}`);
    if (same) id = same.id, ref = same;
  }
  if (!ref) {
    ref = { ...r };
    if (r.poem && r.pmid) {
      try {
        const { results } = await api(`/chapter-edit/refs/pubmed?${new URLSearchParams({ q: r.pmid })}`);
        if (results[0]) Object.assign(ref, { authors: results[0].authors, title: results[0].title, source: results[0].source, pubdate: results[0].pubdate, volume: results[0].volume, pages: results[0].pages });
      } catch { /* the POEM's own citation is used */ }
    }
    state.newReferences.push(ref);
  }
  $('refModal').classList.add('hidden');
  const part = partOf(savedRange.startContainer);
  snapshot(part);
  const ins = makeMark('ins');
  const a = document.createElement('a');
  a.className = 'cite';
  a.dataset.key = id;
  a.contentEditable = 'false';
  ins.append(' ', a);
  const r2 = savedRange.cloneRange();
  r2.collapse(false);
  const inDel = markOf(r2.startContainer, 'del');
  if (inDel) r2.setStartAfter(inDel), r2.collapse(true);
  r2.insertNode(ins);
  placeCaret(ins, 'end');
  renumber();
  changed();
}

// ---------- Setup ----------
export function loadChapterEditor(apiFn, user) {
  api = apiFn;
  me = (user && (user.displayName || user.username)) || 'Editor';
  loadList();
}

$('ceFilter').addEventListener('input', renderList);
$('ceUpdate').addEventListener('click', startUpdate);
$('ceSave').addEventListener('click', saveChapter);
$('ceDiscard').addEventListener('click', discardReview);
$('ceDownload').addEventListener('click', () => { if (current) window.location.href = `/api/chapter-edit/${current.id}/xml`; });
$('cePrev').addEventListener('click', () => go(-1));
$('ceNext').addEventListener('click', () => go(1));
$('ceAccept').addEventListener('click', () => resolveCurrent(true));
$('ceReject').addEventListener('click', () => resolveCurrent(false));
$('ceAcceptAll').addEventListener('click', () => resolveAll(true));
$('ceRejectAll').addEventListener('click', () => resolveAll(false));
$('ceInsertRef').addEventListener('mousedown', e => e.preventDefault()); // keep the cursor where it is
$('ceInsertRef').addEventListener('click', openRefDialog);
[['ceBold', 'bold'], ['ceItalic', 'italic'], ['ceSup', 'superscript'], ['ceSub', 'subscript']].forEach(([id, cmd]) => {
  $(id).addEventListener('mousedown', e => e.preventDefault());
  $(id).addEventListener('click', () => { document.execCommand(cmd); changed(); });
});
document.addEventListener('selectionchange', rememberCursor);
$('ceBody').addEventListener('click', e => {
  const tc = e.target.closest('ins.tc, del.tc');
  if (tc) { changeIndex = changes.indexOf(tc); showCurrent(false); }
  if (e.target.closest('a')) e.preventDefault();
});
$('refForm').addEventListener('submit', searchRefs);
$('refClose').addEventListener('click', () => $('refModal').classList.add('hidden'));
window.addEventListener('beforeunload', e => { if (dirty) { saveDraft(); e.preventDefault(); } });
