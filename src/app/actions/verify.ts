"use server";

import {
  lookupByContractId,
  submitVerification as apiPost,
} from "../../lib/api";
import type { ContractLookupResponse } from "../../types/index";

export async function lookupContract(
  contractId: string
): Promise<ContractLookupResponse> {
  return lookupByContractId(contractId);
}

export async function submitVerification(contractId: string): Promise<ContractLookupResponse> {
  return apiPost(contractId);
}
