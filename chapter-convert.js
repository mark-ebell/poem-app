// Converts one Essential Evidence textbook chapter (XML) into the data the Chapters tab
// shows. Used by build-chapters.js (the chapter files in ../EEPlus chapters) and by the
// Edit Chapter tab, which saves edited chapters as XML and converts them the same way.
//
// Headings come from the chapter template ("Outline of headings and subheadings"); an
// element the template does not name is still shown, with a heading made from its tag,
// and reported so it can be given a proper heading in HEADINGS below.
//
// Each chapter becomes a list of sections (Background, Screening and prevention,
// Diagnosis, ...) holding labelled parts whose content is ready-made HTML. Links are
// marked with data attributes the page acts on: data-ref (a citation: opens a small
// pop-up), data-poem (a POEM by its POEM number), data-calc + data-num (the H & P or Tests
// calculator at an SxDxNum), data-fig (a figure), data-sort (SORT definitions); PubMed,
// Cochrane and web sites are ordinary external links. Each section and part also carries
// its XML tag, and each reference its id, for the Edit Chapter tab.
const fs = require('fs');
const path = require('path');
const { DOMParser } = require('@xmldom/xmldom');

// ---------- Headings (from the chapter template) ----------
// Keys are tag names lower-cased with "_" and "-" removed, so Follow-up / Followup and
// Prognosis_detail / Prognosis_Detail are the same heading.
const HEADINGS = {
  background: 'Background',
  bottomline: 'Overall Bottom Line',
  definition: 'Definition',
  incidence: 'Incidence',
  prevalence: 'Prevalence',
  economicimpact: 'Economic impact',
  socialimpact: 'Other impact',
  causes: 'Causes of the condition',
  pathophysiology: 'Pathophysiology',
  riskfactors: 'Risk factors',

  screeningprevention: 'Screening and prevention',
  screeningbl: 'Bottom-line',
  screening: 'Screening',
  screeninglowrisk: 'Screening low-risk patients',
  screeningaveragerisk: 'Screening average-risk patients',
  screeninghighrisk: 'Screening high-risk patients',
  primaryprevention: 'Primary prevention',
  secondaryprevention: 'Secondary prevention',

  diagnosis: 'Diagnosis',
  diagnosisbl: 'Bottom-line',
  differentialdiagnosis: 'Differential diagnosis',
  diagnosticcriteria: 'Diagnostic criteria',
  historyphysical: 'Using the history and physical',
  diagnostictesting: 'Selecting diagnostic tests',
  decisionrules: 'Clinical decision rules',
  diagnosticstrategy: 'Approach to the patient',
  othertestdata: 'Other test data',
  hpdatagroup: 'History and physical tests',
  hpdata: 'History and physical tests',
  dxdatagroup: 'Diagnostic tests',
  dxdata: 'Diagnostic tests',

  treatment: 'Treatment',
  treatmentbl: 'Bottom-line',
  overallapproach: 'Guidelines and overviews',
  treatmentdrug: 'Drug therapy',
  treatmentsurgery: 'Surgical treatment',
  treatmentcam: 'Complementary/alternative therapy',
  treatmentpt: 'Rehabilitation and exercise',
  treatmentbehavioral: 'Behavioral medicine and psychotherapy',
  treatmentother: 'Other treatment',
  treatmentduration: 'Duration of treatment',
  treatmentreferral: 'Referral and consultation',
  treatmentcomplications: 'Management of complications',
  treatmenthospital: 'Managing the hospitalized patient',
  treatmentearlystage: 'Treatment of early stage disease',
  treatmentlocoregional: 'Treatment of locoregional disease',
  treatmentadvancedstage: 'Treatment of advanced disease',
  treatmentmilddisease: 'Treatment of mild disease',
  treatmentmoderatedisease: 'Treatment of moderate disease',
  treatmentseveredisease: 'Treatment of severe disease',
  treatmentstagea: 'Treatment of Stage A disease',
  treatmentstageb: 'Treatment of Stage B disease',
  treatmentstagec: 'Treatment of Stage C disease',
  treatmentstaged: 'Treatment of Stage D disease',

  prognosis: 'Prognosis',
  prognosisbl: 'Bottom-line',
  naturalhistory: 'Natural history',
  prognosisdetail: 'Prognosis',
  followup: 'Follow-up tests and monitoring',
  patienteducation: 'Patient education',

  specialpopulations: 'Special populations',
  elderly: 'The elderly',
  pregnancy: 'Pregnancy',
  children: 'Infants and children'
};
// The chapter template's sections and their parts, in order (the tags as the template
// spells them), so the Edit Chapter tab can offer parts a chapter does not have yet.
const TEMPLATE = {
  background: ['BottomLine', 'definition', 'incidence', 'prevalence', 'economic_impact', 'social_impact', 'causes', 'pathophysiology', 'Risk_Factors'],
  Screening_Prevention: ['Screening_BL', 'Screening', 'Primary_Prevention', 'Secondary_Prevention'],
  Diagnosis: ['Diagnosis_BL', 'Differential_Diagnosis', 'Diagnostic_criteria', 'History_physical', 'Diagnostic_testing', 'Decision_rules', 'Diagnostic_strategy'],
  Treatment: ['Treatment_BL', 'overall_approach', 'Treatment_Drug', 'Treatment_Surgery', 'Treatment_CAM', 'Treatment_PT', 'Treatment_Behavioral',
    'Treatment_Other', 'Treatment_Duration', 'Treatment_Referral', 'Treatment_complications', 'Treatment_Hospital'],
  Prognosis: ['Prognosis_BL', 'Natural_history', 'Prognosis_Detail', 'Followup', 'Patient_education'],
  Special_populations: ['Elderly', 'Pregnancy', 'Children']
};

// Typed-layout headings (<section type="..."><heading>) spelled as the template spells them.
const TYPED_HEADINGS = Object.fromEntries(Object.values(HEADINGS).map(h => [h.toLowerCase(), h]));
Object.assign(TYPED_HEADINGS, {
  'screening and prevention': 'Screening and prevention', 'management of special populations': 'Special populations',
  'special population': 'Special populations', 'the elderly': 'The elderly', children: 'Infants and children',
  'history and physical': 'Using the history and physical', 'using the history and physical': 'Using the history and physical',
  'selecting diagnostic tests': 'Selecting diagnostic tests', 'diagnostic testing': 'Selecting diagnostic tests',
  'approach to the patient': 'Approach to the patient', 'clinical decision rules': 'Clinical decision rules',
  'drug therapy': 'Drug therapy', 'when to refer or hospitalize': 'Referral and consultation', 'when to refer': 'Referral and consultation',
  'follow-up': 'Follow-up', 'causes of the condition': 'Causes of the condition', 'risk factors': 'Risk factors'
});

// Parts that are a section's bottom line (shown highlighted).
const BOTTOM_LINES = new Set(['bottomline', 'screeningbl', 'diagnosisbl', 'treatmentbl', 'prognosisbl']);
// Not shown: billing codes (the template has no heading for them).
const SKIP = new Set(['icd9codes']);
const SORT_RATINGS = new Set(['A', 'B', 'C']);

const key = tag => tag.replace(/[_-]/g, '').toLowerCase();

function headingFor(tag, unknown) {
  const k = key(tag);
  if (HEADINGS[k]) return HEADINGS[k];
  unknown.set(tag, (unknown.get(tag) || 0) + 1);
  const words = tag.replace(/_/g, ' ').trim();
  return words.charAt(0).toUpperCase() + words.slice(1).toLowerCase();
}

// Same escaping as Python's html.escape(quote=True).
const esc = s => String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#x27;');

// ---------- DOM helpers (ElementTree's find / findall / iter) ----------
const elements = e => (e ? Array.from(e.childNodes).filter(n => n.nodeType === 1) : []);
const child = (e, tag) => elements(e).find(c => c.tagName === tag) || null;
const children = (e, tag) => elements(e).filter(c => c.tagName === tag);
const iter = (e, tag) => (e ? [...(tag === undefined || e.tagName === tag ? [e] : []), ...Array.from(e.getElementsByTagName(tag || '*'))] : []);
const attr = (e, name) => (e && e.hasAttribute(name) ? e.getAttribute(name) : null);
const textOf = e => (e ? String(e.textContent || '').replace(/\s+/g, ' ').trim() : '');
const findPath = (e, ...tags) => tags.reduce((cur, t) => (cur ? child(cur, t) : null), e);

const safeUrl = u => {
  u = String(u || '').trim();
  if (/^https?:\/\//i.test(u)) return u;
  if (/^www\./i.test(u)) return `https://${u}`;
  return '#';
};
const cochraneUrl = cd => `https://www.cochranelibrary.com/cdsr/doi/10.1002/14651858.${cd}/full`;

// A figure's image file, served from chapters/images (copied there by build-chapters.js).
const imageUrl = href => `/api/chapters/images/${encodeURIComponent(path.basename(href).toLowerCase())}`;

// An algorithm can be drawn when it has a start and every other box is reached from it by arrows.
function drawable(cells) {
  if (cells.length < 2) return false;
  const byId = new Map(cells.map(c => [c.id, c]));
  const start = cells.find(c => c.type === 'start') || cells[0];
  const seen = new Set([start.id]);
  const queue = [start];
  while (queue.length) {
    for (const p of queue.shift().paths) {
      if (byId.has(p.target) && !seen.has(p.target)) { seen.add(p.target); queue.push(byId.get(p.target)); }
    }
  }
  return seen.size === cells.length;
}

function linkHtml(link) {
  if (link.href) return `<a href="${esc(link.href)}" target="_blank" rel="noopener">${esc(link.label)}</a>`;
  if (link.poem) return `<a href="#" data-poem="${esc(link.poem)}">${esc(link.label)}</a>`;
  return `<a href="#" data-calc="${esc(link.calc)}" data-num="${esc(link.num)}">${esc(link.label)}</a>`;
}

// ---------- Calculator links ----------
// SxDxNum -> 'symptom → disease' for each calculator, for the link text.
// source: the calculator data (default: what the app is using, calculator-data.js) or a file path.
function loadCalculatorLabels(source) {
  const labels = { signs: new Map(), tests: new Map() };
  let data;
  try {
    data = typeof source === 'string' ? JSON.parse(fs.readFileSync(source, 'utf8')) : source || require('./calculator-data').get();
  } catch { return labels; }
  for (const panel of data.panels || []) {
    const which = panel.key === 'signsSymptoms' ? 'signs' : 'tests';
    const counts = new Map();
    for (const t of panel.tests) {
      if (t.sxdxNum === null || t.sxdxNum === undefined) continue;
      if (!counts.has(t.sxdxNum)) counts.set(t.sxdxNum, new Map());
      const label = `${t.symptom} → ${t.disease}`;
      const c = counts.get(t.sxdxNum);
      c.set(label, (c.get(label) || 0) + 1);
    }
    for (const [n, c] of counts) {
      let best = null, bestN = -1;
      for (const [label, k] of c) if (k > bestN) { best = label; bestN = k; } // first of the most common, as Counter does
      labels[which].set(n, best);
    }
  }
  return labels;
}

// ---------- One chapter ----------
class Chapter {
  constructor(root, calcLabels, unknown, problems) {
    this.root = root;
    this.calcLabels = calcLabels;
    this.unknown = unknown;
    this.problems = problems;
    this.refs = new Map();    // reference id -> { n, ... }
    this.figures = new Map(); // figure id (algorithm or picture) -> number
    this.tables = new Map();  // table (feature) id -> number
    this.calcFound = { signs: [], tests: [] };
    this.numberReferences();
    this.numberFigures();
    this.numberTables();
  }

  // References are numbered by their position in the list (as in Essential Evidence).
  numberReferences() {
    const misc = iter(this.root, 'Misc').find(m => child(m, 'References'));
    const refs = misc ? child(misc, 'References') : (iter(this.root, 'References')[0] || null);
    this.refElements = elements(refs);
    this.refElements.forEach((r, i) => {
      const n = i + 1;
      const rid = attr(r, 'id') || `ref${n}`;
      const info = { n, id: rid };
      for (const acc of children(r, 'accessionId')) {
        const href = attr(acc, 'href') || '';
        let m;
        if ((m = /^info:pmid\/(\d+)/.exec(href))) info.pmid = m[1];
        if ((m = /^info:wiley\/eep-poem\/(\d+)/.exec(href))) info.poem = m[1];
        if ((m = /^info:wiley\/eep-dx\/(\d+)/.exec(href))) info.calc = ['tests', m[1]];
        if ((m = /^info:wiley\/eep-hp\/(\d+)/.exec(href))) info.calc = ['signs', m[1]];
        if ((m = /^info:wiley\/cochrane\/(CD\d+)/.exec(href))) info.cochrane = m[1];
      }
      // A link to a calculator that is not in the calculator data would go nowhere: leave it out.
      if (info.calc && !this.calcLabels[info.calc[0]].has(Number(info.calc[1]))) {
        this.problems.push(`${info.calc[0] === 'signs' ? 'H & P' : 'Tests'} calculator #${info.calc[1]} is not in the calculator data`);
        delete info.calc;
      }
      if (attr(r, 'PMID')) info.pmid = attr(r, 'PMID');
      const url = textOf(child(r, 'url'));
      if (url) info.url = url;
      let m;
      if ((m = /^poem(\d+)$/.exec(rid)) && !info.poem) info.poem = m[1];
      if ((m = /^pubmed(\d+)$/.exec(rid)) && !info.pmid) info.pmid = m[1];
      info.text = Chapter.citationText(r);
      info.short = Chapter.shortCitation(r) || info.text;
      this.refs.set(rid, info);
    });
  }

  // Algorithms and pictures (figure_group) share one numbering, by their ids (fig001 is
  // Figure 1, as in Essential Evidence); one without an id comes after.
  numberFigures() {
    this.figureElements = [...iter(this.root, 'algorithm'), ...iter(this.root, 'figure')];
    this.figureElements.forEach((f, i) => { if (!attr(f, 'id')) f.setAttribute('id', `fig${String(900 + i)}`); });
    const num = f => Number(String(attr(f, 'id')).replace(/\D/g, '')) || 0;
    this.figureElements.sort((a, b) => num(a) - num(b));
    this.figureElements.forEach((f, i) => this.figures.set(attr(f, 'id'), i + 1));
  }

  // Tables (feature_group/feature, e.g. id table001), numbered in order.
  numberTables() {
    this.tableElements = iter(this.root, 'feature_group').flatMap(g => children(g, 'feature'));
    this.tableElements.forEach((t, i) => this.tables.set(attr(t, 'id') || `table${i + 1}`, i + 1));
  }

  static citationText(r) {
    const get = t => textOf(child(r, t));
    let parts;
    if (child(r, 'chapter_title') || child(r, 'book_title')) { // Cochrane review / book chapter
      parts = [get('chapter_authors'), get('chapter_title'), get('book_editors'), get('book_title'),
        get('edition'), get('city_publisher'), get('year'), get('pages')];
    } else if (child(r, 'url') || child(r, 'organization')) { // web site
      parts = [get('organization'), get('longtitle') || get('title'), get('url')];
      if (get('dateguideline')) parts.push(`Accessed ${get('dateguideline')}`);
    } else { // journal article
      const src = get('source'), year = get('pubdate'), vol = get('volume'), pages = get('pages').replace(/\.+$/, '');
      let tail = src ? `${src} ${year}` : year;
      if (vol) tail += `;${vol}`;
      if (pages) tail += `:${pages}`;
      parts = [get('authors'), get('title'), tail];
      if (!parts.some(Boolean)) parts = [get('citation')];
    }
    return parts.map(x => x.trim()).filter(Boolean).map(p => (p.endsWith('.') ? p : `${p}.`)).join(' ');
  }

  // An abbreviated reference for the citation pop-up: first author, title, then source,
  // year, volume and pages (Ann Allergy 1992;68:35-45.).
  static shortCitation(r) {
    const get = t => textOf(child(r, t));
    const firstAuthor = names => {
      names = names.split(';')[0].trim().replace(/\.+$/, '');
      const parts = names.split(',').map(p => p.trim()).filter(Boolean);
      if (!parts.length) return '';
      return parts[0] + (parts.length > 1 ? ', et al.' : '.');
    };
    const dot = s => (!s || /[.?!]$/.test(s) ? s : `${s}.`);
    let parts;
    if (child(r, 'chapter_title') || child(r, 'book_title')) {
      const book = get('book_title');
      const year = /(19|20)\d\d/.exec(`${book} ${get('year')}`);
      let src;
      if (book.toLowerCase().includes('cochrane')) {
        const issue = /Issue\s+(\d+)/.exec(book), art = /(CD\d+)/.exec(book);
        src = 'Cochrane Database Syst Rev' + (year ? ` ${year[0]}` : '') + (issue ? `;(${issue[1]})` : '') + (art ? `:${art[1]}` : '');
      } else {
        src = book + (year ? ` ${year[0]}` : '');
      }
      parts = [firstAuthor(get('chapter_authors')), dot(get('chapter_title')), dot(src)];
    } else if (child(r, 'url') || child(r, 'organization')) {
      parts = [dot(get('organization')), dot(get('longtitle') || get('title'))];
    } else {
      let src = [get('source'), get('pubdate')].filter(Boolean).join(' ');
      const vol = get('volume'), pages = get('pages').replace(/\.+$/, '');
      if (vol) src += `;${vol}`;
      if (pages) src += `:${pages}`;
      parts = [firstAuthor(get('authors')), dot(get('title')), dot(src)];
    }
    return parts.filter(Boolean).join(' ');
  }

  // Where a reference can be read: [{label, href} | {label, poem} | {label, calc, num}].
  static refLinks(info) {
    const links = [];
    if (info.pmid) links.push({ label: 'PubMed', href: `https://pubmed.ncbi.nlm.nih.gov/${info.pmid}/` });
    if (info.poem) links.push({ label: 'POEM', poem: info.poem });
    if (info.calc) links.push({ label: info.calc[0] === 'signs' ? 'H & P calculator' : 'Tests calculator', calc: info.calc[0], num: info.calc[1] });
    if (info.cochrane) links.push({ label: 'Cochrane Library', href: cochraneUrl(info.cochrane) });
    if (info.url && !info.pmid) links.push({ label: 'Web site', href: safeUrl(info.url) });
    return links;
  }

  // The in-text citation: the reference number, which opens a small pop-up with the
  // abbreviated reference and its links (green when the reference has a POEM or a Cochrane review).
  refLink(info) {
    const cls = info.poem || info.cochrane ? 'cite cite-poem' : 'cite';
    return `<a href="#ref-${info.n}" class="${cls}" data-ref="${info.n}" title="${esc(info.text)}">${info.n}</a>`;
  }

  // ---------- Inline content -> HTML ----------
  inline(e) {
    if (!e) return '';
    let out = '';
    for (const n of Array.from(e.childNodes)) {
      if (n.nodeType === 3 || n.nodeType === 4) out += esc(n.nodeValue);
      else if (n.nodeType === 1) out += this.element(n);
    }
    return out;
  }

  element(c) {
    const tag = c.tagName;
    if (tag === 'strong' || tag === 'b') return `<strong>${this.inline(c)}</strong>`;
    if (tag === 'em' || tag === 'i') return `<em>${this.inline(c)}</em>`;
    if (tag === 'sub' || tag === 'sup') return `<${tag}>${this.inline(c)}</${tag}>`;
    if (tag === 'list' || tag === 'itemizedlist') {
      const name = ['numbered', 'ordered'].includes(attr(c, 'style')) ? 'ol' : 'ul';
      return `<${name}>${children(c, 'listitem').map(li => `<li>${this.inline(li)}</li>`).join('')}</${name}>`;
    }
    if (tag === 'listitem') return `<li>${this.inline(c)}</li>`;
    if (tag === 'evidence') {
      const rating = (attr(c, 'rating') || textOf(c)).trim().toUpperCase();
      if (!SORT_RATINGS.has(rating)) this.problems.push(`SORT rating '${rating}'`);
      return ` <button type="button" class="sort-tag" data-sort="${esc(rating)}">(SORT ${esc(rating)})</button>`;
    }
    if (tag === 'xref') { // one id, or several separated by spaces
      return (attr(c, 'ref') || '').split(/\s+/).filter(Boolean).map(ref => {
        if (this.figures.has(ref)) return `<a href="#" class="fig-link" data-fig="${esc(ref)}">Figure ${this.figures.get(ref)}</a>`;
        if (this.tables.has(ref)) return `<a href="#" class="table-link" data-table="${esc(ref)}">Table ${this.tables.get(ref)}</a>`;
        if (this.refs.has(ref)) return ` ${this.refLink(this.refs.get(ref))}`;
        this.problems.push(`link to '${ref}', which is not in the references`);
        return '';
      }).join('');
    }
    if (tag === 'resource') { // older chapters: an inline link with a PMID
      const label = this.inline(c) || 'PubMed';
      if (attr(c, 'PMID')) return `<a href="https://pubmed.ncbi.nlm.nih.gov/${esc(attr(c, 'PMID'))}/" target="_blank" rel="noopener">${label}</a>`;
      return label;
    }
    if (tag === 'reference') return esc(textOf(c)); // older chapters: a citation written inline
    if (tag === 'table') return this.table(c);
    if (tag === 'url' || tag === 'Web_URL') {
      const u = textOf(c);
      return `<a href="${esc(safeUrl(u))}" target="_blank" rel="noopener">${esc(u)}</a>`;
    }
    return this.inline(c); // anything else: keep its text and formatting
  }

  table(t) {
    const rows = iter(t, 'tr').filter(tr => tr !== t).map(tr => '<tr>' + elements(tr).filter(td => td.tagName === 'td' || td.tagName === 'th').map(td => {
      const span = (attr(td, 'colspan') || '1') !== '1' ? ` colspan="${esc(attr(td, 'colspan'))}"` : '';
      return `<${td.tagName}${span}>${this.inline(td)}</${td.tagName}>`;
    }).join('') + '</tr>');
    const cap = child(t, 'caption');
    const caption = cap ? `<caption>${this.inline(cap)}</caption>` : '';
    return `<div class="chapter-table-wrap"><table class="chapter-table">${caption}${rows.join('')}</table></div>`;
  }

  // ---------- Special parts ----------
  riskFactors(e) {
    const rows = children(e, 'Risk_Factor').map(f => [child(f, 'Risk_Name'), child(f, 'Risk_OR')]).filter(([n]) => textOf(n));
    const hasOr = rows.some(([, o]) => textOf(o));
    let body = '';
    if (rows.length) {
      const head = '<tr><th>Risk factor</th>' + (hasOr ? '<th>Odds ratio (95% CI)</th>' : '') + '</tr>';
      const trs = rows.map(([n, o]) => `<tr><td>${this.inline(n)}</td>` + (hasOr ? `<td>${o ? this.inline(o) : ''}</td>` : '') + '</tr>').join('');
      body = `<div class="chapter-table-wrap"><table class="chapter-table">${head}${trs}</table></div>`;
    }
    const refs = child(e, 'Risk_Factors_Ref');
    if (refs && elements(refs).length) body += `<p class="chapter-refs">Sources:${this.inline(refs)}</p>`;
    return body;
  }

  differential(e) {
    const rows = children(e, 'Differential').filter(d => textOf(child(d, 'Differential_Name')))
      .map(d => `<tr><td>${this.inline(child(d, 'Differential_Name'))}</td><td>${this.inline(child(d, 'Differential_Features'))}</td></tr>`).join('');
    if (!rows) return '';
    return `<div class="chapter-table-wrap"><table class="chapter-table"><tr><th>Diagnosis</th><th>Features</th></tr>${rows}</table></div>`;
  }

  calculatorLinks(e, which) {
    const nums = [...new Set(iter(e).filter(x => x.tagName === 'HP_ID' || x.tagName === 'Dx_ID').map(textOf).filter(Boolean))];
    // A calculator that is not in the calculator data is left out (its link would go nowhere).
    const items = nums.map(n => {
      const label = /^\d+$/.test(n) ? this.calcLabels[which].get(Number(n)) : null;
      if (!label) {
        this.problems.push(`${which === 'signs' ? 'H & P' : 'Tests'} calculator #${n} is not in the calculator data`);
        return null;
      }
      this.calcFound[which].push({ num: n, label });
      return `<li><a href="#" class="calc-link" data-calc="${which}" data-num="${esc(n)}">${esc(label)}</a></li>`;
    }).filter(Boolean);
    return items.length ? `<ul class="calc-links">${items.join('')}</ul>` : '';
  }

  webSites(e) {
    const items = children(e, 'Web_Site').map(w => {
      const name = textOf(child(w, 'Web_Name')), url = textOf(child(w, 'Web_URL'));
      if (url) return `<li><a href="${esc(safeUrl(url))}" target="_blank" rel="noopener">${esc(name || url)}</a></li>`;
      return name ? `<li>${esc(name)}</li>` : '';
    }).filter(Boolean);
    return items.length ? `<ul>${items.join('')}</ul>` : '';
  }

  // ---------- Sections ----------
  // One labelled part of a section, or null if it is empty.
  part(e) {
    const k = key(e.tagName);
    if (SKIP.has(k)) return null;
    let content;
    if (k === 'riskfactors') content = this.riskFactors(e);
    else if (k === 'differentialdiagnosis') content = this.differential(e);
    else if (k === 'hpdatagroup' || k === 'hpdata') content = this.calculatorLinks(e, 'signs');
    else if (k === 'dxdatagroup' || k === 'dxdata') content = this.calculatorLinks(e, 'tests');
    else {
      content = this.inline(e).trim();
      if (content && !content.startsWith('<')) content = `<p>${content}</p>`; // plain text (e.g. a definition) as a paragraph
    }
    if (!content.replace(/<[^>]+>/g, '').trim()) return null;
    return { label: headingFor(e.tagName, this.unknown), bottomLine: BOTTOM_LINES.has(k), html: content, tag: e.tagName };
  }

  sections() {
    const text = child(this.root, 'topic_text');
    const out = [];
    if (!text) return out;
    for (const s of elements(text)) {
      const k = key(s.tagName);
      if (k === 'misc') continue;
      let parts, label;
      if (k === 'section' && Chapter.isTyped(s)) { // the typed layout: <section type="..."><heading>...</heading>, nested
        if (Chapter.isOverallBottomLine(s, out.length === 0)) continue; // shown above the sections
        label = Chapter.typedHeading(s);
        parts = this.typedParts(s);
      } else if (k === 'section') { // the general layout: <section heading="..."><subsection heading="...">
        parts = [];
        if (elements(s).some(c => c.tagName === 'subsection')) {
          for (const sub of children(s, 'subsection')) {
            const html = this.inline(sub).trim();
            if (html.replace(/<[^>]+>/g, '').trim()) {
              parts.push({ label: attr(sub, 'heading') || '', bottomLine: (attr(sub, 'heading') || '').toLowerCase().includes('bottom'), html, tag: 'subsection' });
            }
          }
        } else {
          const html = this.inline(s).trim();
          if (html) parts.push({ label: '', bottomLine: false, html, tag: 'section' });
        }
        label = attr(s, 'heading') || 'Section';
      } else {
        // The chapter's Overall Bottom Line is shown on its own, above the sections.
        const kids = elements(s).filter(c => !(k === 'background' && key(c.tagName) === 'bottomline'));
        parts = kids.map(c => this.part(c)).filter(Boolean);
        label = headingFor(s.tagName, this.unknown);
      }
      if (parts.length) out.push({ id: label.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''), label, parts, tag: s.tagName });
    }

    // Web sites and guidelines (Misc), when there are any.
    const misc = child(text, 'Misc');
    if (misc) {
      const parts = [];
      const ws = child(misc, 'Web_Sites');
      if (ws && this.webSites(ws)) parts.push({ label: 'Web sites', bottomLine: false, html: this.webSites(ws), tag: 'Web_Sites' });
      const gl = child(misc, 'Guidelines');
      if (gl && textOf(gl)) parts.push({ label: 'Guidelines', bottomLine: false, html: this.inline(gl).trim(), tag: 'Guidelines' });
      if (parts.length) out.push({ id: 'resources', label: 'Web sites and guidelines', parts, tag: 'Misc' });
    }

    // Features (boxed tables or lists outside the main text).
    for (const f of children(this.root, 'feature')) {
      const html = this.inline(f).trim();
      if (html) out.push({ id: `feature-${attr(f, 'uid') || ''}`, label: attr(f, 'caption') || 'Feature', parts: [{ label: '', bottomLine: false, html, tag: 'feature' }], tag: 'feature' });
    }
    return out;
  }

  // ---------- The typed layout ----------
  // Some chapters (about 50, many of them procedures) use <section type="Background">
  // <heading>Background</heading> <list>...</list> <section type="Definition">...</section>
  // </section> instead of the template's tags. Each top section is a panel, each section
  // inside it a part, and deeper sections subheadings within the part.
  static isTyped(s) { return !!(attr(s, 'type') || child(s, 'heading')); }

  static typedHeading(s) {
    const raw = (textOf(child(s, 'heading')) || attr(s, 'type') || 'Section').replace(/\s+/g, ' ').trim();
    const k = raw.toLowerCase().replace(/[.:]+$/, '');
    if (/^(overall )?bottom[ -]?lines?$/.test(k)) return k.startsWith('overall') ? 'Overall Bottom Line' : 'Bottom-line';
    if (TYPED_HEADINGS[k]) return TYPED_HEADINGS[k];
    return raw === raw.toUpperCase() ? raw.charAt(0) + raw.slice(1).toLowerCase() : raw;
  }

  static isBottomLine(s) { return /bottom[ -]?line/i.test(textOf(child(s, 'heading')) || attr(s, 'type') || ''); }

  // A chapter's overall bottom line in this layout: a first top-level "Bottom Line"
  // section, or an "OVERALL BOTTOM LINE" section anywhere at the top or in Background.
  static isOverallBottomLine(s, first) {
    const h = (textOf(child(s, 'heading')) || attr(s, 'type') || '').toLowerCase();
    return /overall bottom/.test(h) || (first && Chapter.isBottomLine(s));
  }

  typedOverall() {
    const text = child(this.root, 'topic_text');
    if (!text) return null;
    const tops = children(text, 'section').filter(Chapter.isTyped);
    if (!tops.length) return null;
    if (Chapter.isOverallBottomLine(tops[0], true)) return tops[0];
    for (const t of tops) {
      const inner = children(t, 'section').find(c => /overall bottom/i.test(textOf(child(c, 'heading')) || attr(c, 'type') || ''));
      if (inner) return inner;
    }
    return null;
  }

  // The content of a typed section without its heading; nested sections as subheadings.
  typedBody(s, level = 4) {
    let out = '';
    for (const n of Array.from(s.childNodes)) {
      if (n.nodeType === 1 && n.tagName === 'heading') continue;
      if (n.nodeType === 1 && n.tagName === 'section') {
        const h = Chapter.typedHeading(n), body = this.typedBody(n, Math.min(level + 1, 6));
        if (body.replace(/<[^>]+>/g, '').trim()) out += `<h${level} class="chapter-subhead">${esc(h)}</h${level}>${body}`;
      } else if (n.nodeType === 1) out += this.element(n);
      else if (n.nodeType === 3 || n.nodeType === 4) out += esc(n.nodeValue);
    }
    out = out.trim();
    return out && !out.startsWith('<') ? `<p>${out}</p>` : out;
  }

  typedParts(s) {
    const parts = [], overall = this.typedOverall();
    let loose = '';
    const flush = () => { if (loose.replace(/<[^>]+>/g, '').trim()) parts.push({ label: '', bottomLine: false, html: loose.trim(), tag: 'section' }); loose = ''; };
    for (const n of Array.from(s.childNodes)) {
      if (n.nodeType === 1 && n.tagName === 'heading') continue;
      if (n.nodeType === 1 && n.tagName === 'section') {
        if (n === overall) continue;
        flush();
        const html = this.typedBody(n);
        if (html.replace(/<[^>]+>/g, '').trim()) parts.push({ label: Chapter.typedHeading(n), bottomLine: Chapter.isBottomLine(n), html, tag: 'section' });
      } else if (n.nodeType === 1) loose += this.element(n);
      else if (n.nodeType === 3 || n.nodeType === 4) loose += esc(n.nodeValue);
    }
    flush();
    return parts;
  }

  references() {
    return this.refElements.map(r => this.refs.get(attr(r, 'id') || '')).filter(Boolean).map(info => {
      const links = Chapter.refLinks(info);
      return {
        n: info.n, id: info.id, short: info.short, links,
        html: esc(info.text) + (links.length ? ' ' + links.map(linkHtml).join(' ') : '')
      };
    });
  }

  // Figures: algorithms (boxes and arrows, drawn by the page when every box is joined by
  // arrows: drawable) and pictures; each with its image file when it has one.
  figuresList() {
    return this.figureElements.map(a => {
      const fid = attr(a, 'id');
      const graphic = child(a, 'graphic');
      const image = graphic && attr(graphic, 'href') ? imageUrl(attr(graphic, 'href')) : '';
      if (a.tagName === 'figure') {
        const notes = children(a, 'caption_detail').map(d => this.inline(d).trim()).filter(Boolean);
        return { id: fid, n: this.figures.get(fid), kind: 'picture', title: textOf(child(a, 'caption')) || 'Figure', image, cells: [], notes, drawable: false };
      }
      const cells = children(a, 'cell').map(c => ({
        id: attr(c, 'id') || '',
        type: attr(c, 'type') || 'action',
        html: child(c, 'label') ? this.inline(child(c, 'label')) : '',
        paths: children(c, 'path').map(p => ({ target: attr(p, 'target') || '', html: this.inline(p).trim() }))
      }));
      // Show the boxes in the order of their numbers (cell-1, cell-2, ...).
      cells.sort((x, y) => (Number(x.id.replace(/\D/g, '')) || 0) - (Number(y.id.replace(/\D/g, '')) || 0));
      const notes = iter(a, 'footnote').map(fn => this.inline(fn));
      // Some "algorithms" are photographs: an image and no box with any text.
      if (!cells.some(c => c.html.trim())) return { id: fid, n: this.figures.get(fid), kind: 'picture', title: textOf(child(a, 'title')) || 'Figure', image, cells: [], notes, drawable: false };
      return { id: fid, n: this.figures.get(fid), kind: 'algorithm', title: textOf(child(a, 'title')), image, cells, notes, drawable: drawable(cells) };
    });
  }

  tablesList() {
    return this.tableElements.map(t => {
      const id = attr(t, 'id') || '';
      return { id, n: this.tables.get(id), caption: this.inline(child(t, 'caption')).trim(), html: this.inline(child(t, 'feature_body') || t).trim() };
    });
  }

  people() {
    const fields = ['name', 'title', 'department', 'institution', 'city', 'state'];
    const pick = a => Object.fromEntries(fields.map(k => [k, textOf(child(a, `author_${k}`))]));
    let authors = iter(this.root, 'author').map(pick);
    if (!authors.length) { // older layout: a single author directly in author_info
      const ai = child(this.root, 'author_info');
      if (ai && textOf(child(ai, 'author_name'))) authors = [pick(ai)];
    }
    const editors = iter(this.root, 'editor').map(e => textOf(child(e, 'editor_name'))).filter(Boolean);
    return [authors.filter(a => a.name), editors];
  }

  overallBottomLine() {
    const bl = findPath(this.root, 'topic_text', 'background', 'BottomLine');
    if (!bl) { const t = this.typedOverall(); return t ? this.typedBody(t) : ''; }
    const part = this.part(bl);
    return part ? part.html : '';
  }

  build() {
    const info = child(this.root, 'topic_info');
    const [authors, editors] = this.people();
    return {
      id: info ? textOf(child(info, 'topic_id')).toLowerCase() : '',
      title: info ? textOf(child(info, 'title')) : '',
      chapterType: info ? textOf(child(info, 'chapter_type')) : '',
      updated: info ? textOf(child(info, 'topic_lastupdated')) : '',
      authors,
      editors,
      overallBottomLine: this.overallBottomLine(),
      sections: this.sections(),
      figures: this.figuresList(),
      tables: this.tablesList(),
      // Collected while building the sections: the chapter's calculators. Risk scores
      // will be added here once chapters tag them.
      decisionSupport: { signs: this.calcFound.signs, tests: this.calcFound.tests, riskScores: [] },
      references: this.references()
    };
  }
}

// The XML document for a chapter's text (the DTD is not needed to read it).
function parseXml(raw) {
  const text = String(raw).replace(/^﻿/, '').replace(/<!DOCTYPE[^>[]*(\[[^\]]*\])?\s*>/, '');
  const errors = [];
  const doc = new DOMParser({ onError: (level, msg) => { if (level !== 'warning') errors.push(msg); } }).parseFromString(text, 'text/xml');
  if (errors.length || !doc.documentElement) throw new Error(`Not readable XML: ${errors[0] || 'empty document'}`);
  return doc;
}

// XML text -> { chapter, problems, unknown } (problems: links that go nowhere and the like;
// unknown: tags with no heading).
function convertChapter(xml, calcLabels = loadCalculatorLabels()) {
  const problems = [];
  const unknown = new Map();
  const chapter = new Chapter(parseXml(xml).documentElement, calcLabels, unknown, problems).build();
  return { chapter, problems: [...new Set(problems)].sort(), unknown };
}

module.exports = { convertChapter, parseXml, loadCalculatorLabels, HEADINGS, BOTTOM_LINES, TEMPLATE, key, esc, headingFor };
