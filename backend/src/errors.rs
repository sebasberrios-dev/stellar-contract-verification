use axum::{
    http::StatusCode,
    response::{IntoResponse, Response},
    Json,
};
use serde_json::json;

#[derive(Debug)]
pub enum AppError {
    ContractNotFound,
    NoMetadata,
    BuildFailed(String),
    InternalError(String),
}

impl IntoResponse for AppError {
    fn into_response(self) -> Response {
        match self {
            AppError::ContractNotFound => (
                StatusCode::NOT_FOUND,
                Json(json!({
                    "error": "Contract not found",
                    "verified": false,
                    "verification_level": 0
                })),
            )
                .into_response(),

            AppError::NoMetadata => (
                StatusCode::OK,
                Json(json!({
                    "error": "No SEP-58 metadata",
                    "verified": false,
                    "verification_level": 0
                })),
            )
                .into_response(),

            AppError::BuildFailed(msg) => (
                StatusCode::OK,
                Json(json!({
                    "error": msg,
                    "verified": false,
                    "verification_level": 2
                })),
            )
                .into_response(),

            AppError::InternalError(msg) => (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(json!({
                    "error": msg,
                    "verified": false,
                    "verification_level": 0
                })),
            )
                .into_response(),
        }
    }
}
