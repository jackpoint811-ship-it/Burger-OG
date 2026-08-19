/**
 * kitchen.types.ts — PR-V3-10
 *
 * Tipos de datos, estructuras de comandas KDS, extractores de recetas
 * y agregadores de insumos para la Cocina de Chekeo V3.
 */

import type {
  OrderV2,
  OrderV2Item,
  OrderV2Status,
  OrderV2Mode,
  OrderV2Environment,
  OrderV2DeliveryInfo,
} from '@config/index';

// ─── Estados y Estaciones KDS ──────────────────────────────────────────────────

export type KitchenKanbanStage = 'new' | 'preparing' | 'ready';

export type KitchenStation = 'all' | 'grill' | 'fryer';

export type KitchenAlertTone = 'normal' | 'warning' | 'urgent';

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
  elapsedMinutes: number;
  alertTone: KitchenAlertTone;
  orderNote?: string;
  items: KitchenTicketItem[];
  totalBurgersCount: number;
  totalGarnishesCount: number;
  totalExtrasCount: number;
}

// ─── Resumen K / Agregadores de Insumos ────────────────────────────────────────

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

export interface AggregatedExtraCount {
  name: string;
  sku?: string;
  totalQty: number;
}

export interface AggregatedMiseEnPlace {
  totalBurgers: number;
  totalGarnishes: number;
  totalExtras: number;
  activeOrdersCount: number;
  recipes: AggregatedRecipeCount[];
  garnishes: AggregatedGarnishCount[];
  extras: AggregatedExtraCount[];
}

// ─── Helpers de Normalización y Tiempos ───────────────────────────────────────

/**
 * Determina el tono de alerta del temporizador de cocina:
 * - < 10 minutos: normal (verde)
 * - 10 a 20 minutos: warning (ámbar)
 * - > 20 minutos: urgent (rojo con pulso)
 */
export function calculateAlertTone(elapsedMinutes: number): KitchenAlertTone {
  if (elapsedMinutes >= 20) return 'urgent';
  if (elapsedMinutes >= 10) return 'warning';
  return 'normal';
}

/**
 * Calcula los minutos transcurridos desde la creación del pedido.
 */
export function calculateElapsedMinutes(createdAtIso?: string, createdAtMs?: number): number {
  const timestamp = createdAtMs || (createdAtIso ? new Date(createdAtIso).getTime() : Date.now());
  if (isNaN(timestamp)) return 0;
  const diffMs = Math.max(0, Date.now() - timestamp);
  return Math.floor(diffMs / 60000);
}

/**
 * Formatea los minutos en formato mm:ss o minutos totales legibles.
 */
export function formatElapsedTime(elapsedMinutes: number): string {
  if (elapsedMinutes < 60) {
    return `${elapsedMinutes}m`;
  }
  const hours = Math.floor(elapsedMinutes / 60);
  const remainingMins = elapsedMinutes % 60;
  return `${hours}h ${remainingMins}m`;
}

/**
 * Extrae y normaliza los ítems de un pedido para la comanda de cocina.
 */
export function extractKitchenTicketItems(rawItems: OrderV2Item[] = []): {
  items: KitchenTicketItem[];
  totalBurgersCount: number;
  totalGarnishesCount: number;
  totalExtrasCount: number;
} {
  let totalBurgersCount = 0;
  let totalGarnishesCount = 0;
  let totalExtrasCount = 0;

  const items: KitchenTicketItem[] = rawItems.map((rawItem) => {
    const snapshot = (rawItem.snapshot && typeof rawItem.snapshot === 'object' && !Array.isArray(rawItem.snapshot)
      ? rawItem.snapshot
      : {}) as Record<string, unknown>;

    const itemKindRaw = typeof snapshot.itemKind === 'string' ? snapshot.itemKind.toLowerCase() : '';
    const categoryRaw = typeof snapshot.category === 'string' ? snapshot.category.toLowerCase() : '';

    let itemKind: KitchenTicketItem['itemKind'] = 'other';
    if (itemKindRaw === 'burger' || categoryRaw === 'burgers') {
      itemKind = 'burger';
      totalBurgersCount += rawItem.qty;
    } else if (itemKindRaw === 'combo' || categoryRaw === 'combos') {
      itemKind = 'combo';
      totalBurgersCount += rawItem.qty;
    } else if (itemKindRaw === 'garnish' || categoryRaw === 'guarniciones') {
      itemKind = 'garnish';
      totalGarnishesCount += rawItem.qty;
    } else if (itemKindRaw === 'drink' || categoryRaw === 'bebidas') {
      itemKind = 'drink';
    } else if (itemKindRaw === 'extra' || categoryRaw === 'extras') {
      itemKind = 'extra';
      totalExtrasCount += rawItem.qty;
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
      }
    } else if (Array.isArray(rawItem.components)) {
      const dComp = rawItem.components.find((c) => c.kind === 'drink');
      if (dComp) {
        includedDrink = {
          name: dComp.name,
          sku: dComp.sku,
        };
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

  return { items, totalBurgersCount, totalGarnishesCount, totalExtrasCount };
}

/**
 * Transforma un pedido de orden completa en un Ticket de Cocina KDS.
 */
export function orderToKitchenTicket(order: OrderV2): KitchenTicket {
  const createdAtIso = order.createdAt || new Date().toISOString();
  const createdAtMs = new Date(createdAtIso).getTime();
  const elapsedMinutes = calculateElapsedMinutes(createdAtIso, createdAtMs);
  const alertTone = calculateAlertTone(elapsedMinutes);

  const { items, totalBurgersCount, totalGarnishesCount, totalExtrasCount } =
    extractKitchenTicketItems(order.items || []);

  const location =
    order.orderMode === 'pickup'
      ? 'Pickup en Local'
      : order.delivery?.location?.trim() || 'A Domicilio';

  return {
    id: order.id,
    folio: order.folio,
    customerName: order.customerName?.trim() || 'Cliente',
    location,
    mode: order.orderMode,
    status: order.status,
    createdAtIso,
    createdAtMs,
    elapsedMinutes,
    alertTone,
    orderNote: order.notes?.trim() || undefined,
    items,
    totalBurgersCount,
    totalGarnishesCount,
    totalExtrasCount,
  };
}

/**
 * Agrega los insumos y recetas de una lista de órdenes activas para Resumen K.
 */
export function computeKitchenAggregates(tickets: KitchenTicket[]): AggregatedMiseEnPlace {
  const recipeMap = new Map<string, AggregatedRecipeCount>();
  const garnishMap = new Map<string, AggregatedGarnishCount>();
  const extraMap = new Map<string, AggregatedExtraCount>();

  let totalBurgers = 0;
  let totalGarnishes = 0;
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

      // 3. Extras a nivel de ítem
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
  const extras = Array.from(extraMap.values()).sort(
    (a, b) => b.totalQty - a.totalQty || a.name.localeCompare(b.name)
  );

  return {
    totalBurgers,
    totalGarnishes,
    totalExtras,
    activeOrdersCount: tickets.length,
    recipes,
    garnishes,
    extras,
  };
}
