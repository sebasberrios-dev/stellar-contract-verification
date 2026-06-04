use stellar_contract_verification::builder::{build_wasm, clone_and_checkout, temp_dir};
use stellar_contract_verification::metadata::Sep58Metadata;
use stellar_contract_verification::rpc::compute_sha256;

fn main() {
    let repo = "https://github.com/stellar/soroban-examples";
    let rev = "7b168174ae1268dab91a0190d80a94ab7ff41b59";
    let expected = "4bfaf0a238102c1febe3e634787dfec13d4e20311f614a180062198980877d45";

    let bldopts = vec![
        "--profile=release".into(),
        "--package=soroban-increment-contract".into(),
        "--manifest-path=increment/Cargo.toml".into(),
    ];

    let embed = Sep58Metadata {
        source_repo: Some(repo.into()),
        source_rev: Some(rev.into()),
        bldimg: Some("stellar/stellar-cli:latest".into()),
        bldopt: bldopts.clone(),
    };

    let dest = temp_dir();
    clone_and_checkout(repo, rev, &dest).expect("clone");
    let wasm = build_wasm(
        &dest,
        Some("stellar/stellar-cli:latest"),
        &bldopts,
        &embed,
    )
    .expect("build");
    let hash = compute_sha256(&wasm);
    println!("rebuilt_hash={hash}");
    println!("expected    ={expected}");
    println!("match={}", hash == expected);
    assert_eq!(hash, expected);
    println!("OK: increment rebuild matches on-chain wasm");
}
