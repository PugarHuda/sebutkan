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
type Body = {
  query: string;
  authors?: string[];
  totalUSDC?: string;
  /** The Summarizer's TL;DR — already in the question's language; spoken verbatim. */
  summary?: string;
  want?: ("image" | "audio")[];
};

export async function POST(req: Request) {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "invalid JSON body" }, { status: 400 });
  }
  if (!body.query) return NextResponse.json({ error: "query required" }, { status: 400 });

  const want = body.want ?? ["image", "audio"];
  const authorCount = body.authors?.length ?? 0;
  const total = body.totalUSDC ?? "USDC";
  const out: { image?: string; audioBase64?: string; degraded?: string } = {};

  try {
    if (want.includes("image")) {
      // Title stays English (image models render Latin text most legibly). Clean,
      // brand-consistent prompt: paper texture + emerald accent + serif heading.
      out.image = await veniceImage(
        [
          "A minimalist certificate card, portrait, on warm off-white paper texture with a thin emerald border.",
          'Large elegant serif title "Citations Paid".',
          'Small uppercase letter-spaced subtitle "SEBUTKAN".',
          `One centered line of small text: "${authorCount} authors cited · ${total} settled".`,
          "Generous whitespace, refined editorial layout, no photographs, no people, muted emerald and ink-grey palette.",
        ].join(" "),
      );
    }
    if (want.includes("audio")) {
      // Real run → speak the Summarizer's TL;DR verbatim (already written in the
      // question's language, reads cleanly). No summary (dev fallback) → a tidy
      // English briefing. Either way: one well-formed spoken paragraph.
      const briefing =
        body.summary?.trim() ||
        `Research complete. ${total} was split across ${authorCount} cited ${authorCount === 1 ? "author" : "authors"}. Every citation paid its source.`;
      const buf = await veniceSpeech(briefing);
      out.audioBase64 = Buffer.from(buf).toString("base64");
    }
    return NextResponse.json(out);
  } catch (e) {
    // Venice credit / 402 → degrade gracefully (artifacts are optional polish).
    return NextResponse.json({ degraded: e instanceof Error ? e.message : String(e) });
  }
}
