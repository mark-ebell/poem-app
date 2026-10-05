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

const SUPERTYPES = [
  ['Ad', 'Practice administration or health systems'], ['DxHP', 'Diagnosis by history, signs, symptoms, exam'],
  ['DxTe', 'Diagnosis by a test'], ['DxDf', 'Differential diagnosis'],
  ['DxRl', 'Risk score or clinical decision rule'], ['DxZA', 'Diagnosis: signs/symptoms plus tests'],
  ['EdMD', 'Medical education'], ['EdPt', 'Patient education'], ['EtCs', 'Causation and etiology'],
  ['EtEp', 'Incidence or prevalence'], ['Etrk', 'Risk factors'], ['Px', 'Prognosis or natural history'],
  ['PxFU', 'Follow-up tests and monitoring'], ['Sc', 'Screening'], ['ScPv', 'Primary prevention'],
  ['TxCt', 'Cost-effectiveness or decision analysis'], ['TxGd', 'Treatment guideline'],
  ['TxRx', 'Drug therapy'], ['TxSx', 'Surgical or procedural therapy'],
  ['TCAM', 'Complementary/alternative medicine'], ['TxDt', 'Dietary therapy, vitamins, supplements'],
  ['TxZA', 'Comparing therapy categories, counseling, exercise'], ['TxHm', 'Harms of treatment']
];
// Codes are matched ignoring case (the archive has a few "TxZa" / "EtRk").
const SUPERTYPE_INDEX = new Map(SUPERTYPES.map(([code], i) => [code.toLowerCase(), i]));
const UNSPECIFIED = 9999;

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September',
  'October', 'November', 'December'];
const monthYear = v => {
  const m = /^(\d{4})-(\d{2})$/.exec(v || '');
  return m ? `${MONTHS[Number(m[2]) - 1]} ${m[1]}` : '';
};

// POEMs by supertype, in the order of the list above (empty or unrecognised
// ones last); within a group they stay newest first, as they arrive.
function groupBySupertype(poems) {
  const groups = new Map();
  for (const p of poems) {
    const key = String(p.supertype || '').toLowerCase();
    const idx = SUPERTYPE_INDEX.has(key) ? SUPERTYPE_INDEX.get(key) : UNSPECIFIED;
    if (!groups.has(idx)) groups.set(idx, []);
    groups.get(idx).push(p);
  }
  return [...groups.entries()].sort((a, b) => a[0] - b[0]).map(([idx, items]) => ({
    heading: idx === UNSPECIFIED ? 'Supertype not specified' : `${SUPERTYPES[idx][0]} — ${SUPERTYPES[idx][1]}`,
    items
  }));
}

// ---------- docx helpers ----------
const link = (text, url) => new ExternalHyperlink({
  link: url, children: [new TextRun({ text, color: '0563C1', underline: {} })]
});
const para = (children, opts = {}) => new Paragraph({ spacing: { after: 100 }, ...opts, children });

function richRuns(runs) {
  return runs.map(r => {
    if (r.br) return new TextRun({ break: 1 });
    const props = {
      text: r.text, bold: r.bold, italics: r.italic, superScript: r.sup, subScript: r.sub,
      underline: r.underline ? {} : undefined
    };
    return r.href
      ? new ExternalHyperlink({ link: r.href, children: [new TextRun({ ...props, color: '0563C1', underline: {} })] })
      : new TextRun(props);
  });
}

function poemEntry(p) {
  const out = [];
  const head = [new TextRun({ text: p.title || 'Untitled POEM', bold: true })];
  const when = monthYear(p.publication_date);
  if (when) head.push(new TextRun({ text: `  (${when})` }));
  if (p.pubmed_url && /^https?:\/\//i.test(p.pubmed_url)) head.push(new TextRun({ text: '  ' }), link('PubMed', p.pubmed_url));
  out.push(para(head, { keepNext: true, spacing: { before: 100, after: 40 } }));
  htmlToParagraphs(p.bottom_line).forEach(runs => out.push(para(richRuns(runs), { indent: { left: 360 } })));
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
async function generateEvidenceSummary({ q, years, age, content, journals }) {
  const poemResult = poemsForSummary({ q, years });
  if (poemResult.error) return { error: poemResult.error };

  const ageGroup = pm.findBy(pm.AGE_GROUPS, age) || pm.AGE_GROUPS[0];
  const areas = content === 'all' ? pm.CONTENT_AREAS : [pm.findBy(pm.CONTENT_AREAS, content)].filter(Boolean);
  if (!areas.length) return { error: 'Choose a content area.' };
  const since = cutoffMonth(years);

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
  const rangeText = years ? `last ${years === 1 ? 'year' : years + ' years'}` : 'entire database';
  children.push(new Paragraph({ heading: HeadingLevel.TITLE, children: [new TextRun({ text: 'Evidence Summary', bold: true })] }));
  children.push(para([new TextRun({ text: 'Topic: ', bold: true }), new TextRun({ text: topic })]));
  children.push(para([new TextRun({ text: 'Prepared: ', bold: true }),
    new TextRun({ text: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) })]));
  children.push(para([new TextRun({ text: 'Time span: ', bold: true }), new TextRun({ text: rangeText })]));
  children.push(para([
    new TextRun({ text: 'PubMed limits: ', bold: true }),
    new TextRun({ text: `${ageGroup.label}; ${content === 'all' ? 'all content areas' : areas[0].label}; ${journals ? 'high yield journals only' : 'all journals'}` })
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
    for (const group of groupBySupertype(poems)) {
      children.push(new Paragraph({ heading: HeadingLevel.HEADING_2,
        children: [new TextRun({ text: `${group.heading} (${group.items.length})`, bold: true })] }));
      group.items.forEach(p => children.push(...poemEntry(p)));
    }
  }

  // 2. PubMed
  children.push(new Paragraph({ heading: HeadingLevel.HEADING_1, pageBreakBefore: true,
    children: [new TextRun({ text: 'PubMed literature', bold: true })] }));
  children.push(para([new TextRun({ text: `Articles from PubMed, most recent first (up to ${pm.MAX_PER_CATEGORY} per content area).`, italics: true })]));
  for (const s of sections) {
    const shown = s.articles.length;
    const counts = s.error ? '' : ` (${shown === s.count ? shown : `${shown} of ${s.count.toLocaleString()}`})`;
    children.push(new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun({ text: `${s.area.label}${counts}`, bold: true })] }));
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
    creator: 'POEM Generator',
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
          paragraph: { spacing: { before: 200, after: 80 }, keepNext: true, outlineLevel: 1 } }
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

module.exports = { generateEvidenceSummary, groupBySupertype, SUPERTYPES };
