# Social posts — Sebutkan (#BestSocialMediaPresence)

**Always tag @MetaMaskDev** (https://x.com/MetaMaskDev). Add **@Venice_AI** on Venice
posts and **1Shot** (their X handle) on relayer posts. The track rewards the
**one-permission UX story** — that Advanced Permissions (ERC-7715) streamlined getting
spending authority — so posts 1–3 lead with exactly that.

Live: https://sebutkan.vercel.app · Repo: https://github.com/PugarHuda/sebutkan
Hashtags to rotate: `#MetaMask #SmartAccounts #ERC7715 #x402 #AIagents`

**Media files** (all under `submission-images/`, clips under `submission-images/clips/`):
`1-landing.png` · `2-one-run-and-stats.png` · `3-research-grant.png` · `4-activity-onchain.png` ·
`5-agent-mesh.png` · `6-1shot-live.png` · `7-basescan-7702.png` · `alt-claim.png` · `alt-closing.png` ·
`clips/clip-grant-research.mp4` (~30s) · `clips/clip-1shot-proof.mp4` (~31s) · plus `pitch.mp4` / `demo.mp4`.

> Post 1 as the **pinned** hero. Posts 2–10 can go out as a thread on day 1, then spaced
> over a few days (frequency + consistency are judged). Replace `@yourhandle`/links as needed.

---

### 1) Hero / pin  📌  · media: `1-landing.png` (or `pitch.mp4`)
AI scrapes humanity's research and pays the authors nothing.

So I built **Sebutkan** 🪙 — a research agent that *cites AND pays* its sources.

Sign **ONE** @MetaMaskDev Advanced Permission. The agent researches with @Venice_AI and splits USDC back to every author it cites — on-chain, non-custodial.

🔗 sebutkan.vercel.app
#MetaMask #SmartAccounts

---

### 2) The UX story  · media: `clips/clip-grant-research.mp4` (or `3-research-grant.png`)
The whole product hinges on @MetaMaskDev **Advanced Permissions (ERC-7715).**

You sign **once**: "up to 10 USDC for this 24-hour grant." A hard cap that auto-expires. No per-action popups, no blanket approval, no custody.

It's the first agent-spending UX I'd actually trust. 🧵👇

---

### 3) Why it matters  · media: `3-research-grant.png`
Most "AI + crypto" agents make you approve a blanket token allowance or hand over custody — terrifying for an agent that spends on its own.

ERC-7715 flips it: the agent operates inside a cryptographically enforced budget it *cannot* exceed. One signature did all of that. @MetaMaskDev #ERC7715

---

### 4) The agent mesh (A2A)  · media: `5-agent-mesh.png`
Sebutkan isn't one agent — it's a **mesh**.

The Researcher **redelegates** strictly narrower budgets (ERC-7710) to a Planner → parallel Readers → a Fact-checker → a Summarizer. Authority only ever *shrinks*, and the Fact-checker can reject a weak answer & force a revision. @MetaMaskDev

---

### 5) The brain: Venice  · media: `2-one-run-and-stats.png`
Under that one permission, the agents reason with **@Venice_AI** — private & uncensored — across **5 endpoints in the main flow**: chat, web-search, embeddings, image, and TTS.

The embeddings don't just dedup — they *weight who gets paid*. @MetaMaskDev #AIagents

---

### 6) Gasless payouts via 1Shot  · media: `clips/clip-1shot-proof.mp4` (or `6-1shot-live.png`)
Authors get paid **gasless on Base mainnet** via the **1Shot** permissionless relayer — a real ERC-7710 redeem with an **EIP-7702** account upgrade, gas paid in USDC.

Live relayer call + the on-chain tx, in the demo 👇 @MetaMaskDev

---

### 7) Every citation = a payment  · media: `7-basescan-7702.png` (or `4-activity-onchain.png`)
One click: `attestAndSplit` records the citation **and** pays each author in a single on-chain tx — no relayer fee, the contract blocks double-pay.

Proof: basescan.org/tx/0x6f4c8d53…8480c (EIP-7702, ✓ Success). It's all real. @MetaMaskDev

---

### 8) Authors claim with ORCID  · media: `alt-claim.png`
Cited an author who hasn't joined yet? Their share is recorded on-chain and waits in escrow.

They prove their **ORCID** (OAuth), bind a wallet with one signature, and withdraw — plus a 12% citation-loyalty yield. Zero gas for them. @MetaMaskDev

---

### 9) Build-in-public / design  · media: `1-landing.png` or `alt-closing.png`
Spent the last stretch giving Sebutkan a cozy, anime study-room feel (art generated with @Venice_AI's image endpoint) + an interactive guided tour that points at every feature.

A serious on-chain agent doesn't have to look like a terminal. 🪴 @MetaMaskDev

---

### 10) Wrap + CTA  · media: `demo.mp4` (full) or `pitch.mp4`
Sebutkan — an agent that pays the people it learns from.

✅ ERC-7715 grant in the main flow
✅ A2A redelegation (ERC-7710)
✅ 1Shot 7710+7702 relay on Base mainnet
✅ 5 Venice endpoints · 112 tests, no mocks

Try it 👉 sebutkan.vercel.app
@MetaMaskDev × @Venice_AI × 1Shot /end

---

### Spare "build-in-public" one-liners (space these out for consistency)
- "TIL the 1Shot relayer wants exactly ONE EIP-7702 authorization per relay — so a 2-hop redelegation needs a pre-deployed intermediate. Shipped the single-hop mainnet relay: gas in USDC, zero ETH. @MetaMaskDev"
- "Made the Fact-checker agent able to *reject* the Researcher and force a revision round — a real coordination loop, not a pipeline. @MetaMaskDev"
- "ERC-7715 Advanced Permissions = one signed budget, hard cap, expiry, full custody. The cleanest agent-permission UX I've used. @MetaMaskDev #SmartAccounts"

### Posting tips
- Pin post 1. Attach media to every post — visuals + video score highest.
- Always tag **@MetaMaskDev**; add **@Venice_AI** on posts 5/9 and the 1Shot handle on post 6.
- Post the thread day 1, then drip posts 8–10 + the one-liners over 2–3 days.
