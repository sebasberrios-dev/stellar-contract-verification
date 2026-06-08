"use client";

import { useState } from "react";
import Navbar from "../components/Navbar";
import Logo from "../components/Logo";
import StarryBackground from "../components/StarryBackground";
import CircuitTraces from "../components/CircuitTraces";
import ShieldLogo from "../components/ShieldLogo";
import VerificationForm from "../components/VerificationForm";
import BadgesRow from "../components/BadgesRow";
import ResultPanel from "../components/ResultPanel";
import AccordionSection from "../components/AccordionSection";
import { lookupContract, submitVerification } from "./actions/verify";
import type { VerificationEntry, VerifyFlowState } from "../types/index";

export default function Home() {
  const [verificationResult, setVerificationResult] = useState<VerificationEntry | null>(null);
  const [contractId, setContractId] = useState<string>("");
  const [flowState, setFlowState] = useState<VerifyFlowState>("idle");
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [isCached, setIsCached] = useState(false);

  async function handleVerify(id: string) {
    setVerificationResult(null);
    setFetchError(null);
    setContractId(id);

    // Step 1: GET-first — check cache
    setFlowState("loading-cache");
    try {
      const lookup = await lookupContract(id);
      const first = lookup.verifications[0];
      if (first && (first.status === "verified" || first.status === "mismatch")) {
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
      setVerificationResult(result.verifications[0] ?? null);
      setIsCached(false);
      setFlowState("cached-result");
    } catch (e) {
      setFetchError(e instanceof Error ? e.message : "Unexpected error");
      setIsCached(false);
      setFlowState("error");
    }
  }

  const showResult = flowState === "cached-result" || flowState === "error";

  return (
    <div className="min-h-screen" style={{ background: "#0a0b0f" }}>
      <Navbar />

      <main className="relative">
        {/* Background layers */}
        <StarryBackground />
        <CircuitTraces />

        {/* CSV logo watermark — sits above the starry background, below the content */}
        <div
          className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[1] w-[600px] h-[600px] opacity-[0.06] pointer-events-none"
          aria-hidden="true"
        >
          <Logo variant="full" className="w-full h-full" />
        </div>

        {/* Content */}
        <div className="relative z-10 max-w-2xl mx-auto px-6 py-12">

          {/* Hero */}
          <div className="flex flex-col items-center text-center mb-10">
            <ShieldLogo className="mb-6" />
            <h1 className="text-4xl sm:text-5xl font-bold text-white tracking-tight mb-3">
              Contract Source Verify
            </h1>
            <p className="text-slate-400 text-lg tracking-wide">
              Secure&nbsp;•&nbsp;Transparent&nbsp;•&nbsp;Verified
            </p>
          </div>

          {/* Verification form */}
          <div className="mb-6">
            <VerificationForm onVerify={handleVerify} flowState={flowState} />
          </div>

          {/* Badges */}
          <div className="mb-8">
            <BadgesRow />
          </div>

          {/* Result panel — appears after verification */}
          <div className="mb-8">
            <ResultPanel
              data={verificationResult}
              contractId={contractId}
              fetchError={fetchError}
              visible={showResult}
              isCached={isCached}
            />
          </div>

          {/* Accordion — learn more */}
          <AccordionSection />

          {/* Mini footer inside content col */}
          <p className="text-center text-slate-600 text-xs mt-12 tracking-widest uppercase">
            Built on Stellar
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/10 px-6 py-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-slate-500 text-sm">
          <span>© 2026 CSV Stellar Verification. Powered by Soroban.</span>
          <nav className="flex items-center gap-5">
            <a
              href="https://github.com/sebasberrios-dev/stellar-contract-verification/issues"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-slate-300 transition-colors"
              suppressHydrationWarning
            >
              Issues
            </a>
            <a
              href="https://github.com/sebasberrios-dev/stellar-contract-verification/security"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-slate-300 transition-colors"
              suppressHydrationWarning
            >
              Security
            </a>
            <a
              href="https://github.com/sebasberrios-dev/stellar-contract-verification"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-slate-300 transition-colors"
              suppressHydrationWarning
            >
              GitHub
            </a>
          </nav>
        </div>
      </footer>
    </div>
  );
}
