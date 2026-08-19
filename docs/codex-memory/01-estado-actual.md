> Estado: vivo
> Uso: memoria operativa para Codex/Burgers.exe

# Estado actual de Burgers.exe

## Contexto general

Burgers.exe tiene una app pública de pedidos y una app interna de Chekeo.

**Migración V3 en progreso** — branch `v3` desde `main`. V2 sigue en producción sin cambios.

## Stack V3

- React 19 + Vite 6
- TanStack Query v5 (server state / caché)
- Zustand v5 (client state / carrito)
- shadcn/ui sobre Radix UI (componentes accesibles)
- Tailwind CSS v4 (reemplaza CSS monolítico)
- Zod v3 (validación compartida frontend/backend)
- React Hook Form v7 (formularios)
- Hono.js v4 (router backend centralizado)
- Cloudflare D1 + R2 (sin cambios de schema)

## Reglas importantes

- `AGENTS.md` manda sobre esta memoria.
- Los cambios deben terminar en Pull Request cuando el usuario apruebe el cierre.
- Usar Graphify antes de cambios grandes o de arquitectura.
- No meter dependencias nuevas sin autorización.
- Mantener enfoque mobile-first.
- Mantener UX clara, accesible y consistente con la marca.
- **NUNCA merge a `main` del branch `v3` sin aprobación explícita del usuario.**
- Apps V2 permanecen intactas en el repo hasta el PR-V3-13 (cutover final).

## Roadmap V3 — 13 PRs secuenciales

| PR | Objetivo | Estado |
|---|---|---|
| V3-00 | Branch v3 + limpieza total del repo | ✅ Mergeado |
| V3-01 | Dependencias + scaffold estructura V3 | ✅ Mergeado |
| V3-02 | packages/config (Zod) + packages/ui (shadcn) | ✅ Mergeado |
| V3-03 | Backend: Hono.js router centralizado | ✅ Mergeado |
| V3-04 | Public Order: Zustand stores | ✅ Mergeado |
| V3-05 | Public Order: Features (TanStack Query) | ✅ Mergeado |
| V3-06 | Public Order: UI components (catálogo, drawers) | ✅ Mergeado |
| V3-07 | Public Order: Checkout + integración | ✅ Mergeado |
| V3-08 | Chekeo: Auth + shell + tabs | ✅ Mergeado |


| V3-09 | Chekeo: Feature Pedidos | ✅ Mergeado |
| V3-10 | Chekeo: Feature Cocina | ⏳ Pendiente |
| V3-11 | Chekeo: Feature Pagos | ⏳ Pendiente |
| V3-12 | Chekeo: Feature Admin | ⏳ Pendiente |
| V3-13 | Cutover + eliminar V2 + merge a main | ⏳ Pendiente |

## Bitácora V3

Ver `docs/codex-memory/22-v3-bitacora.md` para el log detallado de sesiones, decisiones y métricas.

## Estado funcional deseado

- Pedidos: revisar pedidos con detalle, sin saturar con descarga/envío de imagen.
- Pagos: concentrar ticket, WhatsApp y comprobante.
- Corte: debe funcionar bien y mostrar resumen operativo.
- Resumen K: debe mostrar burgers, ingredientes, extras y cantidades necesarias.
- Sorteo: debe mostrar lo más importante sin saturar.

## Hito reciente - 2026-08-18

- **PR-V3-00 en progreso**: Branch `v3` creado, `legacy/` eliminado, docs obsoletas eliminadas, memoria actualizada.
- V2 en producción (PR #525 fue el último merge a main).
