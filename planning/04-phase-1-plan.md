# 04 — Phase 1 Plan: Contrato de datos y hojas

## Objetivo
Cerrar la definición contractual de datos y reglas de operación entre hojas antes de cualquier implementación técnica.

## Hojas usadas
- `Pedidos Master`
- `Chekeo Nuevo`
- `Chekeo`
- `Configuración`

## Columnas
Se adopta como contrato la estructura de `Chekeo Nuevo` definida en `planning/02-data-contract.md` (22 columnas).

## Validaciones
- Validar presencia de hojas obligatorias.
- Validar existencia y orden contractual de columnas en `Chekeo Nuevo`.
- Validar catálogos permitidos en Estado Pedido, Estado Pago y Método Pago.
- Validar que `ID Pedido` sea único y estable.
- Validar formato de Total numérico y Teléfono utilizable para WhatsApp.

## Origen de cada campo
- Campos comerciales: `Pedidos Master`.
- Campos operativos y trazabilidad: `Chekeo Nuevo`.
- Datos bancarios para mensaje: `Configuración`.

## Campos editables
- Estado Pedido
- Estado Pago
- Método Pago
- Nota Interna
- Nota Cliente
- Ticket Enviado

## Campos preservados
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
1. Sincronizar altas/cambios de contenido desde `Pedidos Master`.
2. Preservar campos operativos existentes en `Chekeo Nuevo`.
3. No degradar estados por defaults silenciosos.
4. Registrar `Última Actualización` en cada write operativo.
5. No tocar `Chekeo` productivo en esta fase documental.

## Reglas de ticket cliente
1. Construir ticket con Resumen Pedido, Total y Nota Cliente opcional.
2. Permitir descarga/envío según flujo definido, sin automatizar adjuntos.
3. Confirmar acción de envío antes de marcar `Ticket Enviado`.

## Reglas de WhatsApp
1. Usar Teléfono del pedido.
2. Incluir Total y datos de `Configuración`.
3. Solicitar confirmación posterior para marcar ticket enviado.

## Criterios de cierre de Fase 1 (plan)
- Contrato de datos aprobado por el usuario.
- Catálogos y validaciones aceptados.
- Reglas de sincronización/ticket/WhatsApp aprobadas por escrito.
- Bitácora de fase actualizada en `planning/03-phase-log.md`.
- Sin código implementado todavía (backend/UI).
