// Cloudflare Turnstile, the "are you human" check on the sign-up form
// (https://developers.cloudflare.com/turnstile/). Set TURNSTILE_SITE_KEY and
// TURNSTILE_SECRET_KEY. Without them the check is skipped (local testing only;
// the server warns at startup in production).

const enabled = () => !!(process.env.TURNSTILE_SITE_KEY && process.env.TURNSTILE_SECRET_KEY);

async function verifyHuman(token, ip) {
  if (!enabled()) return true;
  if (!token) return false;
  try {
    const resp = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body: new URLSearchParams({ secret: process.env.TURNSTILE_SECRET_KEY, response: String(token), remoteip: ip || '' }),
      signal: AbortSignal.timeout(10000)
    });
    const data = await resp.json();
    return !!data.success;
  } catch (err) {
    console.error('Turnstile check failed', err.message);
    return false;
  }
}

module.exports = { verifyHuman, turnstileEnabled: enabled };
