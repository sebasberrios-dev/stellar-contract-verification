"use client";

import { useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "../../../components/Navbar";
import CodeBlock from "../../../components/ui/CodeBlock";
import AuroraBackground from "../../../components/AuroraBackground";
import Reveal from "../../../components/Reveal";

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

const API_CURL_CODE = `curl -X POST https://stellar-contract-verification.vercel.app/api/verify \\
  -H "Content-Type: application/json" \\
  -d '{"contract_id": "YOUR_CONTRACT_ID"}'`;

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
          style={{ background: "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--secondary)))" }}
        >
          {number}
        </div>
        {!isLast && <div className="w-0.5 flex-1 bg-primary/15 mt-2" />}
      </div>
      {/* min-w-0: without it wide <pre> children stop the flex item from
          shrinking and force horizontal page scroll on phones */}
      <div className="flex-1 min-w-0 pb-8 md:pb-12">
        <h3 className="text-foreground font-semibold text-lg mb-3">{title}</h3>
        {children}
      </div>
    </div>
  );
}

function ContractTypeTabs() {
  const [tab, setTab] = useState<"simple" | "workspace">("simple");

  return (
    <div>
      <p className="text-muted-foreground text-sm mb-3">Choose your contract type:</p>
      <div className="flex flex-wrap gap-2 mb-4">
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
            className={`text-sm rounded-lg px-4 py-2 border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60 ${
              tab === option.key
                ? "bg-primary/10 border-primary/30 text-primary"
                : "border-border text-muted-foreground hover:text-foreground/80"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      <CodeBlock
        code={tab === "simple" ? SIMPLE_BUILD_CODE : WORKSPACE_BUILD_CODE}
      />

      <div className="flex gap-2.5 bg-warning/5 border border-warning/20 text-warning text-sm rounded-lg px-4 py-3 mt-4">
        <span aria-hidden="true">⚠</span>
        <p className="leading-relaxed">
          Every flag you pass to select your contract must also be passed as{" "}
          <code className="bg-code text-warning font-mono text-xs px-1.5 py-0.5 rounded">
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
        className="w-full bg-code border border-border rounded-lg px-4 h-11 text-foreground/90 font-mono text-sm text-ellipsis placeholder:text-muted-foreground/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:border-primary/40 transition-colors mb-4"
      />
      <button
        type="button"
        onClick={handleVerify}
        className="w-full h-11 bg-gradient-to-r from-primary to-secondary text-white font-semibold text-sm px-6 rounded-lg transition-all hover:shadow-glow-blue focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background mb-6"
      >
        Verify Contract →
      </button>
      <p className="text-muted-foreground text-sm mb-3">Or call the API directly:</p>
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
          className={`border-l-4 bg-card rounded-r-lg px-5 py-4 ${
            item.color === "red" ? "border-destructive" : "border-warning"
          }`}
        >
          <h3
            className={`font-medium text-sm mb-1 ${
              item.color === "red" ? "text-destructive" : "text-warning"
            }`}
          >
            {item.title}
          </h3>
          <p className="text-muted-foreground text-sm leading-relaxed">{item.desc}</p>
        </div>
      ))}
    </div>
  );
}

export default function TutorialPage() {
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
          ← Dashboard
        </Link>

        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm mb-10">
          <Link
            href="/for-devs"
            className="text-primary hover:text-primary/80 transition-colors"
            suppressHydrationWarning
          >
            For Devs
          </Link>
          <span className="text-muted-foreground/60" aria-hidden="true">
            →
          </span>
          <span className="text-muted-foreground">Tutorial</span>
        </nav>

        {/* Hero */}
        <section className="text-center mb-14">
          <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 text-primary text-xs font-medium rounded-full px-3 py-1 mb-6">
            ⚡ Step-by-step guide
          </div>
          <h1 className="text-3xl sm:text-5xl font-bold text-foreground tracking-tight mb-4">
            How to get your contract{" "}
            <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              verified
            </span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto leading-relaxed">
            Follow these 4 steps to embed SEP-58 metadata and get your Soroban
            contract showing as ✅ Contract Verified on CSV.
          </p>
        </section>

        {/* Prerequisites */}
        <Reveal>
        <section className="mb-14">
          <div className="bg-card border border-border rounded-2xl p-6">
            <h2 className="text-foreground font-semibold text-lg mb-4">
              Prerequisites
            </h2>
            <ul className="space-y-2.5">
              {PREREQUISITES.map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-2.5 text-muted-foreground text-sm leading-relaxed"
                >
                  <span className="text-primary shrink-0" aria-hidden="true">
                    ◈
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>
        </Reveal>

        {/* Stepper */}
        <section className="mb-6">
          <Reveal>
          <StepWrapper
            number={1}
            title="Commit your code and get the exact SHA"
          >
            <p className="text-muted-foreground text-sm leading-relaxed mb-4">
              Use a pinned SHA — branches move, SHAs don&apos;t. The verifier
              rebuilds from this exact commit.
            </p>
            <CodeBlock code={STEP1_CODE} />
          </StepWrapper>
          </Reveal>

          <Reveal>
          <StepWrapper number={2} title="Build with SEP-58 metadata embedded">
            <ContractTypeTabs />
          </StepWrapper>
          </Reveal>

          <Reveal>
          <StepWrapper number={3} title="Deploy to Stellar Testnet">
            <CodeBlock code={DEPLOY_CODE} />
            <p className="text-muted-foreground text-sm leading-relaxed mt-4">
              The command prints your Contract ID — starts with C, 56 characters
              long. Copy it.
            </p>
          </StepWrapper>
          </Reveal>

          <Reveal>
          <StepWrapper number={4} title="Verify on CSV" isLast>
            <VerifyStep />
          </StepWrapper>
          </Reveal>
        </section>

        {/* GET-first API reference */}
        <Reveal>
        <section className="mb-14">
          <h2 className="text-foreground font-semibold text-xl mb-2">
            Query the API directly
          </h2>
          <p className="text-muted-foreground text-sm mb-6 leading-relaxed">
            The UI does this automatically, but you can also call the API from
            CI or scripts. Always check the cache first — if the contract is
            already verified it returns instantly.
          </p>

          <div className="space-y-6">
            <div>
              <p className="text-muted-foreground text-sm mb-3">
                <span className="text-primary font-medium">
                  Check if already verified
                </span>{" "}
                (instant):
              </p>
              <CodeBlock
                code={`curl "https://stellar-contract-verification.vercel.app/api/v1/contracts/YOUR_CONTRACT_ID/verifications?network=testnet"`}
              />
            </div>

            <div>
              <p className="text-muted-foreground text-sm mb-3">
                <span className="text-primary font-medium">
                  Trigger verification
                </span>{" "}
                (2–6 min):
              </p>
              <CodeBlock
                code={`curl -X POST https://stellar-contract-verification.vercel.app/api/verify \\
  -H "Content-Type: application/json" \\
  -d '{"contract_id": "YOUR_CONTRACT_ID"}'`}
                variant="blue"
              />
            </div>

            <div className="flex gap-2.5 bg-primary/5 border border-primary/20 text-primary text-sm rounded-lg px-4 py-3">
              <span aria-hidden="true">ℹ</span>
              <p className="leading-relaxed">
                Only testnet is supported today. Pass{" "}
                <code className="bg-code text-primary font-mono text-xs px-1.5 py-0.5 rounded">
                  ?network=testnet
                </code>{" "}
                — mainnet support is coming soon.
              </p>
            </div>
          </div>
        </section>
        </Reveal>

        {/* Troubleshooting */}
        <Reveal>
        <section className="mb-14">
          <h2 className="text-foreground font-semibold text-xl mb-6">
            Troubleshooting
          </h2>
          <TroubleshootingSection />
        </section>
        </Reveal>

        {/* Back button */}
        <div className="text-center">
          <Link
            href="/for-devs"
            className="inline-flex items-center gap-2 border border-border text-foreground/80 text-sm font-medium rounded-lg px-5 py-2.5 hover:bg-card-hover transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
            suppressHydrationWarning
          >
            ← Back to For Devs
          </Link>
        </div>
      </div>
    </div>
  );
}
