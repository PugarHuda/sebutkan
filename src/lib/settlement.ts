/**
 * Settlement — Sebutkan
 *
 * Turns a research result's payout plan into the on-chain `attestAndSplit` call,
 * and packages it as an Execution that a session account redeems under its
 * ERC-7710 delegation — gasless on mainnet via the 1Shot relayer.
 */
import { encodeFunctionData, keccak256, toHex, type Address } from "viem";
import type { CitationPayout } from "./agent";
import type { Execution7710 } from "./oneshot";

/** Minimal ABI for AttributionLedger.attestAndSplit. */
export const ATTRIBUTION_LEDGER_ABI = [
  {
    type: "function",
    name: "attestAndSplit",
    stateMutability: "nonpayable",
    inputs: [
      { name: "queryId", type: "bytes32" },
      { name: "amount", type: "uint256" },
      {
        name: "cites",
        type: "tuple[]",
        components: [
          { name: "author", type: "address" },
          { name: "weightBps", type: "uint16" },
        ],
      },
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
