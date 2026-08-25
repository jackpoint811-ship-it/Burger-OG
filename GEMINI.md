# 🍔 GEMINI.md — Reglas Principales para Burgers.exe (Antigravity / Gemini CLI)

> **Contexto:** Burgers.exe es una plataforma de pedidos de hamburguesas con dos aplicaciones V3:
> 1. `apps/public-order-v3`: Tienda pública mobile-first para clientes.
> 2. `apps/internal-chekeo-v3`: Punto de venta interno (POS), comandería KDS, conciliación de pagos y administración.

---

## 🛑 1. PROHIBICIONES ESTRICTAS (HARD CONSTRAINTS)

1. **NUNCA HACER PUSH NI MERGE A `main`**:
   - `main` está reservado exclusivamente para producción.
   - Toda rama de feature se crea a partir de `preview` o `v3` (`git checkout -b feat/...`).
   - Los PRs se abren con base en `preview` o `v3` (`gh pr create --base preview ...` o `--base v3`).
2. **NUNCA INSTALAR DEPENDENCIAS NUEVAS**:
   - No modificar `package.json`, lockfiles ni agregar bibliotecas externas salvo autorización explícita del usuario.
3. **NUNCA ROMPER CONTRATOS DE DATOS**:
   - No alterar contratos de API Hono (`functions/api/`), schemas Zod (`packages/config`), precios, tickets, migraciones D1 ni buckets R2 sin autorización.
4. **NUNCA USAR ESTÉTICA CYBERPUNK O NEÓN LEGACY**:
   - Respetar estrictamente la estética **Premium Casual**: fondo cálido/crema (`#F5F2EE`), tarjetas blancas (`#FFFFFF`), acento verde bosque (`#16A34A`), dark mode slate (`#121212`) y tipografía Inter.
5. **NUNCA EJECUTAR COMANDOS DESTRUCTORIOS**:
   - Prohibido `git reset --hard`, `git add .`, `git add -A` o scripts de semillas destructivos en bases de datos remotas.

---

## 🔄 2. FLUJO OBLIGATORIO DE TRABAJO

1. **Lectura de Memoria**:
   - Antes de proponer o modificar código, consultar `docs/codex-memory/01-estado-actual.md` y `docs/codex-memory/22-v3-bitacora.md`.
2. **Cambios Quirúrgicos**:
   - Realizar únicamente los cambios mínimos necesarios para el requerimiento actual. Cero refactors oportunistas.
3. **Verificaciones Técnicas Obligatorias**:
   - `git diff --check`
   - `npm run typecheck` (0 errores de TypeScript)
   - `npm run build:public` y `npm run build:chekeo` (Builds limpios)
4. **Actualización de Memoria**:
   - Registrar los cambios en `docs/codex-memory/22-v3-bitacora.md` y actualizar `01-estado-actual.md`.
5. **Cierre Automático (Autorización Permanente)**:
   - Al terminar con checks en verde, preparar commit limpio, hacer push de la rama y abrir Pull Request hacia `preview` o `v3`.
   - Entregar el reporte estructurado con Resumen, Archivos Modificados, Checks, Riesgos, Checklist QA y Enlace al PR.
   - El usuario revisa y hace el merge.

---

## 🏗️ 3. ARQUITECTURA & STACK V3

* **Frontend**: React 19 + Vite 6 + Tailwind CSS v4 + Radix UI / shadcn
* **State Management**: Zustand v5 (Client State: `cart.store.ts`, `ui.store.ts`, `checkout.store.ts`) + TanStack Query v5 (Server State)
* **Validación**: Zod v3 en `packages/config/src/schemas.ts`
* **Backend**: Hono.js v4 en Cloudflare Pages / Workers (`functions/api/index.ts`)
* **Base de Datos & Assets**: Cloudflare D1 (`burgers-exe-menu-v2-preview`) + Cloudflare R2

---

## 📚 4. REFERENCIAS
* Reglas maestras: [AGENTS.md](file:///home/jackpoint811/Burgers-exe/AGENTS.md)
* Flujo detallado: [docs/codex-memory/08-agent-workflow.md](file:///home/jackpoint811/Burgers-exe/docs/codex-memory/08-agent-workflow.md)
* Estado vivo: [docs/codex-memory/01-estado-actual.md](file:///home/jackpoint811/Burgers-exe/docs/codex-memory/01-estado-actual.md)
