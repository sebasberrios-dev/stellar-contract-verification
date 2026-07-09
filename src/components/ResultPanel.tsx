"use client";

import type { VerificationEntry } from "../types/index";
import { LEVEL_LABELS } from "../types/index";
import { useI18n } from "../i18n/LanguageContext";
import type { Dict } from "../i18n/translations";

interface ResultPanelProps {
  data: VerificationEntry | null;
  contractId: string;
  fetchError: string | null;
  visible: boolean;
  isCached?: boolean;
}

function formatDate(iso: string | null): string {
  if (!iso) return "—";

  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return iso;
  }

  return date.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZoneName: "short",
  });
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
    border: "border-success/30",
    labelKey: "statusVerified",
    labelColor: "text-success",
    badgeColor: "text-success",
    shieldStroke: "hsl(var(--success))",
    showCheckmark: true,
    showPing: true,
  },
  mismatch: {
    border: "border-destructive/40",
    labelKey: "statusMismatch",
    labelColor: "text-destructive",
    badgeColor: "text-destructive",
    shieldStroke: "hsl(var(--destructive))",
    showCheckmark: false,
    showPing: false,
  },
  failed: {
    border: "border-destructive/40",
    labelKey: "statusFailed",
    labelColor: "text-destructive",
    badgeColor: "text-destructive",
    shieldStroke: "hsl(var(--destructive))",
    showCheckmark: false,
    showPing: false,
  },
  unverified: {
    border: "border-warning/40",
    labelKey: "statusUnverified",
    labelColor: "text-warning",
    badgeColor: "text-warning",
    shieldStroke: "hsl(var(--warning))",
    showCheckmark: false,
    showPing: false,
  },
} as const satisfies Record<
  string,
  { labelKey: keyof Dict["result"] } & Record<string, unknown>
>;

export default function ResultPanel({
  data,
  contractId,
  fetchError,
  visible,
  isCached,
}: ResultPanelProps) {
  const { d } = useI18n();

  if (!visible) return null;

  if (fetchError) {
    return (
      <div className="animate-enter bg-card border border-destructive/40 rounded-2xl p-6 w-full">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-destructive text-lg leading-none">✗</span>
          <span className="text-destructive font-semibold tracking-widest text-sm uppercase">
            {d.result.requestFailed}
          </span>
        </div>
        <p className="text-muted-foreground text-sm font-mono break-all">{fetchError}</p>
      </div>
    );
  }

  if (!data) return null;

  const cfg = STATUS_CONFIG[data.status] ?? STATUS_CONFIG.unverified;
  const buildImage = data.bldimg ?? data.build_image;
  const levelLabel = LEVEL_LABELS[data.verification_level] ?? "Unknown";
  const buildOpts = data.bldopt ?? [];
  const showHashRow = data.status !== "unverified";

  return (
    <div className={`animate-enter bg-card border ${cfg.border} rounded-2xl p-6 w-full`}>

      {/* Header */}
      <div className="flex items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-3">
          {cfg.showPing ? (
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-success" />
            </span>
          ) : (
            <span className={`${cfg.labelColor} text-lg leading-none`} aria-hidden="true">
              {data.status === "unverified" ? "⚠" : "✗"}
            </span>
          )}
          <span className={`${cfg.labelColor} font-semibold tracking-widest text-sm uppercase`}>
            {d.result[cfg.labelKey]}
          </span>
        </div>
        {isCached && (
          <span className="flex items-center gap-1 bg-primary/10 border border-primary/20 text-primary text-xs font-medium rounded-full px-2.5 py-0.5">
            ⚡ {d.result.cached}
          </span>
        )}
      </div>

      {/* Data grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <div className="flex flex-col gap-1">
          <span className="text-muted-foreground/80 text-xs uppercase tracking-wider">{d.result.contract}</span>
          <span className="font-mono text-foreground/90 text-sm break-all">
            {truncateId(contractId)}
          </span>
        </div>

        <div className="flex flex-col gap-1">
          <span className="text-muted-foreground/80 text-xs uppercase tracking-wider">{d.result.repository}</span>
          {data.source_repo ? (
            <a
              href={data.source_repo}
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-secondary text-sm hover:text-secondary/80 transition-colors break-all"
              suppressHydrationWarning
            >
              {truncateId(data.source_repo, 30, 0)}
            </a>
          ) : (
            <span className="text-muted-foreground/80 text-sm">—</span>
          )}
        </div>

        <div className="flex flex-col gap-1">
          <span className="text-muted-foreground/80 text-xs uppercase tracking-wider">{d.result.commit}</span>
          <span className="font-mono text-foreground/90 text-sm">
            {data.source_rev ? truncateId(data.source_rev, 10, 0) : "—"}
          </span>
        </div>

        <div className="flex flex-col gap-1">
          <span className="text-muted-foreground/80 text-xs uppercase tracking-wider">{d.result.buildImage}</span>
          <span className="font-mono text-foreground/90 text-sm break-all">
            {buildImage ? truncateId(buildImage, 28, 0) : "—"}
          </span>
        </div>

        <div className="flex flex-col gap-1">
          <span className="text-muted-foreground/80 text-xs uppercase tracking-wider">{d.result.verifier}</span>
          {data.verifier?.url ? (
            <a
              href={data.verifier.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-foreground/80 text-sm hover:text-foreground transition-colors"
              suppressHydrationWarning
            >
              {data.verifier.name}
            </a>
          ) : (
            <span className="text-foreground/80 text-sm">{data.verifier?.name ?? "—"}</span>
          )}
        </div>

        <div className="flex flex-col gap-1">
          <span className="text-muted-foreground/80 text-xs uppercase tracking-wider">{d.result.processed}</span>
          <span className="text-foreground/90 text-sm">{formatDate(data.processed_at)}</span>
        </div>
      </div>

      {/* Build flags — only when non-empty */}
      {buildOpts.length > 0 && (
        <div className="mb-4">
          <span className="text-muted-foreground/80 text-xs uppercase tracking-wider block mb-2">
            {d.result.buildFlags}
          </span>
          <div className="flex flex-wrap gap-2">
            {buildOpts.map((flag) => (
              <code
                key={flag}
                className="bg-code border border-border text-primary font-mono text-xs px-2 py-1 rounded-md"
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
              ? "bg-success/5 border border-success/20"
              : "bg-destructive/5 border border-destructive/20"
          }`}
        >
          <span className="text-muted-foreground text-sm font-medium">{d.result.hashMatch}</span>
          <span
            className={`font-mono font-bold text-sm tracking-widest ${
              data.wasm_hash_match ? "text-success" : "text-destructive"
            }`}
          >
            {data.wasm_hash_match ? "TRUE" : "FALSE"}
          </span>
        </div>
      )}

      {/* Error detail */}
      {data.error && (
        <p className="text-muted-foreground/80 text-xs font-mono break-all mb-4">{data.error}</p>
      )}

      {/* Level badge */}
      <div className="flex items-center gap-2 justify-center bg-card-hover border border-border rounded-full px-4 py-2">
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
          {d.result.level} {data.verification_level} — {levelLabel}
        </span>
      </div>
    </div>
  );
}
