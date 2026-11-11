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
const { majorMeshFor, meshVersion } = require('../mesh'); // the major topics (MeSH) of each item's study

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

// ---------- Relevance (as for POEMs, search.js) ----------
// Each word or phrase searched for (with its MeSH synonyms) scores for appearing in the
// title (most), the item's MeSH major topics, its summary (a chapter's overall bottom line,
// a risk score's clinical question), and for each time it appears (up to a limit).
const RELEVANCE = { title: 10, meshMajor: 8, summary: 4, perMatch: 1, maxMatches: 20 };
function relevance(q, { title = '', mesh = '', summary = '', text = '' }) {
  let score = 0;
  for (const t of q.scoreTerms) {
    const re = q.regexFor(t);
    if (re.test(title)) score += RELEVANCE.title;
    if (mesh && re.test(mesh)) score += RELEVANCE.meshMajor;
    if (summary && re.test(summary)) score += RELEVANCE.summary;
    if (text) score += RELEVANCE.perMatch * Math.min((text.match(new RegExp(re.source, 'giu')) || []).length, RELEVANCE.maxMatches);
  }
  return score;
}
const byScore = name => (a, b) => (b.score - a.score) || name(a).localeCompare(name(b));

// ---------- Chapters: the plain text of each chapter, kept until the chapter changes ----------
// (Converting all the chapters takes seconds, so it is done once, and again only for a
// chapter that has a newly saved version; the texts are about 13 MB in all.)
const chapterText = new Map(); // id -> { key, text, bottomLine, pmids, topics, topicsFor }
function chapterInfo(id) {
  const key = store.liveKey(id);
  const kept = chapterText.get(id);
  if (kept && kept.key === key) return kept;
  let chapter;
  try { chapter = store.liveChapter(id); } catch { return null; }
  if (!chapter) return null;
  const parts = [];
  const walk = v => {
    if (typeof v === 'string') parts.push(v);
    else if (Array.isArray(v)) v.forEach(walk);
    else if (v && typeof v === 'object') Object.values(v).forEach(walk);
  };
  walk([chapter.overallBottomLine, chapter.sections, chapter.figures]);
  const plain = html => oneLine(htmlToText(String(html).replace(/<\/(li|p|div|td|th|h\d|tr)>/gi, ' $&')).replace(/<[^>]*>/g, ' ')); // keep list items and cells apart
  const blParts = [];
  const walkBl = v => {
    if (typeof v === 'string') blParts.push(v);
    else if (Array.isArray(v)) v.forEach(walkBl);
    else if (v && typeof v === 'object') Object.values(v).forEach(walkBl);
  };
  walkBl(chapter.overallBottomLine);
  const pmids = [...new Set((chapter.references || []).map(r => (/^pubmed(\d+)$/.exec(r.id || '') || [])[1]).filter(Boolean))];
  const info = { key, text: plain(parts.join('\n')), bottomLine: plain(blParts.join('\n')), pmids, topics: '', topicsFor: -1 };
  chapterText.set(id, info);
  return info;
}

// A chapter's MeSH topics: the major topics (MeSH) of its references that are shared by at
// least 2 of them, and by at least a tenth of them; the 12 most frequent.
const TOPICS = { minRefs: 2, minShare: 0.1, max: 12 };
function chapterTopics(info) {
  if (info.topicsFor === meshVersion()) return info.topics;
  const count = new Map();
  for (const pmid of info.pmids) {
    for (const h of majorMeshFor(pmid).split('; ')) if (h) count.set(h, (count.get(h) || 0) + 1);
  }
  const min = Math.max(TOPICS.minRefs, Math.ceil(info.pmids.length * TOPICS.minShare));
  info.topics = [...count].filter(([, n]) => n >= min).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, TOPICS.max).map(([h]) => h).join('; ');
  info.topicsFor = meshVersion();
  return info.topics;
}

// Prepare the texts soon after the app starts, a few chapters at a time, so that the
// first search does not wait for all of them (and the app keeps answering meanwhile).
function warmChapterTexts() {
  const ids = store.chapterIndex().map(c => c.id);
  const step = () => {
    for (let n = 0; n < 10 && ids.length; n++) chapterInfo(ids.shift());
    if (ids.length) setImmediate(step);
  };
  setTimeout(step, 5000).unref();
}
if (process.env.NODE_ENV !== 'test') warmChapterTexts();

// The PubMed IDs of all the chapters' references (for their MeSH headings, mesh.js).
function chapterPmids() {
  const ids = new Set();
  for (const { id } of store.chapterIndex()) {
    const info = chapterInfo(id);
    if (info) info.pmids.forEach(p => ids.add(p));
  }
  return [...ids];
}

function searchChapters(q) {
  const out = [];
  for (const { id, title } of store.chapterIndex()) {
    const info = chapterInfo(id);
    if (!info) continue;
    const mesh = chapterTopics(info);
    if (!q.test(`${title}\n${mesh}\n${info.text}`)) continue;
    out.push({ id, title, score: relevance(q, { title, mesh, summary: info.bottomLine, text: info.text }) });
  }
  return out.sort(byScore(c => c.title));
}

// ---------- Calculators ----------
const calculatorData = require('../calculator-data');
let calc = calculatorData.get();
calculatorData.onChange(d => { calc = d; });
const panelOf = key => calc.panels.find(p => p.key === key) || { tests: [] };

// Results by symptom / disease pair (a topic such as chest pain has hundreds of findings):
// each pair that has a matching entry, with all of its entries, matching ones flagged.
// Pairs are ranked by the presentation and disease (as the title), the major topics of the
// matching entries' studies, and how many entries match.
function searchCalculator(key, q) {
  const pairs = new Map();
  for (const t of panelOf(key).tests) {
    const k = JSON.stringify([t.specialty, t.symptom, t.disease]);
    if (!pairs.has(k)) pairs.set(k, { specialty: t.specialty, symptom: t.symptom, disease: t.disease, items: [], hits: 0, mesh: new Set() });
    const pair = pairs.get(k);
    const mesh = majorMeshFor(t.pmid);
    const match = q.test(`${t.name}\n${t.disambig || ''}\n${t.symptom}\n${t.disease}\n${t.specialty}\n${mesh}`);
    if (match) { pair.hits++; if (mesh) pair.mesh.add(mesh); }
    pair.items.push({ id: t.id, name: t.name, match });
  }
  return [...pairs.values()]
    .filter(p => p.hits)
    .map(p => {
      const items = p.items.sort((a, b) => (b.match - a.match) || a.name.localeCompare(b.name));
      const score = relevance(q, { title: `${p.symptom}\n${p.disease}`, mesh: [...p.mesh].join('; ') }) + Math.min(p.hits, RELEVANCE.maxMatches);
      return { specialty: p.specialty, symptom: p.symptom, disease: p.disease, items, score };
    })
    .sort((a, b) => (b.score - a.score) || a.symptom.localeCompare(b.symptom) || a.disease.localeCompare(b.disease) || a.specialty.localeCompare(b.specialty));
}

// ---------- Risk scores: name, subtitle, clinical question, categories and the study's MeSH major topics ----------
function searchTools(q) {
  const out = [];
  for (const t of tools.values()) {
    const mesh = majorMeshFor(t.evidence && t.evidence.pmid);
    const text = `${t.title}\n${t.subtitle || ''}\n${t.question || ''}\n${(t.categories || []).join('\n')}`;
    if (!q.test(`${text}\n${mesh}`)) continue;
    out.push({ id: t.id, title: t.title, subtitle: t.subtitle || '',
      score: relevance(q, { title: `${t.title}\n${t.subtitle || ''}`, mesh, summary: t.question || '', text }) });
  }
  return out.sort(byScore(t => t.title));
}

const capped = list => ({ total: list.length, items: list.slice(0, MAX_ITEMS).map(({ score, ...rest }) => rest), truncated: list.length > MAX_ITEMS });

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
module.exports.searchChapters = searchChapters;
module.exports.chapterPmids = chapterPmids;
module.exports.chapterTopics = id => { const i = chapterInfo(id); return i ? chapterTopics(i) : ''; };
