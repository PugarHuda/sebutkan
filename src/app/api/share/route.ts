import { NextResponse } from "next/server";
import { putShared, getShared, isShareConfigured, shareIdForQuery } from "@/lib/store";
import { queryIdOf } from "@/lib/settlement";
import type { ResearchResult } from "@/lib/agent";

export const runtime = "nodejs";

type SharedPayload = { result: ResearchResult; savedAt: number; queryId: string };

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
  const payload: SharedPayload = { result, savedAt: Date.now(), queryId: queryIdOf(result.query) };
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
