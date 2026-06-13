# Vercel KV — unlocks 3 features (~2 min, one-time)

Provisioning a tiny Upstash/Vercel KV makes three serverless features robust across instances:
1. **Public share links** (`/r/<id>`) — also works on-chain by default (no KV needed), KV just makes it faster.
2. **Agent memory** — the Planner recalls related prior research across requests (without KV it only persists within one warm serverless instance).
3. **1Shot webhook status** — the verified webhook status survives across instances.

All three are fully coded + unit-tested; KV is purely a runtime persistence config. Set
`KV_REST_API_URL` + `KV_REST_API_TOKEN` (or `UPSTASH_REDIS_REST_URL`/`_TOKEN`) and redeploy.

---

# Public share links — one-time setup (~2 min)

The **4 · Share public link** button persists a finished research result server-side and returns a
permalink (`/r/<id>`) anyone can open — synthesis, TL;DR, multi-agent trace, and payout plan, read-only.
The id derives from the same `queryId` that's attested on-chain, so the link and the attestation line up.

It's backed by a tiny Redis (Upstash). Until you provision one, the button degrades gracefully
(returns "sharing not configured"); everything else — including the per-device **Recent research**
history — works without it.

## Provision (Vercel dashboard)

1. Vercel project → **Storage** → **Create Database** → **Upstash for Redis** (Marketplace) → Create.
2. **Connect** it to the `sebutkan` project. Vercel auto-injects the env vars:
   `KV_REST_API_URL` and `KV_REST_API_TOKEN` (the code also accepts
   `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN`).
3. **Redeploy** (`npx vercel deploy --prod --yes`) so the running build picks up the vars.

That's it. No code change — `src/lib/store.ts` reads either naming convention.

## Local dev

Add to `.env`:

```
KV_REST_API_URL=https://<your-db>.upstash.io
KV_REST_API_TOKEN=<token>
```

## Verify

```bash
# should return {"id":"...","path":"/r/..."} once KV is configured
curl -s -X POST https://sebutkan.vercel.app/api/share \
  -H 'content-type: application/json' \
  -d '{"result":{"query":"test","synthesis":"hello","venice":"live","webCitations":[],"works":[],"payouts":[],"x402":{"paid":false}}}'
```

Then open the returned `/r/<id>` in any browser (no wallet needed).

> Results are stored with a 90-day TTL. The store only ever holds research outputs you explicitly
> choose to share — nothing is uploaded automatically.
