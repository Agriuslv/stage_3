"""Extract vocabulary groups (headwords + question/answer pairs) from 'Stage 3 student.pdf'.

Layout of the vocabulary pages: bold, centred headwords; questions right-aligned in the
left column (ending at x~292); answers in the right column (from x~303); 'or:' starts an
alternative answer.

Usage: python3 tools/parse_pdf.py "Stage 3 student.pdf" out.json
"""
import json
import re
import sys

import pdfplumber

SPLIT = 298  # x coordinate between question and answer columns


def is_bold(w):
    return "Bold" in w["fontname"]


def lines_of(page):
    words = [w for w in page.extract_words(extra_attrs=["fontname", "size"]) if w["size"] >= 13]
    words.sort(key=lambda w: (w["top"], w["x0"]))
    # Words are split where the font changes (e.g. bold key word inside a word); glue them back.
    merged = []
    for w in words:
        prev = merged[-1] if merged else None
        if prev and abs(w["top"] - prev["top"]) < 3 and 0 <= w["x0"] - prev["x1"] < 1.0:
            prev["text"] += w["text"]
            prev["x1"] = w["x1"]
            prev["bold_all"] = prev["bold_all"] and is_bold(w)
            continue
        w = dict(w)
        w["bold_all"] = is_bold(w)
        merged.append(w)
    words = merged
    lines, cur, cur_top = [], [], None
    for w in words:
        if cur and abs(w["top"] - cur_top) > 4:
            lines.append(sorted(cur, key=lambda x: x["x0"]))
            cur = []
        if not cur:
            cur_top = w["top"]
        cur.append(w)
    if cur:
        lines.append(sorted(cur, key=lambda x: x["x0"]))
    return lines


def text(ws):
    return " ".join(w["text"] for w in ws).strip()


def clean(s):
    s = re.sub(r"\s+", " ", s).strip()
    s = re.sub(r"(\w)’ (d|s|t|m|re|ll|ve)\b", r"\1’\2", s)  # "I’ d" -> "I’d"
    s = re.sub(r"(?<![\w’'.])([B-HJ-Zb-z]) ([a-z’']+)", r"\1\2", s)  # 'g o' -> 'go', 'W hat’s' -> 'What’s'
    s = s.replace("‘ ", "‘").replace(" ’", "’")
    s = s.replace(" ,", ",").replace(" .", ".").replace(" ?", "?")
    return s


PROMPT = re.compile(r"(\?|!|:|\.)$")


def heading_kind(line):
    """'head' for a centred bold headword, 'table' for a table row, None for question/answer text."""
    x0, x1 = line[0]["x0"], line[-1]["x1"]
    gaps = [b["x0"] - a["x1"] for a, b in zip(line, line[1:])]
    if gaps and max(gaps) > 20:
        return "table"
    if not all(w["bold_all"] for w in line):
        return None
    centre = (x0 + x1) / 2
    if abs(centre - 297) > 25:
        return None  # e.g. a bold teacher prompt right-aligned in the question column
    if 301 <= x0 <= 305:
        return None  # bold text inside the answer column
    return "head"


def parse(path, first_page=2, last_page=91):
    pdf = pdfplumber.open(path)
    groups = []
    group = None
    pair = None

    def close_pair():
        nonlocal pair
        if pair and group is not None:
            q = clean(pair["q"])
            alts = [clean(a) for a in pair["a"] if clean(a)]
            if q and alts:
                group["qa"].append({"q": q, "a": alts, "page": pair["page"]})
            elif q and not alts:
                group["notes"].append(q)
        pair = None

    for pn in range(first_page, min(last_page, len(pdf.pages))):
        page = pdf.pages[pn]
        for line in lines_of(page):
            kind = heading_kind(line)
            if kind == "head":
                close_pair()
                if group is None or group["qa"] or group["notes"]:
                    group = {"words": [], "qa": [], "notes": [], "tables": [], "page": pn + 117}
                    groups.append(group)
                group["words"].append(clean(text(line)))
                continue
            if kind == "table":
                if group is not None:
                    group["tables"].append(clean(text(line)))
                continue
            left = [w for w in line if w["x1"] <= SPLIT]
            right = [w for w in line if w["x0"] >= SPLIT - 2]
            lt, rt = clean(text(left)), text(right)
            if lt:
                cq = pair["q"].strip() if pair else ""
                answered = pair is not None and bool(clean(pair["a"][0]))
                complete = pair is not None and (
                    not cq or re.search(r"[?:…]$|\.\.\.$", cq) or (answered and re.search(r"[.!]$", cq)))
                if pair is None or complete:
                    # A wrapped answer line can sit next to the next question: keep it with the old answer.
                    if pair and rt and not re.search(r"[.!?…]$", clean(pair["a"][-1])) and clean(pair["a"][-1]):
                        pair["a"][-1] += " " + rt
                        rt = ""
                    close_pair()
                    pair = {"q": "", "a": [""], "page": pn + 117}
                pair["q"] += " " + lt
            if rt:
                if pair is None:
                    pair = {"q": "", "a": [""], "page": pn + 117}
                parts = re.split(r"(?:^|\s)or:\s*", rt)
                for i, part in enumerate(parts):
                    if i > 0:
                        pair["a"].append("")
                    pair["a"][-1] += " " + part
        close_pair()
    close_pair()
    out = []
    for g in groups:
        if out and len(g["words"]) == 1 and re.fullmatch(r"[a-z]+\?", g["words"][0]) and out[-1]["notes"] \
                and not out[-1]["notes"][-1].endswith("?"):
            out[-1]["notes"][-1] += " " + g["words"][0]
            out[-1]["qa"] += g["qa"]
            continue
        out.append(g)
    return [g for g in out if g["words"]]


if __name__ == "__main__":
    data = parse(sys.argv[1])
    with open(sys.argv[2], "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=1)
    print(len(data), "groups,", sum(len(g["qa"]) for g in data), "pairs,",
          sum(len(g["words"]) for g in data), "headwords")
