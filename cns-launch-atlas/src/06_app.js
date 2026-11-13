/* ---------- router ---------- */
const VIEWS = { overview: viewOverview, learn: viewLearn, journey: viewJourney, landscape: viewLandscape, trials: viewTrials, geography: viewGeography, access: viewAccess, people: viewPeople, simulator: viewSimulator, sources: viewSources };
function render() {
  const h = (location.hash || "").replace(/^#/, ""); state.tab = VIEWS[h] ? h : "overview";
  $("#taSwitch").innerHTML = Object.values(TA).map(t => `<button role="tab" aria-selected="${t.key === state.ta}" data-ta="${t.key}">${esc(t.short)}</button>`).join("");
  $$("#taSwitch button").forEach(b => b.onclick = () => { state.ta = b.dataset.ta; store.set("ta", state.ta); geoState.sel = null; render(); });
  $("#tabs").innerHTML = TABS.map(([k, l]) => `<a href="#${k}" ${k === state.tab ? 'aria-current="page"' : ""}>${esc(l)}</a>`).join("");
  $("#brandSub").textContent = cur().name;
  for (const k in TABLES) delete TABLES[k];
  try { $("#main").innerHTML = VIEWS[state.tab](); } catch (e) { $("#main").innerHTML = `<div class="callout">This section could not be drawn: ${esc(e.message)}</div>`; console.error(e); }
  setTimeout(() => $$(".scroll").forEach(e => e.classList.toggle("is-wide", e.scrollWidth > e.clientWidth + 4)), 80);
  const a = $("#tabs a[aria-current]"); if (a && a.scrollIntoView) a.scrollIntoView({ block: "nearest", inline: "nearest" });
}
window.addEventListener("hashchange", () => { render(); window.scrollTo(0, 0); });
$("#builtOn").textContent = D.built;
render();
