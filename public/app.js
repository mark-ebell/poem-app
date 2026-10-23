import * as pdfjsLib from 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/6.2.108/pdf.min.mjs';
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/6.2.108/pdf.worker.min.mjs';
import { loadCalculators, openCalculatorTab } from './calculator.js';

const els = {};
[
  'loginScreen', 'loginForm', 'loginUsername', 'loginPassword', 'loginError', 'authNotice',
  'loginView', 'signupView', 'forgotView', 'resetView', 'showForgot', 'showSignup', 'showLoginFromSignup', 'showLoginFromForgot',
  'signupForm', 'signupEmail', 'signupPassword', 'signupRules', 'signupConfirm', 'signupTerms', 'turnstileBox', 'signupBtn', 'signupError',
  'forgotForm', 'forgotEmail', 'forgotError', 'resetForm', 'resetPassword', 'resetRules', 'resetConfirm', 'resetError',
  'newPasswordRule', 'browseAuthorField', 'readerPrintNote', 'evidenceHelp',
  'appRoot', 'whoAmI', 'settingsToggle', 'logoutBtn',
  'settingsPanel', 'changePasswordForm', 'currentPassword', 'newPassword', 'settingsSaved', 'settingsError',
  'tabBtnUpload', 'tabBtnBrowse', 'tabBtnSearch', 'tabBtnEdit', 'tabBtnDdx', 'tabBtnSigns', 'tabBtnTests', 'tabCalc', 'tabDdx', 'tabUpload', 'tabBrowse', 'tabSearch', 'tabEdit',
  'searchForm', 'searchInput', 'searchYears', 'searchAge', 'searchSupertype', 'searchBtn', 'searchExcerpt', 'searchCount', 'searchResults',
  'tabBtnEvidence', 'tabEvidence', 'evidenceForm', 'evidenceTopic', 'evidencePoemYears', 'evidenceAge', 'evidenceContent', 'evidencePubmedYears', 'evidenceJournals', 'evidenceGenerateBtn', 'evidenceStatus',
  'poemModal', 'poemModalBody', 'poemModalEdit', 'poemModalClose',
  'printArea', 'printWordBtn', 'printPdfBtn', 'printStatus',
  'wordImport', 'wordFile', 'importMonth', 'importYear', 'wordReadBtn', 'wordStatus', 'wordPreview',
  'browseYear', 'browseMonth', 'browseAuthor', 'browseAge', 'browseCount', 'browseResults',
  'pdfInput', 'fileStatus', 'generateBtn', 'generateStatus', 'poetSelect', 'pubDateSelect',
  'statusSelect', 'titleInput', 'poemNumberInput', 'referenceInput', 'questionInput', 'allocationSelect', 'fundingSelect',
  'studyDesignSelect', 'settingSelect', 'ageGroupSelect', 'supertypeSelect', 'loeSelect', 'pubmedIdInput', 'pubmedUrlDisplay',
  'synopsisEditor', 'bottomLineEditor', 'fontNameSelect', 'fontSizeSelect', 'btnBold', 'btnItalic', 'btnUnderline', 'btnSuper', 'btnSub', 'btnLink',
  'trackChangesToggle', 'reviewBtn', 'acceptBtn', 'rejectBtn', 'trackHint',
  'newBtn', 'saveBtn', 'saveExitBtn', 'saveStatus', 'library'
].forEach(id => { els[id] = document.getElementById(id); });

// ---------- Footer (the year follows the calendar, so it changes on January 1) ----------
document.getElementById('siteFooter').textContent =
  `Copyright Group for Organizational Learning and Development ${new Date().getFullYear()}`;

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
// The login screen has four views: log in, create an account (shown first on a
// browser that has never had an account here), forgotten password, and the new
// password form reached from the emailed link.
const HAS_ACCOUNT_KEY = 'inforetriever.hasAccount';
const remember = () => { try { localStorage.setItem(HAS_ACCOUNT_KEY, '1'); } catch { /* private window */ } };
const hasAccountHere = () => { try { return localStorage.getItem(HAS_ACCOUNT_KEY) === '1'; } catch { return false; } };
let resetToken = null;

function showAuthView(name, notice) {
  for (const [key, view] of Object.entries({ login: els.loginView, signup: els.signupView, forgot: els.forgotView, reset: els.resetView })) {
    view.classList.toggle('hidden', key !== name);
  }
  [els.loginError, els.signupError, els.forgotError, els.resetError].forEach(e => e.classList.add('hidden'));
  els.authNotice.textContent = notice || '';
  els.authNotice.classList.toggle('hidden', !notice);
  if (name === 'signup') renderTurnstile();
}

function showLogin(notice) {
  els.loginScreen.classList.remove('hidden');
  els.appRoot.classList.add('hidden');
  showAuthView(hasAccountHere() ? 'login' : 'signup', notice);
}

function showError(el, message) {
  el.textContent = message;
  el.classList.remove('hidden');
}

// POSTs to the API without the 401 handling of api() (these forms are used while logged out).
async function postJson(path, body) {
  const resp = await fetch(`/api${path}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const data = await resp.json().catch(() => ({}));
  if (!resp.ok) throw new Error(data.error || `Request failed (${resp.status}).`);
  return data;
}

// Reader passwords: 8+ characters, an upper case letter, 2 numbers, 2 special symbols.
const PASSWORD_RULES = [
  ['At least 8 characters', s => s.length >= 8],
  ['An upper case letter', s => /[A-Z]/.test(s)],
  ['2 numbers', s => (s.match(/[0-9]/g) || []).length >= 2],
  ['2 special symbols (such as ! # $ %)', s => (s.match(/[^A-Za-z0-9\s]/g) || []).length >= 2]
];
const passwordOk = s => PASSWORD_RULES.every(([, test]) => test(s));
function renderRules(list, value) {
  list.textContent = '';
  for (const [label, test] of PASSWORD_RULES) {
    const li = document.createElement('li');
    const met = test(value);
    li.className = met ? 'met' : '';
    li.textContent = `${met ? '✓' : '•'} ${label}`;
    list.appendChild(li);
  }
}
renderRules(els.signupRules, '');
renderRules(els.resetRules, '');
els.signupPassword.addEventListener('input', () => renderRules(els.signupRules, els.signupPassword.value));
els.resetPassword.addEventListener('input', () => renderRules(els.resetRules, els.resetPassword.value));

// Cloudflare Turnstile ("are you human" check), when the server has keys for it.
let turnstileSiteKey = null;
let turnstileWidget = null;
let turnstileLoading = null;
function loadTurnstile() {
  turnstileLoading = turnstileLoading || new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
    s.async = true;
    s.onload = resolve;
    s.onerror = reject;
    document.head.appendChild(s);
  });
  return turnstileLoading;
}
async function renderTurnstile() {
  if (!turnstileSiteKey) return;
  try {
    await loadTurnstile();
    if (turnstileWidget === null) turnstileWidget = window.turnstile.render(els.turnstileBox, { sitekey: turnstileSiteKey, action: 'signup' });
    else window.turnstile.reset(turnstileWidget);
  } catch {
    showError(els.signupError, 'The "are you human" check could not be loaded. Please reload the page.');
  }
}
fetch('/api/config').then(r => r.json()).then(c => {
  turnstileSiteKey = c.turnstileSiteKey || null;
  if (!els.signupView.classList.contains('hidden')) renderTurnstile();
}).catch(() => {});

els.showSignup.addEventListener('click', () => showAuthView('signup'));
els.showForgot.addEventListener('click', () => {
  if (els.loginUsername.value.includes('@')) els.forgotEmail.value = els.loginUsername.value.trim();
  showAuthView('forgot');
});
els.showLoginFromSignup.addEventListener('click', () => showAuthView('login'));
els.showLoginFromForgot.addEventListener('click', () => showAuthView('login'));

els.signupForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  els.signupError.classList.add('hidden');
  const email = els.signupEmail.value.trim();
  const password = els.signupPassword.value;
  if (!passwordOk(password)) return showError(els.signupError, 'Please choose a password that meets all of the rules above.');
  if (password !== els.signupConfirm.value) return showError(els.signupError, 'The two passwords do not match.');
  if (!els.signupTerms.checked) return showError(els.signupError, 'Please agree to the Terms of Use to create an account.');
  const turnstileToken = turnstileWidget !== null ? window.turnstile.getResponse(turnstileWidget) : undefined;
  if (turnstileSiteKey && !turnstileToken) return showError(els.signupError, 'Please complete the "are you human" check.');
  els.signupBtn.disabled = true;
  try {
    await postJson('/signup', { email, password, acceptTerms: true, turnstileToken });
    if (turnstileWidget !== null) window.turnstile.reset(turnstileWidget); // each token works once
    remember();
    els.signupForm.reset();
    renderRules(els.signupRules, '');
    els.loginUsername.value = email;
    showAuthView('login', `Almost done: we have sent a confirmation link to ${email}. Open it to start using InfoRetriever. (Check your spam folder if it does not arrive within a few minutes.)`);
  } catch (err) {
    showError(els.signupError, err.message);
    renderTurnstile();
  } finally {
    els.signupBtn.disabled = false;
  }
});

els.forgotForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  els.forgotError.classList.add('hidden');
  const email = els.forgotEmail.value.trim();
  try {
    await postJson('/forgot', { email });
    showAuthView('login', `If ${email} has an InfoRetriever account, we have sent it a link to choose a new password. The link works for one hour.`);
  } catch (err) {
    showError(els.forgotError, err.message);
  }
});

els.resetForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  els.resetError.classList.add('hidden');
  const password = els.resetPassword.value;
  if (!passwordOk(password)) return showError(els.resetError, 'Please choose a password that meets all of the rules above.');
  if (password !== els.resetConfirm.value) return showError(els.resetError, 'The two passwords do not match.');
  try {
    const data = await postJson('/reset', { token: resetToken, password });
    resetToken = null;
    remember();
    els.resetForm.reset();
    await init(data.user);
  } catch (err) {
    showError(els.resetError, err.message);
  }
});

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
    remember();
    await init(data.user);
  } catch (err) {
    els.loginError.textContent = err.message;
    els.loginError.classList.remove('hidden');
  }
});

els.logoutBtn.addEventListener('click', async () => {
  await fetch('/api/logout', { method: 'POST' });
  location.reload(); // starts the next person (or the next login) from a clean page
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
// Signs and Symptoms and Diagnostic Tests share one panel (the same calculator, different data).
function switchTab(name) {
  const panels = {
    upload: els.tabUpload, browse: els.tabBrowse, search: els.tabSearch, evidence: els.tabEvidence,
    ddx: els.tabDdx, signs: els.tabCalc, tests: els.tabCalc, edit: els.tabEdit
  };
  const buttons = {
    upload: els.tabBtnUpload, browse: els.tabBtnBrowse, search: els.tabBtnSearch, evidence: els.tabBtnEvidence,
    ddx: els.tabBtnDdx, signs: els.tabBtnSigns, tests: els.tabBtnTests, edit: els.tabBtnEdit
  };
  for (const panel of new Set(Object.values(panels))) panel.classList.toggle('hidden', panel !== panels[name]);
  for (const [key, button] of Object.entries(buttons)) button.classList.toggle('active', key === name);
  window.scrollTo(0, 0); // show the tab headings, not wherever the previous tab was scrolled to
  if (name === 'ddx' || name === 'signs' || name === 'tests') openCalculatorTab(name);
}

els.tabBtnUpload.addEventListener('click', () => switchTab('upload'));
els.tabBtnBrowse.addEventListener('click', () => switchTab('browse'));
els.tabBtnSearch.addEventListener('click', () => { switchTab('search'); els.searchInput.focus(); });
els.tabBtnEvidence.addEventListener('click', () => {
  switchTab('evidence');
  // Start from the words already typed on the Search tab.
  if (!els.evidenceTopic.value.trim() && els.searchInput.value.trim()) els.evidenceTopic.value = els.searchInput.value.trim();
  els.evidenceTopic.focus();
});
els.tabBtnEdit.addEventListener('click', () => switchTab('edit'));
els.tabBtnDdx.addEventListener('click', () => switchTab('ddx'));
els.tabBtnSigns.addEventListener('click', () => switchTab('signs'));
els.tabBtnTests.addEventListener('click', () => switchTab('tests'));

let extractedText = '';
let currentDocId = null;
const TRACK_DEBOUNCE_MS = 900;
let sortColumn = 'publicationDate'; // 'poet' | 'publicationDate' | 'title'
let sortDir = 'desc'; // 'asc' | 'desc' (newest first by default)
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
  els.statusSelect.value = 'Being edited';
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
    p.textContent = 'No POEMs have been added yet.';
    els.library.appendChild(p);
    return;
  }

  // Only the 50 most recent POEMs are listed (newest publication date first, then most
  // recently added); the column sort below arranges those 50.
  const RECENT_MAX = 50;
  const recent = [...appPoems].sort((a, b) =>
    (b.publicationDate || '').localeCompare(a.publicationDate || '') ||
    (b.createdAt || '').localeCompare(a.createdAt || '')).slice(0, RECENT_MAX);

  const sorted = recent.sort((a, b) => {
    const av = sortValue(a, sortColumn), bv = sortValue(b, sortColumn);
    const cmp = av < bv ? -1 : av > bv ? 1 : 0;
    if (cmp) return sortDir === 'asc' ? cmp : -cmp;
    // POEMs with the same value: the one added most recently first.
    return (b.createdAt || '').localeCompare(a.createdAt || '');
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

  if (appPoems.length > RECENT_MAX) {
    const note = document.createElement('p');
    note.className = 'hint';
    note.textContent = `Showing the ${RECENT_MAX} most recent of ${appPoems.length.toLocaleString()} POEMs added here. Use Browse or Search to find the others.`;
    els.library.appendChild(note);
  }
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
    p.textContent = `Could not load POEMs: ${err.message}`;
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
  setSelectValue(els.statusSelect, doc.status);
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
    status: els.statusSelect.value,
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
const MAIN_AUTHORS = ['Barry', 'Ebell', 'Shaughnessy', 'Slawson', 'Speer', 'Shrikant'];
const NEWER_AUTHORS = ['Rowland', 'Rayala'];
const NAMED_AUTHORS = new Set([...MAIN_AUTHORS, ...NEWER_AUTHORS]);
const OTHER_AUTHORS = '__other__';
let browseInitialized = false;
function updateBrowseFilters() {
  const dated = poemsCache.filter(p => /^\d{4}-\d{2}$/.test(p.publicationDate || ''));
  const years = [...new Set(dated.map(p => p.publicationDate.slice(0, 4)))].sort().reverse();
  // The author choices are the named POETs (not every set of initials in the archive); anyone
  // else is under "Other authors". Newer POETs are listed once they have a POEM.
  const present = new Set(poemsCache.map(p => p.poet));
  const authors = [...MAIN_AUTHORS, ...NEWER_AUTHORS.filter(a => present.has(a))]
    .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
  if (poemsCache.some(p => p.poet && !NAMED_AUTHORS.has(p.poet))) authors.push(OTHER_AUTHORS);

  let year = els.browseYear.value, month = els.browseMonth.value;
  if (!browseInitialized && dated.length) {
    const latest = dated.reduce((m, p) => (p.publicationDate > m ? p.publicationDate : m), '0000-00');
    year = latest.slice(0, 4);
    month = latest.slice(5, 7);
    browseInitialized = true;
  }

  setOptions(els.browseYear, [[ALL, 'All years'], ...years.map(y => [y, y])], year);
  setOptions(els.browseMonth, [[ALL, 'All months'], ...MONTH_NAMES.map((n, i) => [String(i + 1).padStart(2, '0'), n])], month);
  setOptions(els.browseAuthor, [[ALL, 'All authors'], ...authors.map(a => [a, a === OTHER_AUTHORS ? 'Other authors' : a])], els.browseAuthor.value);
  renderBrowse();
}

function renderBrowse() {
  const year = els.browseYear.value, month = els.browseMonth.value, author = els.browseAuthor.value;
  const age = els.browseAge.value;
  const ageMatches = p => !age || String(p.ageGroup) === age;
  const matches = poemsCache.filter(p => {
    const d = p.publicationDate || '';
    return (!year || d.slice(0, 4) === year) && (!month || d.slice(5, 7) === month) && (!author || (author === OTHER_AUTHORS ? !NAMED_AUTHORS.has(p.poet) : p.poet === author)) && ageMatches(p);
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
  ['Publication date', 'POET', 'Title', 'Age group', 'POEM #'].forEach(label => {
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
    const ageCell = document.createElement('td');
    ageCell.textContent = { 1: 'Adults', 2: 'Children', 3: 'Both' }[doc.ageGroup] || 'Not specified';
    const numCell = document.createElement('td');
    numCell.textContent = doc.poemId || '';
    row.append(dateCell, poetCell, titleCell, ageCell, numCell);
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

[els.browseYear, els.browseMonth, els.browseAuthor, els.browseAge].forEach(sel => sel.addEventListener('change', () => {
  if (isReader()) renderReaderBrowse();
  else renderBrowse();
}));

// ---------- Readers' Browse: the server filters, and lists Published titles only ----------
async function loadReaderBrowse() {
  try {
    const { years, latest } = await api('/poems/browse-options');
    setOptions(els.browseYear, [[ALL, 'All years'], ...years.map(y => [y, y])], latest ? latest.slice(0, 4) : ALL);
    setOptions(els.browseMonth, [[ALL, 'All months'], ...MONTH_NAMES.map((n, i) => [String(i + 1).padStart(2, '0'), n])], latest ? latest.slice(5, 7) : ALL);
    await renderReaderBrowse();
  } catch (err) {
    els.browseCount.textContent = `Could not load POEMs: ${err.message}`;
  }
}

let browseSeq = 0;
async function renderReaderBrowse() {
  const seq = ++browseSeq;
  const params = new URLSearchParams({ year: els.browseYear.value, month: els.browseMonth.value, age: els.browseAge.value });
  let data;
  try {
    data = await api(`/poems/browse?${params}`);
  } catch (err) {
    if (seq === browseSeq) { els.browseCount.textContent = err.message; els.browseResults.textContent = ''; }
    return;
  }
  if (seq !== browseSeq) return;
  els.browseCount.textContent = `${data.total.toLocaleString()} POEM${data.total === 1 ? '' : 's'}` +
    (data.truncated ? ` — showing the most recent ${data.poems.length}. Choose a year or month to see the rest.` : '');
  els.browseResults.textContent = '';
  if (!data.total) {
    const p = document.createElement('p');
    p.className = 'library-empty';
    p.textContent = 'No POEMs match these filters.';
    els.browseResults.appendChild(p);
    return;
  }
  const table = document.createElement('table');
  table.className = 'library-table';
  const headRow = document.createElement('tr');
  ['Publication date', 'Title', 'Age group'].forEach(label => {
    const th = document.createElement('th');
    th.textContent = label;
    headRow.appendChild(th);
  });
  const thead = document.createElement('thead');
  thead.appendChild(headRow);
  table.appendChild(thead);
  const tbody = document.createElement('tbody');
  data.poems.forEach(doc => {
    const row = document.createElement('tr');
    const dateCell = document.createElement('td');
    dateCell.textContent = formatMonthYear(doc.publicationDate) || '—';
    const titleCell = document.createElement('td');
    const link = document.createElement('span');
    link.className = 'library-title-link';
    link.textContent = doc.title || 'Untitled POEM';
    link.addEventListener('click', () => showPoemPopup(doc.id, { highlight: false }));
    titleCell.appendChild(link);
    const ageCell = document.createElement('td');
    ageCell.textContent = { 1: 'Adults', 2: 'Children', 3: 'Both' }[doc.ageGroup] || 'Not specified';
    row.append(dateCell, titleCell, ageCell);
    tbody.appendChild(row);
  });
  table.appendChild(tbody);
  const wrap = document.createElement('div');
  wrap.className = 'library-table-wrap';
  wrap.appendChild(table);
  els.browseResults.appendChild(wrap);
}

// ---------- Search ----------
let searchSeq = 0; // ignores the response to a search that has since been superseded

// A search term as a regular expression: spaces match any whitespace, * matches letters/digits.
function termPattern(term) {
  const esc = w => w.replace(/[.+?^${}()|[\]\\]/g, '\\$&').split('*').join('[\\p{L}\\p{N}]*');
  return term.split(/\s+/).map(esc).join('\\s+');
}

function highlightInto(parent, text, terms, whole) {
  const body = terms.map(termPattern).join('|');
  const re = new RegExp(whole ? `(?<![\\p{L}\\p{N}])(?:${body})(?![\\p{L}\\p{N}])` : `(?:${body})`, 'giu');
  let last = 0, m;
  while ((m = re.exec(text)) !== null) {
    if (m[0] === '') { re.lastIndex++; continue; }
    parent.append(text.slice(last, m.index));
    const mark = document.createElement('mark');
    mark.textContent = m[0];
    parent.append(mark);
    last = m.index + m[0].length;
  }
  parent.append(text.slice(last));
}

// ---------- POEM pop-up (opened from a search result) ----------
let popupPoemId = null;

function highlightTextNodes(root, terms, whole) {
  if (!terms.length) return;
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);
  for (const node of nodes) {
    const holder = document.createDocumentFragment();
    highlightInto(holder, node.textContent, terms, whole);
    if (holder.querySelector && holder.querySelector('mark')) node.replaceWith(holder);
  }
}

async function showPoemPopup(id, { highlight = true } = {}) {
  let html;
  try {
    ({ html } = await api(`/poems/${id}/view`));
  } catch (err) {
    alert(`Could not open this POEM: ${err.message}`);
    return;
  }
  popupPoemId = id;
  els.poemModalBody.innerHTML = html; // built by the server from escaped text
  if (highlight && lastSearch) highlightTextNodes(els.poemModalBody, lastSearch.terms, lastSearch.whole);
  els.poemModalBody.querySelectorAll('a[href]').forEach(a => { a.target = '_blank'; a.rel = 'noopener'; });
  els.poemModalBody.scrollTop = 0;
  els.poemModal.classList.remove('hidden');
  document.body.classList.add('modal-open');
  els.poemModalClose.focus();
}

function closePoemPopup() {
  els.poemModal.classList.add('hidden');
  document.body.classList.remove('modal-open');
  els.poemModalBody.textContent = '';
  popupPoemId = null;
}

els.poemModalClose.addEventListener('click', closePoemPopup);
els.poemModal.addEventListener('mousedown', (e) => { if (e.target === els.poemModal) closePoemPopup(); });
document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !els.poemModal.classList.contains('hidden')) closePoemPopup(); });
els.poemModalEdit.addEventListener('click', () => {
  const id = popupPoemId;
  closePoemPopup();
  if (id) openDoc(id);
});

// The print buttons stay visible but can only be used when there are results to print.
function setPrintEnabled(on) {
  els.printWordBtn.disabled = els.printPdfBtn.disabled = !on;
}

let lastSearch = null;
let lastQuery = null; // { q, years } of the search being shown; "Print POEMs" re-runs it
function renderSearchResults(data) {
  lastSearch = data;
  setPrintEnabled(!!data.total);
  els.searchResults.textContent = '';
  els.searchCount.textContent = data.total
    ? `${data.total.toLocaleString()} POEM${data.total === 1 ? '' : 's'} found` +
      (data.truncated ? ` — showing the first ${data.poems.length}. Make the search more specific to narrow it.` : '')
    : '';
  if (!data.total) {
    const p = document.createElement('p');
    p.className = 'library-empty';
    p.textContent = 'No POEMs match that search.';
    els.searchResults.appendChild(p);
    return;
  }

  const table = document.createElement('table');
  table.className = 'library-table search-table';
  const headRow = document.createElement('tr');
  ['Publication date', 'Title'].forEach(label => {
    const th = document.createElement('th');
    th.textContent = label;
    headRow.appendChild(th);
  });
  const thead = document.createElement('thead');
  thead.appendChild(headRow);
  table.appendChild(thead);

  const tbody = document.createElement('tbody');
  data.poems.forEach(doc => {
    const row = document.createElement('tr');
    const dateCell = document.createElement('td');
    dateCell.textContent = formatMonthYear(doc.publicationDate) || '—';
    const titleCell = document.createElement('td');
    const link = document.createElement('span');
    link.className = 'library-title-link';
    highlightInto(link, doc.title || 'Untitled POEM', data.terms, data.whole);
    link.addEventListener('click', () => showPoemPopup(doc.id));
    titleCell.appendChild(link);
    if (els.searchExcerpt.checked && doc.excerpt) {
      const snip = document.createElement('div');
      snip.className = 'search-snippet';
      highlightInto(snip, doc.excerpt, data.terms, data.whole);
      titleCell.appendChild(snip);
    }
    row.append(dateCell, titleCell);
    tbody.appendChild(row);
  });
  table.appendChild(tbody);
  const wrap = document.createElement('div');
  wrap.className = 'library-table-wrap';
  wrap.appendChild(table);
  els.searchResults.appendChild(wrap);
}

els.searchForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const q = els.searchInput.value.trim();
  if (q.length < 2) {
    els.searchCount.textContent = 'Enter at least two characters to search for.';
    els.searchResults.textContent = '';
    return;
  }
  const seq = ++searchSeq;
  els.searchBtn.disabled = true;
  els.searchCount.textContent = 'Searching...';
  try {
    const query = { q, years: els.searchYears.value, age: els.searchAge.value, supertype: els.searchSupertype.value };
    const data = await api(`/poems/search?${new URLSearchParams(query)}`);
    if (seq === searchSeq) {
      lastQuery = query; // the print buttons use the same filters
      els.printStatus.textContent = '';
      renderSearchResults(data);
    }
  } catch (err) {
    if (seq === searchSeq) {
      els.searchResults.textContent = '';
      setPrintEnabled(false);
      els.searchCount.textContent = `Search failed: ${err.message}`;
    }
  } finally {
    els.searchBtn.disabled = false;
  }
});

// Changing a filter (or the time span) re-runs the search being shown.
[els.searchYears, els.searchAge, els.searchSupertype].forEach(sel => sel.addEventListener('change', () => {
  if (lastQuery && els.searchInput.value.trim().length >= 2) els.searchForm.requestSubmit();
}));

// ---------- Evidence Summary ----------
// Readers' summaries cover practice guidelines, Cochrane reviews and systematic
// reviews from PubMed, from at most the last 10 years (the server enforces this too).
function limitEvidenceOptions() {
  setOptions(els.evidenceContent, [
    ['all', 'Guidelines, Cochrane and systematic reviews'],
    ['guidelines', 'Practice guidelines'],
    ['cochrane', 'Cochrane reviews'],
    ['systematic', 'Systematic Reviews']
  ], 'all');
  setOptions(els.evidencePubmedYears, [['1', '1 year'], ['3', '3 years'], ['5', '5 years'], ['10', '10 years']], '10');
  els.evidenceHelp.textContent = 'Downloads a Word document that begins with the most recent matching POEMs (up to 500), grouped by supertype, followed by practice guidelines, Cochrane reviews and systematic reviews from PubMed. Evidence Summaries and printouts are limited to 5 a day.';
}

els.evidenceForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const q = els.evidenceTopic.value.trim();
  if (q.length < 2) {
    els.evidenceStatus.textContent = 'Enter the topic to search for first.';
    els.evidenceTopic.focus();
    return;
  }
  els.evidenceGenerateBtn.disabled = true;
  els.evidenceStatus.textContent = 'Searching the POEMs and PubMed... this can take up to a minute.';
  try {
    const resp = await fetch('/api/evidence/summary', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        q,
        years: els.evidencePoemYears.value,
        pubmedYears: els.evidencePubmedYears.value,
        age: els.evidenceAge.value,
        content: els.evidenceContent.value,
        journals: els.evidenceJournals.checked
      })
    });
    if (resp.status === 401) { showLogin(); throw new Error('Not logged in.'); }
    if (!resp.ok) {
      const data = await resp.json().catch(() => ({}));
      throw new Error(data.error || `Request failed (${resp.status}).`);
    }
    const url = URL.createObjectURL(await resp.blob());
    const a = document.createElement('a');
    a.href = url;
    a.download = `Evidence Summary - ${q.replace(/[\\/:*?"<>|]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 60)} - ${new Date().toISOString().slice(0, 10)}.docx`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 10000);
    els.evidenceStatus.textContent = 'The Evidence Summary was downloaded.';
  } catch (err) {
    els.evidenceStatus.textContent = `Could not create the Evidence Summary: ${err.message}`;
  } finally {
    els.evidenceGenerateBtn.disabled = false;
  }
});

// ---------- Print POEMs (Word document or PDF) ----------
async function fetchPrintOutput(format) {
  const resp = await fetch('/api/poems/export', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...lastQuery, format })
  });
  if (resp.status === 401) { showLogin(); throw new Error('Not logged in.'); }
  if (!resp.ok) {
    const data = await resp.json().catch(() => ({}));
    throw new Error(data.error || `Request failed (${resp.status}).`);
  }
  return resp;
}

async function printAs(format) {
  if (!lastQuery) return;
  setPrintEnabled(false);
  els.printStatus.textContent = 'Preparing the POEMs...';
  try {
    const resp = await fetchPrintOutput(format);
    if (format === 'docx') {
      const url = URL.createObjectURL(await resp.blob());
      const a = document.createElement('a');
      a.href = url;
      a.download = `POEMs ${new Date().toISOString().slice(0, 10)}.docx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 10000);
      els.printStatus.textContent = 'The Word document was downloaded.';
    } else {
      const html = await resp.text();
      const frame = document.createElement('iframe');
      frame.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;';
      frame.srcdoc = html;
      frame.onload = () => {
        frame.contentWindow.focus();
        frame.contentWindow.print();
        setTimeout(() => frame.remove(), 60000);
      };
      document.body.appendChild(frame);
      els.printStatus.textContent = 'In the print window that opens, choose "Save as PDF" as the destination.';
    }
  } catch (err) {
    els.printStatus.textContent = `Could not print: ${err.message}`;
  } finally {
    setPrintEnabled(!!(lastSearch && lastSearch.total));
  }
}

els.printWordBtn.addEventListener('click', () => printAs('docx'));
els.printPdfBtn.addEventListener('click', () => printAs('html'));

els.searchExcerpt.addEventListener('change', () => { if (lastSearch) renderSearchResults(lastSearch); });

// ---------- Administrator: import a monthly batch from a Word file ----------
(function setUpWordImport() {
  const now = new Date();
  setOptions(els.importMonth, MONTH_NAMES.map((n, i) => [String(i + 1).padStart(2, '0'), n]), String(now.getMonth() + 1).padStart(2, '0'));
  const years = [now.getFullYear() - 1, now.getFullYear(), now.getFullYear() + 1].map(y => [String(y), String(y)]);
  setOptions(els.importYear, years, String(now.getFullYear()));
})();

let pendingImport = null; // records from the last "Read file", waiting for the Import click

els.wordFile.addEventListener('change', () => {
  const file = els.wordFile.files[0];
  els.wordReadBtn.disabled = !file;
  els.wordStatus.textContent = '';
  els.wordPreview.textContent = '';
  pendingImport = null;
  if (!file) return;
  // A name like "POEMs_2025_April_Final.docx" sets the month and year.
  const year = /(20\d{2})/.exec(file.name);
  const month = MONTH_NAMES.findIndex(n => new RegExp(n.slice(0, 3), 'i').test(file.name));
  if (year && [...els.importYear.options].some(o => o.value === year[1])) els.importYear.value = year[1];
  if (month >= 0) els.importMonth.value = String(month + 1).padStart(2, '0');
});

function td(text, className) {
  const cell = document.createElement('td');
  cell.textContent = text;
  if (className) cell.className = className;
  return cell;
}

function renderImportPreview(items) {
  els.wordPreview.textContent = '';
  const importable = items.filter(i => !i.duplicate);

  const table = document.createElement('table');
  table.className = 'library-table';
  const head = document.createElement('tr');
  ['Title', 'Author', 'PubMed ID', 'Age group', 'Supertype', 'Notes'].forEach(label => {
    const th = document.createElement('th');
    th.textContent = label;
    head.appendChild(th);
  });
  const thead = document.createElement('thead');
  thead.appendChild(head);
  table.appendChild(thead);
  const tbody = document.createElement('tbody');
  for (const { record: r, notes, duplicate } of items) {
    const row = document.createElement('tr');
    const issues = duplicate ? [`Will be skipped: ${duplicate}`] : notes;
    row.append(
      td(r.title), td(r.poet || '—'), td(r.pubmed_id || '—'),
      td({ 1: 'Adults', 2: 'Children', 3: 'Both' }[r.age_group] || '—'), td(r.supertype || '—'),
      td(issues.join('; '), duplicate ? 'import-skip' : (issues.length ? 'import-note' : ''))
    );
    tbody.appendChild(row);
  }
  table.appendChild(tbody);
  const wrap = document.createElement('div');
  wrap.className = 'library-table-wrap';
  wrap.appendChild(table);
  els.wordPreview.appendChild(wrap);

  const bar = document.createElement('div');
  bar.className = 'evidence-actions';
  const go = document.createElement('button');
  go.type = 'button';
  go.textContent = importable.length ? `Import ${importable.length} POEM${importable.length === 1 ? '' : 's'}` : 'Nothing to import';
  go.disabled = !importable.length;
  const cancel = document.createElement('button');
  cancel.type = 'button';
  cancel.className = 'secondary';
  cancel.textContent = 'Cancel';
  const status = document.createElement('span');
  status.className = 'hint';
  bar.append(go, cancel, status);
  els.wordPreview.appendChild(bar);

  cancel.addEventListener('click', () => { els.wordPreview.textContent = ''; pendingImport = null; els.wordStatus.textContent = ''; });
  go.addEventListener('click', async () => {
    go.disabled = cancel.disabled = true;
    status.textContent = 'Importing...';
    try {
      const data = await api('/admin/import-word/commit', { method: 'POST', body: { records: importable.map(i => i.record) } });
      const skipped = data.skipped.length ? ` ${data.skipped.length} skipped.` : '';
      els.wordPreview.textContent = '';
      els.wordFile.value = '';
      els.wordReadBtn.disabled = true;
      pendingImport = null;
      els.wordStatus.textContent = `Added ${data.added} POEM${data.added === 1 ? '' : 's'}.${skipped}`;
      await refreshLibrary();
    } catch (err) {
      status.textContent = `Error: ${err.message}`;
      go.disabled = cancel.disabled = false;
    }
  });
}

els.wordReadBtn.addEventListener('click', async () => {
  const file = els.wordFile.files[0];
  if (!file) return;
  els.wordReadBtn.disabled = true;
  els.wordPreview.textContent = '';
  els.wordStatus.textContent = 'Reading the file and looking up PubMed IDs... this can take a minute.';
  try {
    const month = `${els.importYear.value}-${els.importMonth.value}`;
    const resp = await fetch(`/api/admin/import-word/preview?month=${month}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/octet-stream' },
      body: file
    });
    if (resp.status === 401) { showLogin(); throw new Error('Not logged in.'); }
    const data = await resp.json().catch(() => ({}));
    if (!resp.ok) throw new Error(data.error || `Request failed (${resp.status}).`);
    pendingImport = data.items;
    const dups = data.items.filter(i => i.duplicate).length;
    els.wordStatus.textContent = `${data.items.length} POEM${data.items.length === 1 ? '' : 's'} found for ${MONTH_NAMES[Number(month.slice(5)) - 1]} ${month.slice(0, 4)}` +
      (dups ? `; ${dups} already in the repository` : '') + '. Check the list, then import.';
    renderImportPreview(data.items);
  } catch (err) {
    els.wordStatus.textContent = `Error: ${err.message}`;
  } finally {
    els.wordReadBtn.disabled = !els.wordFile.files.length;
  }
});

// ---------- init ----------
const isReader = () => !!currentUser && currentUser.role === 'reader';

// Readers see only Browse, Search and Evidence; the server enforces the same rules.
function applyRole() {
  const reader = isReader();
  [els.tabBtnUpload, els.tabBtnEdit].forEach(b => b.classList.toggle('hidden', reader));
  els.browseAuthorField.classList.toggle('hidden', reader);
  els.poemModalEdit.classList.toggle('hidden', reader);
  els.readerPrintNote.classList.toggle('hidden', !reader);
  els.newPasswordRule.textContent = reader
    ? '(at least 8 characters, with an upper case letter, 2 numbers and 2 special symbols)'
    : '(at least 8 characters)';
  if (reader) limitEvidenceOptions();
}

async function init(user) {
  currentUser = user;
  els.wordImport.classList.toggle('hidden', user.username !== 'ebell');
  showApp(user);
  applyRole();
  loadCalculators(api).catch(err => console.error('Calculator menus failed to load', err));
  if (isReader()) {
    switchTab('browse');
    await loadReaderBrowse();
    return;
  }
  applyNewDocumentDefaults();
  await refreshLibrary();
  updateTrackButtonsState();
}

// Links from the confirmation and password emails: /?verify=... and /?reset=...
(async () => {
  const params = new URLSearchParams(location.search);
  const verify = params.get('verify');
  const reset = params.get('reset');
  if (verify || reset) history.replaceState(null, '', location.pathname); // keep the token out of the history
  if (verify) {
    try {
      const data = await postJson('/verify', { token: verify });
      remember();
      await init(data.user);
    } catch (err) {
      remember();
      showLogin(err.message);
    }
    return;
  }
  if (reset) {
    resetToken = reset;
    remember();
    els.loginScreen.classList.remove('hidden');
    els.appRoot.classList.add('hidden');
    showAuthView('reset');
    return;
  }
  try {
    const { user } = await api('/me');
    await init(user);
  } catch {
    showLogin();
  }
})();
