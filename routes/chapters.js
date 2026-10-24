// The Chapters tab: the Essential Evidence textbook chapters, converted from their
// XML by build_chapters.py into chapters/ (index.json plus one file per chapter).
// The page gets the list of titles, then one chapter at a time; for readers each
// chapter opened counts toward their usage limits.
const path = require('path');
const fs = require('fs');
const express = require('express');
const { requireAuth } = require('../auth');
const { quota } = require('../limits');

const router = express.Router();
router.use(requireAuth);

const DIR = path.join(__dirname, '..', 'chapters');
let index = [];
try {
  index = JSON.parse(fs.readFileSync(path.join(DIR, 'index.json'), 'utf8'));
} catch (err) {
  console.warn(`Chapter list not loaded (${err.message}); the Chapters tab will be empty.`);
}
const known = new Set(index.map(c => c.id));

router.get('/', (req, res) => {
  res.json({ chapters: index });
});

router.get('/:id', quota('chapter'), (req, res) => {
  const id = String(req.params.id).toLowerCase();
  if (!known.has(id)) return res.status(404).json({ error: 'Chapter not found.' });
  res.type('json').sendFile(path.join(DIR, `${id}.json`));
});

module.exports = router;
