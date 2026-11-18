// inforetriever.org/poems: the waiting list for the daily POEM (routes/interest.js).
(() => {
  const $ = id => document.getElementById(id);
  const showError = msg => { $('interestError').textContent = msg; $('interestError').classList.remove('hidden'); };
  let widget = null;

  // The "are you human" check (Cloudflare Turnstile), when the server has keys for it.
  fetch('/api/config').then(r => r.json()).then(c => {
    if (!c.turnstileSiteKey) return;
    const s = document.createElement('script');
    s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
    s.async = true;
    s.onload = () => { widget = window.turnstile.render($('interestHuman'), { sitekey: c.turnstileSiteKey, action: 'interest' }); };
    s.onerror = () => showError('The "are you human" check could not be loaded. Please reload the page.');
    document.head.appendChild(s);
  }).catch(() => {});

  $('interestForm').addEventListener('submit', async e => {
    e.preventDefault();
    $('interestError').classList.add('hidden');
    const email = $('interestEmail').value.trim();
    if (!/^\S+@\S+\.\S{2,}$/.test(email)) return showError('Please enter a valid email address.');
    const turnstileToken = widget !== null ? window.turnstile.getResponse(widget) : undefined;
    if (widget !== null && !turnstileToken) return showError('Please complete the "are you human" check.');
    $('interestBtn').disabled = true;
    try {
      const resp = await fetch('/api/interest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, turnstileToken, website: $('interestWebsite').value })
      });
      const data = await resp.json().catch(() => ({}));
      if (!resp.ok) throw new Error(data.error || 'Something went wrong. Please try again.');
      $('interestForm').classList.add('hidden');
      $('interestDone').classList.remove('hidden');
    } catch (err) {
      showError(err.message);
      if (widget !== null) window.turnstile.reset(widget);
    } finally {
      $('interestBtn').disabled = false;
    }
  });
})();
