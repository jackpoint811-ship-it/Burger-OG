/**
 * kitchen.types.ts — PR-V3-10 / Refinamiento Operativo V3
 *
 * Tipos de datos, estructuras de comandas KDS, extractores de recetas
 * y agregadores de insumos para la Cocina de Chekeo V3.
 *
 * NOTA OPERATIVA:
 * Se eliminan deliberadamente cronómetros de presión y semáforos de minutos
 * para respetar el modelo de producción por lotes y entregas programadas por torre.
 */

import type {
  OrderV2,
  OrderV2Item,
  OrderV2Status,
  OrderV2Mode,
} from '@config/index';

// ─── Estaciones y Carriles de Cocina ──────────────────────────────────────────

export type KitchenLane = 'prep' | 'sideQuest' | 'summaryK';

export type KitchenStation = 'all' | 'grill' | 'fryer';

export type KitchenKanbanStage = 'new' | 'preparing' | 'ready';

export interface KitchenTicketItem {
  id: string;
  sku: string;
  name: string;
  qty: number;
  itemKind: 'burger' | 'combo' | 'garnish' | 'drink' | 'extra' | 'other';
  removedIngredients: string[];
  extras: Array<{ sku?: string; name: string; price?: number }>;
  burgerNote?: string;
  garnish?: { sku?: string; name: string; upcharge?: number } | null;
  includedDrink?: { sku?: string; name: string } | null;
  comboBurgers?: Array<{
    sku?: string;
    name: string;
    removedIngredients: string[];
    extras: Array<{ sku?: string; name: string; price?: number }>;
    burgerNote?: string;
  }>;
}

export interface KitchenProductionUnit {
  unitKey: string;
  ticketId: string;
  itemIndex: number;
  name: string;
  sku?: string;
  itemKind: 'burger' | 'garnish' | 'drink' | 'extra';
  station: 'prep' | 'sideQuest';
  qty: number;
  isFromCombo: boolean;
  parentComboName?: string;
  removedIngredients: string[];
  extras: Array<{ sku?: string; name: string; price?: number }>;
  burgerNote?: string;
}

export interface KitchenTicket {
  id: string;
  folio: string;
  customerName: string;
  location: string;
  mode: OrderV2Mode;
  status: OrderV2Status;
  createdAtIso: string;
  createdAtMs: number;
  scheduledDate?: string;
  isScheduled?: boolean;
  orderNote?: string;
  items: KitchenTicketItem[];
  productionUnits: KitchenProductionUnit[];
  totalBurgersCount: number;
  totalGarnishesCount: number;
  totalDrinksCount: number;
  totalExtrasCount: number;
}

/**
 * Normaliza la ubicación para KDS de forma estricta:
 * Solo devuelve "Torre GGA" o "Torre Valcob" (cero departamentos, cero números, cero Pickup).
 */
export function formatKitchenLocation(locationRaw?: string): string {
  const loc = (locationRaw || '').toLowerCase();
  if (loc.includes('valcob')) return 'Torre Valcob';
  return 'Torre GGA';
}

// ─── Resumen K / Agregadores de Insumos (Mise en Place) ───────────────────────

export interface PhysicalSuppliesChecklist {
  patties: number;
  buns: number;
  cheeseSlices: number;
  baconPortions: number;
  garnishPortions: number;
  coldDrinks: number;
  dipPortions: number;
}

export interface AggregatedRecipeCount {
  name: string;
  sku?: string;
  totalQty: number;
  pendingQty: number;
  readyQty: number;
  individualQty: number;
  comboQty: number;
  pattiesCount: number;
  isComboChild?: boolean;
}

export interface AggregatedGarnishCount {
  name: string;
  sku?: string;
  totalQty: number;
  pendingQty: number;
  readyQty: number;
}

export interface AggregatedDrinkCount {
  name: string;
  sku?: string;
  totalQty: number;
  pendingQty: number;
  readyQty: number;
}

export interface AggregatedExtraCount {
  name: string;
  sku?: string;
  totalQty: number;
}

export interface AggregatedRemovedIngredient {
  name: string;
  count: number;
  affectedBurgers: string[];
}

export interface AggregatedTowerStats {
  location: string;
  totalOrders: number;
  readyOrders: number;
  pendingOrders: number;
  totalBurgers: number;
  totalGarnishes: number;
  totalDrinks: number;
}

export interface AggregatedMiseEnPlace {
  totalBurgers: number;
  totalGarnishes: number;
  totalDrinks: number;
  totalExtras: number;
  totalPatties: number;
  totalBuns: number;
  totalCheeseSlices: number;
  totalBaconPortions: number;
  suppliesChecklist: PhysicalSuppliesChecklist;
  originalRecipeCount: number;
  customizedRecipeCount: number;
  activeOrdersCount: number;
  recipes: AggregatedRecipeCount[];
  garnishes: AggregatedGarnishCount[];
  drinks: AggregatedDrinkCount[];
  extras: AggregatedExtraCount[];
  removedIngredients: AggregatedRemovedIngredient[];
  towerBreakdown: AggregatedTowerStats[];
}

// ─── Helpers de Normalización y Extracción ────────────────────────────────────

/**
 * Extrae y normaliza los ítems de un pedido para la comanda de cocina.
 */
export function extractKitchenTicketItems(rawItems: OrderV2Item[] = []): {
  items: KitchenTicketItem[];
  totalBurgersCount: number;
  totalGarnishesCount: number;
  totalDrinksCount: number;
  totalExtrasCount: number;
} {
  let totalBurgersCount = 0;
  let totalGarnishesCount = 0;
  let totalDrinksCount = 0;
  let totalExtrasCount = 0;

  const items: KitchenTicketItem[] = rawItems.map((rawItem) => {
    const snapshot = (rawItem.snapshot && typeof rawItem.snapshot === 'object' && !Array.isArray(rawItem.snapshot)
      ? rawItem.snapshot
      : {}) as Record<string, unknown>;

    const itemKindRaw = typeof snapshot.itemKind === 'string' ? snapshot.itemKind.toLowerCase() : '';
    const categoryRaw = typeof snapshot.category === 'string' ? snapshot.category.toLowerCase() : '';
    const skuLower = (rawItem.sku || '').toLowerCase();
    const nameLower = (rawItem.name || '').toLowerCase();

    let itemKind: KitchenTicketItem['itemKind'] = 'other';
    if (itemKindRaw === 'burger' || categoryRaw === 'burgers') {
      itemKind = 'burger';
      totalBurgersCount += rawItem.qty;
    } else if (itemKindRaw === 'combo' || categoryRaw === 'combos') {
      itemKind = 'combo';
      totalBurgersCount += rawItem.qty;
    } else if (itemKindRaw === 'garnish' || categoryRaw === 'guarniciones' || categoryRaw === 'sides') {
      itemKind = 'garnish';
      totalGarnishesCount += rawItem.qty;
    } else if (itemKindRaw === 'drink' || categoryRaw === 'bebidas' || categoryRaw === 'drinks') {
      itemKind = 'drink';
      totalDrinksCount += rawItem.qty;
    } else if (itemKindRaw === 'extra' || categoryRaw === 'extras' || categoryRaw === 'dips') {
      itemKind = 'extra';
      totalExtrasCount += rawItem.qty;
    } else if (skuLower.includes('combo') || nameLower.includes('combo')) {
      itemKind = 'combo';
      totalBurgersCount += rawItem.qty;
    } else if (skuLower.includes('garnish') || skuLower.includes('side') || nameLower.includes('papa') || nameLower.includes('aros')) {
      itemKind = 'garnish';
      totalGarnishesCount += rawItem.qty;
    } else if (skuLower.includes('drink') || skuLower.includes('bebida') || nameLower.includes('coca') || nameLower.includes('sprite') || nameLower.includes('boing')) {
      itemKind = 'drink';
      totalDrinksCount += rawItem.qty;
    } else if (skuLower.includes('extra') || skuLower.includes('dip') || nameLower.includes('extra') || nameLower.includes('salsa')) {
      itemKind = 'extra';
      totalExtrasCount += rawItem.qty;
    } else {
      itemKind = 'burger';
      totalBurgersCount += rawItem.qty;
    }

    // Remociones
    let removedIngredients: string[] = [];
    if (Array.isArray(snapshot.removedIngredients)) {
      removedIngredients = snapshot.removedIngredients.filter(
        (ing): ing is string => typeof ing === 'string' && Boolean(ing.trim())
      );
    } else if (Array.isArray(rawItem.modifiers)) {
      removedIngredients = rawItem.modifiers
        .filter((m) => m.type === 'remove' && Boolean(m.name?.trim()))
        .map((m) => m.name.trim());
    }

    // Extras
    let extras: Array<{ sku?: string; name: string; price?: number }> = [];
    if (Array.isArray(snapshot.extras)) {
      extras = snapshot.extras.flatMap((entry) => {
        if (!entry) return [];
        if (typeof entry === 'string' && entry.trim()) return [{ name: entry.trim() }];
        if (typeof entry === 'object') {
          const rec = entry as Record<string, unknown>;
          const name = typeof rec.name === 'string' ? rec.name.trim() : '';
          if (!name) return [];
          const sku = typeof rec.sku === 'string' ? rec.sku.trim() : undefined;
          const price = typeof rec.price === 'number' ? rec.price : undefined;
          return [{ name, ...(sku ? { sku } : {}), ...(price !== undefined ? { price } : {}) }];
        }
        return [];
      });
    } else if (Array.isArray(rawItem.modifiers)) {
      extras = rawItem.modifiers
        .filter((m) => (m.type === 'extra' || m.type === 'upgrade') && Boolean(m.name?.trim()))
        .map((m) => ({
          ...(m.code ? { sku: m.code } : {}),
          name: m.name.trim(),
          ...(typeof m.priceCents === 'number' ? { price: m.priceCents / 100 } : {}),
        }));
    }

    totalExtrasCount += extras.length * rawItem.qty;

    // Guarnición
    let garnish: { sku?: string; name: string; upcharge?: number } | null = null;
    if (snapshot.garnish && typeof snapshot.garnish === 'object') {
      const g = snapshot.garnish as Record<string, unknown>;
      const name = typeof g.name === 'string' ? g.name.trim() : '';
      if (name) {
        garnish = {
          name,
          sku: typeof g.sku === 'string' ? g.sku.trim() : undefined,
          upcharge: typeof g.upcharge === 'number' ? g.upcharge : undefined,
        };
        totalGarnishesCount += rawItem.qty;
      }
    } else if (Array.isArray(rawItem.components)) {
      const gComp = rawItem.components.find((c) => c.kind === 'garnish' || c.kind === 'side');
      if (gComp) {
        garnish = {
          name: gComp.name,
          sku: gComp.sku,
          upcharge: gComp.upchargeCents ? gComp.upchargeCents / 100 : undefined,
        };
        totalGarnishesCount += rawItem.qty;
      }
    }

    // Bebida
    let includedDrink: { sku?: string; name: string } | null = null;
    if (snapshot.includedDrink && typeof snapshot.includedDrink === 'object') {
      const d = snapshot.includedDrink as Record<string, unknown>;
      const name = typeof d.name === 'string' ? d.name.trim() : '';
      if (name) {
        includedDrink = {
          name,
          sku: typeof d.sku === 'string' ? d.sku.trim() : undefined,
        };
        totalDrinksCount += rawItem.qty;
      }
    } else if (Array.isArray(rawItem.components)) {
      const dComp = rawItem.components.find((c) => c.kind === 'drink');
      if (dComp) {
        includedDrink = {
          name: dComp.name,
          sku: dComp.sku,
        };
        totalDrinksCount += rawItem.qty;
      }
    }

    // Combo Burgers
    let comboBurgers: Array<{
      sku?: string;
      name: string;
      removedIngredients: string[];
      extras: Array<{ sku?: string; name: string; price?: number }>;
      burgerNote?: string;
    }> = [];

    if (Array.isArray(snapshot.comboBurgers)) {
      comboBurgers = snapshot.comboBurgers.flatMap((cb) => {
        if (!cb || typeof cb !== 'object') return [];
        const rec = cb as Record<string, unknown>;
        const name = typeof rec.name === 'string' ? rec.name.trim() : '';
        if (!name) return [];
        const removed = Array.isArray(rec.removedIngredients)
          ? rec.removedIngredients.filter((r): r is string => typeof r === 'string' && Boolean(r.trim()))
          : [];
        const extraList = Array.isArray(rec.extras)
          ? rec.extras.flatMap((e) => {
              if (typeof e === 'string' && e.trim()) return [{ name: e.trim() }];
              if (e && typeof e === 'object') {
                const eRec = e as Record<string, unknown>;
                const eName = typeof eRec.name === 'string' ? eRec.name.trim() : '';
                return eName ? [{ name: eName }] : [];
              }
              return [];
            })
          : [];
        const burgerNote = typeof rec.burgerNote === 'string' && rec.burgerNote.trim() ? rec.burgerNote.trim() : undefined;

        totalExtrasCount += extraList.length * rawItem.qty;

        return [{
          name,
          sku: typeof rec.sku === 'string' ? rec.sku.trim() : undefined,
          removedIngredients: removed,
          extras: extraList,
          ...(burgerNote ? { burgerNote } : {}),
        }];
      });
    }

    const burgerNote = typeof snapshot.burgerNote === 'string' && snapshot.burgerNote.trim()
      ? snapshot.burgerNote.trim()
      : undefined;

    return {
      id: rawItem.id,
      sku: rawItem.sku,
      name: rawItem.name,
      qty: rawItem.qty,
      itemKind,
      removedIngredients,
      extras,
      burgerNote,
      garnish,
      includedDrink,
      comboBurgers: comboBurgers.length ? comboBurgers : undefined,
    };
  });

  return { items, totalBurgersCount, totalGarnishesCount, totalDrinksCount, totalExtrasCount };
}

/**
 * Desglosa una comanda en unidades de producción físicas e individuales para plancha y side quest.
 */
export function extractKitchenProductionUnits(
  ticketId: string,
  items: KitchenTicketItem[]
): KitchenProductionUnit[] {
  const units: KitchenProductionUnit[] = [];
  let unitIndex = 1;

  items.forEach((item) => {
    // Si es un combo con burgers y complementos
    if (item.itemKind === 'combo') {
      const comboName = item.name;

      // 1. Hamburguesas del combo (van a Plancha / Prep)
      if (item.comboBurgers && item.comboBurgers.length > 0) {
        for (let q = 0; q < item.qty; q++) {
          item.comboBurgers.forEach((cb) => {
            units.push({
              unitKey: `${ticketId}-unit-${unitIndex}`,
              ticketId,
              itemIndex: unitIndex++,
              name: cb.name || 'Hamburguesa Combo',
              sku: cb.sku,
              itemKind: 'burger',
              station: 'prep',
              qty: 1,
              isFromCombo: true,
              parentComboName: comboName,
              removedIngredients: cb.removedIngredients || [],
              extras: cb.extras || [],
              burgerNote: cb.burgerNote,
            });
          });
        }
      } else {
        // Fallback: el combo como burger si no tiene comboBurgers explícitos
        for (let q = 0; q < item.qty; q++) {
          units.push({
            unitKey: `${ticketId}-unit-${unitIndex}`,
            ticketId,
            itemIndex: unitIndex++,
            name: item.name,
            sku: item.sku,
            itemKind: 'burger',
            station: 'prep',
            qty: 1,
            isFromCombo: true,
            parentComboName: comboName,
            removedIngredients: item.removedIngredients || [],
            extras: item.extras || [],
            burgerNote: item.burgerNote,
          });
        }
      }

      // 2. Guarnición del combo (va a Side Quest con nombre exacto)
      if (item.garnish?.name) {
        for (let q = 0; q < item.qty; q++) {
          units.push({
            unitKey: `${ticketId}-unit-${unitIndex}`,
            ticketId,
            itemIndex: unitIndex++,
            name: item.garnish.name,
            sku: item.garnish.sku,
            itemKind: 'garnish',
            station: 'sideQuest',
            qty: 1,
            isFromCombo: true,
            parentComboName: comboName,
            removedIngredients: [],
            extras: [],
          });
        }
      }

      // 3. Bebida del combo (va a Side Quest con nombre exacto)
      if (item.includedDrink?.name) {
        for (let q = 0; q < item.qty; q++) {
          units.push({
            unitKey: `${ticketId}-unit-${unitIndex}`,
            ticketId,
            itemIndex: unitIndex++,
            name: item.includedDrink.name,
            sku: item.includedDrink.sku,
            itemKind: 'drink',
            station: 'sideQuest',
            qty: 1,
            isFromCombo: true,
            parentComboName: comboName,
            removedIngredients: [],
            extras: [],
          });
        }
      }
      return;
    }

    // Si es una hamburguesa individual (Plancha / Prep)
    if (item.itemKind === 'burger') {
      for (let q = 0; q < item.qty; q++) {
        units.push({
          unitKey: `${ticketId}-unit-${unitIndex}`,
          ticketId,
          itemIndex: unitIndex++,
          name: item.name,
          sku: item.sku,
          itemKind: 'burger',
          station: 'prep',
          qty: 1,
          isFromCombo: false,
          removedIngredients: item.removedIngredients || [],
          extras: item.extras || [],
          burgerNote: item.burgerNote,
        });
      }
      return;
    }

    // Si es guarnición suelta (Side Quest)
    if (item.itemKind === 'garnish') {
      for (let q = 0; q < item.qty; q++) {
        units.push({
          unitKey: `${ticketId}-unit-${unitIndex}`,
          ticketId,
          itemIndex: unitIndex++,
          name: item.name,
          sku: item.sku,
          itemKind: 'garnish',
          station: 'sideQuest',
          qty: 1,
          isFromCombo: false,
          removedIngredients: item.removedIngredients || [],
          extras: item.extras || [],
          burgerNote: item.burgerNote,
        });
      }
      return;
    }

    // Si es bebida suelta (Side Quest)
    if (item.itemKind === 'drink') {
      for (let q = 0; q < item.qty; q++) {
        units.push({
          unitKey: `${ticketId}-unit-${unitIndex}`,
          ticketId,
          itemIndex: unitIndex++,
          name: item.name,
          sku: item.sku,
          itemKind: 'drink',
          station: 'sideQuest',
          qty: 1,
          isFromCombo: false,
          removedIngredients: item.removedIngredients || [],
          extras: item.extras || [],
          burgerNote: item.burgerNote,
        });
      }
      return;
    }

    // Otros extras o complementos (Side Quest)
    for (let q = 0; q < item.qty; q++) {
      units.push({
        unitKey: `${ticketId}-unit-${unitIndex}`,
        ticketId,
        itemIndex: unitIndex++,
        name: item.name,
        sku: item.sku,
        itemKind: 'extra',
        station: 'sideQuest',
        qty: 1,
        isFromCombo: false,
        removedIngredients: item.removedIngredients || [],
        extras: item.extras || [],
        burgerNote: item.burgerNote,
      });
    }
  });

  return units;
}

/**
 * Transforma un pedido de orden completa en un Ticket de Cocina KDS.
 */
export function orderToKitchenTicket(order: OrderV2): KitchenTicket {
  const createdAtIso = order.createdAt || new Date().toISOString();
  const createdAtMs = new Date(createdAtIso).getTime();

  const { items, totalBurgersCount, totalGarnishesCount, totalDrinksCount, totalExtrasCount } =
    extractKitchenTicketItems(order.items || []);

  const location = formatKitchenLocation(order.delivery?.location);

  const delivery = order.delivery as Record<string, unknown> | undefined;
  const scheduledDate =
    typeof delivery?.scheduledDate === 'string'
      ? delivery.scheduledDate
      : typeof delivery?.scheduledDeliveryDate === 'string'
      ? delivery.scheduledDeliveryDate
      : undefined;
  const isScheduled = Boolean(delivery?.isScheduled || scheduledDate);

  const productionUnits = extractKitchenProductionUnits(order.id, items);

  return {
    id: order.id,
    folio: order.folio,
    customerName: order.customerName?.trim() || 'Cliente',
    location,
    mode: order.orderMode,
    status: order.status,
    createdAtIso,
    createdAtMs,
    scheduledDate,
    isScheduled,
    orderNote: order.notes?.trim() || undefined,
    items,
    productionUnits,
    totalBurgersCount,
    totalGarnishesCount,
    totalDrinksCount,
    totalExtrasCount,
  };
}

/**
 * Construye una línea de resumen compacta para la comanda de cocina con emojis.
 * Ej. "🍔 3 Burgers · 🍟 2 Sides · 🥤 1 Bebida"
 */
export function buildKitchenOrderQueueSummary(
  ticket: KitchenTicket,
  laneMode?: 'prep' | 'sideQuest'
): string {
  const parts: string[] = [];

  if (laneMode === 'sideQuest') {
    if (ticket.totalGarnishesCount > 0) {
      parts.push(`🍟 ${ticket.totalGarnishesCount} Side${ticket.totalGarnishesCount !== 1 ? 's' : ''}`);
    }
    if (ticket.totalDrinksCount > 0) {
      parts.push(`🥤 ${ticket.totalDrinksCount} Bebida${ticket.totalDrinksCount !== 1 ? 's' : ''}`);
    }
  } else if (laneMode === 'prep') {
    if (ticket.totalBurgersCount > 0) {
      parts.push(`🍔 ${ticket.totalBurgersCount} Burger${ticket.totalBurgersCount !== 1 ? 's' : ''}`);
    }
  } else {
    if (ticket.totalBurgersCount > 0) {
      parts.push(`🍔 ${ticket.totalBurgersCount} Burger${ticket.totalBurgersCount !== 1 ? 's' : ''}`);
    }
    if (ticket.totalGarnishesCount > 0) {
      parts.push(`🍟 ${ticket.totalGarnishesCount} Side${ticket.totalGarnishesCount !== 1 ? 's' : ''}`);
    }
    if (ticket.totalDrinksCount > 0) {
      parts.push(`🥤 ${ticket.totalDrinksCount} Bebida${ticket.totalDrinksCount !== 1 ? 's' : ''}`);
    }
  }

  return parts.join(' · ');
}

/**
 * Estima la cantidad de carnes/patties por hamburguesa a partir de su receta o SKU.
 */
function estimatePattiesPerBurger(name: string, sku?: string): number {
  const text = `${name} ${sku || ''}`.toLowerCase();
  if (text.includes('triple')) return 3;
  if (text.includes('doble') || text.includes('double')) return 2;
  return 1;
}

/**
 * Estima la cantidad de rebanadas de queso americano por hamburguesa a partir de su receta, remociones y extras.
 */
function estimateCheeseSlicesPerBurger(
  name: string,
  sku?: string,
  removals: string[] = [],
  extras: { name: string }[] = []
): number {
  const text = `${name} ${sku || ''}`.toLowerCase();
  const withoutCheese = removals.some((r) => r.toLowerCase().includes('queso') || r.toLowerCase().includes('cheese'));
  let baseSlices = 0;
  if (!withoutCheese) {
    if (text.includes('triple')) baseSlices = 3;
    else if (text.includes('doble') || text.includes('double')) baseSlices = 2;
    else baseSlices = 1;
  }
  const extraCheese = extras.filter((e) => e.name.toLowerCase().includes('queso') || e.name.toLowerCase().includes('cheese')).length;
  return baseSlices + extraCheese;
}

/**
 * Estima la cantidad de porciones de tocino por hamburguesa a partir de su receta, remociones y extras.
 */
function estimateBaconPortionsPerBurger(
  name: string,
  sku?: string,
  removals: string[] = [],
  extras: { name: string }[] = []
): number {
  const text = `${name} ${sku || ''}`.toLowerCase();
  const withoutBacon = removals.some((r) => r.toLowerCase().includes('tocino') || r.toLowerCase().includes('bacon'));
  let baseBacon = 0;
  if (!withoutBacon) {
    if (text.includes('tocino') || text.includes('bacon') || text.includes('og')) {
      baseBacon = 1;
    }
  }
  const extraBacon = extras.filter((e) => e.name.toLowerCase().includes('tocino') || e.name.toLowerCase().includes('bacon')).length;
  return baseBacon + extraBacon;
}

interface RemovedDetailAccumulator {
  count: number;
  burgerCounts: Map<string, number>;
}

/**
 * Agrega los insumos y recetas de una lista de órdenes activas para Resumen K.
 * Implementa el Principio de Unificación Canónica V3 (sin duplicidad de combos)
 * y la Calculadora de Insumos Físicos de Arranque & Control de Restock Diario.
 */
export function computeKitchenAggregates(tickets: KitchenTicket[]): AggregatedMiseEnPlace {
  const recipeMap = new Map<string, AggregatedRecipeCount>();
  const garnishMap = new Map<string, AggregatedGarnishCount>();
  const drinkMap = new Map<string, AggregatedDrinkCount>();
  const extraMap = new Map<string, AggregatedExtraCount>();
  const removedDetailMap = new Map<string, RemovedDetailAccumulator>();

  let totalBurgers = 0;
  let totalGarnishes = 0;
  let totalDrinks = 0;
  let totalExtras = 0;
  let totalPatties = 0;
  let totalBuns = 0;
  let totalCheeseSlices = 0;
  let totalBaconPortions = 0;
  let totalDipPortions = 0;
  let originalRecipeCount = 0;
  let customizedRecipeCount = 0;

  // Inicializar desglose por torres conocidas
  const towerMap = new Map<string, AggregatedTowerStats>();
  ['Torre GGA', 'Torre Valcob'].forEach((loc) => {
    towerMap.set(loc, {
      location: loc,
      totalOrders: 0,
      readyOrders: 0,
      pendingOrders: 0,
      totalBurgers: 0,
      totalGarnishes: 0,
      totalDrinks: 0,
    });
  });

  tickets.forEach((ticket) => {
    const isReady = ticket.status === 'ready';
    const loc = formatKitchenLocation(ticket.location);

    // Actualizar estadísticas de torre
    const currentTower = towerMap.get(loc) ?? {
      location: loc,
      totalOrders: 0,
      readyOrders: 0,
      pendingOrders: 0,
      totalBurgers: 0,
      totalGarnishes: 0,
      totalDrinks: 0,
    };
    currentTower.totalOrders += 1;
    if (isReady) {
      currentTower.readyOrders += 1;
    } else {
      currentTower.pendingOrders += 1;
    }
    currentTower.totalBurgers += ticket.totalBurgersCount;
    currentTower.totalGarnishes += ticket.totalGarnishesCount;
    currentTower.totalDrinks += ticket.totalDrinksCount;
    towerMap.set(loc, currentTower);

    ticket.items.forEach((item) => {
      // 1. Hamburguesas y Combos (Unificación Canónica por Receta Real)
      if (item.itemKind === 'burger' || item.itemKind === 'combo') {
        if (item.comboBurgers && item.comboBurgers.length > 0) {
          item.comboBurgers.forEach((cb) => {
            const burgerName = cb.name || 'Hamburguesa';
            const pattiesPerUnit = estimatePattiesPerBurger(burgerName, cb.sku);
            const cheesePerUnit = estimateCheeseSlicesPerBurger(
              burgerName,
              cb.sku,
              cb.removedIngredients || [],
              cb.extras || []
            );
            const baconPerUnit = estimateBaconPortionsPerBurger(
              burgerName,
              cb.sku,
              cb.removedIngredients || [],
              cb.extras || []
            );

            totalBurgers += item.qty;
            totalBuns += item.qty;
            totalPatties += item.qty * pattiesPerUnit;
            totalCheeseSlices += item.qty * cheesePerUnit;
            totalBaconPortions += item.qty * baconPerUnit;

            const current = recipeMap.get(burgerName) ?? {
              name: burgerName,
              sku: cb.sku,
              totalQty: 0,
              pendingQty: 0,
              readyQty: 0,
              individualQty: 0,
              comboQty: 0,
              pattiesCount: pattiesPerUnit,
            };
            current.totalQty += item.qty;
            current.comboQty += item.qty;
            if (isReady) {
              current.readyQty += item.qty;
            } else {
              current.pendingQty += item.qty;
            }
            recipeMap.set(burgerName, current);

            // Registro de modificaciones
            const hasRemovals = cb.removedIngredients && cb.removedIngredients.length > 0;
            const hasExtras = cb.extras && cb.extras.length > 0;
            const hasNote = Boolean(cb.burgerNote?.trim());
            if (!hasRemovals && !hasExtras && !hasNote) {
              originalRecipeCount += item.qty;
            } else {
              customizedRecipeCount += item.qty;
            }

            if (hasRemovals) {
              cb.removedIngredients.forEach((rem) => {
                const remKey = rem.trim();
                if (remKey) {
                  const detail = removedDetailMap.get(remKey) ?? { count: 0, burgerCounts: new Map<string, number>() };
                  detail.count += item.qty;
                  detail.burgerCounts.set(burgerName, (detail.burgerCounts.get(burgerName) ?? 0) + item.qty);
                  removedDetailMap.set(remKey, detail);
                }
              });
            }
          });
        } else {
          // Hamburguesa individual o combo sin desglose específico
          let burgerName = item.name;
          const isCombo = item.itemKind === 'combo';
          if (isCombo && burgerName.toLowerCase().startsWith('combo ')) {
            burgerName = burgerName.slice(6).trim();
          }
          const pattiesPerUnit = estimatePattiesPerBurger(burgerName, item.sku);
          const cheesePerUnit = estimateCheeseSlicesPerBurger(
            burgerName,
            item.sku,
            item.removedIngredients || [],
            item.extras || []
          );
          const baconPerUnit = estimateBaconPortionsPerBurger(
            burgerName,
            item.sku,
            item.removedIngredients || [],
            item.extras || []
          );

          totalBurgers += item.qty;
          totalBuns += item.qty;
          totalPatties += item.qty * pattiesPerUnit;
          totalCheeseSlices += item.qty * cheesePerUnit;
          totalBaconPortions += item.qty * baconPerUnit;

          const current = recipeMap.get(burgerName) ?? {
            name: burgerName,
            sku: item.sku,
            totalQty: 0,
            pendingQty: 0,
            readyQty: 0,
            individualQty: 0,
            comboQty: 0,
            pattiesCount: pattiesPerUnit,
          };
          current.totalQty += item.qty;
          if (isCombo) {
            current.comboQty += item.qty;
          } else {
            current.individualQty += item.qty;
          }
          if (isReady) {
            current.readyQty += item.qty;
          } else {
            current.pendingQty += item.qty;
          }
          recipeMap.set(burgerName, current);

          // Registro de modificaciones
          const hasRemovals = item.removedIngredients && item.removedIngredients.length > 0;
          const hasExtras = item.extras && item.extras.length > 0;
          const hasNote = Boolean(item.burgerNote?.trim());
          if (!hasRemovals && !hasExtras && !hasNote) {
            originalRecipeCount += item.qty;
          } else {
            customizedRecipeCount += item.qty;
          }

          if (hasRemovals) {
            item.removedIngredients.forEach((rem) => {
              const remKey = rem.trim();
              if (remKey) {
                const detail = removedDetailMap.get(remKey) ?? { count: 0, burgerCounts: new Map<string, number>() };
                detail.count += item.qty;
                detail.burgerCounts.set(burgerName, (detail.burgerCounts.get(burgerName) ?? 0) + item.qty);
                removedDetailMap.set(remKey, detail);
              }
            });
          }
        }
      }

      // 2. Guarniciones (de combo o individuales consolidadas)
      if (item.garnish?.name) {
        const gName = item.garnish.name;
        totalGarnishes += item.qty;

        const currentGarnish = garnishMap.get(gName) ?? {
          name: gName,
          sku: item.garnish.sku,
          totalQty: 0,
          pendingQty: 0,
          readyQty: 0,
        };
        currentGarnish.totalQty += item.qty;
        if (isReady) {
          currentGarnish.readyQty += item.qty;
        } else {
          currentGarnish.pendingQty += item.qty;
        }
        garnishMap.set(gName, currentGarnish);
      } else if (item.itemKind === 'garnish') {
        const gName = item.name;
        totalGarnishes += item.qty;

        const currentGarnish = garnishMap.get(gName) ?? {
          name: gName,
          sku: item.sku,
          totalQty: 0,
          pendingQty: 0,
          readyQty: 0,
        };
        currentGarnish.totalQty += item.qty;
        if (isReady) {
          currentGarnish.readyQty += item.qty;
        } else {
          currentGarnish.pendingQty += item.qty;
        }
        garnishMap.set(gName, currentGarnish);
      }

      // 3. Bebidas (de combo o individuales consolidadas)
      if (item.includedDrink?.name) {
        const dName = item.includedDrink.name;
        totalDrinks += item.qty;

        const currentDrink = drinkMap.get(dName) ?? {
          name: dName,
          sku: item.includedDrink.sku,
          totalQty: 0,
          pendingQty: 0,
          readyQty: 0,
        };
        currentDrink.totalQty += item.qty;
        if (isReady) {
          currentDrink.readyQty += item.qty;
        } else {
          currentDrink.pendingQty += item.qty;
        }
        drinkMap.set(dName, currentDrink);
      } else if (item.itemKind === 'drink') {
        const dName = item.name;
        totalDrinks += item.qty;

        const currentDrink = drinkMap.get(dName) ?? {
          name: dName,
          sku: item.sku,
          totalQty: 0,
          pendingQty: 0,
          readyQty: 0,
        };
        currentDrink.totalQty += item.qty;
        if (isReady) {
          currentDrink.readyQty += item.qty;
        } else {
          currentDrink.pendingQty += item.qty;
        }
        drinkMap.set(dName, currentDrink);
      }

      // 4. Extras y Dips
      if (item.extras?.length) {
        item.extras.forEach((extra) => {
          totalExtras += item.qty;
          const eLower = extra.name.toLowerCase();
          if (eLower.includes('dip') || eLower.includes('salsa') || eLower.includes('ranch') || eLower.includes('bbq') || eLower.includes('aderezo')) {
            totalDipPortions += item.qty;
          }
          const currentExtra = extraMap.get(extra.name) ?? {
            name: extra.name,
            sku: extra.sku,
            totalQty: 0,
          };
          currentExtra.totalQty += item.qty;
          extraMap.set(extra.name, currentExtra);
        });
      }

      if (item.comboBurgers?.length) {
        item.comboBurgers.forEach((cb) => {
          cb.extras?.forEach((extra) => {
            totalExtras += item.qty;
            const eLower = extra.name.toLowerCase();
            if (eLower.includes('dip') || eLower.includes('salsa') || eLower.includes('ranch') || eLower.includes('bbq') || eLower.includes('aderezo')) {
              totalDipPortions += item.qty;
            }
            const currentExtra = extraMap.get(extra.name) ?? {
              name: extra.name,
              sku: extra.sku,
              totalQty: 0,
            };
            currentExtra.totalQty += item.qty;
            extraMap.set(extra.name, currentExtra);
          });
        });
      }

      if (item.itemKind === 'extra') {
        const eLower = item.name.toLowerCase();
        if (eLower.includes('dip') || eLower.includes('salsa') || eLower.includes('ranch') || eLower.includes('bbq') || eLower.includes('aderezo')) {
          totalDipPortions += item.qty;
        }
      }
    });
  });

  const recipes = Array.from(recipeMap.values()).sort(
    (a, b) => b.totalQty - a.totalQty || a.name.localeCompare(b.name)
  );
  const garnishes = Array.from(garnishMap.values()).sort(
    (a, b) => b.totalQty - a.totalQty || a.name.localeCompare(b.name)
  );
  const drinks = Array.from(drinkMap.values()).sort(
    (a, b) => b.totalQty - a.totalQty || a.name.localeCompare(b.name)
  );
  const extras = Array.from(extraMap.values()).sort(
    (a, b) => b.totalQty - a.totalQty || a.name.localeCompare(b.name)
  );

  const removedIngredients: AggregatedRemovedIngredient[] = Array.from(removedDetailMap.entries())
    .map(([name, detail]) => {
      const affectedBurgers = Array.from(detail.burgerCounts.entries()).map(
        ([bName, bQty]) => `${bQty}x ${bName}`
      );
      return {
        name,
        count: detail.count,
        affectedBurgers,
      };
    })
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));

  const towerBreakdown = Array.from(towerMap.values()).sort((a, b) =>
    a.location.localeCompare(b.location)
  );

  const suppliesChecklist: PhysicalSuppliesChecklist = {
    patties: totalPatties,
    buns: totalBuns,
    cheeseSlices: totalCheeseSlices,
    baconPortions: totalBaconPortions,
    garnishPortions: totalGarnishes,
    coldDrinks: totalDrinks,
    dipPortions: totalDipPortions,
  };

  return {
    totalBurgers,
    totalGarnishes,
    totalDrinks,
    totalExtras,
    totalPatties,
    totalBuns,
    totalCheeseSlices,
    totalBaconPortions,
    suppliesChecklist,
    originalRecipeCount,
    customizedRecipeCount,
    activeOrdersCount: tickets.length,
    recipes,
    garnishes,
    drinks,
    extras,
    removedIngredients,
    towerBreakdown,
  };
}
