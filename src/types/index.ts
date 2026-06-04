export interface VerifyRequest {
  contract_id: string;
}

export interface VerifyResponse {
  verified: boolean;
  verification_level: 0 | 1 | 2 | 3 | 4;
  source_repo: string | null;
  source_rev: string | null;
  build_image: string | null;
  onchain_hash: string;
  rebuilt_hash: string | null;
  wasm_hash_match: boolean;
  error: string | null;
}

export type VerificationStatus = "idle" | "loading" | "success" | "error";

export const LEVEL_LABELS: Record<number, string> = {
  0: "Unknown",
  1: "Metadata Present",
  2: "Source Verified",
  3: "Source + Attestation",
  4: "Source + Attestation + Auditor",
};

export const VALIDATION = {
  CONTRACT_ID_MIN_LENGTH: 10,
  CONTRACT_ID_MAX_LENGTH: 64,
  CONTRACT_ID_PREFIX: "C",
} as const;
