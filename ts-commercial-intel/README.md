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

## Brand

The interface follows the BIOS brand system v1.3.0 (revision 6): Deep Slate,
Clear White and Authority Cobalt; Instrument Sans for display and Inter for body
(self-hosted in `assets/fonts`, SIL Open Font License); flat color with no
gradients in data; the approved sequential-cobalt and categorical chart
palettes. The logo files in `assets/` are the supplied artwork, unmodified — the
primary mark on Clear White and the reverse mark on exact Deep Slate. BIOS
Electric (`#0021FE`) appears only inside that artwork.

## Public data sources

The Current treatment view, the open-studies table in Pipeline, and four map layers are built
from public APIs (openFDA, ClinicalTrials.gov, PubMed, Medicaid State Drug Utilization Data,
NPI Registry, SEC EDGAR). To refresh:

    python3 data_raw/fetch_public_data.py   # needs network access to those hosts, ~15 min
    python3 build_public_data.py            # writes data/public_data.json, updates data/geo_map.json

`data_raw/MANIFEST.md` documents coverage and limits for each source. No spending or
reimbursement columns are fetched or stored. None of these sources is specific to Tourette
syndrome; see the "How to read this" panel in the view.
