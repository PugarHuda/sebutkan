"use client";

import { useCallback, useEffect, useState } from "react";
import { useAccount, useConnect, useSignMessage, useWriteContract } from "wagmi";
import { keccak256, encodePacked, getAddress } from "viem";
import { ESCROW_ABI } from "@/lib/escrow";

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
  const [owed, setOwed] = useState<bigint>(0n);
  const [withdrawTx, setWithdrawTx] = useState<string | null>(null);
  const { writeContractAsync } = useWriteContract();

  useEffect(() => {
    fetch("/api/auth/orcid/status")
      .then((r) => r.json())
      .then(setStatus)
      .catch(() => setStatus(null));
  }, []);

  const verifiedOrcid = status?.verifiedOrcid ?? null;
  const escrowAddress = process.env.NEXT_PUBLIC_UNCLAIMED_ESCROW as `0x${string}` | undefined;

  const refreshOwed = useCallback(async () => {
    if (!verifiedOrcid) return;
    try {
      const r = await fetch(`/api/owed?identity=${encodeURIComponent(verifiedOrcid)}`).then((x) => x.json());
      setOwed(BigInt(r.owedUSDC6 ?? "0"));
    } catch {
      setOwed(0n);
    }
  }, [verifiedOrcid]);

  useEffect(() => {
    refreshOwed();
  }, [refreshOwed, claim.status]);

  async function handleWithdraw() {
    if (!verifiedOrcid || !escrowAddress) return;
    try {
      const tx = await writeContractAsync({
        address: escrowAddress,
        abi: ESCROW_ABI,
        functionName: "withdraw",
        args: [keccak256(encodePacked(["string"], [verifiedOrcid]))],
      });
      setWithdrawTx(tx);
      setTimeout(refreshOwed, 4000);
    } catch (e) {
      setWithdrawTx(`error: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

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
      <span className="text-[11px] uppercase tracking-[0.15em] text-[var(--accent)]">For authors</span>
      <h1 className="serif mt-2 text-4xl font-semibold tracking-tight">Claim your author wallet</h1>
      <p className="mt-3 text-sm leading-relaxed text-[var(--ink)]/75">
        Prove you own your <strong>ORCID</strong> (OAuth) and your wallet (one signature). The
        operator relays an on-chain binding — every Sebutkan citation of your work then pays
        <span className="italic"> your real wallet</span>. You pay no gas.
      </p>

      <div className="card mt-8 space-y-5 p-6">
        {/* 1. connect wallet */}
        {!isConnected ? (
          <div className="flex flex-wrap gap-2">
            {connectors
              .filter((c) => /metamask/i.test(c.name))
              .filter((c, i, a) => a.findIndex((x) => x.name === c.name) === i)
              .map((c) => (
                <button
                  key={c.uid}
                  onClick={() => connect({ connector: c })}
                  className="rounded-md bg-[var(--accent)] px-4 py-2 text-xs font-medium text-white"
                >
                  Connect {c.name}
                </button>
              ))}
          </div>
        ) : (
          <p className="font-mono text-xs text-[var(--muted)]">{address}</p>
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

        {/* Accrued rewards (UnclaimedEscrow) */}
        {verifiedOrcid ? (
          <div className="mt-2 rounded-lg border border-emerald-200 bg-emerald-50/50 p-4 dark:border-emerald-900 dark:bg-emerald-950/20">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium">Rewards waiting for you</span>
              <span className="font-mono text-sm font-semibold text-emerald-600">
                {(Number(owed) / 1e6).toFixed(2)} USDC
              </span>
            </div>
            <p className="mt-1 text-[11px] text-neutral-500">
              Held on-chain in UnclaimedEscrow for your ORCID until you claim. Bind your wallet above,
              then withdraw.
            </p>
            <button
              onClick={handleWithdraw}
              disabled={owed === 0n || !isConnected}
              className="mt-3 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-medium text-white disabled:opacity-40"
            >
              Withdraw {(Number(owed) / 1e6).toFixed(2)} USDC
            </button>
            {withdrawTx && !withdrawTx.startsWith("error") ? (
              <p className="mt-2 text-[11px] text-emerald-700">
                ✓{" "}
                <a href={`https://sepolia.etherscan.io/tx/${withdrawTx}`} target="_blank" rel="noreferrer" className="underline">
                  withdrawal tx
                </a>
              </p>
            ) : null}
            {withdrawTx?.startsWith("error") ? (
              <p className="mt-2 text-[11px] text-red-600">{withdrawTx}</p>
            ) : null}
          </div>
        ) : null}
      </div>
    </main>
  );
}
