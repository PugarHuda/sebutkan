# Sebutkan — demo video script (~3.5 min)

Goal: show a **working MetaMask Smart Accounts Kit integration in the main flow**,
then layer x402, A2A redelegation, Venice, and the 1Shot gasless relay on top.
Record in MetaMask Flask (separate profile), Base Sepolia. Live: https://sebutkan.vercel.app

---

### 0:00–0:25 — The problem
> "AI systems read the world's research and pay the authors nothing. Sebutkan flips
> that: an autonomous research agent that **cites and pays** its sources — and the
> user never hands over their keys or signs a blank cheque."

Show the landing page. One line: *non-custodial, gasless, one permission.*

### 0:25–1:10 — Qualification: ERC-7715 grant (MAIN FLOW)
- Open `/research`, connect **MetaMask Flask** (Sepolia/Base Sepolia).
- Pick a budget preset (or custom) — "10 USDC for the 24h grant" — → click **Grant budget**.
- The Flask dialog appears → approve. Show the returned **permission context** JSON.
- Say: *"One signature. An ERC-7715 Advanced Permission — an ERC-7710 delegation
  under the hood. The agent can never exceed this."*

### 1:10–1:45 — A2A redelegation (Best A2A track)
- Scroll to the **Agent mesh** tree: You → Researcher → Summarizer.
- Point at the narrowing: Summarizer ≤ 5% budget, ≤ 25% expiry, summarize-only scope.
- Say: *"The Researcher subcontracts the Summarizer by redelegating a strictly
  narrower slice. Authority only narrows — caveats tighten, never loosen."*

### 1:45–2:25 — Research + Venice + x402 (Best Agent / Venice / x402)
- Type a question → **Research**.
- Show the synthesis with the **Venice live** badge + web-search citations.
- Show the **author payout table** (who gets paid, by weight).
- Briefly show the x402 gate: `curl /api/paper/X` → **HTTP 402** challenge.
- Say: *"The agent reads with Venice — private, uncensored — and pays for paper
  access and inference via x402, settled by redeeming the ERC-7710 delegation."*

### 2:25–3:10 — 1Shot gasless payout (1Shot track)
- Click **Pay authors gasless (1Shot)**.
- Flask grant to the relayer's targetAddress → the relayer pays gas, splits USDC.
- Show the returned **TaskId** + the relayer scope (feeCollector, targetAddress).
- Open the explorer tx. Say: *"Authors paid. The user spent zero ETH — gas paid in
  USDC through the 1Shot permissionless relayer, with EIP-7702 upgrading the account."*

### 3:10–3:30 — Close
- Show the Venice **receipt card** image + play the **audio briefing** (TTS).
- Say: *"Every citation, an on-chain payment to its author. Sebutkan — cite, and pay."*

---

## Judge verification checklist (mirror in submission)

| Requirement | Where to see it |
|---|---|
| MetaMask Smart Accounts Kit in main flow | `/research` step 2 — ERC-7715 grant in Flask |
| x402 + ERC-7710 | `/api/paper` 402 challenge → **on-chain-verified** USDC payment unlocks it; payout redeems the 7710 delegation |
| A2A redelegation | Agent mesh tree; `lib/redeem.ts` grants to relayer targetAddress; `permissions.redelegateTo` |
| Venice (multi-endpoint) | chat + web-search (synthesis), image (receipt card), TTS (audio briefing) |
| 1Shot relayer (7702 + webhook) | "Pay authors gasless" → `relayer_send7710Transaction`; **Ed25519 webhook** at `/api/relayer-webhook` |
| Real on-chain attestation | "Record attestation" → live `attest()` tx (QueryAttested + AuthorPaid) on Sepolia Etherscan |
| Real author attribution | `/claim` → sign `keccak256(authorId,wallet)` → NameRegistry bind; payout table shows claimed/demo |
| Tests | `forge test` (14) + `npm test` (9) = 23 green |
| Live demo | https://sebutkan.vercel.app |

## Optional: claim flow (before the main demo, for a "real wallet" beat)
- Open `/claim`, connect, sign — bind your author id to your wallet on-chain.
- Back in `/research`, that author now shows a green **claimed** badge and is paid for real.
