import { NextRequest, NextResponse } from "next/server";

interface ErrorResponse {
  error: string;
  code: string;
}

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ wasm_hash: string }> },
): Promise<NextResponse<unknown | ErrorResponse>> {
  const { wasm_hash } = await context.params;
  const network = req.nextUrl.searchParams.get("network") ?? "testnet";

  const backendUrl = process.env.BACKEND_URL;
  if (!backendUrl) {
    return NextResponse.json(
      { error: "Backend not configured", code: "BACKEND_NOT_CONFIGURED" },
      { status: 500 },
    );
  }

  try {
    const upstream = await fetch(
      `${backendUrl}/v1/wasm/${encodeURIComponent(wasm_hash)}/verifications?network=${encodeURIComponent(network)}`,
      { cache: "no-store" },
    );

    const data = await upstream.json().catch(() => ({
      error: `Invalid JSON from backend (HTTP ${upstream.status})`,
    }));

    return NextResponse.json(data, { status: upstream.status });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Lookup request failed";
    return NextResponse.json(
      { error: message, code: "LOOKUP_FAILED" },
      { status: 502 },
    );
  }
}
