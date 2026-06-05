#!/bin/bash
set -e

# Start Docker daemon in background (required for DinD on Railway)
dockerd --host=unix:///var/run/docker.sock \
        --host=tcp://127.0.0.1:2375 \
        --storage-driver=overlay2 &
DOCKERD_PID=$!

# Wait up to 30 seconds for the daemon to be ready
echo "[entrypoint] Waiting for Docker daemon..."
for i in $(seq 1 30); do
    if docker info >/dev/null 2>&1; then
        echo "[entrypoint] Docker daemon ready (attempt $i)"
        break
    fi
    if [ $i -eq 30 ]; then
        echo "[entrypoint] Docker daemon did not start in time" >&2
        exit 1
    fi
    sleep 1
done

# Pull the build image ahead of time so the first verify request is faster
echo "[entrypoint] Pre-pulling stellar-cli image..."
docker pull stellar/stellar-cli:latest || true

# Start the Axum backend (replaces this shell process)
echo "[entrypoint] Starting backend on port ${PORT:-8088}"
exec stellar-contract-verification
