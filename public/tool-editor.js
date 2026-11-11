// The risk score editor (Risk Scores tab, editors only).
//
// A point score (the total of the points of the chosen options and checked items, read
// through result bands) can be edited in full, or added from scratch: its items, their
// points, the bands (what each range of totals means), an optional table of the risk
// groups, and "About this score". A score with formulas can have only its words edited.
// Changes are saved as a draft, which editors try out in the Risk Scores tab exactly as
// readers will see it, then publish. See decision-tools/editable.js.

const $ = id => document.getElementById(id);
const LEVELS = [['', 'No colour'], ['1', 'Low (green)'], ['2', 'Moderate (yellow)'], ['3', 'Moderately high (orange)'], ['4', 'High (red)']];
const ITEM_TYPES = [['choice', 'Choice (pick one)'], ['check', 'Checkbox'], ['heading', 'Heading'], ['text', 'Text']];
const EVIDENCE = [
  ['reference', 'Reference', 'text'], ['pmid', 'PMID', 'text'], ['population', 'Population', 'area'], ['validation', 'Validation', 'area'],
  ['prevalence', 'Prevalence of the outcome (%)', 'number'], ['developed', 'Patients used to develop the rule', 'number'],
  ['validated', 'Patients used to validate it', 'number'], ['comment', 'Comment', 'area']
];
let api = null;
let spec = null;   // the spec being edited (decision-tools/editable.js)
let info = null;   // { source, reason, isCode, hasDraft, hasPublished, canPoints, history, categories }
let onDone = null; // called with the tool id after saving, publishing or reverting
let dirty = false;

const el = (tag, className, text) => {
  const e = document.createElement(tag);
  if (className) e.className = className;
  if (text !== undefined) e.textContent = text;
  return e;
};
const button = (text, cls, fn, title) => {
  const b = el('button', cls || 'secondary', text);
  b.type = 'button';
  if (title) b.title = title;
  b.addEventListener('click', fn);
  return b;
};
const changed = () => { dirty = true; refresh(); };

function input(value, onInput, { type = 'text', placeholder = '', cls = '' } = {}) {
  const i = el(type === 'area' ? 'textarea' : 'input', cls);
  if (type !== 'area') i.type = type === 'number' ? 'number' : 'text';
  if (type === 'number') i.step = 'any';
  if (type === 'area') i.rows = 2;
  i.value = value === undefined || value === null ? '' : String(value);
  i.placeholder = placeholder;
  i.addEventListener('input', () => { onInput(i.value); changed(); });
  return i;
}
function field(label, control, cls) {
  const l = el('label', `te-field ${cls || ''}`);
  l.appendChild(el('span', 'te-label', label));
  l.appendChild(control);
  return l;
}
function select(options, value, onChange, label) {
  const s = el('select');
  if (label) s.setAttribute('aria-label', label);
  for (const [v, t] of options) { const o = el('option', '', t); o.value = v; s.appendChild(o); }
  s.value = value === undefined || value === null ? '' : String(value);
  s.addEventListener('change', () => { onChange(s.value); changed(); });
  return s;
}

// ---------- Opening ----------
export async function editTool(apiFn, id, doneFn) {
  api = apiFn;
  onDone = doneFn;
  let data;
  try {
    data = await api(`/tools/${encodeURIComponent(id)}/edit`);
  } catch (err) {
    alert(err.message);
    return;
  }
  ({ spec } = data);
  info = data;
  dirty = false;
  render();
  $('teModal').classList.remove('hidden');
}

export async function newTool(apiFn, doneFn) {
  const title = prompt('Title of the new risk score (e.g. "HEART score"):');
  if (!title || !title.trim()) return;
  try {
    const { id } = await apiFn('/tools', { method: 'POST', body: { title: title.trim() } });
    await editTool(apiFn, id, doneFn);
  } catch (err) {
    alert(err.message);
  }
}

function close() {
  if (dirty && !confirm('Close without saving your changes?')) return;
  $('teModal').classList.add('hidden');
  spec = null;
}

// ---------- The form ----------
function render() {
  $('teModalTitle').textContent = `Edit: ${spec.title || 'new risk score'}`;
  const where = { draft: 'Your draft (not yet published).', published: 'The published version (edited here before).', code: 'The original version.' }[info.source];
  $('teSource').textContent = where;
  $('tePublish').classList.toggle('hidden', !info.hasDraft);
  $('teDiscard').classList.toggle('hidden', !info.hasDraft);
  $('teRevert').classList.toggle('hidden', !(info.hasPublished || (info.hasDraft && !info.isCode)));
  $('teRevert').textContent = info.isCode ? 'Back to the original' : 'Delete this score';
  const body = $('teForm');
  body.textContent = '';
  if (spec.kind === 'text') {
    body.appendChild(el('p', 'notice', `Only the words of this score can be edited here (${(info.reason || '').replace(/^Only its words can be edited here: /, '').replace(/\.$/, '')}). Its results are worked out by its program.`));
  }
  body.appendChild(basics());
  if (spec.kind === 'points') {
    body.appendChild(items());
    body.appendChild(bands());
    body.appendChild(tableSection());
  }
  body.appendChild(about());
  if (info.history && info.history.length) {
    const h = el('details', 'te-history');
    h.appendChild(el('summary', '', `History (${info.history.length})`));
    const ul = el('ul');
    for (const v of info.history) ul.appendChild(el('li', '', `${new Date(v.created_at).toLocaleString()} · ${v.reverted ? 'back to the original' : v.state} · ${v.created_by}`));
    h.appendChild(ul);
    body.appendChild(h);
  }
  refresh();
}

function section(title, hint) {
  const s = el('section', 'te-section');
  s.appendChild(el('h4', '', title));
  if (hint) s.appendChild(el('p', 'hint', hint));
  return s;
}

function basics() {
  const s = section('The score');
  s.appendChild(field('Title', input(spec.title, v => { spec.title = v; })));
  s.appendChild(field('Subtitle (what it predicts)', input(spec.subtitle, v => { spec.subtitle = v; })));
  s.appendChild(field('Question it answers', input(spec.question, v => { spec.question = v; }, { type: 'area' })));
  const cats = el('details', 'te-cats');
  const chosen = new Set(spec.categories || []);
  cats.appendChild(el('summary', '', `Categories: ${[...chosen].join(', ') || 'none'}`));
  const grid = el('div', 'te-cat-grid');
  for (const c of [...new Set([...(info.categories || []), ...chosen])].sort()) {
    const l = el('label', 'inline-check');
    const cb = el('input');
    cb.type = 'checkbox';
    cb.checked = chosen.has(c);
    cb.addEventListener('change', () => {
      if (cb.checked) chosen.add(c); else chosen.delete(c);
      spec.categories = [...chosen];
      cats.querySelector('summary').textContent = `Categories: ${spec.categories.join(', ') || 'none'}`;
      changed();
    });
    l.append(cb, document.createTextNode(` ${c}`));
    grid.appendChild(l);
  }
  cats.appendChild(grid);
  s.appendChild(cats);
  s.appendChild(field('Footnote (shown under the items)', input(spec.footnote, v => { spec.footnote = v; }, { type: 'area' })));
  if (spec.kind === 'points') s.appendChild(field('Name of the total (e.g. "ABC score")', input(spec.scoreLabel, v => { spec.scoreLabel = v; })));
  return s;
}

const newItemId = label => {
  const base = String(label || 'item').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 24) || 'item';
  const used = new Set(spec.inputs.map(i => i.id).filter(Boolean));
  let id = base, k = 2;
  while (used.has(id)) id = `${base}-${k++}`;
  return id;
};

function items() {
  const s = section('Items', 'What the clinician answers. Choices start on their first option and checkboxes unchecked, so put the 0-point option first.');
  spec.inputs.forEach((it, k) => {
    const card = el('div', `te-item te-${it.type}`);
    const head = el('div', 'te-item-head');
    head.appendChild(el('span', 'te-item-num', String(k + 1)));
    head.appendChild(select(ITEM_TYPES, it.type, v => {
      const was = it.type;
      it.type = v;
      if (v === 'choice' && !it.options) it.options = [{ label: 'No', points: 0 }, { label: 'Yes', points: 1 }];
      if (v === 'check' && it.points === undefined) it.points = 1;
      if ((v === 'choice' || v === 'check') && !it.id) it.id = newItemId(it.label);
      if (v === 'text' && it.text === undefined) it.text = it.label || '';
      if (was !== v) render();
    }, 'Item type'));
    head.appendChild(button('↑', 'secondary te-small', () => { if (k) { [spec.inputs[k - 1], spec.inputs[k]] = [spec.inputs[k], spec.inputs[k - 1]]; dirty = true; render(); } }, 'Move up'));
    head.appendChild(button('↓', 'secondary te-small', () => { if (k < spec.inputs.length - 1) { [spec.inputs[k + 1], spec.inputs[k]] = [spec.inputs[k], spec.inputs[k + 1]]; dirty = true; render(); } }, 'Move down'));
    head.appendChild(button('Delete', 'secondary te-small te-del', () => { if (confirm('Delete this item?')) { spec.inputs.splice(k, 1); dirty = true; render(); } }));
    card.appendChild(head);
    if (it.type === 'text') {
      card.appendChild(input(it.text, v => { it.text = v; }, { type: 'area', placeholder: 'Text shown between the items' }));
    } else {
      const row = el('div', 'te-row');
      row.appendChild(input(it.label, v => { it.label = v; }, { placeholder: it.type === 'heading' ? 'Heading (e.g. "Check all that apply")' : 'Label (e.g. "Age")', cls: 'te-grow' }));
      if (it.type === 'check') row.appendChild(field('Points', input(it.points, v => { it.points = v; }, { type: 'number', cls: 'te-pts' }), 'te-inline'));
      card.appendChild(row);
    }
    if (it.type === 'choice') {
      const opts = el('div', 'te-options');
      it.options.forEach((o, j) => {
        const r = el('div', 'te-row');
        r.appendChild(input(o.label, v => { o.label = v; }, { placeholder: `Option ${j + 1}`, cls: 'te-grow' }));
        r.appendChild(field('Points', input(o.points, v => { o.points = v; }, { type: 'number', cls: 'te-pts' }), 'te-inline'));
        r.appendChild(button('×', 'secondary te-small', () => { if (it.options.length > 2) { it.options.splice(j, 1); dirty = true; render(); } else alert('A choice needs at least two options.'); }, 'Remove this option'));
        opts.appendChild(r);
      });
      opts.appendChild(button('+ Option', 'secondary te-small', () => { it.options.push({ label: '', points: 0 }); dirty = true; render(); }));
      card.appendChild(opts);
    }
    if (it.type === 'choice' || it.type === 'check') card.appendChild(input(it.note, v => { it.note = v; }, { placeholder: 'Note shown under it (optional)', cls: 'te-note' }));
    s.appendChild(card);
  });
  const add = el('div', 'te-add');
  add.appendChild(button('+ Choice', 'secondary', () => { spec.inputs.push({ id: newItemId('item'), type: 'choice', label: '', options: [{ label: 'No', points: 0 }, { label: 'Yes', points: 1 }] }); dirty = true; render(); }));
  add.appendChild(button('+ Checkbox', 'secondary', () => { spec.inputs.push({ id: newItemId('item'), type: 'check', label: '', points: 1 }); dirty = true; render(); }));
  add.appendChild(button('+ Heading', 'secondary', () => { spec.inputs.push({ type: 'heading', label: 'Check all that apply' }); dirty = true; render(); }));
  s.appendChild(add);
  return s;
}

function bands() {
  const s = section('Results', 'What each range of totals means, lowest first. The last band covers every higher total.');
  const rows = spec.table ? spec.table.rows : [];
  spec.bands.forEach((b, k) => {
    const last = k === spec.bands.length - 1;
    const card = el('div', `te-band level-${b.level || 0}`);
    const head = el('div', 'te-row');
    const from = k === 0 ? null : Number(spec.bands[k - 1].max);
    head.appendChild(el('span', 'te-band-range', k === 0 ? 'Totals up to' : `${Number.isFinite(from) ? `Above ${from}` : 'Next'}${last ? ' and higher' : ', up to'}`));
    if (!last) head.appendChild(input(b.max, v => { b.max = v === '' ? undefined : Number(v); }, { type: 'number', cls: 'te-pts' }));
    head.appendChild(select(LEVELS, b.level, v => { b.level = v ? Number(v) : undefined; render(); }, 'Colour'));
    if (rows.length) head.appendChild(select([['', 'No table row'], ...rows.map((r, j) => [String(j), `Row: ${r.join(' · ').slice(0, 40)}`])], b.row, v => { b.row = v === '' ? undefined : Number(v); }, 'Table row'));
    head.appendChild(button('Delete', 'secondary te-small te-del', () => {
      if (spec.bands.length === 1) { alert('A score needs at least one result band.'); return; }
      if (confirm('Delete this band?')) { spec.bands.splice(k, 1); dirty = true; render(); }
    }));
    card.appendChild(head);
    card.appendChild(input(b.headline, v => { b.headline = v; }, { placeholder: 'Headline (e.g. "Low risk")', cls: 'te-headline' }));
    (b.lines || (b.lines = [])).forEach((l, j) => {
      const r = el('div', 'te-row');
      const obj = typeof l === 'object';
      r.appendChild(input(obj ? l.label : '', v => { const cur = b.lines[j]; const text = typeof cur === 'object' ? cur.value : cur; b.lines[j] = v.trim() ? { label: v, value: text } : text; }, { placeholder: 'Label (optional)', cls: 'te-line-label' }));
      r.appendChild(input(obj ? l.value : l, v => { const cur = b.lines[j]; b.lines[j] = typeof cur === 'object' ? { label: cur.label, value: v } : v; }, { type: 'area', placeholder: 'e.g. "30-day mortality 1.0%"', cls: 'te-grow' }));
      r.appendChild(button('×', 'secondary te-small', () => { b.lines.splice(j, 1); dirty = true; render(); }, 'Remove this line'));
      card.appendChild(r);
    });
    card.appendChild(button('+ Line', 'secondary te-small', () => { b.lines.push(''); dirty = true; render(); }));
    card.appendChild(input(b.note, v => { b.note = v; }, { placeholder: 'Note under the result (optional)', cls: 'te-note' }));
    s.appendChild(card);
  });
  s.appendChild(button('+ Band', 'secondary', () => {
    const lastBand = spec.bands[spec.bands.length - 1];
    if (lastBand && lastBand.max === undefined) {
      const before = spec.bands.length > 1 ? Number(spec.bands[spec.bands.length - 2].max) : -1;
      lastBand.max = Number.isFinite(before) ? before + 1 : 0;
    }
    spec.bands.push({ lines: [] });
    dirty = true;
    render();
  }));
  return s;
}

// The table of risk groups, as text: one row per line, cells separated by |.
function tableSection() {
  const s = section('Table of risk groups (optional)', 'One row per line, cells separated by | ; the first line is the header. Each band can highlight its row.');
  const text = spec.table ? [spec.table.head, ...spec.table.rows].map(r => r.join(' | ')).join('\n') : '';
  const ta = el('textarea', 'te-table');
  ta.rows = Math.max(3, text.split('\n').length + 1);
  ta.value = text;
  ta.placeholder = 'Score | Risk group | Mortality\n0-3 | Low | 1%';
  ta.addEventListener('change', () => {
    const lines = ta.value.split('\n').map(l => l.trim()).filter(Boolean).map(l => l.split('|').map(c => c.trim()));
    spec.table = lines.length ? { head: lines[0], rows: lines.slice(1) } : null;
    for (const b of spec.bands) if (b.row !== undefined && !(spec.table && spec.table.rows[b.row])) delete b.row;
    dirty = true;
    render();
  });
  s.appendChild(ta);
  return s;
}

function about() {
  const s = section('About this score', 'Shown to readers under "About this score".');
  spec.evidence = spec.evidence || {};
  for (const [k, label, type] of EVIDENCE) s.appendChild(field(label, input(spec.evidence[k], v => { if (v === '') delete spec.evidence[k]; else spec.evidence[k] = v; }, { type })));
  return s;
}

// ---------- Checks and the summary ----------
function range() {
  let lo = 0, hi = 0;
  for (const i of spec.inputs || []) {
    if (i.type === 'check') { lo += Math.min(0, Number(i.points) || 0); hi += Math.max(0, Number(i.points) || 0); }
    if (i.type === 'choice') { const p = i.options.map(o => Number(o.points) || 0); lo += Math.min(...p); hi += Math.max(...p); }
  }
  return { lo, hi };
}

function problems() {
  const errors = [], warnings = [];
  if (!String(spec.title || '').trim()) errors.push('The score needs a title.');
  if (spec.kind !== 'points') return { errors, warnings };
  const scoring = spec.inputs.filter(i => i.type === 'choice' || i.type === 'check');
  if (!scoring.length) errors.push('Add at least one item that scores points.');
  for (const i of scoring) {
    if (!String(i.label || '').trim()) errors.push('An item has no label.');
    if (i.type === 'choice' && i.options.some(o => !String(o.label || '').trim())) errors.push(`An option of "${i.label || 'an item'}" has no label.`);
    if (i.type === 'choice' && i.options.some(o => !Number.isFinite(Number(o.points)) || o.points === '')) errors.push(`An option of "${i.label || 'an item'}" has no points.`);
    if (i.type === 'check' && (!Number.isFinite(Number(i.points)) || i.points === '')) errors.push(`"${i.label || 'A checkbox'}" has no points.`);
  }
  let prev = -Infinity;
  spec.bands.forEach((b, k) => {
    if (k === spec.bands.length - 1) return;
    if (!Number.isFinite(Number(b.max)) || b.max === '') errors.push(`Result band ${k + 1} needs the highest total it covers.`);
    else if (Number(b.max) <= prev) errors.push(`Result band ${k + 1} must cover higher totals than the band before it.`);
    else prev = Number(b.max);
  });
  const { lo, hi } = range();
  if (spec.bands.length > 1 && Number(spec.bands[spec.bands.length - 2].max) >= hi) warnings.push(`Totals only go up to ${hi}, so the last band is never reached.`);
  spec.bands.forEach((b, k) => { if (!String(b.headline || '').trim() && !(b.lines || []).some(l => String(typeof l === 'object' ? l.value : l).trim())) warnings.push(`Result band ${k + 1} has no text.`); });
  if (!String(spec.scoreLabel || '').trim()) warnings.push('The total has no name.');
  if (scoring.length && lo === hi) warnings.push('Every answer gives the same total.');
  return { errors, warnings, lo, hi };
}

function refresh() {
  if (!spec) return;
  const { errors, warnings, lo, hi } = problems();
  const box = $('teProblems');
  box.textContent = '';
  if (errors.length || warnings.length) {
    const ul = el('ul');
    for (const e of errors) ul.appendChild(el('li', 'alg-error', e));
    for (const w of warnings) ul.appendChild(el('li', 'alg-warning', w));
    box.appendChild(ul);
  } else box.appendChild(el('p', 'hint', 'No problems found.'));
  const sum = $('teSummary');
  sum.textContent = '';
  if (spec.kind !== 'points') { sum.appendChild(el('p', 'hint', 'This score\'s results come from its program; only its words are edited here.')); return; }
  sum.appendChild(el('p', '', `Totals range from ${lo} to ${hi}.`));
  const t = el('table', 'tool-bands');
  const hr = el('tr');
  ['Total', 'Result'].forEach(h => hr.appendChild(el('th', '', h)));
  t.appendChild(hr);
  let from = lo;
  spec.bands.forEach((b, k) => {
    const last = k === spec.bands.length - 1;
    const to = last ? hi : Math.min(Number(b.max), hi);
    const tr = el('tr', `level-row level-${b.level || 0}`);
    tr.appendChild(el('td', '', from > to ? 'never' : from === to ? String(from) : `${from} to ${to}`));
    const first = (b.lines || []).map(l => (typeof l === 'object' ? `${l.label}: ${l.value}` : l)).filter(Boolean)[0] || '';
    tr.appendChild(el('td', '', [b.headline, first].filter(Boolean).join(' — ') || '(no text)'));
    t.appendChild(tr);
    if (!last) from = Math.max(from, Math.floor(Number(b.max)) + 1);
  });
  sum.appendChild(t);
}

// ---------- Saving ----------
async function saveDraft({ quiet = false } = {}) {
  const { errors } = problems();
  if (errors.length) { alert(`Fix these first:\n\n${errors.join('\n')}`); return false; }
  $('teStatus').textContent = 'Saving…';
  try {
    await api(`/tools/${encodeURIComponent(spec.id)}/draft`, { method: 'PUT', body: { spec } });
    dirty = false;
    info.hasDraft = true;
    info.source = 'draft';
    $('teStatus').textContent = quiet ? '' : 'Draft saved. Use "Try it" to see it as readers will.';
    render();
    return true;
  } catch (err) {
    $('teStatus').textContent = `Not saved: ${err.message}`;
    return false;
  }
}

async function tryIt() {
  if ((dirty || !info.hasDraft) && !(await saveDraft({ quiet: true }))) return;
  $('teModal').classList.add('hidden');
  if (onDone) onDone(spec.id, { draft: true });
}

async function publish() {
  if (dirty && !(await saveDraft({ quiet: true }))) return;
  if (!confirm('Publish this draft? Everyone will see it from now on.')) return;
  try {
    await api(`/tools/${encodeURIComponent(spec.id)}/publish`, { method: 'POST' });
    dirty = false;
    $('teModal').classList.add('hidden');
    if (onDone) onDone(spec.id, { published: true });
  } catch (err) {
    $('teStatus').textContent = err.message;
  }
}

async function discard() {
  if (!confirm('Throw away this draft?')) return;
  await api(`/tools/${encodeURIComponent(spec.id)}/draft`, { method: 'DELETE' });
  dirty = false;
  $('teModal').classList.add('hidden');
  if (onDone) onDone(spec.id, { discarded: true });
}

async function revert() {
  const msg = info.isCode ? 'Go back to the original version of this score? Everyone will see the original again; the edited versions are kept in its history.' : 'Delete this score? Readers will no longer see it.';
  if (!confirm(msg)) return;
  const r = await api(`/tools/${encodeURIComponent(spec.id)}/revert`, { method: 'POST' });
  dirty = false;
  $('teModal').classList.add('hidden');
  if (onDone) onDone(spec.id, { reverted: true, removed: r.removed || !info.isCode });
}

$('teClose').addEventListener('click', close);
$('teSave').addEventListener('click', () => saveDraft());
$('teTry').addEventListener('click', tryIt);
$('tePublish').addEventListener('click', publish);
$('teDiscard').addEventListener('click', discard);
$('teRevert').addEventListener('click', revert);
$('teModal').addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
