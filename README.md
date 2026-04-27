# Burger-OG

## Estado actual
Repositorio en **reconstrucción desde cero** (Fase 0 completada de reorganización documental y resguardo de legado).

## Stack permitido
- Google Sheets
- Google Apps Script (Web App)
- HTML/CSS/JS embebido en Apps Script

## Regla de `legacy/`
Todo el código anterior quedó archivado en `legacy/` como referencia histórica.
No se debe reactivar ni mezclar directamente en la nueva base; cualquier reutilización debe ser explícita y controlada por fase.

## Flujo por fases
- Fase 0: Reset legacy.
- Fase 1: Contrato de datos y hojas.
- Fase 2: Backend Apps Script base.
- Fase 3: Web App shell móvil.
- Fase 4: Pedidos + Cocina.
- Fase 5: Ticket cliente + WhatsApp.
- Fase 6: Resumen operativo.
- Fase 7: Migración a producción.

## Restricción clave
No usar servicios externos, librerías externas, APIs externas ni bases de datos externas.
La operación se limita al stack permitido del proyecto.
