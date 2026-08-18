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
| V3-00 | Branch v3 + Limpieza total del repo | ✅ Mergeado | [#530](https://github.com/jackpoint811-ship-it/Burgers-exe/pull/530) | 2026-08-18 | 2026-08-18 |
| V3-01 | Dependencias + Scaffold estructura V3 | 🔄 En progreso | — | 2026-08-18 | — |
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

### 📅 2026-08-18 — Sesión 1: Planificación + PR-V3-00 (Mergeado #530)
- PR-V3-00 completado y mergeado a main: eliminación de `legacy/` y 28 archivos obsoletos.

### 📅 2026-08-18 — Sesión 2: PR-V3-01 Dependencias & Scaffold V3
- Instaladas dependencias V3: `@tanstack/react-query`, `zustand`, `zod`, `react-hook-form`, `@hookform/resolvers`, `hono`, `tailwindcss@4`, `@tailwindcss/vite`.
- Eliminados `postcss.config.js` y `tailwind.config.ts` (Tailwind v4 utiliza `@import "tailwindcss"` nativo sin build config legacy).
- Creada estructura limpia para `apps/public-order-v3/` y `apps/internal-chekeo-v3/` con `index.html`, `public/_headers`, `styles/globals.css`, `app/` y `main.tsx`.
- Actualizado `vite.config.ts` para soporte dinámico de targets v3 (`public-v3`, `chekeo-v3`) y v2 para transición segura.
- Actualizado `package.json` con nombre `burgers-exe-v3`, versión `3.0.0` y scripts correspondientes.
- Verificaciones: `npm run typecheck` (0 errores) y `npm run build` (ambas apps v3 compilan en ~2s).

---

## 📌 Issues Abiertos

| # | Descripción | Severidad | Estado |
|---|---|---|---|
| — | Sin issues por ahora | — | — |

---

## 🔴 Reglas Permanentes V3 (de AGENTS.md)

- **Base de PRs Obligatoria**: Todos los PRs del roadmap V3 (PR-V3-02 hasta PR-V3-12) se crean con base en `v3` (`gh pr create --base v3 --head feat/v3-xx-...`).
- **Protección de `main`**: Nunca abrir PR hacia `main` ni hacer push a `main` hasta el cutover final (PR-V3-13), previa autorización explícita.
- **Atomicidad**: Cada PR tiene un único objetivo acotado y verificable.
- **Checks Obligatorios**: `git diff --check`, `npm run typecheck` y `npm run build` en cada PR.
- **Bitácora**: Se actualiza al cierre de cada PR.
- **Graphify**: Se corre antes de cambios de arquitectura o flujos conectados.

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
