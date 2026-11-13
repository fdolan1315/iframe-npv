/* ---------- LAUNCH SIMULATOR ---------- */
const simStore = store.get("sim", {});
function simP(ta) { return Object.assign({}, TA[ta].sim.p, simStore[ta] || {}); }
const YEARS = 10;
function runSim(ta, p) {
  const L = TA[ta].sim.launch, out = []; let pool = 0, prevDx = 0, xpool = p.x_on ? 0 : 0; const cohorts = [], xcoh = [];
  const ret = age => age === 0 ? 1 : (p.ret1 / 100) * Math.pow(p.ret2 / 100, age - 1);
  for (let i = 0; i < YEARS; i++) {
    const yr = L + i, popN = p.pop * Math.pow(1 + p.growth / 100, i);
    const dxRate = Math.min(p.dxCap, p.dx0 + p.dxGrow * i) / 100, dxElig = popN * dxRate * p.elig / 100;
    pool += Math.max(0, dxElig - prevDx); prevDx = dxElig;
    const access = (i === 0 ? p.acc1 : i === 1 ? (p.acc1 + p.accSS) / 2 : p.accSS) / 100;
    const rampF = Math.min(1, (i + 1) / Math.max(1, p.ramp)), compF = yr >= p.comp_year ? 1 - p.comp_hit / 100 : 1;
    const starts = pool * (p.adopt / 100) * rampF * access * compF; pool -= starts; cohorts.push(starts);
    let xs = 0; if (p.x_on && yr >= p.x_year) { if (yr === p.x_year) xpool = p.x_pop; const xi = yr - p.x_year; xs = xpool * (p.x_adopt / 100) * Math.min(1, (xi + 1) / 3) * access * compF; xpool -= xs; } xcoh.push(xs);
    /* avg patients on therapy during the year: new starts count half; older cohorts at mid-year retention */
    const core = cohorts.reduce((a, s, j) => { const age = i - j; return a + s * (age === 0 ? 0.5 : (ret(age - 1) * (age === 1 ? (1 + p.ret1 / 100) / 2 : (1 + p.ret2 / 100) / 2))); }, 0);
    const exp = xcoh.reduce((a, s, j) => { const age = i - j; return a + s * (age === 0 ? 0.5 : (ret(age - 1) * (age === 1 ? (1 + p.ret1 / 100) / 2 : (1 + p.ret2 / 100) / 2))); }, 0);
    const price = p.wac * Math.pow(1 + p.priceUp / 100, i), net = price * (1 - p.gtn / 100) * p.comp / 100;
    out.push({ yr, popN, dxElig, access, starts: starts + xs, core, exp, pts: core + exp, price, netPer: net, rev: (core + exp) * net, revCore: core * net, revExp: exp * net });
  }
  return out;
}
const CTL = [
  ["Population", [["pop", "Addressable patients today", "n"], ["growth", "Annual growth in that pool", "%", 0, 8, .5], ["dx0", "Diagnosed / identified at launch", "%", 10, 100, 1], ["dxGrow", "Diagnosis gain per year (points)", "pt", 0, 12, .5], ["dxCap", "Diagnosis ceiling", "%", 30, 100, 1], ["elig", "Label-eligible and clinically appropriate", "%", 20, 100, 1]]],
  ["Access", [["acc1", "Covered lives with a workable path, year 1", "%", 10, 100, 1], ["accSS", "Covered access at steady state (year 3+)", "%", 30, 100, 1]]],
  ["Adoption & persistence", [["adopt", "Eligible untreated patients starting per year, at peak", "%"], ["ramp", "Years to reach peak adoption rate", "yr", 1, 7, 1], ["ret1", "Still on therapy after first year", "%", 20, 100, 1], ["ret2", "Annual retention thereafter", "%", 50, 100, 1], ["comp", "Compliance (paid days / calendar days)", "%", 50, 100, 1]]],
  ["Price", [["wac", "Annual list price (WAC)", "$"], ["gtn", "Gross-to-net discount", "%", 5, 75, 1], ["priceUp", "Annual list price change", "%", 0, 9, .5]]],
  ["Competition", [["comp_year", "Year a direct competitor arrives", "y", 2028, 2037, 1], ["comp_hit", "Share of new starts lost after that", "%", 0, 60, 5]]],
];
function viewSimulator() {
  setTimeout(simInit, 0);
  const c = cur(), s = c.sim;
  return head("Launch simulator", s.label, "An illustrative cohort model, not a forecast. Move an assumption and every figure updates.") + `
  <div class="sim"><section class="panel"><header><h3>Assumptions</h3><button class="btn" id="simReset">Reset</button></header>
      <div class="chips" id="simPresets">${Object.keys(s.presets).map(k => `<button class="chip" data-k="${esc(k)}">${esc(k)}</button>`).join("")}</div>
      <div id="simCtl"></div></section>
    <div style="display:flex;flex-direction:column;gap:24px;min-width:0">
      <section class="figure" style="padding-bottom:16px"><span class="eyebrow">Forecast</span><h2 id="simHead"></h2><div class="kpis" id="simKpi"></div><div id="simChart"></div><div class="prov"><span id="simRef"></span><span class="pill">modeled</span><span>Analog revenue from company reports.</span></div></section>
      <section class="figure" style="padding-bottom:16px"><span class="eyebrow">Sensitivity</span><h2 id="simTorHead"></h2><p class="deck">Peak net revenue when one assumption moves and the rest hold.</p><div id="simTornado"></div></section>
      <section class="figure" style="padding-bottom:16px"><span class="eyebrow">Patient flow at peak</span><h2 id="simFlowHead"></h2><div id="simFlow"></div></section>
      <div class="grid"><section class="panel c6"><header><h3 id="simStHead">Where the revenue sits at peak</h3><span class="sub">Modeled state allocation</span></header><div id="simStates"></div></section>
      <section class="panel c6"><header><h3>Field force sizing</h3><span class="sub">Call-capacity arithmetic</span></header><div id="simField"></div></section></div>
      <section class="panel"><header><h3>Scenarios</h3><div class="tbar"><input type="text" id="simName" placeholder="Scenario name" aria-label="Scenario name" style="width:160px"><button class="btn pri" id="simSave">Save scenario</button></div></header><div id="simSaved"></div>
        <details class="acc"><summary><span>Year-by-year table</span></summary><div id="simTable" style="padding-bottom:12px"></div></details></section>
    </div></div>`;
}
function simInit() {
  const ta = state.ta, c = TA[ta], S = c.sim; let p = simP(ta); const fp = Object.assign({}, S.field, (simStore[ta + "_field"] || {}));
  const rng = (k, u, lo, hi, st) => S.ranges[k] || [lo, hi, st];
  const fmtV = (k, u, v) => u === "$" ? "$" + N(v) : u === "n" ? N(v) : u === "y" ? String(v) : u === "yr" ? v + " yr" : u === "pt" ? "+" + v : v + "%";
  const ctl = (k, l, u, lo, hi, st) => { const [a, b, s] = rng(k, u, lo, hi, st); return `<div class="ctl"><label for="s_${k}">${esc(l)}</label><output id="o_${k}">${fmtV(k, u, p[k])}</output><input type="range" id="s_${k}" data-k="${k}" data-u="${u}" min="${a}" max="${b}" step="${s}" value="${p[k]}"></div>`; };
  const open = store.get("simOpen", { Population: 1, Price: 1 });
  $("#simCtl").innerHTML = CTL.map(([g, items]) => `<details class="acc" data-g="${esc(g)}" ${open[g] ? "open" : ""}><summary><span>${esc(g)}</span></summary><div style="padding-bottom:8px">${items.map(x => ctl(...x)).join("")}</div></details>`).join("") +
    `<details class="acc" data-g="x" ${open.x ? "open" : ""}><summary><span>${esc(S.xLabel)}</span></summary><div style="padding-bottom:8px"><div class="ctl"><label for="s_x_on">Include this second population</label><output><input type="checkbox" id="s_x_on" ${p.x_on ? "checked" : ""}></output></div>${ctl("x_pop", "Additional addressable patients", "n")}${ctl("x_year", "First year", "y", 2027, 2034, 1)}${ctl("x_adopt", "Starting per year, at peak", "%")}</div></details>`;
  $$("#simCtl details").forEach(d => d.ontoggle = () => { open[d.dataset.g] = d.open ? 1 : 0; store.set("simOpen", open); });
  const save = () => { simStore[ta] = p; simStore[ta + "_field"] = fp; store.set("sim", simStore); };
  const lo = runSim(ta, Object.assign({}, S.p, S.presets.Downside)), hi = runSim(ta, Object.assign({}, S.p, S.presets.Upside));
  const draw = () => {
    const r = runSim(ta, p), peak = r.reduce((a, b) => b.rev > a.rev ? b : a, r[0]), cum = r.reduce((a, b) => a + b.rev, 0), y1b = r.find(x => x.rev >= 1e9);
    $("#simHead").textContent = `Net revenue peaks at ${USD(peak.rev)} in ${peak.yr} on these assumptions`;
    $("#simKpi").innerHTML = kpi(USD(cum), `${YEARS}-year cumulative net`, `${r[0].yr}–${r[YEARS - 1].yr}`) + kpi(K(peak.pts), "Patients on therapy at peak", `${PCT(peak.pts / peak.popN, 1)} of addressable pool`) + kpi(USD(r[0].netPer), "Net per patient-year", `list ${USD(p.wac)}`) + kpi(y1b ? String(y1b.yr) : "Not reached", "First $1B year", y1b ? `year ${y1b.yr - S.launch + 1} on market` : "within 10 years");
    $("#simRef").textContent = S.guidance.label + ".";
    $("#simChart").innerHTML = fanChart(ta, r, lo, hi, S.guidance);
    const tor = tornado(ta, p); $("#simTornado").innerHTML = tor.html; $("#simTorHead").textContent = `${tor.top} moves the peak most`;
    $("#simFlowHead").textContent = `${K(peak.pts)} of ${K(peak.popN)} addressable patients are on therapy in ${peak.yr}`;
    $("#simFlow").innerHTML = stepFunnel([["Addressable patients", peak.popN], ["Diagnosed and label-eligible", peak.dxElig], ["With a workable coverage path", peak.dxElig * peak.access], ["On therapy", peak.pts]], { aria: "Patient flow at peak year", W: 760 });
    $("#simTable").innerHTML = `<div class="tblwrap"><table><thead><tr><th>Year</th><th class="n">Eligible diagnosed</th><th class="n">Access</th><th class="n">New starts</th><th class="n">On therapy</th><th class="n">List price</th><th class="n">Net / pt-yr</th><th class="n">Net revenue</th></tr></thead><tbody>${r.map(x => `<tr><td>${x.yr}</td><td class="n">${K(x.dxElig)}</td><td class="n">${PCT(x.access)}</td><td class="n">${K(x.starts)}</td><td class="n">${K(x.pts)}</td><td class="n">${USD(x.price)}</td><td class="n">${USD(x.netPer)}</td><td class="n"><b>${USD(x.rev)}</b></td></tr>`).join("")}</tbody></table></div>`;
    const idx = priorityIndex(ta), sts = STK.map(st => ({ st, v: peak.rev * share(ta, st) })).sort((a, b) => b.v - a.v);
    $("#simStHead").textContent = `Ten states hold ${PCT(sts.slice(0, 10).reduce((a, b) => a + b.v, 0) / peak.rev)} of modeled peak revenue`;
    $("#simStates").innerHTML = hbar(sts.slice(0, 10).map(x => ({ label: ST[x.st].name, value: x.v, tip: `<b>${esc(ST[x.st].name)}</b><br>${USD(x.v)} at peak · ${K(peak.pts * share(ta, x.st))} patients<br>Priority index ${N(idx[x.st], 0)}` })), { fmt: USD, labelW: 112, W: 380 }) + `<p class="sub">Allocation follows age-weighted population, before access differences.</p>`;
    const reps = fp.targets * fp.calls / (fp.perDay * fp.days), cost = reps * fp.cost;
    const fctl = (k, l, lo2, hi2, st, f) => `<div class="ctl"><label for="f_${k}">${l}</label><output>${f(fp[k])}</output><input type="range" id="f_${k}" data-fk="${k}" min="${lo2}" max="${hi2}" step="${st}" value="${fp[k]}"></div>`;
    $("#simField").innerHTML = `<div class="kpis" style="grid-template-columns:1fr 1fr">${kpi(N(Math.ceil(reps)), "Representatives needed")}${kpi(USD(cost), "Annual field cost", `${PCT(cost / Math.max(1, peak.rev), 1)} of peak net revenue`)}</div>` + fctl("targets", "Target prescribers", ta === "dee" ? 200 : 2000, ta === "dee" ? 6000 : 40000, ta === "dee" ? 100 : 500, N) + fctl("calls", "Calls per target per year", 4, 24, 1, N) + fctl("perDay", "Calls per rep per day", 2, 10, .5, v => v) + fctl("cost", "Fully loaded cost per rep", 150000, 450000, 10000, USD) + `<p class="sub">${ta === "dee" ? "Disclosed: about 200 accounts hold 65% of known patients; an analog launch used 60–70 reps." : "Disclosed plan: about 300 field staff against 19,000 prescribers."}</p>`;
    $$("#simField input[type=range]").forEach(i => i.oninput = () => { fp[i.dataset.fk] = +i.value; save(); draw(); const el = document.getElementById(i.id); if (el) el.focus(); });
    const saved = store.get("scen_" + ta, []);
    $("#simSaved").innerHTML = saved.length ? `<div class="tblwrap"><table><thead><tr><th>Name</th><th class="n">Peak net</th><th class="n">Peak year</th><th class="n">10-yr cumulative</th><th class="n">Patients at peak</th><th></th></tr></thead><tbody>${saved.map((s, i) => `<tr><td><b>${esc(s.name)}</b></td><td class="n">${USD(s.peak)}</td><td class="n">${s.peakYr}</td><td class="n">${USD(s.cum)}</td><td class="n">${K(s.pts)}</td><td><button class="btn" data-load="${i}">Load</button> <button class="btn" data-del="${i}">Remove</button></td></tr>`).join("")}</tbody></table></div><p class="sub">Saved in this browser only.</p>` : `<p class="sub">Save a scenario to compare it with others. Saved in this browser only.</p>`;
    $$("#simSaved [data-load]").forEach(b => b.onclick = () => { p = Object.assign({}, S.p, saved[+b.dataset.load].p); save(); simInit(); });
    $$("#simSaved [data-del]").forEach(b => b.onclick = () => { saved.splice(+b.dataset.del, 1); store.set("scen_" + ta, saved); draw(); });
    $("#simSave").onclick = () => { const nm = $("#simName").value.trim() || "Scenario " + (saved.length + 1); saved.push({ name: nm, p: Object.assign({}, p), peak: peak.rev, peakYr: peak.yr, cum, pts: peak.pts }); store.set("scen_" + ta, saved); $("#simName").value = ""; draw(); };
  };
  $$("#simCtl input[type=range]").forEach(i => i.oninput = () => { const k = i.dataset.k; p[k] = +i.value; $("#o_" + k).textContent = fmtV(k, i.dataset.u, p[k]); save(); draw(); });
  $("#s_x_on").onchange = e => { p.x_on = e.target.checked ? 1 : 0; save(); draw(); };
  $$("#simPresets .chip").forEach(b => b.onclick = () => { p = Object.assign({}, S.p, S.presets[b.dataset.k]); save(); simInit(); $$("#simPresets .chip").forEach(x => x.setAttribute("aria-pressed", x.dataset.k === b.dataset.k)); });
  $("#simReset").onclick = () => { p = Object.assign({}, S.p); save(); simInit(); };
  draw();
}
