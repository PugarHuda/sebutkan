import { NextResponse } from "next/server";
import { runResearch } from "@/lib/agent";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * POST /api/research  { query: string, papers?: number }
 * Runs the research agent (corpus + Venice) and returns synthesis + the
 * citation payout plan the agent will settle via attestAndSplit.
 */
export async function POST(req: Request) {
  let body: { query?: string; papers?: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON body" }, { status: 400 });
  }

  const query = body.query?.trim();
  if (!query) return NextResponse.json({ error: "query is required" }, { status: 400 });

  try {
    const result = await runResearch(query, { papers: body.papers });
    return NextResponse.json(result);
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
