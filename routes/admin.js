const express = require('express');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');
const db = require('../db');
const { requireAuth } = require('../auth');
const { sanitizeHtml, pubmedUrlFor, generatePoemId, INITIALS_BY_POET } = require('../poem-model');
const { buildSearchText } = require('../search');
const { readBatch, supertypeCode } = require('../word-import');

const router = express.Router();
router.use(requireAuth);

const ADMIN_USERNAMES = ['ebell'];

function requireAdmin(req, res, next) {
  if (!ADMIN_USERNAMES.includes(req.session.username)) {
    return res.status(403).json({ error: 'Only an administrator can do this.' });
  }
  next();
}

const MONTH_RE = /^\d{4}-(0[1-9]|1[0-2])$/;
const text = (v, max) => {
  const s = v === null || v === undefined ? '' : String(v).trim();
  return s ? s.slice(0, max) : null;
};

const existingPoemId = db.prepare('SELECT 1 FROM poems WHERE poem_id = ?');
const existingTitle = db.prepare('SELECT 1 FROM poems WHERE lower(title) = lower(?) AND publication_date = ?');

function duplicateReason(rec) {
  if (rec.poem_id && existingPoemId.get(rec.poem_id)) return 'its POEM ID is already in the repository';
  if (existingTitle.get(rec.title, rec.publication_date)) return 'a POEM with this title is already in this month';
  return null;
}

// Step 1: read the Word file and report what it contains; nothing is saved.
// Body: the .docx file. Query: month=YYYY-MM (the publication month of the batch).
router.post('/import-word/preview', requireAdmin, express.raw({ type: () => true, limit: '30mb' }), async (req, res) => {
  const month = String(req.query.month || '');
  if (!MONTH_RE.test(month)) return res.status(400).json({ error: 'Choose the publication month for this batch.' });
  if (!Buffer.isBuffer(req.body) || !req.body.length) return res.status(400).json({ error: 'No file was received.' });
  try {
    const items = await readBatch(req.body, month);
    if (!items.length) {
      return res.status(400).json({ error: 'No POEMs were found in that file. Each POEM should start with a "Title:" line.' });
    }
    res.json({
      month,
      items: items.map(({ record, notes }) => ({ record, notes, duplicate: duplicateReason(record) }))
    });
  } catch (err) {
    console.error('Word import preview failed', err);
    res.status(400).json({ error: 'That file could not be read. Is it a Word (.docx) file?' });
  }
});

// Step 2: save the records shown in the preview. Body: { records: [...] }.
router.post('/import-word/commit', requireAdmin, async (req, res) => {
  const records = Array.isArray(req.body && req.body.records) ? req.body.records : null;
  if (!records || !records.length || records.length > 200) {
    return res.status(400).json({ error: 'There are no POEMs to import.' });
  }

  const username = req.session.username;
  const now = new Date().toISOString();
  const rows = [];
  const skipped = [];
  const taken = new Set();
  for (const r of records) {
    if (!r || typeof r.title !== 'string' || !r.title.trim() || !r.poet || !MONTH_RE.test(r.publication_date || '')) {
      return res.status(400).json({ error: 'A POEM in the batch is missing its title, author or month; nothing was imported.' });
    }
    const pubmedId = text(r.pubmed_id, 20);
    const age = r.age_group === null || r.age_group === undefined || r.age_group === '' ? null : Number(r.age_group);
    const row = {
      id: crypto.randomUUID(),
      poem_id: /^\d{1,9}$/.test(String(r.poem_id || '')) ? Number(r.poem_id) : null,
      title: r.title.trim().slice(0, 500),
      poet: String(r.poet).trim().slice(0, 50),
      poet_initials: text(r.poet_initials, 10) || INITIALS_BY_POET[String(r.poet).trim()] || null,
      publication_date: r.publication_date,
      reference: String(r.reference || '').trim().slice(0, 5000),
      clinical_question: String(r.clinical_question || '').trim().slice(0, 2000),
      allocation: text(r.allocation, 100),
      funding: text(r.funding, 100),
      study_design: text(r.study_design, 150),
      loe: text(r.loe, 10),
      setting: text(r.setting, 150),
      age_group: [0, 1, 2, 3].includes(age) ? age : null,
      supertype: supertypeCode(r.supertype),
      synopsis: sanitizeHtml(r.synopsis),
      bottom_line: sanitizeHtml(r.bottom_line),
      pubmed_id: pubmedId && /^na$/i.test(pubmedId) ? 'NA' : (pubmedId && /^\d{1,9}$/.test(pubmedId) ? pubmedId : null),
      source: 'app', // added through the app, so it shows in the Recently added list
      created_by: username,
      updated_by: username,
      created_at: now,
      updated_at: now
    };
    row.pubmed_url = pubmedUrlFor(row.pubmed_id);
    const why = duplicateReason(row) || (row.poem_id && taken.has(row.poem_id) ? 'its POEM ID appears twice in the file' : null);
    if (why) { skipped.push({ title: row.title, reason: why }); continue; }
    if (row.poem_id) taken.add(row.poem_id);
    rows.push(row);
  }
  if (!rows.length) return res.json({ added: 0, skipped });

  try {
    const backupDir = path.join(db.dataDir, 'backups');
    fs.mkdirSync(backupDir, { recursive: true });
    await db.backup(path.join(backupDir, `poems-before-word-import-${now.replace(/[:.]/g, '-')}.db`));

    const cols = Object.keys(rows[0]).concat(['search_text']);
    const insert = db.prepare(`INSERT INTO poems (${cols.join(', ')}) VALUES (${cols.map(c => '@' + c).join(', ')})`);
    db.transaction(() => {
      for (const row of rows) {
        if (!row.poem_id) {
          row.poem_id = generatePoemId(n => !!existingPoemId.get(n) || rows.some(o => o.poem_id === n));
        }
        row.search_text = buildSearchText(row);
        insert.run(row);
      }
    })();
    res.json({ added: rows.length, skipped });
  } catch (err) {
    console.error('Word import failed', err);
    res.status(500).json({ error: 'The import failed; no POEMs were added. See the server log.' });
  }
});

module.exports = router;
