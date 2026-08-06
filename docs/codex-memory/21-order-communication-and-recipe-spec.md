> Estado: vivo
> Uso: especificación de arquitectura y memoria operativa para la estandarización DTO y recetas Burgers.exe

# Especificación de Comunicación Estructurada, Pestañas Operativas y Recetas

Este documento define la arquitectura estandarizada de comunicación entre **Public Order V2** y **Internal Chekeo V2**, así como las reglas operativas para las pestañas de **Pedidos**, **Cocina** y **Pagos**, y la estandarización del catálogo de ingredientes removibles (Mods) y extras (Upgrades).

---

## 1. Comunicación por Pestaña Operativa

Cada pestaña en Chekeo V2 atiende una fase distinta del proceso operativo y consume el DTO estructurado con un enfoque específico:

### A. Pestaña `PEDIDOS` (Despacho & Control Logístico)
- **Objetivo**: Control visual rápido de la operación general, estado de las órdenes y logística de entrega.
- **Datos Prioritarios del DTO**:
  - `delivery.location`: Ubicación física (ej. `Torre GGA`, `Torre Valcob`).
  - `delivery.isScheduled` & `delivery.scheduledDate`: Badge destacado de `Hoy` vs `Programado (YYYY-MM-DD)`.
  - `status`: Estado global (`new` -> `preparing` -> `ready` -> `delivered` / `cancelled`).
  - `customerName` & `customerPhone`: Identificación rápida del cliente.
  - **Filtro Horizontal**: Agrupación automática por fecha de entrega (`scheduledDate`).

### B. Pestaña `COCINA` (Pantalla KDS / Parrilla y Armado)
- **Objetivo**: Preparación precisa de alimentos sin errores de ensamblado.
- **Datos Prioritarios del DTO**:
  - **Desglose Individual por Unidad**: Cada hamburguesa (ej. `Burger #1`, `Burger #2`) se lista con su personalización independiente.
  - **Remociones (Mods) Destacadas**: Lista `modifiers` filtrada por `type: 'remove'` (ej. `❌ Sin Pepinillos`, `❌ Sin Jitomate`) resaltada en rojo para rápida lectura del cocinero.
  - **Extras (Upgrades)**: `modifiers` filtrados por `type: 'extra'` (ej. `➕ Extra Tocino`, `➕ Extra Queso`).
  - **Sides de Combos (`components`)**: Guarnición (Papas) y Bebida (Coca-Cola) asignadas a cada combo para empaque.
  - **Notas de Cocina**: `modifiers` de tipo `note` (ej. `📝 Término 3/4`).

### C. Pestaña `PAGOS` (Caja, Tickets & WhatsApp)
- **Objetivo**: Verificación financiera, cobro, emisión de comprobantes y comunicación al cliente.
- **Datos Prioritarios del DTO**:
  - `totalCents` & `subtotalCents`: Montos exactos calculados server-side.
  - `paymentMethod`: Método de pago (`cash`, `transfer`, `card`).
  - `paymentStatus`: Estado del pago (`pending` vs `paid`).
  - **Acciones Directas**: Botón de apertura de WhatsApp con el teléfono del cliente (`customerPhone`) y copia de plantilla de cobro.
  - **Desglose Financiero**: Visualización del costo base del producto vs adicionales (upgrades).

---

## 2. Estandarización de Ingredientes por Burger (Mods Reales)

Para garantizar que el cliente solo pueda quitar ingredientes reales que pertenecen a la hamburguesa seleccionada:

### A. Burger OG (`BURGER-OG`, `COMBO-OG`)
- **Ingredientes Reales Removibles (Mods)**:
  1. `Carne smash` (Carne especial)
  2. `Tocino`
  3. `Queso americano`
  4. `Queso manchego`
  5. `Jitomate`
  6. `Lechuga`
  7. `Pepinillos`
  8. `Catsup`
  9. `Mostaza`
  10. `Mayonesa`
- *(El pan es componente fijo base y no se remueve)*.

### B. Burger BBQ (`BURGER-BBQ`, `COMBO-BBQ`)
- **Ingredientes Reales Removibles (Mods)**:
  1. `Carne smash`
  2. `Tocino`
  3. `Queso americano`
  4. `Queso manchego`
  5. `Aros de cebolla`
  6. `Pepinillos`
  7. `Salsa BBQ`

---

## 3. Estandarización de Extras y Upgrades

### A. Extras en Hamburguesa (Upgrades de Adicionales)
- `EXT-BACON`: Tocino Extra
- `EXT-CHEESE-AM`: Queso Americano Extra
- `EXT-CHEESE-MA`: Queso Manchego Extra
- `EXT-PATTY`: Carne Extra (Smash 125g)
- `EXT-SAUCE-BBQ`: Extra Salsa BBQ
- `EXT-ONION-RINGS`: Extra Aros de Cebolla en Burger

### B. Upgrades de Componentes en Combos
- `GAR-FRIES`: Papas Francesas (Guarnición estándar del combo, +$0)
- `GAR-ONION-RINGS`: Aros de Cebolla (Upgrade de guarnición en combo, +upcharge)
- `DRK-COKE`: Coca-Cola 355ml (Bebida estándar incluida)
- `DRK-COKE-ZERO`: Coca-Cola Zero 355ml (Bebida estándar incluida)
- `DRK-WATER`: Agua Ciel 600ml (Bebida estándar incluida)

---

## 4. Contrato JSON DTO Unificado

```typescript
export type OrderV2DeliveryInfo = {
  location: string;
  isScheduled: boolean;
  scheduledDate?: string;
  scheduledTime?: string;
  customerNotes?: string;
};

export type OrderItemModifier = {
  type: 'remove' | 'extra' | 'upgrade' | 'note';
  code?: string;
  name: string;
  priceCents: number;
};

export type OrderItemComponent = {
  kind: 'garnish' | 'drink' | 'side';
  sku: string;
  name: string;
  upchargeCents: number;
};

export type OrderV2Item = {
  id: string;
  lineKey: string;
  sku: string;
  name: string;
  kind: 'burger' | 'combo' | 'side' | 'drink' | 'other';
  qty: number;
  unitPriceCents: number;
  lineTotalCents: number;
  modifiers: OrderItemModifier[];
  components: OrderItemComponent[];
};

export type OrderV2 = {
  id: string;
  folio: string;
  customerName: string;
  customerPhone: string;
  delivery: OrderV2DeliveryInfo;
  orderMode: OrderV2Mode;
  paymentMethod: OrderV2PaymentMethod;
  paymentStatus: OrderV2PaymentStatus;
  notes?: string;
  subtotalCents: number;
  totalCents: number;
  status: OrderV2Status;
  source: OrderV2Source;
  createdAt: string;
  updatedAt: string;
  items: OrderV2Item[];
  events?: OrderV2Event[];
};
```
