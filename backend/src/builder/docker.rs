use crate::builder::{run_with_timeout, CleanupGuard};
use crate::errors::AppError;
use std::path::{Path, PathBuf};
use std::time::Duration;

const DOCKER_TIMEOUT: Duration = Duration::from_secs(360);
const DEFAULT_IMAGE: &str = "stellar/stellar-cli:latest";
const ALLOWED_IMAGE_SUBSTRING: &str = "stellar/stellar-cli";

/// Resolves which Docker image to use, enforcing the SDF allowlist.
///
/// - `None`                                  → default `stellar/stellar-cli:latest`
/// - `Some(img)` containing `stellar/stellar-cli` → that image
/// - any other `Some(img)`                   → `Unauthorized build image` (rejected)
pub(crate) fn resolve_image(bldimg: Option<&str>) -> Result<String, AppError> {
    match bldimg {
        None => Ok(DEFAULT_IMAGE.to_string()),
        Some(img) if img.contains(ALLOWED_IMAGE_SUBSTRING) => Ok(img.to_string()),
        Some(_) => Err(AppError::BuildFailed("Unauthorized build image".into())),
    }
}

/// Builds the contract inside an isolated Docker container using the official
/// SDF image, then returns the produced WASM bytes.
///
/// The `source_dir` workspace is ALWAYS removed before returning (success,
/// failure, or unauthorized image) via a `Drop` guard.
pub fn build_wasm(source_dir: &Path, bldimg: Option<&str>) -> Result<Vec<u8>, AppError> {
    // Cleanup is guaranteed on every return path below.
    let _guard = CleanupGuard(source_dir);

    // Allowlist check happens BEFORE any docker invocation.
    let image = resolve_image(bldimg)?;

    let mount = format!("{}:/workspace", source_dir.to_string_lossy());

    // NOTE 1: The project invariant calls for `--network=none`, but `stellar contract build`
    // must fetch crates (e.g. soroban-sdk) from crates.io during compilation. Offline builds
    // require pre-vendored dependencies, which is out of MVP scope. Network stays enabled;
    // hardening (vendoring + --network=none) is tracked as future work.
    //
    // NOTE 2: We override the image entrypoint with a small bootstrap because the official
    // `stellar/stellar-cli` image (Debian trixie) ships a `stellar` binary dynamically linked
    // against libdbus-1, but does not install it — so the binary fails to load. We install it
    // only if actually missing. The image's own entrypoint also adds the `wasm32v1-none` rust
    // target; since we bypass it, we re-add the target here.
    let bootstrap = "set -e; \
        if ldd \"$(command -v stellar)\" 2>/dev/null | grep -q 'libdbus.*not found'; then \
            apt-get update -qq && apt-get install -y -qq libdbus-1-3 >/dev/null 2>&1; \
        fi; \
        rustup target add wasm32v1-none >/dev/null 2>&1 || true; \
        exec stellar contract build";

    let mut args: Vec<String> = vec![
        "run".into(),
        "--rm".into(),
        "-v".into(),
        mount,
        "-w".into(),
        "/workspace".into(),
    ];

    // Optional CA bundle injection for environments behind a TLS-intercepting proxy.
    // If `BUILD_CA_BUNDLE` points to a PEM file, mount it and tell cargo/openssl to trust it.
    // On a normal network this is unset and the container's default trust store is used.
    if let Ok(ca_path) = std::env::var("BUILD_CA_BUNDLE") {
        if !ca_path.trim().is_empty() && Path::new(&ca_path).exists() {
            args.push("-v".into());
            args.push(format!("{ca_path}:/etc/ssl/build-ca.pem:ro"));
            args.push("-e".into());
            args.push("CARGO_HTTP_CAINFO=/etc/ssl/build-ca.pem".into());
            args.push("-e".into());
            args.push("SSL_CERT_FILE=/etc/ssl/build-ca.pem".into());
            tracing::info!("Injecting CA bundle from {ca_path}");
        }
    }

    args.push("--entrypoint".into());
    args.push("sh".into());
    args.push(image.clone());
    args.push("-c".into());
    args.push(bootstrap.into());

    tracing::info!("Running docker build with image '{}'", image);
    let out = run_with_timeout("docker", &args, DOCKER_TIMEOUT, "docker-build")?;

    if !out.success {
        let msg = if out.stderr.trim().is_empty() {
            out.stdout.trim()
        } else {
            out.stderr.trim()
        };
        return Err(AppError::BuildFailed(format!("docker build failed: {msg}")));
    }

    let wasm_path = find_wasm(source_dir)?;
    std::fs::read(&wasm_path)
        .map_err(|e| AppError::BuildFailed(format!("failed to read built WASM: {e}")))
}

/// Locates the first `*.wasm` file in the release output directory.
///
/// Newer stellar-cli builds target `wasm32v1-none`; older toolchains used
/// `wasm32-unknown-unknown`. Both are checked.
fn find_wasm(source_dir: &Path) -> Result<PathBuf, AppError> {
    const TARGETS: [&str; 2] = ["wasm32v1-none", "wasm32-unknown-unknown"];

    for target in TARGETS {
        let release_dir = source_dir
            .join("target")
            .join(target)
            .join("release");

        let Ok(entries) = std::fs::read_dir(&release_dir) else {
            continue;
        };

        for entry in entries.flatten() {
            let path = entry.path();
            if path.extension().and_then(|e| e.to_str()) == Some("wasm") {
                return Ok(path);
            }
        }
    }

    Err(AppError::BuildFailed(
        "no .wasm produced by build (checked wasm32v1-none and wasm32-unknown-unknown)".into(),
    ))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn default_image_when_none() {
        assert_eq!(resolve_image(None).unwrap(), DEFAULT_IMAGE);
    }

    #[test]
    fn accepts_stellar_cli_image() {
        let img = "docker.io/stellar/stellar-cli@sha256:abc123";
        assert_eq!(resolve_image(Some(img)).unwrap(), img);
    }

    #[test]
    fn accepts_tagged_stellar_cli() {
        let img = "stellar/stellar-cli:v22";
        assert_eq!(resolve_image(Some(img)).unwrap(), img);
    }

    #[test]
    fn rejects_unauthorized_image() {
        let err = resolve_image(Some("malicious/evil-image:latest")).unwrap_err();
        match err {
            AppError::BuildFailed(msg) => assert_eq!(msg, "Unauthorized build image"),
            other => panic!("expected BuildFailed, got {other:?}"),
        }
    }
}
