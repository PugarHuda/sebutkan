# 1Shot Mainnet Relay — qualifying the "Best Use of 1Shot Permissionless Relayer" track ($1,000)

The track has two hard requirements:

1. **Relay a 7710 transaction through the 1Shot Permissionless _mainnet_ relayer** (`relayer.1shotapi.com`).
2. **Use a 7702 authorization** to upgrade the account to a smart account through the relayer.

Testnet (`relayer.1shotapi.dev`) does **not** qualify. But we don't need expensive Ethereum
mainnet — 1Shot's `.com` relayer also serves cheap **L2 mainnets** (verified live: Base 8453,
Optimism 10, Arbitrum 42161). On **Base** the whole relay costs **~$0.01–0.10 in USDC** and
**zero native ETH** (gas is paid as a USDC transfer to the relayer's `feeCollector` inside the bundle).

> **Two birds, one run:** `scripts/test-redelegation-1shot.mjs` (default Base mainnet) does a real
> **two-hop redelegation** (User → Researcher → relayer, authority only narrows) *and* relays it via
> 1Shot with EIP-7702 — so a single ~$0.02 run is on-chain proof for **both** the "Best A2A coordination"
> and "Best 1Shot Relayer" tracks. Needs two throwaway keys; only the USER key holds a little USDC.
> Run: `USER_PRIVATE_KEY=0x... RESEARCHER_PRIVATE_KEY=0x... node scripts/test-redelegation-1shot.mjs`
> (verified live to the funds guard: chain Base, relayer `.com`, both hops signed, 7702 for both signers).

`scripts/relay-mainnet-1shot.mjs` performs the simpler single-hop qualifying flow:
EOA → **EIP-7702 authorization** (upgrade to MetaMask Stateless7702 smart account) →
**ERC-7710 delegation** (delegate = relayer `targetAddress`) → `relayer_send7710Transaction` on
**Base mainnet** → poll to `Confirmed` → real mainnet txHash.

## One-time: fund a throwaway wallet on Base mainnet

You need a wallet holding a small amount of **USDC on Base** (`0x8335…2913`). ~**0.05 USDC** is plenty.

- Bridge/withdraw a couple cents of USDC to Base (e.g. from an exchange that supports Base
  withdrawals, or bridge.base.org). You do **not** need any ETH — the relayer sponsors gas.
- Note the wallet's private key (use a fresh throwaway key, not the operator key).

## Run the relay

```bash
cd sebutkan
DELEGATOR_PRIVATE_KEY=0x<throwaway-key-holding-base-usdc> node scripts/relay-mainnet-1shot.mjs
```

Optional overrides:

```bash
CHAIN_ID=10            # Optimism instead of Base (or 42161 Arbitrum)
WORK_USDC=0.01         # amount transferred to DESTINATION (default 0.01)
DESTINATION=0x...      # who receives the work transfer (default 0xdead)
RPC_URL=https://...    # custom RPC for the chosen chain
```

Expected output (the parts that prove the track):

```
chain: Base (8453) | relayer: https://relayer.1shotapi.com/relayers
targetAddress: 0x26a529124f0bbf9af9d8f9f84a43efe47cf1199a | feeCollector: 0xE936e8FAf4A5655469182A49a505055B71C17604
EIP-7702 authorization signed → impl: 0x...      ← 7702 upgrade
✅ relayer_send7710Transaction OK — TaskId: ...    ← 7710 relay on mainnet
status: {"status":"Confirmed","txHash":"0x..."}    ← real Base mainnet tx
🔗 mainnet tx: 0x...
```

## For the demo video (track judges)

Show, in the main flow:
1. the terminal running the script — the **`EIP-7702 authorization signed`** line, then
2. the **`relayer_send7710Transaction OK`** + **`Confirmed`** with the **`txHash`**, then
3. open that txHash on **basescan.org** — a real mainnet 7710 relay, gas paid in USDC.

Record the txHash here once you've run it:

```
Base mainnet relay tx: 0x________________________________________________________________
```

> Pre-flight verified (2026-06-13): with an unfunded key the script reaches `getCapabilities` +
> `getFeeData` on Base mainnet and reports `feeAmount: 10000` (0.01 USDC) before the funds guard —
> so the only thing standing between you and the $1k track is ~$0.05 of USDC on Base.
