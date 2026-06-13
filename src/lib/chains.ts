/**
 * Chain configuration — Sebutkan
 *
 * Multi-chain by necessity (embrace it, don't fight it):
 *  - Ethereum Sepolia  → ERC-7715 Advanced Permissions stage (MetaMask Flask;
 *                        supporting Snaps are historically Sepolia-only).
 *  - Base              → x402 + Venice settle in USDC on Base.
 *  - Mainnet           → ONE real 1Shot relayer tx + EIP-7702 (1Shot track).
 *    (confirm the exact supported mainnet via relayer_getCapabilities)
 */
import { mainnet, sepolia, base, baseSepolia } from "viem/chains";

export const CHAINS = { mainnet, sepolia, base, baseSepolia } as const;

/** Chain where we request/redeem ERC-7715 Advanced Permissions. */
export const PERMISSION_CHAIN = sepolia;

/** Chain where x402 + Venice payments settle. */
export const PAYMENT_CHAIN = base;

/**
 * Cheap L2 mainnet for the ONE real 1Shot relay the "Best 1Shot Relayer" track
 * requires (relay 7710 + EIP-7702 on a *mainnet* relayer). Base gas is cents, so
 * the qualifying relay costs ~$0.01–0.10 in USDC. Verified live: 1Shot `.com`
 * serves Base (8453), Optimism (10), and Arbitrum (42161). See scripts/relay-mainnet-1shot.mjs.
 */
export const ONESHOT_MAINNET_CHAIN = base;

/** USDC token addresses per chain (6 decimals). */
export const USDC: Record<number, `0x${string}`> = {
  // Base mainnet
  8453: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
  // Base Sepolia (x402 hosted facilitator testnet)
  84532: "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
  // Ethereum Sepolia (test USDC for 7715 budget demos)
  11155111: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238",
  // Ethereum mainnet
  1: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
};

export const USDC_DECIMALS = 6;

/** Convert a human USDC amount (e.g. 2.5) to base units (bigint). */
export function usdc(amount: number): bigint {
  return BigInt(Math.round(amount * 10 ** USDC_DECIMALS));
}
