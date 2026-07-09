"use client";

import { useState, useCallback } from "react";
import { lookupContract, submitVerification } from "../app/actions/verify";
import type { VerificationEntry, VerifyFlowState } from "../types/index";

/**
 * GET-first verification flow shared by the dashboard and /verify.
 * 1. GET the cache — instant result if already processed.
 * 2. Fall back to POST — synchronous rebuild (2–6 min).
 */
export function useVerifyFlow() {
  const [verificationResult, setVerificationResult] =
    useState<VerificationEntry | null>(null);
  const [contractId, setContractId] = useState<string>("");
  const [flowState, setFlowState] = useState<VerifyFlowState>("idle");
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [isCached, setIsCached] = useState(false);

  const handleVerify = useCallback(async (id: string) => {
    setVerificationResult(null);
    setFetchError(null);
    setContractId(id);

    // Step 1: GET-first — check cache
    setFlowState("loading-cache");
    try {
      const lookup = await lookupContract(id);
      const first = lookup.verifications[0];
      if (
        first &&
        (first.status === "verified" ||
          first.status === "mismatch" ||
          first.status === "failed")
      ) {
        setVerificationResult(first);
        setIsCached(true);
        setFlowState("cached-result");
        return;
      }
    } catch {
      // Cache miss or backend unreachable — fall through to POST
    }

    // Step 2: POST — trigger a rebuild
    setFlowState("verifying");
    try {
      const result = await submitVerification(id);
      const entry = result.verifications[0] ?? null;
      if (!entry) {
        setFetchError("Verification finished but no result was returned.");
        setFlowState("error");
        return;
      }
      setVerificationResult(entry);
      setIsCached(false);
      setFlowState("cached-result");
    } catch (e) {
      setFetchError(e instanceof Error ? e.message : "Unexpected error");
      setIsCached(false);
      setFlowState("error");
    }
  }, []);

  const showResult = flowState === "cached-result" || flowState === "error";

  return {
    verificationResult,
    contractId,
    flowState,
    fetchError,
    isCached,
    showResult,
    handleVerify,
  };
}
