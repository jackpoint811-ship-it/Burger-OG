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

## Última Actualización (2026-08-04)

- **Sincronización Local**: La rama local `preview` está 100% alineada con `origin/preview` (incluye PR #426, PR #427, PR #428 y PR #429).
- **Correcciones en Checkout**:
  - **PR #428**: Normalización de teléfonos a 10 dígitos (removiendo prefijos +52/521/044/045), persistencia de datos del cliente en `localStorage` (`pov2-customer-name`, `pov2-customer-phone`, `pov2-customer-location`) y eliminación de atributos HTML5 `required` en modal de catálogo para evitar falsos errores de validación.
  - **PR #429**: Ampliación del límite de longitud de `customerName` en la API backend `POST /api/orders-v2` (`functions/api/orders-v2.ts`) de 80 a 300 caracteres, resolviendo el error HTTP 400 Bad Request al enviar metadatos concatenados de ubicación y horario programado.
- **Aislamiento de Entorno Preview**:
  - `burgers-exe-public-v2-preview` (App Pública) e `burgers-exe-internal-v2-preview` (Chekeo V2) están 100% conectados a D1 `burgers-exe-menu-v2-preview` y R2 `burgers-exe-assets-v2-preview`.
  - La API de Preview responde `source: "d1"` sin depender de fallbacks locales ni mocks.
  - Verificado el envío de pedidos reales en Preview (`POST /api/orders-v2`) con folio de prueba y persistencia en D1 Preview.
  - Se confirmó **0% de contaminación** con el entorno de Producción (`burgers-exe-menu-live`).
- **Autenticación Local Vite**: `apps/internal-chekeo-v2/src/lib/internal-auth.ts` ajustado para admitir autenticación local dev (`1234` o `0000`) cuando el dev server corre con Vite sin Functions.
- **Herramientas de QA**: Creado `scripts/preview-reset-orders.sql` y script `npm run db:v2:preview:reset-orders`.
