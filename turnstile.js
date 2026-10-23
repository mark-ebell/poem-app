// Cloudflare Turnstile, the "are you human" check on the sign-up form
// (https://developers.cloudflare.com/turnstile/). Set TURNSTILE_SITE_KEY and
// TURNSTILE_SECRET_KEY. Without them the check is skipped (local testing only;
// the server warns at startup in production).
//
// A token is accepted only if Cloudflare confirms it, it was issued for this form
// (the widget's action), and on this site: the hostnames in TURNSTILE_HOSTNAMES
// (comma-separated), or else the one in APP_URL. Tokens are single-use, so a copied
// token cannot be replayed. Cloudflare's public testing keys (for local testing)
// report no action and a placeholder hostname, so those two checks are skipped for them.

const MAX_TOKEN_LENGTH = 2048;

const enabled = () => !!(process.env.TURNSTILE_SITE_KEY && process.env.TURNSTILE_SECRET_KEY);

function allowedHostnames() {
  const listed = String(process.env.TURNSTILE_HOSTNAMES || '').split(',').map(h => h.trim().toLowerCase()).filter(Boolean);
  if (listed.length) return listed;
  try { return process.env.APP_URL ? [new URL(process.env.APP_URL).hostname.toLowerCase()] : []; } catch { return []; }
}

async function verifyHuman(token, ip, action) {
  if (!enabled()) return true;
  if (typeof token !== 'string' || !token || token.length > MAX_TOKEN_LENGTH) return false;
  try {
    const resp = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body: new URLSearchParams({ secret: process.env.TURNSTILE_SECRET_KEY, response: token, remoteip: ip || '' }),
      signal: AbortSignal.timeout(10000)
    });
    const data = await resp.json();
    if (!data.success) {
      console.warn('Turnstile rejected a sign-up:', (data['error-codes'] || []).join(', ') || 'no reason given');
      return false;
    }
    if (data.metadata && data.metadata.result_with_testing_key) return true;
    if (action && data.action !== action) {
      console.warn(`Turnstile token was for "${data.action}", not "${action}".`);
      return false;
    }
    const hosts = allowedHostnames();
    if (hosts.length && !hosts.includes(String(data.hostname || '').toLowerCase())) {
      console.warn(`Turnstile token came from an unexpected site: ${data.hostname}`);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Turnstile check failed', err.message);
    return false;
  }
}

module.exports = { verifyHuman, turnstileEnabled: enabled };
