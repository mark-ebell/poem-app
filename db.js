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
`);

// One row per POEM, with each element of the POEM in its own column.
//   id               app-generated UUID (primary key)
//   poem_id          historical POEM number from the 25-year repository. NOT unique
//                    (a few historical rows have no number, and one is duplicated).
//   poet             author as shown in the app (a full last name for current POETs;
//                    historical initials where no full name is known)
//   poet_initials    the initials exactly as they appear in the repository spreadsheet
//   publication_date 'YYYY-MM' issue month; pub_date_exact the original full date,
//                    which only older repository rows have
//   age_group        1 = adults, 2 = children, 3 = both, 0 = not specified
//   synopsis / bottom_line   sanitized HTML (bold, italics, sub/superscript, links)
//   pubmed_id        8-digit PMID, the literal 'NA' (checked, none exists), or NULL
//   pubmed_url       derived from pubmed_id (kept as-is for 'NA' rows that have a source link)
//   source           'app' (written here) or 'import' (loaded from the spreadsheet)
//   legacy_html      the whole-POEM HTML blob from before the structured fields existed
const POEMS_COLUMNS = `
  id TEXT PRIMARY KEY,
  poem_id INTEGER,
  title TEXT NOT NULL,
  poet TEXT NOT NULL,
  poet_initials TEXT,
  publication_date TEXT NOT NULL,
  pub_date_exact TEXT,
  reference TEXT NOT NULL DEFAULT '',
  clinical_question TEXT NOT NULL DEFAULT '',
  allocation TEXT,
  funding TEXT,
  study_design TEXT,
  loe TEXT,
  setting TEXT,
  age_group INTEGER,
  supertype TEXT,
  category TEXT,
  synopsis TEXT NOT NULL DEFAULT '',
  bottom_line TEXT NOT NULL DEFAULT '',
  pubmed_id TEXT,
  pubmed_url TEXT,
  source TEXT NOT NULL DEFAULT 'app',
  legacy_html TEXT,
  created_by TEXT NOT NULL,
  updated_by TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
`;

function createIndexes() {
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_poems_poem_id ON poems(poem_id);
    CREATE INDEX IF NOT EXISTS idx_poems_pubmed_id ON poems(pubmed_id);
    CREATE INDEX IF NOT EXISTS idx_poems_publication_date ON poems(publication_date);
    CREATE INDEX IF NOT EXISTS idx_poems_source ON poems(source);
  `);
}

const existingColumns = db.prepare("PRAGMA table_info('poems')").all().map(c => c.name);

if (existingColumns.length === 0) {
  db.exec(`CREATE TABLE poems (${POEMS_COLUMNS});`);
} else if (!existingColumns.includes('reference')) {
  // Upgrade from the original layout (one HTML blob per POEM). The old HTML is
  // kept in legacy_html, and migrate-legacy.js (run from server.js at startup)
  // splits it into the new columns. The whole swap is one transaction, so a
  // failure leaves the old table untouched.
  db.transaction(() => {
    db.exec(`CREATE TABLE poems_new (${POEMS_COLUMNS});`);
    db.exec(`
      INSERT INTO poems_new (id, title, poet, publication_date, legacy_html, source,
                             created_by, updated_by, created_at, updated_at)
      SELECT id, title, poet, publication_date, html, 'app',
             created_by, updated_by, created_at, updated_at
      FROM poems;
      DROP TABLE poems;
      ALTER TABLE poems_new RENAME TO poems;
    `);
  })();
}
createIndexes();

module.exports = db;
module.exports.dataDir = dataDir;
