/**
 * wagmi config — Sebutkan
 *
 * Sepolia is where ERC-7715 Advanced Permissions are granted/redeemed (MetaMask
 * Flask; supporting Snaps are Sepolia-only). Base is where x402 + Venice settle.
 */
import { createConfig, http } from "wagmi";
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
