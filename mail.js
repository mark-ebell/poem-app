// Sends the account emails (confirm address, reset password) through Resend
// (https://resend.com). Set RESEND_API_KEY and EMAIL_FROM, e.g.
// "InfoRetriever <no-reply@yourdomain.org>", with the domain verified in Resend.
// Without RESEND_API_KEY (local testing) the email is printed to the server log.

async function sendMail({ to, subject, text }) {
  if (!process.env.RESEND_API_KEY) {
    console.log(`\n--- Email not sent (RESEND_API_KEY is not set) ---\nTo: ${to}\nSubject: ${subject}\n\n${text}\n---\n`);
    return;
  }
  const resp = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: process.env.EMAIL_FROM, to: [to], subject, text }),
    signal: AbortSignal.timeout(15000)
  });
  if (!resp.ok) {
    const detail = await resp.text().catch(() => '');
    throw new Error(`Resend answered ${resp.status}: ${detail.slice(0, 200)}`);
  }
}

module.exports = { sendMail };
