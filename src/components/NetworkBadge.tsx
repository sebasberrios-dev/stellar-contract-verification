"use client";

import { useWallet } from "../hooks/useWallet";

export default function NetworkBadge({
  className = "hidden sm:flex",
}: {
  className?: string;
}) {
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
      <div className={`${className} items-center gap-2 bg-card border border-border rounded-full px-4 py-1.5`}>
        <span className="w-2 h-2 rounded-full bg-primary inline-block" />
        <span className="text-foreground/80 text-xs font-medium">
          Built on Stellar
        </span>
      </div>
    );
  }

  const networkConfig: Record<
    "MAINNET" | "TESTNET" | "FUTURENET",
    { dotClass: string; label: string }
  > = {
    MAINNET: { dotClass: "bg-success", label: "Stellar Mainnet" },
    TESTNET: { dotClass: "bg-warning", label: "Stellar Testnet" },
    FUTURENET: { dotClass: "bg-accent", label: "Stellar Futurenet" },
  };

  const config = networkConfig[network];

  return (
    <div
      className={`${className} items-center gap-2 bg-card border border-border rounded-full px-4 py-1.5`}
      title={
        hasMismatch
          ? `Wallet is on ${network}, app uses ${appNetwork}`
          : undefined
      }
    >
      <span className={`w-2 h-2 rounded-full ${config.dotClass} inline-block`} />
      <span className="text-foreground/80 text-xs font-medium">{config.label}</span>
      {hasMismatch && (
        <span aria-label="Network mismatch warning">⚠</span>
      )}
    </div>
  );
}
