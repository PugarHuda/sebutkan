/**
 * 1Shot Permissionless Relayer client — Sebutkan
 *
 * Gas abstraction for EIP-7710 smart accounts over plain JSON-RPC (no signup).
 * Used to relay Sebutkan's attestAndSplit / author-payout transactions on
 * MAINNET while paying gas in stablecoins (USDC/USDT/USDG/MUSD), with EIP-7702
 * authorizations upgrading the EOA to a smart account. This is the qualifying
 * path for the "Best Use of 1Shot Permissionless Relayer" track.
 *
 * Verified method names (from 1Shot relayer docs):
 *   relayer_getCapabilities            — supported chains + accepted fee tokens (DO NOT hardcode)
 *   relayer_getFeeData                 — current fee rate; feeAmount = max(convertedFee, minFee)
 *   relayer_estimate7710Transaction    — estimate before sending
 *   relayer_send7710Transaction        — submit fee-payment + execution bundle (single chain)
 *   relayer_getStatus                  — poll status (fallback to webhooks)
 *   relayer_send7710TransactionMultichain / relayer_estimate7710TransactionMultichain
 *
 * Status tracking: prefer webhooks (destinationUrl) with Ed25519 signature
 * verification against the relayer JWKS; poll relayer_getStatus every 2-3s as fallback.
 *
 * NOTE: set ONESHOT_RELAYER_URL from https://1shotapi.com/docs/quickstarts/gas-sponsorship-eip7710
 * Confirm exact param object shapes against the live docs before mainnet submit.
 */

const RELAYER_URL = process.env.ONESHOT_RELAYER_URL ?? "https://relayer.1shotapi.com/rpc";

let _id = 0;

async function rpc<T>(method: string, params: unknown[]): Promise<T> {
  const res = await fetch(RELAYER_URL, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: ++_id, method, params }),
  });
  if (!res.ok) throw new Error(`1Shot ${method} HTTP ${res.status}: ${await res.text()}`);
  const json = (await res.json()) as { result?: T; error?: { code: number; message: string } };
  if (json.error) throw new Error(`1Shot ${method} RPC ${json.error.code}: ${json.error.message}`);
  return json.result as T;
}

export type RelayerCapabilities = {
  chains: {
    chainId: number;
    feeTokens: { address: `0x${string}`; symbol: string; decimals: number; minFee?: string }[];
  }[];
};

export type FeeData = {
  token: `0x${string}`;
  rate: string; // wei-of-token per gas unit (chain/token specific)
  minFee: string;
};

/** Discover supported chains + accepted fee tokens. Always call before sending. */
export function getCapabilities(): Promise<RelayerCapabilities> {
  return rpc<RelayerCapabilities>("relayer_getCapabilities", []);
}

export function getFeeData(chainId: number, feeToken: `0x${string}`): Promise<FeeData> {
  return rpc<FeeData>("relayer_getFeeData", [{ chainId, feeToken }]);
}

/**
 * Submit a 7710 redeem bundle through the relayer.
 *
 * GOTCHAS (verified):
 *  - Browser wallets handle the EIP-7702 upgrade automatically → DO NOT include
 *    `authorizationList` in that case. Local signers include ONE entry, first-use only.
 *  - Use a fresh delegation salt per delegation to avoid replay collisions.
 *  - Serialize bigint/bytes to JSON-safe hex before sending.
 */
export type Send7710Params = {
  chainId: number;
  to: `0x${string}`;
  data: `0x${string}`;
  value?: `0x${string}`;
  feeToken: `0x${string}`;
  /** Webhook URL for status updates (Ed25519-signed against relayer JWKS). */
  destinationUrl?: string;
  /** Local-signer only, first-use only. Omit for browser-wallet 7702 upgrades. */
  authorizationList?: unknown[];
};

export type Send7710Result = { transactionId: string; txHash?: `0x${string}` };

export function send7710Transaction(params: Send7710Params): Promise<Send7710Result> {
  return rpc<Send7710Result>("relayer_send7710Transaction", [params]);
}

export type RelayerStatus = {
  transactionId: string;
  status: "pending" | "submitted" | "confirmed" | "failed";
  txHash?: `0x${string}`;
  chainId?: number;
};

export function getStatus(transactionId: string): Promise<RelayerStatus> {
  return rpc<RelayerStatus>("relayer_getStatus", [{ transactionId }]);
}

/** Poll helper for when webhooks aren't wired (every 2-3s per docs). */
export async function waitForStatus(
  transactionId: string,
  opts: { intervalMs?: number; timeoutMs?: number } = {},
): Promise<RelayerStatus> {
  const interval = opts.intervalMs ?? 2500;
  const deadline = Date.now() + (opts.timeoutMs ?? 120_000);
  for (;;) {
    const s = await getStatus(transactionId);
    if (s.status === "confirmed" || s.status === "failed") return s;
    if (Date.now() > deadline) return s;
    await new Promise((r) => setTimeout(r, interval));
  }
}
