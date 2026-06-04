"use client";

import { useWallet } from "../hooks/useWallet";

export default function NetworkBadge() {
  const { isConnected, network } = useWallet();

  const appNetwork =
    process.env.NEXT_PUBLIC_STELLAR_NETWORK?.toUpperCase() ?? null;
  const hasMismatch =
    isConnected &&
    network !== null &&
    appNetwork !== null &&
    network !== appNetwork;

  if (!isConnected || network === null) {
    return (
      <div className="hidden sm:flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-1.5">
        <span className="w-2 h-2 rounded-full bg-[#00BFFF] inline-block" />
        <span className="text-slate-300 text-xs font-medium">
          Built on Stellar XLM
        </span>
      </div>
    );
  }

  const networkConfig: Record<
    "MAINNET" | "TESTNET" | "FUTURENET",
    { dotClass: string; label: string }
  > = {
    MAINNET: { dotClass: "bg-green-400", label: "Stellar Mainnet" },
    TESTNET: { dotClass: "bg-yellow-400", label: "Stellar Testnet" },
    FUTURENET: { dotClass: "bg-purple-400", label: "Stellar Futurenet" },
  };

  const config = networkConfig[network];

  return (
    <div
      className="hidden sm:flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-1.5"
      title={
        hasMismatch
          ? `Wallet is on ${network}, app uses ${appNetwork}`
          : undefined
      }
    >
      <span className={`w-2 h-2 rounded-full ${config.dotClass} inline-block`} />
      <span className="text-slate-300 text-xs font-medium">{config.label}</span>
      {hasMismatch && (
        <span aria-label="Network mismatch warning">⚠</span>
      )}
    </div>
  );
}
