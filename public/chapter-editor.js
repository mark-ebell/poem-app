// The Edit Chapter tab (editors only): review a textbook chapter with tracked changes.
//
// The chapter's parts are shown as editable blocks. Every change is tracked, whoever
// makes it: Claude's suggestions (from "Update with Claude") and the editor's own typing
// and deleting appear as insertions (<ins>, green) and deletions (<del>, struck through),
// each with its author, and each can be accepted or rejected. Citations and SORT ratings
// are single units. Tables can be added and edited (rows and columns added or deleted),
// each such change tracked as a whole row, column or table (class "tc tc-ins" / "tc tc-del"
// on the element; one change can span several cells, sharing its data-change id).
// "Insert reference" adds a POEM or PubMed article at the cursor. The
// review is saved as you work; "Save chapter" (once every change is accepted or rejected)
// writes the chapter back as XML, removing references that are no longer cited.

const $ = id => document.getElementById(id);
const ZWSP = '​';
let api = null;
let me = 'Editor';
let chapters = [];
let editors = [];        // [{ username, name }]
let myUsername = '';
let monthly = null;      // this month's updates (chapter-batch.js batchStatus)
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const busy = job => !!job && (job.status === 'running' || job.status === 'queued');
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
    ({ chapters, editors, me: myUsername, monthly } = await api('/chapter-edit'));
  } catch (err) {
    $('ceCount').textContent = `Could not load the chapters: ${err.message}`;
    return;
  }
  renderMonthly();
  renderList();
}

// The monthly updates: this month's chapters, recent runs, and running this month's now.
function renderMonthly() {
  const box = $('ceMonthly');
  box.textContent = '';
  if (!monthly) return;
  const head = el('p');
  head.appendChild(el('strong', '', `${monthly.monthName}: `));
  head.appendChild(document.createTextNode(`${monthly.due} chapter${monthly.due === 1 ? '' : 's'} waiting for this month's update` +
    `${monthly.skipped ? ` (${monthly.skipped} more already updated or under review)` : ''}. ` +
    (monthly.auto ? 'The monthly update starts by itself at the start of each month.' : 'The monthly update is started by hand (automatic start is off).')));
  box.appendChild(head);
  const run = el('button', '', monthly.active ? 'This month\'s update is under way' : 'Run this month\'s update now');
  run.type = 'button';
  run.disabled = monthly.active || !monthly.due;
  run.addEventListener('click', startMonthly);
  box.appendChild(run);
  if (monthly.batches.length) {
    const ul = el('ul', 'ce-batches');
    for (const b of monthly.batches.slice(0, 4)) {
      const when = new Date(b.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' });
      const status = { gathering: 'gathering evidence', submitted: 'with Claude', collected: 'finished', failed: 'failed' }[b.status] || b.status;
      ul.appendChild(el('li', '', `${b.monthName} (started ${when} by ${b.createdBy || '—'}): ${status}. ${b.message || ''}`));
    }
    box.appendChild(ul);
  }
}

async function startMonthly() {
  if (!confirm(`Send this month's ${monthly.due} chapter${monthly.due === 1 ? '' : 's'} to Claude now? Gathering the evidence takes a few minutes; Claude's suggestions usually arrive within an hour (at most a day), and the editors are emailed when they do.`)) return;
  try {
    await api('/chapter-edit/batches', { method: 'POST' });
  } catch (err) {
    alert(err.message);
  }
  await loadList();
  if (current) await openChapter(current.id); // it may be one of them
}

function renderList() {
  const q = $('ceFilter').value.trim().toLowerCase();
  const show = $('ceShow').value;
  const month = monthly ? Number(monthly.month.slice(5, 7)) : 0;
  const list = $('ceList');
  list.textContent = '';
  const matches = chapters.filter(c => (!q || c.title.toLowerCase().includes(q)) &&
    (show === 'all' || (show === 'month' && c.plan.month === month) || (show === 'mine' && c.plan.editor === myUsername) ||
      (show === 'review' && c.draft && (c.draft.hasState || busy({ status: c.draft.status })))));
  $('ceCount').textContent = `${matches.length} of ${chapters.length} chapter${chapters.length === 1 ? '' : 's'}`;
  for (const c of matches) {
    const li = el('li');
    const b = el('button', current && current.id === c.id ? 'current' : '');
    b.type = 'button';
    b.appendChild(el('span', 'ce-list-title', c.title));
    const tags = el('span', 'ce-list-tags');
    tags.appendChild(el('span', 'ce-tag', `Updated ${c.updated || '—'}`));
    if (c.plan.month) tags.appendChild(el('span', 'ce-tag', `Due ${MONTHS[c.plan.month - 1].slice(0, 3)}`));
    if (c.plan.editor) tags.appendChild(el('span', 'ce-tag', (editors.find(e => e.username === c.plan.editor) || {}).name || c.plan.editor));
    if (c.draft && c.draft.status === 'running') tags.appendChild(el('span', 'ce-tag ce-tag-busy', 'Claude updating…'));
    else if (c.draft && c.draft.status === 'queued') tags.appendChild(el('span', 'ce-tag ce-tag-busy', 'In monthly update…'));
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
  renderPlan();
  renderList();
  $('ceEditor').classList.remove('hidden');
  $('ceEditor').scrollIntoView({ behavior: 'smooth', block: 'start' });
  if (busy(data.job)) startPolling();
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
    const u = state.update;
    if (u) {
      const when = new Date(u.at).toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric' });
      sum.appendChild(el('p', 'hint', `${u.how === 'monthly batch' ? 'Monthly update' : 'Update'} of ${when} · ${u.model} · rules ${u.rulesVersion} · PubMed search: ${u.searchTerms}`));
    }
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
    if (p.editable && !p.html) content.innerHTML = `<ul><li>${ZWSP}</li></ul>`; // a subheading not yet in the chapter
    content.dataset.part = String(i);
    content.dataset.tag = p.tag;
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
  root.querySelectorAll('.tc-del:not(del)').forEach(e => { e.contentEditable = 'false'; });
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
  $('ceBody').querySelectorAll('a.cite').forEach(a => { if (!a.closest('del, .tc-del')) keys.add(a.dataset.key); });
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
const newChangeId = () => `u${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
// Marks an element (a row, cell or table) as a tracked insertion or deletion.
function track(e, kind, change = newChangeId()) {
  e.classList.add('tc', `tc-${kind}`);
  e.dataset.author = me;
  e.dataset.date = new Date().toISOString();
  e.dataset.change = change;
  return e;
}
function makeMark(tag) {
  return track(document.createElement(tag), tag);
}
const isIns = n => n.classList.contains('tc-ins');
// A tracked row, column cell or table (not an inline <ins>/<del>) around the node, or null.
const structural = node => {
  for (let n = node && node.nodeType === 3 ? node.parentNode : node; n && !(n.classList && n.classList.contains('ce-content')); n = n.parentNode) {
    if (n.classList && n.classList.contains('tc') && n.nodeName !== 'INS' && n.nodeName !== 'DEL') return n;
  }
  return null;
};
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
  const st = structural(range.startContainer);
  if (st && !isIns(st)) return; // a deleted row, column or table
  if (st && mine(st) && !markOf(range.startContainer, 'del')) { // a row or table I added: plain text
    const t = document.createTextNode(text);
    range.insertNode(t);
    placeCaret(t, 'end');
    return;
  }
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
    const st = structural(p);
    if (st && !isIns(st)) { anchor = p; continue; } // in a deleted row, column or table
    if (st && mine(st) && !markOf(p, 'ins')) { anchor = p.previousSibling || p.parentNode; p.remove(); continue; } // in a row I added
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
  if (e.key === 'Tab' && !e.metaKey && !e.ctrlKey && !e.altKey) { // in a table: the next (or previous) cell, as in Word
    const sel = window.getSelection();
    const n = sel.anchorNode && (sel.anchorNode.nodeType === 1 ? sel.anchorNode : sel.anchorNode.parentNode);
    const cell = n && n.closest('td, th');
    if (!cell || !e.currentTarget.contains(cell)) return;
    e.preventDefault();
    const cells = Array.from(cell.closest('table').querySelectorAll('td, th')).filter(c => !c.closest('.tc-del'));
    const i = cells.indexOf(cell) + (e.shiftKey ? -1 : 1);
    if (i >= cells.length) { rememberCursor(); addRow(); return; }
    if (i >= 0) placeCaret(cells[i], 'end');
  }
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
  const seen = new Set();
  changes = Array.from($('ceBody').querySelectorAll('.tc')).filter(n => {
    const id = n.dataset.change;
    if (!id) return true;
    if (seen.has(id)) return false;
    seen.add(id);
    return true;
  });
  if (changeIndex >= changes.length) changeIndex = changes.length - 1;
  showCurrent();
}

function showCurrent(scroll) {
  $('ceBody').querySelectorAll('.tc-current').forEach(n => n.classList.remove('tc-current'));
  const c = changes[changeIndex];
  const what = n => ({ TR: 'row', TD: 'column', TH: 'column', DIV: 'table', TABLE: 'table' })[n.nodeName];
  $('ceChangeCount').textContent = changes.length
    ? (c ? `Change ${changeIndex + 1} of ${changes.length}` : `${changes.length} change${changes.length === 1 ? '' : 's'} to review`)
    : 'No changes to review';
  $('ceChangeNote').textContent = '';
  if (c) {
    sameChange(c).forEach(n => n.classList.add('tc-current'));
    const who = c.dataset.author || 'Unknown';
    const kind = what(c) ? ` ${what(c)}` : '';
    $('ceChangeNote').textContent = `${isIns(c) ? 'Inserted' : 'Deleted'}${kind} by ${who}${c.dataset.note ? ` — ${c.dataset.note}` : ''}`;
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
// A tracked row, column or table is kept (its marks removed) or removed as a whole; a
// table left without rows, or a row without cells, is removed.
function sameChange(node) {
  const id = node.dataset.change;
  const part = partOf(node) || $('ceBody');
  return id ? Array.from(part.querySelectorAll(`.tc[data-change="${CSS.escape(id)}"]`)) : [node];
}
function resolve(node, accept) {
  for (const n of sameChange(node)) resolveOne(n, accept);
}
function resolveOne(node, accept) {
  if (!node.isConnected) return;
  const keep = isIns(node) === accept;
  if (node.nodeName !== 'INS' && node.nodeName !== 'DEL') {
    const table = node.closest('table');
    if (keep) {
      node.classList.remove('tc', 'tc-ins', 'tc-del', 'tc-current');
      if (!node.className) node.removeAttribute('class');
      ['author', 'date', 'note', 'change'].forEach(k => delete node.dataset[k]);
      node.removeAttribute('contenteditable');
    } else {
      const row = node.closest('tr');
      node.remove();
      if (row && row !== node && !row.querySelector('td, th')) row.remove();
      if (table && table !== node && !table.querySelector('tr')) (table.closest('.chapter-table-wrap') || table).remove();
    }
    return;
  }
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
  prepareAtoms($('ceBody'));
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
    if (!busy(job)) {
      clearInterval(pollTimer);
      await openChapter(id);
      setStatus(job.message || '');
      loadList();
    }
  }, current.job && current.job.status === 'queued' ? 60000 : 4000); // a monthly update takes up to an hour or more
}

function updateButtons() {
  const running = !!current && busy(current.job);
  $('ceUpdate').disabled = running;
  $('ceUpdate').textContent = !running ? 'Update with Claude' : current.job.status === 'queued' ? 'In monthly update…' : 'Claude is updating…';
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

// ---------- Tables ----------
// Risk factors and the differential diagnosis are fixed two-column tables (they are saved
// as their own chapter elements), so they take rows but not columns or other tables.
const FIXED_TABLES = new Set(['riskfactors', 'differentialdiagnosis']);
const fixedTable = part => FIXED_TABLES.has(String(part.dataset.tag || '').replace(/[_-]/g, '').toLowerCase());

// The editable part, and the table cell, at the cursor.
function cursorAt() {
  const r = savedRange && savedRange.startContainer.isConnected ? savedRange : null;
  if (!r) return null;
  const part = partOf(r.startContainer);
  if (!part || !part.isContentEditable) return null;
  const n = r.startContainer.nodeType === 1 ? r.startContainer : r.startContainer.parentNode;
  const cell = n.closest('td, th');
  return { part, range: r, cell: cell && part.contains(cell) ? cell : null };
}
function needCell() {
  const at = cursorAt();
  if (!at || !at.cell) { alert('First click in a cell of the table.'); return null; }
  if (structural(at.cell) && !isIns(structural(at.cell))) { alert('That part of the table is marked for deletion.'); return null; }
  return { ...at, row: at.cell.parentNode, table: at.cell.closest('table') };
}
const cellIndex = cell => Array.from(cell.parentNode.children).indexOf(cell);
const rowsOf = table => Array.from(table.querySelectorAll('tr'));
const emptyCell = tag => { const c = document.createElement(tag); c.textContent = ZWSP; return c; };
// Inside a row, column or table this editor added (not yet accepted): changes there are not tracked separately.
const insideMine = n => { const st = structural(n); return !!st && isIns(st) && mine(st); };
function tableDone(part) {
  prepareAtoms(part);
  changed();
}

function insertTable() {
  const at = cursorAt();
  if (!at) { alert('First click in the chapter where the table should go.'); return; }
  if (fixedTable(at.part) || at.cell) { alert('A table cannot be added here.'); return; }
  const answer = prompt('How many columns and rows (including the heading row)? For example: 2 x 4', '2 x 4');
  if (!answer) return;
  const m = /^\s*(\d+)\s*[x×,* ]\s*(\d+)\s*$/i.exec(answer);
  const cols = m ? Number(m[1]) : 0, rows = m ? Number(m[2]) : 0;
  if (!(cols >= 1 && cols <= 8 && rows >= 1 && rows <= 40)) { alert('Enter the columns and rows as, for example, 2 x 4 (up to 8 columns and 40 rows).'); return; }
  snapshot(at.part);
  const wrap = track(el('div', 'chapter-table-wrap'), 'ins');
  const table = el('table', 'chapter-table');
  for (let r = 0; r < rows; r++) {
    const tr = document.createElement('tr');
    for (let c = 0; c < cols; c++) tr.appendChild(emptyCell(r === 0 ? 'th' : 'td'));
    table.appendChild(tr);
  }
  wrap.appendChild(table);
  // After the paragraph or list the cursor is in.
  let block = at.range.startContainer;
  while (block && block.parentNode !== at.part) block = block.parentNode;
  at.part.insertBefore(wrap, block ? block.nextSibling : null);
  placeCaret(table.querySelector('th, td'), 'end');
  tableDone(at.part);
}

function addRow() {
  const at = needCell();
  if (!at) return;
  snapshot(at.part);
  const width = Math.max(...rowsOf(at.table).map(r => r.children.length));
  const tr = document.createElement('tr');
  if (!insideMine(at.table)) track(tr, 'ins');
  for (let c = 0; c < width; c++) tr.appendChild(emptyCell('td'));
  at.row.parentNode.insertBefore(tr, at.row.nextSibling);
  placeCaret(tr.firstChild, 'end');
  tableDone(at.part);
}

function addColumn() {
  const at = needCell();
  if (!at) return;
  if (fixedTable(at.part)) { alert('This table has a fixed set of columns.'); return; }
  snapshot(at.part);
  const i = cellIndex(at.cell), change = newChangeId(), tracked = !insideMine(at.table);
  for (const tr of rowsOf(at.table)) {
    const ref = tr.children[i];
    const c = emptyCell(ref && ref.nodeName === 'TH' ? 'th' : 'td');
    if (tracked) track(c, 'ins', change);
    tr.insertBefore(c, ref ? ref.nextSibling : null);
  }
  tableDone(at.part);
}

// Deleting what the editor added removes it; anything else is marked for deletion.
function removeOrMark(nodes, change = newChangeId()) {
  for (const n of nodes) {
    const st = structural(n);
    if (st && isIns(st) && mine(st)) n.remove(); // added by this editor (or inside what they added)
    else if (!(st && !isIns(st))) track(n, 'del', change); // unless already deleted
  }
}

function deleteRow() {
  const at = needCell();
  if (!at) return;
  snapshot(at.part);
  removeOrMark([at.row]);
  tableDone(at.part);
}

function deleteColumn() {
  const at = needCell();
  if (!at) return;
  if (fixedTable(at.part)) { alert('This table has a fixed set of columns.'); return; }
  snapshot(at.part);
  const i = cellIndex(at.cell);
  removeOrMark(rowsOf(at.table).map(tr => tr.children[i]).filter(Boolean));
  tableDone(at.part);
}

function deleteTable() {
  const at = needCell();
  if (!at) return;
  if (fixedTable(at.part)) { alert('Delete this table\'s rows instead.'); return; }
  if (!confirm('Delete this table?')) return;
  snapshot(at.part);
  removeOrMark([at.table.closest('.chapter-table-wrap') || at.table]);
  tableDone(at.part);
}

// ---------- The chapter's update plan ----------
function renderPlan() {
  const c = chapters.find(x => x.id === current.id);
  const plan = (c && c.plan) || { month: null, editor: null, searchTerms: '' };
  $('cePlanTerms').value = plan.searchTerms;
  $('cePlanTerms').placeholder = current.title;
  const month = $('cePlanMonth');
  month.textContent = '';
  MONTHS.forEach((m, i) => { const o = el('option', '', m); o.value = String(i + 1); month.appendChild(o); });
  month.value = String(plan.month || 1);
  const ed = $('cePlanEditor');
  ed.textContent = '';
  const none = el('option', '', 'No one yet');
  none.value = '';
  ed.appendChild(none);
  for (const e of editors) { const o = el('option', '', e.name); o.value = e.username; ed.appendChild(o); }
  ed.value = plan.editor || '';
  $('cePlanResult').textContent = '';
  $('cePlanSummary').textContent = `Update plan: ${MONTHS[(plan.month || 1) - 1]}${plan.editor ? `, ${(editors.find(e => e.username === plan.editor) || {}).name || plan.editor}` : ', no editor assigned'}${plan.searchTerms ? ', own search terms' : ''}`;
}

async function savePlan() {
  try {
    await api(`/chapter-edit/${current.id}/plan`, { method: 'PUT', body: { searchTerms: $('cePlanTerms').value, month: $('cePlanMonth').value, editor: $('cePlanEditor').value } });
    await loadList();
    renderPlan();
    $('cePlanResult').textContent = 'Plan saved.';
  } catch (err) {
    $('cePlanResult').textContent = err.message;
  }
}

async function testSearch() {
  const out = $('cePlanResult');
  out.textContent = 'Searching PubMed…';
  $('cePlanTest').disabled = true;
  try {
    const r = await api(`/chapter-edit/${current.id}/search-test?terms=${encodeURIComponent($('cePlanTerms').value)}`);
    out.textContent = `Articles since ${r.since} for “${r.terms}”: ` + r.counts.map(c => `${c.label.replace(/y$/, 'ie')}s ${c.count}`).join(' · ') +
      '. (Up to 25 per kind are read, 40 for diagnosis, prognosis and decision rules, newest first.)';
  } catch (err) {
    out.textContent = err.message;
  } finally {
    $('cePlanTest').disabled = false;
  }
}

// ---------- Setup ----------
export function loadChapterEditor(apiFn, user) {
  api = apiFn;
  me = (user && (user.displayName || user.username)) || 'Editor';
  loadList();
}

$('ceFilter').addEventListener('input', renderList);
$('ceShow').addEventListener('change', renderList);
$('cePlanSave').addEventListener('click', savePlan);
$('cePlanTest').addEventListener('click', testSearch);
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
[['ceTable', insertTable], ['ceRowAdd', addRow], ['ceColAdd', addColumn], ['ceRowDel', deleteRow], ['ceColDel', deleteColumn], ['ceTableDel', deleteTable]].forEach(([id, fn]) => {
  $(id).addEventListener('mousedown', e => e.preventDefault()); // keep the cursor where it is
  $(id).addEventListener('click', fn);
});
[['ceBold', 'bold'], ['ceItalic', 'italic'], ['ceSup', 'superscript'], ['ceSub', 'subscript']].forEach(([id, cmd]) => {
  $(id).addEventListener('mousedown', e => e.preventDefault());
  $(id).addEventListener('click', () => { document.execCommand(cmd); changed(); });
});
document.addEventListener('selectionchange', rememberCursor);
$('ceBody').addEventListener('click', e => {
  const tc = e.target.closest('.tc');
  if (tc && !changes.includes(tc)) { const first = changes.find(c => c.dataset.change && c.dataset.change === tc.dataset.change); if (first) { changeIndex = changes.indexOf(first); showCurrent(false); return; } }
  if (tc) { changeIndex = changes.indexOf(tc); showCurrent(false); }
  if (e.target.closest('a')) e.preventDefault();
});
$('refForm').addEventListener('submit', searchRefs);
$('refClose').addEventListener('click', () => $('refModal').classList.add('hidden'));
window.addEventListener('beforeunload', e => { if (dirty) { saveDraft(); e.preventDefault(); } });
