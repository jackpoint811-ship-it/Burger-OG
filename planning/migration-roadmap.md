# Fase 0 — Mapa de migración incremental (alineado a Burger-OG real)

## Enfoque
La implementación inmediata se centra en estabilidad operativa de cocina y desacoplamiento técnico incremental.

- Sin big bang rewrite.
- Sin introducir por ahora Session/Auth/PIN/Update Manager.
- Paridad funcional primero, reinterpretación visual después.

## Fase 0 — Auditoría + diseño
- **Objetivo:** entender comportamiento real y definir arquitectura mínima target.
- **Alcance:** inventario, riesgos, plan y criterios de aceptación.
- **Done:** documentación aprobada y backlog de refactors.

## Fase 1 — Base modular (actual)
- **Objetivo:** separar responsabilidades sin romper operación.
- **Alcance:**
  - Frontend: `AppState`, `Renderer`, `Actions`, `Bridge`.
  - Backend: servicios de sync/orders/status + utilidades compartidas.
  - Mantener firmas públicas existentes para compatibilidad.
- **Riesgos:** regresiones por mover funciones entre archivos.
- **Done:** app sigue operando con la misma lógica core y menor acoplamiento.
- **Dependencias:** Fase 0.

## Fase 2 — Navegación/estado UI y componentes reutilizables
- **Objetivo:** preparar reinterpretación visual con base estable.
- **Alcance:** organizar layout por bloques reutilizables (sin cambiar negocio).
- **Riesgos:** introducir cambios visuales que oculten errores funcionales.
- **Done:** componentes de vista desacoplados de operaciones remotas.
- **Dependencias:** Fase 1.

## Fase 3 — Endurecimiento de sync y errores
- **Objetivo:** robustecer pipeline de datos.
- **Alcance:** validaciones de schema, manejo de errores explícito, diagnósticos útiles.
- **Riesgos:** falsos positivos en validación si no se calibra con datos reales.
- **Done:** sync más observable y fallas recuperables.
- **Dependencias:** Fase 1.

## Fase 4 — UI reinterpretation incremental
- **Objetivo:** cambiar UI sin tocar core de cocina.
- **Alcance:** rediseño visual por secciones (header, cola, confirmación, estados).
- **Riesgos:** degradar legibilidad operativa.
- **Done:** experiencia más clara, distinta y mantenible con paridad funcional.
- **Dependencias:** Fase 2.

## Fase 5 — Hardening y validación operativa
- **Objetivo:** estabilización final.
- **Alcance:** checklist de operación real, pruebas manuales repetibles, documentación de soporte.
- **Riesgos:** cobertura incompleta en escenarios de concurrencia.
- **Done:** release candidate con incidentes controlados.
- **Dependencias:** Fases 1–4.

## Extensiones futuras (no prioritarias hoy)
- Session/Auth/PIN.
- Update/version manager.
- Offline avanzado y estrategia multi-dispositivo.
