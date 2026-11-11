// MeSH headings for POEMs. Each POEM's article has a PubMed ID; PubMed's indexers give the
// article MeSH headings (standard subject terms such as "Myocardial Infarction"), and the
// main ones are marked as major topics. They are kept with the POEM (mesh_terms, mesh_major),
// searched with its text (buildSearchText in search.js), and a POEM whose major topics match
// the search ranks higher. The calculators' and risk scores' studies get their major topics
// too (pmid_mesh), searched with each item.
//
// The server looks them up in the background a minute after it starts and then once a day:
// POEMs never looked up, and recent POEMs whose articles PubMed had not indexed yet (checked
// again after a week, for up to two years after publication). Run it by hand with
//   npm run mesh
const db = require('./db');
const { fetchMesh } = require('./pubmed');
const { buildSearchText } = require('./search');

const RECHECK_DAYS = 7;
const RECHECK_YEARS = 2;
const PER_RUN = 500; // POEMs looked up in one pass (10 requests to PubMed)

function poemsToLookUp(limit = PER_RUN) {
  const now = new Date();
  const recheckBefore = new Date(now - RECHECK_DAYS * 86400000).toISOString();
  const since = new Date(now.getFullYear() - RECHECK_YEARS, now.getMonth(), 1);
  const sinceMonth = `${since.getFullYear()}-${String(since.getMonth() + 1).padStart(2, '0')}`;
  return db.prepare(`
    SELECT id, pubmed_id FROM poems
    WHERE pubmed_id GLOB '[0-9]*' AND pubmed_id NOT GLOB '*[^0-9]*'
      AND (mesh_checked_at IS NULL
        OR (COALESCE(mesh_terms, '') = '' AND mesh_checked_at < ? AND publication_date >= ?))
    ORDER BY mesh_checked_at IS NOT NULL, publication_date DESC
    LIMIT ?
  `).all(recheckBefore, sinceMonth, limit);
}

let running = false;
// Looks up MeSH headings for the POEMs that need them; returns how many POEMs got headings.
async function updatePoemMesh({ log = console.log } = {}) {
  if (running) return 0;
  running = true;
  try {
    const poems = poemsToLookUp();
    if (!poems.length) return 0;
    const found = await fetchMesh([...new Set(poems.map(p => p.pubmed_id))]);
    const now = new Date().toISOString();
    const save = db.prepare('UPDATE poems SET mesh_terms = ?, mesh_major = ?, mesh_checked_at = ? WHERE id = ?');
    const reindex = db.prepare('UPDATE poems SET search_text = ? WHERE id = ?');
    const getRow = db.prepare('SELECT * FROM poems WHERE id = ?');
    let tagged = 0;
    db.transaction(() => {
      for (const p of poems) {
        const m = found.get(p.pubmed_id) || { terms: [], major: [] };
        save.run(m.terms.join('; ') || null, m.major.join('; ') || null, now, p.id);
        if (m.terms.length) tagged++;
        reindex.run(buildSearchText(getRow.get(p.id)), p.id);
      }
    })();
    log(`MeSH: looked up ${poems.length} POEM(s); ${tagged} have MeSH headings.`);
    return tagged;
  } finally {
    running = false;
  }
}

// ---------- Calculators and risk scores ----------
// Their studies' PubMed IDs (calculator-data.json, decision-tools), looked up once each and
// kept in pmid_mesh. Only the major topics are searched: a diagnostic study's headings include
// many minor ones (Electrocardiography, Prospective Studies) that would match every finding
// from that study.
function studyPmids() {
  const ids = new Set();
  try {
    const calc = require('./calculator-data').get();
    for (const p of calc.panels) for (const t of p.tests) if (/^\d+$/.test(String(t.pmid || ''))) ids.add(String(t.pmid));
  } catch { /* no calculator data */ }
  try {
    const { tools } = require('./routes/tools');
    for (const t of tools.values()) if (t.evidence && /^\d+$/.test(String(t.evidence.pmid || ''))) ids.add(String(t.evidence.pmid));
  } catch { /* no risk scores */ }
  return [...ids];
}

let studyMajor = null; // pmid -> "Heading; Heading"
function majorMeshFor(pmid) {
  if (!studyMajor) studyMajor = new Map(db.prepare("SELECT pmid, major FROM pmid_mesh WHERE major IS NOT NULL").all().map(r => [r.pmid, r.major]));
  return studyMajor.get(String(pmid || '')) || '';
}

async function updateStudyMesh({ log = console.log } = {}) {
  const have = new Set(db.prepare('SELECT pmid FROM pmid_mesh').all().map(r => r.pmid));
  const missing = studyPmids().filter(id => !have.has(id));
  if (!missing.length) return 0;
  const found = await fetchMesh(missing);
  const now = new Date().toISOString();
  const save = db.prepare('INSERT OR REPLACE INTO pmid_mesh (pmid, terms, major, checked_at) VALUES (?, ?, ?, ?)');
  db.transaction(() => {
    for (const id of missing) {
      const m = found.get(id) || { terms: [], major: [] };
      save.run(id, m.terms.join('; ') || null, m.major.join('; ') || null, now);
    }
  })();
  studyMajor = null; // reload on the next search
  log(`MeSH: looked up ${missing.length} calculator and risk score studies; ${[...found.values()].filter(m => m.major.length).length} have major topics.`);
  return missing.length;
}

// Runs until every POEM has been looked up at least once (the first run on a database with
// no MeSH yet takes a few passes); POEMs rechecked in a pass are not due again for a week.
const neverChecked = () => db.prepare(`SELECT COUNT(*) AS n FROM poems WHERE mesh_checked_at IS NULL
  AND pubmed_id GLOB '[0-9]*' AND pubmed_id NOT GLOB '*[^0-9]*'`).get().n;
async function updateAll(opts) {
  if (running) return; // a run is already going
  do { await updatePoemMesh(opts); } while (!running && neverChecked() > 0);
  await updateStudyMesh(opts);
}

function startMeshSchedule() {
  const run = () => updateAll().catch(err => console.error(`MeSH: ${err.message}`));
  setTimeout(run, 60 * 1000).unref();
  setInterval(run, 24 * 60 * 60 * 1000).unref();
}

module.exports = { updatePoemMesh, updateStudyMesh, updateAll, startMeshSchedule, majorMeshFor };

if (require.main === module) {
  updateAll().then(() => process.exit(0), err => { console.error(err.message); process.exit(1); });
}
