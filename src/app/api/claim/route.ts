import { NextResponse } from "next/server";
import { getAddress, isAddress } from "viem";
import { operatorBind } from "@/lib/registry";

export const runtime = "nodejs";

/**
 * POST /api/claim  { authorId, wallet, signature }
 * An author proved wallet control by signing keccak256(authorId, wallet).
 * We verify the signature and relay the on-chain binding (author pays no gas).
 */
type Body = { authorId?: string; wallet?: string; signature?: `0x${string}` };

export async function POST(req: Request) {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "invalid JSON body" }, { status: 400 });
  }
  if (!body.authorId || !body.wallet || !body.signature) {
    return NextResponse.json({ error: "authorId, wallet, signature required" }, { status: 400 });
  }
  if (!isAddress(body.wallet)) {
    return NextResponse.json({ error: "invalid wallet address" }, { status: 400 });
  }

  try {
    const txHash = await operatorBind({
      authorId: body.authorId,
      wallet: getAddress(body.wallet),
      signature: body.signature,
    });
    return NextResponse.json({ ok: true, txHash, wallet: getAddress(body.wallet) });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    const code = message.includes("signature") ? 400 : 502;
    return NextResponse.json({ error: message }, { status: code });
  }
}
