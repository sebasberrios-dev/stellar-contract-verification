import type { ContractLookupResponse } from "../types/index";

function backendUrl(): string {
  const url = process.env.BACKEND_URL;
  if (!url) throw new Error("BACKEND_URL is not configured");
  return url;
}

export async function lookupByContractId(
  contractId: string,
  network = "testnet"
): Promise<ContractLookupResponse> {
  const res = await fetch(
    `${backendUrl()}/v1/contracts/${encodeURIComponent(contractId)}/verifications?network=${network}`,
    {
      headers: { "ngrok-skip-browser-warning": "true" },
      cache: "no-store",
    }
  );
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
    throw new Error((body as { error?: string }).error ?? `HTTP ${res.status}`);
  }
  return res.json() as Promise<ContractLookupResponse>;
}

export async function submitVerification(contractId: string): Promise<ContractLookupResponse> {
  const res = await fetch(`${backendUrl()}/verify`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "ngrok-skip-browser-warning": "true",
    },
    body: JSON.stringify({ contract_id: contractId }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json() as Promise<ContractLookupResponse>;
}
