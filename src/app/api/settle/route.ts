import { NextResponse } from "next/server";
import { operatorAttest, queryIdOf } from "@/lib/settlement";
import { getChainCapabilities } from "@/lib/oneshot";
import { PERMISSION_CHAIN } from "@/lib/chains";
import type { CitationPayout } from "@/lib/agent";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * POST /api/settle  { query, amountUSDC6, payouts, ledger, chainId? }
 *
 * Sends a REAL on-chain attestation to AttributionLedger.attest (operator-relayed),
 * recording who was cited and their share — an auditable on-chain receipt. The
 * USDC payout itself runs gasless via 1Shot (client "Pay authors gasless" button).
 * Also surfaces the live 1Shot relayer scope for the chain.
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

  const total = BigInt(body.amountUSDC6 ?? "0");
  const queryId = queryIdOf(body.query);

  // Live 1Shot relayer scope (proves real integration), best-effort.
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

  // Real on-chain attestation.
  try {
    const txHash = await operatorAttest({
      ledger: body.ledger,
      query: body.query,
      total,
      payouts: body.payouts,
    });
    const explorer = `https://sepolia.etherscan.io/tx/${txHash}`;
    return NextResponse.json({
      mode: "attested",
      queryId,
      txHash,
      explorer,
      chain: PERMISSION_CHAIN.name,
      relayer,
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : String(e), queryId, relayer },
      { status: 502 },
    );
  }
}
