// Where the textbook chapters come from, and which version is live.
//
// Each chapter's XML is in chapters/xml/ (copied there from the content transfer by
// build-chapters.js), listed in chapters/index.json. A chapter saved in the Edit Chapter
// tab is kept in the database (chapter_versions, every version kept) and is shown instead
// of its file; if a newer file arrives later, the edited version still wins and the tab
// flags it. A review in progress (Claude's suggestions and the editor's own tracked
// edits) is kept in chapter_drafts until it is saved or discarded.
//
// Chapters are converted from XML when first opened (chapter-convert.js) and the most
// recent ones are kept in memory.
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const db = require('./db');
const { convertChapter, loadCalculatorLabels } = require('./chapter-convert');

const DIR = path.join(__dirname, 'chapters');
const XML_DIR = path.join(DIR, 'xml');

db.exec(`
  CREATE TABLE IF NOT EXISTS chapter_versions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    chapter_id TEXT NOT NULL,
    xml TEXT NOT NULL,
    base_file_hash TEXT,        -- the file the edit started from, to notice a newer file later
    created_by TEXT NOT NULL,
    created_at TEXT NOT NULL,
    note TEXT
  );
  CREATE INDEX IF NOT EXISTS idx_chapter_versions ON chapter_versions(chapter_id, id);

  CREATE TABLE IF NOT EXISTS chapter_drafts (
    chapter_id TEXT PRIMARY KEY,
    state TEXT,                 -- the review in progress (JSON), or NULL before one exists
    base TEXT NOT NULL,         -- 'file:<hash>' or 'version:<id>': what the draft was made from
    job_status TEXT,            -- Claude's update: 'running', 'done', 'failed'
    job_message TEXT,
    updated_by TEXT,
    updated_at TEXT
  );

  -- Each chapter's update plan: its PubMed search terms, the month (1-12) it is updated
  -- each year, and the editor who reviews it.
  CREATE TABLE IF NOT EXISTS chapter_plan (
    chapter_id TEXT PRIMARY KEY,
    search_terms TEXT,
    month INTEGER,
    editor TEXT,
    updated_by TEXT,
    updated_at TEXT
  );

  -- Monthly updates sent to Claude as one batch (chapter-batch.js), and their chapters.
  CREATE TABLE IF NOT EXISTS chapter_batches (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    batch_id TEXT,              -- Anthropic's id, once submitted
    month TEXT NOT NULL,        -- 'YYYY-MM'
    status TEXT NOT NULL,       -- 'gathering', 'submitted', 'collected', 'failed'
    message TEXT,
    created_by TEXT,
    created_at TEXT NOT NULL,
    ended_at TEXT
  );
  CREATE TABLE IF NOT EXISTS chapter_batch_items (
    batch INTEGER NOT NULL,
    chapter_id TEXT NOT NULL,
    prepared TEXT,              -- the review state and evidence, until the answer is applied
    status TEXT NOT NULL,       -- 'gathering', 'queued', 'done', 'failed'
    message TEXT,
    input_tokens INTEGER,
    output_tokens INTEGER,
    PRIMARY KEY (batch, chapter_id)
  );
`);
// A restart while evidence was being gathered for a batch ends that batch.
db.prepare(`UPDATE chapter_drafts SET job_status = 'failed', job_message = 'The monthly update was interrupted (the server restarted). Run Update with Claude to update this chapter.'
  WHERE job_status = 'queued' AND chapter_id IN (SELECT chapter_id FROM chapter_batch_items WHERE status = 'gathering')`).run();
db.prepare("UPDATE chapter_batches SET status = 'failed', message = 'Interrupted while gathering evidence (the server restarted).' WHERE status = 'gathering'").run();
db.prepare("UPDATE chapter_batch_items SET status = 'failed', message = 'Interrupted (the server restarted).', prepared = NULL WHERE status = 'gathering'").run();
// A server restart ends any update that was running.
db.prepare("UPDATE chapter_drafts SET job_status = 'failed', job_message = 'The update was interrupted (the server restarted). Please run it again.' WHERE job_status = 'running'").run();

let index = [];
try {
  index = JSON.parse(fs.readFileSync(path.join(DIR, 'index.json'), 'utf8'));
} catch (err) {
  console.warn(`Chapter list not loaded (${err.message}); the Chapters tab will be empty.`);
}
const fileIds = new Set(index.map(c => c.id));
let calcLabels = null;
const labels = () => (calcLabels = calcLabels || loadCalculatorLabels());

const sha = s => crypto.createHash('sha256').update(s).digest('hex').slice(0, 16);
const isId = id => /^[a-z0-9]+$/.test(id);

function fileXml(id) {
  if (!isId(id) || !fileIds.has(id)) return null;
  try { return fs.readFileSync(path.join(XML_DIR, `${id}.xml`), 'utf8'); } catch { return null; }
}

function latestVersion(id) {
  return db.prepare('SELECT * FROM chapter_versions WHERE chapter_id = ? ORDER BY id DESC LIMIT 1').get(id) || null;
}

// The live XML: the newest saved version, else the file. { xml, source: 'version'|'file', version }
function liveXml(id) {
  const v = latestVersion(id);
  if (v) return { xml: v.xml, source: 'version', version: v };
  const xml = fileXml(id);
  return xml ? { xml, source: 'file', version: null } : null;
}

// Converted chapters, newest use last (a small cache: chapters are about 100 KB each).
const cache = new Map();
const CACHE_SIZE = 40;
function convertCached(cacheKey, xml) {
  if (cache.has(cacheKey)) {
    const hit = cache.get(cacheKey);
    cache.delete(cacheKey);
    cache.set(cacheKey, hit);
    return hit;
  }
  const result = convertChapter(xml, labels());
  cache.set(cacheKey, result);
  if (cache.size > CACHE_SIZE) cache.delete(cache.keys().next().value);
  return result;
}

// The live chapter as the Chapters tab shows it, or null.
function liveChapter(id) {
  const live = liveXml(id);
  if (!live) return null;
  const { chapter } = convertCached(live.source === 'version' ? `v${live.version.id}` : `f${id}:${sha(live.xml)}`, live.xml);
  return { ...chapter, id };
}

// The chapter list, with edited chapters' titles and dates.
function chapterIndex() {
  const edited = new Map(db.prepare(`SELECT chapter_id, MAX(id) AS id FROM chapter_versions GROUP BY chapter_id`).all().map(r => [r.chapter_id, r.id]));
  return index.map(c => {
    if (!edited.has(c.id)) return c;
    const live = liveChapter(c.id);
    return live ? { id: c.id, title: live.title, updated: live.updated } : c;
  });
}

const known = id => isId(id) && fileIds.has(id);

// For the Edit Chapter list: which chapters have been edited, have a review in progress,
// or have a newer file than the one their edit started from.
function editStatus() {
  const versions = new Map(db.prepare(`SELECT v.chapter_id, v.base_file_hash, v.created_by, v.created_at FROM chapter_versions v
    JOIN (SELECT chapter_id, MAX(id) AS id FROM chapter_versions GROUP BY chapter_id) m ON m.id = v.id`).all().map(r => [r.chapter_id, r]));
  const drafts = new Map(db.prepare('SELECT chapter_id, job_status, updated_by, updated_at, state IS NOT NULL AS has_state FROM chapter_drafts').all().map(r => [r.chapter_id, r]));
  return chapterIndex().map(c => {
    const v = versions.get(c.id), d = drafts.get(c.id);
    let newerFile = false;
    if (v && v.base_file_hash) {
      const f = fileXml(c.id);
      newerFile = !!f && sha(f) !== v.base_file_hash;
    }
    return {
      ...c,
      edited: v ? { by: v.created_by, at: v.created_at } : null,
      draft: d ? { status: d.job_status, by: d.updated_by, at: d.updated_at, hasState: !!d.has_state } : null,
      newerFile
    };
  });
}

// What a draft is based on, so saving can tell if the live chapter changed meanwhile.
function liveBase(id) {
  const live = liveXml(id);
  if (!live) return null;
  return live.source === 'version' ? `version:${live.version.id}` : `file:${sha(live.xml)}`;
}

function getDraft(id) {
  const row = db.prepare('SELECT * FROM chapter_drafts WHERE chapter_id = ?').get(id);
  if (!row) return null;
  return { ...row, state: row.state ? JSON.parse(row.state) : null };
}

function saveDraft(id, state, user) {
  const now = new Date().toISOString();
  const existing = db.prepare('SELECT base FROM chapter_drafts WHERE chapter_id = ?').get(id);
  if (existing) {
    db.prepare('UPDATE chapter_drafts SET state = ?, updated_by = ?, updated_at = ? WHERE chapter_id = ?').run(JSON.stringify(state), user, now, id);
  } else {
    db.prepare('INSERT INTO chapter_drafts (chapter_id, state, base, updated_by, updated_at) VALUES (?, ?, ?, ?, ?)')
      .run(id, JSON.stringify(state), liveBase(id), user, now);
  }
}

function setJob(id, status, message, user) {
  const now = new Date().toISOString();
  if (db.prepare('SELECT 1 FROM chapter_drafts WHERE chapter_id = ?').get(id)) {
    db.prepare('UPDATE chapter_drafts SET job_status = ?, job_message = ?, updated_at = ?, updated_by = COALESCE(?, updated_by) WHERE chapter_id = ?')
      .run(status, message, now, user || null, id);
  } else {
    db.prepare('INSERT INTO chapter_drafts (chapter_id, state, base, job_status, job_message, updated_by, updated_at) VALUES (?, NULL, ?, ?, ?, ?, ?)')
      .run(id, liveBase(id), status, message, user || null, now);
  }
}

function discardDraft(id) {
  db.prepare('DELETE FROM chapter_drafts WHERE chapter_id = ?').run(id);
}

// Saves a new version (the chapter's XML) and ends the review.
function saveVersion(id, xml, user, note) {
  const f = fileXml(id);
  const prev = latestVersion(id);
  const baseFileHash = prev ? prev.base_file_hash : (f ? sha(f) : null);
  const info = db.transaction(() => {
    const r = db.prepare('INSERT INTO chapter_versions (chapter_id, xml, base_file_hash, created_by, created_at, note) VALUES (?, ?, ?, ?, ?, ?)')
      .run(id, xml, baseFileHash, user, new Date().toISOString(), note || null);
    db.prepare('DELETE FROM chapter_drafts WHERE chapter_id = ?').run(id);
    return r;
  })();
  return info.lastInsertRowid;
}

function versions(id) {
  return db.prepare('SELECT id, created_by, created_at, note FROM chapter_versions WHERE chapter_id = ? ORDER BY id DESC').all(id);
}

module.exports = { index: () => index, known, chapterIndex, liveChapter, liveXml, liveBase, editStatus, getDraft, saveDraft, setJob, discardDraft, saveVersion, versions, convertChapter: xml => convertChapter(xml, labels()) };
