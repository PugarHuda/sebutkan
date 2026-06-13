"use client";

import { useEffect, useState } from "react";
import { useAccount, useConnect, useDisconnect, useWalletClient, useSwitchChain } from "wagmi";
import { requestBudgetPermission, type BudgetParams } from "@/lib/permissions";
import { PERMISSION_CHAIN } from "@/lib/chains";
import type { ResearchResult } from "@/lib/agent";
import Link from "next/link";
import { AGENT_MESH, narrowedFor } from "@/lib/agents";
import { redeemViaOneShot } from "@/lib/redeem";
import { loadHistory, saveToHistory, removeFromHistory, clearHistory, type HistoryEntry } from "@/lib/history";
import { createWalletClient, custom, type WalletClient } from "viem";

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

type RedeemState =
  | { status: "idle" }
  | { status: "redeeming" }
  | { status: "done"; result: unknown }
  | { status: "error"; message: string };

type ReceiptState =
  | { status: "idle" }
  | { status: "generating" }
  | { status: "done"; image?: string; audioBase64?: string; degraded?: string }
  | { status: "error"; message: string };

type GrantState =
  | { status: "idle" }
  | { status: "granting" }
  | { status: "granted"; context: unknown }
  | { status: "error"; message: string };

type FeedbackState =
  | { status: "idle" }
  | { status: "recording" }
  | { status: "done"; results: { agent: string; txHash?: string; error?: string }[] }
  | { status: "error"; message: string };

type ShareState =
  | { status: "idle" }
  | { status: "sharing" }
  | { status: "done"; url: string }
  | { status: "error"; message: string };

const SESSION_ACCOUNT =
  (process.env.NEXT_PUBLIC_SESSION_ACCOUNT as `0x${string}`) ??
  "0x000000000000000000000000000000000000dEaD";

const RESEARCH_STEPS = [
  "Search corpus",
  "Purchase via x402",
  "Read with Venice",
  "Fact-check (Venice)",
  "Attribute authors",
  "Ready to settle",
];

export default function ResearchPage() {
  const { address, isConnected, chainId } = useAccount();
  const { connectors, connect, isPending: connecting } = useConnect();
  const { disconnect } = useDisconnect();
  const { data: walletClient } = useWalletClient();
  const { switchChain } = useSwitchChain();

  const [perDay, setPerDay] = useState(10);
  const [expiryHours, setExpiryHours] = useState(24);
  const [grant, setGrant] = useState<GrantState>({ status: "idle" });

  const [query, setQuery] = useState("");
  const [papers, setPapers] = useState(5);
  const [fromYear, setFromYear] = useState<number | "">("");
  const [toYear, setToYear] = useState<number | "">("");
  const [language, setLanguage] = useState("auto");
  const [research, setResearch] = useState<ResearchState>({ status: "idle" });
  const [settle, setSettle] = useState<SettleState>({ status: "idle" });
  const [redeem, setRedeem] = useState<RedeemState>({ status: "idle" });
  const [receipt, setReceipt] = useState<ReceiptState>({ status: "idle" });
  const [feedback, setFeedback] = useState<FeedbackState>({ status: "idle" });
  const [share, setShare] = useState<ShareState>({ status: "idle" });
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [tick, setTick] = useState(0);

  async function handleShare() {
    if (research.status !== "done" || share.status === "sharing") return;
    setShare({ status: "sharing" });
    try {
      const res = await fetch("/api/share", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ result: research.result }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? `HTTP ${res.status}`);
      const url = `${window.location.origin}${json.path}`;
      try {
        await navigator.clipboard.writeText(url);
      } catch {
        /* clipboard may be blocked — the URL is shown regardless */
      }
      setShare({ status: "done", url });
    } catch (e) {
      setShare({ status: "error", message: e instanceof Error ? e.message : String(e) });
    }
  }

  // Load this device's saved research history once on mount.
  useEffect(() => {
    setHistory(loadHistory());
  }, []);

  function restoreFromHistory(entry: HistoryEntry) {
    setResearch({ status: "done", result: entry.result });
    setQuery(entry.query);
    setSettle({ status: "idle" });
    setRedeem({ status: "idle" });
    setReceipt({ status: "idle" });
    setFeedback({ status: "idle" });
    setShare({ status: "idle" });
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleReceipt() {
    if (research.status !== "done") return;
    setReceipt({ status: "generating" });
    try {
      const authors = research.result.payouts.map((p) => p.authorName);
      const res = await fetch("/api/receipt", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ query: research.result.query, authors, totalUSDC: "0.5 USDC" }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? `HTTP ${res.status}`);
      setReceipt({ status: "done", ...json });
    } catch (e) {
      setReceipt({ status: "error", message: e instanceof Error ? e.message : String(e) });
    }
  }

  // Auto-switch to the permission chain (Sepolia) once connected on the wrong one.
  useEffect(() => {
    if (isConnected && chainId !== undefined && chainId !== PERMISSION_CHAIN.id) {
      switchChain?.({ chainId: PERMISSION_CHAIN.id });
    }
  }, [isConnected, chainId, switchChain]);

  // Live agent ticker while a research request is in flight.
  useEffect(() => {
    if (research.status !== "running") return;
    setTick(0);
    const id = setInterval(() => setTick((t) => Math.min(t + 1, RESEARCH_STEPS.length - 1)), 900);
    return () => clearInterval(id);
  }, [research.status]);

  async function handleRedeem() {
    if (research.status !== "done" || chainId === undefined) return;
    if (redeem.status === "redeeming") return; // guard against double-trigger
    setRedeem({ status: "redeeming" });
    const wc = await resolveWalletClient();
    if (!wc) {
      setRedeem({ status: "error", message: "Wallet not ready — reconnect MetaMask Flask." });
      return;
    }
    try {
      const result = await redeemViaOneShot({
        walletClient: wc,
        chainId,
        payouts: research.result.payouts,
        workUSDC: 0.5,
      });
      setRedeem({ status: "done", result });
    } catch (e) {
      setRedeem({ status: "error", message: e instanceof Error ? e.message : String(e) });
    }
  }

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
          amountUSDC6: "500000",
          payouts: research.result.payouts,
          ledger,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? `HTTP ${res.status}`);
      setSettle({ status: "done", result: json });
      // Reputation feedback loop (E): reward the agents that contributed.
      recordAgentFeedback();
    } catch (e) {
      setSettle({ status: "error", message: e instanceof Error ? e.message : String(e) });
    }
  }

  async function recordAgentFeedback() {
    if (research.status !== "done") return;
    const agents = (research.result.reputation ?? []).map((r) => r.agent);
    if (!agents.length) return;
    setFeedback({ status: "recording" });
    try {
      const res = await fetch("/api/agents/feedback", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ agents }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? `HTTP ${res.status}`);
      setFeedback({ status: "done", results: json.results ?? [] });
    } catch (e) {
      setFeedback({ status: "error", message: e instanceof Error ? e.message : String(e) });
    }
  }

  async function handleResearch() {
    if (!query.trim()) return;
    setResearch({ status: "running" });
    setSettle({ status: "idle" });
    setRedeem({ status: "idle" });
    setFeedback({ status: "idle" });
    setShare({ status: "idle" });
    try {
      const res = await fetch("/api/research", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          query,
          papers,
          fromYear: fromYear || undefined,
          toYear: toYear || undefined,
          language,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? `HTTP ${res.status}`);
      setResearch({ status: "done", result: json as ResearchResult });
      // Persist to this device's history so it can be re-opened after a refresh.
      setHistory(saveToHistory(json as ResearchResult));
    } catch (e) {
      setResearch({ status: "error", message: e instanceof Error ? e.message : String(e) });
    }
  }

  const onWrongChain = isConnected && chainId !== PERMISSION_CHAIN.id;

  async function resolveWalletClient(): Promise<WalletClient | null> {
    if (walletClient) return walletClient;
    // Use the already-connected account (no eth_requestAccounts → no extra popup).
    const eth = (globalThis as { ethereum?: unknown }).ethereum;
    if (!eth || !address) return null;
    try {
      return createWalletClient({
        account: address,
        chain: PERMISSION_CHAIN,
        transport: custom(eth as Parameters<typeof custom>[0]),
      });
    } catch {
      return null;
    }
  }

  async function handleGrant() {
    if (grant.status === "granting") return; // guard against double-trigger
    setGrant({ status: "granting" });
    const wc = await resolveWalletClient();
    if (!wc) {
      setGrant({ status: "error", message: "Wallet not ready — reconnect MetaMask Flask and try again." });
      return;
    }
    try {
      const params: BudgetParams = {
        sessionAccount: SESSION_ACCOUNT,
        perPeriodUSDC: perDay,
        periodSeconds: 86_400,
        expiry: Math.floor(Date.now() / 1000) + expiryHours * 3600,
        chainId: PERMISSION_CHAIN.id,
      };
      const granted = await requestBudgetPermission(wc, params);
      setGrant({ status: "granted", context: granted });
    } catch (e) {
      setGrant({ status: "error", message: e instanceof Error ? e.message : String(e) });
    }
  }

  return (
    <main className="mx-auto w-full max-w-3xl px-8 py-10">
      <header className="mb-8">
        <p className="text-[11px] uppercase tracking-[0.15em] text-[var(--accent)]">Agent</p>
        <h1 className="serif mt-1 text-3xl font-semibold tracking-tight">Research</h1>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-[var(--ink)]/70">
          Grant one scoped budget — the agent buys papers, reads with Venice, and splits USDC back to
          every author it cites. Gasless, non-custodial.
        </p>
      </header>

      {/* 1. Connect */}
      <Card>
        <StepHead n={1} title="Connect wallet (MetaMask Flask)">
          {isConnected ? (
            <span className="flex items-center gap-1.5 text-[11px] text-emerald-600">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" /> connected
              <button onClick={() => disconnect()} className="ml-2 text-neutral-400 underline">
                disconnect
              </button>
            </span>
          ) : null}
        </StepHead>
        {isConnected ? (
          <p className="mt-3 font-mono text-xs text-[var(--muted)]">{address}</p>
        ) : (
          <div className="mt-3 flex flex-wrap gap-2">
            {metaMaskConnectors(connectors).length ? (
              metaMaskConnectors(connectors).map((c) => (
                <button
                  key={c.uid}
                  onClick={() => connect({ connector: c })}
                  disabled={connecting}
                  className="rounded-md bg-[var(--accent)] px-4 py-2 text-xs font-medium text-white transition hover:opacity-90 disabled:opacity-50"
                >
                  Connect {c.name}
                </button>
              ))
            ) : (
              <a
                href="https://docs.metamask.io/snaps/get-started/install-flask/"
                target="_blank"
                rel="noreferrer"
                className="rounded-md border border-[var(--rule)] px-4 py-2 text-xs font-medium hover:border-[var(--accent)] hover:text-[var(--accent)]"
              >
                Install MetaMask Flask →
              </a>
            )}
          </div>
        )}
        {onWrongChain ? (
          <div className="mt-3 flex items-center gap-2">
            <button
              onClick={() => switchChain?.({ chainId: PERMISSION_CHAIN.id })}
              className="rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-amber-400"
            >
              Switch to {PERMISSION_CHAIN.name}
            </button>
            <span className="text-[11px] text-amber-600">ERC-7715 lives on {PERMISSION_CHAIN.name}.</span>
          </div>
        ) : null}
      </Card>

      {/* 2. Grant */}
      <Card>
        <StepHead n={2} title="Grant a periodic USDC budget (ERC-7715)" />
        <p className="mt-1 text-xs text-neutral-500">
          One signature creates an ERC-7710 delegation. The agent can never spend beyond this.
        </p>
        <div className="mt-4 flex flex-wrap items-end gap-4">
          <Field label="USDC / day">
            <input
              type="number"
              min={1}
              value={perDay}
              onChange={(e) => setPerDay(Number(e.target.value))}
              className="w-24 rounded-md border border-neutral-300 bg-transparent px-2 py-1.5 dark:border-neutral-700"
            />
          </Field>
          <Field label="Expires in (h)">
            <input
              type="number"
              min={1}
              value={expiryHours}
              onChange={(e) => setExpiryHours(Number(e.target.value))}
              className="w-24 rounded-md border border-neutral-300 bg-transparent px-2 py-1.5 dark:border-neutral-700"
            />
          </Field>
          <button
            onClick={handleGrant}
            disabled={!isConnected || onWrongChain || grant.status === "granting"}
            className="rounded-lg bg-emerald-600 px-4 py-2.5 text-xs font-medium text-white transition hover:bg-emerald-500 disabled:opacity-40"
          >
            {grant.status === "granting" ? "Awaiting signature…" : "Grant budget"}
          </button>
          {grant.status === "granted" ? (
            <span className="flex items-center gap-1 text-[11px] font-medium text-emerald-600">✓ permission granted</span>
          ) : null}
        </div>
        {grant.status === "granted" ? (
          <pre className="mt-4 max-h-48 overflow-auto rounded-md bg-neutral-100 p-3 text-[11px] dark:bg-neutral-900">
            {JSON.stringify(grant.context, bigintReplacer, 2)}
          </pre>
        ) : null}
        {grant.status === "error" ? <ErrorBox>{grant.message}</ErrorBox> : null}
      </Card>

      {/* A2A tree */}
      <Card>
        <StepHead title="Agent mesh — redelegation (A2A)" />
        <p className="mt-1 text-xs text-neutral-500">
          The Researcher subcontracts the Summarizer by redelegating a strictly narrower slice.
          Authority only narrows — caveats tighten, never loosen.
        </p>
        <ol className="mt-4 space-y-1.5">
          {AGENT_MESH.map((role, i) => {
            const now = Math.floor(Date.now() / 1000);
            const { budgetUSDC, expiryUnix } = narrowedFor(role, perDay, now + expiryHours * 3600, now);
            const hours = Math.max(0, Math.round((expiryUnix - now) / 3600));
            return (
              <li
                key={role.id}
                className="rounded-md border border-[var(--rule)] bg-[var(--paper)] p-3"
                style={{ marginLeft: `${role.depth * 22}px` }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium">
                    {role.depth > 0 ? <span className="text-[var(--accent)]">↳ </span> : null}
                    {role.label}
                  </span>
                  <span className="rounded bg-emerald-50 px-2 py-0.5 font-mono text-[11px] text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                    ≤ {budgetUSDC.toFixed(2)} USDC · {hours}h
                  </span>
                </div>
                <p className="mt-1 text-[11px] text-neutral-500">{role.blurb}</p>
                <div className="mt-1.5 flex flex-wrap gap-1">
                  {role.caveats.map((c) => (
                    <span key={c} className="rounded bg-neutral-100 px-1.5 py-0.5 text-[10px] text-neutral-500 dark:bg-neutral-900">
                      {c}
                    </span>
                  ))}
                </div>
              </li>
            );
          })}
        </ol>
      </Card>

      {/* 3. Research */}
      <Card>
        <StepHead n={3} title="Ask a research question" />
        <p className="mt-1 text-xs text-neutral-500">
          The agent searches the corpus, reads with Venice (chat + web search), and computes who gets paid.
        </p>
        <div className="mt-4 flex gap-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleResearch()}
            placeholder="e.g. What are the most effective carbon capture methods?"
            className="flex-1 rounded-lg border border-neutral-300 bg-transparent px-3.5 py-2.5 text-sm dark:border-neutral-700"
          />
          <button
            onClick={handleResearch}
            disabled={research.status === "running" || !query.trim()}
            className="rounded-lg bg-neutral-900 px-5 py-2.5 text-xs font-medium text-white transition hover:opacity-90 disabled:opacity-40 dark:bg-white dark:text-black"
          >
            {research.status === "running" ? "Researching…" : "Research"}
          </button>
        </div>

        {/* Filters */}
        <div className="mt-3 flex flex-wrap items-end gap-3">
          <Field label="Papers">
            <input
              type="number"
              min={1}
              max={10}
              value={papers}
              onChange={(e) => setPapers(Math.min(10, Math.max(1, Number(e.target.value))))}
              className="w-16 rounded-md border border-neutral-300 bg-transparent px-2 py-1.5 dark:border-neutral-700"
            />
          </Field>
          <Field label="Year from">
            <input
              type="number"
              placeholder="any"
              value={fromYear}
              onChange={(e) => setFromYear(e.target.value ? Number(e.target.value) : "")}
              className="w-20 rounded-md border border-neutral-300 bg-transparent px-2 py-1.5 dark:border-neutral-700"
            />
          </Field>
          <Field label="Year to">
            <input
              type="number"
              placeholder="any"
              value={toYear}
              onChange={(e) => setToYear(e.target.value ? Number(e.target.value) : "")}
              className="w-20 rounded-md border border-neutral-300 bg-transparent px-2 py-1.5 dark:border-neutral-700"
            />
          </Field>
          <Field label="Answer language">
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="rounded-md border border-neutral-300 bg-transparent px-2 py-1.5 dark:border-neutral-700"
            >
              <option value="auto">Auto (match question)</option>
              <option value="English">English</option>
              <option value="Indonesian">Indonesian</option>
              <option value="Spanish">Spanish</option>
              <option value="Arabic">Arabic</option>
              <option value="Chinese">Chinese</option>
              <option value="French">French</option>
              <option value="Japanese">Japanese</option>
            </select>
          </Field>
        </div>

        {research.status === "running" ? (
          <ol className="mt-5 space-y-2">
            {RESEARCH_STEPS.map((s, i) => (
              <li key={s} className="flex items-center gap-2.5 text-xs">
                <span
                  className={`flex h-4 w-4 items-center justify-center rounded-full text-[9px] ${
                    i < tick
                      ? "bg-emerald-500 text-white"
                      : i === tick
                        ? "animate-pulse bg-emerald-200 text-emerald-700 dark:bg-emerald-900"
                        : "bg-neutral-200 text-neutral-400 dark:bg-neutral-800"
                  }`}
                >
                  {i < tick ? "✓" : i + 1}
                </span>
                <span className={i <= tick ? "text-neutral-700 dark:text-neutral-200" : "text-neutral-400"}>{s}</span>
              </li>
            ))}
          </ol>
        ) : null}

        {research.status === "error" ? <ErrorBox>{research.message}</ErrorBox> : null}

        {research.status === "done" ? (
          <div className="mt-5 space-y-5">
            <span
              className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-medium ${
                research.result.venice === "live"
                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                  : "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
              }`}
            >
              {research.result.venice === "live" ? "● Venice live" : "● Venice fallback (dev)"}
            </span>
            {research.result.x402?.paid ? (
              <a
                href={`https://sepolia.etherscan.io/tx/${research.result.x402.txHash}`}
                target="_blank"
                rel="noreferrer"
                className="ml-2 inline-block rounded-full bg-blue-100 px-2.5 py-0.5 text-[10px] font-medium text-blue-700 underline dark:bg-blue-950 dark:text-blue-300"
              >
                ● x402 paid {research.result.x402.amountUSDC} USDC ↗
              </a>
            ) : (
              <span
                className="ml-2 inline-block rounded-full bg-neutral-100 px-2.5 py-0.5 text-[10px] font-medium text-neutral-400 dark:bg-neutral-800"
                title={research.result.x402?.reason}
              >
                ○ x402 skipped (agent unfunded)
              </span>
            )}
            <article className="whitespace-pre-wrap rounded-md bg-[var(--paper)] p-4 text-sm leading-relaxed text-[var(--ink)]/90">
              {research.result.synthesis}
            </article>

            {research.result.summary ? (
              <div className="rounded-md bg-[var(--paper)] p-3">
                <h3 className="text-[10px] font-medium uppercase tracking-wide text-[var(--muted)]">
                  Summarizer agent · TL;DR
                </h3>
                <p className="mt-1 text-sm font-medium leading-relaxed text-[var(--ink)]/90">{research.result.summary}</p>
              </div>
            ) : null}

            {research.result.agentTrace?.length ? (
              <div className="rounded-md border border-[var(--rule)] p-4">
                <div className="flex items-center justify-between">
                  <h3 className="serif text-sm font-semibold">Multi-agent trace</h3>
                  <div className="flex items-center gap-2 text-[10px]">
                    {research.result.confidence ? (
                      <span
                        className={`rounded px-1.5 py-0.5 font-medium ${
                          research.result.confidence === "high"
                            ? "bg-emerald-100 text-emerald-700"
                            : research.result.confidence === "medium"
                              ? "bg-amber-100 text-amber-700"
                              : "bg-red-100 text-red-700"
                        }`}
                      >
                        confidence: {research.result.confidence}
                      </span>
                    ) : null}
                    {research.result.rounds && research.result.rounds > 1 ? (
                      <span className="rounded bg-indigo-100 px-1.5 py-0.5 font-medium text-indigo-700">
                        ↻ {research.result.rounds} rounds (revised)
                      </span>
                    ) : null}
                  </div>
                </div>
                <ol className="mt-3 space-y-1.5">
                  {research.result.agentTrace.map((s, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-2.5 text-[11px]"
                      style={{ marginLeft: s.redelegation ? "16px" : "0" }}
                    >
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
                        <span className="font-medium text-[var(--ink)]">{s.label}</span>{" "}
                        <span className="text-[var(--muted)]">· {s.action}</span>
                        {s.redelegation ? (
                          <span className="ml-1 text-[var(--accent)]">↳ redelegated</span>
                        ) : null}
                        {typeof s.budgetUSDC === "number" ? (
                          <span className="ml-1 font-mono text-[10px] text-emerald-600">
                            ≤ {s.budgetUSDC.toFixed(2)} USDC
                          </span>
                        ) : null}
                        <p className="text-[var(--ink)]/70">{s.detail}</p>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>
            ) : null}

            {research.result.verification ? (
              <div className="rounded-md border-l-2 border-[var(--accent)] bg-[var(--accent-soft)] p-4">
                <h3 className="serif text-sm font-semibold text-[var(--accent)]">
                  ❝ Fact-checker agent {research.result.confidence ? `· ${research.result.confidence} confidence` : ""}
                </h3>
                <p className="mt-1 whitespace-pre-wrap text-xs leading-relaxed text-[var(--ink)]/80">
                  {research.result.verification}
                </p>
              </div>
            ) : null}

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
                    <th className="py-1 font-normal">Author</th>
                    <th className="font-normal">Paper</th>
                    <th className="text-right font-normal">Share</th>
                  </tr>
                </thead>
                <tbody>
                  {research.result.payouts.map((p, i) => (
                    <tr key={i} className="border-t border-neutral-100 dark:border-neutral-800">
                      <td className="py-2 pr-2">
                        <div className="flex items-center gap-1.5 font-medium text-neutral-800 dark:text-neutral-200">
                          {p.authorName}
                          <span
                            className={`rounded px-1 py-0.5 text-[9px] ${
                              p.claimed
                                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                                : "bg-neutral-100 text-neutral-400 dark:bg-neutral-800"
                            }`}
                            title={p.claimed ? "Real wallet (NameRegistry)" : "Unclaimed — demo wallet. Claim at /claim"}
                          >
                            {p.claimed ? "claimed" : "demo"}
                          </span>
                        </div>
                        <Link
                          href={`/dashboard/authors/${p.author}`}
                          className="font-mono text-[10px] text-[var(--muted)] hover:text-[var(--accent)] hover:underline"
                        >
                          {p.author}
                        </Link>
                      </td>
                      <td className="max-w-[180px] truncate pr-2" title={p.workTitle}>
                        <a
                          href={p.url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-blue-600 underline decoration-dotted underline-offset-2 hover:text-blue-500"
                        >
                          {p.workTitle}
                        </a>
                      </td>
                      <td className="text-right font-mono font-medium text-emerald-600">{(p.weightBps / 100).toFixed(1)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {research.result.payouts.length === 0 ? (
                <p className="mt-4 text-xs text-neutral-400">No authors to pay for this query.</p>
              ) : (
                <>
                  <div className="mt-5 flex flex-wrap items-center gap-3">
                    <button
                      onClick={handleSettle}
                      disabled={settle.status === "settling"}
                      className="rounded-lg bg-emerald-600 px-4 py-2.5 text-xs font-medium text-white transition hover:bg-emerald-500 disabled:opacity-40"
                    >
                      {settle.status === "settling" ? "Recording…" : "1 · Record attestation on-chain"}
                    </button>
                    <button
                      onClick={handleRedeem}
                      disabled={redeem.status === "redeeming"}
                      className="rounded-lg bg-indigo-600 px-4 py-2.5 text-xs font-medium text-white transition hover:bg-indigo-500 disabled:opacity-40"
                    >
                      {redeem.status === "redeeming" ? "Relaying…" : "2 · Pay authors gasless (1Shot) →"}
                    </button>
                    <button
                      onClick={handleReceipt}
                      disabled={receipt.status === "generating"}
                      className="rounded-lg border border-neutral-300 px-4 py-2.5 text-xs font-medium transition hover:bg-neutral-50 disabled:opacity-40 dark:border-neutral-700 dark:hover:bg-neutral-800"
                    >
                      {receipt.status === "generating" ? "Generating…" : "3 · Venice receipt (image + audio)"}
                    </button>
                    <button
                      onClick={handleShare}
                      disabled={share.status === "sharing"}
                      className="rounded-lg border border-[var(--accent)] px-4 py-2.5 text-xs font-medium text-[var(--accent)] transition hover:bg-[var(--accent-soft)] disabled:opacity-40"
                    >
                      {share.status === "sharing" ? "Creating link…" : "4 · Share public link ↗"}
                    </button>
                  </div>

                  {share.status === "done" ? (
                    <div className="mt-2 flex items-center gap-2 rounded-md border border-[var(--rule)] p-2 text-[11px]">
                      <span className="text-emerald-600">✓ link copied</span>
                      <a href={share.url} target="_blank" rel="noreferrer" className="link-accent flex-1 truncate font-mono underline">
                        {share.url}
                      </a>
                    </div>
                  ) : null}
                  {share.status === "error" ? (
                    <p className="mt-2 text-[11px] text-amber-600">
                      Share unavailable: {share.message}
                    </p>
                  ) : null}
                  <p className="mt-2 text-[11px] text-neutral-400">
                    record a real on-chain attestation · relay USDC splits gasless via 1Shot · generate a Venice receipt card + audio briefing
                  </p>
                </>
              )}

              {settle.status === "done" && isAttested(settle.result) ? (
                <div className="mt-3 rounded-md bg-emerald-50 p-3 text-[11px] dark:bg-emerald-950/40">
                  ✓ Attested on-chain ·{" "}
                  <a href={attestedExplorer(settle.result)} target="_blank" rel="noreferrer" className="underline">
                    view tx on Etherscan
                  </a>
                </div>
              ) : null}

              {feedback.status === "recording" ? (
                <p className="mt-2 text-[11px] text-[var(--muted)]">⟳ Recording agent reputation on-chain (ERC-8004)…</p>
              ) : null}
              {feedback.status === "done" ? (
                <div className="mt-2 rounded-md border border-[var(--rule)] p-3 text-[11px]">
                  <span className="font-medium text-[var(--accent)]">Agent reputation updated (ERC-8004)</span>
                  <ul className="mt-1 space-y-0.5">
                    {feedback.results.map((r) => (
                      <li key={r.agent} className="flex items-center gap-2">
                        <span className="capitalize">{r.agent}</span>
                        {r.txHash ? (
                          <a
                            href={`https://sepolia.etherscan.io/tx/${r.txHash}`}
                            target="_blank"
                            rel="noreferrer"
                            className="font-mono text-emerald-600 underline"
                          >
                            +1 rep ↗
                          </a>
                        ) : (
                          <span className="text-[var(--muted)]">{r.error}</span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
              {feedback.status === "error" ? (
                <p className="mt-2 text-[11px] text-amber-600">Reputation update skipped: {feedback.message}</p>
              ) : null}

              {receipt.status === "done" ? (
                <div className="mt-4 space-y-3">
                  {receipt.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={receipt.image.startsWith("data:") ? receipt.image : `data:image/webp;base64,${receipt.image}`}
                      alt="Citation receipt"
                      className="w-full max-w-sm rounded-lg border border-neutral-200 dark:border-neutral-800"
                    />
                  ) : null}
                  {receipt.audioBase64 ? (
                    <audio controls src={`data:audio/mp3;base64,${receipt.audioBase64}`} className="w-full max-w-sm" />
                  ) : null}
                  {receipt.degraded ? (
                    <p className="text-[11px] text-amber-600">Venice receipt unavailable (no credit): {receipt.degraded}</p>
                  ) : null}
                </div>
              ) : null}
              {receipt.status === "error" ? <ErrorBox>{receipt.message}</ErrorBox> : null}

              {redeem.status === "done" ? (
                <pre className="mt-3 max-h-56 overflow-auto rounded-md bg-indigo-50 p-3 text-[11px] dark:bg-indigo-950/40">
                  {JSON.stringify(redeem.result, null, 2)}
                </pre>
              ) : null}
              {redeem.status === "error" ? <ErrorBox>{redeem.message}</ErrorBox> : null}
              {settle.status === "error" ? <ErrorBox>{settle.message}</ErrorBox> : null}
            </div>
          </div>
        ) : null}
      </Card>

      {/* Saved research — this device's history (localStorage) */}
      {history.length > 0 ? (
        <Card>
          <div className="flex items-center justify-between">
            <StepHead title="Recent research (saved on this device)" />
            <button
              onClick={() => setHistory(clearHistory())}
              className="text-[11px] text-[var(--muted)] underline hover:text-[var(--accent)]"
            >
              clear all
            </button>
          </div>
          <p className="mt-1 text-xs text-neutral-500">
            Finished runs are kept in your browser so you can re-open them after a refresh — synthesis,
            agent trace, and payout plan included. The on-chain attestation remains the canonical paid record.
          </p>
          <ul className="mt-3 space-y-px overflow-hidden rounded-md border border-[var(--rule)] bg-[var(--rule)]">
            {history.map((h) => (
              <li key={h.id} className="flex items-center justify-between gap-3 bg-[var(--paper-2)] px-3 py-2.5">
                <button onClick={() => restoreFromHistory(h)} className="min-w-0 flex-1 text-left">
                  <div className="truncate text-xs font-medium text-[var(--ink)]" title={h.query}>
                    {h.query}
                  </div>
                  <div className="mt-0.5 flex items-center gap-2 text-[10px] text-[var(--muted)]">
                    <span>{new Date(h.savedAt).toLocaleString()}</span>
                    <span>· {h.result.payouts?.length ?? 0} authors</span>
                    <span
                      className={`rounded px-1 py-0.5 ${
                        h.venice === "live"
                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                          : "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
                      }`}
                    >
                      {h.venice === "live" ? "live" : "fallback"}
                    </span>
                  </div>
                </button>
                <div className="flex shrink-0 items-center gap-2">
                  <button
                    onClick={() => restoreFromHistory(h)}
                    className="rounded-md border border-[var(--rule)] px-2.5 py-1 text-[11px] font-medium hover:border-[var(--accent)] hover:text-[var(--accent)]"
                  >
                    Open
                  </button>
                  <button
                    onClick={() => setHistory(removeFromHistory(h.id))}
                    className="text-[11px] text-[var(--muted)] hover:text-red-600"
                    aria-label="delete"
                  >
                    ✕
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      ) : null}
    </main>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return <section className="card mb-6 p-6">{children}</section>;
}

function StepHead({ n, title, children }: { n?: number; title: string; children?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <h2 className="serif flex items-center gap-2.5 text-base font-semibold">
        {n ? (
          <span className="flex h-6 w-6 items-center justify-center rounded-full border border-[var(--accent)] text-[11px] font-semibold text-[var(--accent)]">
            {n}
          </span>
        ) : null}
        {title}
      </h2>
      {children}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="text-xs">
      <span className="mb-1 block text-neutral-500">{label}</span>
      {children}
    </label>
  );
}

function ErrorBox({ children }: { children: React.ReactNode }) {
  return <p className="mt-4 rounded-md bg-red-50 p-3 text-xs text-red-700 dark:bg-red-950/40">{children}</p>;
}

/** Show only MetaMask (prefer Flask) — hide competitor wallets from the picker. */
function metaMaskConnectors<T extends { name: string }>(connectors: readonly T[]): T[] {
  const mm = connectors.filter((c) => /metamask/i.test(c.name));
  const flask = mm.filter((c) => /flask/i.test(c.name));
  const picked = flask.length ? flask : mm;
  // de-dupe by name
  return picked.filter((c, i) => picked.findIndex((x) => x.name === c.name) === i);
}

function bigintReplacer(_key: string, value: unknown) {
  return typeof value === "bigint" ? `${value}n` : value;
}

function isAttested(r: unknown): boolean {
  return typeof r === "object" && r !== null && (r as { mode?: string }).mode === "attested";
}
function attestedExplorer(r: unknown): string {
  return (r as { explorer?: string })?.explorer ?? "#";
}
