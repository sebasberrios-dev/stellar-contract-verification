# ── Stage 1: build Rust binary ───────────────────────────────────────────────
# Build context is the REPO ROOT (Railway always uses repo root).
# All paths are relative to the repo root.
FROM rust:1.87-bookworm AS builder

WORKDIR /app

# Cache dependencies separately from source
COPY backend/Cargo.toml backend/Cargo.lock ./
RUN mkdir -p src/bin && \
    echo 'fn main(){}' > src/main.rs && \
    echo 'fn main(){}' > src/bin/test_rpc.rs && \
    echo 'fn main(){}' > src/bin/test_metadata.rs && \
    echo 'fn main(){}' > src/bin/test_builder.rs && \
    echo 'fn main(){}' > src/bin/test_docker_build.rs && \
    echo 'fn main(){}' > src/bin/test_increment_verify.rs && \
    cargo build --release && \
    rm -rf src

COPY backend/src ./src
RUN touch src/main.rs && cargo build --release --bin stellar-contract-verification

# ── Stage 2: runtime with Docker Engine + Git ────────────────────────────────
FROM debian:bookworm-slim

RUN apt-get update && apt-get install -y \
        ca-certificates curl gnupg git \
    && install -m 0755 -d /etc/apt/keyrings \
    && curl -fsSL https://download.docker.com/linux/debian/gpg \
        -o /etc/apt/keyrings/docker.asc \
    && chmod a+r /etc/apt/keyrings/docker.asc \
    && echo "deb [arch=$(dpkg --print-architecture) \
        signed-by=/etc/apt/keyrings/docker.asc] \
        https://download.docker.com/linux/debian bookworm stable" \
        > /etc/apt/sources.list.d/docker.list \
    && apt-get update \
    && apt-get install -y docker-ce docker-ce-cli containerd.io \
    && rm -rf /var/lib/apt/lists/*

COPY --from=builder /app/target/release/stellar-contract-verification \
    /usr/local/bin/stellar-contract-verification

COPY backend/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

ENV PORT=8088
EXPOSE 8088

ENTRYPOINT ["/entrypoint.sh"]
