> Estado: vivo
> Uso: memoria operativa para Codex/Burgers.exe

# Flujos Chekeo

## Pedidos (V3 Redesign & Data Standardization)

Debe enfocarse en revisar y administrar pedidos con la jerarquía operativa V3:

- **Estandarización Cloudflare**: Parseo limpio desestructurado de cliente (`cleanCustomerName`), ubicación (`📍 Torre GGA` / `Torre Valcob`), fecha de entrega (`📅 Hoy` / `📅 Programado`) y notas operativas sin contaminación.
- **Jerarquía Visual Principal**:
  1. **TOTAL**: Monto destacado.
  2. **DÓNDE ENTREGAR**: Ubicación de entrega clara.
  3. **FECHA DE ENTREGA**: Fecha y horario programado.
- **Filtro Calendario Horizontal**: Riel de fechas con badges de cantidad de pedidos pendientes (`status !== 'delivered' && status !== 'cancelled'`).
- **Regla Horario Límite (1:30 PM)**: Bloqueo automático para pedidos del mismo día en backend (`orders-v2.ts`) y frontend (`TowerScheduleModal.tsx`) si la hora sobrepasa las 13:30.
- **Regla Fines de Semana**: Exclusión estricta de Sábados (6) y Domingos (0) para programación de entregas.

No debe ser la zona principal para:

- Descargar ticket.
- Enviar WhatsApp.
- Descargar imagen del comprobante.

## Pagos

Debe concentrar:

- Estado de pago.
- Marcar pagado.
- Regresar a pendiente.
- Nota interna.
- Copiar WhatsApp.
- Abrir WhatsApp.
- Descargar ticket o comprobante.

## Corte

Debe mostrar resumen claro para operación.

## Sorteo

Debe mostrar lo esencial:

- Participantes.
- Tickets acumulados.
- Tickets extra.
- Código referido.
- Acciones principales sin saturar.
