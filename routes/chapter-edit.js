// The Edit Chapter tab (editors only): reviewing a chapter with tracked changes, Claude's
// evidence update, inserting references, and saving the result as the chapter's XML.
const express = require('express');
const { requireEditor } = require('../auth');
const db = require('../db');
const pm = require('../pubmed');
const store = require('../chapter-store');
const { buildEditorState, runUpdate, searchTermsFor, AREAS } = require('../chapter-update');
const planner = require('../chapter-plan');
const batches = require('../chapter-batch');
const { writeChapterXml, formatAuthors } = require('../chapter-xml-write');

const router = express.Router();
router.use(requireEditor);

const idOf = req => String(req.params.id || '').toLowerCase();
function knownChapter(req, res) {
  const id = idOf(req);
  if (!store.known(id)) { res.status(404).json({ error: 'Chapter not found.' }); return null; }
  return id;
}
const displayName = req => {
  const u = db.prepare('SELECT display_name FROM users WHERE id = ?').get(req.session.userId);
  return (u && u.display_name) || req.session.username;
};

// The chapter list, with what has been edited, what is under review, and each chapter's
// plan (update month, editor); also the editors and the monthly updates.
router.get('/', (req, res) => {
  const plans = planner.plans();
  res.json({
    chapters: store.editStatus().map(c => {
      const p = plans.get(c.id) || {};
      return { ...c, plan: { month: p.month || null, editor: p.editor || null, searchTerms: p.search_terms || '' } };
    }),
    editors: planner.editors(),
    me: req.session.username,
    monthly: batches.batchStatus()
  });
});

// ---------- Monthly updates (registered before '/:id' routes) ----------
router.get('/batches', (req, res) => {
  res.json(batches.batchStatus(12));
});

// Starts this month's run now.
router.post('/batches', (req, res) => {
  try {
    res.status(202).json(batches.startBatch(batches.thisMonth(), displayName(req)));
  } catch (err) {
    res.status(409).json({ error: err.message });
  }
});

// ---------- References to insert (registered before '/:id' routes) ----------
// PubMed by PMID or keywords: up to 20 articles, newest first.
router.get('/refs/pubmed', async (req, res) => {
  const q = String(req.query.q || '').trim();
  if (q.length < 2) return res.status(400).json({ error: 'Enter a PMID or words to search for.' });
  try {
    const ids = /^\d{5,9}$/.test(q) ? [q] : (await pm.searchPubMed(q, null)).ids.slice(0, 20);
    const articles = await pm.fetchArticles(ids);
    res.json({
      results: articles.map(a => ({
        id: `pubmed${a.pmid}`, pmid: a.pmid,
        authors: formatAuthors(a.authors), title: a.title, source: a.journal, pubdate: a.year, volume: a.volume, pages: a.pages,
        short: pm.amaRuns(a).map(r => r.text).join('')
      }))
    });
  } catch (err) {
    res.status(502).json({ error: err.message });
  }
});

// POEMs by POEM number or title words: up to 20, newest first.
router.get('/refs/poems', (req, res) => {
  const q = String(req.query.q || '').trim();
  if (q.length < 2) return res.status(400).json({ error: 'Enter a POEM number or words from its title.' });
  const rows = /^\d+$/.test(q)
    ? db.prepare('SELECT poem_id, title, publication_date, pubmed_id, reference FROM poems WHERE poem_id = ?').all(Number(q))
    : db.prepare("SELECT poem_id, title, publication_date, pubmed_id, reference FROM poems WHERE title LIKE ? AND poem_id IS NOT NULL ORDER BY publication_date DESC LIMIT 20").all(`%${q.replace(/[%_]/g, '')}%`);
  res.json({
    results: rows.map(r => ({
      id: `poem${r.poem_id}`, poem: String(r.poem_id), pmid: /^\d+$/.test(r.pubmed_id || '') ? r.pubmed_id : null,
      title: r.title, date: r.publication_date, citation: r.reference,
      short: `${r.title} (POEM, ${r.publication_date}). ${r.reference}`
    }))
  });
});

// ---------- One chapter ----------
// The review in progress, or a fresh one from the live chapter.
router.get('/:id', (req, res) => {
  const id = knownChapter(req, res);
  if (!id) return;
  const chapter = store.liveChapter(id);
  const draft = store.getDraft(id);
  const state = draft && draft.state ? draft.state : buildEditorState(chapter);
  res.json({
    id,
    title: chapter.title,
    updated: chapter.updated,
    state,
    hasDraft: !!(draft && draft.state),
    job: draft ? { status: draft.job_status, message: draft.job_message, by: draft.updated_by, at: draft.updated_at } : null,
    staleDraft: !!(draft && draft.state && draft.base !== store.liveBase(id)),
    versions: store.versions(id)
  });
});

// Saves the review in progress (the editor saves as you work).
router.put('/:id/draft', (req, res) => {
  const id = knownChapter(req, res);
  if (!id) return;
  const job = store.getDraft(id);
  if (job && (job.job_status === 'running' || job.job_status === 'queued') && !job.state) {
    return res.status(409).json({ error: 'Claude is updating this chapter; wait for its suggestions before editing.' });
  }
  const state = req.body && req.body.state;
  if (!state || !Array.isArray(state.parts)) return res.status(400).json({ error: 'Nothing to save.' });
  store.saveDraft(id, state, displayName(req));
  res.json({ ok: true, savedAt: new Date().toISOString() });
});

router.delete('/:id/draft', (req, res) => {
  const id = knownChapter(req, res);
  if (!id) return;
  store.discardDraft(id);
  res.json({ ok: true });
});

// Starts Claude's update; the page then checks /job until it is done.
router.post('/:id/update', async (req, res) => {
  const id = knownChapter(req, res);
  if (!id) return;
  if (!process.env.ANTHROPIC_API_KEY) return res.status(500).json({ error: 'The server has no Anthropic API key (ANTHROPIC_API_KEY).' });
  const draft = store.getDraft(id);
  if (draft && draft.job_status === 'running') return res.status(409).json({ error: 'An update of this chapter is already running.' });
  if (draft && draft.job_status === 'queued') return res.status(409).json({ error: 'This chapter is in this month\'s monthly update; its suggestions will arrive with the rest.' });
  if (draft && draft.state) return res.status(409).json({ error: 'Finish or discard the review in progress before running a new update.' });
  try {
    await runUpdate(id, displayName(req));
    res.status(202).json({ ok: true });
  } catch (err) {
    res.status(409).json({ error: err.message });
  }
});

// The chapter's plan: PubMed search terms (blank = its title), update month, editor.
router.put('/:id/plan', (req, res) => {
  const id = knownChapter(req, res);
  if (!id) return;
  const b = req.body || {};
  const searchTerms = String(b.searchTerms || '').replace(/\s+/g, ' ').trim().slice(0, 1000);
  const month = Number(b.month);
  if (!(month >= 1 && month <= 12)) return res.status(400).json({ error: 'Choose the month for this chapter\'s yearly update.' });
  const editor = b.editor ? String(b.editor) : null;
  if (editor && !planner.editors().some(e => e.username === editor)) return res.status(400).json({ error: 'Unknown editor.' });
  planner.savePlan(id, { searchTerms, month, editor }, displayName(req));
  res.json({ ok: true });
});

// How many articles each of the update's searches finds with these terms (last 14 months).
router.get('/:id/search-test', async (req, res) => {
  const id = knownChapter(req, res);
  if (!id) return;
  const terms = String(req.query.terms || '').trim() || searchTermsFor(id, store.liveChapter(id).title);
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() - 14, 1);
  const since = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}`;
  try {
    const counts = [];
    for (const [area, label, journals] of AREAS) {
      const found = await pm.searchPubMed(pm.buildQuery(terms, 'all', pm.findBy(pm.CONTENT_AREAS, area), journals), since, 0);
      counts.push({ label, count: found.count });
    }
    res.json({ terms, since, counts });
  } catch (err) {
    res.status(502).json({ error: err.message });
  }
});

router.get('/:id/job', (req, res) => {
  const id = knownChapter(req, res);
  if (!id) return;
  const d = store.getDraft(id);
  res.json({ job: d ? { status: d.job_status, message: d.job_message, at: d.updated_at } : null, hasDraft: !!(d && d.state) });
});

// Saves the reviewed chapter as a new version of its XML.
// Body: { parts: [{ section, tag, tree }], newReferences: [...], note }
router.post('/:id/save', (req, res) => {
  const id = knownChapter(req, res);
  if (!id) return;
  const b = req.body || {};
  if (!Array.isArray(b.parts)) return res.status(400).json({ error: 'Nothing to save.' });
  const draft = store.getDraft(id);
  if (draft && draft.base && draft.base !== store.liveBase(id) && !b.overwrite) {
    return res.status(409).json({ error: 'This chapter was saved by someone else after this review began. Discard the review and start again, or save anyway to replace their version.', stale: true });
  }
  const live = store.liveXml(id);
  let out;
  try {
    out = writeChapterXml(live.xml, { parts: b.parts, newReferences: b.newReferences || [] });
    const { problems } = store.convertChapter(out.xml);
    const bad = problems.filter(p => /not in the references/.test(p));
    if (bad.length) throw new Error(bad.join('; '));
  } catch (err) {
    console.error(`Saving chapter ${id} failed`, err);
    return res.status(400).json({ error: `The chapter could not be saved: ${err.message}` });
  }
  const version = store.saveVersion(id, out.xml, displayName(req), String(b.note || '').slice(0, 500) || null);
  res.json({ ok: true, version, referencesKept: out.kept, referencesRemoved: out.removed });
});

// The live chapter's XML, to download.
router.get('/:id/xml', (req, res) => {
  const id = knownChapter(req, res);
  if (!id) return;
  const live = store.liveXml(id);
  res.set({ 'Content-Type': 'application/xml; charset=utf-8', 'Content-Disposition': `attachment; filename="${id.toUpperCase()}.xml"` });
  res.send(live.xml);
});

module.exports = router;
