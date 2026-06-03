use stellar_contract_verification::rpc::{compute_sha256, get_contract_wasm};

#[tokio::main]
async fn main() {
    // Real testnet contract (verified on Stellar Expert, wasm hash known)
    let contract_id = "CDZZZPYQALFRBQAZD5KCW2SZK4ZF455PJVD7H53AGHXTWAJO4BYVPP2V";
    // Expected wasm hash from Stellar Expert API
    let expected_hash = "76d2ba826c1b5a7b6cc0aaebe058cc3ffc373c2171f90d63ebb7481a28f577bd";
    let rpc_url = "https://soroban-testnet.stellar.org";

    println!("=== B2 Validation: get_contract_wasm ===");
    println!("Contract: {contract_id}");

    let wasm = match get_contract_wasm(rpc_url, contract_id).await {
        Ok(w) => w,
        Err(e) => {
            eprintln!("✗ FAIL get_contract_wasm: {:?}", e);
            std::process::exit(1);
        }
    };

    // Criterion 1: length > 0
    assert!(wasm.len() > 0, "WASM is empty");
    println!("✓ Vec<u8> length: {} bytes", wasm.len());

    // Criterion 2: valid WASM magic bytes
    assert_eq!(&wasm[..4], b"\0asm", "Not a valid WASM binary");
    println!(
        "✓ Magic bytes: {:02x} {:02x} {:02x} {:02x}",
        wasm[0], wasm[1], wasm[2], wasm[3]
    );

    // Criterion 3: SHA256 = 64 hex chars
    let hash = compute_sha256(&wasm);
    assert_eq!(hash.len(), 64, "SHA256 must be 64 chars");
    println!("✓ SHA256 ({} chars): {}", hash.len(), hash);

    // Bonus: matches expected hash from Stellar Expert
    assert_eq!(hash, expected_hash, "Hash mismatch with known value");
    println!("✓ Hash matches Stellar Expert reference");

    // Criterion 4: invalid contract_id → ContractNotFound (no panic)
    println!("\n=== B2 Validation: invalid contract ID ===");
    match get_contract_wasm(rpc_url, "CINVALIDO").await {
        Err(e) => println!("✓ Invalid ID → {:?}", e),
        Ok(_) => {
            eprintln!("✗ Should have returned ContractNotFound");
            std::process::exit(1);
        }
    }

    println!("\n✓ All B2 validation criteria passed");
}
