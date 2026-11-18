// Upload tab: finds the uploaded study's PubMed ID in PubMed itself, instead of trusting the
// ID in Claude's draft (written from memory, and wrong several times). Candidates, in order:
//   1. a DOI printed in the PDF, looked up in PubMed;
//   2. the ID Claude gave;
//   3. a PubMed title search, with the title from Claude's Reference.
// A candidate is accepted only if its PubMed title matches the uploaded article: nearly all of
// the title's words must appear on the article's first pages. If none matches, the ID is left
// blank for the editor to fill in (the article may not be in PubMed yet).
const { eutils, fetchArticles } = require('./pubmed');

const STOP = new Set(('a an and are as at be by for from has have in into is it its of on or that the their this to was were with ' +
  'vs versus among after before during between than not without').split(' '));
const words = s => String(s || '').toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '')
  .replace(/[^a-z0-9]+/g, ' ').trim().split(' ').filter(Boolean);

// How much of a PubMed title is found in the article's text (0 to 1).
function titleMatch(title, textWords) {
  const tw = words(title).filter(w => w.length > 2 && !STOP.has(w));
  if (tw.length < 3) return 0;
  return tw.filter(w => textWords.has(w)).length / tw.length;
}

// DOIs printed in the PDF, the first ones first (the article's own DOI is on its first page).
function doisIn(text) {
  const out = [];
  for (const m of String(text).matchAll(/\b10\.\d{4,9}\/[^\s"<>,;]+/g)) {
    const doi = m[0].replace(/[.)\]]+$/, '');
    if (!out.includes(doi)) out.push(doi);
    if (out.length >= 3) break;
  }
  return out;
}

// The article title in an AMA reference: the part after the authors ("... et al." or the
// first ". ") up to the next ". " (journal follows).
function titleFromReference(ref) {
  let s = String(ref || '').replace(/\s+/g, ' ').trim();
  const etal = /\bet al\.\s*/i.exec(s);
  if (etal) s = s.slice(etal.index + etal[0].length);
  else { const i = s.indexOf('. '); if (i < 0) return ''; s = s.slice(i + 2); }
  const end = s.search(/[.?!]\s/);
  return (end > 0 ? s.slice(0, end) : s).trim();
}

async function search(term, retmax = 5) {
  const data = await eutils('esearch', { db: 'pubmed', term, retmax: String(retmax) });
  return (data && data.esearchresult && data.esearchresult.idlist) || [];
}

// text: the PDF's text. claudeId: the ID in the draft. reference: the draft's Reference.
// Returns { status: 'confirmed' | 'corrected' | 'not-found' | 'unchecked', pmid, article?, claudeId }.
async function checkPmid({ text, claudeId, reference }) {
  claudeId = (/\d{6,9}/.exec(String(claudeId || '')) || [''])[0];
  const textWords = new Set(words(String(text).slice(0, 20000)));
  const tried = new Set();
  const accept = async ids => {
    ids = ids.filter(id => !tried.has(id));
    ids.forEach(id => tried.add(id));
    if (!ids.length) return null;
    const arts = await fetchArticles(ids);
    let best = null;
    for (const a of arts) {
      const score = titleMatch(a.title, textWords);
      if (score >= 0.8 && (!best || score > best.score)) best = { a, score };
    }
    return best && best.a;
  };
  try {
    let found = null;
    for (const doi of doisIn(text)) {
      found = await accept(await search(`${doi}[aid]`, 2));
      if (found) break;
    }
    if (!found && claudeId) found = await accept([claudeId]);
    const title = titleFromReference(reference);
    if (!found && title) found = await accept(await search(`${title}[ti]`));
    if (!found && title) found = await accept(await search(words(title).filter(w => !STOP.has(w)).join(' ')));
    if (!found) return { status: 'not-found', pmid: '', claudeId };
    return { status: found.pmid === claudeId ? 'confirmed' : 'corrected', pmid: found.pmid, article: found, claudeId };
  } catch (err) {
    console.error('PubMed ID check failed', err.message);
    return { status: 'unchecked', pmid: claudeId, claudeId };
  }
}

module.exports = { checkPmid, titleFromReference, doisIn, titleMatch, words };
