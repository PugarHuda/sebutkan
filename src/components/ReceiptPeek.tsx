/**
 * A static, on-brand preview of a Sebutkan "Citation Receipt" for the landing
 * hero — it shows the product at a glance (a real query, the cited authors, and
 * the USDC each is owed) without needing a live run. Purely presentational.
 */
const ROWS = [
  { name: "Nuust, Heidi", pct: "36.2%" },
  { name: "Melisa Koponen", pct: "21.3%" },
  { name: "Pedro Monteros-V.", pct: "9.4%" },
  { name: "Samuli Laato", pct: "4.8%" },
];

export function ReceiptPeek() {
  return (
    <div className="float-soft relative w-full max-w-sm">
      {/* faint stacked “paper” behind, for depth */}
      <div className="absolute inset-0 -z-10 translate-x-2.5 translate-y-2.5 rounded-xl border border-[var(--rule)] bg-[var(--paper-2)]/70" />
      <div className="rounded-xl border border-[var(--rule)] bg-[var(--paper-2)] p-5 shadow-xl">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--accent)]">
            Citation Receipt
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-[var(--accent-soft)] px-2 py-0.5 text-[9px] font-medium text-[var(--accent)]">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--accent)]" />
            paid on-chain
          </span>
        </div>

        <p className="serif mt-2 text-sm leading-snug text-[var(--ink)]">
          ❝ automation tools n8n for social media content
        </p>

        <div className="mt-3 grid grid-cols-2 gap-px overflow-hidden rounded-md border border-[var(--rule)] bg-[var(--rule)]">
          <div className="bg-[var(--paper)] p-2.5 text-center">
            <div className="serif text-xl font-semibold text-[var(--accent)]">8</div>
            <div className="text-[9px] uppercase tracking-wide text-[var(--muted)]">authors cited</div>
          </div>
          <div className="bg-[var(--paper)] p-2.5 text-center">
            <div className="serif text-xl font-semibold text-[var(--accent)]">0.50</div>
            <div className="text-[9px] uppercase tracking-wide text-[var(--muted)]">USDC settled</div>
          </div>
        </div>

        <div className="mt-3 space-y-1.5">
          {ROWS.map((r) => (
            <div key={r.name} className="flex items-center gap-2 text-[11px]">
              <span className="min-w-0 flex-1 truncate text-[var(--ink)]/80">{r.name}</span>
              <span className="h-1 w-16 overflow-hidden rounded-full bg-[var(--rule)]">
                <span className="block h-full rounded-full bg-[var(--accent)]" style={{ width: r.pct }} />
              </span>
              <span className="w-10 text-right font-mono text-[var(--muted)]">{r.pct}</span>
            </div>
          ))}
          <div className="pt-0.5 text-[10px] text-[var(--muted)]">+ 4 more authors · weighted by Venice embeddings</div>
        </div>

        <div className="mt-3 flex items-center justify-between border-t border-[var(--rule)] pt-2.5 text-[9px] text-[var(--muted)]">
          <span>attestAndSplit · one tx</span>
          <span className="font-mono">0xc61adf4e… ↗</span>
        </div>
      </div>
    </div>
  );
}
