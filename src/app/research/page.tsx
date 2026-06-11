"use client";

import { useState } from "react";
import { useAccount, useConnect, useDisconnect, useWalletClient } from "wagmi";
import { requestBudgetPermission, type BudgetParams } from "@/lib/permissions";
import { PERMISSION_CHAIN } from "@/lib/chains";
import type { ResearchResult } from "@/lib/agent";
import { AGENT_MESH, narrowedFor } from "@/lib/agents";

type ResearchState =
  | { status: "idle" }
  | { status: "running" }
  | { status: "done"; result: ResearchResult }
  | { status: "error"; message: string };

type SettleState =
  | { status: "idle" }
  | { status: "settling" }
  | { status: "done"; result: unknown }
  | { status: "error"; message: string };

// Dev session account (the agent's account that redeems delegations).
// In production this is the Researcher agent's smart account.
const SESSION_ACCOUNT =
  (process.env.NEXT_PUBLIC_SESSION_ACCOUNT as `0x${string}`) ??
  "0x000000000000000000000000000000000000dEaD";

type GrantState =
  | { status: "idle" }
  | { status: "granting" }
  | { status: "granted"; context: unknown }
  | { status: "error"; message: string };

export default function ResearchPage() {
  const { address, isConnected, chainId } = useAccount();
  const { connectors, connect, isPending: connecting } = useConnect();
  const { disconnect } = useDisconnect();
  const { data: walletClient } = useWalletClient();

  const [perDay, setPerDay] = useState(10);
  const [expiryHours, setExpiryHours] = useState(24);
  const [grant, setGrant] = useState<GrantState>({ status: "idle" });

  const [query, setQuery] = useState("");
  const [research, setResearch] = useState<ResearchState>({ status: "idle" });
  const [settle, setSettle] = useState<SettleState>({ status: "idle" });

  async function handleSettle() {
    if (research.status !== "done") return;
    setSettle({ status: "settling" });
    try {
      const ledger =
        (process.env.NEXT_PUBLIC_ATTRIBUTION_LEDGER as string) ??
        "0x0000000000000000000000000000000000000000";
      const res = await fetch("/api/settle", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          query: research.result.query,
          amountUSDC6: "500000", // 0.5 USDC demo spend split across authors
          payouts: research.result.payouts,
          ledger,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? `HTTP ${res.status}`);
      setSettle({ status: "done", result: json });
    } catch (e) {
      setSettle({ status: "error", message: e instanceof Error ? e.message : String(e) });
    }
  }

  async function handleResearch() {
    if (!query.trim()) return;
    setResearch({ status: "running" });
    try {
      const res = await fetch("/api/research", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ query }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? `HTTP ${res.status}`);
      setResearch({ status: "done", result: json as ResearchResult });
    } catch (e) {
      setResearch({ status: "error", message: e instanceof Error ? e.message : String(e) });
    }
  }

  const onWrongChain = isConnected && chainId !== PERMISSION_CHAIN.id;

  async function handleGrant() {
    if (!walletClient) return;
    setGrant({ status: "granting" });
    try {
      const params: BudgetParams = {
        sessionAccount: SESSION_ACCOUNT,
        perPeriodUSDC: perDay,
        periodSeconds: 86_400,
        expiry: Math.floor(Date.now() / 1000) + expiryHours * 3600,
        chainId: PERMISSION_CHAIN.id,
      };
      const granted = await requestBudgetPermission(walletClient, params);
      setGrant({ status: "granted", context: granted });
    } catch (e) {
      setGrant({ status: "error", message: e instanceof Error ? e.message : String(e) });
    }
  }

  return (
    <main className="mx-auto w-full max-w-2xl px-6 py-12">
      <header className="mb-10">
        <h1 className="text-3xl font-semibold tracking-tight">Sebutkan</h1>
        <p className="mt-2 text-sm text-neutral-500">
          The research agent that cites <span className="italic">and pays</span> its sources.
          Grant one scoped budget — the agent does the rest, gasless, non-custodial.
        </p>
      </header>

      {/* 1. Connect */}
      <section className="mb-8 rounded-xl border border-neutral-200 p-5 dark:border-neutral-800">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium">1 · Connect wallet (MetaMask Flask)</h2>
          {isConnected ? (
            <button
              onClick={() => disconnect()}
              className="text-xs text-neutral-500 underline underline-offset-2"
            >
              disconnect
            </button>
          ) : null}
        </div>

        {isConnected ? (
          <p className="mt-3 font-mono text-xs text-neutral-600 dark:text-neutral-400">
            {address}
          </p>
        ) : (
          <div className="mt-3 flex flex-wrap gap-2">
            {connectors.map((c) => (
              <button
                key={c.uid}
                onClick={() => connect({ connector: c })}
                disabled={connecting}
                className="rounded-lg bg-neutral-900 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50 dark:bg-white dark:text-black"
              >
                {c.name}
              </button>
            ))}
          </div>
        )}

        {onWrongChain ? (
          <p className="mt-3 text-xs text-amber-600">
            Switch to {PERMISSION_CHAIN.name} (chain {PERMISSION_CHAIN.id}) — ERC-7715 lives there.
          </p>
        ) : null}
      </section>

      {/* 2. Grant budget (ERC-7715) */}
      <section className="mb-8 rounded-xl border border-neutral-200 p-5 dark:border-neutral-800">
        <h2 className="text-sm font-medium">2 · Grant a periodic USDC budget (ERC-7715)</h2>
        <p className="mt-1 text-xs text-neutral-500">
          One signature creates an ERC-7710 delegation. The agent can never spend beyond this.
        </p>

        <div className="mt-4 flex flex-wrap items-end gap-4">
          <label className="text-xs">
            <span className="block text-neutral-500">USDC / day</span>
            <input
              type="number"
              min={1}
              value={perDay}
              onChange={(e) => setPerDay(Number(e.target.value))}
              className="mt-1 w-24 rounded-md border border-neutral-300 bg-transparent px-2 py-1 dark:border-neutral-700"
            />
          </label>
          <label className="text-xs">
            <span className="block text-neutral-500">Expires in (h)</span>
            <input
              type="number"
              min={1}
              value={expiryHours}
              onChange={(e) => setExpiryHours(Number(e.target.value))}
              className="mt-1 w-24 rounded-md border border-neutral-300 bg-transparent px-2 py-1 dark:border-neutral-700"
            />
          </label>
          <button
            onClick={handleGrant}
            disabled={!isConnected || !walletClient || onWrongChain || grant.status === "granting"}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-medium text-white disabled:opacity-40"
          >
            {grant.status === "granting" ? "Awaiting signature…" : "Grant budget"}
          </button>
        </div>

        {grant.status === "granted" ? (
          <pre className="mt-4 max-h-48 overflow-auto rounded-md bg-neutral-100 p-3 text-[11px] dark:bg-neutral-900">
            {JSON.stringify(grant.context, bigintReplacer, 2)}
          </pre>
        ) : null}
        {grant.status === "error" ? (
          <p className="mt-4 rounded-md bg-red-50 p-3 text-xs text-red-700 dark:bg-red-950/40">
            {grant.message}
          </p>
        ) : null}
      </section>

      {/* A2A delegation tree */}
      <section className="mb-8 rounded-xl border border-neutral-200 p-5 dark:border-neutral-800">
        <h2 className="text-sm font-medium">Agent mesh — redelegation (A2A)</h2>
        <p className="mt-1 text-xs text-neutral-500">
          The Researcher subcontracts the Summarizer by redelegating a strictly
          narrower slice. Authority only narrows — caveats can tighten, never loosen.
        </p>
        <ol className="mt-4 space-y-2">
          {AGENT_MESH.map((role, i) => {
            const now = Math.floor(Date.now() / 1000);
            const { budgetUSDC, expiryUnix } = narrowedFor(
              role,
              perDay,
              now + expiryHours * 3600,
              now,
            );
            const hours = Math.max(0, Math.round((expiryUnix - now) / 3600));
            return (
              <li
                key={role.id}
                className="rounded-lg border border-neutral-100 p-3 dark:border-neutral-800"
                style={{ marginLeft: `${i * 20}px` }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium">
                    {i > 0 ? "↳ " : ""}
                    {role.label}
                  </span>
                  <span className="font-mono text-[11px] text-emerald-600">
                    ≤ {budgetUSDC.toFixed(2)} USDC · {hours}h
                  </span>
                </div>
                <p className="mt-1 text-[11px] text-neutral-500">{role.blurb}</p>
                <div className="mt-1.5 flex flex-wrap gap-1">
                  {role.caveats.map((c) => (
                    <span
                      key={c}
                      className="rounded bg-neutral-100 px-1.5 py-0.5 text-[10px] text-neutral-500 dark:bg-neutral-900"
                    >
                      {c}
                    </span>
                  ))}
                </div>
              </li>
            );
          })}
        </ol>
      </section>

      {/* 3. Research */}
      <section className="rounded-xl border border-neutral-200 p-5 dark:border-neutral-800">
        <h2 className="text-sm font-medium">3 · Ask a research question</h2>
        <p className="mt-1 text-xs text-neutral-500">
          The agent searches the corpus, reads with Venice (chat + web search), and computes who
          gets paid. Settlement runs next via attestAndSplit → 1Shot.
        </p>

        <div className="mt-4 flex gap-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleResearch()}
            placeholder="e.g. What are the most effective carbon capture methods?"
            className="flex-1 rounded-md border border-neutral-300 bg-transparent px-3 py-2 text-sm dark:border-neutral-700"
          />
          <button
            onClick={handleResearch}
            disabled={research.status === "running" || !query.trim()}
            className="rounded-lg bg-neutral-900 px-4 py-2 text-xs font-medium text-white disabled:opacity-40 dark:bg-white dark:text-black"
          >
            {research.status === "running" ? "Researching…" : "Research"}
          </button>
        </div>

        {research.status === "error" ? (
          <p className="mt-4 rounded-md bg-red-50 p-3 text-xs text-red-700 dark:bg-red-950/40">
            {research.message}
          </p>
        ) : null}

        {research.status === "done" ? (
          <div className="mt-5 space-y-5">
            <span
              className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-medium ${
                research.result.venice === "live"
                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                  : "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
              }`}
            >
              {research.result.venice === "live" ? "Venice live" : "Venice fallback (dev)"}
            </span>
            <article className="whitespace-pre-wrap text-sm leading-relaxed text-neutral-800 dark:text-neutral-200">
              {research.result.synthesis}
            </article>

            {research.result.webCitations.length > 0 ? (
              <div>
                <h3 className="text-xs font-medium text-neutral-500">Web sources (Venice)</h3>
                <ul className="mt-1 list-inside list-disc text-xs text-blue-600">
                  {research.result.webCitations.slice(0, 6).map((c, i) => (
                    <li key={i}>
                      <a href={c.url} target="_blank" rel="noreferrer" className="underline">
                        {c.title ?? c.url}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            <div>
              <h3 className="text-xs font-medium text-neutral-500">
                Author payout plan — every citation pays its author
              </h3>
              <table className="mt-2 w-full text-left text-xs">
                <thead className="text-neutral-400">
                  <tr>
                    <th className="py-1">Author</th>
                    <th>Paper</th>
                    <th className="text-right">Share</th>
                  </tr>
                </thead>
                <tbody>
                  {research.result.payouts.map((p, i) => (
                    <tr key={i} className="border-t border-neutral-100 dark:border-neutral-800">
                      <td className="py-1.5 pr-2">
                        <div>{p.authorName}</div>
                        <div className="font-mono text-[10px] text-neutral-400">{p.author}</div>
                      </td>
                      <td className="max-w-[180px] truncate pr-2 text-neutral-500" title={p.workTitle}>
                        {p.workTitle}
                      </td>
                      <td className="text-right font-medium">{(p.weightBps / 100).toFixed(1)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="mt-4 flex items-center gap-3">
                <button
                  onClick={handleSettle}
                  disabled={settle.status === "settling"}
                  className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-medium text-white disabled:opacity-40"
                >
                  {settle.status === "settling" ? "Settling…" : "Settle & pay authors (0.5 USDC)"}
                </button>
                <span className="text-[11px] text-neutral-400">
                  redeems the ERC-7710 delegation → attestAndSplit → relayed via 1Shot
                </span>
              </div>

              {settle.status === "done" ? (
                <pre className="mt-3 max-h-56 overflow-auto rounded-md bg-neutral-100 p-3 text-[11px] dark:bg-neutral-900">
                  {JSON.stringify(settle.result, null, 2)}
                </pre>
              ) : null}
              {settle.status === "error" ? (
                <p className="mt-3 rounded-md bg-red-50 p-3 text-xs text-red-700 dark:bg-red-950/40">
                  {settle.message}
                </p>
              ) : null}
            </div>
          </div>
        ) : null}
      </section>
    </main>
  );
}

function bigintReplacer(_key: string, value: unknown) {
  return typeof value === "bigint" ? `${value}n` : value;
}
