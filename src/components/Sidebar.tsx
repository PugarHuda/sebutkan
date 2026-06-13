"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAccount, useChainId, useConnect, useDisconnect, useSwitchChain } from "wagmi";
import { pickFlaskConnector } from "@/lib/wagmi";
import { PERMISSION_CHAIN } from "@/lib/chains";

const NAV_SECTIONS: {
  title: string;
  items: { href: string; label: string; glyph: string; hint: string }[];
}[] = [
  {
    title: "Discover",
    items: [
      { href: "/dashboard", label: "Overview", glyph: "◇", hint: "What Sebutkan is" },
      { href: "/dashboard/research", label: "Research", glyph: "❝", hint: "Ask · cited papers · pay authors" },
      { href: "/dashboard/library", label: "Library", glyph: "❑", hint: "All past runs: synthesis, journals, payouts" },
      { href: "/dashboard/agents", label: "Agents", glyph: "✦", hint: "The AI mesh & reputation" },
    ],
  },
  {
    title: "Earn",
    items: [
      { href: "/dashboard/bounties", label: "Bounties", glyph: "◈", hint: "Sponsor a research topic" },
      { href: "/dashboard/claim", label: "Claim & Rewards", glyph: "◉", hint: "Authors: get paid + loyalty yield" },
    ],
  },
  {
    title: "Monitor",
    items: [{ href: "/dashboard/activity", label: "Activity", glyph: "≣", hint: "On-chain payments & leaderboard" }],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { address, isConnected } = useAccount();
  const { connectors, connect } = useConnect();
  const { disconnect } = useDisconnect();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  const flask = pickFlaskConnector(connectors);

  // Strict network: the whole app runs on Sepolia (ERC-7715/7710 live there).
  // The moment a wallet connects on the wrong chain, prompt a switch.
  const wrongNetwork = isConnected && chainId !== PERMISSION_CHAIN.id;
  useEffect(() => {
    if (wrongNetwork) switchChain?.({ chainId: PERMISSION_CHAIN.id });
  }, [wrongNetwork, switchChain]);

  return (
    <aside className="sticky top-0 flex h-dvh w-60 shrink-0 flex-col border-r border-[var(--rule)] bg-[var(--paper-2)] px-4 py-5">
      <Link href="/" className="mb-7 flex items-center gap-2.5 px-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.svg" alt="" width={26} height={26} />
        <span className="serif text-lg font-semibold">Sebutkan</span>
      </Link>

      <nav className="flex flex-col gap-4">
        {NAV_SECTIONS.map((section) => (
          <div key={section.title} className="flex flex-col gap-0.5">
            <div className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--muted)]">
              {section.title}
            </div>
            {section.items.map((n) => {
              const active = pathname === n.href;
              return (
                <Link
                  key={n.href}
                  href={n.href}
                  title={n.hint}
                  className={`flex items-start gap-3 rounded-md px-3 py-2 text-sm transition ${
                    active
                      ? "bg-[var(--accent-soft)] font-medium text-[var(--accent)]"
                      : "text-[var(--ink)]/70 hover:bg-[var(--accent-soft)]/60"
                  }`}
                >
                  <span className={`mt-0.5 w-4 text-center ${active ? "text-[var(--accent)]" : "text-[var(--muted)]"}`}>
                    {n.glyph}
                  </span>
                  <span className="min-w-0">
                    <span className="block leading-tight">{n.label}</span>
                    <span className="block text-[10px] leading-tight text-[var(--muted)]">{n.hint}</span>
                  </span>
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="mt-auto space-y-3 pt-6">
        <div className="rounded-md border border-[var(--rule)] p-3">
          <div className="text-[10px] uppercase tracking-wide text-[var(--muted)]">Wallet</div>
          {isConnected ? (
            <div className="mt-1">
              <div className="font-mono text-[11px]">
                {address?.slice(0, 6)}…{address?.slice(-4)}
              </div>
              {wrongNetwork ? (
                <button
                  onClick={() => switchChain?.({ chainId: PERMISSION_CHAIN.id })}
                  className="mt-1.5 w-full rounded-md bg-amber-500 px-2 py-1 text-[10px] font-medium text-white"
                >
                  ⚠ Wrong network — switch to Sepolia
                </button>
              ) : (
                <div className="mt-1 flex items-center gap-1 text-[10px] text-emerald-600">
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" /> Sepolia
                </div>
              )}
              <button onClick={() => disconnect()} className="mt-1 text-[10px] text-[var(--muted)] underline">
                disconnect
              </button>
            </div>
          ) : flask ? (
            <button
              onClick={() => connect({ connector: flask })}
              className="mt-1.5 w-full rounded-md bg-[var(--accent)] px-3 py-1.5 text-[11px] font-medium text-white"
            >
              Connect MetaMask Flask
            </button>
          ) : (
            <a
              href="https://docs.metamask.io/snaps/get-started/install-flask/"
              target="_blank"
              rel="noreferrer"
              className="mt-1.5 block text-[11px] text-[var(--accent)] underline"
            >
              Install Flask →
            </a>
          )}
        </div>
        <a
          href="https://github.com/PugarHuda/sebutkan"
          target="_blank"
          rel="noreferrer"
          className="block px-2 text-[11px] text-[var(--muted)] hover:text-[var(--accent)]"
        >
          GitHub ↗
        </a>
      </div>
    </aside>
  );
}
