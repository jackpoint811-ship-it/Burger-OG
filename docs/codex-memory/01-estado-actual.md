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

## Última Actualización (2026-08-05)

- **Sincronización Local & PRs Recientes**:
  - **PR #438**: Reversión de cambios no solicitados en `InternalChekeoApp.tsx`, manteniendo estrictamente el fix de desbordamiento horizontal responsive en CSS (`styles.css`).
  - **PR #436**: Fix de desbordamiento horizontal en mobile para `.app-nav` y `.orders-board-shell__summary`.
  - **PR #431**: Habilitada la edición completa de texto (título, subtítulo, tag, CTA, color de fondo) para banners existentes en Central V3 (`CatalogV3Panel.tsx`).
  - **PR #432**: Bloqueada la adición al carrito de productos no disponibles (`isAvailable === false`) desde los botones de rápida adición `+` y el drawer de producto.
  - **Restauración de Flujo WhatsApp**: Actualizado el checkbox de opt-in (`Quiero unirme al grupo oficial de promociones en WhatsApp`) e incorporado el botón directo de enlace al grupo oficial de WhatsApp (`chat.whatsapp.com/GycE5zALOypGPvJVaMfbPp`) en la pantalla de éxito de checkout (`CatalogCheckoutDrawer.tsx`).
- **Aislamiento de Entorno Preview**:
  - `burgers-exe-public-v2-preview` (App Pública) e `burgers-exe-internal-v2-preview` (Chekeo V2) están 100% conectados a D1 `burgers-exe-menu-v2-preview` y R2 `burgers-exe-assets-v2-preview`.
  - La API de Preview responde `source: "d1"` sin depender de fallbacks locales ni mocks.
  - Verificado el envío de pedidos reales en Preview (`POST /api/orders-v2`) con folio de prueba y persistencia en D1 Preview.
  - Se confirmó **0% de contaminación** con el entorno de Producción (`burgers-exe-menu-live`).
- **Autenticación Local Vite**: `apps/internal-chekeo-v2/src/lib/internal-auth.ts` ajustado para admitir autenticación local dev (`1234` o `0000`) cuando el dev server corre con Vite sin Functions.
- **Herramientas de QA**: Creado `scripts/preview-reset-orders.sql` y script `npm run db:v2:preview:reset-orders`.
