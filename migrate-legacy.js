// One-time conversion of POEMs saved before the structured fields existed
// (a single HTML blob in legacy_html) into the separate columns. Safe to run on
// every start: it only touches rows that have legacy_html but no reference yet.
const db = require('./db');
const { parseLegacyHtml, pubmedUrlFor, generatePoemId, INITIALS_BY_POET } = require('./poem-model');

function migrateLegacyPoems() {
  const rows = db.prepare(`
    SELECT id, title, poet, legacy_html FROM poems
    WHERE legacy_html IS NOT NULL AND legacy_html <> '' AND reference = '' AND synopsis = ''
  `).all();
  if (!rows.length) return 0;

  const update = db.prepare(`
    UPDATE poems SET
      title = @title, reference = @reference, clinical_question = @clinical_question,
      allocation = @allocation, funding = @funding, study_design = @study_design,
      setting = @setting, age_group = @age_group, synopsis = @synopsis,
      bottom_line = @bottom_line, pubmed_id = @pubmed_id, pubmed_url = @pubmed_url,
      poet_initials = COALESCE(poet_initials, @poet_initials),
      poem_id = COALESCE(poem_id, @poem_id)
    WHERE id = @id
  `);

  const taken = db.prepare('SELECT 1 FROM poems WHERE poem_id = ?');
  let migrated = 0;
  db.transaction(() => {
    for (const row of rows) {
      const p = parseLegacyHtml(row.legacy_html);
      if (!p.synopsis && !p.reference) continue; // unrecognized layout: leave it as legacy_html
      update.run({
        id: row.id,
        title: p.title || row.title,
        reference: p.reference || '',
        clinical_question: p.clinical_question || '',
        allocation: p.allocation || null,
        funding: p.funding || null,
        study_design: p.study_design || null,
        setting: p.setting || null,
        age_group: p.age_group === undefined ? null : p.age_group,
        synopsis: p.synopsis || '',
        bottom_line: p.bottom_line || '',
        pubmed_id: p.pubmed_id || null,
        pubmed_url: pubmedUrlFor(p.pubmed_id),
        poet_initials: INITIALS_BY_POET[row.poet] || null,
        poem_id: generatePoemId(n => !!taken.get(n))
      });
      migrated++;
    }
  })();
  return migrated;
}

module.exports = { migrateLegacyPoems };
