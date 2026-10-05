// Builds the Evidence Summary Word document for a topic: first the POEMs that
// match the search (grouped by supertype, newest first), then PubMed articles
// from the strategy in pubmed.js, organised by content area.
const {
  Document, Packer, Paragraph, TextRun, ExternalHyperlink, Header, Footer, PageNumber, AlignmentType,
  HeadingLevel, TabStopType
} = require('docx');
const { poemsForSummary, cutoffMonth } = require('./search');
const { htmlToParagraphs } = require('./export-poems');
const pm = require('./pubmed');

// Supertype code, the name shown in the document, and (below) the section it falls in
// by the first letters of its code: Dx = diagnosis, Tx (and TCAM) = treatment, Sc = screening
// and prevention, Px = prognosis; everything else is miscellaneous.
const SUPERTYPES = [
  ['Ad', 'Practice Administration or Health Systems'], ['DxHP', 'Diagnosis by History, Signs, Symptoms, Exam'],
  ['DxTe', 'Diagnosis by a Test'], ['DxDf', 'Differential Diagnosis'],
  ['DxRl', 'Risk Score or Clinical Decision Rule'], ['DxZA', 'Diagnosis: Signs/Symptoms Plus Tests'],
  ['EdMD', 'Medical Education'], ['EdPt', 'Patient Education'], ['EtCs', 'Causation and Etiology'],
  ['EtEp', 'Incidence or Prevalence'], ['Etrk', 'Risk Factors'], ['Px', 'Prognosis or Natural History'],
  ['PxFU', 'Follow-Up Tests and Monitoring'], ['Sc', 'Screening'], ['ScPv', 'Primary Prevention'],
  ['TxCt', 'Cost-Effectiveness or Decision Analysis'], ['TxGd', 'Treatment Guideline'],
  ['TxRx', 'Drug Therapy'], ['TxSx', 'Surgical or Procedural Therapy'],
  ['TCAM', 'Complementary/Alternative Medicine'], ['TxDt', 'Dietary Therapy, Vitamins, Supplements'],
  ['TxZA', 'Comparing Therapy Categories, Counseling, Exercise'], ['TxHm', 'Harms of Treatment']
];
// Codes are matched ignoring case (the archive has a few "TxZa" / "EtRk").
const SUPERTYPE_INDEX = new Map(SUPERTYPES.map(([code], i) => [code.toLowerCase(), i]));
const UNSPECIFIED = 9999;

const SECTIONS = ['DIAGNOSIS', 'TREATMENT', 'SCREENING AND PREVENTION', 'PROGNOSIS', 'MISCELLANEOUS'];
function sectionOf(code) {
  const c = String(code || '').toLowerCase();
  if (c.startsWith('dx')) return 'DIAGNOSIS';
  if (c.startsWith('tx') || c === 'tcam') return 'TREATMENT'; // TCAM = complementary/alternative therapy
  if (c.startsWith('sc')) return 'SCREENING AND PREVENTION';
  if (c.startsWith('px')) return 'PROGNOSIS';
  return 'MISCELLANEOUS';
}

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September',
  'October', 'November', 'December'];
const monthYear = v => {
  const m = /^(\d{4})-(\d{2})$/.exec(v || '');
  return m ? `${MONTHS[Number(m[2]) - 1]} ${m[1]}` : '';
};

// POEMs arranged as [{ heading: 'DIAGNOSIS', groups: [{ heading: 'Differential Diagnosis', items }] }]:
// sections in the order above (empty ones left out), supertypes in list order within a
// section (empty or unrecognised ones last, in MISCELLANEOUS). Within a supertype the
// POEMs stay newest first, as they arrive.
function groupBySupertype(poems) {
  const buckets = new Map(); // index in SUPERTYPES (or UNSPECIFIED) -> items
  for (const p of poems) {
    const key = String(p.supertype || '').toLowerCase();
    const idx = SUPERTYPE_INDEX.has(key) ? SUPERTYPE_INDEX.get(key) : UNSPECIFIED;
    if (!buckets.has(idx)) buckets.set(idx, []);
    buckets.get(idx).push(p);
  }
  const sections = new Map(SECTIONS.map(name => [name, []]));
  [...buckets.entries()].sort((a, b) => a[0] - b[0]).forEach(([idx, items]) => {
    const unspecified = idx === UNSPECIFIED;
    sections.get(unspecified ? 'MISCELLANEOUS' : sectionOf(SUPERTYPES[idx][0])).push({
      heading: unspecified ? 'Supertype Not Specified' : SUPERTYPES[idx][1],
      items
    });
  });
  return SECTIONS.filter(name => sections.get(name).length).map(name => ({ heading: name, groups: sections.get(name) }));
}

// ---------- docx helpers ----------
const link = (text, url) => new ExternalHyperlink({
  link: url, children: [new TextRun({ text, color: '0563C1', underline: {} })]
});
const para = (children, opts = {}) => new Paragraph({ spacing: { after: 100 }, ...opts, children });

const POEM_SIZE = 18; // 9 point

function richRuns(runs, size) {
  return runs.map(r => {
    if (r.br) return new TextRun({ break: 1 });
    const props = {
      text: r.text, bold: r.bold, italics: r.italic, superScript: r.sup, subScript: r.sub, size,
      underline: r.underline ? {} : undefined
    };
    return r.href
      ? new ExternalHyperlink({ link: r.href, children: [new TextRun({ ...props, color: '0563C1', underline: {} })] })
      : new TextRun(props);
  });
}

// One POEM in 9 point type: bold title, then Reference (with a PubMed link),
// Clinical question, Study design, Population and setting, Synopsis, Bottom-Line.
function poemEntry(p) {
  const out = [];
  const t = (text, bold) => new TextRun({ text, bold, size: POEM_SIZE });
  const field = (label, runs, extra = []) => para([t(`${label}: `, true), ...runs, ...extra],
    { spacing: { after: 60 } });
  const plainText = v => {
    const s = v === null || v === undefined ? '' : String(v).trim();
    return s ? [t(s)] : null;
  };

  const head = [t(p.title || 'Untitled POEM', true)];
  const when = monthYear(p.publication_date);
  if (when) head.push(t(`  (${when})`));
  out.push(para(head, { keepNext: true, spacing: { before: 160, after: 60 } }));

  const ref = plainText(p.reference);
  const hasLink = p.pubmed_url && /^https?:\/\//i.test(p.pubmed_url);
  if (ref || hasLink) {
    const linkRun = hasLink
      ? [t('  '), new ExternalHyperlink({ link: p.pubmed_url, children: [new TextRun({ text: 'PubMed', size: POEM_SIZE, color: '0563C1', underline: {} })] })]
      : [];
    out.push(field('Reference', ref || [], linkRun));
  }
  const question = plainText(p.clinical_question);
  if (question) out.push(field('Clinical question', question));
  const design = String(p.study_design || '').trim();
  const loe = String(p.loe || '').trim();
  if (design) out.push(field('Study design', [t(loe ? `${design} (LOE ${loe})` : design)]));
  const setting = plainText(p.setting);
  if (setting) out.push(field('Population and setting', setting));

  for (const [label, html] of [['Synopsis', p.synopsis], ['Bottom-Line', p.bottom_line]]) {
    htmlToParagraphs(html).forEach((runs, i) => {
      const lead = i === 0 ? [t(`${label}: `, true)] : [];
      out.push(para([...lead, ...richRuns(runs, POEM_SIZE)], { spacing: { after: 60 } }));
    });
  }
  return out;
}

function articleEntry(a, n) {
  const refRuns = pm.amaRuns(a).map(r => new TextRun({ text: r.text, italics: r.italic }));
  const links = [new TextRun({ text: `PubMed ID: ${a.pmid}   ` }), link('Abstract', pm.pubmedUrl(a.pmid))];
  if (a.pmcid) links.push(new TextRun({ text: '   ' }), link('Full text', pm.pmcUrl(a.pmcid)));
  return [
    new Paragraph({
      spacing: { before: 100, after: 20 }, keepNext: true, indent: { left: 360, hanging: 360 },
      tabStops: [{ type: TabStopType.LEFT, position: 360 }],
      children: [new TextRun({ text: `${n}.\t` }), ...refRuns]
    }),
    new Paragraph({ spacing: { after: 100 }, indent: { left: 360 }, children: links })
  ];
}

// ---------- main ----------
// params: { q, years (number or null), age (key), content ('all' or a content-area key), journals (boolean) }
async function generateEvidenceSummary({ q, years, pubmedYears, age, content, journals }) {
  const poemResult = poemsForSummary({ q, years });
  if (poemResult.error) return { error: poemResult.error };

  const ageGroup = pm.findBy(pm.AGE_GROUPS, age) || pm.AGE_GROUPS[0];
  const areas = content === 'all' ? pm.CONTENT_AREAS : [pm.findBy(pm.CONTENT_AREAS, content)].filter(Boolean);
  if (!areas.length) return { error: 'Choose a content area.' };
  const since = cutoffMonth(pubmedYears);

  const sections = [];
  for (const area of areas) {
    const term = pm.buildQuery(q, ageGroup.key, area, !!journals);
    const section = { area, term, count: 0, articles: [], error: null };
    try {
      const found = await pm.searchPubMed(term, since);
      section.count = found.count;
      section.articles = await pm.fetchArticles(found.ids);
    } catch (err) {
      section.error = err.message;
    }
    sections.push(section);
  }

  const children = [];
  const topic = String(q).replace(/\s+/g, ' ').trim();
  const span = n => (n ? `last ${n === 1 ? 'year' : n + ' years'}` : 'no limit');
  children.push(new Paragraph({ heading: HeadingLevel.TITLE,
    children: [new TextRun({ text: `Evidence Summary: ${topic}`, bold: true })] }));
  children.push(para([new TextRun({ text: 'Prepared: ', bold: true }),
    new TextRun({ text: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) })]));
  children.push(para([new TextRun({ text: 'POEMs time span: ', bold: true }), new TextRun({ text: span(years) })]));
  children.push(para([
    new TextRun({ text: 'PubMed limits: ', bold: true }),
    new TextRun({ text: `${ageGroup.label}; ${content === 'all' ? 'all content areas' : areas[0].label}; time span: ${span(pubmedYears)}; ${journals ? 'high yield journals only' : 'all journals'}` })
  ], { spacing: { after: 240 } }));

  // 1. POEMs
  const poems = poemResult.poems;
  children.push(new Paragraph({ heading: HeadingLevel.HEADING_1,
    children: [new TextRun({ text: `POEMs (${poemResult.total.toLocaleString()})`, bold: true })] }));
  if (!poems.length) {
    children.push(para([new TextRun({ text: 'No POEMs matched this search.', italics: true })]));
  } else {
    if (poemResult.total > poems.length) {
      children.push(para([new TextRun({ text: `Showing the ${poems.length} most recent of ${poemResult.total.toLocaleString()} matching POEMs.`, italics: true })]));
    }
    for (const section of groupBySupertype(poems)) {
      children.push(new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun({ text: section.heading, bold: true })] }));
      for (const group of section.groups) {
        children.push(new Paragraph({ heading: HeadingLevel.HEADING_3,
          children: [new TextRun({ text: `${group.heading} (${group.items.length})`, bold: true })] }));
        group.items.forEach(p => children.push(...poemEntry(p)));
      }
    }
  }

  // 2. PubMed
  const yearsSearched = pubmedYears ? `last ${pubmedYears} year${pubmedYears === 1 ? '' : 's'}` : 'no time limit';
  children.push(new Paragraph({ heading: HeadingLevel.HEADING_1, pageBreakBefore: true,
    children: [new TextRun({ text: `PubMed literature (${yearsSearched})`, bold: true })] }));
  const limits = [];
  if (ageGroup.key !== 'all') limits.push(`Age group: ${ageGroup.label}`);
  if (content !== 'all') limits.push(`Content area: ${areas[0].label}`);
  if (journals) limits.push('High yield journals only');
  if (limits.length) children.push(para([new TextRun({ text: limits.join('; '), bold: true })]));
  children.push(para([new TextRun({ text: `Articles from PubMed, most recent first (up to ${pm.MAX_PER_CATEGORY} per content area).`, italics: true })]));
  for (const s of sections) {
    const shown = s.articles.length;
    const counts = s.error ? '' : ` (${shown === s.count ? shown : `${shown} of ${s.count.toLocaleString()}`})`;
    children.push(new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun({ text: `${s.area.label}${counts}`, bold: true })] }));
    if (journals && s.area.ignoreJournalLimit) {
      children.push(para([new TextRun({ text: 'The high yield journal limit does not apply to this search.', italics: true })]));
    }
    if (s.error) {
      children.push(para([new TextRun({ text: `This search could not be completed: ${s.error}`, italics: true })]));
      continue;
    }
    if (!shown) {
      children.push(para([new TextRun({ text: 'No articles found.', italics: true })]));
    } else {
      s.articles.forEach((a, i) => children.push(...articleEntry(a, i + 1)));
    }
    children.push(para([link('View this search in PubMed', pm.pubmedSearchUrl(s.term))], { spacing: { before: 60, after: 160 } }));
  }

  const doc = new Document({
    creator: 'InfoRetriever',
    title: `Evidence Summary: ${topic}`,
    styles: {
      default: { document: { run: { font: 'Arial', size: 20 } } },
      paragraphStyles: [
        { id: 'Title', name: 'Title', basedOn: 'Normal', next: 'Normal', quickFormat: true,
          run: { font: 'Arial', size: 32, bold: true, color: '000000' }, paragraph: { spacing: { after: 160 } } },
        { id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true,
          run: { font: 'Arial', size: 26, bold: true, color: '000000' },
          paragraph: { spacing: { before: 240, after: 120 }, keepNext: true, outlineLevel: 0 } },
        { id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickFormat: true,
          run: { font: 'Arial', size: 22, bold: true, color: '000000' },
          paragraph: { spacing: { before: 200, after: 80 }, keepNext: true, outlineLevel: 1 } },
        { id: 'Heading3', name: 'Heading 3', basedOn: 'Normal', next: 'Normal', quickFormat: true,
          run: { font: 'Arial', size: 20, bold: true, color: '000000' },
          paragraph: { spacing: { before: 160, after: 40 }, keepNext: true, outlineLevel: 2 } }
      ]
    },
    sections: [{
      properties: { page: { size: { width: 12240, height: 15840 }, margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 } } },
      headers: { default: new Header({ children: [new Paragraph({ children: [new TextRun({
        text: `Evidence Summary — ${topic.length > 90 ? topic.slice(0, 90) + '…' : topic}`, size: 16, color: '666666' })] })] }) },
      footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [
        new TextRun({ text: 'Page ', size: 16, color: '666666' }),
        new TextRun({ children: [PageNumber.CURRENT], size: 16, color: '666666' }),
        new TextRun({ text: ' of ', size: 16, color: '666666' }),
        new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 16, color: '666666' })
      ] })] }) },
      children
    }]
  });
  return { buffer: await Packer.toBuffer(doc), sections, poemTotal: poemResult.total };
}

module.exports = { generateEvidenceSummary, groupBySupertype, SUPERTYPES, SECTIONS };
