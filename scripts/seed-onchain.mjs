/**
 * Seed realistic on-chain attestation data for the demo (Sepolia).
 *
 * Mixes both settlement modes so the Activity page reflects reality:
 *   - attestAndSplit → REAL USDC transfer to authors (operator approves + pays).
 *   - attest         → records each author's owed share (settled separately via 1Shot).
 *
 * Varied cases: 1–4 authors, different topics, amounts, and recurring authors so
 * the leaderboard accumulates. Idempotent-ish: a queryId already attested is skipped.
 *
 * Run: node scripts/seed-onchain.mjs   (reads OPERATOR_PRIVATE_KEY + NEXT_PUBLIC_* from env)
 */
import {
  createPublicClient,
  createWalletClient,
  http,
  keccak256,
  toHex,
  getAddress,
  erc20Abi,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { sepolia } from "viem/chains";

const RPC = process.env.NEXT_PUBLIC_SEPOLIA_RPC ?? "https://ethereum-sepolia-rpc.publicnode.com";
const LEDGER = getAddress(process.env.NEXT_PUBLIC_ATTRIBUTION_LEDGER);
const USDC = getAddress(process.env.NEXT_PUBLIC_USDC ?? "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238");
const opKey = process.env.OPERATOR_PRIVATE_KEY;
if (!opKey) throw new Error("set OPERATOR_PRIVATE_KEY");

const account = privateKeyToAccount(opKey);
const pub = createPublicClient({ chain: sepolia, transport: http(RPC) });
const wallet = createWalletClient({ account, chain: sepolia, transport: http(RPC) });

const LEDGER_ABI = [
  { type: "function", name: "attest", stateMutability: "nonpayable", inputs: [{ name: "queryId", type: "bytes32" }, { name: "total", type: "uint256" }, { name: "cites", type: "tuple[]", components: [{ name: "author", type: "address" }, { name: "weightBps", type: "uint16" }] }], outputs: [] },
  { type: "function", name: "attestAndSplit", stateMutability: "nonpayable", inputs: [{ name: "queryId", type: "bytes32" }, { name: "amount", type: "uint256" }, { name: "cites", type: "tuple[]", components: [{ name: "author", type: "address" }, { name: "weightBps", type: "uint16" }] }], outputs: [] },
  { type: "function", name: "attested", stateMutability: "view", inputs: [{ name: "", type: "bytes32" }], outputs: [{ type: "bool" }] },
];

// Deterministic author wallet from a name (mirrors the app's demoWallet idea).
function authorAddr(name) {
  let h = 0n;
  for (const ch of name) h = (h * 131n + BigInt(ch.charCodeAt(0))) % (1n << 160n);
  if (h === 0n) h = 1n;
  return getAddress(`0x${h.toString(16).padStart(40, "0")}`);
}

// Build citations with even weights summing to exactly 10000.
function cites(names) {
  const n = names.length;
  const base = Math.floor(10000 / n);
  return names.map((nm, i) => ({
    author: authorAddr(nm),
    weightBps: i === n - 1 ? 10000 - base * (n - 1) : base,
  }));
}

const usdc6 = (x) => BigInt(Math.round(x * 1e6));

// Recurring authors (accumulate across papers) + unique ones → realistic leaderboard.
const CASES = [
  { mode: "split", topic: "perovskite solar cell operational stability", usdc: 0.20, authors: ["A. Nakamura", "L. Rossi"] },
  { mode: "attest", topic: "CRISPR off-target effects in vivo", usdc: 0.30, authors: ["A. Nakamura", "P. Sharma", "M. Chen"] },
  { mode: "attest", topic: "LLM hallucination mitigation via retrieval", usdc: 0.10, authors: ["S. Okafor"] },
  { mode: "split", topic: "surface-code quantum error correction thresholds", usdc: 0.15, authors: ["L. Rossi", "M. Chen", "P. Sharma", "K. Adebayo"] },
  { mode: "attest", topic: "enzymatic ocean microplastic degradation", usdc: 0.25, authors: ["S. Okafor", "A. Nakamura"] },
  { mode: "attest", topic: "thermostable mRNA vaccine formulation", usdc: 0.40, authors: ["P. Sharma", "M. Chen", "K. Adebayo", "L. Rossi"] },
];

const splitTotal = CASES.filter((c) => c.mode === "split").reduce((s, c) => s + c.usdc, 0);

async function main() {
  console.log("operator:", account.address, "| ledger:", LEDGER);
  const bal = await pub.readContract({ address: USDC, abi: erc20Abi, functionName: "balanceOf", args: [account.address] });
  console.log("operator USDC:", (Number(bal) / 1e6).toFixed(4), "| needed for real transfers:", splitTotal.toFixed(2));

  // Approve once for the attestAndSplit (real-transfer) cases.
  if (splitTotal > 0) {
    const allowance = await pub.readContract({ address: USDC, abi: erc20Abi, functionName: "allowance", args: [account.address, LEDGER] });
    if (allowance < usdc6(splitTotal)) {
      console.log("approving USDC…");
      const tx = await wallet.writeContract({ address: USDC, abi: erc20Abi, functionName: "approve", args: [LEDGER, usdc6(splitTotal + 0.01)] });
      await pub.waitForTransactionReceipt({ hash: tx });
      console.log("  approved:", tx);
    }
  }

  for (const c of CASES) {
    const queryId = keccak256(toHex(c.topic));
    const already = await pub.readContract({ address: LEDGER, abi: LEDGER_ABI, functionName: "attested", args: [queryId] });
    if (already) { console.log(`skip (already attested): "${c.topic}"`); continue; }
    const cs = cites(c.authors);
    const fn = c.mode === "split" ? "attestAndSplit" : "attest";
    try {
      const tx = await wallet.writeContract({ address: LEDGER, abi: LEDGER_ABI, functionName: fn, args: [queryId, usdc6(c.usdc), cs] });
      await pub.waitForTransactionReceipt({ hash: tx });
      console.log(`✓ ${fn.padEnd(13)} ${c.usdc.toFixed(2)} USDC · ${c.authors.length} authors · "${c.topic.slice(0, 40)}" → ${tx}`);
    } catch (e) {
      console.log(`✗ ${fn} "${c.topic.slice(0, 40)}": ${e instanceof Error ? e.message.slice(0, 120) : e}`);
    }
  }
  console.log("done.");
}
main();
