# 12 — Final UI: Operativo vs Admin (Post-producción)

## Objetivo
Separar la Web App final en dos vistas visuales:
- **Operativo** (default) para uso diario.
- **Admin** (`?view=admin`) para diagnóstico técnico y tareas de migración segura.

## Estrategia
- URL normal o sin parámetro: `view=operativo` implícito.
- URL con `?view=admin`: habilita controles y panel técnico.
- Sin autenticación real: separación visual/operativa únicamente.

## Vista Operativo (default)
- Header limpio: `Burger-OG` / `Panel de pedidos`.
- Tabs operativas:
  - Inicio
  - Pedidos
  - Cocina
  - Cierre
- No muestra contenido técnico de fase/migración/checklist/rollback.
- Mantiene operaciones clave:
  - sincronizar
  - filtros y listado de pedidos
  - detalle, pago, notas
  - cocina
  - ticket cliente
  - WhatsApp
  - guardar resumen
  - archivar completados
  - cerrar día
  - histórico básico

## Vista Admin (`?view=admin`)
Concentra bloque técnico en tab `Admin`:
- estado backend
- entorno activo
- hoja activa
- configuración bancaria
- validar producción
- preview migración
- preparar hojas
- checklist
- rollback/pasos finales
- diagnóstico operativo

## Optimización aplicada
En vista Operativo **no se ejecutan automáticamente**:
- `validateProductionReadiness()`
- `getProductionMigrationPreview()`

Esas llamadas quedan para:
- apertura en vista Admin, o
- acciones manuales en botones Admin.

## Restricciones respetadas
- Sin cambios de lógica de negocio.
- Sin cambios de `BOG_ACTIVE_ENV`.
- Sin vuelta automática a TEST/PROD por UI.
- Sin cambios en `legacy/`.
- Sin librerías externas/CDN/frameworks.
- Sin `alert()`.
