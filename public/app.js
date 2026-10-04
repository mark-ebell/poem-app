import * as pdfjsLib from 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/6.2.108/pdf.min.mjs';
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/6.2.108/pdf.worker.min.mjs';

const els = {};
[
  'loginScreen', 'loginForm', 'loginUsername', 'loginPassword', 'loginError',
  'appRoot', 'whoAmI', 'settingsToggle', 'logoutBtn',
  'settingsPanel', 'changePasswordForm', 'currentPassword', 'newPassword', 'settingsSaved', 'settingsError',
  'tabBtnUpload', 'tabBtnBrowse', 'tabBtnEdit', 'tabUpload', 'tabBrowse', 'tabEdit',
  'browseYear', 'browseMonth', 'browseAuthor', 'browseCount', 'browseResults',
  'adminImport', 'archiveInput', 'archiveImportBtn', 'archiveStatus',
  'pdfInput', 'fileStatus', 'generateBtn', 'generateStatus', 'poetSelect', 'pubDateSelect',
  'titleInput', 'poemNumberInput', 'referenceInput', 'questionInput', 'allocationSelect', 'fundingSelect',
  'studyDesignSelect', 'settingSelect', 'ageGroupSelect', 'supertypeSelect', 'loeSelect', 'pubmedIdInput', 'pubmedUrlDisplay',
  'synopsisEditor', 'bottomLineEditor', 'fontNameSelect', 'fontSizeSelect', 'btnBold', 'btnItalic', 'btnUnderline', 'btnSuper', 'btnSub', 'btnLink',
  'trackChangesToggle', 'reviewBtn', 'acceptBtn', 'rejectBtn', 'trackHint',
  'newBtn', 'saveBtn', 'saveExitBtn', 'saveStatus', 'library'
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
  const panels = { upload: els.tabUpload, browse: els.tabBrowse, edit: els.tabEdit };
  const buttons = { upload: els.tabBtnUpload, browse: els.tabBtnBrowse, edit: els.tabBtnEdit };
  for (const key of Object.keys(panels)) {
    panels[key].classList.toggle('hidden', key !== name);
    buttons[key].classList.toggle('active', key === name);
  }
}

els.tabBtnUpload.addEventListener('click', () => switchTab('upload'));
els.tabBtnBrowse.addEventListener('click', () => switchTab('browse'));
els.tabBtnEdit.addEventListener('click', () => switchTab('edit'));

let extractedText = '';
let currentDocId = null;
const TRACK_DEBOUNCE_MS = 900;
let sortColumn = 'publicationDate'; // 'poet' | 'publicationDate' | 'title'
let sortDir = 'asc'; // 'asc' | 'desc'
let poemsCache = [];
let currentUser = null;
let currentPubmedUrl = null; // saved PubMed URL of the open POEM (shown when the ID is "NA")

// The two long-text fields are rich-text editors. Each keeps its own snapshot
// (baseline) for track changes; baseline is null while tracking is off.
const richEditors = [
  { el: els.synopsisEditor, baseline: null, timer: null },
  { el: els.bottomLineEditor, baseline: null, timer: null }
];

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

// ---------- Dropdown options for the structured fields ----------
const ALLOCATION_OPTIONS = ['Concealed', 'Unconcealed', 'Uncertain', 'Not applicable'];
const FUNDING_OPTIONS = ['Industry', 'Government', 'Foundation', 'Industry + Foundation', 'Industry + Government',
  'Self-funded or unfunded', 'Government + Foundation', 'Government + Foundation + Industry', 'Unknown/not stated', 'Other'];
const STUDY_DESIGN_OPTIONS = ['Meta-analysis (randomized controlled trials)', 'Meta-analysis (cohort or case-control)',
  'Meta-analysis (diagnostic)', 'Meta-analysis (other)', 'Network meta-analysis', 'Systematic review',
  'Randomized controlled trial (double-blinded)', 'Randomized controlled trial (single-blinded)',
  'Randomized controlled trial (outcome assessor-blinded)', 'Randomized controlled trial (nonblinded)',
  'Non-randomized controlled trial', 'Cross-over trial (randomized)', 'Cross-over trial (non-randomized)',
  'Decision rule (validation)', 'Decision rule (development only)', 'Diagnostic test evaluation',
  'Cost-effectiveness analysis', 'Decision analysis', 'Descriptive', 'Cost analysis', 'Ecologic', 'Case series',
  'Time series', 'Qualitative', 'Practice guideline', 'Cohort (prospective)', 'Cohort (retrospective)',
  'Case-control', 'Cross-sectional', 'Other', 'Not applicable'];
const SETTING_OPTIONS = ['Inpatient (ICU only)', 'Inpatient (any location)', 'Inpatient (ward only)',
  'Inpatient (any location) with outpatient follow-up', 'Emergency department', 'Outpatient (any)',
  'Outpatient (primary care)', 'Outpatient (specialty)', 'Nursing home/extended care facility', 'Rehab unit',
  'Various (meta-analysis)', 'Various (guideline)', 'Uncertain', 'Population-based', 'Other', 'Not applicable'];
const AGE_GROUP_OPTIONS = [['1', 'Adults'], ['2', 'Children'], ['3', 'Both adults and children'], ['0', 'Not specified']];
const SUPERTYPE_OPTIONS = [
  ['Ad', 'Ad — Practice administration or health systems'], ['DxHP', 'DxHP — Diagnosis by history, signs, symptoms, exam'],
  ['DxTe', 'DxTe — Diagnosis by a test'], ['DxDf', 'DxDf — Differential diagnosis'],
  ['DxRl', 'DxRl — Risk score or clinical decision rule'], ['DxZA', 'DxZA — Diagnosis: signs/symptoms plus tests'],
  ['EdMD', 'EdMD — Medical education'], ['EdPt', 'EdPt — Patient education'], ['EtCs', 'EtCs — Causation and etiology'],
  ['EtEp', 'EtEp — Incidence or prevalence'], ['Etrk', 'Etrk — Risk factors'], ['Px', 'Px — Prognosis or natural history'],
  ['PxFU', 'PxFU — Follow-up tests and monitoring'], ['Sc', 'Sc — Screening'], ['ScPv', 'ScPv — Primary prevention'],
  ['TxCt', 'TxCt — Cost-effectiveness or decision analysis'], ['TxGd', 'TxGd — Treatment guideline'],
  ['TxRx', 'TxRx — Drug therapy'], ['TxSx', 'TxSx — Surgical or procedural therapy'],
  ['TCAM', 'TCAM — Complementary/alternative medicine'], ['TxDt', 'TxDt — Dietary therapy, vitamins, supplements'],
  ['TxZA', 'TxZA — Comparing therapy categories, counseling, exercise'], ['TxHm', 'TxHm — Harms of treatment']];
const LOE_OPTIONS = ['1a', '1a-', '1b', '1b-', '1c', '1c-', '2a', '2a-', '2b', '2b-', '2c', '2c-', '3a', '3a-', '3b', '3b-', '4', '4-', '5'];

function fillSelect(select, options, blankLabel) {
  select.textContent = '';
  const blank = document.createElement('option');
  blank.value = '';
  blank.textContent = blankLabel;
  select.appendChild(blank);
  options.forEach(o => {
    const [value, label] = Array.isArray(o) ? o : [o, o];
    const opt = document.createElement('option');
    opt.value = value;
    opt.textContent = label;
    select.appendChild(opt);
  });
}

// Sets a dropdown to an exact stored value. Older records can hold values that
// are not in the standard list, so those are added as an extra option rather
// than being silently changed.
function setSelectValue(select, value, label) {
  const v = value === null || value === undefined ? '' : String(value);
  if (v && ![...select.options].some(o => o.value === v)) {
    const opt = document.createElement('option');
    opt.value = v;
    opt.textContent = label || v;
    select.appendChild(opt);
  }
  select.value = v;
}

// Matches text from a Claude draft to a standard option, ignoring case,
// hyphens and spacing (so "Decision-analysis" finds "Decision analysis").
const optionKey = (s) => String(s).toLowerCase().replace(/[^a-z0-9]/g, '');
function setSelectFromDraft(select, text) {
  const t = (text || '').trim();
  if (!t) { select.value = ''; return; }
  const match = [...select.options].find(o => o.value && optionKey(o.value) === optionKey(t));
  setSelectValue(select, match ? match.value : t);
}

fillSelect(els.allocationSelect, ALLOCATION_OPTIONS, 'Not specified');
fillSelect(els.fundingSelect, FUNDING_OPTIONS, 'Not specified');
fillSelect(els.studyDesignSelect, STUDY_DESIGN_OPTIONS, 'Not specified');
fillSelect(els.settingSelect, SETTING_OPTIONS, 'Not specified');
fillSelect(els.ageGroupSelect, AGE_GROUP_OPTIONS, 'Not specified');
fillSelect(els.supertypeSelect, SUPERTYPE_OPTIONS, 'Not specified');
fillSelect(els.loeSelect, LOE_OPTIONS, 'Not specified');

function applyNewDocumentDefaults() {
  if (currentUser && [...els.poetSelect.options].some(o => o.value === currentUser.displayName)) {
    els.poetSelect.value = currentUser.displayName;
  }
  const now = new Date();
  const defaultDate = new Date(now.getFullYear(), now.getMonth() + 2, 1);
  els.pubDateSelect.value = monthValue(defaultDate);
}

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

// Draft labels (as written by the prompt) -> form field.
const DRAFT_LABELS = {
  'title': 'title', 'reference': 'reference', 'clinical question': 'clinicalQuestion', 'allocation': 'allocation',
  'funding': 'funding', 'study design': 'studyDesign', 'population and setting': 'setting', 'age group': 'ageGroup',
  'synopsis': 'synopsis', 'bottom-line': 'bottomLine', 'bottom line': 'bottomLine', 'pubmed id': 'pubmedId'
};
const draftLabelRe = /^(Title|Reference|Clinical question|Allocation|Funding|Study design|Population and setting|Age group|Synopsis|Bottom[- ]Line|PubMed ID):\s*(.*)$/i;

function paragraphsToHtml(text) {
  return text.split(/\n\s*\n/).map(p => p.trim()).filter(Boolean)
    .map(p => `<p>${escapeHtml(p).replace(/\n/g, '<br>')}</p>`).join('');
}

// Splits the plain-text draft into one value per form field.
function parseDraft(text) {
  const fields = {};
  let key = null;
  let lines = [];
  const flush = () => { if (key) fields[key] = lines.join('\n').trim(); };
  for (const line of text.split(/\r?\n/)) {
    const m = line.match(draftLabelRe);
    if (m) { flush(); key = DRAFT_LABELS[m[1].toLowerCase()]; lines = [m[2]]; }
    else if (key) lines.push(line);
  }
  flush();
  return fields;
}

function setField(key, value) {
  switch (key) {
    case 'title': els.titleInput.value = value; break;
    case 'reference': els.referenceInput.value = value.replace(/\s*\n\s*/g, ' '); break;
    case 'clinicalQuestion': els.questionInput.value = value.replace(/\s*\n\s*/g, ' '); break;
    case 'allocation': setSelectFromDraft(els.allocationSelect, value); break;
    case 'funding': setSelectFromDraft(els.fundingSelect, value); break;
    case 'studyDesign': setSelectFromDraft(els.studyDesignSelect, value); break;
    case 'setting': setSelectFromDraft(els.settingSelect, value); break;
    case 'ageGroup': {
      const code = { adults: '1', children: '2', 'both adults and children': '3' }[value.trim().toLowerCase()];
      els.ageGroupSelect.value = code || '';
      break;
    }
    case 'synopsis': els.synopsisEditor.innerHTML = paragraphsToHtml(value); break;
    case 'bottomLine': els.bottomLineEditor.innerHTML = paragraphsToHtml(value); break;
    case 'pubmedId': {
      const m = value.match(/\d{6,9}/);
      els.pubmedIdInput.value = m ? m[0] : '';
      updatePubmedUrlDisplay();
      break;
    }
  }
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
    const fields = parseDraft(draft);
    if (!Object.keys(fields).length) {
      // Unexpected layout: keep the whole text in the Synopsis so nothing is lost.
      setField('synopsis', draft);
    } else {
      Object.entries(fields).forEach(([key, value]) => setField(key, value));
    }
    els.generateStatus.textContent = 'Draft generated. Review and edit below, then save.';
    switchTab('edit');
  } catch (err) {
    console.error(err);
    els.generateStatus.textContent = `Error: ${err.message}`;
  } finally {
    els.generateBtn.disabled = false;
  }
});

// ---------- PubMed URL (built from the PubMed ID) ----------
function updatePubmedUrlDisplay() {
  const box = els.pubmedUrlDisplay;
  const id = els.pubmedIdInput.value.trim().replace(/^pmid:?\s*/i, '');
  box.textContent = '';
  let url = null;
  if (/^\d{1,9}$/.test(id)) url = `https://pubmed.ncbi.nlm.nih.gov/${id}`;
  else if (/^na$/i.test(id) && currentPubmedUrl) url = currentPubmedUrl;
  if (url) {
    const a = document.createElement('a');
    a.href = url;
    a.target = '_blank';
    a.rel = 'noopener';
    a.textContent = url;
    box.appendChild(a);
  } else {
    box.textContent = /^na$/i.test(id) ? 'No PubMed entry (NA)' : 'Filled in from the PubMed ID';
  }
}
els.pubmedIdInput.addEventListener('input', updatePubmedUrlDisplay);

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

// ---------- Font name / size ----------
// Clicking a <select> moves focus away from the editor, which would normally
// collapse the text selection before "change" fires — so track the last
// non-collapsed selection made inside the editor and restore it on demand.
let savedEditorRange = null;
const editorContaining = (node) => richEditors.find(ed => ed.el.contains(node));
document.addEventListener('selectionchange', () => {
  const sel = window.getSelection();
  if (!sel.rangeCount || sel.isCollapsed) return;
  const range = sel.getRangeAt(0);
  if (editorContaining(range.commonAncestorContainer)) savedEditorRange = range.cloneRange();
});

function clearDescendantFontStyles(container) {
  container.querySelectorAll('*').forEach(el => {
    el.style.removeProperty('font-family');
    el.style.removeProperty('font-size');
    if (el.tagName === 'FONT') {
      el.removeAttribute('face');
      el.removeAttribute('size');
    }
  });
}

function applyFontStyle(styleProp, cssValue) {
  if (!savedEditorRange || savedEditorRange.collapsed) {
    alert('Select some text in the Synopsis or Bottom-line first.');
    return;
  }
  const sel = window.getSelection();
  sel.removeAllRanges();
  sel.addRange(savedEditorRange);
  const range = savedEditorRange;

  const span = document.createElement('span');
  span.style[styleProp] = cssValue;
  try {
    range.surroundContents(span);
  } catch {
    const frag = range.extractContents();
    span.appendChild(frag);
    range.insertNode(span);
  }
  clearDescendantFontStyles(span); // override any font styling carried in from pasted content

  const newRange = document.createRange();
  newRange.selectNodeContents(span);
  sel.removeAllRanges();
  sel.addRange(newRange);
  savedEditorRange = newRange.cloneRange();
  const owner = editorContaining(span);
  if (owner) owner.el.dispatchEvent(new Event('input', { bubbles: true }));
}

els.fontNameSelect.addEventListener('change', () => applyFontStyle('fontFamily', els.fontNameSelect.value));
els.fontSizeSelect.addEventListener('change', () => applyFontStyle('fontSize', `${els.fontSizeSelect.value}pt`));

// ---------- Track changes: tokenize / diff / render ----------
function getStyleFlags(node, root) {
  let bold = false, italic = false, underline = false, sup = false, sub = false, href = null;
  let fontFamily = null, fontSize = null;
  let el = node.nodeType === Node.TEXT_NODE ? node.parentElement : node;
  while (el && el !== root) {
    const tag = el.tagName;
    if (tag === 'B' || tag === 'STRONG') bold = true;
    if (tag === 'I' || tag === 'EM') italic = true;
    if (tag === 'U') underline = true;
    if (tag === 'SUP') sup = true;
    if (tag === 'SUB') sub = true;
    if (tag === 'A' && !href) href = el.getAttribute('href');
    if (!fontFamily && el.style && el.style.fontFamily) fontFamily = el.style.fontFamily;
    if (!fontSize && el.style && el.style.fontSize) fontSize = el.style.fontSize;
    el = el.parentElement;
  }
  return { bold, italic, underline, sup, sub, href, fontFamily, fontSize };
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
  if (tok.fontFamily || tok.fontSize) {
    const style = [
      tok.fontFamily ? `font-family:${tok.fontFamily}` : '',
      tok.fontSize ? `font-size:${tok.fontSize}` : ''
    ].filter(Boolean).join(';');
    html = `<span style="${escapeAttr(style)}">${html}</span>`;
  }
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

function hasPendingTrackedMarks(ed) {
  const marks = (e) => !!e.el.querySelector('ins.tc-ins, del.tc-del');
  return ed ? marks(ed) : richEditors.some(marks);
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

function renderTrackedDiff(ed) {
  if (ed.baseline === null) return;
  const caret = getCaretOffset(ed.el);
  const baselineDoc = document.createElement('div');
  baselineDoc.innerHTML = ed.baseline;
  const a = tokenizeDoc(baselineDoc);
  const b = tokenizeDoc(ed.el);
  const chunks = diffTokens(a, b);
  ed.el.innerHTML = renderChunks(chunks);
  // Deleted text is shown for reference only; it must not be directly editable
  // (typing "inside" it would otherwise be silently discarded on Accept).
  ed.el.querySelectorAll('del.tc-del').forEach(d => { d.contentEditable = 'false'; });
  setCaretOffset(ed.el, caret);
  updateTrackButtonsState();
}

// HTML of an editor with every tracked change accepted (deletions removed,
// insertions kept as normal text). Used for accepting and for saving.
function acceptedHtml(ed) {
  const clone = ed.el.cloneNode(true);
  clone.querySelectorAll('del.tc-del').forEach(el => el.remove());
  clone.querySelectorAll('ins.tc-ins').forEach(el => el.replaceWith(...el.childNodes));
  return clone.innerHTML;
}

function acceptAllChanges(ed) {
  ed.el.innerHTML = acceptedHtml(ed);
  if (ed.baseline !== null) ed.baseline = ed.el.innerHTML;
  updateTrackButtonsState();
}

function rejectAllChanges(ed) {
  if (ed.baseline === null) return;
  ed.el.innerHTML = ed.baseline;
  updateTrackButtonsState();
}

els.trackChangesToggle.addEventListener('change', () => {
  richEditors.forEach(ed => {
    clearTimeout(ed.timer);
    if (els.trackChangesToggle.checked) {
      ed.baseline = ed.el.innerHTML;
    } else {
      if (hasPendingTrackedMarks(ed)) acceptAllChanges(ed);
      ed.baseline = null;
    }
  });
  updateTrackButtonsState();
});

richEditors.forEach(ed => {
  // Marks new edits automatically a short pause after typing stops, and
  // immediately if focus leaves the editor (e.g. clicking Save) beforehand.
  ed.el.addEventListener('input', () => {
    if (ed.baseline === null) return;
    clearTimeout(ed.timer);
    ed.timer = setTimeout(() => renderTrackedDiff(ed), TRACK_DEBOUNCE_MS);
  });
  ed.el.addEventListener('blur', () => {
    if (ed.baseline === null) return;
    clearTimeout(ed.timer);
    renderTrackedDiff(ed);
  });
});

els.reviewBtn.addEventListener('click', () => {
  richEditors.forEach(ed => { clearTimeout(ed.timer); renderTrackedDiff(ed); });
});

els.acceptBtn.addEventListener('click', () => richEditors.forEach(acceptAllChanges));
els.rejectBtn.addEventListener('click', () => richEditors.forEach(rejectAllChanges));

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

  // The historical archive (thousands of POEMs) is browsed on the Browse tab.
  const appPoems = poemsCache.filter(p => p.source === 'app');

  if (!appPoems.length) {
    const p = document.createElement('p');
    p.className = 'library-empty';
    p.textContent = 'No saved POEMs yet.';
    els.library.appendChild(p);
    return;
  }

  const sorted = [...appPoems].sort((a, b) => {
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
    updateBrowseFilters();
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
  richEditors.forEach(ed => { clearTimeout(ed.timer); ed.baseline = null; });
  els.trackChangesToggle.checked = false;
  updateTrackButtonsState();
}

function clearForm() {
  currentDocId = null;
  currentPubmedUrl = null;
  [els.titleInput, els.poemNumberInput, els.referenceInput, els.questionInput, els.pubmedIdInput].forEach(i => { i.value = ''; });
  [els.allocationSelect, els.fundingSelect, els.studyDesignSelect, els.settingSelect,
    els.ageGroupSelect, els.supertypeSelect, els.loeSelect].forEach(sel => { sel.value = ''; });
  els.synopsisEditor.innerHTML = '';
  els.bottomLineEditor.innerHTML = '';
  updatePubmedUrlDisplay();
}

async function openDoc(id) {
  let doc;
  try {
    ({ poem: doc } = await api(`/poems/${id}`));
  } catch (err) {
    alert(`Could not open this POEM: ${err.message}`);
    return;
  }
  clearForm();
  currentDocId = doc.id;
  currentPubmedUrl = doc.pubmedUrl || null;
  els.titleInput.value = doc.title || '';
  setSelectValue(els.poetSelect, doc.poet);
  setSelectValue(els.pubDateSelect, doc.publicationDate, formatMonthYear(doc.publicationDate));
  els.poemNumberInput.value = doc.poemId || '';
  els.referenceInput.value = doc.reference || '';
  els.questionInput.value = doc.clinicalQuestion || '';
  setSelectValue(els.allocationSelect, doc.allocation);
  setSelectValue(els.fundingSelect, doc.funding);
  setSelectValue(els.studyDesignSelect, doc.studyDesign);
  setSelectValue(els.settingSelect, doc.setting);
  setSelectValue(els.ageGroupSelect, doc.ageGroup);
  setSelectValue(els.supertypeSelect, doc.supertype);
  setSelectValue(els.loeSelect, doc.loe);
  els.pubmedIdInput.value = doc.pubmedId || '';
  els.synopsisEditor.innerHTML = doc.synopsis || '';
  els.bottomLineEditor.innerHTML = doc.bottomLine || '';
  updatePubmedUrlDisplay();
  resetTrackingState();
  els.saveStatus.textContent = '';
  switchTab('edit');
}

function startNewDocument() {
  clearForm();
  resetTrackingState();
  els.saveStatus.textContent = '';
  applyNewDocumentDefaults();
}

function formHasContent() {
  return !!(els.titleInput.value.trim() || els.referenceInput.value.trim() ||
    els.synopsisEditor.textContent.trim() || els.bottomLineEditor.textContent.trim());
}

els.newBtn.addEventListener('click', () => {
  if (formHasContent() && !confirm('Start a new POEM? Unsaved changes will be lost.')) return;
  startNewDocument();
});

async function saveCurrentDoc() {
  const poet = els.poetSelect.value;
  const publicationDate = els.pubDateSelect.value;
  if (!poet || !publicationDate) {
    alert('Please select a POET and a publication date before saving.');
    return false;
  }
  const title = els.titleInput.value.trim();
  if (!title) {
    alert('Please enter a title before saving.');
    return false;
  }

  // Any tracked changes still pending are accepted into the saved text.
  const [synopsisEd, bottomEd] = richEditors;
  richEditors.forEach(ed => clearTimeout(ed.timer));
  const hadPending = hasPendingTrackedMarks();
  const body = {
    title, poet, publicationDate,
    reference: els.referenceInput.value,
    clinicalQuestion: els.questionInput.value,
    allocation: els.allocationSelect.value,
    funding: els.fundingSelect.value,
    studyDesign: els.studyDesignSelect.value,
    setting: els.settingSelect.value,
    ageGroup: els.ageGroupSelect.value,
    supertype: els.supertypeSelect.value,
    loe: els.loeSelect.value,
    pubmedId: els.pubmedIdInput.value,
    synopsis: acceptedHtml(synopsisEd),
    bottomLine: acceptedHtml(bottomEd)
  };

  try {
    let saved;
    if (currentDocId) {
      ({ poem: saved } = await api(`/poems/${currentDocId}`, { method: 'PUT', body }));
    } else {
      ({ poem: saved } = await api('/poems', { method: 'POST', body }));
    }
    currentDocId = saved.id;
    currentPubmedUrl = saved.pubmedUrl || null;
    els.poemNumberInput.value = saved.poemId || '';
    els.pubmedIdInput.value = saved.pubmedId || '';
    updatePubmedUrlDisplay();
    if (hadPending) {
      richEditors.forEach(acceptAllChanges);
    }
    els.saveStatus.textContent = hadPending ? 'Saved (pending tracked changes were accepted).' : 'Saved.';
    setTimeout(() => { els.saveStatus.textContent = ''; }, 3000);
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

// ---------- Browse ----------
const ALL = '';

function setOptions(select, options, keep) {
  select.textContent = '';
  for (const [value, label] of options) {
    const opt = document.createElement('option');
    opt.value = value;
    opt.textContent = label;
    select.appendChild(opt);
  }
  select.value = options.some(([v]) => v === keep) ? keep : options[0][0];
}

// Rebuilds the Year / Month / Author choices from what is in the repository.
// On the first load it selects the most recent month; afterwards it keeps
// whatever the user had chosen.
let browseInitialized = false;
function updateBrowseFilters() {
  const dated = poemsCache.filter(p => /^\d{4}-\d{2}$/.test(p.publicationDate || ''));
  const years = [...new Set(dated.map(p => p.publicationDate.slice(0, 4)))].sort().reverse();
  const authors = [...new Set(poemsCache.map(p => p.poet).filter(Boolean))]
    .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));

  let year = els.browseYear.value, month = els.browseMonth.value;
  if (!browseInitialized && dated.length) {
    const latest = dated.reduce((m, p) => (p.publicationDate > m ? p.publicationDate : m), '0000-00');
    year = latest.slice(0, 4);
    month = latest.slice(5, 7);
    browseInitialized = true;
  }

  setOptions(els.browseYear, [[ALL, 'All years'], ...years.map(y => [y, y])], year);
  setOptions(els.browseMonth, [[ALL, 'All months'], ...MONTH_NAMES.map((n, i) => [String(i + 1).padStart(2, '0'), n])], month);
  setOptions(els.browseAuthor, [[ALL, 'All authors'], ...authors.map(a => [a, a])], els.browseAuthor.value);
  renderBrowse();
}

function renderBrowse() {
  const year = els.browseYear.value, month = els.browseMonth.value, author = els.browseAuthor.value;
  const matches = poemsCache.filter(p => {
    const d = p.publicationDate || '';
    return (!year || d.slice(0, 4) === year) && (!month || d.slice(5, 7) === month) && (!author || p.poet === author);
  }).sort((a, b) =>
    (b.publicationDate || '').localeCompare(a.publicationDate || '') ||
    (a.poet || '').localeCompare(b.poet || '') ||
    (a.title || '').localeCompare(b.title || ''));

  els.browseCount.textContent = `${matches.length.toLocaleString()} POEM${matches.length === 1 ? '' : 's'}`;
  els.browseResults.textContent = '';
  if (!matches.length) {
    const p = document.createElement('p');
    p.className = 'library-empty';
    p.textContent = 'No POEMs match these filters.';
    els.browseResults.appendChild(p);
    return;
  }

  const SHOW_MAX = 500;
  const table = document.createElement('table');
  table.className = 'library-table';
  const headRow = document.createElement('tr');
  ['Publication date', 'POET', 'Title', 'POEM #'].forEach(label => {
    const th = document.createElement('th');
    th.textContent = label;
    headRow.appendChild(th);
  });
  const thead = document.createElement('thead');
  thead.appendChild(headRow);
  table.appendChild(thead);

  const tbody = document.createElement('tbody');
  matches.slice(0, SHOW_MAX).forEach(doc => {
    const row = document.createElement('tr');
    const dateCell = document.createElement('td');
    dateCell.textContent = formatMonthYear(doc.publicationDate) || '—';
    const poetCell = document.createElement('td');
    poetCell.textContent = doc.poet || '—';
    const titleCell = document.createElement('td');
    const link = document.createElement('span');
    link.className = 'library-title-link';
    link.textContent = doc.title || 'Untitled POEM';
    link.addEventListener('click', () => openDoc(doc.id));
    titleCell.appendChild(link);
    const numCell = document.createElement('td');
    numCell.textContent = doc.poemId || '';
    row.append(dateCell, poetCell, titleCell, numCell);
    tbody.appendChild(row);
  });
  table.appendChild(tbody);
  const wrap = document.createElement('div');
  wrap.className = 'library-table-wrap';
  wrap.appendChild(table);
  els.browseResults.appendChild(wrap);

  if (matches.length > SHOW_MAX) {
    const note = document.createElement('p');
    note.className = 'hint';
    note.textContent = `Showing the first ${SHOW_MAX} of ${matches.length.toLocaleString()}. Narrow the filters to see the rest.`;
    els.browseResults.appendChild(note);
  }
}

[els.browseYear, els.browseMonth, els.browseAuthor].forEach(sel => sel.addEventListener('change', renderBrowse));

// ---------- Administrator: import the historical archive ----------
els.archiveInput.addEventListener('change', () => {
  els.archiveImportBtn.disabled = !els.archiveInput.files.length;
  els.archiveStatus.textContent = '';
});

els.archiveImportBtn.addEventListener('click', async () => {
  const file = els.archiveInput.files[0];
  if (!file) return;
  els.archiveImportBtn.disabled = true;
  els.archiveStatus.textContent = 'Importing... this can take a minute.';
  try {
    const resp = await fetch('/api/admin/import-poems', {
      method: 'POST',
      headers: { 'Content-Type': 'application/gzip' },
      body: file
    });
    const data = await resp.json().catch(() => ({}));
    if (!resp.ok) throw new Error(data.error || `Request failed (${resp.status}).`);
    els.archiveStatus.textContent = `Done: ${data.added.toLocaleString()} added, ${data.alreadyPresent.toLocaleString()} already present.`;
    els.archiveInput.value = '';
    await refreshLibrary();
  } catch (err) {
    els.archiveStatus.textContent = `Error: ${err.message}`;
    els.archiveImportBtn.disabled = false;
  }
});

// ---------- init ----------
async function init(user) {
  currentUser = user;
  els.adminImport.classList.toggle('hidden', user.username !== 'ebell');
  showApp(user);
  applyNewDocumentDefaults();
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
