/**
 * orders.types.ts — PR-V3-09
 *
 * Tipos de datos, normalizadores de ítems de comanda y utilidades de formato
 * para el módulo de Pedidos de Chekeo V3.
 */

import type {
  OrderV2,
  OrderV2Item,
  OrderV2Event,
  OrderV2Status,
  OrderV2Mode,
  OrderV2PaymentMethod,
  OrderV2PaymentStatus,
  OrderV2Environment,
  OrderV2DeliveryInfo,
} from '@config/index';
import { getCdmxTodayString, formatCdmxDateString } from '@config/index';

export interface NormalizedExtra {
  sku?: string;
  name: string;
  price?: number;
  itemKind?: 'garnish' | 'drink' | 'extra';
}

export interface NormalizedComboBurger {
  sku?: string;
  name: string;
  removedIngredients: string[];
  extras: NormalizedExtra[];
  burgerNote?: string;
}

export interface NormalizedOrderItem {
  id: string;
  sku: string;
  name: string;
  qty: number;
  unitPrice: number;
  lineTotal: number;
  itemKind?: string;
  removedIngredients: string[];
  extras: NormalizedExtra[];
  burgerNote?: string;
  garnish?: { sku?: string; name: string; upcharge?: number } | null;
  includedDrink?: { sku?: string; name: string } | null;
  comboBurgers?: NormalizedComboBurger[];
  sideQuestExtras?: NormalizedExtra[];
}

export interface OrderStatusConfig {
  label: string;
  shortLabel: string;
  variant: 'default' | 'secondary' | 'outline' | 'destructive' | 'success' | 'warning';
  badgeClass: string;
  nextStatus: OrderV2Status | null;
  nextActionLabel: string | null;
  iconName: 'clock' | 'flame' | 'check' | 'package-check' | 'ban';
}

export interface OrderCounts {
  all: number;
  new: number;
  preparing: number;
  ready: number;
  delivered: number;
  cancelled: number;
  archived: number;
}

// ─── Normalizadores de Ítems ──────────────────────────────────────────────────

const parseSnapshotRecord = (value: unknown): Record<string, unknown> => {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return {};
};

const parseSnapshotExtras = (value: unknown): NormalizedExtra[] => {
  if (!Array.isArray(value)) return [];
  return value.flatMap((entry) => {
    if (!entry) return [];
    if (typeof entry === 'string' && entry.trim()) {
      return [{ name: entry.trim() }];
    }
    if (typeof entry === 'object' && !Array.isArray(entry)) {
      const record = entry as Record<string, unknown>;
      const name = typeof record.name === 'string' && record.name.trim() ? record.name.trim() : '';
      if (!name) return [];
      const sku = typeof record.sku === 'string' && record.sku.trim() ? record.sku.trim() : undefined;
      const price = typeof record.price === 'number' && Number.isFinite(record.price) ? record.price : undefined;
      const itemKind =
        record.itemKind === 'garnish' || record.itemKind === 'drink' ? record.itemKind : undefined;
      return [{ name, ...(sku ? { sku } : {}), ...(price !== undefined ? { price } : {}), ...(itemKind ? { itemKind } : {}) }];
    }
    return [];
  });
};

const parseSnapshotGarnish = (
  value: unknown
): { sku?: string; name: string; upcharge?: number } | null => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const record = value as Record<string, unknown>;
  const name = typeof record.name === 'string' && record.name.trim() ? record.name.trim() : '';
  if (!name) return null;
  const sku = typeof record.sku === 'string' && record.sku.trim() ? record.sku.trim() : undefined;
  const upcharge =
    typeof record.upcharge === 'number' && Number.isFinite(record.upcharge)
      ? record.upcharge
      : undefined;
  return { name, ...(sku ? { sku } : {}), ...(upcharge !== undefined ? { upcharge } : {}) };
};

const parseSnapshotIncludedDrink = (
  value: unknown
): { sku?: string; name: string } | null => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const record = value as Record<string, unknown>;
  const name = typeof record.name === 'string' && record.name.trim() ? record.name.trim() : '';
  if (!name) return null;
  const sku = typeof record.sku === 'string' && record.sku.trim() ? record.sku.trim() : undefined;
  return { name, ...(sku ? { sku } : {}) };
};

const parseSnapshotComboBurgers = (value: unknown): NormalizedComboBurger[] => {
  if (!Array.isArray(value)) return [];
  return value.flatMap((entry) => {
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) return [];
    const record = entry as Record<string, unknown>;
    const name = typeof record.name === 'string' && record.name.trim() ? record.name.trim() : '';
    if (!name) return [];
    const sku = typeof record.sku === 'string' && record.sku.trim() ? record.sku.trim() : undefined;
    const removedIngredients = Array.isArray(record.removedIngredients)
      ? record.removedIngredients.filter(
          (ing): ing is string => typeof ing === 'string' && Boolean(ing.trim())
        )
      : [];
    const extras = parseSnapshotExtras(record.extras);
    const burgerNote =
      typeof record.burgerNote === 'string' && record.burgerNote.trim()
        ? record.burgerNote.trim()
        : undefined;

    return [{ name, ...(sku ? { sku } : {}), removedIngredients, extras, ...(burgerNote ? { burgerNote } : {}) }];
  });
};

export function normalizeOrderItem(item: OrderV2Item): NormalizedOrderItem {
  const snapshot = parseSnapshotRecord(item.snapshot);
  const itemKind = typeof snapshot.itemKind === 'string' ? snapshot.itemKind : undefined;

  let removedIngredients: string[] = Array.isArray(snapshot.removedIngredients)
    ? snapshot.removedIngredients.filter(
        (entry): entry is string => typeof entry === 'string' && Boolean(entry.trim())
      )
    : [];

  if (removedIngredients.length === 0 && Array.isArray(item.modifiers)) {
    removedIngredients = item.modifiers
      .filter((m) => m.type === 'remove' && Boolean(m.name?.trim()))
      .map((m) => m.name.trim());
  }

  let extras = parseSnapshotExtras(snapshot.extras);
  if (extras.length === 0 && Array.isArray(item.modifiers)) {
    extras = item.modifiers
      .filter((m) => (m.type === 'extra' || m.type === 'upgrade') && Boolean(m.name?.trim()))
      .map((m) => ({
        ...(m.code ? { sku: m.code } : {}),
        name: m.name.trim(),
        ...(typeof m.priceCents === 'number' ? { price: m.priceCents / 100 } : {}),
      }));
  }

  let garnish = parseSnapshotGarnish(snapshot.garnish);
  let includedDrink = parseSnapshotIncludedDrink(snapshot.includedDrink);

  if (!garnish && Array.isArray(item.components)) {
    const garnishComp = item.components.find((c) => c.kind === 'garnish' || c.kind === 'side');
    if (garnishComp) {
      garnish = {
        sku: garnishComp.sku,
        name: garnishComp.name,
        ...(garnishComp.upchargeCents ? { upcharge: garnishComp.upchargeCents / 100 } : {}),
      };
    }
  }

  if (!includedDrink && Array.isArray(item.components)) {
    const drinkComp = item.components.find((c) => c.kind === 'drink');
    if (drinkComp) {
      includedDrink = {
        sku: drinkComp.sku,
        name: drinkComp.name,
      };
    }
  }

  const burgerNote =
    typeof snapshot.burgerNote === 'string' && snapshot.burgerNote.trim()
      ? snapshot.burgerNote.trim()
      : undefined;

  const comboBurgers = parseSnapshotComboBurgers(snapshot.comboBurgers);
  const sideQuestExtras = parseSnapshotExtras(snapshot.sideQuestExtras);

  return {
    id: item.id,
    sku: item.sku,
    name: item.name,
    qty: item.qty,
    unitPrice: item.unitPrice,
    lineTotal: item.lineTotal,
    itemKind,
    removedIngredients,
    extras,
    burgerNote,
    garnish,
    includedDrink,
    comboBurgers,
    sideQuestExtras,
  };
}

export function normalizeOrderItems(items: OrderV2Item[] = []): NormalizedOrderItem[] {
  return items.map(normalizeOrderItem);
}

// ─── Configuraciones de Estado y Acciones ─────────────────────────────────────

export const ORDER_STATUS_CONFIGS: Record<OrderV2Status, OrderStatusConfig> = {
  new: {
    label: 'Nuevo / Por Atender',
    shortLabel: 'Nuevo',
    variant: 'default',
    badgeClass: 'bg-blue-500/15 text-blue-600 border-blue-500/20 dark:text-blue-400',
    nextStatus: 'preparing',
    nextActionLabel: 'Empezar Preparación',
    iconName: 'clock',
  },
  preparing: {
    label: 'En Preparación',
    shortLabel: 'Preparando',
    variant: 'warning',
    badgeClass: 'bg-amber-500/15 text-amber-600 border-amber-500/20 dark:text-amber-400',
    nextStatus: 'ready',
    nextActionLabel: 'Marcar como Listo',
    iconName: 'flame',
  },
  ready: {
    label: 'Listo para Entrega / En Ruta',
    shortLabel: 'Listo',
    variant: 'success',
    badgeClass: 'bg-emerald-500/15 text-emerald-600 border-emerald-500/20 dark:text-emerald-400',
    nextStatus: 'delivered',
    nextActionLabel: 'Marcar Entregado',
    iconName: 'check',
  },
  delivered: {
    label: 'Entregado',
    shortLabel: 'Entregado',
    variant: 'secondary',
    badgeClass: 'bg-surface-raised text-text-secondary border-line',
    nextStatus: null,
    nextActionLabel: null,
    iconName: 'package-check',
  },
  cancelled: {
    label: 'Cancelado',
    shortLabel: 'Cancelado',
    variant: 'destructive',
    badgeClass: 'bg-red-500/15 text-red-600 border-red-500/20 dark:text-red-400',
    nextStatus: null,
    nextActionLabel: null,
    iconName: 'ban',
  },
};

export const PAYMENT_METHOD_LABELS: Record<OrderV2PaymentMethod, string> = {
  cash: 'Efectivo contra entrega',
  transfer: 'Transferencia SPEI',
  card: 'Tarjeta Débito/Crédito',
  unknown: 'No especificado',
};

export const PAYMENT_STATUS_CONFIGS: Record<
  OrderV2PaymentStatus,
  { label: string; variant: 'success' | 'warning' | 'destructive'; badgeClass: string }
> = {
  paid: {
    label: 'Pagado',
    variant: 'success',
    badgeClass: 'bg-emerald-500/15 text-emerald-600 border-emerald-500/20 dark:text-emerald-400',
  },
  pending: {
    label: 'Pago Pendiente',
    variant: 'warning',
    badgeClass: 'bg-amber-500/15 text-amber-600 border-amber-500/20 dark:text-amber-400',
  },
  cancelled: {
    label: 'Pago Cancelado',
    variant: 'destructive',
    badgeClass: 'bg-red-500/15 text-red-600 border-red-500/20 dark:text-red-400',
  },
};

// ─── Formateadores ────────────────────────────────────────────────────────────

export function formatCurrency(pesos: number): string {
  const safeNumber = Number.isFinite(pesos) ? pesos : 0;
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(safeNumber);
}

export function formatOrderTime(isoString?: string): string {
  if (!isoString) return '--:--';
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return '--:--';
    return date.toLocaleTimeString('es-MX', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
      timeZone: 'America/Mexico_City',
    });
  } catch {
    return '--:--';
  }
}

export function formatOrderDate(isoString?: string): string {
  if (!isoString) return '';
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return '';
    return date.toLocaleDateString('es-MX', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      timeZone: 'America/Mexico_City',
    });
  } catch {
    return '';
  }
}

export function formatDeliveryLocation(delivery?: OrderV2DeliveryInfo, mode?: OrderV2Mode): string {
  if (mode === 'pickup') {
    return 'Pickup en Local';
  }
  if (delivery?.location?.trim()) {
    return delivery.location.trim();
  }
  return 'Entrega a Domicilio';
}

export function formatDeliverySchedule(delivery?: OrderV2DeliveryInfo, createdAt?: string): string {
  if (delivery?.scheduledTime?.trim()) {
    const datePrefix = delivery.scheduledDate ? `${delivery.scheduledDate} ` : '';
    return `${datePrefix}${delivery.scheduledTime.trim()}`;
  }
  if (createdAt) {
    return `Hoy (${formatOrderTime(createdAt)})`;
  }
  return 'Inmediata';
}

export function getCleanPhoneNumber(phone?: string): string {
  if (!phone) return '';
  return phone.replace(/\D/g, '');
}

export function getWhatsAppLink(phone?: string, text?: string): string {
  const clean = getCleanPhoneNumber(phone);
  if (!clean) return '#';
  const fullNumber = clean.length === 10 ? `52${clean}` : clean;
  const messageParam = text ? `?text=${encodeURIComponent(text)}` : '';
  return `https://wa.me/${fullNumber}${messageParam}`;
}

/**
 * Extrae y formatea la torre de entrega exclusiva (Torre GGA o Torre Valcob) con departamento si aplica.
 */
export function formatTowerDeliveryLabel(delivery?: Record<string, unknown> | null): string {
  if (!delivery) return 'Torre GGA';
  const loc = typeof delivery.location === 'string' ? delivery.location.trim() : '';
  const notes = typeof delivery.notes === 'string' ? delivery.notes.trim() : '';
  const fullText = `${loc} ${notes}`.toLowerCase();

  const isValcob = fullText.includes('valcob');
  const towerName = isValcob ? 'Torre Valcob' : 'Torre GGA';

  // Buscar departamento o piso (ej. Depto 402, D-102, #304, etc.)
  const deptoMatch =
    loc.match(/(?:depto|departamento|dpto|apt|apto|#)\.?\s*([a-zA-Z0-9-]+)/i) ||
    notes.match(/(?:depto|departamento|dpto|apt|apto|#)\.?\s*([a-zA-Z0-9-]+)/i);

  if (deptoMatch && deptoMatch[1]) {
    return `${towerName} · Depto ${deptoMatch[1]}`;
  }

  return towerName;
}

/**
 * Obtiene la información de fecha del pedido: si es para hoy o para una fecha futura/distinta.
 */
export function formatOrderTargetDateInfo(order: OrderV2): {
  isToday: boolean;
  label: string;
} {
  const todayStr = getCdmxTodayString();

  let targetDateStr = todayStr;
  const delivery = order.delivery as Record<string, unknown> | undefined;
  if (delivery) {
    if (typeof delivery.scheduledDate === 'string' && delivery.scheduledDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
      targetDateStr = delivery.scheduledDate;
    } else if (typeof delivery.scheduledDeliveryDate === 'string' && delivery.scheduledDeliveryDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
      targetDateStr = delivery.scheduledDeliveryDate;
    } else if (order.createdAt) {
      targetDateStr = formatCdmxDateString(order.createdAt);
    }
  } else if (order.createdAt) {
    targetDateStr = formatCdmxDateString(order.createdAt);
  }

  if (targetDateStr === todayStr) {
    return {
      isToday: true,
      label: 'Hoy',
    };
  }

  try {
    const [year, month, day] = targetDateStr.split('-').map(Number);
    if (year && month && day) {
      const dateObj = new Date(year, month - 1, day);
      const monthName = dateObj.toLocaleDateString('es-MX', { month: 'short' }).replace('.', '');
      const monthNameCap = monthName.charAt(0).toUpperCase() + monthName.slice(1);
      return {
        isToday: false,
        label: `${day} ${monthNameCap}`,
      };
    }
  } catch {
    // fallback
  }

  return {
    isToday: false,
    label: targetDateStr,
  };
}
