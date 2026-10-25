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

class Writer {
  constructor(doc) {
    this.doc = doc;
    this.root = doc.documentElement;
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
        if (li.tag === 'li') { const item = this.el('listitem'); (li.children || []).forEach(c => this.append(item, c)); list.appendChild(item); }
      }
      parent.appendChild(list);
      return;
    }
    if (tag === 'li') { const item = this.el('listitem'); kids(item); parent.appendChild(item); return; }
    if (tag === 'strong' || tag === 'b') { const e = this.el('strong'); kids(e); parent.appendChild(e); return; }
    if (tag === 'em' || tag === 'i') { const e = this.el('em'); kids(e); parent.appendChild(e); return; }
    if (tag === 'sub' || tag === 'sup') { const e = this.el(tag); kids(e); parent.appendChild(e); return; }
    if (tag === 'button' && cls.includes('sort-tag')) {
      const rating = String(data.sort || '').toUpperCase();
      if (SORT.has(rating)) parent.appendChild(this.el('evidence', { rating, system: 'SORT' }, [` ${rating}`]));
      return;
    }
    if (tag === 'a' && data.key) { parent.appendChild(this.el('xref', { ref: data.key })); return; }
    if (tag === 'a' && data.fig) { parent.appendChild(this.el('xref', { ref: data.fig })); return; }
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
    const figureIds = new Set(Array.from(this.root.getElementsByTagName('algorithm')).map(a => a.getAttribute('id')));
    const xrefs = Array.from(this.root.getElementsByTagName('xref')).filter(x => !figureIds.has(x.getAttribute('ref')));
    const cited = new Set(xrefs.map(x => x.getAttribute('ref')));
    const existing = elements(refsEl).filter(r => r.tagName === 'reference');
    const existingIds = new Set(existing.map(r => r.getAttribute('id')));
    const newById = new Map((newReferences || []).map(r => [r.id, r]));

    const missing = [...cited].filter(id => !existingIds.has(id) && !newById.has(id));
    if (missing.length) throw new Error(`Cited but not in the reference list: ${missing.join(', ')}`);

    const order = existing.filter(r => cited.has(r.getAttribute('id')));
    const seen = new Set(order.map(r => r.getAttribute('id')));
    for (const x of xrefs) { // new references, in the order they are first cited
      const id = x.getAttribute('ref');
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
      const acc = accFor.get(x.getAttribute('ref'));
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
  for (const p of edits.parts || []) w.writePart(p.section, p.tag, p.tree);
  const counts = w.rebuildReferences(edits.newReferences);
  w.setUpdated(date);
  // Keep the file's own opening lines (XML declaration and DOCTYPE).
  const start = String(baseXml).replace(/^﻿/, '');
  const prologue = start.slice(0, start.search(/<topic[\s>]/));
  const body = new XMLSerializer().serializeToString(doc.documentElement);
  return { xml: prologue + body + '\n', ...counts };
}

// Authors as the chapters write them: up to 6 listed, otherwise the first 3 and "et al."
function formatAuthors(list) {
  const names = (list || []).filter(Boolean);
  if (!names.length) return '';
  return (names.length > 6 ? [...names.slice(0, 3), 'et al'] : names).join(', ') + '.';
}

module.exports = { writeChapterXml, formatAuthors };
