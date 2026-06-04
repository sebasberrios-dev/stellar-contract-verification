"use client";

import { useState } from "react";
import { VerificationStatus, VerifyResponse } from "../types/index";
import VerifyForm from "../components/VerifyForm";
import VerificationResult from "../components/VerificationResult";
import ProgressSteps from "../components/ProgressSteps";
import StatsCard from "../components/ui/StatsCard";
import NetworkBar from "../components/ui/NetworkBar";
import RecentVerifications from "../components/RecentVerifications";
import { submitVerification } from "./actions/verify";
import Logo from "../components/Logo";
import WalletButton from "../components/WalletButton";
import NetworkBadge from "../components/NetworkBadge";

// Stats de demo — se reemplazarán con datos reales del backend
const DEMO_STATS = {
  total: "12,482",
  verified: "8,940",
  pending: "412",
  failed: "130",
};

const DEMO_NETWORKS = [
  { name: "Mainnet", coverage: 98.2, color: "green" as const },
  { name: "Testnet", coverage: 85.4, color: "cyan" as const },
  { name: "Futurenet", coverage: 42.1, color: "yellow" as const },
];

export default function Home() {
  const [status, setStatus] = useState<VerificationStatus>("idle");
  const [result, setResult] = useState<VerifyResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<number>(0);

  async function handleVerify(contractId: string) {
    setStatus("loading");
    setResult(null);
    setError(null);
    setCurrentStep(1);

    const interval = setInterval(() => {
      setCurrentStep((prev) => (prev < 5 ? prev + 1 : prev));
    }, 20000);

    try {
      const data = await submitVerification(contractId);
      clearInterval(interval);
      setResult(data);
      setStatus("success");
    } catch (e) {
      clearInterval(interval);
      setError(e instanceof Error ? e.message : "Unknown error");
      setStatus("error");
    }
  }

  return (
    <div className="min-h-screen" style={{ background: "#000000" }}>
      {/* Header */}
      <header className="border-b border-white/10 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          {/* Logo */}
          <Logo />

          {/* Center badge */}
          <NetworkBadge />

          {/* Connect Wallet */}
          <WalletButton />
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-10">
        {/* Hero */}
        <section className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-3 py-1 mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00BFFF]" />
            <span className="text-xs text-slate-400 font-medium">Built on Soroban</span>
          </div>
          <h1 className="text-5xl font-bold text-white tracking-tight mb-3">
            Contract Source Verify
          </h1>
          <p className="text-zinc-400 text-lg">Secure. Transparent. Verified.</p>
        </section>

        {/* Stats row */}
        <section className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
          <StatsCard label="Total Contracts" value={DEMO_STATS.total} color="white" />
          <StatsCard label="Verified" value={DEMO_STATS.verified} color="cyan" />
          <StatsCard label="Pending" value={DEMO_STATS.pending} color="yellow" />
          <StatsCard label="Failed" value={DEMO_STATS.failed} color="red" />
        </section>

        {/* Grid 2 col: VerifyForm + RecentVerifications */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
          {/* Left: VerifyForm + ProgressSteps + VerificationResult */}
          <div className="flex flex-col gap-4">
            <VerifyForm onSubmit={handleVerify} isLoading={status === "loading"} />

            {status === "loading" && (
              <ProgressSteps currentStep={currentStep} />
            )}

            <VerificationResult status={status} result={result} error={error} />
          </div>

          {/* Right: RecentVerifications */}
          <RecentVerifications />
        </section>

        {/* Network Coverage */}
        <section className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 mb-10">
          <h2 className="text-white font-semibold text-lg mb-6">Network Coverage</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {DEMO_NETWORKS.map((network) => (
              <NetworkBar
                key={network.name}
                name={network.name}
                coverage={network.coverage}
                color={network.color}
              />
            ))}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 px-6 py-6">
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
