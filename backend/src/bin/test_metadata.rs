use stellar_contract_verification::metadata::{extract_sep58, get_verification_level};
use stellar_contract_verification::errors::AppError;
use stellar_xdr::curr::{Limited, Limits, ScMetaEntry, ScMetaV0, StringM, WriteXdr};

/// Builds a minimal valid WASM binary containing a custom section with the given name and content.
fn build_wasm_with_custom_section(section_name: &str, content: &[u8]) -> Vec<u8> {
    let mut wasm = vec![0x00, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00]; // magic + version

    let name_bytes = section_name.as_bytes();
    let name_leb = leb128_u32(name_bytes.len() as u32);

    let section_payload_len = name_leb.len() + name_bytes.len() + content.len();

    wasm.push(0x00); // section type: custom
    wasm.extend(leb128_u32(section_payload_len as u32));
    wasm.extend(&name_leb);
    wasm.extend(name_bytes);
    wasm.extend(content);

    wasm
}

fn leb128_u32(mut n: u32) -> Vec<u8> {
    let mut out = Vec::new();
    loop {
        let byte = (n & 0x7f) as u8;
        n >>= 7;
        if n == 0 {
            out.push(byte);
            break;
        }
        out.push(byte | 0x80);
    }
    out
}

fn xdr_meta_entries(pairs: &[(&str, &str)]) -> Vec<u8> {
    let mut buf = Vec::new();
    for (k, v) in pairs {
        let entry = ScMetaEntry::ScMetaV0(ScMetaV0 {
            key: StringM::try_from(k.as_bytes().to_vec()).unwrap(),
            val: StringM::try_from(v.as_bytes().to_vec()).unwrap(),
        });
        entry
            .write_xdr(&mut Limited::new(&mut buf, Limits::none()))
            .unwrap();
    }
    buf
}

fn main() {
    println!("=== B3 Validation: extract_sep58 ===\n");

    // ── Test 1: WASM with full SEP-58 metadata ───────────────────────────────
    println!("Test 1: WASM with complete SEP-58 metadata");
    let content = xdr_meta_entries(&[
        ("source_repo", "https://github.com/stellar/soroban-examples"),
        ("source_rev", "7b168174ae1268dab91a0190d80a94ab7ff41b59"),
        ("bldimg", "docker.io/stellar/stellar-cli@sha256:cb2fc3"),
        ("rsver", "1.95.0"),       // extra key — should be ignored
        ("bldopt", "--release"),   // extra key — should be ignored
    ]);
    let wasm = build_wasm_with_custom_section("contractmetav0", &content);

    let meta = extract_sep58(&wasm).expect("should parse OK");
    assert_eq!(
        meta.source_repo.as_deref(),
        Some("https://github.com/stellar/soroban-examples")
    );
    assert_eq!(
        meta.source_rev.as_deref(),
        Some("7b168174ae1268dab91a0190d80a94ab7ff41b59")
    );
    assert_eq!(
        meta.bldimg.as_deref(),
        Some("docker.io/stellar/stellar-cli@sha256:cb2fc3")
    );
    let level = get_verification_level(&meta);
    assert_eq!(level, 2, "level should be 2 with repo+rev");
    println!("  ✓ source_repo: {}", meta.source_repo.unwrap());
    println!("  ✓ source_rev:  {}", meta.source_rev.unwrap());
    println!("  ✓ bldimg:      {}", meta.bldimg.unwrap());
    println!("  ✓ get_verification_level = {level}");

    // ── Test 2: WASM with partial metadata (only source_repo) ────────────────
    println!("\nTest 2: WASM with partial metadata (source_repo only)");
    let content2 = xdr_meta_entries(&[("source_repo", "https://github.com/example/contract")]);
    let wasm2 = build_wasm_with_custom_section("contractmetav0", &content2);
    let meta2 = extract_sep58(&wasm2).expect("should parse OK");
    assert!(meta2.source_repo.is_some());
    assert!(meta2.source_rev.is_none());
    let level2 = get_verification_level(&meta2);
    assert_eq!(level2, 1);
    println!("  ✓ level = {level2} (partial metadata)");

    // ── Test 3: WASM without contractmetav0 section ──────────────────────────
    println!("\nTest 3: WASM without contractmetav0 section");
    let wasm3 = build_wasm_with_custom_section("othersection", b"irrelevant data");
    match extract_sep58(&wasm3) {
        Err(AppError::NoMetadata) => println!("  ✓ AppError::NoMetadata returned"),
        other => panic!("Expected NoMetadata, got {:?}", other),
    }

    // ── Test 4: Plain WASM header (no sections) ───────────────────────────────
    println!("\nTest 4: minimal WASM (header only, no sections)");
    let wasm4 = vec![0x00, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00];
    match extract_sep58(&wasm4) {
        Err(AppError::NoMetadata) => println!("  ✓ AppError::NoMetadata returned"),
        other => panic!("Expected NoMetadata, got {:?}", other),
    }

    // ── Test 5: Not a WASM binary ─────────────────────────────────────────────
    println!("\nTest 5: non-WASM bytes");
    match extract_sep58(b"this is not wasm") {
        Err(AppError::InternalError(_)) => println!("  ✓ AppError::InternalError returned"),
        other => panic!("Expected InternalError, got {:?}", other),
    }

    println!("\n✓ All B3 validation criteria passed");
}
