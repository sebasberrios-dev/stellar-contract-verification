"use client";

import { useState, useEffect, useCallback } from "react";
import {
  isConnected,
  requestAccess,
  getAddress,
  getNetwork,
} from "@stellar/freighter-api";

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

export function useWallet() {
  const [state, setState] = useState<WalletState>({
    isConnected: false,
    publicKey: null,
    network: null,
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    async function checkConnection() {
      try {
        const connectedResult = await isConnected();
        if (connectedResult.isConnected) {
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
        } else {
          setState((prev) => ({ ...prev, isConnected: false, isLoading: false }));
        }
      } catch (e) {
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: e instanceof Error ? e.message : "Failed to connect to Freighter",
        }));
      }
    }
    checkConnection();
  }, []);

  const connect = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
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
