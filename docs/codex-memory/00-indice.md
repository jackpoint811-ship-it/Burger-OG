> Estado: vivo
> Uso: memoria operativa para Codex/Burgers.exe

# Memoria Codex / Obsidian - Burgers.exe

Esta carpeta funciona como memoria viva del proyecto.

## Jerarquía

1. `AGENTS.md` es la regla dura del repositorio.
2. `PROJECT.md` define la arquitectura canonical, contratos y el roadmap de hitos.
3. Esta memoria en `docs/codex-memory/` es apoyo operativo.
4. Si hay contradicción, gana `AGENTS.md`; el agente debe verificar el código y reportar la diferencia.

## Orden recomendado para Codex (Flujo V3)

1. Leer `AGENTS.md` y `PROJECT.md`.
2. Leer `docs/codex-memory/00-indice.md`.
3. Leer la memoria base activa de V3:
   - `01-estado-actual.md`: Contexto operativo actual y stack V3.
   - `02-reglas-del-proyecto.md`: Reglas base y arquitectura oficial V3 (`apps/public-order-v3`, `apps/internal-chekeo-v3`).
   - `22-v3-bitacora.md`: Bitácora viva de migración y auditorías V3.
   - `07-decisiones.md`: Registro de decisiones de arquitectura, producto y UI.
4. Leer workflow y checklists:
   - `08-agent-workflow.md`: Flujo obligatorio para agentes (ramas base `v3`, verificación, PRs).
   - `09-checklists.md`: Checklists de QA, PR, resiliencia y diseño Premium Casual.
5. Leer el archivo específico según el área a intervenir:
   - Chekeo (Operaciones, KDS Cocina, Pagos, Admin): `03-flujos-chekeo.md`.
   - Public Order (PWA cliente, carrito, checkout): `04-flujo-public-order.md`.
   - Especificaciones DTO y recetas de cocina: `21-order-communication-and-recipe-spec.md`.
   - Herramientas y skills: `11-skills-and-tools.md`.
   - Backlog activo: `05-backlog.md`.
   - Prompts reutilizables: `06-prompts-buenos.md`.
6. Consultar notas históricas / archivo V2 (10, 12, 13, 14, 15, 16, 18, 19, 20, 22-bitacora-v2-v3) solo si se requiere trazabilidad sobre fases previas de la arquitectura legacy.
7. Usar Graphify antes de cambios grandes o de arquitectura si está disponible.
8. Terminar cambios en rama limpia (`feat/v3-xx-...`), commit, push y PR con base en `v3` cuando el usuario apruebe el cierre.

---

## Mapa rápido

### 🟢 Notas Activas V3 (Memoria Viva)

| Archivo | Uso |
|---|---|
| `00-indice.md` | Índice maestro, jerarquía y orden recomendado de lectura. |
| `01-estado-actual.md` | Contexto operativo actual del proyecto y stack V3 definitivo. |
| `02-reglas-del-proyecto.md` | Reglas base de trabajo, arquitectura V3 (`apps/public-order-v3`, `apps/internal-chekeo-v3`) y estética Premium Casual. |
| `03-flujos-chekeo.md` | Reglas operativas de Pedidos, Cocina (KDS/Resumen K), Pagos, Corte y Admin. |
| `04-flujo-public-order.md` | Reglas del flujo público de pedidos (PWA Mobile-First, Premium Casual). |
| `05-backlog.md` | Pendientes activos, auditorías post-migración e ideas futuras. |
| `06-prompts-buenos.md` | Prompts reutilizables para Codex/agentes. |
| `07-decisiones.md` | Decisiones de producto, UX, arquitectura, KDS y workflow. |
| `08-agent-workflow.md` | Flujo automático obligatorio para agentes (branching base `v3`, checks y PRs). |
| `09-checklists.md` | Checklists de QA, PR, resiliencia, ambientes y UI Premium Casual. |
| `11-skills-and-tools.md` | Reglas oficiales de skills, herramientas y validación local. |
| `21-order-communication-and-recipe-spec.md` | Especificación de comunicación DTO estructurada, recetas de cocina y catálogo de insumos. |
| `22-v3-bitacora.md` | **Bitácora viva V3**: Log de sesiones, decisiones, métricas, PRs y auditorías de post-migración. |
| `23-saas-multi-tenant-platform.md` | **Plataforma SaaS Multi-Tenant**: Arquitectura, control plane D1, onboarding, gobernanza de planes e integración de Burgers.exe como Flagship #0. |

### 📁 Notas Históricas / Archivo V2 (Referencia Pasada)

| Archivo | Contexto Histórico |
|---|---|
| `10-migration-tracker.md` | [Histórico V2] Tracker Kanban de la migración V2 Clean Architecture. |
| `12-v2-inventory.md` | [Histórico V2] Inventario de apps, endpoints y superficie legacy V2. |
| `13-cloudflare-environments-audit.md` | [Histórico V2] Auditoría Fase 3 de ambientes Cloudflare para V2. |
| `14-active-surface-map.md` | [Histórico V2] Mapa Fase 4 de superficie activa vs legacy en V2. |
| `15-active-cleanup-sheets-appscript.md` | [Histórico V2] Cierre Fase 6 de limpieza Sheets/AppScript. |
| `16-preview-mirror-runbook.md` | [Histórico V2] Fase 7A runbook de preview mirror read-only. |
| `18-daily-ops-qa-routine.md` | [Histórico V2] Fase 8 rutina diaria para Codex en V2. |
| `19-risk-hardening-plan.md` | [Histórico V2] Fase 9 plan de hardening y riesgos pre-producción V2. |
| `20-production-launch-readiness.md` | [Histórico V2] Readiness de lanzamiento productivo para V2. |
| `22-bitacora-v2-v3.md` | [Histórico V2→V3] Bitácora temprana de transición V2→V3 (PRs 480–488). |

---

## Nota

Obsidian solo edita estos archivos Markdown. La fuente real para Codex son estos `.md` dentro del repo.

El asistente prepara el PR cuando la rama ya esté subida y el usuario apruebe el cierre. El usuario revisa y mergea.
