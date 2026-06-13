import { NextResponse } from "next/server";
import { putShared, getShared, isShareConfigured, shareIdForQuery } from "@/lib/store";
import { queryIdOf } from "@/lib/settlement";
import type { ResearchResult } from "@/lib/agent";

export const runtime = "nodejs";

type SharedPayload = { result: ResearchResult; savedAt: number; queryId: string };

const cap = (s: string | undefined, n: number) => (s && s.length > n ? `${s.slice(0, n)}…` : s);

/**
 * Build a bounded, shareable copy of a result. Caps long text and trims arrays so
 * the stored blob stays small (cheap on-chain, fast over KV) while keeping
 * everything the public /r page renders.
 */
function slimForShare(r: ResearchResult): ResearchResult {
  return {
    ...r,
    synthesis: cap(r.synthesis, 1800) ?? "",
    summary: cap(r.summary, 320),
    verification: cap(r.verification, 500),
    works: [],
    webCitations: (r.webCitations ?? []).slice(0, 3).map((c) => ({ title: cap(c.title, 100), url: c.url })),
    // Keep only what the public /r page renders (name, title, url, share) — drop
    // the wallet/identity/claimed fields to keep the stored blob small.
    payouts: (r.payouts ?? []).slice(0, 6).map((p) => ({
      author: "0x0000000000000000000000000000000000000000",
      authorName: p.authorName,
      workTitle: cap(p.workTitle, 90) ?? "",
      url: p.url,
      weightBps: p.weightBps,
      identity: "",
      claimed: false,
    })),
    // Trace: keep the shape (agent/action/status/budget/redelegation), drop long detail.
    agentTrace: (r.agentTrace ?? []).map((s) => ({ ...s, detail: cap(s.detail, 70) ?? "" })),
  };
}

/**
 * POST /api/share { result }  → persist a finished result, return its permalink id.
 * The id derives from the on-chain queryId, so the share link and the attestation
 * line up.
 */
export async function POST(req: Request) {
  if (!isShareConfigured()) {
    return NextResponse.json(
      { error: "sharing not configured — set KV_REST_API_URL / KV_REST_API_TOKEN (see SHARE-SETUP.md)" },
      { status: 501 },
    );
  }
  let body: { result?: ResearchResult };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON body" }, { status: 400 });
  }
  const result = body.result;
  if (!result || typeof result.query !== "string" || !result.query.trim()) {
    return NextResponse.json({ error: "result.query required" }, { status: 400 });
  }
  const id = shareIdForQuery(result.query);
  const payload: SharedPayload = { result: slimForShare(result), savedAt: Date.now(), queryId: queryIdOf(result.query) };
  try {
    await putShared(id, payload);
    return NextResponse.json({ id, path: `/r/${id}` });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 502 });
  }
}

/** GET /api/share?id=… → the stored result (used by the /r/[id] page). */
export async function GET(req: Request) {
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  if (!isShareConfigured()) return NextResponse.json({ error: "sharing not configured" }, { status: 501 });
  try {
    const data = await getShared<SharedPayload>(id);
    if (!data) return NextResponse.json({ error: "not found" }, { status: 404 });
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 502 });
  }
}
