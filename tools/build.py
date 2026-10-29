#!/usr/bin/env python3
"""One command for a round: fill in defaults, drop what Jeff already answered, check, build.
Usage: build.py qp/<round>.json --cdn ENGINE_URL [--print] [--static-form]
       build.py --stdin --cdn ENGINE_URL < W/<round>.json   (v2.7: the round from the file Claude wrote; saves Q/<round>.json
       and prints the whole card to paste into show_widget, so the round is typed once)
Writes qp/<round>.html (the card: show_widget it verbatim) and qp/<round>.file.html
(the same round with the engine inside, the fallback file). Prints both paths.

The grouped page (v1.9.0, the reply format): "ideas": [{"t","line"?,"rows"?,"steps"?,"asks"?,"mem"?}]
  one numbered box per main idea, collapsed on load; t = short title, line = the gray one-line gist,
  rows = ❌ ✅ ⚠️ 🧠 rows, steps = Jeff's checkboxes {s,m}, asks = questions (decide, pair, code, ...),
  mem = 🧠 rows; each idea gets its own note box at the bottom, and there is no page note. Ideas keep their order across rounds;
  a finished idea is left out of the next round and new ideas go at the end.
Shortcuts in the round data (all optional):
  screens without "kind" or "id": guessed (options=decide, items with a/b=pair, ends=scale,
    rows starting with a number keycap=todo, other rows=report); ids s1, s2, ...
  "mem": [{"file","line","was"?,"sha"?}] -> 🧠 rows on the report (sha = the commit, shown on the row)
  "finish": {"kind":"delete"|"keep","pickup":"...","why"?} -> the end-of-chat verdict in its
    own box at the bottom: 🗑️ Safe to close & delete, or 💾 Safe to close, keep this chat
    (the same verdict goes on the chat line after "is ready"; build.py prints it)
  {"kind":"code","q","action","code","more"?,"rows"?} -> a 🔐 screen (Not yet, Approve NNNN)
  "shots": false                        -> leaves out the hidden screenshot send form (on by default:
    on the Mac a screenshot pasted with Cmd-V into any note reaches Claude; Jeff, iqp M1 test)
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


def fix_pair(q):
    """v2.8: a pair item's pick may be "a" or "b"; it becomes that button's label."""
    if q.get("kind") == "pair":
        items = []
        for it in q.get("items") or []:
            it = dict(it)
            p = it.get("pick")
            if p in ("a", "b") and p not in (it.get("a"), it.get("b")):
                it["pick"] = it.get(p)
            items.append(it)
        q["items"] = items
    return q


def answered_titles(adir):
    seen = set()
    for path in glob.glob(os.path.join(adir, "*.txt")):
        with open(path, encoding="utf-8") as f:
            lines = f.read().splitlines()
        for i, ln in enumerate(lines[:-1]):
            if lines[i + 1].startswith("Answer:"):
                t = re.sub("^" + KEYCAP + r"\s*", "", ln).replace("\U0001F510 ", "")
                t = re.sub(r"^Q: ", "", t).strip()
                if t and t != "Steps":
                    seen.add(t)
    return seen


def code_q(q):
    opts = [{"label": "Not yet", "more": q.get("wait", "Nothing changes.")},
            {"label": "\U0001F510 Approve %s: %s" % (q["code"], q["action"]), "more": q.get("more", q["action"])}]
    return {"id": q.get("id"), "kind": "decide", "code": True, "q": q["q"], "options": opts, "rows": q.get("rows")}


def mem_title(m):
    """v2.7: the 🧠 row's line names the file and, when given, the commit sha."""
    return "\U0001F9E0 %s %s%s" % ("Updated" if m.get("was") else "Added to", m["file"],
                                   (" \u00b7 " + str(m["sha"])) if m.get("sha") else "")


def mem_rows(mems):
    rows = []
    for m in mems or []:
        inner = [{"c": m["line"]}]
        if m.get("was"):
            inner.append({"p": "Was: " + m["was"]})
        rows.append({"s": mem_title(m), "m": inner})
    return rows


def expand_ideas(r, seen):
    """Grouped page (v1.9.0): ideas keep their order; a question Jeff already answered is dropped;
    an idea left with nothing in it is dropped."""
    ideas, dropped, n = [], [], 0
    for I in r.get("ideas") or []:
        I = dict(I)
        rows = list(I.get("rows") or []) + mem_rows(I.pop("mem", None))
        asks = []
        for q in I.get("asks") or []:
            q = dict(q)
            if q.get("kind") == "code":
                q = code_q(q)
            q["kind"] = guess(q)
            fix_pair(q)
            if q.get("q", "").strip() in seen:
                dropped.append(q["q"])
                continue
            n += 1
            q.setdefault("id", "q%d" % n)
            if not q.get("id"):
                q["id"] = "q%d" % n
            if q.get("rows") is None:
                q.pop("rows", None)
            asks.append(q)
        I["rows"], I["asks"] = rows, asks
        if rows or asks or I.get("steps"):
            ideas.append(I)
    return ideas, dropped


def expand(r, adir):
    out, dropped, report = [], [], None
    seen = answered_titles(adir) if adir and os.path.isdir(adir) else set()
    if r.get("ideas") is not None:
        ideas, dropped = expand_ideas(r, seen)
        r = dict(r, ideas=ideas)
    for q in r.get("screens", []):
        q = dict(q)
        if q.get("kind") == "code":
            q = code_q(q)
        q["kind"] = guess(q)
        fix_pair(q)
        if q["kind"] not in ("report", "todo") and re.sub(r"^Q: ", "", q.get("q", "").replace("\U0001F510 ", "")).strip() in seen:
            dropped.append(q["q"])
            continue
        if q["kind"] == "report" and report is None:
            report = q
        out.append(q)
    if report is None and r.get("ideas") is None and r.get("mem"):
        report = {"kind": "report", "rows": []}
        out.insert(0, report)
    if report is not None:
        rows = list(report.get("rows") or [])
        for m in r.get("mem") or []:
            inner = [{"c": m["line"]}]
            if m.get("was"):
                inner.append({"p": "Was: " + m["was"]})
            rows.append({"s": mem_title(m), "m": inner})
        report["rows"] = rows
    fin = r.get("finish")
    verdict = None
    if fin:
        if fin.get("kind") == "delete":
            verdict = chr(0x1F5D1) + chr(0xFE0F) + " Safe to close & delete"  # built with chr() so a skill save cannot strip the hidden emoji marker
            inner = [{"p": "Pickup point: " + (fin.get("pickup") or "nothing to pick up")}]
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
    # v2.3 lean card: the engine (1.9.1+) injects the font tag and the screenshot form itself; --static-form embeds them as before
    static = "--static-form" in sys.argv
    parts = [summary] + ([FONTS] if static else []) + ['<div id="qp-root"></div>'] + ([FORM] if static and r.get("shots", True) else []) + [engine_tag, tail]
    return "\n".join(parts)


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
    cdn = argv[argv.index("--cdn") + 1] if "--cdn" in argv else None
    if "--stdin" in argv:
        # one call per round (v2.2): the round comes in by heredoc, is saved as qp/<round>.json, and the card is printed
        raw = json.load(sys.stdin)
        path = os.path.join(HERE, raw["round"] + ".json")
        with open(path, "w", encoding="utf-8") as f:
            json.dump(raw, f, ensure_ascii=False)
    else:
        path = argv[0]
        with open(path, encoding="utf-8") as f:
            raw = json.load(f)
    adir = os.path.join(os.path.dirname(path) or ".", "answers")
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
    print("OK %s: %d %s, %d bytes" % (r["round"], len(r.get("ideas") or r["screens"]), "ideas" if r.get("ideas") is not None else "screens", len(card)))
    print("card: " + base + ".html")
    print("fallback: " + fbmsg)
    if verdict:
        print("chat line ends: · " + verdict)
    if "--print" in argv or "--stdin" in argv:
        # v2.7: the whole card, round inside, so the round JSON is typed once (in the file) and this is pasted as is
        print("==== card (paste into show_widget verbatim) ====")
        print(card)
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
