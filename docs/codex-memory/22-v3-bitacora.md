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

### 📅 2026-08-20 — Sesión 19: Dashboard de Operación en Vivo y Semáforo del Turno — PR #551
- Creada vista `OperacionView.tsx` como pestaña principal en Chekeo V3 con semáforo operativo de 4 métricas reactivas (Cocina activa, Por cobrar, Pedidos abiertos, Venta de hoy), tarjeta inteligente de Siguiente Acción Prioritaria y Mini Resumen K con acceso directo a Cocina.

### 📅 2026-08-20 — Sesión 20: Cocina Enfocada de Producción y KPIs en Resumen K — PR #552
- Creada `KitchenActiveStation.tsx` con comanda activa destacada (`PEDIDO ACTIVO`), botón gigante de 1 toque `✔ Hecha / Marcar Lista`, cola táctil de espera y acordeón de comandas listas con reversión.
- Rediseñado `KitchenSummaryK.tsx` con tarjetas KPI grandes para insumos y mise en place.

### 📅 2026-08-21 — Sesión 21: Afinaciones de UX/UI y Personalización en Public Order V3 — PR #553
- Personalización de burgers y combos mediante `useMenuRecipes`, switch Dark/Light persistente, emoji regalo 🎁 en sorteos, layout móvil de 2 columnas y checkout condicional.

### 📅 2026-08-21 — Sesión 22: Consolidación de Banners y Catálogo Interactivo en V3 — PR #554
- Live Preview WYSIWYG en Chekeo Banners, BannerCarousel interactivo, FeaturedRail (Top Vendidos), ReorderModule (1-Click Reorder) y Scrollspy en CategoryNav.

### 📅 2026-08-21 — Sesión 23: Sincronización de Staging (Preview ➔ Burgers.exe V3)
- **Alineación de Preview**: Sincronizada la rama `preview` con la versión más reciente de `v3`, erradicando definitivamente el código legacy de V2.
- **Validación Staging**: `typecheck` ✅ (0 errores), `build:public` ✅ (537 kB), `build:chekeo` ✅ (600 kB).
- **Despliegue Automático**: Habilitado el pipeline de CI/CD para que Cloudflare Pages despliegue la suite completa de V3 en el entorno de pruebas en vivo.

### 📅 2026-08-24 — Sesión 24: Paridad Total de Personalización con Producción
- **Restitución de Estructura Canónica de Producción**:
  - `ProductDetailDrawer.tsx`: Muestra la lista de ingredientes de la receta de D1 (`🥗 INGREDIENTES DE LA RECETA`) con nombres reales desde `product_ingredient_recipes_v2` e `ingredients_v2`.
  - Mantiene los dos botones canónicos `[ 🍔 Receta Original ]` y `[ 🛠️ Personalizar ]` con estilos y estados de selección idénticos a Producción.
  - Al activar `🛠️ Personalizar`: despliegue interactivo de chips `✓ [Ingrediente]` / `✕ Sin [Ingrediente]`, sumadores de extras con precios reales y notas de cocina.
- **Combos Reales**:
  - Filtrado estricto de `comboBurgerProducts` para incluir únicamente productos cuya categoría sea `burgers`, excluyendo complementos como `PAPAS_OG`.
  - Selectores dinámicos de Guarnición (`guarniciones`) y Bebida (`drinks`) tipo radio.
- **Edición Fluida desde el Carrito**:
  - `ui.store.ts` y `cart.store.ts`: Soporte para `editingCartItem` y `updateItem()`.
  - `CartDrawer.tsx`: Enlace *"✏️ Editar personalización"* para reabrir el drawer precargado con el modo, ingredientes quitados, extras y notas para actualizar la comanda sin duplicar la línea.
- **Verificación**:
  - `npm run typecheck` ✅ (0 errores).
### 📅 2026-08-25 — Sesión 25: Blindaje de Reglas de CLI y Compatibilidad de Entornos
- **Creación de `GEMINI.md`**: Configuración nativa para Antigravity / Gemini CLI en la raíz del proyecto con Hard Constraints (prohibición de push a `main`, no dependencias no autorizadas, respeto de contratos D1/Hono/Zod y estética Premium Casual).
- **Reglas Modulares en `.agents/rules/`**:
  - `00-hard-constraints.md`: Restricciones críticas de máxima prioridad.
  - `01-workflow-and-branching.md`: Ciclo de vida de tareas, branches y PRs.
  - `02-architecture-and-style.md`: Especificaciones de arquitectura V3 y diseño.
- **Archivos de compatibilidad**: Agregados `CLAUDE.md` y `.cursorrules` para interoperabilidad entre distintos entornos y herramientas de desarrollo.
- **Verificación**: `npm run typecheck` ✅ (0 errores), `git diff --check` ✅.

### 📅 2026-08-25 — Sesión 26: Refinamiento Integral & Polish UI/UX de la Pestaña "Pedidos" en Chekeo V3
- **Simplificación Radical de Filtros (2 Niveles)**:
  - Nivel 1: Riel horizontal de fechas con botón `Anteriores` en cabecera junto a `Ver Todos` en formato píldora, dejando el riel de scroll 100% numérico para fechas de calendario.
  - Nivel 2: Buscador Universal inteligente (`#ORD-...`, cliente, teléfono, torre, ingredientes), Ribbon de estados con conteos en vivo y menú Popover discreto de Filtros Avanzados (Modo Pickup/Delivery y selector de Torres con badge de filtros activos).
- **Integración de Basurero / Archivadas (`Soft-Delete`)**: Pestaña `Archivados` en el ribbon de estados con consulta a Cloudflare D1 y botones de restauración.
- **Acciones en Lote & Limpieza de Turno**: Componente `BatchActionBar` (barra flotante inferior) y `BatchConfirmModal` (modal de confirmación preventivo) para archivar y restaurar múltiples comandas.
- **Jerarquía, Iconografía SVG Lucide y Diseño en `OrderCard`**: Cuadrícula de 3 Hechos Clave (*Total*, *Ubicación* y *Fecha/Horario con badge programado*), iconografía SVG Lucide profesional (sustituyendo emojis en modo, guarnición, bebidas, remociones y extras) y realce de pedido prioritario (`isPriority`).
- **Verificación**: `git diff --check` ✅, `npm run typecheck` ✅ (0 errores), `npm run build:chekeo` ✅ (5.74s), `npm run build:public` ✅ (6.09s).

### 📅 2026-08-25 — Sesión 27: Configuración de Antigravity Lifecycle Hooks & Suite de Validación QA
- **Lifecycle Hook `PreToolUse` de Seguridad (`.agents/hooks.json` & `.agents/scripts/safety-guard.mjs`)**:
  - Intercepción y bloqueo determinista de comandos prohibidos por `AGENTS.md`:
    - Intento de push directo o merge a `main`.
    - Uso de comandos destructivos de git (`git reset --hard`, `git add .`, `git add -A`).
    - Eliminaciones catastróficas de directorios raíz, cwd o home (`rm -rf /`, `rm -rf .`, `rm -rf ~`).
- **Skill de Validación Técnica (`.agents/skills/burgers-qa/`)**:
  - Creación de `.agents/skills/burgers-qa/SKILL.md` y script automatizado `.agents/skills/burgers-qa/scripts/run-all-checks.sh` para correr de punta a punta la matriz de comprobaciones (`git diff --check`, `npm run typecheck`, `npm run build:public`, `npm run build:chekeo`).
- **Verificación**: `git diff --check` ✅, `npm run typecheck` ✅ (0 errores), `npm run build:public` ✅ (6.11s), `npm run build:chekeo` ✅ (5.72s).
- **Merge**: PR #560 mergeado a `preview`.

### 📅 2026-08-25 — Sesión 30: Pasada de UX/UI & Desaturación Visual en Pagos V3 (Torre GGA & Torre Valcob)
- **Erradicación del Ruido en Búsqueda**:
  - Eliminados el botón verde chillante `Auto 15s` y el botón manual de `Refresh` (TanStack Query actualiza silenciosamente en background).
  - La fila 1 queda espaciosa con Buscador Universal amplio, botón `🏦 Cuenta BBVA` y botón de `Filtros` con badge numérico.
- **Unificación de Filtros a 1 Solo Ribbon Coherente**:
  - Eliminado el doble ribbon de chips en conflicto; la barra visible ahora solo expone el ribbon de **Estados de Cobro** (`Todos`, `Por Validar`, `Pagados`, `Cancelados`).
  - El filtro por **Método de Pago** vive en el Popover de Filtros y en 1-clic directo desde las tarjetas KPI superiores (`SPEI`, `Efectivo`, `Por Conciliar`).
- **Eliminación Total del Chip de Pickup**:
  - Eliminado el badge redundante `Pickup / Delivery` de las tarjetas para liberar espacio y eliminar conceptos ajenos al modelo de negocio de condominios.
- **Entrega Exclusiva por Torre**:
  - El hecho clave de Entrega formatea directamente `📍 Torre GGA` o `📍 Torre Valcob` (+ Depto), y el selector de torres se acota a `Todas las Torres`, `Torre GGA` y `Torre Valcob`.
- **Fecha Real de la Orden: Rayito ⚡ (Hoy) vs. Calendario 📅 (Después)**:
  - Icono `Zap` (⚡) verde/esmeralda para pedidos de `"Hoy"`.
  - Icono `CalendarDays` (📅) azul para pedidos con fecha real futura (ej. `"26 Ago"` o `"Vie 28"`).
- **Verificación**: `git diff --check` ✅, `npm run typecheck` ✅ (0 errores), `npm run build:public` ✅ (7.00s), `npm run build:chekeo` ✅ (6.57s).

### 📅 2026-08-25 — Sesión 32: Adopción de Hitos UX/UI & Desaturación Visual en Pedidos V3 (Torre GGA & Torre Valcob)
- **Centralización Canónica de Formato en `features/orders`**:
  - `formatTowerDeliveryLabel(delivery)` y `formatOrderTargetDateInfo(order)` centralizadas y compartidas entre Pedidos y Pagos.
- **Fecha Dinámica en Tarjeta (`OrderCard`)**:
  - Icono `Zap` (rayito ⚡) verde/esmeralda para pedidos de `"Hoy"`.
  - Icono `CalendarDays` (calendario 📅) azul con la fecha real (ej. `"26 Ago"`, `"Vie 28"`) para pedidos programados/futuros.
- **Entrega Exclusiva por Torre**:
  - Hecho clave de Entrega formatea directamente `📍 Torre GGA` o `📍 Torre Valcob` (+ Depto), erradicando textos genéricos.
- **Eliminación Total del Chip de Pickup**:
  - Erradicado el badge `Pickup / Delivery` tanto de `OrderCard.tsx` como de `OrderDetailDrawer.tsx` para eliminar conceptos ajenos al modelo de negocio de 2 torres exclusivas.
- **Desaturación de la Barra de Filtros (`OrdersFilterBar`)**:
  - Eliminados los botones ruidosos de `Auto 15s` y `Refresh` en el buscador.
  - Popover de Filtros acotado a `Todas las Torres`, `Torre GGA` y `Torre Valcob` (sin selector de modo pickup).
- **Verificación**: `git diff --check` ✅, `npm run typecheck` ✅ (0 errores), `npm run build:public` ✅ (5.50s), `npm run build:chekeo` ✅ (5.07s).

### 📅 2026-08-25 — Sesión 33: Afinación de UX/UI & Accesibilidad en Public Order V3
- **Ergonomía Móvil en `CartBar`**:
  - Inclusión de `safe-area-inset-bottom` para evitar que la barra flotante de resumen del carrito se solape con la barra de gestos en iOS/Android.
- **Navegación por Teclado y Foco Visible en `ProductCard`**:
  - Implementación de `tabIndex={0}`, `role="button"`, `onKeyDown` (<kbd>Enter</kbd> / <kbd>Espacio</kbd>) y anillos `:focus-visible:ring-accent` para cumplir WCAG 2.1 AA.
  - Mejora de contraste tipográfico en subencabezados de categoría (`text-text-secondary`).
- **Semántica ARIA en `CategoryNav`**:
  - `role="tablist"` y `role="tab"` con `aria-selected` y foco visible en navegación sticky por categorías.
- **Atributos Accesibles en `BrandHeader`**:
  - `aria-haspopup="dialog"` y `aria-expanded` en el selector de torre y horarios de entrega.
- **Targets Táctiles Optimizados**:
  - Botones de acción rápida en `FeaturedRail` y botón de `ReorderModule` ampliados a dimensiones táctiles cómodas ($\ge 44\text{px}$).
- **Verificación**: `git diff --check` ✅, `npm run typecheck` ✅ (0 errores), `npm run build:public` ✅, `npm run build:chekeo` ✅.

### 📅 2026-08-25 — Sesión 34: Afinación de la Máquina de Estados Operativa y Financiera en Chekeo V3
- **Estado `Nuevo` Exclusivo de Hoy vs. `Preparando`**:
  - En la pestaña de `Pedidos`, el badge `Nuevo` (🔵) se reserva exclusivamente para pedidos ingresados para `"Hoy"`.
  - Pedidos programados para fechas posteriores o anteriores con estado `new` se representan e indexan visual y operativamente como `Preparando` (🟡), manteniendo la cola unificada.
  - Sincronizados los conteos de `use-orders.ts` (`counts.new`, `counts.preparing`) y el filtro por estado de `PedidosView.tsx` para responder a esta semántica.
- **Avance Directo en Cocina a `Listo` (`ready`)**:
  - Al completar la comanda activa en `KitchenActiveStation` (`✔ Hecha`) o en `KitchenTicketCard`, la orden avanza directamente a estado `ready` ("Listo para Empaque"), tanto si estaba en `new` como en `preparing`.
- **Validación de Pago Automatizada con Entrega (`Pagos ➔ Entregado`)**:
  - En el módulo de `Pagos` (`use-payments.ts`), marcar una orden como `Pagado` (individual o en lote) actualiza inmediatamente `paymentStatus: 'paid'` y establece `status: 'delivered'` (Entregado).
- **Flexibilidad de Transiciones en Backend (`_orders-v2-utils.ts`)**:
  - `STATUS_TRANSITIONS` ampliado para habilitar saltos directos válidos (`new ➔ ready/delivered`, `preparing ➔ ready/delivered`, `delivered ➔ ready`).
- **Verificación**: `git diff --check` ✅, `npm run typecheck` ✅ (0 errores), `npm run build:chekeo` ✅ (4.86s), `npm run build:public` ✅ (5.26s).

### 📅 2026-08-25 — Sesión 35: Interfaz General de Cocina V3 (Paso 1 - Jerarquía V3 & Erradicación de Ruido)
- **Reestructuración a 3 Niveles Directos**:
  - **Nivel 1 (Selector de Estación Operativa)**: `role="tablist"` accesible sobre `bg-surface-card` con `🍔 Preparación`, `🍟 Side Quest` y `📋 Resumen K`. Píldoras de alto contraste con conteo reactivo de comandas pendientes y badge de conexión `🟢 Cocina en Vivo`.
  - **Nivel 2 (Riel Horizontal de Fechas)**: Riel compacto con scroll suave (`snap-start`), tarjeta `🟢 HOY` destacada y botones pastilla para `⏱️ Anteriores` y `Ver Todos`.
  - **Nivel 3 (Área de Producción Directa)**: Renderizado inmediato de la comanda activa (`PEDIDO ACTIVO`) sin banners explicativos intermedios.
- **Erradicación Total de Ruido Visual y Controles Innecesarios**:
  - Eliminado el toggle confuso "Foco / Tablero" en favor de la visualización canónica de producción.
  - Eliminados los botones de bocina/audio, pantalla completa y refresco manual.
  - Eliminada la franja redundante `🥩 Plancha & Parrilla (Burgers)` y el banner de texto de `KitchenActiveStation`.
- **Accesibilidad & Ergonomía (WCAG 2.1 AA)**:
  - Targets táctiles $\ge 44\text{px}$, semántica `role="tablist"` / `role="tab"` con `aria-selected` y `aria-controls`, y foco visible `focus-visible:ring-2 focus-visible:ring-accent`.
- **Verificación**: `git diff --check` ✅, `npm run typecheck` ✅ (0 errores), `npm run build:chekeo` ✅ (4.77s), `npm run build:public` ✅ (5.17s).

### 📅 2026-08-25 — Sesión 36: Subventana de Preparación en Cocina V3 (Paso 2 - Plancha & Receta Original)
- **Distintivo Explícito `✓ Receta Original`**:
  - Incorporado distintivo claro `✓ Receta Original` tanto para hamburguesas individuales como dentro de combos desglosados cuando no tienen remociones ni extras, asegurando certeza total al parrillero.
- **Filtro Estricto de Ítems en Plancha**:
  - En la estación de `Preparación` (`laneMode === 'prep'`), se ocultan los chips de papas y refrescos (`🍟 Papas OG`, `🥤 Bebida`) en combos, quedando reservados exclusivamente para *Side Quest*.
  - En la cola de espera y acordeón de listas, los resúmenes de texto se filtran para mostrar únicamente las hamburguesas.
- **Modificadores Críticos en Alto Contraste**:
  - `🔴 SIN [INGREDIENTE]` con fondo rojo intenso (`bg-red-600 text-white font-black`).
  - `🟢 +EXTRA [INGREDIENTE]` con fondo verde esmeralda (`bg-emerald-600 text-white font-black`).
  - `💬 [NOTA]` en contenedor ámbar cálido.
- **Accesibilidad & Ergonomía (WCAG 2.1 AA)**:
  - Foco visible en botones de la cola y acordeón (`focus-visible:ring-2 focus-visible:ring-accent`), targets táctiles $\ge 44\text{px}$ y botón gigante `✔ Hecha` ($\ge 52\text{px}$).
- **Verificación**: `git diff --check` ✅, `npm run typecheck` ✅ (0 errores), `npm run build:chekeo` ✅ (4.90s), `npm run build:public` ✅ (5.36s).

### 📅 2026-08-26 — Sesión 38: Inyección Limpia de Comandas V3 en Preview & Fijación Permanente de URLs Oficiales
- **Limpieza e Inyección Limpia en Cloudflare D1 Preview (`burgers-exe-menu-v2-preview`)**:
  - Limpieza total previa de registros obsoletos en `order_items_v2`, `order_events_v2`, `raffle_referrals_v2` y `orders_v2`.
  - Inyección de 14 órdenes realistas con snapshots V3 completos para 4 fechas consecutivas de servicio (Hoy 26 Ago, Jue 27 Ago, Vie 28 Ago y Lun 31 Ago).
  - Cobertura completa de casos: Receta Original (`✓ Receta Original`), personalización con modificadores de alto contraste (`🔴 SIN ...`, `🟢 +EXTRA ...`, notas), combos desglosados en Plancha y Side Quest, pedidos de freidora listos (`ready`), pedidos completados (`delivered`), cancelados (`cancelled`) y archivados (`archived_at`).
- **Fijación Permanente de URLs Oficiales de Entorno**:
  - **Chekeo Preview Oficial (GitHub branch `preview`)**: `https://burgers-exe-internal-v2-preview.pages.dev/`
  - **Public Order Preview Oficial (GitHub branch `preview`)**: `https://burgers-exe-public-v2-preview.pages.dev/`
  - **Despliegues directos de la rama `v3`**: `https://burgers-exe-internal-v3.pages.dev/` y `https://burgers-exe-public-v3.pages.dev/`.
- **Verificación**: Comprobación remota en D1 (14 órdenes, 27 ítems, 14 eventos) y checks en verde.

### 📅 2026-08-26 — Sesión 40: Blindaje Permanente contra Invisibilidad de Comandas (Timezone CDMX & Source Resiliente) (PR #575)
- **Cálculo Canónico de Fechas en Zona Horaria CDMX (`America/Mexico_City`)**:
  - Implementación de `getCdmxTodayString()` y `formatCdmxDateString()` en `@config/runtime-environment.ts` usando `Intl.DateTimeFormat` oficial.
  - `HorizontalDateCalendarFilter`, `CocinaView`, `KitchenDisplay` y `KitchenSummaryK` evalúan la jornada de "Hoy" y los 14 días del riel siempre en hora de CDMX, previniendo desalineaciones entre servidores UTC y navegadores locales.
- **Resiliencia de Backend en Consultas de Preview**:
  - En `functions/api/_orders-v2-utils.ts`, `buildOrderEnvironmentCondition` mapea tanto `public-v2-preview` como variantes (`preview`, `seed`, `test`), impidiendo que un pedido quede oculto por diferencias menores en la columna `source`.
- **Gobernanza Permanente**:
  - Incorporada la Regla #7 en `AGENTS.md`, `GEMINI.md` y `.agents/rules/00-hard-constraints.md`.

### 📅 2026-08-26 — Sesión 41: Refinamiento de Preparación & Side Quest en Cocina KDS (PR #576)
- **Ubicación Estricta y Normalizada (`formatKitchenLocation`)**:
  - `formatKitchenLocation`: Normaliza la visualización exclusivamente a `Torre GGA` o `Torre Valcob`. Erradica departamentos, números o texto de "Pickup".
- **Completado Granular Ítem por Ítem**:
  - Desglose determinista en `KitchenProductionUnit` con `unitKey` único por cada producto físico a preparar.
  - Hook reactivo `useKitchenItemTracking` con persistencia en `localStorage` (`burgers_kds_item_checks_v3`).
  - Bloqueo de comanda incompleta: La orden no puede cerrarse globalmente hasta que el 100% de los ítems de todas sus estaciones (Plancha y Side Quest) estén confirmados como listos.
- **División Visual Nítida entre Ítems**:
  - Cada producto encapsulado en su propia tarjeta numerada (`Ítem #1`, `Ítem #2`, etc.) con bordes de alto contraste.
- **Nombres Exactos en Side Quest**:
  - Identificación precisa: `🍟 Papas Lemon & Pepper`, `🍟 Papas Especiales`, `🍟 Papas OG`, `🍟 Aros de Cebolla`, `🥤 Bebidas`.
  - Micro-badge reducido `[ combo ]` exclusivamente cuando provenga de un combo.
- **Modificadores 1 por 1 en Lista Vertical**:
  - Remociones (`🔴 SIN [INGREDIENTE]`) y Extras (`🟢 +EXTRA [INGREDIENTE]`) en renglones verticales individuales.
  - Distintivo `[ ✓ Receta Original ]` en verde suave cuando no tenga modificaciones.
- **Nota de Cocina Fija en la Base**:
  - Contenedor estructurado con fondo ámbar suave, borde e ícono fijo `📝 Nota:` al pie de la tarjeta del ítem.
### 📅 2026-08-26 — Sesión 42: Flujo KDS Desacoplado por Estación (Plancha / Side Quest) con Unificación Automática de Orden Global (PR #577)
- **Despacho Independiente por Estación**:
  - En **🍔 Preparación (Plancha)**, el botón `Listo` valida únicamente las hamburguesas y despacha de inmediato la comanda de la vista de plancha para permitir continuar con las siguientes órdenes sin bloquearse.
  - En **🍟 Side Quest**, el botón `Listo` valida únicamente las guarniciones, bebidas y extras y despacha de inmediato la comanda de la vista de side quest.
- **Unificación Automática de Orden Global (`dispatchMap`)**:
  - `useKitchenItemTracking` incorpora `dispatchMap` con persistencia en `localStorage` (`burgers_kds_station_dispatches_v3`).
  - Cuando una estación termina su parte, si la otra estación ya está despachada o no aplica (ej. orden solo de burgers o solo de papas), el sistema ejecuta automáticamente `advanceTicketStatus` promoviendo la orden global a `ready` en Cloudflare D1.
### 📅 2026-08-26 — Sesión 43: Nombre de Cliente Prominente y Acordeón Colapsable para Notas en Comandas KDS (PR #578)
- **Jerarquía Visual Centrada en el Cliente**:
  - Encabezado con tipografía de máxima jerarquía visual (`text-2xl sm:text-3xl font-black text-text-primary tracking-tight`) para el Nombre del Cliente.
  - El Folio se presenta como pastilla secundaria (`#PB-M0001`) junto a la ubicación estricta (`Torre GGA` o `Torre Valcob`) y fecha programada.
  - En colas y listas de `KitchenActiveStation`, el nombre del cliente lidera la tarjeta antes del folio.
- **Notas de Pedido e Ítems en Acordeón Colapsable (`OrderNoteAccordion` / `ItemNoteAccordion`)**:
  - Si no existe nota, la sección correspondiente se omite por completo sin dejar espacios vacíos.
  - Si la nota es larga (> 40 caracteres en orden, > 45 caracteres en ítem), se renderiza con acordeón interactivo y toggle `Desplegar`/`Ocultar` para optimizar el espacio útil en pantalla.
### 📅 2026-08-26 — Sesión 44: Refinamiento Integral de Resumen K, Unificación Canónica y Herramientas Operativas V3 (PR #579)
- **Principio de Unificación Canónica de Producto Físico**:
  - Eliminada la duplicidad entre productos individuales y combos. En plancha, una burger individual y una de combo se agrupan en una única fila canónica (ej. `2x Hamburguesa Sencilla` con micro-badge discreto `1 indiv · 1 combo`).
  - Guarniciones y bebidas agregadas directamente bajo sus nombres exactos.
- **4 Estaciones de Producción en Paralelo**:
  - `Plancha (Burgers)` con recetas canónicas, patties y conteo de pendientes/listas.
  - `Freidora (Sides)` con papas y aros exactos.
  - `Bebidas & Fríos` con marcas/sabores consolidados.
  - `Extras & Dips` con porciones adicionales.
- **Calculadora Determinista de Mise en Place**:
  - Estimación exacta de bolitas/patties de carne (dobles x2, triples x3, sencillas x1) y bollos de pan.
  - Barra de proporción visual de `Receta Original` vs `Modificadas`.
- **Panel de Modificaciones & Recetas**:
  - Badge de `✓ Receta Original` y lista agregada de remociones (`🔴 SIN Cebolla (x4)`, `🔴 SIN Pepinillos (x2)`, etc.).
- **Desglose Logístico por Torre**:
  - Tarjetas de destino (`Torre GGA` vs `Torre Valcob`) con conteo de comandas, avance de empaque y productos asignados.
- **Herramienta 1-Click: Copiar Resumen para WhatsApp**:
  - Generador de texto formateado con emojis listo para compartir con el equipo operativo con feedback visual interactivo `Copiado ✓` y accesibilidad para lectores de pantalla.
- **Modo Dual Accesible**:
  - Selector de pestañas para alternar entre `📊 Producción` en vivo e `⚖️ Insumos D1` con costos y gramajes.
- **Verificación**: `git diff --check` ✅, `npm run typecheck` ✅ (0 errores), `npm run build:chekeo` ✅ (5.44s), `npm run build:public` ✅ (6.75s).

### 📅 2026-08-26 — Sesión 45: Acordeón Secuencial Automático y Badges de Personalización en Comandas KDS (PR #580, PR #581)
- **Acordeón Secuencial de Ítems en Modo Multi-Ítem**:
  - En comandas con más de 1 ítem en la estación, el primer ítem no completado se mantiene desplegado/expandido en foco por defecto.
  - Los ítems subsecuentes permanecen colapsados en barras compactas de alto contraste, ahorrando espacio vertical en tablets KDS.
  - Al marcar `Listo` en un ítem, este se colapsa inmediatamente y se despliega en automático el siguiente ítem pendiente sin clics adicionales.
  - Al completar el último ítem pendiente de la orden, todos los ítems se colapsan automáticamente, dejando el foco limpio en el botón de despacho global.
  - Soporte de toggle manual en el encabezado de cada ítem con accesibilidad WCAG (`role="button"`, `aria-expanded`, `aria-label`).
- **Badges de Estado en Encabezado Colapsado**:
  - Mientras el ítem está colapsado, muestra un badge destacado:
    - `[ 🛠️ Personalizada ]` (en ámbar/rojo con borde) si tiene remociones, extras o nota.
    - `[ ✓ Receta Original ]` (en verde esmeralda con borde) si es hamburguesa estándar.
  - Al desplegar el ítem, el badge del encabezado desaparece para dar protagonismo a los bloques visuales detallados (`🔴 SIN ...`, `🟢 +EXTRA ...`, nota, botón Listo).
- **Diferenciación Visual Anti-Confusión en Botones**:
  - Dentro del ítem abierto: `[ ✔ Marcar Ítem Listo ]` en estado pendiente, y `[ ↩ Desmarcar / Volver a pendiente ]` en tono neutro outline si se abre un ítem ya listo.
  - Botón principal de la comanda: Destacado en verde esmeralda con copy contextual explícito (`✔ Despachar Plancha` / `✔ Despachar Side Quest` / `✔ Despachar Comanda`), eliminando botones duplicados y ambigüedad.
### 📅 2026-08-26 — Sesión 46: Resumen K V3 — Mise en Place, Precocción de Side Quests, Carne Extra & Checklist de Restock Diario (PR #582)
- **📦 Checklist de Insumos Físicos & Control de Restock Diario**:
  - Implementación de la calculadora matemática de 7 insumos clave indispensables para arrancar el turno:
    - 🥩 **Patties de Carne**: Bolitas a descongelar y pesar según receta (Doble = 2, Sencilla/OG = 1, Triple = 3) **+ porciones de carne extra calculadas automáticamente** (`+Extra Carne` / `+Extra Patty`).
    - 🍞 **Bollos de Pan**: Piezas de pan a tostar (1 por hamburguesa).
    - 🧀 **Queso Americano**: Rebanadas necesarias calculadas por receta base y extras de queso.
    - 🥓 **Tocino**: Porciones a dorar/precocinar calculadas por recetas estándar con tocino y porciones de `+Extra Tocino`.
    - 🍟 **Guarniciones (Sides)**: Total de porciones de papas y aros a pesar.
    - 🥤 **Bebidas Frías**: Latas a refrigerar para el turno.
    - 🥫 **Dips / Salsas**: Vasitos de aderezos a porcionar.
- **🥩 Unificación de Carne Estándar & Trazabilidad de Carne Extra**:
  - Todas las burgers usan la misma carne física base (patty smash).
  - En las tarjetas de `Plancha (Burgers)`, las recetas con carne extra reflejan el badge contextual `[ +X extra carne ]`.
- **🍟 Módulo de Precocción & Pesaje de Side Quests**:
  - Desglose directo y preciso de porciones por receta de papas (`Papas Lemon & Pepper`, `Papas Especiales`, `Papas OG`) y `Aros de Cebolla` con estado pendiente de freír vs listas.
- **🎛️ Filtros Rápidos Tipo Chip por Estación**:
  - Barra de chips interactivos: `[ 🌐 Todas ]`, `[ 🍔 Plancha ]`, `[ 🍟 Freidora / Sides ]`, `[ 🥤 Bebidas ]`, `[ 🥫 Extras & Dips ]` para alternar fluidamente entre la vista integral de 4 estaciones en paralelo y el foco en una estación individual.
- **🥗 Panel de Modificaciones de Cocina con Burgers Afectadas**:
  - Lista de remociones (`🔴 SIN [Ingrediente] xN`) acompañada de un subtexto claro indicando en qué hamburguesas aplica (ej. `↳ 2x Doble con Queso · 1x Sencilla`).
- **🧹 Limpieza de Ruido Visual en Cabecera**:
  - Eliminación total de la función de copiar WhatsApp (cero botones o estados innecesarios en la pantalla de cocina).
- **Verificación**: `git diff --check` ✅, `npm run typecheck` ✅ (0 errores), `npm run build:chekeo` ✅ (5.48s), `npm run build:public` ✅ (5.66s).

### 📅 2026-08-26 — Sesión 47: Resumen K V3 — Reordenamiento de Layout con Desglose Logístico por Torre en Posición Primaria (PR #583)
- **🏢 Desglose Logístico de Empaque por Torre en Posición Primaria**:
  - Reubicación del módulo de distribución de empaque por torre (`Torre GGA` vs `Torre Valcob`) en la posición superior de la vista de producción de Resumen K, inmediatamente debajo del encabezado principal.
  - Permite a los líderes de turno y empacadores visualizar al instante el avance de pedidos listos vs pendientes, balance de carga entre torres y cantidades de hamburguesas, guarniciones y bebidas por torre.
- **📦 Jerarquía Operativa Optimizada**:
  1. 🏢 Desglose Logístico de Empaque por Torre (`Torre GGA` / `Torre Valcob` con barras de avance).
  2. 📦 Checklist de Insumos Físicos & Control de Restock Diario (7 métricas: carnes base + extras, panes, queso, tocino, sides, bebidas, dips).
  3. 🎛️ Filtros Rápidos por Estación (`🌐 Todas`, `🍔 Plancha`, `🍟 Freidora`, `🥤 Bebidas`, `🥫 Extras`).
  4. 4 Estaciones de Producción en Paralelo (Plancha con badge `+X extra carne`, Freidora con porciones de sides, Bebidas y Extras).
  5. 🥗 Mise en Place de Modificaciones de Línea (grid autoadaptable de remociones agrupadas).
- **Verificación**: `git diff --check` ✅, `npm run typecheck` ✅ (0 errores), `npm run build:chekeo` ✅ (5.59s), `npm run build:public` ✅ (5.72s).

### 📅 2026-08-26 — Sesión 48: Refinamiento Integral de Pagos & Conciliación V3 (Selector de Período, Mini Calendario & Terminología Canónica)
- **🗓️ Nuevo `PaymentPeriodSelector` & Mini Calendario Mensual Popover**:
  - Reemplazo definitivo del riel horizontal de 14 tarjetas por una barra ejecutiva de períodos financieros: `[ ⚡ Hoy ]`, `[ ⏱️ Ayer ]` (para cuadre de caja/turno previo), `[ 📅 Esta Semana ]` (últimos 7 días) y `[ 🌐 Todo ]`.
  - Selector interactivo de Fecha Específica con **Mini Calendario Mensual Popover** (`MiniCalendarPopover`): navegación mes a mes, días de la semana, indicadores verdes en días con cobros registrados, resalte del día de Hoy y selección de fecha exacta.
  - Badge reactivo con el resumen financiero del período activo (Total facturado, órdenes y alerta ámbar pulsante si hay cobros por confirmar).
- **🏷️ Estandarización de Terminología Canónica de Cobros**:
  - Erradicación total de "SPEI / SPAI" sustituido por **Transferencia**.
  - "Efectivo en Entrega" simplificado a **Efectivo**.
  - "Por Validar / Por Conciliar" estandarizado a **Por confirmar**.
  - Acciones de 1-toque en tarjetas de cobro: `1-Clic: Confirmar Pago` / `Pago Confirmado (Clic para revertir)`.
  - Modales: `Cuenta para Transferencias` (BBVA) y `Recordatorio Transferencia` (WhatsApp Bridge).
- **📊 KPI "Por confirmar" Universal**:
  - El 4to KPI del encabezado ahora totaliza **TODOS los cobros pendientes** sin importar el método de pago (transferencia, efectivo o tarjeta).
  - Al hacer clic, filtra inmediatamente a `status: 'pending'`, `method: 'all'` y `selectedDate: 'all'`.
### 📅 2026-08-26 — Sesión 49: Claridad & Certeza de Personalización Múltiple en Tienda Pública V3
- **✨ Banner Reasegurador de Personalización por Volumen**:
  - En `ProductDetailDrawer.tsx`, cuando el cliente personaliza una burger o combo y selecciona `quantity > 1`, se despliega una tarjeta animada (`Sparkles`, verde bosque `#16A34A` / `#22C55E`):
    *`Las N hamburguesas se prepararán con esta misma personalización. ¿Quieres otra con receta original o personalización distinta? Agrégalas por separado a tu pedido.`*
  - Cumplimiento de WCAG 2.1 AA con `role="status"` y `aria-live="polite"`.
- **🏷️ Micro-Copy Semántico en Stepper y CTA Contextual**:
  - Caption reactivo debajo del stepper: `×N personalizadas iguales` vs `×N receta original`.
  - Botón CTA dinámico: `[ Agregar N burgers personalizadas · $XXX ]` vs `[ Agregar N burgers (Original) · $XXX ]`.
- **🛒 Insignia de Volumen en Carrito**:
  - En `CartDrawer.tsx`, cuando una línea tiene `quantity > 1` y modificaciones activas, se añade el badge `✨ Aplica a las N unidades`.
- **Verificación**: `git diff --check` ✅, `npm run typecheck` ✅ (0 errores), `npm run build:public` ✅, `npm run build:chekeo` ✅.

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
