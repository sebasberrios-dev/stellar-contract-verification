// ── Backend schema types (SEP-58 / SEP-1945) ─────────────────────────────

export type VerificationStatus = "verified" | "mismatch" | "failed" | "unverified";

export interface VerifierInfo {
  id: string;
  name: string;
  url: string;
}

export interface VerificationEntry {
  metadata_source: string;
  verified: boolean;
  verification_level: number;
  status: VerificationStatus;
  source_repo: string | null;
  source_rev: string | null;
  bldimg: string | null;
  build_image: string | null;
  bldopt: string[];
  onchain_hash: string;
  rebuilt_hash: string | null;
  wasm_hash_match: boolean;
  processed_at: string | null;
  verifier: VerifierInfo;
  error: string | null;
}

export interface ContractLookupResponse {
  schema_version: string;
  contract_id: string;
  wasm_hash: string | null;
  network: string;
  updated_at: string | null;
  verifications: VerificationEntry[];
}

// ── Legacy flat response (POST /verify — used by ResultPanel until F3) ───

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

// ── UI flow state ─────────────────────────────────────────────────────────

export type VerifyFlowState =
  | "idle"
  | "loading-cache"
  | "cached-result"
  | "verifying"
  | "error";

// ── Display helpers ───────────────────────────────────────────────────────

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
