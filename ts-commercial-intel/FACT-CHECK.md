# Fact-check & source audit

Verification log for every headline figure in the app. Status reflects a check against the cited primary source (web-verified on the date noted). Keep this in sync when numbers change.

**Last full pass:** 2026-11-13 (previous: 2026-07-07). See "Refresh log" at the end for what changed.

## Canonical epidemiology (use these exact framings everywhere — do not mix)

| Concept | Canonical value | Source | Status |
|---|---|---|---|
| Diagnosed TS prevalence, children 3–17 | **~1 in 333 (0.3%)** | CDC (NSCH 2016–2019) | ✅ CDC states verbatim |
| Diagnosed TS count | **~174,000 children** (2016–2019) | CDC | ✅ CDC: "equals about 174,000 children" |
| True prevalence incl. undiagnosed | **~1 in 162 (0.6%)** | CDC (community-screening studies) | ✅ CDC states verbatim |
| Undiagnosed share | **~half of children with TS** | CDC | ✅ CDC states verbatim |
| All-ages total (children **and** adults) | **~350,000–450,000** with TS; **~1,000,000** with a persistent tic disorder | Psychiatry Research 2022 / CDC (2020 pop.) | ✅ verified — note this is *all ages*, not children-only |
| Sex ratio | **~3:1 male** | CDC / literature | ✅ |
| Onset / peak severity | onset **4–6 yrs**, peak **10–12 yrs** | Treatment review (PMC) | ✅ |

**Consistency rules (the fix for the Exec-vs-Market discrepancy):**
1. The **count** of children is always **~174,000 diagnosed**. Never show a different children count as "diagnosed."
2. Whenever "how common is TS" is stated, show **both** diagnosed (1 in 333) and true (1 in 162) with the "~half undiagnosed" bridge — never one alone.
3. The **~348,000** figure appears **only** in the Scenario Planner, explicitly labeled a **model estimate (~2× diagnosed)** — the diagnosis-lift ceiling. It is *not* the published all-ages number (350k–450k, children + adults). The two are kept visually and textually distinct.
4. The Executive Summary and Market Landscape now both anchor on 174,000 diagnosed + 1-in-162 true.

## Comorbidity (TSAICG / Hirschtritt 2015, JAMA Psychiatry; n=1374)

| Metric | Value | Status |
|---|---|---|
| Any lifetime psychiatric comorbidity | **~86% (85.7%)** | ✅ verified |
| OCD and/or ADHD | **~72%** | ✅ verified |
| ADHD | **~54%** | ✅ verified — *corrected from an earlier 45%* |
| OCD | **~50%** | ✅ verified |
| Anxiety | **~54% (53.5%)** | ✅ meta-analysis (PMC) |
| Depression | **~36% (36.4%)** | ✅ meta-analysis (PMC) |
| "Pure" TS (tics only) | **~13%** (lit. range 10–15%) | ✅ within cited range |

## Treatment landscape

| Claim | Status |
|---|---|
| Only **3** FDA-approved TS drugs — haloperidol (1969), pimozide (1984), aripiprazole (2014, most recent) | ✅ well-established |
| AAN 2019: watchful waiting → CBIT first-line → alpha-2 agonists (Level B) → antipsychotics (risk-gated) | ✅ guideline |
| CBIT pivotal RCT: **52.5%** much/very-much improved vs **18.5%** control; **NNT=3** | ✅ Piacentini 2010 |
| Aripiprazole **+1.5 kg** vs placebo (pediatric TS) | ✅ FDA label |
| VMAT2 failures: deutetrabenazine (ARTISTS 1&2), valbenazine (T-Force GOLD) — no TS indication | ✅ verified |

## Ecopipam / deal / regulatory

| Claim | Status |
|---|---|
| Selective **D1 antagonist**, first-in-class, non-antipsychotic | ✅ |
| Phase 3 **D1AMOND**: n=**216** open-label, **104** randomized (90 pediatric); pediatric relapse **HR 0.5, P=.008**; no clinically meaningful weight/metabolic effect | ✅ Gilbert et al., JAMA Neurol 2026;83(7):645-653 |
| **NDA submitted June 18, 2026**; Orphan + Fast Track | ✅ Teva IR |
| **NDA accepted Aug 19, 2026 with Priority Review**; target action date **late Q1 2027**; pediatric-only indication | ✅ Teva release + Q3 2026 10-Q ("decision expected Q1 2027") |
| MDS 2026: **~70%** clinically meaningful tic reduction within 8 weeks (post hoc); **45.6%** mean reduction at 18 months (open-label extension) | ✅ Teva release, Oct 2026 — ⚠️ post hoc / uncontrolled, labeled as such |
| Teva acquired Emalex: **$700M upfront + up to $200M** milestones; closed **June 10, 2026** | ✅ Teva/GlobeNewswire |
| Orphan: **7-yr exclusivity**, PDUFA waiver, 25% tax credit | ✅ FDA |
| RPD / Priority Review Voucher | ⚠️ **UNCONFIRMED for ecopipam** — labeled as such in Policy view |
| **28** TAA Centers of Excellence (Feb 2025); **1+ added** (Univ. of Minnesota, Apr 2026) | ✅ count as of Feb 2025; current total not published — shown as "28+" |
| ~**49%** of US children on Medicaid/CHIP | ✅ AAP/CMS |

## Market size / economics (third-party — clearly labeled as external estimates)

| Claim | Status |
|---|---|
| TS treatment market **~$2.0–2.7B**, ~7% CAGR | ⚠️ third-party (Grand View Research) — labeled as external estimate; we do not model revenue |
| Ecopipam **peak US sales up to ~$1B** | ⚠️ third-party (Jefferies via pharmaphorum) — labeled as external estimate |

## Known caveats carried in the UI
- Regional TS prevalence gradient: **not asserted** (data thin) — Market Landscape says so explicitly.
- Scenario Planner transform assumptions (drug-warranting 20%, per-step retention 70%, CoE floor 15%) are **labeled planning assumptions**, not sourced rates.
- Center-of-Excellence roster is assembled from public sources; **confirm live** before external use.
- **Est. TS pool by state** allocates the national CDC count by child-population share and therefore assumes *equal diagnosed prevalence per child*; real diagnosed prevalence is access-driven. Pair it with specialist/CoE density — never use it alone.
- The **CMS NPI prescriber overlay** was never pulled: the NPI registry API was blocked by network policy during development. It can be layered in from an NPI export or at deployment.

## Refresh log — 2026-11-13

**Changed**
- Ecopipam: NDA accepted with Priority Review (Aug 19, 2026); FDA target action date late Q1 2027. Still **not approved**.
- New MDS 2026 ecopipam data added (post hoc 8-week response; 18-month open-label extension).
- SCI-110: Phase 2b sites activated (Hannover Jul 15, Yale Aug 5); European batch release Oct 2026. Company-sourced.
- Neupulse: launched in the UK as a *wellness* device; medical version still in regulatory development; no FDA clearance.
- TAA Centers of Excellence: University of Minnesota designated Apr 2026; added to the roster and map.

**Re-checked, unchanged**
- CDC prevalence (174,000 diagnosed; 1 in 333; 1 in 162 true) — still on 2016–2019 data.
- Emalex deal: closed June 10, 2026, ~$700M paid (Teva 10-Q). An earlier search summary implied it was still pending; the SEC filing settles it.
- Rare Pediatric Disease designation / voucher — still **unconfirmed**; acceptance coverage names Priority Review, Orphan and Fast Track only.

**Could not verify — treat with care**
- Gemlapodect Phase 2b topline: none located as of this date despite a June 2026 primary-completion estimate. Shown as "overdue", not as a failure.
- Exact PDUFA day: Teva states only "late Q1 2027". The in-app countdown runs to Mar 31, 2027 as the end of that window, not a known date.
- Primary press-release pages (Teva IR, NeurologyLive, HCPLive) were not directly readable from the build environment; these facts rest on search-result summaries of those pages plus the SEC filing. Re-confirm against the originals before external use.
