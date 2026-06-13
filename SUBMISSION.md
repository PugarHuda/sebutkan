# Sebutkan — HackQuest submission

**Tagline:** The research agent that cites *and pays* its sources.

**One-liner:** Grant one scoped MetaMask Advanced Permission; an autonomous AI agent buys papers,
reads them with Venice, and splits USDC back to every author it cites — gasless, non-custodial, with
a real on-chain attestation of every citation and an A2A mesh of redelegated specialist agents.

- **Live app:** https://sebutkan.vercel.app
- **Repo:** https://github.com/PugarHuda/sebutkan
- **Demo video:** _<paste link>_ — must show MetaMask Smart Accounts Kit working in the main flow + 1Shot usage.

---

## What it does (the flow a judge sees)

1. **Grant once** — the user signs ONE **ERC-7715** Advanced Permission (a periodic USDC budget, e.g. "10 USDC/day, 24h"). The agent can never exceed it; the user keeps custody. (MetaMask Flask)
2. **Agent mesh works** — the Researcher pays for the top paper via **x402** (on-chain USDC), then **redelegates** strictly narrower budgets (**ERC-7710**) to: a **Planner** (splits the question), a budget-scaled **Reader fan-out** (one per sub-question), a **Citation-Matcher** (Venice embeddings), a **Fact-checker** (can reject → force a revision), and a **Summarizer**. All reason with **Venice** (private + uncensored). Each agent is a real on-chain principal in the **ERC-8004** registry and earns reputation.
3. **Authors are paid** — the citation payout is recorded on-chain (`AttributionLedger`) and settled to authors gaslessly via the **1Shot** relayer (or atomically via `attestAndSplit`, a real USDC transfer). Unclaimed shares wait in escrow until the author binds their **ORCID** + wallet.

---

## On-chain proof (all real, no mocks in the critical path)

**Contracts (Ethereum Sepolia, chain 11155111):**
| Contract | Address |
|---|---|
| AttributionLedger | `0xE92254E3722D190ffC77C0aCa6856610708b9246` |
| NameRegistry (ORCID→wallet) | `0xE9DC8a36e8f14c85E687eEe26978692dA98cbeab` |
| UnclaimedEscrow | `0x851C251411Fe4F4bab586F775c7450f86A348EAD` |
| AgentRegistry8004 | `0x05465b9887D7952fAC76DF42D193aae55EbA5891` |
| BountyMarket | `0xeC274B5B770e24B0Aef8aF75EAAa7fC9CF7DF5c6` |
| ShareRegistry | `0x52759E09d3C70ca281c59da3122a7AF8dFA51847` |

**1Shot mainnet relay (Base 8453):** tx [`0x6f4c8d539f9ea34f7e6e0d0730e4ae04fec1d986e5d0641b8b36ab00c6e8480c`](https://basescan.org/tx/0x6f4c8d539f9ea34f7e6e0d0730e4ae04fec1d986e5d0641b8b36ab00c6e8480c) — type `0x4` (EIP-7702 SetCode), relayed by the 1Shot permissionless relayer, gas paid in USDC.

**73 tests** (32 Foundry + 41 Vitest), all green. No mocks in the critical path.

---

## Per-track qualification (copy into each track's submission)

### Best x402 + ERC-7710 — $3,000
Sebutkan uses **MetaMask Advanced Permissions (ERC-7715)** so the agent does **x402** payments settled by redeeming an **ERC-7710** delegation. The agent pays a real USDC micropayment to unlock the top paper; the resource verifies the payment **on-chain** (not a header stub). We also ship a **standalone x402 7710 facilitator** (`/api/facilitator/{supported,verify,settle}`) that verifies the ERC-7710 "exact" payment and settles it gaslessly on the 1Shot relayer. *Demo shows the MetaMask Smart Accounts Kit grant + x402 payment.*

### Best Agent — $3,000
An autonomous research agent operating under one scoped MetaMask permission, in the main flow. It's a **5-agent mesh** (Planner, Reader fan-out, Citation-Matcher, Fact-checker, Summarizer) with a real coordination loop (the Fact-checker can reject a weak answer and force a Researcher revision), **budget-scaled fan-out**, **relevance-weighted payouts** (Venice embeddings), and **on-chain ERC-8004 reputation** that contributors earn after settlement (verified `bumpReputation` txs).

### Best A2A coordination — $3,000
The Researcher **redelegates** strictly narrower budgets (ERC-7710) to each specialist — authority only ever shrinks. We prove a **literal two-hop redelegation** (User → Researcher → relayer, via the SDK's `createDelegation({ parentDelegation })`) **redeemed END-TO-END on Base mainnet** through 1Shot — tx [`0x9bab119c6ffd46c0a23bf14b4d7e4101ba672e4ca7d8fc5e9e8708ecde3793c8`](https://basescan.org/tx/0x9bab119c6ffd46c0a23bf14b4d7e4101ba672e4ca7d8fc5e9e8708ecde3793c8) (the redelegation chain `[redelegation, root]`, one EIP-7702 authorization, the Researcher pre-deployed as a 7702 smart account). The agents are real ERC-8004 on-chain principals (`scripts/redelegation-2hop-1shot.mjs`).

### Best use of Venice AI — $3,000
Venice is the agent's brain across **five endpoints in the main flow**: chat, **web search** (grounded citations), **embeddings** (the Citation-Matcher that weights payouts), **image** (citation-receipt card), and **TTS** (audio briefing). Private + uncensored = research anything. Qualifies via the three main tracks above.

### Best Use of 1Shot Permissionless Relayer — $1,000 USDC
We relay a **7710 transaction through the 1Shot mainnet relayer** with an **EIP-7702 authorization** upgrading the EOA to a smart account — gas paid in USDC. Proof: Base tx `0x6f4c8d53…` (type 0x4). We also built an **x402 7710 facilitator on top of the public relayer** (the track's suggested bonus direction) and wired the **Ed25519 webhook** receiver as the status source.

### Best Social Media presence — $100 × 5
See `SOCIAL.md` — posts tagging **@MetaMaskDev** that lead with the one-permission UX story (how ERC-7715 Advanced Permissions streamlined getting spending authority from the user). _Post + attach a clip._

### Best Feedback — $100 × 5
See `FEEDBACK.md` — actionable feedback on the Smart Accounts Kit, 1Shot relayer (the getStatus `hex2.startsWith` bug; the "exactly one 7702 authorization" limit), Venice, and the docs.

---

## ⚠️ Mandatory for every technical track
> "The project demo video should have a working MetaMask Smart Accounts Kit implementation." — Record the demo (per-scene script in `STORYBOARD.md`) showing: connect Flask → grant ERC-7715 → agent mesh trace → x402 + attestation on Etherscan → 1Shot relay. Without it, the technical tracks do not qualify.
