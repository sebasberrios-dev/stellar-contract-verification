#!/bin/bash

# Start Docker daemon in background (needed for /verify builds)
# Don't wait for it — the Axum server must start immediately for healthcheck
dockerd --host=unix:///var/run/docker.sock \
        --storage-driver=overlay2 \
        --log-level=warn \
        2>&1 | sed 's/^/[dockerd] /' &

# Give dockerd a moment to initialize without blocking
sleep 2

# Start the Axum backend (Railway healthcheck hits /health immediately)
echo "[entrypoint] Starting backend on port ${PORT:-8088}"
exec stellar-contract-verification
