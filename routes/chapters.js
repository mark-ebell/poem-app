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

// Links to EE+ decision rules (chapter-convert.js: class "tool-link", data-rule = the EE+
// number) become links to the risk score that replaced the rule, with its current name; a
// rule with no risk score here (retired) keeps its name as plain text.
const riskScoreFor = ee => [...require('./tools').tools.values()].find(t => String(t.eeId) === String(ee));
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
function linkRiskScores(value) {
  if (typeof value === 'string') {
    if (!value.includes('tool-link')) return value;
    const find = riskScoreFor;
    return value
      // The rule's name at a citation: the risk score's current name.
      .replace(/<a href="#" class="tool-link" data-rule="(\d+)">([^<]*)<\/a>/g, (m, ee, label) => {
        const tool = find(ee);
        return tool ? `<a href="#" class="tool-link" data-rule="${ee}" data-tool="${esc(tool.id)}">${esc(tool.title)}</a>` : label;
      })
      // A reference's "Risk score" link (left out when there is none).
      .replace(/ ?<a href="#" class="tool-link tool-ref" data-rule="(\d+)">([^<]*)<\/a>/g, (m, ee, label) => {
        const tool = find(ee);
        return tool ? ` <a href="#" class="tool-link tool-ref" data-rule="${ee}" data-tool="${esc(tool.id)}">${label}</a>` : '';
      })
      // A named link: the chapter's own words, linked.
      .replace(/<a href="#" class="tool-link tool-named" data-rule="(\d+)">([\s\S]*?)<\/a>/g, (m, ee, text) => {
        const tool = find(ee);
        return tool ? `<a href="#" class="tool-link tool-named" data-rule="${ee}" data-tool="${esc(tool.id)}">${text}</a>` : text;
      });
  }
  if (Array.isArray(value)) return value.map(linkRiskScores).filter(v => v !== undefined);
  if (value && value.rule && value.label === 'Risk score') { // a reference's link
    const tool = riskScoreFor(value.rule);
    return tool ? { label: value.label, tool: tool.id } : undefined;
  }
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, linkRiskScores(v)]));
  return value;
}
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
  const out = linkRiskScores(chapter);
  // Decision support: the risk scores for the rules the chapter links to or cites.
  const ds = out.decisionSupport || {};
  const seen = new Set();
  ds.riskScores = (ds.rules || []).map(riskScoreFor).filter(t => t && !seen.has(t.id) && seen.add(t.id)).map(t => ({ label: t.title, tool: t.id }));
  delete ds.rules;
  res.json(out);
});

module.exports = router;
