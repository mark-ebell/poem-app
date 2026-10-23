// Manage reader accounts from the command line (on Render: the service's Shell tab).
//   npm run readers                    list readers, newest first, with any locked ones marked
//   npm run readers -- locked          list locked readers only
//   npm run readers -- unlock <email>  unlock an account (and clear its usage history)
//   npm run readers -- lock <email>    lock an account
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const db = require('./db');

const [command, emailArg] = process.argv.slice(2);
const email = String(emailArg || '').trim().toLowerCase();

function list(lockedOnly) {
  const rows = db.prepare(`
    SELECT username, email_verified, status, locked_reason, created_at, last_login_at FROM users
    WHERE role = 'reader' ${lockedOnly ? "AND status = 'locked'" : ''} ORDER BY created_at DESC
  `).all();
  if (!rows.length) return console.log(lockedOnly ? 'No locked reader accounts.' : 'No reader accounts yet.');
  for (const r of rows) {
    const flags = [r.email_verified ? null : 'unconfirmed', r.status === 'locked' ? `LOCKED: ${r.locked_reason || ''}` : null].filter(Boolean);
    console.log(`${r.username}  created ${r.created_at.slice(0, 10)}  last login ${r.last_login_at ? r.last_login_at.slice(0, 10) : 'never'}${flags.length ? '  [' + flags.join('; ') + ']' : ''}`);
  }
  console.log(`\n${rows.length} account(s).`);
}

function setStatus(status) {
  const user = db.prepare("SELECT id FROM users WHERE username = ? AND role = 'reader'").get(email);
  if (!user) { console.error(`No reader account for "${email}".`); process.exit(1); }
  db.transaction(() => {
    db.prepare('UPDATE users SET status = ?, locked_reason = ? WHERE id = ?')
      .run(status, status === 'locked' ? 'Locked by an administrator' : null, user.id);
    if (status === 'active') {
      db.prepare('DELETE FROM usage WHERE user_id = ?').run(user.id);
      db.prepare('DELETE FROM limit_hits WHERE user_id = ?').run(user.id);
    }
  })();
  console.log(`${email} is now ${status === 'locked' ? 'locked' : 'unlocked'}.`);
}

if (!command) list(false);
else if (command === 'locked') list(true);
else if (command === 'unlock' && email) setStatus('active');
else if (command === 'lock' && email) setStatus('locked');
else {
  console.error('Usage: npm run readers [-- locked | unlock <email> | lock <email>]');
  process.exit(1);
}
