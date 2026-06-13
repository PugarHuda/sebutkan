# Social posts — Sebutkan (#BestSocialMediaPresence)

Tag **@MetaMaskDev** (https://x.com/MetaMaskDev). Lead with the one-permission UX story —
that's exactly what the track rewards. Live: https://sebutkan.vercel.app · Repo: https://github.com/PugarHuda/sebutkan

---

## 1) Single hero tweet (pin this)

> AI scrapes human research and pays the authors nothing.
>
> So I built **Sebutkan** 🪙 — a research agent that *cites AND pays* its sources.
>
> You sign **ONE** @MetaMaskDev Advanced Permission (ERC-7715). The agent buys papers, reads them with @venice_ai, and splits USDC back to every author it cites — gasless, and it can never overspend your cap.
>
> Built for the MetaMask Smart Accounts Kit × 1Shot × Venice Dev Cook-Off.
> 🔗 sebutkan.vercel.app
>
> #MetaMask #SmartAccounts #x402 (attach a 20-30s screen-cap of the grant → research → payout)

---

## 2) Thread (journey + how Advanced Permissions improved UX)

**1/**
Most "AI + crypto" agents make you approve a blanket token allowance or hand over custody. That's terrifying for an *autonomous* agent that spends on its own.

I wanted the opposite. Meet **Sebutkan** — the research agent that cites *and pays* its sources. 🧵

**2/**
The whole UX hinges on @MetaMaskDev **Advanced Permissions (ERC-7715)**.

The user signs **once**: "max 10 USDC/day, expires in 24h." That's it. No per-action popups, no blanket approval, no custody. The agent operates inside a cryptographically enforced cap it *cannot* exceed.

This is the cleanest agent-permission UX I've used.

**3/**
What the agent does under that one permission:
• searches a real paper corpus (OpenAlex)
• pays to unlock the top paper via **x402** (on-chain USDC, verified — not a stub)
• reads + reasons with **@venice_ai** (private, uncensored) across 5 endpoints: chat, web-search, embeddings, image, TTS

**4/**
It's not one agent — it's a **mesh**. The Researcher **redelegates** strictly narrower budgets (ERC-7710) to a Planner → parallel Readers → a Fact-checker → a Summarizer. Authority only ever *shrinks*.

The Fact-checker can even reject a weak answer and force a revision. Real A2A coordination, on-chain principals (ERC-8004).

**5/**
Then every cited author gets paid. The payout is relayed **gasless on Base mainnet** via the **1Shot** permissionless relayer — a real EIP-7710 redeem with an **EIP-7702** account upgrade, gas paid in USDC.

Proof tx 👉 basescan.org/tx/0x6f4c8d539f9ea34f7e6e0d0730e4ae04fec1d986e5d0641b8b36ab00c6e8480c

**6/**
Authors who haven't claimed yet? Their share is recorded on-chain and waits in escrow until they prove their **ORCID** (OAuth) + wallet with one signature. The operator relays the binding — the author pays zero gas.

**7/**
Everything's live and verifiable:
🔗 app: sebutkan.vercel.app
📜 6 contracts on Sepolia + a Base-mainnet 1Shot relay
🧪 73 tests, no mocks in the critical path
💻 github.com/PugarHuda/sebutkan

One signature. An agent that pays the people it learns from. @MetaMaskDev × @venice_ai × 1Shot. /end

---

## 3) Follow-up "build in public" posts (consistency scores too)

- "Today I made the Fact-checker agent able to *reject* the Researcher and force a revision round — a real coordination loop, not a pipeline. Here's the live agent trace 👇 @MetaMaskDev"
- "TIL the 1Shot relayer wants exactly ONE EIP-7702 authorization per relay — so a 2-hop redelegation needs a pre-deployed intermediate. Shipped the single-hop mainnet relay: gas paid in USDC, zero ETH. @MetaMaskDev"
- "ERC-7715 Advanced Permissions = the first agent-spending UX I'd actually trust. One signed budget, hard cap, expiry, full custody. No blanket approvals. @MetaMaskDev"

---

## Posting tips
- Attach media to #1 and the thread — a 20-30s screen capture of: grant budget (Flask) → research (agent trace) → record attestation (Etherscan) → Venice receipt. Visuals score.
- Post the thread, then space the follow-ups over a couple days (frequency + consistency are judged).
- Always tag **@MetaMaskDev**; add @venice_ai where Venice is the focus.
- Pin the hero tweet.
