// Manage reader accounts from the command line (on Render: the service's Shell tab).
//   npm run readers                    list readers, newest first, with any locked ones marked
//   npm run readers -- locked          list locked readers only
//   npm run readers -- unlock <email>  unlock an account (and clear its usage history)
//   npm run readers -- lock <email>    lock an account
//   npm run readers -- requests        list requests for full access
//   npm run readers -- full <email>    give a reader full access (emails them)
//   npm run readers -- poems <email>   the POEMs only (also declines a request)
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const db = require('./db');
const { sendAccessGranted } = require('./auth');

const [command, emailArg] = process.argv.slice(2);
const email = String(emailArg || '').trim().toLowerCase();

function list(which) {
  const where = { locked: "AND status = 'locked'", requests: "AND full_access_requested_at IS NOT NULL AND access <> 'full'" }[which] || '';
  const rows = db.prepare(`
    SELECT username, email_verified, status, locked_reason, created_at, last_login_at, access, full_access_requested_at, access_request_note, daily_email FROM users
    WHERE role = 'reader' ${where} ORDER BY created_at DESC
  `).all();
  if (!rows.length) return console.log({ locked: 'No locked reader accounts.', requests: 'No requests for full access.' }[which] || 'No reader accounts yet.');
  for (const r of rows) {
    const flags = [r.access === 'full' ? 'full access' : 'POEMs only', r.daily_email ? 'daily POEM' : null,
      r.access !== 'full' && r.full_access_requested_at ? `REQUESTED full access ${r.full_access_requested_at.slice(0, 10)}${r.access_request_note ? ': ' + r.access_request_note : ''}` : null,
      r.email_verified ? null : 'unconfirmed', r.status === 'locked' ? `LOCKED: ${r.locked_reason || ''}` : null].filter(Boolean);
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

function setAccess(access) {
  const user = db.prepare("SELECT * FROM users WHERE username = ? AND role = 'reader'").get(email);
  if (!user) { console.error(`No reader account for "${email}".`); process.exit(1); }
  db.prepare('UPDATE users SET access = ?, full_access_requested_at = NULL, access_request_note = NULL WHERE id = ?').run(access, user.id);
  console.log(`${email} now has ${access === 'full' ? 'full access' : 'the POEMs only'}.`);
  if (access === 'full' && user.access !== 'full') {
    return sendAccessGranted(user).then(() => console.log('Emailed them.'), err => console.error('The email failed:', err.message));
  }
}

if (!command) list();
else if (command === 'locked' || command === 'requests') list(command);
else if ((command === 'full' || command === 'poems') && email) setAccess(command);
else if (command === 'unlock' && email) setStatus('active');
else if (command === 'lock' && email) setStatus('locked');
else {
  console.error('Usage: npm run readers [-- locked | requests | unlock <email> | lock <email> | full <email> | poems <email>]');
  process.exit(1);
}
