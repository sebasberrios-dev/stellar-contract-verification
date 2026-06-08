use axum::{
    http::Method,
    response::Json,
    routing::{get, post},
    Router,
};
use serde_json::json;
use std::net::SocketAddr;
use std::sync::Arc;
use tower_http::cors::{Any, CorsLayer};
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

use stellar_contract_verification::routes::{
    contract_verifications_handler, verify_handler, wasm_verifications_handler, AppState,
};
use stellar_contract_verification::store::{SqliteVerificationStore, VerificationStore};

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

    let network =
        std::env::var("DEFAULT_NETWORK").unwrap_or_else(|_| "testnet".to_string());

    let verifier_id =
        std::env::var("VERIFIER_ID").unwrap_or_else(|_| "csv-stellar".to_string());

    let verifier_name = std::env::var("VERIFIER_NAME")
        .unwrap_or_else(|_| "CSV Stellar".to_string());

    let verifier_url = std::env::var("VERIFIER_URL").unwrap_or_else(|_| {
        "https://stellar-contract-verification.vercel.app".to_string()
    });

    let verifier_info = stellar_contract_verification::routes::VerifierInfo {
        id: verifier_id.clone(),
        name: verifier_name.clone(),
        url: verifier_url.clone(),
    };

    let database_url = std::env::var("DATABASE_URL")
        .unwrap_or_else(|_| "/var/lib/csv/verifications.db".to_string());

    let store: Arc<dyn VerificationStore> = Arc::new(
        SqliteVerificationStore::open(&database_url, verifier_info).unwrap_or_else(|e| {
            tracing::error!("Failed to open verification store at {database_url}: {e}");
            std::process::exit(1);
        }),
    );

    let state = AppState {
        rpc_url,
        network,
        verifier_id: verifier_id.clone(),
        verifier_name,
        verifier_url,
        store: store.clone(),
    };

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
        .route("/health", get({
            let store = store.clone();
            let verifier_id = verifier_id.clone();
            move || health_handler(store.clone(), verifier_id.clone())
        }))
        .route("/verify", post(verify_handler))
        .route(
            "/v1/contracts/:contract_id/verifications",
            get(contract_verifications_handler),
        )
        .route(
            "/v1/wasm/:wasm_hash/verifications",
            get(wasm_verifications_handler),
        )
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

async fn health_handler(
    store: Arc<dyn VerificationStore>,
    verifier_id: String,
) -> Json<serde_json::Value> {
    let db_ok = store.ping().is_ok();
    Json(json!({
        "status": if db_ok { "ok" } else { "degraded" },
        "build": env!("CARGO_PKG_VERSION"),
        "verifier_id": verifier_id,
        "network": std::env::var("DEFAULT_NETWORK").unwrap_or_else(|_| "testnet".into()),
        "database_ok": db_ok,
        "work_dir": std::env::var("VERIFY_WORK_DIR").unwrap_or_else(|_| std::env::temp_dir().join("soroban-verify").to_string_lossy().into_owned()),
    }))
}
