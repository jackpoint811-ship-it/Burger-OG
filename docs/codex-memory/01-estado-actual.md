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

- **Despliegue Exitoso a Producción Cloudflare Pages**:
  - `burgers-exe`: `https://ae203d2c.burgers-exe.pages.dev` (Producción `https://burgers-exe.pages.dev`).
  - `chekeo2-0`: `https://92a46261.chekeo2-0.pages.dev` (Producción `https://chekeo2-0.pages.dev`).
  - **Smoke Tests**: `/api/menu-v2` (`source: d1`, 20 items, 5 cats) y `/api/tower-schedules` (2 torres) operando en vivo al 100%.
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
- **Submenú Cuadrado V3, Barra de Favoritos & Depuración en Admin (PR #512 Mergeado a Preview)**:
  - **Submenú Cuadrado**: Vista inicial con 4 tarjetas de opciones en Central V3.
  - **Barra de Accesos Rápidos (Favoritos)**: Barra superior compacta con accesos rápidos personalizables.

