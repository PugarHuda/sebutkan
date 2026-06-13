import Link from "next/link";
import { getShared, isShareConfigured } from "@/lib/store";
import type { ResearchResult } from "@/lib/agent";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type SharedPayload = { result: ResearchResult; savedAt: number; queryId: string };

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isShareConfigured()) return { title: "Sebutkan — shared research" };
  const data = await getShared<SharedPayload>(id).catch(() => null);
  const q = data?.result.query;
  return {
    title: q ? `${q.slice(0, 60)} — Sebutkan` : "Sebutkan — shared research",
    description: data?.result.summary?.slice(0, 160) ?? "An AI research agent that cites and pays its sources.",
  };
}

export default async function SharedResultPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  if (!isShareConfigured()) {
    return (
      <Shell>
        <p className="text-sm text-[var(--muted)]">
          Public sharing isn’t configured on this deployment. The author can still re-open this run from
          their own device (Research → Recent research).
        </p>
      </Shell>
    );
  }

  const data = await getShared<SharedPayload>(id).catch(() => null);
  if (!data) {
    return (
      <Shell>
        <h1 className="serif text-2xl font-semibold">Not found</h1>
        <p className="mt-2 text-sm text-[var(--muted)]">
          This shared result has expired or never existed.{" "}
          <Link href="/dashboard/research" className="link-accent underline">
            Run your own →
          </Link>
        </p>
      </Shell>
    );
  }

  const { result, savedAt, queryId } = data;
  const trace = result.agentTrace ?? [];

  return (
    <Shell>
      <div className="flex items-center justify-between gap-3">
        <p className="text-[11px] uppercase tracking-[0.15em] text-[var(--accent)]">Shared research</p>
        <span
          className={`rounded-full px-2.5 py-0.5 text-[10px] font-medium ${
            result.venice === "live"
              ? "bg-emerald-100 text-emerald-700"
              : "bg-amber-100 text-amber-700"
          }`}
        >
          {result.venice === "live" ? "● Venice live" : "● Venice fallback"}
        </span>
      </div>
      <h1 className="serif mt-1 text-3xl font-semibold tracking-tight">{result.query}</h1>
      <p className="mt-1 text-[11px] text-[var(--muted)]">
        Saved {new Date(savedAt).toUTCString()} ·{" "}
        {result.confidence ? `confidence: ${result.confidence} · ` : ""}
        {result.rounds && result.rounds > 1 ? `${result.rounds} rounds · ` : ""}
        <Link href="/dashboard/activity" className="link-accent underline" title={queryId}>
          on-chain attestation ↗
        </Link>
      </p>

      {result.summary ? (
        <div className="mt-6 rounded-md bg-[var(--paper-2)] p-4">
          <h2 className="text-[10px] font-medium uppercase tracking-wide text-[var(--muted)]">TL;DR</h2>
          <p className="mt-1 text-sm font-medium leading-relaxed">{result.summary}</p>
        </div>
      ) : null}

      <article className="mt-6 whitespace-pre-wrap rounded-md bg-[var(--paper-2)] p-4 text-sm leading-relaxed text-[var(--ink)]/90">
        {result.synthesis}
      </article>

      {result.verification ? (
        <div className="mt-5 rounded-md border-l-2 border-[var(--accent)] bg-[var(--accent-soft)] p-4">
          <h3 className="serif text-sm font-semibold text-[var(--accent)]">❝ Fact-checker agent</h3>
          <p className="mt-1 whitespace-pre-wrap text-xs leading-relaxed text-[var(--ink)]/80">{result.verification}</p>
        </div>
      ) : null}

      {trace.length ? (
        <div className="mt-6 rounded-md border border-[var(--rule)] p-4">
          <h3 className="serif text-sm font-semibold">Multi-agent trace</h3>
          <ol className="mt-3 space-y-1.5">
            {trace.map((s, i) => (
              <li key={i} className="flex items-start gap-2.5 text-[11px]" style={{ marginLeft: s.redelegation ? "16px" : "0" }}>
                <span
                  className={`mt-0.5 inline-block h-1.5 w-1.5 shrink-0 rounded-full ${
                    s.status === "rejected"
                      ? "bg-red-500"
                      : s.status === "revised"
                        ? "bg-indigo-500"
                        : s.status === "skipped"
                          ? "bg-neutral-300"
                          : "bg-emerald-500"
                  }`}
                />
                <div>
                  <span className="font-medium">{s.label}</span> <span className="text-[var(--muted)]">· {s.action}</span>
                  {s.redelegation ? <span className="ml-1 text-[var(--accent)]">↳ redelegated</span> : null}
                  {typeof s.budgetUSDC === "number" ? (
                    <span className="ml-1 font-mono text-[10px] text-emerald-600">≤ {s.budgetUSDC.toFixed(2)} USDC</span>
                  ) : null}
                  <p className="text-[var(--ink)]/70">{s.detail}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      ) : null}

      {result.payouts?.length ? (
        <div className="mt-6">
          <h3 className="text-xs font-medium text-[var(--muted)]">Author payout plan — every citation pays its author</h3>
          <table className="mt-2 w-full text-left text-xs">
            <thead className="text-neutral-400">
              <tr>
                <th className="py-1 font-normal">Author</th>
                <th className="font-normal">Paper</th>
                <th className="text-right font-normal">Share</th>
              </tr>
            </thead>
            <tbody>
              {result.payouts.map((p, i) => (
                <tr key={i} className="border-t border-[var(--rule)]">
                  <td className="py-2 pr-2 font-medium">{p.authorName}</td>
                  <td className="max-w-[200px] truncate pr-2" title={p.workTitle}>
                    <a href={p.url} target="_blank" rel="noreferrer" className="text-blue-600 underline decoration-dotted">
                      {p.workTitle}
                    </a>
                  </td>
                  <td className="text-right font-mono font-medium text-emerald-600">{(p.weightBps / 100).toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      <footer className="mt-10 flex items-center justify-between border-t border-[var(--rule)] pt-4 text-[11px] text-[var(--muted)]">
        <span>
          Generated by{" "}
          <Link href="/" className="link-accent font-medium underline">
            Sebutkan
          </Link>{" "}
          — the research agent that cites <em>and pays</em> its sources.
        </span>
        <Link href="/dashboard/research" className="rounded-md bg-[var(--accent)] px-3 py-1.5 font-medium text-white">
          Run your own →
        </Link>
      </footer>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-dvh bg-[var(--paper)]">
      <div className="mx-auto w-full max-w-3xl px-6 py-12">{children}</div>
    </main>
  );
}
