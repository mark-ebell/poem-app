// Gathers the interface's English text for the translations (public/i18n.js).
//
//   node scripts/i18n-strings.js [collected.json ...]
//
// Reads the strings passed to tr()/t() in the readers' scripts (the editors' screens stay
// in English), adds the text collected in the browser (window.i18nMissing() saved as JSON,
// which covers the page's fixed text), and merges them into public/i18n/strings.json, the
// list of everything to translate. Then it reports, for each language file
// (public/i18n/<code>.json), the strings it lacks and the ones no longer used, and writes
// the missing ones to public/i18n/missing-<code>.json for translating.
const fs = require('fs');
const path = require('path');

const PUB = path.join(__dirname, '..', 'public');
const DIR = path.join(PUB, 'i18n');
const EDITOR_ONLY = new Set(['algorithm-editor.js', 'tool-editor.js', 'chapter-editor.js', 'calculator-upload.js', 'reader-admin.js', 'i18n.js']);
const norm = s => s.replace(/\s+/g, ' ').trim();

const found = new Map(); // text -> where
const add = (text, where) => { const k = norm(text); if (k && /[A-Za-z]{2}/.test(k) && !found.has(k)) found.set(k, where); };
const unquote = q => q.slice(1, -1).replace(/\\(['"\\])/g, '$1').replace(/\\n/g, '\n');

for (const f of fs.readdirSync(PUB).filter(f => f.endsWith('.js') && !EDITOR_ONLY.has(f))) {
  const src = fs.readFileSync(path.join(PUB, f), 'utf8');
  // tr('...') / t('...'), and both branches of tr(cond ? '...' : '...')
  for (const m of src.matchAll(/(?<![\w.])(?:tr|t)\(((?:[^()'"]|'(?:\\.|[^'\\])*'|"(?:\\.|[^"\\])*")*?)[,)]/g)) {
    for (const q of m[1].matchAll(/(=== ?|== ?)?('(?:\\.|[^'\\])*'|"(?:\\.|[^"\\])*")/g)) if (!q[1]) add(unquote(q[2]), f); // not the value in a comparison
  }
  // Sentences kept in objects and passed to tr() later (calculator.js ITEM_NAMES).
  for (const m of src.matchAll(/\b(?:subtitle|empty|choose|select|compare): ('(?:\\.|[^'\\])*')/g)) add(unquote(m[1]), f);
}
for (const file of process.argv.slice(2)) {
  for (const item of JSON.parse(fs.readFileSync(file, 'utf8'))) add(typeof item === 'string' ? item : item.text, 'page');
}

const listFile = path.join(DIR, 'strings.json');
let list = {};
try { list = JSON.parse(fs.readFileSync(listFile, 'utf8')); } catch { /* first run */ }
for (const [k, where] of found) if (!(k in list)) list[k] = where;
// A string that came from a script and is no longer in any is dropped (page text is kept:
// it is only seen when collected in the browser).
for (const [k, where] of Object.entries(list)) if (/\.js$/.test(where) && !found.has(k)) delete list[k];
list = Object.fromEntries(Object.entries(list).sort(([a], [b]) => a.localeCompare(b)));
fs.mkdirSync(DIR, { recursive: true });
fs.writeFileSync(listFile, JSON.stringify(list, null, 2) + '\n');
console.log(`${Object.keys(list).length} strings in i18n/strings.json (${found.size} found this time).`);

for (const f of fs.readdirSync(DIR).filter(f => /^[a-z]{2}\.json$/.test(f))) {
  const code = f.slice(0, 2);
  const dict = JSON.parse(fs.readFileSync(path.join(DIR, f), 'utf8'));
  const missing = Object.keys(list).filter(k => !(k in dict));
  const unused = Object.keys(dict).filter(k => !(k in list));
  const out = path.join(DIR, `missing-${code}.json`);
  if (missing.length) fs.writeFileSync(out, JSON.stringify(Object.fromEntries(missing.map(k => [k, ''])), null, 2) + '\n');
  else if (fs.existsSync(out)) fs.unlinkSync(out);
  console.log(`${code}: ${missing.length} missing${missing.length ? ` (i18n/missing-${code}.json)` : ''}, ${unused.length} no longer used${unused.length ? ': ' + unused.slice(0, 5).join(' | ') : ''}`);
}
