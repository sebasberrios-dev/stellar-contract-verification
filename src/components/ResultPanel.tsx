"use client";

interface VerificationResult {
  contract: string;
  repository: string;
  commit: string;
  buildImage: string;
  hashMatch: boolean;
  verified: boolean;
}

interface ResultPanelProps {
  data: VerificationResult | null;
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

export default function ResultPanel({ data, visible }: ResultPanelProps) {
  if (!visible || !data) return null;

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
            {truncateId(data.contract)}
          </span>
        </div>

        <div className="flex flex-col gap-1">
          <span className="text-slate-500 text-xs uppercase tracking-wider">Repository</span>
          <a
            href={data.repository}
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono text-[#3b82f6] text-sm hover:text-[#60a5fa] transition-colors break-all"
            suppressHydrationWarning
          >
            {truncateId(data.repository, 30, 0) || data.repository}
          </a>
        </div>

        <div className="flex flex-col gap-1">
          <span className="text-slate-500 text-xs uppercase tracking-wider">Commit</span>
          <span className="font-mono text-slate-200 text-sm">
            {truncateId(data.commit, 10, 0)}
          </span>
        </div>

        <div className="flex flex-col gap-1">
          <span className="text-slate-500 text-xs uppercase tracking-wider">Build Image</span>
          <span className="font-mono text-slate-200 text-sm break-all">
            {truncateId(data.buildImage, 28, 0)}
          </span>
        </div>
      </div>

      {/* Hash match */}
      <div className="flex items-center justify-between bg-green-500/5 border border-green-500/20 rounded-xl px-4 py-3 mb-4">
        <span className="text-slate-400 text-sm font-medium">Hash Match</span>
        <span className="font-mono text-green-400 font-bold text-sm tracking-widest">
          {data.hashMatch ? "TRUE" : "FALSE"}
        </span>
      </div>

      {/* Badge */}
      {data.verified && (
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
            Cryptographic Proof Verified
          </span>
        </div>
      )}
    </div>
  );
}
