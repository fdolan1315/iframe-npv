/* Market definitions: analyst synthesis, glossary, quiz, map metrics, simulator defaults. Everything here that is judgment is labeled as such in the UI. */
const R = D.research, RC = R.company || {}, RP = R.payer || {};
const ST = D.states, STK = Object.keys(ST);
const sumSt = f => STK.reduce((a, s) => a + (f(ST[s]) || 0), 0);
/* modeled state allocation weights (relative only) */
const W_DEE = s => s.u20 * 0.75 + (s.pop - s.u20) * 0.07;            /* DEE prevalence skews pediatric; adults ~ a quarter of prevalent pts (assumption) */
const W_ET = s => (s.pop - s.a40_64 - s.a65) * 0.4 + s.a40_64 * 2.0 + s.a65 * 5.5; /* ET prevalence rises steeply with age (relative weights) */
const TOT_W = { dee: sumSt(W_DEE), et: sumSt(W_ET) };
const share = (ta, st) => (ta === "dee" ? W_DEE(ST[st]) : W_ET(ST[st])) / TOT_W[ta];

const TA = {
  dee: {
    key: "dee", name: "Developmental & epileptic encephalopathies", short: "Rare epilepsy (DEE)", tag: "SCN2A / SCN8A anchor · Dravet, LGS, CDKL5 as analogs",
    intro: "Severe, mostly infant-onset genetic epilepsies. The first therapy aimed at SCN2A- and SCN8A-related disease has an FDA action date of 27 Dec 2026, in a category defined so far by fenfluramine, cannabidiol, stiripentol and ganaxolone.",
    assets: ["relutrigine", "elsunersen", "vormatrigine"], lead: "relutrigine",
    funnel: [["US prevalent (SCN2A + SCN8A DEE)", 10000, "Sponsor estimate, Nov 2026 (its 2024 figure was ~5,000 prevalent). A trade-press prevalence of 1–3 per 100,000 for SCN2A alone would imply ~3,300–10,000 (low confidence)"], ["Genetically diagnosed", 5000, "Sponsor estimate"], ["Visible in genetic + claims data", 1900, "Sponsor estimate"], ["On an approved targeted therapy", 0, "None approved yet"]],
    matters: [
      ["Nothing is approved for SCN2A or SCN8A DEE", "Care today is off-label generic sodium-channel blockers at high doses. The first precision candidate (relutrigine) is under priority review; a same-sponsor antisense therapy (elsunersen) is in a registrational study for early-onset SCN2A."],
      ["Patient finding is the launch", "The sponsor now frames ~10K prevalent (up from ~5K in its 2024 materials), ~5K diagnosed and only ~1.9K visible in genetic and claims data. Every point of genetic-testing uptake moves the addressable base, which is why sponsored testing and referral into level 3/4 epilepsy centers matter more than share of voice."],
      ["The market is concentrated", "About 200 accounts hold ~65% of known patients and 60–70% are managed in academic centers. The Geography and People tabs show where pediatric epilepsy capacity, analog-drug use and trial experience overlap."],
      ["Access is a Medicaid plus commercial story", "Roughly 45% Medicaid and 50% commercial. Analog prior-authorization policies almost always name the diagnosis and usually require a specialist prescriber; some add prior anti-seizure medicines, and a few ask for documented benefit at renewal. State Medicaid review can lag approval by 6–12 months."],
      ["Price sits in ultra-orphan territory", "The sponsor has guided to a $400–600K annual list-price corridor. Analogs span $32K (cannabidiol at launch) to roughly $600K (trofinetide), and 2025 orphan launches had a median net price near $480K."],
      ["The bigger prize is label breadth", "A broad-DEE Phase 3 (EMERALD, ~200 enrolled) reads out around year-end 2026. Competing late-stage programs target Dravet (zorevunersen, ETX101) and broad DEE (bexicaserin)."]],
    glossary: [["DEE", "Developmental and epileptic encephalopathy: a condition where both the underlying cause and the seizure activity itself impair development."], ["SCN2A / SCN8A", "Genes encoding the sodium channels Nav1.2 and Nav1.6. Variants can raise channel activity (gain of function) or lower it (loss of function)."], ["Gain of function (GoF)", "Variant that makes the channel overactive. Typically early-onset seizures that respond to sodium-channel blockers."], ["Loss of function (LoF)", "Variant that reduces channel activity. Later-onset seizures, autism and intellectual disability; sodium-channel blockers can worsen seizures."], ["Persistent sodium current", "A small non-inactivating sodium current that is enlarged in many GoF variants; the target of newer 'functional state' modulators."], ["ASM", "Anti-seizure medication."], ["ASO", "Antisense oligonucleotide: a short synthetic strand, usually given intrathecally, that lowers or modifies expression of a target gene."], ["SUDEP", "Sudden unexpected death in epilepsy."], ["NAEC level 3/4", "National Association of Epilepsy Centers accreditation tiers for comprehensive epilepsy centers; level 4 offers the full surgical range."], ["Countable motor seizures", "Seizures with visible motor signs that caregivers can count reliably; the usual primary endpoint in DEE trials."], ["PRV", "Rare pediatric disease priority review voucher, awarded on approval and saleable (recent sales $155–200M)."], ["REMS", "Risk evaluation and mitigation strategy; fenfluramine requires one for cardiac monitoring."], ["Katie Beckett / TEFRA", "Medicaid pathway that covers children with significant disability regardless of parental income."]],
    quiz: [
      { q: "A newborn with SCN2A gain-of-function seizures is most likely to respond to which class?", o: ["Sodium-channel blockers such as phenytoin or carbamazepine", "Levetiracetam", "Benzodiazepines only", "Vigabatrin"], a: 0, why: "Early-onset GoF disease responds to sodium-channel blockers; the same drugs can worsen loss-of-function phenotypes, which is why genotype and functional class matter." },
      { q: "Why is genetic testing the gating step for a targeted SCN2A/SCN8A therapy?", o: ["Payers require it for all epilepsy drugs", "The diagnosis cannot be made clinically, and analog prior authorizations ask for a confirmed etiology", "It determines the dose", "It is required by the REMS"], a: 1, why: "These DEEs are defined by genotype. Only about half of prevalent patients are thought to be diagnosed, so testing drives the addressable base and the PA approval." },
      { q: "Which approved DEE therapy carries a REMS with echocardiogram monitoring?", o: ["Cannabidiol", "Stiripentol", "Fenfluramine", "Ganaxolone"], a: 2, why: "Fenfluramine has a boxed warning for valvular heart disease and pulmonary arterial hypertension and is distributed only through a REMS." },
      { q: "Roughly what share of rare pediatric epilepsy patients should a launch plan expect on Medicaid?", o: ["Under 10%", "About 45–60%", "About 90%", "None; these are commercial patients"], a: 1, why: "Sponsor guidance is ~45% Medicaid for SCN2A/8A; LGS claims cohorts run ~60%. Disability pathways (Katie Beckett/TEFRA) pull in children regardless of family income." },
      { q: "What is the usual primary endpoint in DEE pivotal trials?", o: ["Seizure freedom at 12 months", "Percent change in countable motor seizure frequency vs placebo", "EEG normalization", "Developmental quotient"], a: 1, why: "Trials measure the placebo-adjusted change in monthly countable motor seizures over a treatment period of about 16 weeks." },
      { q: "Where are most known SCN2A/SCN8A patients managed?", o: ["Community pediatricians", "Academic and children's-hospital epilepsy centers", "Adult neurology practices", "Telehealth"], a: 1, why: "The sponsor reports 60–70% in academic centers and ~65% of known patients in the top 200 accounts." }],
    map: [
      { k: "idx", label: "Launch priority index (modeled)", f: null, pc: false },
      { k: "est", label: "Estimated prevalent patients (modeled)", f: (s, st, sc) => (sc.dee_prev || 10000) * share("dee", st), pc: false, fmt: v => N(v, 0) },
      { k: "epi", label: "Epileptologists + child neurologists (NPPES)", f: s => s.epileptologists + s.child_neuro, pc: "u20" },
      { k: "gen", label: "Clinical geneticists (NPPES)", f: s => s.geneticists, pc: "u20" },
      { k: "mcd", label: "Medicaid Rx: fenfluramine + cannabidiol + stiripentol + ganaxolone (2024)", f: s => s.mcd_fintepla_rx + s.mcd_epidiolex_rx + s.mcd_diacomit_rx + s.mcd_ztalmy_rx, pc: "u20" },
      { k: "mcdamt", label: "Medicaid spend: fenfluramine + cannabidiol (2024, pre-rebate $)", f: s => s.mcd_fintepla_amt + s.mcd_epidiolex_amt, pc: "u20", fmt: USD },
      { k: "clb", label: "Medicaid Rx: clobazam + rufinamide (LGS proxy, 2024)", f: s => s.mcd_clobazam_rx + s.mcd_rufinamide_rx, pc: "u20" },
      { k: "hcp", label: "Prescribers of DEE anti-seizure brands (Medicare Part D)", f: s => s.hcp_dee, pc: "pop" },
      { k: "sites", label: "Trial sites, all DEE studies (ClinicalTrials.gov)", f: s => s.sites_dee, pc: "u20" },
      { k: "sitesA", label: "Trial sites in active DEE studies", f: s => s.sites_dee_active, pc: "u20" },
      { k: "u20", label: "Population under 20", f: s => s.u20, pc: false }],
    idx: [["Estimated patients", .30, (s, st) => share("dee", st)], ["Epilepsy specialists", .25, s => s.epileptologists + s.child_neuro], ["Medicaid use of DEE brands", .25, s => s.mcd_fintepla_rx + s.mcd_epidiolex_rx + s.mcd_diacomit_rx + s.mcd_ztalmy_rx], ["Active trial sites", .20, s => s.sites_dee_active]],
    hcpDrugs: ["cannabidiol", "fenfluramine", "stiripentol", "ganaxolone", "rufinamide", "clobazam", "cenobamate", "felbamate", "vigabatrin"],
    brands: ["Epidiolex", "Fintepla", "Diacomit", "Ztalmy", "Xcopri", "Banzel", "Onfi", "Sympazan", "Sabril", "Briviact", "Fycompa", "Daybue", "Skyclarys"],
    payerMix: [["Commercial", 50], ["Medicaid", 45], ["Other", 5]], payerMixSrc: "Sponsor disclosure, Nov 2026",
    sim: {
      label: "First targeted SCN2A/SCN8A therapy", launch: 2027, guidance: { value: 5e9, label: "Sponsor peak potential: above $5B with a broad label" },
      p: { pop: 10000, dx0: 50, dxGrow: 5, dxCap: 85, elig: 80, acc1: 60, accSS: 90, adopt: 30, ramp: 3, ret1: 80, ret2: 92, wac: 500000, priceUp: 3, gtn: 25, comp: 85, growth: 1, x_on: 0, x_pop: 200000, x_year: 2028, x_adopt: 1, comp_year: 2031, comp_hit: 10 },
      ranges: { pop: [3000, 20000, 500], wac: [100000, 800000, 10000], x_pop: [20000, 300000, 10000], adopt: [5, 60, 1], x_adopt: [0.5, 10, 0.5] },
      presets: { Base: {}, Upside: { pop: 12000, dxGrow: 7, adopt: 40, accSS: 95, wac: 600000, x_on: 1, x_adopt: 1 }, Downside: { pop: 7000, dxGrow: 3, adopt: 20, acc1: 40, accSS: 80, wac: 400000, gtn: 35, ret1: 70 }, "Broad label": { x_on: 1, x_adopt: 1 } },
      xLabel: "Broad-DEE label expansion", field: { targets: 1500, calls: 14, perDay: 3.5, days: 200, cost: 330000 }
    }
  },
  et: {
    key: "et", name: "Essential tremor", short: "Essential tremor", tag: "One of the most common adult movement disorders · first new oral mechanism in decades",
    intro: "A high-prevalence, undertreated, Medicare-weighted condition with one approved drug (propranolol, first approved in 1967) and two procedures. The first purpose-built oral therapy, a T-type calcium channel blocker, has an FDA action date of 29 Jan 2027.",
    assets: ["ulixacaltamide"], lead: "ulixacaltamide",
    funnel: [["US prevalent", 7000000, "Louis & Ottman 2014: 7.0M (6.4–7.6M); sponsor now cites ~9M"], ["Diagnosed in claims", 2200000, "Claims studies range 1.1M–2.2M adults"], ["Actively seeking treatment", 2000000, "Sponsor estimate"], ["Still on propranolol or primidone", 680000, "Modeled from a 2010 specialist survey (n=223): 71% of 2.2M diagnosed ever used either drug; 56% of those stopped"]],
    matters: [
      ["One approved drug, from another era", "Propranolol is the only FDA-approved medicine; primidone, topiramate and gabapentin are off-label. About half of patients respond, and 40–47% stop first-line therapy within two years."],
      ["Activation matters more than share", "Of about 7M people with tremor (the sponsor cites up to 9M), only 1.1–2.2M carry a claims diagnosis and about 2M are actively seeking treatment. Growth depends on re-engaging people who tried generics and gave up."],
      ["The prescriber base is wide", `In Medicare Part D, neurologists write roughly a third of primidone claims (31–40%, depending on how suppressed low-volume prescribers are counted); family and internal medicine, NPs and PAs write most of the rest. The sponsor plans ~300 field staff against ~19K prescribers.`],
      ["Medicare sets the access terms", "The sponsor expects ~65% Part D and ~30% commercial. That means formulary-exception pathways at launch, a possible step through generic propranolol first (the sponsor's own expectation; a second step through primidone is analyst inference), a $2,100 out-of-pocket cap, and manufacturer discounts of 10–20% in the redesigned benefit."],
      ["Tolerability will shape persistence", "In the pivotal program 27% of treated patients stopped for drug-related adverse events. Overall discontinuation was 36–38%, mainly dizziness and brain fog during titration. Titration support and expectation-setting decide real-world retention."],
      ["Procedures and devices bracket the drug", "Focused ultrasound and deep brain stimulation serve medication-refractory patients (about 1,600 and 3,750 Medicare fee-for-service procedures a year in the files used here; the stimulation codes cover all indications). Wrist neurostimulators have Medicare DME coverage. Three recent oral competitors failed in Phase 2."]],
    glossary: [["ET", "Essential tremor: bilateral upper-limb action tremor for at least three years, without other neurological signs."], ["ET-plus", "ET with additional soft signs (mild dystonia, impaired tandem gait, memory change); introduced by the 2018 MDS classification."], ["T-type calcium channel (CaV3)", "Low-voltage calcium channels that pace rhythmic firing in the cerebello-thalamo-cortical circuit thought to drive tremor."], ["TETRAS", "The Essential Tremor Rating Assessment Scale: a performance subscale and an activities-of-daily-living (ADL) subscale."], ["mADL11", "Eleven TETRAS-ADL items (the social-impact item is excluded), each rescored 0–3, for a range of 0–33; the primary endpoint in the recent pivotal program."], ["MRgFUS", "MR-guided focused ultrasound thalamotomy: incisionless lesioning of the Vim thalamic nucleus."], ["DBS", "Deep brain stimulation, usually of the Vim nucleus, for medication-refractory tremor."], ["Vim", "Ventral intermediate nucleus of the thalamus; the surgical target for tremor."], ["Part D redesign", "Since 2025: $2,000 (2026: $2,100) annual out-of-pocket cap, with manufacturers paying 10% in the initial phase and 20% in the catastrophic phase."], ["Step therapy", "Payer rule requiring trial of a cheaper drug first; here, generic propranolol and/or primidone."], ["TAPS", "Transcutaneous afferent patterned stimulation: wrist-worn neuromodulation for hand tremor."]],
    quiz: [
      { q: "Which drug is the only one FDA-approved for essential tremor today?", o: ["Primidone", "Propranolol", "Topiramate", "Gabapentin"], a: 1, why: "Propranolol is the sole approved agent. Primidone has equivalent guideline support (AAN Level A) but is off-label." },
      { q: "About what share of patients stop propranolol or primidone within two years?", o: ["5–10%", "15–20%", "40–47%", "Over 80%"], a: 2, why: "US claims show 40% (propranolol) and 47% (primidone) discontinuation at two years, mostly for limited efficacy or side effects." },
      { q: "Who writes most primidone prescriptions in Medicare?", o: ["Movement disorder specialists only", "Neurologists write about a third; primary care, NPs and PAs write most of the rest", "Neurosurgeons", "Psychiatrists"], a: 1, why: "Part D data here put neurology at 31–40% of primidone claims, depending on how low-volume prescribers are counted. Primary care reach is necessary for scale." },
      { q: "What endpoint did the FDA accept as primary in the recent pivotal ET program?", o: ["Accelerometry amplitude", "TETRAS performance subscale", "A modified ADL composite (mADL11)", "Clinical Global Impression"], a: 2, why: "A function-based ADL composite was the primary endpoint, reflecting what patients can do rather than tremor amplitude alone." },
      { q: "Which coverage channel dominates essential tremor?", o: ["Medicaid", "Medicare", "Commercial", "Cash pay"], a: 1, why: "The population skews older; the sponsor expects ~65% Part D. Claims cohorts drawn from MA-heavy databases run higher." },
      { q: "Which option is reserved for medication-refractory tremor?", o: ["Focused ultrasound thalamotomy or DBS", "Higher-dose propranolol", "Alcohol", "Gabapentin"], a: 0, why: "Both procedures target the Vim thalamus and produce large tremor reductions, but only a few thousand are done per year." }],
    map: [
      { k: "idx", label: "Launch priority index (modeled)", f: null, pc: false },
      { k: "est", label: "Estimated prevalent patients (modeled)", f: (s, st, sc) => (sc.et_prev || 7000000) * share("et", st), pc: false, fmt: v => K(v) },
      { k: "prim", label: "Primidone claims, Medicare Part D", f: s => s.pd_primidone, pc: "mc_partd" },
      { k: "primp", label: "Primidone prescribers, Medicare Part D", f: s => s.pd_primidone_prs, pc: "mc_partd" },
      { k: "prop", label: "Propranolol claims, Medicare Part D (all uses)", f: s => s.pd_propranolol, pc: "mc_partd" },
      { k: "neuro", label: "Neurology prescribers of primidone (target list)", f: s => s.hcp_et, pc: "a65" },
      { k: "fus", label: "Focused ultrasound thalamotomies, Medicare FFS", f: s => s.fus_svcs, pc: "mc_tot" },
      { k: "dbs", label: "DBS lead implants, Medicare FFS", f: s => s.dbs_svcs, pc: "mc_tot" },
      { k: "mc", label: "Medicare beneficiaries", f: s => s.mc_tot, pc: false },
      { k: "ma", label: "Medicare Advantage share of beneficiaries", f: s => s.mc_ma / s.mc_tot, pc: false, fmt: v => PCT(v) },
      { k: "sites", label: "Trial sites, all ET studies (ClinicalTrials.gov)", f: s => s.sites_et, pc: "a65" },
      { k: "a65", label: "Population 65+", f: s => s.a65, pc: false }],
    idx: [["Estimated patients", .35, (s, st) => share("et", st)], ["Primidone claims (Part D)", .30, s => s.pd_primidone], ["Neurology prescribers", .20, s => s.hcp_et], ["Procedure volume (FUS + DBS)", .15, s => s.fus_svcs + s.dbs_svcs]],
    hcpDrugs: ["primidone"],
    brands: ["Primidone", "Mysoline", "Propranolol HCl ER", "Inderal LA", "Topiramate", "Nuplazid", "Ingrezza", "Austedo", "Austedo XR", "Nurtec ODT", "Gocovri", "Nourianz", "Xcopri"],
    payerMix: [["Medicare Part D", 65], ["Commercial", 30], ["Other", 5]], payerMixSrc: "Sponsor disclosure, Nov 2026",
    sim: {
      label: "First purpose-built oral ET therapy", launch: 2027, guidance: { value: 10e9, label: "Sponsor peak-sales guidance: $10B" },
      p: { pop: 2000000, dx0: 100, dxGrow: 0, dxCap: 100, elig: 85, acc1: 45, accSS: 75, adopt: 4, ramp: 4, ret1: 60, ret2: 85, wac: 75000, priceUp: 2, gtn: 45, comp: 80, growth: 3, x_on: 0, x_pop: 1500000, x_year: 2029, x_adopt: 1, comp_year: 2032, comp_hit: 10 },
      ranges: { pop: [500000, 4000000, 50000], wac: [10000, 120000, 2500], x_pop: [250000, 5000000, 250000], adopt: [0.5, 12, 0.5], x_adopt: [0.25, 5, 0.25] },
      presets: { Base: {}, Upside: { adopt: 5, accSS: 85, ret1: 68, wac: 85000, gtn: 40 }, Downside: { adopt: 2.5, acc1: 30, accSS: 60, ret1: 50, ret2: 80, wac: 55000, gtn: 55 }, "Sponsor guidance": { adopt: 3.5, wac: 91000, gtn: 45, comp: 100 } },
      xLabel: "Activate undiagnosed / lapsed patients (DTC)", field: { targets: 19000, calls: 10, perDay: 7, days: 200, cost: 280000 }
    }
  }
};
const TABS = [["overview", "Overview"], ["learn", "Disease 101"], ["journey", "Journey & treatment"], ["landscape", "Competitive landscape"], ["trials", "Trials"], ["geography", "Geography"], ["access", "Payers & access"], ["people", "KOLs & prescribers"], ["simulator", "Launch simulator"], ["sources", "Sources & methods"]];
const state = { ta: store.get("ta", "dee"), tab: "overview" };
const cur = () => TA[state.ta];
const RM = () => R[state.ta] || {};
