#!/bin/sh
set -e

if ldd "$(command -v stellar)" 2>/dev/null | grep -q 'libdbus.*not found'; then
  apt-get update -qq && apt-get install -y -qq libdbus-1-3 >/dev/null 2>&1
fi
rustup target add wasm32v1-none >/dev/null 2>&1 || true

COMMIT="${SOURCE_REV:-7b168174ae1268dab91a0190d80a94ab7ff41b59}"

echo "=== Build increment with SEP-58 metadata (rev=$COMMIT) ==="
stellar contract build \
  --profile release \
  --package soroban-increment-contract \
  --manifest-path increment/Cargo.toml \
  --meta "source_repo=https://github.com/stellar/soroban-examples" \
  --meta "source_rev=$COMMIT" \
  --meta "bldimg=stellar/stellar-cli:latest" \
  --meta "bldopt=--profile=release" \
  --meta "bldopt=--package=soroban-increment-contract" \
  --meta "bldopt=--manifest-path=increment/Cargo.toml"

WASM=$(find /workspace -path '*/wasm32v1-none/release/*.wasm' ! -path '*/deps/*' | head -n 1)
if [ -z "$WASM" ]; then
  echo "ERROR: no wasm produced"
  exit 1
fi
echo "WASM=$WASM"

echo "=== Generate + fund testnet key ==="
stellar keys generate demo --network testnet --fund

echo "=== Upload wasm ==="
WASM_HASH=$(stellar contract upload --wasm "$WASM" --source demo --network testnet)
echo "WASM_HASH=$WASM_HASH"

echo "=== Deploy contract ==="
CONTRACT_ID=$(stellar contract deploy --wasm-hash "$WASM_HASH" --source demo --network testnet)
echo "CONTRACT_ID=$CONTRACT_ID"
