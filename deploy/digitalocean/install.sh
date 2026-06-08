#!/bin/bash
set -euo pipefail

# One-shot install on a fresh Ubuntu 24.04 DigitalOcean Droplet (run as root).
REPO_URL="${REPO_URL:-https://github.com/sebasberrios-dev/stellar-contract-verification.git}"
REPO_BRANCH="${REPO_BRANCH:-demo-backend}"
INSTALL_DIR="${INSTALL_DIR:-/opt/stellar-contract-verification}"

echo "[1/6] Installing Docker..."
if ! command -v docker >/dev/null 2>&1; then
  apt-get update -qq
  apt-get install -y -qq git curl
  curl -fsSL https://get.docker.com | sh
fi

echo "[2/6] Cloning repository..."
rm -rf "$INSTALL_DIR"
git clone -b "$REPO_BRANCH" --depth 1 "$REPO_URL" "$INSTALL_DIR"

echo "[3/6] Configuring environment..."
cd "$INSTALL_DIR/deploy/digitalocean"
cp -n .env.example .env

echo "[4/6] Pre-pulling build image..."
docker pull stellar/stellar-cli:latest || true

echo "[5/6] Building and starting backend..."
docker compose up -d --build

echo "[6/6] Opening firewall (ufw)..."
if command -v ufw >/dev/null 2>&1; then
  ufw allow 22 || true
  ufw allow 8088 || true
  ufw --force enable || true
fi

sleep 3
echo ""
echo "Health check:"
curl -sf "http://127.0.0.1:8088/health" && echo ""
echo ""
echo "Backend URL for Vercel BACKEND_URL:"
echo "  http://$(curl -sf ifconfig.me 2>/dev/null || hostname -I | awk '{print $1}'):8088"
