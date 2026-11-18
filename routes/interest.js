// The waiting list for the daily POEM (inforetriever.org/poems): people leave their email
// address so we can write to them when the daily POEM email begins. It gives no account and
// no access; the administrator downloads the list on the Upload tab (routes/admin.js).
// The reply is the same whether or not the address was already on the list.
const express = require('express');
const rateLimit = require('express-rate-limit');
const db = require('../db');
const { verifyHuman } = require('../turnstile');

const router = express.Router();
const EMAIL_RE = /^[^\s@<>()[\]\\,;:"]+@[^\s@<>()[\]\\,;:"]+\.[^\s@<>()[\]\\,;:"]{2,}$/;
const limiter = rateLimit({
  windowMs: 60 * 60 * 1000, limit: 10, standardHeaders: true, legacyHeaders: false,
  message: { error: 'Too many requests from this network. Please try again in an hour.' }
});

router.post('/', limiter, async (req, res) => {
  const b = req.body || {};
  if (b.website) return res.json({ ok: true }); // a hidden field only robots fill in
  const email = String(b.email || '').trim().toLowerCase();
  if (!EMAIL_RE.test(email) || email.length > 254) return res.status(400).json({ error: 'Please enter a valid email address.' });
  if (!(await verifyHuman(b.turnstileToken, req.ip, 'interest'))) {
    return res.status(400).json({ error: 'The "are you human" check did not succeed. Please try it again.' });
  }
  db.prepare('INSERT OR IGNORE INTO poem_interest (email, created_at) VALUES (?, ?)').run(email, new Date().toISOString());
  res.json({ ok: true });
});

module.exports = router;
