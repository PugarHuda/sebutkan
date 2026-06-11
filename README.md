# Sebutkan — the research agent that cites *and pays* its sources

> *Sebutkan* (Indonesian: "cite it / mention it") is an autonomous AI research agent.
> You grant **one** scoped permission; the agent buys the papers it needs, reads
> them with **Venice AI** (private & uncensored), and splits **USDC** back to every
> author it cites — **gasless**, across a redelegated multi-agent pipeline, with
> the user never signing another transaction.

Built for the **MetaMask Smart Accounts Kit × 1Shot API × Venice AI Dev Cook-Off** (June 2026).

**🔗 Live demo: https://sebutkan.vercel.app** · **Repo: https://github.com/PugarHuda/sebutkan**

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
| **Best A2A coordination** | The Researcher agent **redelegates** a *narrowed* slice of its permission to a Summarizer agent — authority only narrows |
| **Best use of Venice AI** | Four Venice endpoints — chat + **web search** (grounded citations), embeddings (citation matching), image (receipt card), TTS (audio briefing). Private/uncensored = research anything |
| **Best Use of 1Shot Relayer** | Author payouts are relayed on **mainnet** via 1Shot, gas paid in stablecoins, **EIP-7702** account upgrade, **webhook** status |

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
