// Logins for both kinds of account:
//   editors  the POETs; fixed accounts from seed-users.js, who log in with a username.
//   readers  members of the public, who sign up with their email address (confirmed
//            by an emailed link) and see only the Published POEMs.
// The reader forms never reveal whether an email address has an account, so they
// cannot be used to collect addresses.
const crypto = require('crypto');
const express = require('express');
const bcrypt = require('bcryptjs');
const rateLimit = require('express-rate-limit');
const db = require('./db');
const { sendMail } = require('./mail');
const { verifyHuman, turnstileEnabled } = require('./turnstile');

const router = express.Router();

// Once this app is reachable on the internet, its login page is reachable by
// anyone, not just people on this Mac — these limit password-guessing and sign-up abuse.
const limiter = (minutes, limit, message) => rateLimit({
  windowMs: minutes * 60 * 1000, limit, standardHeaders: true, legacyHeaders: false, message: { error: message }
});
const loginLimiter = limiter(15, 10, 'Too many login attempts. Please wait 15 minutes and try again.');
const signupLimiter = limiter(60, 5, 'Too many new accounts from this network. Please try again in an hour.');
const emailLimiter = limiter(60, 5, 'Too many requests. Please try again in an hour.');

const VERIFY_HOURS = 24;
const RESET_HOURS = 1;
const appUrl = () => (process.env.APP_URL || `http://localhost:${process.env.PORT || 3000}`).replace(/\/+$/, '');

// ---------- Rules ----------
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const normalize = v => String(v || '').trim().toLowerCase();

// Reader passwords: at least 8 characters, with at least one capital letter, two
// numbers and two symbols (anything that is not a letter, number or space). bcrypt
// reads only the first 72 bytes, so longer passwords are refused rather than cut short.
function readerPasswordProblem(pw) {
  const s = String(pw || '');
  const missing = [];
  if (s.length < 8) missing.push('at least 8 characters');
  if (!/[A-Z]/.test(s)) missing.push('an upper case letter');
  if ((s.match(/[0-9]/g) || []).length < 2) missing.push('2 numbers');
  if ((s.match(/[^A-Za-z0-9\s]/g) || []).length < 2) missing.push('2 special symbols');
  if (missing.length) return `The password needs ${missing.join(', ')}.`;
  if (Buffer.byteLength(s) > 72) return 'The password is too long (72 characters at most).';
  return null;
}

// ---------- Emailed links ----------
const hashToken = t => crypto.createHash('sha256').update(String(t)).digest('hex');

function newToken(userId, purpose, hours) {
  const token = crypto.randomBytes(32).toString('base64url');
  db.prepare('DELETE FROM email_tokens WHERE user_id = ? AND purpose = ?').run(userId, purpose);
  db.prepare('INSERT INTO email_tokens (token_hash, user_id, purpose, expires_at) VALUES (?, ?, ?, ?)')
    .run(hashToken(token), userId, purpose, new Date(Date.now() + hours * 3600e3).toISOString());
  return token;
}

// Returns the user id for a valid, unexpired token and uses it up.
function takeToken(token, purpose) {
  const row = db.prepare('SELECT * FROM email_tokens WHERE token_hash = ? AND purpose = ?').get(hashToken(token), purpose);
  if (!row) return null;
  db.prepare('DELETE FROM email_tokens WHERE token_hash = ?').run(row.token_hash);
  return row.expires_at > new Date().toISOString() ? row.user_id : null;
}

async function sendVerification(user) {
  const link = `${appUrl()}/?verify=${newToken(user.id, 'verify', VERIFY_HOURS)}`;
  await sendMail({
    to: user.username,
    subject: 'Confirm your InfoRetriever account',
    text: `Welcome to InfoRetriever.\n\nTo confirm your email address and start using your account, open this link within ${VERIFY_HOURS} hours:\n\n${link}\n\nIf you did not create an account, you can ignore this email.`
  });
}

async function sendReset(user) {
  const link = `${appUrl()}/?reset=${newToken(user.id, 'reset', RESET_HOURS)}`;
  await sendMail({
    to: user.username,
    subject: 'Reset your InfoRetriever password',
    text: `To choose a new password for your InfoRetriever account, open this link within ${RESET_HOURS} hour:\n\n${link}\n\nIf you did not ask to reset your password, you can ignore this email; your password has not changed.`
  });
}

// Email failures are logged, not shown, so the reply is the same either way.
const quietly = promise => promise.catch(err => console.error('Email failed:', err.message));

// ---------- Sessions and access ----------
const LOCKED_MESSAGE = 'This account has been locked because of unusually heavy use. Please contact the InfoRetriever team if you think this is a mistake.';
const DUMMY_HASH = bcrypt.hashSync(crypto.randomBytes(16).toString('hex'), 10);

function requireAuth(req, res, next) {
  if (!req.session.userId) return res.status(401).json({ error: 'Not logged in.' });
  const user = db.prepare('SELECT role, status FROM users WHERE id = ?').get(req.session.userId);
  if (!user || user.status !== 'active') {
    return req.session.destroy(() => res.status(401).json({ error: 'Not logged in.' }));
  }
  req.session.role = user.role; // always the current role, even if it changed after login
  next();
}

// Upload, Edit, the full POEM list and the administrator tools.
function requireEditor(req, res, next) {
  requireAuth(req, res, () => {
    if (req.session.role !== 'editor') return res.status(403).json({ error: 'Only editors can do this.' });
    next();
  });
}

const isReader = req => req.session.role === 'reader';

function publicUser(user) {
  return {
    username: user.username,
    displayName: user.display_name,
    role: user.role,
    mustChangePassword: !!user.must_change_password
  };
}

function startSession(req, res, user) {
  req.session.regenerate((err) => {
    if (err) return res.status(500).json({ error: 'Login failed. Please try again.' });
    req.session.userId = user.id;
    req.session.username = user.username;
    req.session.role = user.role;
    db.prepare('UPDATE users SET last_login_at = ? WHERE id = ?').run(new Date().toISOString(), user.id);
    res.json({ user: publicUser(user) });
  });
}

// ---------- Routes ----------
router.get('/config', (req, res) => {
  res.json({ turnstileSiteKey: turnstileEnabled() ? process.env.TURNSTILE_SITE_KEY : null });
});

// Editors log in with their username, readers with their email address.
router.post('/login', loginLimiter, (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ error: 'Username (or email) and password are required.' });
  }
  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(normalize(username));
  // Checked against a stand-in hash when there is no such account, so the reply takes as long either way.
  const passwordOk = bcrypt.compareSync(String(password), user ? user.password_hash : DUMMY_HASH);
  if (!user || !passwordOk) {
    return res.status(401).json({ error: 'Incorrect username or password.' });
  }
  if (user.status !== 'active') return res.status(403).json({ error: LOCKED_MESSAGE });
  if (user.role === 'reader' && !user.email_verified) {
    quietly(sendVerification(user));
    return res.status(403).json({ error: 'Please confirm your email address first. We have sent you a new confirmation link.' });
  }
  startSession(req, res, user);
});

router.post('/signup', signupLimiter, async (req, res) => {
  const b = req.body || {};
  const email = normalize(b.email);
  if (!EMAIL_RE.test(email) || email.length > 254) return res.status(400).json({ error: 'Please enter a valid email address.' });
  const problem = readerPasswordProblem(b.password);
  if (problem) return res.status(400).json({ error: problem });
  if (b.acceptTerms !== true) return res.status(400).json({ error: 'Please agree to the Terms of Use to create an account.' });
  if (!(await verifyHuman(b.turnstileToken, req.ip, 'signup'))) {
    return res.status(400).json({ error: 'The "are you human" check did not succeed. Please try again.' });
  }

  const existing = db.prepare('SELECT * FROM users WHERE username = ?').get(email);
  if (existing) {
    // Same reply as for a new account. An unconfirmed reader gets a fresh link; a confirmed one a reminder.
    if (existing.role === 'reader' && !existing.email_verified) quietly(sendVerification(existing));
    else if (existing.role === 'reader') {
      quietly(sendMail({
        to: email,
        subject: 'Your InfoRetriever account',
        text: `Someone (perhaps you) tried to create an InfoRetriever account with this email address, but it already has one. You can log in at ${appUrl()}/ or use "Forgot password?" there to choose a new password.`
      }));
    }
  } else {
    const now = new Date().toISOString();
    const info = db.prepare(`
      INSERT INTO users (username, display_name, password_hash, must_change_password, role, terms_accepted_at, created_at)
      VALUES (?, ?, ?, 0, 'reader', ?, ?)
    `).run(email, email, bcrypt.hashSync(String(b.password), 12), now, now);
    quietly(sendVerification({ id: info.lastInsertRowid, username: email }));
  }
  res.json({ ok: true });
});

router.post('/verify', (req, res) => {
  const userId = takeToken((req.body || {}).token, 'verify');
  if (!userId) return res.status(400).json({ error: 'This confirmation link is invalid or has expired. Log in to have a new one sent.' });
  db.prepare('UPDATE users SET email_verified = 1 WHERE id = ?').run(userId);
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
  if (!user || user.status !== 'active') return res.status(403).json({ error: LOCKED_MESSAGE });
  startSession(req, res, user);
});

// Readers only: editors have no email address on file (an administrator resets theirs).
router.post('/forgot', emailLimiter, (req, res) => {
  const user = db.prepare("SELECT * FROM users WHERE username = ? AND role = 'reader'").get(normalize((req.body || {}).email));
  if (user && user.status === 'active') quietly(sendReset(user));
  res.json({ ok: true });
});

router.post('/reset', emailLimiter, (req, res) => {
  const b = req.body || {};
  const problem = readerPasswordProblem(b.password);
  if (problem) return res.status(400).json({ error: problem });
  const userId = takeToken(b.token, 'reset');
  if (!userId) return res.status(400).json({ error: 'This reset link is invalid or has expired. Please ask for a new one.' });
  // Following the emailed link also confirms the address.
  db.prepare('UPDATE users SET password_hash = ?, email_verified = 1 WHERE id = ?').run(bcrypt.hashSync(String(b.password), 12), userId);
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
  if (!user || user.status !== 'active') return res.status(403).json({ error: LOCKED_MESSAGE });
  startSession(req, res, user);
});

router.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.clearCookie('connect.sid');
    res.json({ ok: true });
  });
});

router.get('/me', requireAuth, (req, res) => {
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.session.userId);
  res.json({ user: publicUser(user) });
});

router.post('/change-password', requireAuth, loginLimiter, (req, res) => {
  const { currentPassword, newPassword } = req.body || {};
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Current and new password are required.' });
  }
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.session.userId);
  if (!user || !bcrypt.compareSync(String(currentPassword), user.password_hash)) {
    return res.status(401).json({ error: 'Current password is incorrect.' });
  }
  const problem = user.role === 'reader'
    ? readerPasswordProblem(newPassword)
    : (String(newPassword).length < 8 ? 'New password must be at least 8 characters.' : null);
  if (problem) return res.status(400).json({ error: problem });
  const hash = bcrypt.hashSync(String(newPassword), user.role === 'reader' ? 12 : 10);
  db.prepare('UPDATE users SET password_hash = ?, must_change_password = 0 WHERE id = ?').run(hash, user.id);
  res.json({ ok: true });
});

module.exports = { router, requireAuth, requireEditor, isReader };
