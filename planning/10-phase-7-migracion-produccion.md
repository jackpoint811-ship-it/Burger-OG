# 10 — Fase 7: Migración a producción (segura)

## Objetivo
Preparar una migración controlada de `Chekeo Nuevo` (pruebas) hacia `Chekeo` (producción) sin ejecutar cambios automáticos de entorno ni copiar datos automáticamente.

## Alcance implementado
- Validación de preparación de producción (`validateProductionReadiness`).
- Preview de migración (`getProductionMigrationPreview`) sin escritura de datos.
- Preparación segura de hojas (`prepareProductionSheets`) para crear/validar encabezados sin borrar datos.
- Estado visible de entorno activo y hoja activa en la UI.
- Checklist operativo, rollback y pasos finales documentados en UI y esta fase.

## Reglas de seguridad reforzadas
- No activa producción automáticamente.
- No migra a `Chekeo` oficial automáticamente.
- No borra hojas ni datos existentes.
- No elimina `Chekeo Nuevo`, `Chekeo`, `Historico` ni `Resumen Pedidos`.
- Mantiene default seguro en `TEST`.

## Endpoints nuevos
- `validateProductionReadiness()`
  - Verifica hojas clave, encabezados, entorno activo, conteos base y configuración bancaria.
  - Devuelve incidencias y recomendación.
- `getProductionMigrationPreview()`
  - Calcula cuántos pedidos de `Chekeo Nuevo` se insertarían/actualizarían en `Chekeo`.
  - Detecta IDs duplicados existentes en destino.
  - No mueve ni borra filas.
- `prepareProductionSheets()`
  - Asegura existencia de hoja `Chekeo` y encabezados requeridos.
  - No cambia entorno activo.
  - No migra datos.

## Checklist operativo recomendado
1. Confirmar que el entorno activo sigue en `TEST`.
2. Ejecutar validación de producción y resolver incidencias.
3. Ejecutar preview de migración y revisar conteos esperados.
4. Ejecutar preparación segura de hojas.
5. Respaldar manualmente hojas críticas (`Chekeo Nuevo`, `Chekeo`, `Historico`, `Resumen Pedidos`).
6. Programar migración manual fuera del flujo automático.

## Rollback (manual)
1. Mantener o regresar entorno a `TEST`.
2. Restaurar hoja `Chekeo` desde respaldo manual previo.
3. Revalidar encabezados y conteos con `validateProductionReadiness`.
4. Confirmar que operación diaria continúa en `Chekeo Nuevo`.

## Pasos finales
1. Ejecutar migración manual supervisada en ventana controlada.
2. Verificar totales y conteos comparando origen/destino.
3. Probar lectura operativa en la app antes de anunciar cambio.
4. Solo con aprobación explícita, planear activación posterior de producción.
