"use client";

import { Suspense, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Navbar from "../../components/Navbar";
import VerificationForm from "../../components/VerificationForm";
import ResultPanel from "../../components/ResultPanel";
import { useVerifyFlow } from "../../hooks/useVerifyFlow";

function VerifyContent() {
  const searchParams = useSearchParams();
  const idFromUrl = searchParams.get("id")?.trim() ?? "";

  const {
    verificationResult,
    contractId,
    flowState,
    fetchError,
    isCached,
    showResult,
    handleVerify,
  } = useVerifyFlow();

  // Auto-verify once when arriving with ?id= (e.g. from the tutorial)
  const fired = useRef(false);
  useEffect(() => {
    if (idFromUrl && !fired.current) {
      fired.current = true;
      void handleVerify(idFromUrl);
    }
  }, [idFromUrl, handleVerify]);

  return (
    <div className="min-h-screen">
      <Navbar />

      <main className="relative z-10 max-w-2xl mx-auto px-6 pt-28 pb-12">
        <Link
          href="/"
          className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-2 transition-colors mb-8"
          suppressHydrationWarning
        >
          ← Dashboard
        </Link>

        <div className="flex flex-col items-center text-center mb-10">
          <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight mb-3">
            Verify a Contract
          </h1>
          <p className="text-muted-foreground text-base">
            Paste a Contract ID — cached results return instantly.
          </p>
        </div>

        <div className="mb-6">
          <VerificationForm
            onVerify={handleVerify}
            flowState={flowState}
            initialValue={idFromUrl}
          />
        </div>

        <ResultPanel
          data={verificationResult}
          contractId={contractId}
          fetchError={fetchError}
          visible={showResult}
          isCached={isCached}
        />
      </main>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense fallback={null}>
      <VerifyContent />
    </Suspense>
  );
}
