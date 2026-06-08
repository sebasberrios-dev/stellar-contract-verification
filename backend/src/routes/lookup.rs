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
        return bad_request(msg, "invalid_contract_id");
    }

    let network = match parse_network(query.network.as_deref()) {
        Ok(n) => n,
        Err(msg) => return bad_request(msg, "unsupported_network"),
    };

    match state.store.by_contract_id(&contract_id, network) {
        Ok(resp) => (StatusCode::OK, Json(resp)).into_response(),
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(serde_json::json!({ "error": e, "code": "internal_error" })),
        )
            .into_response(),
    }
}

pub async fn wasm_verifications_handler(
    State(state): State<AppState>,
    Path(wasm_hash): Path<String>,
    Query(query): Query<NetworkQuery>,
) -> Response {
    wasm_lookup(state, wasm_hash, query).await
}

/// SEP registry alias: `GET /wasms/:wasm_hash.json`
pub async fn wasm_sep_handler(
    State(state): State<AppState>,
    Path(wasm_hash): Path<String>,
    Query(query): Query<NetworkQuery>,
) -> Response {
    wasm_lookup(state, wasm_hash, query).await
}

async fn wasm_lookup(
    state: AppState,
    wasm_hash: Path<String>,
    query: NetworkQuery,
) -> Response {
    let wasm_hash = normalize_wasm_hash(&wasm_hash);

    if let Err(msg) = validate_wasm_hash(&wasm_hash) {
        return bad_request(msg, "invalid_wasm_hash");
    }

    let network = match parse_network(query.network.as_deref()) {
        Ok(n) => n,
        Err(msg) => return bad_request(msg, "unsupported_network"),
    };

    match state.store.by_wasm_hash(&wasm_hash, network) {
        Ok(resp) => (StatusCode::OK, Json(resp)).into_response(),
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(serde_json::json!({ "error": e, "code": "internal_error" })),
        )
            .into_response(),
    }
}

fn normalize_wasm_hash(raw: &str) -> String {
    raw.trim()
        .strip_suffix(".json")
        .unwrap_or(raw.trim())
        .to_lowercase()
}

fn bad_request(error: impl Into<String>, code: &'static str) -> Response {
    (
        StatusCode::BAD_REQUEST,
        Json(serde_json::json!({
            "error": error.into(),
            "code": code,
        })),
    )
        .into_response()
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

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn normalize_strips_json_suffix() {
        assert_eq!(
            normalize_wasm_hash("AAbb.json"),
            "aabb"
        );
    }

    #[test]
    fn validate_wasm_hash_rejects_short_hash() {
        assert!(validate_wasm_hash("abc").is_err());
    }
}
