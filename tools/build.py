#!/usr/bin/env python3
"""Build a round into widget code. Usage: build.py round.json [--cdn URL] > out.html
Without --cdn the engine is pasted in (the skill backup). The round is checked first."""
import json, os, sys
from check import check

HERE = os.path.dirname(os.path.abspath(__file__))
FONTS = '<link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,600&family=Source+Sans+3:wght@400;600;700&display=swap" rel="stylesheet">'
FORM = open(os.path.join(HERE, "form.html")).read()


def build(r, cdn=None):
    errs = check(r)
    if errs:
        raise SystemExit("check failed:\n" + "\n".join(errs))
    data = json.dumps(r, ensure_ascii=False, separators=(",", ":")).replace("</", "<\\/")
    summary = f'<h2 style="position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)">Question page round {r["round"]}.</h2>'
    parts = [summary, FONTS, '<div id="qp-root"></div>']
    parts.append(FORM)
    if cdn:
        parts.append(f'<script src="{cdn}"></script>')
    else:
        parts.append("<script>" + open(os.path.join(HERE, "engine.js")).read() + "</script>")
    parts.append(f'<script>if(window.QP)QP.mount({data});else document.getElementById("qp-root").textContent="The page engine did not load. Say engine down and Claude resends this round the backup way."</script>')
    return "\n".join(parts)


if __name__ == "__main__":
    args = sys.argv[1:]
    cdn = None
    if "--cdn" in args:
        cdn = args[args.index("--cdn") + 1]
    r = json.load(open(args[0]))
    sys.stdout.write(build(r, cdn))
