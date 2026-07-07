"use client";

import Navbar from "../components/Navbar";
import Logo from "../components/Logo";
import StarryBackground from "../components/StarryBackground";
import CircuitTraces from "../components/CircuitTraces";
import ShieldLogo from "../components/ShieldLogo";
import VerificationForm from "../components/VerificationForm";
import BadgesRow from "../components/BadgesRow";
import ResultPanel from "../components/ResultPanel";
import AccordionSection from "../components/AccordionSection";
import { useVerifyFlow } from "../hooks/useVerifyFlow";

export default function Home() {
  const {
    verificationResult,
    contractId,
    flowState,
    fetchError,
    isCached,
    showResult,
    handleVerify,
  } = useVerifyFlow();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="relative">
        {/* Background layers */}
        <StarryBackground />
        <CircuitTraces />

        {/* CSV logo watermark — sits above the starry background, below the content */}
        <div
          className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[1] w-[min(600px,90vw)] h-[min(600px,90vw)] opacity-[0.06] pointer-events-none"
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
            <p className="text-muted-foreground text-lg tracking-wide">
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
          <p className="text-center text-muted-foreground/70 text-xs mt-12 tracking-widest uppercase">
            Built on Stellar
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-border px-6 py-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-muted-foreground/80 text-sm">
          <span>© 2026 CSV Stellar Verification. Powered by Soroban.</span>
          <nav className="flex items-center gap-5">
            <a
              href="https://github.com/sebasberrios-dev/stellar-contract-verification/issues"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground/80 transition-colors"
              suppressHydrationWarning
            >
              Issues
            </a>
            <a
              href="https://github.com/sebasberrios-dev/stellar-contract-verification/security"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground/80 transition-colors"
              suppressHydrationWarning
            >
              Security
            </a>
            <a
              href="https://github.com/sebasberrios-dev/stellar-contract-verification"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground/80 transition-colors"
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
