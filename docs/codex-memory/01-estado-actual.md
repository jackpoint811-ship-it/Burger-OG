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

- **Afinación de Vista de Cocina (Kitchen View V2)**:
  - **Unificación de Conteo**: Un solo badge de progreso contextual (`🍔 0/1 Burgers` en Preparación vs `🍟 0/1 Sides · 🥤 0/1 Bebidas` en Side Quest). Removidos pills de conteo sintético duplicados bajo el nombre del cliente.
  - **Notas Deduplicadas**: `NOTA DEL PEDIDO` concentrada únicamente en la cabecera de la orden activa, removiendo la concatenación redundante dentro de las tarjetas individuales de cada ítem.
  - **Estandarización de Side Quest**: Chips de origen legibles (`De combo · [Nombre]` en dorado vs `Individual` en cyan).
  - **Cola de Pedidos KDS**: Rediseño de la cola con tarjetas limpias de alto contraste, tiempo transcurrido en minutos y selección interactiva directa de la orden activa.

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
- **Persistencia End-to-End de Entrega (`delivery_json`)**:
  - `POST /api/orders-v2` guarda `delivery_json` directamente en `orders_v2` de D1.
  - `mapD1OrderToOrderV2` extrae metadatos de entrega desde `items[].snapshot.delivery` si `delivery_json` viniera nulo.
  - `InternalChekeoApp.tsx` filtra con precisión las fechas (`all`, `today`, `past`, `YYYY-MM-DD`), garantizando que órdenes programadas (ej. día 10) se muestren correctamente.
- **Consolidación y Refinamiento V3 (PR #494 Adaptado a Main)**:
  - **SkeletonLoader Profesional**: Reemplazado el antiguo `LoadingOverlay` por un `SkeletonLoader` mobile-first en `PublicOrderApp.tsx`, ubicado estrictamente por debajo de todos los React Hooks para cumplir con las reglas de resiliencia de React (#501 - #503).
  - **Purga de Mocks/Fallbacks Residuales**: Removida la importación de `mockOrders` en `InternalChekeoApp.tsx`, simplificado el tipo de origen y eliminados los banners neón de "Vista local".
  - **Limpieza Estética Premium Casual**: Eliminadas las clases neón/oscuras en `CatalogAdminPanel.tsx`, adoptando la paleta neutra Premium Casual Vibe (`bg-white`, `border-neutral-200`, `text-green-700`).
  - **Interruptor Dinámico en D1**: Conectada la herramienta `StoreBannersTool.tsx` con el endpoint de API `/api/menu-v2-admin/site-config` en D1, permitiendo encender o apagar la tienda pública en tiempo real sin recompilar.

