import Link from "next/link";

export default function Home() {
  return (
    <div className="relative flex flex-1 flex-col items-center overflow-hidden px-6 py-20">
      <div className="paper-grid pointer-events-none absolute inset-0 -z-10" />

      {/* Hero */}
      <section className="w-full max-w-2xl text-center">
        <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
          MetaMask Smart Accounts · 1Shot · Venice AI
        </p>
        <div className="mt-7 flex items-center justify-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.svg" alt="Sebutkan logo" width={48} height={48} />
          <h1 className="serif text-6xl font-semibold tracking-tight sm:text-7xl">Sebutkan</h1>
        </div>
        <p className="mx-auto mt-6 max-w-xl text-balance text-lg leading-relaxed text-[var(--ink)]/85">
          The research agent that cites{" "}
          <span className="serif italic text-[var(--accent)]">and pays</span> its sources. Grant one
          scoped budget — it buys papers, reads them with Venice, and splits USDC back to every
          author it cites. Gasless. Non-custodial.
        </p>

        <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/dashboard"
            className="rounded-md bg-[var(--accent)] px-6 py-3 text-sm font-medium text-white transition hover:opacity-90"
          >
            Open the dashboard →
          </Link>
          <Link
            href="/dashboard/claim"
            className="rounded-md border border-[var(--rule)] px-6 py-3 text-sm font-medium transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
          >
            Claim your wallet (authors)
          </Link>
        </div>
      </section>

      <hr className="my-16 w-full max-w-2xl border-[var(--rule)]" />

      {/* How it works */}
      <section className="grid w-full max-w-4xl gap-px overflow-hidden rounded-md border border-[var(--rule)] bg-[var(--rule)] sm:grid-cols-3">
        {[
          {
            n: "I.",
            t: "Grant once",
            d: "Sign one ERC-7715 Advanced Permission — a periodic USDC budget. The agent can never exceed it. You keep custody.",
          },
          {
            n: "II.",
            t: "The agent works",
            d: "It searches the corpus, pays for papers via x402, reads with Venice (private + uncensored), and redelegates to a Summarizer.",
          },
          {
            n: "III.",
            t: "Authors are paid",
            d: "Every citation pays its author — gasless via 1Shot. Unclaimed shares wait on-chain until they claim with ORCID.",
          },
        ].map((s) => (
          <div key={s.n} className="bg-[var(--paper-2)] p-6 text-left">
            <div className="serif text-sm font-semibold text-[var(--accent)]">{s.n}</div>
            <h3 className="serif mt-1 text-xl font-semibold">{s.t}</h3>
            <p className="mt-2 text-sm leading-relaxed text-[var(--ink)]/75">{s.d}</p>
          </div>
        ))}
      </section>

      {/* Proof line */}
      <section className="mt-12 w-full max-w-4xl">
        <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1 text-center text-xs text-[var(--muted)]">
          {[
            "ERC-7715 grant proven on Sepolia",
            "x402 paid on-chain",
            "1Shot gasless relay verified",
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
        </a>
      </footer>
    </div>
  );
}
