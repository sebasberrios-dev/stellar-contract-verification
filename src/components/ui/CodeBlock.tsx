"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";

interface CodeBlockProps {
  code: string;
  /** Optional filename shown in a header bar */
  filename?: string;
  variant?: "cyan" | "blue";
  copyLabel?: string;
}

export default function CodeBlock({
  code,
  filename,
  variant = "cyan",
  copyLabel = "Copy",
}: CodeBlockProps) {
  const [copied, setCopied] = useState(false);
  const isBlue = variant === "blue";

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  const copyButton = (
    <button
      type="button"
      onClick={() => void handleCopy()}
      className={`flex items-center gap-1.5 text-xs rounded-md px-2.5 py-1 border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60 ${
        isBlue
          ? "bg-secondary/10 border-secondary/20 text-secondary hover:bg-secondary/20"
          : "bg-primary/10 border-primary/20 text-primary hover:bg-primary/20"
      }`}
    >
      {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
      {copied ? "Copied!" : copyLabel}
    </button>
  );

  return (
    <div
      className={`relative bg-code border rounded-xl overflow-hidden ${
        isBlue ? "border-secondary/20" : "border-primary/15"
      }`}
    >
      {filename ? (
        <div
          className={`flex items-center justify-between px-4 py-3 border-b ${
            isBlue ? "border-secondary/10" : "border-primary/10"
          }`}
        >
          <span className="text-muted-foreground/80 text-xs font-mono">{filename}</span>
          {copyButton}
        </div>
      ) : (
        <div className="absolute top-3 right-3 z-10">{copyButton}</div>
      )}
      <pre
        className={`p-4 overflow-x-auto text-xs sm:text-sm leading-relaxed font-mono ${
          filename ? "" : "pr-24"
        } ${isBlue ? "text-blue-300" : "text-sky-300"}`}
      >
        <code>{code}</code>
      </pre>
    </div>
  );
}
