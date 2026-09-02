> Estado: vivo
> Uso: memoria operativa para Codex/Burgers.exe

# Estado actual de Burgers.exe

## Contexto general

Burgers.exe tiene una app pública de pedidos (`apps/public-order-v3`) y una app interna de Chekeo (`apps/internal-chekeo-v3`).

**Migración V3 100% Completada** — Toda la plataforma opera sobre la arquitectura moderna V3. Código V2 obsoleto eliminado en su totalidad.

## Stack V3 Definitivo

- React 19 + Vite 6
- TanStack Query v5 (server state / caché de 5 minutos)
- Zustand v5 (client state / carrito persistido + UI)
- shadcn/ui sobre Radix UI (componentes 100% accesibles y desacoplados)
- Tailwind CSS v4 (estilos modernos con variables de diseño)
- Zod v3 (validación compartida frontend/backend con `@config`)
- React Hook Form v7 (formularios reactivos de alta precisión)
- Hono.js v4 (router backend centralizado y tipado en Cloudflare Workers/Pages)
- Cloudflare D1 + R2 (almacenamiento relacional y assets optimizados)

## Reglas importantes

- `AGENTS.md` manda sobre esta memoria.
- Los cambios deben terminar en Pull Request cuando el usuario apruebe el cierre.
- Usar Graphify antes de cambios grandes o de arquitectura.
- No meter dependencias nuevas sin autorización.
- Mantener enfoque mobile-first y estética Premium Casual.
- Mantener UX clara, accesible y consistente con la marca.

## Roadmap V3 — 14 PRs Completados (100%)

| PR | Objetivo | Estado |
|---|---|---|
| V3-00 | Branch v3 + limpieza total del repo | ✅ Mergeado |
| V3-01 | Dependencias + scaffold estructura V3 | ✅ Mergeado |
| V3-02 | packages/config (Zod) + packages/ui (shadcn) | ✅ Mergeado |
| V3-03 | Backend: Hono.js router centralizado | ✅ Mergeado |
| V3-04 | Public Order: Zustand stores | ✅ Mergeado |
| V3-05 | Public Order: Features (TanStack Query) | ✅ Mergeado |
| V3-06 | Public Order: UI components (catálogo, drawers) | ✅ Mergeado |
| V3-07 | Public Order: Checkout + integración | ✅ Mergeado |
| V3-08 | Chekeo: Auth + shell + tabs | ✅ Mergeado |
| V3-09 | Chekeo: Feature Pedidos | ✅ Mergeado |
| V3-10 | Chekeo: Feature Cocina (KDS & Resumen K) | ✅ Mergeado |
| V3-11 | Chekeo: Feature Pagos | ✅ Mergeado |
| V3-12 | Chekeo: Feature Admin | ✅ Mergeado |
| V3-13 | Cutover Definitivo + Eliminar V2 | ✅ Mergeado (#544) |
| V3-Audit | Auditoría Post-Migración Compliance & Hardening | ✅ Mergeado (#545) |
| V3-Deploy | Cloudflare Pages V3 + GitHub Actions CI/CD | ✅ Mergeado (#546) |
| V3-FixAssets | Fix Asset Route Regex & R2 Image Routing | ✅ Mergeado (#547) |

## Infraestructura y URLs Activas (Cloudflare Pages)

- **Public Order V3**: `https://burgers-exe-public-v3.pages.dev` (Conectado a D1 `burgers-exe-menu-v2-preview` y R2 `burgers-exe-assets-v2-preview`).
- **Internal Chekeo V3**: `https://burgers-exe-internal-v3.pages.dev` (Protegido por `BOG_INTERNAL_PIN`, con acceso a Pedidos, Cocina, Pagos y Admin).
- **CI/CD Automatizado**: Pipelines en GitHub Actions (`deploy-public-v3.yml` y `deploy-chekeo-v3.yml`) con deploy en <45s por push a `v3`.

## Bitácora V3

Ver `docs/codex-memory/22-v3-bitacora.md` para el log detallado de sesiones, decisiones y métricas finales.

## Estado funcional operativo

- **Public Order V3**: Menú en vivo (D1), catálogo de productos, personalización de ingredientes/extras, carrito Zustand, checkout validado por Zod y confirmación de pedido con folio.
- **Chekeo Pedidos**: Cola en vivo, filtros, tarjetas con modificaciones, drawer de detalle y cancelación segura.
- **Chekeo Cocina**: KDS Kanban 3 columnas, semáforo de tiempos, alertas de audio Web Audio API y Resumen K (mise en place).
- **Chekeo Pagos**: Conciliación de pagos, generador de tickets 80mm/58mm y WhatsApp Bridge con 5 plantillas automáticas.
- **Chekeo Admin**: Gestión de Menú & Stock diario, Torres y horarios, Banners dinámicos, Sorteos y Arqueo de caja (Corte Z).

## Hito reciente - 2026-08-20

- **Despliegue y Validación en Vivo V3 (PRs #545, #546, #547)**: Plataforma completamente desplegada en Cloudflare Pages con pipelines de CI/CD. Auditoría automatizada con Chromium headless validó 0 errores de consola, login operativo con PIN `1234` y carga completa de catálogo y assets R2 en vivo.
- **Unificación Operativa Chekeo V3 (Operación & Semáforo en Vivo)**: Incorporación de la pestaña `Operación` como pantalla de inicio con semáforo del turno en tiempo real (Cocina activa, Pagos pendientes, Pedidos abiertos, Venta del día), tarjeta de Siguiente Acción Prioritaria y Mini Resumen K con acceso directo a Cocina (PR #551).
- **Experiencia de Cocina en Foco & Resumen K V3**: Replicado el flujo enfocado de Producción con `KitchenActiveStation` (`PEDIDO ACTIVO` en foco con botón táctil `✔ Hecha`, `COLA DE PEDIDOS` interactiva, `LISTAS` colapsables con reversión y `Resumen K` con tarjetas KPI grandes de producción: Total Burgers, Guarniciones, Combos Desglosados, Side Quest, Por Hacer y Hechas).
- **Afinaciones de UX/UI en Public Order V3 (2026-08-21)**: Personalización completa de burgers y combos mediante `useMenuRecipes` y recetas canónicas, switch de tema Dark/Light en cabecera pública con persistencia, distintivo de sorteo con emoji `🎁`, layout de 2 columnas en móvil adaptado a producción y CheckoutDrawer con código de referido condicional y despliegue animado de WhatsApp (PR #553).
- **Consolidación de Banners y Catálogo V3 (2026-08-21)**: Live Preview WYSIWYG y selectores inteligentes en `BannersAdminPanel.tsx` de Chekeo, soporte de gradientes temáticos, swipe táctil y acciones directas a productos/categorías en `BannerCarousel.tsx`, riel horizontal de Top Vendidos (`FeaturedRail.tsx`), módulo `ReorderModule.tsx` (1-Click Reorder) y Scrollspy con `IntersectionObserver` en `CategoryNav.tsx` (PR #554).
- **Sincronización Total de Preview con V3 (2026-08-21)**: Rama `preview` actualizada y alineada al 100% con `v3` eliminando la deuda técnica histórica de V2 y habilitando el despliegue automático del entorno de Staging en Cloudflare Pages para pruebas de campo previas al cutover de `main`.
- **Gestor de Categorías y Editor de Combos en Chekeo Admin (2026-09-02)**: Implementado el Gestor Visual de Categorías (`CategoriesManagerModal.tsx`) con ordenamiento accesible, emojis culinarios y prevención de borrado referencial; integrado el Editor de Combos y Opciones (`comboConfig` y `comboLinks`) en `ProductEditModal.tsx` con presets táctiles, upcharges en centavos y validación Zod completa; y flexibilizado el backend Hono.js en D1 con endpoint de borrado seguro `DELETE /api/menu-v2-admin/categories/:key`.
