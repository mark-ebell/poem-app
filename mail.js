// Sends the emails (confirm address, reset password, the Daily InfoPOEM) through Resend
// (https://resend.com). Set RESEND_API_KEY and EMAIL_FROM, e.g.
// "InfoRetriever <no-reply@yourdomain.org>", with the domain verified in Resend.
// Without RESEND_API_KEY (local testing) the email is printed to the server log.

// to: one address or a list; html is optional (text is the plain-text version).
async function sendMail({ to, subject, text, html, headers }) {
  const recipients = Array.isArray(to) ? to : [to];
  if (!process.env.RESEND_API_KEY) {
    console.log(`\n--- Email not sent (RESEND_API_KEY is not set) ---\nTo: ${recipients.join(', ')}\nSubject: ${subject}\n\n${text}\n---\n`);
    return;
  }
  const resp = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: process.env.EMAIL_FROM, to: recipients, subject, text, ...(html ? { html } : {}), ...(headers ? { headers } : {}) }),
    signal: AbortSignal.timeout(15000)
  });
  if (!resp.ok) {
    const detail = await resp.text().catch(() => '');
    throw new Error(`Resend answered ${resp.status}: ${detail.slice(0, 200)}`);
  }
}

// Many emails in one request (Resend's batch endpoint takes up to 100), each its own
// message: [{ to, subject, text, html, headers }]. idempotencyKey makes Resend ignore a
// repeat of the same request within 24 hours (a retry after a crash part way through).
const BATCH_SIZE = 100;
async function sendBatch(emails, { idempotencyKey } = {}) {
  if (!emails.length) return;
  if (emails.length > BATCH_SIZE) throw new Error(`At most ${BATCH_SIZE} emails in one batch.`);
  if (!process.env.RESEND_API_KEY) {
    console.log(`\n--- ${emails.length} email(s) not sent (RESEND_API_KEY is not set) ---\nSubject: ${emails[0].subject}\nTo: ${emails.map(e => e.to).join(', ')}\n---\n`);
    return;
  }
  const resp = await fetch('https://api.resend.com/emails/batch', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json',
      ...(idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : {})
    },
    body: JSON.stringify(emails.map(e => ({ from: process.env.EMAIL_FROM, to: [e.to], subject: e.subject, text: e.text,
      ...(e.html ? { html: e.html } : {}), ...(e.headers ? { headers: e.headers } : {}) }))),
    signal: AbortSignal.timeout(30000)
  });
  if (!resp.ok) {
    const detail = await resp.text().catch(() => '');
    throw new Error(`Resend answered ${resp.status}: ${detail.slice(0, 200)}`);
  }
}

module.exports = { sendMail, sendBatch, BATCH_SIZE };
