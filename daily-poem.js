// Daily InfoPOEM: one POEM emailed to subscribers each weekday.
//
// When a POEM becomes Published it is given a weekday in its publication month that no
// other POEM has (today or later, so it can still be sent), chosen at random; only the
// months in DAILY_POEM_MONTHS take part (for now October 2026). On that day, from
// SEND_HOUR US Eastern time, the server emails it to each edition's recipients and records
// the send, so a restart never sends a day twice. The editions are identical except for the
// logo at the top left: AAFP (to DAILY_POEM_RECIPIENTS) and Virtual Hallway (to
// DAILY_POEM_VH_RECIPIENTS).
//
// From the command line (on Render: the service's Shell tab):
//   npm run daily-poem -- schedule          the assigned days
//   npm run daily-poem -- send-test [num] [edition]   send now (today's POEM, or POEM number num;
//                                                     every edition, or just aafp or vh)
//   npm run daily-poem -- preview [num] [edition]     write each edition to daily-poem-preview[-vh].html
const crypto = require('crypto');
const db = require('./db');
const { sendMail } = require('./mail');
const { describePoem, runsToHtml, DISCLAIMER } = require('./export-poems');
const { escapeHtml } = require('./poem-model');

const TIME_ZONE = 'America/New_York';
const SEND_HOUR = 6;
const months = () => String(process.env.DAILY_POEM_MONTHS || '2026-10').split(',').map(m => m.trim()).filter(Boolean);
const list = (v, fallback) => String(v || fallback).split(',').map(r => r.trim()).filter(Boolean);
// The editions: the same email with a different logo, each to its own recipients.
const EDITIONS = [
  { key: 'aafp', name: 'AAFP', logo: 'aafp-logo.png', width: 146, height: 58, alt: 'AAFP',
    recipients: () => list(process.env.DAILY_POEM_RECIPIENTS, 'ebell@msu.edu') },
  { key: 'vh', name: 'Virtual Hallway', logo: 'virtual-hallway-logo.png', width: 220, height: 32, alt: 'Virtual Hallway',
    recipients: () => list(process.env.DAILY_POEM_VH_RECIPIENTS, 'ebell@msu.edu') }
];
const editionOf = key => EDITIONS.find(e => e.key === key) || EDITIONS[0];
const siteUrl = () => (process.env.APP_URL || 'https://inforetriever.org').replace(/\/+$/, '');

// ---------- Dates (US Eastern) ----------
function easternNow(now = new Date()) {
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-US', {
    timeZone: TIME_ZONE, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', hourCycle: 'h23'
  }).formatToParts(now).map(p => [p.type, p.value]));
  return { date: `${parts.year}-${parts.month}-${parts.day}`, hour: Number(parts.hour) };
}

// Monday to Friday of a month ('YYYY-MM') as 'YYYY-MM-DD'.
function weekdaysOf(month) {
  const [y, m] = month.split('-').map(Number);
  const out = [];
  for (let d = 1; d <= 31; d++) {
    const day = new Date(Date.UTC(y, m - 1, d));
    if (day.getUTCMonth() !== m - 1) break;
    const dow = day.getUTCDay();
    if (dow !== 0 && dow !== 6) out.push(day.toISOString().slice(0, 10));
  }
  return out;
}

// ---------- Assigning days ----------
// Gives a Published POEM its Daily InfoPOEM day, if its month takes part and it has none.
// Returns the day, or null.
function assignDailyDate(poemRecordId) {
  const row = db.prepare('SELECT id, status, publication_date, daily_date FROM poems WHERE id = ?').get(poemRecordId);
  if (!row || row.status !== 'Published' || row.daily_date || !months().includes(row.publication_date)) return null;
  const today = easternNow().date;
  const taken = new Set(db.prepare('SELECT daily_date FROM poems WHERE daily_date IS NOT NULL').all().map(r => r.daily_date));
  const free = weekdaysOf(row.publication_date).filter(d => d >= today && !taken.has(d));
  if (!free.length) {
    console.warn(`Daily InfoPOEM: no free weekday left in ${row.publication_date} for POEM ${row.id}.`);
    return null;
  }
  const day = free[crypto.randomInt(free.length)];
  db.prepare('UPDATE poems SET daily_date = ? WHERE id = ?').run(day, row.id);
  return day;
}

// Published POEMs in a taking-part month that have no day yet (run at startup), in random order.
function assignMissingDailyDates() {
  const list = months();
  if (!list.length) return 0;
  const rows = db.prepare(`SELECT id FROM poems WHERE status = 'Published' AND daily_date IS NULL
    AND publication_date IN (${list.map(() => '?').join(',')})`).all(...list);
  for (let i = rows.length - 1; i > 0; i--) { const j = crypto.randomInt(i + 1); [rows[i], rows[j]] = [rows[j], rows[i]]; }
  return rows.filter(r => assignDailyDate(r.id)).length;
}

// ---------- The email ----------
const FONT = "font-family: Arial, Helvetica, sans-serif;";
const longDate = d => new Date(`${d}T12:00:00Z`).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' });

function buildEmail(row, sendDate, edition = EDITIONS[0]) {
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
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${escapeHtml(`Daily InfoPOEM: ${poem.title}`)}</title></head>
<body style="margin: 0; padding: 0; background: #f5f6f8;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background: #f5f6f8;"><tr><td align="center" style="padding: 16px 8px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width: 640px; background: #ffffff; border: 1px solid #dcdfe4; border-radius: 8px;">
  <tr><td style="padding: 16px 20px 12px; border-bottom: 1px solid #dcdfe4;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
      <td align="left" valign="middle"><img src="${base}/email/${edition.logo}" width="${edition.width}" height="${edition.height}" alt="${edition.alt}" style="display: block; border: 0;"></td>
      <td align="right" valign="middle">
        <table role="presentation" cellpadding="0" cellspacing="0" align="right"><tr>
          <td valign="middle" style="${FONT} font-size: 12px; color: #6b7280; padding-right: 8px; text-align: right;">Powered by<br><a href="${base}/" style="color: #1f4b6e; font-weight: bold; font-size: 14px; text-decoration: none;">InfoRetriever</a></td>
          <td valign="middle"><img src="${base}/email/inforetriever.png" width="44" height="46" alt="InfoRetriever golden retriever" style="display: block; border: 0;"></td>
        </tr></table>
      </td>
    </tr></table>
  </td></tr>
  <tr><td style="padding: 18px 20px 6px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr><td style="${FONT} font-size: 12px; letter-spacing: 0.04em; text-transform: uppercase; color: #6b7280; padding-bottom: 6px;">Daily InfoPOEM &middot; ${escapeHtml(longDate(sendDate))}</td></tr>
      <tr><td style="${FONT} font-size: 21px; line-height: 1.3; font-weight: bold; color: #1f4b6e; padding-bottom: 14px;">${escapeHtml(poem.title)}</td></tr>
      ${sections}
    </table>
  </td></tr>
  <tr><td style="padding: 8px 20px 20px; border-top: 1px solid #dcdfe4;">
    <p style="${FONT} font-size: 12px; line-height: 1.5; color: #6b7280; font-style: italic; margin: 12px 0;">${escapeHtml(DISCLAIMER)}</p>
    <p style="${FONT} font-size: 13px; line-height: 1.5; color: #1b1f23; margin: 0;">Search more than 8,000 POEMs, textbook chapters and diagnostic calculators at <a href="${base}/" style="${link} font-weight: bold;">InfoRetriever.org</a>.</p>
  </td></tr>
</table>
</td></tr></table>
</body></html>`;

  const plain = p => p.map(runs => runs.map(r => (r.br ? ' ' : r.text)).join('')).join(' ');
  const text = [
    `Daily InfoPOEM, ${longDate(sendDate)}`,
    '',
    poem.title,
    '',
    ...poem.sections.map(sec => `${sec.label}: ${plain(sec.paragraphs)}`),
    '',
    DISCLAIMER,
    '',
    `More POEMs at ${base}/`
  ].filter((l, i, a) => !(l === '' && a[i - 1] === '')).join('\n');

  return { subject: `Daily InfoPOEM: ${poem.title}`, html, text };
}

// ---------- Sending ----------
function poemForDay(date) {
  return db.prepare("SELECT * FROM poems WHERE daily_date = ? AND status = 'Published' LIMIT 1").get(date);
}

// Whether an edition has been sent on a day, and recording a send (the AAFP edition keeps
// its original table, daily_sends; the others use daily_edition_sends).
function wasSent(edition, date) {
  return edition.key === 'aafp'
    ? !!db.prepare('SELECT 1 FROM daily_sends WHERE send_date = ?').get(date)
    : !!db.prepare('SELECT 1 FROM daily_edition_sends WHERE edition = ? AND send_date = ?').get(edition.key, date);
}
function recordSend(edition, date, poemId, to) {
  const at = new Date().toISOString();
  if (edition.key === 'aafp') db.prepare('INSERT INTO daily_sends (send_date, poem_id, recipients, sent_at) VALUES (?, ?, ?, ?)').run(date, poemId, to.join(', '), at);
  else db.prepare('INSERT INTO daily_edition_sends (edition, send_date, poem_id, recipients, sent_at) VALUES (?, ?, ?, ?, ?)').run(edition.key, date, poemId, to.join(', '), at);
}

// Sends the day's POEM in one edition unless it has been sent already. Returns what happened.
async function sendEdition(edition, row, date) {
  if (wasSent(edition, date)) return `${edition.name}: already sent`;
  const to = edition.recipients();
  if (!to.length) return `${edition.name}: no recipients`;
  const { subject, html, text } = buildEmail(row, date, edition);
  await sendMail({ to, subject, html, text });
  recordSend(edition, date, row.id, to);
  return `${edition.name}: sent "${row.title}" to ${to.join(', ')}`;
}

// Sends the day's POEM in every edition. An edition that fails is tried again at the next
// check without resending the others. Returns what happened, one line per edition.
async function sendDailyPoem(date) {
  const row = poemForDay(date);
  if (!row) return ['no POEM for this day'];
  const results = [];
  for (const edition of EDITIONS) {
    try { results.push(await sendEdition(edition, row, date)); }
    catch (err) { results.push(`${edition.name}: failed (${err.message})`); }
  }
  return results;
}

// Checks every 10 minutes: from SEND_HOUR Eastern, today's POEM goes out once.
function startDailyPoemSchedule() {
  const tick = async () => {
    const { date, hour } = easternNow();
    if (hour < SEND_HOUR) return;
    try {
      for (const result of await sendDailyPoem(date)) {
        if (/: sent /.test(result)) console.log(`Daily InfoPOEM ${date}: ${result}`);
        else if (/: failed /.test(result)) console.error(`Daily InfoPOEM ${date}: ${result}`); // tried again at the next check
      }
    } catch (err) {
      console.error(`Daily InfoPOEM ${date} failed:`, err.message);
    }
  };
  setInterval(tick, 10 * 60 * 1000).unref();
  setTimeout(tick, 30 * 1000).unref();
}

module.exports = { assignDailyDate, assignMissingDailyDates, buildEmail, sendDailyPoem, startDailyPoemSchedule, weekdaysOf, easternNow, EDITIONS };

// ---------- Command line ----------
if (require.main === module) {
  require('dotenv').config({ path: require('path').join(__dirname, '.env') });
  const [cmd, ...rest] = process.argv.slice(2);
  const arg = rest.find(a => /^\d+$/.test(a));
  const only = rest.find(a => EDITIONS.some(e => e.key === a));
  const editions = only ? [editionOf(only)] : EDITIONS;
  const pick = () => (arg
    ? db.prepare("SELECT * FROM poems WHERE poem_id = ? ORDER BY publication_date DESC LIMIT 1").get(Number(arg))
    : poemForDay(easternNow().date));
  (async () => {
    if (cmd === 'schedule') {
      const rows = db.prepare('SELECT daily_date, poem_id, title FROM poems WHERE daily_date IS NOT NULL ORDER BY daily_date').all();
      if (!rows.length) console.log('No Daily InfoPOEM days assigned yet.');
      for (const r of rows) {
        const sent = EDITIONS.filter(e => wasSent(e, r.daily_date)).map(e => e.key).join('+');
        console.log(`${r.daily_date}  ${(sent ? `sent ${sent}` : '').padEnd(12)}  #${r.poem_id}  ${r.title}`);
      }
      for (const e of EDITIONS) console.log(`${e.name} recipients: ${e.recipients().join(', ')}`);
      console.log(`Months taking part: ${months().join(', ')}`);
    } else if (cmd === 'send-test' || cmd === 'preview') {
      const row = pick();
      if (!row) { console.error(arg ? `No POEM number ${arg}.` : 'No POEM is assigned to today; give a POEM number.'); process.exit(1); }
      for (const edition of editions) {
        const email = buildEmail(row, row.daily_date || easternNow().date, edition);
        if (cmd === 'preview') {
          const file = edition.key === 'aafp' ? 'daily-poem-preview.html' : `daily-poem-preview-${edition.key}.html`;
          require('fs').writeFileSync(file, email.html);
          console.log(`Wrote ${file} (${edition.name}: ${email.subject})`);
        } else {
          await sendMail({ to: edition.recipients(), subject: `[Test] ${email.subject}`, html: email.html, text: email.text });
          console.log(`Sent a test of "${row.title}" (${edition.name}) to ${edition.recipients().join(', ')}`);
        }
      }
    } else {
      console.log('Usage: npm run daily-poem -- schedule | send-test [POEM number] [aafp|vh] | preview [POEM number] [aafp|vh]');
    }
  })().catch(err => { console.error(err.message); process.exit(1); });
}
