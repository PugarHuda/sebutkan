/**
 * Live-demo video assets: screenshot the REAL app pages (Playwright) + generate
 * matching natural-voice narration (Venice TTS). Output to video-out/demo-*.
 * Requires the dev server on :3000.
 * Run: node --env-file=.env scripts/video/demo.mjs
 */
import { chromium } from "playwright";
import { mkdirSync, writeFileSync } from "node:fs";

const APP = process.env.BASE_URL ?? "http://localhost:3000";
const BASE = process.env.VENICE_BASE_URL ?? "https://api.venice.ai/api/v1";
const KEY = process.env.VENICE_API_KEY;
if (!KEY) throw new Error("set VENICE_API_KEY");
const VOICE = process.env.VENICE_TTS_VOICE ?? "af_sky";

// Each cue = a real page (optionally scrolled to an element) + matching narration.
const CUES = [
  { url: "/", text: "This is Sebutkan — live. An autonomous A.I. research agent that cites and pays the human authors it cites." },
  { url: "/", scrollTo: "From a question to a payment", text: "Right on the landing you can watch one run, end to end: a Planner, parallel Readers, a Citation-Matcher, and a Fact-checker — then the author payout, where every cited author gets a relevance-weighted U.S.D.C. share." },
  { url: "/dashboard", text: "The dashboard opens on live on-chain stats — attestations, U.S.D.C. attributed, and authors cited — all read straight from Sepolia. Nothing is hard-coded." },
  { url: "/dashboard/research", text: "Research is the core. You connect MetaMask Flask and grant one E.R.C. seventy-seven-fifteen budget the agent can never exceed, then ask a question. The agent searches OpenAlex's two-hundred-fifty-million-paper index and reasons with Venice, then settles each cited author on-chain with attestAndSplit — no relayer fee, no double pay." },
  { url: "/dashboard/agents", text: "The Agents page shows the five specialists. Each is a real on-chain principal that redelegates a strictly narrower budget over E.R.C. seventy-seven-ten, and earns reputation in the E.R.C. eighty-oh-four registry as it works." },
  { url: "/dashboard/bounties", text: "Anyone can sponsor a research topic with U.S.D.C. on the Bounties page. When Sebutkan satisfies it, the deposit is paid straight to the cited authors — with no platform fee — and unsettled bounties are refundable." },
  { url: "/dashboard/claim", text: "Authors get paid on the Claim page: they prove their ORCID, bind their wallet with one signature, and withdraw — plus a twelve-percent citation-loyalty yield that ticks up live while it waits." },
  { url: "/dashboard/activity", text: "And it's all public. Activity is a live read of every attestation on-chain, with a leaderboard of the most-cited authors." },
  { url: "/", scrollTo: "Every citation, a real payment", text: "That's the whole loop. Sebutkan — an agent that cites and pays its sources. Every citation, a real payment. Try it at sebutkan dot vercel dot app." },
];

mkdirSync("video-out/demo-frames", { recursive: true });
mkdirSync("video-out/demo-audio", { recursive: true });

async function tts(text) {
  const res = await fetch(`${BASE}/audio/speech`, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${KEY}` },
    body: JSON.stringify({ model: process.env.VENICE_TTS_MODEL ?? "tts-kokoro", input: text, voice: VOICE, response_format: "mp3" }),
  });
  if (!res.ok) throw new Error(`TTS ${res.status}: ${(await res.text()).slice(0, 160)}`);
  return Buffer.from(await res.arrayBuffer());
}

const HIDE = "nextjs-portal,[data-nextjs-dev-tools-button],#__next-build-watcher,[data-next-badge-root]{display:none!important}";

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 });

for (let i = 0; i < CUES.length; i++) {
  const c = CUES[i];
  const nn = String(i).padStart(2, "0");
  await page.goto(`${APP}${c.url}`, { waitUntil: "networkidle" });
  await page.addStyleTag({ content: HIDE });
  await page.waitForTimeout(1400);
  if (c.scrollTo) {
    try {
      await page.getByText(c.scrollTo, { exact: false }).first().scrollIntoViewIfNeeded({ timeout: 4000 });
      await page.waitForTimeout(900);
    } catch { /* fall back to top */ }
  }
  await page.screenshot({ path: `video-out/demo-frames/${nn}.png`, clip: { x: 0, y: 0, width: 1280, height: 720 } });
  const buf = await tts(c.text);
  writeFileSync(`video-out/demo-audio/${nn}.mp3`, buf);
  console.log(`✓ cue ${nn} → ${c.url}${c.scrollTo ? ` (#${c.scrollTo})` : ""}`);
}

await browser.close();
console.log("done.");
