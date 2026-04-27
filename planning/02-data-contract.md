# 02 — Data Contract (Fase 1)

## Objetivo
Definir el contrato de datos y hojas para la implementación de Fase 1, sin cambios de código ni cambios en Google Sheets.

## Hojas documentadas
- `Pedidos Master` (origen maestro de pedidos).
- `Chekeo Nuevo` (hoja operativa objetivo del contrato).
- `Chekeo` (hoja operativa productiva actual).
- `Configuración` (datos bancarios y parámetros operativos).
- `Resumen Pedidos` (agregados operativos diarios).
- `Historico` (registro histórico de pedidos cerrados).

## Catálogos válidos
- Estado Pedido: `Nuevo`, `Confirmado`, `Preparando`, `Listo`.
- Estado Pago: `Pendiente`, `Pagado`.
- Método Pago: `Efectivo`, `Transferencia`, `Mixto`, `No definido`.

## Estructura contractual
El detalle columna por columna de `Chekeo Nuevo` (tipo esperado, origen, editabilidad, preservación en sync y visibilidad en ticket/WhatsApp) está en:
- `planning/04-phase-1-data-contract.md`

## Reglas generales
1. La sincronización toma `Pedidos Master` como fuente para campos comerciales.
2. Los campos operativos/estado capturados en `Chekeo Nuevo` se preservan durante sync.
3. No se modifica `Chekeo` productivo en esta fase documental.
4. No se implementa backend ni UI en este entregable.
