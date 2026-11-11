"""Adds arrows (<path>) to chapters' algorithms from edges.txt and writes chapter-algorithms/<id>.xml.

edges.txt, one algorithm per line:
  eee0668 fig001 | 1>2 Yes | 2>3 Yes | 2>4 No | ~5 New label | +14 decision: Text of a missing box | 14>15
  eee0123 fig001 SKIP reason
Numbers are cell numbers (cell-N). "a>b label" adds an arrow; "~N text" replaces box N's
text; "+N type: text" adds a box; "-N" removes a box; "tN type" changes a box's type; "fn text" adds a footnote.
Lines starting with # are ignored. The file is cumulative; a later line for the same
algorithm replaces an earlier one.
"""
import re, os, sys
from xml.sax.saxutils import escape

APP = '/Users/markebell/Dropbox/Projects/InfoRetriever app project/poem-app'
SRC = '/Users/markebell/Dropbox/Projects/InfoRetriever app project/EEPlus chapters/EE Topics'
OUT = os.path.join(APP, 'chapter-algorithms')
HERE = os.path.dirname(os.path.abspath(__file__))
KEEP = {'eee0001', 'eee0383', 'eee0388', 'eee0389', 'eee0390', 'eee0394'}  # rewritten by hand

def load():
    specs, skips = {}, {}
    for line in open(os.path.join(HERE, 'edges.txt'), encoding='utf-8'):
        line = line.strip()
        if not line or line.startswith('#'):
            continue
        head, *ops = [p.strip() for p in line.split('|')]
        m = re.match(r'(eee\d+)\s+(\S+)(?:\s+SKIP\s*(.*))?$', head)
        if not m:
            sys.exit(f'bad line: {line}')
        key = (m.group(1), m.group(2))
        if m.group(3) is not None or head.split()[-1] == 'SKIP':
            skips[key] = m.group(3) or ''
            specs.pop(key, None)
        else:
            specs[key] = ops
            skips.pop(key, None)
    return specs, skips

def renumber(alg):
    # cells with ids that are not cell-N (eg pasted "Paste_..." ids) become cell-101, cell-102, ...
    n = [100]
    def sub(m):
        n[0] += 1
        return f'id="cell-{n[0]}"'
    return re.sub(r'id="(?!cell-\d+")[^"]*"(?=>\s*<label)', sub, alg)

MARKUP = re.compile(r'</?(?:xref|evidence|list|listitem|strong|em|sup|sub|resourceLink)\b')  # text with these tags is markup

def relabel(orig, text):
    # New text for a box. Text containing markup tags is used as markup as it stands. Otherwise the
    # links and SORT ratings of the original box are kept: "Table 1", "Figure 2" or "Algorithm 2"
    # become the original's links (in order), and "(A)"/"(B)"/"(C)" its evidence ratings.
    new = text if MARKUP.search(text) else escape(text)
    refs = iter(re.findall(r'<xref\b[^>]*/>|<xref\b[^>]*>[\s\S]*?</xref>', orig))
    if '<xref' in orig:
        new = re.sub(r'\b(?:Table|Figure|Algorithm) \d+', lambda m: next(refs, m.group(0)), new)
    if '<evidence' in orig:
        new = re.sub(r' \(([ABC])\)', r'<evidence rating="\1" system="SORT">\1</evidence>', new)
    return new

def apply(alg, ops):
    alg = renumber(alg)
    cells = re.findall(r'<cell\b[^>]*>[\s\S]*?</cell>', alg)
    info = {}
    order = []
    for c in cells:
        cid = re.search(r'id="cell-(\d+)"', c).group(1)
        typ = re.search(r'type="([^"]*)"', c).group(1)
        label = re.search(r'<label\s*/>|<label>([\s\S]*?)</label>', c)
        info[cid] = {'type': typ, 'label': (label.group(1) or '') if label else '', 'paths': []}
        order.append(cid)
    notes = []
    arrows_last = sorted(ops, key=lambda o: bool(re.match(r'\d+\s*>', o)))
    for op in arrows_last:
        if not op:
            continue
        if m := re.match(r'(\d+)\s*>\s*(\d+)\s*(.*)$', op):
            a, b, lab = m.groups()
            if a not in info or b not in info:
                raise ValueError(f'arrow {op}: no such box')
            info[a]['paths'].append((b, escape(lab.strip())))
        elif m := re.match(r'~(\d+)\s+(.*)$', op):
            info[m.group(1)]['label'] = relabel(info[m.group(1)]['label'], m.group(2).strip())
        elif m := re.match(r'\+(\d+)\s+(\w+):\s*(.*)$', op):
            n, typ, text = m.groups()
            if n in info:
                raise ValueError(f'box {n} exists')
            info[n] = {'type': typ, 'label': escape(text.strip()), 'paths': []}
            order.append(n)
        elif m := re.match(r'-(\d+)$', op):
            info.pop(m.group(1)); order.remove(m.group(1))
        elif m := re.match(r'fn\s+(.*)$', op):
            notes.append(m.group(1) if MARKUP.search(m.group(1)) else escape(m.group(1)))
        elif m := re.match(r't(\d+)\s+(\w+)$', op):
            info[m.group(1)]['type'] = m.group(2)
        else:
            raise ValueError(f'bad op {op}')
    built = []
    for cid in order:
        c = info[cid]
        paths = ''.join(f'\n<path target="cell-{t}">{lab}</path>' for t, lab in c['paths'])
        built.append(f'<cell type="{c["type"]}" id="cell-{cid}">\n<label>{c["label"]}</label>{paths}\n</cell>')
    if notes:  # footnotes ("fn text"), after the boxes
        fns = ''.join(f'<footnote uid="fn{j}">{t}</footnote>\n' for j, t in enumerate(notes, 1))
        if '<footnotes>' in alg:
            alg = alg.replace('</footnotes>', fns + '</footnotes>', 1)
        else:
            alg = alg.replace('</algorithm>', f'<footnotes>\n{fns}</footnotes>\n</algorithm>')
    first = alg.find('<cell')
    last = alg.rfind('</cell>') + len('</cell>')
    if first < 0:  # no boxes: put them after the graphic/title
        at = alg.find('<footnotes>')
        at = at if at >= 0 else alg.rfind('</algorithm>')
        return alg[:at] + '\n'.join(built) + '\n' + alg[at:]
    return alg[:first] + '\n'.join(built) + alg[last:]

def main():
    specs, skips = load()
    by_chapter = {}
    for (ch, fig), ops in specs.items():
        by_chapter.setdefault(ch, {})[fig] = ops
    errors = 0
    for ch, figs in sorted(by_chapter.items()):
        if ch in KEEP:
            continue
        xml = open(os.path.join(SRC, ch.upper() + '.xml'), encoding='utf-8').read()
        algs = []
        for fig, ops in sorted(figs.items()):
            m = re.search(r'<algorithm\b[^>]*\bid="%s"[\s\S]*?</algorithm>' % re.escape(fig), xml)
            if not m:
                # a new algorithm (an image the chapter did not use): ops start with "new <image> <title>"
                print(f'{ch} {fig}: not in chapter'); errors += 1; continue
            try:
                algs.append(apply(m.group(0), ops))
            except Exception as e:
                print(f'{ch} {fig}: {e}'); errors += 1
        if algs:
            with open(os.path.join(OUT, f'{ch}.xml'), 'w', encoding='utf-8') as f:
                f.write('<algorithms>\n<!-- Arrows added from the original figure, 2026-11. -->\n' + '\n'.join(algs) + '\n</algorithms>\n')
    print(f'{len(specs)} algorithms with arrows, {len(skips)} skipped, {errors} errors')

if __name__ == '__main__':
    main()
