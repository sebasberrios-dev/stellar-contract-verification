import { NextRequest, NextResponse } from "next/server";
import { submitVerification } from "../../../lib/api";
import type { ContractLookupResponse } from "../../../types/index";

interface ErrorResponse {
  error: string;
  code: string;
}

export async function POST(
  req: NextRequest,
): Promise<NextResponse<ContractLookupResponse | ErrorResponse>> {
  let body: unknown;

  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body", code: "INVALID_BODY" },
      { status: 400 },
    );
  }

  const { contract_id } = body as { contract_id?: string };

  if (!contract_id || typeof contract_id !== "string") {
    return NextResponse.json(
      { error: "contract_id is required", code: "MISSING_CONTRACT_ID" },
      { status: 400 },
    );
  }

  if (!process.env.BACKEND_URL) {
    return NextResponse.json(
      { error: "Backend not configured", code: "BACKEND_NOT_CONFIGURED" },
      { status: 500 },
    );
  }

  try {
    const data = await submitVerification(contract_id);
    return NextResponse.json(data);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Verification request failed";
    return NextResponse.json(
      { error: message, code: "VERIFY_FAILED" },
      { status: 502 },
    );
  }
}
