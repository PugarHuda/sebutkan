/**
 * 1Shot relayer webhook verification (Ed25519) — Sebutkan
 *
 * The relayer POSTs signed status events to our destinationUrl on every state
 * change. We verify each one against the relayer's JWKS (Ed25519, OKP) before
 * trusting the status — using webhooks as the source of truth scores higher on
 * the 1Shot track than polling.
 */
import * as ed from "@noble/ed25519";
import crypto from "node:crypto";
import stringify from "safe-stable-stringify";

ed.hashes.sha512 = (m: Uint8Array) =>
  new Uint8Array(crypto.createHash("sha512").update(Buffer.from(m)).digest());

type Jwk = { kty: string; crv: string; kid: string; x: string };

// Fetch from both relayers (testnet .dev + mainnet .com); keys are keyed by kid.
const JWKS_URLS = [
  "https://relayer.1shotapi.com/.well-known/jwks.json",
  "https://relayer.1shotapi.dev/.well-known/jwks.json",
];
const JWKS_TTL_MS = 10 * 60_000;
// kid collides across .com/.dev (both "0"), so store candidate keys per kid.
let cache: { at: number; keys: Map<string, Uint8Array[]> } | null = null;

function b64urlToBytes(s: string): Uint8Array {
  const b64 = s.replace(/-/g, "+").replace(/_/g, "/").padEnd(s.length + ((4 - (s.length % 4)) % 4), "=");
  return new Uint8Array(Buffer.from(b64, "base64"));
}

async function getKeys(force = false): Promise<Map<string, Uint8Array[]>> {
  if (!force && cache && Date.now() - cache.at < JWKS_TTL_MS) return cache.keys;
  const map = new Map<string, Uint8Array[]>();
  await Promise.all(
    JWKS_URLS.map(async (url) => {
      try {
        const res = await fetch(url);
        if (!res.ok) return;
        const { keys } = (await res.json()) as { keys: Jwk[] };
        for (const k of keys) {
          if (k.kty !== "OKP" || k.crv !== "Ed25519") continue;
          const list = map.get(k.kid) ?? [];
          list.push(b64urlToBytes(k.x));
          map.set(k.kid, list);
        }
      } catch {
        /* ignore one relayer being unreachable */
      }
    }),
  );
  cache = { at: Date.now(), keys: map };
  return map;
}

/** Verify a relayer webhook body's Ed25519 signature against the JWKS. */
export async function verifyRelayerWebhook(body: Record<string, unknown>): Promise<boolean> {
  const sigB64 = body.signature as string | undefined;
  const keyId = body.keyId as string | undefined;
  if (!sigB64 || !keyId) return false;

  let candidates = (await getKeys()).get(keyId);
  if (!candidates?.length) candidates = (await getKeys(true)).get(keyId); // rotation
  if (!candidates?.length) return false;

  const { signature: _omit, ...rest } = body;
  void _omit;
  const message = new TextEncoder().encode(stringify(rest) as string);
  const sig = new Uint8Array(Buffer.from(sigB64, "base64"));
  for (const pub of candidates) {
    try {
      if (await ed.verify(sig, message, pub)) return true;
    } catch {
      /* try next candidate */
    }
  }
  return false;
}

// ── In-memory latest-status store (survives within a server instance) ──────────
type StatusEvent = { taskId: string; status: string; txHash?: string; at: number };
const globalKey = "__SEBUTKAN_RELAYER_STATUS__";
function store(): Map<string, StatusEvent> {
  const g = globalThis as typeof globalThis & { [globalKey]?: Map<string, StatusEvent> };
  if (!g[globalKey]) g[globalKey] = new Map();
  return g[globalKey];
}
export function recordStatus(e: StatusEvent) {
  store().set(e.taskId, e);
}
export function getStoredStatus(taskId: string): StatusEvent | undefined {
  return store().get(taskId);
}
