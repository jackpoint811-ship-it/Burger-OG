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
| V3-13 | Cutover Definitivo + Eliminar V2 + Merge a main | ✅ Preparado / En PR |

## Bitácora V3

Ver `docs/codex-memory/22-v3-bitacora.md` para el log detallado de sesiones, decisiones y métricas finales.

## Estado funcional operativo

- **Public Order V3**: Menú en vivo, carrusel de banners con R2, selector de torre con horarios CDMX, carrito Zustand, personalización completa de ingredientes/extras/combos, checkout con validación Zod y pantalla de confirmación con folio, tickets de sorteo y WhatsApp bridge.
- **Chekeo Pedidos**: Cola en vivo con auto-refresh, filtros multidimensionales, tarjetas de pedido con desglose de modificaciones, drawer de detalle con auditoría y modal de cancelación segura.
- **Chekeo Cocina**: KDS Kanban interactivo con semáforo de tiempos y audio chimes Web Audio API + Resumen K con agregación de insumos y mise en place en tiempo real.
- **Chekeo Pagos**: Conciliación financiera por método, generador e impresión nativa de tickets térmicos 80mm/58mm y WhatsApp Bridge con 5 plantillas automáticas.
- **Chekeo Admin**: Control total de Menú & Stock diario, gobernanza de Torres y horarios, Banners dinámicos, Sorteos con ranking y ruleta de selección, Arqueo de caja (Corte Z) con exportación CSV e Insumos / Recetas.

## Hito reciente - 2026-08-20

- **PR-V3-13 Cutover Definitivo a Burgers.exe V3**: Código legacy V2 (`apps/public-order-v2/` e `apps/internal-chekeo-v2/`) eliminado. Scripts de `package.json` y `vite.config.ts` unificados a V3 como targets definitivos. Verificación integral de TypeScript (`typecheck` 0 errores) y compilación (`build:public` + `build:chekeo` en verde). PR final hacia `main` preparado.
