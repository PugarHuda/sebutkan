"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

/**
 * Pitch deck — Sebutkan (/slide)
 * Keyboard (← → / Space), click (right half = next, left = prev), or the dots.
 * Editorial theme, full-bleed slides. Press F for fullscreen.
 */

const ACCENT = "var(--accent)";

function Kicker({ children }: { children: React.ReactNode }) {
  return <p className="text-[11px] uppercase tracking-[0.25em] text-[var(--accent)]">{children}</p>;
}
function Stat({ v, k }: { v: string; k: string }) {
  return (
    <div className="rounded-md border border-[var(--rule)] bg-[var(--paper-2)] px-5 py-4 text-center">
      <div className="serif text-3xl font-semibold text-[var(--accent)]">{v}</div>
      <div className="mt-1 text-[10px] uppercase tracking-wide text-[var(--muted)]">{k}</div>
    </div>
  );
}

const SLIDES: { id: string; render: React.ReactNode }[] = [
  {
    id: "title",
    render: (
      <div className="text-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.svg" alt="" width={64} height={64} className="mx-auto" />
        <h1 className="serif mt-6 text-6xl font-semibold tracking-tight sm:text-7xl">Sebutkan</h1>
        <p className="mx-auto mt-5 max-w-xl text-balance text-xl leading-relaxed text-[var(--ink)]/85">
          The research agent that cites <span className="serif italic text-[var(--accent)]">and pays</span> its sources.
        </p>
        <p className="mt-8 text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
          MetaMask Smart Accounts Kit × 1Shot × Venice AI · Dev Cook-Off 2026
        </p>
      </div>
    ),
  },
  {
    id: "problem",
    render: (
      <div className="max-w-2xl">
        <Kicker>The problem</Kicker>
        <h2 className="serif mt-4 text-4xl font-semibold leading-tight sm:text-5xl">
          AI scrapes humanity&apos;s research and pays the authors{" "}
          <span className="text-[var(--accent)]">nothing</span>.
        </h2>
        <p className="mt-6 text-lg leading-relaxed text-[var(--ink)]/75">
          Every model is built on papers, datasets, and writing by real people who are never cited,
          never credited, and never paid. The incentive to share knowledge quietly erodes.
        </p>
      </div>
    ),
  },
  {
    id: "solution",
    render: (
      <div className="max-w-2xl">
        <Kicker>The solution</Kicker>
        <h2 className="serif mt-4 text-4xl font-semibold leading-tight sm:text-5xl">
          An agent that cites <span className="text-[var(--accent)]">and pays</span>.
        </h2>
        <p className="mt-6 text-lg leading-relaxed text-[var(--ink)]/75">
          You grant <b>one</b> scoped budget. Sebutkan buys the papers it needs, reads them with Venice,
          and splits USDC back to <b>every author it cites</b> — gasless, non-custodial, and recorded
          on-chain. Every citation becomes a payment.
        </p>
      </div>
    ),
  },
  {
    id: "permission",
    render: (
      <div className="max-w-2xl">
        <Kicker>One signature · the UX</Kicker>
        <h2 className="serif mt-4 text-4xl font-semibold leading-tight">
          Sign once. The agent can never overspend.
        </h2>
        <p className="mt-5 text-lg leading-relaxed text-[var(--ink)]/75">
          A single <b>ERC-7715 Advanced Permission</b> via the MetaMask Smart Accounts Kit:
          <span className="text-[var(--accent)]"> &ldquo;max 10 USDC/day, expires in 24h.&rdquo;</span>
        </p>
        <div className="mt-6 flex flex-wrap gap-2 text-sm">
          {["Hard cap", "Auto-expiry", "Full custody", "No blanket approval", "No per-action popups"].map((t) => (
            <span key={t} className="rounded-md border border-[var(--rule)] bg-[var(--paper-2)] px-3 py-1.5">
              {t}
            </span>
          ))}
        </div>
      </div>
    ),
  },
  {
    id: "mesh",
    render: (
      <div className="w-full max-w-2xl">
        <Kicker>A2A coordination</Kicker>
        <h2 className="serif mt-4 text-4xl font-semibold leading-tight">A mesh, not a script.</h2>
        <p className="mt-4 text-base text-[var(--ink)]/75">
          The Researcher <b>redelegates</b> strictly narrower budgets (ERC-7710). Authority only ever shrinks.
        </p>
        <ol className="mt-5 space-y-1.5 text-sm">
          {[
            ["You → Researcher", "full budget · ERC-7715"],
            ["↳ Planner", "splits the question into sub-questions"],
            ["↳ Reader fan-out", "one parallel agent per sub-question (budget-scaled)"],
            ["↳ Citation-Matcher", "Venice embeddings → relevance-weighted payouts"],
            ["↳ Fact-checker", "can REJECT → forces a Researcher revision"],
            ["↳ Summarizer", "smallest, shortest-lived sub-budget"],
          ].map(([a, b], i) => (
            <li key={a} className="flex items-baseline gap-3 rounded-md bg-[var(--paper-2)] px-3 py-2" style={{ marginLeft: `${Math.min(i, 4) * 14}px` }}>
              <span className="font-medium text-[var(--ink)]">{a}</span>
              <span className="text-[var(--muted)]">— {b}</span>
            </li>
          ))}
        </ol>
        <p className="mt-3 text-xs text-[var(--muted)]">5 real on-chain principals (ERC-8004) that earn reputation as they work.</p>
      </div>
    ),
  },
  {
    id: "venice",
    render: (
      <div className="max-w-2xl">
        <Kicker>Best use of Venice AI</Kicker>
        <h2 className="serif mt-4 text-4xl font-semibold leading-tight">The agents&apos; brain — private &amp; uncensored.</h2>
        <p className="mt-5 text-lg leading-relaxed text-[var(--ink)]/75">
          Five Venice endpoints, in the main flow:
        </p>
        <div className="mt-5 grid grid-cols-2 gap-2 text-sm sm:grid-cols-3">
          {["chat", "web search", "embeddings", "image", "text-to-speech"].map((t) => (
            <span key={t} className="rounded-md border border-[var(--rule)] bg-[var(--paper-2)] px-3 py-2 text-center">
              {t}
            </span>
          ))}
        </div>
        <p className="mt-5 text-base text-[var(--ink)]/75">
          Embeddings don&apos;t just dedup — they <b>weight who gets paid</b>. Uncensored = research anything.
        </p>
      </div>
    ),
  },
  {
    id: "pay",
    render: (
      <div className="max-w-2xl">
        <Kicker>x402 + 1Shot · the rails</Kicker>
        <h2 className="serif mt-4 text-4xl font-semibold leading-tight">Authors get paid — gasless, on mainnet.</h2>
        <ul className="mt-5 space-y-3 text-base text-[var(--ink)]/80">
          <li>💸 <b>x402</b> — the agent pays a real USDC micropayment to unlock papers, verified on-chain.</li>
          <li>⛽ <b>1Shot</b> — payouts relayed gaslessly on <b>Base mainnet</b> with an <b>EIP-7702</b> account upgrade. Gas paid in USDC.</li>
          <li>📜 <b>On-chain attestation</b> — every citation&apos;s owed share recorded in AttributionLedger.</li>
          <li>🪪 <b>ORCID claim</b> — unclaimed shares wait in escrow until the author binds their wallet. Zero gas for them.</li>
        </ul>
      </div>
    ),
  },
  {
    id: "proof",
    render: (
      <div className="w-full max-w-3xl">
        <Kicker>It&apos;s all real</Kicker>
        <h2 className="serif mt-4 text-4xl font-semibold leading-tight">No mocks in the critical path.</h2>
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat v="6" k="contracts live" />
          <Stat v="82" k="tests green" />
          <Stat v="5" k="on-chain agents" />
          <Stat v="1" k="mainnet 1Shot relay" />
        </div>
        <p className="mt-6 text-sm text-[var(--ink)]/75">
          1Shot 7710 + 7702 relay on Base:{" "}
          <span className="font-mono text-[var(--accent)]">0x6f4c8d53…8480c</span> (type 0x4, gas in USDC).
          x402 paid on-chain · ORCID OAuth · ERC-8004 reputation · x402 7710 facilitator.
        </p>
      </div>
    ),
  },
  {
    id: "tracks",
    render: (
      <div className="w-full max-w-2xl">
        <Kicker>Track coverage</Kicker>
        <h2 className="serif mt-4 text-4xl font-semibold leading-tight">One product. Every track.</h2>
        <ul className="mt-5 space-y-2 text-sm">
          {[
            ["Best Agent", "5-agent mesh under one MetaMask permission"],
            ["Best A2A coordination", "literal ERC-7710 redelegation + reject/revise loop"],
            ["Best x402 + ERC-7710", "x402 micropayments + a 7710 facilitator on 1Shot"],
            ["Best use of Venice AI", "five endpoints in the main flow"],
            ["Best 1Shot Relayer", "7710 + 7702 relayed on Base mainnet ✓"],
          ].map(([t, d]) => (
            <li key={t} className="flex items-baseline justify-between gap-3 rounded-md bg-[var(--paper-2)] px-4 py-2.5">
              <span className="font-medium text-[var(--accent)]">{t}</span>
              <span className="text-right text-[var(--muted)]">{d}</span>
            </li>
          ))}
        </ul>
      </div>
    ),
  },
  {
    id: "close",
    render: (
      <div className="max-w-2xl text-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.svg" alt="" width={52} height={52} className="mx-auto" />
        <h2 className="serif mt-6 text-5xl font-semibold leading-tight">
          An agent that pays the people it learns from.
        </h2>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3 text-sm">
          <Link href="/dashboard" className="rounded-md bg-[var(--accent)] px-5 py-2.5 font-medium text-white">
            Open the live app →
          </Link>
          <a href="https://github.com/PugarHuda/sebutkan" className="rounded-md border border-[var(--rule)] px-5 py-2.5 font-medium">
            GitHub
          </a>
        </div>
        <p className="mt-6 font-mono text-xs text-[var(--muted)]">sebutkan.vercel.app</p>
      </div>
    ),
  },
];

export default function SlideDeck() {
  const [i, setI] = useState(0);
  const n = SLIDES.length;
  const go = useCallback((d: number) => setI((x) => Math.max(0, Math.min(n - 1, x + d))), [n]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " " || e.key === "PageDown") { e.preventDefault(); go(1); }
      else if (e.key === "ArrowLeft" || e.key === "PageUp") { e.preventDefault(); go(-1); }
      else if (e.key === "Home") setI(0);
      else if (e.key === "End") setI(n - 1);
      else if (e.key.toLowerCase() === "f") document.documentElement.requestFullscreen?.().catch(() => {});
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go, n]);

  return (
    <main className="relative flex h-dvh w-full flex-col overflow-hidden bg-[var(--paper)]">
      <div className="paper-grid pointer-events-none absolute inset-0 -z-10" />

      {/* Click zones */}
      <button aria-label="previous" onClick={() => go(-1)} className="absolute left-0 top-0 z-10 h-full w-1/3 cursor-w-resize" />
      <button aria-label="next" onClick={() => go(1)} className="absolute right-0 top-0 z-10 h-full w-1/3 cursor-e-resize" />

      {/* Slide */}
      <section className="flex flex-1 items-center justify-center px-8 py-16 sm:px-16">
        <div key={SLIDES[i].id} className="slide-in w-full max-w-4xl">{SLIDES[i].render}</div>
      </section>

      {/* Footer / nav */}
      <div className="relative z-20 flex items-center justify-between px-6 py-4 text-xs text-[var(--muted)]">
        <Link href="/" className="link-accent hover:text-[var(--accent)]">← exit</Link>
        <div className="flex items-center gap-1.5">
          {SLIDES.map((s, idx) => (
            <button
              key={s.id}
              aria-label={`slide ${idx + 1}`}
              onClick={() => setI(idx)}
              className={`h-1.5 rounded-full transition-all ${idx === i ? "w-5 bg-[var(--accent)]" : "w-1.5 bg-[var(--rule)]"}`}
            />
          ))}
        </div>
        <span className="font-mono tabular-nums">
          {String(i + 1).padStart(2, "0")} / {String(n).padStart(2, "0")} · ←/→/F
        </span>
      </div>

      <style>{`
        .slide-in { animation: slidein .35s ease both; }
        @keyframes slidein { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
      `}</style>
    </main>
  );
}
