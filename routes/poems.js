const express = require('express');
const crypto = require('crypto');
const db = require('../db');
const { requireAuth } = require('../auth');
const { normalizePoemBody, toClient, toListItem, generatePoemId } = require('../poem-model');
const { buildSearchText, searchPoems, poemsForExport } = require('../search');
const { buildDocx, buildPrintHtml, buildPoemFragment } = require('../export-poems');

const router = express.Router();
router.use(requireAuth);

// The list carries only the short columns; the full record (reference,
// synopsis, ...) is fetched when a POEM is opened for editing.
router.get('/', (req, res) => {
  const rows = db.prepare(`
    SELECT id, poem_id, title, poet, publication_date, created_by, created_at, source FROM poems
  `).all();
  res.json({ poems: rows.map(toListItem) });
});

// How far back to search: 1, 2, 3, 5 or 10 years; anything else means the whole database.
const parseYears = v => ([1, 2, 3, 5, 10].includes(Number(v)) ? Number(v) : null);

// Must come before '/:id'. ?q=boolean query&whole=1|0&years=1|2|3|5|10|all
router.get('/search', (req, res) => {
  const result = searchPoems({ q: req.query.q, whole: req.query.whole !== '0', years: parseYears(req.query.years) });
  if (result.error) return res.status(400).json({ error: result.error });
  res.json(result);
});

// Prints every POEM matching a search, in full. { q, whole, format: 'docx' | 'html' }
// 'docx' returns a Word file; 'html' returns a print-ready page (for Save as PDF).
router.post('/export', async (req, res) => {
  const { q, whole, format } = req.body || {};
  const years = parseYears((req.body || {}).years);
  const result = poemsForExport({ q, whole: whole !== false && whole !== '0', years });
  if (result.error) return res.status(400).json({ error: result.error });

  const q1 = String(q).replace(/\s+/g, ' ').trim();
  const range = years ? `, last ${years === 1 ? 'year' : years + ' years'}` : '';
  const description = `POEMs matching: ${q1.length > 100 ? q1.slice(0, 100) + '…' : q1} (${result.poems.length} POEM${result.poems.length === 1 ? '' : 's'}${range})`;
  try {
    if (format === 'docx') {
      const buffer = await buildDocx(result.poems, { description });
      res.set({
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': 'attachment; filename="POEMs.docx"'
      });
      return res.send(buffer);
    }
    res.type('html').send(buildPrintHtml(result.poems, { description }));
  } catch (err) {
    console.error('POEM export failed', err);
    res.status(500).json({ error: 'Could not create the document. See the server log.' });
  }
});

// One POEM formatted for reading in the pop-up (same layout as the printouts).
router.get('/:id/view', (req, res) => {
  const row = db.prepare('SELECT * FROM poems WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'POEM not found.' });
  res.json({ html: buildPoemFragment(row), id: row.id });
});

router.get('/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM poems WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'POEM not found.' });
  res.json({ poem: toClient(row) });
});

router.post('/', (req, res) => {
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

router.put('/:id', (req, res) => {
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

router.delete('/:id', (req, res) => {
  const result = db.prepare('DELETE FROM poems WHERE id = ?').run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'POEM not found.' });
  res.json({ ok: true });
});

module.exports = router;
