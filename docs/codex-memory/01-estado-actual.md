> Estado: vivo
> Uso: memoria operativa para Codex/Burgers.exe

# Estado actual de Burgers.exe

## Contexto general

Burgers.exe tiene una app pública de pedidos y una app interna de Chekeo.

## Reglas importantes

- `AGENTS.md` manda sobre esta memoria.
- Los cambios deben terminar en Pull Request cuando el usuario apruebe el cierre.
- Usar Graphify antes de cambios grandes o de arquitectura.
- No tocar `legacy/` sin autorización.
- No meter dependencias nuevas sin autorización.
- Mantener enfoque mobile-first.
- Mantener UX clara, accesible y consistente con la marca.

## Estado funcional deseado

- Pedidos: revisar pedidos con detalle, sin saturar con descarga/envío de imagen.
- Pagos: concentrar ticket, WhatsApp y comprobante.
- Corte: debe funcionar bien y mostrar resumen operativo.
- Resumen K: debe mostrar burgers, ingredientes, extras y cantidades necesarias.
- Sorteo: debe mostrar lo más importante sin saturar.

## Hito reciente - 2026-08-13

- **Refactor Integral de Branding, Color, UX/UI y Calendario Horizontal en Chekeo V2 (Rama `preview`)**:
  - **Erradicación Total Legacy & Hardcodeado**: Eliminadas todas las clases de estética anterior (`bg-black`, `border-cyan-400`, `text-violet-100`, `bg-zinc-950`, `text-zinc-50`) en `InternalChekeoApp.tsx`, `HorizontalDateCalendarFilter.tsx`, `RafflesAdminPanel.tsx`, `KitchenQueue.tsx`, `KitchenSummaryK.tsx`, `StoreBannersTool.tsx`, `InternalV2ErrorBoundary.tsx` y `styles.css`.
  - **Unificación de Tokens Semánticos**: Toda la app ahora consume variables `:root` / `.theme-dark` (`--color-surface`, `--color-surface-raised`, `--color-accent`, `--color-accent-soft`, `--color-text-primary`, `--color-text-secondary`, `--color-text-muted`, `--color-line`, `--shadow-card`, `--shadow-panel`).
  - **Filtro Estricto de Calendario Horizontal**:
    - "Ver Todos" (`all`): Muestra exclusivamente pedidos de **Hoy y futuros** (`targetDateStr >= todayStr`).
    - "Anteriores" (`past`): Filtra pedidos de **fechas pasadas** (`targetDateStr < todayStr`).
    - Píldoras de fecha individual: `YYYY-MM-DD` y `today`.
    - Conteo semántico de pendientes futuros vs pasados (`totalPendingUpcoming` vs `pastPendingCount`).
    - Controles de desplazamiento lateral (botones de navegación y auto-scroll centrado con `scrollIntoView`).
  - **Estética Burgers.exe Premium Casual**: Light mode cálido con tarjetas blancas y acento Verde Bosque (`#16A34A`), Dark mode Slate/Carbón limpio (`#121212` / `#1E1E1E`), bordes sutiles y sombras de elevación.
  - **Limpieza de Iconografía**: Reemplazados emojis por iconos SVG semánticos de Lucide (`Clock`, `Calendar`, `ChevronLeft`, `ChevronRight`, `Filter`, etc.).
  - **Checks 100% en Verde**: `git diff --check`, `npm run typecheck`, `npm run build:internal` y `npm run build:public` completados sin errores.
- **Despliegue Exitoso a Producción Cloudflare Pages (PR #524)**:
  - `burgers-exe`: `https://2ba33818.burgers-exe.pages.dev` (Producción canónica `https://burgers-exe.pages.dev`).
  - `chekeo2-0`: `https://36b5f36d.chekeo2-0.pages.dev` (Producción canónica `https://chekeo2-0.pages.dev`).
  - **Smoke Tests Post-Deploy**:
    - `/api/menu-v2` (`source: d1`, 20 items, 5 categorías) ➡️ `200 OK`.
    - `/api/tower-schedules` (2 torres: GGA y Valcob) ➡️ `200 OK`.
    - `/api/internal-v2-auth/status` (`authenticated: false`) ➡️ `200 OK`.
  - **PR #524 Mergeado en Main (Producción Oficial)**: `https://github.com/jackpoint811-ship-it/Burgers-exe/pull/524` promovido exitosamente desde `preview` a `main`.
- **Hotfix Producción - Combos Quick Add & Guarniciones (PR #525 - 2026-08-13)**:
  - **Incidente PB-I8319 Resuelto**: En la orden `PB-I8319`, el Combo BBQ Master agregado vía Quick Add no registraba guarnición ni burger, mostrando "Guarnición estándar" en cocina.
  - **Ajuste D1 Producción**: Se corrigió el snapshot del ítem en `burgers-exe-menu-live` para asociar `Papas OG` y `Burger BBQ`.
- **Sincronización y Validación Integral de Horarios y Pausa de Torres (Chekeo ↔ Public Order V2)**:
  - **Single Source of Truth**: `/api/tower-schedules` devuelve el estado real de todas las torres configuradas (`isActive: boolean`) con cabeceras `no-store, no-cache, must-revalidate` para actualización inmediata.
  - **Erradicación de Fallbacks Sintéticos**: `TowerScheduleModal.tsx` (`getTowerStatus`) evalúa torres reales de D1, soportando torres pausadas administrativamente (`isPaused`) e impidiendo fallbacks sintéticos que reactiven torres pausadas.
  - **Motor Dinámico de Estado de Tienda y Preventa Proactiva**: `CatalogModeApp.tsx` calcula reactivamente el badge de la tienda (`🔴 Tienda en mantenimiento`, `📅 Programa tu pedido` interactivo en tono ámbar para entregas futuras/preventa 24/7, `🟢 Tomando pedidos hoy`) respetando `publicConfig.catalogEnabled` y la disponibilidad real de las torres.
  - **UX de Pedidos Programados y Conversión**: En `TowerScheduleModal.tsx` y `CatalogCheckoutDrawer.tsx` se sustituyeron los mensajes prohibitivos de "cerrado" por llamadas de preventa (*"📅 Programar Entrega"*, *"💡 Programa tu pedido a continuación para su próxima fecha de entrega"*), evitando fuga de clientes fuera de horario.
  - **Validación Estricta en Checkout y Backend**: `CatalogCheckoutDrawer.tsx` bloquea *"⚡ Entregar Hoy"* para ubicaciones pausadas, y `functions/api/orders-v2.ts` rechaza en backend cualquier orden para torres con `is_active = 0` con código `400 LOCATION_PAUSED`.
  - **Normalización Robusta en Admin**: `functions/api/menu-v2-admin/tower-schedules/[id].ts` normaliza formatos de hora (`H:MM` y `HH:MM`) a `HH:MM` (`09:00`) y soporta matching por `id` y `tower_key`.
- **PR #525 Mergeado en Main**: `https://github.com/jackpoint811-ship-it/Burgers-exe/pull/525`.
- **PR #521 Mergeado en `preview`**: Fix de posicionamiento sticky de cabecera de categorías (`.catalog-category-sticky-header`) en **Public Order V2**:
  - **Causa raíz corregida**: Se cambió `overflow-x: hidden !important;` a `overflow-x: clip !important;` en `.catalog-shell` bajo media query móvil (<= 480px) para no destruir el contexto de scroll root (`window`) que requiere `position: sticky`.
  - **Scroll Margin Top**: Añadido `scroll-margin-top: calc(112px + env(safe-area-inset-top))` a `.catalog-grid` para alineación precisa de scroll al hacer click en las píldoras de categorías.
- **PR #520 Mergeado en `preview`**: Erradicación total de elementos hardcodeados, fallbacks sintéticos e identidad CSS legada en **Public Order V2** y **Chekeo V2**:
  - **Torres & Checkout Dinámicos**: Mapeo 100% dinámico de `tower_schedules` en `CatalogCheckoutDrawer.tsx`, `TowerScheduleModal.tsx`, `CatalogModeApp.tsx` y `PublicOrderApp.tsx`.
  - **Badges Sintéticos Eliminados**: Removido `fallbackBadges` en `LayoutEngine.tsx`.
  - **Configuración Bancaria Dinámica**: Extendido `SiteConfig` en `packages/config/src/contracts.ts` con `bankPaymentConfig` y `whatsappTemplates` dinámicos desde D1.
  - **Limpieza de Assets & Fallbacks**: Eliminados fallbacks `/placeholders/*.jpg` y strings hardcodeados en `kitchen-helpers.ts`.
  - **Limpieza CSS Legada**: Reemplazados fondos e indicadores neón hardcodeados por variables del tema (`var(--color-surface)`, `var(--color-accent)`).
- **PR #518 Mergeado en `preview`**: Se completó la refactorización integral de colores y branding en **Chekeo Preview** (`apps/internal-chekeo-v2` y `packages/ui`), erradicando clases legadas dark/cyberpunk (`bg-zinc-950`, `bg-cyan-400`, `border-zinc-800`) e implementando la estética **Premium Casual Vibe** (Light Mode `#F5F2EE` base background, `#FFFFFF` cards, `#16A34A` Forest Green accent; Dark Mode Slate `#121212` / `#1E1E1E`).
- **Sincronización Local & PRs Recientes**:
  - **PR #438**: Reversión de cambios no solicitados en `InternalChekeoApp.tsx`, manteniendo estrictamente el fix de desbordamiento horizontal responsive en CSS (`styles.css`).
  - **PR #436**: Fix de desbordamiento horizontal en mobile para `.app-nav` y `.orders-board-shell__summary`.
  - **PR #431**: Habilitada la edición completa de texto (título, subtítulo, tag, CTA, color de fondo) para banners existentes en Central V3 (`CatalogV3Panel.tsx`).
  - **PR #432**: Bloqueada la adición al carrito de productos no disponibles (`isAvailable === false`) desde los botones de rápida adición `+` y el drawer de producto.
  - **Restauración de Flujo WhatsApp**: Actualizado el checkbox de opt-in (`Quiero unirme al grupo oficial de promociones en WhatsApp`) e incorporado el botón directo de enlace al grupo oficial de WhatsApp en la pantalla de éxito de checkout (`CatalogCheckoutDrawer.tsx`).
- **Aislamiento de Entorno Preview**:
  - `burgers-exe-public-v2-preview` (App Pública) e `burgers-exe-internal-v2-preview` (Chekeo V2) están 100% conectados a D1 `burgers-exe-menu-v2-preview` y R2 `burgers-exe-assets-v2-preview`.
- **Horarios por Torre y Cutoffs Dinámicos (PR #513 & PR #514 Mergeados a Preview)**:
  - **Sincronización Dinámica D1**: `CatalogModeApp.tsx` consulta `/api/tower-schedules` al cargar y propaga los horarios reales al sub-bar, `TowerScheduleModal` y `CatalogCheckoutDrawer`.
  - **Zona Horaria Estricta**: Todas las evaluaciones de tiempo en frontend y backend se realizan con `America/Mexico_City` evitando diferencias de zona horaria del cliente.
  - **Validación Backend D1**: `functions/api/orders-v2.ts` consulta las reglas activas de `tower_schedules` en D1 para validar días activos y horarios de cierre por torre o globalmente.
  - **Fix Payload Admin (PR #514)**: Alineadas las respuestas de `/api/menu-v2-admin/tower-schedules` y `StoreBannersTool.tsx` para cargar las tarjetas de configuración sin interrupciones.
- **Submenú Cuadrado V3, Barra de Favoritos & Depuración en Admin (PR #512 Mergeado a Preview)**:
  - **Submenú Cuadrado**: Vista inicial con 4 tarjetas de opciones (*Banners del Catálogo*, *Horarios por Torre*, *Estado de la Tienda*, *Sorteo Promocional*) al ingresar a Sucursal & Banners.
  - **Barra de Accesos Rápidos (Favoritos)**: Barra superior compacta con rectángulos de acceso rápido (*🎨 Banners*, *⏰ Horarios*, *📦 Productos*, *💳 Cierre de Caja*, *🏪 Tienda*).
  - **Marcado con Estrella ⭐**: Posibilidad de fijar/desfijar cualquier herramienta a los accesos rápidos con almacenamiento persistente en `localStorage` (`chekeo_admin_favorites`).


