const express = require('express');
const crypto = require('crypto');
const db = require('../db');
const { requireAuth } = require('../auth');
const { normalizePoemBody, toClient, toListItem, generatePoemId } = require('../poem-model');
const { buildSearchText, searchPoems } = require('../search');

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

// Must come before '/:id'. ?q=text&mode=phrase|all&whole=1|0
router.get('/search', (req, res) => {
  const result = searchPoems({ q: req.query.q, mode: req.query.mode === 'all' ? 'all' : 'phrase', whole: req.query.whole !== '0' });
  if (result.error) return res.status(400).json({ error: result.error });
  res.json(result);
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
