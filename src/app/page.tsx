"use client";

import { useState } from "react";
import Logo from "../components/Logo";
import WalletButton from "../components/WalletButton";
import NetworkBadge from "../components/NetworkBadge";
import ParticlesBackground from "../components/ParticlesBackground";
import CircuitTraces from "../components/CircuitTraces";
import ShieldLogo from "../components/ShieldLogo";
import VerificationForm from "../components/VerificationForm";
import BadgesRow from "../components/BadgesRow";
import ResultPanel from "../components/ResultPanel";
import AccordionSection from "../components/AccordionSection";
import { submitVerification } from "./actions/verify";
import type { VerifyResponse } from "../types/index";

export default function Home() {
  const [verificationResult, setVerificationResult] = useState<VerifyResponse | null>(null);
  const [contractId, setContractId] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  async function handleVerify(id: string) {
    setLoading(true);
    setShowResult(false);
    setVerificationResult(null);
    setFetchError(null);
    setContractId(id);

    try {
      const result = await submitVerification(id);
      setVerificationResult(result);
    } catch (e) {
      setFetchError(e instanceof Error ? e.message : "Unexpected error");
    } finally {
      setShowResult(true);
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen" style={{ background: "#0a0b0f" }}>
      {/* Navbar */}
      <header className="relative z-20 border-b border-white/10 px-6 py-4 backdrop-blur-sm bg-[#0a0b0f]/80">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Logo />
          <NetworkBadge />
          <WalletButton />
        </div>
      </header>

      <main className="relative">
        {/* Background layers */}
        <ParticlesBackground />
        <CircuitTraces />

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
            <VerificationForm onVerify={handleVerify} loading={loading} />
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
          <span>© 2024 CSV Stellar Verification. Powered by Soroban.</span>
          <nav className="flex items-center gap-5">
            <a href="#" className="hover:text-slate-300 transition-colors" suppressHydrationWarning>Terms</a>
            <a href="#" className="hover:text-slate-300 transition-colors" suppressHydrationWarning>Privacy</a>
            <a href="#" className="hover:text-slate-300 transition-colors" suppressHydrationWarning>Security</a>
            <a href="#" className="hover:text-slate-300 transition-colors" suppressHydrationWarning>GitHub</a>
          </nav>
        </div>
      </footer>
    </div>
  );
}
