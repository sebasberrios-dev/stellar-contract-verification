"use client";

import { CheckCircle2 } from "lucide-react";
import { useI18n } from "../i18n/LanguageContext";

export default function BadgesRow() {
  const { d } = useI18n();
  const badges = [d.badges.sep58, d.badges.cli, d.badges.repro, d.badges.oss];

  return (
    <div className="flex flex-wrap justify-center gap-3">
      {badges.map((label) => (
        <div
          key={label}
          className="flex items-center gap-2 bg-card border border-border rounded-full px-4 py-2 hover:border-primary/40 transition-colors"
        >
          <CheckCircle2
            className="w-4 h-4 flex-shrink-0 text-success"
            aria-hidden="true"
          />
          <span className="text-sm text-foreground/80">{label}</span>
        </div>
      ))}
    </div>
  );
}
