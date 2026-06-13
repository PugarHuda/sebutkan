import { NextResponse } from "next/server";
import { createPublicClient, http, parseAbiItem, type Address } from "viem";
import { PERMISSION_CHAIN } from "@/lib/chains";
import { resolveBountyTopic } from "../bounty-topic/route";

export const runtime = "nodejs";

const MARKET = process.env.NEXT_PUBLIC_BOUNTY_MARKET as Address | undefined;
const CREATED = parseAbiItem(
  "event BountyCreated(uint256 indexed id, address indexed sponsor, bytes32 indexed topicHash, uint256 amount, uint64 expiresAt)",
);
const SETTLED = parseAbiItem(
  "event BountySettled(uint256 indexed id, bytes32 indexed queryId, uint256 totalPaid, uint256 authorCount)",
);

/** GET /api/bounties → open + settled bounties (on-chain). */
export async function GET() {
  if (!MARKET) return NextResponse.json({ bounties: [] });
  const rpc = process.env.NEXT_PUBLIC_SEPOLIA_RPC ?? "https://ethereum-sepolia-rpc.publicnode.com";
  const client = createPublicClient({ chain: PERMISSION_CHAIN, transport: http(rpc) });
  try {
    const latest = await client.getBlockNumber();
    const fromBlock = latest > 9_000n ? latest - 9_000n : 0n;
    const [created, settled] = await Promise.all([
      client.getLogs({ address: MARKET, event: CREATED, fromBlock, toBlock: latest }),
      client.getLogs({ address: MARKET, event: SETTLED, fromBlock, toBlock: latest }),
    ]);
    const settledIds = new Set(settled.map((l) => String(l.args.id)));
    const base = created
      .map((l) => ({
        id: String(l.args.id),
        sponsor: l.args.sponsor as string,
        topicHash: l.args.topicHash as string,
        amount: (l.args.amount as bigint).toString(),
        expiresAt: Number(l.args.expiresAt as bigint),
        settled: settledIds.has(String(l.args.id)),
        txHash: l.transactionHash,
      }))
      .reverse()
      .slice(0, 25);
    // Resolve the readable topic for each bounty (kept off-chain by topicHash).
    const bounties = await Promise.all(
      base.map(async (b) => ({ ...b, topic: await resolveBountyTopic(b.topicHash) })),
    );
    return NextResponse.json({ bounties, market: MARKET });
  } catch (e) {
    return NextResponse.json({ bounties: [], error: e instanceof Error ? e.message : String(e) });
  }
}
