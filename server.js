const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const crypto = require('crypto');
const express = require('express');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const session = require('express-session');
const SqliteStore = require('better-sqlite3-session-store')(session);

const db = require('./db');
const { seedDefaultUsers } = require('./seed-users');
const { migrateLegacyPoems, remapAuthorInitials } = require('./migrate-legacy');
const { router: authRouter } = require('./auth');
const poemsRouter = require('./routes/poems');
const generateRouter = require('./routes/generate');
const { pruneUsage } = require('./limits');
const { assignMissingDailyDates, startDailyPoemSchedule } = require('./daily-poem');
const { turnstileEnabled } = require('./turnstile');

const app = express();
const PORT = process.env.PORT || 3000;
const isProduction = app.get('env') === 'production';

if (!process.env.ANTHROPIC_API_KEY) {
  console.warn('Warning: ANTHROPIC_API_KEY is not set (see .env.example). Generating drafts will fail until it is.');
}
if (isProduction) {
  if (!process.env.RESEND_API_KEY) console.warn('Warning: RESEND_API_KEY is not set; reader sign-up emails are only written to the log.');
  if (!turnstileEnabled()) console.warn('Warning: Turnstile keys are not set; the sign-up form has no "are you human" check.');
  if (!process.env.APP_URL) console.warn('Warning: APP_URL is not set; links in reader emails will point to localhost.');
}
setInterval(pruneUsage, 60 * 60 * 1000).unref();
const dailyAssigned = assignMissingDailyDates();
if (dailyAssigned) console.log(`Daily InfoPOEM: gave ${dailyAssigned} Published POEM(s) a day.`);
startDailyPoemSchedule();

const migratedPoems = migrateLegacyPoems();
if (migratedPoems) console.log(`Converted ${migratedPoems} saved POEM(s) to separate database fields.`);
const remappedAuthors = remapAuthorInitials();
if (remappedAuthors) console.log(`Relabelled ${remappedAuthors} POEM(s) from author initials to names.`);
const indexedPoems = require('./search').backfillSearchText();
if (indexedPoems) console.log(`Built the search index for ${indexedPoems} POEM(s).`);

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

// ---------- Protection for a site open to the public ----------
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      // pdf.js (Upload tab) comes from cdnjs; Turnstile (sign-up) from Cloudflare.
      scriptSrc: ["'self'", 'https://cdnjs.cloudflare.com', 'https://challenges.cloudflare.com'],
      workerSrc: ["'self'", 'blob:', 'https://cdnjs.cloudflare.com'],
      connectSrc: ["'self'", 'https://cdnjs.cloudflare.com', 'https://challenges.cloudflare.com'],
      frameSrc: ["'self'", 'https://challenges.cloudflare.com'],
      // The editor's font styling and the print pages use inline styles.
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'blob:'],
      frameAncestors: ["'none'"]
    }
  },
  crossOriginEmbedderPolicy: false
}));

// The images in the Daily InfoPOEM email (public/email/) are loaded by mail programs from
// other origins, often through image proxies, so they are exempt from the same-origin
// resource policy above and from the crawler filter below.
const isEmailImage = req => req.path.startsWith('/email/');
app.use((req, res, next) => {
  if (isEmailImage(req)) res.set('Cross-Origin-Resource-Policy', 'cross-origin');
  next();
});

// Ask search engines and AI crawlers not to index or train on anything here.
app.use((req, res, next) => {
  res.set('X-Robots-Tag', 'noindex, nofollow, noarchive, nosnippet, noai, noimageai');
  next();
});

// Known AI and bulk crawlers, and common scraping tools, are turned away outright
// (robots.txt asks them to stay out; this catches the ones that don't ask).
const BLOCKED_AGENTS = /GPTBot|ChatGPT-User|OAI-SearchBot|ClaudeBot|Claude-Web|anthropic-ai|CCBot|Google-Extended|GoogleOther|PerplexityBot|Perplexity-User|Bytespider|Amazonbot|Applebot-Extended|meta-externalagent|FacebookBot|Diffbot|ImagesiftBot|Omgili|cohere-ai|YouBot|Timpibot|DataForSeoBot|AI2Bot|Scrapy|python-requests|python-urllib|aiohttp|httpx|Go-http-client|curl\/|Wget|HeadlessChrome|PhantomJS/i;
app.use((req, res, next) => {
  if (req.path === '/robots.txt' || isEmailImage(req)) return next();
  const ua = req.get('user-agent') || '';
  if (!ua || BLOCKED_AGENTS.test(ua)) return res.status(403).type('text').send('Automated access is not permitted.');
  next();
});

// An overall ceiling per network address, on top of the per-account limits for readers.
app.use('/api', rateLimit({
  windowMs: 15 * 60 * 1000, limit: 1000, standardHeaders: true, legacyHeaders: false,
  message: { error: 'Too many requests. Please wait a few minutes and try again.' }
}));

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

app.use('/api', (req, res, next) => { res.set('Cache-Control', 'no-store'); next(); });
app.use('/api', authRouter);
app.use('/api/poems', poemsRouter);
app.use('/api/generate', generateRouter);
app.use('/api/admin', require('./routes/admin'));
app.use('/api/evidence', require('./routes/evidence'));
app.use('/api/calculator', require('./routes/calculator'));
app.use('/api/chapters', require('./routes/chapters'));
app.use('/api/chapter-edit', require('./routes/chapter-edit'));

app.use(express.static(path.join(__dirname, 'public')));

app.listen(PORT, () => {
  console.log(`InfoRetriever running at http://localhost:${PORT}`);
});
