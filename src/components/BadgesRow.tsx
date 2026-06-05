import { CheckCircle2 } from "lucide-react";

interface Badge {
  label: string;
}

const BADGES: Badge[] = [
  { label: "SEP-58 Compatible" },
  { label: "Official Stellar CLI" },
  { label: "Reproducible Builds" },
  { label: "Open Source" },
];

export default function BadgesRow() {
  return (
    <div className="flex flex-wrap justify-center gap-3">
      {BADGES.map((badge) => (
        <div
          key={badge.label}
          className="flex items-center gap-2 bg-[#111318] border border-[#1e2130] rounded-full px-4 py-2 hover:border-[#3b82f6]/30 transition-colors"
        >
          <CheckCircle2
            className="w-4 h-4 flex-shrink-0"
            color="#22c55e"
            aria-hidden="true"
          />
          <span className="text-sm text-slate-300">{badge.label}</span>
        </div>
      ))}
    </div>
  );
}
