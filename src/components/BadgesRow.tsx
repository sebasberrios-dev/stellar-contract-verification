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
          className="flex items-center gap-2 bg-card border border-border rounded-full px-4 py-2 hover:border-primary/40 transition-colors"
        >
          <CheckCircle2
            className="w-4 h-4 flex-shrink-0 text-success"
            aria-hidden="true"
          />
          <span className="text-sm text-foreground/80">{badge.label}</span>
        </div>
      ))}
    </div>
  );
}
