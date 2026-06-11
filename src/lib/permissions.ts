/**
 * ERC-7715 Advanced Permissions + ERC-7710 redemption — Sebutkan
 *
 * The qualification gate for the hackathon. Flow:
 *   1. User (in MetaMask Flask) grants ONE scoped permission: a periodic USDC
 *      budget — "the agent may spend max N USDC per period". This maps directly
 *      from Kutip's SpendingIntent. Granting is an EIP-712 signature that
 *      creates an ERC-7710 delegation (off-chain, gasless).
 *   2. The agent's session account redeems that delegation (ERC-7710) to pay for
 *      papers / Venice inference via x402, and to run attestAndSplit.
 *   3. For A2A: the Researcher redelegates a NARROWER slice of its permission
 *      context to the Summarizer (authority only narrows).
 *
 * Supported permission types in @metamask/smart-accounts-kit@1.6.0 (8 total):
 *   erc20-token-periodic, erc20-token-stream, erc20-token-allowance,
 *   erc20-token-revocation, native-token-periodic, native-token-stream,
 *   native-token-allowance, token-approval-revocation.
 * Sebutkan uses erc20-token-periodic for the USDC budget.
 *
 * ⚠️ Requires MetaMask Flask 13.5.0+ (13.9.0+ auto-upgrades the EOA to a smart
 * account). Run Flask in a separate browser profile.
 */
import type { WalletClient } from "viem";
import {
  erc7715ProviderActions,
  erc7710WalletActions,
  redelegatePermissionContextAction,
  type PermissionRequestParameter,
  type GetGrantedExecutionPermissionsResult,
} from "@metamask/smart-accounts-kit/actions";
import { PERMISSION_CHAIN, USDC, usdc } from "./chains";

export type BudgetParams = {
  /** Session account that will redeem (the agent's account). */
  sessionAccount: `0x${string}`;
  /** Per-period spend cap, in human USDC (e.g. 10 = 10 USDC). */
  perPeriodUSDC: number;
  /** Period length in seconds (e.g. 86400 = one day). */
  periodSeconds: number;
  /** Permission expiry (unix seconds). */
  expiry: number;
  chainId?: number;
};

/**
 * Construct the ERC-7715 request for a periodic USDC budget.
 * Pass the result to `requestBudgetPermission`.
 */
export function buildBudgetRequest(p: BudgetParams): PermissionRequestParameter[] {
  const chainId = p.chainId ?? PERMISSION_CHAIN.id;
  const tokenAddress = USDC[chainId];
  if (!tokenAddress) throw new Error(`No USDC address configured for chain ${chainId}`);

  return [
    {
      chainId,
      to: p.sessionAccount,
      expiry: p.expiry,
      redeemer: [p.sessionAccount],
      permission: {
        type: "erc20-token-periodic",
        isAdjustmentAllowed: false,
        data: {
          periodAmount: usdc(p.perPeriodUSDC),
          periodDuration: p.periodSeconds,
          tokenAddress,
          justification: "Sebutkan research agent budget — pays paper access & splits USDC to cited authors",
        },
      },
    },
  ];
}

/**
 * Client-side: ask MetaMask (Flask) to grant the budget permission.
 * Returns the granted permission contexts (permissionsContext + delegationManager)
 * that the session account later redeems.
 */
export async function requestBudgetPermission(
  walletClient: WalletClient,
  params: BudgetParams,
): Promise<GetGrantedExecutionPermissionsResult> {
  const client = walletClient.extend(erc7715ProviderActions());
  return client.requestExecutionPermissions(buildBudgetRequest(params));
}

/**
 * Session-account side (EOA): redeem a granted delegation to execute a call on
 * the user's behalf. Sends to the DelegationManager. Use for x402 payments and
 * for attestAndSplit when not relaying via 1Shot.
 */
export async function redeemWithDelegation(
  sessionWallet: WalletClient,
  args: {
    permissionsContext: `0x${string}`;
    delegationManager: `0x${string}`;
    to: `0x${string}`;
    data: `0x${string}`;
    value?: bigint;
    accountMetadata?: unknown;
  },
): Promise<`0x${string}`> {
  const client = sessionWallet.extend(erc7710WalletActions());
  return client.sendTransactionWithDelegation({
    permissionsContext: args.permissionsContext,
    delegationManager: args.delegationManager,
    to: args.to,
    data: args.data,
    value: args.value ?? 0n,
    accountMetadata: args.accountMetadata as never,
  } as never);
}

/**
 * A2A redelegation: the Researcher redelegates a (narrowed) slice of its granted
 * permission context to the Summarizer agent. Authority only narrows — the
 * Summarizer can never redeem more than the Researcher was granted.
 */
export async function redelegateTo(
  researcherWallet: WalletClient,
  args: { to: `0x${string}`; permissionsContext: `0x${string}`; delegationManager: `0x${string}` },
): Promise<unknown> {
  const client = researcherWallet.extend(() => ({
    redelegatePermissionContext: redelegatePermissionContextAction,
  }));
  // Exact call shape is finalized when wiring the A2A UI (Day 3).
  return (client as unknown as { redelegatePermissionContext: typeof redelegatePermissionContextAction })
    .redelegatePermissionContext;
}
