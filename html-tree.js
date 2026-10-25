// A chapter part's HTML as a small tree ({ tag, cls, data, children } or { text }), the
// form the Edit Chapter tab sends on Save (chapter-xml-write.js) and the chapter update
// works on (chapter-update.js). Only the markup the chapters use is expected.
const { DOMParser, XMLSerializer } = require('@xmldom/xmldom');

function nodeToTree(n) {
  if (n.nodeType === 3 || n.nodeType === 4) return { text: n.nodeValue };
  if (n.nodeType !== 1) return null;
  const data = {};
  for (const a of Array.from(n.attributes || [])) {
    if (a.name.startsWith('data-')) data[a.name.slice(5).replace(/-([a-z])/g, (_, c) => c.toUpperCase())] = a.value;
  }
  if (n.getAttribute('colspan')) data.colspan = n.getAttribute('colspan');
  return {
    tag: n.tagName.toLowerCase(),
    cls: n.getAttribute('class') || '',
    data,
    children: Array.from(n.childNodes).map(nodeToTree).filter(Boolean)
  };
}

function parseFragment(html) {
  const doc = new DOMParser({ onError: () => {} }).parseFromString(`<div>${html}</div>`, 'text/html');
  return doc.getElementsByTagName('div')[0];
}

function htmlToTree(html) {
  return nodeToTree(parseFragment(html));
}

// Plain text of a tree (for showing a part to Claude and matching quoted phrases).
function treeText(t) {
  if (!t) return '';
  if (t.text !== undefined) return t.text;
  return (t.children || []).map(treeText).join('');
}

// Tree -> HTML (escaped text; attributes from cls and data).
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const VOID = new Set(['br']);
function treeToHtml(t) {
  if (t.text !== undefined) return esc(t.text);
  const attrs = [];
  if (t.cls) attrs.push(`class="${esc(t.cls)}"`);
  for (const [k, v] of Object.entries(t.data || {})) {
    if (k === 'colspan') attrs.push(`colspan="${esc(v)}"`);
    else attrs.push(`data-${k.replace(/[A-Z]/g, c => `-${c.toLowerCase()}`)}="${esc(v)}"`);
  }
  if (t.tag === 'button') attrs.push('type="button"');
  if (t.tag === 'a') attrs.push('href="#"');
  const open = `<${t.tag}${attrs.length ? ' ' + attrs.join(' ') : ''}>`;
  if (VOID.has(t.tag)) return open;
  return `${open}${(t.children || []).map(treeToHtml).join('')}</${t.tag}>`;
}

module.exports = { htmlToTree, treeText, treeToHtml, parseFragment, XMLSerializer };
