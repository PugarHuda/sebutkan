"use client";

import { useState } from "react";
import { useAccount, useConnect, useSwitchChain } from "wagmi";
import { pickFlaskConnector } from "@/lib/wagmi";

/** EIP-3085 params: add Sepolia with a reliable public RPC (no manual fields). */
const SEPOLIA_ADD_PARAMS = {
  chainId: "0xaa36a7", // 11155111
  chainName: "Sepolia",
  nativeCurrency: { name: "Sepolia Ether", symbol: "SepoliaETH", decimals: 18 },
  rpcUrls: ["https://ethereum-sepolia-rpc.publicnode.com"],
  blockExplorerUrls: ["https://sepolia.etherscan.io"],
};

type Eip1193 = { request: (a: { method: string; params?: unknown[] }) => Promise<unknown> };

/** Pull a readable message out of an Error OR an EIP-1193 `{code,message}` object. */
function errMessage(e: unknown): string {
  if (e instanceof Error) return e.message;
  if (e && typeof e === "object") {
    const o = e as { shortMessage?: unknown; message?: unknown; data?: { message?: unknown } };
    if (typeof o.shortMessage === "string") return o.shortMessage;
    if (typeof o.message === "string") return o.message;
    if (o.data && typeof o.data.message === "string") return o.data.message;
  }
  return "Something went wrong adding the network.";
}

/**
 * One-click fix for the #1 support issue: MetaMask's default Sepolia RPC (Infura)
 * is rate-limited and can't read the USDC token, so Grant fails. This auto-adds a
 * working public RPC via wallet_addEthereumChain (connecting Flask first if
 * needed) — no manual network form.
 *
 * `variant`: "button" (default, full pill) or "link" (compact inline link).
 */
export function FixSepoliaRpcButton({ variant = "button" }: { variant?: "button" | "link" }) {
  const { isConnected, connector } = useAccount();
  const { connectors, connectAsync } = useConnect();
  const { switchChainAsync } = useSwitchChain();
  const [state, setState] = useState<"idle" | "working" | "done" | "error">("idle");
  const [msg, setMsg] = useState<string | null>(null);

  async function fix() {
    setState("working");
    setMsg(null);
    try {
      let active = connector;
      if (!isConnected || !active) {
        const flask = pickFlaskConnector(connectors);
        if (!flask) throw new Error("MetaMask Flask not found — install it first.");
        await connectAsync({ connector: flask });
        active = flask;
      }
      const provider = (await active?.getProvider()) as Eip1193 | undefined;
      if (!provider?.request) throw new Error("Wallet provider unavailable — reconnect and retry.");

      await provider.request({ method: "wallet_addEthereumChain", params: [SEPOLIA_ADD_PARAMS] });
      try {
        await switchChainAsync({ chainId: 11155111 });
      } catch {
        /* may already be on Sepolia */
      }
      setState("done");
      setMsg("Sepolia RPC added — try Grant again.");
    } catch (e) {
      const raw = errMessage(e);
      setState("error");
      setMsg(/rejected|denied|cancel/i.test(raw) ? "You dismissed the wallet prompt." : raw);
    }
  }

  const label =
    state === "working" ? "Adding RPC…" : state === "done" ? "✓ RPC added" : "⚡ Auto-fix Sepolia RPC";

  const btnClass =
    variant === "link"
      ? "inline-flex items-center gap-1 text-[10px] font-medium text-[var(--accent)] underline-offset-2 hover:underline disabled:opacity-50"
      : "inline-flex items-center gap-1.5 rounded-md bg-amber-500 px-3 py-1.5 text-[11px] font-medium text-white shadow-sm transition hover:bg-amber-600 disabled:opacity-60";

  return (
    <span className="inline-flex flex-col items-start gap-1">
      <button onClick={fix} disabled={state === "working"} className={btnClass}>
        {state === "working" ? (
          <span className="inline-block h-3 w-3 animate-spin rounded-full border-[1.5px] border-white/40 border-t-white" />
        ) : null}
        {label}
      </button>
      {msg ? (
        <span className={`max-w-[220px] text-[10px] leading-snug ${state === "error" ? "text-red-600" : "text-emerald-600"}`}>
          {state === "error" ? "⚠ " : "✓ "}
          {msg}
        </span>
      ) : null}
    </span>
  );
}
