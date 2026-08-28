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
| V3-KitchenMods | Aislamiento Estricto Estaciones + Mods Desaturados | ✅ Mergeado (#596) |
| V3-ChekeoAudit | Auditoría Integral 360° Chekeo V3 + Hardening A11y & Timezone | ✅ Mergeado (#602) |
| V3-AdminMobile | Rediseño Mobile-First Admin + Sincronización Sub-Herramientas | ✅ Mergeado (#609) |
| V3-ResumenKHome | Resumen K como Home & KDS Especializado en 2 Estaciones | ✅ Mergeado (#615) |

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
- **Acordeón Secuencial Automático & Badges de Personalización en Comandas KDS (2026-08-26)**: En comandas con múltiples ítems, el primer ítem pendiente se mantiene abierto por defecto mientras los demás permanecen colapsados con badges visibles (`[ 🛠️ Personalizada ]` o `[ ✓ Receta Original ]`). Al marcar `Listo` en un ítem, este se colapsa automáticamente y despliega el siguiente ítem pendiente. Al completar el último ítem pendiente, todos los acordeones se colapsan automáticamente, dejando como única acción primaria el botón de despacho global (`✔ Despachar Plancha` / `✔ Despachar Side Quest`) y diferenciando el botón interior del ítem como `↩ Desmarcar / Volver a pendiente` para evitar duplicidad o confusión visual (PR #580, PR #581).
- **Mise en Place, Precocción de Side Quests, Carne Extra & Checklist de Restock Diario en Resumen K (2026-08-26)**: Potenciación de Resumen K como centro neurálgico de arranque del turno: calculadora de 7 insumos físicos indispensables (🥩 Patties con soporte de carne extra, 🍞 Bollos, 🧀 Queso Americano, 🥓 Tocino, 🍟 Guarniciones, 🥤 Bebidas, 🥫 Dips), desglose de pesaje y precocción para papas y aros, filtros tipo chip por estación (`[ 🌐 Todas ]`, `[ 🍔 Plancha ]`, `[ 🍟 Freidora ]`, `[ 🥤 Bebidas ]`, `[ 🥫 Extras ]`), panel de modificaciones con lista detallada de hamburguesas afectadas por cada remoción (`↳ 2x Doble con Queso · 1x Sencilla`), insignias `[ +X extra carne ]` en plancha y eliminación total de la función de copiar WhatsApp para mantener la UI limpia (PR #582).
- **Desglose Logístico de Empaque por Torre en Posición Primaria en Resumen K (2026-08-26)**: Reorganización jerárquica de Resumen K colocando el módulo de Desglose Logístico por Torre (`Torre GGA` vs `Torre Valcob`) en la parte superior para facilitar la visión de despacho y armado de bolsas, seguido por el Checklist de Insumos & Restock, los filtros por estación, la cuadrícula de 4 estaciones en paralelo y el panel de modificaciones (PR #583).
- **Refinamiento Integral de Pagos & Conciliación V3 (Selector de Período, Mini Calendario & Terminología Canónica) (2026-08-26)**: Creación de `PaymentPeriodSelector` con accesos rápidos de arqueo (`⚡ Hoy`, `⏱️ Ayer`, `📅 Esta Semana`, `🌐 Todo`) y **Mini Calendario Mensual Popover** con indicadores verdes en días con cobros registrados y selección de fecha exacta. Estandarización de terminología canónica erradicando "SPEI" por **Transferencia**, "Efectivo en Entrega" por **Efectivo** y "Por Validar/Conciliar" por **Por confirmar**. Redefinición del KPI **Por confirmar** para totalizar y filtrar todos los pagos pendientes de cualquier método en 1-clic.
- **Claridad & Certeza de Personalización por Volumen en Tienda Pública V3 (2026-08-26)**: Incorporación de banner animado e informativo en `ProductDetailDrawer.tsx` cuando `quantity > 1` y existen personalizaciones activas (`Las N hamburguesas se prepararán con esta misma personalización. ¿Quieres otra con receta original? Agrégalas por separado`), micro-copy semántico bajo el stepper (`×N personalizadas iguales` vs `×N receta original`), botón CTA adaptativo (`[ Agregar N burgers personalizadas · $XXX ]` vs `[ Agregar N burgers (Original) · $XXX ]`) e insignia reaseguradora `✨ Aplica a las N unidades` en cada tarjeta de producto del carrito en `CartDrawer.tsx`.
- **Sub-Barra de Torres & Rutas Corporativas en Vivo en Public Order V3 (2026-08-26)**: Rediseño completo de la experiencia de selección de torres y rutas corporativas: sub-barra horizontal con píldoras interactivas directas en `BrandHeader.tsx` (`[ 🏢 Torre GGA · 🟢 Hoy ]` / `[ 🏢 Torre Valcob · 📅 Programar ]`), apertura contextual del modal `TowerScheduleModal.tsx` con banner de alto contraste para la torre en foco, días de entrega en lenguaje natural, y sincronización inteligente en el paso 1 de `CheckoutDrawer.tsx` con conmutación automática de preventa/pedidos programados (PR #587).
- **Panel de Control de Admin V3 (Dashboard en 2 Columnas, Favoritos Rápidos, Breadcrumbs & PIN Exclusivo) (2026-08-26)**: Desacoplamiento total del bloqueo inicial por PIN en `ChekeoApp.tsx` para acceso libre e inmediato a `Operación`, `Pedidos`, `Cocina (KDS)` y `Pagos`. Protección PIN exclusiva en `AdminView` mediante `AdminAuthGate` con teclado táctil numérico de 48px y botón `🔒 Bloquear Admin`. Transformación del workspace en un Panel de Control interactivo con Migas de Pan semánticas (`AdminBreadcrumbs`), franja superior de Accesos Rápidos en 6 pastillas/cuadritos compactos (`AdminQuickFavorites`), cuadrícula en 2 columnas con 6 tarjetas enriquecidas (`AdminDashboardGrid`) con KPIs en tiempo real y gobernanza Timezone CDMX con terminología canónica (*Transferencia*, *Efectivo*, *Por confirmar*) en `CashCutPanel.tsx` (PR #588).
- **Indicador de Estado Global de Tienda & Torres Informativas en Public Order V3 (2026-08-26)**: Desacoplamiento de la selección de ubicación del header (la selección de torre para el pedido se realiza exclusivamente en el checkout), sub-barra de torres puramente visual e informativa, integración del Badge de Estado Global de la Tienda (`🟢 Tomando Pedidos Hoy` / `📅 Preventa 24/7` / `🔴 Cocina Pausada` / `🔴 Tienda en Mantenimiento`) y banner de alerta crítica si la tienda o cocina están cerradas.
- **Header Simplificado V3 & Semáforo de Torres por Color (2026-08-26)**: Reubicación del estado operativo global a la cabecera principal junto al nombre de la marca con formato trifásico interactivo (`🟢 Abierto Hoy` / `📅 Preventa 24/7` / `🔴 Cerrado`), eliminación total del botón redundante "Horarios" y simplificación radical de la sección de torres a una franja ultra compacta sin scroll horizontal (`overflow-x-auto` eliminado) con píldoras semánticas por color (`🟢 Verde = Abierto/Hoy`, `🟡 Amarillo = Programar/Próxima ruta`, `🔴 Rojo = Pausado/Cerrado`) que abren interactivamente el modal de horarios de entrega al hacer clic.
- **Panel de Control de Admin V3 Inmersivo en 2 Columnas & Submenús Dedicados (2026-08-26)**: Reestructuración de la pestaña Admin en un Hub de 6 Categorías Maestras en cuadrícula de 2 columnas (`grid-cols-1 md:grid-cols-2`), navegación profunda a Submenús interactivos en 2 columnas por categoría (`AdminCategorySubmenu`), Buscador Universal Command Palette (`AdminSearchBar` con atajo `⌘K` / `Ctrl+K`), Favoritos Dinámicos y Fijables (`AdminQuickFavorites` con pin/unpin ⭐ y persistencia en `localStorage`) y Migas de Pan Guiadas (`AdminBreadcrumbs`) con soporte nativo para retroceso con tecla `Escape` (PR #592).
- **Workspace Maestro-Detalle de Nivel Industrial en Admin V3 (2026-08-26)**: Reingeniería de la experiencia de Admin adoptando el patrón estándar de la industria (Linear / Stripe / Toast POS): Hub de Entrada en 2 Columnas (`AdminHubGrid`) con franja de Favoritos y métricas en vivo, y transición a un Espacio de Trabajo Dedicado a Pantalla Completa (`AdminModuleWorkspace`) con Sidebar Lateral Izquierdo de herramientas del módulo + accesos rápidos a favoritos, y Lienzo Central Derecho espacioso a ancho completo para trabajo operativo sin saturación ni elementos estáticos estorbando (PR #593).
- **Refinamiento Mobile-First del Workspace de Admin V3 (2026-08-26)**: Adaptación ergonómica completa para smartphones (< 768px): cabecera compacta y limpia con título condensado (`AdminModuleWorkspace`), barra segmentada tipo pastillas flotantes (`Segmented Rail`) para conmutar herramientas sin desperdicio de espacio vertical, y padding responsivo optimizado para máxima amplitud de tablas y lienzos en pantallas táctiles (PR #594).
- **Cuadrícula Estricta de 2 Columnas en Móvil para Favoritos & Categorías Maestras en Admin V3 (2026-08-26)**: Reemplazo del riel con scroll por una cuadrícula estricta de 2 columnas de cuadritos compactos táctiles en móvil (`grid-cols-2`) para Favoritos Rápidos (`AdminQuickFavorites`) y ajuste de las 6 Categorías Maestras (`AdminHubGrid`) con tarjetas bento proporcionales (`grid-cols-2 gap-2.5`) con 0 scrolls, 100% visibles y accionables con 1 toque.
- **Aislamiento de Estaciones & Modificadores Desaturados en Cocina KDS (2026-08-27)**: Filtrado determinista por estación en `KitchenDisplay` y `CocinaView` (cero pedidos sin guarniciones/bebidas en Side Quest), pastillas unificadas y desaturadas `- [Mod]` y `+ [Extra]` erradicando textos saturados y puntos parpadeantes (PR #596).
- **Pipeline Integral de Multiplicadores de Extras, Precios Promo & Acordeones Colapsables (2026-08-27)**:
  - Preservación estricta de cantidades en extras en Frontend (`ProductDetailDrawer.tsx`), Backend (`orders.ts`), Cocina KDS (`kitchen.types.ts`) y Tickets (`ticket.utils.ts`), mostrando formato exacto `+10 Aros de cebolla`, `+2 Tocino` (PRs #597, #598, #599).
  - Corrección de cálculo de precio en backend: multiplicación del precio de extras por su cantidad (`price_cents / 100 * qty`) y cálculo de promociones activas (`promo_price_cents` / `is_promo_active`), erradicando discrepancias entre Checkout y confirmación de Chekeo (PR #599).
- **Refinamiento & Homogeneización Integral de Tarjetas de Pedidos y Pagos en Chekeo V3 (2026-08-27)**:
  - Eliminación de la redundancia de precio (conservado exclusivamente en la cabecera superior derecha) y optimización de la caja de Hechos Clave a 2 columnas amplias (`Entrega` a Torre/Depto y `Fecha` operativa CDMX con `getCdmxTodayString()`).
  - Estandarización de accesibilidad WCAG 2.1 AA con targets táctiles $\ge 44\text{px}$ en botones de copiado de folio y WhatsApp directo, y anillos de foco visibles en acordeones.
  - Sincronización fiel de los Skeletons de carga en `OrdersList.tsx` y `PaymentsList.tsx` a la nueva cuadrícula de 2 hechos clave.
- **Soporte Dual para Activador Maestro & Nomenclatura Descriptiva de Conversaciones (2026-08-27)**:
  - Actualización de `AGENTS.md`, `GEMINI.md`, `.agents/skills/burgers-exe/SKILL.md` y `.agents/rules/00-hard-constraints.md` para soportar Modo Estatus (`burgers.exe` solo) y Modo Acción Directa (`burgers.exe: <tarea>`, `/plan burgers.exe: <tarea>`, `/burgers <tarea>`).
  - Permite titular conversaciones de forma descriptiva en la UI de Antigravity y ejecutar tareas inmediatamente con contexto precargado.
- **KPIs Financieros Reactivos por Período & Claridad Total de Cobros en Chekeo Pagos V3 (2026-08-27)**:
  - Scoping reactivo de `financialSummary` y conteos de estado en `usePayments` hacia el período seleccionado (`periodOrders`: Hoy, Ayer, Esta Semana, Fecha de calendario, Anteriores o Todo), erradicando métricas globales engañosas.
  - Inclusión de métricas de efectivo pendiente (`pendingCashCount`, `pendingCashAmount`) junto a transferencias (`pendingTransferCount`, `pendingTransferAmount`) en `FinancialSummary`.
  - Rediseño enriquecido de las 4 tarjetas KPI en `PaymentKpiHeader` con títulos contextuales (`Venta de Hoy`, `Venta de Ayer`, etc.), subtextos de cobros realizados vs pendientes y desglose explícito en la tarjeta 4 (**Por Cobrar / Confirmar**) para saber de inmediato cuánto dinero falta por cobrar hoy.
  - Filtro interactivo 1-clic toggle en KPIs que mantiene al operador en el día/período en curso sin forzar la fecha a Todo.
- **Skill Especializado de Componentes Dinámicos & Suite de UI Interactiva para Public y Chekeo (2026-08-27)**:
  - Creación del skill `.agents/skills/dynamic-ui-components/` con estándares y recetas para componentes interactivos de Frontend.
  - Suite en `packages/ui`: `QuantityStepper` con feedback táctil $\ge 44\text{px}$, `Drawer` con física de resorte y gesto de arrastre (*drag-to-dismiss*), `KpiCard` para dashboards y `SegmentedControl` con pastilla deslizante `layoutId`.
  - Integración en `ProductDetailDrawer`, `CartDrawer` y `OperacionView`.
- **Erradicación Definitiva de Reloj de Estrés Prohibido en Chekeo V3 (2026-08-27)**:
  - Eliminación total del componente `LiveTimerBadge` (`packages/ui/src/timer-badge.tsx`) y su consumo en `OperacionView.tsx`.
  - Reafirmación estricta de la regla de oro operativa de la Sesión 18 / PR #549 (Cero relojes de presión o semáforos de urgencia por minutos en cocina/operación).
- **Optimización Integral de Contraste en Modo Oscuro Deep Slate (2026-08-28)**:
  - Calibración de la jerarquía visual y elevación en `.theme-dark` para `apps/public-order-v3` y `apps/internal-chekeo-v3` (Fondo `#0C0E12`, Tarjetas `#161922`, Superficie Elevada `#202531`, Bordes nítidos `#2E3545` y Sombras profundas).
  - Cumplimiento estricto WCAG 2.1 AAA/AA: Texto primario `#F8FAFC` (15.8:1), texto secundario `#94A3B8` (8.2:1) y texto muted `#8492A6` (6.0:1, erradicando fallos previos de 3.4:1).
  - Chips de remoción y modificación en alto contraste con `dark:text-red-400` en `ProductDetailDrawer`.
- **Integración de Taste Skill & Criterio de Diseño Artesanal Anti-Slop (2026-08-28)**:
  - Creación del skill `.agents/skills/taste-skill/` con directivas deterministas anti-slop de IA (prohibición de gradientes violetas artificiales, tarjetas clónicas y micro-textos ilegibles).
  - Calibración de Design Dials adaptada al ecosistema Burgers.exe (tienda pública editorial y apetecible vs. Chekeo POS/KDS con alta densidad y cero distracción).
  - Integración en las reglas del monorepo (`.agents/rules/02-architecture-and-style.md`) y checklist de calidad de diseño para PRs.
- **Auditoría & Aplicación Integral de Taste Skill (2026-08-28)**:
  - Unificación de tokens de diseño en modo claro de Chekeo (`globals.css`) con la paleta cálida oficial Premium Casual (`#EAE6E1`, `#0F172A`, `#475569`, `#64748B`, `#E2DCD5`).
  - Tipografía & números tabulares (`tabular-nums`) en precios, subtotales y KPIs en `ProductCard`, `FeaturedRail`, `ProductDetailDrawer`, `CartBar`, `CartDrawer` y `OperacionView`.
  - Micro-interacciones táctiles responsivas (`active:scale-[0.98]`, `active:scale-[0.96]`, `active:scale-[0.92]`) y áreas táctiles $\ge 44\text{px}$ en botones de catálogo, barras flotantes e icono de botón base.
- **Resumen K como Pantalla de Inicio (Home) & Especialización de Cocina KDS (2026-08-28)**:
  - Consolidación de la Pestaña 1 como `Resumen K` (`ResumenKView.tsx`), integrando la barra ejecutiva superior de 4 KPIs del Turno reactivos a la fecha seleccionada (*Cocina Activa*, *Por Cobrar*, *Pedidos Activos*, *Venta del Período*) con navegación cruzada 1-clic.
  - Integración nativa del Riel de Fechas Horizontal (`HorizontalDateCalendarFilter`) con Zona Horaria Oficial CDMX (`getCdmxTodayString()`).
  - Desacoplamiento total de `Resumen K` de `CocinaView.tsx`, simplificando Cocina a 2 estaciones de ejecución KDS en vivo (`🍔 Preparación` y `🍟 Side Quest`) con cero distracciones en hora pico.
