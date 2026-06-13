/**
 * Shared-result store — Sebutkan (public permalinks)
 *
 * Persists a finished research result server-side so anyone can open it at
 * /r/<id>. Backed by Upstash Redis over its REST API (the same store Vercel KV
 * provisions). Config is read from either naming convention:
 *   - Vercel KV:     KV_REST_API_URL        + KV_REST_API_TOKEN
 *   - Upstash direct: UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN
 *
 * If neither is set, `isShareConfigured()` is false and the API returns a clear
 * "sharing not configured" message instead of throwing — the rest of the app is
 * unaffected. Results are stored with a 90-day TTL.
 */

import { queryIdOf } from "./settlement";

/** Public share id for a query — first 8 bytes of the same queryId attested on-chain. */
export function shareIdForQuery(query: string): string {
  return queryIdOf(query).slice(2, 18);
}

const URL_ENV = process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL;
const TOKEN_ENV = process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN;

const TTL_SECONDS = 90 * 24 * 60 * 60; // 90 days
const PREFIX = "share:";

/** True when a Redis/KV backend is configured. */
export function isShareConfigured(): boolean {
  return Boolean(URL_ENV && TOKEN_ENV);
}

/** Run one Redis command via the Upstash REST API. */
async function command(args: (string | number)[]): Promise<unknown> {
  if (!URL_ENV || !TOKEN_ENV) throw new Error("sharing is not configured");
  const res = await fetch(URL_ENV, {
    method: "POST",
    headers: { authorization: `Bearer ${TOKEN_ENV}`, "content-type": "application/json" },
    body: JSON.stringify(args),
    // Always hit the store; never serve a stale CDN copy.
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`KV ${args[0]} HTTP ${res.status}: ${await res.text()}`);
  const json = (await res.json()) as { result?: unknown; error?: string };
  if (json.error) throw new Error(`KV ${args[0]}: ${json.error}`);
  return json.result;
}

/** Store a JSON-serializable value under a share id (90-day TTL). */
export async function putShared(id: string, value: unknown): Promise<void> {
  await command(["SET", PREFIX + id, JSON.stringify(value), "EX", TTL_SECONDS]);
}

/** Retrieve a stored value by share id, or null if missing/expired. */
export async function getShared<T = unknown>(id: string): Promise<T | null> {
  const raw = (await command(["GET", PREFIX + id])) as string | null;
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}
