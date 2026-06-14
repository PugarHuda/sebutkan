# Sebutkan — Demo Video Storyboard (≈ 3:30)

Goal: in one continuous research run, visibly hit **every** track. Each scene below
lists what to show, what to say, and the **track it scores**. Record at 1080p+,
browser zoom ~110%, MetaMask **Flask** in a clean profile. Live link: https://sebutkan.vercel.app

> The hero shot is the **Multi-agent trace** (Scene 5). Everything builds to it.

---

### Scene 0 — Cold open (0:00–0:15) · the hook
- **Screen:** landing page (`/`), then the one-line pitch.
- **Say:** "AI reads humanity's research and pays the authors *nothing*. Sebutkan is a
  research agent that **cites _and_ pays** its sources — autonomously, gasless, non-custodial."
- **Cut to:** the dashboard (`/dashboard`).

### Scene 1 — Connect (0:15–0:30) · Qualification
- **Screen:** sidebar → **Connect MetaMask** (only MetaMask shows — no competitor wallets).
- **Say:** "One wallet. MetaMask Smart Accounts Kit, on Sepolia."
- **Show:** connected address chip.
- **Scores:** Qualification (MetaMask Advanced Permissions in the main flow).

### Scene 2 — Grant ONE permission (0:30–0:55) · x402 + 7710 setup
- **Screen:** the top **progress stepper** (① Grant → ② Research → ③ Settle). Step 2 → pick a
  budget preset (or custom) → "10 USDC for the 24h grant" → **Grant budget** → Flask popup → sign.
- **Say:** "I grant **one** ERC-7715 USDC permission. The agent operates inside a
  cryptographically enforced cap it can never exceed — no blanket approval, no custody."
- **Show:** the **budget-status panel** — "Granted budget 10 USDC for this window · live countdown ·
  nothing charged, this is a cap." (Expand *"View raw permission context"* for the JSON proof.) The setup
  collapses to this compact panel once granted.
- **Scores:** Best x402 + ERC-7710 (the 7715 grant → 7710 delegation).

### Scene 3 — The mesh, before it runs (0:55–1:15) · A2A redelegation
- **Screen:** expand the **Agent mesh** card (*show ▾*) — the indented tree (You → Researcher →
  Planner / Reader / Fact-checker / Summarizer) with each hop's **narrowed** budget chip (≤ 4.00,
  ≤ 1.50, ≤ 0.50 USDC) and caveats.
- **Say:** "The Researcher will **redelegate** strictly narrower slices to specialists.
  Authority only ever *narrows* — that's the A2A model."
- **Scores:** Best A2A coordination (redelegation, shown up front).

### Scene 4 — Ask a question (1:15–1:35) · Venice
- **Screen:** type *"What are the most effective direct air carbon capture methods?"* → **Research**.
- **Say:** "Venice — private and uncensored — does all the reasoning. Watch the agents work."
- **Show:** the step ticker animating.
- **Scores:** Best use of Venice AI (intro).

### Scene 5 — ⭐ THE MULTI-AGENT TRACE (1:35–2:25) · the hero shot
- **Screen:** scroll to **Multi-agent trace**. Walk through it top to bottom:
  1. **Researcher · plan** — pulled N papers, redelegating.
  2. **3 redelegation hops** — Reader ≤4.00 / Fact-checker ≤1.50 / Summarizer ≤0.50 USDC `[redelegated]`.
  3. **Planner · decompose** — "Split into 3 sub-questions: …".
  4. **3 Reader · answer sub-question** — parallel fan-out, each ≤1.33 USDC, each answering its slice.
  5. **Researcher · synthesize** — merged.
  6. **Fact-checker · verify** — the **confidence badge** (high/medium/low).
  7. *(if low)* **Researcher · revise** — the **↻ rounds: 2** badge: the fact-checker **rejected**
     the answer and forced a revision. Call this out — it's a real coordination *loop*, not a pipeline.
  8. **Summarizer · summarize** — the TL;DR.
- **Say:** "A Planner splits the question; a Reader fan-out answers each slice in parallel under its
  own sub-budget; a Fact-checker can **reject** and send it back for revision; a Summarizer condenses it.
  Five specialist agents, each a real on-chain principal."
- **Scores:** Best Agent + Best A2A coordination (the core of both).

### Scene 6 — Venice depth (2:25–2:40) · Venice
- **Screen:** the **Venice live** badge, the **web sources** list, then click **3 · Venice receipt**
  → the generated image + audio briefing plays.
- **Say:** "Venice across five endpoints — chat, web search, embeddings, image, and text-to-speech."
- **Scores:** Best use of Venice AI (multi-endpoint, in the main flow).

### Scene 7 — Pay the authors (2:40–3:00) · x402 + 1Shot
- **Screen:** the **author payout plan** table (each citation → a wallet, claimed/demo). Click the
  primary **"Pay authors — settle on-chain"** → Flask → one tx that **records the attestation AND
  pays each author** (`attestAndSplit`). The receipt flips to **"Citations Paid"**, the **stepper**
  advances to ③, and the **✓ settled** badge appears. (Mention the *Advanced* options: gasless 1Shot
  relay, or "Auto-pay on finish" which settles automatically — honouring the budget.)
- **Say:** "One click records who's owed **and** pays them — each author settled once, no double-pay.
  The agent already bought the top paper via **x402**. All auditable on Etherscan."
- **Scores:** Best x402 + ERC-7710.

### Scene 8 — Reputation feedback (3:00–3:10) · Best Agent
- **Screen:** right after settlement, the **Agent reputation updated (ERC-8004)** panel lists
  each contributor with **+1 rep ↗** linking its on-chain `bumpReputation` tx. Cut to `/dashboard/agents`
  showing the bumped reputation numbers.
- **Say:** "Agents that contributed **earn on-chain reputation** — a feedback loop, not a badge."
- **Scores:** Best Agent (ERC-8004 verifiable agents).

### Scene 9 — 1Shot MAINNET relay (3:10–3:25) · Best 1Shot Relayer
- **Screen:** terminal running `node scripts/relay-mainnet-1shot.mjs`. Highlight:
  `EIP-7702 authorization signed` → `relayer_send7710Transaction OK` → `Confirmed` + `txHash`.
  Open the txHash on **basescan.org**.
- **Say:** "And the author payout can be relayed **gasless on mainnet** through the **1Shot
  Permissionless relayer** — a real 7710 transaction with an **EIP-7702** upgrade, gas paid in USDC."
- **Scores:** Best Use of 1Shot Permissionless Relayer. *(Requires running the funded relay first —
  see ONESHOT-MAINNET.md. Record the txHash and show it here.)*

### Scene 10 — Close (3:25–3:30)
- **Screen:** the citation-receipt card; overlay the 5 contracts + live URL.
- **Say:** "Sebutkan. The research agent that cites *and pays* its sources."
- **Show:** https://sebutkan.vercel.app · repo · #MetaMaskDev.

---

## Capture checklist
- [ ] MetaMask **Flask** in a clean profile, on Sepolia, holding test USDC.
- [ ] A pre-run research result cached as a fallback in case Venice is slow on-camera.
- [ ] The 1Shot mainnet relay **already run** (Scene 9) so you have a real Base txHash to show.
- [ ] Operator wallet funded (Sepolia ETH) so attestation + reputation txs land on-camera.
- [ ] Browser console hidden; notifications off; 1080p; ~110% zoom.

## One-line per-track proof (for the submission text)
| Track | The exact on-screen moment |
|---|---|
| Qualification | Scene 1–2: MetaMask connect + ERC-7715 grant |
| x402 + ERC-7710 | Scene 7: x402-paid chip + attestation tx |
| Best Agent | Scene 5 + 8: 5-agent trace + ERC-8004 reputation bump |
| Best A2A coordination | Scene 3 + 5: redelegation hops + fact-check→revise loop |
| Best use of Venice AI | Scene 4–6: synthesis + web search + image + TTS |
| Best 1Shot Relayer | Scene 9: mainnet 7710 relay + 7702, Basescan txHash |
| Social / Feedback | post the clip tagging @MetaMaskDev; submit FEEDBACK.md |
