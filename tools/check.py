#!/usr/bin/env python3
"""Check a round's data (after build.py expands it) before it is shown.
Usage: check.py round.json   (exit 1 on any problem)"""
import json, re, sys

KINDS = {"report", "todo", "decide", "do", "pair", "rank", "drag", "scale", "date"}
QKINDS = KINDS - {"report", "todo"}
# number keycap built with chr() on purpose: saving a skill strips the hidden character and turns escape codes back into it
KEYCAP = "[1-9]" + chr(0xFE0F) + "?" + chr(0x20E3)
EMO = re.compile("^(?:" + KEYCAP + r"|[^\w\s]\S*)\s+\S")


def rows_ok(rows, w, bad, emoji=True):
    for x in rows:
        if not any(k in x for k in ("p", "c", "s")):
            bad(w, "row needs p, c or s")
        if "s" in x:
            if emoji and not EMO.match(x["s"]):
                bad(w, "row needs its emoji and a space first: " + x["s"][:30])
            m = x.get("m")
            # v2.3: a row with no m is a plain line with no dropdown (allowed); an m that is present but empty is a mistake
            if m is not None and ((isinstance(m, str) and not m.strip()) or (isinstance(m, list) and not m)):
                bad(w, "row with an empty dropdown: " + x["s"][:30])
            if isinstance(m, list):
                rows_ok(m, w + " > " + x["s"][:18], bad, emoji)


def check(r):
    errs = []

    def bad(where, msg):
        errs.append(where + ": " + msg)

    if not re.fullmatch(r"[a-z]{2,8}\d{1,4}", r.get("round", "")):
        bad("round", "id must look like iqp18")
    if r.get("ideas") is not None:
        return check_ideas(r, errs, bad)

    screens = r.get("screens") or []
    if not screens:
        bad("screens", "none")
    ids = set()
    for n, q in enumerate(screens, 1):
        w = "screen %d" % n
        k = q.get("kind")
        if k not in KINDS:
            bad(w, "unknown kind %s" % k)
        if not q.get("id") or q.get("id") in ids:
            bad(w, "missing or repeated id")
        ids.add(q.get("id"))
        if "—" in json.dumps(q, ensure_ascii=False):
            bad(w, "em dash")
        if k in ("report", "todo"):
            rows = q.get("rows") or []
            if not rows:
                bad(w, k + " with no rows")
            rows_ok(rows, w, bad)
        if k in QKINDS and q.get("rows"):
            rows_ok(q["rows"], w, bad, emoji=False)  # explanation rows under a question are plain words
        if k in QKINDS and not (q.get("q") or "").strip():
            bad(w, "question needs a short title in q")
        if k in ("decide", "do"):
            opts = q.get("options") or []
            if not 2 <= len(opts) <= 4:
                bad(w, "needs 2 to 4 options")
            picks = [o for o in opts if o.get("pick")]
            if q.get("code"):
                if picks:
                    bad(w, "code screens take no Claude pick")
                if not opts or "not yet" not in opts[0].get("label", "").lower():
                    bad(w, "code screens start with Not yet")
            elif q.get("multi"):
                if picks:
                    bad(w, "multi-pick screens take no Claude pick")
            elif len(picks) != 1:
                bad(w, "needs exactly one Claude pick")
        if k == "pair":
            items = q.get("items") or []
            if not 1 <= len(items) <= 4:
                bad(w, "pair needs 1 to 4 items")
            for it in items:
                if not all(it.get(f) for f in ("id", "text", "a", "b")):
                    bad(w, "pair item needs id, text, a, b")
                elif it.get("pick") not in (it.get("a"), it.get("b")):
                    bad(w, 'pair item "%s": pick must be exactly "%s" or "%s"' % (it.get("text", "")[:30], it.get("a"), it.get("b")))
        if k in ("rank", "drag") and not 2 <= len(q.get("items") or []) <= 6:
            bad(w, "needs 2 to 6 items")
        if k == "scale" and len(q.get("ends") or []) != 2:
            bad(w, "needs two end labels")
    return errs


def check_ideas(r, errs, bad):
    """Grouped page (v1.9.0): r["ideas"] is a list of main ideas, each {t, line?, rows?, steps?, asks?}."""
    ideas = r.get("ideas") or []
    if not ideas:
        bad("ideas", "none")
    seen = set()
    for n, I in enumerate(ideas, 1):
        w = "idea %d" % n
        if "—" in json.dumps(I, ensure_ascii=False):
            bad(w, "em dash")
        if not (I.get("t") or "").strip():
            bad(w, "needs a short title in t")
        if not (I.get("rows") or I.get("steps") or I.get("asks")):
            bad(w, "empty idea: give it rows, steps or asks")
        rows_ok(I.get("rows") or [], w, bad)
        for x in I.get("steps") or []:
            if not (x.get("s") or "").strip():
                bad(w, "step needs s")
        asks = I.get("asks") or []
        for q in asks:
            if q.get("id") in seen:
                bad(w, "repeated question id " + str(q.get("id")))
            seen.add(q.get("id"))
        sub = check({"round": r["round"], "screens": asks}) if asks else []
        for e in sub:
            if not e.startswith("round"):
                bad(w, e)
    for q in r.get("screens") or []:
        if q.get("kind") != "report":
            bad("screens", "a grouped round keeps its questions inside ideas")
    return errs


if __name__ == "__main__":
    with open(sys.argv[1], encoding="utf-8") as f:
        r = json.load(f)
    e = check(r)
    print("\n".join(e) if e else "OK %s: %d %s" % (r["round"], len(r.get("ideas") or r.get("screens") or []), "ideas" if r.get("ideas") is not None else "screens"))
    sys.exit(1 if e else 0)
