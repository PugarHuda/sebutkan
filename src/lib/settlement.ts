/**
 * Settlement — Sebutkan
 *
 * Turns a research result's payout plan into the on-chain `attestAndSplit` call,
 * and packages it as an Execution that a session account redeems under its
 * ERC-7710 delegation — gasless on mainnet via the 1Shot relayer.
 */
import { createWalletClient, encodeFunctionData, http, keccak256, toHex, type Address } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import type { CitationPayout } from "./agent";
import type { Execution7710 } from "./oneshot";
import { PERMISSION_CHAIN } from "./chains";

const CITES_COMPONENT = {
  name: "cites",
  type: "tuple[]",
  components: [
    { name: "author", type: "address" },
    { name: "weightBps", type: "uint16" },
  ],
} as const;

/** Minimal ABI for AttributionLedger (attestAndSplit + record-only attest). */
export const ATTRIBUTION_LEDGER_ABI = [
  {
    type: "function",
    name: "attestAndSplit",
    stateMutability: "nonpayable",
    inputs: [
      { name: "queryId", type: "bytes32" },
      { name: "amount", type: "uint256" },
      CITES_COMPONENT,
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "attest",
    stateMutability: "nonpayable",
    inputs: [
      { name: "queryId", type: "bytes32" },
      { name: "total", type: "uint256" },
      CITES_COMPONENT,
    ],
    outputs: [],
  },
] as const;

/** Deterministic on-chain id for a query string. */
export function queryIdOf(query: string): `0x${string}` {
  return keccak256(toHex(query));
}

/** Build the attestAndSplit calldata for a payout plan. */
export function encodeAttestAndSplit(args: {
  query: string;
  amount: bigint;
  payouts: CitationPayout[];
}): `0x${string}` {
  const cites = args.payouts.map((p) => ({
    author: p.author as Address,
    weightBps: p.weightBps,
  }));
  return encodeFunctionData({
    abi: ATTRIBUTION_LEDGER_ABI,
    functionName: "attestAndSplit",
    args: [queryIdOf(args.query), args.amount, cites],
  });
}

/** Package the settlement as a single Execution7710 for the 1Shot relayer / redeem. */
export function buildSettlementExecution(args: {
  ledger: `0x${string}`;
  query: string;
  amount: bigint;
  payouts: CitationPayout[];
}): Execution7710 {
  return {
    target: args.ledger,
    value: "0",
    data: encodeAttestAndSplit(args),
  };
}

/**
 * Operator-relayed on-chain attestation. Records the citation on AttributionLedger
 * (record-only `attest`, no funds moved) so there is a real, auditable on-chain
 * receipt of who was cited and their share. The payout itself is the separate
 * gasless 1Shot transfer path. Returns the tx hash.
 */
export async function operatorAttest(args: {
  ledger: `0x${string}`;
  query: string;
  total: bigint;
  payouts: CitationPayout[];
}): Promise<`0x${string}`> {
  const opKey = process.env.OPERATOR_PRIVATE_KEY as `0x${string}` | undefined;
  if (!opKey) throw new Error("OPERATOR_PRIVATE_KEY not configured");
  const rpc = process.env.NEXT_PUBLIC_SEPOLIA_RPC ?? "https://ethereum-sepolia-rpc.publicnode.com";
  const account = privateKeyToAccount(opKey);
  const wallet = createWalletClient({ account, chain: PERMISSION_CHAIN, transport: http(rpc) });
  const cites = args.payouts.map((p) => ({ author: p.author as Address, weightBps: p.weightBps }));
  return wallet.writeContract({
    address: args.ledger,
    abi: ATTRIBUTION_LEDGER_ABI,
    functionName: "attest",
    args: [queryIdOf(args.query), args.total, cites],
  });
}

/** ERC-20 transfer calldata (for the fee execution to the relayer's feeCollector). */
export function encodeErc20Transfer(to: `0x${string}`, amount: bigint): `0x${string}` {
  return encodeFunctionData({
    abi: [
      {
        type: "function",
        name: "transfer",
        stateMutability: "nonpayable",
        inputs: [
          { name: "to", type: "address" },
          { name: "amount", type: "uint256" },
        ],
        outputs: [{ type: "bool" }],
      },
    ],
    functionName: "transfer",
    args: [to, amount],
  });
}
