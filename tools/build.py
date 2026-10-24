#!/usr/bin/env python3
"""One command for a round: fill in defaults, drop what Jeff already answered, check, build.
Usage: build.py qp/<round>.json --cdn ENGINE_URL
Writes qp/<round>.html (the card: show_widget it verbatim) and qp/<round>.file.html
(the same round with the engine inside, the fallback file). Prints both paths.

Shortcuts in the round data (all optional):
  screens without "kind" or "id": guessed (options=decide, items with a/b=pair, ends=scale,
    rows starting with a number keycap=todo, other rows=report); ids s1, s2, ...
  "mem": [{"file","line","was"?}]       -> 🧠 rows on the report
  "title": "<new chat title>"           -> ✅ row with the title in a copy box
  "finish": {"kind":"delete"|"keep","pickup":"...","title"?,"why"?} -> the end-of-chat verdict in its
    own box at the bottom: 🗑️ Safe to close & delete, or 💾 Safe to close, keep this chat
    (the same verdict goes on the chat line after "is ready"; build.py prints it)
  {"kind":"code","q","action","code","more"?,"rows"?} -> a 🔐 screen (Not yet, Approve NNNN)
  "after": "what Claude does after Send" -> faint line by Send
Answered screens: every file in qp/answers/ holds one of Jeff's Sends; a question whose
title appears there is dropped (never re-ask)."""
import glob, json, os, re, sys, urllib.request
from check import check, KEYCAP

HERE = os.path.dirname(os.path.abspath(__file__))
FONTS = '<link href="https://fonts.googleapis.com/css2?family=Source+Sans+3:wght@400;600;700&display=swap" rel="stylesheet">'
with open(os.path.join(HERE, "form.html"), encoding="utf-8") as _f:
    FORM = _f.read().strip()
NUM_FIRST = re.compile("^" + KEYCAP)


def guess(q):
    if q.get("kind"):
        return q["kind"]
    if "options" in q:
        return "decide"
    if "ends" in q:
        return "scale"
    if q.get("items") and isinstance(q["items"][0], dict):
        return "pair"
    rows = q.get("rows") or []
    if rows and NUM_FIRST.match(rows[0].get("s", "")):
        return "todo"
    return "report"


def answered_titles(adir):
    seen = set()
    for path in glob.glob(os.path.join(adir, "*.txt")):
        with open(path, encoding="utf-8") as f:
            lines = f.read().splitlines()
        for i, ln in enumerate(lines[:-1]):
            if lines[i + 1].startswith("Answer:"):
                t = re.sub("^" + KEYCAP + r"\s*", "", ln).replace("\U0001F510 ", "").strip()
                if t and t != "Steps":
                    seen.add(t)
    return seen


def expand(r, adir):
    out, dropped, report = [], [], None
    seen = answered_titles(adir) if adir and os.path.isdir(adir) else set()
    for q in r.get("screens", []):
        q = dict(q)
        if q.get("kind") == "code":
            opts = [{"label": "⏸️ Not yet", "more": q.get("wait", "Nothing changes.")},
                    {"label": "\U0001F510 Approve %s: %s" % (q["code"], q["action"]), "more": q.get("more", q["action"])}]
            q = {"id": q.get("id"), "kind": "decide", "code": True, "q": q["q"], "options": opts, "rows": q.get("rows")}
        q["kind"] = guess(q)
        if q["kind"] not in ("report", "todo") and q.get("q", "").replace("\U0001F510 ", "").strip() in seen:
            dropped.append(q["q"])
            continue
        if q["kind"] == "report" and report is None:
            report = q
        out.append(q)
    if report is None and (r.get("mem") or r.get("title")):
        report = {"kind": "report", "rows": []}
        out.insert(0, report)
    if report is not None:
        rows = list(report.get("rows") or [])
        for m in r.get("mem") or []:
            inner = [{"c": m["line"]}]
            if m.get("was"):
                inner.append({"p": "Was: " + m["was"]})
            rows.append({"s": "\U0001F9E0 %s %s" % ("Updated" if m.get("was") else "Added to", m["file"]), "m": inner})
        if r.get("title"):
            rows.append({"s": "✅ New chat title", "m": [{"p": "Rename this chat to:"}, {"c": r["title"]}]})
        report["rows"] = rows
    fin = r.get("finish")
    verdict = None
    if fin:
        if fin.get("kind") == "delete":
            verdict = "\U0001F5D1\uFE0F Safe to close & delete"
            inner = [{"p": "Pickup point: " + (fin.get("pickup") or "nothing to pick up")}]
            if fin.get("title"):
                inner.append({"c": fin["title"]})
        else:
            verdict = "\U0001F4BE Safe to close, keep this chat"
            inner = [{"p": fin.get("why") or fin.get("pickup") or "Worth keeping to look back at."}]
        out.append({"kind": "report", "rows": [{"s": verdict, "m": inner}]})
    for i, q in enumerate(out, 1):
        q.setdefault("id", "s%d" % i)
        if not q.get("id"):
            q["id"] = "s%d" % i
        if q.get("rows") is None:
            q.pop("rows", None)
    r = dict(r)
    for k in ("mem", "title", "finish", "theme"):
        r.pop(k, None)
    r["screens"] = out
    r["_verdict"] = verdict
    return r, dropped


def html(r, engine_tag):
    data = (json.dumps(r, ensure_ascii=False, separators=(",", ":"))
            .replace("</", "<\\/").replace(chr(0x2028), "\\u2028").replace(chr(0x2029), "\\u2029"))
    summary = '<h2 style="position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)">Question page round %s.</h2>' % r["round"]
    tail = '<script>if(window.QP)QP.mount(%s);else document.getElementById("qp-root").textContent="The page engine did not load. Say engine down."</script>' % data
    return "\n".join([summary, FONTS, '<div id="qp-root"></div>', FORM, engine_tag, tail])


def engine_source(cdn):
    local = os.path.join(os.path.dirname(HERE), "engine.js")
    if os.path.exists(os.path.join(HERE, "engine.js")):
        local = os.path.join(HERE, "engine.js")
    if os.path.exists(local) and not cdn:
        with open(local, encoding="utf-8") as f:
            return f.read()
    with urllib.request.urlopen(cdn, timeout=20) as resp:
        return resp.read().decode("utf-8")


def main(argv):
    path = argv[0]
    cdn = argv[argv.index("--cdn") + 1] if "--cdn" in argv else None
    adir = os.path.join(os.path.dirname(path) or ".", "answers")
    with open(path, encoding="utf-8") as f:
        raw = json.load(f)
    r, dropped = expand(raw, adir)
    verdict = r.pop("_verdict", None)
    errs = check(r)
    if errs:
        print("check failed:\n" + "\n".join(errs))
        return 1
    base = path[:-5] if path.endswith(".json") else path
    card = html(r, '<script src="%s"></script>' % cdn if cdn else "<script>%s</script>" % engine_source(None))
    with open(base + ".html", "w", encoding="utf-8") as f:
        f.write(card)
    rf = dict(r, file=True)
    try:
        fb = html(rf, "<script>%s</script>" % engine_source(cdn))
        with open(base + ".file.html", "w", encoding="utf-8") as f:
            f.write('<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">\n' + fb)
        fbmsg = base + ".file.html"
    except Exception as e:
        fbmsg = "(fallback not built: %s)" % e
    if dropped:
        print("dropped, already answered: " + "; ".join(dropped))
    print("OK %s: %d screens, %d bytes" % (r["round"], len(r["screens"]), len(card)))
    print("card: " + base + ".html")
    print("fallback: " + fbmsg)
    if verdict:
        print("chat line ends: · " + verdict)
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
