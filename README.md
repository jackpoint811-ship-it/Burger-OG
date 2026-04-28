# Burger-OG

## Estado final del proyecto
Proyecto operativo por fases completadas de **Fase 0 a Fase 7** para correr en Google Apps Script Web App con Google Sheets como backend.

## Fases completadas
- Fase 0: Reset legacy.
- Fase 1: Contrato de datos y hojas.
- Fase 2: Backend Apps Script base.
- Fase 3: Web App shell móvil.
- Fase 4: Pedidos + Cocina.
- Fase 5: Ticket cliente + WhatsApp.
- Fase 6: Resumen operativo + histórico.
- Fase 7: Migración a producción (validación, preview y preparación segura).

## Stack permitido
- Google Sheets
- Google Apps Script Web App
- HTML/CSS/JS embebido (sin librerías externas, CDN ni frameworks)

## Despliegue de Apps Script Web App
1. Abrir el proyecto en Apps Script.
2. Verificar `appsscript.json` (`runtimeVersion: V8`).
3. Ir a **Deploy > New deployment**.
4. Elegir tipo **Web app**.
5. Configurar acceso según operación interna.
6. Publicar deployment y usar la URL generada.

## Modo prueba / producción
La app usa `ScriptProperties` con la clave `BOG_ACTIVE_ENV`:
- `TEST` → opera sobre `Chekeo Nuevo`.
- `PROD` → opera sobre `Chekeo`.

### Regla de seguridad
- Si `BOG_ACTIVE_ENV` falta o tiene valor inválido, el sistema usa **TEST** por defecto.
- **Producción no se activa automáticamente**.
- Cambiar a `PROD` requiere aprobación manual del usuario y checklist validado.
- Rollback operativo: regresar `BOG_ACTIVE_ENV` a `TEST`.

## Restricciones críticas
- No borrar `legacy/`.
- No borrar hojas ni datos.
- No borrar: `Chekeo Nuevo`, `Chekeo`, `Historico`, `Resumen Pedidos`.
- No activar producción automáticamente.
- No migrar datos automáticamente.

## Vistas de la Web App final
- URL normal (sin parámetros): **Vista Operativo**.
- URL con `?view=admin`: **Vista Admin**.
- La vista Admin es únicamente visual/técnica para mantenimiento; **no es autenticación real ni control de acceso**.
