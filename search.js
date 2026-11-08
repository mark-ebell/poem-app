// Full-text search over POEMs. Each row keeps a plain-text copy of its
// searchable content in poems.search_text (HTML tags removed, so searching for
// "b" or "href" doesn't match markup). Keep it current with refreshSearchText()
// whenever the content changes; backfillSearchText() fills in any row that has
// none (existing POEMs, imports). Keywords, when added, belong in buildSearchText.
const db = require('./db');
const { htmlToText } = require('./poem-model');

// Some historical text contains markup typed as literal text (e.g. a link
// written as "<a href=...>"); it would otherwise be searchable noise.
const stripLiteralTags = s => String(s || '').replace(/<\/?[a-zA-Z][^<>]*>/g, '');

// MeSH headings to search, leaving out the ones on nearly every article (Humans, Male, ...).
const MESH_CHECK_TAGS = new Set(['Humans', 'Animals', 'Male', 'Female']);
const meshForSearch = terms => String(terms || '').split('; ').filter(t => t && !MESH_CHECK_TAGS.has(t)).join('; ');

function buildSearchText(row) {
  return [
    row.title,
    row.reference,
    row.clinical_question,
    stripLiteralTags(htmlToText(row.synopsis)),
    stripLiteralTags(htmlToText(row.bottom_line)),
    row.poem_id,
    row.pubmed_id && row.pubmed_id !== 'NA' ? row.pubmed_id : '',
    meshForSearch(row.mesh_terms) // MeSH headings from PubMed (mesh.js)
  ].filter(v => v !== null && v !== undefined && String(v).trim() !== '').join('\n');
}

function backfillSearchText() {
  const rows = db.prepare('SELECT * FROM poems WHERE search_text IS NULL').all();
  if (!rows.length) return 0;
  const update = db.prepare('UPDATE poems SET search_text = ? WHERE id = ?');
  db.transaction(() => { for (const r of rows) update.run(buildSearchText(r), r.id); })();
  return rows.length;
}

const MAX_RESULTS = 300;
// Readers get shorter lists and smaller printouts, so the archive can't be copied through them.
const READER_MAX_RESULTS = 200;
const READER_MAX_EXPORT = 25;
// Readers see the question and bottom-line answer only for this many results.
// (in each category of results; the page asks for READER_PHONE_ANSWERS on a phone).
const READER_MAX_ANSWERS = 20;
const READER_PHONE_ANSWERS = 10;
const MAX_QUERY = 300;

const escapeRegex = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const escapeLike = s => s.replace(/[\\%_]/g, '\\$&');

// A word or phrase. Spaces inside it match any run of whitespace, and * matches
// any run of letters or digits (so "hypertens*" finds "hypertension").
// Plurals and singulars: a plain word (letters only, at least 3, not all capitals such as
// AIDS) also matches its other form, so "allergies" finds "allergy" and "fracture" finds
// "fractures". Simple English rules; the extra forms that are not real words do no harm.
function wordForms(w) {
  if (w.length < 3 || !/^\p{L}+$/u.test(w) || (w === w.toUpperCase() && w !== w.toLowerCase())) return [w];
  const l = w.toLowerCase();
  const forms = new Set([l]);
  const add = f => { if (f.length >= 3) forms.add(f); };
  if (/ies$/.test(l)) { add(l.slice(0, -3) + 'y'); add(l.slice(0, -1)); }
  else if (/ses$/.test(l)) { add(l.slice(0, -1)); add(l.slice(0, -2)); add(l.slice(0, -2) + 'is'); }
  else if (/es$/.test(l)) { add(l.slice(0, -1)); add(l.slice(0, -2)); }
  else if (/[^su]s$/.test(l) && !/is$/.test(l)) add(l.slice(0, -1));
  else {
    if (/sis$/.test(l)) add(l.slice(0, -2) + 'es');
    if (/[^aeiou]y$/.test(l)) add(l.slice(0, -1) + 'ies');
    add(l + 's');
    if (/(s|x|z|ch|sh|o)$/.test(l)) add(l + 'es');
  }
  return [...forms];
}
// The part every form of a word shares (to narrow the POEMs read with LIKE).
function wordStem(w) {
  if (w.includes('*')) return w;
  const forms = wordForms(w);
  let stem = forms[0];
  for (const f of forms) while (!f.startsWith(stem)) stem = stem.slice(0, -1);
  return stem.length >= 2 ? stem : w;
}

function termRegex(term, whole) {
  const plain = w => { const forms = wordForms(w); return forms.length > 1 ? `(?:${forms.map(escapeRegex).join('|')})` : escapeRegex(w); };
  const word = w => (w.includes('*') ? w.split('*').map(escapeRegex).join('[\\p{L}\\p{N}]*') : plain(w));
  const body = term.split(/\s+/).map(word).join('\\s+');
  return new RegExp(whole ? `(?<![\\p{L}\\p{N}])${body}(?![\\p{L}\\p{N}])` : body, 'iu');
}

// "Search back N years": publications from the current month and the 12*N - 1
// months before it ('YYYY-MM'), plus anything dated later. null = no limit.
function cutoffMonth(years, now = new Date()) {
  if (!years) return null;
  const d = new Date(now.getFullYear(), now.getMonth() - (years * 12 - 1), 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

// ---------- Boolean query parsing ----------
// Words and "quoted phrases" are terms; AND, OR and NOT (capitals) are
// operators; parentheses group. Terms next to each other mean AND, and NOT
// binds tighter than AND, which binds tighter than OR.
class QueryError extends Error {}

function tokenize(input) {
  const tokens = [];
  const re = /\s*(?:(\()|(\))|"([^"]*)(?:"|$)|([^\s()"]+))/gy;
  let m;
  while (re.lastIndex < input.length && (m = re.exec(input)) !== null) {
    if (m[1]) tokens.push({ type: '(' });
    else if (m[2]) tokens.push({ type: ')' });
    else if (m[3] !== undefined) {
      const phrase = m[3].replace(/\s+/g, ' ').trim();
      if (phrase) tokens.push({ type: 'term', value: phrase, quoted: true });
    } else if (m[4] === 'AND' || m[4] === 'OR' || m[4] === 'NOT') tokens.push({ type: m[4] });
    else if (m[4]) tokens.push({ type: 'term', value: m[4] });
  }
  return tokens;
}

function parseQuery(input) {
  const tokens = tokenize(input);
  let pos = 0;
  const peek = () => (pos < tokens.length ? tokens[pos].type : null);

  function parseOr() {
    const kids = [parseAnd()];
    while (peek() === 'OR') { pos++; kids.push(parseAnd()); }
    return kids.length === 1 ? kids[0] : { op: 'or', kids };
  }
  function parseAnd() {
    const kids = [parseUnary()];
    for (;;) {
      if (peek() === 'AND') { pos++; kids.push(parseUnary()); continue; }
      if (peek() === 'term' || peek() === 'NOT' || peek() === '(') { kids.push(parseUnary()); continue; }
      break;
    }
    return kids.length === 1 ? kids[0] : { op: 'and', kids };
  }
  function parseUnary() {
    if (peek() === 'NOT') { pos++; return { op: 'not', kid: parseUnary() }; }
    return parsePrimary();
  }
  function parsePrimary() {
    const t = tokens[pos];
    if (!t) throw new QueryError('The search ends with an operator or has nothing after an opening bracket.');
    if (t.type === 'term') { pos++; return { op: 'term', value: t.value, quoted: !!t.quoted }; }
    if (t.type === '(') {
      pos++;
      const inner = parseOr();
      if (peek() !== ')') throw new QueryError('A bracket was opened but not closed.');
      pos++;
      return inner;
    }
    throw new QueryError(`${t.type === ')' ? 'A closing bracket' : t.type} needs a word or phrase to work on. Put a phrase in "quotes" to search for the word itself.`);
  }

  if (!tokens.length) throw new QueryError('Enter a word or phrase to search for.');
  const tree = parseOr();
  if (pos < tokens.length) throw new QueryError('There is a closing bracket without a matching opening bracket.');
  return tree;
}

// Terms every matching POEM must contain (used to narrow the rows read).
function requiredTerms(node) {
  if (node.op === 'term') return [node.value];
  if (node.op === 'and') return node.kids.flatMap(requiredTerms);
  return [];
}

// Terms to highlight: everything not under a NOT.
function positiveTerms(node, negated = false, out = []) {
  if (node.op === 'term') { if (!negated) out.push(node.value); }
  else if (node.op === 'not') positiveTerms(node.kid, !negated, out);
  else node.kids.forEach(k => positiveTerms(k, negated, out));
  return out;
}

function allTerms(node, out = []) {
  if (node.op === 'term') out.push(node.value);
  else if (node.op === 'not') allTerms(node.kid, out);
  else node.kids.forEach(k => allTerms(k, out));
  return out;
}

function termCount(node) {
  return node.op === 'term' ? 1 : node.op === 'not' ? termCount(node.kid) : node.kids.reduce((n, k) => n + termCount(k), 0);
}

function evaluate(node, test) {
  switch (node.op) {
    case 'term': return test(node.value);
    case 'not': return !evaluate(node.kid, test);
    case 'and': return node.kids.every(k => evaluate(k, test));
    default: return node.kids.some(k => evaluate(k, test));
  }
}

// A field as one line of plain text, for the "question and bottom-line answer" shown under each result.
const plainLine = html => stripLiteralTags(htmlToText(html)).replace(/\s+/g, ' ').trim();

// Supertype groups for the Search tab's filter, by the first letters of the code
// (as in the Evidence Summary): Dx = diagnosis, Tx and TCAM = treatment, Sc =
// screening and prevention, Px = prognosis; 'other' is everything else, including none.
const SUPERTYPE_GROUPS = {
  dx: "lower(supertype) LIKE 'dx%'",
  tx: "(lower(supertype) LIKE 'tx%' OR lower(supertype) = 'tcam')",
  sc: "lower(supertype) LIKE 'sc%'",
  px: "lower(supertype) LIKE 'px%'"
};
SUPERTYPE_GROUPS.other = `NOT (${["COALESCE(lower(supertype), '') LIKE 'dx%'", "COALESCE(lower(supertype), '') LIKE 'tx%'",
  "COALESCE(lower(supertype), '') = 'tcam'", "COALESCE(lower(supertype), '') LIKE 'sc%'", "COALESCE(lower(supertype), '') LIKE 'px%'"].join(' OR ')})`;

// The same groups for showing search results, in the order shown (as in the Evidence Summary).
const RESULT_GROUPS = [
  { key: 'dx', label: 'Diagnosis' },
  { key: 'tx', label: 'Treatment' },
  { key: 'sc', label: 'Screening and prevention' },
  { key: 'px', label: 'Prognosis' },
  { key: 'other', label: 'Other' }
];
function groupOf(supertype) {
  const s = String(supertype || '').toLowerCase();
  if (s.startsWith('dx')) return 'dx';
  if (s.startsWith('tx') || s === 'tcam') return 'tx';
  if (s.startsWith('sc')) return 'sc';
  if (s.startsWith('px')) return 'px';
  return 'other';
}

// ---------- MeSH synonyms ----------
// mesh-synonyms.json (built by build-mesh-synonyms.js from the MeSH vocabulary): groups of
// words for the same thing ("Myocardial Infarction", "Heart Attack"), and the words and
// abbreviations that lead to each group. A search word or phrase in a group also finds the
// rest of the group: heart attack finds myocardial infarction, COPD finds chronic obstructive
// pulmonary disease. Words typed next to each other are tried as a phrase first (up to 6).
let synonyms;
function synonymData() {
  if (synonyms === undefined) {
    try { synonyms = require('./mesh-synonyms.json'); } catch { synonyms = null; }
  }
  return synonyms;
}
const normPhrase = s => s.toLowerCase().replace(/\s+/g, ' ').trim();

// search-abbreviations.json: common clinical abbreviations (DVT, UTI). An abbreviation typed as
// listed finds what it means (and that meaning's MeSH synonyms); a two-way one is also found by
// its meaning, and may be typed in any case.
let abbreviations;
function abbreviationData() {
  if (abbreviations === undefined) {
    abbreviations = { exact: new Map(), anyCase: new Map(), byMeaning: new Map() };
    let list = {};
    try { list = require('./search-abbreviations.json').abbreviations || {}; } catch { /* none */ }
    for (const [abbr, { means = [], twoWay = false }] of Object.entries(list)) {
      abbreviations.exact.set(abbr, means);
      if (!twoWay) continue;
      abbreviations.anyCase.set(abbr.toLowerCase(), means);
      for (const m of means) {
        const k = normPhrase(m);
        if (!abbreviations.byMeaning.has(k)) abbreviations.byMeaning.set(k, []);
        abbreviations.byMeaning.get(k).push(abbr);
      }
    }
  }
  return abbreviations;
}

// The words to search for besides value (null when there are none): its abbreviation's
// meaning, its MeSH synonyms, and the two-way abbreviations for any of them.
function synonymGroup(value) {
  if (value.includes('*')) return null;
  const abbr = abbreviationData();
  const means = abbr.exact.get(value) || abbr.anyCase.get(value.toLowerCase());
  let words = [];
  if (means) for (const m of means) words.push(m, ...(meshGroup(m) || []));
  else words = meshGroup(value) || [];
  const all = [value, ...words];
  for (const w of all) for (const a of abbr.byMeaning.get(normPhrase(w)) || []) words.push(a);
  return words.length ? words : null;
}

function meshGroup(value) {
  const data = synonymData();
  if (!data) return null;
  if (/^[\p{Lu}\p{N}-]+$/u.test(value) && /\p{Lu}/u.test(value) && data.capsKeys[value] !== undefined) return data.groups[data.capsKeys[value]];
  const phrase = normPhrase(value);
  if (data.keys[phrase] !== undefined) return data.groups[data.keys[phrase]];
  // The last word's plural or singular ("heart attacks").
  const words = phrase.split(' ');
  const last = words.pop();
  for (const f of wordForms(last)) {
    const k = [...words, f].join(' ');
    if (data.keys[k] !== undefined) return data.groups[data.keys[k]];
  }
  return null;
}
const isPlainWord = n => n.op === 'term' && !n.quoted && !/[\s*]/.test(n.value);
const synonymNode = (original, group) => {
  const seen = new Set([normPhrase(original.value || '')]);
  const kids = [original];
  for (const t of group) if (!seen.has(normPhrase(t))) { seen.add(normPhrase(t)); kids.push({ op: 'term', value: t, quoted: true }); }
  return kids.length > 1 ? { op: 'or', kids } : original;
};
function expandSynonyms(node) {
  if (node.op === 'term') {
    const group = synonymGroup(node.value);
    return group ? synonymNode(node, group) : node;
  }
  if (node.op === 'not') return { op: 'not', kid: expandSynonyms(node.kid) };
  if (node.op === 'or') return { op: 'or', kids: node.kids.map(expandSynonyms) };
  // AND: words typed next to each other may make a phrase ("high blood pressure").
  const kids = [];
  for (let i = 0; i < node.kids.length;) {
    let done = false;
    if (isPlainWord(node.kids[i])) {
      let run = i;
      while (run < node.kids.length && run - i < 6 && isPlainWord(node.kids[run])) run++;
      for (let j = run; j >= i + 2 && !done; j--) {
        const parts = node.kids.slice(i, j);
        const group = synonymGroup(parts.map(k => k.value).join(' '));
        if (group) {
          kids.push(synonymNode({ op: 'and', kids: parts }, group));
          i = j;
          done = true;
        }
      }
    }
    if (!done) { kids.push(expandSynonyms(node.kids[i])); i++; }
  }
  return kids.length === 1 ? kids[0] : { op: 'and', kids };
}

// Parses a query for searching text other than POEMs (chapters, calculators, risk scores):
// returns { error } or { test(text) -> boolean, terms, regexFor(term) }, with the same
// rules and limits as the POEM search.
function compileQuery(q, whole = true) {
  const text = String(q || '').replace(/[\u201c\u201d]/g, '"').trim();
  if (text.length < 2) return { error: 'Enter at least two characters to search for.' };
  if (text.length > MAX_QUERY) return { error: 'That search is too long.' };
  let tree;
  try { tree = parseQuery(text); } catch (err) {
    if (err instanceof QueryError) return { error: err.message };
    throw err;
  }
  if (termCount(tree) > 20) return { error: 'Please use no more than 20 words or phrases.' };
  const thin = allTerms(tree).find(t => t.includes('*') && t.replace(/\*/g, '').replace(/\s/g, '').length < 2);
  if (thin) return { error: `A wildcard search needs at least two letters or digits besides the * (in "${thin}").` };
  const cache = new Map();
  const regexFor = t => {
    if (!cache.has(t)) cache.set(t, termRegex(t, whole));
    return cache.get(t);
  };
  const terms = [...new Set(positiveTerms(tree))]; // as typed (for "found in the title")
  const expanded = expandSynonyms(tree);
  return { test: s => evaluate(expanded, t => regexFor(t).test(s)), terms, regexFor };
}

// How relevant a POEM is to the search words: each word or phrase scores for appearing
// in the title (most), the article's MeSH major topics, the clinical question or bottom line, and for each time it
// appears anywhere (up to 10 times).
const RELEVANCE = { title: 10, meshMajor: 8, question: 4, bottomLine: 4, perMatch: 1, maxMatches: 10 };
function relevanceOf(row, terms, regexFor) {
  const question = row.clinical_question || '', bottomLine = plainLine(row.bottom_line);
  let score = 0;
  for (const t of terms) {
    const re = regexFor(t);
    if (re.test(row.title || '')) score += RELEVANCE.title;
    if (re.test(row.mesh_major || '')) score += RELEVANCE.meshMajor; // a major topic of the article (MeSH)
    if (re.test(question)) score += RELEVANCE.question;
    if (re.test(bottomLine)) score += RELEVANCE.bottomLine;
    const all = row.search_text.match(new RegExp(re.source, 'giu')) || [];
    score += RELEVANCE.perMatch * Math.min(all.length, RELEVANCE.maxMatches);
  }
  return score;
}

const newestFirst = (a, b) =>
  (b.publication_date || '').localeCompare(a.publication_date || '') || (a.title || '').localeCompare(b.title || '');

// Parses and runs a query; returns { error } or { hits, highlightTerms, whole }, with hits
// as { row } sorted by sort: 'relevance' (most relevant first, ties newest first) or
// 'date' (newest first). publishedOnly (for readers) leaves out POEMs that are still
// being edited; supertypeGroup is a key of SUPERTYPE_GROUPS; mainOnly keeps only POEMs whose
// title or clinical question matches the query by itself (the POEM's main topic).
function runSearch({ q, whole = true, years = null, ageCodes = null, supertypeGroup = null, publishedOnly = false, sort = 'relevance', mainOnly = false }) {
  const text = String(q || '').replace(/[\u201c\u201d]/g, '"').trim();
  if (text.length < 2) return { error: 'Enter at least two characters to search for.' };
  if (text.length > MAX_QUERY) return { error: 'That search is too long.' };

  let tree;
  try { tree = parseQuery(text); } catch (err) {
    if (err instanceof QueryError) return { error: err.message };
    throw err;
  }
  if (termCount(tree) > 20) return { error: 'Please use no more than 20 words or phrases.' };
  const thin = allTerms(tree).find(t => t.includes('*') && t.replace(/\*/g, '').replace(/\s/g, '').length < 2);
  if (thin) return { error: `A wildcard search needs at least two letters or digits besides the * (in "${thin}").` };
  tree = expandSynonyms(tree);

  // Narrow the rows read: each required term's longest word must appear
  // somewhere. (Phrases are matched exactly below, with flexible whitespace.)
  const longestWord = t => t.split(/[\s*]+/).reduce((a, b) => (b.length > a.length ? b : a), '');
  const required = [...new Set(requiredTerms(tree).map(longestWord).filter(Boolean).map(wordStem))];
  const conditions = required.map(() => "search_text LIKE ? ESCAPE '\\'");
  const args = required.map(w => `%${escapeLike(w)}%`);
  if (publishedOnly) conditions.push("status = 'Published'");
  if (supertypeGroup && SUPERTYPE_GROUPS[supertypeGroup]) conditions.push(SUPERTYPE_GROUPS[supertypeGroup]);
  const since = cutoffMonth(years);
  if (since) { conditions.push('publication_date >= ?'); args.push(since); }
  if (ageCodes && ageCodes.length) {
    conditions.push(`age_group IN (${ageCodes.map(() => '?').join(',')})`);
    args.push(...ageCodes);
  }
  const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';
  const rows = db.prepare(`
    SELECT id, poem_id, title, poet, publication_date, supertype, clinical_question, bottom_line, mesh_major, search_text FROM poems ${where}
  `).all(...args);

  const regexCache = new Map();
  const regexFor = t => {
    if (!regexCache.has(t)) regexCache.set(t, termRegex(t, whole));
    return regexCache.get(t);
  };

  const highlightTerms = [...new Set(positiveTerms(tree))];
  const hits = [];
  for (const r of rows) {
    const memo = new Map();
    const test = t => {
      if (!memo.has(t)) memo.set(t, regexFor(t).test(r.search_text));
      return memo.get(t);
    };
    if (!evaluate(tree, test)) continue;
    if (mainOnly) {
      const main = `${r.title || ''}\n${r.clinical_question || ''}`;
      if (!evaluate(tree, t => regexFor(t).test(main))) continue;
    }
    hits.push({ row: r, score: sort === 'date' ? 0 : relevanceOf(r, highlightTerms, regexFor) });
  }

  hits.sort((a, b) => (b.score - a.score) || newestFirst(a.row, b.row));

  return { hits, highlightTerms, whole: !!whole };
}

// The POEMs found, in groups by category (RESULT_GROUPS, leaving out empty ones), each in
// the order asked for and listing at most MAX_RESULTS (READER_MAX_RESULTS for a reader).
// reader: Published POEMs only, no POET or POEM number, and the question and bottom-line
// answer for the first READER_MAX_ANSWERS of each group only (READER_PHONE_ANSWERS with phone).
function searchPoems(params, { reader = false } = {}) {
  const result = runSearch({ ...params, publishedOnly: reader });
  if (result.error) return result;
  const { hits, highlightTerms, whole } = result;
  const max = reader ? READER_MAX_RESULTS : MAX_RESULTS;
  const answers = params.phone ? READER_PHONE_ANSWERS : READER_MAX_ANSWERS;
  const byGroup = new Map(RESULT_GROUPS.map(g => [g.key, []]));
  for (const { row } of hits) byGroup.get(groupOf(row.supertype)).push(row);
  const groups = RESULT_GROUPS.filter(g => byGroup.get(g.key).length).map(g => {
    const rows = byGroup.get(g.key);
    const poems = rows.slice(0, max).map((row, i) => (reader ? {
      id: row.id,
      title: row.title,
      publicationDate: row.publication_date,
      ...(i < answers ? { question: plainLine(row.clinical_question), bottomLine: plainLine(row.bottom_line) } : {})
    } : {
      id: row.id,
      poemId: row.poem_id,
      title: row.title,
      poet: row.poet,
      publicationDate: row.publication_date,
      question: plainLine(row.clinical_question),
      bottomLine: plainLine(row.bottom_line)
    }));
    return { key: g.key, label: g.label, total: rows.length, truncated: rows.length > max, poems };
  });
  return {
    total: hits.length, terms: highlightTerms, whole, groups,
    answersLimit: reader ? answers : null,
    sort: params.sort === 'date' ? 'date' : 'relevance', mainOnly: !!params.mainOnly
  };
}

// Every POEM matching a query, in full, in the same order as the search results.
// For a reader, only the first READER_MAX_EXPORT Published POEMs are printed (total
// is how many matched).
const MAX_EXPORT = 500;
function poemsForExport(params, { reader = false } = {}) {
  const result = runSearch({ ...params, publishedOnly: reader });
  if (result.error) return result;
  const ids = result.hits.map(h => h.row.id);
  if (!ids.length) return { error: 'No POEMs match that search.' };
  if (reader) return { total: ids.length, poems: rowsInOrder(ids.slice(0, READER_MAX_EXPORT)) };
  if (ids.length > MAX_EXPORT) {
    return { error: `That search matches ${ids.length.toLocaleString()} POEMs. Please narrow it to ${MAX_EXPORT} or fewer to print them.` };
  }
  return { total: ids.length, poems: rowsInOrder(ids) };
}

function rowsInOrder(ids) {
  const byId = new Map();
  for (let i = 0; i < ids.length; i += 200) {
    const chunk = ids.slice(i, i + 200);
    const rows = db.prepare(`SELECT * FROM poems WHERE id IN (${chunk.map(() => '?').join(',')})`).all(...chunk);
    rows.forEach(r => byId.set(r.id, r));
  }
  return ids.map(id => byId.get(id)).filter(Boolean);
}

// The POEMs matching a query for the Evidence Summary: newest first, at most
// MAX_SUMMARY_POEMS of them (total is how many matched). For a reader, Published
// POEMs only. The cap keeps the server's memory in bounds: building the Word
// document takes roughly 1 GB for 5,000 POEMs, and the Render plan has 512 MB.
const MAX_SUMMARY_POEMS = 500;
function poemsForSummary(params, { reader = false } = {}) {
  const result = runSearch({ ...params, publishedOnly: reader });
  if (result.error) return result;
  const sorted = result.hits.map(h => h.row).sort(newestFirst);
  return { total: sorted.length, poems: rowsInOrder(sorted.slice(0, MAX_SUMMARY_POEMS).map(r => r.id)) };
}

const parseSort = v => (v === 'date' ? 'date' : 'relevance');

module.exports = { parseSort, cutoffMonth, buildSearchText, backfillSearchText, searchPoems, compileQuery, poemsForExport, poemsForSummary, parseQuery, MAX_EXPORT, MAX_SUMMARY_POEMS, READER_MAX_EXPORT };
