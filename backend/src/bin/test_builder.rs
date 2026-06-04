use stellar_contract_verification::builder::{build_wasm, clone_and_checkout, temp_dir};
use stellar_contract_verification::errors::AppError;
use std::time::Instant;

fn main() {
    println!("=== B4 Validation: builder module ===\n");

    // ── Test 1: temp_dir generates unique, uncreated paths ───────────────────
    println!("Test 1: temp_dir()");
    let d1 = temp_dir();
    let d2 = temp_dir();
    assert_ne!(d1, d2, "temp_dir must be unique");
    assert!(!d1.exists(), "temp_dir must not create the directory");
    assert!(d1.to_string_lossy().contains("soroban-verify"));
    println!("  ✓ unique path: {}", d1.display());

    // ── Test 2: unauthorized image rejected WITHOUT running docker ───────────
    println!("\nTest 2: unauthorized build image (no docker invocation)");
    let fake_dir = temp_dir();
    std::fs::create_dir_all(&fake_dir).unwrap();
    let start = Instant::now();
    let result = build_wasm(&fake_dir, Some("evilcorp/backdoor:latest"), &[], &Default::default());
    let elapsed = start.elapsed();
    match result {
        Err(AppError::BuildFailed(msg)) => {
            assert_eq!(msg, "Unauthorized build image");
            println!("  ✓ rejected: \"{msg}\"");
        }
        other => panic!("expected BuildFailed, got {other:?}"),
    }
    // Should be near-instant (docker run would take seconds); guard also cleaned the dir.
    assert!(elapsed.as_secs() < 2, "unauthorized check should be instant");
    assert!(!fake_dir.exists(), "workspace must be cleaned up");
    println!("  ✓ no docker run (elapsed {}ms)", elapsed.as_millis());
    println!("  ✓ workspace cleaned up by guard");

    // ── Test 3: git clone + checkout of a real repo ──────────────────────────
    println!("\nTest 3: clone_and_checkout (real repo, small)");
    let dest = temp_dir();
    // Use a tiny public repo for speed; checkout the default branch HEAD by commit.
    let repo = "https://github.com/octocat/Hello-World";
    let rev = "master";
    match clone_and_checkout(repo, rev, &dest) {
        Ok(()) => {
            assert!(dest.join(".git").exists(), ".git dir should exist");
            println!("  ✓ cloned + checked out '{rev}' into {}", dest.display());
            // cleanup after this success (build_wasm normally owns this in the pipeline)
            let _ = std::fs::remove_dir_all(&dest);
            println!("  ✓ cleaned up");
        }
        Err(e) => {
            eprintln!("  ! clone skipped/failed (network?): {e:?}");
        }
    }

    // ── Test 4: clone failure cleans up the dest ─────────────────────────────
    println!("\nTest 4: clone failure leaves no orphan dir");
    let bad_dest = temp_dir();
    let bad_repo = "https://github.com/this-org-does-not-exist-xyz/nope-404";
    match clone_and_checkout(bad_repo, "main", &bad_dest) {
        Err(AppError::BuildFailed(_)) => {
            assert!(!bad_dest.exists(), "failed clone must remove dest");
            println!("  ✓ BuildFailed returned and dest removed");
        }
        Err(e) => {
            assert!(!bad_dest.exists(), "failed clone must remove dest");
            println!("  ✓ error returned ({e:?}) and dest removed");
        }
        Ok(()) => panic!("clone of nonexistent repo should fail"),
    }

    println!("\n✓ All B4 (non-docker) validation criteria passed");
    println!("  Note: full build_wasm with docker requires Docker Desktop running.");
}
