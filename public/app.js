import * as pdfjsLib from 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/6.2.108/pdf.min.mjs';
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/6.2.108/pdf.worker.min.mjs';

const els = {};
[
  'loginScreen', 'loginForm', 'loginUsername', 'loginPassword', 'loginError',
  'appRoot', 'whoAmI', 'settingsToggle', 'logoutBtn',
  'settingsPanel', 'changePasswordForm', 'currentPassword', 'newPassword', 'settingsSaved', 'settingsError',
  'tabBtnUpload', 'tabBtnEdit', 'tabUpload', 'tabEdit',
  'pdfInput', 'fileStatus', 'generateBtn', 'generateStatus', 'poetSelect', 'pubDateSelect',
  'titleInput', 'btnBold', 'btnItalic', 'btnUnderline', 'btnSuper', 'btnSub', 'btnLink',
  'trackChangesToggle', 'reviewBtn', 'acceptBtn', 'rejectBtn', 'trackHint',
  'editor', 'newBtn', 'saveBtn', 'saveExitBtn', 'saveStatus', 'library'
].forEach(id => { els[id] = document.getElementById(id); });

// ---------- API helper ----------
async function api(path, options = {}) {
  const resp = await fetch(`/api${path}`, {
    method: options.method || 'GET',
    headers: options.body ? { 'Content-Type': 'application/json' } : undefined,
    body: options.body ? JSON.stringify(options.body) : undefined
  });
  if (resp.status === 401) {
    showLogin();
    throw new Error('Not logged in.');
  }
  const data = await resp.json().catch(() => ({}));
  if (!resp.ok) throw new Error(data.error || `Request failed (${resp.status}).`);
  return data;
}

// ---------- Auth ----------
function showLogin() {
  els.loginScreen.classList.remove('hidden');
  els.appRoot.classList.add('hidden');
}

function showApp(user) {
  els.loginScreen.classList.add('hidden');
  els.appRoot.classList.remove('hidden');
  els.whoAmI.textContent = `Signed in as ${user.displayName}`;
  if (user.mustChangePassword) {
    els.settingsPanel.classList.remove('hidden');
    els.settingsError.textContent = 'Please set your own password before continuing.';
    els.settingsError.classList.remove('hidden');
  }
}

els.loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  els.loginError.classList.add('hidden');
  try {
    const resp = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: els.loginUsername.value.trim(), password: els.loginPassword.value })
    });
    const data = await resp.json().catch(() => ({}));
    if (!resp.ok) throw new Error(data.error || 'Login failed.');
    els.loginPassword.value = '';
    await init(data.user);
  } catch (err) {
    els.loginError.textContent = err.message;
    els.loginError.classList.remove('hidden');
  }
});

els.logoutBtn.addEventListener('click', async () => {
  await fetch('/api/logout', { method: 'POST' });
  showLogin();
});

els.changePasswordForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  els.settingsError.classList.add('hidden');
  try {
    await api('/change-password', {
      method: 'POST',
      body: { currentPassword: els.currentPassword.value, newPassword: els.newPassword.value }
    });
    els.currentPassword.value = '';
    els.newPassword.value = '';
    els.settingsError.classList.add('hidden');
    els.settingsSaved.classList.remove('hidden');
    setTimeout(() => {
      els.settingsSaved.classList.add('hidden');
      els.settingsPanel.classList.add('hidden');
    }, 1500);
  } catch (err) {
    els.settingsError.textContent = err.message;
    els.settingsError.classList.remove('hidden');
  }
});

els.settingsToggle.addEventListener('click', () => els.settingsPanel.classList.toggle('hidden'));

// ---------- Tabs ----------
function switchTab(name) {
  const onEdit = name === 'edit';
  els.tabUpload.classList.toggle('hidden', onEdit);
  els.tabEdit.classList.toggle('hidden', !onEdit);
  els.tabBtnUpload.classList.toggle('active', !onEdit);
  els.tabBtnEdit.classList.toggle('active', onEdit);
}

els.tabBtnUpload.addEventListener('click', () => switchTab('upload'));
els.tabBtnEdit.addEventListener('click', () => switchTab('edit'));

let extractedText = '';
let currentDocId = null;
let baselineHtml = null; // snapshot for track changes, null when tracking is off
let trackDebounceTimer = null;
const TRACK_DEBOUNCE_MS = 900;
let sortColumn = 'publicationDate'; // 'poet' | 'publicationDate' | 'title'
let sortDir = 'asc'; // 'asc' | 'desc'
let poemsCache = [];

// ---------- Publication date options ----------
const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'];

function monthValue(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function formatMonthYear(value) {
  if (!value) return '';
  const [y, m] = value.split('-').map(Number);
  return `${MONTH_NAMES[m - 1]} ${y}`;
}

function populatePubDateOptions() {
  const now = new Date();
  for (let i = 0; i <= 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
    const opt = document.createElement('option');
    opt.value = monthValue(d);
    opt.textContent = formatMonthYear(monthValue(d));
    els.pubDateSelect.appendChild(opt);
  }
}
populatePubDateOptions();

// ---------- PDF extraction ----------
els.pdfInput.addEventListener('change', async (e) => {
  const file = e.target.files[0];
  extractedText = '';
  els.generateBtn.disabled = true;
  if (!file) { els.fileStatus.textContent = ''; return; }

  els.fileStatus.textContent = `Reading ${file.name}...`;
  try {
    const buf = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: buf }).promise;
    let text = '';
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      text += content.items.map(it => it.str).join(' ') + '\n\n';
      els.fileStatus.textContent = `Reading ${file.name}... (page ${i} of ${pdf.numPages})`;
    }
    extractedText = text.trim();
    if (!extractedText) {
      els.fileStatus.textContent = 'Could not extract any text from this PDF (it may be a scanned image without OCR).';
      return;
    }
    els.fileStatus.textContent = `Extracted ${extractedText.length.toLocaleString()} characters from ${pdf.numPages} page(s).`;
    els.generateBtn.disabled = false;
  } catch (err) {
    console.error(err);
    els.fileStatus.textContent = `Error reading PDF: ${err.message}`;
  }
});

// ---------- Claude call (proxied through our server) ----------
function escapeHtml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

const FIELD_LABELS = ['Title', 'Reference', 'Clinical question', 'Allocation', 'Funding',
  'Study design', 'Population and setting', 'Age group', 'Synopsis', 'Bottom-Line', 'PubMed ID'];
const labelRe = new RegExp(`^(${FIELD_LABELS.join('|')}):\\s*(.*)$`);

function plainPoemToHtml(text) {
  const lines = text.split(/\r?\n/);
  const fields = [];
  let current = null;
  for (const line of lines) {
    const m = line.match(labelRe);
    if (m) {
      if (current) fields.push(current);
      current = { label: m[1], lines: [m[2]] };
    } else if (current) {
      current.lines.push(line);
    }
  }
  if (current) fields.push(current);

  if (!fields.length) {
    return text.split(/\n\s*\n/).map(p =>
      `<p>${escapeHtml(p.trim()).replace(/\n/g, '<br>')}</p>`).join('');
  }

  return fields.map(f => {
    const body = f.lines.join('\n').trim();
    const paras = body.split(/\n\s*\n/).map(p => escapeHtml(p.trim()).replace(/\n/g, '<br>'));
    return `<p><b>${escapeHtml(f.label)}:</b> ${paras.join('</p><p>')}</p>`;
  }).join('');
}

function extractTitleFromEditor() {
  const firstPara = els.editor.querySelector('p');
  if (!firstPara) return '';
  const m = firstPara.textContent.match(/^Title:\s*(.+)$/);
  if (m) return m[1].trim();
  return firstPara.textContent.trim().slice(0, 80);
}

els.generateBtn.addEventListener('click', async () => {
  if (!extractedText) {
    alert('Please upload a PDF first.');
    return;
  }

  els.generateBtn.disabled = true;
  els.generateStatus.textContent = 'Generating draft with Claude... this can take up to a minute.';

  try {
    const { draft } = await api('/generate', { method: 'POST', body: { text: extractedText } });

    startNewDocument();
    els.editor.innerHTML = plainPoemToHtml(draft);
    els.titleInput.value = extractTitleFromEditor();
    els.generateStatus.textContent = 'Draft generated. Review and edit below, then save.';
    switchTab('edit');
  } catch (err) {
    console.error(err);
    els.generateStatus.textContent = `Error: ${err.message}`;
  } finally {
    els.generateBtn.disabled = false;
  }
});

// ---------- Formatting toolbar ----------
[els.btnBold, els.btnItalic, els.btnUnderline, els.btnSuper, els.btnSub, els.btnLink,
  els.reviewBtn, els.acceptBtn, els.rejectBtn].forEach(btn => {
  btn.addEventListener('mousedown', (e) => e.preventDefault()); // keep focus/selection in editor
});

els.btnBold.addEventListener('click', () => document.execCommand('bold'));
els.btnItalic.addEventListener('click', () => document.execCommand('italic'));
els.btnUnderline.addEventListener('click', () => document.execCommand('underline'));
els.btnSuper.addEventListener('click', () => document.execCommand('superscript'));
els.btnSub.addEventListener('click', () => document.execCommand('subscript'));

els.btnLink.addEventListener('click', () => {
  const url = prompt('Link URL (must start with http://, https://, or mailto:)');
  if (!url) return;
  const trimmed = url.trim();
  if (!/^(https?:|mailto:)/i.test(trimmed)) {
    alert('Please enter a URL starting with http://, https://, or mailto:');
    return;
  }
  document.execCommand('createLink', false, trimmed);
});

// ---------- Track changes: tokenize / diff / render ----------
function getStyleFlags(node, root) {
  let bold = false, italic = false, underline = false, sup = false, sub = false, href = null;
  let el = node.nodeType === Node.TEXT_NODE ? node.parentElement : node;
  while (el && el !== root) {
    const tag = el.tagName;
    if (tag === 'B' || tag === 'STRONG') bold = true;
    if (tag === 'I' || tag === 'EM') italic = true;
    if (tag === 'U') underline = true;
    if (tag === 'SUP') sup = true;
    if (tag === 'SUB') sub = true;
    if (tag === 'A' && !href) href = el.getAttribute('href');
    el = el.parentElement;
  }
  return { bold, italic, underline, sup, sub, href };
}

// Text already marked as a tracked deletion is kept in the DOM only for display;
// it must not count as "live" content, or a second diff pass would see it as
// still-present and silently un-mark the deletion.
function isInsideTrackedDeletion(el, root) {
  while (el && el !== root) {
    if (el.classList && el.classList.contains('tc-del')) return true;
    el = el.parentElement;
  }
  return false;
}

function tokenizeParagraph(pEl) {
  const tokens = [];
  const walker = document.createTreeWalker(pEl, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      return isInsideTrackedDeletion(node.parentElement, pEl)
        ? NodeFilter.FILTER_SKIP : NodeFilter.FILTER_ACCEPT;
    }
  });
  let n;
  while ((n = walker.nextNode())) {
    const style = getStyleFlags(n, pEl);
    const parts = n.textContent.split(/(\s+)/).filter(p => p.length > 0);
    for (const part of parts) tokens.push({ text: part, ...style });
  }
  return tokens;
}

function tokenizeDoc(rootEl) {
  const blocks = rootEl.children.length ? Array.from(rootEl.children) : [rootEl];
  const tokens = [];
  blocks.forEach((b, i) => {
    if (i > 0) tokens.push({ text: '', isBreak: true });
    tokens.push(...tokenizeParagraph(b));
  });
  return tokens;
}

function diffTokens(a, b) {
  const n = a.length, m = b.length;
  const key = t => (t.isBreak ? ' BREAK ' : t.text);
  const dp = Array.from({ length: n + 1 }, () => new Uint32Array(m + 1));
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      dp[i][j] = key(a[i]) === key(b[j]) ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }
  const chunks = [];
  const push = (type, tok) => {
    const last = chunks[chunks.length - 1];
    if (last && last.type === type) last.tokens.push(tok);
    else chunks.push({ type, tokens: [tok] });
  };
  let i = 0, j = 0;
  while (i < n && j < m) {
    if (key(a[i]) === key(b[j])) { push('equal', b[j]); i++; j++; }
    else if (dp[i + 1][j] >= dp[i][j + 1]) { push('delete', a[i]); i++; }
    else { push('insert', b[j]); j++; }
  }
  while (i < n) { push('delete', a[i]); i++; }
  while (j < m) { push('insert', b[j]); j++; }
  return chunks;
}

function escapeAttr(s) {
  return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function renderToken(tok) {
  let html = escapeHtml(tok.text);
  if (tok.href) html = `<a href="${escapeAttr(tok.href)}">${html}</a>`;
  if (tok.sup) html = `<sup>${html}</sup>`;
  if (tok.sub) html = `<sub>${html}</sub>`;
  if (tok.underline) html = `<u>${html}</u>`;
  if (tok.italic) html = `<i>${html}</i>`;
  if (tok.bold) html = `<b>${html}</b>`;
  return html;
}

function renderChunks(chunks) {
  const paras = [];
  let current = [];
  const flush = () => { paras.push(current.join('')); current = []; };
  const wrap = (type, inner) => {
    if (!inner) return '';
    if (type === 'insert') return `<ins class="tc-ins">${inner}</ins>`;
    if (type === 'delete') return `<del class="tc-del">${inner}</del>`;
    return inner;
  };

  chunks.forEach(chunk => {
    if (chunk.type === 'equal') {
      chunk.tokens.forEach(t => (t.isBreak ? flush() : current.push(renderToken(t))));
    } else {
      let buffer = [];
      chunk.tokens.forEach(t => {
        if (t.isBreak) {
          if (buffer.length) { current.push(wrap(chunk.type, buffer.join(''))); buffer = []; }
          flush();
        } else {
          buffer.push(renderToken(t));
        }
      });
      if (buffer.length) current.push(wrap(chunk.type, buffer.join('')));
    }
  });
  flush();

  return paras.map(p => `<p>${p || '<br>'}</p>`).join('');
}

// ---------- Track changes: controls ----------
// Caret position is tracked as a character offset over "live" text only
// (i.e. excluding text inside tracked-deletion spans), so it survives the
// innerHTML replacement that happens every time we re-render the diff.
function getCaretOffset(root) {
  const sel = window.getSelection();
  if (!sel.rangeCount) return null;
  const range = sel.getRangeAt(0);
  if (!root.contains(range.startContainer)) return null;
  let offset = 0;
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      return isInsideTrackedDeletion(node.parentElement, root)
        ? NodeFilter.FILTER_SKIP : NodeFilter.FILTER_ACCEPT;
    }
  });
  let n;
  while ((n = walker.nextNode())) {
    if (n === range.startContainer) return offset + range.startOffset;
    offset += n.textContent.length;
  }
  return offset;
}

function setCaretOffset(root, target) {
  if (target === null) return;
  let offset = 0;
  let last = null;
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      return isInsideTrackedDeletion(node.parentElement, root)
        ? NodeFilter.FILTER_SKIP : NodeFilter.FILTER_ACCEPT;
    }
  });
  let n;
  while ((n = walker.nextNode())) {
    last = n;
    const len = n.textContent.length;
    if (offset + len >= target) {
      const range = document.createRange();
      range.setStart(n, Math.max(0, target - offset));
      range.collapse(true);
      const sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
      return;
    }
    offset += len;
  }
  const range = document.createRange();
  if (last) range.setStart(last, last.textContent.length);
  else range.selectNodeContents(root);
  range.collapse(true);
  const sel = window.getSelection();
  sel.removeAllRanges();
  sel.addRange(range);
}

function hasPendingTrackedMarks() {
  return !!els.editor.querySelector('ins.tc-ins, del.tc-del');
}

function updateTrackButtonsState() {
  const on = els.trackChangesToggle.checked;
  els.reviewBtn.classList.toggle('hidden', !on);
  els.acceptBtn.classList.toggle('hidden', !on);
  els.rejectBtn.classList.toggle('hidden', !on);
  els.trackHint.classList.toggle('hidden', !on);
  const pending = hasPendingTrackedMarks();
  els.acceptBtn.disabled = !pending;
  els.rejectBtn.disabled = !pending;
}

function renderTrackedDiff() {
  if (baselineHtml === null) return;
  const caret = getCaretOffset(els.editor);
  const baselineDoc = document.createElement('div');
  baselineDoc.innerHTML = baselineHtml;
  const a = tokenizeDoc(baselineDoc);
  const b = tokenizeDoc(els.editor);
  const chunks = diffTokens(a, b);
  els.editor.innerHTML = renderChunks(chunks);
  // Deleted text is shown for reference only; it must not be directly editable
  // (typing "inside" it would otherwise be silently discarded on Accept).
  els.editor.querySelectorAll('del.tc-del').forEach(d => { d.contentEditable = 'false'; });
  setCaretOffset(els.editor, caret);
  updateTrackButtonsState();
}

function acceptAllChanges() {
  const clone = els.editor.cloneNode(true);
  clone.querySelectorAll('del.tc-del').forEach(el => el.remove());
  clone.querySelectorAll('ins.tc-ins').forEach(el => el.replaceWith(...el.childNodes));
  els.editor.innerHTML = clone.innerHTML;
  if (baselineHtml !== null) baselineHtml = els.editor.innerHTML;
  updateTrackButtonsState();
}

function rejectAllChanges() {
  if (baselineHtml === null) return;
  els.editor.innerHTML = baselineHtml;
  updateTrackButtonsState();
}

els.trackChangesToggle.addEventListener('change', () => {
  clearTimeout(trackDebounceTimer);
  if (els.trackChangesToggle.checked) {
    baselineHtml = els.editor.innerHTML;
  } else {
    if (hasPendingTrackedMarks()) acceptAllChanges();
    baselineHtml = null;
  }
  updateTrackButtonsState();
});

// Marks new edits automatically a short pause after typing stops, and
// immediately if focus leaves the editor (e.g. clicking Save) beforehand.
els.editor.addEventListener('input', () => {
  if (baselineHtml === null) return;
  clearTimeout(trackDebounceTimer);
  trackDebounceTimer = setTimeout(renderTrackedDiff, TRACK_DEBOUNCE_MS);
});

els.editor.addEventListener('blur', () => {
  if (baselineHtml === null) return;
  clearTimeout(trackDebounceTimer);
  renderTrackedDiff();
});

els.reviewBtn.addEventListener('click', () => {
  clearTimeout(trackDebounceTimer);
  renderTrackedDiff();
});

els.acceptBtn.addEventListener('click', acceptAllChanges);
els.rejectBtn.addEventListener('click', rejectAllChanges);

// ---------- Library (server-backed) ----------
function formatDate(iso) {
  return new Date(iso).toLocaleString(undefined, {
    year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit'
  });
}

const LIBRARY_COLUMNS = [
  { key: 'poet', label: 'POET' },
  { key: 'publicationDate', label: 'Publication Date' },
  { key: 'title', label: 'Title' }
];

function sortValue(doc, key) {
  if (key === 'title') return (doc.title || '').toLowerCase();
  if (key === 'poet') return (doc.poet || '').toLowerCase();
  return doc.publicationDate || ''; // 'YYYY-MM' sorts correctly as a string
}

// Two-step inline delete (rather than a native confirm() dialog, which some
// browsers can end up silently suppressing after "don't show more dialogs").
function buildDeleteControl(doc) {
  const container = document.createElement('div');
  container.className = 'delete-control';

  function showButton() {
    container.textContent = '';
    const btn = document.createElement('button');
    btn.className = 'library-item-delete';
    btn.textContent = 'Delete';
    btn.addEventListener('click', showConfirm);
    container.appendChild(btn);
  }

  function showConfirm() {
    container.textContent = '';
    const label = document.createElement('span');
    label.className = 'delete-confirm-label';
    label.textContent = 'Are you sure?';
    const yesBtn = document.createElement('button');
    yesBtn.className = 'library-item-delete-confirm';
    yesBtn.textContent = 'Yes';
    yesBtn.addEventListener('click', async () => {
      yesBtn.disabled = true;
      try {
        await api(`/poems/${doc.id}`, { method: 'DELETE' });
        if (currentDocId === doc.id) startNewDocument();
        await refreshLibrary();
      } catch (err) {
        alert(`Could not delete: ${err.message}`);
        showButton();
      }
    });
    const noBtn = document.createElement('button');
    noBtn.className = 'library-item-delete-cancel';
    noBtn.textContent = 'No';
    noBtn.addEventListener('click', showButton);
    container.appendChild(label);
    container.appendChild(yesBtn);
    container.appendChild(noBtn);
  }

  showButton();
  return container;
}

function renderLibrary() {
  els.library.textContent = '';

  if (!poemsCache.length) {
    const p = document.createElement('p');
    p.className = 'library-empty';
    p.textContent = 'No saved POEMs yet.';
    els.library.appendChild(p);
    return;
  }

  const sorted = [...poemsCache].sort((a, b) => {
    const av = sortValue(a, sortColumn), bv = sortValue(b, sortColumn);
    const cmp = av < bv ? -1 : av > bv ? 1 : 0;
    return sortDir === 'asc' ? cmp : -cmp;
  });

  const wrap = document.createElement('div');
  wrap.className = 'library-table-wrap';
  const table = document.createElement('table');
  table.className = 'library-table';

  const thead = document.createElement('thead');
  const headRow = document.createElement('tr');
  LIBRARY_COLUMNS.forEach(col => {
    const th = document.createElement('th');
    th.className = 'sortable';
    th.textContent = col.label;
    if (sortColumn === col.key) {
      const arrow = document.createElement('span');
      arrow.className = 'sort-arrow';
      arrow.textContent = sortDir === 'asc' ? '▲' : '▼';
      th.appendChild(arrow);
    }
    th.addEventListener('click', () => {
      if (sortColumn === col.key) {
        sortDir = sortDir === 'asc' ? 'desc' : 'asc';
      } else {
        sortColumn = col.key;
        sortDir = 'asc';
      }
      renderLibrary();
    });
    headRow.appendChild(th);
  });
  headRow.appendChild(document.createElement('th')); // edit column
  headRow.appendChild(document.createElement('th')); // delete column
  thead.appendChild(headRow);
  table.appendChild(thead);

  const tbody = document.createElement('tbody');
  sorted.forEach(doc => {
    const row = document.createElement('tr');
    row.title = `Created by ${doc.createdBy} on ${formatDate(doc.createdAt)}`;

    const poetCell = document.createElement('td');
    poetCell.textContent = doc.poet || '—';
    row.appendChild(poetCell);

    const dateCell = document.createElement('td');
    dateCell.textContent = formatMonthYear(doc.publicationDate) || '—';
    row.appendChild(dateCell);

    const titleCell = document.createElement('td');
    const titleLink = document.createElement('span');
    titleLink.className = 'library-title-link';
    titleLink.textContent = doc.title || 'Untitled POEM';
    titleLink.addEventListener('click', () => openDoc(doc.id));
    titleCell.appendChild(titleLink);
    row.appendChild(titleCell);

    const editCell = document.createElement('td');
    const editBtn = document.createElement('button');
    editBtn.className = 'library-item-edit';
    editBtn.textContent = 'Edit';
    editBtn.addEventListener('click', () => openDoc(doc.id));
    editCell.appendChild(editBtn);
    row.appendChild(editCell);

    const delCell = document.createElement('td');
    delCell.appendChild(buildDeleteControl(doc));
    row.appendChild(delCell);

    tbody.appendChild(row);
  });
  table.appendChild(tbody);
  wrap.appendChild(table);
  els.library.appendChild(wrap);
}

async function refreshLibrary() {
  try {
    const { poems } = await api('/poems');
    poemsCache = poems;
    renderLibrary();
  } catch (err) {
    console.error(err);
    els.library.textContent = '';
    const p = document.createElement('p');
    p.className = 'library-empty';
    p.textContent = `Could not load saved POEMs: ${err.message}`;
    els.library.appendChild(p);
  }
}

function resetTrackingState() {
  clearTimeout(trackDebounceTimer);
  els.trackChangesToggle.checked = false;
  baselineHtml = null;
  updateTrackButtonsState();
}

function openDoc(id) {
  const doc = poemsCache.find(d => d.id === id);
  if (!doc) return;
  currentDocId = doc.id;
  els.titleInput.value = doc.title;
  els.poetSelect.value = doc.poet || '';
  els.pubDateSelect.value = doc.publicationDate || '';
  els.editor.innerHTML = doc.html;
  resetTrackingState();
  els.saveStatus.textContent = '';
  switchTab('edit');
}

function startNewDocument() {
  currentDocId = null;
  els.titleInput.value = '';
  els.poetSelect.value = '';
  els.pubDateSelect.value = '';
  els.editor.innerHTML = '';
  resetTrackingState();
  els.saveStatus.textContent = '';
}

els.newBtn.addEventListener('click', () => {
  if (els.editor.innerHTML.trim() && !confirm('Start a new POEM? Unsaved changes will be lost.')) return;
  startNewDocument();
});

async function saveCurrentDoc() {
  const poet = els.poetSelect.value;
  const publicationDate = els.pubDateSelect.value;
  if (!poet || !publicationDate) {
    alert('Please select a POET and a publication date before saving.');
    return false;
  }

  clearTimeout(trackDebounceTimer);
  if (baselineHtml !== null) renderTrackedDiff();
  const title = els.titleInput.value.trim() || extractTitleFromEditor() || 'Untitled POEM';
  const html = els.editor.innerHTML;
  const body = { title, poet, publicationDate, html };

  try {
    if (currentDocId) {
      await api(`/poems/${currentDocId}`, { method: 'PUT', body });
    } else {
      const { poem } = await api('/poems', { method: 'POST', body });
      currentDocId = poem.id;
    }
    els.titleInput.value = title;
    els.saveStatus.textContent = 'Saved.';
    setTimeout(() => { els.saveStatus.textContent = ''; }, 2000);
    await refreshLibrary();
    return true;
  } catch (err) {
    alert(`Could not save: ${err.message}`);
    return false;
  }
}

els.saveBtn.addEventListener('click', () => {
  saveCurrentDoc();
});

els.saveExitBtn.addEventListener('click', async () => {
  if (await saveCurrentDoc()) switchTab('upload');
});

// ---------- init ----------
async function init(user) {
  showApp(user);
  await refreshLibrary();
  updateTrackButtonsState();
}

(async () => {
  try {
    const { user } = await api('/me');
    await init(user);
  } catch {
    showLogin();
  }
})();
