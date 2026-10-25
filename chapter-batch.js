// Monthly chapter updates, sent to Claude as one batch (Anthropic's Message Batches API:
// half the price of single requests; results usually within an hour, at most 24 hours).
//
// A month's run takes the chapters planned for that month (chapter_plan) that have no
// review in progress and have not been in that month's run already. For each it gathers
// the evidence and builds the request exactly as a single update does (chapter-update.js),
// then submits them together. Every 10 minutes the server checks submitted batches; when
// one has ended, each chapter's answer becomes its review in progress (tracked changes),
// and the editors are emailed the chapters waiting for them.
//
// The run starts by itself at the start of each month (from 2 a.m. US Eastern) only when
// CHAPTER_BATCH_AUTO=on; otherwise an editor starts it from the Edit Chapter tab or with
//   npm run chapter-batch -- start [YYYY-MM]
//   npm run chapter-batch -- status
//   npm run chapter-batch -- check            (collect results of ended batches now)
//
// Emails: CHAPTER_EDITOR_EMAILS maps editors to addresses ("ebell=ebell@msu.edu,barry=...");
// CHAPTER_UPDATE_NOTIFY (default ebell@msu.edu) gets the whole month's list.
const Anthropic = require('@anthropic-ai/sdk');
const db = require('./db');
const store = require('./chapter-store');
const { plans, editors, MONTHS } = require('./chapter-plan');
const { prepareUpdate, finishUpdate, readAnswer } = require('./chapter-update');
const { sendMail } = require('./mail');
const { easternNow } = require('./daily-poem');
const { escapeHtml } = require('./poem-model');

const MAX_PER_BATCH = () => Number(process.env.CHAPTER_BATCH_MAX) || 60;
const siteUrl = () => (process.env.APP_URL || 'https://inforetriever.org').replace(/\/+$/, '');
const thisMonth = () => easternNow().date.slice(0, 7);
const monthName = ym => `${MONTHS[Number(ym.slice(5, 7)) - 1]} ${ym.slice(0, 4)}`;

// ---------- Which chapters ----------
// The chapters due in a month ('YYYY-MM') that a run would include now, and those it would skip (with why).
function dueChapters(ym) {
  const m = Number(ym.slice(5, 7));
  const drafts = new Map(db.prepare('SELECT chapter_id, job_status, state IS NOT NULL AS has_state FROM chapter_drafts').all().map(r => [r.chapter_id, r]));
  const inRun = new Set(db.prepare(`SELECT i.chapter_id FROM chapter_batch_items i JOIN chapter_batches b ON b.id = i.batch
    WHERE b.month = ? AND i.status != 'failed'`).all(ym).map(r => r.chapter_id));
  const include = [], skip = [];
  for (const [id, p] of plans()) {
    if (p.month !== m || !store.known(id)) continue;
    const d = drafts.get(id);
    if (inRun.has(id)) skip.push({ id, why: 'already in this month\'s run' });
    else if (d && (d.job_status === 'running' || d.job_status === 'queued')) skip.push({ id, why: 'an update is running' });
    else if (d && d.has_state) skip.push({ id, why: 'a review is in progress' });
    else include.push(id);
  }
  return { include, skip };
}

const activeBatch = ym => db.prepare("SELECT * FROM chapter_batches WHERE month = ? AND status IN ('gathering', 'submitted')").get(ym);

// ---------- Starting a run ----------
// Gathers the evidence and submits the batch, in the background. Returns { batch, chapters }.
function startBatch(ym, user) {
  if (!/^\d{4}-\d{2}$/.test(ym)) throw new Error('The month should be written YYYY-MM.');
  if (!process.env.ANTHROPIC_API_KEY) throw new Error('The server has no Anthropic API key (ANTHROPIC_API_KEY).');
  if (activeBatch(ym)) throw new Error(`The ${monthName(ym)} updates are already under way.`);
  const ids = dueChapters(ym).include.slice(0, MAX_PER_BATCH());
  if (!ids.length) throw new Error(`No chapters are waiting for a ${monthName(ym)} update.`);
  const now = new Date().toISOString();
  const batch = db.prepare("INSERT INTO chapter_batches (month, status, message, created_by, created_at) VALUES (?, 'gathering', ?, ?, ?)")
    .run(ym, `Gathering evidence for ${ids.length} chapter${ids.length === 1 ? '' : 's'}…`, user, now).lastInsertRowid;
  const addItem = db.prepare("INSERT INTO chapter_batch_items (batch, chapter_id, status) VALUES (?, ?, 'gathering')");
  for (const id of ids) {
    addItem.run(batch, id);
    store.setJob(id, 'queued', `Monthly update (${monthName(ym)}): waiting to gather evidence…`, user);
  }
  gatherAndSubmit(batch, ids, ym, user).catch(err => console.error(`Chapter batch ${batch} failed`, err));
  return { batch, chapters: ids.length };
}

async function gatherAndSubmit(batch, ids, ym, user) {
  const setItem = db.prepare('UPDATE chapter_batch_items SET status = ?, message = ?, prepared = ? WHERE batch = ? AND chapter_id = ?');
  const requests = [];
  for (const id of ids) {
    try {
      const prepared = await prepareUpdate(id, msg => store.setJob(id, 'queued', `Monthly update: ${msg}`, user));
      const { params, ...keep } = prepared;
      setItem.run('queued', null, JSON.stringify(keep), batch, id);
      requests.push({ custom_id: id, params });
      store.setJob(id, 'queued', `Monthly update (${monthName(ym)}): waiting for Claude; results usually come within an hour, at most a day.`, user);
    } catch (err) {
      setItem.run('failed', err.message, null, batch, id);
      store.setJob(id, 'failed', `Monthly update: ${err.message}`, user);
    }
  }
  const setBatch = db.prepare('UPDATE chapter_batches SET status = ?, message = ?, batch_id = COALESCE(?, batch_id), ended_at = ? WHERE id = ?');
  if (!requests.length) {
    setBatch.run('failed', 'No chapter could be prepared.', null, new Date().toISOString(), batch);
    return;
  }
  try {
    const created = await new Anthropic().messages.batches.create({ requests });
    setBatch.run('submitted', `${requests.length} chapter${requests.length === 1 ? '' : 's'} with Claude.`, created.id, null, batch);
    console.log(`Chapter batch ${batch} (${ym}): submitted ${requests.length} chapters as ${created.id}`);
  } catch (err) {
    const msg = err instanceof Anthropic.APIError ? `Claude could not be reached (${err.status || 'network error'}).` : err.message;
    setBatch.run('failed', msg, null, new Date().toISOString(), batch);
    db.prepare("UPDATE chapter_batch_items SET status = 'failed', message = ?, prepared = NULL WHERE batch = ? AND status = 'queued'").run(msg, batch);
    for (const r of requests) store.setJob(r.custom_id, 'failed', `Monthly update: ${msg} Run Update with Claude to try again.`, user);
  }
}

// ---------- Collecting results ----------
// Checks submitted batches; applies the answers of any that have ended. Returns what happened.
async function checkBatches() {
  const out = [];
  for (const b of db.prepare("SELECT * FROM chapter_batches WHERE status = 'submitted'").all()) {
    const client = new Anthropic();
    const info = await client.messages.batches.retrieve(b.batch_id);
    if (info.processing_status !== 'ended') { out.push(`${b.month}: still with Claude`); continue; }
    await collect(b, client);
    out.push(`${b.month}: collected`);
  }
  return out;
}

async function collect(b, client) {
  const items = new Map(db.prepare('SELECT * FROM chapter_batch_items WHERE batch = ?').all(b.id).map(i => [i.chapter_id, i]));
  const setItem = db.prepare('UPDATE chapter_batch_items SET status = ?, message = ?, prepared = NULL, input_tokens = ?, output_tokens = ? WHERE batch = ? AND chapter_id = ?');
  const user = b.created_by || 'Monthly update';
  for await (const r of await client.messages.batches.results(b.batch_id)) {
    const item = items.get(r.custom_id);
    if (!item || item.status !== 'queued') continue; // unknown, or applied before a restart
    const id = r.custom_id;
    let status = 'failed', message, usage = {};
    try {
      if (r.result.type !== 'succeeded') {
        throw new Error(r.result.type === 'expired' ? 'Claude did not get to this chapter within a day.' : 'Claude could not process this chapter.');
      }
      usage = r.result.message.usage || {};
      const result = readAnswer(r.result.message);
      const draft = store.getDraft(id);
      if (draft && draft.state) throw new Error('A review of this chapter was started while Claude was working; Claude\'s suggestions were not added to it.');
      message = finishUpdate(id, JSON.parse(item.prepared), result, r.result.message.model, user, 'monthly batch');
      status = 'done';
    } catch (err) {
      message = err.message;
      store.setJob(id, 'failed', `Monthly update: ${message} Run Update with Claude to try again.`, user);
    }
    setItem.run(status, message, usage.input_tokens || null, usage.output_tokens || null, b.id, id);
  }
  // Any chapter without an answer.
  for (const item of db.prepare("SELECT chapter_id FROM chapter_batch_items WHERE batch = ? AND status = 'queued'").all(b.id)) {
    setItem.run('failed', 'No answer came back for this chapter.', null, null, b.id, item.chapter_id);
    store.setJob(item.chapter_id, 'failed', 'Monthly update: no answer came back. Run Update with Claude to try again.', user);
  }
  const counts = db.prepare('SELECT status, COUNT(*) AS n FROM chapter_batch_items WHERE batch = ? GROUP BY status').all(b.id);
  const done = (counts.find(c => c.status === 'done') || {}).n || 0;
  const failed = (counts.find(c => c.status === 'failed') || {}).n || 0;
  db.prepare("UPDATE chapter_batches SET status = 'collected', message = ?, ended_at = ? WHERE id = ?")
    .run(`${done} chapter${done === 1 ? '' : 's'} ready for review${failed ? `, ${failed} failed` : ''}.`, new Date().toISOString(), b.id);
  console.log(`Chapter batch ${b.id} (${b.month}): ${done} ready, ${failed} failed`);
  try {
    await notifyEditors(b.id, b.month);
  } catch (err) {
    console.error(`Chapter batch ${b.id}: emails not sent:`, err.message);
  }
}

// ---------- Emails ----------
function editorEmails() {
  const map = new Map();
  for (const pair of String(process.env.CHAPTER_EDITOR_EMAILS || '').split(',')) {
    const [u, e] = pair.split('=').map(s => (s || '').trim());
    if (u && e) map.set(u.toLowerCase(), e);
  }
  return map;
}

async function notifyEditors(batch, ym) {
  const items = db.prepare('SELECT chapter_id, status, message FROM chapter_batch_items WHERE batch = ?').all(batch);
  const titles = new Map(store.chapterIndex().map(c => [c.id, c.title]));
  const plan = plans();
  const names = new Map(editors().map(e => [e.username, e.name]));
  const row = i => ({ title: titles.get(i.chapter_id) || i.chapter_id, editor: (plan.get(i.chapter_id) || {}).editor || null, ...i });
  const rows = items.map(row).sort((a, b) => a.title.localeCompare(b.title));
  const email = (to, list, everyone) => {
    const lines = list.map(r => `${r.title}${everyone ? ` (${r.editor ? names.get(r.editor) || r.editor : 'no editor assigned'})` : ''}: ${r.status === 'done' ? r.message : `not updated: ${r.message}`}`);
    const subject = `Chapter updates ready for review: ${list.filter(r => r.status === 'done').length} (${monthName(ym)})`;
    const intro = everyone ? `Claude's ${monthName(ym)} chapter updates have finished.` : `Claude's ${monthName(ym)} updates of your chapters are ready for review.`;
    const outro = `Open InfoRetriever (${siteUrl()}), choose the Edit Chapter tab and then the chapter to review its tracked changes.`;
    const html = `<p>${escapeHtml(intro)}</p><ul>${lines.map(l => `<li>${escapeHtml(l)}</li>`).join('')}</ul><p>${escapeHtml(outro)}</p>`;
    return sendMail({ to, subject, text: `${intro}\n\n${lines.map(l => `- ${l}`).join('\n')}\n\n${outro}`, html });
  };
  const byEditor = new Map();
  for (const r of rows) if (r.editor) (byEditor.get(r.editor) || byEditor.set(r.editor, []).get(r.editor)).push(r);
  const addresses = editorEmails();
  for (const [ed, list] of byEditor) if (addresses.has(ed.toLowerCase())) await email(addresses.get(ed.toLowerCase()), list, false);
  const notify = String(process.env.CHAPTER_UPDATE_NOTIFY || 'ebell@msu.edu').split(',').map(s => s.trim()).filter(Boolean);
  if (notify.length) await email(notify, rows, true);
}

// ---------- Status ----------
function batchStatus(limit = 6) {
  const ym = thisMonth();
  const { include, skip } = dueChapters(ym);
  const batches = db.prepare('SELECT * FROM chapter_batches ORDER BY id DESC LIMIT ?').all(limit).map(b => {
    const items = db.prepare('SELECT status, COUNT(*) AS n, SUM(input_tokens) AS tin, SUM(output_tokens) AS tout FROM chapter_batch_items WHERE batch = ? GROUP BY status').all(b.id);
    const tokens = items.reduce((t, i) => ({ input: t.input + (i.tin || 0), output: t.output + (i.tout || 0) }), { input: 0, output: 0 });
    return { id: b.id, month: b.month, monthName: monthName(b.month), status: b.status, message: b.message, createdBy: b.created_by, createdAt: b.created_at, endedAt: b.ended_at,
      counts: Object.fromEntries(items.map(i => [i.status, i.n])), tokens };
  });
  return { month: ym, monthName: monthName(ym), due: include.length, skipped: skip.length, auto: process.env.CHAPTER_BATCH_AUTO === 'on', active: !!activeBatch(ym), batches };
}

// ---------- Schedule ----------
// Every 10 minutes: collect ended batches; with CHAPTER_BATCH_AUTO=on, start the month's run
// once (from 2 a.m. Eastern), unless that month already has one.
function startChapterBatchSchedule() {
  const tick = async () => {
    try {
      await checkBatches();
    } catch (err) {
      console.error('Chapter batches: check failed:', err.message); // tried again next time
    }
    if (process.env.CHAPTER_BATCH_AUTO !== 'on' || easternNow().hour < 2) return;
    const ym = thisMonth();
    if (db.prepare('SELECT 1 FROM chapter_batches WHERE month = ?').get(ym)) return;
    try {
      const { chapters } = startBatch(ym, 'Monthly update');
      console.log(`Chapter batch for ${ym} started automatically: ${chapters} chapters`);
    } catch (err) {
      // Record the month as handled, so an empty or impossible month is not retried every 10 minutes.
      db.prepare("INSERT INTO chapter_batches (month, status, message, created_by, created_at) VALUES (?, 'failed', ?, 'Monthly update', ?)")
        .run(ym, err.message, new Date().toISOString());
    }
  };
  setInterval(tick, 10 * 60 * 1000).unref();
  setTimeout(tick, 60 * 1000).unref();
}

module.exports = { startBatch, checkBatches, batchStatus, dueChapters, startChapterBatchSchedule, thisMonth, monthName };

// ---------- Command line ----------
if (require.main === module) {
  require('dotenv').config({ path: require('path').join(__dirname, '.env') });
  const [cmd, arg] = process.argv.slice(2);
  (async () => {
    if (cmd === 'status') {
      console.log(JSON.stringify(batchStatus(12), null, 2));
    } else if (cmd === 'start') {
      const r = startBatch(arg || thisMonth(), 'command line');
      console.log(`Gathering evidence for ${r.chapters} chapters, then submitting (keep this running until it says submitted)…`);
      for (;;) {
        await new Promise(res => setTimeout(res, 5000));
        const b = db.prepare('SELECT status, message FROM chapter_batches WHERE id = ?').get(r.batch);
        if (b.status !== 'gathering') { console.log(`${b.status}: ${b.message}`); break; }
      }
    } else if (cmd === 'check') {
      console.log((await checkBatches()).join('\n') || 'No batches are with Claude.');
    } else {
      console.log('Usage: npm run chapter-batch -- status | start [YYYY-MM] | check');
    }
  })().catch(err => { console.error(err.message); process.exitCode = 1; });
}
