// Builds printable versions of a set of POEMs: a Word document (.docx) and a
// print-ready HTML page (which the browser turns into a PDF via Print > Save as
// PDF). Both come from the same description of each POEM, so they match.
const {
  Document, Packer, Paragraph, TextRun, ExternalHyperlink, Header, Footer, PageNumber, AlignmentType, HeadingLevel,
  Table, TableRow, TableCell, WidthType, BorderStyle, ShadingType
} = require('docx');
const { escapeHtml, decodeEntities, poetFullName } = require('./poem-model');

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September',
  'October', 'November', 'December'];
const SAFE_HREF = /^(https?:\/\/|mailto:)[^\s"'<>]*$/i;

// Shown at the end of every POEM, on screen and in every printout.
const DISCLAIMER = 'POEMs summarize published research to support, not replace, clinical judgment. They are not medical advice for any individual patient. Always consider the original research and the circumstances of each patient.';

function monthYear(value) {
  const m = /^(\d{4})-(\d{2})$/.exec(value || '');
  return m ? `${MONTHS[Number(m[2]) - 1]} ${m[1]}` : '';
}

// ---------- Stored HTML (bold, italic, underline, sub/superscript, links, paragraphs, tables) -> paragraphs of runs ----------
// A run is { text, bold, italic, underline, sup, sub, href } or { br: true }. A paragraph is an
// array of runs; a table (Synopsis only) is { table: rows }, each row an array of cells
// { header, runs }.
const isTable = p => !Array.isArray(p) && !!p.table;

function htmlToParagraphs(html) {
  const tagRe = /<(\/?)([a-zA-Z][a-zA-Z0-9]*)\b([^>]*)>/g;
  const paras = [];
  let cur = [];
  const open = { b: 0, i: 0, u: 0, sup: 0, sub: 0 };
  const hrefs = [];
  let table = null, row = null, cell = null; // the table being read
  const flush = () => { if (cur.length) paras.push(cur); cur = []; };
  const endCell = () => { if (cell && row) row.push({ header: cell.header, runs: trimParagraph(cur) }); cell = null; cur = []; };
  const endRow = () => { endCell(); if (row && row.length && table) table.push(row); row = null; };
  const text = (t) => {
    t = decodeEntities(t.replace(/\s*\n\s*/g, ' '));
    if (!t) return;
    if (table && !cell) return; // whitespace between cells
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
    if (tag === 'table') {
      if (!closing && !table) { flush(); table = []; }
      else if (closing && table) { endRow(); if (table.length) paras.push({ table }); table = null; cur = []; }
    } else if (table && tag === 'tr') { endRow(); if (!closing) row = []; }
    else if (table && (tag === 'td' || tag === 'th')) {
      endCell();
      if (!closing) { if (!row) row = []; cell = { header: tag === 'th' }; cur = []; }
    }
    else if (tag === 'p') { if (!table) flush(); else if (cell && cur.length) cur.push({ br: true }); }
    else if (tag === 'br') { if (!table || cell) cur.push({ br: true }); }
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
  if (table) { endRow(); if (table.length) paras.push({ table }); cur = []; }
  flush();

  return paras
    .map(p => (isTable(p) ? p : trimParagraph(p)))
    .filter(p => isTable(p) || p.some(r => r.text && r.text.trim()));
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

function doiRuns(text) {
  const runs = [];
  let at = 0;
  for (const m of text.matchAll(/(?:https?:\/\/(?:dx\.)?doi\.org\/|\bdoi:\s*)(10\.\d{4,9}\/[^\s"<>]+?)(?=[.,;)]*(?:\s|$))/gi)) {
    if (m.index > at) runs.push({ text: text.slice(at, m.index) });
    const href = `https://doi.org/${m[1]}`;
    runs.push(SAFE_HREF.test(href) ? { text: m[0], href } : { text: m[0] });
    at = m.index + m[0].length;
  }
  if (at < text.length) runs.push({ text: text.slice(at) });
  return runs;
}

// ---------- One POEM -> { title, byline, sections } ----------
// A section is { label, paragraphs: [runs, ...] }; the label is shown in bold
// at the start of the first paragraph. Readers' printouts and the daily email leave out the
// POET and POEM number. popup (the pop-up, for editors and readers): the POET goes after the
// Bottom-Line, and the POEM number ("POEM #") on the PubMed ID line, instead of in the byline.
function describePoem(row, { reader = false, popup = false } = {}) {
  const byline = [];
  if (row.poet && !reader && !popup) byline.push(['POET', poetFullName(row.poet)]);
  if (monthYear(row.publication_date)) byline.push(['Publication date', monthYear(row.publication_date)]);
  if (row.poem_id && !reader && !popup) byline.push(['POEM number', String(row.poem_id)]);

  const sections = [];
  const add = (label, paragraphs) => { if (paragraphs && paragraphs.length) sections.push({ label, paragraphs }); };
  const simple = (label, value) => {
    const t = value === null || value === undefined ? '' : String(value).trim();
    if (t) add(label, plain(t));
  };

  // A DOI in the reference ("https://doi.org/10...", or "doi:10..." in older POEMs) is a link.
  const ref = String(row.reference || '').trim();
  if (ref) add('Reference', [doiRuns(ref)]);
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
  if (popup && row.poet) simple('POET', poetFullName(row.poet));

  const pmid = row.pubmed_id && String(row.pubmed_id).trim();
  const url = row.pubmed_url && SAFE_HREF.test(row.pubmed_url) ? row.pubmed_url : null;
  const poemNum = popup && row.poem_id ? String(row.poem_id) : '';
  if (pmid || url) {
    const runs = [];
    if (pmid) runs.push({ text: pmid });
    if (url) runs.push({ text: pmid ? '  ' : '' }, { text: url, href: url });
    if (poemNum) runs.push({ text: '\u00a0\u00a0\u00a0\u00a0' }, { text: 'POEM #:', bold: true }, { text: ` ${poemNum}` });
    add('PubMed ID', [runs]);
  } else if (poemNum) simple('POEM #', poemNum);
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

// A Synopsis table in Word: thin grey borders, the header cells shaded and bold. width is the
// width of the text on the page, in twentieths of a point (6.5 inches on Letter with 1-inch margins).
// runsFn turns a cell's runs into Word runs (each document has its own type size).
function docxTable(table, runsFn = docxRuns, width = 9360) {
  const cols = Math.max(...table.map(r => r.length));
  const colWidth = Math.floor(width / cols);
  const border = { style: BorderStyle.SINGLE, size: 4, color: '999999' };
  const borders = { top: border, bottom: border, left: border, right: border };
  return new Table({
    width: { size: colWidth * cols, type: WidthType.DXA },
    columnWidths: Array(cols).fill(colWidth),
    rows: table.map(row => new TableRow({
      tableHeader: row.every(c => c.header),
      children: Array.from({ length: cols }, (_, i) => {
        const cell = row[i] || { header: false, runs: [] };
        return new TableCell({
          width: { size: colWidth, type: WidthType.DXA },
          borders,
          margins: { top: 40, bottom: 40, left: 80, right: 80 },
          shading: cell.header ? { type: ShadingType.CLEAR, color: 'auto', fill: 'EEEEEE' } : undefined,
          children: [new Paragraph({ children: runsFn(cell.runs, { bold: cell.header }) })]
        });
      })
    }))
  });
}

async function buildDocx(rows, meta = {}) {
  const children = [];
  // An optional document title (e.g. the Browse tab's month printout), above the first POEM.
  if (meta.title) {
    children.push(new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 360 },
      children: [new TextRun({ text: meta.title, bold: true, size: 32 })]
    }));
  }
  rows.forEach((row, index) => {
    const poem = describePoem(row, meta);
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
        if (isTable(runs)) {
          if (lead.length) children.push(new Paragraph({ spacing: { after: 80 }, children: lead }));
          children.push(docxTable(runs.table), new Paragraph({ spacing: { after: 140 }, children: [] }));
          return;
        }
        children.push(new Paragraph({ spacing: { after: 140 }, children: [...lead, ...docxRuns(runs)] }));
      });
    }
    if (meta.internal) {
      // The Browse tab's month printout is internal: no disclaimer, and room for the editors' comments.
      children.push(new Paragraph({ spacing: { before: 240 }, children: [new TextRun({ text: 'Missouri comments:', bold: true })] }));
      for (let i = 0; i < 3; i++) children.push(new Paragraph({ children: [] }));
    } else {
      children.push(new Paragraph({ spacing: { before: 120, after: 140 }, children: [new TextRun({ text: DISCLAIMER, italics: true })] }));
    }
  });

  const headerText = meta.description || 'POEMs';
  const doc = new Document({
    creator: 'InfoRetriever',
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

// A Synopsis table in HTML. style: 'email' writes the borders and padding on each cell, as
// email programs ignore style sheets; otherwise the page's style sheet draws it (class poem-table).
function tableToHtml(table, { style } = {}) {
  const cols = Math.max(...table.map(r => r.length));
  const email = style === 'email';
  const tableAttr = email
    ? ' cellpadding="0" cellspacing="0" style="border-collapse: collapse; margin: 4px 0 10px; font-size: 14px; line-height: 1.4; max-width: 100%;"'
    : ' class="poem-table"';
  const cellStyle = header => (email
    ? ` style="border: 1px solid #c7ccd3; padding: 4px 6px; vertical-align: top; text-align: left; overflow-wrap: anywhere; word-break: break-word;${header ? ' background: #eef1f5; font-weight: bold;' : ''}"`
    : '');
  const rows = table.map(row => '<tr>' + Array.from({ length: cols }, (_, i) => {
    const cell = row[i] || { header: false, runs: [] };
    const tag = cell.header ? 'th' : 'td';
    return `<${tag}${cellStyle(cell.header)}>${runsToHtml(cell.runs)}</${tag}>`;
  }).join('') + '</tr>').join('');
  // On a phone, a table wider than the screen scrolls sideways on its own, so the rest of the
  // POEM keeps to the screen's width. Email programs can't be relied on to scroll, so there the
  // cells' text wraps (even within a long number) to fit the screen instead.
  if (email) return `<table${tableAttr}>${rows}</table>`;
  return `<div class="poem-table-wrap"><table${tableAttr}>${rows}</table></div>`;
}

// A field's paragraphs with their text run together (line breaks become spaces), as the
// readers' pop-up and the daily email show them. A table stays a table, between the text.
// Returns blocks: { html } for a stretch of text, { table } for a table's HTML.
function flowBlocks(paragraphs, tableOpts) {
  const blocks = [];
  let text = [];
  const flush = () => {
    if (text.length) blocks.push({ html: runsToHtml(text) });
    text = [];
  };
  for (const p of paragraphs) {
    if (isTable(p)) { flush(); blocks.push({ table: tableToHtml(p.table, tableOpts) }); continue; }
    if (text.length) text.push({ text: ' ' });
    text.push(...p.map(r => (r.br ? { text: ' ' } : r)));
  }
  flush();
  return blocks;
}

// The inside of one POEM: bold title, byline, then each field with a bold label.
function poemInnerHtml(row, opts) {
  const poem = describePoem(row, opts);
  const byline = poem.byline.map(([l, v]) => `<b>${escapeHtml(l)}:</b> ${escapeHtml(v)}`).join('&nbsp;&nbsp;&nbsp;&nbsp;');
  const body = poem.sections.map(sec => sec.paragraphs.map((runs, i) => {
    const lead = i === 0 ? `<b>${escapeHtml(sec.label)}:</b> ` : '';
    if (isTable(runs)) return `${lead ? `<p>${lead}</p>` : ''}${tableToHtml(runs.table)}`;
    return `<p>${lead}${runsToHtml(runs)}</p>`;
  }).join('')).join('\n');
  return `<h1>${escapeHtml(poem.title)}</h1>${byline ? `<p class="byline">${byline}</p>` : ''}\n${body}\n<p class="disclaimer"><i>${escapeHtml(DISCLAIMER)}</i></p>`;
}

// One POEM for on-screen viewing (the pop-up on the Search tab).
function buildPoemFragment(row) {
  return `<article class="poem-view">${poemInnerHtml(row, { popup: true })}</article>`;
}

// The readers' pop-up: bold title and field headings, and no hard line breaks:
// line breaks inside a field become spaces and a field's paragraphs run together,
// so the text simply wraps to the window.
function buildReaderPoemFragment(row) {
  const poem = describePoem(row, { reader: true, popup: true });
  const byline = poem.byline.map(([l, v]) => `<b>${escapeHtml(l)}:</b> ${escapeHtml(v)}`).join(' ');
  const body = poem.sections.map(sec => {
    const blocks = flowBlocks(sec.paragraphs);
    if (!blocks[0] || !blocks[0].html) blocks.unshift({ html: '' });
    return blocks.map((b, i) => (b.table
      ? b.table
      : `<p>${i === 0 ? `<b>${escapeHtml(sec.label)}:</b> ` : ''}${b.html}</p>`)).join('');
  }).join('');
  return `<article class="poem-view reader-view"><h1>${escapeHtml(poem.title)}</h1>${byline ? `<p class="byline">${byline}</p>` : ''}${body}<p class="disclaimer"><i>${escapeHtml(DISCLAIMER)}</i></p></article>`;
}

function buildPrintHtml(rows, meta = {}) {
  const poems = rows.map(row => `<section class="poem">${poemInnerHtml(row, meta)}</section>`).join('\n');

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
  .disclaimer { margin-top: 10pt; }
  a { color: #0563c1; }
  .poem-table { border-collapse: collapse; margin: 0 0 9pt; page-break-inside: avoid; }
  @media screen { .poem-table-wrap { overflow-x: auto; } }
  .poem-table th, .poem-table td { border: 0.5pt solid #999; padding: 2pt 5pt; vertical-align: top; text-align: left; }
  .poem-table th { background: #eee; }
</style></head><body>
<p class="runhead">${description}</p>
${poems}
</body></html>`;
}

module.exports = {
  buildDocx, buildPrintHtml, buildPoemFragment, buildReaderPoemFragment, htmlToParagraphs, describePoem, runsToHtml,
  isTable, docxTable, tableToHtml, flowBlocks, monthYear, DISCLAIMER
};
