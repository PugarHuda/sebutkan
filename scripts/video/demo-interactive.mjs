/**
 * Interactive live-demo video: records REAL browser video (Playwright recordVideo)
 * of the app being driven — a visible pointer glides to and points at each feature,
 * with real clicks/typing — then trims the page-load lead-in and muxes the matching
 * Venice narration (video-out/demo-audio/NN.mp3) onto each cue, and concatenates.
 * Output: video-out/demo.mp4. Requires dev on :3000.
 * Run: node --env-file=.env scripts/video/demo-interactive.mjs
 */
import { chromium } from "playwright";
import ffmpegPath from "ffmpeg-static";
import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";

const APP = process.env.BASE_URL ?? "http://localhost:3000";
const HISTORY_KEY = "sebutkan:research-history";
const ff = (args) => execFileSync(ffmpegPath, args, { stdio: ["ignore", "ignore", "inherit"] });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function audioDuration(path) {
  let out = "";
  try { execFileSync(ffmpegPath, ["-i", path], { stdio: ["ignore", "ignore", "pipe"] }); }
  catch (e) { out = (e.stderr || "").toString(); }
  const m = out.match(/Duration:\s*(\d+):(\d+):(\d+\.\d+)/);
  return m ? (+m[1]) * 3600 + (+m[2]) * 60 + parseFloat(m[3]) : 6;
}

const HIDE = "nextjs-portal,[data-nextjs-dev-tools-button],#__next-build-watcher,[data-next-badge-root]{display:none!important}";

// Inject (idempotent) a visible pointer ring; position is set explicitly during glides.
async function ensureCursor(page) {
  await page.evaluate(() => {
    if (document.getElementById("__demo_cursor")) return;
    const c = document.createElement("div");
    c.id = "__demo_cursor";
    c.style.cssText = "position:fixed;z-index:2147483647;left:640px;top:380px;width:30px;height:30px;margin:-15px 0 0 -15px;border:3px solid #0b6e4f;border-radius:50%;background:rgba(11,110,79,.20);box-shadow:0 0 0 5px rgba(11,110,79,.12),0 2px 8px rgba(0,0,0,.18);pointer-events:none";
    const d = document.createElement("div");
    d.style.cssText = "position:absolute;left:50%;top:50%;width:9px;height:9px;margin:-4.5px 0 0 -4.5px;border-radius:50%;background:#0b6e4f";
    c.appendChild(d);
    (document.body || document.documentElement).appendChild(c);
  }).catch(() => {});
}
async function setCursor(page, x, y) {
  await page.evaluate(([x, y]) => { const c = document.getElementById("__demo_cursor"); if (c) { c.style.left = x + "px"; c.style.top = y + "px"; } }, [x, y]).catch(() => {});
}

const CUES = [
  { kind: "url", url: "/", points: ["Open the dashboard"] },
  { kind: "url", url: "/", scrollTo: "From a question to a payment", points: ["From a question to a payment", "Settle"] },
  { kind: "url", url: "/dashboard", points: ['[data-tour="ov-stats"]'] },
  { kind: "url", url: "/dashboard/research", scrollTo: "Grant a periodic", points: ["0.5 USDC"], click: "0.5 USDC" },
  { kind: "result", points: ["Synthesis"] },
  { kind: "result", scrollTo: "Multi-agent trace", points: ["Multi-agent trace"] },
  { kind: "result", scrollTo: "Author payout plan", points: ["Author payout plan"] },
  { kind: "url", url: "/dashboard/agents", points: ['[data-tour="agents-list"]'] },
  { kind: "url", url: "/dashboard/bounties", points: ['[data-tour="bounty-form"]'], type: { sel: 'input[placeholder*="perovskite"]', text: "stable diffusion safety" } },
  { kind: "url", url: "/dashboard/claim", scrollTo: "Verify your ORCID", points: ["Verify your ORCID"], type: { sel: 'input[placeholder*="0000"]', text: "0000-0002-1825-0097" } },
  { kind: "url", url: "/dashboard/activity", points: ["Top cited authors"] },
  { kind: "url", url: "/", scrollTo: "Every citation, a real payment", points: ["Run a query"] },
];

mkdirSync("video-out/ivid", { recursive: true });
const durs = CUES.map((_, i) => audioDuration(`video-out/demo-audio/${String(i).padStart(2, "0")}.mp3`));

console.log("running real research query…");
const rres = await fetch(`${APP}/api/research`, {
  method: "POST", headers: { "content-type": "application/json" },
  body: JSON.stringify({ query: "perovskite solar cell stability", papers: 5, language: "English", rootBudgetUSDC: 1 }),
});
if (!rres.ok) throw new Error(`/api/research ${rres.status}`);
const result = await rres.json();
const id = `1718000000000-${(result.query || "run").toLowerCase().replace(/\W+/g, "-").slice(0, 40)}`;
const entry = { id, query: result.query, savedAt: 1718000000000, venice: result.venice, result };
console.log(`✓ result seeded: ${result.payouts?.length ?? 0} authors`);

const browser = await chromium.launch();
const segs = [];

for (let i = 0; i < CUES.length; i++) {
  const c = CUES[i];
  const nn = String(i).padStart(2, "0");
  const dur = durs[i];
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 }, recordVideo: { dir: "video-out/ivid", size: { width: 1280, height: 720 } } });
  const page = await ctx.newPage();
  const t0 = Date.now();
  const video = page.video();

  if (c.kind === "result") {
    await page.goto(`${APP}/dashboard`, { waitUntil: "domcontentloaded" });
    await page.evaluate(([k, v]) => localStorage.setItem(k, v), [HISTORY_KEY, JSON.stringify([entry])]);
  }
  await page.goto(`${APP}${c.kind === "result" ? `/dashboard/result/${id}` : c.url}`, { waitUntil: "networkidle" });
  await page.addStyleTag({ content: HIDE });
  if (c.scrollTo) { await page.getByText(c.scrollTo, { exact: false }).first().scrollIntoViewIfNeeded({ timeout: 4000 }).catch(() => {}); await sleep(500); }
  await ensureCursor(page);
  let cur = { x: 640, y: 380 };
  await setCursor(page, cur.x, cur.y);
  await sleep(350);

  const tReady = Date.now();

  const glide = async (x, y) => {
    const steps = 18;
    for (let s = 1; s <= steps; s++) {
      const px = cur.x + (x - cur.x) * s / steps, py = cur.y + (y - cur.y) * s / steps;
      await page.mouse.move(px, py);
      await setCursor(page, px, py);
      await sleep(26);
    }
    cur = { x, y };
  };
  const pointAt = async (target) => {
    let box = null;
    try {
      const loc = target.startsWith("[") ? page.locator(target).first() : page.getByText(target, { exact: false }).first();
      await loc.scrollIntoViewIfNeeded({ timeout: 2500 }).catch(() => {});
      await ensureCursor(page); // re-add if a scroll/rerender dropped it
      box = await loc.boundingBox();
    } catch { /* ignore */ }
    if (!box) return null;
    const x = Math.min(1262, Math.max(18, box.x + box.width / 2));
    const y = Math.min(702, Math.max(18, box.y + box.height / 2));
    await glide(x, y);
    return { x, y };
  };

  for (const p of c.points) { await pointAt(p); await sleep(750); }
  if (c.click) { const at = await pointAt(c.click); if (at) { await page.mouse.click(at.x, at.y).catch(() => {}); await sleep(500); } }
  if (c.type) {
    const inp = page.locator(c.type.sel).first();
    const box = await inp.boundingBox().catch(() => null);
    if (box) { await glide(box.x + 24, box.y + box.height / 2); await inp.click().catch(() => {}); await inp.type(c.type.text, { delay: 60 }).catch(() => {}); }
  }
  const visible = (Date.now() - tReady) / 1000;
  if (visible < dur + 0.4) await sleep((dur + 0.4 - visible) * 1000);

  const leadSec = Math.max(0, (tReady - t0) / 1000);
  await page.close();
  await ctx.close();
  const vpath = await video.path();

  const out = `video-out/iseg-${nn}.mp4`;
  ff([
    "-y", "-ss", leadSec.toFixed(2), "-i", vpath, "-i", `video-out/demo-audio/${nn}.mp3`,
    "-map", "0:v:0", "-map", "1:a:0",
    "-c:v", "libx264", "-pix_fmt", "yuv420p", "-r", "30", "-vf", "scale=1280:720,format=yuv420p",
    "-c:a", "aac", "-b:a", "192k", "-ar", "44100", "-shortest", "-movflags", "+faststart", out,
  ]);
  segs.push(`file 'iseg-${nn}.mp4'`);
  console.log(`✓ cue ${nn} (lead ${leadSec.toFixed(1)}s, narration ${dur.toFixed(1)}s)`);
}
await browser.close();

writeFileSync("video-out/list-iseg.txt", segs.join("\n"));
ff(["-y", "-f", "concat", "-safe", "0", "-i", "video-out/list-iseg.txt", "-c:v", "libx264", "-pix_fmt", "yuv420p", "-r", "30", "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart", "video-out/demo.mp4"]);
console.log("✓ video-out/demo.mp4");
