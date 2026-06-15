# Video assets — Sebutkan

**Ready-made MP4s (generated, with natural-voice narration):**
- `public/pitch.mp4` — ~2:57, 1280×720, the narrated deck with on-screen subtitles.
- `public/demo.mp4` — ~1:49, 1280×720, a narrated walkthrough of the real app.

Both are produced fully from code — **Venice TTS** audio (kokoro) muxed onto
**Playwright** screenshots with **ffmpeg**. Regenerate any time:

```bash
npm i --no-save playwright ffmpeg-static && npx playwright install chromium
npm run dev                                   # in another terminal (:3000)
node --env-file=.env scripts/video/gen-audio.mjs   # pitch narration → video-out/audio
node scripts/video/shoot.mjs                        # pitch slides    → video-out/frames
node scripts/video/build.mjs                        # → video-out/pitch.mp4
node --env-file=.env scripts/video/demo.mjs         # demo frames+audio
FRAMES_DIR=video-out/demo-frames AUDIO_DIR=video-out/demo-audio OUT=video-out/demo.mp4 SEG_PREFIX=dseg node scripts/video/build.mjs
```

Everything below is also ready to **screen-record** if you'd rather capture live
(e.g. to show real wallet signatures). Subtitle files live in `public/`
(`pitch.vtt`, `pitch.srt`, `demo.srt`).

---

## 1. Pitch video (~2:55) — fully automated

The `/slide` deck plays **itself**, with **on-screen subtitles** and **browser
text-to-speech** narration, auto-advancing per slide.

**To record:**
1. Open `https://sebutkan.vercel.app/slide` in Chrome (best TTS voices).
2. Press **F** for fullscreen, **C** to confirm captions are on.
3. Start your screen recorder (OBS / QuickTime / Win+G).
4. Press **▶ Play narrated** (or the **P** key). The deck narrates + advances on its own.
5. Stop recording on the final slide.

That's the whole pitch video — narrated, captioned, hands-free. Subtitles also in
`public/pitch.srt` / `public/pitch.vtt` if you'd rather record your own voice and
add captions in post. Full script: `pitch.srt`.

> Tip: Chrome's default voice is robotic. For a nicer voice, install a system voice
> (Settings → Speech) or record your own narration over the deck using `pitch.srt`.

---

### Shortcut: two built-in **Guided Tours** (narrated, with a 👉 moving pointer)

Both auto-pick the most natural English voice your browser has (use the **voice
dropdown** on `/slide` to switch) and show **subtitles**, with an animated **pointer**
so viewers always see what's being explained.

1. **▶ Take the guided tour** (sidebar, top) — a **full product tour** that
   **navigates every sidebar section for you** (Overview → Research → Library →
   Agents → Bounties → Claim → Activity), spotlighting each in the sidebar and
   narrating what it does. Hands-free, interactive (it changes pages itself).
   **Screen-record this for the whole-product overview part of the demo.**

2. **▶ Explain this result (guided tour)** (after a research run) — a **10-step
   walkthrough of one run**: the stepper, the granted budget, the A2A mesh, the
   Ask box, then synthesis → TL;DR → trace → payout → settle → receipt. Spotlight
   + caption + narration, auto-advancing. **Screen-record this for the deep-dive.**

For the grant + settle + claim steps that need wallet signatures, follow the table below.

## 2. Live demo video (~4:10) — screen-record the real app, every feature

Two ways, both covered by the captions in `public/demo.srt` (15 cues, **every
feature**, ~4:10):

- **Easiest — record the interactive tour.** On the dashboard click **▶ Take the
  guided tour**: it navigates every section on its own, **points at each feature**
  with an animated pointer, and **narrates** it in a natural voice with on-screen
  captions already burned in. Then do the deep-dive with **▶ Explain this result**
  after a run. This alone is a complete, captioned, pointer-guided product demo.
- **Polished — narrate the real flow yourself** using the table below (do the
  grant/settle/claim live for the wallet-signature moments). `demo.srt` is the
  matching voiceover script for all features.

| Time | Screen | Say (narration) |
|---|---|---|
| 0:00–0:12 | Landing `/` | "This is Sebutkan — live. An AI research agent that pays the human authors it cites." |
| 0:12–0:40 | `/dashboard/research` — connect Flask, pick a **0.5 USDC** preset, **Grant 0.5 USDC & research** → sign | "I connect MetaMask Flask on Sepolia, pick a budget — half a USDC for this grant — and sign one ERC-7715 permission. Nothing leaves my wallet; it's a cap." |
| 0:40–1:20 | The run streams; scroll the **Multi-agent trace** | "The agent searches OpenAlex's 250-million-paper index, then five agents — Planner, parallel Readers, a Citation-Matcher, a Fact-checker, a Summarizer — reason with Venice. Watch the redelegation hops and the fact-check pass." |
| 1:20–1:40 | **Author payout plan** table | "Every cited author gets a weighted USDC share, ranked by Venice embeddings — with clickable citations." |
| 1:40–2:05 | Click **Pay authors — settle on-chain** → sign → ✓ tx | "One click. attestAndSplit records the attestation AND pays each author in a single transaction — no relayer fee, no double-pay. Here's the tx on Etherscan." |
| 2:05–2:20 | Receipt card + Venice extras + **ERC-8004 reputation** chips | "An on-brand citation receipt, a Venice image and spoken briefing — and the agents earn on-chain reputation." |
| 2:20–2:45 | `/dashboard/claim` — Demo-verify ORCID, bind, **Withdraw**, yield ticking | "Authors claim their earnings: prove their ORCID, bind their wallet, withdraw — plus a twelve-percent loyalty yield that ticks up live." |
| 2:45–3:00 | `/dashboard/activity` (leaderboard) → landing | "Every payment, public on-chain. Sebutkan — an agent that cites *and* pays its sources. Try it at sebutkan.vercel.app." |

**Capture checklist**
- [ ] MetaMask **Flask**, clean profile, Sepolia RPC = `https://ethereum-sepolia-rpc.publicnode.com`, holding test USDC + a little ETH.
- [ ] Use a **fresh query** each settle (re-settling a query is blocked on-chain — anti-double-pay).
- [ ] Pre-run one result as a fallback in case Venice is slow on camera.
- [ ] 1080p, ~110% zoom, console hidden, notifications off.
- [ ] *(Optional)* run `node scripts/relay-mainnet-1shot.mjs` first to show the **Base mainnet** 1Shot relay tx.
