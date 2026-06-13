import { NextResponse } from "next/server";
import { runResearch } from "@/lib/agent";

export const runtime = "nodejs";
// Multi-agent orchestration can chain several Venice calls; give it headroom
// (Vercel caps to the plan's max, so this is safe even where it can't be honored).
export const maxDuration = 120;

/**
 * POST /api/research  { query: string, papers?: number }
 * Runs the research agent (corpus + Venice) and returns synthesis + the
 * citation payout plan the agent will settle via attestAndSplit.
 */
export async function POST(req: Request) {
  let body: { query?: string; papers?: number; fromYear?: number; toYear?: number; language?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON body" }, { status: 400 });
  }

  const query = body.query?.trim();
  if (!query) return NextResponse.json({ error: "query is required" }, { status: 400 });

  try {
    const result = await runResearch(query, {
      papers: body.papers,
      fromYear: body.fromYear,
      toYear: body.toYear,
      language: body.language,
    });
    return NextResponse.json(result);
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
