# Fase 0 — Mapa de migración incremental

## E. Plan por fases recomendado

## Fase 0 — Auditoría + diseño (actual)
- **Objetivo:** convertir comportamiento real en contratos y arquitectura objetivo.
- **Alcance:** inventario funcional, boot audit, arquitectura, roadmap, criterios.
- **Riesgos:** subestimar acoplamientos ocultos de hojas/columnas.
- **Done:** documentos aprobados + lista priorizada de refactors habilitadores.
- **Dependencias:** acceso completo al repo y estructura de hoja conocida.

## Fase 1 — Boot / App Shell
- **Objetivo:** introducir Shell con FSM de arranque sin romper operación actual.
- **Alcance:** estado raíz, rutas de bloqueo (`NeedsUpdate`, `NeedsAuth`, `NeedsPin`, `Offline`, `Ready`).
- **Riesgos:** regresión en tiempo de arranque.
- **Done:** boot deterministic testable, sin lógica de negocio en componentes raíz.
- **Dependencias:** contratos de Session, Update, Sync definidos.

## Fase 2 — Session/Auth/PIN
- **Objetivo:** aislar sesión y PIN con transiciones explícitas.
- **Alcance:** gestor de sesión, expiración, unlock por PIN, manejo de lockouts.
- **Riesgos:** loops de sesión/PIN por guards incompletos.
- **Done:** no existen transiciones cíclicas infinitas entre `Expired` y `NeedsPin`; telemetry de intentos.
- **Dependencias:** Fase 1 (Shell + FSM).

## Fase 3 — Update/Version Manager
- **Objetivo:** separar versionado y compatibilidad de la capa visual.
- **Alcance:** policy check al abrir, estados update available/required, fallback UX estable.
- **Riesgos:** falsos positivos de incompatibilidad.
- **Done:** detección de versión al abrir con rutas determinísticas y testeadas.
- **Dependencias:** Fase 1.

## Fase 4 — Navegación y estado base
- **Objetivo:** estructurar navegación por estados y store base por módulos.
- **Alcance:** rutas raíz + stacks funcionales + estado compartido mínimo.
- **Riesgos:** fuga de estado entre flujos.
- **Done:** navegación desacoplada de side effects; estado tipado con selectors.
- **Dependencias:** Fases 1–3.

## Fase 5 — Módulos funcionales
- **Objetivo:** migrar casos de uso de negocio conservando comportamiento útil.
- **Alcance:** cola activa, detalle de orden, marcar listo, sync y diagnóstico operativo.
- **Riesgos:** regressions en preservación de estado durante sync.
- **Done:** paridad funcional medida por pruebas de contratos y escenarios reales.
- **Dependencias:** Fase 4 + adapters de datos.

## Fase 6 — UI reinterpretation
- **Objetivo:** rediseño visual sin alterar lógica central.
- **Alcance:** nuevo sistema de componentes, layout distinto, HUD premium selectivo.
- **Riesgos:** sobreinvertir en estética antes de estabilidad.
- **Done:** UX más clara con estados explícitos, sin deuda de acoplamiento.
- **Dependencias:** Fase 5 estable.

## Fase 7 — Hardening / tests
- **Objetivo:** robustez final operativa.
- **Alcance:** test suite (unit/integration/e2e), observabilidad, retry policies, documentación operativa.
- **Riesgos:** cobertura incompleta en bordes offline/concurrencia.
- **Done:** SLO internos cumplidos; checklist de release completo.
- **Dependencias:** Fases 1–6.

## Orden de ejecución dentro de cada fase
1. Diseñar contratos.
2. Implementar detrás de feature flag.
3. Ejecutar pruebas de regresión de negocio.
4. Activar gradual.

## Métrica de progreso sugerida
- % casos de uso migrados con paridad validada.
- % paths de boot cubiertos por tests.
- Incidentes por semana en operaciones de cocina.

