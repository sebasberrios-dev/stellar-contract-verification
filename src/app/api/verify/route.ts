import { NextRequest, NextResponse } from "next/server";
import type { VerifyResponse } from "../../../types/index";

interface ErrorResponse {
  error: string;
  code: string;
}

export async function POST(
  req: NextRequest
): Promise<NextResponse<VerifyResponse | ErrorResponse>> {
  let body: unknown;

  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body", code: "INVALID_BODY" },
      { status: 400 }
    );
  }

  const { contract_id } = body as { contract_id?: string };

  if (!contract_id || typeof contract_id !== "string") {
    return NextResponse.json(
      { error: "contract_id is required", code: "MISSING_CONTRACT_ID" },
      { status: 400 }
    );
  }

  const backendUrl = process.env.BACKEND_URL;
  if (!backendUrl) {
    return NextResponse.json(
      { error: "Backend not configured", code: "BACKEND_NOT_CONFIGURED" },
      { status: 500 }
    );
  }

  const upstream = await fetch(`${backendUrl}/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ contract_id }),
  });

  const data = await upstream.json();

  return NextResponse.json(data, { status: upstream.status });
}
