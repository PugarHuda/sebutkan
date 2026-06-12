# Hackathon feedback (Best Feedback track) — real friction from building Sebutkan

Specific, reproducible, actionable. Each item is something that cost build time and
has a concrete fix.

## MetaMask Smart Accounts Kit / ERC-7715
1. **`create-gator-app` is deprecated and crashes on non-interactive stdin.** The
   docs still point to it. It threw `ERR_USE_AFTER_CLOSE (readline)` when a project
   name was piped. Fix: update docs to scaffold with the published
   `@metamask/smart-accounts-kit` directly, or ship a non-interactive flag.
2. **`isAdjustmentAllowed` is required on permission objects but easy to miss.** The
   `erc20-token-periodic` example reads as `{type, data}`; TS only complains at
   compile time with a non-obvious message. A one-line note in the concepts page
   ("`isAdjustmentAllowed` is required, top-level") would save time.
3. **Flask-only + Sepolia-only constraint should be louder.** It's stated, but a
   prominent callout ("Advanced Permissions need MetaMask Flask 13.9+ and the
   Snaps run on Sepolia") at the top of the quickstart would prevent a wasted
   afternoon on the wrong chain.
4. **8 supported permission types aren't listed in one place.** I had to read the
   package's d.ts to discover the full set (periodic/stream/allowance/revocation ×
   erc20/native). A table in the docs would help.

## 1Shot Permissionless Relayer
5. **The testnet relayer endpoint isn't in the main quickstart.** `relayer.1shotapi.dev`
   (Sepolia/Base Sepolia) is only in the skill's examples; the quickstart shows
   `.com`, which returns `{}` for testnets. This is the single most useful fact for a
   hackathon (test the whole flow free) — please surface it in the quickstart.
6. **`toRelayerJson` isn't exported from the SDK.** The skill defines it inline; a docs
   note that you must implement the bigint→hex serializer yourself (or export it) would
   help.
7. **`relayer_getFeeData` params are an object, but `getCapabilities` is an array.** The
   inconsistent param shape (object vs array, chainId as string) cost a debugging round.
   A schema table per method (the skill's schemas.md is great — link it from the quickstart).

## x402
8. **Facilitator chain support is a trap.** The free `x402.org/facilitator` is Base
   Sepolia only; Ethereum Sepolia (the natural MetaMask DTK testnet) isn't supported by
   any facilitator. A compatibility note in the x402+7710 guide would prevent a
   mismatch between the 7715 chain (Sepolia) and the x402 chain (Base).

## Venice
9. **A new API key has $0 balance and returns 402 with no obvious "add credits / try
   x402" hint in the error.** The error links to settings, but a one-line "or use the
   x402 wallet path (no balance needed)" would point devs to the on-brand path.
10. **Model IDs in the dashboard quickstart vs the skills differ** (`venice-uncensored`
    vs `zai-org-glm-5-1`). Listing the canonical default per modality in one place
    (the skills repo is the best source — link it from the dashboard) avoids guessing.

## Overall
- The **skills repos** (1Shot `public-relayer`, `veniceai/skills`) were the highest-signal
  docs by far — more accurate than the rendered quickstarts. Promote them harder.
- A single **"testnet end-to-end, free"** recipe (Flask + Sepolia + `.dev` relayer +
  Venice x402) would let builders prove the full loop before spending anything.
