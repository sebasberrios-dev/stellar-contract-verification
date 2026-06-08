# Backend — Setup y estado de implementación

## B1 — Servidor Axum base

### Qué se implementó

| Archivo | Descripción |
|---------|-------------|
| `Cargo.toml` | Dependencias del proyecto |
| `src/main.rs` | Servidor Axum, CORS, tracing, `GET /health`, `POST /verify` |
| `src/errors.rs` | Enum `AppError` con `IntoResponse` para cada variante |
| `src/lib.rs` | Expone módulos `errors`, `rpc`, `metadata`, `builder`, `routes` |
| `.env` | Variables de entorno (`SOROBAN_RPC_URL`, `PORT`, `BUILD_CA_BUNDLE`) |
| `Dockerfile.prod` | Imagen de producción para VPS (Docker del host vía socket) |
| `../docker-compose.yml` | Servicio backend con acceso al socket Docker |

### Dependencias (`Cargo.toml`)

```toml
axum = "0.7"
tokio = { version = "1", features = ["full"] }
serde = { version = "1", features = ["derive"] }
serde_json = "1"
sha2 = "0.10"
hex = "0.4"
reqwest = { version = "0.11", features = ["json"] }
tracing = "0.1"
tracing-subscriber = { version = "0.3", features = ["env-filter"] }
tower-http = { version = "0.5", features = ["cors"] }
dotenvy = "0.15"
stellar-xdr = { version = "26", features = ["base64"] }
stellar-strkey = "0.0"
uuid = { version = "1", features = ["v4"] }
wait-timeout = "0.2"
```

### `AppError` — variantes y respuestas HTTP

| Variante | HTTP | Body JSON |
|----------|------|-----------|
| `ContractNotFound` | 404 | `{ "error": "Contract not found", "verified": false, "verification_level": 0 }` |
| `NoMetadata` | 200 | `{ "error": "No SEP-58 metadata", "verified": false, "verification_level": 0 }` |
| `BuildFailed(String)` | 200 | `{ "error": "<msg>", "verified": false, "verification_level": 2 }` |
| `InternalError(String)` | 500 | `{ "error": "<msg>", "verified": false, "verification_level": 0 }` |

> En el handler `POST /verify`, la mayoría de errores se mapean a HTTP 200 con `VerifyResponse` (ver B5). Las variantes de `AppError` anteriores se usan principalmente en el pipeline interno.

### CORS

Configurado con `tower-http` para permitir exclusivamente el origen `http://localhost:3000`.  
Métodos permitidos: `GET`, `POST`, `OPTIONS`.

### Variables de entorno (`.env`)

```
SOROBAN_RPC_URL=https://soroban-testnet.stellar.org
PORT=8088
BUILD_CA_BUNDLE=./.ca-bundle.pem
```

El binario carga el `.env` automáticamente al iniciar vía `dotenvy::dotenv()`.  
Si `PORT` no está definido, usa `8080` como valor por defecto en código.  
`BUILD_CA_BUNDLE` es opcional — solo necesario en redes con proxy TLS corporativo (ver B4).

---

## B2 — Módulo RPC

### Qué se implementó

| Archivo | Descripción |
|---------|-------------|
| `src/rpc/mod.rs` | Re-exporta `get_contract_wasm` y `compute_sha256` |
| `src/rpc/client.rs` | Cliente JSON-RPC hacia SDF + parsing XDR + SHA256 |
| `src/bin/test_rpc.rs` | Binario de validación manual contra testnet |

### Decisiones técnicas

Se eligió **parsing XDR directo** con los crates `stellar-xdr` v26 y `stellar-strkey`, en lugar de invocar `stellar contract info` via CLI.

Motivos:
- Sin dependencia de tener stellar-cli instalado en el host
- Control total del pipeline async con `reqwest`
- Testnet en Protocol 26 → `stellar-xdr` v26 con feature `base64`

Detalle importante: el campo `xdr` en la respuesta de `getLedgerEntries` es `LedgerEntryData` (solo la unión interna), no el struct completo `LedgerEntry`. Por eso se deserializa con `LedgerEntryData::from_xdr_base64`.

### Cómo funciona

Pipeline `contract_id` → `Vec<u8>` WASM:

```
1. Contract::from_string(contract_id) → Hash del contrato
2. getLedgerEntries(ContractInstance) → extrae wasm_hash del XDR
3. getLedgerEntries(ContractCode)     → extrae bytes WASM en base64
4. base64 decode → Vec<u8>
5. compute_sha256(bytes) → hex lowercase de 64 chars
```

Timeout del cliente HTTP: **30 segundos** (`reqwest::Client::builder().timeout(...)`).

### Cómo probar

```powershell
cd backend
$env:CARGO_HTTP_CHECK_REVOKE = "false"
cargo run --bin test_rpc
```

Valida:
- WASM de un contrato real de testnet (magic bytes `\0asm`)
- `compute_sha256` retorna 64 caracteres hex
- Contract ID inválido → `AppError::ContractNotFound`

---

## B3 — Módulo Metadata

### Qué se implementó

| Archivo | Descripción |
|---------|-------------|
| `src/metadata/mod.rs` | Re-exporta `extract_sep58`, `get_verification_level`, `Sep58Metadata` |
| `src/metadata/parser.rs` | Parser WASM + XDR de la sección `contractmetav0` |
| `src/bin/test_metadata.rs` | Binario de validación con WASM sintéticos |

### Decisiones técnicas

Se eligió **parsing manual** de la sección custom `contractmetav0` del binario WASM, en lugar de `stellar contract info meta` via CLI.

Motivos:
- Operación 100% en memoria, sin subprocess ni red
- Control sobre campos SEP-58 y múltiples `bldopt`

**Múltiples secciones `contractmetav0`:** los WASM de Soroban pueden tener dos secciones con el mismo nombre:
- Una pequeña (~96 bytes) con `rsver`, `rssdkver`, `cliver`
- Una grande (~400 bytes) con `source_repo`, `source_rev`, `bldimg`, `bldopt`

El parser itera **todas** las secciones y las fusiona con `merge_metadata()`. Sin esto, solo se leía la primera y `source_repo`/`source_rev` quedaban vacíos.

**Múltiples `bldopt`:** cada entrada XDR con `key = "bldopt"` se acumula en `Sep58Metadata.bldopt: Vec<String>` (no se sobrescribe).

### Struct `Sep58Metadata`

```rust
pub struct Sep58Metadata {
    pub source_repo: Option<String>,
    pub source_rev: Option<String>,
    pub bldimg: Option<String>,
    pub bldopt: Vec<String>,  // ej. "--profile=release", "--manifest-path=increment/Cargo.toml"
}
```

### Niveles de verificación

| `verification_level` | Condición |
|---------------------|-----------|
| `0` | Sin metadata relevante, o sin sección `contractmetav0` |
| `1` | Metadata parcial: falta `source_repo` o `source_rev` (pero hay algún campo) |
| `2` | `source_repo` + `source_rev` presentes → listo para reconstruir |

### Cómo probar

```powershell
cd backend
cargo run --bin test_metadata
```

Valida WASM sintéticos con metadata completa, parcial, sin sección, y bytes no-WASM.

---

## B4 — Módulo Builder

### Qué se implementó

| Archivo | Descripción |
|---------|-------------|
| `src/builder/mod.rs` | `temp_dir()`, `CleanupGuard`, `run_with_timeout()` |
| `src/builder/git.rs` | `clone_and_checkout()` via `git clone` + `git checkout` |
| `src/builder/docker.rs` | `build_wasm()` via `docker run stellar/stellar-cli` |
| `src/bin/test_builder.rs` | Valida allowlist, temp dir, clone (sin Docker) |
| `src/bin/test_docker_build.rs` | Build end-to-end de `hello_world` via Docker |
| `src/bin/test_increment_verify.rs` | Build + hash match del contrato `increment` |

### Decisiones técnicas

**Workspace temporal:** `%TEMP%\soroban-verify\{uuid}` en Windows (`std::env::temp_dir()`).  
Se limpia siempre via `CleanupGuard` (RAII `Drop`) al salir de `build_wasm`, éxito o fallo.

**Timeouts:**
| Operación | Valor | Motivo |
|-----------|-------|--------|
| `git clone` / `git checkout` | 60s | Repos pequeños; evita colgar el handler |
| `docker run` (build) | 360s | Compilaciones Rust + descarga de crates pueden ser lentas |

**Selección de imagen Docker (`resolve_image`):**
| `bldimg` en metadata | Resultado |
|----------------------|-----------|
| `None` | `stellar/stellar-cli:latest` |
| Contiene `stellar/stellar-cli` | Usa ese valor exacto |
| Cualquier otra imagen | `BuildFailed("Unauthorized build image")` — no ejecuta Docker |

**Bootstrap dentro del contenedor** (se overridea el entrypoint de la imagen):
1. Inyectar CA corporativo si `BUILD_CA_BUNDLE` está configurado
2. Instalar `libdbus-1-3` si el binario `stellar` lo necesita (imagen oficial no lo incluye)
3. `rustup target add wasm32v1-none` (el entrypoint original lo hacía; al overridearlo hay que repetirlo)
4. `stellar contract build` con flags `bldopt` + re-embed de metadata SEP-58

**Re-embed de metadata:** el rebuild pasa `--meta source_repo=...`, `--meta source_rev=...`, `--meta bldimg=...` y `--meta bldopt=...` para que el WASM reconstruido incluya la misma metadata que el on-chain. Sin esto, el hash SHA256 no coincide aunque el código fuente sea idéntico.

**`find_wasm`:** busca recursivamente `target/*/release/*.wasm`, excluyendo rutas con `/deps/` (artefactos intermedios de Rust, no el WASM final).

**Red en Docker:** `--network=none` está pendiente como hardening futuro. El build necesita acceso a crates.io; en MVP la red queda habilitada.

**CA bundle (`BUILD_CA_BUNDLE`):** en redes con proxy TLS corporativo, monta un PEM en el contenedor y fusiona con el store del sistema. Variables exportadas: `SSL_CERT_FILE`, `CARGO_HTTP_CAINFO`, `CURL_CA_BUNDLE`, `RUSTUP_USE_CURL=1`.  
La ruta relativa se resuelve contra `CARGO_MANIFEST_DIR` (directorio `backend/`), no el cwd del proceso.

### Cómo funciona

```
clone_and_checkout(repo, rev, temp_dir)
  → git clone + git checkout (60s timeout c/u)
  → cleanup en fallo

build_wasm(source_dir, bldimg, bldopts, embed_meta)
  → allowlist check
  → docker run --rm -v source_dir:/workspace stellar/stellar-cli ...
  → bootstrap: CA + libdbus + rustup target + stellar contract build
  → find_wasm → leer bytes
  → CleanupGuard elimina source_dir
```

### Cómo probar

```powershell
cd backend
$env:CARGO_HTTP_CHECK_REVOKE = "false"
$env:BUILD_CA_BUNDLE = "./.ca-bundle.pem"   # solo si hay proxy TLS

# Tests sin Docker
cargo run --bin test_builder

# Build Docker de hello_world (~2 min)
cargo run --bin test_docker_build

# Verificación hash del contrato increment desplegado (~2 min)
cargo run --bin test_increment_verify
```

Requisitos: `git`, `docker` en PATH, imagen `stellar/stellar-cli:latest` descargada.

---

## B5 — Endpoint POST /verify

### Qué se implementó

| Archivo | Descripción |
|---------|-------------|
| `src/routes/verify.rs` | Handler, structs, pipeline de 8 pasos |
| `src/routes/mod.rs` | Re-exporta `verify_handler`, `AppState`, structs |
| `src/main.rs` | Registra `POST /verify` con `AppState { rpc_url }` |
| `deploy-workspace/build-and-deploy.sh` | Script para compilar y desplegar contrato demo en testnet |
| `deploy-workspace/redeploy.sh` | Redeploy usando WASM ya compilado |

### Structs del API

**Request:**
```rust
pub struct VerifyRequest {
    pub contract_id: String,  // Strkey Soroban, empieza con "C", 50–60 chars
}
```

**Response:**
```rust
pub struct VerifyResponse {
    pub verified: bool,
    pub verification_level: u8,
    pub source_repo: Option<String>,
    pub source_rev: Option<String>,
    pub build_image: Option<String>,
    pub onchain_hash: String,
    pub rebuilt_hash: Option<String>,
    pub wasm_hash_match: bool,
    pub error: Option<String>,
}
```

### Cómo funciona — pipeline del handler

```
1. validate_contract_id        → HTTP 400 si inválido
2. get_contract_wasm(rpc_url)  → onchain_wasm + onchain_hash
3. extract_sep58(wasm)       → Sep58Metadata + verification_level
4. if level < 2              → HTTP 200, verified: false
5. clone_and_checkout          → spawn_blocking (git)
6. build_wasm(bldopt, embed)   → spawn_blocking (docker)
7. compare SHA256              → wasm_hash_match
8. VerifyResponse completo     → HTTP 200
```

El clone + build corren en `tokio::task::spawn_blocking` porque son operaciones bloqueantes (subprocess + Docker).

### Tabla de respuestas por escenario

| Escenario | `verified` | `level` | HTTP | `error` |
|-----------|-----------|---------|------|---------|
| Hash coincide | `true` | `2` | 200 | `null` |
| Sin metadata SEP-58 | `false` | `0` | 200 | `"No SEP-58 metadata"` |
| Metadata parcial (sin repo/rev) | `false` | `1` | 200 | `"Metadata present but missing source_repo or source_rev"` |
| Hash no coincide | `false` | `2` | 200 | `null` (hashes distintos en body) |
| Contract ID inválido | — | — | **400** | `{ "error": "..." }` |
| Contrato no encontrado | `false` | `0` | 200 | `"Contract not found on network"` |
| Error de build/clone | `false` | `2` | 200 | mensaje descriptivo |

### Contrato de prueba (testnet)

Desplegado con `deploy-workspace/build-and-deploy.sh`:

```
contract_id:  CDZIBWL67BFXPUKXEKYMIXH5AGLUBJVS4MW5EO6FHHNYX7IGRPBQVHFQ
onchain_hash: 4bfaf0a238102c1febe3e634787dfec13d4e20311f614a180062198980877d45
source_repo:  https://github.com/stellar/soroban-examples
source_rev:   7b168174ae1268dab91a0190d80a94ab7ff41b59
bldopt:       --profile=release, --package=soroban-increment-contract, --manifest-path=increment/Cargo.toml
```

### Cómo probar

```powershell
cd backend
cargo run
# Server listening on 0.0.0.0:8088

# Health check
Invoke-RestMethod -Uri "http://localhost:8088/health"

# Verificación completa (~2–3 min por el build Docker)
$body = '{"contract_id":"CDZIBWL67BFXPUKXEKYMIXH5AGLUBJVS4MW5EO6FHHNYX7IGRPBQVHFQ"}'
Invoke-RestMethod -Uri "http://localhost:8088/verify" -Method POST `
  -ContentType "application/json" -Body $body -TimeoutSec 600

# Contract ID inválido → HTTP 400
$bad = '{"contract_id":"INVALIDO"}'
Invoke-RestMethod -Uri "http://localhost:8088/verify" -Method POST `
  -ContentType "application/json" -Body $bad
```

Respuesta esperada (contrato demo):
```json
{
  "verified": true,
  "verification_level": 2,
  "wasm_hash_match": true,
  "onchain_hash": "4bfaf0a238102c1febe3e634787dfec13d4e20311f614a180062198980877d45",
  "rebuilt_hash": "4bfaf0a238102c1febe3e634787dfec13d4e20311f614a180062198980877d45",
  "error": null
}
```

---

## Configuración del entorno de desarrollo (Windows)

Rust no venía instalado. El setup completo fue:

### 1. Instalar Rust

```powershell
winget install Rustlang.Rustup --source winget --accept-source-agreements
```

Toolchain instalado: `stable-x86_64-pc-windows-gnu`

```powershell
rustup toolchain install stable-x86_64-pc-windows-gnu
rustup default stable-x86_64-pc-windows-gnu
```

### 2. Instalar GCC (linker para el toolchain GNU)

MSYS2 ya estaba en `C:\msys64` pero sin paquetes de compilación. pacman/OpenSSL tiene problemas con los certificados SSL del sistema, así que los paquetes se descargaron con PowerShell (WinHTTP) y se instalaron con `pacman -U`:

```powershell
# Descargar paquetes con PowerShell (evita el problema SSL de OpenSSL)
$pkgs = @("mingw-w64-x86_64-gcc-15.2.0-13-any.pkg.tar.zst", ...)
$pkgs | ForEach-Object {
    Invoke-WebRequest -Uri "https://repo.msys2.org/mingw/mingw64/$_" -OutFile "C:\msys64\tmp\$_" -UseBasicParsing
}

# Instalar localmente (sin descargas, sin SSL)
C:\msys64\usr\bin\bash.exe -lc "pacman -U --noconfirm /tmp/mingw-w64-x86_64-*.pkg.tar.zst"
```

GCC instalado en: `C:\msys64\mingw64\bin\gcc.exe`

### 3. PATH requerido en cada terminal nueva

```powershell
$env:Path += ";$env:USERPROFILE\.cargo\bin;C:\msys64\mingw64\bin"
```

> Para que sea permanente, agregar ambas rutas al PATH de usuario desde  
> *Panel de control → Variables de entorno del sistema*.

---

## Cómo correr el servidor

```powershell
cd backend
$env:CARGO_HTTP_CHECK_REVOKE = "false"   # si cargo falla por certificados SSL
cargo run
```

Salida esperada:
```
INFO stellar_contract_verification: Server listening on 0.0.0.0:8088
```

### Verificar que funciona

```powershell
# Health check
Invoke-RestMethod -Uri "http://localhost:8088/health"
# {"status":"ok"}

# Verificar CORS
Invoke-WebRequest -Uri "http://localhost:8088/health" -UseBasicParsing `
  -Headers @{"Origin"="http://localhost:3000"} |
  ForEach-Object { $_.Headers['Access-Control-Allow-Origin'] }
# http://localhost:3000
```

> Si el puerto 8080 está ocupado (ej. XAMPP/Apache), usar `PORT=8088` en `.env`.

---

## Estado de fases

| Fase | Descripción | Estado |
|------|-------------|--------|
| B1 | Servidor Axum base | ✅ Completo |
| B2 | Módulo RPC — leer WASM desde Stellar | ✅ Completo |
| B3 | Módulo Metadata — parsear SEP-58 | ✅ Completo |
| B4 | Módulo Builder — git clone + docker run | ✅ Completo |
| B5 | Endpoint `POST /verify` — pipeline completo | ✅ Completo |
| F1–F4 | Frontend Next.js | ⏳ Pendiente |

---

## Binarios de prueba (`src/bin/`)

| Binario | Fase | Qué valida |
|---------|------|------------|
| `test_rpc` | B2 | Fetch WASM + SHA256 desde testnet |
| `test_metadata` | B3 | Parser SEP-58 con WASM sintéticos |
| `test_builder` | B4 | Allowlist, temp dir, clone (sin Docker) |
| `test_docker_build` | B4 | Build Docker de `hello_world` |
| `test_increment_verify` | B4+B5 | Rebuild + hash match del contrato demo |

Ejecutar con: `cargo run --bin <nombre>`
