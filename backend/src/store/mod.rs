mod sqlite;

pub use sqlite::SqliteVerificationStore;

use crate::routes::VerifyResponse;
use serde::Serialize;

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
    pub verifier_id: String,
    pub status: VerificationStatus,
    pub verified_at: String,
    pub metadata_source: &'static str,
    #[serde(flatten)]
    pub result: VerifyResponse,
}

#[derive(Debug, Clone, Copy, Serialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum VerificationStatus {
    Verified,
    Mismatch,
    Failed,
}

impl VerificationStatus {
    pub fn from_response(resp: &VerifyResponse) -> Self {
        if resp.verified && resp.wasm_hash_match {
            Self::Verified
        } else if resp.rebuilt_hash.is_some() && !resp.wasm_hash_match {
            Self::Mismatch
        } else {
            Self::Failed
        }
    }
}

#[derive(Debug, Clone, Serialize)]
pub struct ContractLookupResponse {
    pub contract_id: String,
    pub network: String,
    pub onchain_hash: Option<String>,
    pub verifications: Vec<VerificationEntry>,
}

#[derive(Debug, Clone, Serialize)]
pub struct WasmLookupResponse {
    pub wasm_hash: String,
    pub network: String,
    pub verifications: Vec<VerificationEntry>,
}
