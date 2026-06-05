"use client";

import { useState } from "react";
import { Search, Loader2 } from "lucide-react";

interface VerificationFormProps {
  onVerify: (contractId: string) => Promise<void>;
  loading: boolean;
}

export default function VerificationForm({ onVerify, loading }: VerificationFormProps) {
  const [contractId, setContractId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [touched, setTouched] = useState(false);

  function validate(value: string): string | null {
    if (value.length < 10) return "Contract ID is too short";
    if (!value.startsWith("C")) return "Contract ID must start with C";
    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = contractId.trim();
    setTouched(true);

    const validationError = validate(trimmed);
    if (validationError || trimmed === "") {
      setError(validationError ?? "Contract ID is required");
      return;
    }

    setError(null);
    await onVerify(trimmed);
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setContractId(e.target.value);
    if (touched) {
      setError(validate(e.target.value.trim()));
    }
  }

  const isDisabled = contractId.trim() === "" || loading;

  return (
    <form onSubmit={handleSubmit} noValidate className="w-full">
      <div className="flex flex-col gap-2">
        <div className="relative">
          <input
            type="text"
            value={contractId}
            onChange={handleChange}
            placeholder="Contract ID (e.g. CA...)"
            maxLength={64}
            disabled={loading}
            className="w-full bg-[#111318] border border-[#1e2130] text-white rounded-lg px-4 py-3 text-sm font-mono placeholder-slate-600 focus:outline-none focus:border-[#3b82f6] focus:shadow-[0_0_12px_rgba(59,130,246,0.2)] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            aria-describedby={error && touched ? "contract-error" : undefined}
            aria-invalid={error && touched ? true : undefined}
          />
        </div>

        {error && touched && (
          <p id="contract-error" role="alert" className="text-red-400 text-xs px-1">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={isDisabled}
          className="w-full flex items-center justify-center gap-2 bg-[#3b82f6] hover:bg-[#2563eb] text-white font-semibold py-3 px-6 rounded-lg transition-all hover:shadow-[0_0_20px_rgba(59,130,246,0.4)] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Verifying...</span>
            </>
          ) : (
            <>
              <Search className="w-4 h-4" />
              <span>Verify Contract</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}
