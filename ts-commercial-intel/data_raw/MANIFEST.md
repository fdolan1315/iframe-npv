# data_raw manifest

Public data pulled on **2026-11-13 (UTC)** by `fetch_public_data.py` (Python 3, standard
library only). Re-run everything with `python3 fetch_public_data.py`, or one source with
e.g. `python3 fetch_public_data.py sdud` (names: `ctgov labels shortages faers pubmed sec sdud nppes`).
A full run is about 450 requests and roughly 15 minutes; Medicaid is the slow part.

Every JSON file has `fetched_at`, `source_urls` and `caveats` at the top level. Read the
caveats before putting any figure on screen.

**No dollar amounts anywhere.** The Medicaid reimbursement columns were never requested.
`units_reimbursed` is a quantity of drug units (tablets, mL, patches), not money.

Nothing here is estimated. All eight sources were fetched; none returned an error. The
limits and surprises are listed per file below.

Request identity: `User-Agent: research-client/1.0`, no contact details, 0.4 s pause between
calls, exponential backoff on 429/5xx.

---

## 1. `ctgov_trials.json` — ClinicalTrials.gov API v2

- **303 studies** (API `totalCount` 303, all pages read), with **1,519 location rows**.
- Search: `query.cond = Tourette OR "Tic Disorders" OR "Tic Disorder"`.
- Start dates span 1988-12 to 2026-11; newest registry update 2026-11-12; 59 studies have posted results.
- Status: 174 completed, 40 recruiting, 39 unknown, 19 terminated, 12 not yet recruiting,
  11 withdrawn, 5 active not recruiting, 2 enrolling by invitation, 1 no longer available.
- Phase: 129 N/A, 63 none listed (observational etc.), 44 Ph2, 21 Ph1, 20 Ph3, 13 Ph4,
  5 Ph1/2, 5 Ph2/3, 3 early Ph1.
- `summary.us_open_site_rows_by_state`: US location rows for the 59 "open" studies
  (recruiting, not yet recruiting, active not recruiting, enrolling by invitation) across
  28 states + DC. Largest: FL 18, CA 11, TN 9, MA 8, TX 6.
- **Surprises**
  - The condition search is broader than "Tourette" alone (244 studies): 30 of the 303 have
    no condition term containing "tourette" or "tic" and matched through the registry's
    synonym expansion. Filter on the per-study `conditions` list if a strict set is needed.
  - "Enrolling by invitation" is counted as open; the brief named only three statuses. The
    list used is in `summary.open_statuses`.
  - Site counts are location rows, not unique institutions, and one site can host several studies.
  - Seven ecopipam studies are present; the long-term safety study NCT06021522 is the only one
    still active.

## 2. `openfda_labels.json` — openFDA drug label + Drugs@FDA

- **12 agents, one label each**, with full `indications_and_usage`, boxed warning text and
  `mentions_tourette`.
- `mentions_tourette` is **true for haloperidol, pimozide and aripiprazole** and false for the
  other nine.
- Boxed warning present on **8 of 12** (absent: guanfacine, clonidine ER, pimozide, topiramate).

| Agent | Label used | Effective | Boxed | Tourette in indications |
|---|---|---|---|---|
| guanfacine | Intuniv (Takeda) | 2025-06-23 | no | no |
| clonidine | generic clonidine ER (American Health Packaging) | 2026-10-14 | no | no |
| haloperidol | generic tablets (Cardinal Health) | 2026-10-15 | yes | **yes** |
| pimozide | generic tablets (Par) | 2026-08-12 | no | **yes** |
| aripiprazole | Abilify (Otsuka) | 2025-01-29 | yes | **yes** |
| risperidone | Risperdal (Janssen) | 2026-10-23 | yes | no |
| fluphenazine | generic tablets (Marlex) | 2026-11-05 | yes | no |
| ziprasidone | Geodon (Viatris) | 2025-01-15 | yes | no |
| topiramate | Topamax (Janssen) | 2026-03-12 | no | no |
| tetrabenazine | Xenazine (Lundbeck) | 2026-11-06 | yes | no |
| deutetrabenazine | Austedo / Austedo XR (Teva) | 2025-02-28 | yes | no |
| valbenazine | Ingrezza (Neurocrine) | 2026-04-17 | yes | no |

- **Brand labels not found in openFDA**: Kapvay, Haldol (oral), Orap. For those, and for
  fluphenazine (no brand marketed), the newest generic label is used and `selection` /
  `label_note` say so. For clonidine the fallback was narrowed to a label whose indications
  mention "attention deficit" so that it is the extended-release, Kapvay-equivalent product;
  ordinary clonidine tablets and Catapres-TTS patches are labelled for hypertension only.
- A first pass matched "Abilify" to **Abilify Maintena** (the injectable, no Tourette
  indication). The script now requires the exact brand name; worth knowing if anyone edits
  the brand list.
- Drugs@FDA (generic-availability proxy), single-ingredient applications with at least one
  product not discontinued — applications / distinct sponsors: guanfacine 22/20,
  clonidine 31/28, haloperidol 34/25, pimozide 2/2, aripiprazole 38/30, risperidone 34/28,
  fluphenazine 29/24, ziprasidone 12/11, topiramate 39/30, tetrabenazine 9/9,
  deutetrabenazine 3/2, valbenazine 5/4. Wider counts (including combinations and
  discontinued) are also in the file.
- **Caution**: "not discontinued" includes tentative approvals, so deutetrabenazine 3/2 and
  valbenazine 5/4 do **not** mean generics are on the market. Sponsor names are raw FDA
  strings; one company can appear under several spellings.

## 3. `openfda_shortages.json` — openFDA drug shortages

- **6 records total**: guanfacine 4, haloperidol 2. The other **10 agents have zero records**
  and are listed explicitly with `record_count: 0`.
- All six are status **"To Be Discontinued"**, not active shortages: guanfacine ER tablets
  (Actavis, posted 2025-11-13) and haloperidol decanoate injection (Fresenius Kabi, posted
  2026-01-09). No shortage reason is given on any of them.
- So on the fetch date, **no agent on the list had a current-shortage record**. Zero means
  "no match in the database" (the API answers 404), not a guarantee of supply.
- openFDA data last updated 2026-11-12; the whole dataset held 1,586 records.

## 4. `openfda_faers.json` — FDA adverse event reports

- Per agent: total reports, top 20 reaction terms, and the same for under-18s. All 24
  queries worked.
- Totals (all ages / under 18): guanfacine 9,190 / 3,655; clonidine 66,176 / 4,953;
  haloperidol 37,838 / 1,402; pimozide 608 / 70; aripiprazole 128,934 / 8,799;
  risperidone 118,135 / 12,486; fluphenazine 2,109 / 46; ziprasidone 10,579 / 498;
  topiramate 87,518 / 4,788; tetrabenazine 5,997 / 339; deutetrabenazine 7,695 / 26;
  valbenazine 25,434 / 22.
- Drug filter: `(patient.drug.openfda.generic_name:"<agent>" OR patient.drug.activesubstance.activesubstancename:"<agent>")`.
- Under-18 filter: `patient.patientonsetage:[0 TO 17] AND patient.patientonsetageunit:801`
  (age in years only; reports with no age are not counted, so this undercounts).
- **Surprise**: the harmonized generic-name field alone returns **zero** for deutetrabenazine
  and undercounts others (e.g. risperidone 75k vs 118k), which is why the union of two fields
  is used. Counts will therefore not match a naive openFDA query.
- These are **spontaneous reports, not incidence**. The agent may be a suspect or merely a
  co-medication, all indications are pooled, duplicates are not removed, and drugs cannot be
  compared with each other on these numbers. openFDA data last updated 2026-10-28.

## 5. `medicaid_sdud.json` — Medicaid State Drug Utilization Data

- **Full extraction, nothing skipped**: all 12 agents, years **2022, 2023, 2024, 2025 (four
  quarters each) and 2026 Q1 only**. Datasets last modified by CMS 2026-07-10 to 2026-07-13.
- `rows`: **10,485** agent × state × year × quarter cells across 52 jurisdictions (50 states,
  DC, PR). `national_xx_rows`: 204 cells of CMS's own national "XX" totals, kept separately.
  `product_breakdown`: 475 rows showing exactly which product names were captured per agent
  and year. 0 fetch errors.
- Each cell carries `number_of_prescriptions`, `units_reimbursed`, `ndc_rows` and
  `suppressed_rows_excluded`.
- **Suppression is large.** CMS hides any NDC/state/quarter row with fewer than 11
  prescriptions. Across the state rows, **273,642 of 662,729 NDC rows (41%) were suppressed**
  and are excluded from the sums. By agent it runs from about 21–28% (guanfacine) to
  53–57% (pimozide) and 82–87% (tetrabenazine). 1,131 state cells were suppressed entirely;
  those have `null` counts, not 0.
- Because of that, low-volume agents are badly understated at state level. Example, pimozide
  2023: states sum to 6,799 prescriptions, CMS's national XX row says 7,992 — and the XX row
  is itself subject to suppression. Treat state figures for pimozide, tetrabenazine and
  fluphenazine as floors.
- Scale check (sum of states, prescriptions, 2025): clonidine 5.90M, aripiprazole 5.11M,
  guanfacine 4.11M, risperidone 3.47M, topiramate 2.84M, haloperidol 0.88M,
  ziprasidone 0.45M, fluphenazine 0.13M, valbenazine 84.8k, deutetrabenazine 60.5k,
  pimozide 5.3k, tetrabenazine 5.2k.
- **Matching** is by prefix on SDUD's 10-character product name (long names are truncated,
  e.g. `ARIPIPRAZO`). Prefix list (also in the file):
  guanfacine GUANFAC / INTUNIV / TENEX; clonidine CLONIDIN / KAPVAY / CATAPRES / NEXICLON /
  ONYDA / DURACLON; haloperidol HALOPERI / HALDOL; pimozide PIMOZ / "ORAP " ;
  aripiprazole ARIPIPRA / ABILIFY / ARISTADA; risperidone RISPERID / RISPERDAL / PERSERIS /
  UZEDY / RYKINDO; fluphenazine FLUPHENA; ziprasidone ZIPRASID / GEODON; topiramate TOPIRAM /
  TOPAMAX / TROKENDI / QUDEXY / EPRONTIA; tetrabenazine TETRABEN / XENAZINE;
  deutetrabenazine DEUTETRA / AUSTEDO; valbenazine VALBENAZ / INGREZZA.
- **Surprises**
  - A bare `ORAP` prefix also matched **Orapred (prednisolone)**. Fixed with a trailing space
    and re-run; the committed file has no Orapred rows.
  - No rows at all for the brands **Orap, Kapvay or Tenex** in 2022–2026 — pimozide volume is
    entirely generic.
  - All formulations are pooled: clonidine includes patches, ER, oral liquid and epidural
    injection (Duraclon); aripiprazole and risperidone include long-acting injectables
    (Abilify Maintena, Aristada, Risperdal Consta, Perseris, Uzedy, Rykindo). Use
    `product_breakdown` to see the mix; state rows cannot be split by product from this file.
  - Medicaid only, all uses of the drug. None of this is Tourette-specific volume, and most of
    it is for other conditions.
  - 2026 is one quarter, and recent quarters are revised by states after first release.
  - The API has no index on product name, so each query is a 7–13 second table scan. The
    script issues two grouped queries per agent-year (120 in all) three at a time.

## 6. `pubmed_evidence.json` — NCBI E-utilities

- 13 blocks (12 agents + ecopipam): total records for `<agent> AND "Tourette Syndrome"[MeSH Terms]`,
  RCT count, meta-analysis/systematic review count, and the 5 most recent records.
- total / RCT / MA-SR: guanfacine 30/1/6, clonidine 168/8/9, haloperidol 412/14/10,
  pimozide 118/10/6, aripiprazole 101/3/10, risperidone 82/6/8, fluphenazine 22/0/2,
  ziprasidone 21/1/3, topiramate 26/1/3, tetrabenazine 47/2/4, deutetrabenazine 12/2/1,
  valbenazine 9/0/1, **ecopipam 18/5/2**.
- `tourette_mesh_records_by_year`, 2010–2026: between 132 and 188 a year; 2025 = 140;
  **2026 = 100 and is a partial year**.
- **Caution**: the RCT counts look low against the literature (e.g. aripiprazole 3) because
  they depend on NLM's publication-type tagging and on MeSH indexing, which lags by months.
  These are record counts, not an evidence grade, and should not be presented as "number of
  trials conducted".

## 7. `sec_teva_filings.json` — SEC EDGAR submissions (Teva, CIK 0000818686)

- **SEC accepted the generic User-Agent** — no refusal, no contact details sent.
- `filings`: the **40 most recent**, 2026-08-17 to 2026-11-12, with form, filing date,
  accession number and primary document URL.
- **Surprise**: those 40 are mostly insider paperwork — 13 Form 4, 9 Form 144, 2 Form 3,
  2 Schedule 13G/A, plus 7 8-K, 1 10-Q, 2 424B5, 2 FWP, 1 8-A12B/A, 1 25-NSE. So the file
  also has `recent_periodic_and_current_reports`: the 20 most recent 10-K / 10-Q / 8-K
  (2025-07-30 to 2026-11-03, including the 10-K filed 2026-02-03).
- Document URLs are built from the standard EDGAR path and were **not opened or verified**
  (`www.sec.gov` is outside the allowed hosts). No filing text was fetched, so no financial
  figures are in this file.

## 8. `nppes_specialists.json` — NPI Registry

- Individual providers (NPI-1) by state for 52 jurisdictions (50 states, DC, PR), 0 errors.
- **Child neurology** (2084N0402X): no state hit the cap. 3,238 providers with a practice
  location in the queried state (4,017 on the wider any-address count). Largest: CA 332,
  TX 306, NY 238. Wyoming is 0 on practice location.
- **Child & adolescent psychiatry** (2084P0804X): **CA and NY hit the 1,200-record API cap**;
  both are `capped: true` with **no count reported**. The other 50 jurisdictions total 8,381
  on practice location (9,957 any address) — a sum that excludes the two biggest states, so
  it is not a national total.
- The API cannot filter by taxonomy code, only by description; results were then filtered to
  records that actually hold the code. Its state filter matches mailing as well as practice
  addresses, hence the two counts. `providers_practice_location_in_state` is the one to use.
- NPI taxonomy is self-reported, is not board certification, and records linger after people
  retire or move. Treat as an upper-ish indicator of where specialists are, not a workforce census.

---

## Not done / open items

- CA and NY child-psychiatry counts (API cap). Getting them needs the full NPPES download
  file, which is on a host outside the allowed list.
- Medicaid state rows are not split by formulation; add `product_name` to the state grouping
  if the app needs ER-vs-IR or oral-vs-injectable by state (it multiplies query time).
- SEC document URLs unverified.
- `data.cms.gov` was on the allowed list but nothing in the brief required it; not used.
