#!/usr/bin/env python3
"""Check a Shape 2 round's data before it is shown. Usage: check.py round.json  (exit 1 on any problem)."""
import json, re, sys

KINDS = {"report", "todo", "decide", "do", "pair", "rank", "drag", "scale", "date", "shot", "info"}
THEMES = {"navy", "blue", "ngu", "plum", "scarlet", "teal", "gold", "forest"}
MAX_ROWS = 8
EMO = re.compile(r"^[^\w\s]")


def rows_ok(rows, w, bad):
    for x in rows:
        if "s" in x:
            if not EMO.match(x["s"]):
                bad(w, f"row title needs its emoji first: {x['s'][:30]}")
            m = x.get("m")
            if m is None or (isinstance(m, str) and not m.strip()) or (isinstance(m, list) and not m):
                bad(w, f"row with nothing inside: {x['s'][:30]}")
            if isinstance(m, list):
                for y in m:
                    if not any(k in y for k in ("p", "c", "s")):
                        bad(w, f"inner row needs p, c or s: {x['s'][:30]}")


def check(r):
    errs = []
    def bad(where, msg):
        errs.append(f"{where}: {msg}")
    if not re.fullmatch(r"[a-z]{2,8}\d{1,4}", r.get("round", "")):
        bad("round", "id must look like iqp18")
    if r.get("theme", "navy") not in THEMES:
        bad("theme", f"unknown theme {r.get('theme')}")
    screens = r.get("screens") or []
    if not screens:
        bad("screens", "none")
    ids = set()
    for n, q in enumerate(screens, 1):
        w = f"screen {n}"
        k = q.get("kind", "decide")
        if k not in KINDS:
            bad(w, f"unknown kind {k}")
        if q.get("id") in ids or not q.get("id"):
            bad(w, "missing or repeated id")
        ids.add(q.get("id"))
        blob = json.dumps(q, ensure_ascii=False)
        if "—" in blob:
            bad(w, "em dash")
        if k in ("report", "todo", "info"):
            rows = q.get("rows") or []
            if not rows:
                bad(w, f"{k} screen with no rows")
            if len(rows) > MAX_ROWS and k == "todo":
                bad(w, f"todo screen over {MAX_ROWS} rows; the engine splits it, keep steps together")
            rows_ok(rows, w, bad)
            if k == "todo":
                for x in rows:
                    if not re.match(r"^[1-9]️?⃣", x.get("s", "")):
                        bad(w, f"todo row needs a number emoji first: {x.get('s','')[:30]}")
        if k in ("decide", "do"):
            opts = q.get("options") or []
            if not 2 <= len(opts) <= 4:
                bad(w, "needs 2 to 4 options")
            picks = [o for o in opts if o.get("pick")]
            if q.get("multi") and picks:
                bad(w, "multi-pick screens take no Claude pick")
            if q.get("code"):
                if picks:
                    bad(w, "code screens take no Claude pick")
                if not opts or "not yet" not in opts[0].get("label", "").lower():
                    bad(w, "code screens start with Not yet")
            elif k == "decide" and not q.get("multi") and len(picks) != 1:
                bad(w, "needs exactly one Claude pick")
            for o in opts:
                if not EMO.match(o.get("label", "")):
                    bad(w, f"option needs its emoji first: {o.get('label','')[:30]}")
                if "detail" in o:
                    bad(w, "Shape 2 options carry no detail line; put it in more")
        if k == "pair":
            items = q.get("items") or []
            if not 1 <= len(items) <= 4:
                bad(w, "pair needs 1 to 4 items")
            for it in items:
                if not all(it.get(f) for f in ("id", "text", "a", "b")):
                    bad(w, "pair item needs id, text, a, b")
        if k in ("rank", "drag") and not 2 <= len(q.get("items") or []) <= 6:
            bad(w, "needs 2 to 6 items")
        if k == "scale" and len(q.get("ends") or []) != 2:
            bad(w, "needs two end labels")
    return errs


if __name__ == "__main__":
    r = json.load(open(sys.argv[1]))
    e = check(r)
    print("\n".join(e) if e else f"OK {r['round']}: {len(r['screens'])} screens")
    sys.exit(1 if e else 0)
