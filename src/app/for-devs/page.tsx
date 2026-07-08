"use client";

import { useState } from "react";
import Link from "next/link";
import { GitCommit, Terminal, Rocket, CheckCircle2 } from "lucide-react";
import Navbar from "../../components/Navbar";
import CodeBlock from "../../components/ui/CodeBlock";
import AuroraBackground from "../../components/AuroraBackground";
import Reveal from "../../components/Reveal";

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

const STEPS = [
  {
    n: "01",
    title: "Commit your code",
    desc: "Push your contract source to a public GitHub repository.",
    icon: GitCommit,
    iconClass: "text-primary",
  },
  {
    n: "02",
    title: "Build with --meta flags",
    desc: "Embed source_repo and source_rev directly into the WASM binary.",
    icon: Terminal,
    iconClass: "text-secondary",
  },
  {
    n: "03",
    title: "Deploy to testnet",
    desc: "Publish your contract to Stellar testnet.",
    icon: Rocket,
    iconClass: "text-accent",
  },
  {
    n: "04",
    title: "Verify on CSV",
    desc: "Submit the Contract ID and let CSV reproduce the build.",
    icon: CheckCircle2,
    iconClass: "text-success",
  },
];

const FAQ_ITEMS = [
  {
    q: "Is mainnet supported?",
    a: "Testnet only for now — mainnet is coming soon. All verifications run against testnet automatically.",
  },
  {
    q: "How long does verification take?",
    a: "Already-verified contracts return instantly from cache. A first-time rebuild takes about 2–6 minutes while CSV clones the repo and compiles with the official Stellar CLI Docker image.",
  },
  {
    q: "Is my source code safe?",
    a: "CSV only reads public GitHub repos. No source code or private keys are stored.",
  },
  {
    q: "What if I don't have the exact commit hash?",
    a: "Use a branch name only if you must — but exact SHA guarantees full reproducibility. Branches move.",
  },
  {
    q: "What is contractmetav0?",
    a: "The custom WASM section where SEP-58 metadata lives. Generated automatically with --meta flags.",
  },
  {
    q: "Can I verify other developers' contracts?",
    a: "Yes. Any contract with SEP-58 can be verified by anyone — that's the essence of the standard.",
  },
  {
    q: "What does level 0 mean?",
    a: "No SEP-58 metadata found. Follow the tutorial to implement it.",
  },
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
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="space-y-3">
      {FAQ_ITEMS.map((item, i) => {
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
          ← Dashboard
        </Link>

        {/* Hero */}
        <section className="text-center py-16 md:py-24">
          <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 text-primary text-xs font-medium rounded-full px-3 py-1 mb-6">
            ⚡ 5 min setup
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-foreground tracking-tight mb-4">
            Make Your Contract{" "}
            <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Verifiable
            </span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto mb-8 leading-relaxed">
            Embed SEP-58 metadata so anyone can verify your source code matches what&apos;s deployed on Stellar.
          </p>
          <div className="flex items-center justify-center gap-6 mb-8">
            <NetworkDot dotClass="bg-success" label="Testnet" />
            <NetworkDot dotClass="bg-muted-foreground/40" label="Mainnet — coming soon" />
          </div>
          <Link
            href="/for-devs/tutorial"
            className="inline-flex items-center gap-2 h-11 bg-foreground text-background font-semibold text-sm rounded-full px-6 transition-all hover:bg-foreground/90 hover:shadow-glow-cyan focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            suppressHydrationWarning
          >
            View full tutorial →
          </Link>
        </section>

        {/* What is SEP-58? */}
        <Reveal>
        <section className="mb-16">
          <div className="bg-card border border-border rounded-2xl p-6">
            <span className="text-primary text-2xl" aria-hidden="true">◈</span>
            <h2 className="text-foreground font-semibold text-xl mt-3 mb-2">
              Build metadata embedded in your WASM
            </h2>
            <p className="text-muted-foreground text-sm leading-relaxed">
              SEP-58 links your deployed contract to its exact source code on GitHub — source repo,
              commit hash, and the Docker image used to build it. CSV reads this metadata to
              cryptographically verify your contract.
            </p>
          </div>
        </section>
        </Reveal>

        {/* Quick overview — 4 steps */}
        <Reveal>
        <section className="mb-16">
          <h2 className="text-foreground font-semibold text-xl mb-6">Quick overview — 4 steps</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            {STEPS.map((step) => {
              const Icon = step.icon;
              return (
                <div
                  key={step.n}
                  className="bg-card border border-border rounded-2xl p-5 hover:border-primary/40 transition-colors duration-300"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <span className="font-mono text-xs text-muted-foreground/70 font-bold">{step.n}</span>
                    <Icon className={`w-4 h-4 ${step.iconClass}`} aria-hidden="true" />
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
            Follow the full tutorial →
          </Link>
        </section>
        </Reveal>

        {/* GitHub Actions */}
        <Reveal>
        <section className="mb-16">
          <div className="bg-card border border-border rounded-2xl p-6">
            <h2 className="text-foreground font-semibold text-lg mb-1">Automate SEP-58 in your CI/CD</h2>
            <p className="text-muted-foreground/80 text-sm mb-5">
              Drop this workflow into{" "}
              <code className="bg-code text-primary font-mono text-xs px-1.5 py-0.5 rounded">
                .github/workflows/
              </code>{" "}
              to embed metadata on every push to main.
            </p>
            <CodeBlock
              code={YAML_TEMPLATE}
              filename=".github/workflows/verify.yml"
              copyLabel="Copy template"
            />
          </div>
        </section>
        </Reveal>

        {/* FAQ */}
        <Reveal>
        <section className="mb-16">
          <h2 className="text-foreground font-semibold text-xl mb-6">FAQ</h2>
          <FaqAccordion />
        </section>
        </Reveal>

        {/* CTA final */}
        <Reveal>
        <section className="mb-16">
          <div className="rounded-2xl border border-border p-8 text-center bg-gradient-to-br from-primary/10 to-secondary/10">
            <h2 className="text-foreground font-semibold text-xl mb-2">Need help implementing SEP-58?</h2>
            <p className="text-muted-foreground text-sm mb-6 max-w-md mx-auto leading-relaxed">
              We help Soroban developers make their contracts verifiable. Reach out directly.
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
                Follow on X
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
                Join on Telegram
              </a>
            </div>
          </div>
        </section>
        </Reveal>
      </div>
    </div>
  );
}
