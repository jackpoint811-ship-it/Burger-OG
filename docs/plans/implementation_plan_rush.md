# Plan Minucioso de Rediseño de Cocina "Rush-Proof" (Preparación & Side Quest)

Este plan define las modificaciones precisas en la interfaz de cocina (`apps/internal-chekeo-v2`) para resolver el ruido visual, las contradicciones en nombres de combos y la duplicación de notas, permitiendo que un cocinero u operador en pleno **rush** pueda entender cada comanda en **menos de 2 segundos**.

---

## Diagnóstico y Problemas Identificados en Capturas

1. **Confusión en Nombres de Combos (`BURGER DEL COMBO: OG Full Loaded` vs `Burger OG`)**:
   - *Problema*: La tarjeta muestra un título superior `BURGER DEL COMBO: OG Full Loaded` y luego desglosa una caja interna que dice `BURGERS DEL COMBO: Burger OG`.
   - *Efecto en Rush*: El parrillero se frena a pensar cuál hamburguesa debe preparar.
   - *Solución*: El título principal de la tarjeta debe ser siempre la **hamburguesa real a armar** (ej: `Burger OG`), y la información de origen se muestra como un chip secundario (`De combo · Combo OG Full Loaded`).

2. **Contaminación de Notas de Entrega en Tarjetas de Armado**:
   - *Problema*: Instrucciones de entrega (`Piso 10, Sala de Juntas A`, `Recepción Piso 2`) se muestran dentro de la tarjeta de armado de la hamburguesa o de los aros de cebolla.
   - *Efecto en Rush*: Distrae al cocinero de las modificaciones reales de comida (`Sin cebolla`, `Extra queso`).
   - *Solución*: Eliminar las notas generales del pedido de las tarjetas de armado. Las tarjetas individuales solo contendrán `MOD`, `UPGRADE` y término de carne. La `NOTA DEL PEDIDO` se ubicará exclusivamente en la cabecera superior de la orden activa.

3. **Duplicación de Badges e Inconsistencia por Estación**:
   - *Problema*:
     - Se muestran dos tiras de conteo superpuestas (`PEDIDO ACTIVO: 🍔 2/3 Burgers · 🍟 1/2 Sides` y abajo `🍔 3 Burgers · 🍟 2 Sides`).
     - En **Side Quest**, el badge superior sigue mostrando `🍔 0/1 Burgers`, confundiendo a la estación de papas/bebidas con ítems de la parrilla.
   - *Solución*:
     - Eliminar el pill de conteo repetido bajo el nombre del cliente.
     - Filtrar el badge principal por estación: `Preparación` muestra únicamente burgers (`🍔 2/3 Burgers`); `Side Quest` muestra únicamente guarniciones y bebidas (`🍟 1/2 Sides · 🥤 0/1 Bebidas`).

4. **Cola de Pedidos Ciega para la Estación**:
   - *Problema*: La cola solo indica `SIGUIENTE: Diego Armando Martínez`, sin dar visibilidad de lo que viene para esa estación en particular.
   - *Solución*: La cola filtrará sus resúmenes por estación (ej. en Side Quest: `#2 Diego A. · 🍟 2 Sides · 🥤 1 Bebida`).

---

## User Review Required

> [!IMPORTANT]
> **Jerarquía Estricta de Información en Pantalla**:
> 1. **Encabezado de Orden Activa (Nivel Cliente/Entrega)**:
>    - Nombre del cliente, Folio, Badge de ubicación (`Torre GGA`).
>    - Badge exclusivo de avance de la estación (`🍔 2/3 Burgers` o `🍟 1/2 Sides`).
>    - Bloque de `NOTA DEL PEDIDO` (Dirección, timbre, indicaciones especiales del cliente).
> 2. **Tarjetas de Armado (Nivel Cocina/Parrilla)**:
>    - Título grande y claro del platillo a preparar.
>    - Chip secundario de origen (`De combo · Combo BBQ` u `Individual`).
>    - Exclusivamente modificaciones del platillo (`MOD` / `UPGRADE` / Término).
> 3. **Cola de Pedidos (Nivel Anticipación)**:
>    - Tarjetas KDS compactas con folio, cliente, tiempo de espera y desglose sintético de la estación actual.

---

## Proposed Changes

### Componente de Cocina (`apps/internal-chekeo-v2`)

#### [MODIFY] [KitchenQueue.tsx](file:///c:/Documentos/Burgers-exe/Preview/apps/internal-chekeo-v2/src/components/kitchen/KitchenQueue.tsx)
- **Reestructurar `ItemDetailList`**:
  - Eliminar por completo el renderizado de `NOTA DEL PEDIDO` y notas generales dentro de la tarjeta del ítem.
  - Asegurar que la tarjeta de la burger solo contenga bloques de `MOD` (Sin ingrediente), `UPGRADE` (Extra) y término.
  - Estandarizar la etiqueta de origen en Side Quest (`De combo · [Nombre]` en dorado vs `Individual` en cyan).
- **Reestructurar `ActiveOrderContainer`**:
  - Colocar el bloque `NOTA DEL PEDIDO` de forma destacada en la cabecera de la orden activa.
  - Remover la llamada al `quickSummary` redundante debajo del cliente.
  - Pasar `laneMode` a `buildCategoryProgressBadge` para que en Preparación solo muestre burgers y en Side Quest solo muestre sides/bebidas.
- **Reestructurar `PendingOrdersQueue`**:
  - Pasar `laneMode` a `buildKitchenOrderQueueSummary` para anticipar los ítems relevantes de la estación en la cola.

#### [MODIFY] [kitchen-helpers.ts](file:///c:/Documentos/Burgers-exe/Preview/apps/internal-chekeo-v2/src/components/kitchen/kitchen-helpers.ts)
- **Refactorizar `getKitchenBurgerBreakdowns`**:
  - Corregir el desglose de combos para que el nombre del producto principal sea la hamburguesa a armar y no se genere el bloque interno contradictorio `BURGERS DEL COMBO: Burger OG`.
- **Refactorizar `buildCategoryProgressBadge`**:
  - Aislar el conteo por estación según `laneMode` (`prep` vs `sideQuest`).

---

## Verification Plan

### Automated Tests
- Validar sintaxis y tipos con TypeScript:
  ```powershell
  npm run typecheck
  ```
- Validar compilación de la app interna:
  ```powershell
  npm run build:internal
  ```

### Manual Verification
1. **Verificación en Preparación**:
   - Abrir un combo (ej. OG Full Loaded).
   - Confirmar que la tarjeta muestra con claridad la hamburguesa a armar sin textos contradictorios.
   - Confirmar que la nota de entrega (`Piso 10...`) aparece arriba en la orden y NO dentro de la tarjeta de la burger.
   - Confirmar que el badge superior solo muestra `🍔 X/Y Burgers`.
2. **Verificación en Side Quest**:
   - Confirmar que la tarjeta de guarniciones solo muestra modificaciones de alimento y el chip de origen.
   - Confirmar que el badge superior solo muestra `🍟 X/Y Sides` o `🥤 X/Y Bebidas`.
   - Confirmar que la cola de pedidos muestra anticipadamente los ítems de Side Quest del siguiente cliente.
