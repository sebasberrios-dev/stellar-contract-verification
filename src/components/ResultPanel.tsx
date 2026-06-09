"use client";

import type { VerificationEntry } from "../types/index";
import { LEVEL_LABELS } from "../types/index";

interface ResultPanelProps {
  data: VerificationEntry | null;
  contractId: string;
  fetchError: string | null;
  visible: boolean;
  isCached?: boolean;
}

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZoneName: "short",
    });
  } catch {
    return iso;
  }
}

function truncateId(id: string, start = 8, end = 6): string {
  if (end === 0) {
    if (id.length <= start + 3) return id;
    return `${id.slice(0, start)}...`;
  }
  if (id.length <= start + end + 3) return id;
  return `${id.slice(0, start)}...${id.slice(-end)}`;
}

const STATUS_CONFIG = {
  verified: {
    border: "border-green-500/30",
    label: "Contract Verified",
    labelColor: "text-green-400",
    badgeColor: "text-green-400",
    shieldStroke: "#22c55e",
    showCheckmark: true,
    showPing: true,
  },
  mismatch: {
    border: "border-red-500/40",
    label: "Hash Mismatch",
    labelColor: "text-red-400",
    badgeColor: "text-red-400",
    shieldStroke: "#ef4444",
    showCheckmark: false,
    showPing: false,
  },
  failed: {
    border: "border-red-500/40",
    label: "Build Failed",
    labelColor: "text-red-400",
    badgeColor: "text-red-400",
    shieldStroke: "#ef4444",
    showCheckmark: false,
    showPing: false,
  },
  unverified: {
    border: "border-yellow-500/40",
    label: "Not Verified",
    labelColor: "text-yellow-400",
    badgeColor: "text-yellow-400",
    shieldStroke: "#eab308",
    showCheckmark: false,
    showPing: false,
  },
} as const;

export default function ResultPanel({
  data,
  contractId,
  fetchError,
  visible,
  isCached,
}: ResultPanelProps) {
  if (!visible) return null;

  if (fetchError) {
    return (
      <div className="animate-enter bg-[#111318] border border-red-500/40 rounded-2xl p-6 w-full">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-red-400 text-lg leading-none">✗</span>
          <span className="text-red-400 font-semibold tracking-widest text-sm uppercase">
            Request Failed
          </span>
        </div>
        <p className="text-slate-400 text-sm font-mono break-all">{fetchError}</p>
      </div>
    );
  }

  if (!data) return null;

  const cfg = STATUS_CONFIG[data.status] ?? STATUS_CONFIG.unverified;
  const buildImage = data.bldimg ?? data.build_image;
  const levelLabel = LEVEL_LABELS[data.verification_level] ?? "Unknown";
  const showHashRow = data.status !== "unverified";

  return (
    <div className={`animate-enter bg-[#111318] border ${cfg.border} rounded-2xl p-6 w-full`}>

      {/* Header */}
      <div className="flex items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-3">
          {cfg.showPing ? (
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500" />
            </span>
          ) : (
            <span className={`${cfg.labelColor} text-lg leading-none`} aria-hidden="true">
              {data.status === "unverified" ? "⚠" : "✗"}
            </span>
          )}
          <span className={`${cfg.labelColor} font-semibold tracking-widest text-sm uppercase`}>
            {cfg.label}
          </span>
        </div>
        {isCached && (
          <span className="flex items-center gap-1 bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-medium rounded-full px-2.5 py-0.5">
            ⚡ Cached
          </span>
        )}
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
            {buildImage ? truncateId(buildImage, 28, 0) : "—"}
          </span>
        </div>

        <div className="flex flex-col gap-1">
          <span className="text-slate-500 text-xs uppercase tracking-wider">Verifier</span>
          {data.verifier?.url ? (
            <a
              href={data.verifier.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-300 text-sm hover:text-white transition-colors"
              suppressHydrationWarning
            >
              {data.verifier.name}
            </a>
          ) : (
            <span className="text-slate-300 text-sm">{data.verifier?.name ?? "—"}</span>
          )}
        </div>

        <div className="flex flex-col gap-1">
          <span className="text-slate-500 text-xs uppercase tracking-wider">Processed</span>
          <span className="text-slate-200 text-sm">{formatDate(data.processed_at)}</span>
        </div>
      </div>

      {/* Build flags — only when non-empty */}
      {data.bldopt.length > 0 && (
        <div className="mb-4">
          <span className="text-slate-500 text-xs uppercase tracking-wider block mb-2">
            Build Flags
          </span>
          <div className="flex flex-wrap gap-2">
            {data.bldopt.map((flag) => (
              <code
                key={flag}
                className="bg-[#0d1117] border border-white/10 text-cyan-300 font-mono text-xs px-2 py-1 rounded-md"
              >
                {flag}
              </code>
            ))}
          </div>
        </div>
      )}

      {/* Hash match row — only when a build was attempted */}
      {showHashRow && (
        <div
          className={`flex items-center justify-between rounded-xl px-4 py-3 mb-4 ${
            data.wasm_hash_match
              ? "bg-green-500/5 border border-green-500/20"
              : "bg-red-500/5 border border-red-500/20"
          }`}
        >
          <span className="text-slate-400 text-sm font-medium">Hash Match</span>
          <span
            className={`font-mono font-bold text-sm tracking-widest ${
              data.wasm_hash_match ? "text-green-400" : "text-red-400"
            }`}
          >
            {data.wasm_hash_match ? "TRUE" : "FALSE"}
          </span>
        </div>
      )}

      {/* Error detail */}
      {data.error && (
        <p className="text-slate-500 text-xs font-mono break-all mb-4">{data.error}</p>
      )}

      {/* Level badge */}
      <div className="flex items-center gap-2 justify-center bg-[#161920] border border-[#1e2130] rounded-full px-4 py-2">
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke={cfg.shieldStroke}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          {cfg.showCheckmark && <polyline points="9 12 11 14 15 10" />}
        </svg>
        <span className={`text-xs font-semibold tracking-wide ${cfg.badgeColor}`}>
          Level {data.verification_level} — {levelLabel}
        </span>
      </div>
    </div>
  );
}
