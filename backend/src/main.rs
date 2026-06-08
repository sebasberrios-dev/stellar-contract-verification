use axum::{
    http::Method,
    response::Json,
    routing::{get, post},
    Router,
};
use serde_json::json;
use std::net::SocketAddr;
use tower_http::cors::{Any, CorsLayer};
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

use stellar_contract_verification::routes::{verify_handler, AppState};

#[tokio::main]
async fn main() {
    dotenvy::dotenv().ok();

    tracing_subscriber::registry()
        .with(tracing_subscriber::EnvFilter::try_from_default_env().unwrap_or_else(|_| {
            "stellar_contract_verification=debug,tower_http=debug,axum=trace".into()
        }))
        .with(tracing_subscriber::fmt::layer())
        .init();

    let port: u16 = std::env::var("PORT")
        .ok()
        .and_then(|p| p.parse().ok())
        .unwrap_or(8088);

    let rpc_url = std::env::var("SOROBAN_RPC_URL")
        .unwrap_or_else(|_| "https://soroban-testnet.stellar.org".to_string());

    let state = AppState { rpc_url };

    // ALLOWED_ORIGIN: comma-separated list or "*" for any.
    // Defaults to "*" so the hosted frontend can reach the backend without extra config.
    let allowed_origin = std::env::var("ALLOWED_ORIGIN").unwrap_or_else(|_| "*".to_string());

    let cors = if allowed_origin == "*" {
        CorsLayer::new()
            .allow_origin(Any)
            .allow_methods([Method::GET, Method::POST, Method::OPTIONS])
            .allow_headers(Any)
    } else {
        CorsLayer::new()
            .allow_origin(
                allowed_origin
                    .parse::<axum::http::HeaderValue>()
                    .expect("Invalid ALLOWED_ORIGIN value"),
            )
            .allow_methods([Method::GET, Method::POST, Method::OPTIONS])
            .allow_headers(Any)
    };

    let app = Router::new()
        .route("/health", get(health_handler))
        .route("/verify", post(verify_handler))
        .with_state(state)
        .layer(cors);

    let addr = SocketAddr::from(([0, 0, 0, 0], port));
    let listener = match tokio::net::TcpListener::bind(addr).await {
        Ok(l) => l,
        Err(e) => {
            tracing::error!("Failed to bind {addr}: {e}");
            std::process::exit(1);
        }
    };

    tracing::info!("Server listening on {addr}");
    axum::serve(listener, app).await.unwrap();
}

async fn health_handler() -> Json<serde_json::Value> {
    Json(json!({
        "status": "ok",
        "build": env!("CARGO_PKG_VERSION"),
        "work_dir": std::env::var("VERIFY_WORK_DIR").unwrap_or_else(|_| std::env::temp_dir().join("soroban-verify").to_string_lossy().into_owned()),
    }))
}
