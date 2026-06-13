# Sebutkan — the research agent that cites *and pays* its sources

> *Sebutkan* (Indonesian: "cite it / mention it") is an autonomous AI research agent.
> You grant **one** scoped permission; the agent buys the papers it needs, reads
> them with **Venice AI** (private & uncensored), and splits **USDC** back to every
> author it cites — **gasless**, across a redelegated multi-agent pipeline, with
> the user never signing another transaction.

Built for the **MetaMask Smart Accounts Kit × 1Shot API × Venice AI Dev Cook-Off** (June 2026).

**🔗 Live demo: https://sebutkan.vercel.app** · **Repo: https://github.com/PugarHuda/sebutkan**

**On-chain (Ethereum Sepolia):**
[`AttributionLedger`](https://sepolia.etherscan.io/address/0xE92254E3722D190ffC77C0aCa6856610708b9246) `0xE922…9246` ·
[`NameRegistry`](https://sepolia.etherscan.io/address/0xE9DC8a36e8f14c85E687eEe26978692dA98cbeab) `0xE9DC…beab` ·
[`UnclaimedEscrow`](https://sepolia.etherscan.io/address/0x851C251411Fe4F4bab586F775c7450f86A348EAD) `0x851C…8EAD` ·
[`AgentRegistry8004`](https://sepolia.etherscan.io/address/0x05465b9887D7952fAC76DF42D193aae55EbA5891) `0x0546…5891` ·
[`BountyMarket`](https://sepolia.etherscan.io/address/0xeC274B5B770e24B0Aef8aF75EAAa7fC9CF7DF5c6) `0xeC27…F5c6` ·
[`ShareRegistry`](https://sepolia.etherscan.io/address/0x52759E09d3C70ca281c59da3122a7AF8dFA51847) `0x5275…1847`
(USDC `0x1c7D…7238`). 1Shot relay via `relayer.1shotapi.dev` (testnet) / `.com` (mainnet). 73 tests (32 Foundry + 41 Vitest).

**Multi-agent orchestration (real A2A, 5 on-chain agents):** a **Planner** decomposes the question into
focused sub-questions; the Researcher redelegates strictly-narrowed sub-budgets to a **Reader fan-out**
(one parallel sub-agent per sub-question), a **Synthesizer**, and a **Fact-checker** that returns a
confidence verdict — and on *low* confidence **rejects the answer and forces a Researcher revision round**
(a genuine coordination loop, not a pipeline). A **Summarizer** condenses the verified result. Each agent
is a real ERC-8004 on-chain principal, and contributors **earn on-chain reputation** after settlement
(verified: live `bumpReputation` txs) — a feedback loop, not a static badge. The author payout can be
relayed **gasless on a mainnet** via 1Shot with an **EIP-7702** upgrade (`scripts/relay-mainnet-1shot.mjs`,
Base/Optimism/Arbitrum, ~$0.01–0.10 USDC — see [ONESHOT-MAINNET.md](./ONESHOT-MAINNET.md)).
Unclaimed author shares wait in UnclaimedEscrow (owed recorded on-chain), withdrawable after ORCID claim.
Finished runs are kept per-device (re-openable after a refresh) and can be **published to a public
permalink** (`/r/<id>`) — stored on-chain in ShareRegistry by default (zero-infra), or via Vercel KV when set.

### What's real (no mocks in the critical path)
- **Real on-chain attestation** — "Record attestation" sends a live `attest()` tx (QueryAttested + AuthorPaid events). e.g. [`0xc61adf4e…`](https://sepolia.etherscan.io/tx/0xc61adf4ee665794ef6a2588c21dd2469ff6d9855129e9d2d0501d94bd1e1c6c8)
- **Real author attribution** — `/claim`: an author signs `keccak256(authorId, wallet)`; the operator binds it on-chain in NameRegistry. Payouts route to the real claimed wallet (unclaimed → labeled demo).
- **Real x402** — the agent pays a USDC micropayment to unlock the top paper; the resource verifies the payment **on-chain** (not a header stub).
- **Real 1Shot** — live `getCapabilities`/`getFeeData`; gasless redeem builds a signed delegation to the relayer `targetAddress`; **Ed25519 webhook** receiver verifies status against the JWKS.
- **Real multi-agent coordination** — a Planner decomposes the query into a budget-scaled Reader fan-out, a **Citation-Matcher** (Venice embeddings) drives **relevance-weighted payouts**, a Fact-checker forces a Researcher revision on low confidence, and an on-chain ERC-8004 reputation feedback loop rewards contributors (verified: live `bumpReputation` txs). A **literal two-hop redelegation** (User→Researcher→relayer) can be redeemed on a mainnet via 1Shot (`scripts/test-redelegation-1shot.mjs`).
- **73 tests** — 32 Foundry + 41 Vitest, all green.

---

## Why this is different

Most "AI + crypto" agents either hold a blanket token approval or custody your funds.
Sebutkan does neither. The user signs a single **ERC-7715 Advanced Permission** — a
periodic USDC budget ("max N USDC/day, expires in 24h") — and the agent operates
**within a cryptographically enforced cap** it can never exceed. It's an honest
answer to a real problem: AI systems scrape human knowledge and pay creators nothing.
Sebutkan flips that — every citation is an on-chain payment to its author.

## How it maps to the tracks

| Track | How Sebutkan qualifies |
|---|---|
| **Qualification** | User grants an **ERC-7715** periodic-USDC permission via the MetaMask Smart Accounts Kit, in the main flow |
| **Best x402 + ERC-7710** | The agent pays for paper access **and Venice inference** via **x402**, settled by redeeming the **ERC-7710** delegation |
| **Best A2A coordination** | The Researcher **redelegates** narrowed slices to a Reader fan-out + Fact-checker + Summarizer; the Fact-checker can **reject** and force a Researcher revision round (real coordination loop). Authority only ever narrows. Contributors earn on-chain ERC-8004 reputation |
| **Best use of Venice AI** | Four Venice endpoints — chat + **web search** (grounded citations), embeddings (citation matching), image (receipt card), TTS (audio briefing). Private/uncensored = research anything |
| **Best Use of 1Shot Relayer** | Author payouts relayed via 1Shot (`.dev` testnet / `.com` mainnet), gas in stablecoins, **EIP-7702** upgrade, **Ed25519 webhook** receiver as the status source |

Real on-chain attribution lives at **`/claim`** (sign → operator-relayed NameRegistry bind).

## Architecture

```
User (MetaMask Flask)
  │ signs ONE ERC-7715 periodic-USDC permission  (Sepolia)
  ▼
Next.js app ── /research
  │
  ├─ Researcher agent  ── redeems ERC-7710 delegation
  │     ├─ buys papers via x402            (Base · USDC)
  │     ├─ reads with Venice (chat+search) (private, uncensored)
  │     └─ redelegates ↓ narrowed budget ─► Summarizer agent   (A2A)
  │
  └─ Settlement ── attestAndSplit ── relayed on MAINNET via 1Shot
        (EIP-7702 upgrade · gas in USDC · Ed25519 webhook status)
```

## Tech

- **MetaMask Smart Accounts Kit** `@metamask/smart-accounts-kit` — ERC-7715 grant, ERC-7710 redeem, native redelegation
- **Venice AI** — OpenAI-compatible API, multi-endpoint (chat+web-search, embeddings, image, TTS)
- **1Shot Permissionless Relayer** — gas abstraction over JSON-RPC, EIP-7702, webhooks
- **x402** — HTTP-402 pay-per-request, settled via ERC-7710 delegation
- Next.js · viem · wagmi · Foundry (Solidity 0.8.24)

## Docs

- **[SETUP.md](./SETUP.md)** — run locally + free testnet demo (Flask, faucets, deploy)
- **[DEMO.md](./DEMO.md)** — 3.5-min demo video script + per-track judge checklist

## Status

🚧 In active development during the hackathon. Core delegation layer
(`src/lib/permissions.ts`, `venice.ts`, `oneshot.ts`, `chains.ts`) is in place and
type-checked against the live SDK. UI flow, contracts, and 1Shot mainnet relay land next.

## Getting started

```bash
npm install
cp .env.example .env      # fill VENICE_API_KEY, ONESHOT_RELAYER_URL, SESSION_PRIVATE_KEY
npm run dev               # http://localhost:3000
```

> ERC-7715 Advanced Permissions require **MetaMask Flask 13.9.0+** in a separate
> browser profile (supporting Snaps run on Sepolia).

## License

MIT
