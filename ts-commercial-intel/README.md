# TS Commercial Intelligence

Private, multi-user launch-planning and market-intelligence workspace for the
Tourette syndrome market, anchored on ecopipam / Teva and framed neutrally
across the whole field.

**Status: awaiting source restore.** This directory is the permanent home for
the application. See `RESTORE.md` for what is being restored and how.

## Design principles

1. Credibility over feature count.
2. Every clinical / epidemiological / market number is cited to a primary source.
3. Patients and channel/access only — never pricing or claims-level revenue
   modeling. A clearly-labeled illustrative what-if is the maximum.
4. Neutral, shareable framing of the whole field.

## Architecture

- `index.html` — the entire front end: one file, vanilla JS, no framework and no
  build step. Hash routing, CSS custom-property design tokens (dark/light),
  hand-built inline-SVG charts and a self-contained US map.
- `data/*.json` — all content and datasets, loaded at runtime and gated behind
  authentication.
- `serve.py` — Python standard library only. A single `dispatch(Req) -> Resp`
  router shared by a threaded dev server and a WSGI entry point for hosting.
- `passenger_wsgi.py` — production entry point.
- `build_preview.py` — inlines every `data/*.json` into `index.html` and disables
  auth to produce a single self-contained `preview.html` that opens offline.

## Views

Executive Summary · Market Landscape · Patient Journey · Treatment Algorithm ·
Pipeline · Channel & Sites · Companies · Scenario Planner · Policy & Advocacy ·
Briefings
