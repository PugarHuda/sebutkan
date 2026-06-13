"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAccount, useConnect, useDisconnect } from "wagmi";
import { pickFlaskConnector } from "@/lib/wagmi";

const NAV = [
  { href: "/dashboard", label: "Overview", glyph: "◇" },
  { href: "/dashboard/research", label: "Research", glyph: "❝" },
  { href: "/dashboard/agents", label: "Agents", glyph: "✦" },
  { href: "/dashboard/bounties", label: "Bounties", glyph: "◈" },
  { href: "/dashboard/activity", label: "Activity", glyph: "≣" },
  { href: "/dashboard/claim", label: "Claim & Rewards", glyph: "◉" },
];

export function Sidebar() {
  const pathname = usePathname();
  const { address, isConnected } = useAccount();
  const { connectors, connect } = useConnect();
  const { disconnect } = useDisconnect();
  const flask = pickFlaskConnector(connectors);

  return (
    <aside className="sticky top-0 flex h-dvh w-60 shrink-0 flex-col border-r border-[var(--rule)] bg-[var(--paper-2)] px-4 py-5">
      <Link href="/" className="mb-7 flex items-center gap-2.5 px-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.svg" alt="" width={26} height={26} />
        <span className="serif text-lg font-semibold">Sebutkan</span>
      </Link>

      <nav className="flex flex-col gap-1">
        {NAV.map((n) => {
          const active = pathname === n.href;
          return (
            <Link
              key={n.href}
              href={n.href}
              className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm transition ${
                active
                  ? "bg-[var(--accent-soft)] font-medium text-[var(--accent)]"
                  : "text-[var(--ink)]/70 hover:bg-[var(--accent-soft)]/60"
              }`}
            >
              <span className={`w-4 text-center ${active ? "text-[var(--accent)]" : "text-[var(--muted)]"}`}>
                {n.glyph}
              </span>
              {n.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto space-y-3 pt-6">
        <div className="rounded-md border border-[var(--rule)] p-3">
          <div className="text-[10px] uppercase tracking-wide text-[var(--muted)]">Wallet</div>
          {isConnected ? (
            <div className="mt-1">
              <div className="font-mono text-[11px]">
                {address?.slice(0, 6)}…{address?.slice(-4)}
              </div>
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
