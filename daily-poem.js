// Daily InfoPOEM: one POEM emailed to subscribers each day.
//
// When a POEM becomes Published it is given a day in its publication month that no other
// POEM has (today or later, so it can still be sent), chosen at random: a weekday while
// any are free, then a Saturday, then a Sunday. POEMs published in the current month or
// later take part (older POEMs and the archive do not). On that day, from
// SEND_HOUR US Eastern time, the server emails it to every subscriber: each reader with a
// confirmed address, an active account and the daily email turned on (users.daily_email,
// on when a reader signs up; see auth.js). Each subscriber gets a separate message with
// their own unsubscribe link (unsubscribe.js), sent 100 at a time through Resend's batch
// endpoint. Each subscriber sent to is recorded (daily_recipient_sends), and the day itself
// once everyone has it (daily_sends), so a restart or a failure part way through carries on
// with the rest and never sends anyone the same day twice. Sending is off unless
// DAILY_POEM_SENDING is "on"; POEMs are still given days while it is off, and send-test
// still works. The footer has the postal address CAN-SPAM requires (MAIL_POSTAL_ADDRESS).
//
// From the command line (on Render: the service's Shell tab):
//   npm run daily-poem -- schedule          the assigned days and the number of subscribers
//   npm run daily-poem -- send-test [num] [address ...]   send now to the administrator (ADMIN_EMAIL)
//                                                     or to each address given: today's POEM, or POEM number num
//   npm run daily-poem -- preview [num]     write the email to daily-poem-preview.html
const crypto = require('crypto');
const db = require('./db');
const { sendMail, sendBatch, BATCH_SIZE } = require('./mail');
const { unsubscribeUrl } = require('./unsubscribe');
const { describePoem, runsToHtml, DISCLAIMER } = require('./export-poems');
const { escapeHtml } = require('./poem-model');

const TIME_ZONE = 'America/New_York';
const SEND_HOUR = 6;
const sendingOn = () => String(process.env.DAILY_POEM_SENDING || '').trim().toLowerCase() === 'on';
const testAddress = () => (process.env.ADMIN_EMAIL || 'ebell@msu.edu').trim();
const siteUrl = () => (process.env.APP_URL || 'https://inforetriever.org').replace(/\/+$/, '');
const postalAddress = () => String(process.env.MAIL_POSTAL_ADDRESS || '').trim();

// The readers the email goes to.
const subscribers = () => db.prepare(`SELECT id, username FROM users WHERE role = 'reader' AND email_verified = 1
  AND status = 'active' AND daily_email = 1 ORDER BY id`).all();

// ---------- Dates (US Eastern) ----------
function easternNow(now = new Date()) {
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-US', {
    timeZone: TIME_ZONE, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', hourCycle: 'h23'
  }).formatToParts(now).map(p => [p.type, p.value]));
  return { date: `${parts.year}-${parts.month}-${parts.day}`, hour: Number(parts.hour) };
}

// The days of a month ('YYYY-MM') as 'YYYY-MM-DD', in the order they are used: Monday to
// Friday ([0]), Saturdays ([1]), Sundays ([2]).
function daysOf(month) {
  const [y, m] = month.split('-').map(Number);
  const out = [[], [], []];
  for (let d = 1; d <= 31; d++) {
    const day = new Date(Date.UTC(y, m - 1, d));
    if (day.getUTCMonth() !== m - 1) break;
    const dow = day.getUTCDay();
    out[dow === 6 ? 1 : dow === 0 ? 2 : 0].push(day.toISOString().slice(0, 10));
  }
  return out;
}
const weekdaysOf = month => daysOf(month)[0];

// ---------- Assigning days ----------
// Gives a Published POEM its Daily InfoPOEM day, if it is from the current month or later
// and has none. Returns the day, or null.
function assignDailyDate(poemRecordId) {
  const row = db.prepare('SELECT id, status, publication_date, daily_date FROM poems WHERE id = ?').get(poemRecordId);
  const today = easternNow().date;
  if (!row || row.status !== 'Published' || row.daily_date || !/^\d{4}-\d{2}$/.test(row.publication_date || '')
    || row.publication_date < today.slice(0, 7)) return null;
  const taken = new Set(db.prepare('SELECT daily_date FROM poems WHERE daily_date IS NOT NULL').all().map(r => r.daily_date));
  const free = daysOf(row.publication_date).map(days => days.filter(d => d >= today && !taken.has(d))).find(days => days.length);
  if (!free) {
    console.warn(`Daily InfoPOEM: no free day left in ${row.publication_date} for POEM ${row.id}.`);
    return null;
  }
  const day = free[crypto.randomInt(free.length)];
  db.prepare('UPDATE poems SET daily_date = ? WHERE id = ?').run(day, row.id);
  return day;
}

// Published POEMs from the current month or later that have no day yet (run at startup),
// in random order.
function assignMissingDailyDates() {
  const rows = db.prepare(`SELECT id FROM poems WHERE status = 'Published' AND daily_date IS NULL
    AND publication_date >= ?`).all(easternNow().date.slice(0, 7));
  for (let i = rows.length - 1; i > 0; i--) { const j = crypto.randomInt(i + 1); [rows[i], rows[j]] = [rows[j], rows[i]]; }
  return rows.filter(r => assignDailyDate(r.id)).length;
}

// ---------- The email ----------
const FONT = "font-family: Arial, Helvetica, sans-serif;";
// The copyright line under the POEM (from 2027, when the emails start: the year it is sent).
const copyright = d => `Copyright ${Math.max(2027, Number(d.slice(0, 4)))}, Center for Family Medicine Innovation`;
const longDate = d => new Date(`${d}T12:00:00Z`).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' });

// The email for one day. unsubscribe is the reader's own unsubscribe link (or a stand-in
// that sendDailyPoem swaps for each reader's).
function buildEmail(row, sendDate, { unsubscribe = unsubscribeUrl(null) } = {}) {
  const base = siteUrl();
  const poem = describePoem(row, { reader: true });
  // Clinical question, Bottom-Line and Reference first, then the rest in their usual order.
  const FIRST = ['Clinical question', 'Bottom-Line', 'Reference'];
  poem.sections.sort((a, b) => (FIRST.includes(a.label) ? FIRST.indexOf(a.label) : FIRST.length) - (FIRST.includes(b.label) ? FIRST.indexOf(b.label) : FIRST.length));
  const flow = paragraphs => paragraphs.map(runs => runsToHtml(runs.map(r => (r.br ? { text: ' ' } : r)))).join(' ');
  const link = 'color: #1f4b6e;';
  const sections = poem.sections.map(sec => {
    const bottom = sec.label === 'Bottom-Line';
    const body = flow(sec.paragraphs).replace(/<a href=/g, `<a style="${link}" href=`);
    return bottom
      ? `<tr><td style="padding: 6px 0 12px;"><div style="${FONT} font-size: 15px; line-height: 1.5; color: #1b1f23; background: #f4f8fb; border-left: 4px solid #1f4b6e; padding: 10px 14px;"><b>${escapeHtml(sec.label)}:</b> ${body}</div></td></tr>`
      : `<tr><td style="${FONT} font-size: 15px; line-height: 1.5; color: #1b1f23; padding: 0 0 10px;"><b>${escapeHtml(sec.label)}:</b> ${body}</td></tr>`;
  }).join('\n');

  const html = `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${escapeHtml(`Primary Care POEM: ${poem.title}`)}</title></head>
<body style="margin: 0; padding: 0; background: #f5f6f8;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background: #f5f6f8;"><tr><td align="center" style="padding: 16px 8px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width: 640px; background: #ffffff; border: 1px solid #dcdfe4; border-radius: 8px;">
  <tr><td style="padding: 16px 20px 12px; border-bottom: 1px solid #dcdfe4;">
    <a href="${base}/" style="${FONT} color: #1f4b6e; font-weight: bold; font-size: 22px; line-height: 1.25; text-decoration: none; display: block;">Primary Care POEM:<br>Your Clinical Awareness System</a>
  </td></tr>
  <tr><td style="padding: 18px 20px 6px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr><td style="${FONT} font-size: 12px; letter-spacing: 0.04em; text-transform: uppercase; color: #6b7280; padding-bottom: 6px;">${escapeHtml(longDate(sendDate))}</td></tr>
      <tr><td style="${FONT} font-size: 18px; line-height: 1.3; font-weight: bold; color: #1f4b6e; padding-bottom: 14px;">${escapeHtml(poem.title)}</td></tr>
      ${sections}
      <tr><td style="${FONT} font-size: 13px; line-height: 1.5; color: #6b7280; padding: 4px 0 10px;">${escapeHtml(copyright(sendDate))}</td></tr>
    </table>
  </td></tr>
  <tr><td style="padding: 8px 20px 20px; border-top: 1px solid #dcdfe4;">
    <p style="${FONT} font-size: 12px; line-height: 1.5; color: #6b7280; font-style: italic; margin: 12px 0;">${escapeHtml(DISCLAIMER)}</p>
    <p style="${FONT} font-size: 13px; line-height: 1.5; color: #1b1f23; margin: 0;">Search more than 8,000 POEMs at <a href="${base}/" style="${link} font-weight: bold;">InfoRetriever.org</a>. &middot; <a href="${base}/about-poems.html" style="${link}">About POEMs</a></p>
    <p style="${FONT} font-size: 12px; line-height: 1.5; color: #6b7280; margin: 12px 0 0;">You are receiving this email because you signed up for the Primary Care POEM at InfoRetriever.org. <a href="${escapeHtml(unsubscribe)}" style="color: #6b7280;">Unsubscribe</a></p>
    ${postalAddress() ? `<p style="${FONT} font-size: 12px; line-height: 1.5; color: #6b7280; margin: 4px 0 0;">${escapeHtml(postalAddress())}</p>` : ''}
  </td></tr>
</table>
</td></tr></table>
</body></html>`;

  const plain = p => p.map(runs => runs.map(r => (r.br ? ' ' : r.text)).join('')).join(' ');
  const text = [
    'Primary Care POEM:',
    'Your Clinical Awareness System',
    longDate(sendDate),
    '',
    poem.title,
    '',
    ...poem.sections.map(sec => `${sec.label}: ${plain(sec.paragraphs)}`),
    copyright(sendDate),
    '',
    DISCLAIMER,
    '',
    `More POEMs at ${base}/`,
    `About POEMs: ${base}/about-poems.html`,
    '',
    'You are receiving this email because you signed up for the Primary Care POEM at InfoRetriever.org.',
    `Unsubscribe: ${unsubscribe}`,
    ...(postalAddress() ? [postalAddress()] : [])
  ].filter((l, i, a) => !(l === '' && a[i - 1] === '')).join('\n');

  return { subject: `Primary Care POEM: ${poem.title}`, html, text };
}

// ---------- Sending ----------
function poemForDay(date) {
  return db.prepare("SELECT * FROM poems WHERE daily_date = ? AND status = 'Published' LIMIT 1").get(date);
}

const wasSent = date => !!db.prepare('SELECT 1 FROM daily_sends WHERE send_date = ?').get(date);
const sleep = ms => new Promise(r => setTimeout(r, ms));
const PLACEHOLDER = 'https://unsubscribe.invalid/reader'; // swapped for each reader's own link

// The headers that give mail programs their own unsubscribe button (RFC 2369 and 8058).
const unsubscribeHeaders = url => ({ 'List-Unsubscribe': `<${url}>`, 'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click' });

// Sends the day's POEM to every subscriber who has not had it yet, 100 at a time. A batch
// that fails stops the send; the next check carries on from there. Returns what happened.
async function sendDailyPoem(date) {
  const row = poemForDay(date);
  if (!row) return 'no POEM for this day';
  if (wasSent(date)) return 'already sent';
  const done = new Set(db.prepare('SELECT user_id FROM daily_recipient_sends WHERE send_date = ?').all(date).map(r => r.user_id));
  const todo = subscribers().filter(r => !done.has(r.id));
  if (!todo.length && !done.size) return 'no subscribers';
  const { subject, html, text } = buildEmail(row, date, { unsubscribe: PLACEHOLDER });
  const record = db.prepare('INSERT OR IGNORE INTO daily_recipient_sends (send_date, user_id) VALUES (?, ?)');
  let sent = 0;
  for (let i = 0; i < todo.length; i += BATCH_SIZE) {
    const chunk = todo.slice(i, i + BATCH_SIZE);
    const emails = chunk.map(r => {
      const url = unsubscribeUrl(r.id);
      return { to: r.username, subject, html: html.split(escapeHtml(PLACEHOLDER)).join(escapeHtml(url)), text: text.split(PLACEHOLDER).join(url), headers: unsubscribeHeaders(url) };
    });
    const key = `daily-${date}-` + crypto.createHash('sha256').update(chunk.map(r => r.id).join(',')).digest('hex').slice(0, 24);
    try {
      await sendBatch(emails, { idempotencyKey: key });
    } catch (err) {
      return `failed after sending to ${done.size + sent} reader(s): ${err.message}`;
    }
    db.transaction(() => chunk.forEach(r => record.run(date, r.id)))();
    sent += chunk.length;
    if (i + BATCH_SIZE < todo.length) await sleep(600); // Resend allows a few requests a second
  }
  db.prepare('INSERT INTO daily_sends (send_date, poem_id, recipients, sent_at) VALUES (?, ?, ?, ?)')
    .run(date, row.id, `${done.size + sent} readers`, new Date().toISOString());
  return `sent "${row.title}" to ${sent} reader(s)${done.size ? ` (and ${done.size} earlier)` : ''}`;
}

// Checks every 10 minutes: from SEND_HOUR Eastern, today's POEM goes out once.
function startDailyPoemSchedule() {
  if (!sendingOn()) return console.log('Daily InfoPOEM: sending is off (set DAILY_POEM_SENDING=on to send).');
  const tick = async () => {
    const { date, hour } = easternNow();
    if (hour < SEND_HOUR) return;
    try {
      const result = await sendDailyPoem(date);
      if (/^sent /.test(result)) console.log(`Daily InfoPOEM ${date}: ${result}`);
      else if (/^failed /.test(result)) console.error(`Daily InfoPOEM ${date}: ${result}`); // carried on at the next check
    } catch (err) {
      console.error(`Daily InfoPOEM ${date} failed:`, err.message);
    }
  };
  setInterval(tick, 10 * 60 * 1000).unref();
  setTimeout(tick, 30 * 1000).unref();
}

module.exports = { assignDailyDate, assignMissingDailyDates, buildEmail, sendDailyPoem, startDailyPoemSchedule, weekdaysOf, easternNow, subscribers };

// ---------- Command line ----------
if (require.main === module) {
  require('dotenv').config({ path: require('path').join(__dirname, '.env') });
  const [cmd, ...rest] = process.argv.slice(2);
  const arg = rest.find(a => /^\d+$/.test(a));
  const given = rest.flatMap(a => a.split(',')).map(a => a.trim()).filter(a => a.includes('@'));
  const to = given.length ? given : [testAddress()];
  const pick = () => (arg
    ? db.prepare("SELECT * FROM poems WHERE poem_id = ? ORDER BY publication_date DESC LIMIT 1").get(Number(arg))
    : poemForDay(easternNow().date));
  (async () => {
    if (cmd === 'schedule') {
      const rows = db.prepare('SELECT daily_date, poem_id, title FROM poems WHERE daily_date IS NOT NULL ORDER BY daily_date').all();
      if (!rows.length) console.log('No Daily InfoPOEM days assigned yet.');
      for (const r of rows) console.log(`${r.daily_date}  ${(wasSent(r.daily_date) ? 'sent' : '').padEnd(5)}  #${r.poem_id}  ${r.title}`);
      console.log(`Subscribers: ${subscribers().length}`);
      console.log(`Sending: ${sendingOn() ? 'on' : 'off (set DAILY_POEM_SENDING=on to send)'}`);
      if (!postalAddress()) console.log('MAIL_POSTAL_ADDRESS is not set: the footer has no postal address.');
    } else if (cmd === 'send-test' || cmd === 'preview') {
      const row = pick();
      if (!row) { console.error(arg ? `No POEM number ${arg}.` : 'No POEM is assigned to today; give a POEM number.'); process.exit(1); }
      const email = buildEmail(row, row.daily_date || easternNow().date);
      if (cmd === 'preview') {
        require('fs').writeFileSync('daily-poem-preview.html', email.html);
        console.log(`Wrote daily-poem-preview.html (${email.subject})`);
      } else {
        for (const address of to) { // one email each, so no one sees the other addresses
          await sendMail({ to: address, subject: `[Test] ${email.subject}`, html: email.html, text: email.text, headers: unsubscribeHeaders(unsubscribeUrl(null)) });
          console.log(`Sent a test of "${row.title}" to ${address}`);
          if (to.length > 1) await sleep(600);
        }
      }
    } else {
      console.log('Usage: npm run daily-poem -- schedule | send-test [POEM number] [address ...] | preview [POEM number]');
    }
  })().catch(err => { console.error(err.message); process.exit(1); });
}
