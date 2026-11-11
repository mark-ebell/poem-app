const express = require('express');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');
const db = require('../db');
const { requireEditor } = require('../auth');
const { sanitizeHtml, pubmedUrlFor, generatePoemId, INITIALS_BY_POET } = require('../poem-model');
const { buildSearchText } = require('../search');
const { readBatch, supertypeCode } = require('../word-import');
const { assignDailyDate } = require('../daily-poem');

const router = express.Router();
router.use(requireEditor);

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
      status: 'Published', // the monthly issue has already been published
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
    rows.forEach(row => assignDailyDate(row.id)); // imported POEMs are Published: give each a Daily InfoPOEM day
    res.json({ added: rows.length, skipped });
  } catch (err) {
    console.error('Word import failed', err);
    res.status(500).json({ error: 'The import failed; no POEMs were added. See the server log.' });
  }
});


// ---------- Calculator spreadsheets (administrators) ----------
// The Diagnostic App project's spreadsheets are uploaded here, checked, compared with the
// data in use, and published (calculator-build.js, calculator-data.js). Each upload is
// kept while it is being checked, per administrator.
const calculatorData = require('../calculator-data');
const { build: buildCalculator, compare: compareCalculator } = require('../calculator-build');
const pendingCalc = new Map(); // username -> { calc: { name, buf }, ddx: { name, buf }, built }

// SxDxNums the chapters link to: { tests: Set, signs: Set } (from chapters/xml).
function chapterCalcLinks() {
  const out = { tests: new Map(), signs: new Map() };
  const dir = path.join(__dirname, '..', 'chapters', 'xml');
  let files = [];
  try { files = fs.readdirSync(dir).filter(f => f.endsWith('.xml')); } catch { return out; }
  for (const f of files) {
    const xml = fs.readFileSync(path.join(dir, f), 'utf8');
    for (const m of xml.matchAll(/info:wiley\/eep-(dx|hp)\/(\d+)/g)) {
      const map = out[m[1] === 'dx' ? 'tests' : 'signs'];
      const n = Number(m[2]);
      if (!map.has(n)) map.set(n, new Set());
      map.get(n).add(f.replace(/\.xml$/i, '').toLowerCase());
    }
  }
  return out;
}
const numbersIn = (d, key) => new Set(((d.panels || []).find(p => p.key === key) || { tests: [] }).tests.map(t => t.sxdxNum).filter(n => n !== null && n !== undefined));

function calcStatus() {
  const d = calculatorData.get();
  return {
    using: calculatorData.info(),
    counts: { ...Object.fromEntries((d.panels || []).map(p => [p.label, p.tests.length])), 'Differential Diagnosis': (d.differentials || []).length },
    history: calculatorData.history().slice(0, 20)
  };
}

router.get('/calculator', requireAdmin, (req, res) => {
  const p = pendingCalc.get(req.session.username) || {};
  res.json({ ...calcStatus(), pending: { calc: p.calc ? p.calc.name : null, ddx: p.ddx ? p.ddx.name : null } });
});

// One spreadsheet. Query: which=calc (DiagnosticCalculatorApp.xlsx) or ddx
// (DifferentialDiagnosisData.xlsx), name=the file's name. Body: the file.
router.post('/calculator/file', requireAdmin, express.raw({ type: () => true, limit: '40mb' }), (req, res) => {
  const which = req.query.which === 'ddx' ? 'ddx' : req.query.which === 'calc' ? 'calc' : null;
  if (!which) return res.status(400).json({ error: 'Say which spreadsheet this is.' });
  if (!req.body || !req.body.length) return res.status(400).json({ error: 'The file is empty.' });
  const p = pendingCalc.get(req.session.username) || {};
  p[which] = { name: String(req.query.name || `${which}.xlsx`).slice(0, 200), buf: req.body };
  delete p.built;
  pendingCalc.set(req.session.username, p);
  res.json({ ok: true });
});

// Builds the data from the uploaded spreadsheet(s) and reports on it; nothing changes yet.
router.post('/calculator/check', requireAdmin, async (req, res) => {
  const p = pendingCalc.get(req.session.username);
  if (!p || (!p.calc && !p.ddx)) return res.status(400).json({ error: 'Upload one or both spreadsheets first.' });
  const current = calculatorData.get();
  let result;
  try {
    result = await buildCalculator({ calcBuf: p.calc && p.calc.buf, ddxBuf: p.ddx && p.ddx.buf, current });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
  const { data, report } = result;
  // Chapter links that would stop working (and ones that would start to).
  const links = chapterCalcLinks();
  const lost = [], gained = [];
  for (const [key, which, label] of [['diagnosticTests', 'tests', 'Diagnostic Tests'], ['signsSymptoms', 'signs', 'History & Physical']]) {
    const before = numbersIn(current, key), after = numbersIn(data, key);
    for (const [n, chapters] of links[which]) {
      if (before.has(n) && !after.has(n)) lost.push(`${label} #${n} (${[...chapters].slice(0, 4).join(', ')}${chapters.size > 4 ? ', ...' : ''})`);
      if (!before.has(n) && after.has(n)) gained.push(`${label} #${n}`);
    }
  }
  if (lost.length) report.warnings.push(`${lost.length} chapter link${lost.length === 1 ? '' : 's'} to the calculators would stop working (the link is hidden): ${lost.slice(0, 12).join('; ')}${lost.length > 12 ? '; ...' : ''}.`);
  if (gained.length) report.notes.push(`${gained.length} chapter link${gained.length === 1 ? '' : 's'} that had no calculator data would start working: ${gained.slice(0, 12).join(', ')}${gained.length > 12 ? ', ...' : ''}.`);
  p.built = report.errors.length ? null : data;
  res.json({ report, changes: compareCalculator(current, data), files: { calc: p.calc ? p.calc.name : null, ddx: p.ddx ? p.ddx.name : null }, canPublish: !report.errors.length });
});

router.post('/calculator/publish', requireAdmin, (req, res) => {
  const p = pendingCalc.get(req.session.username);
  if (!p || !p.built) return res.status(400).json({ error: 'Check the spreadsheets first (and fix any errors).' });
  calculatorData.publish(p.built, { by: req.session.username, files: [p.calc && p.calc.name, p.ddx && p.ddx.name].filter(Boolean) });
  pendingCalc.delete(req.session.username);
  res.json({ ok: true, ...calcStatus() });
});

router.post('/calculator/discard', requireAdmin, (req, res) => {
  pendingCalc.delete(req.session.username);
  res.json({ ok: true });
});

// Body: { name } of an earlier upload, or 'code' for the file in the code.
router.post('/calculator/restore', requireAdmin, (req, res) => {
  try {
    calculatorData.restore(String((req.body && req.body.name) || ''));
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
  res.json({ ok: true, ...calcStatus() });
});

module.exports = router;
