// Citations next to each other (e.g. references 104 and 105) are shown as "104, 105": the
// comma is drawn by CSS (a.cite.cite-more::after), so it is never saved into the chapter.
// Any separator text between them, such as " // " from an earlier update, is removed.
export function markCiteRuns(root) {
  root.querySelectorAll('a.cite.cite-more').forEach(a => a.classList.remove('cite-more'));
  root.querySelectorAll('a.cite').forEach(a => {
    const between = [];
    let n = a.nextSibling;
    while (n && n.nodeType === 3 && /^[\s,;/\u200b]*$/.test(n.nodeValue)) { between.push(n); n = n.nextSibling; }
    if (!n || n.nodeType !== 1 || !n.matches('a.cite')) return;
    a.classList.add('cite-more');
    between.forEach(t => { if (/[,;/]/.test(t.nodeValue)) t.nodeValue = ' '; });
  });
}
