// The Search tab: one search across POEMs, textbook chapters (full text), the History and
// Physical and Diagnostic Tests calculators, and the Risk Scores, with the same AND / OR /
// NOT rules as the POEM search (search.js). ?q=…&type=all|poems|chapters|signs|tests|tools
// and, for POEMs, &years=…&age=…&supertype=…. One search counts once toward a reader's limits.
const path = require('path');
const fs = require('fs');
const express = require('express');
const { requireAuth, isReader } = require('../auth');
const { quota } = require('../limits');
const { searchPoems, compileQuery } = require('../search');
const { htmlToText } = require('../poem-model');
const store = require('../chapter-store');
const { tools } = require('./tools');

const router = express.Router();
router.use(requireAuth);

const TYPES = ['poems', 'chapters', 'signs', 'tests', 'tools'];
const MAX_ITEMS = 300; // per kind of item, other than POEMs (which have their own limits)

const parseYears = v => ([1, 2, 3, 5, 10].includes(Number(v)) ? Number(v) : null);
const poemFilters = src => ({
  ageCodes: /^[123]$/.test(String(src.age || '')) ? [Number(src.age)] : null,
  supertypeGroup: ['dx', 'tx', 'sc', 'px', 'other'].includes(src.supertype) ? src.supertype : null
});

const oneLine = s => String(s || '').replace(/\s+/g, ' ').trim();

// ---------- Chapters: the plain text of each chapter, kept until the chapter changes ----------
const chapterText = new WeakMap();
function textOf(chapter) {
  if (chapterText.has(chapter)) return chapterText.get(chapter);
  const parts = [];
  const walk = v => {
    if (typeof v === 'string') parts.push(v);
    else if (Array.isArray(v)) v.forEach(walk);
    else if (v && typeof v === 'object') Object.values(v).forEach(walk);
  };
  walk([chapter.overallBottomLine, chapter.sections, chapter.figures]);
  const html = parts.join('\n').replace(/<\/(li|p|div|td|th|h\d|tr)>/gi, ' $&'); // keep list items and cells apart
  const text = oneLine(htmlToText(html).replace(/<[^>]*>/g, ' '));
  chapterText.set(chapter, text);
  return text;
}

// About 200 characters of text around the first matching term.
function snippet(text, q) {
  for (const t of q.terms) {
    const m = q.regexFor(t).exec(text);
    if (!m) continue;
    const start = Math.max(0, m.index - 90), end = Math.min(text.length, m.index + m[0].length + 110);
    return `${start > 0 ? '… ' : ''}${text.slice(start, end).trim()}${end < text.length ? ' …' : ''}`;
  }
  return text.slice(0, 200) + (text.length > 200 ? ' …' : '');
}

function searchChapters(q) {
  const out = [];
  for (const { id, title } of store.chapterIndex()) {
    let chapter;
    try { chapter = store.liveChapter(id); } catch { continue; }
    if (!chapter) continue;
    const text = textOf(chapter);
    if (!q.test(`${title}\n${text}`)) continue;
    out.push({ id, title, titleHit: q.terms.every(t => q.regexFor(t).test(title)), snippet: snippet(text, q) });
  }
  out.sort((a, b) => (b.titleHit - a.titleHit) || a.title.localeCompare(b.title));
  return out;
}

// ---------- Calculators ----------
let calc = { panels: [] };
try { calc = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'calculator-data.json'), 'utf8')); } catch { /* no calculator data */ }
const panelOf = key => calc.panels.find(p => p.key === key) || { tests: [] };

function searchCalculator(key, q) {
  return panelOf(key).tests
    .filter(t => q.test(`${t.name}\n${t.disambig || ''}\n${t.symptom}\n${t.disease}\n${t.specialty}`))
    .map(t => ({ id: t.id, name: t.name, specialty: t.specialty, symptom: t.symptom, disease: t.disease, titleHit: q.terms.every(x => q.regexFor(x).test(t.name)) }))
    .sort((a, b) => (b.titleHit - a.titleHit) || a.name.localeCompare(b.name) || a.symptom.localeCompare(b.symptom));
}

// ---------- Risk scores ----------
function searchTools(q) {
  return [...tools.values()]
    .filter(t => q.test(`${t.title}\n${t.subtitle || ''}\n${t.question || ''}`))
    .map(t => ({ id: t.id, title: t.title, subtitle: t.subtitle || '', titleHit: q.terms.every(x => q.regexFor(x).test(t.title)) }))
    .sort((a, b) => (b.titleHit - a.titleHit) || a.title.localeCompare(b.title));
}

const capped = list => ({ total: list.length, items: list.slice(0, MAX_ITEMS).map(({ titleHit, ...rest }) => rest), truncated: list.length > MAX_ITEMS });

router.get('/', quota('search'), (req, res) => {
  const type = TYPES.includes(req.query.type) ? req.query.type : 'all';
  const want = k => type === 'all' || type === k;
  const q = compileQuery(req.query.q, true);
  if (q.error) return res.status(400).json({ error: q.error });
  const out = { type, terms: q.terms, whole: true };
  if (want('poems')) {
    const poems = searchPoems({ q: req.query.q, whole: true, years: parseYears(req.query.years), ...poemFilters(req.query) }, { reader: isReader(req) });
    if (poems.error) return res.status(400).json({ error: poems.error });
    out.poems = poems;
  }
  if (want('chapters')) out.chapters = capped(searchChapters(q));
  if (want('signs')) out.signs = capped(searchCalculator('signsSymptoms', q));
  if (want('tests')) out.tests = capped(searchCalculator('diagnosticTests', q));
  if (want('tools')) out.tools = capped(searchTools(q));
  res.json(out);
});

module.exports = router;
