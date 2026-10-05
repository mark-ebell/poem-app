// Shared helpers for the structured POEM record: validation, HTML sanitizing,
// conversion of plain text (spreadsheet import) to editor HTML, and splitting of
// the old single-HTML-blob POEMs into separate fields.

const crypto = require('crypto');

const PUBMED_BASE = 'https://pubmed.ncbi.nlm.nih.gov/';

// The POETs who can be chosen as an author. Historical POEMs use initials; the ones below
// are mapped to the full last name used in the app, the rest keep their initials.
const VALID_POETS = ['Barry', 'Ebell', 'Shaughnessy', 'Slawson', 'Speer', 'Shrikant', 'Rowland', 'Rayala'];
const POET_BY_INITIALS = { HB: 'Barry', ME: 'Ebell', AS: 'Shaughnessy', DS: 'Slawson', LS: 'Speer', NS: 'Shrikant', NK: 'Shrikant' };
const INITIALS_BY_POET = { Barry: 'HB', Ebell: 'ME', Shaughnessy: 'AS', Slawson: 'DS', Speer: 'LS', Shrikant: 'NS' };

const AGE_CODE_BY_LABEL = {
  adults: 1,
  children: 2,
  'both adults and children': 3
};

// ---------- HTML helpers ----------
function escapeHtml(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function decodeEntities(s) {
  return s
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&');
}

function htmlToText(html) {
  return decodeEntities(
    String(html || '')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/p>\s*<p[^>]*>/gi, '\n\n')
      .replace(/<[^>]+>/g, '')
  ).trim();
}

const SAFE_HREF = /^(https?:\/\/|mailto:)[^\s"'<>]*$/i;
const SAFE_STYLE_PROP = /^(font-family|font-size)$/i;
const SAFE_STYLE_VALUE = /^[A-Za-z0-9 ,.'"-]+$/;
const ALLOWED_SIMPLE = new Set(['p', 'br', 'b', 'strong', 'i', 'em', 'u', 'sup', 'sub']);
const DROP_WITH_CONTENT = new Set(['script', 'style', 'iframe', 'object', 'embed']);

// Keeps only the formatting the editor can produce (bold, italic, underline,
// sub/superscript, links, simple font styling, paragraphs and line breaks).
// Everything else is removed; text between tags is re-escaped.
function sanitizeHtml(html) {
  const input = String(html || '');
  let out = '';
  let last = 0;
  let dropDepthTag = null;
  const tagRe = /<(\/?)([a-zA-Z][a-zA-Z0-9]*)\b([^>]*)>/g;
  let m;
  const text = (s) => (dropDepthTag ? '' : escapeText(s));
  while ((m = tagRe.exec(input))) {
    out += text(input.slice(last, m.index));
    last = tagRe.lastIndex;
    const closing = m[1] === '/';
    const tag = m[2].toLowerCase();
    const attrs = m[3] || '';
    if (dropDepthTag) {
      if (closing && tag === dropDepthTag) dropDepthTag = null;
      continue;
    }
    if (DROP_WITH_CONTENT.has(tag)) {
      if (!closing) dropDepthTag = tag;
      continue;
    }
    if (ALLOWED_SIMPLE.has(tag)) {
      out += closing ? (tag === 'br' ? '' : `</${tag}>`) : `<${tag}>`;
    } else if (tag === 'a') {
      if (closing) { out += '</a>'; continue; }
      const hm = attrs.match(/\bhref\s*=\s*(?:"([^"]*)"|'([^']*)')/i);
      const href = hm ? decodeEntities(hm[1] || hm[2] || '') : '';
      out += SAFE_HREF.test(href) ? `<a href="${href.replace(/"/g, '&quot;')}">` : '<a>';
    } else if (tag === 'span') {
      if (closing) { out += '</span>'; continue; }
      const sm = attrs.match(/\bstyle\s*=\s*(?:"([^"]*)"|'([^']*)')/i);
      const kept = [];
      if (sm) {
        for (const decl of decodeEntities(sm[1] || sm[2] || '').split(';')) {
          const [prop, ...rest] = decl.split(':');
          const value = rest.join(':').trim();
          if (prop && SAFE_STYLE_PROP.test(prop.trim()) && SAFE_STYLE_VALUE.test(value)) {
            kept.push(`${prop.trim().toLowerCase()}:${value}`);
          }
        }
      }
      out += kept.length ? `<span style="${kept.join(';')}">` : '<span>';
    }
    // any other tag (ins/del/font/div/...) is dropped, its text is kept
  }
  out += text(input.slice(last));
  return out;
}

// Text segments in already-valid HTML only contain entities for < > &, but be
// defensive about stray angle brackets.
function escapeText(s) {
  return s.replace(/<(?![a-zA-Z/!])/g, '&lt;').replace(/>/g, '&gt;');
}

// Plain text from the spreadsheet -> editor HTML. "<" and ">" are statistical
// notation in this data (e.g. "p < 0.05"), so they are escaped as text. Only a
// small, strictly-formatted set of real tags (links, sub/superscript, italics,
// bold, line breaks) that occur in the historical data are kept as formatting.
const REAL_TAG_RE = /<a href="https?:\/\/[^"\s<>]*">|<\/a>|<\/?(?:sub|sup|i|b|u|em|strong)>|<br\s*\/?>/gi;

function textToHtml(text) {
  const src = String(text == null ? '' : text).replace(/\r\n?/g, '\n').trim();
  if (!src) return '';
  const toHtml = (para) => {
    let out = '';
    let last = 0;
    let m;
    REAL_TAG_RE.lastIndex = 0;
    while ((m = REAL_TAG_RE.exec(para))) {
      out += escapeHtml(para.slice(last, m.index)).replace(/\n/g, '<br>');
      out += m[0].toLowerCase().startsWith('<br') ? '<br>' : m[0];
      last = REAL_TAG_RE.lastIndex;
    }
    out += escapeHtml(para.slice(last)).replace(/\n/g, '<br>');
    return out;
  };
  return src.split(/\n\s*\n/).map(p => `<p>${toHtml(p.trim())}</p>`).join('');
}

// ---------- POEM numbers ----------
// A random 6-digit number (100000-999999) that is not already in use. `isTaken`
// is called with each candidate and returns true if it must not be used.
function generatePoemId(isTaken) {
  for (let i = 0; i < 10000; i++) {
    const candidate = 100000 + crypto.randomInt(900000);
    if (!isTaken(candidate)) return candidate;
  }
  throw new Error('Could not find an unused 6-digit POEM number.');
}

// ---------- Field helpers ----------
function pubmedUrlFor(pubmedId) {
  return /^\d{1,9}$/.test(pubmedId || '') ? PUBMED_BASE + pubmedId : null;
}

function poetFromInitials(initials) {
  const v = (initials || '').trim();
  return POET_BY_INITIALS[v] || v;
}

function ageCodeFromLabel(label) {
  const v = AGE_CODE_BY_LABEL[String(label || '').trim().toLowerCase()];
  return v === undefined ? null : v;
}

// ---------- Splitting the old whole-POEM HTML blob into fields ----------
const LEGACY_LABELS = {
  'title': 'title',
  'reference': 'reference',
  'clinical question': 'clinical_question',
  'allocation': 'allocation',
  'funding': 'funding',
  'study design': 'study_design',
  'population and setting': 'setting',
  'age group': 'age_group',
  'synopsis': 'synopsis',
  'bottom-line': 'bottom_line',
  'bottom line': 'bottom_line',
  'pubmed id': 'pubmed_id'
};

function parseLegacyHtml(html) {
  const blocks = String(html || '').split(/<\/p>/i).map(b => b.replace(/^[\s\S]*?<p[^>]*>/i, '').trim()).filter(Boolean);
  const fields = {};
  let current = null;
  for (const block of blocks) {
    const m = block.match(/^<b>\s*([^<]+?)\s*:\s*<\/b>\s*([\s\S]*)$/i);
    const key = m && LEGACY_LABELS[m[1].trim().toLowerCase()];
    if (key) {
      current = key;
      fields[key] = [m[2]];
    } else if (current) {
      fields[current].push(block);
    }
  }
  const out = {};
  for (const [key, parts] of Object.entries(fields)) {
    if (key === 'synopsis' || key === 'bottom_line') {
      out[key] = sanitizeHtml(parts.filter(p => p.trim()).map(p => `<p>${p}</p>`).join(''));
    } else {
      const text = htmlToText(parts.join('\n\n')).replace(/\s*\n+\s*/g, ' ').trim();
      if (key === 'age_group') out[key] = ageCodeFromLabel(text);
      else if (key === 'pubmed_id') out[key] = (text.match(/\d{6,9}/) || [null])[0];
      else out[key] = text;
    }
  }
  return out;
}

// ---------- Request validation (create / update) ----------
const LIMITS = {
  title: 500, reference: 5000, clinical_question: 2000, allocation: 100, funding: 100,
  study_design: 150, loe: 10, setting: 150, supertype: 10, category: 100
};

function optText(v, max) {
  if (v === undefined || v === null) return null;
  const s = String(v).trim();
  if (!s) return null;
  return s.slice(0, max);
}

// Returns { error } or { fields } ready to bind to the poems table. `existing`
// is the current row when updating.
function normalizePoemBody(body, existing) {
  const b = body || {};
  const title = String(b.title || '').trim();
  if (!title) return { error: 'Title is required.' };
  if (title.length > LIMITS.title) return { error: 'Title is too long.' };

  const poet = String(b.poet || '').trim();
  const poetUnchanged = existing && poet === existing.poet;
  if (!poet || (!VALID_POETS.includes(poet) && !poetUnchanged)) return { error: 'A valid POET is required.' };

  const publicationDate = String(b.publicationDate || '').trim();
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(publicationDate)) return { error: 'A valid publication date is required.' };

  let ageGroup = null;
  if (b.ageGroup !== undefined && b.ageGroup !== null && b.ageGroup !== '') {
    ageGroup = Number(b.ageGroup);
    if (![0, 1, 2, 3].includes(ageGroup)) return { error: 'Age group must be 1 (adults), 2 (children) or 3 (both).' };
  }

  let pubmedId = optText(b.pubmedId, 20);
  if (pubmedId) {
    pubmedId = pubmedId.replace(/^pmid:?\s*/i, '');
    if (/^na$/i.test(pubmedId)) pubmedId = 'NA';
    else if (!/^\d{1,9}$/.test(pubmedId)) return { error: 'PubMed ID must be a number (up to 8 digits) or "NA".' };
  }
  // The URL is always derived from the PubMed ID. A record marked "NA" keeps
  // whatever source link it already had (some have a link to the original source).
  const pubmedUrl = pubmedUrlFor(pubmedId) || (pubmedId === 'NA' && existing ? existing.pubmed_url : null);

  const synopsis = sanitizeHtml(b.synopsis);
  const bottomLine = sanitizeHtml(b.bottomLine);
  if (synopsis.length > 100000 || bottomLine.length > 50000) return { error: 'Synopsis or bottom line is too long.' };

  return {
    fields: {
      title,
      poet,
      poet_initials: existing && existing.poet_initials && poetUnchanged ? existing.poet_initials : (INITIALS_BY_POET[poet] || null),
      publication_date: publicationDate,
      reference: String(b.reference || '').trim().slice(0, LIMITS.reference),
      clinical_question: String(b.clinicalQuestion || '').trim().slice(0, LIMITS.clinical_question),
      allocation: optText(b.allocation, LIMITS.allocation),
      funding: optText(b.funding, LIMITS.funding),
      study_design: optText(b.studyDesign, LIMITS.study_design),
      loe: optText(b.loe, LIMITS.loe),
      setting: optText(b.setting, LIMITS.setting),
      age_group: ageGroup,
      supertype: optText(b.supertype, LIMITS.supertype),
      synopsis,
      bottom_line: bottomLine,
      pubmed_id: pubmedId,
      pubmed_url: pubmedUrl
    }
  };
}

// Full record for the Edit form.
function toClient(row) {
  return {
    id: row.id,
    poemId: row.poem_id,
    title: row.title,
    poet: row.poet,
    poetInitials: row.poet_initials,
    publicationDate: row.publication_date,
    pubDateExact: row.pub_date_exact,
    reference: row.reference,
    clinicalQuestion: row.clinical_question,
    allocation: row.allocation,
    funding: row.funding,
    studyDesign: row.study_design,
    loe: row.loe,
    setting: row.setting,
    ageGroup: row.age_group,
    supertype: row.supertype,
    category: row.category,
    synopsis: row.synopsis,
    bottomLine: row.bottom_line,
    pubmedId: row.pubmed_id,
    pubmedUrl: row.pubmed_url,
    source: row.source,
    createdBy: row.created_by,
    updatedBy: row.updated_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

// Light record for the Saved POEMs list (no long text fields).
function toListItem(row) {
  return {
    id: row.id,
    poemId: row.poem_id,
    title: row.title,
    poet: row.poet,
    publicationDate: row.publication_date,
    ageGroup: row.age_group,
    createdBy: row.created_by,
    createdAt: row.created_at,
    source: row.source
  };
}

module.exports = {
  VALID_POETS, POET_BY_INITIALS, INITIALS_BY_POET, PUBMED_BASE,
  escapeHtml, decodeEntities, htmlToText, sanitizeHtml, textToHtml,
  generatePoemId, pubmedUrlFor, poetFromInitials, ageCodeFromLabel,
  parseLegacyHtml, normalizePoemBody, toClient, toListItem
};
