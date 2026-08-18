> Estado: vivo
> Uso: bitácora de migración V3 para Codex/Burgers.exe

# 📋 Bitácora V3 — Burgers.exe

> **Estado**: 🟡 En progreso (PR-V3-00)
> **Inicio**: 2026-08-18
> **Última actualización**: 2026-08-18

---

## 🎯 Objetivo

Migración completa V2 → V3 de Burgers.exe. Reescritura total con stack moderno, arquitectura limpia y repo sin legacy.

---

## 🏗️ Stack V3 Aprobado

| Área | Tecnología |
|---|---|
| Frontend framework | React 19 |
| Bundler | Vite 6 |
| Server state | TanStack Query v5 |
| Client state | Zustand v5 |
| Componentes UI | shadcn/ui (sobre Radix UI) |
| Estilos | Tailwind CSS v4 |
| Validación | Zod v3 |
| Formularios | React Hook Form v7 |
| Backend router | Hono.js v4 |
| Base de datos | Cloudflare D1 (sin cambios de schema) |
| Assets | Cloudflare R2 (sin cambios) |
| Deploy | Cloudflare Pages (sin cambios) |

---

## 📍 Decisiones Tomadas

| Fecha | Decisión | Motivo |
|---|---|---|
| 2026-08-18 | Branch `v3` en el mismo repo | V2 sigue en producción sin interrupción |
| 2026-08-18 | Reescritura completa (3C) | God components con 6k+ líneas son irrecuperables |
| 2026-08-18 | Hono.js para backend | 30+ functions individuales sin router → un solo punto de entrada |
| 2026-08-18 | Tailwind CSS v4 | Reemplaza 9,711 líneas de CSS monolítico |
| 2026-08-18 | Zustand para carrito | Estado del carrito estaba disperso en god component |
| 2026-08-18 | TanStack Query | Elimina todos los `useEffect(fetch)` manuales |
| 2026-08-18 | shadcn/ui | Componentes accesibles como código propio (no dependencia) |
| 2026-08-18 | Cutover al final (PR-V3-13) | Nunca merge a main sin aprobación explícita |

---

## 🗓️ Roadmap de PRs

| PR | Nombre | Estado | PR URL | Fecha inicio | Fecha cierre |
|---|---|:---:|---|---|---|
| V3-00 | Branch v3 + Limpieza total del repo | 🔄 En progreso | — | 2026-08-18 | — |
| V3-01 | Dependencias + Scaffold estructura V3 | ⏳ Pendiente | — | — | — |
| V3-02 | packages/config (Zod) + packages/ui (shadcn) | ⏳ Pendiente | — | — | — |
| V3-03 | Backend: Hono.js router centralizado | ⏳ Pendiente | — | — | — |
| V3-04 | Public Order: Zustand stores | ⏳ Pendiente | — | — | — |
| V3-05 | Public Order: Features (TanStack Query) | ⏳ Pendiente | — | — | — |
| V3-06 | Public Order: UI components (catálogo, drawers) | ⏳ Pendiente | — | — | — |
| V3-07 | Public Order: Checkout + integración final | ⏳ Pendiente | — | — | — |
| V3-08 | Chekeo: Auth + AppShell + tabs | ⏳ Pendiente | — | — | — |
| V3-09 | Chekeo: Feature Pedidos | ⏳ Pendiente | — | — | — |
| V3-10 | Chekeo: Feature Cocina | ⏳ Pendiente | — | — | — |
| V3-11 | Chekeo: Feature Pagos | ⏳ Pendiente | — | — | — |
| V3-12 | Chekeo: Feature Admin completo | ⏳ Pendiente | — | — | — |
| V3-13 | Cutover + Eliminar V2 + Merge a main | ⏳ Pendiente | — | — | — |

**Leyenda**: ⏳ Pendiente · 🔄 En progreso · ✅ Mergeado · ❌ Bloqueado · ⏸️ Pausado

---

## 📝 Log de Sesiones

### 📅 2026-08-18 — Sesión 1: Planificación + PR-V3-00

**Investigación realizada:**
- Leída toda la memoria del proyecto (`docs/codex-memory/00-indice.md` a `21-*.md`)
- Medidos los archivos críticos con `wc -l` (InternalChekeoApp: 6,336 líneas; styles.css: 9,711 líneas)
- Graphify actualizado: **4,033 nodos · 6,539 edges · 277 comunidades**
- Revisados todos los PRs mergeados (PR #518 → PR #525) y sus aprendizajes

**Acciones ejecutadas en PR-V3-00:**
- Branch `v3` creado desde `main` (commit `1cd4a79`)
- `legacy/` eliminado completamente (~130 archivos)
- 6 archivos obsoletos en la raíz eliminados (`implementation_plan BASURA.md`, etc.)
- 22 docs de fases V2 cerradas eliminados de `docs/`
- Memoria actualizada: `01-estado-actual.md`, `07-decisiones.md`, `00-indice.md`, `05-backlog.md`
- Bitácora V3 creada: `docs/codex-memory/22-v3-bitacora.md`

**Próximo paso:** Completar checks, commit, push y abrir PR para V3-00.

---

## 📌 Issues Abiertos

| # | Descripción | Severidad | Estado |
|---|---|---|---|
| — | Sin issues por ahora | — | — |

---

## 🔴 Reglas Permanentes V3 (de AGENTS.md)

- Nunca merge a `main` sin aprobación explícita del usuario
- Nunca push directo a `main`
- Cada PR tiene un único objetivo
- `npm run typecheck` + `npm run build` en cada PR con código
- Bitácora se actualiza al cierre de cada PR
- Graphify se corre antes de cambios de arquitectura

---

## 📊 Métricas de partida (V2 baseline)

| Métrica | V2 valor | Meta V3 |
|---|---|---|
| Líneas en god component principal | 6,336 (InternalChekeoApp) | < 100 (AppShell) |
| Líneas en CSS monolítico | 9,711 (public styles.css) | < 150 (globals.css) |
| Archivos de backend (functions) | 30+ sueltos | 1 router Hono + routes/ |
| Estado del carrito | useState disperso | Zustand store centralizado |
| Caché de servidor | 0 (fetch manual en useEffect) | TanStack Query (5min cache) |
| Archivos en legacy/ | ~130 | 0 (eliminados en V3-00) |
