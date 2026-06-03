use crate::errors::AppError;
use reqwest::Client;
use serde_json::{json, Value};
use sha2::{Digest, Sha256};
use std::time::Duration;

use stellar_strkey::Contract;
use stellar_xdr::curr::{
    ContractDataDurability, ContractExecutable, ContractId, Hash, LedgerEntryData, LedgerKey,
    LedgerKeyContractCode, LedgerKeyContractData, Limits, ReadXdr, ScAddress, ScVal, WriteXdr,
};

fn xdr_to_b64<T: WriteXdr>(value: &T) -> Result<String, AppError> {
    value
        .to_xdr_base64(Limits::none())
        .map_err(|e| AppError::InternalError(format!("XDR encode: {e}")))
}

// The `xdr` field in getLedgerEntries response is LedgerEntryData (the data union),
// not the full LedgerEntry struct (which would include lastModifiedLedgerSeq).
fn b64_to_ledger_entry_data(b64: &str) -> Result<LedgerEntryData, AppError> {
    LedgerEntryData::from_xdr_base64(b64, Limits::none())
        .map_err(|e| AppError::InternalError(format!("XDR decode LedgerEntryData: {e}")))
}

pub async fn get_contract_wasm(rpc_url: &str, contract_id: &str) -> Result<Vec<u8>, AppError> {
    let contract = Contract::from_string(contract_id).map_err(|_| AppError::ContractNotFound)?;
    let contract_hash = Hash(contract.0);

    let client = Client::builder()
        .timeout(Duration::from_secs(30))
        .build()
        .map_err(|e| AppError::InternalError(e.to_string()))?;

    // Step 1: getLedgerEntries(ContractInstance) → wasm_hash
    let instance_key = LedgerKey::ContractData(LedgerKeyContractData {
        contract: ScAddress::Contract(ContractId(contract_hash)),
        key: ScVal::LedgerKeyContractInstance,
        durability: ContractDataDurability::Persistent,
    });

    let entries = rpc_get_ledger_entries(&client, rpc_url, &[xdr_to_b64(&instance_key)?]).await?;

    if entries.is_empty() {
        return Err(AppError::ContractNotFound);
    }

    let entry_b64 = entries[0]["xdr"]
        .as_str()
        .ok_or_else(|| AppError::InternalError("Missing 'xdr' in instance entry".into()))?;

    let wasm_hash = extract_wasm_hash(b64_to_ledger_entry_data(entry_b64)?)?;

    // Step 2: getLedgerEntries(ContractCode) → raw WASM bytes
    let code_key = LedgerKey::ContractCode(LedgerKeyContractCode { hash: wasm_hash });

    let code_entries =
        rpc_get_ledger_entries(&client, rpc_url, &[xdr_to_b64(&code_key)?]).await?;

    if code_entries.is_empty() {
        return Err(AppError::InternalError("ContractCode entry not found".into()));
    }

    let code_b64 = code_entries[0]["xdr"]
        .as_str()
        .ok_or_else(|| AppError::InternalError("Missing 'xdr' in code entry".into()))?;

    extract_wasm_bytes(b64_to_ledger_entry_data(code_b64)?)
}

fn extract_wasm_hash(data: LedgerEntryData) -> Result<Hash, AppError> {
    let LedgerEntryData::ContractData(contract_data) = data else {
        return Err(AppError::InternalError("Expected ContractData entry".into()));
    };
    let ScVal::ContractInstance(instance) = contract_data.val else {
        return Err(AppError::InternalError(
            "ContractData.val is not a ContractInstance".into(),
        ));
    };
    let ContractExecutable::Wasm(hash) = instance.executable else {
        return Err(AppError::InternalError(
            "Contract is a Stellar Asset Contract, not Wasm".into(),
        ));
    };
    Ok(hash)
}

fn extract_wasm_bytes(data: LedgerEntryData) -> Result<Vec<u8>, AppError> {
    let LedgerEntryData::ContractCode(code_entry) = data else {
        return Err(AppError::InternalError("Expected ContractCode entry".into()));
    };
    Ok(code_entry.code.to_vec())
}

async fn rpc_get_ledger_entries(
    client: &Client,
    rpc_url: &str,
    keys: &[String],
) -> Result<Vec<Value>, AppError> {
    let body = json!({
        "jsonrpc": "2.0",
        "id": 1,
        "method": "getLedgerEntries",
        "params": { "keys": keys }
    });

    let resp = client
        .post(rpc_url)
        .json(&body)
        .send()
        .await
        .map_err(|e| AppError::InternalError(format!("RPC request failed: {e}")))?;

    let json: Value = resp
        .json()
        .await
        .map_err(|e| AppError::InternalError(format!("RPC response parse: {e}")))?;

    if let Some(err) = json.get("error") {
        tracing::warn!("RPC returned error: {}", err);
        return Err(AppError::ContractNotFound);
    }

    let entries = json["result"]["entries"]
        .as_array()
        .cloned()
        .unwrap_or_default();

    Ok(entries)
}

pub fn compute_sha256(bytes: &[u8]) -> String {
    let mut hasher = Sha256::new();
    hasher.update(bytes);
    hex::encode(hasher.finalize())
}
