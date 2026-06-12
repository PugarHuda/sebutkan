"use client";

import { useEffect, useState } from "react";

type Ev = {
  queryId: string;
  payer: string;
  total: string;
  citationCount: number;
  block: number;
  txHash: string;
};

export default function ActivityPage() {
  const [events, setEvents] = useState<Ev[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/activity")
      .then((r) => r.json())
      .then((d) => {
        setEvents(d.events ?? []);
        if (d.error) setError(d.error);
      })
      .catch((e) => setError(String(e)));
  }, []);

  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-12">
      <p className="text-[11px] uppercase tracking-[0.15em] text-[var(--accent)]">On-chain</p>
      <h1 className="serif mt-2 text-4xl font-semibold tracking-tight">Attestation activity</h1>
      <p className="mt-3 max-w-xl text-sm leading-relaxed text-[var(--ink)]/75">
        Every research query records a public attestation on AttributionLedger (Sepolia). This is a
        live read of those <span className="serif italic">QueryAttested</span> events — proof the
        agent really cites and pays, on-chain.
      </p>

      <div className="mt-8 space-y-px overflow-hidden rounded-md border border-[var(--rule)] bg-[var(--rule)]">
        {events === null ? (
          <div className="bg-[var(--paper-2)] p-6 text-sm text-[var(--muted)]">Loading…</div>
        ) : events.length === 0 ? (
          <div className="bg-[var(--paper-2)] p-6 text-sm text-[var(--muted)]">
            No attestations yet{error ? ` (${error})` : ""}. Run a query and click “Record attestation”.
          </div>
        ) : (
          events.map((e) => (
            <a
              key={e.txHash + e.queryId}
              href={`https://sepolia.etherscan.io/tx/${e.txHash}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-between gap-4 bg-[var(--paper-2)] p-4 transition hover:bg-[var(--accent-soft)]"
            >
              <div className="min-w-0">
                <div className="font-mono text-[11px] text-[var(--muted)]">
                  {e.queryId.slice(0, 18)}…
                </div>
                <div className="mt-0.5 text-xs">
                  <span className="font-medium">{e.citationCount}</span> authors cited · payer{" "}
                  <span className="font-mono">{e.payer.slice(0, 6)}…{e.payer.slice(-4)}</span>
                </div>
              </div>
              <div className="shrink-0 text-right">
                <div className="serif text-sm font-semibold text-[var(--accent)]">
                  {(Number(e.total) / 1e6).toFixed(2)} USDC
                </div>
                <div className="text-[10px] text-[var(--muted)]">block {e.block} ↗</div>
              </div>
            </a>
          ))
        )}
      </div>
    </main>
  );
}
