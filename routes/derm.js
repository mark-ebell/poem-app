// The Derm Expert tab: a visual guide to diagnosing skin conditions, from the former
// Essential Evidence Plus Derm Expert Image Viewer. The user chooses the main type of
// lesion (the primary morphology), then its features, and sees the conditions that fit,
// each with its photos. The data (derm-expert/derm-expert.json) and the photos
// (derm-expert/images) were archived from EE+ on 2026-11-25.
//
// Until the rights to the photos are confirmed, only editors see it. Setting
// DERM_EXPERT_RELEASED=on (on Render) opens it to readers with full access as well.
const fs = require('fs');
const path = require('path');
const express = require('express');
const { requireAuth, dermExpertOpen } = require('../auth');
const store = require('../chapter-store');

const router = express.Router();
router.use(requireAuth, (req, res, next) => {
  if (!dermExpertOpen(req.session)) return res.status(403).json({ error: 'The Derm Expert is not available to your account yet.' });
  next();
});

const DIR = path.join(__dirname, '..', 'derm-expert');
let data = { morphologies: [], conditions: {} };
try { data = JSON.parse(fs.readFileSync(path.join(DIR, 'derm-expert.json'), 'utf8')); } catch (err) { console.warn(`Derm Expert not loaded (${err.message}).`); }

router.get('/', (req, res) => {
  // Chapter titles are looked up now, as editors can retitle a chapter.
  const titles = new Map(store.chapterIndex().map(c => [c.id, c.title]));
  const conditions = {};
  for (const [id, c] of Object.entries(data.conditions)) {
    const chapterTitle = c.chapter && titles.get(c.chapter);
    conditions[id] = { ...c, chapter: chapterTitle ? { id: c.chapter, title: chapterTitle } : null };
  }
  res.json({ morphologies: data.morphologies, conditions });
});

router.get('/images/:file', (req, res) => {
  const file = String(req.params.file);
  if (!/^[A-Za-z0-9][A-Za-z0-9_.-]*\.jpe?g$/i.test(file)) return res.status(404).end();
  res.set('Cache-Control', 'private, max-age=604800'); // the photos never change
  res.sendFile(path.join(DIR, 'images', file), { cacheControl: false }, err => { if (err && !res.headersSent) res.status(404).end(); });
});

module.exports = router;
