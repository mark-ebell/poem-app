// PubMed search for the Evidence Summary: builds the search string from the
// user's terms plus the language / age group / content area / journal limiters
// (see "Generating a search strategy for PubMed"), runs it through NCBI's
// E-utilities, and formats each hit as an AMA reference.
//
// Optional: set NCBI_API_KEY (free from NCBI) to raise the request limit from
// 3 to 10 per second. Requests are spaced out to stay within the limit.

const EUTILS = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/';
const MAX_PER_CATEGORY = 25;

const LIMITERS = 'AND (hasabstract[text] AND humans[MH] AND English[lang])';

const AGE_GROUPS = [
  { key: 'all', label: 'All ages', clause: '' },
  { key: 'infant', label: 'Infant (birth to 32 mos)', clause: 'AND (infant[filter])' },
  { key: 'child-0-18', label: 'Child (birth to 18 years)', clause: 'AND ("Child: birth-18 years"[filter])' },
  { key: 'child-6-12', label: 'Child (6 to 12 years)', clause: 'AND (child[filter])' },
  { key: 'adolescent', label: 'Adolescent (13 to 18 years)', clause: 'AND (adolescent[filter])' },
  { key: 'adult', label: 'Adult (19+)', clause: 'AND (adult[filter])' },
  { key: 'aged', label: 'Aged (65+)', clause: 'AND (aged[filter])' }
];

// The strings below are the ones in the strategy document. Three typing slips
// in it were corrected so the searches mean what was intended: the Systematic
// Reviews clause had an unmatched opening bracket; the Prognosis clause read
// "prognosos" and its final OR sat outside the brackets (so it would have
// returned every natural-history article regardless of topic).
const CONTENT_AREAS = [
  {
    key: 'guidelines', label: 'Practice guidelines',
    clause: 'AND (("guideline*"[ti] OR "practice parameter"[ti] OR "clinical guidance"[ti] OR "recommendation statement"[ti]) NOT ("adherence"[ti] OR "adherent"[ti] OR "concordant"[ti] OR "discordant"[ti] OR "guideline-based"[ti] OR "guideline based"[ti] OR "validation"[ti]) NOT ("guideline-directed"[ti] OR "guideline recommended" OR "guideline commentary"))'
  },
  {
    // Cochrane reviews appear in one journal, which is not on the high yield list, so the
    // high yield journal limit is not applied to this search.
    key: 'cochrane', label: 'Cochrane reviews', ignoreJournalLimit: true,
    clause: 'AND ("The Cochrane database of systematic reviews"[Journal])'
  },
  {
    key: 'systematic', label: 'Systematic Reviews',
    clause: 'AND (systematic[sb] OR "systematic review"[ti] OR "meta-analysis"[ti] OR "Systematic review"[pt] OR "Meta-Analysis"[pt])'
  },
  {
    key: 'rules', label: 'Clinical Decision Rules',
    clause: 'AND ("clinical prediction rule"[tiab] OR "clinical score"[ti] OR "decision rule"[tiab] OR "diagnostic rule"[ti] OR "diagnostic score*"[ti] OR "predictive rule*"[ti] OR "predictive score*"[ti] OR "prediction rule*"[tiab] OR "prediction score*"[ti] OR "risk score*"[tiab])'
  },
  {
    key: 'therapy', label: 'Therapy',
    clause: 'AND ("randomized controlled trial"[pt] OR (randomized[tiab] AND controlled[tiab] AND trial[tiab]))'
  },
  {
    key: 'diagnosis', label: 'Diagnosis',
    clause: 'AND ("sensitivity and specificity"[MH] OR "likelihood ratio*"[tiab] OR (sensitiv*[tiab] AND specific*[tiab]) OR "predictive value*"[tiab] OR "ROC curve"[tiab] OR "area under the receiver operating"[tiab] OR AUROCC[tiab])'
  },
  {
    key: 'prognosis', label: 'Prognosis',
    clause: 'AND ((prognosis[ti] OR prognostic[ti]) OR ("natural history"[tiab] OR "usual course"[tiab] OR "typical course"[tiab] OR "expected course"[tiab]))'
  },
  {
    key: 'screening', label: 'Screening',
    clause: 'AND (screening[ti] OR "Mass Screening"[Mesh] OR "early detection"[ti])'
  },
  {
    key: 'prevention', label: 'Prevention',
    clause: 'AND ("prevention"[ti] OR preventing[ti] OR "to prevent"[ti])'
  }
];

// High-yield journals. (In the document the names are written with "+" for
// spaces, as in a web address; they are spaces here. Also corrected there: "BMC
// Fam Pract" lacked its [jour] tag and an empty "" journal entry was dropped.)
const HIGH_YIELD_JOURNALS = [
  'Ann Fam Med', 'Br J Gen Pract', 'Fam Pract', 'J Gen Intern Med', 'Acad Emerg Med', 'Age Ageing',
  'Am J Emerg Med', 'Am J Gastroenterol', 'Birth', 'BMC Fam Pract', 'BMC Med', 'BMC Medicine',
  'Br J Psychiatry', 'Diabetes', 'Eur Heart J', 'J Clin Epidemiol', 'J Am Acad Dermatol',
  'J Am Geriatr Soc', 'Lancet Infect Dis', 'Scand J Gastroenterol', 'Scand J Infect Dis',
  'Sex Transm Infect', 'Stroke', 'Thorax', 'Health Technol Assess', 'J Invest Dermatol',
  'N Engl J Med', 'JAMA', 'Lancet', 'Ann Intern Med', 'AJR Am J Roentgenol', 'Am Heart J',
  'Am J Cardiol', 'Am J Med', 'Am J Obstet Gynecol', 'Am J Psychiatry', 'Am J Respir Crit Care Med',
  'Am J Surg', 'Am J Med Sci', 'Ann Emerg Med', 'Ann Otol Rhinol Laryngol', 'Ann Surg', 'BJOG', 'BMJ',
  'Brain', 'Br J Surg', 'Chest', 'Circulation', 'CMAJ', 'Crit Care Med', 'Dig Dis Sci', 'Endocrinology',
  'Gastroenterology', 'Gut', 'Heart', 'JAMA Dermatol', 'JAMA Intern Med', 'JAMA Neurol',
  'JAMA Ophthalmol', 'JAMA Pediatr', 'JAMA Psychiatry', 'JAMA Surg', 'JAMA Otolaryngol Head Neck Surg',
  'J Bone Joint Surg Am', 'J Infect Dis', 'J Laryngol Otol', 'J Neurosurg', 'J Pediatr',
  'J Am Coll Cardiol', 'J Am Coll Surg', 'J Urol', 'Obstet Gynecol', 'Pediatrics', 'Radiology',
  'Rheumatology (Oxford)'
];
const JOURNAL_CLAUSE = 'AND (' + HIGH_YIELD_JOURNALS.map(j => `"${j}"[jour]`).join(' OR ') + ')';

const findBy = (list, key) => list.find(x => x.key === key) || null;

// The PubMed search string: (user terms) + limiters + age group + content area + journals.
function buildQuery(userTerms, ageKey, area, journalsOnly) {
  const terms = String(userTerms).replace(/[“”]/g, '"').replace(/\s+/g, ' ').trim();
  const age = findBy(AGE_GROUPS, ageKey) || AGE_GROUPS[0];
  return [`(${terms})`, LIMITERS, age.clause, area.clause, journalsOnly && !area.ignoreJournalLimit ? JOURNAL_CLAUSE : '']
    .filter(Boolean).join(' ');
}

// ---------- E-utilities ----------
let lastRequestAt = 0;
let queue = Promise.resolve();

// Serialises requests (across all users) and spaces them to respect NCBI's limits.
function throttled(fn) {
  const gap = process.env.NCBI_API_KEY ? 120 : 350;
  const run = queue.then(async () => {
    const wait = lastRequestAt + gap - Date.now();
    if (wait > 0) await new Promise(r => setTimeout(r, wait));
    lastRequestAt = Date.now();
    return fn();
  });
  queue = run.catch(() => {});
  return run;
}

async function eutils(endpoint, params, attempt = 1) {
  const body = new URLSearchParams({ ...params, tool: 'poem-generator', retmode: 'json' });
  if (process.env.NCBI_API_KEY) body.set('api_key', process.env.NCBI_API_KEY);
  let resp;
  try {
    resp = await throttled(() => fetch(`${EUTILS}${endpoint}.fcgi`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
      signal: AbortSignal.timeout(30000)
    }));
  } catch (err) {
    if (attempt < 2) return eutils(endpoint, params, attempt + 1);
    throw new Error('Could not reach PubMed.');
  }
  if ((resp.status === 429 || resp.status >= 500) && attempt < 3) {
    await new Promise(r => setTimeout(r, 1000 * attempt));
    return eutils(endpoint, params, attempt + 1);
  }
  if (!resp.ok) throw new Error(`PubMed returned an error (${resp.status}).`);
  return resp.json();
}

// Returns { count, ids } for the newest MAX_PER_CATEGORY results. `sinceMonth` is 'YYYY-MM' or null.
async function searchPubMed(term, sinceMonth) {
  const params = { db: 'pubmed', term, retmax: String(MAX_PER_CATEGORY), sort: 'pub_date' };
  if (sinceMonth) Object.assign(params, { datetype: 'pdat', mindate: sinceMonth.replace('-', '/'), maxdate: '3000' });
  const data = await eutils('esearch', params);
  const r = data && data.esearchresult;
  if (!r) throw new Error('PubMed gave an unexpected answer.');
  if (r.ERROR) throw new Error(`PubMed could not run this search: ${r.ERROR}`);
  return { count: Number(r.count) || 0, ids: r.idlist || [] };
}

async function fetchArticles(ids) {
  if (!ids.length) return [];
  const data = await eutils('esummary', { db: 'pubmed', id: ids.join(',') });
  const result = (data && data.result) || {};
  return ids.map(id => result[id]).filter(Boolean).map(toArticle);
}

function toArticle(r) {
  const idOf = (...types) => {
    const hit = (r.articleids || []).find(a => types.includes(a.idtype));
    return hit ? hit.value : '';
  };
  const eloc = String(r.elocationid || '');
  const doi = idOf('doi') || (/doi:\s*(\S+)/i.exec(eloc) || [])[1] || '';
  return {
    pmid: String(r.uid),
    pmcid: idOf('pmc', 'pmcid'),
    doi,
    title: String(r.title || '').trim(),
    authors: (r.authors || []).map(a => a.name).filter(Boolean),
    journal: String(r.source || r.fulljournalname || '').trim(),
    year: (/\d{4}/.exec(r.pubdate || r.epubdate || '') || [''])[0],
    volume: String(r.volume || '').trim(),
    issue: String(r.issue || '').trim(),
    pages: String(r.pages || '').trim()
  };
}

// ---------- AMA citation ----------
// "6 or fewer authors: list all; more than 6: first 3 then et al."
function expandPages(pages) {
  const m = /^(\d+)-(\d+)$/.exec(pages);
  if (!m || m[2].length >= m[1].length) return pages;
  return `${m[1]}-${m[1].slice(0, m[1].length - m[2].length)}${m[2]}`;
}

// Returns runs ({ text, italic }) so the journal name can be italicised.
function amaRuns(a) {
  const runs = [];
  const authors = a.authors.length > 6 ? [...a.authors.slice(0, 3), 'et al'] : a.authors;
  if (authors.length) runs.push({ text: `${authors.join(', ')}. ` });
  const title = a.title.replace(/\.+$/, '');
  runs.push({ text: `${title}. ` });
  if (a.journal) runs.push({ text: a.journal, italic: true }, { text: '. ' });
  let where = a.year;
  if (a.volume) where += `;${a.volume}${a.issue ? `(${a.issue})` : ''}`;
  if (a.pages) where += `:${expandPages(a.pages)}`;
  if (where) runs.push({ text: `${where}.` });
  if (a.doi) runs.push({ text: ` doi:${a.doi}` });
  return runs;
}

const pubmedUrl = pmid => `https://pubmed.ncbi.nlm.nih.gov/${pmid}/`;
const pmcUrl = pmcid => `https://pmc.ncbi.nlm.nih.gov/articles/${pmcid}/`;
const pubmedSearchUrl = term => `https://pubmed.ncbi.nlm.nih.gov/?term=${encodeURIComponent(term)}`;

module.exports = {
  AGE_GROUPS, CONTENT_AREAS, HIGH_YIELD_JOURNALS, MAX_PER_CATEGORY,
  buildQuery, searchPubMed, fetchArticles, amaRuns, pubmedUrl, pmcUrl, pubmedSearchUrl, findBy
};
