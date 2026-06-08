"use client";

import type { VerifyResponse } from "../types/index";
import { LEVEL_LABELS } from "../types/index";

interface ResultPanelProps {
  data: VerifyResponse | null;
  contractId: string;
  fetchError: string | null;
  visible: boolean;
}

function truncateId(id: string, start = 8, end = 6): string {
  if (end === 0) {
    if (id.length <= start + 3) return id;
    return `${id.slice(0, start)}...`;
  }
  if (id.length <= start + end + 3) return id;
  return `${id.slice(0, start)}...${id.slice(-end)}`;
}

export default function ResultPanel({ data, contractId, fetchError, visible }: ResultPanelProps) {
  if (!visible) return null;

  // Network / server error before we even got a response
  if (fetchError) {
    return (
      <div className="animate-enter bg-[#111318] border border-red-500/40 rounded-2xl p-6 w-full">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-red-400 text-lg">✗</span>
          <span className="text-red-400 font-semibold tracking-widest text-sm uppercase">
            Request Failed
          </span>
        </div>
        <p className="text-slate-400 text-sm font-mono break-all">{fetchError}</p>
      </div>
    );
  }

  if (!data) return null;

  // No SEP-58 metadata at all
  if (!data.verified && data.verification_level === 0) {
    return (
      <div className="animate-enter bg-[#111318] border border-yellow-500/40 rounded-2xl p-6 w-full">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-yellow-400 text-lg">⚠</span>
          <span className="text-yellow-400 font-semibold tracking-widest text-sm uppercase">
            No Metadata Found
          </span>
        </div>
        <p className="text-slate-400 text-sm mb-3">
          This contract has no SEP-58 build metadata embedded. The developer has not
          included source information.
        </p>
        {data.error && (
          <p className="text-slate-500 text-xs font-mono">{data.error}</p>
        )}
      </div>
    );
  }

  // Partial metadata (source_repo/rev missing) — level 1
  if (!data.verified && data.verification_level === 1) {
    return (
      <div className="animate-enter bg-[#111318] border border-yellow-500/40 rounded-2xl p-6 w-full">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-yellow-400 text-lg">⚠</span>
          <span className="text-yellow-400 font-semibold tracking-widest text-sm uppercase">
            Incomplete Metadata
          </span>
        </div>
        <p className="text-slate-400 text-sm mb-3">
          Metadata is present but missing <code className="text-yellow-300">source_repo</code> or{" "}
          <code className="text-yellow-300">source_rev</code> — cannot rebuild.
        </p>
        {data.error && (
          <p className="text-slate-500 text-xs font-mono">{data.error}</p>
        )}
      </div>
    );
  }

  // Build failed or hash mismatch — level ≥ 2 but verified = false
  if (!data.verified && data.verification_level >= 2) {
    const buildFailed = Boolean(data.error && !data.rebuilt_hash);
    return (
      <div className="animate-enter bg-[#111318] border border-red-500/40 rounded-2xl p-6 w-full">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-red-400 text-lg">✗</span>
          <span className="text-red-400 font-semibold tracking-widest text-sm uppercase">
            {buildFailed ? "Build Failed" : "Hash Mismatch"}
          </span>
        </div>
        <p className="text-slate-400 text-sm mb-4">
          {buildFailed
            ? "The verifier could not rebuild the contract from the embedded source metadata."
            : "The rebuilt WASM does not match the deployed contract."}
        </p>
        <div className="grid grid-cols-1 gap-3 mb-4">
          <div className="flex flex-col gap-1">
            <span className="text-slate-500 text-xs uppercase tracking-wider">On-chain hash</span>
            <span className="font-mono text-slate-300 text-xs break-all">{data.onchain_hash}</span>
          </div>
          {data.rebuilt_hash && (
            <div className="flex flex-col gap-1">
              <span className="text-slate-500 text-xs uppercase tracking-wider">Rebuilt hash</span>
              <span className="font-mono text-red-400 text-xs break-all">{data.rebuilt_hash}</span>
            </div>
          )}
        </div>
        {data.error && (
          <p className="text-slate-500 text-xs font-mono">{data.error}</p>
        )}
      </div>
    );
  }

  // ✅ Verified
  return (
    <div className="animate-enter bg-[#111318] border border-[#1e2130] rounded-2xl p-6 w-full">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <span className="relative flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500" />
        </span>
        <span className="text-green-400 font-semibold tracking-widest text-sm uppercase">
          Contract Verified
        </span>
      </div>

      {/* Data grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <div className="flex flex-col gap-1">
          <span className="text-slate-500 text-xs uppercase tracking-wider">Contract</span>
          <span className="font-mono text-slate-200 text-sm break-all">
            {truncateId(contractId)}
          </span>
        </div>

        <div className="flex flex-col gap-1">
          <span className="text-slate-500 text-xs uppercase tracking-wider">Repository</span>
          {data.source_repo ? (
            <a
              href={data.source_repo}
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-[#3b82f6] text-sm hover:text-[#60a5fa] transition-colors break-all"
              suppressHydrationWarning
            >
              {truncateId(data.source_repo, 30, 0)}
            </a>
          ) : (
            <span className="text-slate-500 text-sm">—</span>
          )}
        </div>

        <div className="flex flex-col gap-1">
          <span className="text-slate-500 text-xs uppercase tracking-wider">Commit</span>
          <span className="font-mono text-slate-200 text-sm">
            {data.source_rev ? truncateId(data.source_rev, 10, 0) : "—"}
          </span>
        </div>

        <div className="flex flex-col gap-1">
          <span className="text-slate-500 text-xs uppercase tracking-wider">Build Image</span>
          <span className="font-mono text-slate-200 text-sm break-all">
            {data.build_image ? truncateId(data.build_image, 28, 0) : "—"}
          </span>
        </div>
      </div>

      {/* Hash match */}
      <div className="flex items-center justify-between bg-green-500/5 border border-green-500/20 rounded-xl px-4 py-3 mb-4">
        <span className="text-slate-400 text-sm font-medium">Hash Match</span>
        <span className="font-mono text-green-400 font-bold text-sm tracking-widest">
          {data.wasm_hash_match ? "TRUE" : "FALSE"}
        </span>
      </div>

      {/* Level badge */}
      <div className="flex items-center gap-2 justify-center bg-[#161920] border border-[#1e2130] rounded-full px-4 py-2">
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#22c55e"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          <polyline points="9 12 11 14 15 10" />
        </svg>
        <span className="text-green-400 text-xs font-semibold tracking-wide">
          Level {data.verification_level} — {LEVEL_LABELS[data.verification_level] ?? "Verified"}
        </span>
      </div>
    </div>
  );
}
