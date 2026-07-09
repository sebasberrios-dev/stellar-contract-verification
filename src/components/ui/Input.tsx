"use client";

import { useId } from "react";
import type { InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  /** Visually hide the label while keeping it for screen readers */
  hideLabel?: boolean;
  error?: string | null;
}

export default function Input({
  label,
  hideLabel = false,
  error,
  className = "",
  id,
  ...props
}: InputProps) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const errorId = `${inputId}-error`;

  return (
    <div className="flex flex-col gap-1.5 w-full">
      <label
        htmlFor={inputId}
        className={
          hideLabel
            ? "sr-only"
            : "text-muted-foreground text-xs font-medium uppercase tracking-wider"
        }
      >
        {label}
      </label>
      <input
        id={inputId}
        className={`w-full bg-card border rounded-lg px-4 h-11 text-sm font-mono text-foreground placeholder:text-muted-foreground/50 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60 disabled:opacity-50 disabled:cursor-not-allowed ${
          error ? "border-destructive/60" : "border-border focus-visible:border-secondary"
        } ${className}`}
        aria-describedby={error ? errorId : undefined}
        aria-invalid={error ? true : undefined}
        {...props}
      />
      {error && (
        <p id={errorId} role="alert" className="text-destructive text-xs px-1">
          {error}
        </p>
      )}
    </div>
  );
}
