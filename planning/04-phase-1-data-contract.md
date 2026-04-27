# 04 — Phase 1 Data Contract

## Hojas incluidas en el contrato
- `Pedidos Master`
- `Chekeo Nuevo`
- `Chekeo`
- `Configuración`
- `Resumen Pedidos`
- `Historico`

## Tabla detallada por columna (`Chekeo Nuevo`)

| Columna | Tipo esperado | Origen | Editable por la app | Preservar en sync | Aparece en ticket cliente | Aparece en WhatsApp |
|---|---|---|---|---|---|---|
| ID Pedido | Texto (ID estable) | Generado en Chekeo Nuevo | No | Sí | No | No |
| Fila Master | Número entero | Pedidos Master (referencia de fila) | No | Sí | No | No |
| Fecha Pedido | Fecha | Pedidos Master | No | No | Sí | No |
| Hora Pedido | Hora/Texto hora | Pedidos Master | No | No | Sí | No |
| Nombre | Texto | Pedidos Master | No | No | Sí | Sí |
| Teléfono | Texto | Pedidos Master | No | No | No | Sí |
| Resumen Pedido | Texto largo | Pedidos Master | No | No | Sí | Opcional |
| Hamburguesas | Texto largo | Pedidos Master | No | No | Sí | No |
| Extras | Texto largo | Pedidos Master | No | No | Sí | No |
| Guarniciones | Texto largo | Pedidos Master | No | No | Sí | No |
| Total | Número moneda | Pedidos Master | No | No | Sí | Sí |
| Estado Pedido | Enum (`Nuevo/Confirmado/Preparando/Listo`) | Operación en Chekeo Nuevo | Sí | Sí | Sí | No |
| Estado Pago | Enum (`Pendiente/Pagado`) | Operación en Chekeo Nuevo | Sí | Sí | Sí | Sí |
| Método Pago | Enum (`Efectivo/Transferencia/Mixto/No definido`) | Operación en Chekeo Nuevo | Sí | Sí | Sí | Sí |
| Nota Interna | Texto largo | Operación en Chekeo Nuevo | Sí | Sí | No | No |
| Nota Cliente | Texto largo | Operación en Chekeo Nuevo | Sí | Sí | Sí | Opcional |
| Alerta | Texto/Flag | Pedidos Master | No | No | Opcional | Opcional |
| Ticket Enviado | Booleano (`Si/No`) | Operación en Chekeo Nuevo | Sí | Sí | No | No |
| Fecha Ticket Enviado | Fecha/Hora | Operación en Chekeo Nuevo | No | Sí | No | No |
| Hora Inicio | Hora | Operación en Chekeo Nuevo | No | Sí | No | No |
| Hora Listo | Hora | Operación en Chekeo Nuevo | No | Sí | No | No |
| Última Actualización | Fecha/Hora | Operación en Chekeo Nuevo | No | Sí | No | No |

## Reglas de sincronización
1. Sync actualiza en `Chekeo Nuevo` los campos comerciales provenientes de `Pedidos Master`.
2. Sync preserva estados, notas, campos de ticket y tiempos operativos ya capturados.
3. Sync no elimina IDs existentes ni reescribe estados operativos por default.

## Reglas de ticket cliente
1. Ticket incluye Nombre, Fecha/Hora Pedido, Resumen Pedido, desglose (Hamburguesas/Extras/Guarniciones), Total y Nota Cliente (si aplica).
2. Ticket no incluye Nota Interna.
3. `Ticket Enviado` y `Fecha Ticket Enviado` se actualizan solo tras confirmación explícita de envío.

## Reglas de WhatsApp
1. Se usa `Teléfono` como destino.
2. Mensaje incluye al menos: Nombre, Total y datos bancarios desde `Configuración`.
3. Puede incluir Resumen Pedido y Nota Cliente de forma opcional.
4. No se adjuntan archivos automáticamente.
