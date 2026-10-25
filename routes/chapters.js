// The Chapters tab: the Essential Evidence textbook chapters (chapter-store.js: each
// chapter's XML from the content transfer, or its newest version saved in the Edit
// Chapter tab). The page gets the list of titles, then one chapter at a time; for readers
// each chapter opened counts toward their usage limits.
const express = require('express');
const { requireAuth } = require('../auth');
const { quota } = require('../limits');
const store = require('../chapter-store');

const router = express.Router();
router.use(requireAuth);

router.get('/', (req, res) => {
  res.json({ chapters: store.chapterIndex() });
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
