# 02 — Data Contract (Definitivo Fase 1)

## Hojas usadas
- `Pedidos Master` (fuente operativa de pedidos de entrada).
- `Chekeo Nuevo` (hoja operativa temporal para reconstrucción y pruebas).
- `Chekeo` (hoja operativa productiva actual, sin cambios en esta fase).
- `Configuración` (datos de cuenta bancaria para comunicación al cliente).

## Columnas de `Chekeo Nuevo`
1. ID Pedido
2. Fila Master
3. Fecha Pedido
4. Hora Pedido
5. Nombre
6. Teléfono
7. Resumen Pedido
8. Hamburguesas
9. Extras
10. Guarniciones
11. Total
12. Estado Pedido
13. Estado Pago
14. Método Pago
15. Nota Interna
16. Nota Cliente
17. Alerta
18. Ticket Enviado
19. Fecha Ticket Enviado
20. Hora Inicio
21. Hora Listo
22. Última Actualización

## Catálogos válidos
- Estado Pedido: `Nuevo`, `Confirmado`, `Preparando`, `Listo`.
- Estado Pago: `Pendiente`, `Pagado`.
- Método Pago: `Efectivo`, `Transferencia`, `Mixto`, `No definido`.

## Origen de cada campo
### Desde `Pedidos Master`
- Fecha Pedido, Hora Pedido, Nombre, Teléfono, Resumen Pedido, Hamburguesas, Extras, Guarniciones, Total, Alerta.

### Generados/gestionados por operación en `Chekeo Nuevo`
- ID Pedido (identificador estable de cocina).
- Fila Master (referencia a origen de sincronización).
- Estado Pedido.
- Estado Pago.
- Método Pago.
- Nota Interna.
- Nota Cliente.
- Ticket Enviado.
- Fecha Ticket Enviado.
- Hora Inicio.
- Hora Listo.
- Última Actualización.

## Campos editables por operación
- Estado Pedido
- Estado Pago
- Método Pago
- Nota Interna
- Nota Cliente
- Ticket Enviado

## Campos preservados en sincronización
- ID Pedido
- Estado Pedido
- Estado Pago
- Método Pago
- Nota Interna
- Nota Cliente
- Ticket Enviado
- Fecha Ticket Enviado
- Hora Inicio
- Hora Listo

## Reglas de sincronización
1. La sincronización toma `Pedidos Master` como fuente de altas/actualizaciones de contenido comercial.
2. Si un pedido ya existe en `Chekeo Nuevo`, se preservan los campos operativos editables y de trazabilidad.
3. La sincronización no debe borrar ni reescribir manualmente estados de cocina/pago ya capturados.
4. `Última Actualización` se registra en cada actualización de pedido en hoja operativa.
5. La fase documental no ejecuta cambios directos sobre hojas reales.

## Reglas de ticket cliente
1. El ticket cliente usa Resumen Pedido + Nota Cliente (si existe).
2. El total del ticket se toma del campo Total del pedido.
3. La marca de `Ticket Enviado` solo cambia tras confirmación explícita del operador.
4. `Fecha Ticket Enviado` se registra al confirmar envío de ticket.

## Reglas de WhatsApp
1. El teléfono destino sale del campo Teléfono del pedido.
2. El mensaje incluye total del pedido y datos bancarios de `Configuración`.
3. WhatsApp no adjunta archivos automáticamente en esta definición base.
4. Tras abrir WhatsApp, se solicita confirmación para marcar `Ticket Enviado`.

## Alcance de este contrato
- Documento normativo de Fase 1 (sin implementación técnica en esta fase de documentación).
- No implica cambios de backend, UI ni modificaciones en Google Sheets.
