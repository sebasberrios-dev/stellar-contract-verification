export function validateContractId(contractId: string): { valid: boolean; error?: string } {
  const trimmed = contractId.trim();

  if (!trimmed) {
    return { valid: false, error: "Contract ID cannot be empty" };
  }

  if (!trimmed.startsWith("C")) {
    return { valid: false, error: "Contract ID must start with C" };
  }

  if (trimmed.length < 10) {
    return { valid: false, error: "Contract ID is too short" };
  }

  return { valid: true };
}
