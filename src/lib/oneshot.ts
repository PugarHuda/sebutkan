/**
 * 1Shot Permissionless Relayer client — Sebutkan
 *
 * Gas abstraction for EIP-7710 smart accounts over plain JSON-RPC (no signup,
 * no API key for the public relayer). Used to relay Sebutkan's attestAndSplit /
 * author-payout transactions on MAINNET while paying gas in stablecoins
 * (USDC/USDT/USDG/MUSD), with EIP-7702 authorizations upgrading the EOA to a
 * smart account. Qualifying path for the "Best Use of 1Shot Relayer" track.
 *
 * Endpoint + method shapes verified from
 * https://1shotapi.com/docs/quickstarts/gas-sponsorship-eip7710 (2026-06-11):
 *   POST https://relayer.1shotapi.com/relayers   (Content-Type: application/json)
 *
 *   relayer_getCapabilities  params: ["<chainId>"]            → chains, payment tokens, feeCollector, targetAddress
 *   relayer_getFeeData       params: [{ chainId, token }]     → gasPrice, rate, minFee, expiry, context
 *   relayer_estimate7710Transaction params: <send shape minus context> → success, requiredPaymentAmount, gasUsed, context
 *   relayer_send7710Transaction     params: <permission context + executions + signed context + destinationUrl + taskId + memo> → TaskId
 *   relayer_getStatus        params: ["<TaskId>"]             → Pending|Submitted|Confirmed|Rejected|Reverted
 *
 * Status: prefer webhooks (destinationUrl) with Ed25519 signature verification
 * against the relayer JWKS; poll relayer_getStatus every 2-3s as fallback.
 */

const RELAYER_URL = process.env.ONESHOT_RELAYER_URL ?? "https://relayer.1shotapi.com/relayers";

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
  paymentTokens: { address: `0x${string}`; symbol: string; decimals: number }[];
  feeCollector: `0x${string}`;
  targetAddress: `0x${string}`;
  [k: string]: unknown;
};

export type FeeData = {
  gasPrice: string;
  rate: string;
  minFee: string;
  expiry: number;
  /** Opaque signed quote to pass back into send7710Transaction. */
  context: string;
};

/** Discover accepted fee tokens + collector for a chain. Always call before sending. */
export function getCapabilities(chainId: number): Promise<RelayerCapabilities> {
  return rpc<RelayerCapabilities>("relayer_getCapabilities", [String(chainId)]);
}

/** Quote the stablecoin fee. feeAmount owed = max(convertedFee, minFee). */
export function getFeeData(chainId: number, token: `0x${string}`): Promise<FeeData> {
  return rpc<FeeData>("relayer_getFeeData", [{ chainId, token }]);
}

/**
 * One execution the delegate wants to run on the user's behalf (e.g. an x402
 * USDC transfer, or attestAndSplit). Encoded calldata + target.
 */
export type Execution = { to: `0x${string}`; value?: `0x${string}`; data: `0x${string}` };

/**
 * Submit a 7710 redeem bundle through the relayer.
 *
 * GOTCHAS (verified):
 *  - Browser wallets (ERC-7715) handle the EIP-7702 upgrade automatically → DO
 *    NOT include `authorizationList`. Local/script signers include ONE entry,
 *    first-use only.
 *  - Use a fresh delegation salt per delegation to avoid replay collisions.
 *  - Serialize bigint/bytes to JSON-safe hex before sending.
 */
export type Send7710Params = {
  chainId: number;
  /** ERC-7710 permission context (from the granted ERC-7715 permission). */
  permissionContext: `0x${string}`;
  delegationManager: `0x${string}`;
  /** Calls to execute under the delegation. */
  executions: Execution[];
  /** Stablecoin used to pay gas. */
  token: `0x${string}`;
  /** Signed quote from relayer_estimate7710Transaction / getFeeData. */
  context?: string;
  /** Webhook for status (Ed25519-signed against relayer JWKS). */
  destinationUrl?: string;
  taskId?: string;
  memo?: string;
  /** Local-signer only, first-use only. Omit for browser-wallet 7702 upgrades. */
  authorizationList?: unknown[];
};

/** The relayer returns a TaskId used to track the bundle. */
export type Send7710Result = { TaskId: string };

export function send7710Transaction(params: Send7710Params): Promise<Send7710Result> {
  return rpc<Send7710Result>("relayer_send7710Transaction", [params]);
}

export type EstimateResult = {
  success: boolean;
  requiredPaymentAmount: string;
  gasUsed: Record<string, string>;
  context: string;
};

export function estimate7710Transaction(params: Omit<Send7710Params, "context">): Promise<EstimateResult> {
  return rpc<EstimateResult>("relayer_estimate7710Transaction", [params]);
}

export type RelayerStatusValue = "Pending" | "Submitted" | "Confirmed" | "Rejected" | "Reverted";
export type RelayerStatus = { status: RelayerStatusValue; txHash?: `0x${string}`; chainId?: number };

export function getStatus(taskId: string): Promise<RelayerStatus> {
  return rpc<RelayerStatus>("relayer_getStatus", [taskId]);
}

/** Poll helper for when webhooks aren't wired (every 2-3s per docs). */
export async function waitForStatus(
  taskId: string,
  opts: { intervalMs?: number; timeoutMs?: number } = {},
): Promise<RelayerStatus> {
  const interval = opts.intervalMs ?? 2500;
  const deadline = Date.now() + (opts.timeoutMs ?? 120_000);
  for (;;) {
    const s = await getStatus(taskId);
    if (s.status === "Confirmed" || s.status === "Rejected" || s.status === "Reverted") return s;
    if (Date.now() > deadline) return s;
    await new Promise((r) => setTimeout(r, interval));
  }
}
