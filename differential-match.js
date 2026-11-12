// For ranking chapters in the Search tab (routes/site-search.js): when a search names a
// symptom, sign or test result in the Differential Diagnosis data (the calculator
// spreadsheets' differentials, calculator-data.js), the chapters about the diagnoses on its
// differential rank higher. Searching "headache" puts Meningitis and Brain abscess near the
// top, as well as the chapters with "headache" in their titles.
//
// A search names an item when the item's name or one of its aliases is in the search, or the
// search is in the name (ignoring the bracketed part: "Fever (young child)" counts as Fever).
// A chapter is a diagnosis on the list when a diagnosis (each part of "Gastritis / peptic
// ulcer disease") is in the chapter's title or one of its first two MeSH topics, or the whole
// title (with its bracketed part: "Fracture (rib)" is not "Compression fracture") is in the diagnosis. Words such as "exacerbation" and "acute" are left out of diagnoses, so
// "COPD exacerbation" finds "Chronic obstructive lung disease (acute exacerbation)", and MeSH
// synonyms and abbreviations count (COPD = chronic obstructive lung disease).
const calculatorData = require('./calculator-data');
const { compileQuery } = require('./search');

const STOP = new Set(['in', 'of', 'the', 'and', 'or', 'with', 'without', 'for', 'a', 'an', 'to', 'on', 'esp', 'e', 'g', 'eg']);
const QUALIFIERS = new Set(['exacerbation', 'referred', 'acute', 'chronic', 'compensatory']);
// One-word diagnoses too general to pick out a chapter ("Spinal malignancy / infection").
const GENERIC = new Set(['infection', 'infections', 'malignancy', 'cancer', 'musculoskeletal', 'metastatic', 'viral', 'bacterial', 'idiopathic', 'functional', 'nonspecific', 'medication', 'medications', 'other', 'trauma', 'injury']);
const core = s => String(s || '').replace(/\([^)]*\)/g, ' ').replace(/\s+/g, ' ').trim();
// (Case is kept: abbreviations such as COPD are recognised only in capitals.)
const words = s => core(s).split(/[^\p{L}\p{N}'-]+/u).filter(w => w && !STOP.has(w.toLowerCase()));

const compiled = new Map(); // text -> compiled query (or null)
function cq(text) {
  if (!compiled.has(text)) {
    const q = text ? compileQuery(text, true) : null;
    compiled.set(text, q && !q.error ? q : null);
  }
  return compiled.get(text);
}

// Each item with its names, and its diagnoses split into parts (prepared once per data version).
let prepared = null;
calculatorData.onChange(() => { prepared = null; compiled.clear(); });
function items() {
  if (prepared) return prepared;
  prepared = (calculatorData.get().differentials || []).map(d => ({
    names: [d.name, ...(d.aliases || [])].map(n => words(n).join(' ')).filter(Boolean),
    dx: (d.ddx || []).flatMap(x => core(x.dx).split(/\/| or /)) // not at commas: "Spinal malignancy, infection" is one diagnosis
      .map(f => words(f).filter(w => !QUALIFIERS.has(w.toLowerCase())))
      .filter(w => w.length > 1 || (w.length === 1 && !GENERIC.has(w[0].toLowerCase())))
      .map(w => w.join(' '))
  }));
  return prepared;
}

// The diagnoses (as search texts) on the differentials the search names, or [].
function diagnosesFor(query) {
  const typed = words(query).join(' ');
  if (!typed) return [];
  const qq = cq(typed);
  const out = new Set();
  for (const it of items()) {
    if (it.names.some(n => (cq(n) && cq(n).test(typed)) || (qq && qq.test(n)))) it.dx.forEach(d => out.add(d));
  }
  return [...out];
}

// Whether a chapter (its title, and its MeSH topics "A; B; C") is one of those diagnoses.
function isDiagnosis(title, topics, diagnoses) {
  if (!diagnoses.length) return false;
  const t = core(title), tq = cq(String(title).split(/[^\p{L}\p{N}'-]+/u).filter(w => w && !STOP.has(w.toLowerCase())).join(' '));
  const first = String(topics || '').split('; ').filter(Boolean).slice(0, 2);
  return diagnoses.some(d => {
    const dq = cq(d);
    return (dq && (dq.test(title) || dq.test(t) || first.some(h => dq.test(h)))) || (tq && tq.test(d));
  });
}

module.exports = { diagnosesFor, isDiagnosis };
