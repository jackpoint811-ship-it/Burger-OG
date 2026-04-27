# Fase 0 — Auditoría funcional integral (Burger-OG)

## Contexto y objetivo
Esta auditoría aterriza el comportamiento real de la app actual (Google Apps Script + HTML embebido en Spreadsheet) para preparar una reconstrucción incremental orientada a estabilidad, modularidad y mantenibilidad.

## A. Inventario funcional real

### 1) Superficie funcional actual (pantallas / rutas / features)
La app actual no es multipágina: funciona como una sola vista (dialog HTML) con overlays de estado.

| Área | Comportamiento real actual | Fuente de verdad |
|---|---|---|
| Boot UI | Al `DOMContentLoaded` ejecuta `loadOrders()` y registra Escape para cerrar confirmación. | `burger.html` |
| Vista principal | Renderiza: header, contador de órdenes activas, tarjeta “Pedido actual”, tarjeta “Siguiente”, y botón LISTO. | `burger.html` |
| Estado vacío | Si no hay órdenes activas (`PENDIENTE` / `EN PREP`), muestra “Sin pedidos activos”. | `burger.html` + filtro en backend |
| Confirmación LISTO | Overlay de confirmación previo a escritura. | `burger.html` |
| Actualización de estado | Marca pedido como `LISTO`, coloca timestamps y recarga órdenes. | `Code.gs` + `burger.html` |
| Sincronización de datos | Menú de Sheets `M Tools` permite sincronizar `Chekeo` desde `Pedidos Master`. | `Code.gs` |
| Diagnóstico operativo | Menú con contador de órdenes activas detectadas en hoja `Chekeo`. | `Code.gs` |

### 2) Flujos reales (what it *actually* does)

#### Flujo F1 — Apertura de app
1. Usuario abre menú `M Tools` > `Open Chekeo App`.
2. Se abre diálogo modeless con `burger.html`.
3. Frontend llama `getChekeoOrders()`.
4. Backend devuelve solo órdenes activas (`PENDIENTE`/`EN PREP`) ordenadas por fila de origen.
5. Frontend renderiza “actual” y “siguiente”.

#### Flujo F2 — Sincronización Master → Chekeo
1. Usuario ejecuta `Sync Chekeo`.
2. Se lee hoja `Pedidos Master` completa (desde fila 2).
3. Se reconstruye toda la hoja `Chekeo` (limpia y reescribe cuerpo).
4. Se preservan campos operativos por `orderId` existente (`kitchenStatus`, tiempos, `updatedAt`).
5. Se aplican formatos y toast de confirmación.

#### Flujo F3 — Marcar pedido como LISTO
1. Usuario pulsa `LISTO` en orden actual.
2. Frontend abre overlay de confirmación.
3. En confirmación ejecuta `markOrderReady(orderId)` con lock de documento.
4. Backend actualiza estado a `LISTO`, timestamps (`startTime` si faltaba, `readyTime`, `updatedAt`).
5. Frontend recarga cola (`loadOrders`) y vuelve a renderizar.

#### Flujo F4 — Diagnóstico rápido
1. Menú `Diagnosticar permisos`.
2. Lee columna de estados en `Chekeo`.
3. Reporta filas y conteo de activas.

### 3) Dependencias críticas
- **Google Spreadsheet** como store primario y bus de integración.
- **Dos hojas obligatorias**: `Pedidos Master` y `Chekeo`.
- **Mapeo por índices de columna** (`MASTER` y `CHEKEO`) rígido y acoplado al layout de hoja.
- **Apps Script runtime V8** + scopes de spreadsheets y UI container.
- **LockService document lock** para evitar colisiones de escritura en `markOrderReady`.

### 4) Core de negocio vs implementación actual

#### Core de negocio (conservar)
- Definición de orden activa por estado cocina (`PENDIENTE` / `EN PREP`).
- Generación de vista operativa de cocina (actual + siguiente).
- Sincronización de órdenes desde maestro con preservación de estado operativo.
- Detección de casos especiales/manual review.
- Transición de estado a `LISTO` con trazabilidad temporal.

#### Implementación actual (reinterpretar / rediseñar)
- UI acoplada a lógica de estado en un solo archivo HTML con state mutable global.
- Servicio backend “todo en uno” sin separación por dominios (sync, orders, status, utilidades).
- “Boot” lineal y mínimo sin capa de sesión/update/sync orchestration.
- Ausencia de contrato formal de errores/estados de conectividad.

## B. Clasificación por grupos

### Mantener tal cual
1. **Semántica de estados de cocina y definición de “activa”**.
   - Es lógica central de operación, simple y útil.
2. **Preservación de estado operativo al resincronizar**.
   - Evita pérdida de trabajo del equipo de cocina.
3. **Lock de concurrencia al marcar LISTO**.
   - Minimiza corrupción por simultaneidad.

### Mantener pero reinterpretar
1. **Vista “actual + siguiente”**.
   - Mantener concepto operativo, cambiar composición visual y componentes.
2. **Sincronización completa desde maestro**.
   - Conservar funcionalidad, modularizar pipeline y validaciones.
3. **Diagnóstico operativo**.
   - Mantener utilidad, migrar a health checks estructurados.

### Rediseñar
1. **Boot flow** (actualmente: loadOrders directo).
   - Debe separar readiness de app, sesión, update policy y disponibilidad de datos.
2. **Boundaries de módulos**.
   - Separar `Session/Auth`, `Update`, `Sync`, `Feature state`, `UI`.
3. **Modelo de errores y fallback states**.
   - Diferenciar claramente offline, error de sync, sesión inválida, versión inválida.
4. **Contratos internos**.
   - Sustituir uso intensivo de índices por DTO/normalizadores con validación.

### Eliminar
1. **Dependencia visual de tema actual “post-it stack” como identidad base**.
   - No representa requisito de negocio, solo skin actual.
2. **Acoplamiento render + operaciones remotas en handlers de botón**.
   - Aumenta riesgo de loops y estados intermedios inconsistentes.
3. **Uso implícito de defaults silenciosos en normalización de estado a `PENDIENTE`** en rutas no auditadas.
   - Puede ocultar datos inválidos.

## Hallazgos ejecutivos clave
1. La app actual **sí conserva valor de negocio** en sync operativo y cola activa, pero está concentrada en pocas funciones fuertemente acopladas.
2. Existe una base fuerte para migración incremental porque el dominio es claro y acotado (órdenes + estados + transición `LISTO`).
3. La principal deuda no es visual: es **arquitectura de arranque y separación de responsabilidades**.
4. Hoy no existe capa de sesión/PIN/update/sync separada; al reconstruir, ese será el mayor salto de estabilidad.

