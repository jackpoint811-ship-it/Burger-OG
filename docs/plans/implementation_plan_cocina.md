# Plan de Afinación para la Pestaña de Cocina (Kitchen View V2)

Este plan tiene como objetivo afinar visual y operacionalmente las pestañas de **Preparación** y **Side Quest** en **Internal Chekeo V2**, dejándolas estandarizadas y listas para producción. *(Nota: La pestaña **Resumen K** se mantendrá tal cual está al ser un componente desacoplado).*

---

## Diagnóstico y Hallazgos Actuales

### 1. Pestaña de Preparación y Side Quest
- **Badges Duplicados de Conteo**:
  - En la orden activa se muestran dos tiras de conteo superpuestas: el badge desglosado (`🍔 0/1 Burgers · 🍟 0/1 Side`) en el encabezado superior del pedido activo, y un segundo pill redundante (`🍔 1 Burger · 🍟 1 Side`) debajo del nombre del cliente.
- **Sección de Notas Duplicada**:
  - La nota del pedido (ej. *"Recepción Piso 2"*) y las notas por ítem se repiten en cada bloque individual expandido. Esto satura visualmente cuando una orden tiene múltiples hamburguesas o guarniciones.
- **Estandarización de Side Quest (Guarniciones/Bebidas)**:
  - En la pestaña **Side Quest**, las guarniciones (papas, aros de cebolla) y bebidas provienen de dos fuentes distintas:
    1. **Guarnición/Bebida de combo** (ej. *"De combo Combo BBQ"*).
    2. **Guarnición/Bebida individual**.
  - Actualmente, la etiqueta *"De combo Combo BBQ"* se renderiza como una caja flotante dentro del ítem sin estandarizar el diseño frente a un ítem individual.

### 2. Cola de Pedidos
- Los elementos en la cola (`SIGUIENTE`, `DESPUÉS`) utilizan bloques grises pesados con opacidad decreciente.
- Falta un diseño KDS compacto que permita al cocinero ver de un vistazo qué viene después (ej: `Diego Armando Martínez · 🍔 3 Burgers · 🍟 2 Sides`) y poder tocar cualquier pedido para activarlo inmediatamente.

---

## Recomendaciones para Salto a Producción

> [!IMPORTANT]
> **Estandarización entre Preparación y Side Quest**: Ambas pestañas compartirán el mismo estándar de diseño, jerarquía de notas y tarjetas de cola, garantizando 0% de comportamiento roto o inconsistente.

### A. Conteo Unificado y Limpio
- **Un solo Badge Principal**: Mantener únicamente el badge consolidado de progreso en la esquina superior derecha del pedido activo (ej. `🍔 0/1 Burgers` en Preparación, `🍟 0/1 Sides · 🥤 0/1 Bebidas` en Side Quest).
- **Eliminar Pills Redundantes**: Retirar la etiqueta repetida de abajo del nombre del cliente (`🍔 1 Burger · 🍟 1 Side`).

### B. Sección Única de "Nota del Pedido" a Nivel de Orden
- **Ubicación a Nivel de Cabecera de Orden**: Mover la `NOTA DEL PEDIDO` (indicaciones de entrega, timbre, cliente) a un contenedor destacado **una sola vez en la tarjeta principal del pedido activo**, justo debajo de la ubicación de entrega.
- **Ítems Limpios**: Las tarjetas individuales de hamburguesas o guarniciones solo contendrán sus personalizaciones específicas:
  - En **Burgers**: `MOD` (Sin ingrediente), `UPGRADE` (Extras) y término de la carne.
  - En **Side Quest**: Badge estandarizado de origen (`De combo: Combo BBQ` vs. `Pedido Individual`).

### C. Estandarización Visual de Side Quest
- **Badge de Origen Claro**:
  - Para ítems pertenecientes a combo: Chip distintivo con acento ámbar/dorado `De combo · Combo BBQ`.
  - Para ítems individuales: Chip neutro/azul de baja saturación `Individual`.
- **Preservación de Sub-ítems**: Mantener el desglose individual por cada guarnición y bebida pertenecientes a un combo sin alterar los contratos de datos existentes.

### D. Rediseño KDS de la Cola de Pedidos
- **Tarjetas Compactas e Interactivas**: Tarjetas con bordes definidos, cliente, folio y desglose sintético (ej. `🍔 3 · 🍟 2`).
- **Cambio Activo Instantáneo**: Cualquier pedido en la cola se puede tocar para convertirlo en el "Pedido Activo" de forma inmediata en la estación.

---

## User Review Required

> [!NOTE]
> **Consistencia en Preparación y Side Quest**: Al consolidar la `NOTA DEL PEDIDO` en la cabecera de la tarjeta del pedido activo, el diseño será 100% idéntico en estructura tanto en la pestaña de **Preparación** como en la de **Side Quest**.

---

## Proposed Changes

### Componente de Vista de Cocina (`apps/internal-chekeo-v2`)

#### [MODIFY] [KitchenQueue.tsx](file:///c:/Documentos/Burgers-exe/Preview/apps/internal-chekeo-v2/src/components/kitchen/KitchenQueue.tsx)
- Mover el renderizado de `NOTA DEL PEDIDO` a `ActiveOrderContainer` (cabecera del pedido activo).
- Remover los badges de pill duplicados debajo del nombre del cliente en `ActiveOrderContainer`.
- En `ItemDetailList`, actualizar la rendering de Side Quest para usar chips de origen estandarizados (`De combo: [Nombre]` vs `Individual`) y eliminar la concatenación repetida de la nota del pedido.
- Rediseñar `PendingOrdersQueue` con tarjetas KDS compactas, desgloses sintéticos por categoría y selector de orden activa.

#### [MODIFY] [kitchen-helpers.ts](file:///c:/Documentos/Burgers-exe/Preview/apps/internal-chekeo-v2/src/components/kitchen/kitchen-helpers.ts)
- Refactorizar las utilidades de formateo de notas y etiquetas para garantizar que no haya texto duplicado entre la orden y el ítem.
- Estandarizar la detección de origen para ítems de Side Quest (`De combo [Nombre]` vs `Individual`).

---

## Verification Plan

### Automated Tests
- Validación de compilación y verificación de tipos:
  ```powershell
  npm run typecheck
  npm run build:public
  ```

### Manual Verification
1. **Pestaña Preparación**:
   - Verificar que en el pedido activo solo haya 1 badge de progreso.
   - Confirmar que la nota del pedido aparece 1 sola vez arriba de la lista de ítems.
2. **Pestaña Side Quest**:
   - Confirmar que las guarniciones de combo muestran el chip `De combo · [Nombre del Combo]` y las sueltas muestran `Individual`.
   - Confirmar que no se duplica la nota del pedido en cada guarnición.
3. **Cola de Pedidos**:
   - Probar cambiar la orden activa desde la cola en ambas pestañas.
