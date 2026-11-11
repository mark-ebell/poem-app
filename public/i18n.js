// Interface languages. English is written in the code and pages as usual; each other
// language has a dictionary, public/i18n/<code>.json, from the English text to its
// translation ({ "Log out": "Esci", "{n} POEMs found": "{n} POEM trovati" }).
//
// - Fixed text in the pages (headings, buttons, labels, placeholders, titles) is
//   translated wherever it appears, including text the scripts add later: a watcher
//   swaps any text node or attribute whose whole text is in the dictionary.
// - Text with numbers or names in it goes through t() in the scripts:
//   t('{n} POEMs found', { n }). tn(n, '{n} POEM', '{n} POEMs') picks singular or plural.
// - A sentence with a link or other markup inside it is one entry when its element has
//   data-i18n: the key is the element's inner HTML (whitespace collapsed).
// - Content is never translated by this: chapters, POEMs, risk score and calculator text,
//   and anything an editor types sit inside translate="no" (or are editable).
//
// The language is chosen in the menu or on the login screen and kept in this browser
// (localStorage), or set with ?lang=it in the address. The page reloads when it changes.
// With localStorage 'inforetriever.i18nCollect' = '1', untranslated text is collected
// for the dictionaries: window.i18nMissing() lists it (scripts/i18n-strings.js merges).

// A language is listed once its dictionary is ready (Danish, French and German to come:
// { code: 'da', name: 'Dansk' }, { code: 'fr', name: 'Français' }, { code: 'de', name: 'Deutsch' }).
export const LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'it', name: 'Italiano' }
];
const LANG_KEY = 'inforetriever.lang';
const COLLECT_KEY = 'inforetriever.i18nCollect';
const store = {
  get: k => { try { return localStorage.getItem(k); } catch { return null; } },
  set: (k, v) => { try { localStorage.setItem(k, v); } catch { /* private window */ } }
};

function chosenLanguage() {
  const fromUrl = new URLSearchParams(location.search).get('lang');
  if (fromUrl && LANGUAGES.some(l => l.code === fromUrl)) { store.set(LANG_KEY, fromUrl); return fromUrl; }
  const saved = store.get(LANG_KEY);
  return LANGUAGES.some(l => l.code === saved) ? saved : 'en';
}

export const lang = chosenLanguage();
let dict = {};
if (lang !== 'en') {
  try {
    const resp = await fetch(`i18n/${lang}.json`, { cache: 'no-cache' });
    if (resp.ok) dict = await resp.json();
  } catch { /* stays in English */ }
}
document.documentElement.lang = lang;

const collecting = store.get(COLLECT_KEY) === '1';
const missing = new Map(); // text -> where it was seen
const norm = s => s.replace(/\s+/g, ' ').trim();
const fill = (s, vars) => vars ? s.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? vars[k] : m)) : s;

const produced = new Set(); // what t() returned (when collecting), so it is not collected again
function note(key, where) {
  if (collecting && key && !(key in dict) && !produced.has(key) && /[A-Za-z]{2}/.test(key) && !missing.has(key)) missing.set(key, where);
}

// The translation of an English text (with {name} placeholders filled from vars).
export function t(text, vars) {
  const key = norm(String(text));
  note(key, 'script');
  const out = fill(dict[key] || key, vars);
  if (collecting) produced.add(norm(out));
  return out;
}

export function tn(n, one, other, vars) {
  return t(n === 1 ? one : other, { n, ...vars });
}

export function setLanguage(code) {
  if (code === lang) return;
  store.set(LANG_KEY, code);
  const url = new URL(location.href);
  url.searchParams.delete('lang');
  location.replace(url.href);
}

// Dates in the interface language.
export const dateLocale = { en: 'en-US', it: 'it-IT', da: 'da-DK', fr: 'fr-FR', de: 'de-DE' }[lang];

// ---------- the watcher ----------
const ATTRS = ['placeholder', 'title', 'aria-label', 'alt'];
const SKIP_TAGS = new Set(['SCRIPT', 'STYLE', 'TEXTAREA', 'CODE', 'PRE', 'svg', 'math']);
// Content the scripts put on the page (left in English, like translate="no").
const CONTENT = [
  '.chapter-content', '.chapter-section > summary', '.chapter-part > h4', '.chapter-ref-list', '.chapter-people p',
  '.flow-text', '.flow-what', '.flow-arrow-label', '.figure-boxes', '.flow-notes', '.chapter-title',
  '#chapterList', '.tools-item-title', '.tools-item-sub', '#toolsCategory option:not([value=""])', '.tools-group-title',
  '#ddxList span:not(.calc-badge)', '.ddx-name', '.library-title-link', '#aboutModalBody',
  '#calcSpecialty option:not([value=""])', '#calcPair option:not([value=""])', '#calcItem option:not([value=""])',
  '#searchResults select option:not([value=""])', '.tools-cat', '.search-snippet', '#chapterView a.calc-link',
  '.flow-jump', '.flow-when', '#chapterView a.fig-link', '#ddxResultTitle', '#calcTitle', '#calcSub', '#calcSource div', '#calcSource a',
  // Risk score text (to be translated with the risk scores themselves)
  '.tool-title', '.tool-subtitle', '.tool-question', '.tool-option-label', '.tool-note', '.tool-ref', '#toolCard dd',
  '.tool-band', '.tool-prob', '.tool-result-lines', '#toolCard legend + .tool-options'
].join(',');
// Translated, but not collected: labels mixed with content (the POEM pop-up's "Synopsis:").
const NO_COLLECT = '#poemModalBody';
const isContent = e => SKIP_TAGS.has(e.tagName) || e.getAttribute('translate') === 'no' || e.isContentEditable || e.matches(CONTENT);

function skipped(el) {
  for (let e = el; e && e.nodeType === 1; e = e.parentElement) if (isContent(e)) return true;
  return false;
}

// What the watcher last wrote into each text node, so that its own change (which the
// observer reports) is not translated again: that would loop when a translation equals
// the English, or chain when a translation is itself an English key.
const written = new WeakMap();
const writtenAttrs = new WeakMap(); // element -> { attribute: value written }
function setAttr(el, a, value) {
  const mine = writtenAttrs.get(el) || {};
  mine[a] = value;
  writtenAttrs.set(el, mine);
  if (el.getAttribute(a) !== value) el.setAttribute(a, value);
}
const wroteAttr = (el, a) => (writtenAttrs.get(el) || {})[a] === el.getAttribute(a);

function translateText(node) {
  const raw = node.nodeValue;
  if (written.get(node) === raw) return;
  const key = norm(raw);
  if (!key || !node.parentElement) return;
  // "Label:" is translated as "Label" plus the colon.
  const tr = dict[key] || (key.endsWith(':') && dict[key.slice(0, -1)] ? dict[key.slice(0, -1)] + ':' : '');
  if (tr) {
    const lead = raw.match(/^\s*/)[0], trail = raw.match(/\s*$/)[0];
    const out = lead + tr + trail;
    written.set(node, out);
    if (out !== raw) node.nodeValue = out;
  } else if (!/^[\d\s.,:;()%+\-–—/×·•|#?!=<>*]+$/.test(key) && !node.parentElement.closest(NO_COLLECT)) {
    note(key, where(node.parentElement));
  }
}

// Where a text was seen: its element, and the nearest element with an id.
function where(el) {
  if (!el) return '';
  const own = el.tagName.toLowerCase() + (el.className && typeof el.className === 'string' ? '.' + el.className.trim().split(/\s+/).join('.') : '');
  const box = el.closest('[id]');
  return box && box !== el ? `#${box.id} ${own}` : (el.id ? `${own}#${el.id}` : own);
}

function translateAttrs(el) {
  for (const a of ATTRS) {
    const v = el.getAttribute(a);
    if (!v || wroteAttr(el, a)) continue;
    const key = norm(v);
    if (dict[key]) setAttr(el, a, dict[key]);
    else note(key, `${where(el)}[${a}]`);
  }
  if (el.tagName === 'INPUT' && /^(button|submit|reset)$/.test(el.type) && el.value && dict[norm(el.value)]) el.value = dict[norm(el.value)];
}

function translateTree(root) {
  if (root.nodeType === 3) { if (!skipped(root.parentElement)) translateText(root); return; }
  if (root.nodeType !== 1 || skipped(root)) return;
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT, {
    acceptNode(n) {
      if (n.nodeType === 1) return isContent(n) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT;
      return NodeFilter.FILTER_ACCEPT;
    }
  });
  const htmlUnits = [];
  for (let n = root; n; n = walker.nextNode()) {
    if (n.nodeType === 3) { if (!n.parentElement.closest('[data-i18n]')) translateText(n); continue; }
    translateAttrs(n);
    if (n.hasAttribute('data-i18n')) htmlUnits.push(n);
  }
  for (const el of htmlUnits) {
    const key = norm(el.innerHTML);
    if (dict[key]) { if (dict[key] !== key) el.innerHTML = dict[key]; }
    else { note(key, 'html'); for (const tn2 of textNodes(el)) translateText(tn2); }
  }
}

function textNodes(el) {
  const out = [], w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  for (let n = w.nextNode(); n; n = w.nextNode()) out.push(n);
  return out;
}

export function translatePage(root = document.body) {
  if (lang === 'en' && !collecting) return;
  translateTree(root);
  if (root === document.body) document.title = dict[norm(document.title)] || document.title;
}

if (lang !== 'en' || collecting) {
  translatePage();
  new MutationObserver(records => {
    for (const r of records) {
      if (r.type === 'childList') r.addedNodes.forEach(translateTree);
      else if (r.type === 'characterData') { if (!skipped(r.target.parentElement)) translateText(r.target); }
      else if (r.type === 'attributes' && !skipped(r.target)) {
        const v = r.target.getAttribute(r.attributeName);
        if (v && !wroteAttr(r.target, r.attributeName) && dict[norm(v)]) setAttr(r.target, r.attributeName, dict[norm(v)]);
      }
    }
  }).observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ATTRS });
}

if (collecting) window.i18nMissing = () => [...missing].map(([text, where]) => ({ text, where }));

// A <select> of the languages, for the menu and the login screen.
export function languagePicker(className = '') {
  const sel = document.createElement('select');
  sel.className = className;
  sel.setAttribute('aria-label', t('Language'));
  sel.setAttribute('translate', 'no');
  for (const l of LANGUAGES) {
    const o = document.createElement('option');
    o.value = l.code; o.textContent = l.name; o.selected = l.code === lang;
    sel.appendChild(o);
  }
  sel.addEventListener('change', () => setLanguage(sel.value));
  return sel;
}
