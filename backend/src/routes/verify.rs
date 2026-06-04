use crate::builder::{build_wasm, clone_and_checkout, temp_dir};
use crate::errors::AppError;
use crate::metadata::{extract_sep58, get_verification_level, Sep58Metadata};
use crate::rpc::{compute_sha256, get_contract_wasm};

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
}

#[derive(Deserialize)]
pub struct VerifyRequest {
    pub contract_id: String,
}

#[derive(Serialize)]
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
    /// Failure result before any metadata is known (RPC errors, no metadata).
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

/// Maps an `AppError` to a user-facing message string.
fn err_message(e: &AppError) -> String {
    match e {
        AppError::ContractNotFound => "Contract not found on network".to_string(),
        AppError::NoMetadata => "No SEP-58 metadata".to_string(),
        AppError::BuildFailed(msg) => msg.clone(),
        AppError::InternalError(msg) => msg.clone(),
    }
}

/// Validates a Soroban contract Strkey id: non-empty, starts with `C`, 50–60 chars.
fn validate_contract_id(id: &str) -> Result<(), String> {
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

    // ── Step 1: validate contract_id → HTTP 400 on failure ──────────────────
    if let Err(msg) = validate_contract_id(&contract_id) {
        return (
            StatusCode::BAD_REQUEST,
            Json(serde_json::json!({ "error": msg })),
        )
            .into_response();
    }

    // ── Step 2: fetch on-chain WASM + hash ──────────────────────────────────
    let onchain_wasm = match get_contract_wasm(&state.rpc_url, &contract_id).await {
        Ok(w) => w,
        Err(e) => {
            return ok_json(VerifyResponse::failed(0, String::new(), err_message(&e)));
        }
    };
    let onchain_hash = compute_sha256(&onchain_wasm);

    // ── Step 3: extract SEP-58 metadata ─────────────────────────────────────
    let meta: Sep58Metadata = match extract_sep58(&onchain_wasm) {
        Ok(m) => m,
        Err(AppError::NoMetadata) => {
            return ok_json(VerifyResponse::failed(0, onchain_hash, "No SEP-58 metadata"));
        }
        Err(e) => {
            return ok_json(VerifyResponse::failed(0, onchain_hash, err_message(&e)));
        }
    };

    let level = get_verification_level(&meta);

    // ── Step 4: insufficient metadata to rebuild (need repo + rev) ──────────
    if level < 2 {
        return ok_json(VerifyResponse {
            verified: false,
            verification_level: level,
            source_repo: meta.source_repo,
            source_rev: meta.source_rev,
            build_image: meta.bldimg,
            onchain_hash,
            rebuilt_hash: None,
            wasm_hash_match: false,
            error: Some("Metadata present but missing source_repo or source_rev".to_string()),
        });
    }

    // Safe unwraps: level == 2 guarantees both are present.
    let repo = meta.source_repo.clone().unwrap();
    let rev = meta.source_rev.clone().unwrap();
    let bldimg = meta.bldimg.clone();
    let bldopt = meta.bldopt.clone();
    let embed = meta.clone();

    // ── Steps 5 + 6: clone + docker build (blocking → spawn_blocking) ───────
    let build_result = tokio::task::spawn_blocking(move || {
        let dest = temp_dir();
        clone_and_checkout(&repo, &rev, &dest)?;
        build_wasm(&dest, bldimg.as_deref(), &bldopt, &embed)
    })
    .await;

    let rebuilt_wasm = match build_result {
        Ok(Ok(wasm)) => wasm,
        Ok(Err(e)) => {
            return ok_json(VerifyResponse {
                verified: false,
                verification_level: 2,
                source_repo: meta.source_repo,
                source_rev: meta.source_rev,
                build_image: meta.bldimg,
                onchain_hash,
                rebuilt_hash: None,
                wasm_hash_match: false,
                error: Some(err_message(&e)),
            });
        }
        Err(join_err) => {
            return ok_json(VerifyResponse {
                verified: false,
                verification_level: 2,
                source_repo: meta.source_repo,
                source_rev: meta.source_rev,
                build_image: meta.bldimg,
                onchain_hash,
                rebuilt_hash: None,
                wasm_hash_match: false,
                error: Some(format!("Build task failed: {join_err}")),
            });
        }
    };

    // ── Step 7: compare hashes ──────────────────────────────────────────────
    let rebuilt_hash = compute_sha256(&rebuilt_wasm);
    let wasm_hash_match = onchain_hash == rebuilt_hash;

    // ── Step 8: full response ───────────────────────────────────────────────
    ok_json(VerifyResponse {
        verified: wasm_hash_match,
        verification_level: 2,
        source_repo: meta.source_repo,
        source_rev: meta.source_rev,
        build_image: meta.bldimg,
        onchain_hash,
        rebuilt_hash: Some(rebuilt_hash),
        wasm_hash_match,
        error: None,
    })
}

fn ok_json(resp: VerifyResponse) -> Response {
    (StatusCode::OK, Json(resp)).into_response()
}
