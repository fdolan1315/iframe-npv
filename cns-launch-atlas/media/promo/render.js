/* Render the overview video: drive promo.html frame by frame in headless Chromium and pipe PNG frames to ffmpeg.
   Usage: node capture.js && node render.js [seconds-to-preview ...]     Output: ./out/atlas-overview.mp4 (1080x1350, 30 fps, silent) + poster frames
   With arguments (e.g. `node render.js 2 12 35`) it writes only still frames at those times to ./out/, for checking. */
const { chromium } = require("playwright"), { spawn } = require("child_process"), path = require("path"), fs = require("fs");
const FPS = 30, out = path.join(__dirname, "out");
(async () => {
  fs.mkdirSync(out, { recursive: true });
  const meta = JSON.parse(fs.readFileSync(path.join(__dirname, "shots/meta.json"), "utf8"));
  const browser = await chromium.launch();
  const page = await (await browser.newContext({ viewport: { width: 1080, height: 1350 }, deviceScaleFactor: 1 })).newPage();
  page.on("console", m => { if (m.type() === "error") console.log("page:", m.text()); }); page.on("pageerror", e => console.log("page error:", e.message));
  await page.goto("file://" + path.join(__dirname, "promo.html"));
  await page.evaluate(m => window.init(m), meta);
  const dur = await page.evaluate(() => window.DURATION), frames = Math.round(dur * FPS);
  const stills = process.argv.slice(2).map(Number);
  if (stills.length) {
    for (const t of stills) { await page.evaluate(t => window.renderFrame(t), t); await page.screenshot({ path: path.join(out, `frame-${String(t).replace(".", "_")}.png`) }); }
    console.log("duration", dur.toFixed(1), "s; wrote", stills.length, "frames"); await browser.close(); return;
  }
  const mp4 = path.join(out, "atlas-overview.mp4");
  const ff = spawn("ffmpeg", ["-hide_banner", "-loglevel", "error", "-y", "-f", "image2pipe", "-framerate", String(FPS), "-i", "-", "-c:v", "libx264", "-preset", "slow", "-crf", "20", "-pix_fmt", "yuv420p", "-movflags", "+faststart", mp4], { stdio: ["pipe", "inherit", "inherit"] });
  for (let i = 0; i < frames; i++) {
    await page.evaluate(t => window.renderFrame(t), i / FPS);
    const buf = await page.screenshot({ type: "png" });
    if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once("drain", r));
  }
  ff.stdin.end(); await new Promise(r => ff.on("close", r));
  fs.writeFileSync(path.join(out, "captions.json"), JSON.stringify(await page.evaluate(() => window.CAPTIONS), null, 1));
  console.log(mp4, frames, "frames", dur.toFixed(1), "s", (fs.statSync(mp4).size / 1e6).toFixed(2), "MB");
  await browser.close();
})();
