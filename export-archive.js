#!/usr/bin/env node
// Writes the imported historical POEMs (source = 'import') from the local
// database to a gzipped JSON file, which an administrator can then upload from
// the Browse tab of the deployed app (see routes/admin.js). POEMs written in
// the app are never included.
//
//   node export-archive.js [output-file]     default: <data dir>/poems-archive.json.gz
const path = require('path');
const fs = require('fs');
const zlib = require('zlib');
const db = require('./db');

const out = process.argv[2] || path.join(db.dataDir, 'poems-archive.json.gz');
const rows = db.prepare("SELECT * FROM poems WHERE source = 'import'").all();
for (const r of rows) delete r.legacy_html;

const gz = zlib.gzipSync(Buffer.from(JSON.stringify(rows)), { level: 9 });
fs.writeFileSync(out, gz);
console.log(`Exported ${rows.length} imported POEMs to ${out} (${(gz.length / 1048576).toFixed(1)} MB).`);
