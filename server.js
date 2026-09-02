const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const crypto = require('crypto');
const express = require('express');
const session = require('express-session');
const SqliteStore = require('better-sqlite3-session-store')(session);

const db = require('./db');
const { seedDefaultUsers } = require('./seed-users');
const { router: authRouter } = require('./auth');
const poemsRouter = require('./routes/poems');
const generateRouter = require('./routes/generate');

const app = express();
const PORT = process.env.PORT || 3000;
const isProduction = app.get('env') === 'production';

if (!process.env.ANTHROPIC_API_KEY) {
  console.warn('Warning: ANTHROPIC_API_KEY is not set (see .env.example). Generating drafts will fail until it is.');
}

// On every boot, create any POET accounts from seed-users.js that don't
// already exist (e.g. a fresh database, or a newly added POET) and print
// their one-time passwords to the log so there's no need for shell access.
const createdAccounts = seedDefaultUsers();
if (createdAccounts.length) {
  console.log('Created POET accounts with these initial passwords (share each securely; not shown again):');
  for (const c of createdAccounts) console.log(`  ${c.username}: ${c.password}`);
}

// Needed so secure cookies and req.secure work correctly behind Render's
// (or any) reverse proxy, which terminates HTTPS and forwards plain HTTP.
app.set('trust proxy', 1);

app.use(express.json({ limit: '15mb' })); // article text can be long
app.use(session({
  store: new SqliteStore({
    client: db,
    expired: { clear: true, intervalMs: 1000 * 60 * 15 }
  }),
  secret: process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex'),
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: 'lax',
    secure: isProduction, // only over HTTPS once deployed; localhost stays http
    maxAge: 1000 * 60 * 60 * 24 * 14 // 14 days
  }
}));

app.use('/api', authRouter);
app.use('/api/poems', poemsRouter);
app.use('/api/generate', generateRouter);

app.use(express.static(path.join(__dirname, 'public')));

app.listen(PORT, () => {
  console.log(`POEM Generator running at http://localhost:${PORT}`);
});
