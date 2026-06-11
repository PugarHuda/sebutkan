import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-zinc-50 px-6 font-sans dark:bg-black">
      <div className="w-full max-w-xl text-center">
        <p className="text-xs font-medium uppercase tracking-widest text-emerald-600">
          MetaMask Smart Accounts · 1Shot · Venice AI
        </p>
        <h1 className="mt-4 text-5xl font-semibold tracking-tight">Sebutkan</h1>
        <p className="mt-4 text-balance text-neutral-600 dark:text-neutral-400">
          The research agent that cites <span className="italic">and pays</span> its sources.
          Grant one scoped permission — the agent buys the papers it needs, reads them with Venice,
          and splits USDC back to every author it cites. Gasless. Non-custodial. You never sign
          another transaction.
        </p>
        <div className="mt-8 flex items-center justify-center gap-3">
          <Link
            href="/research"
            className="rounded-lg bg-neutral-900 px-5 py-2.5 text-sm font-medium text-white dark:bg-white dark:text-black"
          >
            Open the agent →
          </Link>
          <a
            href="https://github.com/PugarHuda/sebutkan"
            className="rounded-lg border border-neutral-300 px-5 py-2.5 text-sm font-medium dark:border-neutral-700"
          >
            GitHub
          </a>
        </div>
      </div>
    </div>
  );
}
