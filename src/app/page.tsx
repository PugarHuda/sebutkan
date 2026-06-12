import Link from "next/link";

export default function Home() {
  return (
    <div className="relative flex flex-1 flex-col items-center overflow-hidden px-6 py-16">
      <div className="paper-grid pointer-events-none absolute inset-0 -z-10" />

      {/* Hero */}
      <section className="w-full max-w-3xl text-center">
        <span className="nb-sm inline-block rotate-[-1.5deg] bg-[var(--amber)] px-3 py-1 text-[11px] font-bold uppercase tracking-wide">
          MetaMask Smart Accounts · 1Shot · Venice AI
        </span>
        <div className="mt-6 flex items-center justify-center gap-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.svg" alt="Sebutkan logo" width={64} height={64} className="nb-sm" />
          <h1 className="text-6xl font-black leading-[0.95] tracking-tight sm:text-7xl">Sebutkan</h1>
        </div>
        <p className="mx-auto mt-5 max-w-xl text-balance text-lg font-medium leading-relaxed">
          The research agent that cites <span className="bg-[var(--accent)] px-1 text-white">and pays</span> its
          sources. Grant <em>one</em> scoped budget — it buys papers, reads them with Venice, and
          splits USDC back to every author it cites. Gasless. Non-custodial.
        </p>

        <div className="mt-9 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/research"
            className="nb nb-press inline-block bg-[var(--accent-2)] px-7 py-3.5 text-sm font-bold text-white"
          >
            Open the dashboard →
          </Link>
          <Link
            href="/claim"
            className="nb nb-press inline-block bg-[var(--paper-2)] px-7 py-3.5 text-sm font-bold"
          >
            Claim your wallet (authors)
          </Link>
        </div>
      </section>

      {/* How it works */}
      <section className="mt-20 grid w-full max-w-4xl gap-5 sm:grid-cols-3">
        {[
          {
            n: "01",
            t: "Grant once",
            d: "Sign one ERC-7715 Advanced Permission — a periodic USDC budget. The agent can never exceed it. You keep custody.",
            c: "var(--amber)",
          },
          {
            n: "02",
            t: "Agent works",
            d: "It searches the corpus, pays for papers via x402, reads with Venice (private + uncensored), and redelegates to a Summarizer.",
            c: "var(--accent)",
          },
          {
            n: "03",
            t: "Authors paid",
            d: "Every citation pays its author — gasless via 1Shot. Unclaimed shares wait on-chain until they claim with ORCID.",
            c: "var(--emerald)",
          },
        ].map((s) => (
          <div key={s.n} className="nb bg-[var(--paper-2)] p-5 text-left">
            <div
              className="nb-sm mb-3 inline-block px-2 py-0.5 text-xs font-black"
              style={{ background: s.c, color: s.c === "var(--emerald)" ? "#fff" : "#1c1a17" }}
            >
              {s.n}
            </div>
            <h3 className="text-lg font-extrabold">{s.t}</h3>
            <p className="mt-1.5 text-sm font-medium leading-snug text-[var(--ink)]/80">{s.d}</p>
          </div>
        ))}
      </section>

      {/* Proof strip */}
      <section className="mt-14 w-full max-w-4xl">
        <div className="nb flex flex-wrap items-center justify-center gap-x-6 gap-y-2 bg-[var(--ink)] px-6 py-4 text-center text-xs font-bold text-[var(--paper)]">
          <span>✓ ERC-7715 grant proven on Sepolia</span>
          <span>✓ x402 paid on-chain</span>
          <span>✓ 1Shot gasless relay verified</span>
          <span>✓ on-chain attestation</span>
          <span>✓ ORCID OAuth</span>
        </div>
      </section>

      <footer className="mt-16 text-xs font-medium text-[var(--ink)]/60">
        Built for the MetaMask Smart Accounts Kit × 1Shot × Venice AI Dev Cook-Off ·{" "}
        <a href="https://github.com/PugarHuda/sebutkan" className="underline">
          GitHub
        </a>
      </footer>
    </div>
  );
}
