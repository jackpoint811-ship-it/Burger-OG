# Plan de Implementación: Sistema de Búsqueda, Filtro y Basurero de Órdenes (Soft-Delete)

Este plan define las mejoras para el almacenamiento, filtrado, búsqueda y archivado ("mandar a basurero") de órdenes en **Burgers.exe Chekeo V2**, incorporando selección por casillas (checkboxes), filtrado por fecha y la regla de negocio de cancelación previa.

---

## 🎯 Objetivos Clave y Reglas de Negocio

1. **Regla Estricta de Archivado (Basurero)**:
   - Para mover una orden al **Basurero** (`archived_at`), la orden **siempre requerirá estar en estado Cancelada** (`status === 'cancelled'`).
   - Si se intenta enviar al basurero una orden activa, el flujo guiará o ejecutará la cancelación con su motivo antes de moverla al basurero.
   - Las órdenes en el basurero podrán ser **restauradas** a la vista operativa si fuera necesario.

2. **Manejo Inteligente de Selección Múltiple (Sin Conflictos)**:
   - **Si todas las seleccionadas ya están canceladas**: El botón masivo dirá **"🗑️ Mandar a Basurero ([N])"** y las moverá inmediatamente al basurero.
   - **Si hay órdenes mixtas (activas y canceladas)**: La barra mostrará el estado desglosado y al dar clic preguntará:
     > *"Has seleccionado X órdenes activas y Y canceladas. ¿Deseas cancelar las activas con motivo 'Limpieza de turno' y enviarlas todas al basurero?"*
   - De esta manera **no hay conflicto ni inconsistencia**, garantizando que toda orden archivada cumpla con la regla de estar previamente cancelada en la base de datos.

3. **Búsqueda y Filtrado por Fecha en Basurero**:
   - Buscador rápido por folio (`#0012`), nombre de cliente, teléfono o notas.
   - Toggle/Tab entre **"⚡ Operaciones Activas"** y **"🗑️ Basurero / Archivadas"**.
   - Selector de fecha / rango de fechas en la vista de **Basurero** para auditar y consultar órdenes ocultadas en días anteriores.

4. **Integridad de Datos en Cloudflare D1**:
   - Conserva todos los registros históricos (`orders_v2`, `order_items_v2`, `order_events_v2`).
   - Consultas operativas por defecto omiten órdenes archivadas (`archived_at IS NULL`).

---

## ⚠️ User Review Required

> [!IMPORTANT]
> - **Requisito de Cancelación**: No se puede archivar directamente una orden en estado `new`, `preparing` o `delivered` sin pasar por `cancelled`. Al seleccionar múltiples órdenes activas, la acción masiva solicitará confirmar la cancelación de las activas antes de archivarlas.
> - **No Destructivo**: El "Basurero" aplica borrado suave (`archived_at`), por lo que nunca se pierden datos en Cloudflare D1.

---

## 🛠️ Proposed Changes

### Componente 1: Backend API (Cloudflare Workers / D1)

#### [MODIFY] [archive.ts](file:///c:/Documentos/Burgers-exe/Preview/functions/api/orders-v2-admin/%5Bid%5D/archive.ts)
- Mantener y reforzar la regla: solo órdenes con `status === 'cancelled'` pueden actualizar `archived_at`.
- Registrar evento `ORDER_ARCHIVED` en `order_events_v2`.

#### [NEW] [unarchive.ts](file:///c:/Documentos/Burgers-exe/Preview/functions/api/orders-v2-admin/%5Bid%5D/unarchive.ts)
- Endpoint `PATCH /api/orders-v2-admin/:id/unarchive` para reestablecer `archived_at = NULL` y restaurar la orden cancelada a la vista operativa.

#### [NEW] [batch-archive.ts](file:///c:/Documentos/Burgers-exe/Preview/functions/api/orders-v2-admin/batch-archive.ts)
- Endpoint `POST /api/orders-v2-admin/batch-archive` que recibe un arreglo de `orderIds`. Para las órdenes que aún no estén canceladas, procesa la cancelación primero y luego actualiza `archived_at` en una transacción Batch en D1.

#### [MODIFY] [orders-v2-admin.ts](file:///c:/Documentos/Burgers-exe/Preview/functions/api/orders-v2-admin.ts)
- Ampliar parámetros en `GET /api/orders-v2-admin`:
  - `archived`: `'false'` (por defecto), `'true'` (solo basurero), `'all'` (todas).
  - `search`: filtra por folio, cliente, teléfono o notas.
  - `from` y `to`: filtrado de rango de fechas (compatible con el selector de fecha del Basurero).

---

### Componente 2: Librería Cliente y Config

#### [MODIFY] [index.ts](file:///c:/Documentos/Burgers-exe/Preview/packages/config/src/index.ts)
- Actualizar tipos para `FetchOrdersV2AdminOptions` (`search`, `archivedMode`, `from`, `to`).

#### [MODIFY] [orders-v2-admin.ts](file:///c:/Documentos/Burgers-exe/Preview/apps/internal-chekeo-v2/src/lib/orders-v2-admin.ts)
- Funciones cliente `archiveCancelledOrderV2`, `unarchiveOrderV2` y `batchArchiveOrdersV2`.

---

### Componente 3: Interfaz de Chekeo (Frontend React)

#### [MODIFY] [InternalChekeoApp.tsx](file:///c:/Documentos/Burgers-exe/Preview/apps/internal-chekeo-v2/src/components/InternalChekeoApp.tsx)
- **Selección Múltiple (Checkboxes) con Flujo Inteligente**:
  - Checkbox de selección individual en las tarjetas/renglones de órdenes.
  - Checkbox superior "Seleccionar todas".
  - Barra de acciones contextuales al seleccionar:
    - Muestra conteo: *"N seleccionadas (X canceladas, Y activas)"*.
    - Si hay órdenes activas seleccionadas, al dar clic en **"Mandar a Basurero"** abre una rápida confirmación para cancelar las activas con motivo y enviarlas todas al basurero en un solo paso.
- **Barra de Búsqueda y Control de Vista**:
  - Buscador de texto rápido en el header.
  - Pestañas **⚡ Operaciones Activas** vs **🗑️ Basurero**.
  - Selector de fecha en la pestaña **Basurero** para consultar por día o rango.
- **Acciones Rápidas por Tarjeta**:
  - Botón directo `🗑️ Mandar a Basurero` en órdenes canceladas.
  - En la pestaña **Basurero**, botón `↩️ Restaurar` por orden o en lote.

#### [MODIFY] [styles.css](file:///c:/Documentos/Burgers-exe/Preview/apps/internal-chekeo-v2/src/styles.css)
- Estilos para checkboxes personalizados, barra de selección masiva flotante y selector de fecha del basurero.

---

## 🧪 Verification Plan

### Automated Tests
- `npm run typecheck`: Validar firmas de tipos TypeScript en `@config` y `apps/internal-chekeo-v2`.
- `npm run build:public`: Verificar compilación limpia.

### Manual Verification
1. **Verificar regla de cancelación en selección masiva**: Seleccionar 2 órdenes canceladas y 1 activa, dar clic en "Mandar a Basurero", confirmar el mensaje y verificar que la activa se cancela y las 3 pasan al basurero.
2. **Probar Selección Múltiple con Checkboxes**: Seleccionar múltiples canceladas y archivarlas en 1 clic.
3. **Probar Búsqueda y Filtro de Fecha en Basurero**: Cambiar fecha en la pestaña **Basurero** y verificar los registros.
4. **Probar Restauración**: Restaurar una orden desde el basurero hacia operaciones activas.
