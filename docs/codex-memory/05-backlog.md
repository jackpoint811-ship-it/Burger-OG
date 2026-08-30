> Estado: vivo
> Uso: memoria operativa para Codex/Burgers.exe

# Backlog

## Migración V3 — 100% Completada

- [x] **PR-V3-00**: Branch v3 + limpieza total del repo (legacy, docs obsoletas, archivos raíz).
- [x] **PR-V3-01**: Dependencias + Scaffold estructura V3 (#531).
- [x] **PR-V3-02**: packages/config (Zod) + packages/ui (shadcn base) (#533).
- [x] **PR-V3-03**: Backend Hono.js router centralizado (#534).
- [x] **PR-V3-04**: Public Order: Zustand stores (#535).
- [x] **PR-V3-05**: Public Order: Features & TanStack Query (#536).
- [x] **PR-V3-06**: Public Order: Catálogo, Banners y Drawers UI (#537).
- [x] **PR-V3-07**: Public Order: Checkout, Validación y Éxito (#538).
- [x] **PR-V3-08**: Chekeo: AuthGate, AppShell y Navegación (#539).
- [x] **PR-V3-09**: Chekeo: Feature Pedidos & Comandas (#540).
- [x] **PR-V3-10**: Chekeo: Feature Cocina KDS & Resumen K (#541).
- [x] **PR-V3-11**: Chekeo: Feature Pagos, Tickets 80mm & WhatsApp Bridge (#542).
- [x] **PR-V3-12**: Chekeo: Feature Admin Completo (Menú, Torres, Banners, Sorteos, Corte Z) (#543).
- [x] **PR-V3-13**: Cutover Definitivo a Burgers.exe V3 (Eliminación V2, targets limpios, PR final).

## Pendientes heredados resueltos en V3

- [x] Afinar ticket térmico vertical (80mm/58mm e impresión nativa POS).
- [x] Mejorar conciliación de pagos y vista detallada de ticket.
- [x] Mejorar WhatsApp bridge con 5 plantillas estructuradas.
- [x] Resumen K de cocina con agregación de insumos y mise en place en tiempo real.
- [x] Corte Z con arqueo financiero de turno y exportación CSV.
- [x] Sorteos con métricas limpias, ranking y ruleta de selección.
- [x] Gestión de tickets de sorteo y participantes auditables.

## Completados recientemente

- [x] **PR-V3-Performance (2026-08-30)**: Optimizaciones Técnicas & Performance — `manualChunks` en Vite, `React.lazy` y `Suspense` en vistas de Chekeo (`PedidosView`, `CocinaView`, `PagosView`, `AdminView`), paneles de administración y modales públicos. Reducción de ~88% en el bundle inicial de Chekeo y ~76% en Public Order (0 warnings >500 kB).
- [x] **Consolidación de Banners y Catálogo V3 (2026-08-21)**: Live Preview y selectores inteligentes en Chekeo Banners, BannerCarousel interactivo, FeaturedRail (Top Vendidos), ReorderModule (1-Click Reorder) y Scrollspy en CategoryNav.
- [x] **PR #553**: Afinaciones de UX/UI en Public Order V3 (Personalización burgers/combos, switch Dark/Light, emoji 🎁, layout 2 cols, checkout).
- [x] **PR #552**: Chekeo Cocina Enfocada de Producción y KPIs en Resumen K.
- [x] **PR #551**: Chekeo Dashboard de Operación en Vivo y Semáforo del Turno.
- [x] **PR #549**: Chekeo Alineación Operativa (Cero Relojes + Estaciones + Calendario Horizontal).
- [x] **PR-V3-13**: Cutover Definitivo a Burgers.exe V3 (#544).
- [x] **PR-V3-12**: Chekeo Admin Completo (#543).
- [x] **PR-V3-11**: Chekeo Pagos, Recibos 80mm y WhatsApp Bridge (#542).
- [x] **PR-V3-10**: Chekeo Cocina KDS & Resumen K (#541).
- [x] **PR-V3-09**: Chekeo Pedidos (#540).
- [x] **PR-V3-08**: Chekeo Auth & Shell (#539).
- [x] **PR-V3-07**: Public Checkout (#538).
- [x] **PR-V3-06**: Public UI & Drawers (#537).
- [x] **PR-V3-05**: Public TanStack Query (#536).
- [x] **PR-V3-04**: Public Zustand (#535).
- [x] **PR-V3-03**: Backend Hono (#534).
- [x] **PR-V3-02**: Config & UI Packages (#533).
- [x] **PR-V3-01**: Deps & Scaffold (#531).
- [x] **PR-V3-00**: Repo Cleanup & Branch (#530).

## Ideas futuras

- Convertir Burgers.exe en SaaS.
- Mejorar QA visual manual.
- Usar Obsidian como memoria del proyecto.
- Usar Graphify como mapa técnico antes de cambios grandes.
