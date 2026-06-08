import { VerifyResponse, LEVEL_LABELS } from "../types/index";

type LegacyStatus = "idle" | "loading" | "success" | "error";

interface VerificationResultProps {
  status: LegacyStatus;
  result: VerifyResponse | null;
  error: string | null;
}

export default function VerificationResult({
  status,
  result,
  error,
}: VerificationResultProps) {
  if (status === "idle") {
    return null;
  }

  if (status === "loading") {
    return (
      <div className="animate-pulse bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6 mt-6">
        <p className="text-white font-semibold mb-2">⏳ Analyzing contract...</p>
        <p className="text-slate-400 text-sm">
          Reading WASM · Extracting metadata · Building · Comparing hashes
        </p>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="border-l-4 border-red-500 bg-white/5 backdrop-blur-xl border-r border-t border-b border-white/10 rounded-xl p-6 mt-6">
        <p className="text-red-400 font-semibold mb-2">❌ ERROR</p>
        <p className="text-slate-400 text-sm break-all">{error}</p>
      </div>
    );
  }

  // status === "success"
  if (!result) {
    return null;
  }

  if (result.verified === true) {
    const shortRev = result.source_rev ? result.source_rev.slice(0, 7) : "—";
    const shortOnchain = result.onchain_hash
      ? result.onchain_hash.slice(0, 16) + "..."
      : "—";
    const level = result.verification_level;
    const levelLabel = LEVEL_LABELS[level] ?? "Unknown";

    return (
      <div className="border-l-4 border-[#00BFFF] bg-white/5 backdrop-blur-xl border-r border-t border-b border-white/10 rounded-xl p-6 mt-6">
        <p className="text-[#00BFFF] font-bold text-lg mb-4">✅ CONTRACT VERIFIED</p>
        <div className="border-t border-white/10 pt-4 space-y-3">
          <div className="flex items-start gap-4">
            <span className="text-slate-400 text-sm w-28 shrink-0">Repository</span>
            {result.source_repo ? (
              <a
                href={result.source_repo}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#3B82F6] text-sm truncate hover:underline"
              >
                {result.source_repo}
              </a>
            ) : (
              <span className="text-white text-sm">—</span>
            )}
          </div>
          <div className="flex items-center gap-4">
            <span className="text-slate-400 text-sm w-28 shrink-0">Commit</span>
            <span className="text-white font-mono text-sm" style={{ fontFamily: "var(--font-jetbrains, ui-monospace, monospace)" }}>{shortRev}</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-slate-400 text-sm w-28 shrink-0">Build Image</span>
            <span className="text-white text-sm truncate">{result.build_image ?? "—"}</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-slate-400 text-sm w-28 shrink-0">Hash Match</span>
            <span className="text-[#00BFFF] font-mono text-sm" style={{ fontFamily: "var(--font-jetbrains, ui-monospace, monospace)" }}>TRUE</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-slate-400 text-sm w-28 shrink-0">Level</span>
            <span className="bg-white/10 text-white text-xs px-2 py-0.5 rounded-full">
              {level} — {levelLabel}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-slate-400 text-sm w-28 shrink-0">On-chain hash</span>
            <span className="text-white font-mono text-sm" style={{ fontFamily: "var(--font-jetbrains, ui-monospace, monospace)" }}>{shortOnchain}</span>
          </div>
        </div>
      </div>
    );
  }

  // verified === false
  if (result.verification_level === 0) {
    return (
      <div className="border-l-4 border-yellow-500 bg-white/5 backdrop-blur-xl border-r border-t border-b border-white/10 rounded-xl p-6 mt-6">
        <p className="text-yellow-400 font-bold text-lg mb-2">⚠️ NO METADATA FOUND</p>
        <p className="text-slate-400 text-sm mb-1">
          This contract has no SEP-58 build metadata.
        </p>
        <p className="text-slate-400 text-sm">
          The developer has not embedded source information.
        </p>
      </div>
    );
  }

  // verified === false && verification_level >= 2 → hash mismatch
  const shortOnchain = result.onchain_hash
    ? result.onchain_hash.slice(0, 16) + "..."
    : "—";
  const shortRebuilt = result.rebuilt_hash
    ? result.rebuilt_hash.slice(0, 16) + "..."
    : "—";

  return (
    <div className="border-l-4 border-red-500 bg-white/5 backdrop-blur-xl border-r border-t border-b border-white/10 rounded-xl p-6 mt-6">
      <p className="text-red-400 font-bold text-lg mb-4">❌ HASH MISMATCH</p>
      <div className="space-y-3">
        <div className="flex items-center gap-4">
          <span className="text-slate-400 text-sm w-32 shrink-0">On-chain hash</span>
          <span className="text-white font-mono text-sm" style={{ fontFamily: "var(--font-jetbrains, ui-monospace, monospace)" }}>{shortOnchain}</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-slate-400 text-sm w-32 shrink-0">Rebuilt hash</span>
          <span className="text-white font-mono text-sm" style={{ fontFamily: "var(--font-jetbrains, ui-monospace, monospace)" }}>{shortRebuilt}</span>
        </div>
        <p className="text-slate-400 text-sm pt-2">
          Source does not match the deployed contract.
        </p>
      </div>
    </div>
  );
}
