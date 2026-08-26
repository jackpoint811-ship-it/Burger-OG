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

### Entorno Oficial de Preview (GitHub Branch: `preview`)
- **Internal Chekeo Preview**: `https://burgers-exe-internal-v2-preview.pages.dev/` (Conectado a branch `preview`, D1 `burgers-exe-menu-v2-preview` y R2 `burgers-exe-assets-v2-preview`).
- **Public Order Preview**: `https://burgers-exe-public-v2-preview.pages.dev/` (Tienda pública para pruebas y validación).

### Despliegues Directos de Desarrollo V3 (GitHub Branch: `v3`)
- **Public Order V3 Dev**: `https://burgers-exe-public-v3.pages.dev`
- **Internal Chekeo V3 Dev**: `https://burgers-exe-internal-v3.pages.dev`
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
- **Paridad Total de Personalización con Producción (2026-08-24)**: Restituida la estructura canónica de `ProductDetailDrawer.tsx` con la lista de ingredientes leída de D1 (`🥗 INGREDIENTES DE LA RECETA`), los dos botones canónicos `[ 🍔 Receta Original ]` y `[ 🛠️ Personalizar ]`, chips táctiles para quitar ingredientes (`✕ Sin X`), lista de extras con controles +/- y nota de cocina. Corregidos los combos para que solo listen hamburguesas reales (filtrando `category === 'burgers'`) y habilitada la edición fluida de productos personalizados desde el carrito sin duplicidad de líneas.
- **Blindaje de Reglas de CLI y Compatibilidad de Entornos (2026-08-25)**: Creación de `GEMINI.md`, reglas modulares en `.agents/rules/` (`00-hard-constraints.md`, `01-workflow-and-branching.md`, `02-architecture-and-style.md`) y archivos de compatibilidad `CLAUDE.md` y `.cursorrules` para asegurar que cualquier agente o CLI en nuevas PCs cargue automáticamente las restricciones críticas y el flujo de trabajo sin arranques en frío desalineados.
- **Refinamiento Integral & Polish UI/UX de la Pestaña Pedidos en Chekeo V3 (2026-08-25)**: Simplificación radical de filtros a 2 niveles con Buscador Universal y menú discreto de Filtros Avanzados (Modo y Torre), integración nativa del filtro de `Archivados` (Soft-Delete) desde Cloudflare D1, barra flotante inferior de acciones en lote (`BatchActionBar`) para limpieza de turno y restauración con diálogo de confirmación seguro (`BatchConfirmModal`), grilla de 3 Hechos Clave en cada tarjeta (Total, Ubicación, Fecha con badge `📅 Programado`), iconografía SVG Lucide profesional, botón compacto tipo pastilla de `Anteriores` en la cabecera superior junto a `Ver Todos` (dejando el riel horizontal 100% numérico para fechas de calendario) y realce visual del pedido más prioritario/urgente.
- **Configuración Completa de Antigravity Hooks y Suite de QA (2026-08-25)**: Creación de `.agents/hooks.json` con hook `PreToolUse` de seguridad (`.agents/scripts/safety-guard.mjs`) que intercepta y bloquea comandos prohibidos (push a `main`, `git reset --hard`, `git add .`, borrados recursivos) de manera determinista, y creación de la skill `.agents/skills/burgers-qa` con ejecutor automatizado de matriz de checks (`git diff --check`, `npm run typecheck`, `npm run build:public`, `npm run build:chekeo`) (PR #560).
- **Pasada de UX/UI & Desaturación Visual en Pagos y Pedidos V3 (2026-08-25)**: Erradicación del ruido visual en la barra de búsqueda (eliminados botones de auto 15s y refresh manual), unificación a un solo ribbon visible de Estados, eliminación del chip de Pickup (modelo exclusivo Torre GGA y Torre Valcob), entrega directa con formato conciso por torre y depto, y fecha dinámica con rayito ⚡ (`Zap`) para hoy vs. calendario 📅 (`CalendarDays`) con fecha real para pedidos posteriores en ambas pantallas.
- **Skills Especializadas de Frontend, shadcn/ui, Accesibilidad y Tokens Tailwind v4 (2026-08-25)**: Creación de `.agents/skills/shadcn-ui/` (composición desacoplada sobre Radix UI en `packages/ui`), `.agents/skills/a11y-wcag-auditor/` (directrices WCAG 2.1 AA, contrastes, foco visible y lectores de pantalla) y `.agents/skills/tailwind-v4-tokens/` (paleta oficial Premium Casual, directiva `@theme`, grillas fluidas y safe area insets).
- **Afinación de UX/UI & Accesibilidad en Public Order V3 (2026-08-25)**: Incorporación de `safe-area-inset-bottom` en `CartBar` para móviles con barra de gestos, soporte de navegación por teclado y foco visible `:focus-visible:ring-accent` en `ProductCard`, roles semánticos ARIA (`role="tablist"` / `role="tab"`) en `CategoryNav`, atributos `aria-expanded` y `aria-haspopup="dialog"` en el selector de torres de `BrandHeader`, y optimización de targets táctiles ($\ge 44\text{px}$) en `FeaturedRail` y `ReorderModule`.
- **Afinación de la Máquina de Estados Operativa y Financiera en Chekeo V3 (2026-08-25)**: Estado `Nuevo` (🔵) reservado para pedidos de "Hoy", mientras que pedidos programados/anteriores se representan e indexan operativamente como `Preparando` (🟡). En Cocina, la comanda avanza directamente a `Listo` (🟢) con `✔ Hecha`, y en Pagos, marcar una orden como `Pagado` (individual o en lote) establece `paymentStatus: 'paid'` y actualiza el pedido a `delivered` (⚪ Entregado).
- **Interfaz General de Cocina V3 (Paso 1 - Jerarquía V3 & Erradicación de Ruido) (2026-08-25)**: Reestructuración de la vista de Cocina en 3 niveles directos (Nivel 1: Selector de Estación `role="tablist"` con `🍔 Preparación`, `🍟 Side Quest` y `📋 Resumen K` con badges numéricos reactivos; Nivel 2: Riel Horizontal de Fechas compacto; Nivel 3: Viewport Directo de Producción). Erradicación total de ruido visual (eliminados toggle foco/tablero, botones de bocina/audio, pantalla completa, refrescos manuales y banners de texto redundantes). Targets táctiles $\ge 44\text{px}$ y accesibilidad WCAG 2.1 AA.
- **Subventana de Preparación en Cocina V3 (Paso 2 - Plancha & Receta Original) (2026-08-25)**: Incorporación del distintivo explícito `✓ Receta Original` para burgers individuales y combos sin modificaciones, filtro estricto de ítems de plancha (ocultados chips de papas y bebidas en combos), modificadores críticos en alto contraste (`🔴 SIN ...` en rojo intenso, `🟢 +EXTRA ...` en verde esmeralda y notas en ámbar), foco visible y targets táctiles accesibles.
- **Subventana de Side Quest en Cocina V3 (Paso 3 - Freidora, Bebidas & Empaque) (2026-08-25)**: Especialización de la estación de Side Quest para empaque y freidora con badges semánticos (`COMBO (COMPLEMENTOS)`, `🍟 GUARNICIÓN`, `🥤 BEBIDA`, `🥫 DIP / EXTRA`), omisión de modificaciones de carnes de burgers en combos dentro de esta vista, botón de acción contextual `✔ Listo (Marcar Empacado / Listo)` y filtros de cola para visualización pura de complementos.
- **Corrección de Visibilidad en Cocina & Sincronización de Resumen K (Paso 4) (2026-08-26)**: Sincronización precisa de `KitchenDisplay.tsx` con `extractOrderTargetDate(ticket, todayStr)` para permitir navegación exacta en `⏱️ Anteriores`, `Ver Todos` y fechas programadas, enriquecimiento de `extractKitchenTicketItems` con inferencia por nombres y SKUs, y sincronización reactiva de `KitchenSummaryK` con el Riel de Fechas global eliminando controles internos redundantes (PR #572).
- **Blindaje Permanente de Entornos & Timezone CDMX (2026-08-26)**: Creación de helpers canónicos de zona horaria `getCdmxTodayString()` y `formatCdmxDateString()` en `@config/runtime-environment.ts` (`America/Mexico_City`), backend resiliente que tolera variantes de `source` en preview, y fijación de la Regla de Oro #7 en gobernanza (PR #575).
- **Refinamiento de Preparación & Side Quest en Cocina KDS (2026-08-26)**: Completado granular ítem por ítem con identificadores `unitKey`, bloqueo de avance global hasta confirmar el 100% de los ítems (Plancha + Side Quest), división visual nítida en tarjetas numeradas (`Ítem #1`, `Ítem #2`), nombres exactos de guarniciones (`🍟 Papas Lemon & Pepper`, `🍟 Papas Especiales`, `🍟 Papas OG`, `🍟 Aros de Cebolla`), modificadores 1 por 1 en lista vertical, notas fijas en la base del ítem, botones concisos `Listo` y normalización estricta de ubicaciones a `Torre GGA` o `Torre Valcob` (PR #576).
- **Flujo KDS Desacoplado por Estación & Unificación Automática de Orden Global (2026-08-26)**: Operación paralela e independiente en cocina; el parrillero en Plancha y el freidor en Side Quest despachan sus órdenes de forma independiente sin bloquearse mutuamente. `useKitchenItemTracking` unifica el estado global mediante `dispatchMap`, promoviendo automáticamente la comanda a `ready` en Cloudflare D1 en cuanto la última estación requerida confirma `Listo` (PR #577).
- **Nombre de Cliente Prominente y Acordeón Colapsable para Notas en Comandas KDS (2026-08-26)**: Máxima jerarquía visual para el nombre del cliente en el encabezado de comanda (`text-2xl sm:text-3xl font-black`), folio reubicado de forma secundaria junto a la torre, y notas de orden/ítem con acordeones interactivos y colapsables para notas largas omitiendo la sección si no existe nota (PR #578).
- **Refinamiento Integral de Resumen K & Mise en Place V3 (2026-08-26)**: Implementación del Principio de Unificación Canónica de Producto Físico (las burgers se agrupan por receta real sin duplicidad de combos, igual para guarniciones y bebidas), 4 estaciones paralelas (Plancha, Freidora, Bebidas y Extras), calculadora determinista de mise en place (Patties/carnes y Bollos de pan), panel de modificaciones (`✓ Receta Original` vs remociones agrupadas `🔴 SIN ...`), desglose logístico por torre (`Torre GGA` vs `Torre Valcob`), herramienta 1-Click para copiar reporte ordenado a WhatsApp con feedback sonoro/visual, y modo dual accesible con vista de Insumos y costeo de Cloudflare D1 (PR #579).
- **Acordeón Secuencial Automático & Badges de Personalización en Comandas KDS (2026-08-26)**: En comandas con múltiples ítems, el primer ítem pendiente se mantiene abierto por defecto mientras los demás permanecen colapsados con badges visibles (`[ 🛠️ Personalizada ]` o `[ ✓ Receta Original ]`). Al marcar `Listo` en un ítem, este se colapsa automáticamente y despliega el siguiente ítem pendiente. Al completar el último ítem pendiente, todos los acordeones se colapsan automáticamente, dejando como única acción primaria el botón de despacho global (`✔ Despachar Plancha` / `✔ Despachar Side Quest`) y diferenciando el botón interior del ítem como `↩ Desmarcar / Volver a pendiente` para evitar duplicidad o confusión visual.





