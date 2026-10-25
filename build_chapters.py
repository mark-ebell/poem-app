"""
Converts the Essential Evidence textbook chapters (XML, one file per chapter, e.g.
EEE0001.xml) into the data the InfoRetriever app's Chapters tab reads:

    chapters/index.json        the list of chapters (id, title, last updated)
    chapters/eee0001.json      one file per chapter

Run it after adding or changing chapter files, then commit and push this app:

    python3 build_chapters.py                     # reads ../EEPlus chapters
    python3 build_chapters.py /path/to/xml/folder

Only the Python standard library is needed. Headings come from the chapter
template ("Outline of headings and subheadings"); an element the template does not
name is still shown, with a heading made from its tag, and is listed in a warning so
it can be given a proper heading in HEADINGS below.

Each chapter becomes a list of sections (Background, Screening and prevention,
Diagnosis, ...) holding labelled parts whose content is ready-made HTML. Links are
marked with data attributes the page acts on: data-poem (open a POEM by its POEM
number), data-calc + data-num (open the H & P or Tests calculator at an SxDxNum),
data-fig (show a figure), data-sort (SORT definition); everything else (PubMed,
Cochrane, web sites) is an ordinary external link.
"""
import html
import json
import re
import sys
import xml.etree.ElementTree as ET
from collections import Counter
from pathlib import Path

APP_DIR = Path(__file__).resolve().parent
SRC_DIR = Path(sys.argv[1]) if len(sys.argv) > 1 else APP_DIR.parent / "EEPlus chapters"
OUT_DIR = APP_DIR / "chapters"
CALC_DATA = APP_DIR / "calculator-data.json"

# ---------- Headings (from the chapter template) ----------
# Keys are tag names lower-cased with "_" and "-" removed, so Follow-up / Followup and
# Prognosis_detail / Prognosis_Detail are the same heading.
HEADINGS = {
    "background": "Background",
    "bottomline": "Overall Bottom Line",
    "definition": "Definition",
    "incidence": "Incidence",
    "prevalence": "Prevalence",
    "economicimpact": "Economic impact",
    "socialimpact": "Other impact",
    "causes": "Causes of the condition",
    "pathophysiology": "Pathophysiology",
    "riskfactors": "Risk factors",

    "screeningprevention": "Screening and prevention",
    "screeningbl": "Bottom-line",
    "screening": "Screening",
    "screeninglowrisk": "Screening low-risk patients",
    "screeningaveragerisk": "Screening average-risk patients",
    "screeninghighrisk": "Screening high-risk patients",
    "primaryprevention": "Primary prevention",
    "secondaryprevention": "Secondary prevention",

    "diagnosis": "Diagnosis",
    "diagnosisbl": "Bottom-line",
    "differentialdiagnosis": "Differential diagnosis",
    "diagnosticcriteria": "Diagnostic criteria",
    "historyphysical": "Using the history and physical",
    "diagnostictesting": "Selecting diagnostic tests",
    "decisionrules": "Clinical decision rules",
    "diagnosticstrategy": "Approach to the patient",
    "othertestdata": "Other test data",
    "hpdatagroup": "History and physical tests",
    "hpdata": "History and physical tests",
    "dxdatagroup": "Diagnostic tests",
    "dxdata": "Diagnostic tests",

    "treatment": "Treatment",
    "treatmentbl": "Bottom-line",
    "overallapproach": "Overall approach",
    "treatmentdrug": "Drug therapy",
    "treatmentsurgery": "Surgical treatment",
    "treatmentcam": "Complementary/alternative therapy",
    "treatmentpt": "Rehabilitation and exercise",
    "treatmentbehavioral": "Behavioral medicine and psychotherapy",
    "treatmentother": "Other treatment",
    "treatmentduration": "Duration of treatment",
    "treatmentreferral": "Referral and consultation",
    "treatmentcomplications": "Management of complications",
    "treatmenthospital": "Managing the hospitalized patient",
    "treatmentearlystage": "Treatment of early stage disease",
    "treatmentlocoregional": "Treatment of locoregional disease",
    "treatmentadvancedstage": "Treatment of advanced disease",
    "treatmentmilddisease": "Treatment of mild disease",
    "treatmentmoderatedisease": "Treatment of moderate disease",
    "treatmentseveredisease": "Treatment of severe disease",
    "treatmentstagea": "Treatment of Stage A disease",
    "treatmentstageb": "Treatment of Stage B disease",
    "treatmentstagec": "Treatment of Stage C disease",
    "treatmentstaged": "Treatment of Stage D disease",

    "prognosis": "Prognosis",
    "prognosisbl": "Bottom-line",
    "naturalhistory": "Natural history",
    "prognosisdetail": "Prognosis",
    "followup": "Follow-up tests and monitoring",
    "patienteducation": "Patient education",

    "specialpopulations": "Special populations",
    "elderly": "The elderly",
    "pregnancy": "Pregnancy",
    "children": "Infants and children",
}
# Parts that are a section's bottom line (shown highlighted).
BOTTOM_LINES = {"bottomline", "screeningbl", "diagnosisbl", "treatmentbl", "prognosisbl"}
# Not shown: billing codes (the template has no heading for them).
SKIP = {"icd9codes"}

SORT_RATINGS = {"A", "B", "C"}


def key(tag):
    return re.sub(r"[_\-]", "", tag).lower()


def heading_for(tag, unknown):
    k = key(tag)
    if k in HEADINGS:
        return HEADINGS[k]
    unknown[tag] += 1
    return tag.replace("_", " ").strip().capitalize()


esc = lambda s: html.escape(s or "", quote=True)
text_of = lambda e: re.sub(r"\s+", " ", "".join(e.itertext())).strip() if e is not None else ""


# ---------- Calculator links ----------
def load_calculator_labels():
    """SxDxNum -> 'symptom -> disease' for each calculator, for the link text."""
    labels = {"signs": {}, "tests": {}}
    try:
        data = json.loads(CALC_DATA.read_text(encoding="utf-8"))
    except (OSError, ValueError):
        return labels
    for panel in data.get("panels", []):
        which = "signs" if panel["key"] == "signsSymptoms" else "tests"
        counts = {}
        for t in panel["tests"]:
            n = t.get("sxdxNum")
            if n is not None:
                counts.setdefault(n, Counter())[f'{t["symptom"]} → {t["disease"]}'] += 1
        labels[which] = {n: c.most_common(1)[0][0] for n, c in counts.items()}
    return labels


# ---------- One chapter ----------
class Chapter:
    def __init__(self, root, calc_labels, unknown, problems):
        self.root = root
        self.calc_labels = calc_labels
        self.unknown = unknown
        self.problems = problems
        self.refs = {}       # reference id -> { n, kind, ... }
        self.figures = {}    # figure id -> number
        self.calc_found = {"signs": [], "tests": []}  # calculator links, for Decision support
        self.number_references()
        self.number_figures()

    # References are numbered by their position in the list (as in Essential Evidence).
    def number_references(self):
        refs = self.root.find(".//Misc/References")
        if refs is None:
            refs = self.root.find(".//References")
        self.ref_elements = list(refs) if refs is not None else []
        for n, r in enumerate(self.ref_elements, 1):
            rid = r.get("id") or f"ref{n}"
            info = {"n": n, "id": rid}
            for acc in r.findall("accessionId"):
                href = acc.get("href") or ""
                m = re.match(r"info:pmid/(\d+)", href)
                if m:
                    info["pmid"] = m.group(1)
                m = re.match(r"info:wiley/eep-poem/(\d+)", href)
                if m:
                    info["poem"] = m.group(1)
                m = re.match(r"info:wiley/eep-dx/(\d+)", href)
                if m:
                    info["calc"] = ("tests", m.group(1))
                m = re.match(r"info:wiley/eep-hp/(\d+)", href)
                if m:
                    info["calc"] = ("signs", m.group(1))
                m = re.match(r"info:wiley/cochrane/(CD\d+)", href)
                if m:
                    info["cochrane"] = m.group(1)
            if r.get("PMID"):
                info["pmid"] = r.get("PMID")
            url = text_of(r.find("url"))
            if url:
                info["url"] = url
            m = re.match(r"poem(\d+)$", rid)
            if m and "poem" not in info:
                info["poem"] = m.group(1)
            m = re.match(r"pubmed(\d+)$", rid)
            if m and "pmid" not in info:
                info["pmid"] = m.group(1)
            info["text"] = self.citation_text(r)
            info["short"] = self.short_citation(r) or info["text"]
            self.refs[rid] = info

    def number_figures(self):
        for n, a in enumerate(self.root.iter("algorithm"), 1):
            self.figures[a.get("id") or f"fig{n:03d}"] = n

    @staticmethod
    def citation_text(r):
        get = lambda t: text_of(r.find(t))
        if r.find("chapter_title") is not None or r.find("book_title") is not None:  # Cochrane review / book chapter
            parts = [get("chapter_authors"), get("chapter_title"), get("book_editors"), get("book_title"),
                     get("edition"), get("city_publisher"), get("year"), get("pages")]
        elif r.find("url") is not None or r.find("organization") is not None:  # web site
            parts = [get("organization"), get("longtitle") or get("title"), get("url")]
            if get("dateguideline"):
                parts.append(f"Accessed {get('dateguideline')}")
        else:  # journal article
            src = get("source")
            year, vol, pages = get("pubdate"), get("volume"), get("pages").rstrip(".")
            tail = f"{src} {year}" if src else year
            if vol:
                tail += f";{vol}"
            if pages:
                tail += f":{pages}"
            parts = [get("authors"), get("title"), tail]
            if not any(parts):
                parts = [get("citation")]
        return " ".join(p if p.endswith(".") else p + "." for p in (x.strip() for x in parts) if p)

    @staticmethod
    def short_citation(r):
        """An abbreviated reference for the citation pop-up: first author, title, then source,
        year, volume and pages (Ann Allergy 1992;68:35-45.)."""
        get = lambda t: text_of(r.find(t))
        def first_author(names):
            names = names.split(";")[0].strip().rstrip(".")
            parts = [p.strip() for p in names.split(",") if p.strip()]
            if not parts:
                return ""
            return parts[0] + (", et al." if len(parts) > 1 else ".")
        dot = lambda s: s if not s or s.endswith((".", "?", "!")) else s + "."
        if r.find("chapter_title") is not None or r.find("book_title") is not None:
            book = get("book_title")
            year = re.search(r"(19|20)\d\d", book + " " + get("year"))
            if "cochrane" in book.lower():
                issue = re.search(r"Issue\s+(\d+)", book)
                art = re.search(r"(CD\d+)", book)
                src = "Cochrane Database Syst Rev" + (f" {year.group(0)}" if year else "")
                src += (f";({issue.group(1)})" if issue else "") + (f":{art.group(1)}" if art else "")
            else:
                src = book + (f" {year.group(0)}" if year else "")
            parts = [first_author(get("chapter_authors")), dot(get("chapter_title")), dot(src)]
        elif r.find("url") is not None or r.find("organization") is not None:
            parts = [dot(get("organization")), dot(get("longtitle") or get("title"))]
        else:
            src = " ".join(x for x in (get("source"), get("pubdate")) if x)
            vol, pages = get("volume"), get("pages").rstrip(".")
            if vol:
                src += f";{vol}"
            if pages:
                src += f":{pages}"
            parts = [first_author(get("authors")), dot(get("title")), dot(src)]
        return " ".join(p for p in parts if p)

    @staticmethod
    def ref_links(info):
        """Where a reference can be read: [{label, href} | {label, poem} | {label, calc, num}]."""
        links = []
        if info.get("pmid"):
            links.append({"label": "PubMed", "href": f'https://pubmed.ncbi.nlm.nih.gov/{info["pmid"]}/'})
        if info.get("poem"):
            links.append({"label": "POEM", "poem": info["poem"]})
        if info.get("calc"):
            which, n = info["calc"]
            links.append({"label": "H & P calculator" if which == "signs" else "Tests calculator", "calc": which, "num": n})
        if info.get("cochrane"):
            links.append({"label": "Cochrane Library", "href": cochrane_url(info["cochrane"])})
        if info.get("url") and not info.get("pmid"):
            links.append({"label": "Web site", "href": safe_url(info["url"])})
        return links

    def ref_link(self, info):
        """The in-text citation: the reference number, which opens a small pop-up with the
        abbreviated reference and its links (green when the reference is a POEM)."""
        n = info["n"]
        cls = "cite cite-poem" if info.get("poem") else "cite"
        return f'<a href="#ref-{n}" class="{cls}" data-ref="{n}" title="{esc(info["text"])}">{n}</a>'

    # ---------- Inline content -> HTML ----------
    def inline(self, e):
        """The contents of e (text and child elements), as HTML."""
        out = [esc(e.text)]
        for c in e:
            out.append(self.element(c))
            out.append(esc(c.tail))
        return "".join(out)

    def element(self, c):
        tag = c.tag
        if tag in ("strong", "b"):
            return f"<strong>{self.inline(c)}</strong>"
        if tag in ("em", "i"):
            return f"<em>{self.inline(c)}</em>"
        if tag in ("sub", "sup"):
            return f"<{tag}>{self.inline(c)}</{tag}>"
        if tag in ("list", "itemizedlist"):
            name = "ol" if c.get("style") in ("numbered", "ordered") else "ul"
            items = "".join(f"<li>{self.inline(li)}</li>" for li in c if li.tag == "listitem")
            return f"<{name}>{items}</{name}>"
        if tag == "listitem":
            return f"<li>{self.inline(c)}</li>"
        if tag == "evidence":
            rating = (c.get("rating") or text_of(c)).strip().upper()
            if rating not in SORT_RATINGS:
                self.problems.append(f"SORT rating '{rating}'")
            return f' <button type="button" class="sort-tag" data-sort="{esc(rating)}">(SORT {esc(rating)})</button>'
        if tag == "xref":
            ref = c.get("ref") or ""
            if ref in self.figures:
                return f'<a href="#" class="fig-link" data-fig="{esc(ref)}">Figure {self.figures[ref]}</a>'
            if ref in self.refs:
                return " " + self.ref_link(self.refs[ref])
            self.problems.append(f"link to '{ref}', which is not in the references")
            return ""
        if tag == "resource":  # older chapters: an inline link with a PMID
            label = self.inline(c) or "PubMed"
            if c.get("PMID"):
                return f'<a href="https://pubmed.ncbi.nlm.nih.gov/{esc(c.get("PMID"))}/" target="_blank" rel="noopener">{label}</a>'
            return label
        if tag == "reference":  # older chapters: a citation written inline
            return esc(text_of(c))
        if tag == "table":
            return self.table(c)
        if tag in ("url", "Web_URL"):
            u = text_of(c)
            return f'<a href="{esc(safe_url(u))}" target="_blank" rel="noopener">{esc(u)}</a>'
        return self.inline(c)  # anything else: keep its text and formatting

    def table(self, t):
        rows = []
        cap = t.find("caption")
        for tr in t.iter("tr"):
            cells = []
            for td in tr:
                if td.tag not in ("td", "th"):
                    continue
                span = f' colspan="{esc(td.get("colspan"))}"' if td.get("colspan", "1") != "1" else ""
                cells.append(f"<{td.tag}{span}>{self.inline(td)}</{td.tag}>")
            rows.append("<tr>" + "".join(cells) + "</tr>")
        caption = f"<caption>{self.inline(cap)}</caption>" if cap is not None else ""
        return f'<div class="chapter-table-wrap"><table class="chapter-table">{caption}{"".join(rows)}</table></div>'

    # ---------- Special parts ----------
    def risk_factors(self, e):
        rows = [(f.find("Risk_Name"), f.find("Risk_OR")) for f in e.findall("Risk_Factor")]
        rows = [(n, o) for n, o in rows if text_of(n)]
        has_or = any(text_of(o) for _, o in rows)
        body = ""
        if rows:
            head = "<tr><th>Risk factor</th>" + ("<th>Odds ratio (95% CI)</th>" if has_or else "") + "</tr>"
            trs = "".join(f"<tr><td>{self.inline(n)}</td>" + (f"<td>{self.inline(o) if o is not None else ''}</td>" if has_or else "") + "</tr>"
                          for n, o in rows)
            body = f'<div class="chapter-table-wrap"><table class="chapter-table">{head}{trs}</table></div>'
        refs = e.find("Risk_Factors_Ref")
        if refs is not None and len(refs):
            body += f'<p class="chapter-refs">Sources:{self.inline(refs)}</p>'
        return body

    def differential(self, e):
        rows = "".join(f"<tr><td>{self.inline(d.find('Differential_Name'))}</td><td>{self.inline(d.find('Differential_Features'))}</td></tr>"
                       for d in e.findall("Differential") if text_of(d.find("Differential_Name")))
        if not rows:
            return ""
        return f'<div class="chapter-table-wrap"><table class="chapter-table"><tr><th>Diagnosis</th><th>Features</th></tr>{rows}</table></div>'

    def calculator_links(self, e, which):
        nums = [text_of(x) for x in e.iter() if x.tag in ("HP_ID", "Dx_ID") and text_of(x)]
        items = []
        for n in dict.fromkeys(nums):
            label = self.calc_labels[which].get(int(n)) if n.isdigit() else None
            if label is None:
                self.problems.append(f"{'H & P' if which == 'signs' else 'Tests'} calculator #{n} is not in the calculator data")
                label = f"Calculator #{n}"
            self.calc_found[which].append({"num": n, "label": label})
            items.append(f'<li><a href="#" class="calc-link" data-calc="{which}" data-num="{esc(n)}">{esc(label)}</a></li>')
        return f'<ul class="calc-links">{"".join(items)}</ul>' if items else ""

    def web_sites(self, e):
        items = []
        for w in e.findall("Web_Site"):
            name, url = text_of(w.find("Web_Name")), text_of(w.find("Web_URL"))
            if url:
                items.append(f'<li><a href="{esc(safe_url(url))}" target="_blank" rel="noopener">{esc(name or url)}</a></li>')
            elif name:
                items.append(f"<li>{esc(name)}</li>")
        return f"<ul>{''.join(items)}</ul>" if items else ""

    # ---------- Sections ----------
    def part(self, e):
        """One labelled part of a section, or None if it is empty."""
        k = key(e.tag)
        if k in SKIP:
            return None
        if k == "riskfactors":
            content = self.risk_factors(e)
        elif k == "differentialdiagnosis":
            content = self.differential(e)
        elif k in ("hpdatagroup", "hpdata"):
            content = self.calculator_links(e, "signs")
        elif k in ("dxdatagroup", "dxdata"):
            content = self.calculator_links(e, "tests")
        else:
            content = self.inline(e).strip()
            if content and not content.startswith("<"):
                content = f"<p>{content}</p>"  # plain text (e.g. a definition) as a paragraph
        if not re.sub(r"<[^>]+>", "", content).strip():
            return None
        return {"label": heading_for(e.tag, self.unknown), "bottomLine": k in BOTTOM_LINES, "html": content}

    def sections(self):
        text = self.root.find("topic_text")
        out = []
        if text is None:
            return out
        for s in text:
            k = key(s.tag)
            if k == "misc":
                continue
            if k == "section":  # the general layout: <section heading="..."><subsection heading="...">
                parts = []
                if any(c.tag == "subsection" for c in s):
                    for sub in s.findall("subsection"):
                        html_ = self.inline(sub).strip()
                        if re.sub(r"<[^>]+>", "", html_).strip():
                            parts.append({"label": sub.get("heading") or "", "bottomLine": "bottom" in (sub.get("heading") or "").lower(), "html": html_})
                else:
                    html_ = self.inline(s).strip()
                    if html_:
                        parts.append({"label": "", "bottomLine": False, "html": html_})
                label = s.get("heading") or "Section"
            else:
                # The chapter's Overall Bottom Line is shown on its own, above the sections.
                children = [c for c in s if not (k == "background" and key(c.tag) == "bottomline")]
                parts = [p for p in (self.part(c) for c in children) if p]
                label = heading_for(s.tag, self.unknown)
            if parts:
                out.append({"id": re.sub(r"[^a-z0-9]+", "-", label.lower()).strip("-"), "label": label, "parts": parts})

        # Web sites and guidelines (Misc), when there are any.
        misc = text.find("Misc")
        if misc is not None:
            parts = []
            ws = misc.find("Web_Sites")
            if ws is not None and self.web_sites(ws):
                parts.append({"label": "Web sites", "bottomLine": False, "html": self.web_sites(ws)})
            gl = misc.find("Guidelines")
            if gl is not None and text_of(gl):
                parts.append({"label": "Guidelines", "bottomLine": False, "html": self.inline(gl).strip()})
            if parts:
                out.append({"id": "resources", "label": "Web sites and guidelines", "parts": parts})

        # Features (boxed tables or lists outside the main text).
        for f in self.root.findall("feature"):
            html_ = self.inline(f).strip()
            if html_:
                out.append({"id": f"feature-{f.get('uid', '')}", "label": f.get("caption") or "Feature",
                            "parts": [{"label": "", "bottomLine": False, "html": html_}]})
        return out

    def references(self):
        out = []
        for r in self.ref_elements:
            info = self.refs[r.get("id") or ""] if (r.get("id") or "") in self.refs else None
            if not info:
                continue
            links = self.ref_links(info)
            out.append({"n": info["n"], "short": info["short"], "links": links,
                        "html": esc(info["text"]) + (" " + " ".join(link_html(l) for l in links) if links else "")})
        return out

    def figures_list(self):
        out = []
        for a in self.root.iter("algorithm"):
            fid = a.get("id") or ""
            cells = []
            for c in a.findall("cell"):
                cells.append({
                    "id": c.get("id") or "",
                    "type": c.get("type") or "action",
                    "html": self.inline(c.find("label")) if c.find("label") is not None else "",
                    "paths": [{"target": p.get("target") or "", "html": self.inline(p).strip()} for p in c.findall("path")],
                })
            # Show the boxes in the order of their numbers (cell-1, cell-2, ...).
            cells.sort(key=lambda x: int(re.sub(r"\D", "", x["id"]) or 0))
            notes = [self.inline(fn) for fn in a.iter("footnote")]
            out.append({"id": fid, "n": self.figures.get(fid, len(out) + 1), "title": text_of(a.find("title")), "cells": cells, "notes": notes})
        return out

    def people(self):
        authors = []
        for a in self.root.iter("author"):
            authors.append({k: text_of(a.find(f"author_{k}")) for k in ("name", "title", "department", "institution", "city", "state")})
        if not authors:  # older layout: a single author directly in author_info
            ai = self.root.find("author_info")
            if ai is not None and text_of(ai.find("author_name")):
                authors.append({k: text_of(ai.find(f"author_{k}")) for k in ("name", "title", "department", "institution", "city", "state")})
        editors = [text_of(e.find("editor_name")) for e in self.root.iter("editor") if text_of(e.find("editor_name"))]
        return [a for a in authors if a["name"]], editors

    def overall_bottom_line(self):
        bl = self.root.find("topic_text/background/BottomLine")
        part = self.part(bl) if bl is not None else None
        return part["html"] if part else ""

    def build(self):
        info = self.root.find("topic_info")
        authors, editors = self.people()
        return {
            "id": text_of(info.find("topic_id")).lower() if info is not None else "",
            "title": text_of(info.find("title")) if info is not None else "",
            "chapterType": text_of(info.find("chapter_type")) if info is not None else "",
            "updated": text_of(info.find("topic_lastupdated")) if info is not None else "",
            "authors": authors,
            "editors": editors,
            "overallBottomLine": self.overall_bottom_line(),
            "sections": self.sections(),
            "figures": self.figures_list(),
            # Collected while building the sections: the chapter's calculators. Risk scores
            # will be added here once chapters tag them.
            "decisionSupport": {"signs": self.calc_found["signs"], "tests": self.calc_found["tests"], "riskScores": []},
            "references": self.references(),
        }


def safe_url(u):
    u = (u or "").strip()
    if re.match(r"^https?://", u, re.I):
        return u
    if re.match(r"^www\.", u, re.I):
        return "https://" + u
    return "#"


def link_html(link):
    if "href" in link:
        return f'<a href="{esc(link["href"])}" target="_blank" rel="noopener">{esc(link["label"])}</a>'
    if "poem" in link:
        return f'<a href="#" data-poem="{esc(link["poem"])}">{esc(link["label"])}</a>'
    return f'<a href="#" data-calc="{esc(link["calc"])}" data-num="{esc(link["num"])}">{esc(link["label"])}</a>'


def cochrane_url(cd):
    return f"https://www.cochranelibrary.com/cdsr/doi/10.1002/14651858.{cd}/full"


def parse(path):
    raw = path.read_text(encoding="utf-8-sig")
    raw = re.sub(r"<!DOCTYPE[^>\[]*(\[[^\]]*\])?\s*>", "", raw, count=1)  # the DTD is not needed to read the file
    return ET.fromstring(raw)


def main():
    files = sorted(SRC_DIR.glob("*.xml"), key=lambda p: p.name.lower())
    if not files:
        sys.exit(f"No chapter files (*.xml) in {SRC_DIR}")
    OUT_DIR.mkdir(exist_ok=True)
    calc_labels = load_calculator_labels()
    unknown = Counter()
    index, failed, written = [], [], set()
    for f in files:
        problems = []
        try:
            chapter = Chapter(parse(f), calc_labels, unknown, problems).build()
        except ET.ParseError as err:
            failed.append(f"{f.name}: {err}")
            continue
        cid = chapter["id"] or f.stem.lower()
        if not re.fullmatch(r"[a-z0-9]+", cid):
            failed.append(f"{f.name}: unusable topic id '{cid}'")
            continue
        chapter["id"] = cid
        (OUT_DIR / f"{cid}.json").write_text(json.dumps(chapter, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
        written.add(f"{cid}.json")
        index.append({"id": cid, "title": chapter["title"], "updated": chapter["updated"]})
        for p in sorted(set(problems)):
            print(f"  {f.name}: {p}")
    # Chapters whose XML file has gone are removed.
    for old in OUT_DIR.glob("*.json"):
        if old.name != "index.json" and old.name not in written:
            old.unlink()
    index.sort(key=lambda c: c["title"].lower())
    (OUT_DIR / "index.json").write_text(json.dumps(index, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    print(f"Wrote {len(index)} chapter(s) to {OUT_DIR}")
    if unknown:
        print("Elements with no heading in HEADINGS (shown with a heading made from the tag):")
        for tag, n in unknown.most_common():
            print(f"  {tag} ({n})")
    if failed:
        print("Could not read:")
        for x in failed:
            print("  " + x)


if __name__ == "__main__":
    main()
