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
