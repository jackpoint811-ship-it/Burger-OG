# Fase 0 — Criterios de aceptación, riesgos y recomendación ejecutiva

## F. Criterios de aceptación (concretos)

## Boot / sesión / pin / update
1. Nunca existe loop infinito entre `session_expired` y `pin_required`.
2. Al abrir app, siempre se ejecuta `update check`; si requiere update, no permite entrar a módulos.
3. El sistema distingue explícitamente: `sesión inválida`, `versión vieja`, `offline`, `error de sync`.
4. Boot no depende de un componente monolítico ni de side effects en render.

## Sync / datos
5. Sync preserva estado operativo válido (status/timestamps) y rechaza schema incompatible.
6. Los errores de datos no se normalizan silenciosamente a estados activos.
7. Cada operación crítica es idempotente o deduplicada en cliente/servicio.

## UI/feature state
8. Cada vista crítica soporta `loading`, `empty`, `error`, `success`.
9. UI no invoca transporte remoto directo; usa casos de uso.
10. Navegación raíz solo depende de `BootDecision` del Shell.

## Operación
11. Existe health check operativo equivalente al diagnóstico actual, pero estructurado.
12. La transición a `LISTO` mantiene trazabilidad temporal y protección de concurrencia.

## G. Riesgos y deuda técnica

## Riesgos de negocio
- Interrupción de operación en cocina durante migración de flujo de arranque.
- Errores en cola activa que afecten tiempos de entrega.

## Riesgos técnicos
- Acoplamiento a columnas de hoja puede romper sync ante cambios no versionados.
- Defaults permisivos pueden ocultar corrupción de datos.
- Falta de contratos tipados incrementa regresiones silenciosas.

## Deuda heredada
- Backend monolítico con utilidades, sync y operaciones mezcladas.
- Ausencia de capa de sesión/PIN/update.
- Manejo de errores genérico en frontend (toast único).

## Quick wins
1. Introducir contratos tipados para estados y errores sin tocar UI final.
2. Extraer servicio de `orders` y `sync` del archivo principal.
3. Añadir validación de schema/columnas al inicio de sync.
4. Instrumentar event log de boot/transiciones.

## Zonas que NO conviene tocar primero
- Rebranding visual completo antes de estabilizar boot/state.
- Reescritura total de sync sin pruebas de preservación de estado.
- Cambios simultáneos de arquitectura + layout + reglas de negocio.

## H. Recomendación final (ejecutiva)

## Qué conservar
- Reglas de negocio de estados activos.
- Sincronización desde maestro con preservación de estado operativo.
- Protección de concurrencia al marcar pedidos como listos.

## Qué rehacer primero
1. App Shell y FSM de boot.
2. Session/Auth/PIN desacoplado.
3. Update/Version Manager.
4. Contratos de Sync/Data con validaciones explícitas.

## Qué posponer
- Reinterpretación visual profunda (hacerla después de paridad funcional).
- Enhancements no críticos (microinteracciones, detalles cosméticos).

## Qué jamás replicar
- Acoplar update/session/sync al render de pantalla.
- Normalizar errores graves como defaults silenciosos.
- Concentrar toda lógica de dominio + IO + UI en un único módulo.

## Supuestos tomados automáticamente
- Se mantiene stack Google Apps Script + HTMLService en fases iniciales.
- Se acepta uso de feature flags para migración incremental.
- El Spreadsheet continúa como fuente primaria en fases tempranas.
- No se modifica lógica core de negocio sin pruebas de paridad.

