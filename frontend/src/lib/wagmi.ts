import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { sepolia } from "wagmi/chains";

export const config = getDefaultConfig({
  appName: "Reputation Hook",
  projectId: "reputation-hook-demo", // WalletConnect project ID (get one at cloud.walletconnect.com for production)
  chains: [sepolia],
});
