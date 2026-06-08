use super::{
    ContractLookupResponse, VerificationEntry, VerificationStore, WasmLookupResponse,
};
use crate::routes::{VerificationStatus, VerifierInfo, VerifyResponse};
use rusqlite::{params, Connection};
use std::path::Path;
use std::sync::{Mutex, MutexGuard};

pub struct SqliteVerificationStore {
    conn: Mutex<Connection>,
    verifier: VerifierInfo,
}

impl SqliteVerificationStore {
    pub fn open(db_path: &str, verifier: VerifierInfo) -> Result<Self, String> {
        if let Some(parent) = Path::new(db_path).parent() {
            if !parent.as_os_str().is_empty() {
                std::fs::create_dir_all(parent)
                    .map_err(|e| format!("failed to create database directory: {e}"))?;
            }
        }

        let conn = Connection::open(db_path).map_err(|e| format!("failed to open database: {e}"))?;
        init_schema(&conn)?;
        Ok(Self {
            conn: Mutex::new(conn),
            verifier,
        })
    }

    fn lock(&self) -> Result<MutexGuard<'_, Connection>, String> {
        self.conn
            .lock()
            .map_err(|_| "database lock poisoned".to_string())
    }

    fn entry_from_row(
        &self,
        verified_at: String,
        response_json: String,
    ) -> Result<VerificationEntry, String> {
        let result = enrich_stored(
            serde_json::from_str(&response_json)
                .map_err(|e| format!("corrupt stored row: {e}"))?,
            &verified_at,
            &self.verifier,
        );
        Ok(VerificationEntry {
            metadata_source: "on_chain",
            result,
        })
    }
}

fn enrich_stored(mut resp: VerifyResponse, verified_at: &str, verifier: &VerifierInfo) -> VerifyResponse {
    let img = resp.bldimg.clone().or(resp.build_image.clone());
    resp.bldimg = img.clone();
    resp.build_image = img;
    if resp.processed_at.is_none() {
        resp.processed_at = Some(verified_at.to_string());
    }
    if resp.verifier.id.is_empty() {
        resp.verifier = verifier.clone();
    }
    resp.status = VerificationStatus::from_response(&resp);
    resp
}

fn init_schema(conn: &Connection) -> Result<(), String> {
    conn.execute_batch(
        "CREATE TABLE IF NOT EXISTS verifications (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            contract_id TEXT NOT NULL,
            network TEXT NOT NULL,
            onchain_hash TEXT NOT NULL,
            verified_at TEXT NOT NULL,
            response_json TEXT NOT NULL,
            UNIQUE(contract_id, network, onchain_hash)
        );
        CREATE INDEX IF NOT EXISTS idx_verifications_wasm
            ON verifications(onchain_hash, network);",
    )
    .map_err(|e| format!("failed to init schema: {e}"))
}

impl VerificationStore for SqliteVerificationStore {
    fn get_cached(
        &self,
        contract_id: &str,
        network: &str,
        onchain_hash: &str,
    ) -> Result<Option<VerifyResponse>, String> {
        let conn = self.lock()?;
        let mut stmt = conn
            .prepare(
                "SELECT verified_at, response_json FROM verifications
                 WHERE contract_id = ?1 AND network = ?2 AND onchain_hash = ?3",
            )
            .map_err(|e| e.to_string())?;

        let mut rows = stmt
            .query(params![contract_id, network, onchain_hash])
            .map_err(|e| e.to_string())?;

        if let Some(row) = rows.next().map_err(|e| e.to_string())? {
            let verified_at: String = row.get(0).map_err(|e| e.to_string())?;
            let json: String = row.get(1).map_err(|e| e.to_string())?;
            let resp: VerifyResponse =
                serde_json::from_str(&json).map_err(|e| format!("corrupt stored row: {e}"))?;
            return Ok(Some(enrich_stored(resp, &verified_at, &self.verifier)));
        }
        Ok(None)
    }

    fn save(
        &self,
        contract_id: &str,
        network: &str,
        onchain_hash: &str,
        response: &VerifyResponse,
    ) -> Result<(), String> {
        if onchain_hash.is_empty() {
            return Ok(());
        }

        let verified_at = response
            .processed_at
            .clone()
            .unwrap_or_else(|| chrono::Utc::now().to_rfc3339());
        let response_json =
            serde_json::to_string(response).map_err(|e| format!("failed to encode row: {e}"))?;

        let conn = self.lock()?;
        conn.execute(
            "INSERT INTO verifications (contract_id, network, onchain_hash, verified_at, response_json)
             VALUES (?1, ?2, ?3, ?4, ?5)
             ON CONFLICT(contract_id, network, onchain_hash) DO UPDATE SET
                verified_at = excluded.verified_at,
                response_json = excluded.response_json",
            params![contract_id, network, onchain_hash, verified_at, response_json],
        )
        .map_err(|e| format!("failed to save verification: {e}"))?;
        Ok(())
    }

    fn by_contract_id(
        &self,
        contract_id: &str,
        network: &str,
    ) -> Result<ContractLookupResponse, String> {
        let conn = self.lock()?;
        let mut stmt = conn
            .prepare(
                "SELECT verified_at, response_json FROM verifications
                 WHERE contract_id = ?1 AND network = ?2
                 ORDER BY verified_at DESC",
            )
            .map_err(|e| e.to_string())?;

        let rows = stmt
            .query_map(params![contract_id, network], |row| {
                Ok((row.get::<_, String>(0)?, row.get::<_, String>(1)?))
            })
            .map_err(|e| e.to_string())?;

        let mut verifications = Vec::new();
        for row in rows {
            let (verified_at, response_json) = row.map_err(|e| e.to_string())?;
            verifications.push(self.entry_from_row(verified_at, response_json)?);
        }

        Ok(ContractLookupResponse::new(
            contract_id.to_string(),
            network.to_string(),
            verifications,
        ))
    }

    fn by_wasm_hash(&self, wasm_hash: &str, network: &str) -> Result<WasmLookupResponse, String> {
        let conn = self.lock()?;
        let mut stmt = conn
            .prepare(
                "SELECT verified_at, response_json FROM verifications
                 WHERE onchain_hash = ?1 AND network = ?2
                 ORDER BY verified_at DESC",
            )
            .map_err(|e| e.to_string())?;

        let rows = stmt
            .query_map(params![wasm_hash, network], |row| {
                Ok((row.get::<_, String>(0)?, row.get::<_, String>(1)?))
            })
            .map_err(|e| e.to_string())?;

        let mut verifications = Vec::new();
        for row in rows {
            let (verified_at, response_json) = row.map_err(|e| e.to_string())?;
            verifications.push(self.entry_from_row(verified_at, response_json)?);
        }

        Ok(WasmLookupResponse::new(
            wasm_hash.to_string(),
            network.to_string(),
            verifications,
        ))
    }

    fn ping(&self) -> Result<(), String> {
        let conn = self.lock()?;
        conn.query_row("SELECT 1", [], |_| Ok(()))
            .map_err(|e| e.to_string())
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::routes::VerificationStatus;

    fn temp_db() -> (String, SqliteVerificationStore) {
        let path = std::env::temp_dir().join(format!("csv-store-{}.db", uuid::Uuid::new_v4()));
        let path = path.to_string_lossy().into_owned();
        let store = SqliteVerificationStore::open(
            &path,
            VerifierInfo {
                id: "csv-stellar-test".into(),
                name: "CSV Stellar Test".into(),
                url: "https://example.com".into(),
            },
        )
        .unwrap();
        (path, store)
    }

    fn sample_response(hash: &str) -> VerifyResponse {
        let mut resp = VerifyResponse {
            verified: true,
            verification_level: 2,
            status: VerificationStatus::Verified,
            source_repo: Some("https://github.com/example/repo".into()),
            source_rev: Some("abc123".into()),
            bldimg: Some("docker.io/stellar/stellar-cli:latest".into()),
            build_image: Some("docker.io/stellar/stellar-cli:latest".into()),
            bldopt: vec!["--manifest-path=contracts/foo/Cargo.toml".into()],
            onchain_hash: hash.into(),
            rebuilt_hash: Some(hash.into()),
            wasm_hash_match: true,
            processed_at: Some("2026-06-08T12:00:00Z".into()),
            verifier: VerifierInfo {
                id: "csv-stellar-test".into(),
                name: "CSV Stellar Test".into(),
                url: "https://example.com".into(),
            },
            error: None,
        };
        resp.status = VerificationStatus::from_response(&resp);
        resp
    }

    #[test]
    fn save_and_lookup_by_contract_and_wasm() {
        let (path, store) = temp_db();
        let hash = "aa".repeat(32);
        let resp = sample_response(&hash);
        store
            .save(
                "CCL7QSQ3FBG5FIUHNHZB37ZHDRTV4XN6AS5LQMSKZHA24D2JZQOZ4CHP",
                "testnet",
                &hash,
                &resp,
            )
            .unwrap();

        let cached = store
            .get_cached(
                "CCL7QSQ3FBG5FIUHNHZB37ZHDRTV4XN6AS5LQMSKZHA24D2JZQOZ4CHP",
                "testnet",
                &hash,
            )
            .unwrap()
            .unwrap();
        assert!(cached.verified);
        assert_eq!(cached.status, VerificationStatus::Verified);
        assert_eq!(cached.bldopt.len(), 1);

        let by_contract = store
            .by_contract_id(
                "CCL7QSQ3FBG5FIUHNHZB37ZHDRTV4XN6AS5LQMSKZHA24D2JZQOZ4CHP",
                "testnet",
            )
            .unwrap();
        assert_eq!(by_contract.schema_version, "1.0");
        assert_eq!(by_contract.verifications.len(), 1);
        assert_eq!(by_contract.verifications[0].result.status, VerificationStatus::Verified);

        let by_wasm = store.by_wasm_hash(&hash, "testnet").unwrap();
        assert_eq!(by_wasm.schema_version, "1.0");
        assert_eq!(by_wasm.verifications.len(), 1);
        assert_eq!(by_wasm.updated_at, Some("2026-06-08T12:00:00Z".into()));

        let _ = std::fs::remove_file(path);
    }

    #[test]
    fn legacy_row_enriched_on_read() {
        let (path, store) = temp_db();
        let hash = "bb".repeat(32);
        let legacy_json = serde_json::json!({
            "verified": true,
            "verification_level": 2,
            "source_repo": "https://github.com/example/repo",
            "source_rev": "abc123",
            "build_image": null,
            "onchain_hash": hash,
            "rebuilt_hash": hash,
            "wasm_hash_match": true,
            "error": null
        });
        let conn = store.lock().unwrap();
        conn.execute(
            "INSERT INTO verifications (contract_id, network, onchain_hash, verified_at, response_json)
             VALUES (?1, ?2, ?3, ?4, ?5)",
            params![
                "CCL7QSQ3FBG5FIUHNHZB37ZHDRTV4XN6AS5LQMSKZHA24D2JZQOZ4CHP",
                "testnet",
                hash,
                "2026-06-01T10:00:00Z",
                legacy_json.to_string()
            ],
        )
        .unwrap();
        drop(conn);

        let by_contract = store
            .by_contract_id(
                "CCL7QSQ3FBG5FIUHNHZB37ZHDRTV4XN6AS5LQMSKZHA24D2JZQOZ4CHP",
                "testnet",
            )
            .unwrap();
        let entry = &by_contract.verifications[0].result;
        assert_eq!(entry.status, VerificationStatus::Verified);
        assert_eq!(entry.processed_at.as_deref(), Some("2026-06-01T10:00:00Z"));
        assert_eq!(entry.verifier.id, "csv-stellar-test");

        let _ = std::fs::remove_file(path);
    }
}
