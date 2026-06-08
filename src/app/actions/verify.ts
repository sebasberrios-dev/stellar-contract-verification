"use server";

import { VerifyResponse } from "../../types/index";

export async function submitVerification(contractId: string): Promise<VerifyResponse> {
  const backendUrl = process.env.BACKEND_URL;
  if (!backendUrl) {
    throw new Error("BACKEND_URL is not configured");
  }

  const response = await fetch(`${backendUrl}/verify`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "ngrok-skip-browser-warning": "true",
    },
    body: JSON.stringify({ contract_id: contractId }),
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }

  return response.json() as Promise<VerifyResponse>;
}
