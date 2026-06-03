# Backend — Setup y estado de implementación

## B1 — Servidor Axum base

### Qué se implementó

| Archivo | Descripción |
|---------|-------------|
| `Cargo.toml` | Dependencias del proyecto |
| `src/main.rs` | Servidor Axum en puerto 8080, CORS, tracing, `GET /health` |
| `src/errors.rs` | Enum `AppError` con `IntoResponse` para cada variante |
| `.env` | Variables de entorno (`SOROBAN_RPC_URL`, `PORT`) |
| `Dockerfile` | Multi-stage build para producción |
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
```

### `AppError` — variantes y respuestas HTTP

| Variante | HTTP | Body JSON |
|----------|------|-----------|
| `ContractNotFound` | 404 | `{ "error": "Contract not found", "verified": false, "verification_level": 0 }` |
| `NoMetadata` | 200 | `{ "error": "No SEP-58 metadata", "verified": false, "verification_level": 0 }` |
| `BuildFailed(String)` | 200 | `{ "error": "<msg>", "verified": false, "verification_level": 2 }` |
| `InternalError(String)` | 500 | `{ "error": "<msg>", "verified": false, "verification_level": 0 }` |

### CORS

Configurado con `tower-http` para permitir exclusivamente el origen `http://localhost:3000`.  
Métodos permitidos: `GET`, `POST`, `OPTIONS`.

### Variables de entorno (`.env`)

```
SOROBAN_RPC_URL=https://soroban-testnet.stellar.org
PORT=8080
```

El binario carga el `.env` automáticamente al iniciar vía `dotenvy::dotenv()`.  
Si `PORT` no está definido, usa `8080` como valor por defecto.

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
# Desde la raíz del workspace, con el PATH correcto
cd backend
cargo run
```

Salida esperada:
```
INFO stellar_contract_verification: Server listening on 0.0.0.0:8080
```

### Verificar que funciona

```powershell
# Health check
Invoke-WebRequest -Uri "http://localhost:8080/health" -UseBasicParsing | Select-Object StatusCode, Content
# StatusCode: 200
# Content: {"status":"ok"}

# Verificar CORS
Invoke-WebRequest -Uri "http://localhost:8080/health" -UseBasicParsing `
  -Headers @{"Origin"="http://localhost:3000"} |
  ForEach-Object { $_.Headers['Access-Control-Allow-Origin'] }
# http://localhost:3000
```

---

## Fases siguientes

| Fase | Descripción | Depende de |
|------|-------------|------------|
| **B2** | Módulo RPC — leer WASM desde Stellar | B1 ✓ |
| **B3** | Módulo Metadata — parsear SEP-58 | B2 |
| **B4** | Módulo Builder — git clone + docker run | B3 |
| **B5** | Endpoint `POST /verify` — pipeline completo | B2, B3, B4 |
| **F1–F4** | Frontend Next.js | B1 ✓ (F1–F3 no necesitan backend) |
