import { Hono, type Context } from 'hono';
import type { AppEnv } from '../_types';
import {
  TERMINAL_STATUSES,
  type OrderV2,
  type OrderV2Environment,
  type OrderV2Item,
  type OrderV2PaymentStatus,
  type OrderV2Status,
  type UpdateKitchenItemPayload,
  type UpdateOrderV2PaymentPayload,
  type UpdateOrderV2StatusPayload
} from '../../../packages/config/src';
import {
  assertOrderMatchesEnvironment,
  buildOrderEnvironmentCondition,
  errorResponse,
  fetchOrderBundle,
  generateId,
  getCdmxUtcRangeFromTo,
  getOrderSourceForEnvironment,
  json,
  mapD1OrderEventToOrderV2Event,
  mapD1OrderItemToOrderV2Item,
  mapD1OrderToOrderV2,
  parseJsonObject,
  parseJsonSnapshot,
  parseOrderEnvironment,
  parseOrderEnvironmentFromRequest,
  requireAdminToken,
  requireInternalOrigin,
  validateStatusTransition
} from '../_orders-v2-utils';

export const ordersAdminRouter = new Hono<AppEnv>();

const ORDER_STATUSES = new Set<OrderV2Status>(['new', 'preparing', 'ready', 'delivered', 'cancelled']);
const PAYMENT_STATUSES = new Set<OrderV2PaymentStatus>(['pending', 'paid', 'cancelled']);
const KITCHEN_ITEM_KINDS = new Set<UpdateKitchenItemPayload['itemKind']>(['burger', 'combo', 'garnish']);
const SIDE_QUEST_LINE_KEY_PREFIX = '::sidequest-';
const DATE_ONLY_RE = /^\d{4}-\d{2}-\d{2}$/;
const STATUS_KEYS: Array<'new' | 'preparing' | 'ready' | 'delivered' | 'cancelled'> = ['new', 'preparing', 'ready', 'delivered', 'cancelled'];

type SnapshotRecord = Record<string, unknown>;
type SideQuestSource = 'included-garnish' | 'included-drink' | 'sidequest-extra';

const parseBoolean = (value: string | null | undefined, defaultValue = false) => {
  if (value === null || value === undefined) return defaultValue;
  return value === 'true' || value === '1';
};

const parseLimit = (value: string | null) => {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) return 50;
  return Math.min(parsed, 100);
};

const isDateOnly = (value: string) => DATE_ONLY_RE.test(value);

const asRecord = (value: unknown): SnapshotRecord | null =>
  value && typeof value === 'object' && !Array.isArray(value) ? (value as SnapshotRecord) : null;

const getOptionalString = (value: unknown) =>
  typeof value === 'string' && value.trim() ? value.trim() : undefined;

const getOptionalNumber = (value: unknown) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const getParentLineKey = (item: OrderV2Item) =>
  getOptionalString(item.snapshot?.lineKey) ?? item.id;

const buildSideQuestLineKey = (
  parentLineKey: string,
  source: SideQuestSource,
  index = 0
) => `${parentLineKey}${SIDE_QUEST_LINE_KEY_PREFIX}${
  source === 'included-garnish'
    ? 'included-garnish'
    : source === 'included-drink'
      ? 'included-drink'
      : `extra-${index}`
}`;

const createKitchenSideQuestItem = (
  parent: OrderV2Item,
  entry: SnapshotRecord,
  source: SideQuestSource,
  index = 0
): OrderV2Item | null => {
  const name = getOptionalString(entry.name);
  if (!name) return null;

  const parentLineKey = getParentLineKey(parent);
  const lineKey = buildSideQuestLineKey(parentLineKey, source, index);
  const sku = getOptionalString(entry.sku) ?? `${parent.sku}-${source}-${index}`;
  const suffix = lineKey.slice(lineKey.indexOf(SIDE_QUEST_LINE_KEY_PREFIX) + 2);

  return {
    id: `${parent.id}-${suffix}`,
    orderId: parent.orderId,
    sku,
    name,
    qty: parent.qty,
    unitPrice: 0,
    lineTotal: 0,
    createdAt: parent.createdAt,
    snapshot: {
      sku,
      name,
      priceCents: 0,
      category: 'guarniciones',
      lineKey,
      itemDisplayIndex: getOptionalNumber(parent.snapshot?.itemDisplayIndex),
      itemKind: 'garnish',
      removedIngredients: [],
      extras: [],
      burgerNote: undefined,
      garnish: null,
      includedDrink: null,
      sideQuestExtras: [],
      comboBurgers: [],
      parentLineKey,
      parentItemKind: getOptionalString(parent.snapshot?.itemKind),
      parentItemName: parent.name,
      sideQuestSource: source,
      upcharge: getOptionalNumber(entry.upcharge),
      price: getOptionalNumber(entry.price)
    }
  };
};

const appendKitchenSideQuestItems = (items: OrderV2Item[]) =>
  items.flatMap((item) => {
    const snapshot = item.snapshot ?? {};
    const syntheticItems: OrderV2Item[] = [];
    const garnish = asRecord(snapshot.garnish);
    if (garnish) {
      const sideQuestItem = createKitchenSideQuestItem(item, garnish, 'included-garnish');
      if (sideQuestItem) syntheticItems.push(sideQuestItem);
    }
    const includedDrink = asRecord(snapshot.includedDrink);
    if (includedDrink) {
      const sideQuestItem = createKitchenSideQuestItem(item, includedDrink, 'included-drink');
      if (sideQuestItem) syntheticItems.push(sideQuestItem);
    }

    if (Array.isArray(snapshot.sideQuestExtras)) {
      snapshot.sideQuestExtras.forEach((extra, index) => {
        const extraRecord = asRecord(extra);
        if (!extraRecord) return;
        const itemKind = getOptionalString(extraRecord.itemKind) ?? 'garnish';
        if (itemKind !== 'garnish') return;
        const sideQuestItem = createKitchenSideQuestItem(item, extraRecord, 'sidequest-extra', index);
        if (sideQuestItem) syntheticItems.push(sideQuestItem);
      });
    }

    return [item, ...syntheticItems];
  });

const appendKitchenSideQuestItemsToOrder = (order: OrderV2): OrderV2 => ({
  ...order,
  items: appendKitchenSideQuestItems(order.items)
});

// GET /api/orders-v2-admin
ordersAdminRouter.get('/', async (c) => {
  if (!c.env.BOG_MENU_DB) return errorResponse(503, 'MISSING_DB', 'BOG_MENU_DB no está configurado.');
  const authError = await requireInternalOrigin(c.req.raw);
  if (authError) return authError;

  const params = new URL(c.req.url).searchParams;
  const status = params.get('status')?.trim() as OrderV2Status | undefined;
  if (status && !ORDER_STATUSES.has(status)) return errorResponse(400, 'INVALID_STATUS', 'Estado inválido.');
  const includeTerminal = parseBoolean(params.get('includeTerminal'));
  const limit = parseLimit(params.get('limit'));
  const environment = parseOrderEnvironmentFromRequest(c.req.raw);
  if (!environment) return errorResponse(400, 'INVALID_ENVIRONMENT', 'Ambiente de orden inválido.');
  const from = params.get('from')?.trim() ?? '';
  const to = params.get('to')?.trim() ?? '';
  if ((from && !isDateOnly(from)) || (to && !isDateOnly(to))) return errorResponse(400, 'INVALID_DATE', 'Fechas inválidas.');

  const archivedParam = (params.get('archived') ?? params.get('archivedMode'))?.trim().toLowerCase() ?? 'false';
  const searchParam = params.get('search')?.trim() ?? '';

  const conditions: string[] = [];
  const bindings: Array<string | number> = [];

  if (archivedParam === 'true' || archivedParam === '1') {
    conditions.push('archived_at IS NOT NULL');
  } else if (archivedParam === 'all') {
    // No archived_at restriction
  } else {
    conditions.push('archived_at IS NULL');
  }

  const environmentCondition = buildOrderEnvironmentCondition(environment);
  conditions.push(environmentCondition.condition);
  bindings.push(environmentCondition.binding);

  if (status) {
    conditions.push('status = ?');
    bindings.push(status);
  } else if (!includeTerminal && archivedParam !== 'true' && archivedParam !== 'all') {
    conditions.push("status NOT IN ('delivered', 'cancelled')");
  }

  if (searchParam) {
    conditions.push('(LOWER(id) LIKE ? OR LOWER(folio) LIKE ? OR LOWER(customer_name) LIKE ? OR LOWER(customer_phone) LIKE ? OR LOWER(notes) LIKE ?)');
    const term = `%${searchParam.toLowerCase()}%`;
    bindings.push(term, term, term, term, term);
  }

  const { fromUtc, toUtc } = getCdmxUtcRangeFromTo(from, to);
  if (fromUtc) {
    conditions.push('created_at >= ?');
    bindings.push(fromUtc);
  }
  if (toUtc) {
    conditions.push('created_at <= ?');
    bindings.push(toUtc);
  }
  bindings.push(limit);

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  try {
    const ordersResult = await c.env.BOG_MENU_DB.prepare(`SELECT * FROM orders_v2 ${whereClause} ORDER BY created_at DESC LIMIT ?`).bind(...bindings).all();
    const orderRows = ordersResult.results ?? [];
    const orderIds = orderRows.map((row: any) => String(row.id));
    if (!orderIds.length) return json(200, { ok: true, data: { orders: [], source: 'd1' } });

    const placeholders = orderIds.map(() => '?').join(', ');
    const [itemsResult, eventsResult] = await Promise.all([
      c.env.BOG_MENU_DB.prepare(`SELECT * FROM order_items_v2 WHERE order_id IN (${placeholders}) ORDER BY created_at ASC`).bind(...orderIds).all(),
      c.env.BOG_MENU_DB.prepare(`SELECT * FROM order_events_v2 WHERE order_id IN (${placeholders}) ORDER BY created_at ASC`).bind(...orderIds).all()
    ]);

    const itemsByOrder = new Map<string, ReturnType<typeof mapD1OrderItemToOrderV2Item>[]>();
    (itemsResult.results ?? []).forEach((row: any) => {
      const item = mapD1OrderItemToOrderV2Item(row);
      const list = itemsByOrder.get(item.orderId) ?? [];
      list.push(item);
      itemsByOrder.set(item.orderId, list);
    });

    const eventsByOrder = new Map<string, ReturnType<typeof mapD1OrderEventToOrderV2Event>[]>();
    (eventsResult.results ?? []).forEach((row: any) => {
      const event = mapD1OrderEventToOrderV2Event(row);
      const list = eventsByOrder.get(event.orderId) ?? [];
      if (list.length < 10) list.push(event);
      eventsByOrder.set(event.orderId, list);
    });

    const orders = orderRows
      .filter((row: any) => includeTerminal || archivedParam === 'true' || archivedParam === 'all' || status || !TERMINAL_STATUSES.has(String(row.status) as OrderV2Status))
      .map((row: any) => {
        const items = itemsByOrder.get(String(row.id)) ?? [];
        return mapD1OrderToOrderV2(row, items, eventsByOrder.get(String(row.id)) ?? []);
      });

    return json(200, { ok: true, data: { orders, source: 'd1' } });
  } catch {
    return errorResponse(500, 'INTERNAL_ERROR', 'No se pudieron listar las órdenes.');
  }
});

// GET /api/orders-v2-admin/summary
ordersAdminRouter.get('/summary', async (c) => {
  if (!c.env.BOG_MENU_DB) return errorResponse(503, 'D1_NOT_CONFIGURED', 'BOG_MENU_DB no está configurado.');
  const authError = await requireInternalOrigin(c.req.raw);
  if (authError) return authError;

  const params = new URL(c.req.url).searchParams;
  const from = params.get('from')?.trim() ?? '';
  const to = params.get('to')?.trim() ?? '';

  if ((from && !DATE_ONLY_RE.test(from)) || (to && !DATE_ONLY_RE.test(to))) {
    return errorResponse(400, 'INVALID_DATE', 'Fechas inválidas. Usa YYYY-MM-DD.');
  }
  if (from && to && from > to) return errorResponse(400, 'INVALID_DATE_RANGE', 'El rango de fechas es inválido.');

  const includeTerminal = parseBoolean(params.get('includeTerminal'), true);
  const environment = parseOrderEnvironmentFromRequest(c.req.raw);
  if (!environment) return errorResponse(400, 'INVALID_ENVIRONMENT', 'Ambiente de orden inválido.');

  const parseBoundedInt = (val: string | null, def: number, max: number) => {
    if (!val) return def;
    const p = Number(val);
    return Number.isInteger(p) && p > 0 && p <= max ? p : def;
  };
  const limit = parseBoundedInt(params.get('limit'), 1000, 5000);
  const topLimit = parseBoundedInt(params.get('topLimit'), 10, 50);

  const { fromUtc, toUtc } = getCdmxUtcRangeFromTo(from, to);

  const conditions: string[] = ['o.archived_at IS NULL'];
  const bindings: Array<string | number> = [];
  const environmentCondition = buildOrderEnvironmentCondition(environment, 'o');
  conditions.push(environmentCondition.condition);
  bindings.push(environmentCondition.binding);
  if (!includeTerminal) conditions.push("o.status NOT IN ('delivered', 'cancelled')");
  if (fromUtc) {
    conditions.push('o.created_at >= ?');
    bindings.push(fromUtc);
  }
  if (toUtc) {
    conditions.push('o.created_at <= ?');
    bindings.push(toUtc);
  }
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  try {
    const byStatusSql = `
      SELECT
        o.status AS status,
        COUNT(*) AS order_count,
        SUM(CASE WHEN o.status != 'cancelled' THEN o.total_cents ELSE 0 END) AS gross_cents,
        SUM(CASE WHEN o.status = 'delivered' THEN o.total_cents ELSE 0 END) AS delivered_cents,
        SUM(CASE WHEN o.status != 'cancelled' THEN 1 ELSE 0 END) AS non_cancelled_count
      FROM orders_v2 o
      ${where}
      GROUP BY o.status`;

    const byPaymentSql = `
      SELECT
        o.payment_method AS key_value,
        COUNT(*) AS order_count,
        SUM(CASE WHEN o.status != 'cancelled' THEN o.total_cents ELSE 0 END) AS total_cents
      FROM orders_v2 o
      ${where}
      GROUP BY o.payment_method
      ORDER BY total_cents DESC, order_count DESC`;

    const byModeSql = `
      SELECT
        o.order_mode AS key_value,
        COUNT(*) AS order_count,
        SUM(CASE WHEN o.status != 'cancelled' THEN o.total_cents ELSE 0 END) AS total_cents
      FROM orders_v2 o
      ${where}
      GROUP BY o.order_mode
      ORDER BY total_cents DESC, order_count DESC`;

    const topItemsSql = `
      SELECT
        i.sku AS sku,
        i.name AS name,
        SUM(i.qty) AS qty,
        SUM(i.line_total_cents) AS total_cents,
        COUNT(DISTINCT i.order_id) AS order_count
      FROM order_items_v2 i
      JOIN orders_v2 o ON o.id = i.order_id
      ${where ? `${where} AND o.status != 'cancelled'` : "WHERE o.status != 'cancelled'"}
      GROUP BY i.sku, i.name
      ORDER BY qty DESC, total_cents DESC, name ASC
      LIMIT ?`;

    const recentOrdersSql = `
      SELECT
        o.id,
        o.folio,
        o.created_at,
        o.status,
        o.customer_name,
        o.order_mode,
        o.payment_method,
        o.payment_status,
        o.total_cents
      FROM orders_v2 o
      ${where}
      ORDER BY o.created_at DESC
      LIMIT ?`;

    const durationsSql = `
      WITH filtered_orders AS (
        SELECT o.id
        FROM orders_v2 o
        ${where}
      ), transitions AS (
        SELECT
          e.order_id,
          MIN(CASE WHEN e.next_status = 'new' THEN e.created_at END) AS new_at,
          MIN(CASE WHEN e.next_status = 'ready' THEN e.created_at END) AS ready_at,
          MIN(CASE WHEN e.next_status = 'delivered' THEN e.created_at END) AS delivered_at
        FROM order_events_v2 e
        JOIN filtered_orders f ON f.id = e.order_id
        GROUP BY e.order_id
      )
      SELECT
        AVG(CASE WHEN new_at IS NOT NULL AND ready_at IS NOT NULL THEN strftime('%s', ready_at) - strftime('%s', new_at) END) AS new_to_ready_avg_seconds,
        AVG(CASE WHEN new_at IS NOT NULL AND delivered_at IS NOT NULL THEN strftime('%s', delivered_at) - strftime('%s', new_at) END) AS new_to_delivered_avg_seconds
      FROM transitions`;

    const [statusResult, paymentResult, modeResult, topItemsResult, recentOrdersResult, durationsRow] = await Promise.all([
      c.env.BOG_MENU_DB.prepare(byStatusSql).bind(...bindings).all<{ status: string; order_count: number; gross_cents: number; delivered_cents: number; non_cancelled_count: number }>(),
      c.env.BOG_MENU_DB.prepare(byPaymentSql).bind(...bindings).all<{ key_value: string; order_count: number; total_cents: number }>(),
      c.env.BOG_MENU_DB.prepare(byModeSql).bind(...bindings).all<{ key_value: string; order_count: number; total_cents: number }>(),
      c.env.BOG_MENU_DB.prepare(topItemsSql).bind(...bindings, topLimit).all<{ sku: string; name: string; qty: number; total_cents: number; order_count: number }>(),
      c.env.BOG_MENU_DB.prepare(recentOrdersSql).bind(...bindings, limit).all<{ id: string; folio: string; created_at: string; status: string; customer_name: string; order_mode: string; payment_method: string; payment_status: string; total_cents: number }>(),
      c.env.BOG_MENU_DB.prepare(durationsSql).bind(...bindings).first<{ new_to_ready_avg_seconds: number | null; new_to_delivered_avg_seconds: number | null }>()
    ]);

    const byStatus = { new: 0, preparing: 0, ready: 0, delivered: 0, cancelled: 0 };
    let grossSales = 0;
    let deliveredSales = 0;
    let nonCancelledOrders = 0;

    const centsToPrice = (val: unknown) => (Number.isFinite(Number(val)) ? Number(val) / 100 : 0);

    (statusResult.results ?? []).forEach((row) => {
      const st = String(row.status) as keyof typeof byStatus;
      if (STATUS_KEYS.includes(st)) byStatus[st] = Number(row.order_count) || 0;
      grossSales += centsToPrice(row.gross_cents);
      deliveredSales += centsToPrice(row.delivered_cents);
      nonCancelledOrders += Number(row.non_cancelled_count) || 0;
    });

    const activeOrders = byStatus.new + byStatus.preparing + byStatus.ready;
    const averageTicket = nonCancelledOrders > 0 ? grossSales / nonCancelledOrders : 0;

    return json(200, {
      ok: true,
      data: {
        source: 'd1',
        range: { from, to, fromUtc, toUtc },
        totals: {
          orders: STATUS_KEYS.reduce((acc, key) => acc + byStatus[key], 0),
          activeOrders,
          deliveredOrders: byStatus.delivered,
          cancelledOrders: byStatus.cancelled,
          grossSales,
          deliveredSales,
          averageTicket
        },
        byStatus,
        byPaymentMethod: (paymentResult.results ?? []).map((row) => ({
          paymentMethod: String(row.key_value),
          orders: Number(row.order_count) || 0,
          total: centsToPrice(row.total_cents)
        })),
        byOrderMode: (modeResult.results ?? []).map((row) => ({
          orderMode: String(row.key_value),
          orders: Number(row.order_count) || 0,
          total: centsToPrice(row.total_cents)
        })),
        topItems: (topItemsResult.results ?? []).map((row) => ({
          sku: String(row.sku),
          name: String(row.name),
          qty: Number(row.qty) || 0,
          total: centsToPrice(row.total_cents),
          orders: Number(row.order_count) || 0
        })),
        recentOrders: (recentOrdersResult.results ?? []).map((row) => ({
          id: String(row.id),
          folio: String(row.folio),
          createdAt: String(row.created_at),
          status: String(row.status),
          customerName: String(row.customer_name),
          orderMode: String(row.order_mode),
          paymentMethod: String(row.payment_method),
          paymentStatus: String(row.payment_status),
          total: centsToPrice(row.total_cents)
        })),
        durations: {
          newToReadyAvgSeconds: durationsRow?.new_to_ready_avg_seconds ?? null,
          newToDeliveredAvgSeconds: durationsRow?.new_to_delivered_avg_seconds ?? null
        },
        generatedAt: new Date().toISOString()
      }
    });
  } catch {
    return errorResponse(500, 'SUMMARY_FAILED', 'No se pudo calcular el cierre operativo.');
  }
});

// GET /api/orders-v2-admin/export.csv
ordersAdminRouter.get('/export.csv', async (c) => {
  if (!c.env.BOG_MENU_DB) return errorResponse(503, 'D1_NOT_CONFIGURED', 'BOG_MENU_DB no está configurado.');
  const authError = await requireAdminToken(c.req.raw, c.env);
  if (authError) return authError;

  const params = new URL(c.req.url).searchParams;
  const status = params.get('status')?.trim() as OrderV2Status | undefined;
  if (status && !ORDER_STATUSES.has(status)) return errorResponse(400, 'INVALID_STATUS', 'Estado inválido.');

  const includeTerminal = parseBoolean(params.get('includeTerminal'));
  const environment = parseOrderEnvironmentFromRequest(c.req.raw);
  if (!environment) return errorResponse(400, 'INVALID_ENVIRONMENT', 'Ambiente de orden inválido.');
  const from = params.get('from')?.trim() ?? '';
  const to = params.get('to')?.trim() ?? '';
  if ((from && !isDateOnly(from)) || (to && !isDateOnly(to))) return errorResponse(400, 'INVALID_DATE', 'Fechas inválidas. Usa YYYY-MM-DD.');

  const limitRaw = Number(params.get('limit') || 500);
  const limit = Number.isInteger(limitRaw) && limitRaw > 0 && limitRaw <= 1000 ? limitRaw : 500;

  const conditions: string[] = ['archived_at IS NULL'];
  const bindings: Array<string | number> = [];
  const environmentCondition = buildOrderEnvironmentCondition(environment);
  conditions.push(environmentCondition.condition);
  bindings.push(environmentCondition.binding);
  if (status) {
    conditions.push('status = ?');
    bindings.push(status);
  } else if (!includeTerminal) {
    conditions.push("status NOT IN ('delivered', 'cancelled')");
  }
  const { fromUtc, toUtc } = getCdmxUtcRangeFromTo(from, to);
  if (fromUtc) {
    conditions.push('created_at >= ?');
    bindings.push(fromUtc);
  }
  if (toUtc) {
    conditions.push('created_at <= ?');
    bindings.push(toUtc);
  }
  bindings.push(limit);

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  try {
    const ordersResult = await c.env.BOG_MENU_DB.prepare(`SELECT * FROM orders_v2 ${whereClause} ORDER BY created_at DESC LIMIT ?`).bind(...bindings).all<any>();
    const orderRows = ordersResult.results ?? [];
    const orderIds = orderRows.map((row) => String(row.id));

    const itemsByOrder = new Map<string, Array<{ order_id: string; sku: string; name: string; qty: number; created_at: string }>>();
    const eventCountsByOrder = new Map<string, number>();

    if (orderIds.length) {
      const placeholders = orderIds.map(() => '?').join(', ');
      const [itemsResult, eventsResult] = await Promise.all([
        c.env.BOG_MENU_DB.prepare(`SELECT order_id, sku, name, qty, created_at FROM order_items_v2 WHERE order_id IN (${placeholders}) ORDER BY created_at ASC`).bind(...orderIds).all<any>(),
        c.env.BOG_MENU_DB.prepare(`SELECT order_id, COUNT(*) AS event_count FROM order_events_v2 WHERE order_id IN (${placeholders}) GROUP BY order_id`).bind(...orderIds).all<any>()
      ]);

      (itemsResult.results ?? []).forEach((item) => {
        const orderId = String(item.order_id);
        const list = itemsByOrder.get(orderId) ?? [];
        list.push({ ...item, order_id: orderId });
        itemsByOrder.set(orderId, list);
      });

      (eventsResult.results ?? []).forEach((eventCount) => {
        eventCountsByOrder.set(String(eventCount.order_id), Number(eventCount.event_count) || 0);
      });
    }

    const CSV_HEADERS = ['folio', 'order_id', 'created_at', 'updated_at', 'status', 'customer_name', 'customer_phone', 'order_mode', 'payment_method', 'payment_status', 'notes', 'subtotal', 'total', 'items_summary', 'item_skus', 'item_qtys', 'event_count', 'source'];
    const centsToFixedPrice = (cents: unknown) => (Number.isFinite(Number(cents)) ? (Number(cents) / 100).toFixed(2) : '0.00');
    const escapeCsvCell = (value: unknown) => {
      const str = String(value ?? '');
      const safe = /^[=+\-@\t\r]/.test(str) ? `'${str}` : str;
      const escaped = safe.replace(/"/g, '""');
      return /[",\r\n]/.test(escaped) ? `"${escaped}"` : escaped;
    };

    const rows = [CSV_HEADERS.join(',')];
    orderRows.forEach((order) => {
      const items = itemsByOrder.get(order.id) ?? [];
      const itemsSummary = items.map((item) => `${Number(item.qty) || 0}x ${item.name}`).join('; ');
      const itemSkus = items.map((item) => item.sku).join('|');
      const itemQtys = items.map((item) => String(Number(item.qty) || 0)).join('|');
      const values = [
        order.folio,
        order.id,
        order.created_at,
        order.updated_at,
        order.status,
        order.customer_name,
        order.customer_phone,
        order.order_mode,
        order.payment_method,
        order.payment_status,
        order.notes ?? '',
        centsToFixedPrice(order.subtotal_cents),
        centsToFixedPrice(order.total_cents),
        itemsSummary,
        itemSkus,
        itemQtys,
        String(eventCountsByOrder.get(order.id) ?? 0),
        order.source
      ];
      rows.push(values.map(escapeCsvCell).join(','));
    });

    return new Response(`\uFEFF${rows.join('\r\n')}\r\n`, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="orders-v2-export.csv"',
        'Cache-Control': 'no-store',
        'X-Content-Type-Options': 'nosniff'
      }
    });
  } catch {
    return errorResponse(500, 'EXPORT_FAILED', 'No se pudo exportar órdenes V2.');
  }
});

// GET /api/orders-v2-admin/live-stream
ordersAdminRouter.get('/live-stream', async (c) => {
  if (!c.env.BOG_MENU_DB) return errorResponse(503, 'MISSING_DB', 'BOG_MENU_DB no está configurado.');
  const authError = await requireAdminToken(c.req.raw, c.env);
  if (authError) return authError;

  const environment = parseOrderEnvironmentFromRequest(c.req.raw);
  if (!environment) return errorResponse(400, 'INVALID_ENVIRONMENT', 'Ambiente de orden inválido.');
  const sourceBinding = getOrderSourceForEnvironment(environment);

  let lastCheckedTimestamp = new Date(Date.now() - 30000).toISOString();

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      controller.enqueue(encoder.encode('retry: 5000\n\n'));
      controller.enqueue(encoder.encode(`event: connected\ndata: ${JSON.stringify({ time: new Date().toISOString() })}\n\n`));

      const poll = async () => {
        try {
          const now = new Date().toISOString();
          const newEvents = await c.env.BOG_MENU_DB!.prepare(
            `SELECT e.* FROM order_events_v2 e
             JOIN orders_v2 o ON o.id = e.order_id
             WHERE e.created_at > ? AND o.source = ?
             ORDER BY e.created_at ASC LIMIT 20`
          )
            .bind(lastCheckedTimestamp, sourceBinding)
            .all();

          const events = newEvents.results ?? [];
          if (events.length > 0) {
            lastCheckedTimestamp = now;
            events.forEach((evt: any) => {
              controller.enqueue(encoder.encode(`event: order_event\ndata: ${JSON.stringify(evt)}\n\n`));
            });
          } else {
            controller.enqueue(encoder.encode(': ping\n\n'));
          }
        } catch {
          // Connection closed or DB error
        }
      };

      const intervalId = setInterval(poll, 4000);
      c.req.raw.signal.addEventListener('abort', () => {
        clearInterval(intervalId);
        try {
          controller.close();
        } catch {
          /* ignore */
        }
      });
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no'
    }
  });
});

// POST /api/orders-v2-admin/cash-cut
ordersAdminRouter.post('/cash-cut', async (c) => {
  if (!c.env.BOG_MENU_DB) return errorResponse(503, 'MISSING_DB', 'BOG_MENU_DB no está configurado.');
  const authError = await requireAdminToken(c.req.raw, c.env);
  if (authError) return authError;

  const url = new URL(c.req.url);
  const params = url.searchParams;
  const environment = parseOrderEnvironmentFromRequest(c.req.raw);
  if (!environment) return errorResponse(400, 'INVALID_ENVIRONMENT', 'Ambiente de orden inválido.');

  const from = params.get('from')?.trim() ?? '';
  const to = params.get('to')?.trim() ?? '';
  if ((from && !isDateOnly(from)) || (to && !isDateOnly(to))) {
    return errorResponse(400, 'INVALID_DATE', 'Fechas inválidas.');
  }

  const conditions: string[] = ['archived_at IS NULL'];
  const bindings: Array<string | number> = [];
  const envCondition = buildOrderEnvironmentCondition(environment);
  conditions.push(envCondition.condition);
  bindings.push(envCondition.binding);
  const { fromUtc, toUtc } = getCdmxUtcRangeFromTo(from, to);
  if (fromUtc) {
    conditions.push('created_at >= ?');
    bindings.push(fromUtc);
  }
  if (toUtc) {
    conditions.push('created_at <= ?');
    bindings.push(toUtc);
  }
  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  try {
    const [overallResult, byPaymentMethodResult, byOrderModeResult, byPaymentStatusResult] = await Promise.all([
      c.env.BOG_MENU_DB.prepare(`SELECT COUNT(*) as total_orders, COALESCE(SUM(total_cents), 0) as total_sales_cents FROM orders_v2 ${whereClause} AND status != 'cancelled'`).bind(...bindings).first<{ total_orders: number; total_sales_cents: number }>(),
      c.env.BOG_MENU_DB.prepare(`SELECT payment_method, COUNT(*) as count, COALESCE(SUM(total_cents), 0) as total_cents FROM orders_v2 ${whereClause} AND status != 'cancelled' GROUP BY payment_method`).bind(...bindings).all<{ payment_method: string; count: number; total_cents: number }>(),
      c.env.BOG_MENU_DB.prepare(`SELECT order_mode, COUNT(*) as count, COALESCE(SUM(total_cents), 0) as total_cents FROM orders_v2 ${whereClause} AND status != 'cancelled' GROUP BY order_mode`).bind(...bindings).all<{ order_mode: string; count: number; total_cents: number }>(),
      c.env.BOG_MENU_DB.prepare(`SELECT payment_status, COUNT(*) as count, COALESCE(SUM(total_cents), 0) as total_cents FROM orders_v2 ${whereClause} GROUP BY payment_status`).bind(...bindings).all<{ payment_status: string; count: number; total_cents: number }>()
    ]);

    const totalSalesCents = Number(overallResult?.total_sales_cents ?? 0);
    const totalOrdersCount = Number(overallResult?.total_orders ?? 0);

    const byPaymentMethod: Record<string, { count: number; totalCents: number; totalPesos: number }> = {
      cash: { count: 0, totalCents: 0, totalPesos: 0 },
      transfer: { count: 0, totalCents: 0, totalPesos: 0 },
      card: { count: 0, totalCents: 0, totalPesos: 0 },
      unknown: { count: 0, totalCents: 0, totalPesos: 0 }
    };
    (byPaymentMethodResult.results ?? []).forEach((row) => {
      const key = String(row.payment_method);
      if (byPaymentMethod[key]) {
        byPaymentMethod[key] = { count: Number(row.count), totalCents: Number(row.total_cents), totalPesos: Number(row.total_cents) / 100 };
      }
    });

    const byOrderMode: Record<string, { count: number; totalCents: number; totalPesos: number }> = {
      pickup: { count: 0, totalCents: 0, totalPesos: 0 },
      delivery: { count: 0, totalCents: 0, totalPesos: 0 }
    };
    (byOrderModeResult.results ?? []).forEach((row) => {
      const key = String(row.order_mode);
      if (byOrderMode[key]) {
        byOrderMode[key] = { count: Number(row.count), totalCents: Number(row.total_cents), totalPesos: Number(row.total_cents) / 100 };
      }
    });

    const byPaymentStatus: Record<string, { count: number; totalCents: number; totalPesos: number }> = {
      pending: { count: 0, totalCents: 0, totalPesos: 0 },
      paid: { count: 0, totalCents: 0, totalPesos: 0 },
      cancelled: { count: 0, totalCents: 0, totalPesos: 0 }
    };
    (byPaymentStatusResult.results ?? []).forEach((row) => {
      const key = String(row.payment_status);
      if (byPaymentStatus[key]) {
        byPaymentStatus[key] = { count: Number(row.count), totalCents: Number(row.total_cents), totalPesos: Number(row.total_cents) / 100 };
      }
    });

    return json(200, {
      ok: true,
      data: {
        environment,
        from: from || null,
        to: to || null,
        totalOrders: totalOrdersCount,
        totalSalesCents,
        totalSalesPesos: totalSalesCents / 100,
        byPaymentMethod,
        byOrderMode,
        byPaymentStatus
      }
    });
  } catch {
    return errorResponse(500, 'INTERNAL_ERROR', 'No se pudo generar el corte de caja.');
  }
});

// POST /api/orders-v2-admin/batch-archive
ordersAdminRouter.post('/batch-archive', async (c) => {
  if (!c.env.BOG_MENU_DB) return errorResponse(503, 'MISSING_DB', 'BOG_MENU_DB no está configurado.');
  const authError = await requireAdminToken(c.req.raw, c.env);
  if (authError) return authError;

  const payload = await parseJsonObject(c.req.raw);
  if (!payload) return errorResponse(400, 'INVALID_PAYLOAD', 'Payload JSON inválido.');

  const orderIds = Array.isArray(payload.orderIds)
    ? payload.orderIds.map((id) => String(id).trim()).filter(Boolean)
    : [];
  if (!orderIds.length) return errorResponse(400, 'INVALID_ORDER_IDS', 'Debe proporcionar al menos un ID de orden.');
  if (orderIds.length > 100) return errorResponse(400, 'BATCH_LIMIT_EXCEEDED', 'No se pueden procesar más de 100 órdenes por lote.');

  const cancelReason = typeof payload.cancelReason === 'string' && payload.cancelReason.trim()
    ? payload.cancelReason.trim()
    : 'Limpieza de turno';

  const environment = parseOrderEnvironmentFromRequest(c.req.raw) ?? (typeof payload.environment === 'string' ? (payload.environment as any) : 'production');
  if (!environment) return errorResponse(400, 'INVALID_ENVIRONMENT', 'Ambiente de orden inválido.');

  try {
    const placeholders = orderIds.map(() => '?').join(', ');
    const query = `SELECT * FROM orders_v2 WHERE id IN (${placeholders})`;
    const resultRows = await c.env.BOG_MENU_DB.prepare(query).bind(...orderIds).all();
    const rows = resultRows.results ?? [];
    if (!rows.length) return errorResponse(404, 'NOT_FOUND', 'No se encontraron las órdenes especificadas.');

    const now = new Date().toISOString();
    const batchStatements: any[] = [];
    let cancelledCount = 0;
    let archivedCount = 0;
    const processedIds: string[] = [];

    for (const row of rows) {
      const environmentError = assertOrderMatchesEnvironment(row, environment);
      if (environmentError) continue;

      const id = String(row.id);
      const currentStatus = String(row.status);
      const isCancelled = currentStatus === 'cancelled';
      processedIds.push(id);

      if (!isCancelled) {
        cancelledCount++;
        archivedCount++;
        const cancelEvtId = generateId('evt');
        const archiveEvtId = generateId('evt');
        const cancelDetail = JSON.stringify({ reason: cancelReason, source: 'internal-v2', environment, batch: true });
        const archiveDetail = JSON.stringify({ source: 'internal-v2', archiveType: 'soft-batch', environment });

        batchStatements.push(
          c.env.BOG_MENU_DB.prepare("UPDATE orders_v2 SET status = 'cancelled', archived_at = ?, updated_at = ? WHERE id = ?").bind(now, now, id),
          c.env.BOG_MENU_DB.prepare(
            `INSERT INTO order_events_v2 (id, order_id, type, previous_status, next_status, detail_json, actor, created_at)
             VALUES (?, ?, 'ORDER_CANCELLED', ?, 'cancelled', ?, 'internal-v2', ?)`
          ).bind(cancelEvtId, id, currentStatus, cancelDetail, now),
          c.env.BOG_MENU_DB.prepare(
            `INSERT INTO order_events_v2 (id, order_id, type, previous_status, next_status, detail_json, actor, created_at)
             VALUES (?, ?, 'ORDER_ARCHIVED', 'cancelled', 'cancelled', ?, 'internal-v2', ?)`
          ).bind(archiveEvtId, id, archiveDetail, now)
        );
      } else if (!row.archived_at) {
        archivedCount++;
        const archiveEvtId = generateId('evt');
        const archiveDetail = JSON.stringify({ source: 'internal-v2', archiveType: 'soft-batch', environment });

        batchStatements.push(
          c.env.BOG_MENU_DB.prepare("UPDATE orders_v2 SET archived_at = ?, updated_at = ? WHERE id = ? AND status = 'cancelled' AND archived_at IS NULL").bind(now, now, id),
          c.env.BOG_MENU_DB.prepare(
            `INSERT INTO order_events_v2 (id, order_id, type, previous_status, next_status, detail_json, actor, created_at)
             VALUES (?, ?, 'ORDER_ARCHIVED', 'cancelled', 'cancelled', ?, 'internal-v2', ?)`
          ).bind(archiveEvtId, id, archiveDetail, now)
        );
      }
    }

    if (batchStatements.length > 0) {
      const batchResult = await c.env.BOG_MENU_DB.batch(batchStatements);
      if (!batchResult.every((res) => res.success)) {
        return errorResponse(500, 'INTERNAL_ERROR', 'No se pudieron archivar las órdenes en lote.');
      }
    }

    const updatedOrders: any[] = [];
    for (const id of processedIds) {
      const bundle = await fetchOrderBundle(c.env.BOG_MENU_DB, id);
      if (bundle) updatedOrders.push(bundle);
    }

    return json(200, {
      ok: true,
      data: {
        archivedCount,
        cancelledCount,
        orders: updatedOrders
      }
    });
  } catch {
    return errorResponse(500, 'INTERNAL_ERROR', 'Error al procesar el archivado en lote.');
  }
});

// PATCH /api/orders-v2-admin/:id/status
ordersAdminRouter.patch('/:id/status', async (c) => {
  if (!c.env.BOG_MENU_DB) return errorResponse(503, 'MISSING_DB', 'BOG_MENU_DB no está configurado.');
  const authError = await requireInternalOrigin(c.req.raw);
  if (authError) return authError;

  const id = c.req.param('id')?.trim() ?? '';
  if (!id) return errorResponse(400, 'INVALID_ORDER_ID', 'Order id requerido.');

  const body = await parseJsonObject(c.req.raw);
  if (!body) return errorResponse(400, 'INVALID_JSON', 'JSON inválido.');

  const status = typeof body.status === 'string' ? (body.status.trim() as OrderV2Status) : ('' as OrderV2Status);
  if (!ORDER_STATUSES.has(status)) return errorResponse(400, 'INVALID_STATUS', 'Estado inválido.');
  const reason = typeof body.reason === 'string' ? body.reason.trim() : undefined;
  if (reason && reason.length > 500) return errorResponse(400, 'INVALID_REASON', 'Razón excede el máximo permitido.');
  const environment = parseOrderEnvironment(body.environment);
  if (!environment) return errorResponse(400, 'INVALID_ENVIRONMENT', 'Ambiente de orden inválido.');

  try {
    const currentRow = await c.env.BOG_MENU_DB.prepare('SELECT * FROM orders_v2 WHERE id = ? LIMIT 1').bind(id).first<any>();
    if (!currentRow) return errorResponse(404, 'NOT_FOUND', 'Orden no encontrada.');
    const environmentError = assertOrderMatchesEnvironment(currentRow, environment);
    if (environmentError) return environmentError;
    const currentStatus = String(currentRow.status) as OrderV2Status;
    if (!validateStatusTransition(currentStatus, status)) {
      return errorResponse(400, 'INVALID_STATUS_TRANSITION', 'Transición de estado inválida.');
    }

    const now = new Date().toISOString();
    const eventId = generateId('evt');
    const auditId = generateId('aud');
    const eventType = status === 'cancelled' ? 'ORDER_CANCELLED' : 'STATUS_CHANGED';
    const detail = JSON.stringify({ reason: reason ?? '', source: 'internal-v2', environment });

    const batchQueries = [
      c.env.BOG_MENU_DB.prepare('UPDATE orders_v2 SET status = ?, updated_at = ? WHERE id = ?').bind(status, now, id),
      c.env.BOG_MENU_DB.prepare(
        `INSERT INTO order_events_v2 (id, order_id, type, previous_status, next_status, detail_json, actor, created_at)
         VALUES (?, ?, ?, ?, ?, ?, 'internal-v2', ?)`
      ).bind(eventId, id, eventType, currentStatus, status, detail, now),
      c.env.BOG_MENU_DB.prepare(
        `INSERT INTO orders_v2_audit_logs (id, order_id, action, actor, details_json, created_at)
         VALUES (?, ?, ?, 'internal-v2', ?, ?)`
      ).bind(auditId, id, `STATUS_CHANGED_${status.toUpperCase()}`, JSON.stringify({ previousStatus: currentStatus, nextStatus: status, reason: reason ?? '' }), now)
    ];

    if (status === 'cancelled') {
      const folio = String(currentRow.folio || '');
      if (folio) {
        const raffleParticipant = await c.env.BOG_MENU_DB.prepare('SELECT * FROM raffle_referral_codes_v2 WHERE referral_code = ? LIMIT 1')
          .bind(folio)
          .first<any>();

        if (raffleParticipant) {
          const adjId = generateId('adj');
          batchQueries.push(
            c.env.BOG_MENU_DB.prepare(
              `INSERT INTO raffle_ticket_adjustments_v2 (id, campaign_id, participant_key, participant_name, participant_phone_masked, tickets_delta, reason, actor, status, created_at, updated_at)
               VALUES (?, ?, ?, ?, ?, 1, ?, 'internal-v2', 'reverted', ?, ?)`
            ).bind(adjId, raffleParticipant.campaign_id, raffleParticipant.participant_key, raffleParticipant.participant_name, raffleParticipant.participant_phone_masked, `Orden ${folio} cancelada en Chekeo`, now, now)
          );
        }
      }
    }

    const batchResult = await c.env.BOG_MENU_DB.batch(batchQueries);
    if (!batchResult.every((entry) => entry.success)) return errorResponse(500, 'INTERNAL_ERROR', 'No se pudo actualizar la orden.');

    const order = await fetchOrderBundle(c.env.BOG_MENU_DB, id);
    if (!order) return errorResponse(500, 'INTERNAL_ERROR', 'No se pudo recuperar la orden actualizada.');
    const event = order.events?.find((entry) => entry.id === eventId);
    return json(200, { ok: true, data: { order, event } });
  } catch {
    return errorResponse(500, 'INTERNAL_ERROR', 'No se pudo actualizar la orden.');
  }
});

// PATCH /api/orders-v2-admin/:id/payment
ordersAdminRouter.patch('/:id/payment', async (c) => {
  if (!c.env.BOG_MENU_DB) return errorResponse(503, 'D1_NOT_CONFIGURED', 'BOG_MENU_DB no está configurado.');
  const authError = await requireInternalOrigin(c.req.raw);
  if (authError) return authError;

  const id = c.req.param('id')?.trim() ?? '';
  if (!id) return errorResponse(400, 'INVALID_ORDER_ID', 'Order id requerido.');

  const body = await parseJsonObject(c.req.raw);
  if (!body) return errorResponse(400, 'INVALID_JSON', 'JSON inválido.');

  const paymentStatus = typeof body.paymentStatus === 'string' ? (body.paymentStatus.trim() as OrderV2PaymentStatus) : ('' as OrderV2PaymentStatus);
  if (!PAYMENT_STATUSES.has(paymentStatus)) return errorResponse(400, 'INVALID_PAYMENT_STATUS', 'Payment status inválido.');

  const notes = Object.prototype.hasOwnProperty.call(body, 'notes') && typeof body.notes === 'string' ? body.notes : undefined;
  const reason = Object.prototype.hasOwnProperty.call(body, 'reason') && typeof body.reason === 'string' ? body.reason.trim() : undefined;
  const environment = parseOrderEnvironment(body.environment);
  if (!environment) return errorResponse(400, 'INVALID_ENVIRONMENT', 'Ambiente de orden inválido.');

  try {
    const currentRow = await c.env.BOG_MENU_DB.prepare('SELECT * FROM orders_v2 WHERE id = ? LIMIT 1').bind(id).first<any>();
    if (!currentRow) return errorResponse(404, 'ORDER_NOT_FOUND', 'Orden no encontrada.');
    const environmentError = assertOrderMatchesEnvironment(currentRow, environment);
    if (environmentError) return environmentError;

    const now = new Date().toISOString();
    const eventId = generateId('evt');
    const currentOrderStatus = String(currentRow.status);
    const previousPaymentStatus = String(currentRow.payment_status ?? 'pending') as OrderV2PaymentStatus;
    const notesUpdated = notes !== undefined;
    const detail = JSON.stringify({
      previousPaymentStatus,
      nextPaymentStatus: paymentStatus,
      notesUpdated,
      reason: reason ?? '',
      source: 'internal-v2',
      environment
    });

    const updateStatement = notesUpdated
      ? c.env.BOG_MENU_DB.prepare('UPDATE orders_v2 SET payment_status = ?, notes = ?, updated_at = ? WHERE id = ?').bind(paymentStatus, notes ?? '', now, id)
      : c.env.BOG_MENU_DB.prepare('UPDATE orders_v2 SET payment_status = ?, updated_at = ? WHERE id = ?').bind(paymentStatus, now, id);

    const batchResult = await c.env.BOG_MENU_DB.batch([
      updateStatement,
      c.env.BOG_MENU_DB.prepare(
        `INSERT INTO order_events_v2 (id, order_id, type, previous_status, next_status, detail_json, actor, created_at)
         VALUES (?, ?, 'PAYMENT_UPDATED', ?, ?, ?, 'internal-v2', ?)`
      ).bind(eventId, id, currentOrderStatus, currentOrderStatus, detail, now)
    ]);
    if (!batchResult.every((entry) => entry.success)) return errorResponse(500, 'PAYMENT_UPDATE_FAILED', 'No se pudo actualizar el pago operativo.');

    const order = await fetchOrderBundle(c.env.BOG_MENU_DB, id);
    if (!order) return errorResponse(500, 'PAYMENT_UPDATE_FAILED', 'No se pudo recuperar la orden actualizada.');
    const event = order.events?.find((entry) => entry.id === eventId);
    return json(200, { ok: true, data: { order, event } });
  } catch {
    return errorResponse(500, 'PAYMENT_UPDATE_FAILED', 'No se pudo actualizar el pago operativo.');
  }
});

// PATCH /api/orders-v2-admin/:id/kitchen-item
ordersAdminRouter.patch('/:id/kitchen-item', async (c) => {
  if (!c.env.BOG_MENU_DB) return errorResponse(503, 'MISSING_DB', 'BOG_MENU_DB no está configurado.');
  const authError = await requireInternalOrigin(c.req.raw);
  if (authError) return authError;

  const id = c.req.param('id')?.trim() ?? '';
  if (!id) return errorResponse(400, 'INVALID_ORDER_ID', 'Order id requerido.');

  const body = await parseJsonObject(c.req.raw);
  if (!body) return errorResponse(400, 'INVALID_JSON', 'JSON inválido.');

  const lineKey = typeof body.lineKey === 'string' ? body.lineKey.trim() : '';
  if (!lineKey) return errorResponse(400, 'INVALID_LINE_KEY', 'lineKey requerido.');

  const itemKind = typeof body.itemKind === 'string' ? (body.itemKind.trim() as UpdateKitchenItemPayload['itemKind']) : ('' as UpdateKitchenItemPayload['itemKind']);
  if (!KITCHEN_ITEM_KINDS.has(itemKind)) return errorResponse(400, 'INVALID_ITEM_KIND', 'itemKind inválido.');

  if (typeof body.done !== 'boolean') return errorResponse(400, 'INVALID_DONE', 'done debe ser boolean.');
  const environment = parseOrderEnvironment(body.environment);
  if (!environment) return errorResponse(400, 'INVALID_ENVIRONMENT', 'Ambiente de orden inválido.');

  try {
    const currentRow = await c.env.BOG_MENU_DB.prepare('SELECT status, source FROM orders_v2 WHERE id = ? LIMIT 1')
      .bind(id)
      .first<{ status: string; source: string }>();
    if (!currentRow) return errorResponse(404, 'ORDER_NOT_FOUND', 'Orden no encontrada.');
    const environmentError = assertOrderMatchesEnvironment(currentRow, environment);
    if (environmentError) return environmentError;

    const itemsResult = await c.env.BOG_MENU_DB.prepare('SELECT id, sku, name, snapshot_json FROM order_items_v2 WHERE order_id = ?')
      .bind(id)
      .all<{ id: string; sku?: string; name?: string; snapshot_json?: string | null }>();
    const itemRows = itemsResult.results ?? [];
    const snapshots = itemRows
      .map((row) => {
        const parsed = parseJsonSnapshot(row.snapshot_json ?? '');
        if (!parsed) return null;
        const fallbackKey = typeof parsed.lineKey === 'string' && parsed.lineKey ? parsed.lineKey : row.id || `${id}-${row.sku || ''}-${row.name || ''}`;
        return {
          ...parsed,
          lineKey: fallbackKey,
          rowId: row.id,
          sku: row.sku
        } as SnapshotRecord & { rowId: string; sku?: string };
      })
      .filter((snapshot): snapshot is SnapshotRecord & { rowId: string; sku?: string } => Boolean(snapshot));

    const exactSnapshot = snapshots.find(
      (snapshot) =>
        snapshot.lineKey === lineKey ||
        snapshot.rowId === lineKey ||
        (lineKey && (lineKey.includes(snapshot.rowId) || (Boolean(snapshot.sku) && lineKey.includes(snapshot.sku!))))
    );

    const isValidNested = (snapshot: SnapshotRecord) => {
      if (itemKind !== 'garnish') return false;
      const parentLineKey = getOptionalString(snapshot.lineKey);
      if (!parentLineKey) return false;
      if (lineKey === buildSideQuestLineKey(parentLineKey, 'included-garnish')) {
        return Boolean(getOptionalString(asRecord(snapshot.garnish)?.name));
      }
      if (lineKey === buildSideQuestLineKey(parentLineKey, 'included-drink')) {
        return Boolean(getOptionalString(asRecord(snapshot.includedDrink)?.name));
      }
      const extraPrefix = `${parentLineKey}${SIDE_QUEST_LINE_KEY_PREFIX}extra-`;
      if (!lineKey.startsWith(extraPrefix)) return false;
      const index = Number(lineKey.slice(extraPrefix.length));
      if (!Number.isInteger(index) || index < 0) return false;
      const extras = Array.isArray(snapshot.sideQuestExtras) ? snapshot.sideQuestExtras : [];
      const extra = asRecord(extras[index]);
      if (!extra || !getOptionalString(extra.name)) return false;
      return (getOptionalString(extra.itemKind) ?? 'garnish') === 'garnish';
    };

    const nestedSideQuestSnapshot = exactSnapshot ? undefined : snapshots.find((snapshot) => isValidNested(snapshot));
    const matchingSnapshot = exactSnapshot ?? nestedSideQuestSnapshot;

    if (!matchingSnapshot) return errorResponse(400, 'LINE_KEY_NOT_FOUND', 'lineKey no existe en los items de esta orden.');

    const now = new Date().toISOString();
    const eventId = generateId('evt');
    const eventType = body.done ? 'KITCHEN_ITEM_DONE' : 'KITCHEN_ITEM_REOPENED';
    const detail = JSON.stringify({
      lineKey,
      itemKind,
      source: 'internal-v2',
      environment
    });

    const result = await c.env.BOG_MENU_DB.prepare(
      `INSERT INTO order_events_v2 (id, order_id, type, previous_status, next_status, detail_json, actor, created_at)
       VALUES (?, ?, ?, ?, ?, ?, 'internal-v2', ?)`
    )
      .bind(eventId, id, eventType, String(currentRow.status), String(currentRow.status), detail, now)
      .run();

    if (!result.success) return errorResponse(500, 'KITCHEN_ITEM_UPDATE_FAILED', 'No se pudo actualizar el checklist de cocina.');

    const order = await fetchOrderBundle(c.env.BOG_MENU_DB, id);
    if (!order) return errorResponse(500, 'KITCHEN_ITEM_UPDATE_FAILED', 'No se pudo recuperar la orden actualizada.');
    const event = order.events?.find((entry) => entry.id === eventId);
    return json(200, { ok: true, data: { order: appendKitchenSideQuestItemsToOrder(order), event } });
  } catch {
    return errorResponse(500, 'KITCHEN_ITEM_UPDATE_FAILED', 'No se pudo actualizar el checklist de cocina.');
  }
});

// POST & PATCH /api/orders-v2-admin/:id/archive
const handleArchive = async (c: Context<AppEnv>) => {
  if (!c.env.BOG_MENU_DB) return errorResponse(503, 'MISSING_DB', 'BOG_MENU_DB no está configurado.');
  const authError = await requireAdminToken(c.req.raw, c.env);
  if (authError) return authError;

  const id = c.req.param('id')?.trim() ?? '';
  if (!id) return errorResponse(400, 'INVALID_ORDER_ID', 'Order id requerido.');
  const environment = parseOrderEnvironmentFromRequest(c.req.raw);
  if (!environment) return errorResponse(400, 'INVALID_ENVIRONMENT', 'Ambiente de orden inválido.');

  try {
    const currentRow = await c.env.BOG_MENU_DB.prepare('SELECT * FROM orders_v2 WHERE id = ? LIMIT 1').bind(id).first<any>();
    if (!currentRow) return errorResponse(404, 'NOT_FOUND', 'Orden no encontrada.');
    const environmentError = assertOrderMatchesEnvironment(currentRow, environment);
    if (environmentError) return environmentError;
    if (String(currentRow.status) !== 'cancelled') return errorResponse(400, 'ORDER_NOT_CANCELLED', 'Solo se pueden ocultar órdenes canceladas.');
    if (currentRow.archived_at) return errorResponse(409, 'ORDER_ALREADY_ARCHIVED', 'La orden cancelada ya está oculta.');

    const now = new Date().toISOString();
    const eventId = generateId('evt');
    const detail = JSON.stringify({ source: 'internal-v2', archiveType: 'soft', environment });
    const result = await c.env.BOG_MENU_DB.batch([
      c.env.BOG_MENU_DB.prepare("UPDATE orders_v2 SET archived_at = ?, updated_at = ? WHERE id = ? AND status = 'cancelled' AND archived_at IS NULL").bind(now, now, id),
      c.env.BOG_MENU_DB.prepare(
        `INSERT INTO order_events_v2 (id, order_id, type, previous_status, next_status, detail_json, actor, created_at)
         VALUES (?, ?, 'ORDER_ARCHIVED', 'cancelled', 'cancelled', ?, 'internal-v2', ?)`
      ).bind(eventId, id, detail, now)
    ]);
    if (!result.every((entry: any) => entry.success)) return errorResponse(500, 'INTERNAL_ERROR', 'No se pudo ocultar la orden cancelada.');

    const order = await fetchOrderBundle(c.env.BOG_MENU_DB, id);
    if (!order) return errorResponse(500, 'INTERNAL_ERROR', 'No se pudo recuperar la orden ocultada.');
    const event = order.events?.find((entry) => entry.id === eventId);
    return json(200, { ok: true, data: { order, event } });
  } catch {
    return errorResponse(500, 'INTERNAL_ERROR', 'No se pudo ocultar la orden cancelada.');
  }
};
ordersAdminRouter.post('/:id/archive', handleArchive);
ordersAdminRouter.patch('/:id/archive', handleArchive);

// POST & PATCH /api/orders-v2-admin/:id/unarchive
const handleUnarchive = async (c: Context<AppEnv>) => {
  if (!c.env.BOG_MENU_DB) return errorResponse(503, 'MISSING_DB', 'BOG_MENU_DB no está configurado.');
  const authError = await requireAdminToken(c.req.raw, c.env);
  if (authError) return authError;

  const id = c.req.param('id')?.trim() ?? '';
  if (!id) return errorResponse(400, 'INVALID_ORDER_ID', 'Order id requerido.');
  const environment = parseOrderEnvironmentFromRequest(c.req.raw);
  if (!environment) return errorResponse(400, 'INVALID_ENVIRONMENT', 'Ambiente de orden inválido.');

  try {
    const currentRow = await c.env.BOG_MENU_DB.prepare('SELECT * FROM orders_v2 WHERE id = ? LIMIT 1').bind(id).first<any>();
    if (!currentRow) return errorResponse(404, 'NOT_FOUND', 'Orden no encontrada.');
    const environmentError = assertOrderMatchesEnvironment(currentRow, environment);
    if (environmentError) return environmentError;
    if (!currentRow.archived_at) return errorResponse(409, 'ORDER_NOT_ARCHIVED', 'La orden no está en el basurero/oculta.');

    const now = new Date().toISOString();
    const eventId = generateId('evt');
    const detail = JSON.stringify({ source: 'internal-v2', archiveType: 'unarchive', environment });
    const currentStatus = String(currentRow.status);

    const result = await c.env.BOG_MENU_DB.batch([
      c.env.BOG_MENU_DB.prepare('UPDATE orders_v2 SET archived_at = NULL, updated_at = ? WHERE id = ? AND archived_at IS NOT NULL').bind(now, id),
      c.env.BOG_MENU_DB.prepare(
        `INSERT INTO order_events_v2 (id, order_id, type, previous_status, next_status, detail_json, actor, created_at)
         VALUES (?, ?, 'ORDER_UNARCHIVED', ?, ?, ?, 'internal-v2', ?)`
      ).bind(eventId, id, currentStatus, currentStatus, detail, now)
    ]);
    if (!result.every((entry: any) => entry.success)) return errorResponse(500, 'INTERNAL_ERROR', 'No se pudo restaurar la orden desde el basurero.');

    const order = await fetchOrderBundle(c.env.BOG_MENU_DB, id);
    if (!order) return errorResponse(500, 'INTERNAL_ERROR', 'No se pudo recuperar la orden restaurada.');
    const event = order.events?.find((entry) => entry.id === eventId);
    return json(200, { ok: true, data: { order, event } });
  } catch {
    return errorResponse(500, 'INTERNAL_ERROR', 'No se pudo restaurar la orden desde el basurero.');
  }
};
ordersAdminRouter.post('/:id/unarchive', handleUnarchive);
ordersAdminRouter.patch('/:id/unarchive', handleUnarchive);
