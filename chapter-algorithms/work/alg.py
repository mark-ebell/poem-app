"""Writes chapter-algorithms/<id>.xml from a compact description.

alg(meta_id, title, steps, notes, graphic=None, fig='fig001', supertype='AbCd', comment=None)
steps: list of (label, [(path_label, target)]) where target is a step number (1-based)
or a string (an outcome box shown inside the step as "If <path_label>: <outcome>").
"""
import os, datetime
from xml.sax.saxutils import escape

OUT = '/Users/markebell/Dropbox/Projects/InfoRetriever app project/poem-app/chapter-algorithms'

def alg(meta_id, title, steps, notes=(), graphic=None, fig='fig001', supertype='AbCd', last_update=None):
    lines = [f'<algorithm id="{fig}">', '<meta>', f'<id>{escape(str(meta_id))}</id>',
             f'<supertype>{supertype}</supertype>', f'<last_update>{last_update or datetime.date.today().isoformat()}</last_update>', '</meta>',
             f'<title>{escape(title)}</title>']
    if graphic:
        lines.append(f'<graphic href="{escape(graphic)}" />')
    n = len(steps)
    outcomes = []
    cells = []
    for i, (label, paths) in enumerate(steps, 1):
        ps = []
        for plabel, target in paths:
            if isinstance(target, int):
                assert 1 <= target <= n and target != i, (title, i, target)
                tid = f'cell-{target}'
            else:
                outcomes.append(target)
                tid = f'cell-{n + len(outcomes)}'
            ps.append(f'<path target="{tid}">{escape(plabel)}</path>')
        kind = 'start' if i == 1 else ('decision' if paths else 'action')
        cells.append((kind, i, label, ps))
    for k, text in enumerate(outcomes, n + 1):
        cells.append(('action', k, text, []))
    for kind, i, label, ps in cells:
        lines.append(f'<cell type="{kind}" id="cell-{i}">')
        lines.append(f'<label>{escape(label)}</label>')
        lines.extend(ps)
        lines.append('</cell>')
    if notes:
        lines.append('<footnotes>')
        lines.extend(f'<footnote uid="fn{j}">{escape(t)}</footnote>' for j, t in enumerate(notes, 1))
        lines.append('</footnotes>')
    lines.append('</algorithm>')
    return '\n'.join(lines)

def write(chapter, algs, comment=None):
    body = '\n'.join(algs)
    head = f'<!-- {escape(comment)} -->\n' if comment else ''
    with open(os.path.join(OUT, f'{chapter}.xml'), 'w', encoding='utf-8') as f:
        f.write(f'<algorithms>\n{head}{body}\n</algorithms>\n')
