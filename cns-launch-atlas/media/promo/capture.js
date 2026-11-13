/* Capture real screens from the built app for the overview video.
   Usage: node capture.js      Requires: playwright, ffmpeg.  Output: ./shots/*.jpg + shots/meta.json (git-ignored)
   Public-video rules applied here: no named clinicians, no revenue figures, no trial-efficacy figures. */
const { chromium } = require("playwright"), { execFileSync } = require("child_process"), path = require("path"), fs = require("fs");
const ROOT = path.resolve(__dirname, "../.."), OUT = path.join(__dirname, "shots");
fs.mkdirSync(OUT, { recursive: true });
const wrapped = path.join(OUT, "_app.html");
fs.writeFileSync(wrapped, '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><style>body{margin:0;font:14px system-ui}[hidden]{display:none!important}img{max-width:100%}</style></head><body>' +
  fs.readFileSync(path.join(ROOT, "dist/index.html"), "utf8").replace(/src="media\//g, 'src="' + path.join(ROOT, "dist/media") + "/") + "</body></html>");

(async () => {
  const b = await chromium.launch();
  const p = await (await b.newContext({ viewport: { width: 1000, height: 2400 }, deviceScaleFactor: 2 })).newPage();
  await p.goto("file://" + wrapped);
  await p.addStyleTag({ content: ".top{position:static!important} *{scroll-behavior:auto!important} .scroll.is-wide::before{display:none!important}" });
  const go = async (ta, tab) => { await p.click(`#taSwitch [data-ta=${ta}]`); await p.evaluate(h => { location.hash = h; }, tab); await p.waitForTimeout(700); };
  const fig = async title => { for (const f of await p.$$(".figure")) if ((await f.$eval(".exh-t", e => e.textContent).catch(() => "")) === title) return f; throw new Error("no figure " + title); };
  const shot = async (el, name) => { await el.scrollIntoViewIfNeeded(); await p.waitForTimeout(150); await el.screenshot({ path: path.join(OUT, name + ".jpg"), type: "jpeg", quality: 90 }); const bb = await el.boundingBox(); return [name, Math.round(bb.width), Math.round(bb.height)]; };
  const meta = { shots: {} }, keep = r => { meta.shots[r[0]] = { w: r[1], h: r[2] }; };

  // heroes (both markets)
  await go("dee", "overview"); keep(await shot(await p.$(".jhero"), "hero-dee"));
  keep(await shot(await fig("The opportunity"), "opp-dee"));
  await go("et", "overview"); keep(await shot(await p.$(".jhero"), "hero-et"));
  // learn
  await go("et", "learn"); keep(await shot(await fig("Impact"), "impact-et"));
  await go("dee", "learn"); keep(await shot(await fig("Mechanism"), "mech-dee"));
  // journey
  await go("dee", "journey"); keep(await shot(await fig("Patient journey"), "journey-dee"));
  // field and access
  await go("dee", "landscape"); keep(await shot(await fig("Money already spent"), "spend-dee"));
  await go("dee", "access"); keep(await shot(await fig("Time to coverage"), "clock-dee")); keep(await shot(await fig("Prior authorization"), "pa-dee"));
  // geography: one figure, several metrics
  await go("dee", "geography");
  meta.geo = [];
  for (const m of ["idx", "est", "epi", "mcd"]) {
    await p.selectOption("#geoMetric", m); await p.waitForTimeout(500);
    keep(await shot(await p.evaluateHandle(() => document.getElementById("geoMap").closest("section")), "geo-" + m)); meta.geo.push("geo-" + m);
  }
  // industry ties: aggregate chart only (no names)
  await go("dee", "people");
  const ties = await fig("Industry ties");
  keep(await shot(await ties.$(".fig2 > div:first-child"), "ties-dee"));
  meta.ties = await p.evaluate(() => { const rec = D.op.rec.dee, rows = D.hcp.dee.rows, top = rows.slice(0, 50).filter(r => rec[r[0]]).length; return { top50: top, pct: Math.round(100 * top / 50), n: Object.keys(rec).length, years: D.op.meta.years }; });
  // simulator: sliders and chart shape only; every number on the chart is hidden
  await go("dee", "simulator");
  await p.addStyleTag({ content: "#simChart text{visibility:hidden!important}" });
  const set = async (k, v) => p.evaluate(([k, v]) => { const e = document.getElementById("s_" + k); e.value = v; e.dispatchEvent(new Event("input", { bubbles: true })); }, [k, v]);
  const path_ = [...Array.from({ length: 12 }, (_, i) => ["adopt", 30 + i * 2]), ...Array.from({ length: 16 }, (_, i) => ["adopt", 52 - i * 2.5]), ...Array.from({ length: 8 }, (_, i) => ["accSS", 90 - i * 4]), ...Array.from({ length: 8 }, (_, i) => ["adopt", 14 + i * 3])];
  meta.sim = [];
  // show only the two control groups being moved
  await p.evaluate(() => document.querySelectorAll("#simCtl details").forEach(d => { d.open = /^(Access|Adoption)/.test(d.dataset.g); if (!d.open) d.style.display = "none"; }));
  for (let i = 0; i < path_.length; i++) {
    await set(path_[i][0], Math.round(path_[i][1])); await p.waitForTimeout(120);
    const n = "sim-" + String(i).padStart(2, "0");
    const ch = await p.$("#simChart svg"); await ch.scrollIntoViewIfNeeded(); await ch.screenshot({ path: path.join(OUT, n + "-chart.jpg"), type: "jpeg", quality: 88 });
    await (await p.$("#simCtl")).screenshot({ path: path.join(OUT, n + "-ctl.jpg"), type: "jpeg", quality: 88 });
    meta.sim.push(n);
  }
  const cb = await (await p.$("#simChart svg")).boundingBox(), cc = await (await p.$("#simCtl")).boundingBox();
  meta.simChart = { w: Math.round(cb.width), h: Math.round(cb.height) }; meta.simCtl = { w: Math.round(cc.width), h: Math.round(cc.height) };
  await b.close();

  // short excerpts of the two explainer films already in the app
  const clip = (src, ss, t, name) => { execFileSync("ffmpeg", ["-hide_banner", "-loglevel", "error", "-y", "-ss", String(ss), "-t", String(t), "-i", path.join(ROOT, "dist/media", src), "-vf", "fps=12,scale=1280:-1", "-q:v", "3", path.join(OUT, name + "-%02d.jpg")]); return fs.readdirSync(OUT).filter(f => f.startsWith(name + "-")).sort().map(f => f.replace(".jpg", "")); };
  meta.filmA = clip("tremor-loop.mp4", 3.4, 3.2, "filmA"); meta.filmB = clip("gain-vs-loss.mp4", 9.0, 3.2, "filmB");
  fs.writeFileSync(path.join(OUT, "meta.json"), JSON.stringify(meta, null, 1));
  console.log(Object.keys(meta.shots).length, "stills;", meta.geo.length, "map states;", meta.sim.length, "simulator frames;", meta.filmA.length + meta.filmB.length, "film frames; ties", JSON.stringify(meta.ties));
})();
