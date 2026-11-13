/* Explanatory figures. All drawn in code from flat slate strokes; cobalt marks the subject or selection; crimson only for harm, with icon + label.
   Mechanism figures are schematics, not to scale. Numbers shown on a figure are traceable through its provenance line. */
const edSrc = (ta, i) => ((R[ta].disease_education || [])[i] || {}).sources || [];
const epi = (ta, rx) => (R[ta].epidemiology || []).find(e => rx.test((e.syndrome || "") + " " + e.metric)) || {};
const wrapT = (txt, n) => { const w = String(txt).split(" "), out = []; let l = ""; w.forEach(x => { if ((l + " " + x).trim().length > n && l) { out.push(l); l = x; } else l = (l + " " + x).trim(); }); if (l) out.push(l); return out; };
const tspans = (txt, n, x, lh = 16) => wrapT(txt, n).map((l, i) => `<tspan x="${x}" dy="${i ? lh : 0}">${esc(l)}</tspan>`).join("");
const hatch = `<defs><pattern id="hatch" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="7" stroke="#94A3B8" stroke-width="2"/></pattern></defs>`;
const onKey = "if(event.key==='Enter'||event.key===' '){event.preventDefault();this.dispatchEvent(new MouseEvent('click',{bubbles:true}))}";

/* ---------- sodium channel schematic ---------- */
function channelSVG(o) {
  const cxs = o.nCh === 2 ? [300, 420] : o.nCh === 0.5 ? [360] : [360]; let g = "";
  g += `<rect x="20" y="62" width="680" height="44" fill="#EEF1F5"/><line x1="20" x2="700" y1="62" y2="62" stroke="#111827" stroke-width="2"/><line x1="20" x2="700" y1="106" y2="106" stroke="#111827" stroke-width="2"/><text x="28" y="52" font-size="14" fill="#42526E">Outside the neuron</text><text x="28" y="128" font-size="14" fill="#42526E">Inside</text>`;
  cxs.forEach((cx, i) => {
    const gap = o.gap, fw = Math.max(1.5, gap / 3.2);
    g += `<rect x="${cx - gap / 2 - 16}" y="50" width="16" height="68" rx="4" fill="#2457D6"/><rect x="${cx + gap / 2}" y="50" width="16" height="68" rx="4" fill="#2457D6"/><rect x="${cx - gap / 2}" y="63" width="${gap}" height="42" fill="#F8FAFC"/>`;
    g += `<line x1="${cx}" x2="${cx}" y1="24" y2="140" stroke="#111827" stroke-width="${fw}"/><path d="M${cx - 7} 134 L${cx} 148 L${cx + 7} 134 z" fill="#111827"/>`;
    if (o.plug) g += `<rect x="${cx - gap / 2 - 2}" y="55" width="${gap + 4}" height="9" rx="3" fill="#111827"/>`;
    if (i === cxs.length - 1) g += `<line x1="${cx + gap / 2 + 19}" x2="${cx + 96}" y1="98" y2="98" stroke="#42526E"/><circle cx="${cx + gap / 2 + 19}" cy="98" r="3" fill="#F8FAFC" stroke="#42526E"/><text x="${cx + 102}" y="103" font-size="15">Sodium channel</text><text x="${cx + 26}" y="36" font-size="15" font-weight="600">Na⁺ flowing in</text>`;
    if (o.plug && i === 0) g += `<line x1="${cx - gap / 2 - 6}" x2="${cx - 84}" y1="59" y2="36" stroke="#42526E"/><circle cx="${cx - gap / 2 - 6}" cy="59" r="3" fill="#F8FAFC" stroke="#42526E"/><text x="${cx - 90}" y="34" font-size="15" text-anchor="end">${esc(o.plugLabel || "Blocker")}</text>`;
  });
  if (o.ghost) g += `<g opacity=".35"><rect x="${420 - o.gap / 2 - 16}" y="50" width="16" height="68" rx="4" fill="none" stroke="#42526E" stroke-dasharray="4 3"/><rect x="${420 + o.gap / 2}" y="50" width="16" height="68" rx="4" fill="none" stroke="#42526E" stroke-dasharray="4 3"/></g><text x="466" y="103" font-size="15" fill="#42526E">Fewer channels made</text>`;
  const x0 = 40, y0 = 204, pk = o.peak, tl = o.tail, wide = !o.fire && o.fire !== 0;
  g += `<text x="${x0}" y="186" font-size="15" font-weight="600">Sodium current</text><line x1="${x0}" x2="${wide ? 640 : 320}" y1="${y0}" y2="${y0}" stroke="rgba(17,24,39,.45)" stroke-dasharray="4 4"/>`;
  if (o.refTail != null) g += `<path d="M${x0} ${y0} H${x0 + 50} L${x0 + 62} ${y0 + o.refPeak} L${x0 + 92} ${y0 + o.refTail + (o.refPeak - o.refTail) * .12} Q${x0 + 120} ${y0 + o.refTail} ${x0 + 150} ${y0 + o.refTail} H${x0 + 250} L${x0 + 262} ${y0} H320" fill="none" stroke="#94A3B8" stroke-width="2" stroke-dasharray="5 4"/>`;
  g += `<path d="M${x0} ${y0} H${x0 + 50} L${x0 + 62} ${y0 + pk} L${x0 + 92} ${y0 + tl + (pk - tl) * .12} Q${x0 + 120} ${y0 + tl} ${x0 + 150} ${y0 + tl} H${x0 + 250} L${x0 + 262} ${y0} H320" fill="none" stroke="#111827" stroke-width="2.5" stroke-linejoin="round"/>`;
  if (tl > 8) g += `<line x1="${x0 + 200}" x2="${x0 + 212}" y1="${y0 + tl + 4}" y2="${y0 + 50}" stroke="#42526E"/><text x="${x0 + 150}" y="${y0 + 68}" font-size="15">Persistent current</text>`;
  if (o.refTail != null) g += `<text x="350" y="${y0 + 8}" font-size="15" fill="#42526E">Dashed: before treatment</text><text x="350" y="${y0 + 30}" font-size="15">Solid: intended effect</text>`;
  if (o.fire != null) {
    const fx = 400, fy = 272, col = o.harm ? "#B4233C" : "#111827";
    g += `<text x="${fx}" y="186" font-size="15" font-weight="600">Neuron firing</text><line x1="${fx}" x2="690" y1="${fy}" y2="${fy}" stroke="${col}" stroke-width="2"/>`;
    for (let i = 0; i < o.fire; i++) { const x = fx + 14 + i * (262 / Math.max(o.fire, 1)); g += `<line x1="${x}" x2="${x}" y1="${fy}" y2="${fy - 58}" stroke="${col}" stroke-width="2.5"/>`; }
    if (!o.fire) g += `<text x="${fx + 8}" y="${fy - 22}" font-size="15" fill="#B4233C" font-weight="600">⚠ almost silent</text>`;
  }
  return `<svg class="fig" viewBox="0 0 720 292" role="img" aria-label="${esc(o.aria || "Sodium channel schematic")}">${g}</svg>`;
}
const CH = { typ: { gap: 18, peak: 62, tail: 2, fire: 5 }, gof: { gap: 30, peak: 62, tail: 20, fire: 12 }, lof: { gap: 7, peak: 24, tail: 1, fire: 2 } };
function figChannel() {
  const T = { typ: ["Typical channel", "The channel opens briefly, lets sodium in, then shuts. The neuron fires in a controlled rhythm."], gof: ["Over-active channel", "The channel stays partly open. A persistent current keeps the neuron firing. Seizures start in the first days to months of life."], lof: ["Under-active channel", "Too little sodium gets in. Seizures start later, with autism and intellectual disability."] };
  const TB = { typ: ["Blocker added", "Firing is slightly damped."], gof: ["Calms toward typical", "The blocker trims the excess current. Sodium-channel blockers are first-line here."], lof: ["Worsens", "The same blocker removes what little current remains. Seizures can get worse."] }, FB = { typ: 4, gof: 5, lof: 0 };
  setTimeout(() => { let s = "typ", blk = false; const draw = () => { const p = CH[s], harm = blk && s === "lof", ok = blk && s === "gof";
      $("#chFig").innerHTML = channelSVG({ gap: blk ? p.gap * .55 : p.gap, peak: blk ? p.peak * .8 : p.peak, tail: blk ? p.tail * .25 : p.tail, fire: blk ? FB[s] : p.fire, plug: blk, harm, aria: T[s][0] + (blk ? ", with blocker" : "") });
      const st = $("#chStatus"); st.className = "status" + (harm ? " adverse" : ok ? " good" : ""); st.textContent = (harm ? "⚠ " : ok ? "✓ " : "") + (blk ? TB[s][0] : T[s][0]); $("#chNote").textContent = blk ? TB[s][1] : T[s][1]; };
    $$("#chState button").forEach(b => b.onclick = () => { s = b.dataset.s; $$("#chState button").forEach(x => x.setAttribute("aria-pressed", x === b)); draw(); }); $("#chBlock").onchange = e => { blk = e.target.checked; draw(); }; draw(); }, 0);
  return figure("Mechanism", "Same gene, opposite problems", "SCN2A and SCN8A variants either over-activate or under-activate a sodium channel. The same drug class helps one and harms the other.",
    `<div class="fig2"><div><div class="ctrls" style="margin-bottom:12px"><div class="seg" id="chState" role="group" aria-label="Channel variant"><button data-s="typ" aria-pressed="true">Typical</button><button data-s="gof" aria-pressed="false">Gain of function</button><button data-s="lof" aria-pressed="false">Loss of function</button></div><label class="switch"><input type="checkbox" id="chBlock"> Add a sodium-channel blocker</label></div><div id="chFig"></div></div>
     <div class="side"><span class="status" id="chStatus"></span><p id="chNote"></p><p class="note">This is why the genetic test, and the variant's functional class, come before the drug choice.</p></div></div>`,
    prov(edSrc("dee", 3), { note: "Schematic, not to scale; firing counts are illustrative.", conf: "high", quality: "conceptual" }));
}
function figPipelineActs() {
  const M = { none: ["Untreated gain of function", "The channel stays partly open; a persistent current remains after each opening.", {}],
    blocker: ["Non-selective blocker", "Plugs the pore. It trims the persistent current but also the normal peak, which is why doses are limited by side effects. Used off-label today.", { plug: 1, peak: .72, tail: .25, plugLabel: "Blocker" }],
    modulator: ["Persistent-current modulator", "Designed to act mainly on the persistent current and spare the normal peak. Investigational; the first is under FDA review.", { plug: 1, peak: .96, tail: .2, plugLabel: "Modulator" }],
    aso: ["Antisense therapy", "Lowers how much channel the cell makes, so fewer over-active channels reach the membrane. Given into the spinal fluid. Investigational.", { aso: 1 }] };
  setTimeout(() => { const draw = k => { const m = M[k], p = CH.gof, o = m[2];
      $("#paFig").innerHTML = channelSVG({ gap: p.gap, peak: p.peak * (o.peak || 1), tail: p.tail * (o.tail || 1), plug: o.plug, plugLabel: o.plugLabel, nCh: o.aso ? 1 : 2, ghost: o.aso, refPeak: k === "none" ? null : p.peak, refTail: k === "none" ? null : p.tail, aria: m[0] });
      const st = $("#paStatus"); st.className = "status" + (k === "modulator" || k === "aso" ? " info" : ""); st.textContent = (k === "modulator" || k === "aso" ? "Investigational · " : "") + m[0]; $("#paNote").textContent = m[1]; $$("#paSel button").forEach(x => x.setAttribute("aria-pressed", x.dataset.k === k)); };
    $$("#paSel button").forEach(b => b.onclick = () => draw(b.dataset.k)); draw("none"); }, 0);
  return figure("Where therapies act", "Three ways to quiet an over-active channel", "Each approach targets a different part of the same problem. The figure shows intended mechanism only, not clinical results.",
    `<div class="fig2"><div><div class="seg" id="paSel" role="group" aria-label="Approach" style="margin-bottom:12px"><button data-k="none">Untreated</button><button data-k="blocker">Blocker</button><button data-k="modulator">Modulator</button><button data-k="aso">Antisense</button></div><div id="paFig"></div></div>
     <div class="side"><span class="status" id="paStatus"></span><p id="paNote"></p><a class="src" href="#landscape">Trial results and status in Competitive landscape →</a></div></div>`,
    prov([...edSrc("dee", 3).slice(0, 2), ...((R.dee.pipeline || [])[0] || {}).sources || []].slice(0, 4), { note: "Schematic of intended mechanism. Investigational products are not approved.", conf: "medium", quality: "conceptual" }));
}

/* ---------- DEE: age of onset ---------- */
function figOnset() {
  const B = [
    { id: "s2g", l: "SCN2A · gain of function", a: 0, b: 3, seiz: "Tonic and focal seizures from the first days of life; can evolve to spasms.", drug: "Sodium-channel blockers, often at high dose.", chg: "Confirms a blocker is appropriate and opens targeted trials.", st: "good", stl: "✓ Blockers help" },
    { id: "s2l", l: "SCN2A · loss of function", a: 3, b: 60, open: 1, seiz: "Later-onset epilepsy, often with autism and intellectual disability.", drug: "Other anti-seizure medicines; blockers rarely help.", chg: "Tells the clinician to avoid or withdraw sodium-channel blockers.", st: "adverse", stl: "⚠ Blockers can worsen" },
    { id: "s8s", l: "SCN8A · severe DEE (gain)", a: 0, b: 6, seiz: "Multiple seizure types with high burden and elevated mortality.", drug: "Sodium-channel blockers; levetiracetam is relatively contraindicated.", chg: "Changes the first drug: away from levetiracetam, toward blockers.", st: "good", stl: "✓ Blockers help" },
    { id: "s8m", l: "SCN8A · mild to moderate DEE (gain)", a: 4, b: 12, seiz: "Later infant onset with a milder course.", drug: "Sodium-channel blockers.", chg: "Supports blocker use and sets prognosis.", st: "good", stl: "✓ Blockers help" },
    { id: "s8l", l: "SCN8A · loss of function", a: 12, b: 60, unk: 1, seiz: "Neurodevelopmental disorder with generalized (absence) epilepsy.", drug: "Sodium-channel blockers are relatively contraindicated.", chg: "Steers away from blockers.", st: "adverse", stl: "⚠ Blockers relatively contraindicated" },
    { id: "drv", l: "Dravet syndrome (SCN1A) · comparator", a: 0, b: 12, seiz: "Prolonged febrile seizures or status epilepticus in the first year.", drug: "Valproate, clobazam, stiripentol, fenfluramine, cannabidiol.", chg: "Three approved branded options exist; the SCN2A/SCN8A patient has none.", st: "", stl: "Approved options exist" }];
  const W = 760, x0 = 20, w = W - 60, X = m => x0 + w * Math.sqrt(m / 60), rh = 44, ticks = [[0, "Birth"], [3, "3 mo"], [6, "6 mo"], [12, "1 yr"], [24, "2 yr"], [48, "4 yr"]];
  const svg = sel => { let g = hatch; ticks.forEach(([m, l]) => g += `<line x1="${X(m)}" x2="${X(m)}" y1="22" y2="${30 + B.length * rh}" stroke="rgba(17,24,39,.12)"/><text x="${X(m)}" y="14" font-size="14" fill="#42526E" text-anchor="${m ? "middle" : "start"}">${l}</text>`);
    B.forEach((b, i) => { const y = 32 + i * rh, on = b.id === sel, bw = X(b.b) - X(b.a);
      g += `<g class="hit" role="button" tabindex="0" data-b="${b.id}" onkeydown="${onKey}" aria-label="${esc(b.l)}"><rect x="0" y="${y - 4}" width="${W}" height="${rh}" fill="transparent"/><rect x="${X(b.a)}" y="${y}" width="${bw}" height="16" rx="4" fill="${b.unk ? "url(#hatch)" : on ? "#2457D6" : "#C9D6F7"}" ${b.unk ? `stroke="${on ? "#2457D6" : "#94A3B8"}" stroke-width="${on ? 2 : 1}"` : ""}/>${b.open ? `<path d="M${X(b.b) - 2} ${y - 3} l12 11 l-12 11 z" fill="${on ? "#2457D6" : "#C9D6F7"}"/>` : ""}<text x="${X(b.a) + 2}" y="${y + 32}" font-size="14" ${on ? 'font-weight="600" fill="#2457D6"' : ""}>${esc(b.l)}${b.unk ? " · onset age not available" : ""}</text></g>`; });
    return `<svg class="fig" style="min-width:560px" viewBox="0 0 ${W} ${40 + B.length * rh}" role="img" aria-label="Typical age at seizure onset by gene and variant class">${g}</svg>`; };
  setTimeout(() => { const draw = id => { const b = B.find(x => x.id === id); $("#onFig").innerHTML = svg(id); $$("#onFig [data-b]").forEach(e => e.onclick = () => draw(e.dataset.b));
      $("#onSide").innerHTML = `<span class="status ${b.st}">${esc(b.stl)}</span><h3>${esc(b.l)}</h3><dl class="kv" style="grid-template-columns:1fr"><dt>Seizures</dt><dd>${esc(b.seiz)}</dd><dt>Typical first drug</dt><dd>${esc(b.drug)}</dd><dt>What the genetic result changes</dt><dd>${esc(b.chg)}</dd></dl>`; }; draw("s2g"); }, 0);
  return figure("Natural history", "When seizures start points to what kind of variant it is", "Onset before three months suggests gain of function. Later onset suggests loss of function. Select a band.",
    `<div class="fig2"><div class="scroll" id="onFig"></div><div class="side" id="onSide"></div></div>`,
    prov([...edSrc("dee", 1).slice(0, 1), ...edSrc("dee", 2).slice(0, 2), ...edSrc("dee", 4).slice(0, 1)], { note: "Typical onset windows; time axis compressed. Hatched = age not available.", conf: "high", quality: "observed" }));
}

/* ---------- DEE: incidence ---------- */
function figIncidence() {
  let dots = ""; for (let i = 0; i < 590; i++) { const c = i % 59, r = Math.floor(i / 59); dots += `<circle cx="${6 + c * 12.4}" cy="${6 + r * 12.4}" r="${i === 325 ? 5 : 3.4}" fill="${i === 325 ? "#2457D6" : "#C9D6F7"}"/>`; }
  const G = [["SCN1A (all phenotypes)", 8.26, /SCN1A.*Symonds|^SCN1A/], ["Dravet syndrome", 6.4, /Dravet syndrome Incidence/], ["KCNQ2", 5.89, /KCNQ2/], ["STXBP1", 3.3, /STXBP1/], ["CDKL5", 2.4, /CDKL5/], ["SCN8A", 1.8, /SCN8A-related disorders Incidence/], ["SCN2A", null, /SCN2A-DEE Prevalence/]];
  const W = 520, lw = 170, mx = 9, X = v => lw + v / mx * (W - lw - 60); let g = "";
  G.forEach(([l, v], i) => { const y = 14 + i * 34, sub = /SCN8A|SCN2A/.test(l);
    g += `<text x="${lw - 10}" y="${y + 5}" font-size="14" text-anchor="end" ${sub ? 'font-weight="600"' : ""}>${l}</text>` + (v == null ? `<rect x="${lw}" y="${y - 7}" width="${X(3) - lw}" height="14" rx="3" fill="url(#hatch)" stroke="#94A3B8"/><text x="${X(3) + 8}" y="${y + 5}" font-size="14" fill="#42526E">not available per birth</text>` : `<rect x="${lw}" y="${y - 7}" width="${X(v) - lw}" height="14" rx="3" fill="${sub ? "#2457D6" : "#111827"}"/><text x="${X(v) + 8}" y="${y + 5}" font-size="14" font-weight="600">${v}</text>`); });
  const srcs = ["https://doi.org/10.1177/15357597231203079", ...G.map(x => epi("dee", x[2]).source_url).filter(Boolean)];
  return figure("How common", "One child in 590 develops a DEE; each gene is a sliver of that", "SCN2A and SCN8A are among the more frequent single-gene causes, yet each accounts for only a few births per 100,000.",
    `<div class="fig2"><div><svg class="fig" viewBox="0 0 736 126" role="img" aria-label="590 dots, one highlighted">${dots}</svg><p class="note" style="margin-top:8px">590 children. One develops a developmental and epileptic encephalopathy by age 16.</p></div>
     <div><h4 style="margin-bottom:8px">New cases per 100,000 live births</h4><svg class="fig" viewBox="0 0 ${W} ${G.length * 34 + 6}" role="img" aria-label="Incidence per 100,000 live births by gene">${hatch}${g}</svg><p class="note">SCN2A is reported as prevalence instead: 1–3 per 100,000 people.</p></div></div>`,
    prov([...new Set(srcs)].slice(0, 5), { note: "Rates converted from the published 1-in-N figures.", conf: "medium", quality: "observed" }));
}

/* ---------- DEE: burden ---------- */
function figBurden() {
  const T = [["35–45%", "of families had a caregiver leave employment", "Dravet, LGS and TSC studies"], ["71%", "of caregivers report depression symptoms, at the high end", "Up to 70.7% across studies"], ["$24K–$81K", "direct medical cost per patient per year", "Range of study means"], ["5.3%", "mortality among 190 published SCN8A patients", "1.6% definite or probable SUDEP"], ["9.3", "SUDEP deaths per 1,000 patient-years in Dravet", "One cohort; another reports 4.4"]];
  return figure("Beyond seizures", "The disease takes a parent out of work as often as not", "Seizure counts are the trial endpoint. The burden families and payers carry is wider.",
    `<div class="tiles">${T.map(t => `<div class="tile"><b>${t[0]}</b><span>${esc(t[1])}</span><small>${esc(t[2])}</small></div>`).join("")}</div><p class="note">No US cost-of-illness study specific to SCN2A or SCN8A is available; figures are from related syndromes.</p>`,
    prov([...edSrc("dee", 7), ...edSrc("dee", 6).slice(0, 2)], { conf: "medium", quality: "observed" }));
}

/* ---------- ET: tremor loop ---------- */
function figLoop() {
  const N = { cortex: [300, 96, "Motor cortex"], thal: [372, 196, "Thalamus (Vim)"], cer: [520, 298, "Cerebellum"], olive: [418, 338, "Inferior olive"] };
  const O = { loop: ["The tremor loop", "A 4–12 Hz rhythm circulates between brainstem, cerebellum, thalamus and motor cortex, then drives the arm.", [], ""],
    ttype: ["Investigational · T-type calcium channel blocker", "These channels pace burst firing at the highlighted sites. A blocker aims to damp the rhythm at its source. Three earlier programs in this class failed in Phase 2; one is under FDA review.", ["olive", "cer", "thal"], "info"],
    dbs: ["Deep brain stimulation", "An electrode in the Vim thalamus interrupts the relay. Adjustable and reversible. For tremor that medicines do not control.", ["thal"], ""],
    fus: ["Focused ultrasound", "Sound beams converge to make a small permanent lesion in the Vim thalamus. No incision. For tremor that medicines do not control.", ["thal"], ""],
    gen: ["Propranolol and primidone", "The two first-line medicines work for about half of patients. Where they act on this loop is not established.", [], ""] };
  const loop = `M${N.olive[0]} ${N.olive[1]} Q470 350 ${N.cer[0]} ${N.cer[1]} Q470 220 ${N.thal[0]} ${N.thal[1]} Q330 150 ${N.cortex[0]} ${N.cortex[1]} Q270 250 ${N.olive[0]} ${N.olive[1]}`;
  const svg = k => { const hi = O[k][2]; let g = `<ellipse cx="370" cy="176" rx="232" ry="128" fill="none" stroke="#111827" stroke-width="1.8"/><ellipse cx="520" cy="298" rx="84" ry="52" fill="#F8FAFC" stroke="#111827" stroke-width="1.8"/><path d="M392 286 Q386 340 404 398 M446 300 Q446 346 438 398" fill="none" stroke="#111827" stroke-width="1.8"/>`;
    g += `<path d="${loop}" fill="none" stroke="#42526E" stroke-width="2" stroke-dasharray="6 5"/><circle class="loopdot" r="6" fill="#111827"><animateMotion dur="2.4s" repeatCount="indefinite" path="${loop}"/></circle>`;
    g += `<path d="M422 392 Q360 430 250 414" fill="none" stroke="#111827" stroke-width="2"/><path d="M258 407 l-12 7 l11 8" fill="none" stroke="#111827" stroke-width="2"/><text x="238" y="419" font-size="15" font-weight="600" text-anchor="end">Arm and hand</text><path d="M40 440 ${Array.from({ length: 26 }, (_, i) => `l4 ${i % 2 ? 12 : -12}`).join(" ")}" fill="none" stroke="#111827" stroke-width="2" transform="translate(0,6)"/><text x="150" y="452" font-size="14" fill="#42526E">4–12 Hz action tremor</text>`;
    if (k === "dbs") g += `<line x1="352" x2="${N.thal[0]}" y1="20" y2="${N.thal[1]}" stroke="#2457D6" stroke-width="3"/><text x="362" y="30" font-size="15" fill="#2457D6" font-weight="600">Electrode</text>`;
    if (k === "fus") g += [[150, 40], [250, 14], [470, 14], [590, 44]].map(([x, y]) => `<line x1="${x}" y1="${y}" x2="${N.thal[0]}" y2="${N.thal[1]}" stroke="#2457D6" stroke-width="1.6" stroke-dasharray="3 4"/>`).join("") + `<text x="600" y="40" font-size="15" fill="#2457D6" font-weight="600">Ultrasound</text>`;
    Object.entries(N).forEach(([id, [x, y, l]]) => { const on = hi.includes(id); g += `<circle cx="${x}" cy="${y}" r="${on ? 15 : 11}" fill="${on ? "#2457D6" : "#F8FAFC"}" stroke="${on ? "#2457D6" : "#111827"}" stroke-width="2"/><text x="${id === "cer" ? x + 10 : id === "thal" ? x + 22 : x - 22}" y="${id === "cer" ? y + 78 : y + 5}" font-size="15" ${on ? 'font-weight="600" fill="#2457D6"' : ""} text-anchor="${id === "cer" ? "middle" : id === "thal" ? "start" : "end"}">${l}</text>`; });
    return `<svg class="fig" viewBox="0 0 720 470" role="img" aria-label="Schematic of the tremor circuit: ${esc(O[k][0])}">${g}</svg>`; };
  setTimeout(() => { const draw = k => { $("#lpFig").innerHTML = svg(k); const st = $("#lpStatus"); st.className = "status " + O[k][3]; st.textContent = O[k][0]; $("#lpNote").textContent = O[k][1]; $$("#lpSel button").forEach(b => b.setAttribute("aria-pressed", b.dataset.k === k)); }; $$("#lpSel button").forEach(b => b.onclick = () => draw(b.dataset.k)); draw("loop"); }, 0);
  return figure("Mechanism", "Tremor is a rhythm stuck in a loop, and every treatment targets a point on it", "Select a treatment to see where it acts.",
    `<div class="fig2"><div><div class="seg" id="lpSel" role="group" aria-label="Treatment" style="margin-bottom:12px"><button data-k="loop">The loop</button><button data-k="gen">First-line medicines</button><button data-k="ttype">T-type blocker</button><button data-k="dbs">DBS</button><button data-k="fus">Focused ultrasound</button></div><div id="lpFig"></div></div>
     <div class="side"><span class="status" id="lpStatus"></span><p id="lpNote"></p><p class="note">Which structure starts the rhythm is still debated; current evidence favors a network over a single pacemaker.</p></div></div>`,
    prov([...edSrc("et", 2), ...edSrc("et", 3).slice(2, 3)], { note: "Schematic, not to scale.", conf: "medium", quality: "conceptual" }));
}

/* ---------- ET: spiral ---------- */
function figSpiral() {
  const L = ["0 · none", "1 · slight", "2 · mild", "3 · moderate", "4 · severe"], Dn = ["A smooth spiral.", "Barely visible wobble.", "Obvious tremor; the figure is still clean.", "Lines waver and cross; writing and pouring are hard.", "The figure is barely recognisable; many daily tasks need help."];
  setTimeout(() => { const draw = () => { const sev = +$("#spSev").value, rx = $("#spRx").checked, A = sev * 5.2 * (rx ? .5 : 1); let d = "";
      for (let i = 0; i <= 900; i++) { const th = i / 900 * 7 * Math.PI, grow = .35 + .65 * i / 900, r = 8 + 7.4 * th + A * grow * Math.sin(th * 8.3 + Math.sin(th * 1.7)); d += (i ? "L" : "M") + (210 + r * Math.cos(th)).toFixed(1) + " " + (200 + r * Math.sin(th)).toFixed(1); }
      let hw = "M40 0"; for (let i = 0; i <= 300; i++) hw += `L${(40 + i * 1.15).toFixed(1)} ${(18 * Math.sin(i / 9) + A * .55 * Math.sin(i * 1.9)).toFixed(1)}`;
      const c = rx ? "#2457D6" : "#111827";
      $("#spFig").innerHTML = `<svg class="fig" viewBox="0 0 420 480" style="max-width:430px" role="img" aria-label="Spiral drawing at severity ${sev}${rx ? ", with first-line response" : ""}"><path d="${d}" fill="none" stroke="${c}" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round"/><g transform="translate(0,432)"><path d="${hw}" fill="none" stroke="${c}" stroke-width="2.2" stroke-linejoin="round"/></g><text x="40" y="474" font-size="14" fill="#42526E">Spiral drawing and a line of handwriting</text></svg>`;
      $("#spLab").textContent = L[sev]; $("#spNote").textContent = rx ? (sev ? "About half the amplitude remains. For moderate and severe tremor that is still visibly impaired, which helps explain why 40–47% stop within two years." : "Nothing to treat.") : Dn[sev]; };
    $("#spSev").oninput = draw; $("#spRx").onchange = draw; draw(); }, 0);
  return figure("What it looks like", "First-line medicines take off about half the tremor, in about half the patients", "Move the slider, then apply a typical response.",
    `<div class="fig2"><div id="spFig"></div><div class="side"><label for="spSev" style="font-weight:600">Tremor severity: <span id="spLab"></span></label><input class="range" type="range" id="spSev" min="0" max="4" step="1" value="3"><label class="switch"><input type="checkbox" id="spRx"> Apply a typical first-line response</label><p id="spNote"></p></div></div>`,
    prov(((R.et.treatment_flow || [])[0] || {}).sources, { note: "Drawing generated in code on an illustrative 0–4 scale. Benchmark: about 50% mean amplitude reduction; 37–56% of patients respond.", conf: "high", quality: "modeled drawing" }));
}

/* ---------- ET: differential ---------- */
function figDifferential() {
  const C = ["Essential tremor", "Parkinson's disease", "Dystonic tremor"], Rw = [["When it shows", "During action: holding a posture, writing, pouring", "At rest; eases with movement", "In specific postures or tasks; irregular"], ["Sides", "Both arms", "Starts on one side", "Often uneven"], ["Other signs", "None required", "Slowness and rigidity", "Abnormal posturing"], ["Supporting test", "None; clinical diagnosis", "DaT-SPECT can support", "None; clinical diagnosis"]];
  return figure("Diagnosis", "Up to half of essential tremor diagnoses may be wrong", "There is no biomarker. The two conditions most often mistaken for it differ in when the tremor appears.",
    `<div class="scroll"><div style="display:grid;grid-template-columns:150px repeat(3,minmax(170px,1fr));min-width:680px;border:1px solid var(--line);border-radius:12px;overflow:hidden">
      <div style="padding:12px;background:var(--surface-2)"></div>${C.map((c, i) => `<div style="padding:12px;font-family:var(--f-head);font-weight:600;background:${i ? "var(--surface-2)" : "var(--accent-soft)"};color:${i ? "var(--ink)" : "var(--accent)"}">${c}</div>`).join("")}
      ${Rw.map(r => `<div style="padding:12px;border-top:1px solid var(--line);color:var(--ink-2);font-size:14px;font-weight:600">${r[0]}</div>` + r.slice(1).map(v => `<div style="padding:12px;border-top:1px solid var(--line);font-size:15px">${v}</div>`).join("")).join("")}</div></div>`,
    prov([...edSrc("et", 8), ...edSrc("et", 0).slice(0, 1)], { note: "Misdiagnosis estimates: 30–50% across two re-evaluation studies.", conf: "medium", quality: "observed" }));
}

/* ---------- ET: daily living + age ---------- */
function figDaily() {
  const I = { pen: "M6 30 L26 10 l4 4 L10 34 l-6 2 z", glass: "M10 6 h20 l-3 28 h-14 z M12 18 h16", fork: "M14 4 v12 a6 6 0 0 0 12 0 v-12 M20 4 v32", shirt: "M14 6 l-10 6 l4 8 l4 -2 v16 h16 v-16 l4 2 l4 -8 l-10 -6 a6 6 0 0 1 -12 0", tap: "M8 14 h14 a8 8 0 0 1 8 8 v4 M22 26 h12 M15 14 v-8 M10 6 h10 M28 32 v4", key: "M14 20 a6 6 0 1 1 0.1 0 M19 22 l14 12 M27 29 l4 -4" };
  const T = [["pen", "Handwriting"], ["glass", "Drinking from a glass"], ["fork", "Using utensils"], ["shirt", "Dressing"], ["tap", "Hygiene"], ["key", "Small objects"]];
  const a = epi("et", /Diagnosed prevalence by age/);
  return figure("Impact", "What patients are scored on is what they cannot do", "Regulators accepted a function-based measure as the primary endpoint. These are the tasks it counts.",
    `<div class="fig2"><div class="tiles" style="grid-template-columns:repeat(auto-fit,minmax(150px,1fr))">${T.map(([k, l]) => `<div class="tile"><svg width="40" height="40" viewBox="0 0 40 40" aria-hidden="true"><path d="${I[k]}" fill="none" stroke="#111827" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg><span>${l}</span></div>`).join("")}</div>
     <div class="side"><h4>Diagnosed prevalence rises 27-fold with age</h4>${hbar([{ label: "Ages 18–40", value: .06 }, { label: "Ages 75+", value: 1.61, color: "var(--s1)" }], { fmt: v => v + "%", labelW: 100 })}<p class="note">Most patients are of Medicare age, which sets the payer mix.</p></div></div>`,
    prov([...edSrc("et", 7).slice(1, 2), a.source_url].filter(Boolean), { note: "Tasks from the TETRAS activities-of-daily-living subscale. Prevalence from US claims.", conf: "high", quality: "observed" }));
}

/* ---------- stepped funnel (proportional) ---------- */
function stepFunnel(rows, o = {}) {
  const W = o.W || 1100, mx = rows[0][1], bw = v => Math.max(3, v / mx * W * .62), cols = ["#C9D6F7", "#94ADEE", "#5D82E3", "#2457D6", "#173E9E"], rh = o.losses ? 84 : 62; let g = "";
  rows.forEach(([l, v, n], i) => { const y = 8 + i * rh; g += `<rect x="0" y="${y}" width="${bw(v)}" height="46" rx="4" fill="${cols[Math.min(i + (rows.length < 4 ? 0 : 0), 4)]}"/><text x="${bw(v) + 14}" y="${y + 21}" font-size="25" font-weight="700" font-family="Instrument Sans,Inter,Arial">${v ? (v < 1e5 ? N(v) : K(v).replace(/\.0(?=[KMB])/, "")) : "0"}</text><text x="${bw(v) + 14}" y="${y + 41}" font-size="15">${esc(l)}</text>`;
    if (o.losses && o.losses[i]) g += `<path d="M22 ${y + 50} v18 M16 ${y + 62} l6 7 l6 -7" fill="none" stroke="#42526E" stroke-width="1.5"/><text x="40" y="${y + 68}" font-size="15" fill="#42526E">${esc(o.losses[i])}</text>`; });
  let H = 8 + rows.length * rh;
  if (o.gap) { const [a, b, t] = o.gap, y = H + 8; g += `<line x1="${bw(a)}" x2="${bw(b)}" y1="${y}" y2="${y}" stroke="#42526E"/><line x1="${bw(a)}" x2="${bw(a)}" y1="${y - 6}" y2="${y + 6}" stroke="#42526E"/><line x1="${bw(b)}" x2="${bw(b)}" y1="${y - 6}" y2="${y + 6}" stroke="#42526E"/><text x="${(bw(a) + bw(b)) / 2}" y="${y + 26}" font-size="16" text-anchor="middle">${esc(t)}</text>`; H += 44; }
  return `<div class="scroll"><svg class="fig" style="min-width:${Math.min(700, W * .7)}px" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(o.aria || "Patient funnel")}">${g}</svg></div>`;
}

/* ---------- catalyst timeline ---------- */
function parseWhen(d) { d = String(d); const m = d.match(/(\d{4})-(\d{2})-(\d{2})/); if (m) return [Date.UTC(+m[1], +m[2] - 1, +m[3]), `${+m[3]} ${"Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec".split(" ")[+m[2] - 1]} ${m[1]}`];
  const q = d.match(/(\d{4})-Q(\d)/); if (q) return [Date.UTC(+q[1], (+q[2] - 1) * 3 + 1, 15), `Q${q[2]} ${q[1]}`]; const ym = d.match(/(\d{4})-(\d{2})/); if (ym) return [Date.UTC(+ym[1], +ym[2] - 1, 15), `${"Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec".split(" ")[+ym[2] - 1]} ${ym[1]}`];
  const y = d.match(/(\d{4})/); return y ? [Date.UTC(+y[1], 6, 1), y[1]] : null; }
function timelineFig(events) {
  const now = Date.parse(D.built), ev = events.map(e => { const p = parseWhen(e.date); return p ? { t: p[0], when: p[1], l: e.event, fut: p[0] >= now || /expected/i.test(e.date) } : null; }).filter(Boolean).sort((a, b) => a.t - b.t);
  if (!ev.length) return ""; const t0 = Math.min(ev[0].t, now) - 30 * 864e5, t1 = Math.max(ev[ev.length - 1].t, now) + 60 * 864e5, W = 1100, X = t => 16 + (t - t0) / (t1 - t0) * (W - 40), lh = 42, occ = { up: [], dn: [] };
  ev.forEach(e => { const x = X(e.t); e.short = e.l.length > 44 ? e.l.slice(0, 43) + "…" : e.l; const w = Math.max(e.short.length, e.when.length) * 7.9 + 12; e.end = x + w > W - 8; const a = e.end ? x - w : x, b2 = e.end ? x : x + w, side = occ[e.fut ? "dn" : "up"]; let li = side.findIndex(iv => iv.every(([p, q]) => b2 < p - 8 || a > q + 8)); if (li < 0) { li = side.length; side.push([]); } side[li].push([a, b2]); e.li = li; e.x = x; });
  const up = Math.max(1, occ.up.length), dn = Math.max(1, occ.dn.length), ty = 34 + up * lh; let g = `<line x1="16" x2="${W - 24}" y1="${ty}" y2="${ty}" stroke="#111827" stroke-width="2"/>`;
  for (let y = new Date(t0).getUTCFullYear(); y <= new Date(t1).getUTCFullYear() + 1; y++) for (let qd = 0; qd < 4; qd++) { const d = Date.UTC(y, qd * 3, 1); if (d > t0 && d < t1) g += `<line x1="${X(d)}" x2="${X(d)}" y1="${ty - 4}" y2="${ty + 4}" stroke="#111827"/>`; }
  ev.forEach(e => { const y = e.fut ? ty + 30 + e.li * lh : ty - 28 - e.li * lh, c = e.fut ? "#2457D6" : "#42526E", tx = e.end ? e.x - 7 : e.x + 7, an = e.end ? "end" : "start";
    g += `<line x1="${e.x}" x2="${e.x}" y1="${ty}" y2="${e.fut ? y + 18 : y - 12}" stroke="${c}"/><circle cx="${e.x}" cy="${ty}" r="${e.fut ? 7 : 5}" fill="${e.fut ? "#2457D6" : "#94A3B8"}" stroke="#F8FAFC" stroke-width="2"/><g data-tip="${esc(`<b>${esc(e.when)}</b><br>${esc(e.l)}`)}"><text x="${tx}" y="${y}" font-size="13" fill="${c}" font-weight="600" text-anchor="${an}">${esc(e.when)}</text><text x="${tx}" y="${y + 16}" font-size="14" text-anchor="${an}" ${e.fut ? 'font-weight="600"' : ""}>${esc(e.short)}</text></g>`; });
  g += `<line x1="${X(now)}" x2="${X(now)}" y1="${ty - 18}" y2="${ty + 18}" stroke="#111827" stroke-width="2"/><rect x="${X(now) - 26}" y="${ty - 9}" width="52" height="18" rx="4" fill="#111827"/><text x="${X(now)}" y="${ty + 4}" font-size="12" font-weight="600" text-anchor="middle" style="fill:#F8FAFC">Today</text>`;
  return `<div class="scroll"><svg class="fig" style="min-width:900px" viewBox="0 0 ${W} ${ty + dn * lh + 26}" role="img" aria-label="Catalyst timeline">${g}</svg></div>`;
}

/* ---------- pipeline phase strip ---------- */
const STAGES = ["Preclinical", "Phase 1", "Phase 2", "Phase 3", "Filed", "Marketed", "Stopped"];
function stageOf(s) { s = String(s || ""); if (/discontinu|terminat|fail|missed|stopped/i.test(s)) return "Stopped"; if (/filed|under (fda|priority) review|nda under/i.test(s)) return "Filed"; if (/^(marketed|approved)/i.test(s)) return "Marketed"; if (/phase 3|phase 2\/3|pivotal|registrational/i.test(s)) return "Phase 3"; if (/phase 2/i.test(s)) return "Phase 2"; if (/phase 1|early clinical|n-of-1/i.test(s)) return "Phase 1"; if (/preclin/i.test(s)) return "Preclinical"; return null; }
function phaseStrip(pipe, subjects) {
  const by = {}; STAGES.forEach(s => by[s] = []); let un = 0; pipe.forEach((p, i) => { const s = stageOf(p.phase || p.status); if (s) by[s].push([p, i]); else un++; });
  window._pipe = i => { const p = pipe[i]; drawer(`<h2>${esc(p.asset)}</h2><dl class="kv">${Object.entries(p).filter(([k, v]) => !["sources", "asset"].includes(k) && v).map(([k, v]) => `<dt>${esc(k.replace(/_/g, " "))}</dt><dd>${k === "confidence" ? conf(v) : esc(v)}</dd>`).join("")}</dl><div>${srcLinks(p.sources)}</div>`); };
  return `<div class="scroll"><div style="display:grid;grid-template-columns:repeat(${STAGES.length},minmax(138px,1fr));gap:0;min-width:980px;border-top:2px solid var(--ink)">${STAGES.map(s => `<div style="padding:10px 10px 4px;border-right:1px solid var(--line)"><div style="font-family:var(--f-head);font-weight:600;font-size:15px;color:${s === "Stopped" ? "var(--crit)" : "var(--ink)"}">${s === "Stopped" ? "⚠ " : ""}${s} <span class="sub">${by[s].length}</span></div>${by[s].map(([p, i]) => { const sub = subjects.some(k => p.asset.toLowerCase().includes(k)), nm = p.asset.replace(/\s*\(.*$/, "").replace(/\s*[-–]\s.*$/, "").slice(0, 26); return `<button class="linkbtn" style="display:flex;gap:7px;align-items:center;text-decoration:none;color:var(--ink);text-align:left;min-height:32px;padding:3px 0;font-size:14px;${sub ? "font-weight:600;color:var(--accent)" : ""}" onclick="_pipe(${i})"><i style="flex:none;width:10px;height:10px;border-radius:50%;${s === "Stopped" ? "border:2px solid var(--crit)" : "background:" + (sub ? "var(--accent)" : "var(--ink)")}"></i>${esc(nm)}</button>`; }).join("")}</div>`).join("")}</div></div>${un ? `<p class="note">${un} program${un > 1 ? "s" : ""} with no stated stage ${un > 1 ? "are" : "is"} listed in Competitive landscape.</p>` : ""}`;
}

/* ---------- journey swimlane ---------- */
const JOURNEY = {
  dee: { lanes: ["Family", "Emergency and NICU", "Child neurology", "Genetics", "Epilepsy center", "Adult care"], at: [1, 2, 3, 4, 4, 0, 4, 5], delay: { 1: "≈5 weeks by rapid genome; weeks to months by routine panel" }, fork: [4, "Gain of function: blockers · Loss of function: avoid them"] },
  et: { lanes: ["Patient", "Primary care", "Neurology", "Movement specialist", "Device and surgery"], at: [0, 0, 1, 2, 0, 3, 4, 4, 1], delay: { 2: "≈50 days' wait for a new neurology visit" }, fork: [4, "Up to 47% stop first-line therapy within two years"] }
};
function journeyFig(ta) {
  const pj = R[ta].patient_journey || [], cfg = JOURNEY[ta], n = pj.length, W = 1100, lw = 168, cw = (W - lw - 20) / n, top = 64, rh = 50, X = i => lw + cw * (i + .5), Y = i => top + rh * (cfg.at[i] + .5), nm = s => { const t = String(s.stage).replace(/^\d+\.\s*/, "").replace(/^Cross-cutting:\s*/, ""); return t.charAt(0).toUpperCase() + t.slice(1); };
  const svg = sel => { let g = ""; cfg.lanes.forEach((l, i) => g += `<rect x="0" y="${top + i * rh}" width="${W}" height="${rh}" fill="${i % 2 ? "#F8FAFC" : "#F1F3F6"}"/><text x="12" y="${top + i * rh + rh / 2 + 5}" font-size="14" fill="#42526E" font-weight="600">${l}</text>`);
    for (let i = 0; i < n - 1; i++) { const d = cfg.delay[i]; g += `<path d="M${X(i)} ${Y(i)} C${X(i) + cw / 2} ${Y(i)} ${X(i + 1) - cw / 2} ${Y(i + 1)} ${X(i + 1)} ${Y(i + 1)}" fill="none" stroke="#111827" stroke-width="${d ? 2 : 3}" ${d ? 'stroke-dasharray="3 6"' : ""}/>`; if (d) g += `<text x="${(X(i) + X(i + 1)) / 2}" y="${top + cfg.lanes.length * rh + 20}" font-size="14" text-anchor="middle" fill="#111827">⏱ ${esc(d)}</text><line x1="${(X(i) + X(i + 1)) / 2}" x2="${(X(i) + X(i + 1)) / 2}" y1="${(Y(i) + Y(i + 1)) / 2 + 6}" y2="${top + cfg.lanes.length * rh + 6}" stroke="#42526E"/>`; }
    pj.forEach((s, i) => { const on = i === sel, pc = (s.pain_points || []).length; g += `<g class="hit" role="button" tabindex="0" data-i="${i}" onkeydown="${onKey}" aria-label="Stage ${i + 1}: ${esc(nm(s))}"><rect x="${X(i) - cw / 2}" y="0" width="${cw}" height="${top + cfg.lanes.length * rh}" fill="transparent"/><text font-size="13.5" ${on ? 'font-weight="600" fill="#2457D6"' : ""} text-anchor="middle" y="16">${tspans(nm(s), Math.max(12, Math.floor(cw / 7.6)), X(i), 15)}</text><circle cx="${X(i)}" cy="${Y(i)}" r="${on ? 16 : 13}" fill="${on ? "#2457D6" : "#F8FAFC"}" stroke="${on ? "#2457D6" : "#111827"}" stroke-width="2"/><text x="${X(i)}" y="${Y(i) + 5}" font-size="14" font-weight="600" text-anchor="middle" fill="${on ? "#F8FAFC" : "#111827"}">${i + 1}</text>${pc ? `<text x="${X(i) + 20}" y="${Y(i) - 10}" font-size="13" fill="#B4233C" font-weight="600">⚠${pc}</text>` : ""}</g>`; });
    return `<svg class="fig" style="min-width:920px" viewBox="0 0 ${W} ${top + cfg.lanes.length * rh + 30}" role="img" aria-label="Patient journey across care settings">${g}</svg>`; };
  setTimeout(() => { const draw = i => { const s = pj[i]; $("#jrFig").innerHTML = svg(i); $$("#jrFig [data-i]").forEach(e => e.onclick = () => draw(+e.dataset.i));
      const dur = s.typical_duration && !/^not available/i.test(s.typical_duration) ? s.typical_duration : "Duration not available", sent = String(s.description).split(/(?<=\.)\s+/).slice(0, 2).join(" ");
      $("#jrSide").innerHTML = `<div class="fig2"><div class="side"><h3>${i + 1}. ${esc(nm(s))}</h3><p>${esc(sent)}</p><span class="pill">⏱ ${esc(dur.length > 90 ? dur.slice(0, 89) + "…" : dur)}</span>${cfg.fork[0] === i ? `<span class="status info">${esc(cfg.fork[1])}</span>` : ""}</div><div class="side"><h4 style="color:var(--crit)">⚠ Where patients get stuck</h4><ul class="tight">${(s.pain_points || []).slice(0, 4).map(p => `<li>${esc(String(p).replace(/^./, x => x.toUpperCase()))}</li>`).join("")}</ul><div class="chips">${listify(s.stakeholders).slice(0, 5).map(x => `<span class="pill">${esc(x)}</span>`).join("")}</div><div>${srcLinks(s.sources)}</div></div></div>`; }; draw(ta === "dee" ? 2 : 4); }, 0);
  return `<div class="scroll" id="jrFig"></div><div id="jrSide"></div>`;
}

/* ---------- ET treatment ladder ---------- */
const LADDER = [["First line", "Propranolol, primidone", "Level A", [32, 76, 50], [40, 47], 0], ["Combination", "Propranolol + primidone", "Guideline-supported", null, null, 1], ["Second line", "Topiramate, gabapentin, others", "Level B", [30, 41], [26, 58], 2], ["Focal", "Botulinum toxin", "Possibly useful", "Measured on a different scale", null, 3], ["Device", "Wrist neurostimulation", "FDA-cleared", "Measured in ADL points", null, 4], ["Procedure", "Focused ultrasound, DBS", "Refractory tremor", [40, 62], "Irreversible or implanted", 5], ["Emerging", "T-type calcium channel blocker", "Investigational", "Measured in ADL points", [27, 28], 6]];
function ladderFig() {
  const tf = R.et.treatment_flow || [], W = 1100, rh = 54, x1 = 470, w1 = 300, x2 = 830, w2 = 240, X1 = v => x1 + v / 100 * w1, X2 = v => x2 + v / 100 * w2; let g = "";
  g += `<text x="0" y="16" font-size="13" font-weight="600" fill="#42526E">LINE OF THERAPY</text><text x="300" y="16" font-size="13" font-weight="600" fill="#42526E">EVIDENCE</text><text x="${x1}" y="16" font-size="13" font-weight="600" fill="#42526E">TREMOR REDUCTION, %</text><text x="${x2}" y="16" font-size="13" font-weight="600" fill="#B4233C">⚠ STOP TREATMENT, %</text>`;
  [0, 50, 100].forEach(t => g += `<text x="${X1(t)}" y="36" font-size="12.5" fill="#42526E" text-anchor="middle">${t}</text><line x1="${X1(t)}" x2="${X1(t)}" y1="42" y2="${42 + LADDER.length * rh}" stroke="rgba(17,24,39,.12)"/><text x="${X2(t)}" y="36" font-size="12.5" fill="#42526E" text-anchor="middle">${t}</text><line x1="${X2(t)}" x2="${X2(t)}" y1="42" y2="${42 + LADDER.length * rh}" stroke="rgba(17,24,39,.12)"/>`);
  LADDER.forEach(([l, o, ev, eff, stop, ti], i) => { const y = 42 + i * rh, cy = y + rh / 2, em = i === LADDER.length - 1;
    g += `<g class="hit" role="button" tabindex="0" data-l="${ti}" onkeydown="${onKey}" aria-label="${esc(l)}: details"><rect x="0" y="${y}" width="${W}" height="${rh}" fill="${i % 2 ? "transparent" : "#F1F3F6"}"/><text x="10" y="${cy - 3}" font-size="16" font-weight="600" fill="${em ? "#2457D6" : "#111827"}">${l}</text><text x="10" y="${cy + 16}" font-size="13.5" fill="#42526E">${esc(o)}</text><text x="300" y="${cy + 5}" font-size="14">${esc(ev)}</text>` +
      (Array.isArray(eff) ? `<line x1="${X1(eff[0])}" x2="${X1(eff[1])}" y1="${cy}" y2="${cy}" stroke="#111827" stroke-width="6" stroke-linecap="round"/>${eff[2] ? `<circle cx="${X1(eff[2])}" cy="${cy}" r="7" fill="#F8FAFC" stroke="#111827" stroke-width="2.5"/>` : ""}<text x="${X1(eff[1]) + 12}" y="${cy + 5}" font-size="14" font-weight="600">${eff[0]}–${eff[1]}</text>` : `<text x="${x1}" y="${cy + 5}" font-size="13.5" fill="#42526E">${esc(eff || "Not available")}</text>`) +
      (Array.isArray(stop) ? `<line x1="${X2(stop[0])}" x2="${X2(stop[1])}" y1="${cy}" y2="${cy}" stroke="#B4233C" stroke-width="6" stroke-linecap="round"/><text x="${X2(stop[1]) + 12}" y="${cy + 5}" font-size="14" font-weight="600" fill="#B4233C">${stop[0]}–${stop[1]}</text>` : `<text x="${x2}" y="${cy + 5}" font-size="13.5" fill="#42526E">${esc(stop || "Not available")}</text>`) + `</g>`; });
  setTimeout(() => $$("#ldFig [data-l]").forEach(e => e.onclick = () => { const l = tf[+e.dataset.l]; if (!l) return; drawer(`<span class="eyebrow">${esc(l.line)}</span><h2>${esc(listify(l.options)[0])}</h2>${ul(l.options)}<dl class="kv"><dt>Evidence</dt><dd>${esc(l.evidence_level)}</dd><dt>Efficacy</dt><dd>${esc(l.efficacy)}</dd><dt>Limits</dt><dd>${esc(l.limitations)}</dd></dl><div>${srcLinks(l.sources)}</div>`); }), 0);
  return `<div class="scroll" id="ldFig"><svg class="fig" style="min-width:940px" viewBox="0 0 ${W} ${48 + LADDER.length * rh}" role="img" aria-label="Treatment ladder: evidence, tremor reduction and discontinuation by line of therapy">${g}</svg></div>`;
}

/* ---------- DEE: genotype decides the drug ---------- */
const GENO = [["SCN2A · gain of function", "ok", "None", "Persistent-current modulator (under review); antisense (pivotal)", "SCN2A_DEE_GoF_early_onset", 1], ["SCN2A · loss of function", "no", "None", "None in the clinic", "SCN2A_LoF_late_onset", 1], ["SCN8A · gain of function", "ok", "None", "Persistent-current modulator (under review)", "SCN8A_DEE_GoF", 1], ["SCN8A · loss of function", "no", "None", "None in the clinic", "SCN8A_LoF_NDD_with_generalized_epilepsy", 1], ["Dravet syndrome", "no", "Fenfluramine, cannabidiol, stiripentol", "Antisense, gene therapy, serotonin agonist", "Dravet", 0], ["Lennox-Gastaut syndrome", "var", "Cannabidiol, fenfluramine, clobazam, rufinamide", "Serotonin agonist (Phase 3)", "LGS", 0], ["CDKL5 deficiency", "var", "Ganaxolone", "Fenfluramine (filed)", "CDKL5", 0]];
function genoFig() {
  const tf = R.dee.treatment_flow || {}, chip = k => k === "ok" ? `<span class="pill good">✓ First-line</span>` : k === "no" ? `<span class="pill crit">⚠ Avoid</span>` : `<span class="pill">Variable</span>`;
  window._geno = i => { const g = GENO[i], f = tf[g[4]]; if (!f) return; drawer(`<h2>${esc(g[0])}</h2><div class="lines">${Object.entries(f).filter(([k, v]) => !["sources", "confidence", "notes", "verification"].includes(k) && v && (!Array.isArray(v) || v.length)).map(([k, v]) => `<div class="lot"><div class="ll">${esc(k.replace(/_/g, " "))}</div><div>${Array.isArray(v) ? ul(v) : esc(v)}</div></div>`).join("")}</div>${f.notes ? `<p class="callout">${esc(f.notes)}</p>` : ""}<div>${conf(f.confidence)} ${srcLinks(f.sources)}</div>`); };
  const cell = "padding:12px;border-top:1px solid var(--line);font-size:15px";
  return `<div class="scroll"><div style="display:grid;grid-template-columns:minmax(200px,1.1fr) 150px minmax(200px,1.3fr) minmax(220px,1.4fr);min-width:860px;border:1px solid var(--line);border-radius:12px;overflow:hidden">
    ${["Diagnosis", "Sodium-channel blockers", "Approved branded options", "Investigational"].map(h => `<div style="padding:10px 12px;background:var(--surface-2);font-size:13px;font-weight:600;color:var(--ink-2);text-transform:uppercase;letter-spacing:.06em">${h}</div>`).join("")}
    ${GENO.map((g, i) => `<button onclick="_geno(${i})" style="${cell};font:inherit;font-size:15px;font-weight:600;text-align:left;background:none;border:0;border-top:1px solid var(--line);cursor:pointer;color:${g[5] ? "var(--accent)" : "var(--ink)"}">${esc(g[0])}</button><div style="${cell}">${chip(g[1])}</div><div style="${cell};${g[2] === "None" ? "color:var(--ink-2)" : ""}">${esc(g[2])}</div><div style="${cell}">${esc(g[3])}</div>`).join("")}</div></div>`;
}

/* ---------- tension cards ---------- */
function tensionCards(ta) {
  const un = R[ta].unmet_needs || [], t = un.map(u => u.controversy ? [u.controversy, u.detail, u.sources] : /^Controversy/i.test(u.insight || "") ? [u.insight.replace(/^Controversy\s*-\s*/i, "").split(":")[0], u.insight.split(":").slice(1).join(":").trim(), u.sources] : null).filter(Boolean).slice(0, 6);
  return `<div class="tiles" style="grid-template-columns:repeat(auto-fit,minmax(280px,1fr))">${t.map(([h, d, s]) => `<div class="tension"><h3>${esc(h.charAt(0).toUpperCase() + h.slice(1))}</h3><p>${esc((d.length > 210 ? d.slice(0, 209) + "…" : d).replace(/^./, x => x.toUpperCase()))}</p><div>${srcLinks((s || []).slice(0, 2))}</div></div>`).join("")}</div>`;
}
