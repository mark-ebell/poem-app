// Pulls each Essential Evidence Plus decision support tool's "More info" (reference,
// population, validation, prevalence, numbers of patients, comment) and PubMed link out
// of the archive made before EE+ closed, into decision-tools/ee-evidence.json, which the
// Risk Scores tab uses for each tool's "About this score".
//
//   node scripts/ee-evidence.js "../ee-decision-tools-archive/ee-decision-tools.json"
const fs = require('fs');
const path = require('path');
const { DOMParser } = require('@xmldom/xmldom');

const archive = process.argv[2] || path.join(__dirname, '..', '..', 'ee-decision-tools-archive', 'ee-decision-tools.json');
const { tools } = JSON.parse(fs.readFileSync(archive, 'utf8'));

const clean = s => String(s || '').replace(/\s+/g, ' ').trim();
// Typos in EE+'s text, corrected everywhere they occur.
const TYPOS = [
  [/predicrtive/g, 'predictive'], [/post-dischage/g, 'post-discharge'], [/Goldsetein/g, 'Goldstein'], [/symptoamtic/g, 'symptomatic'],
  [/data from give countries/g, 'data from five countries'], [/\badmited\b/g, 'admitted'], [/; ; /g, '; '], [/\bptatients\b/g, 'patients']
];
const fixTypos = s => TYPOS.reduce((t, [re, to]) => t.replace(re, to), s);
const decode = s => s.replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/�/g, '–');

function evidenceOf(t) {
  const html = t.mainHtml || '';
  const start = html.indexOf('id="moreInfo"');
  if (start < 0) return null;
  const box = html.slice(start, html.indexOf('IMPORTANT:', start) > 0 ? html.indexOf('IMPORTANT:', start) : start + 6000);
  // Each item is a <div>, labelled by an <h4> or by its own text.
  const divs = box.split(/<div[^>]*>/).map(d => decode(clean(d.replace(/<[^>]+>/g, ' '))));
  const out = {};
  for (const d of divs) {
    let m;
    if ((m = /^Reference:\s*(.+)$/i.exec(d))) out.reference = m[1];
    else if ((m = /^Population:\s*(.+)$/i.exec(d))) out.population = m[1];
    else if ((m = /^Type of Validation:\s*(.+)$/i.exec(d))) out.validation = m[1].replace(/^Quality score \d \(1-4\):\s*(?=Quality score)/, '');
    else if ((m = /^Prevalence of the primary outcome:\s*([\d.]+)/i.exec(d))) out.prevalence = Number(m[1]) || null;
    else if ((m = /^(\d+) patients were used to develop/i.exec(d))) out.developed = Number(m[1]) || null;
    else if ((m = /^(\d+) patients were used to validate/i.exec(d))) out.validated = Number(m[1]) || null;
    else if ((m = /^Comment:\s*(.+)$/i.exec(d))) out.comment = m[1];
  }
  return out;
}

const result = {};
for (const t of tools) {
  const ev = evidenceOf(t) || {};
  const pmid = (t.pubmed || []).map(u => (/list_uids=(\d+)/.exec(u) || /pubmed\.ncbi\.nlm\.nih\.gov\/(\d+)/.exec(u) || [])[1]).find(Boolean) || null;
  for (const k of ['reference', 'population', 'validation', 'comment']) if (ev[k]) ev[k] = fixTypos(ev[k]);
  result[t.id] = { title: clean(t.title || t.listTitle), categories: t.categories, pmid, ...ev };
}
const out = path.join(__dirname, '..', 'decision-tools', 'ee-evidence.json');
fs.writeFileSync(out, JSON.stringify(result, null, 1) + '\n');
const n = Object.values(result);
console.log(`${n.length} tools: ${n.filter(e => e.reference).length} with a reference, ${n.filter(e => e.pmid).length} with a PubMed id, ${n.filter(e => e.validation).length} with validation details.`);
