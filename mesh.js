// MeSH headings for POEMs. Each POEM's article has a PubMed ID; PubMed's indexers give the
// article MeSH headings (standard subject terms such as "Myocardial Infarction"), and the
// main ones are marked as major topics. They are kept with the POEM (mesh_terms, mesh_major),
// searched with its text (buildSearchText in search.js), and a POEM whose major topics match
// the search ranks higher.
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
const PER_RUN = 3000; // POEMs looked up in one run (15 requests to PubMed)

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

// Runs until every POEM has been looked up at least once (the first run on a database with
// no MeSH yet takes a few passes); POEMs rechecked in a pass are not due again for a week.
const neverChecked = () => db.prepare(`SELECT COUNT(*) AS n FROM poems WHERE mesh_checked_at IS NULL
  AND pubmed_id GLOB '[0-9]*' AND pubmed_id NOT GLOB '*[^0-9]*'`).get().n;
async function updateAll(opts) {
  if (running) return; // a run is already going
  do { await updatePoemMesh(opts); } while (!running && neverChecked() > 0);
}

function startMeshSchedule() {
  const run = () => updateAll().catch(err => console.error(`MeSH: ${err.message}`));
  setTimeout(run, 60 * 1000).unref();
  setInterval(run, 24 * 60 * 60 * 1000).unref();
}

module.exports = { updatePoemMesh, updateAll, startMeshSchedule };

if (require.main === module) {
  updateAll().then(() => process.exit(0), err => { console.error(err.message); process.exit(1); });
}
