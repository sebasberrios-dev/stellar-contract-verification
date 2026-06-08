"use client";

import { useState } from "react";
import Link from "next/link";
import { GitCommit, Terminal, Rocket, CheckCircle2, Copy, Check } from "lucide-react";
import Navbar from "../../components/Navbar";

const YAML_TEMPLATE = `name: Build & Verify Soroban Contract
on:
  push:
    branches: [main]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
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
    color: "#00BFFF",
  },
  {
    n: "02",
    title: "Build with --meta flags",
    desc: "Embed source_repo and source_rev directly into the WASM binary.",
    icon: Terminal,
    color: "#3B82F6",
  },
  {
    n: "03",
    title: "Deploy to testnet",
    desc: "Publish your contract to the Stellar network of your choice.",
    icon: Rocket,
    color: "#A855F7",
  },
  {
    n: "04",
    title: "Verify on CSV",
    desc: "Submit the Contract ID and let CSV reproduce the build.",
    icon: CheckCircle2,
    color: "#22C55E",
  },
];

const FAQ_ITEMS = [
  {
    q: "Does it work on mainnet and testnet?",
    a: "Yes. CSV verifies on both. Select the network before entering the Contract ID.",
  },
  {
    q: "How long does verification take?",
    a: "2–6 minutes. Clones the repo and compiles with the official Stellar CLI Docker image.",
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

function NetworkDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-slate-400">
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: color }} />
      {label}
    </span>
  );
}

function CodeBlock() {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(YAML_TEMPLATE);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="bg-[#080e1a] border border-cyan-500/15 rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-cyan-500/10">
        <span className="text-slate-500 text-xs font-mono">.github/workflows/verify.yml</span>
        <button
          type="button"
          onClick={() => void handleCopy()}
          className="flex items-center gap-1.5 bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs rounded-md px-2.5 py-1 hover:bg-cyan-500/20 transition-colors"
        >
          {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
          {copied ? "Copied!" : "Copy template"}
        </button>
      </div>
      <pre className="p-4 overflow-x-auto text-xs leading-relaxed font-mono text-slate-300">
        <code>{YAML_TEMPLATE}</code>
      </pre>
    </div>
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
            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden"
          >
            <button
              type="button"
              onClick={() => setOpenIndex(isOpen ? null : i)}
              aria-expanded={isOpen}
              className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left hover:bg-white/[0.03] transition-colors"
            >
              <span className="text-slate-200 text-sm font-medium">{item.q}</span>
              <span
                className="text-cyan-400 text-xl leading-none shrink-0 transition-transform duration-300 ease-in-out"
                style={{ transform: isOpen ? "rotate(45deg)" : "rotate(0deg)" }}
                aria-hidden="true"
              >
                +
              </span>
            </button>
            <div
              className="transition-all duration-300 ease-in-out overflow-hidden"
              style={{ maxHeight: isOpen ? "240px" : "0px", opacity: isOpen ? 1 : 0 }}
            >
              <p className="px-5 pb-4 text-slate-400 text-sm leading-relaxed">{item.a}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function ForDevsPage() {
  return (
    <div className="min-h-screen" style={{ background: "#000000" }}>
      <Navbar />
      <div className="max-w-4xl mx-auto px-6">
        <Link
          href="/"
          className="text-sm text-gray-400 hover:text-white flex items-center gap-2 transition-colors pt-6"
          suppressHydrationWarning
        >
          ← Dashboard
        </Link>

        {/* Hero */}
        <section className="text-center py-16">
          <div className="inline-flex items-center gap-2 bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-medium rounded-full px-3 py-1 mb-6">
            ⚡ 5 min setup
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-white tracking-tight mb-4">
            Make Your Contract{" "}
            <span className="bg-gradient-to-r from-[#00BFFF] to-[#3B82F6] bg-clip-text text-transparent">
              Verifiable
            </span>
          </h1>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto mb-8 leading-relaxed">
            Embed SEP-58 metadata so anyone can verify your source code matches what&apos;s deployed on Stellar.
          </p>
          <div className="flex items-center justify-center gap-6 mb-8">
            <NetworkDot color="#22C55E" label="Mainnet" />
            <NetworkDot color="#3B82F6" label="Testnet" />
            <NetworkDot color="#F59E0B" label="Futurenet" />
          </div>
          <Link
            href="/for-devs/tutorial"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-[#00BFFF] to-[#3B82F6] text-white font-semibold text-sm rounded-lg px-6 py-3 transition-all hover:shadow-[0_0_24px_rgba(59,130,246,0.4)]"
            suppressHydrationWarning
          >
            View full tutorial →
          </Link>
        </section>

        {/* What is SEP-58? */}
        <section className="mb-16">
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
            <span className="text-cyan-400 text-2xl" aria-hidden="true">◈</span>
            <h2 className="text-white font-semibold text-xl mt-3 mb-2">
              Build metadata embedded in your WASM
            </h2>
            <p className="text-slate-400 text-sm leading-relaxed">
              SEP-58 links your deployed contract to its exact source code on GitHub — source repo,
              commit hash, and the Docker image used to build it. CSV reads this metadata to
              cryptographically verify your contract.
            </p>
          </div>
        </section>

        {/* Quick overview — 4 steps */}
        <section className="mb-16">
          <h2 className="text-white font-semibold text-xl mb-6">Quick overview — 4 steps</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            {STEPS.map((step) => {
              const Icon = step.icon;
              return (
                <div
                  key={step.n}
                  className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-5"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <span className="font-mono text-xs text-slate-600 font-bold">{step.n}</span>
                    <Icon className="w-4 h-4" style={{ color: step.color }} aria-hidden="true" />
                  </div>
                  <h3 className="text-slate-200 font-medium text-sm mb-1">{step.title}</h3>
                  <p className="text-slate-500 text-xs leading-relaxed">{step.desc}</p>
                </div>
              );
            })}
          </div>
          <Link
            href="/for-devs/tutorial"
            className="flex items-center justify-center gap-2 w-full bg-gradient-to-r from-[#00BFFF] to-[#3B82F6] text-white font-semibold py-3 px-6 rounded-lg transition-all hover:shadow-[0_0_24px_rgba(59,130,246,0.4)]"
            suppressHydrationWarning
          >
            Follow the full tutorial →
          </Link>
        </section>

        {/* GitHub Actions */}
        <section className="mb-16">
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
            <h2 className="text-white font-semibold text-lg mb-1">Automate SEP-58 in your CI/CD</h2>
            <p className="text-slate-500 text-sm mb-5">
              Drop this workflow into{" "}
              <code className="bg-gray-800 text-cyan-400 font-mono text-xs px-1.5 py-0.5 rounded">
                .github/workflows/
              </code>{" "}
              to embed metadata on every push to main.
            </p>
            <CodeBlock />
          </div>
        </section>

        {/* FAQ */}
        <section className="mb-16">
          <h2 className="text-white font-semibold text-xl mb-6">FAQ</h2>
          <FaqAccordion />
        </section>

        {/* CTA final */}
        <section className="mb-16">
          <div
            className="rounded-2xl border border-white/10 p-8 text-center"
            style={{ background: "linear-gradient(135deg, rgba(0,191,255,0.08), rgba(59,130,246,0.08))" }}
          >
            <h2 className="text-white font-semibold text-xl mb-2">Need help implementing SEP-58?</h2>
            <p className="text-slate-400 text-sm mb-6 max-w-md mx-auto leading-relaxed">
              We help Soroban developers make their contracts verifiable. Reach out directly.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <a
                href="https://x.com/MetaStellaX"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-white/10 border border-white/20 text-white text-sm font-medium rounded-xl px-6 py-3 hover:bg-white/20 transition-colors"
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
                className="inline-flex items-center gap-2 bg-[#229ED9]/10 border border-[#229ED9]/30 text-[#229ED9] text-sm font-medium rounded-xl px-6 py-3 hover:bg-[#229ED9]/20 transition-colors"
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
      </div>
    </div>
  );
}
