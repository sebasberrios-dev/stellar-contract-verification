use crate::builder::{run_with_timeout, CleanupGuard};
use crate::errors::AppError;
use crate::metadata::Sep58Metadata;
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
/// Validates a `bldopt` flag from on-chain metadata before passing it to the shell.
fn validate_bldopt(opt: &str) -> Result<(), AppError> {
    let opt = opt.trim();
    if opt.is_empty() || !opt.starts_with("--") {
        return Err(AppError::BuildFailed(format!("invalid bldopt: {opt:?}")));
    }
    let body = &opt[2..];
    if body.is_empty() || !body.chars().all(|c| c.is_ascii_alphanumeric() || c == '-' || c == '_' || c == '=' || c == '/' || c == '.') {
        return Err(AppError::BuildFailed(format!("invalid bldopt characters: {opt:?}")));
    }
    Ok(())
}

fn validate_meta_value(val: &str) -> Result<(), AppError> {
    if val.is_empty() || val.contains('"') || val.contains('\'') || val.contains('\n') {
        return Err(AppError::BuildFailed(format!("invalid meta value: {val:?}")));
    }
    Ok(())
}

fn format_build_command(bldopts: &[String], embed: &Sep58Metadata) -> Result<String, AppError> {
    let mut cmd = String::from("stellar contract build");
    for opt in bldopts {
        validate_bldopt(opt)?;
        cmd.push(' ');
        cmd.push_str(opt.trim());
    }
    if let Some(repo) = &embed.source_repo {
        validate_meta_value(repo)?;
        cmd.push_str(" --meta source_repo=");
        cmd.push_str(repo);
    }
    if let Some(rev) = &embed.source_rev {
        validate_meta_value(rev)?;
        cmd.push_str(" --meta source_rev=");
        cmd.push_str(rev);
    }
    if let Some(img) = &embed.bldimg {
        validate_meta_value(img)?;
        cmd.push_str(" --meta bldimg=");
        cmd.push_str(img);
    }
    for opt in &embed.bldopt {
        validate_meta_value(opt)?;
        cmd.push_str(" --meta bldopt=");
        cmd.push_str(opt);
    }
    Ok(cmd)
}

pub fn build_wasm(
    source_dir: &Path,
    bldimg: Option<&str>,
    bldopts: &[String],
    embed: &Sep58Metadata,
) -> Result<Vec<u8>, AppError> {
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
    let build_cmd = format_build_command(bldopts, embed)?;
    let ca_mounted = resolve_ca_bundle_path().is_some();

    // When a custom CA is mounted, merge it with the system store so rustup, cargo, and curl
    // all trust the corporate proxy on TLS-intercepted networks.
    let ca_setup = if ca_mounted {
        "if [ -f /etc/ssl/build-ca.pem ]; then \
            cat /etc/ssl/certs/ca-certificates.crt /etc/ssl/build-ca.pem > /tmp/build-ca-combined.pem; \
            export SSL_CERT_FILE=/tmp/build-ca-combined.pem; \
            export CARGO_HTTP_CAINFO=/tmp/build-ca-combined.pem; \
            export CURL_CA_BUNDLE=/tmp/build-ca-combined.pem; \
            export RUSTUP_USE_CURL=1; \
        fi; "
    } else {
        ""
    };

    let bootstrap = format!(
        "set -e; \
        {ca_setup}\
        if ldd \"$(command -v stellar)\" 2>/dev/null | grep -q 'libdbus.*not found'; then \
            apt-get update -qq && apt-get install -y -qq libdbus-1-3 >/dev/null 2>&1; \
        fi; \
        rustup target add wasm32v1-none >/dev/null 2>&1 || true; \
        exec {build_cmd}"
    );

    let mut args: Vec<String> = vec![
        "run".into(),
        "--rm".into(),
        "-v".into(),
        mount,
        "-w".into(),
        "/workspace".into(),
    ];

    // Optional CA bundle injection for environments behind a TLS-intercepting proxy.
    // Path is resolved relative to the backend crate root (where .env lives), not process cwd.
    if let Some(abs) = resolve_ca_bundle_path() {
        args.push("-v".into());
        args.push(format!("{abs}:/etc/ssl/build-ca.pem:ro"));
        tracing::info!("Injecting CA bundle from {abs}");
    } else if std::env::var("BUILD_CA_BUNDLE")
        .map(|v| !v.trim().is_empty())
        .unwrap_or(false)
    {
        tracing::warn!(
            "BUILD_CA_BUNDLE is set but could not be resolved — builds may fail behind a TLS proxy"
        );
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

/// Resolves `BUILD_CA_BUNDLE` to an absolute path suitable for a Docker volume mount.
/// Relative paths are resolved against the backend crate root (`CARGO_MANIFEST_DIR`),
/// not the process working directory, so `cargo run` works from any cwd.
fn resolve_ca_bundle_path() -> Option<String> {
    let raw = std::env::var("BUILD_CA_BUNDLE").ok()?;
    let raw = raw.trim();
    if raw.is_empty() {
        return None;
    }
    let path = Path::new(raw);
    let resolved = if path.is_absolute() {
        path.to_path_buf()
    } else {
        Path::new(env!("CARGO_MANIFEST_DIR")).join(path)
    };
    absolute_existing(resolved.to_str()?)
}

/// Returns an absolute path suitable for a Docker volume mount if the file exists.
/// Strips the Windows verbatim `\\?\` prefix from `canonicalize` output.
fn absolute_existing(path: &str) -> Option<String> {
    let canon = std::fs::canonicalize(path).ok()?;
    let s = canon.to_string_lossy().into_owned();
    Some(s.strip_prefix(r"\\?\").map(|s| s.to_string()).unwrap_or(s))
}

/// Locates the first `*.wasm` file under any `target/<triple>/release/` directory.
fn find_wasm(source_dir: &Path) -> Result<PathBuf, AppError> {
    find_wasm_in_dir(source_dir).ok_or_else(|| {
        AppError::BuildFailed(
            "no .wasm produced by build (searched all target/*/release directories)".into(),
        )
    })
}

fn find_wasm_in_dir(dir: &Path) -> Option<PathBuf> {
    let entries = std::fs::read_dir(dir).ok()?;
    for entry in entries.flatten() {
        let path = entry.path();
        if path.is_dir() {
            if let Some(found) = find_wasm_in_dir(&path) {
                return Some(found);
            }
        } else if path.extension().and_then(|e| e.to_str()) == Some("wasm") {
            let s = path.to_string_lossy();
            let in_release = s.contains("/release/") || s.contains("\\release\\");
            let in_deps = s.contains("/deps/") || s.contains("\\deps\\");
            if in_release && !in_deps {
                return Some(path);
            }
        }
    }
    None
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
