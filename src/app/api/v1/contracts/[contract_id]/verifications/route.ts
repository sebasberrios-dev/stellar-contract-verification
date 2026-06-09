import { NextRequest, NextResponse } from "next/server";
import { lookupByContractId } from "../../../../../lib/api";

interface ErrorResponse {
  error: string;
  code: string;
}

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ contract_id: string }> },
): Promise<NextResponse<unknown | ErrorResponse>> {
  const { contract_id } = await context.params;
  const network = req.nextUrl.searchParams.get("network") ?? "testnet";

  if (!process.env.BACKEND_URL) {
    return NextResponse.json(
      { error: "Backend not configured", code: "BACKEND_NOT_CONFIGURED" },
      { status: 500 },
    );
  }

  try {
    const data = await lookupByContractId(contract_id, network);
    return NextResponse.json(data);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Lookup request failed";
    return NextResponse.json(
      { error: message, code: "LOOKUP_FAILED" },
      { status: 502 },
    );
  }
}
