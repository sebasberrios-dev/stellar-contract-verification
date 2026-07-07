"use client";

import { useState, useEffect, useRef } from "react";
import { useWallet } from "../hooks/useWallet";

function truncateAddress(address: string): string {
  if (address.length <= 8) return address;
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
}

export default function WalletButton() {
  const { isConnected, isLoading, publicKey, network, error, connect, disconnect } =
    useWallet();

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!dropdownOpen) return;

    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dropdownOpen]);

  // Estado 3 — Conectando
  if (isLoading) {
    return (
      <button
        type="button"
        disabled
        className="bg-card border border-border text-foreground/80 text-sm font-medium px-4 py-2 rounded-lg flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <svg
          className="animate-spin w-4 h-4 text-muted-foreground"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
        Connecting...
      </button>
    );
  }

  // Estado 4 — Conectada
  if (isConnected && publicKey) {
    return (
      <div className="relative" ref={dropdownRef}>
        <button
          type="button"
          onClick={() => setDropdownOpen((prev) => !prev)}
          aria-label={`Wallet connected: ${publicKey ?? ""}. Open wallet menu`}
          aria-expanded={dropdownOpen}
          aria-haspopup="menu"
          className="bg-success/10 border border-success/30 text-success text-sm px-4 py-2 rounded-full flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
        >
          <span className="w-2 h-2 rounded-full bg-success inline-block" />
          {truncateAddress(publicKey)}
          <svg
            className="w-3 h-3 opacity-70"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>

        {dropdownOpen && (
          <div
            role="menu"
            aria-label="Wallet options"
            className="absolute right-0 top-full mt-2 bg-card border border-border rounded-xl p-2 min-w-48 z-30"
          >
            <div className="px-3 py-2">
              <p className="text-muted-foreground/80 text-xs font-medium uppercase tracking-wider">
                {network ?? "UNKNOWN"}
              </p>
              <p className="text-foreground/80 text-xs mt-1 font-mono">
                {truncateAddress(publicKey)}
              </p>
            </div>
            <div className="border-t border-border my-1" />
            <button
              role="menuitem"
              type="button"
              onClick={() => {
                disconnect();
                setDropdownOpen(false);
              }}
              className="w-full text-left px-3 py-2 text-destructive text-sm rounded-lg hover:bg-destructive/10 transition-colors"
            >
              Disconnect
            </button>
          </div>
        )}
      </div>
    );
  }

  // Estado 2 — Desconectada
  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={() => void connect()}
        className="bg-card border border-border text-foreground/80 text-sm font-medium px-4 py-2 rounded-lg hover:bg-card-hover hover:border-primary/40 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
      >
        Connect Wallet
      </button>
      {error && <p role="alert" className="text-destructive text-xs">{error}</p>}
    </div>
  );
}
