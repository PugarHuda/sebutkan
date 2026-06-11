"use client";

import { useState } from "react";
import { useAccount, useConnect, useSignMessage } from "wagmi";
import { keccak256, encodePacked, getAddress } from "viem";

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
  const [authorId, setAuthorId] = useState("https://openalex.org/A5023888391");
  const [claim, setClaim] = useState<ClaimState>({ status: "idle" });

  async function handleClaim() {
    if (!address) return;
    setClaim({ status: "signing" });
    try {
      // Sign the exact message the registry & server verify.
      const message = keccak256(encodePacked(["string", "address"], [authorId, getAddress(address)]));
      const signature = await signMessageAsync({ message: { raw: message } });

      setClaim({ status: "binding" });
      const res = await fetch("/api/claim", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ authorId, wallet: address, signature }),
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
        Bind your OpenAlex/ORCID author id to a wallet on-chain. Prove control with one signature —
        the operator relays the binding so you pay no gas. After this, every Sebutkan citation of
        your work pays <span className="italic">your real wallet</span>.
      </p>

      <div className="mt-8 space-y-4 rounded-2xl border border-neutral-200 bg-white/60 p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900/40">
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

        <label className="block text-xs">
          <span className="mb-1 block text-neutral-500">OpenAlex / ORCID author id</span>
          <input
            value={authorId}
            onChange={(e) => setAuthorId(e.target.value)}
            className="w-full rounded-md border border-neutral-300 bg-transparent px-3 py-2 font-mono text-xs dark:border-neutral-700"
          />
        </label>

        <button
          onClick={handleClaim}
          disabled={!isConnected || claim.status === "signing" || claim.status === "binding"}
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
            <a
              href={`https://sepolia.etherscan.io/tx/${claim.txHash}`}
              target="_blank"
              rel="noreferrer"
              className="underline"
            >
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
