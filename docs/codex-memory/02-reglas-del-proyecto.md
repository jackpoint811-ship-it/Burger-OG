> Estado: vivo
> Uso: memoria operativa para Codex/Burgers.exe

# Reglas del proyecto

## Jerarquía

- `AGENTS.md` es la regla dura del repositorio.
- `PROJECT.md` define la arquitectura canonical, contratos y roadmap de hitos.
- Esta memoria en `docs/codex-memory/` es apoyo operativo.
- Si hay contradicción, gana `AGENTS.md`.

## Workflow obligatorio

Todo cambio real debe seguir:

1. Crear rama nueva desde `v3` (`git checkout -b feat/v3-xx-... v3`).
2. Hacer cambios mínimos y atómicos.
3. Probar localmente (`git diff --check`, `npm run typecheck`, `npm run build:public`, `npm run build:chekeo`).
4. Commit con mensaje descriptivo.
5. Push a la rama remota (`git push origin feat/v3-xx-...`).
6. Crear Pull Request **obligatoriamente con base en `v3`** (`gh pr create --base v3 --head feat/v3-xx-...`) cuando el usuario apruebe el cierre o el prompt lo autorice explícitamente.

## Codex

Antes de implementar:

- Leer `AGENTS.md` y `PROJECT.md`.
- Leer `docs/codex-memory/00-indice.md`.
- Leer `docs/codex-memory/01-estado-actual.md`, `02-reglas-del-proyecto.md` y `22-v3-bitacora.md`.
- Leer `docs/codex-memory/08-agent-workflow.md` y `docs/codex-memory/09-checklists.md` cuando el cambio sea real.
- Usar Graphify si el cambio toca varios archivos o arquitectura, cuando la herramienta esté disponible.

## Arquitectura oficial V3

- Burgers.exe V3 opera exclusivamente con 2 apps oficiales:
  - `apps/public-order-v3`: PWA pública para clientes (React 19, Vite 6, Tailwind CSS v4, Zustand v5, TanStack Query v5, Radix UI).
  - `apps/internal-chekeo-v3`: Suite de operaciones internas, cocina KDS, conciliación de pagos y administración.
- Módulos compartidos:
  - `packages/config`: Contratos TypeScript, schemas Zod, resolución de assets R2 (`resolveCatalogAssetUrl`) y runtime flags.
  - `packages/ui`: Primitives UI accesibles sobre Radix UI y Tailwind CSS v4.
  - `functions/api`: Router centralizado Hono.js v4 (`[[route]].ts`) en Cloudflare Pages Functions con 12 sub-rutas tipadas.
- Cloudflare D1 (`BOG_MENU_DB`) es la source of truth de catálogo, pedidos, operación, corte y reportes.
- Cloudflare R2 (`BOG_MENU_ASSETS`) es la source of truth de assets de catálogo y banners.
- Google Sheets, Apps Script, V1 y carpetas históricas `apps/*-v2` se consideran obsoletas y eliminadas.

## Estética y Diseño V3 (Premium Casual)

- **Aesthetic**: Mantener la estética **Burgers.exe (Premium Casual Vibe)** (sustituyendo el estilo legacy cyberpunk/neón).
- **Temas**: Tema light-first por defecto (blanco cálido/crema suave `#F5F2EE`, tarjetas blancas `#FFFFFF`), con soporte completo para dark mode slate/carbón neutro (`#121212` / `#1E1E1E`).
- **Acento**: Verde bosque (`#16A34A` en light mode / `#22C55E` en dark mode).
- **Tipografía y Estilos**: Tipografía Inter, bordes sutiles (`--color-line`), sombras de elevación limpia (`--shadow-card`, `--shadow-panel`).
- **Layout Mobile-First**: Contenedor adaptativo (`--catalog-max-width: 768px`), grilla dinámica y targets táctiles de al menos 44px (`--touch-target-min`).

## Regla de ambientes

- Preview y producción nunca se mezclan.
- Preview y producción nunca deben compartir escritura de pedidos.
- Preview puede ser 1:1 en funciones, pero debe usar D1 y R2 separados.
- Local nunca debe escribir a producción por accidente.
- Si una configuración apunta a producción, debe documentarse como riesgo y requerir aprobación manual.

## Gobernanza y Auditoría V3

- Migración V3 completada al 100% (14/14 PRs).
- Las fases de auditoría post-migración, compliance, hardening y verificación se documentan en `docs/codex-memory/22-v3-bitacora.md` y `PROJECT.md`.
- No saltar fases de validación técnica ni omitir checks obligatorios.
- Antes de proponer el cierre de un hito, listar preguntas abiertas, bloqueadores y riesgos residuales.

## Restricciones

- No introducir dependencias nuevas sin autorización explícita.
- No cambiar backend, payloads, contratos de datos, nombres de campos, precios, tickets, promociones ni reglas comerciales sin autorización explícita.
- No tocar secretos, `.dev.vars`, `.wrangler/`, variables locales, credenciales ni tokens.
- Por defecto, usar PRs pequeños, atómicos y controlados con base en `v3`.
- No mezclar bugfix + rediseño + refactor sin autorización.
- Todo cambio de Burgers.exe debe terminar en PR cuando el usuario apruebe el cierre.
- El asistente crea el PR automáticamente cuando la rama ya esté subida; el usuario solo revisa y mergea.
- No hacer commit, push o PR cuando el prompt pida diagnóstico o pausa.
- No promover seeds destructivos ni migraciones de preview/testing a producción sin aprobación explícita.
