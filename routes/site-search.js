// The Search tab: one search across POEMs, textbook chapters (full text), the History and
// Physical and Diagnostic Tests calculators, and the Risk Scores, with the same AND / OR /
// NOT rules as the POEM search (search.js). Readers with the POEMs only (auth.js) get POEMs only. ?q=…&type=all|poems|chapters|signs|tests|tools
// and, for POEMs, &years=…&age=…&supertype=…&sort=relevance|date&main=1 (main topic only). One search counts once toward a reader's limits.
const path = require('path');
const fs = require('fs');
const express = require('express');
const { requireAuth, isReader, poemsOnly } = require('../auth');
const { quota } = require('../limits');
const { searchPoems, compileQuery, parseSort } = require('../search');
const { htmlToText } = require('../poem-model');
const store = require('../chapter-store');
const { tools } = require('./tools');
const { majorMeshFor } = require('../mesh'); // the major topics (MeSH) of each item's study

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

function searchChapters(q) {
  const out = [];
  for (const { id, title } of store.chapterIndex()) {
    let chapter;
    try { chapter = store.liveChapter(id); } catch { continue; }
    if (!chapter) continue;
    const text = textOf(chapter);
    if (!q.test(`${title}\n${text}`)) continue;
    out.push({ id, title, titleHit: q.terms.every(t => q.regexFor(t).test(title)) });
  }
  out.sort((a, b) => (b.titleHit - a.titleHit) || a.title.localeCompare(b.title));
  return out;
}

// ---------- Calculators ----------
const calculatorData = require('../calculator-data');
let calc = calculatorData.get();
calculatorData.onChange(d => { calc = d; });
const panelOf = key => calc.panels.find(p => p.key === key) || { tests: [] };

// Results by symptom / disease pair (a topic such as chest pain has hundreds of findings):
// each pair that has a matching entry, with all of its entries, matching ones flagged.
function searchCalculator(key, q) {
  const pairs = new Map();
  for (const t of panelOf(key).tests) {
    const k = JSON.stringify([t.specialty, t.symptom, t.disease]);
    if (!pairs.has(k)) pairs.set(k, { specialty: t.specialty, symptom: t.symptom, disease: t.disease, items: [], hits: 0 });
    const pair = pairs.get(k);
    const match = q.test(`${t.name}\n${t.disambig || ''}\n${t.symptom}\n${t.disease}\n${t.specialty}\n${majorMeshFor(t.pmid)}`);
    if (match) pair.hits++;
    pair.items.push({ id: t.id, name: t.name, match });
  }
  return [...pairs.values()]
    .filter(p => p.hits)
    .map(p => {
      const items = p.items.sort((a, b) => (b.match - a.match) || a.name.localeCompare(b.name));
      return { specialty: p.specialty, symptom: p.symptom, disease: p.disease, items, titleHit: q.terms.every(x => q.regexFor(x).test(`${p.symptom} ${p.disease}`)) };
    })
    .sort((a, b) => (b.titleHit - a.titleHit) || a.symptom.localeCompare(b.symptom) || a.disease.localeCompare(b.disease) || a.specialty.localeCompare(b.specialty));
}

// ---------- Risk scores: name, subtitle, clinical question, categories and the study's MeSH major topics ----------
function searchTools(q) {
  return [...tools.values()]
    .filter(t => q.test(`${t.title}\n${t.subtitle || ''}\n${t.question || ''}\n${(t.categories || []).join('\n')}\n${majorMeshFor(t.evidence && t.evidence.pmid)}`))
    .map(t => ({ id: t.id, title: t.title, subtitle: t.subtitle || '', titleHit: q.terms.every(x => q.regexFor(x).test(t.title)) }))
    .sort((a, b) => (b.titleHit - a.titleHit) || a.title.localeCompare(b.title));
}

const capped = list => ({ total: list.length, items: list.slice(0, MAX_ITEMS).map(({ titleHit, ...rest }) => rest), truncated: list.length > MAX_ITEMS });

router.get('/', quota('search'), (req, res) => {
  // Readers with the POEMs only search the POEMs, whatever was asked for.
  const type = poemsOnly(req) ? 'poems' : TYPES.includes(req.query.type) ? req.query.type : 'all';
  const want = k => type === 'all' || type === k;
  const q = compileQuery(req.query.q, true);
  if (q.error) return res.status(400).json({ error: q.error });
  const out = { type, terms: q.terms, whole: true };
  if (want('poems')) {
    const poems = searchPoems({ q: req.query.q, whole: true, years: parseYears(req.query.years), sort: parseSort(req.query.sort), mainOnly: req.query.main === '1', phone: req.query.phone === '1', ...poemFilters(req.query) }, { reader: isReader(req) });
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
// Also used by the Evidence Summary (evidence-summary.js) to count matching calculators and risk scores.
module.exports.searchCalculator = searchCalculator;
module.exports.searchTools = searchTools;
