import { render, screen } from "@testing-library/react";
import VerificationResult from "../VerificationResult";

const mockVerified = {
  verified: true,
  verification_level: 2 as const,
  source_repo: "https://github.com/stellar/soroban-examples",
  source_rev: "a13b82d",
  build_image: "stellar/stellar-cli:latest",
  onchain_hash: "a1b2c3d4e5f67890abcdef1234567890abcdef1234567890abcdef1234567890",
  rebuilt_hash: "a1b2c3d4e5f67890abcdef1234567890abcdef1234567890abcdef1234567890",
  wasm_hash_match: true,
  error: null,
};

const mockNoMeta = {
  verified: false,
  verification_level: 0 as const,
  source_repo: null,
  source_rev: null,
  build_image: null,
  onchain_hash: "b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef12345678",
  rebuilt_hash: null,
  wasm_hash_match: false,
  error: "No SEP-58 metadata found",
};

const mockMismatch = {
  verified: false,
  verification_level: 2 as const,
  source_repo: "https://github.com/acme/my-contract",
  source_rev: "deadbee",
  build_image: "stellar/stellar-cli:latest",
  onchain_hash: "a1b2c3d4e5f67890abcdef1234567890abcdef1234567890abcdef1234567890",
  rebuilt_hash: "9z8y7x6w5v4u3t2s1r0q9p8o7n6m5l4k3j2i1h0g9f8e7d6c5b4a3928374651",
  wasm_hash_match: false,
  error: null,
};

describe("VerificationResult", () => {
  it("renders nothing when status is idle", () => {
    const { container } = render(
      <VerificationResult status="idle" result={null} error={null} />
    );
    expect(container.firstChild).toBeNull();
  });

  it("shows 'Analyzing contract...' when status is loading", () => {
    render(
      <VerificationResult status="loading" result={null} error={null} />
    );
    expect(screen.getByText(/Analyzing contract\.\.\./i)).toBeInTheDocument();
  });

  it("shows 'CONTRACT VERIFIED' when status is success and result.verified is true", () => {
    render(
      <VerificationResult
        status="success"
        result={mockVerified}
        error={null}
      />
    );
    expect(screen.getByText(/CONTRACT VERIFIED/i)).toBeInTheDocument();
  });

  it("shows 'NO METADATA FOUND' when status is success and verified=false, level=0", () => {
    render(
      <VerificationResult
        status="success"
        result={mockNoMeta}
        error={null}
      />
    );
    expect(screen.getByText(/NO METADATA FOUND/i)).toBeInTheDocument();
  });

  it("shows 'HASH MISMATCH' when status is success and verified=false, level=2", () => {
    render(
      <VerificationResult
        status="success"
        result={mockMismatch}
        error={null}
      />
    );
    expect(screen.getByText(/HASH MISMATCH/i)).toBeInTheDocument();
  });

  it("shows the error message when status is error", () => {
    render(
      <VerificationResult
        status="error"
        result={null}
        error="Network error"
      />
    );
    expect(screen.getByText("Network error")).toBeInTheDocument();
  });

  it("truncates long hashes to 16 characters plus '...'", () => {
    render(
      <VerificationResult
        status="success"
        result={mockVerified}
        error={null}
      />
    );
    // onchain_hash starts with "a1b2c3d4e5f67890..." — 16 chars + "..."
    expect(screen.getByText("a1b2c3d4e5f67890...")).toBeInTheDocument();
  });
});
