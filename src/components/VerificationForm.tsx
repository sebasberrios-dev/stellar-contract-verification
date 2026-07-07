"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import Input from "./ui/Input";
import Button from "./ui/Button";
import type { VerifyFlowState } from "../types/index";

interface VerificationFormProps {
  onVerify: (contractId: string) => Promise<void>;
  flowState: VerifyFlowState;
  initialValue?: string;
}

export default function VerificationForm({
  onVerify,
  flowState,
  initialValue = "",
}: VerificationFormProps) {
  const [contractId, setContractId] = useState(initialValue);
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

  const isLoading = flowState === "loading-cache" || flowState === "verifying";
  const isDisabled = contractId.trim() === "" || isLoading;

  function buttonContent() {
    if (flowState === "loading-cache") return <span>Checking cache...</span>;
    if (flowState === "verifying") {
      return <span>Rebuilding from source... This may take 2–6 minutes</span>;
    }
    return (
      <>
        <Search className="w-4 h-4" aria-hidden="true" />
        <span>Verify Contract</span>
      </>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="w-full">
      <div className="flex flex-col gap-3">
        <Input
          label="Contract ID"
          type="text"
          value={contractId}
          onChange={handleChange}
          placeholder="C… (56 characters)"
          maxLength={64}
          disabled={isLoading}
          error={touched ? error : null}
          spellCheck={false}
        />

        <Button
          type="submit"
          variant="primary"
          size="md"
          disabled={isDisabled}
          loading={isLoading}
          className="w-full"
        >
          {buttonContent()}
        </Button>
      </div>
    </form>
  );
}
