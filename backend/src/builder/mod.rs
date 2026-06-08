mod docker;
mod git;

pub use docker::build_wasm;
pub use git::clone_and_checkout;

use crate::errors::AppError;
use std::fs::File;
use std::path::{Path, PathBuf};
use std::process::{Command, Stdio};
use std::time::Duration;
use wait_timeout::ChildExt;

/// Base directory for verification workspaces (git clones + docker bind mounts).
///
/// When this backend runs inside Docker but invokes the **host** daemon via
/// `/var/run/docker.sock`, workspace paths must live on the host filesystem.
/// Set `VERIFY_WORK_DIR` (e.g. `/tmp/soroban-verify`) and bind-mount that path
/// in compose so `docker run -v <path>:/workspace` resolves correctly.
fn base_dir() -> PathBuf {
    if let Ok(dir) = std::env::var("VERIFY_WORK_DIR") {
        let dir = dir.trim();
        if !dir.is_empty() {
            return PathBuf::from(dir);
        }
    }
    std::env::temp_dir().join("soroban-verify")
}

/// Generates a unique workspace path: `<work_dir>/soroban-verify/<uuid>` or `<VERIFY_WORK_DIR>/<uuid>`.
/// Does NOT create the directory — `git clone` creates it.
pub fn temp_dir() -> PathBuf {
    let base = base_dir();
    let _ = std::fs::create_dir_all(&base);
    base.join(uuid::Uuid::new_v4().to_string())
}

/// RAII guard that recursively deletes a directory when dropped.
/// Guarantees cleanup on every exit path (success, early return, or panic).
pub(crate) struct CleanupGuard<'a>(pub &'a Path);

impl Drop for CleanupGuard<'_> {
    fn drop(&mut self) {
        if self.0.exists() {
            if let Err(e) = std::fs::remove_dir_all(self.0) {
                tracing::warn!("Failed to clean up {}: {}", self.0.display(), e);
            }
        }
    }
}

/// Output of a finished subprocess.
pub(crate) struct CmdOutput {
    pub success: bool,
    pub stdout: String,
    pub stderr: String,
}

/// Runs an external command with a hard timeout.
///
/// stdout/stderr are redirected to temporary files (not pipes) to avoid
/// the classic deadlock where a child fills the OS pipe buffer while the
/// parent is blocked in `wait`. This matters for long, verbose Rust builds.
///
/// On timeout the child is killed and `BuildFailed` is returned.
pub(crate) fn run_with_timeout(
    program: &str,
    args: &[String],
    timeout: Duration,
    label: &str,
) -> Result<CmdOutput, AppError> {
    let tmp = std::env::temp_dir();
    let id = uuid::Uuid::new_v4();
    let out_path = tmp.join(format!("{label}-{id}.out"));
    let err_path = tmp.join(format!("{label}-{id}.err"));

    let out_file = File::create(&out_path)
        .map_err(|e| AppError::InternalError(format!("{label}: cannot create stdout file: {e}")))?;
    let err_file = File::create(&err_path)
        .map_err(|e| AppError::InternalError(format!("{label}: cannot create stderr file: {e}")))?;

    let mut child = Command::new(program)
        .args(args)
        .stdin(Stdio::null())
        .stdout(Stdio::from(out_file))
        .stderr(Stdio::from(err_file))
        .spawn()
        .map_err(|e| AppError::BuildFailed(format!("{label}: failed to spawn '{program}': {e}")))?;

    let status = match child
        .wait_timeout(timeout)
        .map_err(|e| AppError::InternalError(format!("{label}: wait failed: {e}")))?
    {
        Some(status) => status,
        None => {
            let _ = child.kill();
            let _ = child.wait();
            let _ = std::fs::remove_file(&out_path);
            let _ = std::fs::remove_file(&err_path);
            return Err(AppError::BuildFailed(format!(
                "{label} timed out after {}s",
                timeout.as_secs()
            )));
        }
    };

    let stdout = std::fs::read_to_string(&out_path).unwrap_or_default();
    let stderr = std::fs::read_to_string(&err_path).unwrap_or_default();
    let _ = std::fs::remove_file(&out_path);
    let _ = std::fs::remove_file(&err_path);

    Ok(CmdOutput {
        success: status.success(),
        stdout,
        stderr,
    })
}
