use crate::builder::{build_wasm, clone_and_checkout, temp_dir};
use crate::errors::AppError;
use crate::metadata::{extract_sep58, get_verification_level, Sep58Metadata};
use crate::rpc::{compute_sha256, get_contract_wasm};
use crate::store::VerificationStore;
use std::sync::Arc;

use axum::{
    extract::State,
    http::StatusCode,
    response::{IntoResponse, Response},
    Json,
};
use serde::{Deserialize, Serialize};

#[derive(Clone)]
pub struct AppState {
    pub rpc_url: String,
    pub network: String,
    pub verifier_id: String,
    pub verifier_name: String,
    pub verifier_url: String,
    pub store: Arc<dyn VerificationStore>,
}

impl AppState {
    pub fn verifier_info(&self) -> VerifierInfo {
        VerifierInfo {
            id: self.verifier_id.clone(),
            name: self.verifier_name.clone(),
            url: self.verifier_url.clone(),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VerifierInfo {
    pub id: String,
    pub name: String,
    pub url: String,
}

impl Default for VerifierInfo {
    fn default() -> Self {
        Self {
            id: String::new(),
            name: String::new(),
            url: String::new(),
        }
    }
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq, Default)]
#[serde(rename_all = "snake_case")]
pub enum VerificationStatus {
    Verified,
    Mismatch,
    Failed,
    #[default]
    Unverified,
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

#[derive(Deserialize)]
pub struct VerifyRequest {
    pub contract_id: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct VerifyResponse {
    pub verified: bool,
    pub verification_level: u8,
    #[serde(default)]
    pub status: VerificationStatus,
    pub source_repo: Option<String>,
    pub source_rev: Option<String>,
    #[serde(default)]
    pub bldimg: Option<String>,
    pub build_image: Option<String>,
    #[serde(default)]
    pub bldopt: Vec<String>,
    pub onchain_hash: String,
    pub rebuilt_hash: Option<String>,
    pub wasm_hash_match: bool,
    #[serde(default)]
    pub processed_at: Option<String>,
    #[serde(default)]
    pub verifier: VerifierInfo,
    pub error: Option<String>,
}

impl VerifyResponse {
    pub fn enrich(mut self, verifier: &VerifierInfo) -> Self {
        let img = self.bldimg.clone().or(self.build_image.clone());
        self.bldimg = img.clone();
        self.build_image = img;
        if self.processed_at.is_none() {
            self.processed_at = Some(chrono::Utc::now().to_rfc3339());
        }
        if self.verifier.id.is_empty() {
            self.verifier = verifier.clone();
        }
        self.status = VerificationStatus::from_response(&self);
        self
    }

    fn from_meta(
        meta: &Sep58Metadata,
        level: u8,
        onchain_hash: String,
        rebuilt_hash: Option<String>,
        wasm_hash_match: bool,
        verified: bool,
        error: Option<String>,
    ) -> Self {
        let bldimg = meta.bldimg.clone();
        let mut resp = Self {
            verified,
            verification_level: level,
            status: VerificationStatus::Failed,
            source_repo: meta.source_repo.clone(),
            source_rev: meta.source_rev.clone(),
            bldimg: bldimg.clone(),
            build_image: bldimg,
            bldopt: meta.bldopt.clone(),
            onchain_hash,
            rebuilt_hash,
            wasm_hash_match,
            processed_at: None,
            verifier: VerifierInfo::default(),
            error,
        };
        resp.status = VerificationStatus::from_response(&resp);
        resp
    }

    fn failed(level: u8, onchain_hash: String, error: impl Into<String>) -> Self {
        let mut resp = Self {
            verified: false,
            verification_level: level,
            status: VerificationStatus::Failed,
            source_repo: None,
            source_rev: None,
            bldimg: None,
            build_image: None,
            bldopt: Vec::new(),
            onchain_hash,
            rebuilt_hash: None,
            wasm_hash_match: false,
            processed_at: None,
            verifier: VerifierInfo::default(),
            error: Some(error.into()),
        };
        resp.status = VerificationStatus::from_response(&resp);
        resp
    }
}

fn err_message(e: &AppError) -> String {
    match e {
        AppError::ContractNotFound => "Contract not found on network".to_string(),
        AppError::NoMetadata => "No SEP-58 metadata".to_string(),
        AppError::BuildFailed(msg) => msg.clone(),
        AppError::InternalError(msg) => msg.clone(),
    }
}

/// Validates a Soroban contract Strkey id: non-empty, starts with `C`, 50–60 chars.
pub fn validate_contract_id(id: &str) -> Result<(), String> {
    let id = id.trim();
    if id.is_empty() {
        return Err("contract_id is empty".to_string());
    }
    if !id.starts_with('C') {
        return Err("contract_id must start with 'C'".to_string());
    }
    if id.len() < 50 || id.len() > 60 {
        return Err("contract_id must be 50–60 characters".to_string());
    }
    Ok(())
}

pub async fn verify_handler(
    State(state): State<AppState>,
    Json(req): Json<VerifyRequest>,
) -> Response {
    let contract_id = req.contract_id.trim().to_string();

    if let Err(msg) = validate_contract_id(&contract_id) {
        return (
            StatusCode::BAD_REQUEST,
            Json(serde_json::json!({ "error": msg })),
        )
            .into_response();
    }

    let onchain_wasm = match get_contract_wasm(&state.rpc_url, &contract_id).await {
        Ok(w) => w,
        Err(e) => {
            return finish(
                &state,
                &contract_id,
                VerifyResponse::failed(0, String::new(), err_message(&e)),
            );
        }
    };
    let onchain_hash = compute_sha256(&onchain_wasm);

    // Policy A: return persisted result when on-chain bytes haven't changed.
    match state
        .store
        .get_cached(&contract_id, &state.network, &onchain_hash)
    {
        Ok(Some(cached)) => {
            tracing::info!("cache hit for {contract_id} ({})", &onchain_hash[..8]);
            return ok_json(cached.enrich(&state.verifier_info()));
        }
        Ok(None) => {}
        Err(e) => tracing::warn!("cache lookup failed: {e}"),
    }

    let meta: Sep58Metadata = match extract_sep58(&onchain_wasm) {
        Ok(m) => m,
        Err(AppError::NoMetadata) => {
            return finish(
                &state,
                &contract_id,
                VerifyResponse::failed(0, onchain_hash, "No SEP-58 metadata"),
            );
        }
        Err(e) => {
            return finish(
                &state,
                &contract_id,
                VerifyResponse::failed(0, onchain_hash, err_message(&e)),
            );
        }
    };

    let level = get_verification_level(&meta);

    if level < 2 {
        return finish(
            &state,
            &contract_id,
            VerifyResponse::from_meta(
                &meta,
                level,
                onchain_hash,
                None,
                false,
                false,
                Some("Metadata present but missing source_repo or source_rev".to_string()),
            ),
        );
    }

    let repo = meta.source_repo.clone().unwrap();
    let rev = meta.source_rev.clone().unwrap();
    let bldimg = meta.bldimg.clone();
    let bldopt = meta.bldopt.clone();
    let embed = meta.clone();

    let build_result = tokio::task::spawn_blocking(move || {
        let dest = temp_dir();
        clone_and_checkout(&repo, &rev, &dest)?;
        build_wasm(&dest, bldimg.as_deref(), &bldopt, &embed)
    })
    .await;

    let rebuilt_wasm = match build_result {
        Ok(Ok(wasm)) => wasm,
        Ok(Err(e)) => {
            return finish(
                &state,
                &contract_id,
                VerifyResponse::from_meta(
                    &meta,
                    2,
                    onchain_hash,
                    None,
                    false,
                    false,
                    Some(err_message(&e)),
                ),
            );
        }
        Err(join_err) => {
            return finish(
                &state,
                &contract_id,
                VerifyResponse::from_meta(
                    &meta,
                    2,
                    onchain_hash,
                    None,
                    false,
                    false,
                    Some(format!("Build task failed: {join_err}")),
                ),
            );
        }
    };

    let rebuilt_hash = compute_sha256(&rebuilt_wasm);
    let wasm_hash_match = onchain_hash == rebuilt_hash;

    finish(
        &state,
        &contract_id,
        VerifyResponse::from_meta(
            &meta,
            2,
            onchain_hash,
            Some(rebuilt_hash),
            wasm_hash_match,
            wasm_hash_match,
            None,
        ),
    )
}

fn finish(state: &AppState, contract_id: &str, resp: VerifyResponse) -> Response {
    let resp = resp.enrich(&state.verifier_info());
    if let Err(e) = state.store.save(
        contract_id,
        &state.network,
        &resp.onchain_hash,
        &resp,
    ) {
        tracing::warn!("failed to persist verification for {contract_id}: {e}");
    }
    ok_json(resp)
}

fn ok_json(resp: VerifyResponse) -> Response {
    (StatusCode::OK, Json(resp)).into_response()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn status_verified_when_hashes_match() {
        let resp = VerifyResponse {
            verified: true,
            verification_level: 2,
            status: VerificationStatus::Failed,
            source_repo: None,
            source_rev: None,
            bldimg: None,
            build_image: None,
            bldopt: vec!["--manifest-path=foo/Cargo.toml".into()],
            onchain_hash: "aa".repeat(32),
            rebuilt_hash: Some("aa".repeat(32)),
            wasm_hash_match: true,
            processed_at: None,
            verifier: VerifierInfo::default(),
            error: None,
        };
        assert_eq!(
            VerificationStatus::from_response(&resp),
            VerificationStatus::Verified
        );
    }

    #[test]
    fn enrich_sets_bldimg_and_build_image_alias() {
        let resp = VerifyResponse::from_meta(
            &Sep58Metadata {
                bldimg: Some("docker.io/stellar/stellar-cli:latest".into()),
                bldopt: vec!["--optimize".into()],
                ..Default::default()
            },
            2,
            "bb".repeat(32),
            None,
            false,
            false,
            None,
        )
        .enrich(&VerifierInfo {
            id: "csv-stellar".into(),
            name: "CSV Stellar".into(),
            url: "https://example.com".into(),
        });
        assert_eq!(resp.bldimg, resp.build_image);
        assert_eq!(resp.bldopt, vec!["--optimize"]);
        assert_eq!(resp.verifier.id, "csv-stellar");
        assert!(resp.processed_at.is_some());
    }
}
