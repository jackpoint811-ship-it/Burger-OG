# Fase 2 — Estructura UI y estado explícito (Burger-OG)

## Objetivo
Organizar la pantalla como mini app de una sola vista con estados explícitos y componentes reutilizables, manteniendo la misma lógica operativa de cocina.

## Estado UI explícito
Se define un estado principal único (`uiState`) con transiciones controladas:
- `loading`
- `ready_with_orders`
- `ready_empty`
- `confirming_ready`
- `submitting_ready`
- `error`

## Componentes/bloques
- **AppShell**: `headerArea`, `statusArea`, `contentArea`, `actionArea`.
- **Header**: identidad + contador de cola.
- **QueueSummary**: lectura rápida del estado de pantalla.
- **CurrentOrderCard**: pedido principal operativo.
- **NextOrderCard**: contexto de siguiente orden.
- **EmptyState**: cola sin activas.
- **ErrorState**: error explícito de carga.
- **PrimaryAction / SecondaryAction**: botón LISTO + recarga.
- **ConfirmModal**: confirmación de marcado LISTO.
- **Toast / Loading indicator**: feedback transversal.

## Beneficio operativo
- Render y transiciones más previsibles.
- Menos estado implícito disperso.
- Base lista para reinterpretación visual fuerte en fases siguientes sin tocar negocio.
