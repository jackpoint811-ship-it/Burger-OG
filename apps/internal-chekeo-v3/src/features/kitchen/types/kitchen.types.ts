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
  totalBurgersCount: number;
  totalGarnishesCount: number;
  totalDrinksCount: number;
  totalExtrasCount: number;
}

// ─── Resumen K / Agregadores de Insumos (Mise en Place) ───────────────────────

export interface AggregatedRecipeCount {
  name: string;
  sku?: string;
  totalQty: number;
  pendingQty: number;
  readyQty: number;
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

export interface AggregatedMiseEnPlace {
  totalBurgers: number;
  totalGarnishes: number;
  totalDrinks: number;
  totalExtras: number;
  activeOrdersCount: number;
  recipes: AggregatedRecipeCount[];
  garnishes: AggregatedGarnishCount[];
  drinks: AggregatedDrinkCount[];
  extras: AggregatedExtraCount[];
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
 * Transforma un pedido de orden completa en un Ticket de Cocina KDS.
 */
export function orderToKitchenTicket(order: OrderV2): KitchenTicket {
  const createdAtIso = order.createdAt || new Date().toISOString();
  const createdAtMs = new Date(createdAtIso).getTime();

  const { items, totalBurgersCount, totalGarnishesCount, totalDrinksCount, totalExtrasCount } =
    extractKitchenTicketItems(order.items || []);

  const location =
    order.orderMode === 'pickup'
      ? 'Pickup en Local'
      : order.delivery?.location?.trim() || 'A Domicilio';

  const delivery = order.delivery as Record<string, unknown> | undefined;
  const scheduledDate =
    typeof delivery?.scheduledDate === 'string'
      ? delivery.scheduledDate
      : typeof delivery?.scheduledDeliveryDate === 'string'
      ? delivery.scheduledDeliveryDate
      : undefined;
  const isScheduled = Boolean(delivery?.isScheduled || scheduledDate);

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
 * Agrega los insumos y recetas de una lista de órdenes activas para Resumen K.
 */
export function computeKitchenAggregates(tickets: KitchenTicket[]): AggregatedMiseEnPlace {
  const recipeMap = new Map<string, AggregatedRecipeCount>();
  const garnishMap = new Map<string, AggregatedGarnishCount>();
  const drinkMap = new Map<string, AggregatedDrinkCount>();
  const extraMap = new Map<string, AggregatedExtraCount>();

  let totalBurgers = 0;
  let totalGarnishes = 0;
  let totalDrinks = 0;
  let totalExtras = 0;

  tickets.forEach((ticket) => {
    const isReady = ticket.status === 'ready';

    ticket.items.forEach((item) => {
      // 1. Hamburguesas y Combos
      if (item.itemKind === 'burger' || item.itemKind === 'combo') {
        const recipeName = item.name;
        totalBurgers += item.qty;

        const currentRecipe = recipeMap.get(recipeName) ?? {
          name: recipeName,
          sku: item.sku,
          totalQty: 0,
          pendingQty: 0,
          readyQty: 0,
        };
        currentRecipe.totalQty += item.qty;
        if (isReady) {
          currentRecipe.readyQty += item.qty;
        } else {
          currentRecipe.pendingQty += item.qty;
        }
        recipeMap.set(recipeName, currentRecipe);

        // Si tiene combo burgers secundarias desglosadas
        if (item.comboBurgers?.length) {
          item.comboBurgers.forEach((cb) => {
            const cbName = cb.name;
            const currentCb = recipeMap.get(cbName) ?? {
              name: cbName,
              sku: cb.sku,
              totalQty: 0,
              pendingQty: 0,
              readyQty: 0,
              isComboChild: true,
            };
            currentCb.totalQty += item.qty;
            if (isReady) {
              currentCb.readyQty += item.qty;
            } else {
              currentCb.pendingQty += item.qty;
            }
            recipeMap.set(cbName, currentCb);
          });
        }
      }

      // 2. Guarnición de combo o individual
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

      // 3. Bebidas
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

      // 4. Extras a nivel de ítem
      if (item.extras?.length) {
        item.extras.forEach((extra) => {
          totalExtras += item.qty;
          const currentExtra = extraMap.get(extra.name) ?? {
            name: extra.name,
            sku: extra.sku,
            totalQty: 0,
          };
          currentExtra.totalQty += item.qty;
          extraMap.set(extra.name, currentExtra);
        });
      }

      // Extras dentro de comboBurgers
      if (item.comboBurgers?.length) {
        item.comboBurgers.forEach((cb) => {
          cb.extras?.forEach((extra) => {
            totalExtras += item.qty;
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

  return {
    totalBurgers,
    totalGarnishes,
    totalDrinks,
    totalExtras,
    activeOrdersCount: tickets.length,
    recipes,
    garnishes,
    drinks,
    extras,
  };
}
