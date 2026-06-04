use stellar_contract_verification::builder::{build_wasm, clone_and_checkout, temp_dir};
use stellar_contract_verification::rpc::compute_sha256;
use std::time::Instant;

fn main() {
    println!("=== B4 End-to-End: docker build_wasm ===\n");

    // 1. Clone soroban-examples into a fresh workspace.
    let workspace = temp_dir();
    let repo = "https://github.com/stellar/soroban-examples";
    println!("Cloning {repo} ...");
    let start = Instant::now();
    clone_and_checkout(repo, "main", &workspace).expect("clone failed");
    println!("  ✓ cloned in {}s", start.elapsed().as_secs());

    // 2. Build the standalone hello_world contract (single-crate, fast).
    let contract_dir = workspace.join("hello_world");
    assert!(contract_dir.exists(), "hello_world dir missing");

    println!("\nRunning docker build (stellar/stellar-cli:latest) ...");
    let build_start = Instant::now();
    let result = build_wasm(&contract_dir, None, &[], &Default::default());
    println!("  build took {}s", build_start.elapsed().as_secs());

    match result {
        Ok(wasm) => {
            assert!(wasm.len() > 0, "empty wasm");
            assert_eq!(&wasm[..4], b"\0asm", "missing WASM magic bytes");
            println!("  ✓ WASM produced: {} bytes", wasm.len());
            println!(
                "  ✓ magic bytes: {:02x} {:02x} {:02x} {:02x}",
                wasm[0], wasm[1], wasm[2], wasm[3]
            );
            println!("  ✓ sha256: {}", compute_sha256(&wasm));
        }
        Err(e) => {
            eprintln!("  ✗ build_wasm failed: {e:?}");
            // Clean the parent clone before exiting (build_wasm only cleans the contract dir).
            let _ = std::fs::remove_dir_all(&workspace);
            std::process::exit(1);
        }
    }

    // 3. Verify cleanup: build_wasm removed the contract dir.
    assert!(
        !contract_dir.exists(),
        "build_wasm must clean its source_dir"
    );
    println!("\n  ✓ contract dir cleaned by guard");

    // Clean the parent clone (in the real pipeline, source_dir IS the workspace root).
    let _ = std::fs::remove_dir_all(&workspace);

    println!("\n✓ B4 end-to-end docker build validated");
}
