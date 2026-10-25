// The Edit Chapter tab's review state, and Claude's evidence update of a chapter.
//
// The review state is what the editor shows: each part of the chapter as HTML (with
// citations as data-key links to reference ids, and tracked changes as <ins>/<del>), the
// reference list, and the new references the review has added:
//
//   { version: 1, parts: [{ section, sectionLabel, tag, label, bottomLine, editable, html }],
//     references: [{ id, short, html, links }], newReferences: [{ id, pmid, poem, authors,
//     title, source, pubdate, volume, pages, citation, short }], unplaced: [], summary,
//     evidence: [] }
//
// Claude's update (runUpdate): PubMed is searched for the chapter's topic over the last 14
// months (practice guidelines, Cochrane and systematic reviews, and trials and diagnostic
// studies in high-yield journals), together with InfoRetriever's POEMs from that time.
// Claude reads the chapter (each bullet numbered) and the evidence and returns suggested
// changes: delete a bullet, replace a phrase, or insert a new bullet, each with a short
// note and its sources. They become tracked changes by "Claude"; a suggestion that cannot
// be placed exactly is listed for the editor instead.
const Anthropic = require('@anthropic-ai/sdk');
const db = require('./db');
const pm = require('./pubmed');
const store = require('./chapter-store');
const { searchPoems } = require('./search');
const { htmlToTree, treeText, treeToHtml } = require('./html-tree');
const { formatAuthors } = require('./chapter-xml-write');

const MODEL = 'claude-opus-5-5';
const MONTHS_BACK = 14;
// Parts shown but not edited: calculator lists come from the calculators, web sites and
// features keep their own markup.
const READ_ONLY = new Set(['HP_Data_Group', 'Dx_Data_Group', 'HP_Data', 'Dx_Data', 'Web_Sites', 'Guidelines', 'feature', 'section', 'subsection']);

// ---------- Review state from the live chapter ----------
function buildEditorState(chapter) {
  const idByN = new Map(chapter.references.map(r => [String(r.n), r.id]));
  const toEditor = t => {
    if (t.text !== undefined) return t;
    const data = { ...t.data };
    if (data.ref) { data.key = idByN.get(data.ref) || data.ref; delete data.ref; }
    return { ...t, data, children: t.children.map(toEditor) };
  };
  const html = h => toEditor(htmlToTree(h)).children.map(treeToHtml).join('');
  const parts = [];
  if (chapter.overallBottomLine) {
    parts.push({ section: 'background', sectionLabel: 'Overall Bottom Line', tag: 'BottomLine', label: 'Overall Bottom Line', bottomLine: true, editable: true, html: html(chapter.overallBottomLine) });
  }
  for (const s of chapter.sections) {
    for (const p of s.parts) {
      const editable = s.tag !== 'Misc' && s.tag !== 'feature' && !READ_ONLY.has(p.tag);
      parts.push({ section: s.tag, sectionLabel: s.label, tag: p.tag, label: p.label, bottomLine: p.bottomLine, editable, html: editable ? html(p.html) : p.html });
    }
  }
  return {
    version: 1,
    parts,
    references: chapter.references.map(r => ({ id: r.id, short: r.short, html: r.html, links: r.links })),
    newReferences: [],
    unplaced: [],
    summary: '',
    evidence: []
  };
}

// ---------- Evidence ----------
const AREAS = [
  ['guidelines', 'Practice guideline', false],
  ['cochrane', 'Cochrane review', false],
  ['systematic', 'Systematic review', false],
  ['therapy', 'Randomized trial', true],
  ['diagnosis', 'Diagnostic study', true],
  ['prognosis', 'Prognosis study', true],
  ['screening', 'Screening study', true],
  ['prevention', 'Prevention study', true]
];

async function gatherEvidence(topic, progress) {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() - MONTHS_BACK, 1);
  const sinceMonth = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}`;

  const kindByPmid = new Map();
  for (const [key, label, journals] of AREAS) {
    progress(`Searching PubMed: ${label.toLowerCase()}s since ${sinceMonth}…`);
    const area = pm.findBy(pm.CONTENT_AREAS, key);
    try {
      const found = await pm.searchPubMed(pm.buildQuery(topic, 'all', area, journals), sinceMonth);
      for (const id of found.ids) if (!kindByPmid.has(id)) kindByPmid.set(id, label);
    } catch (err) {
      console.warn(`Chapter update: PubMed ${key} search failed: ${err.message}`);
    }
  }
  const ids = [...kindByPmid.keys()];
  progress(`Reading ${ids.length} PubMed abstracts…`);
  const articles = await pm.fetchArticles(ids);
  const abstracts = await pm.fetchAbstracts(ids);
  const evidence = articles.map(a => ({
    kind: kindByPmid.get(a.pmid),
    pmid: a.pmid,
    citation: pm.amaRuns(a).map(r => r.text).join(''),
    abstract: ((abstracts.get(a.pmid) || {}).abstract || '').slice(0, 3000),
    meta: { authors: formatAuthors(a.authors), title: a.title, source: a.journal, pubdate: a.year, volume: a.volume, pages: a.pages }
  })).filter(e => e.abstract);

  // InfoRetriever's POEMs on the topic from the same months.
  progress('Searching InfoRetriever POEMs…');
  let poems = [];
  try {
    const found = searchPoems({ q: `"${topic}"`, whole: true, years: 2 }, { reader: true });
    if (!found.error) {
      const ids2 = found.poems.map(p => p.id);
      poems = ids2.length ? db.prepare(`SELECT * FROM poems WHERE id IN (${ids2.map(() => '?').join(',')})`).all(...ids2) : [];
      poems = poems.filter(p => p.publication_date >= sinceMonth && p.poem_id);
    }
  } catch (err) {
    console.warn(`Chapter update: POEM search failed: ${err.message}`);
  }
  const strip = h => String(h || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  for (const p of poems) {
    evidence.push({
      kind: 'POEM',
      poem: String(p.poem_id),
      pmid: /^\d+$/.test(p.pubmed_id || '') ? p.pubmed_id : null,
      citation: `${p.title} (POEM, ${p.publication_date}). ${p.reference}`,
      abstract: `Clinical question: ${p.clinical_question} Bottom line: ${strip(p.bottom_line)}`,
      meta: { citation: p.reference }
    });
  }
  evidence.forEach((e, i) => { e.id = `E${i + 1}`; });
  return { evidence, sinceMonth };
}

// ---------- The chapter as Claude reads it ----------
// Each editable part (P1, P2, ...) and each bullet in it (P1.1, P1.2, ...).
function itemsOf(tree) {
  const lists = (tree.children || []).filter(c => c.tag === 'ul' || c.tag === 'ol');
  if (lists.length) return lists.flatMap(l => (l.children || []).filter(c => c.tag === 'li'));
  return [tree]; // a paragraph part (e.g. Definition): the whole part is one item
}

function readable(t, refNumber) {
  if (t.text !== undefined) return t.text;
  if (t.tag === 'button' && /sort-tag/.test(t.cls)) return ` (SORT ${t.data.sort})`;
  if (t.tag === 'a' && t.data && t.data.key) return ` [${refNumber.get(t.data.key) || '?'}]`;
  if (t.tag === 'a' && t.data && t.data.fig) return 'Figure 1';
  if (t.tag === 'table') {
    const rows = [];
    const walk = n => { if (n.tag === 'tr') rows.push((n.children || []).map(c => treeText(c).trim()).join(' | ')); else (n.children || []).forEach(walk); };
    walk(t);
    return `\n${rows.join('\n')}\n`;
  }
  return (t.children || []).map(c => readable(c, refNumber)).join('');
}

function chapterForClaude(state) {
  const refNumber = new Map(state.references.map((r, i) => [r.id, i + 1]));
  const lines = [];
  let lastSection = null;
  state.parts.forEach((p, i) => {
    if (!p.editable) return;
    if (p.sectionLabel !== lastSection) { lines.push(`\n## ${p.sectionLabel}`); lastSection = p.sectionLabel; }
    const tree = htmlToTree(p.html);
    lines.push(`### P${i + 1}: ${p.label}${p.bottomLine ? ' (bottom line)' : ''}`);
    itemsOf(tree).forEach((item, j) => lines.push(`P${i + 1}.${j + 1}: ${readable(item, refNumber).replace(/\s+/g, ' ').trim()}`));
  });
  const refs = state.references.map((r, i) => `[${i + 1}] ${r.short}`).join('\n');
  return { text: lines.join('\n').trim(), refs };
}

// ---------- Claude ----------
const SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['summary', 'edits'],
  properties: {
    summary: { type: 'string' },
    edits: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['action', 'part', 'item', 'find', 'replace', 'text', 'sort', 'evidence', 'note'],
        properties: {
          action: { type: 'string', enum: ['delete_item', 'replace_text', 'insert_item'] },
          part: { type: 'string' },
          item: { type: 'string' },
          find: { type: 'string' },
          replace: { type: 'string' },
          text: { type: 'string' },
          sort: { type: 'string', enum: ['A', 'B', 'C', 'none'] },
          evidence: { type: 'array', items: { type: 'string' } },
          note: { type: 'string' }
        }
      }
    }
  }
};

const SYSTEM = `You are a senior physician editor updating a chapter of Essential Evidence, an evidence-based clinical reference for primary care clinicians. You keep chapters accurate and current, and you change only what the evidence requires.

Each chapter is a set of parts (P1, P2, ...) holding short bullet points (P3.1, P3.2, ...). Bullets cite references by number in square brackets, like [12], and recommendations end with a Strength of Recommendation Taxonomy rating: (SORT A) consistent, good-quality patient-oriented evidence; (SORT B) inconsistent or limited-quality patient-oriented evidence; (SORT C) consensus, disease-oriented evidence, usual practice, expert opinion, or case series.

Your task has two steps.

1. Review the current chapter. Find statements that are incorrect or out of date in light of current evidence, including the new evidence provided, and suggest deleting or correcting them. Do not suggest changes for style or wording alone.

2. From the new evidence provided (published in roughly the last 14 months: practice guidelines, Cochrane and systematic reviews, important trials, and POEMs), add the new information that matters for primary care to the appropriate part, as new bullets in the chapter's style: concise, specific, with numbers where they matter (absolute risks, NNT, likelihood ratios). Where the evidence changes practice, also add a short recommendation with a SORT rating to that section's bottom line part and, if it is important enough, to the Overall Bottom Line.

Rules:
- Use only the evidence provided for new information; cite it as {E3}, {E7}. You may also cite the chapter's existing references as [12]. Never invent references, numbers or study details.
- Prefer guidelines and systematic reviews over single trials; skip small, low-quality or disease-oriented studies, and anything not relevant to primary care.
- Be selective: suggest only the changes an expert editor would make.
- action "delete_item": remove the whole bullet named in "item" (e.g. "P3.2").
- action "replace_text": in bullet "item", replace "find" (an exact phrase copied from that bullet, plain words only, not including citation numbers or SORT ratings, short enough to be unique) with "replace".
- action "insert_item": add a new bullet with "text" to part "part", after bullet "item" (or with "item" empty to add it at the end of the part).
- "sort" is the SORT rating for a new recommendation ("none" if it is not a recommendation). Put citations inside "text" or "replace", not in "sort".
- "evidence" lists the evidence ids and existing reference numbers the change relies on (e.g. ["E3", "[12]"]).
- "note" says briefly why, for the editor (e.g. "Superseded by the 2025 JTFPP guideline update").
- Fields that do not apply to an action are empty strings.
- "summary" is two or three sentences for the editor on what changed and why.`;

async function askClaude(chapterText, refs, evidence, title, progress) {
  const client = new Anthropic();
  const ev = evidence.map(e => `${e.id} (${e.kind}): ${e.citation}${e.pmid ? ` PMID ${e.pmid}` : ''}\n${e.abstract}`).join('\n\n');
  const user = `<chapter title="${title}">\n${chapterText}\n</chapter>\n\n<chapter_references>\n${refs}\n</chapter_references>\n\n<new_evidence>\n${ev || '(none found)'}\n</new_evidence>\n\nSuggest the changes for this chapter, as described.`;
  progress(`Claude is reviewing the chapter against ${evidence.length} new studies and POEMs (this takes a few minutes)…`);
  const stream = client.beta.messages.stream({
    model: MODEL,
    max_tokens: 64000,
    betas: ['server-side-fallback-2026-07-01'],
    fallbacks: 'default',
    thinking: { type: 'adaptive' },
    output_config: { effort: 'high', format: { type: 'json_schema', schema: SCHEMA } },
    system: SYSTEM,
    messages: [{ role: 'user', content: user }]
  });
  const message = await stream.finalMessage();
  if (message.stop_reason === 'refusal') throw new Error('Claude declined to review this chapter.');
  if (message.stop_reason === 'max_tokens') throw new Error('Claude\'s answer was too long and was cut off. Please try again.');
  const text = message.content.filter(b => b.type === 'text').map(b => b.text).join('');
  let result;
  try {
    result = JSON.parse(text);
  } catch {
    throw new Error('Claude\'s answer could not be read. Please try again.');
  }
  console.log(`Chapter update: ${result.edits.length} suggestions; tokens in ${message.usage.input_tokens}, out ${message.usage.output_tokens}`);
  return result;
}

// ---------- Suggestions -> tracked changes ----------
function applyEdits(state, edits, evidence, author = 'Claude') {
  const date = new Date().toISOString();
  const refIdByNumber = new Map(state.references.map((r, i) => [String(i + 1), r.id]));
  const evById = new Map(evidence.map(e => [e.id, e]));
  const newRefs = new Map(state.newReferences.map(r => [r.id, r]));
  const trees = state.parts.map(p => (p.editable ? htmlToTree(p.html) : null));
  const unplaced = [];
  let changeId = 0;

  const refFor = eid => {
    const e = evById.get(eid);
    if (!e) return null;
    const id = e.poem ? `poem${e.poem}` : `pubmed${e.pmid}`;
    const existing = state.references.find(r => r.id === id) || (e.pmid && state.references.find(r => r.id === `pubmed${e.pmid}`));
    if (existing) return existing.id;
    if (!newRefs.has(id)) {
      newRefs.set(id, { id, pmid: e.pmid || null, poem: e.poem || null, ...e.meta, short: e.citation.slice(0, 300), kind: e.kind });
    }
    return id;
  };
  const noteFor = edit => {
    const sources = (edit.evidence || []).map(x => {
      if (evById.has(x)) return evById.get(x).citation.slice(0, 160);
      const m = /^\[?(\d+)\]?$/.exec(x);
      return m ? `Reference [${m[1]}]` : x;
    });
    return [edit.note, sources.length ? `Sources: ${sources.join('; ')}` : ''].filter(Boolean).join(' — ');
  };
  const mark = (tag, edit, children) => ({ tag, cls: `tc tc-${tag}`, data: { author, date, note: noteFor(edit), change: `c${++changeId}` }, children });

  // Claude's text (with {E3} and [12] citations) -> tree nodes.
  const textNodes = (text, sort) => {
    const out = [];
    const re = /\{(E\d+)\}|\[(\d+)\]/g;
    let last = 0, m;
    while ((m = re.exec(text))) {
      if (m.index > last) out.push({ text: text.slice(last, m.index) });
      const key = m[1] ? refFor(m[1]) : refIdByNumber.get(m[2]);
      if (key) out.push({ text: ' ' }, { tag: 'a', cls: 'cite', data: { key }, children: [{ text: '#' }] });
      last = re.lastIndex;
    }
    if (last < text.length) out.push({ text: text.slice(last) });
    if (sort && sort !== 'none') out.push({ text: ' ' }, { tag: 'button', cls: 'sort-tag', data: { sort }, children: [{ text: `(SORT ${sort})` }] });
    return out.map(n => (n.text !== undefined ? { text: n.text.replace(/\s+/g, ' ') } : n));
  };

  const partIndex = name => {
    const m = /^P(\d+)$/.exec(String(name || '').trim());
    const i = m ? Number(m[1]) - 1 : -1;
    return i >= 0 && trees[i] ? i : -1;
  };
  // Each part's bullets are looked up before any change, so numbering stays as Claude saw it.
  const original = trees.map(t => (t ? itemsOf(t) : []));
  const itemByName = name => {
    const m = /^P(\d+)\.(\d+)$/.exec(String(name || '').trim());
    if (!m) return null;
    const i = Number(m[1]) - 1;
    const item = (original[i] || [])[Number(m[2]) - 1];
    return item ? { i, item } : null;
  };

  // Replace an exact phrase inside one text node of an item (whitespace-tolerant).
  const replaceIn = (node, find, edit) => {
    if (!node.children) return false;
    for (let k = 0; k < node.children.length; k++) {
      const c = node.children[k];
      if (c.text !== undefined) {
        let at = c.text.indexOf(find);
        let len = find.length;
        if (at < 0) {
          const pattern = find.trim().split(/\s+/).map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('\\s+');
          const m = pattern ? new RegExp(pattern).exec(c.text) : null;
          if (m) { at = m.index; len = m[0].length; }
        }
        if (at >= 0) {
          const before = c.text.slice(0, at), hit = c.text.slice(at, at + len), after = c.text.slice(at + len);
          const repl = [mark('del', edit, [{ text: hit }])];
          if (edit.replace) repl.push(mark('ins', edit, textNodes(edit.replace, 'none')));
          node.children.splice(k, 1, ...(before ? [{ text: before }] : []), ...repl, ...(after ? [{ text: after }] : []));
          return true;
        }
      } else if (!['a', 'button', 'del', 'ins'].includes(c.tag) && replaceIn(c, find, edit)) {
        return true;
      }
    }
    return false;
  };

  for (const edit of edits) {
    try {
      if (edit.action === 'delete_item') {
        const hit = itemByName(edit.item);
        if (!hit) throw new Error('bullet not found');
        if (hit.item === trees[hit.i]) throw new Error('cannot delete a whole paragraph part');
        hit.item.children = [mark('del', edit, hit.item.children)];
      } else if (edit.action === 'replace_text') {
        const hit = itemByName(edit.item);
        if (!hit) throw new Error('bullet not found');
        if (!edit.find || !replaceIn(hit.item, edit.find, edit)) throw new Error('phrase not found');
      } else if (edit.action === 'insert_item') {
        const i = edit.item ? (itemByName(edit.item) || {}).i : partIndex(edit.part);
        if (i === undefined || i < 0) throw new Error('part not found');
        const tree = trees[i];
        const content = [mark('ins', edit, textNodes(edit.text, edit.sort))];
        const after = edit.item ? itemByName(edit.item) : null;
        const list = (tree.children || []).find(c => c.tag === 'ul' || c.tag === 'ol');
        if (!list) { // a paragraph part: add the new text at its end
          const p = (tree.children || []).filter(c => c.tag === 'p').pop() || tree;
          p.children.push({ text: ' ' }, ...content);
        } else {
          const li = { tag: 'li', cls: '', data: {}, children: content };
          const owner = after ? (tree.children.find(l => (l.children || []).includes(after.item)) || list) : list;
          const at = after ? owner.children.indexOf(after.item) + 1 : owner.children.length;
          owner.children.splice(at > 0 ? at : owner.children.length, 0, li);
        }
      } else {
        throw new Error('unknown action');
      }
    } catch (err) {
      unplaced.push({ ...edit, reason: err.message, noteText: noteFor(edit) });
    }
  }

  state.parts.forEach((p, i) => { if (trees[i]) p.html = (trees[i].children || []).map(treeToHtml).join(''); });
  state.newReferences = [...newRefs.values()];
  state.unplaced = unplaced;
  return state;
}

// ---------- The whole update (run in the background) ----------
const running = new Set();

async function runUpdate(id, user) {
  if (running.has(id)) throw new Error('An update of this chapter is already running.');
  const chapter = store.liveChapter(id);
  if (!chapter) throw new Error('Chapter not found.');
  running.add(id);
  const progress = msg => store.setJob(id, 'running', msg, user);
  progress('Starting…');
  (async () => {
    try {
      const { evidence, sinceMonth } = await gatherEvidence(chapter.title, progress);
      const state = buildEditorState(chapter);
      const { text, refs } = chapterForClaude(state);
      const result = await askClaude(text, refs, evidence, chapter.title, progress);
      applyEdits(state, result.edits, evidence);
      state.summary = result.summary;
      state.evidence = evidence.map(e => ({ id: e.id, kind: e.kind, citation: e.citation, pmid: e.pmid || null, poem: e.poem || null }));
      state.sinceMonth = sinceMonth;
      store.saveDraft(id, state, user);
      const placed = result.edits.length - state.unplaced.length;
      store.setJob(id, 'done', `Claude suggested ${result.edits.length} change${result.edits.length === 1 ? '' : 's'} from ${evidence.length} new studies and POEMs since ${sinceMonth}${state.unplaced.length ? `; ${state.unplaced.length} could not be placed and are listed for you` : ''}.`, user);
      console.log(`Chapter update ${id}: ${placed} placed, ${state.unplaced.length} not placed`);
    } catch (err) {
      console.error(`Chapter update ${id} failed`, err);
      const msg = err instanceof Anthropic.APIError ? `Claude could not be reached (${err.status || 'network error'}). Please try again later.` : err.message;
      store.setJob(id, 'failed', msg, user);
    } finally {
      running.delete(id);
    }
  })();
}

module.exports = { buildEditorState, runUpdate, applyEdits, chapterForClaude, gatherEvidence, itemsOf };
