"use client";

import Image from "next/image";
import Navbar from "../components/Navbar";
import HeroVideo from "../components/HeroVideo";
import StarryBackground from "../components/StarryBackground";
import AuroraBackground from "../components/AuroraBackground";
import Reveal from "../components/Reveal";
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
        {/* Background layers — no circuit traces: cleaner, type-first look */}
        <StarryBackground />
        <AuroraBackground />

        {/* CSV logo watermark — sits above the starry background, below the content */}
        <div
          className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[1] w-[min(680px,90vw)] opacity-[0.05] pointer-events-none"
          aria-hidden="true"
        >
          <Image
            src="/images/csv-logo.webp"
            alt=""
            width={1189}
            height={513}
            className="w-full h-auto"
          />
        </div>

        {/* Content */}
        <div className="relative z-10 max-w-2xl mx-auto px-6 pt-28 pb-12">

          {/* Hero */}
          <Reveal>
            <div className="flex flex-col items-center text-center mb-12">
              <HeroVideo className="w-[min(460px,88vw)] -my-8" />
              <h1 className="text-4xl sm:text-6xl font-bold text-foreground leading-[1.05] mt-4 mb-5">
                Verify smart contracts.
                <br />
                <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  Trust the source.
                </span>
              </h1>
              <p className="text-muted-foreground text-lg sm:text-xl max-w-xl leading-relaxed">
                CSV rebuilds Soroban contracts from their public source and
                proves the on-chain WASM matches. Secure. Transparent. Verified.
              </p>
            </div>
          </Reveal>

          {/* Verification form */}
          <Reveal delay={100}>
            <div className="mb-6">
              <VerificationForm onVerify={handleVerify} flowState={flowState} />
            </div>
          </Reveal>

          {/* Badges */}
          <Reveal delay={200}>
            <div className="mb-8">
              <BadgesRow />
            </div>
          </Reveal>

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
          <Reveal>
            <AccordionSection />
          </Reveal>

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
