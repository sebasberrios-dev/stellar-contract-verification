"use client";

import { useState, useEffect, useCallback } from "react";

interface WalletState {
  isConnected: boolean;
  publicKey: string | null;
  network: "MAINNET" | "TESTNET" | "FUTURENET" | null;
  isLoading: boolean;
  error: string | null;
}

type NetworkType = "MAINNET" | "TESTNET" | "FUTURENET";

function normalizeNetwork(raw: string): NetworkType | null {
  const upper = raw.toUpperCase();
  if (upper === "MAINNET" || upper === "PUBLIC") return "MAINNET";
  if (upper === "TESTNET") return "TESTNET";
  if (upper === "FUTURENET") return "FUTURENET";
  return null;
}

// The Freighter SDK is loaded on demand so it never ships in the initial
// bundle nor runs during hydration — the landing page renders without it.
function loadFreighter() {
  return import("@stellar/freighter-api");
}

export function useWallet() {
  const [state, setState] = useState<WalletState>({
    isConnected: false,
    publicKey: null,
    network: null,
    isLoading: false,
    error: null,
  });

  useEffect(() => {
    let cancelled = false;

    async function checkConnection() {
      try {
        const { isConnected, getAddress, getNetwork } = await loadFreighter();
        const connectedResult = await isConnected();
        if (cancelled) return;
        if (connectedResult.isConnected) {
          const [addressResult, networkResult] = await Promise.all([
            getAddress(),
            getNetwork(),
          ]);
          if (cancelled) return;
          setState({
            isConnected: true,
            publicKey: addressResult.address ?? null,
            network: normalizeNetwork(networkResult.network),
            isLoading: false,
            error: null,
          });
        }
      } catch {
        // No Freighter extension (e.g. mobile) — stay in the disconnected
        // state silently; the error surface belongs to an explicit connect().
      }
    }

    // Defer the silent reconnect check until the browser is idle so it never
    // competes with first paint / hydration.
    const hasIdle = "requestIdleCallback" in window;
    const handle = hasIdle
      ? window.requestIdleCallback(() => void checkConnection())
      : window.setTimeout(() => void checkConnection(), 1500);

    return () => {
      cancelled = true;
      if (hasIdle) window.cancelIdleCallback(handle);
      else window.clearTimeout(handle);
    };
  }, []);

  const connect = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      const { requestAccess, getAddress, getNetwork } = await loadFreighter();
      await requestAccess();
      const [addressResult, networkResult] = await Promise.all([
        getAddress(),
        getNetwork(),
      ]);
      setState({
        isConnected: true,
        publicKey: addressResult.address ?? null,
        network: normalizeNetwork(networkResult.network),
        isLoading: false,
        error: null,
      });
    } catch (e) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: e instanceof Error ? e.message : "Connection failed",
      }));
    }
  }, []);

  const disconnect = useCallback(() => {
    setState({
      isConnected: false,
      publicKey: null,
      network: null,
      isLoading: false,
      error: null,
    });
  }, []);

  return { ...state, connect, disconnect };
}
