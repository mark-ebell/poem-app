// The Chapters tab: the Essential Evidence textbook chapters (chapter-store.js: each
// chapter's XML from the content transfer, or its newest version saved in the Edit
// Chapter tab). The page gets the list of titles, then one chapter at a time; for readers
// each chapter opened counts toward their usage limits.
const path = require('path');
const express = require('express');
const { requireFullAccess } = require('../auth');
const { quota } = require('../limits');
const store = require('../chapter-store');

const router = express.Router();
router.use(requireFullAccess); // not for readers with the POEMs only

router.get('/', (req, res) => {
  res.json({ chapters: store.chapterIndex() });
});

// A figure's image (chapters/images, copied there by build-chapters.js).
const IMG_DIR = path.join(__dirname, '..', 'chapters', 'images');
router.get('/images/:file', (req, res) => {
  const file = String(req.params.file).toLowerCase();
  if (!/^[a-z0-9][a-z0-9 ._()-]*\.(gif|jpe?g|png|svg)$/.test(file)) return res.status(404).end();
  res.sendFile(path.join(IMG_DIR, file), { maxAge: '7d' }, err => { if (err && !res.headersSent) res.status(404).end(); });
});

router.get('/:id', quota('chapter'), (req, res) => {
  const id = String(req.params.id).toLowerCase();
  if (!store.known(id)) return res.status(404).json({ error: 'Chapter not found.' });
  let chapter;
  try {
    chapter = store.liveChapter(id);
  } catch (err) {
    console.error(`Chapter ${id} could not be converted`, err);
    return res.status(500).json({ error: 'This chapter could not be shown. See the server log.' });
  }
  if (!chapter) return res.status(404).json({ error: 'Chapter not found.' });
  res.json(chapter);
});

module.exports = router;
