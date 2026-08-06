# Plan Maestro: Sub-menú Unificado y Módulos de Control V3 — Burgers.exe

Especificación técnica a nivel código del **Sub-menú de Navegación Unificado en Control V3** y la arquitectura modular para la administración del menú, stock, combos e ingredientes. Este plan asegura que la separación de módulos sea "quirúrgica", sin romper flujos existentes y con soporte robusto en Cloudflare D1/R2.

---

## 🏛️ Arquitectura Base del Sub-menú Unificado V3

### 1. Entrada Principal (`apps/internal-chekeo-v2/src/components/CatalogV3Panel.tsx`)
Se refactorizará este archivo para que actúe únicamente como el **Layout Shell**.
- Mantendrá el estado global mínimo necesario (`V3Section` o similar).
- Renderizará el **Sub-menú de Navegación Superior Fijo**.
- Implementará un renderizado condicional puro (Switch) que montará dinámicamente **1 de 5 componentes independientes** según la sección activa.
- **Evitará pasar props masivas**; cada módulo será autónomo y hará su propio `fetch` de datos necesarios para evitar re-renders innecesarios.

```
┌──────────────────────────────────────────────────────────────────────────┐
│  ⚡ CONTROL V3 — Panel de Administración                                  │
├──────────────────────────────────────────────────────────────────────────┤
│ [ 📦 Catálogo & Stock ] [ 🔥 Combos ] [ 🥬 Ingredientes ] [ ⚡ Ofertas ] [ 🎨 Tienda ]│
└──────────────────────────────────────────────────────────────────────────┘
```

---

## 🧩 División Modular (5 Componentes Independientes)

### 📦 Módulo 1: `MenuStockTool` (`apps/internal-chekeo-v2/src/components/v3/MenuStockTool.tsx`)
- **Propósito**: Gestión diaria del catálogo público y existencias.
- **Implementación**:
  - `fetch('/api/menu-v2')` de forma autónoma.
  - Filtro por Categorías usando el `MenuCategory['key']` existente (`burgers`, `guarniciones`, `drinks`, `extras`).
  - Tarjetas de producto renderizadas en un grid.
  - Botones directos que disparan `PATCH /api/menu-v2-admin/items/:sku/availability`.
- **Drawer de Edición (`BurgerEditorDrawer.tsx`)**:
  - Al hacer clic en "Editar Burger", abre un Drawer (`@ui/Drawer`).
  - Modifica precio base, foto y gestiona la **receta**.
  - **Integración D1**: Interactúa con `functions/api/menu-v2-admin/recipes.ts` (a crear) para guardar/leer de `product_ingredient_recipes_v2`.

---

### 🔥 Módulo 2: `ComboBuilderTool` (`apps/internal-chekeo-v2/src/components/v3/ComboBuilderTool.tsx`)
- **Propósito**: Construcción independiente de combos.
- **Implementación**:
  - Filtra específicamente los items donde `category_key = 'combos'`.
  - UI especializada para editar `combo_config_json` (que se guarda en `menu_items`).
  - Permite configurar los `ComboOptionGroup` (ej. Grupos obligatorios, límites, upcharges).
- **Integración D1**: Utiliza el endpoint existente `PATCH /api/menu-v2-admin/items/:sku` pero enviando el payload específico de `comboConfig`.

---

### 🥬 Módulo 3: `IngredientsMasterTool` (`apps/internal-chekeo-v2/src/components/v3/IngredientsMasterTool.tsx`)
- **Propósito**: Lista maestra de ingredientes.
- **Implementación**:
  - CRUD independiente para `ingredients_v2`.
  - Muestra ID, nombre, unidad (`pieza`, `g`, `ml`, etc.), y precio unitario.
- **Integración D1**: Ya existen en `lib/ingredients-v2-admin.ts` y usan `functions/api/menu-v2-admin/ingredients.ts`. Asegurar que este módulo consuma esa API exclusivamente.

---

### ⚡ Módulo 4: `PromosManagementTool` (`apps/internal-chekeo-v2/src/components/v3/PromosManagementTool.tsx`)
- **Propósito**: Gestión de ofertas temporales.
- **Implementación**:
  - Lista de productos con UI enfocada en los campos `is_promo_active`, `promo_price_cents`, `promo_label`.
  - Un toggle global/por ítem para encender ofertas.
- **Integración D1**: Llama a `PATCH /api/menu-v2-admin/items/:sku` para modificar exclusivamente los campos de promo.

---

### 🎨 Módulo 5: `StoreBannersTool` (`apps/internal-chekeo-v2/src/components/v3/StoreBannersTool.tsx`)
- **Propósito**: Banners, horarios y estado de la tienda.
- **Implementación**:
  - Absorbe la funcionalidad actual de la sección "banners", "tienda", y "sorteo" de `CatalogV3Panel.tsx`.
  - Gestión de banners (`catalog-banners` y `category-banners`).
  - Gestión de horarios (`tower_schedules`).
- **Integración Cloudflare R2**: Utiliza los endpoints existentes para subir imágenes (`POST /api/menu-v2-admin/catalog-banners/:id/image` y `POST /api/menu-v2-admin/category-banners/:id/image`).

---

## ☁️ Integraciones Críticas Cloudflare

1.  **D1 Base de Datos (`BOG_MENU_DB`)**:
    - `menu_items`: Campo `combo_config_json` crítico para `ComboBuilderTool`.
    - `product_ingredient_recipes_v2` / `ingredients_v2`: Críticos para `MenuStockTool` (recetas) y `IngredientsMasterTool`.
    - `tower_schedules`: Crítico para `StoreBannersTool`.
2.  **R2 Almacenamiento (`BOG_ASSETS`)**:
    - Las fotos de productos de `MenuStockTool` y los banners de `StoreBannersTool` suben a R2 mediante `FormData`. Se usarán los utilitarios existentes (`getAssetUrl`).
3.  **Workers (API Runtime)**:
    - `functions/api/menu-v2-admin/items.ts`: Se mantendrá intacto pero se usará de forma más inteligente desde los módulos independientes, enviando payloads parciales (ej. solo `comboConfig` o solo `promoPriceCents`).

---

## 🗂️ Roadmap Secuencial de PRs (Ajustado a Nivel Código)

> [!IMPORTANT]
> Ningún PR romperá el renderizado público de `CatalogModeApp.tsx`. Todo sucede en `apps/internal-chekeo-v2` o en endpoints API aislados.

1.  **PR 1: Refactor Base (`CatalogV3Panel.tsx`) y `MenuStockTool.tsx`**
    - Convertir `CatalogV3Panel` en un switch puro.
    - Extraer la lógica de Menú a `MenuStockTool.tsx`.
    - Implementar agrupamiento por categorías en la vista.
2.  **PR 2: Componente `BurgerEditorDrawer.tsx` con recetas**
    - Implementar el drawer de edición en `MenuStockTool`.
    - Conectar con la API de recetas (`product_ingredient_recipes_v2`).
3.  **PR 3: Componente `ComboBuilderTool.tsx`**
    - Crear UI dedicada para construir `combo_config_json`.
4.  **PR 4: Componentes `IngredientsMasterTool.tsx` y `PromosManagementTool.tsx`**
    - Desacoplar gestión de ingredientes y crear panel masivo de promociones.
5.  **PR 5: Componente `StoreBannersTool.tsx` y Limpieza**
    - Mover R2 Banners, Horarios y Sorteos al módulo Tienda.
    - Eliminar código muerto en `CatalogV3Panel.tsx`.

---

## 🧪 Plan de Verificación y Riesgos

### Riesgos Identificados (Loose Ends):
- **Estado Global vs Local**: Al separar en 5 componentes, no debemos hacer 5 llamadas simultáneas a `/api/menu-v2` al montar la app. El Fetch inicial debe optimizarse o cada módulo debe hacer lazy-load.
- **Actualizaciones parciales D1**: Asegurar que cuando `ComboBuilderTool` o `PromosManagementTool` hagan `PATCH`, el endpoint `/api/menu-v2-admin/items.ts` no sobreescriba campos no enviados con `null` o `[]`.

### Verificación:
1. `npm run typecheck` en root.
2. Validar que la interfaz `MenuStockTool` muestre botones ágiles y no crashee si un producto no tiene receta.
3. Asegurar que las imágenes subidas en `StoreBannersTool` persisten en la CDN.
