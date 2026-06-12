import { NextResponse } from "next/server";
import { createPublicClient, http, parseAbiItem, type Address } from "viem";
import { PERMISSION_CHAIN } from "@/lib/chains";

export const runtime = "nodejs";

const LEDGER = process.env.NEXT_PUBLIC_ATTRIBUTION_LEDGER as Address | undefined;
const QUERY_ATTESTED = parseAbiItem(
  "event QueryAttested(bytes32 indexed queryId, address indexed payer, uint256 total, uint256 citationCount)",
);

/** GET /api/activity → recent on-chain attestations from AttributionLedger. */
export async function GET() {
  if (!LEDGER) return NextResponse.json({ events: [] });
  const rpc = process.env.NEXT_PUBLIC_SEPOLIA_RPC ?? "https://ethereum-sepolia-rpc.publicnode.com";
  const client = createPublicClient({ chain: PERMISSION_CHAIN, transport: http(rpc) });

  try {
    const latest = await client.getBlockNumber();
    const fromBlock = latest > 90_000n ? latest - 90_000n : 0n; // public RPC range cap
    const logs = await client.getLogs({ address: LEDGER, event: QUERY_ATTESTED, fromBlock, toBlock: latest });

    const events = logs
      .map((l) => ({
        queryId: l.args.queryId as string,
        payer: l.args.payer as string,
        total: (l.args.total as bigint).toString(),
        citationCount: Number(l.args.citationCount as bigint),
        block: Number(l.blockNumber),
        txHash: l.transactionHash,
      }))
      .reverse()
      .slice(0, 25);

    return NextResponse.json({ events, ledger: LEDGER });
  } catch (e) {
    return NextResponse.json({ events: [], error: e instanceof Error ? e.message : String(e) });
  }
}
