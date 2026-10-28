// The Diagnostic Tests and Signs and Symptoms tabs (one Bayesian calculator with
// two data sets) and the Differential Diagnosis tab, from the Diagnostic App
// project. The menus are fetched one level at a time and an entry's numbers only
// when it is chosen (see routes/calculator.js); the arithmetic is done here.

const $ = id => document.getElementById(id);
let api = null;

// ---------- Calculator (Signs and Symptoms / Diagnostic Tests) ----------
const panels = new Map(); // key -> { key, label, itemLabel, specialties }
let activePanel = null;
let currentTest = null;
let menuSeq = 0; // ignores answers to menu choices that have since changed

// A multichotomous entry whose worksheet name is the placeholder "Various" gets a friendlier label.
const VARIOUS_LABELS = {
  test: { heading: 'Various tests', dropdown: 'Various tests' },
  finding: { heading: 'Various Signs or Symptoms', dropdown: 'Various signs or symptoms' }
};
const isVariousMulti = t => t.multi === 1 && (t.name || '').trim().toLowerCase() === 'various';

function itemLabel(capitalized) {
  const label = (activePanel && activePanel.itemLabel) || 'test';
  return capitalized ? label.charAt(0).toUpperCase() + label.slice(1) : label;
}

function testHeading(t) {
  const v = isVariousMulti(t) && VARIOUS_LABELS[activePanel.itemLabel];
  return v ? v.heading : t.name;
}

function testDropdownLabel(t) {
  const v = isVariousMulti(t) && VARIOUS_LABELS[activePanel.itemLabel];
  if (v) return v.dropdown;
  let label = t.name;
  if (t.disambig) label += ` (${t.disambig})`;
  if (t.multi === 1) label += ' — multiple result categories';
  return label;
}

function resetSelect(select, placeholder, disabled = true) {
  select.textContent = '';
  const opt = document.createElement('option');
  opt.value = '';
  opt.textContent = placeholder;
  select.appendChild(opt);
  select.disabled = disabled;
}

function addOption(select, value, label) {
  const opt = document.createElement('option');
  opt.value = value;
  opt.textContent = label;
  select.appendChild(opt);
}

function setStatus(text) { $('calcStatus').textContent = text || ''; }

// Shows the Signs and Symptoms ('signsSymptoms') or Diagnostic Tests ('diagnosticTests') data set.
function showPanel(key) {
  const panel = panels.get(key);
  if (!panel || panel === activePanel) return;
  activePanel = panel;
  menuSeq++;
  $('calcHeading').textContent = panel.label;
  $('calcSubtitle').textContent = `Select a specialty, clinical presentation, and ${itemLabel(false)} to see how the result changes the probability of disease.`;
  $('calcEmptyText').textContent = `Choose a specialty, then a clinical presentation, then a ${itemLabel(false)} to open the calculator.`;
  $('calcItemLabel').textContent = itemLabel(true);
  resetSelect($('calcSpecialty'), 'Select specialty…', false);
  panel.specialties.forEach(sp => addOption($('calcSpecialty'), sp, sp));
  resetSelect($('calcPair'), 'Select specialty first…');
  resetSelect($('calcItem'), 'Select symptom/disease first…');
  setStatus('');
  hideCalculator();
}

// Opens the calculator at an SxDxNum (from a link in a textbook chapter): its specialty
// and symptom / disease pair are chosen, ready for a test or finding to be picked.
export async function openCalculatorAt(name, num) {
  try {
    await loaded;
  } catch (err) {
    setStatus(`Could not load the calculator: ${err.message}`);
    return;
  }
  const key = name === 'signs' ? 'signsSymptoms' : 'diagnosticTests';
  showPanel(key);
  setStatus('Loading…');
  let where;
  try {
    where = await api(`/calculator/${key}/number/${encodeURIComponent(num)}`);
  } catch (err) {
    setStatus(err.message);
    return;
  }
  $('calcSpecialty').value = where.specialty;
  await onSpecialtyChange();
  $('calcPair').value = JSON.stringify([where.symptom, where.disease]);
  await onPairChange();
  setStatus(`Choose a ${itemLabel(false)} to open the calculator.`);
}

// Opens what the Search tab found: a symptom / disease pair (in its specialty), and, if an id
// is given, that test or finding, with the calculator shown.
export async function openCalculatorItem(name, item) {
  try {
    await loaded;
  } catch (err) {
    setStatus(`Could not load the calculator: ${err.message}`);
    return;
  }
  showPanel(name === 'signs' ? 'signsSymptoms' : 'diagnosticTests');
  $('calcSpecialty').value = item.specialty;
  await onSpecialtyChange();
  $('calcPair').value = JSON.stringify([item.symptom, item.disease]);
  await onPairChange();
  if (item.id === undefined || item.id === null) { setStatus(`Choose a ${itemLabel(false)} to open the calculator.`); return; }
  $('calcItem').value = String(item.id);
  await onItemChange();
}

async function onSpecialtyChange() {
  const specialty = $('calcSpecialty').value;
  const seq = ++menuSeq;
  resetSelect($('calcPair'), specialty ? 'Loading…' : 'Select specialty first…');
  resetSelect($('calcItem'), 'Select symptom/disease first…');
  hideCalculator();
  if (!specialty) return;
  try {
    const { pairs } = await api(`/calculator/${activePanel.key}/pairs?${new URLSearchParams({ specialty })}`);
    if (seq !== menuSeq) return;
    resetSelect($('calcPair'), 'Select symptom/disease…', false);
    pairs.forEach(p => addOption($('calcPair'), JSON.stringify([p.symptom, p.disease]), `${p.symptom}  →  ${p.disease}`));
    setStatus('');
  } catch (err) {
    if (seq === menuSeq) { resetSelect($('calcPair'), 'Select specialty first…'); setStatus(err.message); }
  }
}

async function onPairChange() {
  const value = $('calcPair').value;
  const seq = ++menuSeq;
  resetSelect($('calcItem'), value ? 'Loading…' : 'Select symptom/disease first…');
  hideCalculator();
  if (!value) return;
  const [symptom, disease] = JSON.parse(value);
  try {
    const { items } = await api(`/calculator/${activePanel.key}/items?${new URLSearchParams({ specialty: $('calcSpecialty').value, symptom, disease })}`);
    if (seq !== menuSeq) return;
    resetSelect($('calcItem'), `Select ${itemLabel(false)}…`, false);
    items.forEach(t => addOption($('calcItem'), t.id, testDropdownLabel(t)));
    setStatus('');
  } catch (err) {
    if (seq === menuSeq) { resetSelect($('calcItem'), 'Select symptom/disease first…'); setStatus(err.message); }
  }
}

async function onItemChange() {
  const id = $('calcItem').value;
  const seq = ++menuSeq;
  if (id === '') { hideCalculator(); return; }
  try {
    const { test } = await api(`/calculator/${activePanel.key}/items/${encodeURIComponent(id)}`);
    if (seq !== menuSeq) return;
    setStatus('');
    showCalculator(test);
  } catch (err) {
    if (seq === menuSeq) { hideCalculator(); setStatus(err.message); }
  }
}

function hideCalculator() {
  $('calcResult').classList.add('hidden');
  $('calcEmpty').classList.remove('hidden');
  currentTest = null;
}

// One digit after the decimal point, or two when the value is below 1, so small values stay legible.
const decimalPlaces = x => (Math.abs(x) < 1 ? 2 : 1);
const fmtPct = x => (x === null || x === undefined || isNaN(x) ? '–' : x.toFixed(decimalPlaces(x)) + '%');
const fmtLR = x => (x === null || x === undefined || isNaN(x) || !isFinite(x) ? '–' : x.toFixed(decimalPlaces(x)));

function postTestProb(pretestPct, lr) {
  const p = Math.min(Math.max(pretestPct / 100, 0.0001), 0.9999);
  const postOdds = (p / (1 - p)) * lr;
  return (postOdds / (1 + postOdds)) * 100;
}

function computeLR(t) {
  let { plr, nlr } = t;
  const sens = t.sens / 100, spec = t.spec / 100;
  if (plr === null || plr === undefined) plr = spec < 1 ? sens / (1 - spec) : Infinity;
  if (nlr === null || nlr === undefined) nlr = spec > 0 ? (1 - sens) / spec : Infinity;
  return { plr, nlr };
}

const defaultPretest = t => (t.pretest !== null && t.pretest !== undefined ? t.pretest : 50);

function showCalculator(t) {
  currentTest = t;
  $('calcEmpty').classList.add('hidden');
  $('calcResult').classList.remove('hidden');

  const badges = $('calcBadges');
  badges.textContent = '';
  const addBadge = text => {
    if (!text) return;
    const span = document.createElement('span');
    span.className = 'calc-badge';
    span.textContent = text;
    badges.appendChild(span);
  };
  addBadge(t.specialty);
  addBadge(`${t.multi === 1 ? 'Multichotomous' : 'Dichotomous'} ${itemLabel(false)}`);
  if (t.loe) addBadge(`Level of evidence: ${t.loe}`);

  $('calcTitle').textContent = testHeading(t);
  $('calcSub').textContent = `${t.symptom}  →  ${t.disease}`;

  const source = $('calcSource');
  source.textContent = '';
  const addLine = (label, value, pmid) => {
    if (value === null || value === undefined || value === '') return;
    const div = document.createElement('div');
    const b = document.createElement('strong');
    b.textContent = `${label}: `;
    div.appendChild(b);
    if (pmid) {
      const a = document.createElement('a');
      a.href = `https://pubmed.ncbi.nlm.nih.gov/${encodeURIComponent(value)}/`;
      a.target = '_blank';
      a.rel = 'noopener';
      a.textContent = `PMID ${value}`;
      div.appendChild(a);
    } else {
      div.append(String(value));
    }
    source.appendChild(div);
  };
  addLine('Reference', t.reference);
  addLine('PubMed', t.pmid, true);
  addLine('Sample size', t.number);
  addLine('Setting / demographics', t.setting);
  addLine('Comment', t.comment);
  if (!source.childNodes.length) source.textContent = 'No additional source details available.';

  const pre = defaultPretest(t);
  $('pretestSlider').value = pre;
  $('pretestNum').value = pre;
  $('pretestHint').textContent = t.pretest !== null && t.pretest !== undefined
    ? `Default from the cited study: ${fmtPct(t.pretest)}. Drag the slider or edit the number to use your own estimate.`
    : 'No study pre-test probability was reported; defaulting to 50%. Adjust as needed.';

  $('binarySection').classList.toggle('hidden', t.multi === 1);
  $('multiSection').classList.toggle('hidden', t.multi !== 1);
  if (t.multi !== 1) {
    $('statSens').textContent = fmtPct(t.sens);
    $('statSpec').textContent = fmtPct(t.spec);
    const { plr, nlr } = computeLR(t);
    $('statPLR').textContent = fmtLR(plr);
    $('statNLR').textContent = fmtLR(nlr);
  }
  updateResults();
}

function positionMarker(id, pct) {
  $(id).style.left = `calc(${Math.min(Math.max(pct, 0), 100)}% - 1px)`;
}

function updateResults() {
  if (!currentTest) return;
  const pretest = Number($('pretestNum').value);
  if (currentTest.multi === 1) { renderMultiTable(currentTest, pretest); return; }
  const { plr, nlr } = computeLR(currentTest);
  const postPos = postTestProb(pretest, plr);
  const postNeg = postTestProb(pretest, nlr);
  $('postPos').textContent = fmtPct(postPos);
  $('postNeg').textContent = fmtPct(postNeg);
  positionMarker('markerPretest', pretest);
  positionMarker('markerPos', postPos);
  positionMarker('markerNeg', postNeg);
  $('barFillPos').style.width = `${Math.max(pretest, postPos)}%`;
}

function renderMultiTable(t, pretest) {
  const tbody = $('multiTableBody');
  tbody.textContent = '';
  t.options.slice().sort((a, b) => b.sslr - a.sslr).forEach(opt => {
    const post = postTestProb(pretest, opt.sslr);
    const tr = document.createElement('tr');
    const cell = (text, className) => {
      const td = document.createElement('td');
      if (className) td.className = className;
      if (text !== null) td.textContent = text;
      tr.appendChild(td);
      return td;
    };
    cell(opt.range);
    cell(fmtLR(opt.sslr), 'num');
    cell(fmtPct(post), 'num post-prob');
    const bar = cell(null, 'bar-col');
    const track = document.createElement('div');
    track.className = 'mini-bar-track';
    const fill = document.createElement('div');
    fill.className = 'mini-bar-fill';
    fill.style.width = `${Math.min(Math.max(post, 0), 100)}%`;
    track.appendChild(fill);
    bar.appendChild(track);
    tbody.appendChild(tr);
  });
}

function syncFromNum() {
  let v = Number($('pretestNum').value);
  if (isNaN(v)) v = 50;
  v = Math.min(Math.max(v, 0.1), 99.9);
  $('pretestNum').value = v;
  $('pretestSlider').value = v;
  updateResults();
}

// ---------- Differential Diagnosis ----------
const TIER_LABEL = { 'very-common': 'Very common', common: 'Common', 'less-common': 'Less common', uncommon: 'Uncommon', rare: 'Rare' };
let ddxItems = [];
let ddxCategory = 'All';
let ddxSeq = 0;

function renderDdxList() {
  const query = $('ddxSearch').value.trim().toLowerCase();
  const list = $('ddxList');
  list.textContent = '';
  const matched = ddxItems
    .filter(item => (ddxCategory === 'All' || item.category === ddxCategory) &&
      (!query || [item.name, ...(item.aliases || [])].join(' | ').toLowerCase().includes(query)))
    .sort((a, b) => a.name.localeCompare(b.name));
  if (!matched.length) {
    const li = document.createElement('li');
    li.className = 'ddx-none';
    li.textContent = 'No matches. Try a different search term.';
    list.appendChild(li);
    return;
  }
  for (const item of matched) {
    const li = document.createElement('li');
    const btn = document.createElement('button');
    btn.type = 'button';
    const name = document.createElement('span');
    name.textContent = item.name;
    const badge = document.createElement('span');
    badge.className = 'calc-badge';
    badge.textContent = item.category;
    btn.append(name, badge);
    btn.addEventListener('click', () => selectDdx(item.id));
    li.appendChild(btn);
    list.appendChild(li);
  }
}

async function selectDdx(id) {
  const seq = ++ddxSeq;
  let item;
  try {
    ({ item } = await api(`/calculator/differential/${encodeURIComponent(id)}`));
  } catch (err) {
    if (seq === ddxSeq) alert(err.message);
    return;
  }
  if (seq !== ddxSeq) return;
  $('ddxEmpty').classList.add('hidden');
  $('ddxResult').classList.remove('hidden');
  $('ddxResultCat').textContent = item.category;
  $('ddxResultTitle').textContent = item.name;
  $('ddxResultAliases').textContent = item.aliases && item.aliases.length ? `Also known as: ${item.aliases.join(', ')}` : '';
  const ranked = $('ddxRanked');
  ranked.textContent = '';
  item.ddx.forEach((entry, i) => {
    const li = document.createElement('li');
    const rank = document.createElement('span');
    rank.className = 'rank';
    rank.textContent = String(i + 1);
    const main = document.createElement('div');
    main.className = 'ddx-main';
    const name = document.createElement('div');
    name.className = 'ddx-name';
    name.textContent = entry.dx;
    const meta = document.createElement('div');
    meta.className = 'ddx-meta';
    const tier = document.createElement('span');
    tier.className = `tier-badge tier-${entry.tier}`;
    tier.textContent = TIER_LABEL[entry.tier] || entry.tier;
    meta.appendChild(tier);
    if (entry.redFlag) {
      const flag = document.createElement('span');
      flag.className = 'redflag-badge';
      flag.textContent = "⚑ Don't miss";
      meta.appendChild(flag);
    }
    main.append(name, meta);
    li.append(rank, main);
    ranked.appendChild(li);
  });
  $('ddxResult').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// Shows the category filter as "All" whenever the tab is opened.
function resetDdxFilter() {
  if (ddxCategory === 'All') return;
  ddxCategory = 'All';
  $('ddxFilters').querySelectorAll('.cat-btn').forEach(b => b.classList.toggle('active', b.dataset.cat === 'All'));
  renderDdxList();
}

// ---------- Setup ----------
let loaded = null;

// Loads the menus once, after login. apiFn is the page's API helper.
export function loadCalculators(apiFn) {
  api = apiFn;
  loaded = loaded || (async () => {
    const [{ panels: list }, { items }] = await Promise.all([api('/calculator/panels'), api('/calculator/differential')]);
    list.forEach(p => panels.set(p.key, p));
    ddxItems = items;
    $('ddxAllBtn').textContent = `All (${items.length})`;
    renderDdxList();
  })().catch(err => { loaded = null; throw err; });
  return loaded;
}

// Called when one of the three tabs is opened: 'ddx', 'signs' or 'tests'.
export async function openCalculatorTab(name) {
  try {
    await loaded;
  } catch (err) {
    setStatus(`Could not load the calculator: ${err.message}`);
    return;
  }
  if (name === 'ddx') { resetDdxFilter(); return; }
  showPanel(name === 'signs' ? 'signsSymptoms' : 'diagnosticTests');
}

$('calcSpecialty').addEventListener('change', onSpecialtyChange);
$('calcPair').addEventListener('change', onPairChange);
$('calcItem').addEventListener('change', onItemChange);
$('pretestSlider').addEventListener('input', () => { $('pretestNum').value = $('pretestSlider').value; updateResults(); });
$('pretestNum').addEventListener('change', syncFromNum);
$('resetPretest').addEventListener('click', () => {
  if (!currentTest) return;
  $('pretestSlider').value = $('pretestNum').value = defaultPretest(currentTest);
  updateResults();
});
$('ddxSearch').addEventListener('input', renderDdxList);
$('ddxFilters').addEventListener('click', (e) => {
  const btn = e.target.closest('.cat-btn');
  if (!btn) return;
  $('ddxFilters').querySelectorAll('.cat-btn').forEach(b => b.classList.toggle('active', b === btn));
  ddxCategory = btn.dataset.cat;
  renderDdxList();
});
