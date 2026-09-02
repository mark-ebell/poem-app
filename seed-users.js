// Creates the fixed POET accounts if they don't already exist, each with
// a random initial password (which the user must change on first login).
// Safe to re-run: existing accounts are left untouched.
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const db = require('./db');

const POETS = [
  { username: 'barry', displayName: 'Barry' },
  { username: 'ebell', displayName: 'Ebell' },
  { username: 'shaughnessy', displayName: 'Shaughnessy' },
  { username: 'slawson', displayName: 'Slawson' },
  { username: 'speer', displayName: 'Speer' },
  { username: 'rowland', displayName: 'Rowland' },
  { username: 'rayala', displayName: 'Rayala' }
];

function randomPassword() {
  return crypto.randomBytes(9).toString('base64url'); // 12-char, URL-safe
}

function seedDefaultUsers() {
  const existing = db.prepare('SELECT username FROM users').all().map(u => u.username);
  const insert = db.prepare(`
    INSERT INTO users (username, display_name, password_hash, must_change_password, created_at)
    VALUES (?, ?, ?, 1, ?)
  `);

  const created = [];
  for (const poet of POETS) {
    if (existing.includes(poet.username)) continue;
    const password = randomPassword();
    const hash = bcrypt.hashSync(password, 10);
    insert.run(poet.username, poet.displayName, hash, new Date().toISOString());
    created.push({ username: poet.username, password });
  }
  return created;
}

if (require.main === module) {
  const created = seedDefaultUsers();
  if (created.length === 0) {
    console.log('All POET accounts already exist. No changes made.');
    console.log('To reset someone\'s password, delete their row from the users table and re-run this script.');
  } else {
    console.log('Created accounts with these initial passwords (share each securely, then have them change it after logging in):\n');
    for (const c of created) {
      console.log(`  username: ${c.username.padEnd(12)} password: ${c.password}`);
    }
    console.log('\nThese passwords are shown only once and are not stored anywhere in plain text.');
  }
}

module.exports = { seedDefaultUsers, POETS };
