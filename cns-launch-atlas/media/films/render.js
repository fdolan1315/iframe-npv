/* Render the explainer films: drive film.html frame by frame in headless Chromium and pipe PNG frames to ffmpeg.
   Usage: node render.js [channel|loop ...]      Requires: playwright, ffmpeg.  Output: ../../dist/media/<name>.mp4 + poster .jpg */
const { chromium } = require("playwright"), { spawn } = require("child_process"), path = require("path"), fs = require("fs");
const FILMS = { channel: { out: "gain-vs-loss", poster: 16.5 }, loop: { out: "tremor-loop", poster: 18.5 } }, FPS = 30;
const outDir = path.resolve(__dirname, "../../dist/media");
(async () => {
  fs.mkdirSync(outDir, { recursive: true });
  const browser = await chromium.launch();
  for (const key of (process.argv.slice(2).length ? process.argv.slice(2) : Object.keys(FILMS))) {
    const f = FILMS[key], page = await (await browser.newContext({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 })).newPage();
    await page.goto("file://" + path.join(__dirname, "film.html") + "?f=" + key);
    await page.evaluate(() => document.fonts.ready);
    const dur = await page.evaluate(() => window.DURATION), frames = Math.round(dur * FPS), mp4 = path.join(outDir, f.out + ".mp4");
    const ff = spawn("ffmpeg", ["-hide_banner", "-loglevel", "error", "-y", "-f", "image2pipe", "-framerate", String(FPS), "-i", "-", "-c:v", "libx264", "-preset", "slow", "-crf", "24", "-pix_fmt", "yuv420p", "-movflags", "+faststart", mp4], { stdio: ["pipe", "inherit", "inherit"] });
    for (let i = 0; i < frames; i++) {
      await page.evaluate(t => window.renderFrame(t), i / FPS);
      const buf = await page.screenshot({ type: "png" });
      if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once("drain", r));
      if (Math.abs(i / FPS - f.poster) < 0.5 / FPS) fs.writeFileSync(path.join(outDir, f.out + ".png"), buf);
    }
    ff.stdin.end(); await new Promise(r => ff.on("close", r));
    fs.writeFileSync(path.join(outDir, f.out + ".captions.json"), JSON.stringify(await page.evaluate(() => window.CAPTIONS)));
    console.log(key, "->", mp4, frames, "frames", (fs.statSync(mp4).size / 1e6).toFixed(2), "MB");
    await page.close();
  }
  await browser.close();
})();
