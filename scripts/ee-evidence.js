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
  [/data from give countries/g, 'data from five countries'], [/\badmited\b/g, 'admitted'], [/; ; /g, '; '], [/\bptatients\b/g, 'patients'], [/na–ve/g, 'naïve'],
  [/\boccurrec\b/g, 'occurred'], [/\bPredicing\b/g, 'Predicting'], [/& gt;=\s?/g, '≥ '], [/& gt;\s?/g, '> '], [/& lt;=\s?/g, '≤ '], [/& lt;\s?/g, '< '], [/\bmena age\b/g, 'mean age'], [/\bconsiousness\b/g, 'consciousness'],
  [/\bunderoing\b/g, 'undergoing'], [/\bpopulationin\b/g, 'population in'], [/1990\., from/g, '1990, from'], [/hospital\.55%/g, 'hospital. 55%'], [/\bStroke Sale\b/g, 'Stroke Scale'], [/Trialists\? Collaborative/g, "Trialists' Collaborative"], [/\bundergling\b/g, 'undergoing'], [/\bgastrintestinal\b/g, 'gastrointestinal'], [/\bbleeing\b/g, 'bleeding'], [/\bwho who\b/g, 'who'], [/\bDevelin\b/g, 'Devlin'], [/\bsteatotis\b/g, 'steatosis'], [/\bb lood\b/g, 'blood'], [/\bcuture\b/g, 'culture'], [/\bevaluatin\b/g, 'evaluation'], [/16\$ motion/g, '16% motion'], [/non-theumatic/g, 'non-rheumatic'], [/Lane DA Nieuwlaat,/g, 'Lane DA, Nieuwlaat R,'], [/\bKaier\b/g, 'Kaiser'], [/anduterine/g, 'and uterine'],
  [/\bBangledeshi\b/g, 'Bangladeshi'], [/EW,et al/g, 'EW, et al'], [/20 Ers\b/g, '20 EDs'], [/\bRath EP\b/g, 'Raith EP'], [/\bCHAM score\b/g, 'CHARM score'], [/\bduratio\b/g, 'duration'], [/with a least one/g, 'with at least one'],
  [/\blethergy\b/g, 'lethargy'], [/from a the Geisinger/g, 'from the Geisinger'], [/\bKupperman N\b/g, 'Kuppermann N'], [/\bpuruent\b/g, 'purulent'], [/Moore M, Et al/g, 'Moore M, et al'], [/\bIn J Clin Pract\b/g, 'Int J Clin Pract'],
  [/\bveruss\b/g, 'versus'], [/Cararette SM, Jaglad SB/g, 'Cadarette SM, Jaglal SB'], [/Jagdal SB/g, 'Jaglal SB'], [/Rinkins PE/g, 'Rinkens PE'], [/\bvanStaa TP/g, 'van Staa TP'], [/\bYalcmkaya F/g, 'Yalçınkaya F'],
  [/\bArthitis\b/g, 'Arthritis'], [/Predicting rapid recover from/g, 'Predicting rapid recovery from'], [/\btheintensity\b/g, 'the intensity'], [/& amp;\s?/g, '& '], [/suspected SLE>/g, 'suspected SLE.'],
  [/Not demographic data/g, 'No demographic data'], [/\btemperomandibular\b/g, 'temporomandibular']
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
  for (const k of ['reference', 'population', 'comment']) if (/^(NA|N\/A)\.?$/i.test(out[k] || '')) delete out[k]; // "NA": nothing to show
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
