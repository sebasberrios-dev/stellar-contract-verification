# UX Redesign Plan — rama `ux-redesign`

Plan de trabajo para el rediseño UX/UI del frontend de CSV, basado en el
prompt maestro de sistema de diseño, adaptado al stack real del proyecto.
Cada fase (U0–U6) es ejecutable como un prompt independiente y termina con
los mismos QA gates.

## Stack real (difiere del prompt maestro)

| Prompt maestro asume | Este proyecto tiene | Adaptación |
|---|---|---|
| Tailwind v3 + tailwind.config | **Tailwind v4** (`@theme` en globals.css) | Variables via `@theme` / `@theme inline`, no config JS |
| framer-motion instalado | No instalado | Instalar `motion` (framer-motion v12) en U4 — `pnpm add motion` |
| Dark/light con `.dark` | Dark-only (brand) | Sistema de variables dark-first; light mode queda U6-opcional |
| next/image para fotos | Solo SVG inline, cero `<img>` | N/A — no hay imágenes raster |

Regla del repo (AGENTS.md): **leer `node_modules/next/dist/docs/` antes de
escribir código** — Next 16 tiene breaking changes. Solo pnpm, nunca npm/yarn.

## QA gates (idénticos en cada fase)

1. `./node_modules/.bin/tsc --noEmit` → 0 errores (pnpm exec puede fallar por workspace.yaml)
2. `pnpm build` → exitoso
3. Verificación visual en `pnpm dev` (Turbopack; `rm -rf .next` si una ruta nueva da 404)
4. Sin overflow horizontal en 375px (DevTools iPhone SE)

---

## Diagnóstico (estado actual, commit a30ec9f)

### Funcional (bloqueante — arreglar antes de tocar estilos)
- **Ruta `/verify` no existe** pero `src/app/for-devs/tutorial/page.tsx:196`
  hace `router.push('/verify?id=...')` → 404 en el paso 4 del tutorial.

### Inconsistencias visuales
- **Colores hardcodeados en ~todos los componentes**: `#0a0b0f`, `#111318`,
  `#161920`, `#1e2130`, `bg-[#080e1a]`, `#00BFFF`, `#3B82F6`, `#1D4ED8`,
  gradientes inline `style={{ background: "linear-gradient(...)" }}`
  (tutorial/page.tsx:129). `globals.css` ya define `--background`, `--surface`,
  `--border` pero casi nadie las consume.
- **Dos fondos base distintos**: dashboard usa `#0a0b0f` (page.tsx:42) y
  for-devs/tutorial usan `#000000` (for-devs/page.tsx:169) — se siente como
  dos apps.
- **Tres escalas de gris mezcladas**: `slate-*` (dashboard), `gray-*`
  (for-devs links), `zinc-*` (Logo wordmark).
- **Dos implementaciones duplicadas de CodeBlock**: `for-devs/page.tsx:94` y
  `tutorial/page.tsx:66` — casi idénticas, estilos ligeramente distintos.
- **Botones sin altura fija**: `py-3`, `py-2.5`, `px-6 py-3` variables por
  página; el prompt exige `h-9`/`h-11`.

### Mobile / responsive
- **Navbar no responsive**: `Navbar.tsx` mete Logo + link + NetworkBadge +
  WalletButton en una fila; en 375px se aprieta/desborda. Sin hamburger.
  No es fixed, no reacciona al scroll.
- **FAQ con `maxHeight: 240px` hardcodeado** (for-devs/page.tsx:156): la
  respuesta larga de cache/rebuild se corta en pantallas angostas.
- **Secciones con `py-16` fijo** — el patrón es `py-16 md:py-32`.
- Inputs con placeholder de 56 chars (contract ID) sin label visible.

### Accesibilidad
- **Sin `focus-visible:ring`** en ningún elemento interactivo — navegación
  por teclado invisible.
- **Contraste bajo**: `text-slate-600` sobre `#0a0b0f` (footer "Built on
  Stellar", números de step) ≈ 3:1 — falla WCAG AA para texto pequeño.
- **Sin labels en formularios**: el input principal del dashboard solo tiene
  placeholder (VerificationForm.tsx:82).
- **Sin `prefers-reduced-motion`**: `animate-ping` del badge verified y las
  transiciones corren siempre.

### Rendimiento
- Animaciones actuales son CSS (bien), pero `StarryBackground`/`CircuitTraces`
  hay que auditarlas: si animan `top/left` o corren en canvas por JS, migrar a
  `transform` + compositor.
- Watermark `w-[600px]` fijo (page.tsx:52) — en mobile debería ser
  `w-[min(600px,90vw)]`.

---

## Fases

### U0 — Fix funcional + baseline (30 min)
**Archivos:** `src/app/verify/page.tsx` (nuevo) o edit en tutorial.

1. Crear ruta `/verify`: página que lee `?id=`, dispara el flujo GET-first
   existente (reusar `lookupContract`/`submitVerification` + `ResultPanel`),
   o —opción barata— redirect a `/?id=` y que el dashboard pre-cargue el input.
2. Screenshot baseline de las 3 páginas en desktop y 375px (comparación
   antes/después).

**Acceptance:** el paso 4 del tutorial ya no da 404.

### U1 — Design tokens en globals.css (el cimiento; nada visual cambia aún)
**Archivos:** `src/app/globals.css`.

1. Definir sistema HSL completo en `:root`:
   `--background` (fondo actual #0a0b0f ≈ `228 20% 5%`), `--foreground`,
   `--card` (#111318), `--card-hover` (#161920), `--border` (#1e2130),
   `--primary` (#00BFFF cyan), `--primary-foreground`, `--secondary`
   (#3B82F6), `--muted`, `--muted-foreground` (slate-400), `--accent`,
   `--destructive` (red-400), `--warning` (amber-400), `--success` (green-400).
2. Mapearlas en `@theme inline` para que Tailwind v4 genere las utilidades
   (`bg-background`, `text-muted-foreground`, `border-border`, etc.).
3. Estructura `.dark`-ready: los valores viven en `:root` hoy; si U6-opcional
   se hace, solo se agrega el bloque claro.
4. **No tocar componentes todavía** — esta fase solo crea el vocabulario.

**Acceptance:** build pasa, cero cambio visual (las variables existen pero
nadie las usa aún).

### U2 — Migración de colores + componentes base
**Archivos:** `src/components/ui/` (nuevos), todos los componentes existentes.

1. Crear primitivas en `src/components/ui/`:
   - `Button.tsx` — variants `primary | secondary | ghost`, tamaños `h-9 | h-11`,
     `text-sm font-medium`, `focus-visible:ring-2 focus-visible:ring-primary`,
     loading state con spinner (patrón ya existe en VerificationForm).
   - `Card.tsx` — `border border-border rounded-xl bg-card`,
     `hover:border-primary/50 transition-all duration-300`, sin sombras fuertes.
   - `Input.tsx` — **con label visible**, `bg-background border-border
     focus-visible:ring-ring`, error state `text-destructive`.
   - `CodeBlock.tsx` — **unificar los 2 duplicados** (for-devs + tutorial) en
     uno con prop `variant`.
2. Reemplazar TODOS los hex hardcodeados por utilidades de variables.
   Grep de control: `grep -rn '#0a0b0f\|#111318\|#1e2130\|#00BFFF\|#3B82F6\|bg-\[#' src/`
   debe devolver 0 (excepto Logo.tsx — el logo es arte, sus gradientes SVG se quedan).
3. Unificar fondo: `#000000` de for-devs/tutorial → `bg-background`.
4. Una sola escala de gris: `slate` via `--muted-foreground` (adiós gray-/zinc-).

**Acceptance:** grep de hex = 0 fuera de Logo/globals; las 3 páginas se ven
igual o mejor; tsc + build verdes.

### U3 — Navbar responsive con scroll state
**Archivos:** `src/components/Navbar.tsx`.

1. `fixed top-0 z-20 w-full` + spacer o `pt-[height]` en layouts.
2. Scroll listener (`useEffect` + `window.scrollY > 8`): al hacer scroll
   `bg-background/80 backdrop-blur-lg border-b border-border`; arriba del
   todo, transparente.
3. Hamburger en `< md`: panel con For Devs, NetworkBadge y WalletButton.
   Cerrar con Escape y click-outside. `aria-expanded` en el trigger.
4. Mantener `suppressHydrationWarning` (extensiones wallet inyectan clases).

**Acceptance:** en 375px todo control es accesible; sin overflow; el blur
aparece al scrollear.

### U4 — Animaciones (motion + CSS puro)
**Dependencia nueva:** `pnpm add motion`.
**Archivos:** `src/components/Reveal.tsx` (nuevo), heros de las 3 páginas.

1. `Reveal.tsx` con `useInView`: patrón `opacity 0→1, y 20→0, blur 14px→0,
   duration 0.5s`, `margin: "0px 0px -100px 0px"`, `once: true`. Aplicar a
   secciones de for-devs y tutorial (steps aparecen al scrollear).
2. Hero del dashboard: aurora background CSS puro — 2-3 blobs
   `radial-gradient` con `filter: blur(70px)` animados por `@keyframes`
   (solo `transform`, compositor thread), `will-change: transform` solo en
   los blobs. Fade inferior `linear-gradient(to bottom, transparent,
   hsl(var(--background)))`. Convive con StarryBackground o lo reemplaza
   (decidir visualmente).
3. `@media (prefers-reduced-motion: reduce)`: matar aurora, reveal y
   `animate-ping` (badge verified queda estático).

**Acceptance:** 60fps en el hero (DevTools Performance), reduced-motion
respetado, `once: true` en todos los reveals.

### U5 — Pase mobile por sección
**Archivos:** `page.tsx`, `for-devs/page.tsx`, `tutorial/page.tsx`.

Una sección por commit, sin tocar las demás:
1. **Dashboard:** watermark `w-[min(600px,90vw)]`; espaciado `py-16 md:py-32`;
   grid del ResultPanel ya es `sm:grid-cols-2` (ok).
2. **For-devs:** FAQ — reemplazar `maxHeight: 240px` por grid-rows animation
   (`grid-template-rows: 0fr → 1fr`) que no corta contenido; steps grid
   `gap-6 md:gap-12`; hero `text-4xl sm:text-5xl` → revisar contra jerarquía
   (`h1 text-5xl md:text-7xl` del sistema, adaptado a esta marca).
3. **Tutorial:** inputs de contract ID con `text-ellipsis`; `pre` con scroll
   horizontal propio (ya tiene `overflow-x-auto` — verificar en 375px);
   StepWrapper `pb-8 md:pb-12`.

**Acceptance:** cero overflow-x en 375px en las 3 páginas; texto legible sin zoom.

### U6 — Accesibilidad + polish final
**Archivos:** transversal.

1. Contraste: `text-slate-600` → `text-muted-foreground` (mínimo slate-500)
   donde el fondo sea `--background`; verificar 4.5:1 en texto < 18px.
2. `focus-visible:ring-2 ring-primary ring-offset-2 ring-offset-background`
   en todo elemento interactivo (ya cubierto si U2 se usó consistentemente).
3. Labels: input del dashboard con `<label>` visible ("Contract ID").
4. Links externos: auditar `target="_blank" rel="noopener noreferrer"` (los
   sociales ya lo tienen).
5. z-index: confirmar escala 0 / 1 (watermark) / 10 / 20 (navbar) — ya casi
   correcta, documentarla en un comentario en globals.css.
6. **Opcional (solo si sobra tiempo):** light mode — agregar bloque `.light`
   con los valores invertidos. El brand es dark; no es prioridad para el RFP.

**Acceptance:** Lighthouse a11y ≥ 95 en las 3 páginas.

---

## Reglas duras (del prompt maestro, vigentes en todas las fases)

- ❌ Colores hardcodeados nuevos — siempre variables (excepción: Logo.tsx)
- ❌ Animar `margin/left/top` — solo `transform` y `opacity`
- ❌ `IntersectionObserver` margin < -100px en mobile
- ❌ z-index fuera de la escala 0/1/10/20/30/50
- ❌ overflow-x en body — cada sección contiene el suyo
- ✅ Mobile-first, `once: true`, `prefers-reduced-motion`, focus-visible

## Orden y dependencias

```
U0 (fix /verify) ──┐
U1 (tokens) ───────┴─→ U2 (migración+primitivas) ─→ U3 (navbar)
                                                  ─→ U4 (animaciones)
                                                  ─→ U5 (mobile)  ─→ U6 (a11y)
```

U3/U4/U5 son paralelizables después de U2. Commit por fase, push de la rama
`ux-redesign`, y PR contra `Frontend` al final (no merge directo).
