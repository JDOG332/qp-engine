#!/usr/bin/env python3
"""Check a round's data before it is shown. Usage: check.py round.json  (exit 1 on any problem)."""
import json, re, sys

KINDS = {"info", "decide", "do", "rank", "drag", "scale", "yn", "date", "shot"}
THEMES = {"navy", "blue", "ngu", "plum", "scarlet", "teal", "gold", "forest"}
LIMITS = {"text": 28, "lead": 88, "pill": 22, "s": 44, "label": 32, "detail": 34}


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
        for f in ("pill", "text"):
            if not (q.get(f) or "").strip():
                bad(w, f"empty {f}")
        for f in ("text", "lead", "pill"):
            if len(q.get(f) or "") > LIMITS[f]:
                bad(w, f"{f} over {LIMITS[f]} chars")
        blob = json.dumps(q, ensure_ascii=False)
        if "—" in blob:
            bad(w, "em dash")
        if k == "info":
            rows = q.get("rows") or []
            if not rows:
                bad(w, "info screen with no rows")
            for x in rows:
                if "s" in x and len(x["s"]) > LIMITS["s"]:
                    bad(w, f"row title over {LIMITS['s']}: {x['s'][:30]}")
                if "s" in x and not (x.get("m") or "").strip():
                    bad(w, f"row with nothing inside: {x['s'][:30]}")
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
                if not opts or "not yet" not in opts[0].get("label","").lower():
                    bad(w, "code screens start with Not yet")
            elif k == "decide" and not q.get("multi") and len(picks) != 1:
                bad(w, "needs exactly one Claude pick")
            if picks and not q.get("why") and k == "decide":
                bad(w, "pick without a why")
            for o in opts:
                if len(o.get("label", "")) > LIMITS["label"]:
                    bad(w, f"option over {LIMITS['label']}: {o.get('label','')[:30]}")
                if len(o.get("detail", "")) > LIMITS["detail"]:
                    bad(w, f"detail over {LIMITS['detail']}: {o.get('detail','')[:30]}")
        if k in ("rank", "drag") and not 2 <= len(q.get("items") or []) <= 6:
            bad(w, "needs 2 to 6 items")
        if k == "scale" and len(q.get("ends") or []) != 2:
            bad(w, "needs two end labels")
        if k == "yn" and q.get("pick") not in ("Yes", "No"):
            bad(w, "needs a pick of Yes or No")
    return errs


if __name__ == "__main__":
    r = json.load(open(sys.argv[1]))
    e = check(r)
    print("\n".join(e) if e else f"OK {r['round']}: {len(r['screens'])} screens")
    sys.exit(1 if e else 0)
