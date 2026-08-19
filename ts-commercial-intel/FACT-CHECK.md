# Fact-check & source audit

Verification log for every headline figure in the app. Status reflects a check against the cited primary source (web-verified on the date noted). Keep this in sync when numbers change.

**Last full pass:** 2026-07-07.

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
| Phase 3 **D1AMOND**: n=**216**, randomized-withdrawal; pediatric relapse **HR ~0.5, P=.008**; weight-neutral | ✅ JAMA Neurology 2026 (multi-source) |
| **NDA submitted June 18, 2026**; Orphan + Fast Track | ✅ Teva IR |
| Teva acquired Emalex: **$700M upfront + up to $200M** milestones; closed **June 10, 2026** | ✅ Teva/GlobeNewswire |
| Orphan: **7-yr exclusivity**, PDUFA waiver, 25% tax credit | ✅ FDA |
| RPD / Priority Review Voucher | ⚠️ **UNCONFIRMED for ecopipam** — labeled as such in Policy view |
| ~**28** TAA Centers of Excellence (Feb 2025) | ✅ (confirm live roster before external use) |
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
