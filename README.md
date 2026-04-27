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
1. **Fase 0**: reset del repo, traslado a `legacy/`, documentación base.
2. **Fase 1+**: reconstrucción incremental sobre base limpia, validando alcance por fase antes de implementar.

## Restricción clave
No usar servicios externos, librerías externas, APIs externas ni bases de datos externas.
La operación se limita al stack permitido del proyecto.
