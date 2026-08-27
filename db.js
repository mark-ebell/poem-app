const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');

// On Render, DATA_DIR points at the mounted persistent disk so the database
// survives restarts/redeploys; locally it defaults to ./data.
const dataDir = process.env.DATA_DIR || path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const db = new Database(path.join(dataDir, 'poems.db'));
db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    display_name TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    must_change_password INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS poems (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    poet TEXT NOT NULL,
    publication_date TEXT NOT NULL,
    html TEXT NOT NULL,
    created_by TEXT NOT NULL,
    updated_by TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );
`);

module.exports = db;
module.exports.dataDir = dataDir;
