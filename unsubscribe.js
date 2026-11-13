// Unsubscribing from the Daily InfoPOEM, from the link in each email: /unsubscribe?u=<user>&t=<token>.
//
// The token is a signature of the user id (with SESSION_SECRET), so a link works without a
// login and cannot be made for someone else. Opening the link shows a page with a button
// (mail programs and virus scanners open links by themselves, so opening one changes
// nothing); pressing it, or a mail program's one-click unsubscribe (a POST to the same
// address, RFC 8058, offered through the List-Unsubscribe header), turns the email off.
// Readers can turn it back on in the app's menu.
const crypto = require('crypto');
const express = require('express');
const db = require('./db');
const { escapeHtml } = require('./poem-model');

const secret = () => process.env.SESSION_SECRET || 'local-testing-only';
const siteUrl = () => (process.env.APP_URL || `http://localhost:${process.env.PORT || 3000}`).replace(/\/+$/, '');

const tokenFor = userId => crypto.createHmac('sha256', secret()).update(`unsubscribe:${userId}`).digest('base64url').slice(0, 32);
function validToken(userId, token) {
  const want = Buffer.from(tokenFor(userId));
  const got = Buffer.from(String(token || ''));
  return got.length === want.length && crypto.timingSafeEqual(got, want);
}

// The link for one reader (or, with no id, the stand-in used in test emails).
const unsubscribeUrl = userId => (userId
  ? `${siteUrl()}/unsubscribe?u=${userId}&t=${tokenFor(userId)}`
  : `${siteUrl()}/unsubscribe?test=1`);

function page(title, body) {
  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex"><title>${escapeHtml(title)}</title>
<style>
  body { margin: 0; background: #f5f6f8; font-family: Arial, Helvetica, sans-serif; color: #1b1f23; }
  main { max-width: 460px; margin: 48px auto; background: #fff; border: 1px solid #dcdfe4; border-radius: 8px; padding: 24px; }
  h1 { font-size: 20px; color: #1f4b6e; margin: 0 0 12px; }
  p { line-height: 1.5; }
  button { background: #1f4b6e; color: #fff; border: 0; border-radius: 6px; padding: 10px 18px; font-size: 15px; cursor: pointer; }
  a { color: #1f4b6e; }
  img { display: block; margin-bottom: 8px; }
  @media (max-width: 520px) { main { margin: 16px; } }
</style></head>
<body><main><img src="/email/inforetriever.png" width="44" height="46" alt="InfoRetriever">
<h1>${escapeHtml(title)}</h1>${body}</main></body></html>`;
}

const readerFor = (u, t) => {
  const id = Number(u);
  if (!Number.isInteger(id) || id <= 0 || !validToken(id, t)) return null;
  return db.prepare("SELECT id, username, daily_email FROM users WHERE id = ? AND role = 'reader'").get(id) || null;
};

const router = express.Router();
const badLink = page('Link not recognised', `<p>This unsubscribe link is not complete. Please use the whole link from the email, or log in at <a href="${siteUrl()}/">InfoRetriever.org</a> and turn off the daily POEM in the menu.</p>`);

router.get('/unsubscribe', (req, res) => {
  if (req.query.test) return res.send(page('Test email', '<p>This link came from a test email, so there is nothing to unsubscribe.</p>'));
  const reader = readerFor(req.query.u, req.query.t);
  if (!reader) return res.status(400).send(badLink);
  if (!reader.daily_email) {
    return res.send(page('You are unsubscribed', `<p>${escapeHtml(reader.username)} no longer receives the Primary Care POEM. To start it again, log in at <a href="${siteUrl()}/">InfoRetriever.org</a> and turn it on in the menu.</p>`));
  }
  res.send(page('Unsubscribe from the Primary Care POEM', `
    <p>Stop sending the Primary Care POEM to <b>${escapeHtml(reader.username)}</b>?</p>
    <form method="post"><button type="submit">Unsubscribe</button></form>
    <p style="font-size: 13px; color: #6b7280;">Your InfoRetriever account stays open; you can turn the email back on in the menu after logging in.</p>`));
});

router.post('/unsubscribe', express.urlencoded({ extended: false, limit: '2kb' }), (req, res) => {
  const reader = readerFor(req.query.u, req.query.t);
  if (!reader) return res.status(400).send(badLink);
  db.prepare('UPDATE users SET daily_email = 0 WHERE id = ?').run(reader.id);
  res.send(page('You are unsubscribed', `<p>${escapeHtml(reader.username)} will no longer receive the Primary Care POEM. To start it again, log in at <a href="${siteUrl()}/">InfoRetriever.org</a> and turn it on in the menu.</p>`));
});

module.exports = { router, unsubscribeUrl, tokenFor };
