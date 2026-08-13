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
- **Rediseño V3 Centrado de Cuadros y Badges tipo Pill (PR #510)**:
  - **Estructura Simétrica Centrada (`AdminModuleCard.tsx`)**: Maquetación vertical totalmente centrada con contenedor de ícono V3 de 56px (`w-14 h-14`), título en negrita (`text-base font-black`) y descripción acotada (`max-w-[240px]`).
  - **Insignias de Estado tipo Pill**: Transformación de badges a "Pills" discretas con animación `animate-pulse` ubicadas al centro en la parte inferior de cada cuadro.
- **Horarios por Torre y Cutoffs Dinámicos (PR #513 & PR #514 Mergeados a Preview)**:
  - **Sincronización Dinámica D1**: `CatalogModeApp.tsx` consulta `/api/tower-schedules` al cargar y propaga los horarios reales al sub-bar, `TowerScheduleModal` y `CatalogCheckoutDrawer`.
  - **Zona Horaria Estricta**: Todas las evaluaciones de tiempo en frontend y backend se realizan con `America/Mexico_City` evitando diferencias de zona horaria del cliente.
  - **Validación Backend D1**: `functions/api/orders-v2.ts` consulta las reglas activas de `tower_schedules` en D1 para validar días activos y horarios de cierre por torre o globalmente.
  - **Fix Payload Admin (PR #514)**: Alineadas las respuestas de `/api/menu-v2-admin/tower-schedules` y `StoreBannersTool.tsx` para cargar las tarjetas de configuración sin interrupciones.
- **Submenú Cuadrado V3, Barra de Favoritos & Depuración en Admin (PR #512 Mergeado a Preview)**:
  - **Submenú Cuadrado**: Vista inicial con 4 tarjetas de opciones (*Banners del Catálogo*, *Horarios por Torre*, *Estado de la Tienda*, *Sorteo Promocional*) al ingresar a Sucursal & Banners.
  - **Barra de Accesos Rápidos (Favoritos)**: Barra superior compacta con rectángulos de acceso rápido (*🎨 Banners*, *⏰ Horarios*, *📦 Productos*, *💳 Cierre de Caja*, *🏪 Tienda*).
  - **Marcado con Estrella ⭐**: Posibilidad de fijar/desfijar cualquier herramienta a los accesos rápidos con almacenamiento persistente en `localStorage` (`chekeo_admin_favorites`).
- **Transformación Total de UI y Branding Premium Casual (Preview)**:
  - **Paleta y Temas**: Implementado Light Mode por defecto (`#F5F2EE`, `#FFFFFF`, `#1C1917`, Verde Bosque `#16A34A`) y Dark Mode slate (`#121212`, `#1E1E1E`, Verde `#22C55E`). Erradicados legados neón (`#00FF66`, `#0B0B0B`).
  - **Studio Design Spec (`default-design-spec.ts`)**: Estandarizados los valores globales a `#16A34A` / `#F5F2EE` y `var(--color-surface)`.
  - **Header e Isotipo**: Incorporado el Isotipo SVG de Smash Burger Artesanal + tipografía `Inter` en negrita.
  - **Tarjetas y Botón Quick Add**: Conteo de ítems acumulados en el botón de adición rápida `+` cuando `cartQty > 0`.
  - **Pie de Página (Footer)**: Añadido pie de página oficial ("Burgers.exe — Hecho con ❤️ para ti") con accesos directos a Tickets y WhatsApp.
  - **Verificación**: `npm run typecheck` y `npm run build:public` validados en verde (exit code 0).
