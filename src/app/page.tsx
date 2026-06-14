import Link from "next/link";
import { LandingStats } from "@/components/LandingStats";
import { ReceiptPeek } from "@/components/ReceiptPeek";
import { FloatingPapers } from "@/components/FloatingPapers";
import { Reveal } from "@/components/Reveal";

export default function Home() {
  return (
    <div className="relative flex flex-1 flex-col items-center overflow-hidden px-6 py-20">
      <div className="paper-grid pointer-events-none absolute inset-0 -z-10" />
      <FloatingPapers />
      {/* soft readability scrim over the falling papers, concentrated on the headline */}
      <div
        className="pointer-events-none absolute inset-0 -z-[5]"
        style={{ background: "radial-gradient(ellipse 62% 48% at 34% 26%, var(--paper) 38%, transparent 74%)" }}
      />

      {/* Hero — text + a live product peek, side by side on desktop */}
      <section className="grid w-full max-w-5xl items-center gap-12 lg:grid-cols-[1.1fr_0.9fr]">
        {/* Left: copy */}
        <div className="fade-up text-center lg:text-left">
          <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2 lg:justify-start">
            <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
              MetaMask Smart Accounts · 1Shot · Venice AI
            </p>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--accent)]/30 bg-[var(--accent-soft)] px-2.5 py-0.5 text-[10px] font-medium text-[var(--accent)]">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--accent)]" />
              live on Sepolia
            </span>
          </div>

          <div className="relative mt-6 flex items-center justify-center gap-3 lg:justify-start">
            <div className="hero-glow pointer-events-none absolute -left-6 -top-4 h-28 w-44" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.svg" alt="Sebutkan logo" width={48} height={48} className="relative" />
            <h1 className="serif relative text-6xl font-semibold tracking-tight sm:text-7xl">Sebutkan</h1>
          </div>

          <p className="mx-auto mt-6 max-w-xl text-balance text-lg leading-relaxed text-[var(--ink)]/85 lg:mx-0">
            The research agent that cites{" "}
            <span className="serif italic text-[var(--accent)]">and pays</span> its sources. Grant one
            scoped budget — it buys papers, reads them with Venice, and splits USDC back to every
            author it cites. Author payouts are gasless (relayed by 1Shot). Non-custodial.
          </p>

          <div className="mt-9 flex flex-wrap items-center justify-center gap-3 lg:justify-start">
            <Link
              href="/dashboard"
              className="group rounded-md bg-[var(--accent)] px-6 py-3 text-sm font-medium text-white transition hover:opacity-90"
            >
              Open the dashboard <span className="inline-block transition-transform group-hover:translate-x-0.5">→</span>
            </Link>
            <Link
              href="/dashboard/claim"
              className="rounded-md border border-[var(--rule)] px-6 py-3 text-sm font-medium transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
            >
              Claim your wallet (authors)
            </Link>
          </div>
          <div className="mt-5 flex items-center justify-center gap-2 text-[11px] text-[var(--muted)] lg:justify-start">
            <span>New here?</span>
            <Link
              href="/docs"
              className="inline-flex items-center gap-1 rounded-full border border-[var(--rule)] px-3 py-1 font-medium text-[var(--ink)]/80 transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
            >
              📖 Read the docs
            </Link>
          </div>
        </div>

        {/* Right: product peek */}
        <div className="fade-up flex justify-center lg:justify-end" style={{ animationDelay: "0.12s" }}>
          <ReceiptPeek />
        </div>
      </section>

      <div className="fade-up" style={{ animationDelay: "0.2s" }}>
        <LandingStats />
      </div>

      <hr className="my-16 w-full max-w-2xl border-[var(--rule)]" />

      {/* How it works */}
      <section className="w-full max-w-4xl">
        <p className="mb-6 text-center text-[11px] uppercase tracking-[0.2em] text-[var(--muted)]">How it works</p>
        <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
          {[
            {
              icon: "🔑",
              n: "I",
              t: "Grant once",
              d: "Sign one ERC-7715 Advanced Permission — a periodic USDC budget the agent can never exceed. You keep custody.",
              tag: "ERC-7715",
            },
            {
              icon: "🤖",
              n: "II",
              t: "The agents work",
              d: "The Researcher buys papers via x402, then redelegates strictly narrower budgets to a Planner, parallel Readers, a Fact-checker & a Summarizer — all reasoning with Venice.",
              tag: "x402 · 7710 · Venice",
            },
            {
              icon: "💸",
              n: "III",
              t: "Authors are paid",
              d: "Every citation pays its author — gasless via 1Shot. Unclaimed shares wait on-chain until they claim with ORCID.",
              tag: "1Shot · escrow",
            },
          ].map((s, i) => (
            <Reveal key={s.n} delay={i * 0.12} className="flex flex-1 items-stretch">
              <div className="flex flex-1 flex-col rounded-xl border border-[var(--rule)] bg-[var(--paper-2)] p-5 text-left transition hover:-translate-y-0.5 hover:border-[var(--accent)]/40 hover:shadow-lg">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--accent-soft)] text-lg">{s.icon}</span>
                  <div>
                    <div className="text-[10px] font-semibold uppercase tracking-wide text-[var(--accent)]">Step {s.n}</div>
                    <h3 className="serif text-lg font-semibold leading-tight">{s.t}</h3>
                  </div>
                </div>
                <p className="mt-3 flex-1 text-sm leading-relaxed text-[var(--ink)]/75">{s.d}</p>
                <div className="mt-3 inline-flex w-fit rounded-full bg-[var(--paper)] px-2.5 py-1 font-mono text-[10px] text-[var(--muted)]">
                  {s.tag}
                </div>
              </div>
              {i < 2 ? (
                <div className="flex items-center justify-center px-1 text-[var(--accent)]/50">
                  <span className="hidden text-xl sm:inline">→</span>
                  <span className="text-xl sm:hidden">↓</span>
                </div>
              ) : null}
            </Reveal>
          ))}
        </div>
      </section>

      {/* Why it's different */}
      <section className="mt-16 w-full max-w-4xl">
        <p className="mb-6 text-center text-[11px] uppercase tracking-[0.2em] text-[var(--muted)]">Why it&apos;s different</p>
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { icon: "🔒", t: "Non-custodial by default", d: "No blanket token approval, no custody. One ERC-7715 cap the agent can never exceed — funds stay in your wallet until the split." },
            { icon: "🧠", t: "Private Venice brain", d: "Five Venice endpoints — chat, web search, embeddings, image, voice. Private and uncensored, so the agent can research anything." },
            { icon: "⛓️", t: "Every citation is a payment", d: "AI scrapes human knowledge and pays nothing. Sebutkan flips that: each citation is a real on-chain USDC payment to its author." },
          ].map((v, i) => (
            <Reveal key={v.t} delay={i * 0.1}>
              <div className="h-full rounded-xl border border-[var(--rule)] bg-[var(--paper-2)] p-5 transition hover:-translate-y-0.5 hover:border-[var(--accent)]/40 hover:shadow-lg">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--accent-soft)] text-xl">{v.icon}</span>
                <h3 className="serif mt-3 text-base font-semibold">{v.t}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-[var(--ink)]/70">{v.d}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Proof line */}
      <section className="mt-12 w-full max-w-4xl">
        <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1 text-center text-xs text-[var(--muted)]">
          {[
            "ERC-7715 Advanced Permissions (Flask)",
            "x402 paid on-chain",
            "1Shot 7710 + 7702 relay on Base mainnet",
            "on-chain attestation",
            "ORCID OAuth",
          ].map((p, i) => (
            <span key={p}>
              {i > 0 ? <span className="mr-5 text-[var(--accent)]">·</span> : null}
              {p}
            </span>
          ))}
        </div>
      </section>

      <footer className="mt-16 text-xs text-[var(--muted)]">
        Built for the MetaMask Smart Accounts Kit × 1Shot × Venice AI Dev Cook-Off ·{" "}
        <a href="https://github.com/PugarHuda/sebutkan" className="link-accent">
          GitHub
        </a>{" "}
        ·{" "}
        <Link href="/docs" className="link-accent">
          Docs
        </Link>{" "}
        ·{" "}
        <Link href="/slide" className="link-accent">
          Pitch deck
        </Link>
      </footer>
    </div>
  );
}
