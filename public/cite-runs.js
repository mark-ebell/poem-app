// Citations next to each other are shown as the chapters always show them, "7 10 123".
// Separator text between them, such as " // " from an earlier chapter update, is replaced
// with a space (and so removed from the chapter when it is next saved).
export function markCiteRuns(root) {
  root.querySelectorAll('a.cite').forEach(a => {
    const between = [];
    let n = a.nextSibling;
    while (n && n.nodeType === 3 && /^[\s,;/\u200b]*$/.test(n.nodeValue)) { between.push(n); n = n.nextSibling; }
    if (!n || n.nodeType !== 1 || !n.matches('a.cite')) return;
    between.forEach(t => { if (/[,;/]/.test(t.nodeValue)) t.nodeValue = ' '; });
  });
}
