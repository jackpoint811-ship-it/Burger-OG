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

- [x] **SaaS Cloudflare Backend & D1 Control Plane Suite (2026-08-31)**: Subrouter Hono `functions/api/_routes/saas.ts` montado en `/api/saas/*` (`/tenants`, `/metrics`, `/onboarding`), `_tenant-utils.ts` con resolución dinámica, esquema D1 `0001_saas_control_plane.sql`, seed canónico `0002_saas_control_plane_seed.sql`, script `provision-cloudflare.sh` ampliado y documentación técnica en `docs/saas-cloudflare-architecture.md`.
- [x] **PR #635 (2026-08-31)**: Motor SaaS Multi-Tenant, Facturación Stripe & Control Plane Aislado — `SaaSHubView.tsx` como vista raíz, `TenantOnboardingModal.tsx`, `SuperAdminControlPanel.tsx`, switch de marcas en `TopHeader.tsx` y contratos `@config`.
- [x] **PR #633 (2026-08-30)**: Fix de Dark Mode & Scroll Fluido en Modales / Drawers — Activada directiva `@custom-variant dark` para Tailwind CSS v4 con variables dinámicas `var(--color-*)` en Chekeo y Tienda Pública; desacoplado el drag listener de Framer Motion en `@ui/drawer` mediante `useDragControls` y habilitado `overflow-y-auto` con `max-h` en `@ui/dialog` para scroll vertical fluido sin bloqueos de gestos.

- [x] **PR-V3-Polish (2026-08-30)**: Polish de UX/UI, Skeletons Shimmer & Micro-interacciones Táctiles — Shimmer suave en `Skeleton`, retroalimentación elástica (`active:scale-[0.98]` / `active:scale-95`) en catálogo, drawers, `CartBar` animado y `HorizontalDateCalendarFilter` con accesibilidad WCAG 2.1 AA.
- [x] **PR-V3-E2ETesting (2026-08-30)**: Auditoría M3/M4 & Modernización Suite E2E Playwright — Validación integral de tipos en `@config`, schemas Zod y modernización de `tests/e2e-catalog-kitchen.spec.ts` con selectores semánticos shadcn/ui y flujo completo de 4 Tiers.
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

## 📋 Backlog de Refinamiento: 6 Categorías & Sub-Herramientas de Admin (1 por 1)

- [ ] **1. Menú, Catálogo & Stock (`menu`)**:
  - `catalog`: Grilla y lista completa con filtros de categoría, badges de estado y búsqueda instantánea.
  - `quick-stock`: Modo Stock Rápido Express para el turno con steppers en línea (+/-) y botones de 1-toque para pausar/activar sin abrir modales.
  - `promos`: Vista dedicada de ofertas con calculadora de descuento en vivo (`-$XX.XX · XX% OFF`) y activación rápida.
  - `create`: Drawer de alta de producto con subida optimizada a Cloudflare R2 y validación Zod.
  - `categories`: Gestor de categorías en D1 (`CategoryManagerModal`) para ordenar, agregar y editar emojis.
- [ ] **2. Torres, Logística & Horarios (`towers`)**:
  - `active-towers`: Activación/pausa inmediata de edificios (Torre GGA, Torre Valcob).
  - `schedules`: Horarios de toma de pedidos vs. Horarios de entrega con Radar CDMX en vivo.
  - `service-days`: Selector de días de entrega con presets (`Lun a Vie`, `Toda la semana`, `Fines de semana`).
- [ ] **3. Marketing & Banners Tienda (`banners`)**:
  - `carousel`: Orden de rotación del carrusel con reordenamiento $\uparrow / \downarrow$ y visibilidad.
  - `cta-links`: Enlaces de acción (categorías, productos, WhatsApp o URLs externas).
  - `create`: Diseñador WYSIWYG en marco de smartphone con gradientes y badges temáticos.
- [ ] **4. Lealtad, Sorteos & Referidos (`raffles`)**:
  - `campaign`: Configuración de rifa activa, vigencia y boletos por monto.
  - `participants`: Tabla de clientes con saldo de boletos y Drawer de ajuste manual auditado.
  - `referrals`: Generador de códigos mnemotécnicos de embajadores y métricas de conversión.
  - `roulette`: Ruleta interactiva ponderada por boletos con animación Framer Motion y confetti.
- [ ] **5. Finanzas, Arqueo & Corte Z (`cashcut`)**:
  - `today-cut`: Métricas de venta bruta, ticket promedio y pedidos entregados en hora CDMX.
  - `reconciliation`: Desglose comparativo gráfico Transferencia vs. Efectivo vs. Tarjeta.
  - `export-csv`: Generación y descarga de archivo contable estructurado por fechas.
  - `z-cut`: Calculadora de arqueo físico por denominación ($500, $200, $100, $50, $20, monedas), cálculo de balance (Caja Cuadrada `$0.00`) y archivado formal.
- [ ] **6. Insumos, Recetas & Costeo (`ingredients`)**:
  - `catalog`: CRUD de materia prima en D1 con unidades (`pieza`, `g`, `kg`, `ml`, `l`) y precios de compra.
  - `recipes`: Recetario por hamburguesa vinculado al Resumen K de Cocina para Mise en Place.
  - `costing`: Dashboard de rentabilidad con Food Cost % y Margen Bruto en tiempo real.

## Ideas futuras

- Convertir Burgers.exe en SaaS.
- Mejorar QA visual manual.
- Usar Obsidian como memoria del proyecto.
- Usar Graphify como mapa técnico antes de cambios grandes.
