import { NextRequest, NextResponse } from "next/server";

interface VerifyRequest {
  contractId: string;
}

export interface VerificationResult {
  contract: string;
  repository: string;
  commit: string;
  buildImage: string;
  hashMatch: boolean;
  verified: boolean;
  verifiedAt: string;
}

interface ErrorResponse {
  error: string;
  code: string;
}

function buildDemoResult(contractId: string): VerificationResult {
  return {
    contract: contractId,
    repository: "https://github.com/stellar/soroban-examples",
    commit: "a1b2c3d4e5f678901234567890abcdef12345678",
    buildImage: "stellar/soroban-toolchain:v0.0.18",
    hashMatch: true,
    verified: true,
    verifiedAt: new Date().toISOString(),
  };
}

export async function POST(req: NextRequest): Promise<NextResponse<VerificationResult | ErrorResponse>> {
  let body: unknown;

  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body", code: "INVALID_BODY" },
      { status: 400 }
    );
  }

  const { contractId } = body as Partial<VerifyRequest>;

  if (!contractId || typeof contractId !== "string") {
    return NextResponse.json(
      { error: "contractId is required", code: "MISSING_CONTRACT_ID" },
      { status: 400 }
    );
  }

  if (contractId.length < 10) {
    return NextResponse.json(
      { error: "contractId is too short", code: "INVALID_CONTRACT_ID" },
      { status: 422 }
    );
  }

  if (!contractId.startsWith("C")) {
    return NextResponse.json(
      { error: "contractId must start with C", code: "INVALID_CONTRACT_ID" },
      { status: 422 }
    );
  }

  // Simulated verification delay — replace with real Soroban RPC call
  await new Promise<void>((resolve) => setTimeout(resolve, 2000));

  return NextResponse.json(buildDemoResult(contractId), { status: 200 });
}
