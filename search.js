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

function buildSearchText(row) {
  return [
    row.title,
    row.reference,
    row.clinical_question,
    stripLiteralTags(htmlToText(row.synopsis)),
    stripLiteralTags(htmlToText(row.bottom_line)),
    row.poem_id,
    row.pubmed_id && row.pubmed_id !== 'NA' ? row.pubmed_id : ''
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
const MAX_QUERY = 300;
const EXCERPT_WORDS = 50;

const escapeRegex = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const escapeLike = s => s.replace(/[\\%_]/g, '\\$&');

// A word or phrase. Spaces inside it match any run of whitespace, and * matches
// any run of letters or digits (so "hypertens*" finds "hypertension").
function termRegex(term, whole) {
  const word = w => w.split('*').map(escapeRegex).join('[\\p{L}\\p{N}]*');
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
      if (phrase) tokens.push({ type: 'term', value: phrase });
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
    if (t.type === 'term') { pos++; return { op: 'term', value: t.value }; }
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

function excerptOf(synopsisHtml) {
  const words = stripLiteralTags(htmlToText(synopsisHtml)).split(/\s+/).filter(Boolean);
  return words.slice(0, EXCERPT_WORDS).join(' ') + (words.length > EXCERPT_WORDS ? '…' : '');
}

// Parses and runs a query; returns { error } or { hits, highlightTerms, whole },
// with hits sorted (title matches first, then newest) as { row, titleHit }.
function runSearch({ q, whole = true, years = null }) {
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

  // Narrow the rows read: each required term's longest word must appear
  // somewhere. (Phrases are matched exactly below, with flexible whitespace.)
  const longestWord = t => t.split(/[\s*]+/).reduce((a, b) => (b.length > a.length ? b : a), '');
  const required = [...new Set(requiredTerms(tree).map(longestWord).filter(Boolean))];
  const conditions = required.map(() => "search_text LIKE ? ESCAPE '\\'");
  const args = required.map(w => `%${escapeLike(w)}%`);
  const since = cutoffMonth(years);
  if (since) { conditions.push('publication_date >= ?'); args.push(since); }
  const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';
  const rows = db.prepare(`
    SELECT id, poem_id, title, poet, publication_date, synopsis, search_text FROM poems ${where}
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
    const titleHit = highlightTerms.length > 0 && highlightTerms.every(t => regexFor(t).test(r.title || ''));
    hits.push({ row: r, titleHit });
  }

  hits.sort((a, b) =>
    (b.titleHit - a.titleHit) ||
    (b.row.publication_date || '').localeCompare(a.row.publication_date || '') ||
    (a.row.title || '').localeCompare(b.row.title || ''));

  return { hits, highlightTerms, whole: !!whole };
}

function searchPoems(params) {
  const result = runSearch(params);
  if (result.error) return result;
  const { hits, highlightTerms, whole } = result;
  const poems = hits.slice(0, MAX_RESULTS).map(({ row }) => ({
    id: row.id,
    poemId: row.poem_id,
    title: row.title,
    poet: row.poet,
    publicationDate: row.publication_date,
    excerpt: excerptOf(row.synopsis)
  }));
  return { total: hits.length, truncated: hits.length > MAX_RESULTS, terms: highlightTerms, whole, poems };
}

// Every POEM matching a query, in full, in the same order as the search results.
const MAX_EXPORT = 500;
function poemsForExport(params) {
  const result = runSearch(params);
  if (result.error) return result;
  const ids = result.hits.map(h => h.row.id);
  if (!ids.length) return { error: 'No POEMs match that search.' };
  if (ids.length > MAX_EXPORT) {
    return { error: `That search matches ${ids.length.toLocaleString()} POEMs. Please narrow it to ${MAX_EXPORT} or fewer to print them.` };
  }
  return { poems: rowsInOrder(ids) };
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
// MAX_SUMMARY_POEMS of them (total is how many matched).
const MAX_SUMMARY_POEMS = 500;
function poemsForSummary(params) {
  const result = runSearch(params);
  if (result.error) return result;
  const sorted = result.hits.map(h => h.row).sort((a, b) =>
    (b.publication_date || '').localeCompare(a.publication_date || '') || (a.title || '').localeCompare(b.title || ''));
  return { total: sorted.length, poems: rowsInOrder(sorted.slice(0, MAX_SUMMARY_POEMS).map(r => r.id)) };
}

module.exports = { cutoffMonth, buildSearchText, backfillSearchText, searchPoems, poemsForExport, poemsForSummary, parseQuery, MAX_EXPORT, MAX_SUMMARY_POEMS };
