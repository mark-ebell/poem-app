const express = require('express');
const crypto = require('crypto');
const db = require('../db');
const { requireAuth } = require('../auth');

const router = express.Router();
router.use(requireAuth);

const VALID_POETS = ['Barry', 'Ebell', 'Shaughnessy', 'Slawson', 'Speer', 'Rowland', 'Rayala'];

function toClient(row) {
  return {
    id: row.id,
    title: row.title,
    poet: row.poet,
    publicationDate: row.publication_date,
    html: row.html,
    createdBy: row.created_by,
    updatedBy: row.updated_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

router.get('/', (req, res) => {
  const rows = db.prepare('SELECT * FROM poems').all();
  res.json({ poems: rows.map(toClient) });
});

function validateBody(body) {
  const { title, poet, publicationDate, html } = body || {};
  if (!title || typeof title !== 'string') return 'Title is required.';
  if (!VALID_POETS.includes(poet)) return 'A valid POET is required.';
  if (!publicationDate || !/^\d{4}-\d{2}$/.test(publicationDate)) return 'A valid publication date is required.';
  if (typeof html !== 'string') return 'Content is required.';
  return null;
}

router.post('/', (req, res) => {
  const error = validateBody(req.body);
  if (error) return res.status(400).json({ error });
  const { title, poet, publicationDate, html } = req.body;
  const now = new Date().toISOString();
  const id = crypto.randomUUID();
  db.prepare(`
    INSERT INTO poems (id, title, poet, publication_date, html, created_by, updated_by, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, title, poet, publicationDate, html, req.session.username, req.session.username, now, now);
  res.status(201).json({ poem: toClient(db.prepare('SELECT * FROM poems WHERE id = ?').get(id)) });
});

router.put('/:id', (req, res) => {
  const existing = db.prepare('SELECT * FROM poems WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'POEM not found.' });
  const error = validateBody(req.body);
  if (error) return res.status(400).json({ error });
  const { title, poet, publicationDate, html } = req.body;
  const now = new Date().toISOString();
  db.prepare(`
    UPDATE poems SET title = ?, poet = ?, publication_date = ?, html = ?, updated_by = ?, updated_at = ?
    WHERE id = ?
  `).run(title, poet, publicationDate, html, req.session.username, now, req.params.id);
  res.json({ poem: toClient(db.prepare('SELECT * FROM poems WHERE id = ?').get(req.params.id)) });
});

router.delete('/:id', (req, res) => {
  const result = db.prepare('DELETE FROM poems WHERE id = ?').run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'POEM not found.' });
  res.json({ ok: true });
});

module.exports = router;
