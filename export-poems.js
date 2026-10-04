// Builds printable versions of a set of POEMs: a Word document (.docx) and a
// print-ready HTML page (which the browser turns into a PDF via Print > Save as
// PDF). Both come from the same description of each POEM, so they match.
const {
  Document, Packer, Paragraph, TextRun, ExternalHyperlink, Header, Footer, PageNumber, AlignmentType, HeadingLevel
} = require('docx');
const { escapeHtml, decodeEntities } = require('./poem-model');

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September',
  'October', 'November', 'December'];
const SAFE_HREF = /^(https?:\/\/|mailto:)[^\s"'<>]*$/i;

function monthYear(value) {
  const m = /^(\d{4})-(\d{2})$/.exec(value || '');
  return m ? `${MONTHS[Number(m[2]) - 1]} ${m[1]}` : '';
}

// ---------- Stored HTML (bold, italic, underline, sub/superscript, links, paragraphs) -> paragraphs of runs ----------
// A run is { text, bold, italic, underline, sup, sub, href } or { br: true }.
function htmlToParagraphs(html) {
  const tagRe = /<(\/?)([a-zA-Z][a-zA-Z0-9]*)\b([^>]*)>/g;
  const paras = [];
  let cur = [];
  const open = { b: 0, i: 0, u: 0, sup: 0, sub: 0 };
  const hrefs = [];
  const flush = () => { if (cur.length) paras.push(cur); cur = []; };
  const text = (t) => {
    t = decodeEntities(t.replace(/\s*\n\s*/g, ' '));
    if (!t) return;
    cur.push({
      text: t, bold: open.b > 0, italic: open.i > 0, underline: open.u > 0, sup: open.sup > 0, sub: open.sub > 0,
      href: hrefs.length ? hrefs[hrefs.length - 1] : null
    });
  };
  const bump = (key, closing) => { open[key] = Math.max(0, open[key] + (closing ? -1 : 1)); };

  const src = String(html || '');
  let last = 0, m;
  while ((m = tagRe.exec(src)) !== null) {
    text(src.slice(last, m.index));
    last = tagRe.lastIndex;
    const closing = !!m[1];
    const tag = m[2].toLowerCase();
    if (tag === 'p') flush();
    else if (tag === 'br') cur.push({ br: true });
    else if (tag === 'b' || tag === 'strong') bump('b', closing);
    else if (tag === 'i' || tag === 'em') bump('i', closing);
    else if (tag === 'u') bump('u', closing);
    else if (tag === 'sup') bump('sup', closing);
    else if (tag === 'sub') bump('sub', closing);
    else if (tag === 'a') {
      if (closing) hrefs.pop();
      else {
        const h = /href\s*=\s*"([^"]*)"/i.exec(m[3]);
        const url = h ? decodeEntities(h[1]) : '';
        hrefs.push(SAFE_HREF.test(url) ? url : null);
      }
    }
  }
  text(src.slice(last));
  flush();

  return paras
    .map(trimParagraph)
    .filter(p => p.some(r => r.text && r.text.trim()));
}

function trimParagraph(runs) {
  const out = runs.slice();
  while (out.length && out[0].br) out.shift();
  while (out.length && out[out.length - 1].br) out.pop();
  if (out.length && out[0].text) out[0] = { ...out[0], text: out[0].text.replace(/^\s+/, '') };
  const i = out.length - 1;
  if (i >= 0 && out[i].text) out[i] = { ...out[i], text: out[i].text.replace(/\s+$/, '') };
  return out;
}

const plain = (text) => [[{ text }]];

// ---------- One POEM -> { title, byline, sections } ----------
// A section is { label, paragraphs: [runs, ...] }; the label is shown in bold
// at the start of the first paragraph.
function describePoem(row) {
  const byline = [];
  if (row.poet) byline.push(['POET', row.poet]);
  if (monthYear(row.publication_date)) byline.push(['Publication date', monthYear(row.publication_date)]);
  if (row.poem_id) byline.push(['POEM number', String(row.poem_id)]);

  const sections = [];
  const add = (label, paragraphs) => { if (paragraphs && paragraphs.length) sections.push({ label, paragraphs }); };
  const simple = (label, value) => {
    const t = value === null || value === undefined ? '' : String(value).trim();
    if (t) add(label, plain(t));
  };

  simple('Reference', row.reference);
  simple('Clinical question', row.clinical_question);
  simple('Allocation', row.allocation);
  simple('Funding', row.funding);
  // The level of evidence goes in parentheses after the study design.
  const design = String(row.study_design || '').trim();
  const loe = String(row.loe || '').trim();
  if (design) simple('Study design', loe ? `${design} (LOE ${loe})` : design);
  else simple('Level of evidence', loe);
  simple('Population and setting', row.setting);
  add('Synopsis', htmlToParagraphs(row.synopsis));
  add('Bottom-Line', htmlToParagraphs(row.bottom_line));

  const pmid = row.pubmed_id && String(row.pubmed_id).trim();
  const url = row.pubmed_url && SAFE_HREF.test(row.pubmed_url) ? row.pubmed_url : null;
  if (pmid || url) {
    const runs = [];
    if (pmid) runs.push({ text: pmid });
    if (url) runs.push({ text: pmid ? '  ' : '' }, { text: url, href: url });
    add('PubMed ID', [runs]);
  }
  return { title: row.title || 'Untitled POEM', byline, sections };
}

// ---------- Word ----------
function docxRuns(runs, base = {}) {
  return runs.map(r => {
    if (r.br) return new TextRun({ break: 1 });
    const props = {
      text: r.text, bold: base.bold || r.bold, italics: r.italic, superScript: r.sup, subScript: r.sub,
      underline: r.underline ? {} : undefined
    };
    if (r.href) {
      return new ExternalHyperlink({
        link: r.href,
        children: [new TextRun({ ...props, color: '0563C1', underline: {} })]
      });
    }
    return new TextRun(props);
  });
}

async function buildDocx(rows, meta = {}) {
  const children = [];
  rows.forEach((row, index) => {
    const poem = describePoem(row);
    children.push(new Paragraph({
      heading: HeadingLevel.HEADING_1,
      pageBreakBefore: index > 0,
      children: [new TextRun({ text: poem.title, bold: true })]
    }));
    if (poem.byline.length) {
      const runs = [];
      poem.byline.forEach(([label, value], i) => {
        if (i > 0) runs.push(new TextRun({ text: '    ' }));
        runs.push(new TextRun({ text: `${label}: `, bold: true }), new TextRun({ text: value }));
      });
      children.push(new Paragraph({ spacing: { after: 200 }, children: runs }));
    }
    for (const section of poem.sections) {
      section.paragraphs.forEach((runs, i) => {
        const lead = i === 0 ? [new TextRun({ text: `${section.label}: `, bold: true })] : [];
        children.push(new Paragraph({ spacing: { after: 140 }, children: [...lead, ...docxRuns(runs)] }));
      });
    }
  });

  const headerText = meta.description || 'POEMs';
  const doc = new Document({
    creator: 'POEM Generator',
    title: headerText,
    styles: {
      default: { document: { run: { font: 'Arial', size: 20 } } },
      paragraphStyles: [{
        id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { font: 'Arial', size: 24, bold: true, color: '000000' },
        paragraph: { spacing: { before: 0, after: 120 }, keepNext: true, outlineLevel: 0 }
      }]
    },
    sections: [{
      properties: { page: { size: { width: 12240, height: 15840 }, margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 } } },
      headers: { default: new Header({ children: [new Paragraph({ children: [new TextRun({ text: headerText, size: 16, color: '666666' })] })] }) },
      footers: {
        default: new Footer({
          children: [new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({ text: 'Page ', size: 16, color: '666666' }),
              new TextRun({ children: [PageNumber.CURRENT], size: 16, color: '666666' }),
              new TextRun({ text: ' of ', size: 16, color: '666666' }),
              new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 16, color: '666666' })
            ]
          })]
        })
      },
      children
    }]
  });
  return Packer.toBuffer(doc);
}

// ---------- Print-ready HTML (for "Save as PDF") ----------
function runsToHtml(runs) {
  return runs.map(r => {
    if (r.br) return '<br>';
    let h = escapeHtml(r.text);
    if (r.sup) h = `<sup>${h}</sup>`;
    if (r.sub) h = `<sub>${h}</sub>`;
    if (r.underline) h = `<u>${h}</u>`;
    if (r.italic) h = `<i>${h}</i>`;
    if (r.bold) h = `<b>${h}</b>`;
    if (r.href) h = `<a href="${escapeHtml(r.href).replace(/"/g, '&quot;')}">${h}</a>`;
    return h;
  }).join('');
}

function buildPrintHtml(rows, meta = {}) {
  const poems = rows.map(row => {
    const poem = describePoem(row);
    const byline = poem.byline.map(([l, v]) => `<b>${escapeHtml(l)}:</b> ${escapeHtml(v)}`).join('&nbsp;&nbsp;&nbsp;&nbsp;');
    const body = poem.sections.map(sec => sec.paragraphs.map((runs, i) =>
      `<p>${i === 0 ? `<b>${escapeHtml(sec.label)}:</b> ` : ''}${runsToHtml(runs)}</p>`).join('')).join('\n');
    return `<section class="poem"><h1>${escapeHtml(poem.title)}</h1>${byline ? `<p class="byline">${byline}</p>` : ''}\n${body}</section>`;
  }).join('\n');

  const description = escapeHtml(meta.description || 'POEMs');
  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><title>${description}</title>
<style>
  @page { margin: 0.9in; }
  body { font-family: Arial, Helvetica, sans-serif; font-size: 10pt; line-height: 1.4; color: #000; margin: 0; }
  .runhead { font-size: 8pt; color: #666; margin: 0 0 14pt; }
  .poem { page-break-after: always; }
  .poem:last-of-type { page-break-after: auto; }
  h1 { font-size: 12pt; font-weight: bold; margin: 0 0 6pt; page-break-after: avoid; }
  p { margin: 0 0 7pt; }
  .byline { margin-bottom: 12pt; }
  a { color: #0563c1; }
</style></head><body>
<p class="runhead">${description}</p>
${poems}
</body></html>`;
}

module.exports = { buildDocx, buildPrintHtml, htmlToParagraphs, describePoem };
