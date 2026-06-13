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

/**
 * One-click fix for the #1 support issue: MetaMask's default Sepolia RPC (Infura)
 * is rate-limited and can't read the USDC token, so Grant fails. This auto-adds a
 * working public RPC via wallet_addEthereumChain (connecting Flask first if
 * needed) — no manual network form. MetaMask either adds Sepolia or appends the
 * RPC to the existing network and switches to it.
 */
export function FixSepoliaRpcButton({ className }: { className?: string }) {
  const { isConnected, connector } = useAccount();
  const { connectors, connectAsync } = useConnect();
  const { switchChainAsync } = useSwitchChain();
  const [state, setState] = useState<"idle" | "working" | "done" | "error">("idle");
  const [msg, setMsg] = useState<string | null>(null);

  async function fix() {
    setState("working");
    setMsg(null);
    try {
      // Connect Flask first if the user isn't connected yet.
      let active = connector;
      if (!isConnected || !active) {
        const flask = pickFlaskConnector(connectors);
        if (!flask) throw new Error("MetaMask Flask not found — install it first.");
        const res = await connectAsync({ connector: flask });
        active = res.accounts ? flask : active;
      }
      const provider = (await active?.getProvider()) as Eip1193 | undefined;
      if (!provider?.request) throw new Error("Wallet provider unavailable — reconnect and retry.");

      await provider.request({ method: "wallet_addEthereumChain", params: [SEPOLIA_ADD_PARAMS] });
      // Make sure we're on Sepolia after adding.
      try {
        await switchChainAsync({ chainId: 11155111 });
      } catch {
        /* user may already be on Sepolia */
      }
      setState("done");
      setMsg("✓ Sepolia RPC added. Try Grant again.");
    } catch (e) {
      const raw = e instanceof Error ? e.message : String(e);
      setState("error");
      setMsg(/rejected|denied/i.test(raw) ? "You dismissed the wallet prompt." : raw);
    }
  }

  return (
    <span className="inline-flex flex-col gap-1">
      <button
        onClick={fix}
        disabled={state === "working"}
        className={
          className ??
          "rounded-md bg-amber-500 px-3 py-1.5 text-[11px] font-medium text-white transition hover:bg-amber-600 disabled:opacity-50"
        }
      >
        {state === "working" ? "Adding RPC…" : "⚡ Auto-fix Sepolia RPC"}
      </button>
      {msg ? <span className={`text-[10px] ${state === "error" ? "text-red-600" : "text-emerald-600"}`}>{msg}</span> : null}
    </span>
  );
}
