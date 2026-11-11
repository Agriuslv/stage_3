"""Build data/vocabulary.js from 'Stage 3 student.pdf' + tools/glossary.py.

Usage (from the repository root):
    python3 tools/build_vocab.py "Stage 3 student.pdf"
"""
import json
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
from glossary import G  # noqa: E402
from parse_pdf import parse  # noqa: E402

# Small corrections of typos / layout problems in the source text.
FIXES = {
    "If the food in shops free?": "Is the food in shops free?",
    "leaning English": "learning English",
    "ther earen’t": "there aren’t",
}

# Answers that the PDF layout mixes up between neighbouring rows.
OVERRIDE = {
    "Do you have your own car?": ["Yes, I have my own car.", "No, I don’t have my own car."],
    "Does he have his own car?": ["Yes, he has his own car.", "No, he doesn’t have his own car."],
    "Is it easy to make a good decision in a short time?": [
        "Yes, it’s easy to make a good decision in a short time.",
        "No, it isn’t easy to make a good decision in a short time, but it’s hard."],
    "Can children always make their own decisions?": [
        "No, children can’t always make their own decisions, but their parents make decisions for them."],
}


def fix(s):
    for a, b in FIXES.items():
        s = s.replace(a, b)
    return s


def main(pdf_path, out_path="data/vocabulary.js"):
    groups = parse(pdf_path)
    missing = []
    units = []
    for g in groups:
        words = []
        for w in g["words"]:
            if w not in G:
                missing.append(w)
                continue
            pos, expl, lv = G[w]
            words.append({"word": w, "pos": pos, "explanation": expl, "translation": lv})
        qa = []
        for p in g["qa"]:
            q = fix(p["q"])
            a = [fix(x) for x in p["a"]]
            a = OVERRIDE.get(q, a)
            qa.append({"q": q, "a": a, "page": p["page"]})
        units.append({
            "id": "g%d" % len(units),
            "title": " · ".join(x["word"] for x in words),
            "page": g["page"],
            "words": words,
            "notes": [fix(n) for n in g["notes"]],
            "tables": g["tables"],
            "qa": qa,
        })
    if missing:
        print("Missing glossary entries:", missing)
    data = {"source": "Stage 3 student.pdf", "groups": units}
    with open(out_path, "w", encoding="utf-8") as f:
        f.write("/* Automātiski ģenerēts no \"Stage 3 student.pdf\" ar tools/build_vocab.py.\n")
        f.write(" * Skaidrojumi un tulkojumi: tools/glossary.py. Nelabo šo failu ar roku – labo avotus un palaid skriptu vēlreiz. */\n")
        f.write("window.VOCABULARY = ")
        json.dump(data, f, ensure_ascii=False, indent=1)
        f.write(";\n")
    print(len(units), "groups,", sum(len(u["qa"]) for u in units), "Q/A pairs,",
          sum(len(u["words"]) for u in units), "words ->", out_path)


if __name__ == "__main__":
    main(sys.argv[1] if len(sys.argv) > 1 else "Stage 3 student.pdf")
