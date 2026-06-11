import { NextResponse } from "next/server";
import { buildSettlementExecution, queryIdOf } from "@/lib/settlement";
import { getChainCapabilities } from "@/lib/oneshot";
import type { CitationPayout } from "@/lib/agent";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * POST /api/settle
 * Body: { query, amountUSDC6, payouts, ledger, chainId? }
 *
 * Builds the attestAndSplit execution that pays cited authors and surfaces the
 * live 1Shot relayer scope (targetAddress = delegation delegate, feeCollector,
 * accepted fee tokens) for the selected chain. The signed-delegation relay
 * (estimate → context → send7710Transaction) is wired in the redemption flow.
 */
type Body = {
  query: string;
  amountUSDC6: string;
  payouts: CitationPayout[];
  ledger: `0x${string}`;
  chainId?: number;
};

export async function POST(req: Request) {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "invalid JSON body" }, { status: 400 });
  }
  if (!body.query || !body.ledger || !Array.isArray(body.payouts) || !body.payouts.length) {
    return NextResponse.json({ error: "query, ledger, payouts required" }, { status: 400 });
  }

  const amount = BigInt(body.amountUSDC6 ?? "0");
  const execution = buildSettlementExecution({
    ledger: body.ledger,
    query: body.query,
    amount,
    payouts: body.payouts,
  });
  const queryId = queryIdOf(body.query);

  // Prove the live 1Shot integration: discover the relayer scope for the chain.
  const chainId = body.chainId ?? 1;
  let relayer: { targetAddress: string; feeCollector: string; feeTokens: string[] } | null = null;
  try {
    const caps = await getChainCapabilities(chainId);
    if (caps) {
      relayer = {
        targetAddress: caps.targetAddress,
        feeCollector: caps.feeCollector,
        feeTokens: caps.tokens.map((t) => t.symbol),
      };
    }
  } catch {
    relayer = null;
  }

  return NextResponse.json({ mode: "execution", queryId, execution, chainId, relayer });
}
