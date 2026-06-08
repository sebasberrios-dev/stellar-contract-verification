# How to Verify Your Soroban Contract with CSV Stellar

This tutorial walks you through getting your deployed Soroban contract to show as **"Contract Verified"** on [CSV Stellar](https://stellar-contract-verification.vercel.app).

---

## Prerequisites

- [stellar-cli](https://github.com/stellar/stellar-cli) installed (v26+)
- Your contract compiles with `stellar contract build`
- Source code in a **public** GitHub repository
- Docker installed (used internally by stellar-cli to build)

---

## Step 1 — Commit your code and note the exact commit SHA

The verification system rebuilds your contract from the exact commit you specify. Use a pinned SHA, not a branch name — branches move, SHAs don't.

```bash
git add .
git commit -m "ready to deploy"
git push origin main

# Copy this — you'll need it in the next step
git rev-parse HEAD
# example output: a1b2c3d4e5f6789012345678901234567890abcd
```

---

## Step 2 — Build with SEP-58 metadata embedded

This is the critical step. You must embed metadata into the WASM at build time so that the verifier knows where to find your source code.

**Simple contract (single crate):**

```bash
stellar contract build \
  --meta source_repo=https://github.com/your-org/your-contract \
  --meta source_rev=a1b2c3d4e5f6789012345678901234567890abcd
```

**Workspace / monorepo (multiple contracts in one repo):**

```bash
stellar contract build \
  --meta source_repo=https://github.com/your-org/your-repo \
  --meta source_rev=a1b2c3d4e5f6789012345678901234567890abcd \
  --meta bldopt=--manifest-path=my-contract/Cargo.toml \
  --meta bldopt=--package=my-contract-name
```

> **Rule:** every flag you pass to `stellar contract build` to select your contract must also be passed as a `--meta bldopt=` entry. The verifier replays those exact flags when rebuilding.

The compiled WASM will be at `target/wasm32-unknown-unknown/release/your_contract.wasm`.

---

## Step 3 — Deploy to Stellar Testnet

```bash
stellar contract deploy \
  --wasm target/wasm32-unknown-unknown/release/your_contract.wasm \
  --network testnet \
  --source YOUR_ACCOUNT_NAME
```

The command prints your **Contract ID** — a string starting with `C`, 56 characters long. Copy it.

```
Contract ID: YOUR_CONTRACT_ID
```

---

## Step 4 — Verify on CSV Stellar

Open [https://stellar-contract-verification.vercel.app](https://stellar-contract-verification.vercel.app), paste your Contract ID, and click **Verify Contract**.

The system will:
1. Fetch your deployed WASM from the Stellar blockchain
2. Read the `source_repo`, `source_rev`, and `bldopt` metadata you embedded
3. Clone your repository at that exact commit
4. Rebuild the contract inside an isolated Docker container using the official `stellar/stellar-cli` image
5. Compare the SHA-256 hash of the rebuilt WASM against the on-chain WASM

If the hashes match, your contract shows as **✅ Contract Verified**.

You can also call the API directly:

```bash
curl -X POST https://stellar-contract-verification.vercel.app/api/verify \
  -H "Content-Type: application/json" \
  -d '{"contract_id": "YOUR_CONTRACT_ID"}'
```

---

## Troubleshooting

**"No Metadata Found"**
You deployed a WASM that was built without `--meta` flags. Rebuild with the metadata from Step 2, redeploy, and use the new Contract ID.

**"Hash Mismatch"**
The rebuilt WASM does not match what's on-chain. Common causes:
- `source_rev` points to a different commit than what was actually compiled
- Missing `bldopt` flags (e.g. forgot `--package` in a workspace)
- Local uncommitted changes were included in the deployed build — always commit before building for deployment

**"Incomplete Metadata"**
Either `source_repo` or `source_rev` is missing from your `--meta` flags. Both are required for the system to attempt a rebuild.

**Repository is private**
The verifier clones your repo without authentication. Your repository must be **public** on GitHub.
