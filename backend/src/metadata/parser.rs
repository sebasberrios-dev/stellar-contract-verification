use crate::errors::AppError;
use serde::Serialize;
use std::io::Cursor;
use stellar_xdr::curr::{Limited, Limits, ReadXdr, ScMetaEntry};

#[derive(Debug, Serialize, Default, Clone)]
pub struct Sep58Metadata {
    pub source_repo: Option<String>,
    pub source_rev: Option<String>,
    pub bldimg: Option<String>,
    /// Repeated SEP-58 `bldopt` entries, e.g. `--profile=release`, `--manifest-path=increment/Cargo.toml`.
    pub bldopt: Vec<String>,
}

/// Extracts SEP-58 metadata from the `contractmetav0` custom section of a WASM binary.
/// Returns `AppError::NoMetadata` if the section is absent.
pub fn extract_sep58(wasm_bytes: &[u8]) -> Result<Sep58Metadata, AppError> {
    let sections = find_all_contractmetav0(wasm_bytes)?;
    let mut meta = Sep58Metadata::default();
    for content in sections {
        merge_metadata(&mut meta, parse_metadata_content(content)?);
    }
    if meta.source_repo.is_none()
        && meta.source_rev.is_none()
        && meta.bldimg.is_none()
        && meta.bldopt.is_empty()
    {
        return Err(AppError::NoMetadata);
    }
    Ok(meta)
}

fn merge_metadata(dst: &mut Sep58Metadata, src: Sep58Metadata) {
    if src.source_repo.is_some() {
        dst.source_repo = src.source_repo;
    }
    if src.source_rev.is_some() {
        dst.source_rev = src.source_rev;
    }
    if src.bldimg.is_some() {
        dst.bldimg = src.bldimg;
    }
    dst.bldopt.extend(src.bldopt);
}

/// Maps a `Sep58Metadata` to a verification level:
/// - `2` → source_repo + source_rev present (can rebuild)
/// - `1` → partial metadata present
/// - `0` → no relevant fields
pub fn get_verification_level(meta: &Sep58Metadata) -> u8 {
    if meta.source_repo.is_some() && meta.source_rev.is_some() {
        2
    } else if meta.source_repo.is_some() || meta.source_rev.is_some() || meta.bldimg.is_some() {
        1
    } else {
        0
    }
}

// ─── WASM section parser ────────────────────────────────────────────────────

fn find_all_contractmetav0(wasm: &[u8]) -> Result<Vec<&[u8]>, AppError> {
    if wasm.len() < 8 || &wasm[..4] != b"\0asm" {
        return Err(AppError::InternalError("Not a valid WASM binary".into()));
    }

    let mut pos = 8;
    let mut sections = Vec::new();

    while pos < wasm.len() {
        let section_type = wasm[pos];
        pos += 1;

        let (section_size, leb_len) = read_leb128_u32(&wasm[pos..])
            .ok_or_else(|| AppError::InternalError("Invalid WASM: bad section size LEB128".into()))?;
        pos += leb_len;

        let section_end = pos + section_size as usize;
        if section_end > wasm.len() {
            return Err(AppError::InternalError("Invalid WASM: section overflows binary".into()));
        }

        if section_type == 0x00 {
            let section_bytes = &wasm[pos..section_end];
            if let Some((name, data)) = split_custom_section(section_bytes) {
                if name == "contractmetav0" {
                    sections.push(data);
                }
            }
        }

        pos = section_end;
    }

    if sections.is_empty() {
        Err(AppError::NoMetadata)
    } else {
        Ok(sections)
    }
}

/// Splits a raw custom section payload into (name, content).
fn split_custom_section(bytes: &[u8]) -> Option<(&str, &[u8])> {
    let (name_len, leb_len) = read_leb128_u32(bytes)?;
    let name_start = leb_len;
    let name_end = name_start + name_len as usize;
    if name_end > bytes.len() {
        return None;
    }
    let name = std::str::from_utf8(&bytes[name_start..name_end]).ok()?;
    Some((name, &bytes[name_end..]))
}

fn read_leb128_u32(bytes: &[u8]) -> Option<(u32, usize)> {
    let mut result: u32 = 0;
    let mut shift = 0u32;
    for (i, &byte) in bytes.iter().enumerate() {
        result |= ((byte & 0x7f) as u32) << shift;
        if byte & 0x80 == 0 {
            return Some((result, i + 1));
        }
        shift += 7;
        if shift >= 35 {
            return None; // overflow guard
        }
    }
    None // incomplete LEB128
}

// ─── XDR metadata parser ─────────────────────────────────────────────────────

/// Parses repeated `ScMetaEntry` XDR values from the contractmetav0 section.
fn parse_metadata_content(content: &[u8]) -> Result<Sep58Metadata, AppError> {
    let mut meta = Sep58Metadata::default();
    let mut reader = Limited::new(Cursor::new(content), Limits::none());

    while (reader.inner.position() as usize) < content.len() {
        let entry = ScMetaEntry::read_xdr(&mut reader)
            .map_err(|e| AppError::InternalError(format!("Metadata XDR parse error: {e}")))?;

        let ScMetaEntry::ScMetaV0(v0) = entry;
        let key = String::from_utf8_lossy(v0.key.as_ref()).into_owned();
        let val = String::from_utf8_lossy(v0.val.as_ref()).into_owned();
        match key.as_str() {
            "source_repo" => meta.source_repo = Some(val),
            "source_rev" => meta.source_rev = Some(val),
            "bldimg" => meta.bldimg = Some(val),
            "bldopt" => meta.bldopt.push(val),
            _ => {} // ignore rsver, rssdkver, etc.
        }
    }

    Ok(meta)
}
