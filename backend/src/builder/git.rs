use crate::builder::run_with_timeout;
use crate::errors::AppError;
use std::path::Path;
use std::time::Duration;

const GIT_TIMEOUT: Duration = Duration::from_secs(60);

/// Clones `repo_url` into `dest` and checks out the exact `rev`.
///
/// On any failure the partially-created `dest` directory is removed so that
/// no orphaned workspaces remain. Each git invocation is bounded to 60s.
pub fn clone_and_checkout(repo_url: &str, rev: &str, dest: &Path) -> Result<(), AppError> {
    let dest_str = dest.to_string_lossy().into_owned();

    // Step 1: git clone <repo_url> <dest>
    let clone = run_with_timeout(
        "git",
        &["clone".into(), repo_url.into(), dest_str.clone()],
        GIT_TIMEOUT,
        "git-clone",
    );

    match clone {
        Ok(out) if out.success => {}
        Ok(out) => {
            cleanup(dest);
            return Err(AppError::BuildFailed(format!(
                "git clone failed: {}",
                trim_msg(&out.stderr)
            )));
        }
        Err(e) => {
            cleanup(dest);
            return Err(e);
        }
    }

    // Step 2: git -C <dest> checkout <rev>
    let checkout = run_with_timeout(
        "git",
        &[
            "-C".into(),
            dest_str,
            "checkout".into(),
            "--quiet".into(),
            rev.into(),
        ],
        GIT_TIMEOUT,
        "git-checkout",
    );

    match checkout {
        Ok(out) if out.success => Ok(()),
        Ok(out) => {
            cleanup(dest);
            Err(AppError::BuildFailed(format!(
                "git checkout '{rev}' failed: {}",
                trim_msg(&out.stderr)
            )))
        }
        Err(e) => {
            cleanup(dest);
            Err(e)
        }
    }
}

fn cleanup(dest: &Path) {
    if dest.exists() {
        let _ = std::fs::remove_dir_all(dest);
    }
}

fn trim_msg(s: &str) -> String {
    let t = s.trim();
    if t.is_empty() {
        "(no stderr output)".into()
    } else {
        t.to_string()
    }
}
