# DigitalOcean Deployment

Deploy the verification backend on a VPS where Docker runs on the **host** (not nested inside the backend container).

## Droplet requirements

- Ubuntu 24.04 LTS
- 2 GB RAM / 1 vCPU (minimum)
- Ports: 22 (SSH), 8088 (API)

## Quick install (on the Droplet as root)

After pushing `demo-backend`, on the Droplet:

```bash
git clone -b demo-backend https://github.com/sebasberrios-dev/stellar-contract-verification.git
cd stellar-contract-verification/deploy/digitalocean
bash install.sh
```

## Manual install

```bash
apt update && apt install -y git curl
curl -fsSL https://get.docker.com | sh

git clone -b demo-backend https://github.com/sebasberrios-dev/stellar-contract-verification.git
cd stellar-contract-verification/deploy/digitalocean
cp .env.example .env
mkdir -p /tmp/soroban-verify
docker compose up -d --build

ufw allow 22 && ufw allow 8088 && ufw --force enable
curl http://localhost:8088/health
```

## Vercel

Set `BACKEND_URL` to `http://YOUR_DROPLET_IP:8088` and redeploy the frontend.

## Verify a contract

```bash
curl -X POST http://YOUR_DROPLET_IP:8088/verify \
  -H "Content-Type: application/json" \
  -d '{"contract_id":"YOUR_CONTRACT_ID"}'
```

## Read cached verifications (GET)

```bash
curl "http://YOUR_DROPLET_IP:8088/v1/contracts/YOUR_CONTRACT_ID/verifications?network=testnet"

curl "http://YOUR_DROPLET_IP:8088/v1/wasm/WASM_SHA256_HEX/verifications?network=testnet"

# SEP registry alias (same response as /v1/wasm/.../verifications)
curl "http://YOUR_DROPLET_IP:8088/wasms/WASM_SHA256_HEX.json?network=testnet"
```

Example (Trackify on testnet):

```bash
curl "http://127.0.0.1:8088/v1/contracts/CCL7QSQ3FBG5FIUHNHZB37ZHDRTV4XN6AS5LQMSKZHA24D2JZQOZ4CHP/verifications?network=testnet"

curl "http://127.0.0.1:8088/wasms/687a8db6fceed75df43876b0a09714f5bf758ec869982b49cd512009f90f903e.json?network=testnet"
```

`GET /health` includes `schema_version` and the list of supported endpoints.

Results are persisted after the first successful `POST /verify` for a given contract + on-chain hash (cache policy A).

## Logs

```bash
cd /opt/stellar-contract-verification/deploy/digitalocean
docker compose logs -f
```
