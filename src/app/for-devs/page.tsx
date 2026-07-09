"use client";

import { useState } from "react";
import Link from "next/link";
import { GitCommit, Terminal, Rocket, CheckCircle2 } from "lucide-react";
import Navbar from "../../components/Navbar";
import CodeBlock from "../../components/ui/CodeBlock";
import AuroraBackground from "../../components/AuroraBackground";
import Reveal from "../../components/Reveal";
import { useI18n } from "../../i18n/LanguageContext";
import { renderTokens } from "../../i18n/renderTokens";

const YAML_TEMPLATE = `name: Build & Verify Soroban Contract
on:
  push:
    branches: [main]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: stellar/stellar-cli@v27.0.0
      - run: rustup target add wasm32v1-none
      - name: Build with SEP-58 metadata
        run: |
          stellar contract build \\
            --meta "source_repo=\${{ github.server_url }}/\${{ github.repository }}" \\
            --meta "source_rev=\${{ github.sha }}"`;

// Icon/color assignment per step — the copy lives in the i18n dictionary
const STEP_VISUALS = [
  { n: "01", icon: GitCommit, iconClass: "text-primary" },
  { n: "02", icon: Terminal, iconClass: "text-secondary" },
  { n: "03", icon: Rocket, iconClass: "text-accent" },
  { n: "04", icon: CheckCircle2, iconClass: "text-success" },
];

function NetworkDot({ dotClass, label }: { dotClass: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
      <span className={`w-1.5 h-1.5 rounded-full ${dotClass}`} />
      {label}
    </span>
  );
}

function FaqAccordion() {
  const { d } = useI18n();
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="space-y-3">
      {d.forDevs.faq.map((item, i) => {
        const isOpen = openIndex === i;
        return (
          <div
            key={item.q}
            className="bg-card border border-border rounded-2xl overflow-hidden"
          >
            <button
              type="button"
              onClick={() => setOpenIndex(isOpen ? null : i)}
              aria-expanded={isOpen}
              className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left hover:bg-card-hover transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:ring-inset"
            >
              <span className="text-foreground/90 text-sm font-medium">{item.q}</span>
              <span
                className="text-primary text-xl leading-none shrink-0 transition-transform duration-300 ease-in-out motion-reduce:transition-none"
                style={{ transform: isOpen ? "rotate(45deg)" : "rotate(0deg)" }}
                aria-hidden="true"
              >
                +
              </span>
            </button>
            {/* grid-rows animation — never clips long answers */}
            <div
              className="grid transition-[grid-template-rows,opacity] duration-300 ease-in-out motion-reduce:transition-none"
              style={{
                gridTemplateRows: isOpen ? "1fr" : "0fr",
                opacity: isOpen ? 1 : 0,
              }}
            >
              <div className="overflow-hidden">
                <p className="px-5 pb-4 text-muted-foreground text-sm leading-relaxed">
                  {item.a}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function ForDevsPage() {
  const { d } = useI18n();
  const t = d.forDevs;

  return (
    <div className="min-h-screen bg-background relative">
      <Navbar />
      <AuroraBackground />
      <div className="relative z-10 max-w-4xl mx-auto px-6 pt-16">
        <Link
          href="/"
          className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-2 transition-colors pt-6"
          suppressHydrationWarning
        >
          {t.back}
        </Link>

        {/* Hero */}
        <section className="text-center py-16 md:py-24">
          <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 text-primary text-xs font-medium rounded-full px-3 py-1 mb-6">
            {t.pill}
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-foreground tracking-tight mb-4">
            {t.heroTitle}{" "}
            <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              {t.heroTitleAccent}
            </span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto mb-8 leading-relaxed">
            {t.heroSub}
          </p>
          <div className="flex items-center justify-center gap-6 mb-8">
            <NetworkDot dotClass="bg-success" label={t.netTestnet} />
            <NetworkDot dotClass="bg-muted-foreground/40" label={t.netMainnet} />
          </div>
          <Link
            href="/for-devs/tutorial"
            className="inline-flex items-center gap-2 h-11 bg-foreground text-background font-semibold text-sm rounded-full px-6 transition-all hover:bg-foreground/90 hover:shadow-glow-cyan focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            suppressHydrationWarning
          >
            {t.ctaTutorial}
          </Link>
        </section>

        {/* What is SEP-58? */}
        <Reveal>
        <section className="mb-16">
          <div className="bg-card border border-border rounded-2xl p-6">
            <span className="text-primary text-2xl" aria-hidden="true">◈</span>
            <h2 className="text-foreground font-semibold text-xl mt-3 mb-2">
              {t.sep58CardTitle}
            </h2>
            <p className="text-muted-foreground text-sm leading-relaxed">
              {t.sep58CardBody}
            </p>
          </div>
        </section>
        </Reveal>

        {/* Quick overview — 4 steps */}
        <Reveal>
        <section className="mb-16">
          <h2 className="text-foreground font-semibold text-xl mb-6">{t.overviewTitle}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            {STEP_VISUALS.map((visual, i) => {
              const Icon = visual.icon;
              const step = t.steps[i];
              return (
                <div
                  key={visual.n}
                  className="bg-card border border-border rounded-2xl p-5 hover:border-primary/40 transition-colors duration-300"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <span className="font-mono text-xs text-muted-foreground/70 font-bold">{visual.n}</span>
                    <Icon className={`w-4 h-4 ${visual.iconClass}`} aria-hidden="true" />
                  </div>
                  <h3 className="text-foreground/90 font-medium text-sm mb-1">{step.title}</h3>
                  <p className="text-muted-foreground/80 text-xs leading-relaxed">{step.desc}</p>
                </div>
              );
            })}
          </div>
          <Link
            href="/for-devs/tutorial"
            className="flex items-center justify-center gap-2 w-full h-11 bg-foreground text-background font-semibold text-sm rounded-full px-6 transition-all hover:bg-foreground/90 hover:shadow-glow-cyan focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            suppressHydrationWarning
          >
            {t.ctaFollowTutorial}
          </Link>
        </section>
        </Reveal>

        {/* GitHub Actions */}
        <Reveal>
        <section className="mb-16">
          <div className="bg-card border border-border rounded-2xl p-6">
            <h2 className="text-foreground font-semibold text-lg mb-1">{t.ciTitle}</h2>
            <p className="text-muted-foreground/80 text-sm mb-5">
              {renderTokens(t.ciBody, (codeText, key) => (
                <code
                  key={key}
                  className="bg-code text-primary font-mono text-xs px-1.5 py-0.5 rounded"
                >
                  {codeText}
                </code>
              ))}
            </p>
            <CodeBlock
              code={YAML_TEMPLATE}
              filename=".github/workflows/verify.yml"
              copyLabel={t.ciCopy}
            />
          </div>
        </section>
        </Reveal>

        {/* FAQ */}
        <Reveal>
        <section className="mb-16">
          <h2 className="text-foreground font-semibold text-xl mb-6">{t.faqTitle}</h2>
          <FaqAccordion />
        </section>
        </Reveal>

        {/* CTA final */}
        <Reveal>
        <section className="mb-16">
          <div className="rounded-2xl border border-border p-8 text-center bg-gradient-to-br from-primary/10 to-secondary/10">
            <h2 className="text-foreground font-semibold text-xl mb-2">{t.helpTitle}</h2>
            <p className="text-muted-foreground text-sm mb-6 max-w-md mx-auto leading-relaxed">
              {t.helpBody}
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <a
                href="https://x.com/MetaStellaX"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-card border border-border text-foreground text-sm font-medium rounded-full px-6 py-3 hover:bg-card-hover hover:border-foreground/30 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
                suppressHydrationWarning
              >
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4" aria-hidden="true">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231 5.45-6.231Zm-1.161 17.52h1.833L7.084 4.126H5.117l11.966 15.644Z" />
                </svg>
                {t.followX}
              </a>
              <a
                href="https://t.me/+LkioKlyV7BhlN2Yx"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-secondary/10 border border-secondary/30 text-secondary text-sm font-medium rounded-full px-6 py-3 hover:bg-secondary/20 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
                suppressHydrationWarning
              >
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4" aria-hidden="true">
                  <path d="M9.78 18.65l.28-4.23 7.68-6.9c.34-.31-.07-.46-.52-.19L7.74 13.3 3.64 12c-.88-.25-.89-.86.2-1.3l15.97-6.16c.73-.33 1.43.18 1.15 1.3l-2.72 12.81c-.19.91-.74 1.13-1.5.71l-4.14-3.05-2 1.92c-.23.23-.42.42-.83.42z" />
                </svg>
                {t.joinTelegram}
              </a>
            </div>
          </div>
        </section>
        </Reveal>
      </div>
    </div>
  );
}
