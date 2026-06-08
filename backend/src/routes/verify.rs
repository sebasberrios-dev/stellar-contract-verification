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
    pub store: Arc<dyn VerificationStore>,
}

#[derive(Deserialize)]
pub struct VerifyRequest {
    pub contract_id: String,
}

#[derive(Serialize, Deserialize, Clone)]
pub struct VerifyResponse {
    pub verified: bool,
    pub verification_level: u8,
    pub source_repo: Option<String>,
    pub source_rev: Option<String>,
    pub build_image: Option<String>,
    pub onchain_hash: String,
    pub rebuilt_hash: Option<String>,
    pub wasm_hash_match: bool,
    pub error: Option<String>,
}

impl VerifyResponse {
    fn failed(level: u8, onchain_hash: String, error: impl Into<String>) -> Self {
        Self {
            verified: false,
            verification_level: level,
            source_repo: None,
            source_rev: None,
            build_image: None,
            onchain_hash,
            rebuilt_hash: None,
            wasm_hash_match: false,
            error: Some(error.into()),
        }
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
            return finish(&state, &contract_id, VerifyResponse::failed(0, String::new(), err_message(&e)));
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
            return ok_json(cached);
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
            VerifyResponse {
                verified: false,
                verification_level: level,
                source_repo: meta.source_repo,
                source_rev: meta.source_rev,
                build_image: meta.bldimg,
                onchain_hash,
                rebuilt_hash: None,
                wasm_hash_match: false,
                error: Some("Metadata present but missing source_repo or source_rev".to_string()),
            },
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
                VerifyResponse {
                    verified: false,
                    verification_level: 2,
                    source_repo: meta.source_repo,
                    source_rev: meta.source_rev,
                    build_image: meta.bldimg,
                    onchain_hash,
                    rebuilt_hash: None,
                    wasm_hash_match: false,
                    error: Some(err_message(&e)),
                },
            );
        }
        Err(join_err) => {
            return finish(
                &state,
                &contract_id,
                VerifyResponse {
                    verified: false,
                    verification_level: 2,
                    source_repo: meta.source_repo,
                    source_rev: meta.source_rev,
                    build_image: meta.bldimg,
                    onchain_hash,
                    rebuilt_hash: None,
                    wasm_hash_match: false,
                    error: Some(format!("Build task failed: {join_err}")),
                },
            );
        }
    };

    let rebuilt_hash = compute_sha256(&rebuilt_wasm);
    let wasm_hash_match = onchain_hash == rebuilt_hash;

    finish(
        &state,
        &contract_id,
        VerifyResponse {
            verified: wasm_hash_match,
            verification_level: 2,
            source_repo: meta.source_repo,
            source_rev: meta.source_rev,
            build_image: meta.bldimg,
            onchain_hash,
            rebuilt_hash: Some(rebuilt_hash),
            wasm_hash_match,
            error: None,
        },
    )
}

fn finish(state: &AppState, contract_id: &str, resp: VerifyResponse) -> Response {
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
