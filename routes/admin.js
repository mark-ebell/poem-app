const express = require('express');
const path = require('path');
const fs = require('fs');
const zlib = require('zlib');
const db = require('../db');
const { requireAuth } = require('../auth');
const { sanitizeHtml } = require('../poem-model');
const { buildSearchText } = require('../search');

const router = express.Router();
router.use(requireAuth);

const ADMIN_USERNAMES = ['ebell'];

function requireAdmin(req, res, next) {
  if (!ADMIN_USERNAMES.includes(req.session.username)) {
    return res.status(403).json({ error: 'Only an administrator can do this.' });
  }
  next();
}

const MAX_JSON_BYTES = 200 * 1024 * 1024;

// Loads the historical POEMs archive produced by export-archive.js (a gzipped
// JSON array of poems rows). Safe to repeat: rows whose id already exists are
// skipped, and POEMs written in the app are never touched. The database is
// copied to <data dir>/backups/ first.
router.post('/import-poems', requireAdmin, express.raw({ type: () => true, limit: '60mb' }), async (req, res) => {
  let rows;
  try {
    const json = zlib.gunzipSync(req.body, { maxOutputLength: MAX_JSON_BYTES }).toString('utf8');
    rows = JSON.parse(json);
    if (!Array.isArray(rows)) throw new Error('not an array');
  } catch {
    return res.status(400).json({ error: 'That file is not a valid POEMs archive (poems-archive.json.gz).' });
  }

  const columns = db.prepare("PRAGMA table_info('poems')").all().map(c => c.name).filter(c => c !== 'legacy_html');
  const clean = [];
  for (const r of rows) {
    if (!r || typeof r.id !== 'string' || !r.id || typeof r.title !== 'string' || typeof r.poet !== 'string' ||
        !/^\d{4}-\d{2}$/.test(r.publication_date || '')) {
      return res.status(400).json({ error: 'The archive contains a malformed POEM; nothing was imported.' });
    }
    const row = {};
    for (const c of columns) row[c] = r[c] === undefined ? null : r[c];
    row.source = 'import';
    row.synopsis = sanitizeHtml(row.synopsis || '');
    row.bottom_line = sanitizeHtml(row.bottom_line || '');
    row.reference = row.reference || '';
    row.clinical_question = row.clinical_question || '';
    row.search_text = buildSearchText(row);
    clean.push(row);
  }

  try {
    const backupDir = path.join(db.dataDir, 'backups');
    fs.mkdirSync(backupDir, { recursive: true });
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    await db.backup(path.join(backupDir, `poems-before-archive-import-${stamp}.db`));

    const insert = db.prepare(`INSERT OR IGNORE INTO poems (${columns.join(', ')}) VALUES (${columns.map(c => '@' + c).join(', ')})`);
    let added = 0;
    db.transaction(() => { for (const row of clean) added += insert.run(row).changes; })();
    res.json({ received: clean.length, added, alreadyPresent: clean.length - added });
  } catch (err) {
    console.error('Archive import failed', err);
    res.status(500).json({ error: 'The import failed; no POEMs were changed. See the server log.' });
  }
});

module.exports = router;
