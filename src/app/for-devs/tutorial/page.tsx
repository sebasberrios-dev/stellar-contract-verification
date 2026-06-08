"use client";

import { useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Copy, Check } from "lucide-react";
import Navbar from "../../../components/Navbar";

const STEP1_CODE = `git add .
git commit -m "ready to deploy"
git push origin main

# Copy this — you'll need it in the next step
git rev-parse HEAD
# example: a1b2c3d4e5f6789012345678901234567890abcd`;

const SIMPLE_BUILD_CODE = `stellar contract build \\
  --meta source_repo=https://github.com/your-org/your-contract \\
  --meta source_rev=a1b2c3d4e5f6789012345678901234567890abcd`;

const WORKSPACE_BUILD_CODE = `stellar contract build \\
  --meta source_repo=https://github.com/your-org/your-repo \\
  --meta source_rev=a1b2c3d4e5f6789012345678901234567890abcd \\
  --meta bldopt=--manifest-path=my-contract/Cargo.toml \\
  --meta bldopt=--package=my-contract-name`;

const DEPLOY_CODE = `stellar contract deploy \\
  --wasm target/wasm32-unknown-unknown/release/your_contract.wasm \\
  --network testnet \\
  --source YOUR_ACCOUNT_NAME`;

const API_CURL_CODE = `curl -X POST https://stellar-contract-verification.fly.dev/verify \\
  -H "Content-Type: application/json" \\
  -d '{"contract_id": "CDZIBWL67BFXPUKXEKYMIXH5AGLUBJVS4MW5EO6FHHNYX7IGRPBQVHFQ"}'`;

const PREREQUISITES = [
  "stellar-cli installed (v26+)",
  "Contract compiles with stellar contract build",
  "Source code in a public GitHub repository",
  "Docker installed (used internally by stellar-cli)",
];

const TROUBLESHOOTING = [
  {
    color: "red" as const,
    title: "No Metadata Found",
    desc: "Deployed without --meta flags. Rebuild with metadata from Step 2, redeploy, and use the new Contract ID.",
  },
  {
    color: "red" as const,
    title: "Hash Mismatch",
    desc: "source_rev points to wrong commit, missing bldopt flags, or uncommitted local changes were included. Always commit before building for deployment.",
  },
  {
    color: "amber" as const,
    title: "Incomplete Metadata",
    desc: "Either source_repo or source_rev is missing. Both are required to attempt a rebuild.",
  },
  {
    color: "amber" as const,
    title: "Repository is private",
    desc: "The verifier clones without authentication. Your repository must be public on GitHub.",
  },
];

function CodeBlock({ code, variant = "cyan" }: { code: string; variant?: "cyan" | "blue" }) {
  const [copied, setCopied] = useState(false);
  const isBlue = variant === "blue";

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div
      className={`relative rounded-xl p-4 font-mono text-sm bg-[#080e1a] border ${
        isBlue ? "border-blue-500/20 text-[#93c5fd]" : "border-cyan-500/15 text-[#7dd3fc]"
      }`}
    >
      <button
        type="button"
        onClick={() => void handleCopy()}
        className={`absolute top-3 right-3 flex items-center gap-1.5 text-xs rounded-md px-2.5 py-1 border transition-colors ${
          isBlue
            ? "bg-blue-500/10 border-blue-500/20 text-blue-300 hover:bg-blue-500/20"
            : "bg-cyan-500/10 border-cyan-500/20 text-cyan-400 hover:bg-cyan-500/20"
        }`}
      >
        {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
        {copied ? "Copied!" : "Copy"}
      </button>
      <pre className="overflow-x-auto pr-20 leading-relaxed">
        <code>{code}</code>
      </pre>
    </div>
  );
}

function StepWrapper({
  number,
  title,
  isLast = false,
  children,
}: {
  number: number;
  title: string;
  isLast?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="flex gap-5">
      <div className="flex flex-col items-center">
        <div
          className="w-8 h-8 shrink-0 rounded-full flex items-center justify-center text-white text-sm font-bold"
          style={{ background: "linear-gradient(135deg, #00BFFF, #1D4ED8)" }}
        >
          {number}
        </div>
        {!isLast && <div className="w-0.5 flex-1 bg-cyan-500/15 mt-2" />}
      </div>
      <div className="flex-1 pb-12">
        <h3 className="text-white font-semibold text-lg mb-3">{title}</h3>
        {children}
      </div>
    </div>
  );
}

function ContractTypeTabs() {
  const [tab, setTab] = useState<"simple" | "workspace">("simple");

  return (
    <div>
      <p className="text-slate-400 text-sm mb-3">Choose your contract type:</p>
      <div className="flex gap-2 mb-4">
        {(
          [
            { key: "simple", label: "Simple contract" },
            { key: "workspace", label: "Workspace / monorepo" },
          ] as const
        ).map((option) => (
          <button
            key={option.key}
            type="button"
            onClick={() => setTab(option.key)}
            className={`text-sm rounded-lg px-4 py-2 border transition-colors ${
              tab === option.key
                ? "bg-cyan-500/10 border-cyan-500/30 text-cyan-400"
                : "border-white/10 text-gray-400 hover:text-gray-300"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      <CodeBlock code={tab === "simple" ? SIMPLE_BUILD_CODE : WORKSPACE_BUILD_CODE} />

      <div className="flex gap-2.5 bg-amber-500/5 border border-amber-500/20 text-amber-400 text-sm rounded-lg px-4 py-3 mt-4">
        <span aria-hidden="true">⚠</span>
        <p className="leading-relaxed">
          Every flag you pass to select your contract must also be passed as{" "}
          <code className="bg-black/30 text-amber-300 font-mono text-xs px-1.5 py-0.5 rounded">
            --meta bldopt=
          </code>
          . The verifier replays those exact flags when rebuilding.
        </p>
      </div>
    </div>
  );
}

function VerifyStep() {
  const [contractId, setContractId] = useState("");
  const router = useRouter();

  function handleVerify() {
    const id = contractId.trim();
    if (!id) return;
    router.push(`/verify?id=${encodeURIComponent(id)}`);
  }

  return (
    <div>
      <input
        type="text"
        value={contractId}
        onChange={(e) => setContractId(e.target.value)}
        placeholder="CDZIBWL67BFXPUKXEKYMIXH5AGLUBJVS4MW5EO6FHHNYX7IGRPBQVHFQ"
        spellCheck={false}
        className="w-full bg-[#080e1a] border border-white/10 rounded-lg px-4 py-3 text-slate-200 font-mono text-sm placeholder:text-slate-600 focus:outline-none focus:border-cyan-500/40 transition-colors mb-4"
      />
      <button
        type="button"
        onClick={handleVerify}
        className="w-full bg-gradient-to-r from-[#00BFFF] to-[#3B82F6] text-white font-semibold py-3 px-6 rounded-lg transition-all hover:shadow-[0_0_24px_rgba(59,130,246,0.4)] mb-6"
      >
        Verify Contract →
      </button>
      <p className="text-slate-400 text-sm mb-3">Or call the API directly:</p>
      <CodeBlock code={API_CURL_CODE} variant="blue" />
    </div>
  );
}

function TroubleshootingSection() {
  return (
    <div className="space-y-3">
      {TROUBLESHOOTING.map((item) => (
        <div
          key={item.title}
          className={`border-l-4 bg-white/2 rounded-r-lg px-5 py-4 ${
            item.color === "red" ? "border-red-500" : "border-amber-500"
          }`}
        >
          <h3
            className={`font-medium text-sm mb-1 ${
              item.color === "red" ? "text-red-400" : "text-amber-400"
            }`}
          >
            {item.title}
          </h3>
          <p className="text-slate-400 text-sm leading-relaxed">{item.desc}</p>
        </div>
      ))}
    </div>
  );
}

export default function TutorialPage() {
  return (
    <div className="min-h-screen" style={{ background: "#000000" }}>
      <Navbar />
      <div className="max-w-3xl mx-auto px-6 py-12">
        <Link
          href="/"
          className="text-sm text-gray-400 hover:text-white flex items-center gap-2 transition-colors mb-6"
          suppressHydrationWarning
        >
          ← Dashboard
        </Link>

        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm mb-10">
          <Link
            href="/for-devs"
            className="text-cyan-400 hover:text-cyan-300 transition-colors"
            suppressHydrationWarning
          >
            For Devs
          </Link>
          <span className="text-slate-600" aria-hidden="true">→</span>
          <span className="text-slate-400">Tutorial</span>
        </nav>

        {/* Hero */}
        <section className="text-center mb-14">
          <div className="inline-flex items-center gap-2 bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-medium rounded-full px-3 py-1 mb-6">
            ⚡ Step-by-step guide
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-white tracking-tight mb-4">
            How to get your contract{" "}
            <span className="bg-gradient-to-r from-[#00BFFF] to-[#3B82F6] bg-clip-text text-transparent">
              verified
            </span>
          </h1>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto leading-relaxed">
            Follow these 4 steps to embed SEP-58 metadata and get your Soroban contract showing as
            ✅ Contract Verified on CSV.
          </p>
        </section>

        {/* Prerequisites */}
        <section className="mb-14">
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
            <h2 className="text-white font-semibold text-lg mb-4">Prerequisites</h2>
            <ul className="space-y-2.5">
              {PREREQUISITES.map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-slate-400 text-sm leading-relaxed">
                  <span className="text-cyan-400 shrink-0" aria-hidden="true">◈</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Stepper */}
        <section className="mb-6">
          <StepWrapper number={1} title="Commit your code and get the exact SHA">
            <p className="text-slate-400 text-sm leading-relaxed mb-4">
              Use a pinned SHA — branches move, SHAs don&apos;t. The verifier rebuilds from this
              exact commit.
            </p>
            <CodeBlock code={STEP1_CODE} />
          </StepWrapper>

          <StepWrapper number={2} title="Build with SEP-58 metadata embedded">
            <ContractTypeTabs />
          </StepWrapper>

          <StepWrapper number={3} title="Deploy to Stellar Testnet">
            <CodeBlock code={DEPLOY_CODE} />
            <p className="text-slate-400 text-sm leading-relaxed mt-4">
              The command prints your Contract ID — starts with C, 56 characters long. Copy it.
            </p>
          </StepWrapper>

          <StepWrapper number={4} title="Verify on CSV" isLast>
            <VerifyStep />
          </StepWrapper>
        </section>

        {/* GET-first API reference */}
        <section className="mb-14">
          <h2 className="text-white font-semibold text-xl mb-2">Query the API directly</h2>
          <p className="text-slate-400 text-sm mb-6 leading-relaxed">
            The UI does this automatically, but you can also call the API from CI or scripts.
            Always check the cache first — if the contract is already verified it returns instantly.
          </p>

          <div className="space-y-6">
            <div>
              <p className="text-slate-400 text-sm mb-3">
                <span className="text-cyan-400 font-medium">Check if already verified</span>
                {" "}(instant):
              </p>
              <CodeBlock
                code={`curl "https://stellar-contract-verification.vercel.app/api/v1/contracts/YOUR_CONTRACT_ID/verifications?network=testnet"`}
              />
            </div>

            <div>
              <p className="text-slate-400 text-sm mb-3">
                <span className="text-cyan-400 font-medium">Trigger verification</span>
                {" "}(2–6 min):
              </p>
              <CodeBlock
                code={`curl -X POST https://stellar-contract-verification.fly.dev/verify \\
  -H "Content-Type: application/json" \\
  -d '{"contract_id": "YOUR_CONTRACT_ID"}'`}
                variant="blue"
              />
            </div>

            <div className="flex gap-2.5 bg-cyan-500/5 border border-cyan-500/20 text-cyan-300 text-sm rounded-lg px-4 py-3">
              <span aria-hidden="true">ℹ</span>
              <p className="leading-relaxed">
                Only testnet is supported today. Pass{" "}
                <code className="bg-black/30 text-cyan-200 font-mono text-xs px-1.5 py-0.5 rounded">
                  ?network=testnet
                </code>{" "}
                — mainnet support is coming soon.
              </p>
            </div>
          </div>
        </section>

        {/* Troubleshooting */}
        <section className="mb-14">
          <h2 className="text-white font-semibold text-xl mb-6">Troubleshooting</h2>
          <TroubleshootingSection />
        </section>

        {/* Back button */}
        <div className="text-center">
          <Link
            href="/for-devs"
            className="inline-flex items-center gap-2 border border-white/10 text-slate-300 text-sm font-medium rounded-lg px-5 py-2.5 hover:bg-white/5 transition-colors"
            suppressHydrationWarning
          >
            ← Back to For Devs
          </Link>
        </div>
      </div>
    </div>
  );
}
