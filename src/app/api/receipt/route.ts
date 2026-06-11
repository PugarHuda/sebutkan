import { NextResponse } from "next/server";
import { veniceImage, veniceSpeech } from "@/lib/venice";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * POST /api/receipt  { query, authors: string[], totalUSDC }
 * Produces the post-settlement artifacts using two more Venice endpoints:
 *   - image/generate → a "citation receipt" card
 *   - audio/speech   → a spoken briefing
 * Together with chat + web-search this gives Sebutkan 4 Venice endpoints.
 */
type Body = { query: string; authors?: string[]; totalUSDC?: string; want?: ("image" | "audio")[] };

export async function POST(req: Request) {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "invalid JSON body" }, { status: 400 });
  }
  if (!body.query) return NextResponse.json({ error: "query required" }, { status: 400 });

  const want = body.want ?? ["image", "audio"];
  const authors = (body.authors ?? []).slice(0, 6).join(", ");
  const out: { image?: string; audioBase64?: string; degraded?: string } = {};

  try {
    if (want.includes("image")) {
      out.image = await veniceImage(
        `Minimalist certificate card titled "Sebutkan — Citations Paid". Subtitle: research on ${body.query}. ` +
          `Elegant, paper texture, emerald accent, lists ${body.authors?.length ?? 0} cited authors.`,
      );
    }
    if (want.includes("audio")) {
      const buf = await veniceSpeech(
        `Research complete on ${body.query}. ${body.totalUSDC ?? "USDC"} was split across ` +
          `${body.authors?.length ?? 0} cited authors: ${authors}. Every citation paid its source.`,
      );
      out.audioBase64 = Buffer.from(buf).toString("base64");
    }
    return NextResponse.json(out);
  } catch (e) {
    // Venice credit / 402 → degrade gracefully (artifacts are optional polish).
    return NextResponse.json({ degraded: e instanceof Error ? e.message : String(e) });
  }
}
