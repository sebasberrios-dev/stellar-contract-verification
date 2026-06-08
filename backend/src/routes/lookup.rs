use axum::{
    extract::{Path, Query, State},
    http::StatusCode,
    response::{IntoResponse, Response},
    Json,
};
use serde::Deserialize;

use crate::routes::{validate_contract_id, AppState};

#[derive(Deserialize)]
pub struct NetworkQuery {
    pub network: Option<String>,
}

pub async fn contract_verifications_handler(
    State(state): State<AppState>,
    Path(contract_id): Path<String>,
    Query(query): Query<NetworkQuery>,
) -> Response {
    let contract_id = contract_id.trim().to_string();

    if let Err(msg) = validate_contract_id(&contract_id) {
        return (
            StatusCode::BAD_REQUEST,
            Json(serde_json::json!({ "error": msg })),
        )
            .into_response();
    }

    let network = match parse_network(query.network.as_deref()) {
        Ok(n) => n,
        Err(msg) => {
            return (
                StatusCode::BAD_REQUEST,
                Json(serde_json::json!({ "error": msg })),
            )
                .into_response();
        }
    };

    match state.store.by_contract_id(&contract_id, network) {
        Ok(resp) => (StatusCode::OK, Json(resp)).into_response(),
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(serde_json::json!({ "error": e })),
        )
            .into_response(),
    }
}

pub async fn wasm_verifications_handler(
    State(state): State<AppState>,
    Path(wasm_hash): Path<String>,
    Query(query): Query<NetworkQuery>,
) -> Response {
    let wasm_hash = wasm_hash.trim().to_lowercase();

    if let Err(msg) = validate_wasm_hash(&wasm_hash) {
        return (
            StatusCode::BAD_REQUEST,
            Json(serde_json::json!({ "error": msg })),
        )
            .into_response();
    }

    let network = match parse_network(query.network.as_deref()) {
        Ok(n) => n,
        Err(msg) => {
            return (
                StatusCode::BAD_REQUEST,
                Json(serde_json::json!({ "error": msg })),
            )
                .into_response();
        }
    };

    match state.store.by_wasm_hash(&wasm_hash, network) {
        Ok(resp) => (StatusCode::OK, Json(resp)).into_response(),
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(serde_json::json!({ "error": e })),
        )
            .into_response(),
    }
}

fn parse_network(raw: Option<&str>) -> Result<&'static str, String> {
    match raw.unwrap_or("testnet").trim() {
        "testnet" => Ok("testnet"),
        other => Err(format!("unsupported network: {other} (only testnet is enabled)")),
    }
}

fn validate_wasm_hash(hash: &str) -> Result<(), String> {
    if hash.len() != 64 {
        return Err("wasm_hash must be 64 hex characters".into());
    }
    if !hash.chars().all(|c| c.is_ascii_hexdigit()) {
        return Err("wasm_hash must be hexadecimal".into());
    }
    Ok(())
}
