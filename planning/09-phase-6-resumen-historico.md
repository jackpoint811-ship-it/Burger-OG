# 09 — Fase 6: Resumen Pedidos + Historico

## Objetivo
Agregar cierre operativo diario con:
- preview de cierre,
- archivo de pedidos elegibles a `Historico`,
- registro de resumen diario en `Resumen Pedidos`,
- consulta básica de histórico en la app.

## Reglas de negocio
- Hoja activa operativa: `Chekeo Nuevo`.
- Solo se archivan pedidos con `Estado Pedido = Listo` y `Estado Pago = Pagado`.
- No se elimina ningún pedido de `Chekeo Nuevo` sin copiarlo antes a `Historico`.
- Cierre de día bloqueado si existen pedidos no elegibles.
- Todas las escrituras públicas usan `LockService`.

## Backend agregado
- `getCloseDayPreview()`
- `archiveReadyPaidOrders()`
- `closeDay()`
- `getHistoryOrders(limit)`

### Comportamiento
- `getCloseDayPreview`: devuelve conteos elegibles/bloqueados y resumen monetario de elegibles.
- `archiveReadyPaidOrders`: copia elegibles a `Historico` (con `Fecha Archivo` y `Motivo Archivo`) y luego elimina de `Chekeo Nuevo`.
- `closeDay`: exige cero bloqueados, ejecuta archivo y guarda fila en `Resumen Pedidos`.
- `getHistoryOrders`: devuelve últimos pedidos archivados (default 30).

## UI agregada
- Header actualizado a Fase 6.
- Tab `Resumen` con botones:
  - `Preview cierre`
  - `Archivar Listo+Pagado`
  - `Cerrar día`
- Confirmación previa para archivar y cerrar día.
- Tab `Historico` para listar últimos pedidos archivados.
- Sin uso de `alert()`.

## Fuera de alcance
- Sin migración a `Chekeo` oficial.
- Sin cambios en `legacy/`.
- Sin librerías externas, CDN ni frameworks.
