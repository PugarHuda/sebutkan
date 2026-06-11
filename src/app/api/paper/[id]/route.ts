import { NextResponse } from "next/server";
import { require402, decodePaymentHeader } from "@/lib/x402";
import { USDC } from "@/lib/chains";

export const runtime = "nodejs";

/**
 * GET /api/paper/[id]  — an x402-gated resource (premium paper full-text).
 *
 * No X-PAYMENT header  → 402 with payment requirements (USDC on Base via ERC-7710).
 * Valid X-PAYMENT      → 200 with the full text + X-PAYMENT-RESPONSE receipt.
 *
 * This is the agent's "buy the paper" step in the main research flow. The
 * payment is settled by redeeming a 7710 delegation (see settlement.ts), which
 * our facilitator relays via 1Shot.
 */
const PRICE_USDC_6 = 100_000n; // 0.10 USDC
const BASE = 8453;

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const payTo = (process.env.NEXT_PUBLIC_SESSION_ACCOUNT as `0x${string}`) ??
    "0x000000000000000000000000000000000000dEaD";
  const delegationManager =
    (process.env.NEXT_PUBLIC_DELEGATION_MANAGER as `0x${string}`) ??
    "0x0000000000000000000000000000000000000000";

  const paymentHeader = req.headers.get("X-PAYMENT");

  if (!paymentHeader) {
    return NextResponse.json(
      require402({
        amountUSDC6: PRICE_USDC_6,
        asset: USDC[BASE],
        payTo,
        resource: `/api/paper/${id}`,
        description: `Full text access for paper ${id}`,
        network: "base",
        delegationManager,
      }),
      { status: 402 },
    );
  }

  // Verify the payment shape. Full on-chain verification (simulate the 7710
  // redemption) is the facilitator's job — wired with the 1Shot relay (Day 3).
  let valid = false;
  try {
    const p = decodePaymentHeader(paymentHeader);
    valid = p.scheme === "exact" && p.payload?.method === "erc7710" && !!p.payload.permissionContext;
  } catch {
    valid = false;
  }
  if (!valid) {
    return NextResponse.json({ error: "invalid X-PAYMENT" }, { status: 402 });
  }

  return NextResponse.json(
    {
      id,
      fullText: `Full text of paper ${id}. (Demo content unlocked via x402 + ERC-7710 payment.)`,
      paid: `${Number(PRICE_USDC_6) / 1e6} USDC`,
    },
    { status: 200, headers: { "X-PAYMENT-RESPONSE": "settled" } },
  );
}
