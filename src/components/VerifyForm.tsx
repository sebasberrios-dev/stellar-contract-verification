"use client";

import { useState } from "react";
import { VALIDATION } from "../types/index";

interface VerifyFormProps {
  onSubmit: (contractId: string) => void;
  isLoading: boolean;
}

function validate(contractId: string): string | null {
  if (!contractId.startsWith(VALIDATION.CONTRACT_ID_PREFIX)) {
    return `Contract ID must start with ${VALIDATION.CONTRACT_ID_PREFIX}`;
  }
  if (contractId.length < VALIDATION.CONTRACT_ID_MIN_LENGTH) {
    return "Contract ID is too short";
  }
  return null;
}

export default function VerifyForm({ onSubmit, isLoading }: VerifyFormProps) {
  const [contractId, setContractId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = contractId.trim();
    setSubmitted(true);

    const validationError = validate(trimmed);
    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    onSubmit(trimmed);
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value;
    setContractId(value);
    if (submitted) {
      const validationError = validate(value.trim());
      setError(validationError);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      handleSubmit(e as unknown as React.FormEvent);
    }
  }

  const isDisabled = contractId.trim() === "" || isLoading;

  return (
    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 w-full">
      <h2 className="text-white font-semibold text-lg mb-4">Verify a Contract</h2>
      <form onSubmit={handleSubmit} noValidate>
        <label htmlFor="contract-id" className="block text-slate-400 text-sm mb-2">
          Contract ID
        </label>
        <input
          id="contract-id"
          type="text"
          value={contractId}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder="C... (Soroban Contract ID)"
          maxLength={VALIDATION.CONTRACT_ID_MAX_LENGTH}
          disabled={isLoading}
          className="w-full bg-white/5 text-white border border-white/10 focus:border-[#00BFFF] focus:outline-none focus:shadow-[0_0_12px_rgba(0,191,255,0.15)] rounded-lg px-4 py-3 text-sm placeholder-slate-600 disabled:opacity-50 disabled:cursor-not-allowed mb-1 transition-colors font-mono"
          aria-describedby={error ? "contract-id-error" : undefined}
          aria-invalid={error ? true : undefined}
        />

        {error && submitted && (
          <p id="contract-id-error" className="text-red-400 text-xs mt-1 mb-3" role="alert">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={isDisabled}
          className="mt-4 w-full text-white font-bold py-3 px-6 rounded-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-[0_0_20px_rgba(0,191,255,0.4)]"
          style={{ background: "linear-gradient(to right, #00BFFF, #3B82F6)" }}
        >
          {isLoading ? (
            <>
              <svg
                className="animate-spin h-4 w-4 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
              <span>Verifying...</span>
            </>
          ) : (
            <span>Verify Contract</span>
          )}
        </button>
      </form>
    </div>
  );
}
