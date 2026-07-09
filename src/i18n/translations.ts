/**
 * UI copy in English (default) and Spanish. Code blocks, CLI commands,
 * SEP-58 field names, API paths, and error codes are NOT translated — they
 * live in the components and stay in English on purpose.
 *
 * Strings may contain {token} markers rendered as inline <code> by
 * renderTokens() — keep the token text identical in both languages.
 */

export const en = {
  nav: {
    forDevs: "For Devs",
  },
  home: {
    heroTitle1: "Verify smart contracts.",
    heroTitle2: "Trust the source.",
    heroSub:
      "CSV Verify rebuilds Soroban contracts from their public source and proves the on-chain WASM matches. Secure. Transparent. Verified.",
  },
  form: {
    label: "Contract ID",
    checkingCache: "Checking cache...",
    rebuilding: "Rebuilding from source... This may take 2–6 minutes",
    verify: "Verify Contract",
    errTooShort: "Contract ID is too short",
    errStartC: "Contract ID must start with C",
    errRequired: "Contract ID is required",
  },
  badges: {
    sep58: "SEP-58 Compatible",
    cli: "Official Stellar CLI",
    repro: "Reproducible Builds",
    oss: "Open Source",
  },
  accordion: {
    heading: "Learn more",
    sep58Title: "What is SEP-58?",
    sep58Body:
      "SEP-58 is a Stellar Ecosystem Proposal that defines a standard for embedding source-code metadata directly inside a compiled Soroban WASM binary. This allows anyone to independently verify that a deployed contract was built from a specific, auditable source repository.",
    fieldsLabel: "Metadata fields",
    fields: {
      source_repo: "URL of the public source repository",
      source_rev: "Git commit SHA pinned at build time",
      bldimg: "Docker image used for reproducible build",
      tarball_sha256: "SHA-256 hash of the source tarball",
    },
    howTitle: "How verification works",
    howSteps: [
      "Fetch the deployed WASM bytecode for the given contract ID from the Stellar RPC node.",
      "Extract the {contractmetav0} custom section embedded in the WASM binary.",
      "Parse the SEP-58 fields ({source_repo}, {source_rev}, {bldimg}).",
      "Clone the repository at the exact commit referenced by {source_rev}.",
      "Reproduce the build inside an isolated Docker container using the {bldimg} image.",
      "Compare the resulting WASM hash with the on-chain bytecode — a match means cryptographic verification.",
    ],
    whyTitle: "Why this matters",
    whyBody:
      "Smart contracts control real assets. Without source verification, users must blindly trust that the bytecode on-chain matches the audited source code — a gap that has led to multi-million dollar exploits in other ecosystems.",
    whyPoints: [
      {
        head: "Trust minimisation",
        body: "Anyone can reproduce the build and check the hash without relying on a third party.",
      },
      {
        head: "Audit traceability",
        body: "Security auditors can confirm that the audited commit is exactly what was deployed.",
      },
      {
        head: "Supply chain integrity",
        body: "Pinning the Docker build image prevents toolchain substitution attacks.",
      },
      {
        head: "Ecosystem confidence",
        body: "Verified contracts signal professionalism and attract more users and integrators.",
      },
    ],
  },
  result: {
    requestFailed: "Request Failed",
    statusVerified: "Contract Verified",
    statusMismatch: "Hash Mismatch",
    statusFailed: "Build Failed",
    statusUnverified: "Not Verified",
    cached: "Cached",
    contract: "Contract",
    repository: "Repository",
    commit: "Commit",
    buildImage: "Build Image",
    verifier: "Verifier",
    processed: "Processed",
    buildFlags: "Build Flags",
    hashMatch: "Hash Match",
    level: "Level",
  },
  verifyPage: {
    back: "← Dashboard",
    title: "Verify a Contract",
    sub: "Paste a Contract ID — cached results return instantly.",
  },
  forDevs: {
    back: "← Dashboard",
    pill: "⚡ 5 min setup",
    heroTitle: "Make Your Contract",
    heroTitleAccent: "Verifiable",
    heroSub:
      "Embed SEP-58 metadata so anyone can verify your source code matches what's deployed on Stellar.",
    netTestnet: "Testnet",
    netMainnet: "Mainnet — coming soon",
    ctaTutorial: "View full tutorial →",
    sep58CardTitle: "Build metadata embedded in your WASM",
    sep58CardBody:
      "SEP-58 links your deployed contract to its exact source code on GitHub — source repo, commit hash, and the Docker image used to build it. CSV Verify reads this metadata to cryptographically verify your contract.",
    overviewTitle: "Quick overview — 4 steps",
    steps: [
      {
        title: "Commit your code",
        desc: "Push your contract source to a public GitHub repository.",
      },
      {
        title: "Build with --meta flags",
        desc: "Embed source_repo and source_rev directly into the WASM binary.",
      },
      {
        title: "Deploy to testnet",
        desc: "Publish your contract to Stellar testnet.",
      },
      {
        title: "Verify with CSV Verify",
        desc: "Submit the Contract ID and let CSV Verify reproduce the build.",
      },
    ],
    ctaFollowTutorial: "Follow the full tutorial →",
    ciTitle: "Automate SEP-58 in your CI/CD",
    ciBody:
      "Drop this workflow into {.github/workflows/} to embed metadata on every push to main.",
    ciCopy: "Copy template",
    faqTitle: "FAQ",
    faq: [
      {
        q: "Is mainnet supported?",
        a: "Testnet only for now — mainnet is coming soon. All verifications run against testnet automatically.",
      },
      {
        q: "How long does verification take?",
        a: "Already-verified contracts return instantly from cache. A first-time rebuild takes about 2–6 minutes while CSV Verify clones the repo and compiles with the official Stellar CLI Docker image.",
      },
      {
        q: "Is my source code safe?",
        a: "CSV Verify only reads public GitHub repos. No source code or private keys are stored.",
      },
      {
        q: "What if I don't have the exact commit hash?",
        a: "Use a branch name only if you must — but exact SHA guarantees full reproducibility. Branches move.",
      },
      {
        q: "What is contractmetav0?",
        a: "The custom WASM section where SEP-58 metadata lives. Generated automatically with --meta flags.",
      },
      {
        q: "Can I verify other developers' contracts?",
        a: "Yes. Any contract with SEP-58 can be verified by anyone — that's the essence of the standard.",
      },
      {
        q: "What does level 0 mean?",
        a: "No SEP-58 metadata found. Follow the tutorial to implement it.",
      },
    ],
    helpTitle: "Need help implementing SEP-58?",
    helpBody:
      "We help Soroban developers make their contracts verifiable. Reach out directly.",
    followX: "Follow on X",
    joinTelegram: "Join on Telegram",
  },
  tutorial: {
    back: "← Dashboard",
    breadcrumbTutorial: "Tutorial",
    pill: "⚡ Step-by-step guide",
    heroTitle: "How to get your contract",
    heroTitleAccent: "verified",
    heroSub:
      "Follow these 4 steps to embed SEP-58 metadata and get your Soroban contract showing as ✅ Contract Verified on CSV Verify.",
    prereqTitle: "Prerequisites",
    prereqs: [
      "stellar-cli installed (v26+)",
      "Contract compiles with stellar contract build",
      "Source code in a public GitHub repository",
      "No Docker needed on your machine — CSV Verify rebuilds your contract in its own sandbox",
    ],
    step1Title: "Commit your code and get the exact SHA",
    step1Body:
      "Use a pinned SHA — branches move, SHAs don't. The verifier rebuilds from this exact commit.",
    step2Title: "Build with SEP-58 metadata embedded",
    chooseType: "Choose your contract type:",
    tabSimple: "Simple contract",
    tabWorkspace: "Workspace / monorepo",
    bldoptWarning:
      "Every flag you pass to select your contract must also be passed as {--meta bldopt=}. The verifier replays those exact flags when rebuilding.",
    step3Title: "Deploy to Stellar Testnet",
    step3Body:
      "The command prints your Contract ID — starts with C, 56 characters long. Copy it.",
    step4Title: "Verify with CSV Verify",
    verifyButton: "Verify Contract →",
    orApi: "Or call the API directly:",
    apiTitle: "Query the API directly",
    apiBody:
      "The UI does this automatically, but you can also call the API from CI or scripts. Always check the cache first — if the contract is already verified it returns instantly.",
    apiCheckLabel: "Check if already verified",
    apiCheckSuffix: "(instant):",
    apiTriggerLabel: "Trigger verification",
    apiTriggerSuffix: "(2–6 min):",
    apiNote:
      "Only testnet is supported today. Pass {?network=testnet} — mainnet support is coming soon.",
    troubleTitle: "Troubleshooting",
    trouble: [
      {
        title: "No Metadata Found",
        desc: "Deployed without --meta flags. Rebuild with metadata from Step 2, redeploy, and use the new Contract ID.",
      },
      {
        title: "Hash Mismatch",
        desc: "source_rev points to wrong commit, missing bldopt flags, or uncommitted local changes were included. Always commit before building for deployment.",
      },
      {
        title: "Incomplete Metadata",
        desc: "Either source_repo or source_rev is missing. Both are required to attempt a rebuild.",
      },
      {
        title: "Repository is private",
        desc: "The verifier clones without authentication. Your repository must be public on GitHub.",
      },
    ],
    backToForDevs: "← Back to For Devs",
  },
};

export type Dict = typeof en;
export type Lang = "en" | "es";

export const es: Dict = {
  nav: {
    forDevs: "Para Devs",
  },
  home: {
    heroTitle1: "Verifica smart contracts.",
    heroTitle2: "Confía en el código.",
    heroSub:
      "CSV Verify reconstruye contratos Soroban desde su código fuente público y demuestra que el WASM on-chain coincide. Seguro. Transparente. Verificado.",
  },
  form: {
    label: "Contract ID",
    checkingCache: "Consultando caché...",
    rebuilding: "Reconstruyendo desde el código... Puede tardar 2–6 minutos",
    verify: "Verificar contrato",
    errTooShort: "El Contract ID es demasiado corto",
    errStartC: "El Contract ID debe empezar con C",
    errRequired: "El Contract ID es obligatorio",
  },
  badges: {
    sep58: "Compatible con SEP-58",
    cli: "CLI oficial de Stellar",
    repro: "Builds reproducibles",
    oss: "Código abierto",
  },
  accordion: {
    heading: "Aprende más",
    sep58Title: "¿Qué es SEP-58?",
    sep58Body:
      "SEP-58 es una propuesta del ecosistema Stellar que define un estándar para incrustar metadatos del código fuente directamente dentro del binario WASM compilado de Soroban. Esto permite que cualquiera verifique de forma independiente que un contrato desplegado fue construido desde un repositorio específico y auditable.",
    fieldsLabel: "Campos de metadatos",
    fields: {
      source_repo: "URL del repositorio público del código fuente",
      source_rev: "SHA del commit de Git fijado al momento del build",
      bldimg: "Imagen de Docker usada para el build reproducible",
      tarball_sha256: "Hash SHA-256 del tarball del código fuente",
    },
    howTitle: "Cómo funciona la verificación",
    howSteps: [
      "Se obtiene el bytecode WASM desplegado para el contract ID desde el nodo RPC de Stellar.",
      "Se extrae la sección custom {contractmetav0} incrustada en el binario WASM.",
      "Se parsean los campos SEP-58 ({source_repo}, {source_rev}, {bldimg}).",
      "Se clona el repositorio en el commit exacto referenciado por {source_rev}.",
      "Se reproduce el build dentro de un contenedor Docker aislado usando la imagen {bldimg}.",
      "Se compara el hash del WASM resultante con el bytecode on-chain — si coinciden, la verificación es criptográfica.",
    ],
    whyTitle: "Por qué importa",
    whyBody:
      "Los smart contracts controlan activos reales. Sin verificación del código fuente, los usuarios deben confiar a ciegas en que el bytecode on-chain coincide con el código auditado — una brecha que ha causado exploits multimillonarios en otros ecosistemas.",
    whyPoints: [
      {
        head: "Minimización de confianza",
        body: "Cualquiera puede reproducir el build y comprobar el hash sin depender de terceros.",
      },
      {
        head: "Trazabilidad de auditorías",
        body: "Los auditores de seguridad pueden confirmar que el commit auditado es exactamente lo que se desplegó.",
      },
      {
        head: "Integridad de la cadena de suministro",
        body: "Fijar la imagen Docker del build previene ataques de sustitución del toolchain.",
      },
      {
        head: "Confianza del ecosistema",
        body: "Los contratos verificados transmiten profesionalismo y atraen más usuarios e integradores.",
      },
    ],
  },
  result: {
    requestFailed: "La solicitud falló",
    statusVerified: "Contrato verificado",
    statusMismatch: "Hash no coincide",
    statusFailed: "Build fallido",
    statusUnverified: "No verificado",
    cached: "En caché",
    contract: "Contrato",
    repository: "Repositorio",
    commit: "Commit",
    buildImage: "Imagen de build",
    verifier: "Verificador",
    processed: "Procesado",
    buildFlags: "Flags de build",
    hashMatch: "Hash Match",
    level: "Nivel",
  },
  verifyPage: {
    back: "← Dashboard",
    title: "Verifica un contrato",
    sub: "Pega un Contract ID — los resultados en caché vuelven al instante.",
  },
  forDevs: {
    back: "← Dashboard",
    pill: "⚡ Configuración en 5 min",
    heroTitle: "Haz tu contrato",
    heroTitleAccent: "Verificable",
    heroSub:
      "Incrusta metadatos SEP-58 para que cualquiera pueda verificar que tu código fuente coincide con lo desplegado en Stellar.",
    netTestnet: "Testnet",
    netMainnet: "Mainnet — próximamente",
    ctaTutorial: "Ver el tutorial completo →",
    sep58CardTitle: "Metadatos de build incrustados en tu WASM",
    sep58CardBody:
      "SEP-58 vincula tu contrato desplegado con su código fuente exacto en GitHub — repositorio, hash del commit y la imagen Docker usada para construirlo. CSV Verify lee estos metadatos para verificar tu contrato criptográficamente.",
    overviewTitle: "Resumen rápido — 4 pasos",
    steps: [
      {
        title: "Haz commit de tu código",
        desc: "Sube el código de tu contrato a un repositorio público de GitHub.",
      },
      {
        title: "Compila con flags --meta",
        desc: "Incrusta source_repo y source_rev directamente en el binario WASM.",
      },
      {
        title: "Despliega a testnet",
        desc: "Publica tu contrato en la testnet de Stellar.",
      },
      {
        title: "Verifica con CSV Verify",
        desc: "Envía el Contract ID y deja que CSV Verify reproduzca el build.",
      },
    ],
    ctaFollowTutorial: "Sigue el tutorial completo →",
    ciTitle: "Automatiza SEP-58 en tu CI/CD",
    ciBody:
      "Copia este workflow en {.github/workflows/} para incrustar los metadatos en cada push a main.",
    ciCopy: "Copiar plantilla",
    faqTitle: "Preguntas frecuentes",
    faq: [
      {
        q: "¿Hay soporte para mainnet?",
        a: "Por ahora solo testnet — mainnet llegará pronto. Todas las verificaciones corren contra testnet automáticamente.",
      },
      {
        q: "¿Cuánto tarda la verificación?",
        a: "Los contratos ya verificados vuelven al instante desde la caché. Una reconstrucción por primera vez tarda unos 2–6 minutos mientras CSV Verify clona el repo y compila con la imagen Docker oficial de la CLI de Stellar.",
      },
      {
        q: "¿Mi código fuente está seguro?",
        a: "CSV Verify solo lee repositorios públicos de GitHub. No se almacena código fuente ni claves privadas.",
      },
      {
        q: "¿Y si no tengo el hash exacto del commit?",
        a: "Usa un nombre de rama solo si no queda otra — el SHA exacto garantiza reproducibilidad total. Las ramas se mueven.",
      },
      {
        q: "¿Qué es contractmetav0?",
        a: "La sección custom del WASM donde viven los metadatos SEP-58. Se genera automáticamente con los flags --meta.",
      },
      {
        q: "¿Puedo verificar contratos de otros desarrolladores?",
        a: "Sí. Cualquier contrato con SEP-58 puede ser verificado por cualquiera — esa es la esencia del estándar.",
      },
      {
        q: "¿Qué significa nivel 0?",
        a: "No se encontraron metadatos SEP-58. Sigue el tutorial para implementarlos.",
      },
    ],
    helpTitle: "¿Necesitas ayuda implementando SEP-58?",
    helpBody:
      "Ayudamos a desarrolladores de Soroban a hacer sus contratos verificables. Escríbenos directamente.",
    followX: "Síguenos en X",
    joinTelegram: "Únete al Telegram",
  },
  tutorial: {
    back: "← Dashboard",
    breadcrumbTutorial: "Tutorial",
    pill: "⚡ Guía paso a paso",
    heroTitle: "Cómo lograr que tu contrato quede",
    heroTitleAccent: "verificado",
    heroSub:
      "Sigue estos 4 pasos para incrustar metadatos SEP-58 y que tu contrato Soroban aparezca como ✅ Contrato verificado en CSV Verify.",
    prereqTitle: "Prerequisitos",
    prereqs: [
      "stellar-cli instalado (v26+)",
      "El contrato compila con stellar contract build",
      "Código fuente en un repositorio público de GitHub",
      "No necesitas Docker en tu máquina — CSV Verify reconstruye tu contrato en su propio sandbox",
    ],
    step1Title: "Haz commit de tu código y obtén el SHA exacto",
    step1Body:
      "Usa un SHA fijo — las ramas se mueven, los SHA no. El verificador reconstruye desde este commit exacto.",
    step2Title: "Compila con los metadatos SEP-58 incrustados",
    chooseType: "Elige tu tipo de contrato:",
    tabSimple: "Contrato simple",
    tabWorkspace: "Workspace / monorepo",
    bldoptWarning:
      "Cada flag que uses para seleccionar tu contrato también debe pasarse como {--meta bldopt=}. El verificador repite esos flags exactos al reconstruir.",
    step3Title: "Despliega a la Testnet de Stellar",
    step3Body:
      "El comando imprime tu Contract ID — empieza con C y tiene 56 caracteres. Cópialo.",
    step4Title: "Verifica con CSV Verify",
    verifyButton: "Verificar contrato →",
    orApi: "O llama a la API directamente:",
    apiTitle: "Consulta la API directamente",
    apiBody:
      "La interfaz lo hace automáticamente, pero también puedes llamar a la API desde CI o scripts. Consulta siempre la caché primero — si el contrato ya está verificado, responde al instante.",
    apiCheckLabel: "Comprueba si ya está verificado",
    apiCheckSuffix: "(instantáneo):",
    apiTriggerLabel: "Dispara la verificación",
    apiTriggerSuffix: "(2–6 min):",
    apiNote:
      "Hoy solo se soporta testnet. Pasa {?network=testnet} — el soporte para mainnet llegará pronto.",
    troubleTitle: "Solución de problemas",
    trouble: [
      {
        title: "No se encontraron metadatos",
        desc: "Se desplegó sin flags --meta. Recompila con los metadatos del Paso 2, vuelve a desplegar y usa el nuevo Contract ID.",
      },
      {
        title: "El hash no coincide",
        desc: "source_rev apunta al commit equivocado, faltan flags bldopt, o se incluyeron cambios locales sin commit. Haz commit siempre antes de compilar para desplegar.",
      },
      {
        title: "Metadatos incompletos",
        desc: "Falta source_repo o source_rev. Ambos son necesarios para intentar la reconstrucción.",
      },
      {
        title: "El repositorio es privado",
        desc: "El verificador clona sin autenticación. Tu repositorio debe ser público en GitHub.",
      },
    ],
    backToForDevs: "← Volver a Para Devs",
  },
};

export const translations: Record<Lang, Dict> = { en, es };
