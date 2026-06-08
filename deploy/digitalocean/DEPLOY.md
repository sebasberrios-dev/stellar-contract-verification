# DigitalOcean Deployment

Deploy the verification backend on a VPS where Docker runs on the **host** (not nested). This fixes the `Cannot connect to the Docker daemon` error seen on Fly.io.

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

## Logs

```bash
cd /opt/stellar-contract-verification/deploy/digitalocean
docker compose logs -f
```
