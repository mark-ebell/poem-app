import * as pdfjsLib from 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/6.2.108/pdf.min.mjs';
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/6.2.108/pdf.worker.min.mjs';

const POEM_SYSTEM_PROMPT = `I am a physician who summarizes research studies. Our summaries are called POEMs and we have written over 8000 in the past 25 years. Help write the first draft of a new POEM about the attached study. The POEM must have exactly the following structure and length, using these exact field labels, one per line, in this order:

Title: No more than 18 words summarizing the main message of the study.

Reference: The citation for the study in AMA format.

Clinical question: One sentence that presents the clinical question the study is trying to answer.

Allocation: If it is a randomized trial, was allocation either "Concealed", "Unconcealed", or "Uncertain". Acceptable methods of concealment include Web response systems and central randomization and allocation services. If it is not a randomized trial, write "N/A".

Funding: Which of the following funding sources best describes this study: "Industry", "Government", "Foundation", "Industry + Foundation", "Industry + Government", "Self-funded or unfunded", "Government + Foundation", or "Government + Foundation + Industry".

Study design: Which of the following study designs best describes this study: "Meta-analysis (randomized controlled trials)", "Meta-analysis (other)", "Randomized controlled trial (double-blinded)", "Randomized controlled trial (single-blinded)", "Randomized controlled trial (nonblinded)", "Non-randomized controlled trial", "Cross-over trial (randomized)", "Cross-over trial (non-randomized)", "Decision rule (validation)", "Decision rule (development only)", "Diagnostic test evaluation", "Cost-effectiveness analysis", "Decision-analysis", "Descriptive", "Cost analysis", "Ecologic", "Case series", "Time series", "Qualitative", "Practice guideline", "Cohort (prospective)", "Cohort (retrospective)", "Case-Control", "Cross-sectional", "Meta-analysis or systematic review", or "Other".

Population and setting: Which of the following best describes where the study was performed: "Inpatient (ICU only)", "Inpatient (any location)", "Inpatient (ward only)", "Inpatient (any location) with outpatient follow-up", "Emergency department", "Outpatient (any)", "Outpatient (primary care)", "Outpatient (specialty)", "Nursing home/extended care facility", "Rehab unit", "Various (meta-analysis)", "Various (guideline)", "Uncertain", or "Population-based".

Synopsis: Summarize the study, its design, and the primary results in one or two paragraphs that are about 150 to 300 words in length. Where appropriate present results as absolute risks and number needed to treat or number needed to harm. The format for summarizing a comparison should be of the form of a parenthetical placed toward the end of the relevant sentence, for example: "(12% vs 7%, p < 0.001, NNT = 20)". Make sure to identify any key flaws or biases.

Bottom-Line: In 1 to 4 sentences summarize the main take-home message of the study. Include the key NNT if one was reported in the Synopsis.

Do not show any bracketed internal background source-tracking tags. Output plain text only, with each field label followed by a colon and its content, nothing else before or after.`;

const els = {};
[
  'settingsToggle', 'settingsPanel', 'anthropicKey', 'saveSettings', 'settingsSaved',
  'tabBtnUpload', 'tabBtnEdit', 'tabUpload', 'tabEdit',
  'pdfInput', 'fileStatus', 'generateBtn', 'generateStatus', 'poetSelect', 'pubDateSelect',
  'titleInput', 'btnBold', 'btnUnderline', 'btnSuper', 'btnSub', 'btnLink',
  'trackChangesToggle', 'reviewBtn', 'acceptBtn', 'rejectBtn', 'trackHint',
  'editor', 'newBtn', 'saveBtn', 'saveStatus', 'library'
].forEach(id => { els[id] = document.getElementById(id); });

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

// ---------- Settings ----------
function loadSettings() {
  els.anthropicKey.value = localStorage.getItem('poemapp_anthropic_key') || '';
}

function saveSettings() {
  localStorage.setItem('poemapp_anthropic_key', els.anthropicKey.value.trim());
  els.settingsSaved.classList.remove('hidden');
  setTimeout(() => els.settingsSaved.classList.add('hidden'), 2000);
}

els.settingsToggle.addEventListener('click', () => els.settingsPanel.classList.toggle('hidden'));
els.saveSettings.addEventListener('click', saveSettings);

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

// ---------- Claude call ----------
function escapeHtml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

const FIELD_LABELS = ['Title', 'Reference', 'Clinical question', 'Allocation', 'Funding',
  'Study design', 'Population and setting', 'Synopsis', 'Bottom-Line'];
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
  const apiKey = localStorage.getItem('poemapp_anthropic_key');
  if (!apiKey) {
    alert('Please add your Anthropic API key in Settings first.');
    els.settingsPanel.classList.remove('hidden');
    return;
  }
  if (!extractedText) {
    alert('Please upload a PDF first.');
    return;
  }

  els.generateBtn.disabled = true;
  els.generateStatus.textContent = 'Generating draft with Claude... this can take up to a minute.';

  try {
    const resp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-5',
        max_tokens: 2000,
        system: POEM_SYSTEM_PROMPT,
        messages: [{
          role: 'user',
          content: `Here is the full text of the research article:\n\n${extractedText}`
        }]
      })
    });

    if (!resp.ok) {
      const errBody = await resp.text();
      throw new Error(`Anthropic API error ${resp.status}: ${errBody}`);
    }

    const data = await resp.json();
    const draft = data.content.map(block => block.text || '').join('').trim();

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
[els.btnBold, els.btnUnderline, els.btnSuper, els.btnSub, els.btnLink,
  els.reviewBtn, els.acceptBtn, els.rejectBtn].forEach(btn => {
  btn.addEventListener('mousedown', (e) => e.preventDefault()); // keep focus/selection in editor
});

els.btnBold.addEventListener('click', () => document.execCommand('bold'));
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
  let bold = false, underline = false, sup = false, sub = false, href = null;
  let el = node.nodeType === Node.TEXT_NODE ? node.parentElement : node;
  while (el && el !== root) {
    const tag = el.tagName;
    if (tag === 'B' || tag === 'STRONG') bold = true;
    if (tag === 'U') underline = true;
    if (tag === 'SUP') sup = true;
    if (tag === 'SUB') sub = true;
    if (tag === 'A' && !href) href = el.getAttribute('href');
    el = el.parentElement;
  }
  return { bold, underline, sup, sub, href };
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
  const key = t => (t.isBreak ? ' BREAK ' : t.text);
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

// ---------- Library (localStorage) ----------
const STORE_KEY = 'poemapp_documents_v1';

function loadDocs() {
  try { return JSON.parse(localStorage.getItem(STORE_KEY) || '[]'); }
  catch { return []; }
}

function persistDocs(docs) {
  localStorage.setItem(STORE_KEY, JSON.stringify(docs));
}

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

function renderLibrary() {
  const docs = loadDocs();
  els.library.textContent = '';

  if (!docs.length) {
    const p = document.createElement('p');
    p.className = 'library-empty';
    p.textContent = 'No saved POEMs yet.';
    els.library.appendChild(p);
    return;
  }

  const sorted = [...docs].sort((a, b) => {
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
    row.title = `Created ${formatDate(doc.createdAt)}`;

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
    const del = document.createElement('button');
    del.className = 'library-item-delete';
    del.textContent = 'Delete';
    del.addEventListener('click', () => {
      if (!confirm(`Delete "${doc.title || 'Untitled POEM'}"? This cannot be undone.`)) return;
      persistDocs(loadDocs().filter(d => d.id !== doc.id));
      if (currentDocId === doc.id) startNewDocument();
      renderLibrary();
    });
    delCell.appendChild(del);
    row.appendChild(delCell);

    tbody.appendChild(row);
  });
  table.appendChild(tbody);
  wrap.appendChild(table);
  els.library.appendChild(wrap);
}

function resetTrackingState() {
  clearTimeout(trackDebounceTimer);
  els.trackChangesToggle.checked = false;
  baselineHtml = null;
  updateTrackButtonsState();
}

function openDoc(id) {
  const doc = loadDocs().find(d => d.id === id);
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

els.saveBtn.addEventListener('click', () => {
  const poet = els.poetSelect.value;
  const publicationDate = els.pubDateSelect.value;
  if (!poet || !publicationDate) {
    alert('Please select a POET and a publication date before saving.');
    return;
  }

  clearTimeout(trackDebounceTimer);
  if (baselineHtml !== null) renderTrackedDiff();
  const title = els.titleInput.value.trim() || extractTitleFromEditor() || 'Untitled POEM';
  const html = els.editor.innerHTML;
  const now = new Date().toISOString();
  const docs = loadDocs();

  if (currentDocId) {
    const doc = docs.find(d => d.id === currentDocId);
    if (doc) {
      doc.title = title;
      doc.poet = poet;
      doc.publicationDate = publicationDate;
      doc.html = html;
      doc.updatedAt = now;
    }
  } else {
    currentDocId = (crypto.randomUUID ? crypto.randomUUID() : String(Date.now() + Math.random()));
    docs.push({ id: currentDocId, title, poet, publicationDate, html, createdAt: now, updatedAt: now });
  }

  persistDocs(docs);
  els.titleInput.value = title;
  els.saveStatus.textContent = 'Saved.';
  setTimeout(() => { els.saveStatus.textContent = ''; }, 2000);
  renderLibrary();
});

// ---------- init ----------
loadSettings();
renderLibrary();
updateTrackButtonsState();
