/**
 * A compact "one run, end to end" preview for the landing page — shows a real
 * sample query flowing through the agent mesh (the steps light up in sequence)
 * and the resulting author payout. Reinforces the product right below the hero.
 * Static/presentational; the live version lives on /dashboard/research.
 */

const STEPS = [
  { icon: "🧭", label: "Planner", sub: "splits the question" },
  { icon: "📖", label: "Readers ×3", sub: "read with Venice" },
  { icon: "🧠", label: "Citation-Matcher", sub: "ranks by embeddings" },
  { icon: "✓", label: "Fact-checker", sub: "confidence: high" },
  { icon: "💸", label: "Settle", sub: "0.50 USDC, one tx" },
];

const PAYOUT = [
  { name: "Nuust, Heidi", pct: 36.2 },
  { name: "Melisa Koponen", pct: 21.3 },
  { name: "Pedro Monteros-V.", pct: 9.4 },
  { name: "Samuli Laato", pct: 4.8 },
];

export function AgentTracePreview() {
  return (
    <div className="overflow-hidden rounded-2xl border border-[var(--rule)] bg-[var(--paper-2)]/90 shadow-sm backdrop-blur-sm">
      <div className="flex flex-col gap-1 border-b border-[var(--rule)] px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-[var(--accent)]">One run, end to end</p>
          <h2 className="serif mt-0.5 text-xl font-semibold">From a question to a payment</h2>
        </div>
        <span className="serif max-w-xs truncate text-sm italic text-[var(--ink)]/70">
          ❝ automation tools n8n for social media content
        </span>
      </div>

      <div className="grid gap-6 px-6 py-6 lg:grid-cols-[1.4fr_1fr]">
        {/* the agent mesh, lighting up step by step */}
        <div>
          <div className="flex flex-col gap-2">
            {STEPS.map((s, i) => (
              <div
                key={s.label}
                className="trace-step flex items-center gap-3 rounded-lg border px-3 py-2"
                style={{ animationDelay: `${i * 1.1}s` }}
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--accent-soft)] text-sm">
                  {s.icon}
                </span>
                <span className="flex min-w-0 flex-1 flex-wrap items-baseline gap-x-2">
                  <span className="text-sm font-medium text-[var(--ink)]">{s.label}</span>
                  <span className="text-[11px] text-[var(--muted)]">{s.sub}</span>
                </span>
                <span className="font-mono text-[10px] text-[var(--muted)]">{i + 1}/5</span>
              </div>
            ))}
          </div>
          <p className="mt-3 text-[11px] text-[var(--muted)]">
            Authority only ever narrows — each agent redelegates a smaller slice (ERC-7710).
          </p>
        </div>

        {/* the resulting payout */}
        <div className="rounded-xl border border-[var(--rule)] bg-[var(--paper)] p-4">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-[var(--muted)]">Author payout</span>
            <span className="rounded-full bg-[var(--accent-soft)] px-2 py-0.5 text-[10px] font-medium text-[var(--accent)]">
              8 authors · 0.50 USDC
            </span>
          </div>
          <div className="mt-3 space-y-2">
            {PAYOUT.map((p) => (
              <div key={p.name} className="flex items-center gap-2 text-[11px]">
                <span className="min-w-0 flex-1 truncate text-[var(--ink)]/80">{p.name}</span>
                <span className="h-1.5 w-20 overflow-hidden rounded-full bg-[var(--rule)]">
                  <span className="block h-full rounded-full bg-[var(--accent)]" style={{ width: `${p.pct}%` }} />
                </span>
                <span className="w-10 text-right font-mono text-[var(--muted)]">{p.pct}%</span>
              </div>
            ))}
            <div className="pt-0.5 text-[10px] text-[var(--muted)]">+ 4 more · weighted by Venice embeddings</div>
          </div>
          <div className="mt-3 border-t border-[var(--rule)] pt-2 text-[10px] text-[var(--muted)]">
            attestAndSplit · paid on-chain · no relayer fee
          </div>
        </div>
      </div>
    </div>
  );
}
