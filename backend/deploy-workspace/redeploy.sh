#!/bin/sh
set -e

if ldd "$(command -v stellar)" 2>/dev/null | grep -q 'libdbus.*not found'; then
  apt-get update -qq && apt-get install -y -qq libdbus-1-3 >/dev/null 2>&1
fi

WASM="/workspace/increment/target/wasm32v1-none/release/soroban_increment_contract.wasm"
if [ ! -f "$WASM" ]; then
  echo "ERROR: wasm not found at $WASM — run build-and-deploy.sh first"
  exit 1
fi
echo "WASM=$WASM"

echo "=== Generate + fund testnet key ==="
stellar keys generate demo2 --network testnet --fund || stellar keys generate demo2 --network testnet

echo "=== Upload wasm ==="
WASM_HASH=$(stellar contract upload --wasm "$WASM" --source demo2 --network testnet)
echo "WASM_HASH=$WASM_HASH"

echo "=== Deploy contract ==="
CONTRACT_ID=$(stellar contract deploy --wasm-hash "$WASM_HASH" --source demo2 --network testnet)
echo "CONTRACT_ID=$CONTRACT_ID"
