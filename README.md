# qp-engine

The layout engine for Jeff's inline question page. It draws screens, buttons and the Send step inside a Claude chat.

This repo holds code only: no rounds, no answers, no notes, no names. Each round's content lives in the chat and never comes here.

Rounds load a fixed version through jsDelivr, for example:

https://cdn.jsdelivr.net/gh/JDOG332/qp-engine@<full commit sha>/engine.js (pinned by commit; tags are not used)

## v1.8.0

One long page per round: report, numbered steps, numbered questions, one Send at the bottom.
`tools/build.py qp/<round>.json --cdn <engine url>` fills in defaults, drops questions already
answered (Sends saved in qp/answers/), checks the round and writes the card and a fallback file.
