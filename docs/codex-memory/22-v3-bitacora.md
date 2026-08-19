> Estado: vivo
> Uso: bitácora de migración V3 para Codex/Burgers.exe

# 📋 Bitácora V3 — Burgers.exe

> **Estado**: 🟡 En progreso (PR-V3-08 Mergeado)
> **Inicio**: 2026-08-18
> **Última actualización**: 2026-08-19

---

## 🎯 Objetivo

Migración completa V2 → V3 de Burgers.exe. Reescritura total con stack moderno, arquitectura limpia y repo sin legacy.

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

---

## 🗓️ Roadmap de PRs

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


| V3-09 | Chekeo: Feature Pedidos | 🔄 En PR | — | 2026-08-19 | — |
| V3-10 | Chekeo: Feature Cocina | ⏳ Pendiente | — | — | — |
| V3-11 | Chekeo: Feature Pagos | ⏳ Pendiente | — | — | — |
| V3-12 | Chekeo: Feature Admin completo | ⏳ Pendiente | — | — | — |
| V3-13 | Cutover + Eliminar V2 + Merge a main | ⏳ Pendiente | — | — | — |

**Leyenda**: ⏳ Pendiente · 🔄 En progreso · ✅ Mergeado · ❌ Bloqueado · ⏸️ Pausado

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
  - `menu/`: `fetchMenu`, `useMenuQuery`, selectores (`useCategories`, `useMenuItems`, `useFeaturedItems`, `useMenuItem`, `usePromos`, `useSiteConfig`, `usePublicConfig`, `useItemRecipe`) y query keys tipadas (`menuKeys`).
  - `banners/`: Hooks para `useCatalogBanners`, `useCategoryBanner`, `useCategoryBanners`.
  - `towers/`: `fetchTowerSchedules`, `useTowerSchedulesQuery`, `useActiveTowers`, `useTowerByKey`, helper de zona horaria CDMX y hook de disponibilidad operativa `useTowerAvailability`.
  - `raffles/`: `fetchActiveRaffle`, `fetchCampaignConfig`, `lookupRaffleTickets`, `fetchReferralTickets`, y hooks `useActiveRaffleQuery`, `useCampaignConfigQuery`, `useRaffleTicketsLookup`, `useReferralTicketsQuery`.
  - `orders/`: `createOrder`, helper `cartAndFormToCreateOrderPayload`, y mutation hook `useCreateOrderMutation` con sincronización automática a Zustand `checkoutStore` / `cartStore` e invalidación inteligente de caché.
  - Barrel exports limpios en cada módulo y master export en `features/index.ts`.
- Conectado `PublicApp.tsx` para consumir y validar queries activas.
- Checks: `typecheck` ✅ (0 errores), `build` ✅ (`public-order-v3`, `chekeo-v3`, `public-v2`, `internal-v2`), `git diff --check` ✅.

### 📅 2026-08-19 — Sesión 6: PR-V3-06 Public Order UI Components & Drawers
- Creados componentes y vistas modulares en `apps/public-order-v3/src/components/`:
  - `header/`: `BrandHeader` con estatus operativo y selector de torre; `TowerScheduleModal` con consulta de horarios CDMX, días activos y selector de torre.
  - `catalog/`: `BannerCarousel` con carrusel interactivo, autoplay, swipe y CTA actions; `CategoryNav` sticky horizontal con auto-scroll a sección y resaltado activo; `ProductCard` con resolución de assets R2, fallbacks SVG (`ProductFallbackSvg`), badges, precios promo y quick-add; `ProductGrid` con organización por categorías y skeletons.
  - `drawers/`: `ProductDetailDrawer` con personalización completa (receta original vs personalizar, chips de ingredientes a remover, extras dinámicos, notas para cocina, guarnición obligatoria y bebidas en combos, personalización de burgers incluidas); `CartDrawer` con desglose de ítems, stepper de cantidades, resumen financiero y 1-Tap Reorder.
  - `layout/`: `CartBar` barra flotante animada con Framer Motion y touch target >= 44px; `ToastContainer` para notificaciones no bloqueantes.
  - `shared/`: `ProductFallbackSvg` con fallbacks visuales vectoriales para burgers, combos, guarniciones y bebidas.
  - Master barrel export en `components/index.ts`.
- Conectado en `PublicApp.tsx` integrando TanStack Query hooks y Zustand stores.
### 📅 2026-08-19 — Sesión 7: PR-V3-07 Public Order Checkout Drawer, Validación & Integración Final
- Creado `CheckoutDrawer.tsx` en `apps/public-order-v3/src/components/drawers/`:
  - Integración completa con React Hook Form v7 y Zod resolver (`@hookform/resolvers/zod`).
  - Validación inline estricta de nombre (mínimo 2 caracteres) y teléfono WhatsApp (10 dígitos).
  - Selector interactivo de torre con disponibilidad operativa y aviso si está fuera de horario.
  - Soporte de pedidos para hoy vs. fechas programadas con cálculo dinámico (`getNextAvailableDeliveryDate`).
  - Métodos de pago (efectivo, transferencia SPEI y WhatsApp) con tarjeta de datos bancarios (`useSiteConfig`), CLABE y botón de copiado rápido con 1-tap.
  - Soporte de código de referido / sorteo y opt-in para grupo de WhatsApp.
- Creado `OrderSuccessModal.tsx` en `apps/public-order-v3/src/components/orders/`:
  - Modal de confirmación con animación y folio de seguimiento (`#FOLIO`) con botón de copiado rápido.
  - Resumen detallado del pedido (torre, horario de entrega, forma de pago y total financiero).
  - Enlaces directos a WhatsApp para enviar comprobante de pago y unirse a la comunidad oficial.
  - Notificación de boletos ganados para el sorteo activo (`earnedTickets`).
- Conexión de `useCreateOrderMutation` para persistencia en backend e invalidación automática de caché de catálogo.
- Integración completa en `apps/public-order-v3/src/app/PublicApp.tsx` (Header + Banners + Categorías + Catálogo + CartBar + Drawers + Checkout + SuccessModal).
- Verificaciones: `typecheck` ✅ (0 errores), `build` ✅ (`public-v3`, `chekeo-v3`, `public-v2`, `internal-v2`), `git diff --check` ✅.

### 📅 2026-08-19 — Sesión 8: PR-V3-08 Chekeo AuthGate, AppShell, Tabs & Layout Base
- Creada capa de autenticación y estado de sesión en `apps/internal-chekeo-v3/src/features/auth/`:
  - `auth.api.ts`: funciones para `fetchAuthStatus`, `loginWithPin` y `logoutInternal` con credenciales de cookie de sesión (`/api/internal-v2-auth/*`).
  - `auth.store.ts`: `useAuthStore` en Zustand con persistencia en localStorage para renderizado instantáneo y validación en segundo plano.
  - `AuthGate.tsx`: pantalla de login por PIN optimizada para pantallas POS táctiles de cocina y teclados físicos, con feedback de error inline, detección de entorno (Producción / Preview / Dev) y bloqueo de acciones durante envío.
- Creado AppShell y componentes de navegación en `apps/internal-chekeo-v3/src/components/shell/`:
  - `TopHeader.tsx`: barra superior con reloj operativo CDMX en tiempo real, indicador de red y sincronización (Online/Offline), toggle de tema claro/oscuro persistente y botón de salida rápida.
  - `NavTabs.tsx`: navegación por pestañas accesible sobre `@ui/tabs` para Pedidos, Cocina, Pagos y Admin con touch targets $\ge 44$px.
  - `AppShell.tsx`: layout responsive unificado.
- Creados componentes esqueleto/placeholder listos para sus respectivos PRs en `apps/internal-chekeo-v3/src/components/views/`:
  - `PedidosView.tsx`: cola de pedidos, filtros por estado y ribbon de calendario para PR-V3-09.
  - `CocinaView.tsx`: pantalla KDS con semáforo de tiempos, estación de preparación y desglose de mods para PR-V3-10.
  - `PagosView.tsx`: KPI summary cards financieros, filtros de conciliación y WhatsApp para PR-V3-11.
  - `AdminView.tsx`: hub administrativo para Menú, Torres, Banners, Sorteos y Corte Z para PR-V3-12.
- Montaje general en `apps/internal-chekeo-v3/src/app/ChekeoApp.tsx` con verificación de sesión al boot.
- Verificaciones: `typecheck` ✅ (0 errores), `build` ✅ (`public-v3`, `chekeo-v3`, `public-v2`, `internal-v2`), `git diff --check` ✅.

### 📅 2026-08-19 — Sesión 9: PR-V3-09 Chekeo Feature Pedidos (Comandas, Filtros, Drawers y Estado)
- Creada capa Data Layer en `apps/internal-chekeo-v3/src/features/orders/`:
  - `types/orders.types.ts`: tipos normalizados de comanda (`NormalizedOrderItem`, `NormalizedComboBurger`, `NormalizedExtra`), mapeo de estados, badges accesibles y helpers de formato de moneda, fecha/hora CDMX y links directos a WhatsApp.
  - `api/orders.api.ts`: integración con backend Hono (`/api/orders-v2-admin`, `/api/orders-v2-admin/:id/status`, `/api/orders-v2-admin/:id/payment`, `/api/orders-v2-admin/summary`, `/api/orders-v2-admin/batch-archive`).
  - `hooks/use-orders.ts`: TanStack Query v5 hooks (`useChekeoOrdersQuery` con auto-refresh configurable de 15s y cómputo de contadores reactivos, `useUpdateOrderStatusMutation` con invalidación de caché, `useUpdateOrderPaymentMutation`, etc.).
  - Barrel export en `features/orders/index.ts`.
- Creados componentes modulares en `apps/internal-chekeo-v3/src/components/orders/`:
  - `OrdersFilterBar.tsx`: búsqueda instantánea por folio/nombre/teléfono, selector horizontal por estado con conteos en vivo, filtros de modo (Pickup/Delivery), selector dinámico de torres, selector de horizonte de entrega y botón de refresco / switch de auto-refresh.
  - `OrderCard.tsx`: tarjeta de pedido con folio `#ORD-...`, botón de copiado rápido, badges de estado y modo, datos de cliente y entrega, desglose estructurado de ítems (combos con guarnición y bebida, remociones en tags de alerta, extras en tags de acento, notas para cocina y notas generales), precio total destacado y botones de acción rápida para avanzar estado.
  - `OrdersList.tsx`: grid adaptativo responsive mobile-first, esqueletos de carga suaves y empty state ilustrado con botón de restablecer filtros.
  - `OrderDetailDrawer.tsx`: drawer para detalle profundo del pedido, auditoría cronológica de eventos (`order_events_v2`), desglose financiero y acciones de cambio directo de estado.
  - `CancelOrderModal.tsx`: modal para cancelación segura de pedidos con presets de motivo y nota personalizada.
  - Barrel export en `components/orders/index.ts`.
- Integración completa en `apps/internal-chekeo-v3/src/components/views/PedidosView.tsx`.
- Verificaciones: `typecheck` ✅ (0 errores), `build` ✅ (`public-v3`, `chekeo-v3`, `public-v2`, `internal-v2`), `git diff --check` ✅.



---

## 📌 Issues Abiertos

| # | Descripción | Severidad | Estado |
|---|---|---|---|
| — | Sin issues por ahora | — | — |

---

## 🔴 Reglas Permanentes V3 (de AGENTS.md)

- **Base de PRs Obligatoria**: Todos los PRs del roadmap V3 (PR-V3-02 hasta PR-V3-12) se crean con base en `v3` (`gh pr create --base v3 --head feat/v3-xx-...`).
- **Protección de `main`**: Nunca abrir PR hacia `main` ni hacer push a `main` hasta el cutover final (PR-V3-13), previa autorización explícita.
- **Atomicidad**: Cada PR tiene un único objetivo acotado y verificable.
- **Checks Obligatorios**: `git diff --check`, `npm run typecheck` y `npm run build` en cada PR.
- **Bitácora**: Se actualiza al cierre de cada PR.
- **Graphify**: Se corre antes de cambios de arquitectura o flujos conectados.

---

## 📊 Métricas de partida (V2 baseline)

| Métrica | V2 valor | Meta V3 |
|---|---|---|
| Líneas en god component principal | 6,336 (InternalChekeoApp) | < 100 (AppShell) |
| Líneas en CSS monolítico | 9,711 (public styles.css) | < 150 (globals.css) |
| Archivos de backend (functions) | 30+ sueltos | 1 router Hono + routes/ |
| Estado del carrito | useState disperso | Zustand store centralizado |
| Caché de servidor | 0 (fetch manual en useEffect) | TanStack Query (5min cache) |
| Archivos en legacy/ | ~130 | 0 (eliminados en V3-00) |
