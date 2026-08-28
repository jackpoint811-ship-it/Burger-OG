# 🍔 GEMINI.md — Reglas Principales para Burgers.exe (Antigravity / Gemini CLI)

> **Contexto:** Burgers.exe es una plataforma de pedidos de hamburguesas con dos aplicaciones V3:
> 1. `apps/public-order-v3`: Tienda pública mobile-first para clientes.
> 2. `apps/internal-chekeo-v3`: Punto de venta interno (POS), comandería KDS, conciliación de pagos y administración.

---

## ⚡ PALABRA CLAVE DE ACTIVACIÓN: `Burgers.exe`

El activador maestro opera en dos modalidades:
1. **Modo Estatus (Solo comando)**: Si el prompt es únicamente **`Burgers.exe`**, `burger.exe` o `/burgers`:
   - Leer `docs/codex-memory/01-estado-actual.md` y `docs/codex-memory/22-v3-bitacora.md`.
   - Verificar rama activa (`git status`) y estado de compilación.
   - Responder con resumen conciso del estado actual y ponerse a la orden.
2. **Modo Acción Directa (Con tarea)**: Si el prompt incluye una tarea (ej: `burgers.exe: <tarea>`, `/plan burgers.exe: <tarea>` o `/burgers <tarea>`):
   - Cargar silenciosamente la memoria viva (`01-estado-actual.md` y `22-v3-bitacora.md`) y validar restricciones.
   - Si se invoca con `/plan`, elaborar el plan de diseño/implementación antes de modificar código.
   - Proceder inmediatamente con la planificación o ejecución de la tarea.

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
6. **NUNCA INVENTAR DATOS NI USAR FALLBACKS FICTICIOS**:
   - Consumir única y exclusivamente los datos reales de Cloudflare D1 (`menu_items`, `ingredients_v2`, `product_ingredient_recipes_v2`, `orders_v2`), Cloudflare R2 y endpoints Hono.
   - Queda estrictamente prohibido simular o inventar productos, precios, SKUs, ingredientes, recetas, combos o estados de pedidos ficticios en el frontend o en scripts de prueba.
   - Si un dato o configuración no existe, debe reflejarse limpiamente o solicitarse su configuración en Chekeo, nunca ocultar errores con valores por omisión inventados.
7. **NUNCA DESFASAR FECHAS NI ENTORNO EN PEDIDOS (HORA CDMX & PREVIEW SOURCE)**:
   - Todo pedido de prueba o preview debe llevar `source: "public-v2-preview"`.
   - Toda fecha operativa debe calcularse usando obligatoriamente la hora de Ciudad de México (`getCdmxTodayString()` / `America/Mexico_City`), previniendo desalineaciones entre servidores UTC y navegadores locales.
8. **NUNCA MERGEAR PRS AUTOMÁTICAMENTE (EL USUARIO REVISA Y MERGEA)**:
   - Prohibido ejecutar `gh pr merge` o mergear Pull Requests por cuenta propia.
   - El agente solo valida checks, abre el PR, reporta la URL y se detiene. El usuario es el único que revisa y hace el merge en GitHub.

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
5. **Apertura de PR y Entrega al Usuario (Sin Merge Automático)**:
   - Al terminar con checks en verde, preparar commit limpio, hacer push de la rama y abrir Pull Request hacia `preview` o `v3`.
   - Entregar el reporte estructurado con Resumen, Archivos Modificados, Checks, Riesgos, Checklist QA y Enlace al PR.
   - **DETENERSE AHÍ. El usuario revisa y hace el merge en GitHub.**

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
