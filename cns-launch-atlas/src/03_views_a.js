/* ---------- shared bits ---------- */
const head = (eyebrow, title, lede) => `<div class="pagehead"><span class="eyebrow">${esc(eyebrow)}</span><h1>${esc(title)}</h1>${lede ? `<p>${lede}</p>` : ""}</div>`;
const assetOf = k => (RC.assets || {})[k] || {};
const isFuture = d => { const m = String(d || "").match(/(\d{4})(?:-(\d{2}))?(?:-(\d{2}))?/); if (!m) return false; const dt = new Date(+m[1], m[2] ? +m[2] - 1 : 11, m[3] ? +m[3] : 28); return dt >= new Date(D.built) || /expected/i.test(d); };
function timelineFor(ta) {
  const keys = TA[ta].assets;
  return (RC.timeline || []).filter(e => keys.some(k => String(e.asset || "").toLowerCase().includes(k)) || (ta === "dee" && /pipeline/.test(e.asset || "") && /KCNT1|PRAX-206/.test(e.event)));
}
function funnelChart(rows) {
  const max = rows[0][1];
  return `<div class="lines">${rows.map(([l, v, n]) => `<div><div style="display:flex;justify-content:space-between;gap:10px;align-items:baseline"><span>${esc(l)}</span><b class="num">${v ? N(v) : "0"}</b></div><div style="background:var(--surface-2);border-radius:3px;height:10px;margin:3px 0"><div style="width:${Math.max(v ? 1.5 : 0, 100 * v / max)}%;height:10px;background:var(--s1);border-radius:3px"></div></div><div class="sub">${esc(n)}</div></div>`).join("")}</div>`;
}

/* ---------- OVERVIEW ---------- */
function viewOverview() {
  const c = cur(), ta = c.key, tr = D.trials[ta], act = tr.filter(t => ["RECRUITING", "ACTIVE_NOT_RECRUITING", "NOT_YET_RECRUITING", "ENROLLING_BY_INVITATION"].includes(t.status));
  const lead = assetOf(c.lead), tl = timelineFor(ta), fut = tl.filter(e => isFuture(e.date)), past = tl.filter(e => !isFuture(e.date)).slice(-6);
  const pipe = (RM().pipeline || []);
  const k = ta === "dee" ? [
    kpi("27 Dec 2026", "FDA action date, first SCN2A/SCN8A therapy", "Priority review, breakthrough designation"),
    kpi("~10K", "US prevalent SCN2A + SCN8A DEE", "~5K diagnosed · ~1.9K visible in data"),
    kpi(N(sumSt(s => s.epileptologists + s.child_neuro)), "Epileptologists + child neurologists", "NPPES listed taxonomy"),
    kpi(USD((D.spend.Epidiolex.mcaid[2024].spend + D.spend.Fintepla.mcaid[2024].spend + D.spend.Diacomit.mcaid[2024].spend + D.spend.Ztalmy.mcaid[2024].spend)), "Medicaid spend on 4 DEE brands, 2024", "Pre-rebate; CMS spending by drug"),
    kpi(N(act.length), "Active DEE trials", `${N(tr.length)} registered in total`),
    kpi("$400–600K", "Guided annual list-price corridor", "Sponsor, Nov 2026")] : [
    kpi("29 Jan 2027", "FDA action date, first new oral ET therapy", "Standard review, breakthrough designation"),
    kpi("7–9M", "US prevalent essential tremor", "~2M seeking treatment"),
    kpi(K(sumSt(s => s.pd_primidone)), "Primidone claims, Medicare Part D", `${N(D.hcp.et.n_total)} neurology prescribers`),
    kpi(N(D.proc.national["0398T"].svcs), "Focused ultrasound thalamotomies / yr", `Medicare FFS · ${N(D.proc.national["0398T"].prov)} operators`),
    kpi(N(act.length), "Active ET trials", `${N(tr.length)} registered in total`),
    kpi("$50–100K", "Guided annual list-price corridor", "Sponsor, Nov 2026")];
  return head(c.tag, c.name, esc(c.intro)) + `<div class="kpis">${k.join("")}</div>
  <div class="grid">
    <section class="panel c7"><header><h3>What matters in this market</h3><span class="sub">Analyst synthesis of the sourced facts in this app</span></header>
      ${c.matters.map(([t, b], i) => `<details class="acc" ${i < 2 ? "open" : ""}><summary><span>${esc(t)}</span></summary><div class="ab"><p>${esc(b)}</p></div></details>`).join("")}</section>
    <div class="c5" style="display:flex;flex-direction:column;gap:14px">
      ${panel("Patient funnel", funnelChart(c.funnel), { sub: "US, order-of-magnitude" })}
      ${panel("Catalyst calendar", `<div class="tl">${[...past, ...fut].map(e => `<div class="ev ${isFuture(e.date) ? "fut" : ""}"><span class="d">${esc(String(e.date).replace(" (expected)", ""))}</span><span class="m"></span><span>${esc(e.event)} ${srcLink(e.source_url)}</span></div>`).join("")}</div>`, { sub: "Teal = upcoming" })}
    </div>
    <section class="panel c12"><header><h3>Late-stage and marketed competitors at a glance</h3><a class="src" href="#landscape">Full landscape →</a></header>
      <div class="tblwrap"><table><thead><tr><th>Asset</th><th>Sponsor</th><th>Mechanism</th><th>Stage</th><th>Next catalyst</th></tr></thead><tbody>
      ${pipe.slice(0, 9).map(p => `<tr><td><b>${esc(p.asset)}</b></td><td>${esc(p.sponsor)}</td><td>${esc((p.moa || "").slice(0, 90))}</td><td>${stagePill(p.phase || p.status)}</td><td>${esc((p.next_catalyst || "").slice(0, 120))}</td></tr>`).join("")}</tbody></table></div></section>
  </div>`;
}
function stagePill(s) { s = String(s || ""); const k = /discontinu|terminat|fail|missed/i.test(s) ? "crit" : /approved|marketed|nda|filed/i.test(s) ? "good" : /3|pivotal|registrational/i.test(s) ? "acc" : ""; return `<span class="pill ${k}">${esc(s.length > 34 ? s.slice(0, 33) + "…" : s)}</span>`; }

/* ---------- DISEASE 101 ---------- */
function viewLearn() {
  const c = cur(), m = RM(), epi = m.epidemiology || [];
  const quizHtml = `<div class="quiz" id="quiz">${c.quiz.map((q, i) => `<div class="q" data-q="${i}"><b>${i + 1}. ${esc(q.q)}</b><div class="opts">${q.o.map((o, j) => `<button class="opt" data-j="${j}">${esc(o)}</button>`).join("")}</div><div class="why" hidden>${esc(q.why)}</div></div>`).join("")}<div class="callout" id="quizScore" hidden></div></div>`;
  setTimeout(() => { let done = 0, right = 0; $$("#quiz .q").forEach(qe => { const q = c.quiz[+qe.dataset.q]; $$(".opt", qe).forEach(b => b.onclick = () => { if (qe.dataset.done) return; qe.dataset.done = 1; done++; const j = +b.dataset.j; if (j === q.a) right++; else b.classList.add("wrong"); $$(".opt", qe)[q.a].classList.add("right"); $(".why", qe).hidden = false; if (done === c.quiz.length) { const s = $("#quizScore"); s.hidden = false; s.textContent = `Score: ${right} of ${c.quiz.length}.`; } }); }); }, 0);
  return head("Disease 101", "Understand the condition before the market", "Short, sourced primers written for a commercial reader, followed by the epidemiology evidence and a self-check.") + `<div class="grid">
    <section class="panel c7"><header><h3>Primers</h3><span class="sub">${(m.disease_education || []).length} topics</span></header>
      ${(m.disease_education || []).map((d, i) => `<details class="acc" ${i === 0 ? "open" : ""}><summary><span>${esc(d.topic)}</span>${conf(d.confidence)}</summary><div class="ab"><p>${esc(d.body)}</p><div>${srcLinks(d.sources)}</div></div></details>`).join("")}</section>
    <div class="c5" style="display:flex;flex-direction:column;gap:14px">
      ${panel("Check your understanding", quizHtml, { sub: "6 questions" })}
      ${panel("Glossary", `<dl class="kv">${c.glossary.map(([t, d]) => `<dt>${esc(t)}</dt><dd>${esc(d)}</dd>`).join("")}</dl>`)}
    </div>
    <section class="panel c12"><header><h3>Epidemiology evidence</h3><span class="sub">Ranges shown where sources disagree; "not found" rows are kept so gaps are visible</span></header>
      ${dataTable({ rows: epi, pageSize: 30, searchText: r => [r.syndrome, r.metric, r.value, r.note].join(" "), cols: [
        ...(state.ta === "dee" ? [{ h: "Syndrome", val: r => r.syndrome }] : []), { h: "Metric", val: r => r.metric }, { h: "Value", val: r => r.value, cell: r => `<b>${esc(r.value)}</b>` }, { h: "Range / note", cell: r => esc([r.range, r.note].filter(x => x && !/^not found$/i.test(x)).join(" — ").slice(0, 260)) }, { h: "Year", val: r => r.year, num: true, cell: r => esc(r.year || "") }, { h: "Conf.", val: r => r.confidence, cell: r => conf(r.confidence) }, { h: "Source", cell: r => srcLink(r.source_url) }] })}</section>
    ${m.outcome_measures ? `<section class="panel c12"><header><h3>Outcome measures regulators and trialists use</h3></header>${m.outcome_measures.map(o => `<details class="acc"><summary><span>${esc(o.name)}</span></summary><div class="ab"><p>${esc(o.description)}</p><p><b>Regulatory use:</b> ${esc(o.regulatory_use)}</p><div>${srcLinks(o.sources)}</div></div></details>`).join("")}</section>` : ""}
    <section class="panel c12"><header><h3>Publication momentum</h3><span class="sub">PubMed, 2016–2026 · ${N(D.pubmed[state.ta].n_articles)} papers, ${N(D.pubmed[state.ta].n_authors)} authors</span></header>
      ${(() => { const by = D.pubmed[state.ta].by_year, ys = Object.keys(by).filter(y => +y >= 2016 && +y <= 2025); return xyChart(ys, [{ name: "All papers", values: ys.map(y => by[y].all) }, { name: state.ta === "dee" ? "SCN2A / SCN8A papers" : "ET in title", values: ys.map(y => by[y].core) }, { name: "Clinical trial reports", values: ys.map(y => by[y].trial) }], { bars: true, h: 220, fmt: N }); })()}</section>
  </div>`;
}

/* ---------- JOURNEY & TREATMENT ---------- */
function viewJourney() {
  const m = RM(), pj = m.patient_journey || [], tf = m.treatment_flow, ta = state.ta;
  const stepBody = i => { const s = pj[i]; return `<div class="grid"><div class="c7"><h3>${esc(s.stage)}</h3><p style="margin-top:6px;color:var(--ink-2)">${esc(s.description)}</p><p class="sub" style="margin-top:8px">Typical duration: ${esc(s.typical_duration || "—")}</p><div style="margin-top:6px">${srcLinks(s.sources)}</div></div><div class="c5"><h4>Friction points</h4>${ul(s.pain_points)}<h4 style="margin-top:10px">Who is involved</h4><div class="chips" style="margin-top:4px">${listify(s.stakeholders).map(x => `<span class="pill">${esc(x)}</span>`).join(" ")}</div></div></div>`; };
  let flow = "";
  if (Array.isArray(tf)) flow = `<div class="lines">${tf.map(l => `<div class="lot"><div class="ll">${esc(l.line)}</div><div>${ul(l.options)}<p class="note" style="margin-top:6px"><b>Evidence:</b> ${esc(l.evidence_level || "—")}</p><p class="note"><b>Efficacy:</b> ${esc(l.efficacy || "—")}</p><p class="note"><b>Limits:</b> ${esc(l.limitations || "—")}</p><div>${srcLinks(l.sources)}</div></div></div>`).join("")}</div>`;
  else if (tf) {
    const keys = Object.keys(tf), lab = k => k.replace(/_/g, " ");
    const body = k => { const f = tf[k]; return `<div class="lines">${Object.entries(f).filter(([kk, v]) => !["sources", "confidence", "notes", "verification"].includes(kk) && v && (Array.isArray(v) ? v.length : true)).map(([kk, v]) => `<div class="lot"><div class="ll">${esc(lab(kk))}</div><div>${Array.isArray(v) ? ul(v) : `<p>${esc(v)}</p>`}</div></div>`).join("")}</div>${f.notes ? `<p class="callout" style="margin-top:8px">${esc(f.notes)}</p>` : ""}<div style="margin-top:6px">${conf(f.confidence)} ${srcLinks(f.sources)}</div>`; };
    flow = `<div class="chips" id="tfChips">${keys.map((k, i) => `<button class="chip" aria-pressed="${i === 0}" data-k="${esc(k)}">${esc(lab(k))}</button>`).join("")}</div><div id="tfBody">${body(keys[0])}</div>`;
    setTimeout(() => $$("#tfChips .chip").forEach(b => b.onclick = () => { $$("#tfChips .chip").forEach(x => x.setAttribute("aria-pressed", x === b)); $("#tfBody").innerHTML = body(b.dataset.k); }), 0);
  }
  setTimeout(() => $$("#steps .step").forEach(b => b.onclick = () => { $$("#steps .step").forEach(x => x.setAttribute("aria-selected", x === b)); $("#stepBody").innerHTML = stepBody(+b.dataset.i); }), 0);
  const un = m.unmet_needs || [];
  return head("Journey & treatment", ta === "dee" ? "From first seizure to a genetic answer" : "From a shaky hand to a treatment plan", "Select a stage to see what happens, who is involved and where patients get stuck. Treatment sequencing and the guidelines behind it follow.") + `
  <section class="panel"><header><h3>Patient journey</h3><span class="sub">${pj.length} stages</span></header>
    <div class="steps" id="steps" role="tablist">${pj.map((s, i) => `<button class="step" role="tab" data-i="${i}" aria-selected="${i === 0}"><b>STAGE ${i + 1}</b><span>${esc(String(s.stage).replace(/^\d+\.\s*/, ""))}</span><small>${esc((s.typical_duration || "").slice(0, 40))}</small></button>`).join("")}</div>
    <div id="stepBody">${pj.length ? stepBody(0) : ""}</div></section>
  <div class="grid">
    <section class="panel c7"><header><h3>Treatment sequencing</h3><span class="sub">${ta === "dee" ? "Choose a syndrome" : "By line of therapy"}</span></header>${flow}</section>
    <section class="panel c5"><header><h3>Guidelines and consensus</h3></header>${(m.guidelines || []).map(g => `<details class="acc"><summary><span>${esc(g.name)}</span><span class="sub">${esc(g.year || "")}</span></summary><div class="ab"><p class="sub">${esc(g.body || "")}</p>${ul(g.key_recommendations)}<div>${srcLink(g.url)}</div></div></details>`).join("")}</section>
    <section class="panel c12"><header><h3>Unmet needs and live debates</h3></header>${factList(un.map(u => ({ fact: u.need || u.insight, value: u.detail || (u.type ? "" : ""), controversy: u.controversy, confidence: u.confidence, sources: u.sources, note: u.need && u.insight ? u.insight : "", topic: u.type })), { pre: "topic" })}</section>
  </div>`;
}

/* ---------- COMPETITIVE LANDSCAPE ---------- */
function spendChart(brands) {
  const ys = [2020, 2021, 2022, 2023, 2024], ser = brands.filter(b => D.spend[b]).slice(0, 8).map(b => ({ name: b, values: ys.map(y => { const d = D.spend[b]; const v = ((d.partd || {})[y] || {}).spend || 0, w = ((d.mcaid || {})[y] || {}).spend || 0; return v + w || null; }) }));
  return xyChart(ys.map(String), ser, { fmt: USD, h: 250 });
}
function assetProfile(k) {
  const a = assetOf(k); if (!a.mechanism) return "";
  const reg = a.regulatory || {};
  return `<div class="asset"><div style="display:flex;gap:8px;flex-wrap:wrap;align-items:baseline"><h3 style="text-transform:capitalize">${esc(k)}</h3>${stagePill(a.stage)}</div>
    <dl class="kv"><dt>Mechanism</dt><dd>${esc(a.mechanism)}</dd><dt>Indications</dt><dd>${ul(a.indications || a.indication)}</dd><dt>Dosing</dt><dd>${esc(a.dosing || "—")}</dd><dt>Safety</dt><dd>${esc(a.safety || "—")}</dd>
    <dt>Regulatory</dt><dd>${ul(Object.entries(reg).filter(([kk]) => kk !== "sources").map(([kk, v]) => `${kk.replace(/_/g, " ")}: ${Array.isArray(v) ? v.join(", ") : v}`))}</dd></dl>
    <div class="tblwrap"><table><thead><tr><th>Study</th><th>Phase</th><th>N</th><th>Result</th></tr></thead><tbody>${(a.trials || []).map(t => `<tr><td><b>${esc(t.name)}</b>${t.nct && /^NCT/.test(t.nct) ? `<br><a class="src" target="_blank" rel="noopener" href="https://clinicaltrials.gov/study/${esc(t.nct)}">${esc(t.nct)}</a>` : ""}</td><td>${esc(t.phase || "")}</td><td>${esc(t.n || "")}</td><td>${esc(t.results || "")} ${srcLink(t.source_url)}</td></tr>`).join("")}</tbody></table></div>
    ${(a.launch_plan || []).length ? `<details class="acc"><summary><span>Disclosed launch plan (${a.launch_plan.length} facts)</span></summary><div class="ab" style="max-width:none">${factList(a.launch_plan)}</div></details>` : ""}
    ${(a.analyst_estimates || []).length ? `<details class="acc"><summary><span>Peak-sales and price framing</span></summary><div class="ab" style="max-width:none">${factList(a.analyst_estimates)}</div></details>` : ""}</div>`;
}
function viewLandscape() {
  const c = cur(), m = RM(), ta = c.key, pipe = m.pipeline || [];
  const prods = ta === "dee" ? (m.approved_products || []) : (m.approved_and_used_therapies || []);
  const fdaRows = Object.values(D.fda).filter(f => f.ta === ta || f.ta === "both");
  const showProd = p => drawer(`<h2>${esc(p.brand || p.name)}</h2><dl class="kv">${Object.entries(p).filter(([k, v]) => !["sources", "brand", "name"].includes(k) && v).map(([k, v]) => `<dt>${esc(k.replace(/_/g, " "))}</dt><dd>${k === "confidence" ? conf(v) : esc(v)}</dd>`).join("")}</dl><div>${srcLinks(p.sources)}</div>`);
  const showFda = f => drawer(`<h2>${esc(f.brand)} <span class="sub">(${esc(f.generic)})</span></h2><dl class="kv"><dt>Sponsor</dt><dd>${esc(f.sponsor || f.manufacturer || "—")}</dd><dt>Application</dt><dd>${esc(f.appl || "—")}</dd><dt>First approval</dt><dd>${esc(fmtDate(f.approval_date))} ${f.review_priority ? `(${esc(f.review_priority)})` : ""}</dd><dt>Label revised</dt><dd>${esc(fmtDate(f.label_date))}</dd><dt>Efficacy supplements</dt><dd>${esc((f.efficacy_supplements || []).map(fmtDate).join(", ") || "—")}</dd><dt>Class</dt><dd>${esc((f.pharm_class || []).join("; ") || "—")}</dd></dl>
    ${f.boxed_warning ? `<div class="callout" style="border-color:var(--crit);background:var(--crit-bg)"><b>Boxed warning.</b> ${esc(f.boxed_warning)}</div>` : ""}
    <h4>Indications (label text)</h4><p class="note">${esc(f.indications || "—")}</p><h4>Dosage (label text, excerpt)</h4><p class="note">${esc(f.dosage || "—")}</p><h4>Warnings (excerpt)</h4><p class="note">${esc(f.warnings || "—")}</p>
    ${f.faers_top ? `<h4>Most-reported reactions in FAERS</h4><p class="sub">Spontaneous reports; counts reflect reporting, not incidence. Total reports: ${N(f.faers_total)}</p>${hbar(f.faers_top.map(([t, n]) => ({ label: t, value: n })), { fmt: N, labelW: 200 })}` : ""}
    ${f.faers_by_year ? `<h4>FAERS reports by year received</h4>${xyChart(Object.keys(f.faers_by_year), [{ name: "Reports", values: Object.values(f.faers_by_year) }], { bars: true, h: 180, fmt: N })}` : ""}`);
  window._showProd = i => showProd(prods[i]); 
  return head("Competitive landscape", ta === "dee" ? "Who treats rare epilepsy today, and who is coming" : "Generics, procedures, devices and one new mechanism", "Marketed therapies with public spend and label data, the clinical pipeline, and a deep profile of the near-launch assets.") + `<div class="grid">
    <section class="panel c12"><header><h3>Near-launch asset profiles</h3><span class="sub">Compiled from company disclosures through 12 Nov 2026</span></header>${c.assets.map(assetProfile).join("")}</section>
    <section class="panel c12"><header><h3>Pipeline</h3><span class="sub">${pipe.length} programs, including discontinued ones and why they failed</span></header>
      ${dataTable({ rows: pipe, pageSize: 30, searchText: p => [p.asset, p.sponsor, p.moa, p.indication, p.phase].join(" "), onRow: p => drawer(`<h2>${esc(p.asset)}</h2><dl class="kv">${Object.entries(p).filter(([k, v]) => !["sources", "asset"].includes(k) && v).map(([k, v]) => `<dt>${esc(k.replace(/_/g, " "))}</dt><dd>${k === "confidence" ? conf(v) : esc(v)}</dd>`).join("")}</dl><div>${srcLinks(p.sources)}</div>`),
        cols: [{ h: "Asset", val: p => p.asset, cell: p => `<b>${esc(p.asset)}</b>` }, { h: "Sponsor", val: p => p.sponsor, cell: p => esc(String(p.sponsor || "").slice(0, 44)) }, { h: "Mechanism", cell: p => esc(String(p.moa || "").slice(0, 80)) }, ...(ta === "dee" ? [{ h: "Indication", cell: p => esc(String(p.indication || "").slice(0, 60)) }] : []), { h: "Stage", val: p => p.phase, cell: p => stagePill(p.phase) }, { h: "Key data", cell: p => esc(String(p.key_data || p.data || "").slice(0, 150)) + "…" }] })}</section>
    <section class="panel c7"><header><h3>${ta === "dee" ? "Marketed products" : "Therapies in use: drugs, devices, procedures"}</h3><span class="sub">Select a row for detail</span></header>
      <div class="tblwrap"><table><thead><tr><th>${ta === "dee" ? "Brand" : "Therapy"}</th><th>${ta === "dee" ? "Company" : "Type"}</th><th>${ta === "dee" ? "Indication" : "Status / line"}</th><th>${ta === "dee" ? "Latest sales" : "Efficacy"}</th></tr></thead><tbody>
      ${prods.map((p, i) => `<tr class="click" tabindex="0" onclick="_showProd(${i})" onkeydown="if(event.key==='Enter')_showProd(${i})"><td><b>${esc(p.brand || p.name)}</b>${p.generic ? `<br><span class="sub">${esc(p.generic)}</span>` : ""}</td><td>${esc(p.company || p.type || "")}</td><td>${esc(String(p.indication || [p.regulatory_status, p.line].filter(Boolean).join(" · ")).slice(0, 110))}</td><td>${esc(String(p.latest_sales || p.efficacy || "").slice(0, 130))}</td></tr>`).join("")}</tbody></table></div></section>
    <section class="panel c5"><header><h3>US public-payer spend by brand</h3><span class="sub">Medicare Part D + Medicaid, pre-rebate, 2020–2024 (CMS)</span></header>${spendChart(c.brands)}
      <p class="sub">Excludes commercial plans and rebates. ${ta === "et" ? "Movement-disorder and CNS brands shown as launch analogs; generics for tremor are small in dollars." : "For pediatric rare epilepsy, Medicaid is the larger share."}</p></section>
    <section class="panel c12"><header><h3>Label and safety file (openFDA)</h3><span class="sub">Approval history from Drugs@FDA, current label text, FAERS reports · select a row</span></header>
      ${dataTable({ rows: fdaRows, pageSize: 25, onRow: showFda, cols: [{ h: "Brand", val: f => f.brand, cell: f => `<b>${esc(f.brand)}</b> <span class="sub">${esc(f.generic)}</span>` }, { h: "Sponsor", val: f => f.sponsor || f.manufacturer }, { h: "First approval", val: f => f.approval_date, cell: f => esc(fmtDate(f.approval_date)) }, { h: "Review", val: f => f.review_priority || "" }, { h: "Boxed warning", val: f => f.boxed_warning ? 1 : 0, cell: f => f.boxed_warning ? '<span class="pill crit">yes</span>' : '<span class="sub">no</span>' }, { h: "FAERS reports", num: true, val: f => f.faers_total || 0, cell: f => N(f.faers_total) }, { h: "Medicare 2024", num: true, val: f => ((D.spend[f.brand] || {}).partd || {})[2024]?.spend || 0, cell: f => USD(((D.spend[f.brand] || {}).partd || {})[2024]?.spend) }, { h: "Medicaid 2024", num: true, val: f => ((D.spend[f.brand] || {}).mcaid || {})[2024]?.spend || 0, cell: f => USD(((D.spend[f.brand] || {}).mcaid || {})[2024]?.spend) }] })}</section>
  </div>`;
}
const fmtDate = d => d && /^\d{8}$/.test(d) ? `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6)}` : (d || "—");

/* ---------- TRIALS ---------- */
function viewTrials() {
  const ta = state.ta, tr = D.trials[ta], inst = D.inst[ta];
  const byYear = {}; tr.forEach(t => { const y = (t.start || "").slice(0, 4); if (y >= "2012" && y <= "2026") { byYear[y] = byYear[y] || { i: 0, o: 0 }; byYear[y][t.sclass === "INDUSTRY" ? "i" : "o"]++; } });
  const ys = Object.keys(byYear).sort(), sp = {}; tr.forEach(t => { if (t.sclass === "INDUSTRY") sp[t.sponsor] = (sp[t.sponsor] || 0) + 1; });
  const top = Object.entries(sp).sort((a, b) => b[1] - a[1]).slice(0, 12);
  const statusPill = s => `<span class="pill ${/RECRUITING|ACTIVE|ENROLLING/.test(s) && !/NOT_YET/.test(s) ? "good" : /TERMINATED|WITHDRAWN|SUSPENDED/.test(s) ? "crit" : ""}">${esc(s.replace(/_/g, " ").toLowerCase())}</span>`;
  const show = t => drawer(`<span class="eyebrow">${esc(t.nct)} · ${esc(t.type || "")}</span><h2>${esc(t.title)}</h2><dl class="kv"><dt>Status</dt><dd>${statusPill(t.status)}</dd><dt>Phase</dt><dd>${esc(t.phase)}</dd><dt>Sponsor</dt><dd>${esc(t.sponsor)} <span class="sub">(${esc(t.sclass || "")})</span></dd><dt>Enrollment</dt><dd>${N(t.n)}</dd><dt>Start</dt><dd>${esc(t.start || "—")}</dd><dt>Primary completion</dt><dd>${esc(t.pcd || "—")}</dd><dt>Conditions</dt><dd>${esc(t.cond.join("; "))}</dd><dt>Interventions</dt><dd>${esc(t.iv.join("; ") || "—")}</dd><dt>Primary outcome</dt><dd>${esc(t.po[0] || "—")}</dd><dt>Sites</dt><dd>${N(t.nloc)} total · ${N(t.nus)} US · ${N(t.nco)} countries</dd><dt>US states</dt><dd>${esc(t.sts.join(", ") || "—")}</dd><dt>Results posted</dt><dd>${t.res ? "Yes" : "No"}</dd></dl><a href="https://clinicaltrials.gov/study/${esc(t.nct)}" target="_blank" rel="noopener">Open on ClinicalTrials.gov →</a>`);
  return head("Trials", "Every registered study, searchable", `${N(tr.length)} studies from ClinicalTrials.gov matched on condition and on the named pipeline drugs. Site data feeds the Geography and People tabs.`) + `<div class="grid">
    <section class="panel c7"><header><h3>Study starts by year</h3><span class="sub">Industry vs other sponsors</span></header>${xyChart(ys, [{ name: "Industry", values: ys.map(y => byYear[y].i) }, { name: "Academic / other", values: ys.map(y => byYear[y].o) }], { bars: true, h: 220, fmt: N })}</section>
    <section class="panel c5"><header><h3>Most active industry sponsors</h3><span class="sub">Registered studies</span></header>${hbar(top.map(([l, v]) => ({ label: l, value: v })), { fmt: N, labelW: 190 })}</section>
    <section class="panel c12"><header><h3>Study explorer</h3><span class="sub">Select a row for detail</span></header>
      ${dataTable({ rows: tr, pageSize: 20, placeholder: "Search title, drug, sponsor, NCT", searchText: t => [t.nct, t.title, t.sponsor, t.iv.join(" "), t.cond.join(" "), t.acr].join(" "), onRow: show,
        selects: [{ key: "status", label: "Status", options: uniq(tr.map(t => t.status)), test: (t, v) => t.status === v }, { key: "phase", label: "Phase", options: uniq(tr.map(t => t.phase)), test: (t, v) => t.phase === v }, { key: "sc", label: "Sponsor type", options: uniq(tr.map(t => t.sclass)), test: (t, v) => t.sclass === v }, { key: "ivt", label: "Intervention", options: uniq(tr.flatMap(t => t.ivt)), test: (t, v) => t.ivt.includes(v) }],
        cols: [{ h: "NCT", val: t => t.nct, cell: t => `<span class="num">${esc(t.nct)}</span>` }, { h: "Study", val: t => t.title, cell: t => `${t.acr ? `<b>${esc(t.acr)}</b> · ` : ""}${esc(t.title.slice(0, 95))}` }, { h: "Sponsor", val: t => t.sponsor, cell: t => esc((t.sponsor || "").slice(0, 34)) }, { h: "Phase", val: t => t.phase }, { h: "Status", val: t => t.status, cell: t => statusPill(t.status) }, { h: "N", num: true, val: t => t.n || 0, cell: t => N(t.n) }, { h: "US sites", num: true, val: t => t.nus, cell: t => N(t.nus) }, { h: "Start", val: t => t.start || "", cell: t => `<span class="num">${esc((t.start || "").slice(0, 7))}</span>` }] })}</section>
    <section class="panel c12"><header><h3>Most trial-experienced US institutions</h3><span class="sub">Named sites only; blinded "research site" entries are excluded, so sponsor-masked studies undercount</span></header>
      ${dataTable({ rows: inst, pageSize: 15, searchText: i => [i.name, i.city, i.st].join(" "), selects: [{ key: "st", label: "State", options: uniq(inst.map(i => i.st)), test: (i, v) => i.st === v }],
        cols: [{ h: "Institution", val: i => i.name, cell: i => `<b>${esc(i.name)}</b>` }, { h: "City", val: i => i.city }, { h: "State", val: i => i.st }, { h: "Studies", num: true, val: i => i.n }, { h: "Active", num: true, val: i => i.active }, { h: "Industry", num: true, val: i => i.ind }, { h: "Sponsors worked with", cell: i => esc(i.sponsors.join(", ")) }] })}</section>
  </div>`;
}
