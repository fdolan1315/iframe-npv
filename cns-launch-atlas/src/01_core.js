"use strict";
const D = JSON.parse(document.getElementById("bundle").textContent);
/* "Today" is the viewer's date; the data itself is dated D.built */
const NOW = Date.now(), fmtDay = t => { const d = new Date(t); return `${d.getUTCDate()} ${"Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec".split(" ")[d.getUTCMonth()]} ${d.getUTCFullYear()}`; }, BUILT = fmtDay(Date.parse(D.built));
const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const N = (v, d = 0) => (v == null || isNaN(v)) ? "—" : Number(v).toLocaleString("en-US", { maximumFractionDigits: d, minimumFractionDigits: d });
const K = v => v == null || isNaN(v) ? "—" : Math.abs(v) >= 1e9 ? (v / 1e9).toFixed(Math.abs(v) >= 1e10 ? 1 : 2) + "B" : Math.abs(v) >= 1e6 ? (v / 1e6).toFixed(Math.abs(v) >= 1e8 ? 0 : 1) + "M" : Math.abs(v) >= 1e4 ? (v / 1e3).toFixed(0) + "K" : Math.abs(v) >= 1e3 ? (v / 1e3).toFixed(1) + "K" : N(v);
const USD = v => v == null || isNaN(v) ? "—" : "$" + K(v);
const PCT = (v, d = 0) => v == null || isNaN(v) ? "—" : (v * 100).toFixed(d) + "%";
const store = { get(k, d) { try { const v = localStorage.getItem("atlas." + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } }, set(k, v) { try { localStorage.setItem("atlas." + k, JSON.stringify(v)); } catch (e) { } } };
const host = u => { try { return new URL(u).hostname.replace(/^www\./, ""); } catch (e) { return "source"; } };
const srcLink = u => u && /^https?:/.test(u) ? `<a class="src" href="${esc(u)}" target="_blank" rel="noopener">${esc(host(u))}</a>` : "";
const srcLinks = a => (a || []).slice(0, 4).map(srcLink).join(" ");
const conf = c => { if (!c) return ""; const k = String(c).toLowerCase().split(/[^a-z]/)[0]; return ["high", "medium", "low"].includes(k) ? `<span class="pill conf ${k}" title="Research confidence: ${k}"><i></i>${k}</span>` : ""; };
/* figure = finding headline + deck + drawing + visible provenance line */
const prov = (srcs, o = {}) => `<div class="prov">${o.note ? `<span>${esc(o.note)}</span>` : ""}${o.conf ? conf(o.conf) : ""}${o.quality ? `<span class="pill">${esc(o.quality)}</span>` : ""}${(srcs || []).slice(0, 5).map(srcLink).join(" ")}${o.asOf ? `<span>As of ${esc(o.asOf)}</span>` : ""}</div>`;
let _exN = 0;
const exh = meta => `<header class="exh"><span class="exh-n">Exhibit ${++_exN}</span><span class="exh-t">${esc(meta)}</span></header>`;
const figure = (meta, title, deck, body, pv) => `<section class="figure">${exh(meta)}<h2>${esc(title)}</h2>${deck ? `<p class="deck">${esc(deck)}</p>` : ""}<div class="body">${body}</div>${pv || ""}</section>`;
const listify = v => Array.isArray(v) ? v : v == null || v === "" ? [] : [v];
const ul = a => { a = listify(a); return a.length ? `<ul class="tight">${a.map(x => `<li>${esc(typeof x === "string" ? x : (x.fact ? x.fact + (x.value ? ": " + x.value : "") : JSON.stringify(x)))}</li>`).join("")}</ul>` : ""; };

/* ---------- tooltip ---------- */
const tipEl = $("#tip");
function tipShow(html, e) { tipEl.innerHTML = html; tipEl.hidden = false; const w = tipEl.offsetWidth, hgt = tipEl.offsetHeight; let x = e.clientX + 14, y = e.clientY + 14; if (x + w > innerWidth - 8) x = e.clientX - w - 14; if (y + hgt > innerHeight - 8) y = e.clientY - hgt - 14; tipEl.style.left = Math.max(4, x) + "px"; tipEl.style.top = Math.max(4, y) + "px"; }
function tipHide() { tipEl.hidden = true; }
document.addEventListener("mousemove", e => { const t = e.target.closest && e.target.closest("[data-tip]"); if (t) tipShow(t.getAttribute("data-tip"), e); else if (!tipEl.hidden) tipHide(); });
document.addEventListener("touchstart", e => { const t = e.target.closest && e.target.closest("[data-tip]"); if (t) { const p = e.touches[0]; tipShow(t.getAttribute("data-tip"), p); } else tipHide(); }, { passive: true });

/* ---------- drawer ---------- */
function drawer(html) { $("#drawerBody").innerHTML = html; $("#drawer").hidden = false; $("#drawerX").focus(); }
function drawerClose() { $("#drawer").hidden = true; }
$("#drawerX").onclick = drawerClose; $("#drawer").addEventListener("click", e => { if (e.target.id === "drawer") drawerClose(); });
document.addEventListener("keydown", e => { if (e.key === "Escape") drawerClose(); });

/* ---------- charts (inline SVG, one scale per chart, tooltips on every mark) ---------- */
const SER1 = ["var(--s0)"], SER = ["var(--s1)", "var(--s2)", "var(--s3)", "var(--s4)", "var(--s5)", "var(--s6)", "var(--s7)", "var(--s8)"];
function niceMax(v) { if (!(v > 0)) return 1; const p = Math.pow(10, Math.floor(Math.log10(v))); const m = v / p; return (m <= 1 ? 1 : m <= 2 ? 2 : m <= 2.5 ? 2.5 : m <= 5 ? 5 : 10) * p; }
/* horizontal bars: rows [{label, value, tip?, color?}] */
function hbar(rows, o = {}) {
  const fmt = o.fmt || K, lw = o.labelW || 150, rh = o.rowH || 22, W = o.W || 560, vw = 62, max = niceMax(Math.max(...rows.map(r => r.value), 0)), pw = W - lw - vw;
  const H = rows.length * rh + 4;
  return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(o.title || "bar chart")}">` + rows.map((r, i) => {
    const y = i * rh + 3, w = Math.max(1, r.value / max * pw);
    return `<g data-tip="${esc(r.tip || `<b>${esc(r.label)}</b><br>${fmt(r.value)}`)}"><rect x="0" y="${y - 2}" width="${W}" height="${rh}" fill="transparent"/><text class="lbl" x="${lw - 8}" y="${y + rh / 2 + 1}" text-anchor="end">${esc(String(r.label).length > lw / 7.4 ? String(r.label).slice(0, Math.floor(lw / 7.4) - 1) + "…" : r.label)}</text><path d="M${lw} ${y}h${w - 3}a3 3 0 0 1 3 3v${rh - 12}a3 3 0 0 1 -3 3h${-(w - 3)}z" fill="${r.color || o.color || "var(--s0)"}"/><text class="val" x="${lw + w + 6}" y="${y + rh / 2 + 1}">${fmt(r.value)}</text></g>`;
  }).join("") + `</svg>`;
}
/* line / column chart over ordered x categories: series [{name, values:[...], color?}] */
function xyChart(xs, series, o = {}) {
  const W = 620, H = o.h || 240, m = { l: 48, r: 14, t: 10, b: 26 }, pw = W - m.l - m.r, ph = H - m.t - m.b, fmt = o.fmt || K;
  const max = niceMax(Math.max(o.max || 0, ...series.flatMap(s => s.values.filter(v => v != null))));
  const X = i => m.l + (xs.length === 1 ? pw / 2 : (o.bars ? (i + .5) * pw / xs.length : i * pw / (xs.length - 1))), Y = v => m.t + ph - v / max * ph;
  let g = "";
  for (let t = 0; t <= 4; t++) { const v = max * t / 4, y = Y(v); g += `<line class="${t ? "grid" : "axis"}" x1="${m.l}" x2="${W - m.r}" y1="${y}" y2="${y}"/><text x="${m.l - 6}" y="${y + 3.5}" text-anchor="end">${fmt(v)}</text>`; }
  const step = Math.ceil(xs.length / 11);
  xs.forEach((x, i) => { if (i % step === 0) g += `<text x="${X(i)}" y="${H - 8}" text-anchor="middle">${esc(x)}</text>`; });
  (o.refs || []).forEach(r => { const y = Y(r.value); if (r.value <= max) g += `<line x1="${m.l}" x2="${W - m.r}" y1="${y}" y2="${y}" stroke="var(--ref)" stroke-dasharray="4 3"/><text x="${W - m.r}" y="${y - 4}" text-anchor="end">${esc(r.label)}</text>`; });
  if (series.length === 1 && !series[0].color) series = [Object.assign({}, series[0], { color: "var(--s0)" })];
  if (o.bars) {
    const bw = pw / xs.length, n = series.length, w = Math.min(34, (bw - 6) / n);
    series.forEach((s, si) => s.values.forEach((v, i) => { if (v == null) return; const x = X(i) - n * w / 2 + si * w, y = Y(v), hh = m.t + ph - y; g += `<path data-tip="${esc(`<b>${esc(xs[i])}</b> · ${esc(s.name)}<br>${fmt(v)}`)}" d="M${x + 1} ${m.t + ph}v${-Math.max(0, hh - 3)}a3 3 0 0 1 3 -3h${Math.max(0, w - 8)}a3 3 0 0 1 3 3v${Math.max(0, hh - 3)}z" fill="${s.color || SER[si]}"/>`; }));
  } else {
    series.forEach((s, si) => {
      const pts = s.values.map((v, i) => v == null ? null : [X(i), Y(v)]).filter(Boolean); if (!pts.length) return;
      g += `<path d="M${pts.map(p => p.join(" ")).join("L")}" fill="none" stroke="${s.color || SER[si]}" stroke-width="2" stroke-linejoin="round" ${s.dash ? 'stroke-dasharray="5 4"' : ""}/>`;
      s.values.forEach((v, i) => { if (v != null) g += `<circle data-tip="${esc(`<b>${esc(xs[i])}</b> · ${esc(s.name)}<br>${fmt(v)}`)}" cx="${X(i)}" cy="${Y(v)}" r="${xs.length > 20 ? 2.5 : 4}" fill="${s.color || SER[si]}" stroke="var(--surface)" stroke-width="2"/>`; });
    });
  }
  const leg = series.length > 1 ? `<div class="legend">${series.map((s, si) => `<span><i style="background:${s.color || SER[si]}"></i>${esc(s.name)}</span>`).join("")}</div>` : "";
  return leg + `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(o.title || "chart")}">${g}</svg>`;
}
/* choropleth: values {ST: number}; quantile bins on a single-hue ramp */
function usMap(values, o = {}) {
  const vals = Object.values(values).filter(v => v > 0).sort((a, b) => a - b), q = p => vals.length ? vals[Math.min(vals.length - 1, Math.floor(p * vals.length))] : 0;
  const cuts = [q(.2), q(.4), q(.6), q(.8), q(.93)], fmt = o.fmt || K;
  const bin = v => !(v > 0) ? 0 : 1 + cuts.filter(c => v > c).length;
  let g = "";
  for (const [st, s] of Object.entries(D.geo)) g += `<path class="st${o.sel === st ? " sel" : ""}" data-st="${st}" d="${s.d}" fill="var(--q${bin(values[st])})" data-tip="${esc(`<b>${esc(D.states[st].name)}</b><br>${esc(o.label || "")}: ${fmt(values[st])}${o.extra ? "<br>" + o.extra(st) : ""}`)}"/>`;
  (o.dots || []).forEach(d => { if (d.x != null) g += `<circle class="dot" cx="${d.x}" cy="${d.y}" r="${d.r || 3}"/>`; });
  const scale = `<div class="scale"><span>lower</span>${[1, 2, 3, 4, 5, 6].map(i => `<i style="background:var(--q${i})"></i>`).join("")}<span>higher</span><span style="margin-left:10px"><i style="background:var(--q0);border:1px solid var(--line-2)"></i> zero or not available</span>${o.dots ? `<span style="margin-left:10px"><svg width="10" height="10"><circle cx="5" cy="5" r="4" fill="var(--ink)"/></svg> ${esc(o.dotLabel || "sites")}</span>` : ""}</div>`;
  return `<svg class="chart map" viewBox="0 0 975 610" role="img" aria-label="US map: ${esc(o.label || "")}">${g}</svg>${scale}`;
}
/* Albers USA projection matching us-atlas "states-albers-10m" (scale 1300, translate 487.5,305) for lat/lon dots */
const proj = (() => {
  const rad = Math.PI / 180;
  const mk = (p1, p2, rot, cLon, cLat) => { const s1 = Math.sin(p1 * rad), n = (s1 + Math.sin(p2 * rad)) / 2, C = 1 + s1 * (2 * n - s1), r0 = Math.sqrt(C) / n;
    const raw = (l, p) => { const r = Math.sqrt(C - 2 * n * Math.sin(p * rad)) / n, th = n * l * rad; return [r * Math.sin(th), r0 - r * Math.cos(th)]; }, c = raw(cLon, cLat);
    return (lon, lat) => { const q = raw(lon + rot, lat); return [q[0] - c[0], -(q[1] - c[1])]; }; };
  const lower = mk(29.5, 45.5, 96, -0.6, 38.7), ak = mk(55, 65, 154, -2, 58.5), hi = mk(8, 18, 157, -3, 19.9), k = 1300;
  return (lon, lat) => { if (lon == null || lat == null) return [null, null];
    if (lat > 50 && lon < -125) { const [x, y] = ak(lon, lat); return [487.5 - .307 * k + .35 * k * x, 305 + .201 * k + .35 * k * y]; }
    if (lat < 25 && lon < -150) { const [x, y] = hi(lon, lat); return [487.5 - .205 * k + k * x, 305 + .212 * k + k * y]; }
    const [x, y] = lower(lon, lat); return [487.5 + k * x, 305 + k * y]; };
})();

/* ---------- data table ---------- */
let _tid = 0; const TABLES = {};
function dataTable(o) {
  const id = "t" + (++_tid); TABLES[id] = Object.assign({ page: 0, pageSize: 25, sort: null, dir: -1, q: "", filters: {} }, o, { id });
  setTimeout(() => drawTable(id), 0);
  return `<div class="dt" id="${id}"></div>`;
}
function drawTable(id) {
  const t = TABLES[id], el = document.getElementById(id); if (!el) return;
  let rows = t.rows;
  if (t.q) { const q = t.q.toLowerCase(); rows = rows.filter(r => t.searchText(r).toLowerCase().includes(q)); }
  for (const f of (t.selects || [])) { const v = t.filters[f.key]; if (v) rows = rows.filter(r => f.test(r, v)); }
  if (t.sort != null) { const c = t.cols[t.sort]; rows = [...rows].sort((a, b) => { const x = c.val(a), y = c.val(b); return (x == null) - (y == null) || (typeof x === "number" && typeof y === "number" ? (x - y) : String(x).localeCompare(String(y))) * t.dir; }); }
  const pages = Math.max(1, Math.ceil(rows.length / t.pageSize)); t.page = Math.min(t.page, pages - 1);
  const pg = rows.slice(t.page * t.pageSize, (t.page + 1) * t.pageSize); t._pg = pg;
  const active = document.activeElement && document.activeElement.dataset && document.activeElement.dataset.role === "q" && el.contains(document.activeElement);
  el.innerHTML = `<div class="tbar">${t.searchText ? `<input type="search" data-role="q" id="${id}q" placeholder="${esc(t.placeholder || "Search")}" value="${esc(t.q)}" aria-label="Search table">` : ""}${(t.selects || []).map(f => `<select data-f="${f.key}" id="${id}f${f.key}" aria-label="${esc(f.label)}"><option value="">${esc(f.label)}: all</option>${f.options.map(op => `<option ${t.filters[f.key] === op ? "selected" : ""}>${esc(op)}</option>`).join("")}</select>`).join("")}<span class="sub">${N(rows.length)} of ${N(t.rows.length)}</span></div>
  <div class="tblwrap" style="margin-top:8px"><table><thead><tr>${t.cols.map((c, i) => `<th class="${c.num ? "n " : ""}${c.val ? "sortable" : ""}" data-i="${i}" ${c.tip ? `data-tip="${esc(c.tip)}"` : ""}>${esc(c.h)}${t.sort === i ? ` <span class="ar">${t.dir < 0 ? "↓" : "↑"}</span>` : ""}</th>`).join("")}</tr></thead>
  <tbody>${pg.map((r, i) => `<tr class="${t.onRow ? "click" : ""}" data-r="${i}" ${t.onRow ? 'tabindex="0"' : ""}>${t.cols.map(c => `<td class="${c.num ? "n" : ""}">${c.cell ? c.cell(r) : esc(c.val(r))}</td>`).join("")}</tr>`).join("") || `<tr><td colspan="${t.cols.length}" class="sub">No rows match.</td></tr>`}</tbody></table></div>
  ${pages > 1 ? `<div class="pager" style="margin-top:8px"><button class="btn" data-p="-1" ${t.page === 0 ? "disabled" : ""}>Prev</button><span>Page ${t.page + 1} / ${pages}</span><button class="btn" data-p="1" ${t.page >= pages - 1 ? "disabled" : ""}>Next</button></div>` : ""}`;
  const q = el.querySelector("[data-role=q]"); if (q) { q.oninput = () => { t.q = q.value; t.page = 0; drawTable(id); }; if (active) { q.focus(); q.setSelectionRange(q.value.length, q.value.length); } }
  el.querySelectorAll("select[data-f]").forEach(s => s.onchange = () => { t.filters[s.dataset.f] = s.value; t.page = 0; drawTable(id); });
  el.querySelectorAll("th.sortable").forEach(th => th.onclick = () => { const i = +th.dataset.i; if (t.sort === i) t.dir *= -1; else { t.sort = i; t.dir = t.cols[i].num ? -1 : 1; } drawTable(id); });
  el.querySelectorAll("[data-p]").forEach(b => b.onclick = () => { t.page += +b.dataset.p; drawTable(id); });
  if (t.onRow) el.querySelectorAll("tr.click").forEach(tr => { const go = () => t.onRow(t._pg[+tr.dataset.r]); tr.onclick = go; tr.onkeydown = e => { if (e.key === "Enter") go(); }; });
}
const uniq = a => [...new Set(a.filter(x => x != null && x !== ""))].sort();

/* ---------- generic renderers for research facts ---------- */
function factList(items, o = {}) {
  return `<div class="facts">${(items || []).map(f => {
    const title = f.topic && f.fact ? f.fact : (f.fact || f.metric || f.topic || f.insight || f.need || "");
    const val = f.value != null ? f.value : (f.detail || "");
    const extra = [f.range && !/^not found/i.test(f.range) ? "Range: " + f.range : "", f.note || "", f.controversy ? "Debate: " + f.controversy : ""].filter(Boolean).join(" · ");
    return `<div class="fact"><div class="ft">${o.pre && f[o.pre] ? `<span class="eyebrow">${esc(f[o.pre])}</span><br>` : ""}${esc(title)}</div><div class="fm">${conf(f.confidence)}${srcLink(f.source_url || (f.sources || [])[0])}</div>${val ? `<div class="fv">${esc(val)}</div>` : ""}${extra ? `<div class="fv sub">${esc(extra)}</div>` : ""}</div>`;
  }).join("")}</div>`;
}
/* media published beside the page */
const photo = (name, alt, o = {}) => `<figure class="photo" style="${o.style || ""}"><img src="media/${name}.jpg" alt="${esc(alt)}" loading="lazy"><figcaption>Illustrative image</figcaption></figure>`;
const filmBlock = (name, label) => { const caps = (D.media || {})[name] || []; return `<div class="film"><video controls preload="none" playsinline poster="media/${name}.png" aria-label="${esc(label)}"><source src="media/${name}.mp4" type="video/mp4"></video><details class="acc"><summary><span>Read it instead: ${caps.length} captions</span></summary><div class="ab"><ol class="tight">${caps.map(c => `<li>${esc(c)}</li>`).join("")}</ol></div></details></div>`; };
const panel = (title, body, o = {}) => `<section class="panel ${o.cls || ""}"><header><h3>${esc(title)}</h3>${o.sub ? `<span class="sub">${o.sub}</span>` : ""}</header>${body}</section>`;
const kpi = (v, l, s) => `<div class="kpi"><b>${v}</b><span>${esc(l)}</span>${s ? `<small>${s}</small>` : ""}</div>`;
