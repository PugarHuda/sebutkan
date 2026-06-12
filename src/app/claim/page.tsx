"use client";

import { useEffect, useState } from "react";
import { useAccount, useConnect, useSignMessage } from "wagmi";
import { keccak256, encodePacked, getAddress } from "viem";

type Status = {
  enabled: boolean;
  demoVerifyAvailable: boolean;
  verifiedOrcid?: string | null;
  verifiedViaDemo?: boolean;
};
type ClaimState =
  | { status: "idle" }
  | { status: "signing" }
  | { status: "binding" }
  | { status: "done"; txHash: string }
  | { status: "error"; message: string };

export default function ClaimPage() {
  const { address, isConnected } = useAccount();
  const { connectors, connect } = useConnect();
  const { signMessageAsync } = useSignMessage();

  const [orcid, setOrcid] = useState("0000-0002-1825-0097"); // ORCID test record
  const [status, setStatus] = useState<Status | null>(null);
  const [claim, setClaim] = useState<ClaimState>({ status: "idle" });

  useEffect(() => {
    fetch("/api/auth/orcid/status")
      .then((r) => r.json())
      .then(setStatus)
      .catch(() => setStatus(null));
  }, []);

  const verifiedOrcid = status?.verifiedOrcid ?? null;

  async function handleBind() {
    if (!address || !verifiedOrcid) return;
    setClaim({ status: "signing" });
    try {
      const message = keccak256(encodePacked(["string", "address"], [verifiedOrcid, getAddress(address)]));
      const signature = await signMessageAsync({ message: { raw: message } });
      setClaim({ status: "binding" });
      const res = await fetch("/api/claim", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ wallet: address, signature }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? `HTTP ${res.status}`);
      setClaim({ status: "done", txHash: json.txHash });
    } catch (e) {
      setClaim({ status: "error", message: e instanceof Error ? e.message : String(e) });
    }
  }

  return (
    <main className="mx-auto w-full max-w-xl px-6 py-14">
      <h1 className="text-3xl font-semibold tracking-tight">Claim your author wallet</h1>
      <p className="mt-3 text-sm text-neutral-500">
        Prove you own your <strong>ORCID</strong> (OAuth) and your wallet (one signature). The
        operator relays an on-chain binding — every Sebutkan citation of your work then pays
        <span className="italic"> your real wallet</span>. You pay no gas.
      </p>

      <div className="mt-8 space-y-5 rounded-2xl border border-neutral-200 bg-white/60 p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900/40">
        {/* 1. connect wallet */}
        {!isConnected ? (
          <div className="flex flex-wrap gap-2">
            {connectors.map((c) => (
              <button
                key={c.uid}
                onClick={() => connect({ connector: c })}
                className="rounded-lg bg-neutral-900 px-3.5 py-2 text-xs font-medium text-white dark:bg-white dark:text-black"
              >
                Connect {c.name}
              </button>
            ))}
          </div>
        ) : (
          <p className="font-mono text-xs text-neutral-500">{address}</p>
        )}

        {/* 2. verify ORCID */}
        <div>
          <label className="block text-xs">
            <span className="mb-1 block text-neutral-500">Your ORCID iD</span>
            <input
              value={orcid}
              onChange={(e) => setOrcid(e.target.value)}
              placeholder="0000-0000-0000-0000"
              className="w-full rounded-md border border-neutral-300 bg-transparent px-3 py-2 font-mono text-xs dark:border-neutral-700"
            />
          </label>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {status?.enabled ? (
              <a
                href={`/api/auth/orcid/authorize?orcid=${encodeURIComponent(orcid)}`}
                className="rounded-lg bg-[#A6CE39] px-3.5 py-2 text-xs font-medium text-black"
              >
                Verify with ORCID ↗
              </a>
            ) : (
              <span className="text-[11px] text-neutral-400">ORCID OAuth not configured</span>
            )}
            {status?.demoVerifyAvailable ? (
              <a
                href={`/api/auth/orcid/demo-verify?orcid=${encodeURIComponent(orcid)}`}
                className="rounded-lg border border-neutral-300 px-3.5 py-2 text-xs font-medium dark:border-neutral-700"
              >
                Demo verify (test ORCID)
              </a>
            ) : null}
            {verifiedOrcid ? (
              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-medium text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                ✓ ORCID verified: {verifiedOrcid}
                {status?.verifiedViaDemo ? " (demo)" : ""}
              </span>
            ) : null}
          </div>
        </div>

        {/* 3. sign + bind */}
        <button
          onClick={handleBind}
          disabled={!isConnected || !verifiedOrcid || claim.status === "signing" || claim.status === "binding"}
          className="rounded-lg bg-emerald-600 px-4 py-2.5 text-xs font-medium text-white disabled:opacity-40"
        >
          {claim.status === "signing"
            ? "Sign in wallet…"
            : claim.status === "binding"
              ? "Binding on-chain…"
              : "Sign & bind wallet"}
        </button>

        {claim.status === "done" ? (
          <p className="rounded-md bg-emerald-50 p-3 text-xs text-emerald-700 dark:bg-emerald-950/40">
            ✓ Bound on-chain.{" "}
            <a href={`https://sepolia.etherscan.io/tx/${claim.txHash}`} target="_blank" rel="noreferrer" className="underline">
              View transaction
            </a>
          </p>
        ) : null}
        {claim.status === "error" ? (
          <p className="rounded-md bg-red-50 p-3 text-xs text-red-700 dark:bg-red-950/40">{claim.message}</p>
        ) : null}
      </div>
    </main>
  );
}
