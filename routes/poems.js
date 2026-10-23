const express = require('express');
const crypto = require('crypto');
const db = require('../db');
const { requireAuth, requireEditor, isReader } = require('../auth');
const { quota } = require('../limits');
const { normalizePoemBody, toClient, toListItem, generatePoemId } = require('../poem-model');
const { buildSearchText, searchPoems, poemsForExport } = require('../search');
const { buildDocx, buildPrintHtml, buildPoemFragment, buildReaderPoemFragment } = require('../export-poems');

const router = express.Router();
router.use(requireAuth);

// Editors can use everything here. Readers can only browse, search, print (capped)
// and open POEMs in the pop-up, see only Published POEMs, and have usage limits.

// The list carries only the short columns; the full record (reference,
// synopsis, ...) is fetched when a POEM is opened for editing.
router.get('/', requireEditor, (req, res) => {
  const rows = db.prepare(`
    SELECT id, poem_id, title, poet, publication_date, age_group, created_by, created_at, source FROM poems
  `).all();
  res.json({ poems: rows.map(toListItem) });
});

// How far back to search: 1, 2, 3, 5 or 10 years; anything else means the whole database.
const parseYears = v => ([1, 2, 3, 5, 10].includes(Number(v)) ? Number(v) : null);

// Search filters: age group 1 (adults), 2 (children) or 3 (both), as on the Browse tab;
// supertype group dx, tx, sc, px or other. Anything else means no filter.
const searchFilters = src => ({
  ageCodes: /^[123]$/.test(String(src.age || '')) ? [Number(src.age)] : null,
  supertypeGroup: ['dx', 'tx', 'sc', 'px', 'other'].includes(src.supertype) ? src.supertype : null
});

// ---------- Readers' Browse tab (editors filter the full list in the page) ----------
const DATED = "publication_date GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]'";

// The years that have Published POEMs, and the most recent issue month (the default).
router.get('/browse-options', (req, res) => {
  const years = db.prepare(`SELECT DISTINCT substr(publication_date, 1, 4) AS y FROM poems WHERE status = 'Published' AND ${DATED} ORDER BY y DESC`).all().map(r => r.y);
  const latest = db.prepare(`SELECT MAX(publication_date) AS d FROM poems WHERE status = 'Published' AND ${DATED}`).get().d;
  res.json({ years, latest });
});

// Published titles, newest first. ?year=YYYY&month=MM&age=1|2|3 (each optional).
const BROWSE_MAX = 200;
router.get('/browse', quota('search'), (req, res) => {
  const where = ["status = 'Published'"];
  const args = [];
  const year = String(req.query.year || '');
  const month = String(req.query.month || '');
  const age = String(req.query.age || '');
  if (/^\d{4}$/.test(year)) { where.push('substr(publication_date, 1, 4) = ?'); args.push(year); }
  if (/^(0[1-9]|1[0-2])$/.test(month)) { where.push('substr(publication_date, 6, 2) = ?'); args.push(month); }
  if (/^[123]$/.test(age)) { where.push('age_group = ?'); args.push(Number(age)); }
  const clause = 'WHERE ' + where.join(' AND ');
  const total = db.prepare(`SELECT COUNT(*) AS n FROM poems ${clause}`).get(...args).n;
  const poems = db.prepare(`
    SELECT id, title, publication_date, age_group FROM poems ${clause}
    ORDER BY publication_date DESC, title LIMIT ${BROWSE_MAX}
  `).all(...args).map(r => ({ id: r.id, title: r.title, publicationDate: r.publication_date, ageGroup: r.age_group }));
  res.json({ total, poems, truncated: total > poems.length });
});

// Must come before '/:id'. ?q=boolean query&whole=1|0&years=1|2|3|5|10|all
router.get('/search', quota('search'), (req, res) => {
  const result = searchPoems({ q: req.query.q, whole: req.query.whole !== '0', years: parseYears(req.query.years), ...searchFilters(req.query) }, { reader: isReader(req) });
  if (result.error) return res.status(400).json({ error: result.error });
  res.json(result);
});

// Prints every POEM matching a search, in full. { q, whole, format: 'docx' | 'html' }
// 'docx' returns a Word file; 'html' returns a print-ready page (for Save as PDF).
router.post('/export', quota('download'), async (req, res) => {
  const { q, whole, format } = req.body || {};
  const years = parseYears((req.body || {}).years);
  const reader = isReader(req);
  const result = poemsForExport({ q, whole: whole !== false && whole !== '0', years, ...searchFilters(req.body || {}) }, { reader });
  if (result.error) return res.status(400).json({ error: result.error });

  const q1 = String(q).replace(/\s+/g, ' ').trim();
  const range = years ? `, last ${years === 1 ? 'year' : years + ' years'}` : '';
  const count = result.total > result.poems.length ? `first ${result.poems.length} of ${result.total.toLocaleString()}` : `${result.poems.length}`;
  const description = `POEMs matching: ${q1.length > 100 ? q1.slice(0, 100) + '…' : q1} (${count} POEM${result.total === 1 ? '' : 's'}${range})`;
  try {
    if (format === 'docx') {
      const buffer = await buildDocx(result.poems, { description, reader });
      res.set({
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': 'attachment; filename="POEMs.docx"'
      });
      return res.send(buffer);
    }
    res.type('html').send(buildPrintHtml(result.poems, { description, reader }));
  } catch (err) {
    console.error('POEM export failed', err);
    res.status(500).json({ error: 'Could not create the document. See the server log.' });
  }
});

// One POEM formatted for reading in the pop-up (same layout as the printouts).
router.get('/:id/view', quota('view'), (req, res) => {
  const row = db.prepare('SELECT * FROM poems WHERE id = ?').get(req.params.id);
  if (!row || (isReader(req) && row.status !== 'Published')) return res.status(404).json({ error: 'POEM not found.' });
  res.json({ html: isReader(req) ? buildReaderPoemFragment(row) : buildPoemFragment(row), id: row.id });
});

router.get('/:id', requireEditor, (req, res) => {
  const row = db.prepare('SELECT * FROM poems WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'POEM not found.' });
  res.json({ poem: toClient(row) });
});

router.post('/', requireEditor, (req, res) => {
  const { error, fields } = normalizePoemBody(req.body, null);
  if (error) return res.status(400).json({ error });
  const now = new Date().toISOString();
  const id = crypto.randomUUID();
  const poemIdTaken = db.prepare('SELECT 1 FROM poems WHERE poem_id = ?');
  const poemId = generatePoemId(n => !!poemIdTaken.get(n));
  fields.search_text = buildSearchText({ ...fields, poem_id: poemId });
  const f = { ...fields, id, poem_id: poemId, source: 'app', created_by: req.session.username, updated_by: req.session.username, created_at: now, updated_at: now };
  const cols = Object.keys(f);
  db.prepare(`INSERT INTO poems (${cols.join(', ')}) VALUES (${cols.map(c => '@' + c).join(', ')})`).run(f);
  res.status(201).json({ poem: toClient(db.prepare('SELECT * FROM poems WHERE id = ?').get(id)) });
});

router.put('/:id', requireEditor, (req, res) => {
  const existing = db.prepare('SELECT * FROM poems WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'POEM not found.' });
  const { error, fields } = normalizePoemBody(req.body, existing);
  if (error) return res.status(400).json({ error });
  fields.search_text = buildSearchText({ ...fields, poem_id: existing.poem_id });
  const f = { ...fields, id: req.params.id, updated_by: req.session.username, updated_at: new Date().toISOString() };
  const assignments = Object.keys(fields).concat(['updated_by', 'updated_at']).map(c => `${c} = @${c}`).join(', ');
  db.prepare(`UPDATE poems SET ${assignments} WHERE id = @id`).run(f);
  res.json({ poem: toClient(db.prepare('SELECT * FROM poems WHERE id = ?').get(req.params.id)) });
});

router.delete('/:id', requireEditor, (req, res) => {
  const result = db.prepare('DELETE FROM poems WHERE id = ?').run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'POEM not found.' });
  res.json({ ok: true });
});

module.exports = router;
