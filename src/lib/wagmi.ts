/**
 * wagmi config — Sebutkan
 *
 * Sepolia is where ERC-7715 Advanced Permissions are granted/redeemed (MetaMask
 * Flask; supporting Snaps are Sepolia-only). Base is where x402 + Venice settle.
 */
import { createConfig, http, type Connector } from "wagmi";
import { sepolia, base } from "wagmi/chains";
import { injected } from "wagmi/connectors";

// This is the MetaMask hackathon and ERC-7715 needs MetaMask Flask — connect to
// the injected MetaMask/Flask extension directly (the MetaMask SDK connector
// opens an SDK modal/QR instead of the extension, which blocks the click).
export const wagmiConfig = createConfig({
  chains: [sepolia, base],
  connectors: [injected({ shimDisconnect: true })],
  transports: {
    [sepolia.id]: http(process.env.NEXT_PUBLIC_SEPOLIA_RPC),
    [base.id]: http(process.env.NEXT_PUBLIC_BASE_RPC),
  },
  ssr: true,
});

declare module "wagmi" {
  interface Register {
    config: typeof wagmiConfig;
  }
}

/**
 * Pick the MetaMask **Flask** connector specifically (EIP-6963 announces it as
 * rdns `io.metamask.flask` / name "MetaMask Flask"). ERC-7715 Advanced
 * Permissions only run on Flask, and selecting the exact provider avoids the
 * ambiguous `window.ethereum` (which, with both regular MetaMask + Flask
 * installed, would otherwise connect the wrong wallet — or both).
 */
export function pickFlaskConnector(connectors: readonly Connector[]): Connector | undefined {
  const isFlask = (c: Connector) => {
    const rdns = (c as { rdns?: string | readonly string[] }).rdns;
    const rdnsMatch = Array.isArray(rdns) ? rdns.includes("io.metamask.flask") : rdns === "io.metamask.flask";
    return rdnsMatch || c.id === "io.metamask.flask" || /flask/i.test(c.name);
  };
  // Prefer the EIP-6963-tagged Flask provider (rdns), else any /flask/ named connector.
  return connectors.find((c) => {
    const rdns = (c as { rdns?: string | readonly string[] }).rdns;
    return Array.isArray(rdns) ? rdns.includes("io.metamask.flask") : rdns === "io.metamask.flask";
  }) ?? connectors.find(isFlask);
}
