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
const MAX_TERMS = 8;

const escapeRegex = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const escapeLike = s => s.replace(/[\\%_]/g, '\\$&');

function termRegex(term, whole) {
  const body = escapeRegex(term);
  return new RegExp(whole ? `(?<![\\p{L}\\p{N}])${body}(?![\\p{L}\\p{N}])` : body, 'iu');
}

// mode: 'phrase' (the whole input, exactly as typed) or 'all' (every word, any order).
function searchPoems({ q, mode = 'phrase', whole = true }) {
  const text = String(q || '').replace(/\s+/g, ' ').trim().slice(0, 200);
  if (text.length < 2) return { error: 'Enter at least two characters to search for.' };

  const terms = mode === 'all'
    ? [...new Set(text.split(' ').filter(Boolean))].slice(0, MAX_TERMS)
    : [text];

  const where = terms.map(() => "search_text LIKE ? ESCAPE '\\'").join(' AND ');
  const rows = db.prepare(`
    SELECT id, poem_id, title, poet, publication_date, search_text FROM poems WHERE ${where}
  `).all(...terms.map(t => `%${escapeLike(t)}%`));

  const regexes = terms.map(t => termRegex(t, whole));
  const hits = [];
  for (const r of rows) {
    if (!regexes.every(re => re.test(r.search_text))) continue;
    const titleHit = regexes.every(re => re.test(r.title || ''));
    hits.push({ row: r, titleHit });
  }

  hits.sort((a, b) =>
    (b.titleHit - a.titleHit) ||
    (b.row.publication_date || '').localeCompare(a.row.publication_date || '') ||
    (a.row.title || '').localeCompare(b.row.title || ''));

  const poems = hits.slice(0, MAX_RESULTS).map(({ row }) => ({
    id: row.id,
    poemId: row.poem_id,
    title: row.title,
    poet: row.poet,
    publicationDate: row.publication_date,
    snippet: snippetFor(row.search_text, regexes)
  }));
  return { total: hits.length, truncated: hits.length > MAX_RESULTS, terms, whole: !!whole, poems };
}

// A short passage around the first match, taken from the content after the title.
function snippetFor(searchText, regexes) {
  const nl = searchText.indexOf('\n');
  const body = nl === -1 ? '' : searchText.slice(nl + 1);
  let best = null;
  for (const re of regexes) {
    const m = re.exec(body);
    if (m && (!best || m.index < best.index)) best = { index: m.index, length: m[0].length };
  }
  if (!best) return '';
  const start = Math.max(0, best.index - 90);
  const end = Math.min(body.length, best.index + best.length + 150);
  let s = body.slice(start, end).replace(/\s+/g, ' ').trim();
  if (start > 0) s = '…' + s;
  if (end < body.length) s += '…';
  return s;
}

module.exports = { buildSearchText, backfillSearchText, searchPoems };
