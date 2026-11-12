// The diagnostic calculators' names in other languages: calculator-i18n/<lang>.json, made by
// translate-calculators.js (machine translation, editable by hand). The English names stay
// the values the page sends back; the routes add a `names` map, { English: translation },
// for the names in each answer, and the page shows those.
const fs = require('fs');
const path = require('path');
const calculatorData = require('./calculator-data');

const DIR = path.join(__dirname, 'calculator-i18n');
const LANGS = ['it'];
const translationFile = lang => path.join(DIR, `${lang}.json`);

const dicts = new Map();
function dictFor(lang) {
  if (!LANGS.includes(lang)) return null;
  if (!dicts.has(lang)) {
    let d = {};
    try { d = JSON.parse(fs.readFileSync(translationFile(lang), 'utf8')); } catch { /* not translated yet */ }
    dicts.set(lang, d);
  }
  return dicts.get(lang);
}

// The reader's language for the calculator names: ?lang=it (sent by the page).
const langOf = req => String((req.query && req.query.lang) || '');

// { English: translation } for the given names (those that have one), or undefined in English.
function namesFor(req, strings) {
  const d = dictFor(langOf(req));
  if (!d) return undefined;
  const out = {};
  for (const s of strings) if (s && d[s] && d[s] !== s) out[s] = d[s];
  return out;
}

// Every name to translate (not the study authors that tell duplicate entries apart, nor
// result levels that are only numbers and units).
function calculatorStrings(data = calculatorData.get()) {
  const all = new Set();
  const add = s => { if (typeof s === 'string' && /[A-Za-z]{2}/.test(s)) all.add(s.trim()); };
  for (const p of data.panels || []) {
    for (const t of p.tests) {
      add(t.symptom); add(t.disease); add(t.name);
      for (const o of t.options || []) if (/[A-Za-z]{3}/.test(String(o.range).replace(/\b(mg|ml|mL|dl|dL|U\/L|IU|mmol|mmHg|cm|mm|kg|sec|msec|min|hrs?|yrs?|ng|pg|mcg|g|L)\b/g, ''))) add(o.range);
    }
  }
  for (const x of data.differentials || []) {
    add(x.name);
    (x.aliases || []).forEach(add);
    (x.ddx || []).forEach(e => add(e.dx));
  }
  return [...all].sort((a, b) => a.localeCompare(b));
}

module.exports = { namesFor, calculatorStrings, translationFile, LANGS };
