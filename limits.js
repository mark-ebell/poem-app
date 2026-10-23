// Usage limits for reader accounts, the main protection against copying the
// archive: a person reading POEMs stays well inside them, a script working through
// the collection does not. A reader who runs into a daily limit on LOCK_AFTER_HITS
// days within a week is locked (see `npm run readers`). Editors have no limits.
const db = require('./db');

const LIMITS = {
  view: { hour: 40, day: 150, noun: 'POEMs opened' },
  search: { hour: 60, day: 300, noun: 'searches' },
  download: { hour: 5, day: 5, noun: 'downloads' },
  calc: { hour: 100, day: 400, noun: 'calculator look-ups' }
};
const LOCK_AFTER_HITS = 3;

const countSince = db.prepare('SELECT COUNT(*) AS n FROM usage WHERE user_id = ? AND kind = ? AND at >= ?');
const record = db.prepare('INSERT INTO usage (user_id, kind, at) VALUES (?, ?, ?)');
const hitToday = db.prepare('SELECT 1 FROM limit_hits WHERE user_id = ? AND at >= ?');
const recordHit = db.prepare('INSERT INTO limit_hits (user_id, kind, at) VALUES (?, ?, ?)');
const hitDaysSince = db.prepare("SELECT COUNT(DISTINCT substr(at, 1, 10)) AS n FROM limit_hits WHERE user_id = ? AND at >= ?");
const lockUser = db.prepare("UPDATE users SET status = 'locked', locked_reason = ? WHERE id = ?");

const iso = ms => new Date(ms).toISOString();

// Records one use; returns null if allowed, or the message to show if not.
function useQuota(userId, kind) {
  const limit = LIMITS[kind];
  const now = Date.now();
  if (countSince.get(userId, kind, iso(now - 3600e3)).n >= limit.hour) {
    return `You have reached the limit of ${limit.hour} ${limit.noun} an hour. Please try again later.`;
  }
  if (countSince.get(userId, kind, iso(now - 86400e3)).n >= limit.day) {
    const today = new Date().toISOString().slice(0, 10);
    if (!hitToday.get(userId, today)) {
      recordHit.run(userId, kind, iso(now));
      if (hitDaysSince.get(userId, iso(now - 7 * 86400e3)).n >= LOCK_AFTER_HITS) {
        lockUser.run(`Reached the daily ${limit.noun} limit on ${LOCK_AFTER_HITS} days in one week`, userId);
      }
    }
    return `You have reached the limit of ${limit.day} ${limit.noun} a day. Please try again tomorrow.`;
  }
  record.run(userId, kind, iso(now));
  return null;
}

// Express middleware for reader requests: 429 with a message once the limit is reached.
const quota = kind => (req, res, next) => {
  if (req.session.role !== 'reader') return next();
  const message = useQuota(req.session.userId, kind);
  if (message) return res.status(429).json({ error: message });
  next();
};

// Usage older than two days is no longer needed for the limits.
function pruneUsage() {
  db.prepare('DELETE FROM usage WHERE at < ?').run(iso(Date.now() - 2 * 86400e3));
  db.prepare('DELETE FROM limit_hits WHERE at < ?').run(iso(Date.now() - 30 * 86400e3));
}

module.exports = { quota, useQuota, pruneUsage, LIMITS };
