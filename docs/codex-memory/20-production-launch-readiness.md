> Estado: vivo
> Uso: readiness y bitacora de lanzamiento controlado a produccion

# Production launch readiness

## Auditoria Preflight de Preparacion - 2026-08-06

Preflight completo ejecutado exitosamente en preparacion para el nuevo lanzamiento controlado a produccion.

### Resumen de Evidencia Tecnica (Ejecutado Automaticamente por Antigravity)

- `verify-local-tooling.ps1`: OK (`node v24.18.0`, `npm 11.16.0`, `git v2.54.0`, `gh v2.95.0`, `wrangler v4.86.0`, `playwright v1.60.0`).
- `verify-skills.ps1`: OK.
- `npm run typecheck`: OK (0 errores de tipos en TypeScript).
- `npm run build:public`: OK (`dist/public-order-v2` generado en 3.26s).
- `npm run build:internal`: OK (`dist/internal-chekeo-v2` generado en 5.94s).
- `git status --short`: Limpio (sin cambios locales pendientes ni residuos).
- `git diff --check`: Limpio.

### Preflight Cloudflare Read-Only (Ejecutado Automaticamente por Antigravity)

- `npx wrangler whoami`: OK (`jackpoint811@gmail.com`, Account ID `cd3e00cbeb56a331a9c0720f8ca06237`).
- `npx wrangler d1 execute burgers-exe-menu-live --remote --command "SELECT (SELECT COUNT(*) FROM menu_items) as items_count, (SELECT COUNT(*) FROM menu_categories) as cat_count, (SELECT COUNT(*) FROM promo_cards) as promo_count, (SELECT COUNT(*) FROM catalog_banners) as banners_count;"`:
  - `items_count`: 20
  - `cat_count`: 5
  - `promo_count`: 2
  - `banners_count`: 0
  - `changed_db`: false
  - `rows_written`: 0

### Smoke HTTP Pre-Deploy (Ejecutado Automaticamente por Antigravity)

| Target | Resultado | Detalle |
| --- | --- | --- |
| `https://burgers-exe.pages.dev/api/menu-v2` | `200 OK` | `source: "d1"`, items=20, categories=5 |
| `https://chekeo2-0.pages.dev/api/internal-v2-auth/status` | `200 OK` | `authenticated: false` |

---

## Matriz de Lanzamiento: Automatizado vs Manual

### 🤖 Tareas Automatizadas de Antigravity
1. Verificacion completa de compilacion (`typecheck`, `build:public`, `build:internal`).
2. Validacion de sanidad de codigo y git (`git diff --check`, `git status`).
3. Auditoria read-only de base de datos D1 (`burgers-exe-menu-live`).
4. Smoke HTTP pre-deploy contra endpoints productivos reales.
5. Preparacion de comandos de despliegue y runbook de rollback.

### 👤 Tareas Manuales del Usuario
1. **Cloudflare Dashboard Audit**:
   - Confirmar `ORDERS_V2_WRITE_ENABLED = true` en Pages (`burgers-exe` y `chekeo2-0`).
   - Confirmar secreto `BOG_INTERNAL_PIN` en `chekeo2-0`.
   - Confirmar bindings `BOG_MENU_DB` ➡️ `burgers-exe-menu-live` y `BOG_MENU_ASSETS` ➡️ `burgers-exe-assets-v2`.
2. **Validacion UX en Dispositivo Movil**:
   - Probar fluidez de navegacion, adicion al carrito y redireccion a WhatsApp en un telefono real.
3. **Autorizacion Literal de Despliegue**:
   - Confirmar verbalmente en el chat para ejecutar los comandos de despliegue a `burgers-exe` y `chekeo2-0`.

---

## Historial Previo (2026-07-06)

Lanzamiento previo controlado completado el 2026-07-06 (`https://92ebc252.burgers-exe.pages.dev` y `https://05f5003a.chekeo2-0.pages.dev`).
La autorizacion previa fue consumida. Todo nuevo despliegue requiere una nueva autorizacion literal.

---

## QA Preview - Corrección de Modificaciones de Burger (2026-08-06)
- **Reporte QA Usuario**: En pruebas de Preview, al hacer un pedido con Burger OG modificada, no aparecían las modificaciones en Cocina (`chekeo2-0`).
- **Causa Raíz Identificada**:
  1. `getRemovableIngredients` en `public-order-v2` requería un match de SKU muy estricto y descartaba los ingredientes quitados si el SKU del catálogo no era exacto.
  2. `mapOrderV2ItemToInternalItem` en `internal-chekeo-v2` no parseaba snapshots en formato JSON string, perdiendo `removedIngredients`, `extras` y `burgerNote`.
  3. `KitchenQueue.tsx` no contaba `burgerNote` dentro de `hasModOrUpgrade`, mostrando "Burger original" aunque tuviera notas personalizadas.
- **Fix Aplicado**: `PublicOrderApp.tsx`, `InternalChekeoApp.tsx`, `KitchenQueue.tsx`, `CatalogCheckoutDrawer.tsx`, `orders-v2.ts`, `kitchen-item.ts`.
- **Verificación**: `typecheck` y `build` limpios (0 errores).

---

## Lanzamiento Exitoso a Producción - 2026-08-13 (Release PR #524)
- **Autorización Usuario**: Recibida explícitamente ("Approved migration_preview_to_production_plan.md").
- **Promoción de Código**:
  - PR a `main`: [PR #524](https://github.com/jackpoint811-ship-it/Burgers-exe/pull/524) (`release(production): Promoción de Chekeo V2 y Public Order V2 a Producción`).
  - Cambios clave: Renovación integral de branding Premium Casual en Chekeo V2, filtro de calendario horizontal estricto ("Ver Todos" vs "Anteriores"), sticky header fix en Public Order V2, erradicación de temas neón/dark legacy.
- **Compilación de Bundles**:
  - `npm run typecheck`: 0 errores de TypeScript.
  - `npm run build:public`: `dist/public-order-v2` generado en 5.67s.
  - `npm run build:internal`: `dist/internal-chekeo-v2` generado en 8.61s.
- **Despliegues Cloudflare Pages**:
  - `burgers-exe`: `https://2ba33818.burgers-exe.pages.dev` (Producción canónica `https://burgers-exe.pages.dev`).
  - `chekeo2-0`: `https://36b5f36d.chekeo2-0.pages.dev` (Producción canónica `https://chekeo2-0.pages.dev`).
- **Smoke Test HTTP Post-Deploy**:
  - `GET https://burgers-exe.pages.dev/api/menu-v2` ➡️ `200 OK` (`source: "d1"`, items=20, categories=5).
  - `GET https://burgers-exe.pages.dev/api/tower-schedules` ➡️ `200 OK` (`source: "d1"`, 2 torres activas).
  - `GET https://chekeo2-0.pages.dev/api/internal-v2-auth/status` ➡️ `200 OK` (`authenticated: false`).

