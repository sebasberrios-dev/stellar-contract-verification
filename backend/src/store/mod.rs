mod sqlite;

pub use sqlite::SqliteVerificationStore;

use crate::routes::{VerificationStatus, VerifierInfo, VerifyResponse};
use serde::Serialize;

pub const SCHEMA_VERSION: &str = "1.0";

pub trait VerificationStore: Send + Sync {
    fn get_cached(
        &self,
        contract_id: &str,
        network: &str,
        onchain_hash: &str,
    ) -> Result<Option<VerifyResponse>, String>;

    fn save(
        &self,
        contract_id: &str,
        network: &str,
        onchain_hash: &str,
        response: &VerifyResponse,
    ) -> Result<(), String>;

    fn by_contract_id(
        &self,
        contract_id: &str,
        network: &str,
    ) -> Result<ContractLookupResponse, String>;

    fn by_wasm_hash(&self, wasm_hash: &str, network: &str) -> Result<WasmLookupResponse, String>;

    fn ping(&self) -> Result<(), String>;
}

#[derive(Debug, Clone, Serialize)]
pub struct VerificationEntry {
    pub metadata_source: &'static str,
    #[serde(flatten)]
    pub result: VerifyResponse,
}

#[derive(Debug, Clone, Serialize)]
pub struct ContractLookupResponse {
    pub schema_version: &'static str,
    pub contract_id: String,
    pub wasm_hash: Option<String>,
    pub network: String,
    pub updated_at: Option<String>,
    pub verifications: Vec<VerificationEntry>,
}

#[derive(Debug, Clone, Serialize)]
pub struct WasmLookupResponse {
    pub schema_version: &'static str,
    pub wasm_hash: String,
    pub network: String,
    pub updated_at: Option<String>,
    pub verifications: Vec<VerificationEntry>,
}

fn latest_timestamp(entries: &[VerificationEntry]) -> Option<String> {
    entries
        .iter()
        .filter_map(|e| e.result.processed_at.as_deref())
        .max()
        .map(String::from)
}

impl ContractLookupResponse {
    pub fn new(
        contract_id: String,
        network: String,
        verifications: Vec<VerificationEntry>,
    ) -> Self {
        let wasm_hash = verifications
            .first()
            .map(|v| v.result.onchain_hash.clone());
        let updated_at = latest_timestamp(&verifications);
        Self {
            schema_version: SCHEMA_VERSION,
            contract_id,
            wasm_hash,
            network,
            updated_at,
            verifications,
        }
    }
}

impl WasmLookupResponse {
    pub fn new(wasm_hash: String, network: String, verifications: Vec<VerificationEntry>) -> Self {
        let updated_at = latest_timestamp(&verifications);
        Self {
            schema_version: SCHEMA_VERSION,
            wasm_hash,
            network,
            updated_at,
            verifications,
        }
    }
}
