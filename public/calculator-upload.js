// Administrator card in the Upload tab: upload the Diagnostic App spreadsheets, check
// what would change, publish, or go back to an earlier version (routes/admin.js).
const $ = id => document.getElementById(id);
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const when = iso => iso ? new Date(iso).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : '';

let api, showLogin, started = false;

export function loadCalculatorUpload(apiFn, loginFn) {
  api = apiFn; showLogin = loginFn;
  $('calcUpload').classList.remove('hidden');
  if (!started) {
    started = true;
    const files = () => $('calcFileCalc').files.length + $('calcFileDdx').files.length;
    for (const id of ['calcFileCalc', 'calcFileDdx']) {
      $(id).addEventListener('change', () => {
        $('calcCheckBtn').disabled = !files();
        $('calcPublishBtn').classList.add('hidden');
        $('calcReport').textContent = '';
        $('calcStatus').textContent = '';
      });
    }
    $('calcCheckBtn').addEventListener('click', check);
    $('calcPublishBtn').addEventListener('click', publish);
    $('calcUsing').addEventListener('click', e => {
      const b = e.target.closest('button[data-restore]');
      if (b) restore(b.dataset.restore, b.dataset.label);
    });
  }
  showStatus();
}

async function upload(which, file) {
  const resp = await fetch(`/api/admin/calculator/file?which=${which}&name=${encodeURIComponent(file.name)}`, {
    method: 'POST', headers: { 'Content-Type': 'application/octet-stream' }, body: file
  });
  if (resp.status === 401) { showLogin(); throw new Error('Not logged in.'); }
  const data = await resp.json().catch(() => ({}));
  if (!resp.ok) throw new Error(data.error || `Upload failed (${resp.status}).`);
}

async function check() {
  const btn = $('calcCheckBtn');
  btn.disabled = true;
  $('calcPublishBtn').classList.add('hidden');
  $('calcReport').textContent = '';
  $('calcStatus').textContent = 'Uploading and reading the spreadsheets...';
  try {
    await api('/admin/calculator/discard', { method: 'POST', body: {} });
    if ($('calcFileCalc').files[0]) await upload('calc', $('calcFileCalc').files[0]);
    if ($('calcFileDdx').files[0]) await upload('ddx', $('calcFileDdx').files[0]);
    const r = await api('/admin/calculator/check', { method: 'POST', body: {} });
    renderReport(r);
    $('calcStatus').textContent = r.canPublish
      ? 'Checked. Look over the changes, then publish.'
      : 'There are errors to fix in the spreadsheet before it can be published.';
    $('calcPublishBtn').classList.toggle('hidden', !r.canPublish);
  } catch (err) {
    $('calcStatus').textContent = `Error: ${err.message}`;
  } finally {
    btn.disabled = false;
  }
}

function list(title, items, open, cls = '') {
  if (!items || !items.length) return '';
  return `<details class="calc-list ${cls}"${open ? ' open' : ''}><summary>${esc(title)} (${items.length})</summary><ul>${items.map(i => `<li>${esc(i)}</li>`).join('')}</ul></details>`;
}

function renderReport({ report, changes }) {
  const parts = [];
  parts.push(list('Errors', report.errors, true, 'calc-errors'));
  const rows = changes.map(c => `<tr><td>${esc(c.label)}</td><td>${c.before}</td><td>${c.after}</td><td>${c.added}</td><td>${c.removed}</td><td>${c.changed}</td></tr>`).join('');
  parts.push(`<table class="calc-changes"><thead><tr><th></th><th>Now</th><th>After</th><th>Added</th><th>Removed</th><th>Changed</th></tr></thead><tbody>${rows}</tbody></table>`);
  for (const c of changes) {
    for (const k of ['added', 'removed', 'changed']) {
      const ex = c.examples[k];
      if (c[k]) parts.push(list(`${c.label}: ${k}${c[k] > ex.length ? ` (first ${ex.length} of ${c[k]} shown)` : ''}`, ex, false));
    }
  }
  const warnings = [...report.warnings, ...Object.entries(report.panelWarnings || {}).flatMap(([panel, ws]) => ws.map(w => `${panel}: ${w}`))];
  parts.push(list('Warnings (worth a look; they do not stop publishing)', warnings, false, 'calc-warnings'));
  parts.push(list('Notes', report.notes, false));
  $('calcReport').innerHTML = parts.join('');
}

async function publish() {
  if (!confirm('Publish this calculator data? It is used everywhere on the site straight away.')) return;
  $('calcPublishBtn').disabled = true;
  try {
    await api('/admin/calculator/publish', { method: 'POST', body: {} });
    $('calcStatus').textContent = 'Published. Reload the page to see the new data in the calculator tabs.';
    $('calcPublishBtn').classList.add('hidden');
    $('calcFileCalc').value = ''; $('calcFileDdx').value = '';
    $('calcCheckBtn').disabled = true;
    showStatus();
  } catch (err) {
    $('calcStatus').textContent = `Error: ${err.message}`;
  } finally {
    $('calcPublishBtn').disabled = false;
  }
}

async function restore(name, label) {
  if (!confirm(`Use ${label} for the calculators?`)) return;
  try {
    await api('/admin/calculator/restore', { method: 'POST', body: { name } });
    $('calcStatus').textContent = `Now using ${label}. Reload the page to see it in the calculator tabs.`;
    showStatus();
  } catch (err) {
    $('calcStatus').textContent = `Error: ${err.message}`;
  }
}

async function showStatus() {
  let s;
  try { s = await api('/admin/calculator'); } catch (err) { $('calcUsing').textContent = `Error: ${err.message}`; return; }
  const u = s.using;
  const now = u.source === 'upload'
    ? `the spreadsheets uploaded ${when(u.at)}${u.by ? ' by ' + esc(u.by) : ''}${u.files && u.files.length ? ' (' + u.files.map(esc).join(', ') + ')' : ''}`
    : 'the calculator-data.json file in the code';
  const counts = Object.entries(s.counts).map(([k, v]) => `${esc(k)}: ${v}`).join(' · ');
  const hist = s.history.map(h => {
    const label = `the upload of ${when(h.at)}`;
    const current = u.source === 'upload' && h.at === u.at;
    return `<li>${esc(when(h.at))}${h.by ? ' by ' + esc(h.by) : ''}${h.files && h.files.length ? ' — ' + h.files.map(esc).join(', ') : ''} ${current ? '<em>(in use)</em>' : `<button type="button" class="link-btn" data-restore="${esc(h.name)}" data-label="${esc(label)}">Use this</button>`}</li>`;
  }).join('');
  $('calcUsing').innerHTML = `<p><strong>Now using</strong> ${now}. ${counts}.</p>` +
    (u.source === 'upload' ? `<p><button type="button" class="link-btn" data-restore="code" data-label="the file in the code">Go back to the file in the code</button></p>` : '') +
    (hist ? `<details class="calc-list"><summary>Earlier uploads (${s.history.length})</summary><ul>${hist}</ul></details>` : '');
}
