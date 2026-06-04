"use client";

import { useState } from "react";

interface AccordionItem {
  id: string;
  title: string;
  icon: React.ReactNode;
  content: React.ReactNode;
}

interface AccordionProps {
  item: AccordionItem;
  isOpen: boolean;
  onToggle: () => void;
}

function Code({ children }: { children: React.ReactNode }) {
  return (
    <code className="inline-block bg-gray-800 text-[#00BFFF] font-mono text-xs px-1.5 py-0.5 rounded">
      {children}
    </code>
  );
}

function IconInfo() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  );
}

function IconCode() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="16 18 22 12 16 6" />
      <polyline points="8 6 2 12 8 18" />
    </svg>
  );
}

function IconShield() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}

function IconChevron() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

const ITEMS: AccordionItem[] = [
  {
    id: "sep58",
    title: "What is SEP-58?",
    icon: <IconInfo />,
    content: (
      <div className="space-y-4">
        <p className="text-slate-400 text-sm leading-relaxed">
          SEP-58 is a Stellar Ecosystem Proposal that defines a standard for embedding
          source-code metadata directly inside a compiled Soroban WASM binary. This
          allows anyone to independently verify that a deployed contract was built from
          a specific, auditable source repository.
        </p>
        <div>
          <p className="text-slate-300 text-xs font-semibold uppercase tracking-wider mb-3">
            Metadata fields
          </p>
          <ul className="space-y-2">
            {[
              { field: "source_repo", desc: "URL of the public source repository" },
              { field: "source_rev", desc: "Git commit SHA pinned at build time" },
              { field: "bldimg",     desc: "Docker image used for reproducible build" },
              { field: "tarball_sha256", desc: "SHA-256 hash of the source tarball" },
            ].map(({ field, desc }) => (
              <li key={field} className="flex items-start gap-3">
                <Code>{field}</Code>
                <span className="text-slate-400 text-sm">{desc}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    ),
  },
  {
    id: "how",
    title: "How verification works",
    icon: <IconCode />,
    content: (
      <ol className="space-y-3">
        {[
          { n: "01", text: <>Fetch the deployed WASM bytecode for the given contract ID from the Stellar RPC node.</> },
          { n: "02", text: <>Extract the <Code>contractmeta</Code> custom section embedded in the WASM binary.</> },
          { n: "03", text: <>Parse the SEP-58 fields (<Code>source_repo</Code>, <Code>source_rev</Code>, <Code>bldimg</Code>).</> },
          { n: "04", text: <>Clone the repository at the exact commit referenced by <Code>source_rev</Code>.</> },
          { n: "05", text: <>Reproduce the build inside an isolated Docker container using the <Code>bldimg</Code> image.</> },
          { n: "06", text: <>Compare the resulting WASM hash with the on-chain bytecode — a match means cryptographic verification.</> },
        ].map(({ n, text }) => (
          <li key={n} className="flex items-start gap-4">
            <span className="font-mono text-xs text-slate-600 font-bold pt-0.5 w-5 shrink-0">{n}</span>
            <span className="text-slate-400 text-sm leading-relaxed">{text}</span>
          </li>
        ))}
      </ol>
    ),
  },
  {
    id: "why",
    title: "Why this matters",
    icon: <IconShield />,
    content: (
      <div className="space-y-4">
        <p className="text-slate-400 text-sm leading-relaxed">
          Smart contracts control real assets. Without source verification, users must
          blindly trust that the bytecode on-chain matches the audited source code —
          a gap that has led to multi-million dollar exploits in other ecosystems.
        </p>
        <ul className="space-y-3">
          {[
            { head: "Trust minimisation", body: "Anyone can reproduce the build and check the hash without relying on a third party." },
            { head: "Audit traceability", body: "Security auditors can confirm that the audited commit is exactly what was deployed." },
            { head: "Supply chain integrity", body: "Pinning the Docker build image prevents toolchain substitution attacks." },
            { head: "Ecosystem confidence", body: "Verified contracts signal professionalism and attract more users and integrators." },
          ].map(({ head, body }) => (
            <li key={head} className="flex items-start gap-3">
              <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[#00BFFF] shrink-0" />
              <span className="text-slate-400 text-sm leading-relaxed">
                <span className="text-slate-200 font-medium">{head} — </span>{body}
              </span>
            </li>
          ))}
        </ul>
      </div>
    ),
  },
];

function AccordionRow({ item, isOpen, onToggle }: AccordionProps) {
  return (
    <div className="border border-[#1e2130] rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        className="w-full flex items-center justify-between px-5 py-4 bg-[#111318] hover:bg-[#161920] transition-colors text-left"
      >
        <span className="flex items-center gap-3 text-slate-300 font-medium text-sm">
          <span className="text-[#3b82f6]">{item.icon}</span>
          {item.title}
        </span>
        <span
          className="text-slate-500 transition-transform duration-300"
          style={{ transform: isOpen ? "rotate(180deg)" : "rotate(0deg)" }}
        >
          <IconChevron />
        </span>
      </button>

      <div
        className="transition-all duration-300 ease-in-out"
        style={{
          maxHeight: isOpen ? "600px" : "0px",
          opacity: isOpen ? 1 : 0,
          overflow: "hidden",
        }}
      >
        <div className="px-5 pb-5 pt-4 bg-[#0a0b0f] border-t border-[#1e2130]">
          {item.content}
        </div>
      </div>
    </div>
  );
}

export default function AccordionSection() {
  const [openId, setOpenId] = useState<string | null>(null);

  function toggle(id: string) {
    setOpenId((prev) => (prev === id ? null : id));
  }

  return (
    <section className="w-full space-y-3">
      <h2 className="text-slate-400 text-xs font-semibold uppercase tracking-widest mb-4">
        Learn more
      </h2>
      {ITEMS.map((item) => (
        <AccordionRow
          key={item.id}
          item={item}
          isOpen={openId === item.id}
          onToggle={() => toggle(item.id)}
        />
      ))}
    </section>
  );
}
