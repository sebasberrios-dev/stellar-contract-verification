"use client";

import Link from "next/link";
import Navbar from "../../components/Navbar";
import CodeBlock from "../../components/ui/CodeBlock";
import AuroraBackground from "../../components/AuroraBackground";
import Reveal from "../../components/Reveal";
import { useI18n } from "../../i18n/LanguageContext";

const BASE_URL = "https://stellar-contract-verification.vercel.app";

// Index-aligned with translations.ts → apiDocs.endpoints
const METHODS = ["GET", "GET", "POST"] as const;
const PATHS = [
  "/api/v1/contracts/{contract_id}/verifications",
  "/api/v1/wasm/{wasm_hash}/verifications",
  "/api/verify",
];
const CURL_EXAMPLES = [
  `curl "${BASE_URL}/api/v1/contracts/YOUR_CONTRACT_ID/verifications?network=testnet"`,
  `curl "${BASE_URL}/api/v1/wasm/YOUR_WASM_HASH/verifications?network=testnet"`,
  `curl -X POST ${BASE_URL}/api/verify \\
  -H "Content-Type: application/json" \\
  -d '{"contract_id": "YOUR_CONTRACT_ID"}'`,
];

function MethodBadge({ method }: { method: "GET" | "POST" }) {
  const isGet = method === "GET";
  return (
    <span
      className={`inline-flex items-center justify-center w-14 h-6 rounded-md text-xs font-mono font-bold shrink-0 ${
        isGet
          ? "bg-success/10 text-success border border-success/30"
          : "bg-secondary/10 text-secondary border border-secondary/30"
      }`}
    >
      {method}
    </span>
  );
}

export default function ApiDocsPage() {
  const { d } = useI18n();
  const t = d.apiDocs;

  return (
    <div className="min-h-screen bg-background relative">
      <Navbar />
      <AuroraBackground />
      <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 pt-28 pb-12">
        <Link
          href="/"
          className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-2 transition-colors mb-6"
          suppressHydrationWarning
        >
          {t.back}
        </Link>

        {/* Hero */}
        <section className="text-center mb-14">
          <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 text-primary text-xs font-medium rounded-full px-3 py-1 mb-6">
            {t.pill}
          </div>
          <h1 className="text-3xl sm:text-5xl font-bold text-foreground tracking-tight mb-4">
            {t.heroTitle}{" "}
            <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              {t.heroTitleAccent}
            </span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto leading-relaxed">
            {t.heroSub}
          </p>
        </section>

        {/* Base URL */}
        <Reveal>
          <section className="mb-10">
            <p className="text-muted-foreground text-sm mb-2">{t.baseUrlLabel}</p>
            <code className="block bg-code border border-border rounded-lg px-4 py-3 text-sm text-primary font-mono break-all">
              {BASE_URL}
            </code>
          </section>
        </Reveal>

        {/* Endpoints */}
        <section className="space-y-6 mb-14">
          {t.endpoints.map((ep, i) => (
            <Reveal key={PATHS[i]}>
              <div className="bg-card border border-border rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-3 flex-wrap">
                  <MethodBadge method={METHODS[i]} />
                  <code className="text-foreground/90 font-mono text-sm break-all">
                    {PATHS[i]}
                  </code>
                </div>
                <h3 className="text-foreground font-semibold text-lg mb-2">{ep.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed mb-4">{ep.desc}</p>
                {ep.params.length > 0 && (
                  <div className="mb-4">
                    <p className="text-muted-foreground/80 text-xs font-medium uppercase tracking-wide mb-2">
                      {ep.paramsLabel}
                    </p>
                    <ul className="space-y-1">
                      {ep.params.map((p) => (
                        <li key={p} className="text-muted-foreground text-sm">
                          <span className="text-primary" aria-hidden="true">◈</span> {p}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                <CodeBlock
                  code={CURL_EXAMPLES[i]}
                  variant={METHODS[i] === "POST" ? "blue" : "cyan"}
                />
              </div>
            </Reveal>
          ))}
        </section>

        {/* Response shape */}
        <Reveal>
          <section className="mb-6">
            <div className="bg-card border border-border rounded-2xl p-6">
              <h2 className="text-foreground font-semibold text-lg mb-2">{t.responseTitle}</h2>
              <p className="text-muted-foreground text-sm leading-relaxed">{t.responseBody}</p>
            </div>
          </section>
        </Reveal>

        {/* Errors */}
        <Reveal>
          <section className="mb-10">
            <div className="bg-card border border-border rounded-2xl p-6">
              <h2 className="text-foreground font-semibold text-lg mb-2">{t.errorsTitle}</h2>
              <p className="text-muted-foreground text-sm leading-relaxed">{t.errorsBody}</p>
            </div>
          </section>
        </Reveal>

        {/* Notes */}
        <Reveal>
          <section>
            <div className="flex gap-2.5 bg-primary/5 border border-primary/20 text-primary text-sm rounded-lg px-4 py-3">
              <span aria-hidden="true">ℹ</span>
              <p className="leading-relaxed">{t.notesBody}</p>
            </div>
          </section>
        </Reveal>
      </div>
    </div>
  );
}
