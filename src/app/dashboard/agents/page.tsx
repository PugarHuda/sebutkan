import Link from "next/link";
import { AGENT_MESH } from "@/lib/agents";

export const metadata = { title: "Agents — Sebutkan" };

export default function AgentsPage() {
  const agents = AGENT_MESH.filter((a) => a.id !== "user");

  return (
    <main className="mx-auto w-full max-w-3xl px-8 py-10">
      <p className="text-[11px] uppercase tracking-[0.15em] text-[var(--accent)]">Multi-agent system</p>
      <h1 className="serif mt-1 text-3xl font-semibold tracking-tight">Agents</h1>
      <p className="mt-2 max-w-xl text-sm leading-relaxed text-[var(--ink)]/70">
        Sebutkan is a mesh of specialized agents. The Researcher holds your granted permission and
        <span className="serif italic"> redelegates</span> strictly narrower budgets to each
        specialist — authority only ever shrinks (ERC-7710). Each runs on Venice.
      </p>

      <div className="mt-7 space-y-px overflow-hidden rounded-lg border border-[var(--rule)] bg-[var(--rule)]">
        {agents.map((a) => (
          <div key={a.id} className="bg-[var(--paper-2)] p-5">
            <div className="flex items-center justify-between">
              <h2 className="serif text-lg font-semibold">{a.label}</h2>
              <span className="rounded bg-[var(--accent-soft)] px-2 py-0.5 font-mono text-[11px] text-[var(--accent)]">
                ≤ {(a.budgetFraction * 100).toFixed(0)}% budget · ≤ {(a.expiryFraction * 100).toFixed(0)}% expiry
              </span>
            </div>
            <p className="mt-1 text-sm text-[var(--ink)]/70">{a.blurb}</p>
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {a.caveats.map((c) => (
                <span
                  key={c}
                  className="rounded border border-[var(--rule)] px-2 py-0.5 text-[10px] text-[var(--muted)]"
                >
                  {c}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>

      <p className="mt-6 text-xs text-[var(--muted)]">
        Each agent follows the{" "}
        <a href="https://eips.ethereum.org/EIPS/eip-8004" target="_blank" rel="noreferrer" className="link-accent">
          ERC-8004 Trustless Agents
        </a>{" "}
        shape — a named identity with capabilities + a trust method (ORCID for authors, redelegation
        caveats for agents). See the live chain in{" "}
        <Link href="/dashboard/research" className="link-accent">
          Research
        </Link>
        .
      </p>
    </main>
  );
}
