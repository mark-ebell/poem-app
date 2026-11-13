// Writes an edited chapter back into its XML (the Edit Chapter tab's Save).
//
// The editor sends each part it showed as a small tree of its HTML ({ tag, cls, data,
// children } or { text }), already free of tracked changes. Each part replaces the
// content of its element in the chapter's XML (e.g. Diagnosis > Diagnosis_BL), turning
// the editor's markup back into the chapter format: lists, bold, italics, sub- and
// superscripts, SORT ratings (<evidence>), citations and figure links (<xref>). Parts the
// editor did not show (calculator lists, algorithms, ...) are left as they were.
//
// The reference list is then rebuilt: references no longer cited anywhere are removed,
// new ones (from PubMed or POEMs) are added in the order they are first cited, and every
// reference is renumbered (accessionId acc001, acc002, ...) with the citations updated.
const { XMLSerializer } = require('@xmldom/xmldom');
const { parseXml, HEADINGS, key } = require('./chapter-convert');

const elements = e => (e ? Array.from(e.childNodes).filter(n => n.nodeType === 1) : []);
const child = (e, tag) => elements(e).find(c => c.tagName === tag) || null;
const TEMPLATE_ORDER = Object.keys(HEADINGS);
const SORT = new Set(['A', 'B', 'C']);
// No text, citation or SORT rating in it.
const empty = t => (t.text !== undefined ? !t.text.trim() : !['a', 'button'].includes(t.tag) && (t.children || []).every(empty));

class Writer {
  constructor(doc) {
    this.doc = doc;
    this.root = doc.documentElement;
    // Ids cited before the edits (some chapters cite a reference their list never had).
    this.baseCited = new Set(Array.from(this.root.getElementsByTagName('xref')).flatMap(x => String(x.getAttribute('ref') || '').split(/\s+/)));
  }

  el(tag, attrs = {}, kids = []) {
    const e = this.doc.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) if (v !== null && v !== undefined) e.setAttribute(k, String(v));
    for (const k of kids) e.appendChild(typeof k === 'string' ? this.doc.createTextNode(k) : k);
    return e;
  }

  // The element for a part: an existing one, or a new one placed in template order.
  partElement(sectionTag, tag) {
    const text = child(this.root, 'topic_text');
    const section = child(text, sectionTag);
    if (!section) throw new Error(`The chapter has no ${sectionTag} section.`);
    let e = child(section, tag);
    if (e) return e;
    e = this.doc.createElement(tag);
    const pos = TEMPLATE_ORDER.indexOf(key(tag));
    const next = elements(section).find(c => TEMPLATE_ORDER.indexOf(key(c.tagName)) > pos);
    section.insertBefore(e, next || null);
    return e;
  }

  clear(e) {
    while (e.firstChild) e.removeChild(e.firstChild);
  }

  // Editor HTML tree -> chapter XML nodes, appended to parent.
  append(parent, node) {
    if (node.text !== undefined) {
      if (node.text) parent.appendChild(this.doc.createTextNode(node.text));
      return;
    }
    const tag = node.tag, cls = node.cls || '', data = node.data || {};
    const kids = target => (node.children || []).forEach(c => this.append(target, c));
    if (tag === 'ul' || tag === 'ol') {
      const list = this.el('list', { style: tag === 'ol' ? 'numbered' : 'bulleted' });
      for (const li of node.children || []) {
        if (li.tag === 'li' && empty(li)) continue; // e.g. the starter bullet of a new subheading, left blank
        if (li.tag === 'li') { const item = this.el('listitem'); (li.children || []).forEach(c => this.append(item, c)); list.appendChild(item); }
      }
      if (list.firstChild) parent.appendChild(list);
      return;
    }
    if (tag === 'li') { const item = this.el('listitem'); kids(item); parent.appendChild(item); return; }
    if (tag === 'strong' || tag === 'b') { const e = this.el('strong'); kids(e); parent.appendChild(e); return; }
    if (tag === 'em' || tag === 'i') { const e = this.el('em'); kids(e); parent.appendChild(e); return; }
    if (tag === 'sub' || tag === 'sup') { const e = this.el(tag); kids(e); parent.appendChild(e); return; }
    // Citations and SORT ratings: one space before each (the page adds one before each, so
    // without this every save would add another).
    const oneSpace = () => {
      while (parent.lastChild && parent.lastChild.nodeType === 3 && !parent.lastChild.nodeValue.trim()) parent.removeChild(parent.lastChild);
      const prev = parent.lastChild;
      if (prev && prev.nodeType === 3) prev.nodeValue = prev.nodeValue.replace(/\s*$/, ' ');
      else if (prev) parent.appendChild(this.doc.createTextNode(' '));
    };
    if (tag === 'button' && cls.includes('sort-tag')) {
      const rating = String(data.sort || '').toUpperCase();
      if (SORT.has(rating)) { oneSpace(); parent.appendChild(this.el('evidence', { rating, system: 'SORT' }, [` ${rating}`])); }
      return;
    }
    if (tag === 'a' && cls.includes('tool-named')) { // a named link to a risk score (an EE+ decision rule)
      const e = this.el('resourceLink', { href: `info:wiley/eep-rule/${data.rule}` }); kids(e); parent.appendChild(e); return;
    }
    if (tag === 'a' && cls.includes('tool-link')) return; // a risk score's name: written with its citation (data-label)
    if (tag === 'a' && data.key && data.label) {
      oneSpace(); // a risk score's name and citation (the name itself is not written)
      parent.appendChild(this.el('xref', { ref: data.key }, [data.label]));
      return;
    }
    if (tag === 'a' && data.key) { oneSpace(); parent.appendChild(this.el('xref', { ref: data.key })); return; }
    if (tag === 'a' && data.fig) { parent.appendChild(this.el('xref', { ref: data.fig })); return; }
    if (tag === 'a' && data.table) { parent.appendChild(this.el('xref', { ref: data.table })); return; }
    if (tag === 'br') { parent.appendChild(this.doc.createTextNode(' ')); return; }
    if (tag === 'table') { parent.appendChild(this.table(node)); return; }
    if (tag === 'p') {
      if (parent.lastChild) parent.appendChild(this.doc.createTextNode(' '));
      kids(parent);
      return;
    }
    kids(parent); // spans, divs and anything else: keep the content
  }

  table(node) {
    const t = this.el('table');
    const walk = n => {
      if (n.tag === 'caption') { const c = this.el('caption'); (n.children || []).forEach(k => this.append(c, k)); t.appendChild(c); return; }
      if (n.tag === 'tr') {
        const tr = this.el('tr');
        for (const cell of n.children || []) {
          if (cell.tag !== 'td' && cell.tag !== 'th') continue;
          const c = this.el(cell.tag, cell.data && cell.data.colspan ? { colspan: cell.data.colspan } : {});
          (cell.children || []).forEach(k => this.append(c, k));
          tr.appendChild(c);
        }
        t.appendChild(tr);
        return;
      }
      (n.children || []).forEach(walk);
    };
    (node.children || []).forEach(walk);
    return t;
  }

  // The rows of the (first) table in a part's tree, as lists of cell trees, header row skipped.
  tableRows(tree) {
    const rows = [];
    const walk = n => {
      if (n.tag === 'tr') {
        const cells = (n.children || []).filter(c => c.tag === 'td' || c.tag === 'th');
        if (!cells.every(c => c.tag === 'th')) rows.push(cells);
        return;
      }
      (n.children || []).forEach(walk);
    };
    walk(tree);
    return rows;
  }

  differential(e, tree) {
    this.clear(e);
    for (const [name, features] of this.tableRows(tree)) {
      if (!name) continue;
      const d = this.el('Differential');
      const n = this.el('Differential_Name'); (name.children || []).forEach(k => this.append(n, k));
      const f = this.el('Differential_Features'); ((features && features.children) || []).forEach(k => this.append(f, k));
      d.appendChild(n); d.appendChild(f); e.appendChild(d);
    }
  }

  riskFactors(e, tree) {
    this.clear(e);
    for (const [name, or] of this.tableRows(tree)) {
      if (!name) continue;
      const r = this.el('Risk_Factor');
      const n = this.el('Risk_Name'); (name.children || []).forEach(k => this.append(n, k));
      const o = this.el('Risk_OR'); ((or && or.children) || []).forEach(k => this.append(o, k));
      r.appendChild(n); r.appendChild(o); e.appendChild(r);
    }
    // The "Sources:" line under the table: its citations.
    const cites = [];
    const walk = n => { if (n.tag === 'a' && n.data && n.data.key) cites.push(n.data.key); else (n.children || []).forEach(walk); };
    walk(tree);
    if (cites.length) e.appendChild(this.el('Risk_Factors_Ref', {}, cites.map(k => this.el('xref', { ref: k }))));
  }

  writePart(sectionTag, tag, tree) {
    // A part the chapter does not have yet is only added if something was written in it.
    const section = child(child(this.root, 'topic_text'), sectionTag);
    if (section && !child(section, tag) && empty(tree)) return;
    const e = this.partElement(sectionTag, tag);
    const k = key(tag);
    if (k === 'differentialdiagnosis') return this.differential(e, tree);
    if (k === 'riskfactors') return this.riskFactors(e, tree);
    this.clear(e);
    (tree.children || []).forEach(c => this.append(e, c));
  }

  // ---------- References ----------
  newReference(ref) {
    const kids = [];
    const acc = href => this.el('accessionId', { id: 'acc000', href });
    if (ref.poem) kids.push(acc(`info:wiley/eep-poem/${ref.poem}`));
    if (ref.pmid) kids.push(acc(`info:pmid/${ref.pmid}`));
    if (ref.title) {
      for (const [tag, v] of [['authors', ref.authors], ['title', ref.title], ['source', ref.source], ['pubdate', ref.pubdate], ['volume', ref.volume], ['pages', ref.pages]]) {
        kids.push(this.el(tag, {}, [String(v || '')]));
      }
    } else {
      kids.push(this.el('citation', {}, [String(ref.citation || '')]));
    }
    return this.el('reference', { id: ref.id }, kids);
  }

  rebuildReferences(newReferences) {
    const misc = child(child(this.root, 'topic_text'), 'Misc');
    const refsEl = misc ? child(misc, 'References') : null;
    if (!refsEl) throw new Error('The chapter has no reference list.');
    // Links to figures and tables are not citations. A link may name several references
    // (ids separated by spaces); a citation of a reference the list never had is left alone.
    const notRefs = new Set(['algorithm', 'figure', 'feature'].flatMap(t => Array.from(this.root.getElementsByTagName(t)).map(a => a.getAttribute('id'))));
    const idsOf = x => String(x.getAttribute('ref') || '').split(/\s+/).filter(id => id && !notRefs.has(id));
    const xrefs = Array.from(this.root.getElementsByTagName('xref')).filter(x => idsOf(x).length);
    const cited = new Set(xrefs.flatMap(idsOf));
    const existing = elements(refsEl).filter(r => r.tagName === 'reference');
    const existingIds = new Set(existing.map(r => r.getAttribute('id')));
    const newById = new Map((newReferences || []).map(r => [r.id, r]));

    const missing = [...cited].filter(id => !existingIds.has(id) && !newById.has(id) && !this.baseCited.has(id));
    if (missing.length) throw new Error(`Cited but not in the reference list: ${missing.join(', ')}`);

    const order = existing.filter(r => cited.has(r.getAttribute('id')));
    const seen = new Set(order.map(r => r.getAttribute('id')));
    for (const id of xrefs.flatMap(idsOf)) { // new references, in the order they are first cited
      if (!seen.has(id) && newById.has(id)) { order.push(this.newReference(newById.get(id))); seen.add(id); }
    }

    this.clear(refsEl);
    const accFor = new Map();
    order.forEach((r, i) => {
      const n = String(i + 1).padStart(3, '0');
      elements(r).filter(a => a.tagName === 'accessionId').forEach((a, j) => a.setAttribute('id', `acc${n}${j ? String.fromCharCode(97 + j) : ''}`));
      if (elements(r).some(a => a.tagName === 'accessionId')) accFor.set(r.getAttribute('id'), `acc${n}`);
      refsEl.appendChild(r);
    });
    for (const x of xrefs) {
      const acc = accFor.get(idsOf(x)[0]);
      if (acc) x.setAttribute('resource', acc);
      else x.removeAttribute('resource');
    }
    return { kept: order.length, removed: existing.length - order.filter(r => existingIds.has(r.getAttribute('id'))).length };
  }

  setUpdated(date = new Date()) {
    const info = child(this.root, 'topic_info');
    let u = child(info, 'topic_lastupdated');
    if (!u) { u = this.el('topic_lastupdated'); info.appendChild(u); }
    this.clear(u);
    const mm = String(date.getMonth() + 1).padStart(2, '0'), dd = String(date.getDate()).padStart(2, '0');
    u.appendChild(this.doc.createTextNode(`${mm}/${dd}/${date.getFullYear()}`));
  }
}

// baseXml: the chapter as it was; edits: { parts: [{ section, tag, tree }], newReferences }.
// Returns { xml, kept, removed } (references kept and removed).
function writeChapterXml(baseXml, edits, date = new Date()) {
  const doc = parseXml(baseXml);
  const w = new Writer(doc);
  // Chapters laid out as nested <section> elements (about 50; see typedParts in
  // chapter-convert.js) have no template tags to write each part back into.
  if ((edits.parts || []).some(p => p.tag === 'section' || p.tag === 'subsection' || p.section === 'section')) {
    throw new Error('this chapter uses the older nested-section layout, which Edit Chapter cannot save yet');
  }
  for (const p of edits.parts || []) w.writePart(p.section, p.tag, p.tree);
  const counts = w.rebuildReferences(edits.newReferences);
  w.setUpdated(date);
  // Keep the file's own opening lines (XML declaration and DOCTYPE).
  const start = String(baseXml).replace(/^﻿/, '');
  const prologue = start.slice(0, start.search(/<topic[\s>]/));
  const body = new XMLSerializer().serializeToString(doc.documentElement);
  return { xml: prologue + body + '\n', ...counts };
}

// ---------- Algorithms (the algorithm editor in the Edit Chapter tab) ----------
// alg: { title, cells: [{ id: 'cell-N', type: 'start'|'decision'|'action', tree,
// paths: [{ target: 'cell-N', tree }] }], notes: [tree] }, the trees being the editor's
// HTML as in writeChapterXml. The algorithm keeps its id, <meta> (last_update becomes
// today) and image; its title, boxes, arrows and footnotes are replaced. A new id is
// added after the chapter's other algorithms. Returns the chapter's new XML.
const CELL_TYPES = new Set(['start', 'decision', 'action']);

function checkAlgorithm(alg) {
  const cells = Array.isArray(alg && alg.cells) ? alg.cells : [];
  if (!cells.length) throw new Error('the algorithm has no boxes');
  const ids = new Set();
  for (const c of cells) {
    if (!/^cell-\d+$/.test(String(c.id))) throw new Error(`bad box id ${c.id}`);
    if (ids.has(c.id)) throw new Error(`two boxes are numbered ${c.id}`);
    if (!CELL_TYPES.has(c.type)) throw new Error(`bad box type ${c.type}`);
    ids.add(c.id);
  }
  for (const c of cells) {
    for (const p of c.paths || []) if (!ids.has(p.target)) throw new Error(`an arrow from ${c.id} leads to a box that does not exist`);
  }
  if (cells.filter(c => c.type === 'start').length !== 1) throw new Error('an algorithm needs exactly one Start box');
}

function writeAlgorithm(baseXml, figId, alg, date = new Date()) {
  checkAlgorithm(alg);
  if (!/^fig\d+$/.test(String(figId))) throw new Error('bad algorithm id');
  const doc = parseXml(baseXml);
  const w = new Writer(doc);
  const root = doc.documentElement;
  let a = Array.from(root.getElementsByTagName('algorithm')).find(e => e.getAttribute('id') === figId);
  const nl = () => doc.createTextNode('\n');
  if (!a) {
    a = w.el('algorithm', { id: figId });
    a.appendChild(nl());
    let group = child(root, 'algorithm_group');
    if (!group) {
      group = w.el('algorithm_group');
      const text = child(root, 'topic_text');
      root.insertBefore(group, text ? text.nextSibling : null);
      root.insertBefore(nl(), group);
    }
    group.appendChild(nl());
    group.appendChild(a);
    group.appendChild(nl());
  }
  // Keep <meta> and <graphic>; everything else is rewritten.
  const keep = elements(a).filter(e => e.tagName === 'meta' || e.tagName === 'graphic');
  while (a.firstChild) a.removeChild(a.firstChild);
  let meta = keep.find(e => e.tagName === 'meta');
  if (!meta) meta = w.el('meta');
  let lu = child(meta, 'last_update');
  if (!lu) { lu = w.el('last_update'); meta.appendChild(lu); }
  w.clear(lu);
  lu.appendChild(doc.createTextNode(date.toISOString().slice(0, 10)));
  a.appendChild(nl()); a.appendChild(meta); a.appendChild(nl());
  a.appendChild(w.el('title', {}, [String(alg.title || '').replace(/\s+/g, ' ').trim()]));
  a.appendChild(nl());
  const graphic = keep.find(e => e.tagName === 'graphic');
  if (graphic) { a.appendChild(graphic); a.appendChild(nl()); }
  // Runs of spaces collapse to one (the page adds a space before each citation and SORT
  // rating, so without this every save would add another).
  const tidy = e => {
    const walk = n => {
      for (const k of Array.from(n.childNodes)) {
        if (k.nodeType === 3) k.nodeValue = k.nodeValue.replace(/\s+/g, ' ');
        else if (k.nodeType === 1) walk(k);
      }
    };
    walk(e);
    const first = e.firstChild, last = e.lastChild;
    if (first && first.nodeType === 3) first.nodeValue = first.nodeValue.replace(/^ /, '');
    if (last && last.nodeType === 3) last.nodeValue = last.nodeValue.replace(/ $/, '');
    return e;
  };
  const fill = (e, tree) => { (tree && tree.children || []).forEach(k => w.append(e, k)); return tidy(e); };
  for (const c of alg.cells) {
    const cell = w.el('cell', { type: c.type, id: c.id });
    cell.appendChild(nl());
    cell.appendChild(fill(w.el('label'), c.tree));
    for (const p of c.paths || []) { cell.appendChild(nl()); cell.appendChild(fill(w.el('path', { target: p.target }), p.tree)); }
    cell.appendChild(nl());
    a.appendChild(cell);
    a.appendChild(nl());
  }
  const notes = (alg.notes || []).filter(t => !empty(t));
  if (notes.length) {
    const fns = w.el('footnotes');
    for (const t of notes) { fns.appendChild(nl()); fns.appendChild(fill(w.el('footnote'), t)); }
    fns.appendChild(nl());
    a.appendChild(fns);
    a.appendChild(nl());
  }
  return serialize(baseXml, doc);
}

// Removes an algorithm. Refuses while the chapter's text still links to it.
function removeAlgorithm(baseXml, figId) {
  const doc = parseXml(baseXml);
  const a = Array.from(doc.documentElement.getElementsByTagName('algorithm')).find(e => e.getAttribute('id') === figId);
  if (!a) throw new Error('no such algorithm');
  const links = Array.from(doc.documentElement.getElementsByTagName('xref'))
    .filter(x => String(x.getAttribute('ref') || '').split(/\s+/).includes(figId));
  if (links.length) throw new Error(`the chapter's text links to this algorithm in ${links.length} place${links.length === 1 ? '' : 's'}; remove those links (in the review) first`);
  const next = a.nextSibling;
  if (next && next.nodeType === 3 && !next.nodeValue.trim()) next.parentNode.removeChild(next);
  a.parentNode.removeChild(a);
  return serialize(baseXml, doc);
}

// The next free figure id (algorithms and pictures share the numbering).
function newFigureId(baseXml) {
  const ids = [...String(baseXml).matchAll(/<(?:algorithm|figure)\b[^>]*\bid="fig(\d+)"/g)].map(m => Number(m[1]));
  return `fig${String((ids.length ? Math.max(...ids) : 0) + 1).padStart(3, '0')}`;
}

function serialize(baseXml, doc) {
  const start = String(baseXml).replace(/^﻿/, '');
  const prologue = start.slice(0, start.search(/<topic[\s>]/));
  return prologue + new XMLSerializer().serializeToString(doc.documentElement) + '\n';
}

// Authors as the chapters write them: up to 6 listed, otherwise the first 3 and "et al."
function formatAuthors(list) {
  const names = (list || []).filter(Boolean);
  if (!names.length) return '';
  return (names.length > 6 ? [...names.slice(0, 3), 'et al'] : names).join(', ') + '.';
}

module.exports = { writeChapterXml, writeAlgorithm, removeAlgorithm, newFigureId, formatAuthors };
