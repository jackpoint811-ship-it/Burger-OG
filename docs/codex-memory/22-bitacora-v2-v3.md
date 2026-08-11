> Estado: vivo — se actualiza en cada PR relacionado con V2→V3
> Uso: bitácora oficial de cambios, decisiones y transición V2→V3 (Burgers.exe)

# Bitácora V2 → V3

## Propósito

Documentar qué se ha hecho, por qué se hizo, y cómo evolucionan los componentes,
herramientas y contratos durante la transición de la arquitectura V2
(Clean Architecture con cyberpunk legacy) hacia la V3 (Premium Casual).

## Contexto de la transición

- **V2**: apps `public-order-v2` e `internal-chekeo-v2` sobre Cloudflare Pages +
  D1 + R2, estética legacy cyberpunk/neón (zinc-950, fuchsia, cyan, amber),
  con fallbacks silenciosos a mock data y bypass de auth en desarrollo.
- **V3**: estética **Premium Casual** obligatoria según `AGENTS.md`
  (fondo crema `#F5F2EE`, superficies blancas, acento verde bosque `#16A34A`,
  dark mode slate `#121212`/`#1E1E1E`), fin de los datos simulados silenciosos
  y disciplina de contrato estricta (Single Source of Truth desde Chekeo).

## Roadmap de la transición

- `PR1 → Contrato`: definir payloads y reglas desde Chekeo (done en PRs previos 237–240, 397–400).
- `PR2 → Flag/Tokens`: tokens Premium Casual en `packages/ui` (done).
- `PR3 → Headless shell`: migración de componentes Chaka V3 a Premium Casual (done).
- `PR4 → Limpieza de fallbacks`: remover mocks silenciosos y bypass de auth (done).
- `PR5 → Drawers/UX`: polish visual y micro-interacciones (pendiente).

## Cambios realizados

### 1. Fallback silencioso en `menu-v2` (public-order-v2) — por qué

- **Qué**: `apps/public-order-v2/src/lib/menu-v2.ts` dejó de devolver mock data
  silenciosamente cuando la API falla; ahora propaga el error.
- **Por qué**: mostrar precios, stock y promociones falsos en producción es un
  riesgo comercial real (pérdida de dinero, tickets inválidos, promesas rotas).
  El frontend público debe fallar visiblemente antes que mentir con datos mock.
- **Impacto**: `PublicOrderApp.tsx` ahora maneja `menuData: MenuV2Response | null`
  con early return y pantalla de error antes de los `useMemo` (evita hooks
  condicionales y errores de runtime React).
- **Archivos**: `menu-v2.ts`, `PublicOrderApp.tsx`.

### 2. Bypass de auth mock en `internal-auth` — por qué

- **Qué**: `apps/internal-chekeo-v2/src/lib/internal-auth.ts` eliminó la sesión
  mock por `sessionStorage vite_local_mock_auth`.
- **Por qué**: un admin que se autentica sin servidor podía operar Chekeo sin
  credenciales reales. Seguridad: se mantiene solo el flujo real contra
  `functions/api/internal-v2-auth/*`.
- **Archivos**: `internal-auth.ts`, `InternalChekeoApp.tsx`.

### 3. Mock orders eliminado en Chekeo — por qué

- **Qué**: `InternalChekeoApp.tsx` pasó de `mockOrders` a `orders: []` reales;
  se eliminaron `asInternalOrders` y `normalizeMockOrderItem`.
- **Por qué**: sin datos D1, la pantalla debe mostrar vacío real, no pedidos
  ficticios que confunden la operación de cocina.

### 4. Tokens Premium Casual centralizados en `packages/ui` — por qué

- **Qué**: `packages/ui/src/components.tsx` y `shell-card.tsx` migrados a la
  paleta Premium Casual (verde `#16A34A`/`#22C55E`, crema `#F5F2EE`, neutros).
- **Por qué**: la estética V3 se gobierna desde un solo paquete compartido;
  los consumidores (public-order-v2, internal-chekeo-v2) heredan el tema sin
  duplicar tokens.
- **Archivos**: `packages/ui/src/components.tsx`, `packages/ui/src/shell-card.tsx`.

### 5. Migración de componentes V3 a Premium Casual — por qué

- **Qué**: los 6 componentes de `apps/internal-chekeo-v2/src/components/v3/`
  migrados del tema cyberpunk al Premium Casual:
  - `ComboBuilderTool.tsx`
  - `BurgerEditorDrawer.tsx`
  - `IngredientsMasterTool.tsx`
  - `MenuStockTool.tsx`
  - `PromosManagementTool.tsx`
  - `StoreBannersTool.tsx`
- **Por qué**: según `AGENTS.md`, cualquier componente V3 debe respetar la
  estética Premium Casual; los estilos legacy (fondos oscuros, colores neón)
  destruían el contraste del nuevo diseño. Se auditaron exhaustivamente
  clases CSS para erradicar temas residuales.
- **Impacto**: ~1060 líneas overhaul, cero cambios de lógica de negocio,
  payloads o contratos.

### 6. Template de producción Cloudflare — por qué

- **Qué**: nuevo `wrangler.production.toml` como template de deploy a
  producción (namespaces y variables de producción).
- **Por qué**: separar preview de producción en Pages/D1/R2 sin tocar el
  `wrangler.toml` actual de preview. **Decisión tomada**: la separación
  efectiva de Cloudflare NO es necesaria hoy; el template queda listo para
  el lanzamiento productivo real.
- **Archivos**: `wrangler.production.toml` (nuevo).

### 7. Side quest: estado "done" independiente en cocina (contaminación)

- **Qué**: `KitchenQueue.tsx` y `kitchen-helpers.ts` corrigen el estado
  independiente de items "side quest" de combos (`caf4931`).
- **Por qué**: fix aislado previo de cocina encontrado al auditar la rama;
  se mantiene separado del scope V3 (documentado aquí para trazabilidad).
- **Archivos**: `KitchenQueue.tsx`, `kitchen-helpers.ts`, `kitchen-types.ts`, `InternalChekeoApp.tsx`.

### 8. Documentación y workflow

- `AGENTS.md`: reglas añadidas/ajustadas de PRs pequeños y workflow automático.
- `docs/codex-memory/08-agent-workflow.md`: flujo obligatorio para agentes.
- **Este archivo** (`22-bitacora-v2-v3.md`): bitácora viva de la transición.

## Contaminación identificada (scope NO-V3 en el PR actual)

Archivos del PR #480 que NO pertenecen al scope V3 estético y deberían salir
del PR en una segunda pasada (o quedarse documentados si se decide aprobar
todo junto):

- `apps/public-order-v2/src/components/CatalogCartDrawer.tsx`
- `apps/public-order-v2/src/components/CatalogCheckoutDrawer.tsx`
- `apps/public-order-v2/src/components/CatalogProductDrawer.tsx`
- `apps/public-order-v2/src/lib/catalog-cart.ts`
- `apps/internal-chekeo-v2/src/components/kitchen/kitchen-helpers.ts`
- `apps/internal-chekeo-v2/src/components/kitchen/kitchen-types.ts`
- `apps/internal-chekeo-v2/src/components/kitchen/KitchenQueue.tsx`

## Evolución de componentes y herramientas

| Componente / Herramienta | V2 (antes) | V3 (ahora) |
|---|---|---|
| `packages/ui` (tokens) | Cyberpunk neón | Premium Casual (crema/blanco/verde bosque) |
| `ComboBuilderTool` | Fondo oscuro, neón | Superficies claras, bordes sutiles |
| `BurgerEditorDrawer` | Cyberpunk | Premium Casual |
| `IngredientsMasterTool` | Cyberpunk | Premium Casual |
| `MenuStockTool` | Cyberpunk | Premium Casual |
| `PromosManagementTool` | Cyberpunk | Premium Casual |
| `StoreBannersTool` | Cyberpunk | Premium Casual |
| `menu-v2` (public) | fallback mock silencioso | error explícito, sin datos falsos |
| `internal-auth` | bypass mock en dev | solo flujo real autenticado |
| `InternalChekeoApp` | `mockOrders` ficticios | `orders: []` real |
| `wrangler.toml` | preview-only | + template `wrangler.production.toml` |

## Decisiones registradas

1. **Sin datos simulados en producción**: ningún frontend público devuelve
   mock data como fallback (precios/stock/promos ficticios = riesgo operativo).
2. **Sin bypass de auth**: el admin solo opera con sesión real contra D1.
3. **Estética única Premium Casual**: gobierno central en `packages/ui`,
   cero temas residuales en componentes.
4. **Cloudflare separado NO es urgente**: trabajar con infraestructura actual;
   la separación preview/prod queda como template para el lanzamiento real.

## Pendiente (backlog V3)

- `PR5 → Drawers/UX`: polish de micro-interacciones y responsive fino.
- Separar los archivos NO-V3 del PR actual en PRs independientes.
- Auditoría visual live (browser) de los 6 componentes migrados.
- Validación de dark mode (`theme-dark`) en componentes V3.

## Cómo actualizar esta bitácora

Al cerrar cada PR relacionado con V2→V3:

1. Agregar bloque en "Cambios realizados" con **qué** y **por qué**.
2. Actualizar la tabla de evolución si cambia un componente/herramienta.
3. Registrar decisiones nuevas en "Decisiones registradas".
4. Mover pendientes cerrados al final del PR correspondiente.