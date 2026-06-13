/**
 * Agent memory — Sebutkan
 *
 * A lightweight recall layer so the agent isn't amnesiac: every completed research
 * run is remembered (topic + a one-line takeaway), and the Planner recalls related
 * prior runs before decomposing a new question. Backed by Vercel KV / Upstash when
 * configured (robust across serverless instances), with an in-memory fallback so
 * the feature works out of the box within a warm instance.
 *
 * The matching (keyword extraction + Jaccard relatedness) is pure and unit-tested.
 */

const URL_ENV = process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL;
const TOKEN_ENV = process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN;
const KEY = "agent:memory";
const MAX = 100;

export type Memory = { query: string; takeaway: string; at: number; keywords: string[] };

const STOPWORDS = new Set(
  "the a an of to in on for and or is are be how what which why when where who does do can will with by from as at into over under most effective best new using use".split(
    " ",
  ),
);

/** Extract significant keywords from a query. Pure + testable. */
export function keywordsOf(query: string): string[] {
  return [
    ...new Set(
      query
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, " ")
        .split(/\s+/)
        .filter((w) => w.length > 2 && !STOPWORDS.has(w)),
    ),
  ];
}

/** Jaccard overlap of two keyword sets, 0–1. Pure + testable. */
export function relatedness(a: string[], b: string[]): number {
  if (!a.length || !b.length) return 0;
  const A = new Set(a);
  const B = new Set(b);
  let inter = 0;
  for (const x of A) if (B.has(x)) inter++;
  return inter / (A.size + B.size - inter);
}

/** Rank prior memories by relatedness to a query (≥ threshold). Pure + testable. */
export function rankRelated(query: string, memories: Memory[], threshold = 0.18, limit = 3): Memory[] {
  const kw = keywordsOf(query);
  return memories
    .map((m) => ({ m, score: relatedness(kw, m.keywords) }))
    .filter((x) => x.score >= threshold && x.m.query.toLowerCase() !== query.toLowerCase())
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((x) => x.m);
}

// ── Store (KV when configured, else in-memory per instance) ──────────────────
function mem(): Memory[] {
  const g = globalThis as typeof globalThis & { __SEBUTKAN_MEMORY__?: Memory[] };
  if (!g.__SEBUTKAN_MEMORY__) g.__SEBUTKAN_MEMORY__ = [];
  return g.__SEBUTKAN_MEMORY__;
}
async function kv(args: (string | number)[]): Promise<unknown> {
  const res = await fetch(URL_ENV!, {
    method: "POST",
    headers: { authorization: `Bearer ${TOKEN_ENV}`, "content-type": "application/json" },
    body: JSON.stringify(args),
    cache: "no-store",
  });
  const j = (await res.json()) as { result?: unknown };
  return j.result;
}
const kvOn = () => Boolean(URL_ENV && TOKEN_ENV);

/** Load all memories (most-recent-first). */
export async function loadMemories(): Promise<Memory[]> {
  if (!kvOn()) return [...mem()].sort((a, b) => b.at - a.at);
  try {
    const raw = (await kv(["GET", KEY])) as string | null;
    const arr = raw ? (JSON.parse(raw) as Memory[]) : [];
    return arr.sort((a, b) => b.at - a.at);
  } catch {
    return [];
  }
}

/** Remember a completed run (deduped by query). Best-effort. */
export async function remember(query: string, takeaway: string, nowMs: number = Date.now()): Promise<void> {
  const entry: Memory = { query: query.trim(), takeaway: takeaway.slice(0, 200), at: nowMs, keywords: keywordsOf(query) };
  if (!entry.query) return;
  const key = entry.query.toLowerCase();
  if (!kvOn()) {
    const a = mem();
    const i = a.findIndex((m) => m.query.toLowerCase() === key);
    if (i >= 0) a.splice(i, 1);
    a.unshift(entry);
    if (a.length > MAX) a.length = MAX;
    return;
  }
  try {
    const raw = (await kv(["GET", KEY])) as string | null;
    const arr = (raw ? (JSON.parse(raw) as Memory[]) : []).filter((m) => m.query.toLowerCase() !== key);
    arr.unshift(entry);
    await kv(["SET", KEY, JSON.stringify(arr.slice(0, MAX))]);
  } catch {
    /* best-effort */
  }
}

/** Recall prior runs related to a query. */
export async function recall(query: string, limit = 3): Promise<Memory[]> {
  return rankRelated(query, await loadMemories(), 0.18, limit);
}
