# qp-engine

The layout engine for Jeff's inline question page. It draws screens, buttons and the Send step inside a Claude chat.

This repo holds code only: no rounds, no answers, no notes, no names. Each round's content lives in the chat and never comes here.

Rounds load a fixed version through jsDelivr, for example:

https://cdn.jsdelivr.net/gh/JDOG332/qp-engine@<full commit sha>/engine.js (pinned by commit; tags are not used)

## v1.16.0

One idea box open at a time: opening a box closes the one that was open, so a long round stays short enough for the iPhone. The tapped header stays at the same spot on screen (the chat or the page is scrolled by exactly what closed above it; a blank pad under Send, or above the card when there is nothing above it, holds the length and melts away as the screen moves off it). Answers in a closed box are kept.

## v1.13.0

A "Close this box" button at the end of every idea box in a grouped round: it folds the box and brings its header back into view, so a long round on the phone never needs a scroll back up to close a finished box.

## v1.15.0

An idea with questions has only the per-question notes (no idea note on top); an idea with no questions keeps its one Add a note about this idea button.

## v1.14.0

No note box shows until Jeff taps: the idea's own note box hides behind an "Add a note about this idea" button, like the per-question notes (and the page note on older screen rounds).

## v1.12.0

A note under every question in a grouped round: an "Add a note" button, closed until tapped; the Send carries it as "Note on this question:" right under that question's answer.

## v1.11.0

Three answer types carried over from the deep-interview widget: `multi` (pick several, 2 to 8 options, optional `max` cap, any number of Claude picks pre-marked), `number` (minus, the number, plus; optional `min`, `max`, `step`, `unit`, `pick`, and `quick`: up to 6 one-tap values), and `text` (a box to type or dictate into; `ph` is the prompt).

## v1.9.0

The grouped page: one numbered box per main idea, every box collapsed on load. Inside each box:
Claude's rows (❌ ✅ ⚠️ 🧠), Jeff's steps, the questions, then that idea's own note box. No page
note; one Send at the bottom. Buttons are plain words and show a ✓ when picked.
`tools/build.py qp/<round>.json --cdn <engine url>` fills in defaults, drops questions already
answered (Sends saved in qp/answers/), checks the round and writes the card and a fallback file.
Older rounds built from `screens` still draw.
