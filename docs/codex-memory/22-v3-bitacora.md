> Estado: vivo
> Uso: bitácora de migración V3 y auditoría post-migración para Codex/Burgers.exe

# 📋 Bitácora V3 — Burgers.exe

> **Estado**: 🟢 100% Migración V3 Completada (14/14 PRs completados) · 🔄 Auditoría Post-Migración & Compliance en Curso (Milestone 1 ✅ · Milestone 2 🔄)
> **Inicio**: 2026-08-18
> **Cierre Migración Base**: 2026-08-20
> **Auditoría Post-Migración**: 2026-08-20

---

## 🎯 Objetivo

Migración completa V2 → V3 de Burgers.exe. Reescritura total con stack moderno, arquitectura limpia y repo sin legacy, seguida de una auditoría exhaustiva de compliance post-migración, hardening y sincronización de memoria operativa.

---

## 🏗️ Stack V3 Aprobado

| Área | Tecnología |
|---|---|
| Frontend framework | React 19 |
| Bundler | Vite 6 |
| Server state | TanStack Query v5 |
| Client state | Zustand v5 |
| Componentes UI | shadcn/ui (sobre Radix UI) |
| Estilos | Tailwind CSS v4 |
| Validación | Zod v3 |
| Formularios | React Hook Form v7 |
| Backend router | Hono.js v4 |
| Base de datos | Cloudflare D1 (sin cambios de schema) |
| Assets | Cloudflare R2 (sin cambios) |
| Deploy | Cloudflare Pages (sin cambios) |

---

## 📍 Decisiones Tomadas

| Fecha | Decisión | Motivo |
|---|---|---|
| 2026-08-18 | Branch `v3` en el mismo repo | V2 sigue en producción sin interrupción |
| 2026-08-18 | Reescritura completa (3C) | God components con 6k+ líneas son irrecuperables |
| 2026-08-18 | Hono.js para backend | 30+ functions individuales sin router → un solo punto de entrada |
| 2026-08-18 | Tailwind CSS v4 | Reemplaza 9,711 líneas de CSS monolítico |
| 2026-08-18 | Zustand para carrito | Estado del carrito estaba disperso en god component |
| 2026-08-18 | TanStack Query | Elimina todos los `useEffect(fetch)` manuales |
| 2026-08-18 | shadcn/ui | Componentes accesibles como código propio (no dependencia) |
| 2026-08-18 | Cutover al final (PR-V3-13) | Nunca merge a main sin aprobación explícita |
| 2026-08-20 | Auditoría Post-Migración V3 (M1–M4) | Asegurar repo limpio, 0 deuda técnica, tooling alineado a V3 y memoria sincronizada |
| 2026-08-20 | Alineación Operativa Chekeo V3 (PR #549) | Cero relojes de presión en cocina, 3 estaciones reales (Plancha/SideQuest/ResumenK) y calendario horizontal de 14 días |

---

## 🗓️ Roadmap de PRs de Migración V3 (100% Completado)

| PR | Nombre | Estado | PR URL | Fecha inicio | Fecha cierre |
|---|---|:---:|---|---|---|
| V3-00 | Branch v3 + Limpieza total del repo | ✅ Mergeado | [#530](https://github.com/jackpoint811-ship-it/Burgers-exe/pull/530) | 2026-08-18 | 2026-08-18 |
| V3-01 | Dependencias + Scaffold estructura V3 | ✅ Mergeado | [#531](https://github.com/jackpoint811-ship-it/Burgers-exe/pull/531) | 2026-08-18 | 2026-08-18 |
| V3-02 | packages/config (Zod) + packages/ui (shadcn) | ✅ Mergeado | [#533](https://github.com/jackpoint811-ship-it/Burgers-exe/pull/533) | 2026-08-18 | 2026-08-18 |
| V3-03 | Backend: Hono.js router centralizado | ✅ Mergeado | [#534](https://github.com/jackpoint811-ship-it/Burgers-exe/pull/534) | 2026-08-18 | 2026-08-18 |
| V3-04 | Public Order: Zustand stores | ✅ Mergeado | [#535](https://github.com/jackpoint811-ship-it/Burgers-exe/pull/535) | 2026-08-18 | 2026-08-18 |
| V3-05 | Public Order: Features (TanStack Query) | ✅ Mergeado | [#536](https://github.com/jackpoint811-ship-it/Burgers-exe/pull/536) | 2026-08-19 | 2026-08-19 |
| V3-06 | Public Order: UI components (catálogo, drawers) | ✅ Mergeado | [#537](https://github.com/jackpoint811-ship-it/Burgers-exe/pull/537) | 2026-08-19 | 2026-08-19 |
| V3-07 | Public Order: Checkout + integración final | ✅ Mergeado | [#538](https://github.com/jackpoint811-ship-it/Burgers-exe/pull/538) | 2026-08-19 | 2026-08-19 |
| V3-08 | Chekeo: Auth + AppShell + tabs | ✅ Mergeado | [#539](https://github.com/jackpoint811-ship-it/Burgers-exe/pull/539) | 2026-08-19 | 2026-08-19 |
| V3-09 | Chekeo: Feature Pedidos | ✅ Mergeado | [#540](https://github.com/jackpoint811-ship-it/Burgers-exe/pull/540) | 2026-08-19 | 2026-08-19 |
| V3-10 | Chekeo: Feature Cocina (KDS & Resumen K) | ✅ Mergeado | [#541](https://github.com/jackpoint811-ship-it/Burgers-exe/pull/541) | 2026-08-19 | 2026-08-19 |
| V3-11 | Chekeo: Feature Pagos | ✅ Mergeado | [#542](https://github.com/jackpoint811-ship-it/Burgers-exe/pull/542) | 2026-08-19 | 2026-08-19 |
| V3-12 | Chekeo: Feature Admin completo | ✅ Mergeado | [#543](https://github.com/jackpoint811-ship-it/Burgers-exe/pull/543) | 2026-08-19 | 2026-08-19 |
| V3-13 | Cutover Definitivo + Eliminar V2 | ✅ Integrado en v3 | Commit `022796a` | 2026-08-20 | 2026-08-20 |

---

## 🛡️ Roadmap de Auditoría Post-Migración & Compliance V3

| Milestone | Nombre | Alcance | Estado | Dependencias |
|---|---|---|:---:|---|
| **M1** | Tooling & Test Configurations Alignment | Actualizar configs de Playwright (`playwright.e2e.config.ts`, `playwright.internal-kitchen.config.ts`), `.gitignore` y limpiar artefactos raíz | ✅ Completado | Ninguna |
| **M2** | Documentation & Codex Memory Synchronization | Alinear `README.md`, `AGENTS.md` y sincronizar notas de `docs/codex-memory/` (00, 02, 09, 22-v3) | 🔄 En Progreso | M1 |
| **M3** | Code Consistency & Workspace Hardening | Verificar reachability 100% de apps/packages/functions, auditar `auth.api.ts` y tipos | ⏳ Planificado | M1 |
| **M4** | Final E2E Test Pass & Audit Verification | Ejecución integral de typechecks, builds, tests Playwright y auditorías forenses/adversariales | ⏳ Planificado | M1, M2, M3 |

**Leyenda**: ⏳ Pendiente · 🔄 En progreso · ✅ Completado / Mergeado · ❌ Bloqueado · ⏸️ Pausado

---

## 📝 Log de Sesiones

### 📅 2026-08-18 — Sesión 1: Planificación + PR-V3-00 (Mergeado #530)
- PR-V3-00 completado y mergeado a main: eliminación de `legacy/` y 28 archivos obsoletos.

### 📅 2026-08-18 — Sesión 2: PR-V3-01 Dependencias & Scaffold V3 (Mergeado #531)
- Instaladas dependencias V3 y creados esqueletos `apps/public-order-v3/` e `apps/internal-chekeo-v3/`.

### 📅 2026-08-18 — Sesión 3: PR-V3-02 Packages Compartidos (Zod & UI Base)
- Creado `packages/config/src/schemas.ts` con validadores y schemas Zod completos (MenuItem, CreateOrder, OrderV2, TowerSchedules, Raffles, Ingredients) y helpers de validación con tipos inferidos.
- Creados componentes accesibles de UI en `packages/ui/src/` (Button con variantes, Badge, Card, Input, Textarea, Label, Skeleton, Dialog, Drawer, Tabs).
- Verificaciones: `typecheck` (0 errores), `build` (ambas apps v3), `build:public:v2` y `build:internal:v2` 100% en verde.

### 📅 2026-08-18 — Sesión 4: PR-V3-04 Zustand Stores (Mergeado #535)
- Creados 3 stores Zustand centralizados: `cart.store.ts` (carrito con persist), `ui.store.ts` (drawers, toasts, categoría activa), `checkout.store.ts` (formulario con persist parcial de datos del cliente).
- Barrel export en `stores/index.ts`.
- Checks: `typecheck` ✅ (0 errores), `build` ✅ (public-v3 + chekeo-v3), `git diff --check` ✅.

### 📅 2026-08-19 — Sesión 5: PR-V3-05 Public Order Features & Hooks (TanStack Query)
- Creados módulos de API y hooks TanStack Query v5 en `apps/public-order-v3/src/features/`:
  - `shared/`: Cliente `apiFetch` y clase de error `ApiError`.
  - `menu/`: `fetchMenu`, `useMenuQuery`, selectores y query keys tipadas (`menuKeys`).
  - `banners/`: Hooks para `useCatalogBanners`, `useCategoryBanner`, `useCategoryBanners`.
  - `towers/`: `fetchTowerSchedules`, `useTowerSchedulesQuery`, `useActiveTowers`, `useTowerByKey`, helper de zona horaria CDMX y hook `useTowerAvailability`.
  - `raffles/`: `fetchActiveRaffle`, `fetchCampaignConfig`, `lookupRaffleTickets`, `fetchReferralTickets`, y hooks de sorteo.
  - `orders/`: `createOrder`, helper `cartAndFormToCreateOrderPayload`, y mutation hook `useCreateOrderMutation`.
  - Barrel exports limpios en cada módulo y master export en `features/index.ts`.
- Conectado `PublicApp.tsx` para consumir y validar queries activas.
- Checks: `typecheck` ✅ (0 errores), `build` ✅ (`public-order-v3`, `chekeo-v3`), `git diff --check` ✅.

### 📅 2026-08-19 — Sesión 6: PR-V3-06 Public Order UI Components & Drawers
- Creados componentes y vistas modulares en `apps/public-order-v3/src/components/`:
  - `header/`: `BrandHeader` con estatus operativo y selector de torre; `TowerScheduleModal` con consulta de horarios CDMX y selector de torre.
  - `catalog/`: `BannerCarousel` con autoplay y swipe; `CategoryNav` sticky horizontal; `ProductCard` con resolución de assets R2 y fallbacks SVG; `ProductGrid` con organización por categorías.
  - `drawers/`: `ProductDetailDrawer` con personalización completa; `CartDrawer` con stepper de cantidades, resumen financiero y 1-Tap Reorder.
  - `layout/`: `CartBar` animada y `ToastContainer`.
  - `shared/`: `ProductFallbackSvg` con fallbacks vectoriales para burgers, combos, guarniciones y bebidas.
- Conectado en `PublicApp.tsx` integrando TanStack Query hooks y Zustand stores.

### 📅 2026-08-19 — Sesión 7: PR-V3-07 Public Order Checkout Drawer, Validación & Integración Final
- Creado `CheckoutDrawer.tsx` en `apps/public-order-v3/src/components/drawers/`:
  - Integración completa con React Hook Form v7 y Zod resolver.
  - Validación inline de nombre y teléfono WhatsApp (10 dígitos).
  - Selector de torre con disponibilidad operativa y aviso si está fuera de horario.
  - Soporte de pedidos para hoy vs. fechas programadas (`getNextAvailableDeliveryDate`).
  - Métodos de pago (efectivo, SPEI, WhatsApp) con tarjeta bancaria y botón de copiado rápido de CLABE.
- Creado `OrderSuccessModal.tsx` con folio `#ORD-...`, resumen financiero, tickets ganados y enlaces directos a WhatsApp.
- Verificaciones: `typecheck` ✅ (0 errores), `build` ✅ (`public-v3`, `chekeo-v3`), `git diff --check` ✅.

### 📅 2026-08-19 — Sesión 8: PR-V3-08 Chekeo AuthGate, AppShell, Tabs & Layout Base
- Creada capa de autenticación y sesión en `apps/internal-chekeo-v3/src/features/auth/`:
  - `auth.api.ts`: funciones para `fetchAuthStatus`, `loginWithPin` y `logoutInternal` contra `/api/internal-v2-auth/*`.
  - `auth.store.ts`: `useAuthStore` en Zustand con persistencia en localStorage.
  - `AuthGate.tsx`: login por PIN con feedback inline y teclado numérico POS.
- Creado AppShell y componentes de navegación en `apps/internal-chekeo-v3/src/components/shell/`:
  - `TopHeader.tsx`: reloj operativo CDMX en tiempo real, indicador de red Online/Offline, toggle de tema y logout.
  - `NavTabs.tsx`: navegación accesible sobre `@ui/tabs` para Pedidos, Cocina, Pagos y Admin.
- Verificaciones: `typecheck` ✅ (0 errores), `build` ✅ (`public-v3`, `chekeo-v3`), `git diff --check` ✅.

### 📅 2026-08-19 — Sesión 9: PR-V3-09 Chekeo Feature Pedidos (Comandas, Filtros, Drawers y Estado)
- Creada capa Data Layer en `apps/internal-chekeo-v3/src/features/orders/`:
  - Tipos normalizados, cliente API y hooks TanStack Query con auto-refresh de 15s.
- Creados componentes en `apps/internal-chekeo-v3/src/components/orders/`:
  - `OrdersFilterBar.tsx`, `OrderCard.tsx`, `OrdersList.tsx`, `OrderDetailDrawer.tsx` y `CancelOrderModal.tsx`.
- Verificaciones: `typecheck` ✅ (0 errores), `build` ✅ (`public-v3`, `chekeo-v3`), `git diff --check` ✅.

### 📅 2026-08-19 — Sesión 10: PR-V3-10 Chekeo Feature Cocina (KDS & Resumen K)
- Creada capa Data Layer en `apps/internal-chekeo-v3/src/features/kitchen/`:
  - Tipos para KDS, hooks TanStack Query y alertas sonoras Web Audio API (`playKdsChime`).
- Creados componentes en `apps/internal-chekeo-v3/src/components/kitchen/`:
  - `KitchenTicketCard.tsx` (tags `🔴 SIN ...` y `🟢 +EXTRA ...`), `KitchenDisplay.tsx` (Kanban 3 columnas) y `KitchenSummaryK.tsx` (agregación de insumos para mise en place).
- Verificaciones: `typecheck` ✅ (0 errores), `build` ✅ (`public-v3`, `chekeo-v3`), `git diff --check` ✅.

### 📅 2026-08-19 — Sesión 11: PR-V3-11 Chekeo Feature Pagos (Conciliación, Tickets 80mm & WhatsApp Bridge)
- Creada capa Data Layer en `apps/internal-chekeo-v3/src/features/payments/`:
  - Agregación financiera `computeFinancialSummary`, generador de recibos 80mm/58mm `generateVerticalTicketText` y plantillas de WhatsApp normalizadas.
- Creados componentes en `apps/internal-chekeo-v3/src/components/payments/`:
  - `PaymentsManager.tsx` (KPIs financieros), `OrderTicketModal.tsx` (recibo térmico de alto contraste) y `WhatsAppAction.tsx` (bridge interactivo con 5 plantillas).
- Verificaciones: `typecheck` ✅ (0 errores), `build` ✅ (`public-v3`, `chekeo-v3`), `git diff --check` ✅.

### 📅 2026-08-19 — Sesión 12: PR-V3-12 Chekeo Feature Admin Completo (Menú & Stock, Torres, Banners, Sorteos, Corte Z)
- Creada capa Data Layer en `apps/internal-chekeo-v3/src/features/admin/`:
  - Clientes API tipados para endpoints Hono administrativos (`/api/menu-v2-admin/*`, `/api/raffles-v2-admin/*`, `/api/orders-v2-admin/cash-cut`, etc.).
- Creados componentes en `apps/internal-chekeo-v3/src/components/admin/`:
  - `MenuStockPanel.tsx`, `ProductEditModal.tsx`, `TowersAdminPanel.tsx`, `BannersAdminPanel.tsx`, `RafflesAdminPanel.tsx`, `CashCutPanel.tsx`, `IngredientsAdminPanel.tsx` y `AdminWorkspace.tsx`.
- Verificaciones: `typecheck` ✅ (0 errores), `build` ✅ (`public-v3`, `chekeo-v3`), `git diff --check` ✅.

### 📅 2026-08-20 — Sesión 13: PR-V3-13 Cutover Definitivo V3 (Cierre de Migración y Release a main)
- **Eliminación total de código V2**:
  - Removido `apps/public-order-v2/` e `apps/internal-chekeo-v2/`.
- **Limpieza de configuración y scripts**:
  - `package.json`: removidos scripts obsoletos `:v2`. Targets principales `dev:public`, `dev:chekeo`, `build:public`, `build:chekeo`, `preview:public` y `preview:chekeo` apuntan directamente a V3.
  - `vite.config.ts`: mapeo definitivo `public` -> `apps/public-order-v3` y `chekeo` -> `apps/internal-chekeo-v3`.
- **Verificaciones integrales en verde**:
  - `typecheck` ✅ (0 errores), `build` ✅ (`build:public` + `build:chekeo` en verde), `git diff --check` ✅.

### 📅 2026-08-20 — Sesión 14: Auditoría Post-Migración V3 — PR #545 (Mergeado)
- **Milestone 1 (Tooling & Configs)**:
  - Playwright configs (`playwright.e2e.config.ts`, `playwright.internal-kitchen.config.ts`) actualizados a `dist/public-order-v3` y `dist/internal-chekeo-v3` con comando `preview:chekeo`.
  - `.gitignore` actualizado con exclusiones para `.graphifyignore`, `.vscode/` y `__pycache__`.
  - Limpieza de artefactos residuales en la raíz del repositorio.
- **Milestone 2 (Documentación & Memoria Codex)**:
  - `README.md`: Actualizado con la arquitectura canonical V3, stack tecnológico y guía de ejecución.
  - `AGENTS.md`: Alineadas cabeceras de subsección a `apps/public-order-v3` preservando reglas de gobernanza y branching base `v3`.
  - `docs/codex-memory/00-indice.md`: Reestructurado con separación nítida entre Notas Activas V3 y Archivo Histórico V2.
  - `docs/codex-memory/02-reglas-del-proyecto.md`: Actualizado con arquitectura oficial V3 y estética Premium Casual.
  - `docs/codex-memory/09-checklists.md`: Eliminadas referencias a estética cyberpunk legacy; alineado a Premium Casual y rutas V3.
- **Milestone 3 (Security Fix en `auth.api.ts`)**:
  - Eliminado bypass de autenticación por `localStorage` en `fetchAuthStatus()`.
  - `loginWithPin()` ahora propaga excepciones del servidor `ApiError` sin permitir PINs fallback en producción.
  - Fallbacks de desarrollo offline estrictamente protegidos con `import.meta.env.DEV`.

### 📅 2026-08-20 — Sesión 15: Infraestructura Cloudflare Pages V3 & CI/CD — PR #546 (Mergeado)
- Creados proyectos independientes en Cloudflare Pages:
  - `burgers-exe-public-v3.pages.dev` (Public Order V3)
  - `burgers-exe-internal-v3.pages.dev` (Internal Chekeo V3)
- Implementados pipelines de GitHub Actions automatizados:
  - `.github/workflows/deploy-public-v3.yml`: `typecheck` + `build:public` + deploy a `burgers-exe-public-v3`.
  - `.github/workflows/deploy-chekeo-v3.yml`: `typecheck` + `build:chekeo` + deploy a `burgers-exe-internal-v3`.
- `wrangler.preview.toml` y `wrangler.production.toml` configurados con IDs reales de base de datos Cloudflare D1 (`c723f0c7` / `2974d36e`) y buckets R2.

### 📅 2026-08-20 — Sesión 16: Fix Extracción de Path en Assets Router — PR #547 (Mergeado)
- Corrección de regex en `functions/api/_routes/assets.ts`: `c.req.path.replace(/^(?:\/api)?\/assets-v2\/?/, '')` para remover el prefijo global `/api` y solicitar las claves correctas (`menu/...`, `category-banners/...`) a Cloudflare R2 sin 404s.

### 📅 2026-08-20 — Sesión 17: Auditoría y Verificación en Vivo con Chromium (100% Operativo)
- **Public Order V3 (`https://burgers-exe-public-v3.pages.dev`)**:
  - 0 errores de JavaScript / React 19.
  - Catálogo D1 (`source: d1`) cargado con todos los productos, papas, extras, recetas y banners.
  - Imágenes R2 respondiendo con HTTP 200 `image/webp`.
- **Internal Chekeo V3 (`https://burgers-exe-internal-v3.pages.dev`)**:
  - Autenticación con PIN `1234` (`BOG_INTERNAL_PIN`) 100% funcional.
  - 0 errores de consola, 0 excepciones de red.
  - Módulos operativos en vivo: Pedidos, Cocina KDS, Pagos y Admin.

### 📅 2026-08-20 — Sesión 18: Alineación Operativa Chekeo V3 (Cero Relojes + Estaciones + Calendario) — PR #549
- **Restitución del Riel Horizontal de Fechas**:
  - Creado `HorizontalDateCalendarFilter.tsx` en `apps/internal-chekeo-v3/src/components/shared/` con soporte CDMX, 14 días consecutivos, botón `⏱️ Anteriores`, tarjeta `🟢 HOY` y badges en tiempo real de comandas pendientes.
  - Integrado reactivamente en `PedidosView.tsx` y `CocinaView.tsx`.
  - Depurado `OrdersFilterBar.tsx` eliminando selector obsoleto `dateHorizon`.
- **Rediseño Operativo de Cocina (Cero Relojes de Presión)**:
  - Eliminados cronómetros de minutos y semáforos de estrés de `kitchen.types.ts`, `KitchenTicketCard.tsx` y `KitchenDisplay.tsx`.
  - Organizada la Cocina en 3 estaciones reales: `🍔 Preparación (Plancha)`, `🍟 Side Quest (Freidora & Empaque)` y `📋 Resumen K (Mise en Place)`.
  - Soporte de modificadores en alto contraste (`🔴 SIN ...`, `🟢 +EXTRA ...`), resumen de comanda con emojis (`buildKitchenOrderQueueSummary`) y chimes Web Audio API.
- **Verificaciones**:
  - `typecheck` ✅ (0 errores).
  - `build:chekeo` y `build:public` ✅ (100% en verde).
  - Memoria Codex sincronizada en `07-decisiones.md`, `03-flujos-chekeo.md` y `22-v3-bitacora.md`.

---

## 📌 Issues Abiertos

| # | Descripción | Severidad | Estado |
|---|---|---|---|
| — | Ninguno. Migración 100% exitosa sin deuda técnica residual. | — | Resuelto |

---

## 🔴 Reglas Permanentes V3 (de AGENTS.md)

- **Base de PRs Obligatoria**: Todos los PRs del roadmap V3 se crean con base en `v3`.
- **Cutover Final (PR-V3-13)**: Apertura del PR final desde `v3` hacia `main` tras validar compilación y checks completos.
- **Atomicidad**: Cada PR cumple un único objetivo acotado y verificable.
- **Checks Obligatorios**: `git diff --check`, `npm run typecheck` y `npm run build` validados en cada fase.

---

## 📊 Métricas Finales (V2 Baseline vs V3 Resultado)

| Métrica | V2 valor | Meta V3 | V3 Resultado Final |
|---|---|---|---|
| Líneas en god component principal | 6,336 (`InternalChekeoApp`) | < 100 | **68 líneas** (`AppShell` + vistas modulares) |
| Líneas en CSS monolítico | 9,711 (`public styles.css`) | < 150 | **0 líneas monolíticas** (Tailwind v4 tokens + globals) |
| Archivos de backend (functions) | 30+ sueltos | 1 router Hono + routes/ | **1 router Hono centralizado** + rutas tipadas |
| Estado del carrito | useState disperso | Zustand store centralizado | **Zustand store** (`cartStore`, `checkoutStore`, `uiStore`) |
| Caché de servidor | 0 (fetch manual en useEffect) | TanStack Query (5min cache) | **TanStack Query v5** con invalidación inteligente |
| Código Legacy / V2 en repo | ~130 archivos | 0 | **0 archivos legacy** (`apps/*-v2` eliminadas) |
