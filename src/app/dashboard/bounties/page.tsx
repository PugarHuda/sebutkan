"use client";

import { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { useWriteContract } from "wagmi";
import { parseUnits } from "viem";
import { BOUNTY_MARKET, BOUNTY_ABI, ERC20_APPROVE_ABI, topicHash } from "@/lib/bounty";
import { USDC, PERMISSION_CHAIN } from "@/lib/chains";

type Bounty = {
  id: string;
  sponsor: string;
  topicHash: string;
  amount: string;
  expiresAt: number;
  settled: boolean;
  txHash: string;
};

export default function BountiesPage() {
  const { isConnected } = useAccount();
  const { writeContractAsync } = useWriteContract();
  const [topic, setTopic] = useState("");
  const [amount, setAmount] = useState(1);
  const [bounties, setBounties] = useState<Bounty[]>([]);
  const [status, setStatus] = useState<string | null>(null);

  const usdc = USDC[PERMISSION_CHAIN.id];

  async function load() {
    const d = await fetch("/api/bounties").then((r) => r.json());
    setBounties(d.bounties ?? []);
  }
  useEffect(() => {
    load();
  }, []);

  async function createBounty() {
    if (!topic.trim() || !BOUNTY_MARKET) return;
    try {
      const amt = parseUnits(String(amount), 6);
      setStatus("Approving USDC…");
      await writeContractAsync({
        address: usdc,
        abi: ERC20_APPROVE_ABI,
        functionName: "approve",
        args: [BOUNTY_MARKET, amt],
      });
      setStatus("Creating bounty…");
      const tx = await writeContractAsync({
        address: BOUNTY_MARKET,
        abi: BOUNTY_ABI,
        functionName: "create",
        args: [topicHash(topic), amt, 7n * 24n * 3600n],
      });
      setStatus(`✓ Created (${tx.slice(0, 10)}…). Refreshing…`);
      setTopic("");
      setTimeout(load, 5000);
    } catch (e) {
      setStatus(`error: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  return (
    <main className="mx-auto w-full max-w-3xl px-8 py-10">
      <p className="text-[11px] uppercase tracking-[0.15em] text-[var(--accent)]">Sponsored research</p>
      <h1 className="serif mt-1 text-3xl font-semibold tracking-tight">Bounties</h1>
      <p className="mt-2 max-w-xl text-sm leading-relaxed text-[var(--ink)]/70">
        Fund research on a topic. When Sebutkan satisfies it, the deposited USDC is paid to the cited
        authors — no platform fee. Unsettled bounties are refundable after 7 days.
      </p>

      {/* Create */}
      <div className="card mt-7 p-5">
        <h2 className="serif text-lg font-semibold">Sponsor a topic</h2>
        <div className="mt-3 flex flex-wrap items-end gap-3">
          <label className="flex-1 text-xs">
            <span className="mb-1 block text-[var(--muted)]">Topic</span>
            <input
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. perovskite solar cell stability"
              className="w-full rounded-md border border-[var(--rule)] bg-transparent px-3 py-2 text-sm"
            />
          </label>
          <label className="text-xs">
            <span className="mb-1 block text-[var(--muted)]">USDC</span>
            <input
              type="number"
              min={0.1}
              step={0.1}
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              className="w-24 rounded-md border border-[var(--rule)] bg-transparent px-2 py-2 text-sm"
            />
          </label>
          <button
            onClick={createBounty}
            disabled={!isConnected || !topic.trim()}
            className="rounded-md bg-[var(--accent)] px-4 py-2.5 text-xs font-medium text-white disabled:opacity-40"
          >
            Fund bounty
          </button>
        </div>
        {!isConnected ? (
          <p className="mt-2 text-[11px] text-[var(--muted)]">Connect MetaMask (sidebar) to sponsor.</p>
        ) : null}
        {status ? <p className="mt-2 text-[11px] text-[var(--accent)]">{status}</p> : null}
      </div>

      {/* List */}
      <h2 className="serif mt-9 text-lg font-semibold">Open & settled bounties</h2>
      <div className="mt-2 space-y-px overflow-hidden rounded-lg border border-[var(--rule)] bg-[var(--rule)]">
        {bounties.length === 0 ? (
          <div className="bg-[var(--paper-2)] p-5 text-sm text-[var(--muted)]">
            No bounties yet — sponsor the first topic above.
          </div>
        ) : (
          bounties.map((b) => (
            <div key={b.id} className="flex items-center justify-between bg-[var(--paper-2)] px-4 py-3 text-xs">
              <div>
                <span className="font-mono text-[var(--muted)]">#{b.id}</span>{" "}
                <span className="font-mono">{b.topicHash.slice(0, 12)}…</span>
                <span className="ml-2 text-[10px] text-[var(--muted)]">
                  by {b.sponsor.slice(0, 6)}…{b.sponsor.slice(-4)}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="serif font-semibold text-[var(--accent)]">
                  {(Number(b.amount) / 1e6).toFixed(2)} USDC
                </span>
                <span
                  className={`rounded px-2 py-0.5 text-[10px] ${
                    b.settled
                      ? "bg-[var(--accent-soft)] text-[var(--accent)]"
                      : "bg-[var(--paper)] text-[var(--muted)]"
                  }`}
                >
                  {b.settled ? "settled" : "open"}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </main>
  );
}
