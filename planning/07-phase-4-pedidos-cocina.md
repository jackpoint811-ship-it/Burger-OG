# 07 — Fase 4: Pedidos + Cocina

## Objetivo
Habilitar operación diaria de pedidos y flujo de cocina en la Web App móvil usando `Chekeo Nuevo` como hoja activa.

## Alcance
- Edición operativa de pedidos desde tab `Pedidos`:
  - `Estado Pedido`
  - `Estado Pago`
  - `Método Pago`
  - `Nota Interna`
  - `Nota Cliente`
- Acciones rápidas:
  - `Guardar pedido`
  - `Marcar pagado`
- Tab `Cocina` con cola activa y cambios de estado:
  - `Confirmado`
  - `Preparando`
  - `Listo`
- Refresco de resumen diario y listado tras cada operación.

## Backend requerido
- `updateOrderOperationalData(orderId, payload)` para actualizar en una sola escritura:
  - estado de pedido
  - estado/método de pago
  - notas internas/cliente
  - actualización de timestamps (`Hora Inicio`, `Hora Listo`, `Última Actualización`) según transición.
- Se mantienen endpoints existentes para compatibilidad:
  - `updateOrderStatus`
  - `updateOrderPayment`
  - `markOrderPaid`
  - `updateOrderNotes`

## UI móvil
- Tabs visibles: `Inicio`, `Pedidos`, `Cocina`, `Resumen`, `Ajustes`.
- Diseño mobile-first (teléfono vertical) sin librerías externas.
- Sin ticket cliente y sin WhatsApp en esta fase.

## Fuera de alcance
- Ticket cliente.
- Envío de WhatsApp.
- Migración a hoja `Chekeo` oficial.
- Cambios en `legacy/`.
