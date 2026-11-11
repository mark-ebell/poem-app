// Administrator card in the Upload tab: the reader accounts, with requests for full access
// first. Approve gives full access (and emails the reader); Decline, or "POEMs only",
// leaves or puts them back on the POEMs only (routes/admin.js).
const $ = id => document.getElementById(id);
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const day = iso => (iso ? new Date(iso).toLocaleDateString([], { dateStyle: 'medium' }) : '');

let api, started = false, showAll = false;

export function loadReaderAdmin(apiFn) {
  api = apiFn;
  $('readerAdmin').classList.remove('hidden');
  if (!started) {
    started = true;
    $('readerAdmin').addEventListener('toggle', () => { if ($('readerAdmin').open) refresh(); });
    $('readerAdminBody').addEventListener('click', e => {
      const b = e.target.closest('button[data-access]');
      if (b) setAccess(b.dataset.email, b.dataset.access, b);
      if (e.target.closest('#readerAdminShowAll')) { showAll = !showAll; refresh(); }
    });
  }
  refresh();
}

async function refresh() {
  const body = $('readerAdminBody');
  try {
    const { readers, subscribers } = await api('/admin/readers');
    const pending = readers.filter(r => r.requestedAt);
    const full = readers.filter(r => r.access === 'full').length;
    const shown = showAll ? readers : pending;
    $('readerAdmin').querySelector('summary').textContent =
      `Administrator: reader accounts${pending.length ? ` (${pending.length} asking for full access)` : ''}`;
    body.innerHTML = `
      <p class="hint">${readers.length} reader account(s): ${full} with full access, ${readers.length - full} with the POEMs only.
        ${subscribers} receive the daily POEM. Readers sign up for the daily POEM at <b>${esc(location.origin)}/daily</b>
        and get the POEMs only; full access is given here (the reader is emailed when you approve).</p>
      ${shown.length ? `<div class="reader-admin-wrap"><table class="reader-admin-table">
        <thead><tr><th>Email</th><th>Access</th><th>Signed up</th><th>Last login</th><th></th></tr></thead>
        <tbody>${shown.map(row).join('')}</tbody></table></div>`
        : `<p>${showAll ? 'No reader accounts yet.' : 'No requests for full access are waiting.'}</p>`}
      <p><button type="button" class="link-btn" id="readerAdminShowAll">${showAll ? 'Show only the requests' : 'Show all readers'}</button></p>`;
  } catch (err) {
    body.innerHTML = `<p class="error-msg">Could not load the reader accounts: ${esc(err.message)}</p>`;
  }
}

function row(r) {
  const flags = [r.confirmed ? '' : 'email not confirmed', r.locked ? 'locked' : '', r.dailyEmail ? 'daily POEM' : ''].filter(Boolean).join(', ');
  const access = r.requestedAt
    ? `POEMs only; <b>asked for full access</b> ${esc(day(r.requestedAt))}${r.note ? `<div class="reader-admin-note">${esc(r.note)}</div>` : ''}`
    : (r.access === 'full' ? 'Full access' : 'POEMs only');
  const btn = (access, label, cls = '') => `<button type="button" class="small-btn ${cls}" data-email="${esc(r.email)}" data-access="${access}">${label}</button>`;
  const actions = r.requestedAt
    ? btn('full', 'Approve') + btn('poems', 'Decline', 'secondary')
    : (r.access === 'full' ? btn('poems', 'POEMs only', 'secondary') : btn('full', 'Give full access', 'secondary'));
  return `<tr class="${r.requestedAt ? 'reader-admin-pending' : ''}">
    <td>${esc(r.email)}${flags ? `<div class="hint">${esc(flags)}</div>` : ''}</td>
    <td>${access}</td><td>${esc(day(r.createdAt))}</td><td>${esc(day(r.lastLoginAt)) || 'never'}</td>
    <td class="actions">${actions}</td></tr>`;
}

async function setAccess(email, access, button) {
  const ask = access === 'full'
    ? `Give ${email} full access (chapters, risk scores and calculators)? They will be emailed.`
    : `Give ${email} the POEMs only? (No email is sent.)`;
  if (!window.confirm(ask)) return;
  button.disabled = true;
  try {
    await api('/admin/readers/access', { method: 'POST', body: { email, access } });
  } catch (err) {
    window.alert(err.message);
  }
  refresh();
}
