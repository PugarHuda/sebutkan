# Sebutkan — HackQuest submission

**Tagline:** The research agent that cites *and pays* its sources.

**One-liner:** Grant one scoped MetaMask permission; an AI agent buys papers, reads
them with Venice, and splits USDC back to every author it cites — gasless,
non-custodial, with a real on-chain attestation of every citation.

**Live demo:** https://sebutkan.vercel.app · **Repo:** https://github.com/PugarHuda/sebutkan
**Demo video:** <paste link> · **Chain:** Ethereum Sepolia

---

## What it is

AI systems read the world's research and pay the creators nothing. Sebutkan flips
that. The user signs a single **ERC-7715 Advanced Permission** — a periodic USDC
budget — and from then on an autonomous research agent operates within a
cryptographically enforced cap it can never exceed. For each question it:

1. searches a real corpus (OpenAlex),
2. pays a small **x402** micropayment to unlock the top paper (verified on-chain),
3. reads + synthesizes with **Venice** (private, uncensored) + web-search citations,
4. computes a weighted payout to each cited author,
5. records a **real on-chain attestation** and pays the authors **gasless via 1Shot**.

Authors bind their real wallet at `/claim` (sign `keccak256(authorId, wallet)`,
operator-relayed NameRegistry bind); unclaimed authors get a clearly-labeled demo
wallet. The user keeps custody and never signs again.

## Track-by-track

- **Best x402 + ERC-7710** — the agent pays an x402 micropayment to unlock a paper;
  the resource verifies the USDC payment **on-chain** (not a header stub). Author
  payouts redeem the granted ERC-7710 delegation via 1Shot. x402's ERC-7710 method
  is spec-sanctioned and uniquely multi-use.
- **Best Agent** — the whole product is an autonomous agent whose ERC-7715 permission
  is the centre of the UX ("one signature, then it runs within your cap").
- **Best A2A coordination** — the Researcher **redelegates** a strictly narrower slice
  (≤5% budget, ≤25% expiry, scoped) to a Summarizer sub-agent; authority only narrows.
- **Best use of Venice AI** — four endpoints, each in the main flow: chat + web-search
  (synthesis with citations), image (citation receipt card), TTS (audio briefing).
  Private/uncensored is the enabler.
- **Best Use of 1Shot Relayer** — gasless author payouts via `relayer_send7710Transaction`
  (`.dev` testnet / `.com` mainnet), gas paid in stablecoins, EIP-7702 upgrade, and an
  **Ed25519 webhook** receiver (`/api/relayer-webhook`) as the status source of truth.

## What's real (verifiable)

- On-chain attestation: live `attest()` tx (QueryAttested + AuthorPaid events) —
  e.g. `0xc61adf4ee665794ef6a2588c21dd2469ff6d9855129e9d2d0501d94bd1e1c6c8`.
- `AttributionLedger` `0xE92254E3722D190ffC77C0aCa6856610708b9246` ·
  `NameRegistry` `0xE9DC8a36e8f14c85E687eEe26978692dA98cbeab` (Ethereum Sepolia).
- 23 tests (14 Foundry + 9 Vitest), production build + live deploy.

## Tech

MetaMask Smart Accounts Kit (`@metamask/smart-accounts-kit`) · 1Shot Permissionless
Relayer · Venice AI · x402 · Next.js 16 · viem · wagmi · Foundry (Solidity 0.8.24).

## Reproduce

See [SETUP.md](./SETUP.md). The research flow runs free (OpenAlex + Venice dev
fallback); ERC-7715 + redeem need MetaMask Flask on Sepolia; the 1Shot mainnet relay
needs ~$2 USDC on Base.
