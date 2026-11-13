# CNS Launch Atlas

Unbranded market-intelligence and launch-planning app for two CNS markets: rare genetic epilepsy (SCN2A/SCN8A DEE, with Dravet/LGS/CDKL5 as analogs) and essential tremor.

- `dist/index.html` — the app. One self-contained file (data inlined); open it in a browser.
- `src/` — HTML, CSS and JS sources. Visuals follow the BIOS Brand Kit v1.3.0 (palette, Instrument Sans + Inter, supplied wordmark); `025_figures.js` holds the explanatory figures.
- `design/` — design consultation, the review page and the BIOS wordmark file.
- `media/` — Higgsfield SDK example (`main.py`, Seedance 2.5 text-to-video). Copy `.env.local.example` to `.env.local` and set `HF_KEY`.
- `pipeline/` — numbered scripts that pull the public data, then `06_build.py` assembles `dist/index.html`.
- `data/` — pipeline outputs (ClinicalTrials.gov, PubMed, CMS Part D / procedures / spend / enrollment, Medicaid SDUD, NPPES, openFDA, map geometry, Census age bands).
- `research/` — sourced desk-research fact bases (company disclosures, each market, payer/policy/analogs). Every fact has a URL and a confidence flag.

Rebuild: run `python3 pipeline/01_ctgov.py` … `05_openfda.py` as needed (network), then `python3 pipeline/06_build.py`.

Modeled numbers (state patient estimates, priority index, influence score, simulator) are labeled in the app and explained under Sources & methods.
