// Reads a month's POEMs from a Word file into records ready for the poems table.
//
// The file holds a series of POEMs; each starts with a "Title:" line and has labelled
// fields: Reference (or an unlabelled line right after the title), Question, Bottom line,
// Allocation, Funding Source, Design (optionally "...; LOE: 1b"), Setting, Synopsis,
// optionally Age group, Supertype, Level of evidence, PubMed ID and POEM ID, and the
// author's initials in brackets, e.g. "(ME)". Missing PubMed IDs are looked up at
// PubMed by matching the citation, as in the earlier monthly batches.
const mammoth = require('mammoth');
const pm = require('./pubmed');
const {
  textToHtml, htmlToText, sanitizeHtml, pubmedUrlFor, POET_BY_INITIALS, INITIALS_BY_POET, VALID_POETS
} = require('./poem-model');
const { SUPERTYPES } = require('./evidence-summary');

// ---------- Word -> blocks of labelled fields ----------
const LABELS = {
  title: 'title', reference: 'reference', question: 'question', clinicalquestion: 'question',
  bottomline: 'bottomline', allocation: 'allocation', allocationconcealment: 'allocation',
  funding: 'funding', fundingsource: 'funding', design: 'design', studydesign: 'design',
  setting: 'setting', populationandsetting: 'setting', agegroup: 'agegroup', supertype: 'supertype',
  levelofevidence: 'loe', loe: 'loe', synopsis: 'synopsis', pubmedid: 'pubmedid', pmid: 'pubmedid',
  poemid: 'poemid', poemnumber: 'poemid', poet: 'poet', author: 'poet'
};
const LABEL_RE = /^([A-Za-z][A-Za-z \-]{1,30}?)\s*:\s*(.*)$/;
const POET_MARK_RE = /^\(([A-Za-z]{2,4})\)$/;

function labelOf(line) {
  const m = LABEL_RE.exec(line);
  if (!m) return null;
  const key = LABELS[m[1].toLowerCase().replace(/[^a-z]/g, '')];
  return key ? { key, rest: m[2].trim() } : null;
}

const isBoundary = line => !!(labelOf(line) || POET_MARK_RE.test(line));

// The field's text: whatever follows the label on its line plus the following lines up to the
// next label; lines of one paragraph are joined with spaces, paragraphs with a blank line.
function collect(lines, start, firstRest) {
  const parts = firstRest ? [firstRest] : [];
  let para = [];
  let j = start + 1;
  for (; j < lines.length; j++) {
    const line = lines[j];
    if (line === '') { if (para.length) { parts.push(para.join(' ')); para = []; } continue; }
    if (isBoundary(line)) break;
    para.push(line);
  }
  if (para.length) parts.push(para.join(' '));
  return { value: parts.filter(Boolean).join('\n\n'), next: j };
}

function parseBlock(lines) {
  const rec = {};
  const set = (k, v) => { if (v) rec[k] = v; };
  let sawTitle = false;
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (!line) { i++; continue; }
    const lab = labelOf(line);
    if (lab) {
      if (lab.key === 'title') { rec.title = lab.rest; sawTitle = true; i++; continue; }
      const { value, next } = collect(lines, i, lab.rest);
      if (lab.key === 'design') {
        const m = /^(.*?);\s*LOE\s*:\s*(.*)$/i.exec(value);
        if (m) { set('design', m[1].trim()); set('loe', m[2].trim()); } else set('design', value);
      } else set(lab.key, value);
      i = next;
      continue;
    }
    if (sawTitle && !rec.reference && !POET_MARK_RE.test(line)) {
      const { value, next } = collect(lines, i, line);
      rec.reference = value;
      i = next;
      continue;
    }
    const pm1 = POET_MARK_RE.exec(line);
    if (pm1) { rec.poet = rec.poet || pm1[1]; i++; continue; }
    i++;
  }
  if (!rec.poet && rec.synopsis) {
    const m = /\(([A-Za-z]{2,4})\)\s*$/.exec(rec.synopsis);
    if (m) { rec.poet = m[1]; rec.synopsis = rec.synopsis.slice(0, m.index).trimEnd(); }
  }
  return rec;
}

async function readDocxText(buffer) {
  const { value } = await mammoth.extractRawText({ buffer });
  return value.replace(/ /g, ' ');
}

function parsePoems(text) {
  const lines = text.split(/\r?\n/).map(l => l.trim());
  const starts = [];
  lines.forEach((l, i) => { if (/^Title\s*:/i.test(l)) starts.push(i); });
  starts.push(lines.length);
  const blocks = [];
  for (let k = 0; k < starts.length - 1; k++) blocks.push(parseBlock(lines.slice(starts[k], starts[k + 1])));
  return blocks.filter(b => b.title);
}

// ---------- field normalisers ----------
const norm = s => String(s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
const SUPERTYPE_BY_CODE = new Map(SUPERTYPES.map(([code]) => [code.toLowerCase(), code]));
const SUPERTYPE_BY_NAME = new Map(SUPERTYPES.map(([code, name]) => [norm(name), code]));

function supertypeCode(value) {
  const v = String(value || '').trim();
  if (!v) return null;
  const first = v.split(/[\s—–:-]+/)[0].toLowerCase();
  if (SUPERTYPE_BY_CODE.has(first)) return SUPERTYPE_BY_CODE.get(first);
  const rest = v.replace(/^[A-Za-z]+\s*[—–:-]\s*/, '');
  return SUPERTYPE_BY_NAME.get(norm(rest)) || SUPERTYPE_BY_NAME.get(norm(v)) || null;
}

function ageCode(value) {
  const v = String(value || '').trim().toLowerCase();
  if (!v) return null;
  if (/^[0-3]$/.test(v)) return Number(v);
  if (/both|all ages|no age|adults? and child/.test(v)) return 3;
  if (/^adult/.test(v)) return 1;
  if (/^child/.test(v)) return 2;
  return null;
}

function poetName(value) {
  const v = String(value || '').trim();
  const byInitials = POET_BY_INITIALS[v.toUpperCase()];
  if (byInitials) return { poet: byInitials, initials: v.toUpperCase() };
  const full = VALID_POETS.find(n => n.toLowerCase() === v.toLowerCase());
  if (full) return { poet: full, initials: INITIALS_BY_POET[full] || null };
  return { poet: v, initials: v || null };
}

// ---------- PubMed ID lookup (citation match, then title search), with a title check ----------
function articleTitleOf(ref) {
  const m = /et al\.?\s+(.*)/.exec(ref);
  const rest = m ? m[1] : (ref.includes('. ') ? ref.split('. ').slice(1).join('. ') : ref);
  const m2 = /^(.*?)\.\s+([A-Z][A-Za-z0-9 &\-.]*\s\d{4}.*)$/.exec(rest);
  return (m2 ? m2[1] : rest.split('.')[0]).trim();
}

function citationTail(ref) {
  const m = /.*\.\s+([A-Za-z][A-Za-z0-9&.\s]*?)\s+(\d{4});\s*(\d+)?\s*(?:\((\d+)\))?\s*:\s*([A-Za-z0-9]+)/.exec(ref);
  return m ? { journal: m[1].trim().replace(/\.$/, ''), year: m[2], volume: m[3] || '', page: m[5] } : null;
}

const firstAuthor = ref => (/^\s*([A-Za-z-]+)\s+[A-Z]{1,3}[,.]/.exec(ref) || [])[1] || '';

const normTitle = s => String(s || '').replace(/<[^>]+>/g, '').toLowerCase().replace(/[^a-z0-9 ]/g, '').replace(/\s+/g, ' ').trim();

function similarity(a, b) {
  a = normTitle(a); b = normTitle(b);
  if (!a || !b) return 0;
  if (b.startsWith(a) || a.startsWith(b)) return 1;
  const grams = s => { const m = new Map(); for (let i = 0; i < s.length - 1; i++) { const g = s.slice(i, i + 2); m.set(g, (m.get(g) || 0) + 1); } return m; };
  const ga = grams(a), gb = grams(b);
  let overlap = 0;
  for (const [g, n] of ga) overlap += Math.min(n, gb.get(g) || 0);
  return (2 * overlap) / (Math.max(a.length - 1, 0) + Math.max(b.length - 1, 0) || 1);
}

// -> { pmid, note } where note is 'ok', 'check' (found, but PubMed's title differs) or 'not found'
async function lookupPmid(reference) {
  const title = articleTitleOf(reference);
  const tail = citationTail(reference);
  const author = firstAuthor(reference);
  let pmid = null;
  try {
    if (tail && author) pmid = await pm.ecitmatch(tail.journal, tail.year, tail.volume, tail.page, author);
    if (!pmid && title) {
      const data = await pm.eutils('esearch', { db: 'pubmed', term: `${title}[Title]`, retmax: '5' });
      const r = data && data.esearchresult;
      if (r && Number(r.count) === 1) pmid = r.idlist[0];
    }
    if (!pmid) return { pmid: null, note: 'not found' };
    const summary = await pm.eutils('esummary', { db: 'pubmed', id: pmid });
    const theirs = summary && summary.result && summary.result[pmid] && summary.result[pmid].title;
    return { pmid, note: similarity(title, theirs) >= 0.85 ? 'ok' : 'check' };
  } catch {
    return { pmid: pmid || null, note: pmid ? 'check' : 'not found' };
  }
}

// ---------- parsed block -> a record in the poems table's terms ----------
function toRecord(block, month) {
  const { poet, initials } = poetName(block.poet);
  const loe = block.loe ? String(block.loe).trim() : null;
  const pmidRaw = String(block.pubmedid || '').replace(/^pmid:?\s*/i, '').trim();
  return {
    title: block.title.trim(),
    reference: (block.reference || '').trim(),
    clinical_question: (block.question || '').trim(),
    allocation: (block.allocation || '').replace(/^[(\s]+|[)\s]+$/g, '') || null,
    funding: (block.funding || '').trim() || null,
    study_design: (block.design || '').trim() || null,
    loe: loe || null,
    setting: (block.setting || '').trim() || null,
    age_group: ageCode(block.agegroup),
    supertype: supertypeCode(block.supertype),
    synopsis: textToHtml(block.synopsis || ''),
    bottom_line: textToHtml(block.bottomline || ''),
    poet,
    poet_initials: initials,
    poem_id: /^\d{1,9}$/.test(String(block.poemid || '').trim()) ? Number(block.poemid) : null,
    publication_date: month,
    pubmed_id: /^\d{1,9}$/.test(pmidRaw) ? pmidRaw : (/^na$/i.test(pmidRaw) ? 'NA' : null),
    pubmed_url: null
  };
}

// Reads the Word file, looks up missing PubMed IDs and returns records plus notes for the preview.
async function readBatch(buffer, month) {
  const blocks = parsePoems(await readDocxText(buffer));
  const records = [];
  for (const block of blocks) {
    const rec = toRecord(block, month);
    const notes = [];
    if (!rec.pubmed_id && rec.reference) {
      const found = await lookupPmid(rec.reference);
      rec.pubmed_id = found.pmid;
      if (found.note === 'check') notes.push('PubMed ID found but its title differs; please check');
      if (found.note === 'not found') notes.push('PubMed ID not found');
    }
    rec.pubmed_url = pubmedUrlFor(rec.pubmed_id);
    if (!rec.reference) notes.push('no reference');
    if (!rec.synopsis) notes.push('no synopsis');
    if (!rec.bottom_line) notes.push('no bottom line');
    if (!rec.poet) notes.push('no author');
    if (!rec.study_design) notes.push('no study design');
    if (rec.age_group === null) notes.push('no age group');
    if (!rec.supertype) notes.push('no supertype');
    records.push({ record: rec, notes });
  }
  return records;
}

module.exports = {
  readBatch, parsePoems, readDocxText, toRecord, supertypeCode, ageCode, lookupPmid, articleTitleOf, citationTail, firstAuthor,
  htmlToText, sanitizeHtml
};
