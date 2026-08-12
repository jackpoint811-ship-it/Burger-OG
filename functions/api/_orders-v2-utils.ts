import {
  TERMINAL_STATUSES,
  type OrderV2,
  type OrderV2DeliveryInfo,
  type OrderV2Environment,
  type OrderV2Event,
  type OrderV2Item,
  type OrderV2Source,
  type OrderV2Status
} from '../../packages/config/src';

export type ErrorEnvelope = { ok: false; error: { code: string; message: string } };
export type AdminEnv = { BOG_MENU_DB?: D1Database; BOG_INTERNAL_PIN?: string };

export { TERMINAL_STATUSES };
const STATUS_TRANSITIONS: Record<OrderV2Status, OrderV2Status[]> = {
  new: ['preparing', 'cancelled'],
  preparing: ['ready', 'cancelled'],
  ready: ['preparing', 'delivered', 'cancelled'],
  delivered: [],
  cancelled: []
};

export const json = (status: number, payload: unknown) =>
  new Response(JSON.stringify(payload), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' }
  });

export const errorResponse = (status: number, code: string, message: string) => json(status, { ok: false, error: { code, message } });

export const PUBLIC_ORDER_SOURCE = 'public-v2' satisfies OrderV2Source;
export const PREVIEW_ORDER_SOURCE = 'public-v2-preview' satisfies OrderV2Source;
export const ORDER_SOURCE_BY_ENVIRONMENT: Record<OrderV2Environment, typeof PUBLIC_ORDER_SOURCE | typeof PREVIEW_ORDER_SOURCE> = {
  production: PUBLIC_ORDER_SOURCE,
  preview: PREVIEW_ORDER_SOURCE
};

export const parseOrderEnvironment = (value: unknown, fallback: OrderV2Environment = 'production'): OrderV2Environment | null => {
  const normalized = typeof value === 'string' ? value.trim().toLowerCase() : '';
  if (!normalized) return fallback;
  if (normalized === 'production' || normalized === 'prod') return 'production';
  if (normalized === 'preview' || normalized === 'test') return 'preview';
  return null;
};

export const parseOrderEnvironmentFromRequest = (request: Request, fallback: OrderV2Environment = 'production'): OrderV2Environment | null => {
  const url = new URL(request.url);
  return parseOrderEnvironment(
    url.searchParams.get('environment') ?? url.searchParams.get('env') ?? request.headers.get('X-BOG-Order-Environment'),
    fallback
  );
};

export const getOrderSourceForEnvironment = (environment: OrderV2Environment) => ORDER_SOURCE_BY_ENVIRONMENT[environment];

export const getOrderEnvironmentFromSource = (source: unknown): OrderV2Environment =>
  String(source) === PREVIEW_ORDER_SOURCE ? 'preview' : 'production';

export const buildOrderEnvironmentCondition = (
  environment: OrderV2Environment,
  alias = ''
): { condition: string; binding: string } => ({
  condition: `${alias ? `${alias}.` : ''}source = ?`,
  binding: getOrderSourceForEnvironment(environment)
});

export const assertOrderMatchesEnvironment = (
  row: { source?: unknown },
  environment: OrderV2Environment
): Response | null => {
  const expectedSource = getOrderSourceForEnvironment(environment);
  if (String(row.source) === expectedSource) return null;
  return errorResponse(409, 'ENVIRONMENT_MISMATCH', 'La orden pertenece a otro ambiente operativo.');
};

export const parseJsonObject = async (request: Request): Promise<Record<string, unknown> | null> => {
  try {
    const parsed = await request.json();
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return null;
    return parsed as Record<string, unknown>;
  } catch {
    return null;
  }
};

export const centsToPrice = (cents: unknown): number => {
  const value = Number(cents);
  return Number.isFinite(value) ? value / 100 : 0;
};

export const priceToCents = (price: unknown): number => {
  const value = Number(price);
  return Number.isFinite(value) ? Math.round(value * 100) : 0;
};

const FOLIO_EPOCH_UTC_MS = Date.UTC(2026, 0, 1);
const MS_PER_DAY = 24 * 60 * 60 * 1000;

const randomFolioSuffix = () => {
  const bytes = new Uint8Array(3);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => (byte % 36).toString(36).toUpperCase()).join('');
};

export const generateId = (prefix: 'ord' | 'oi' | 'evt' | string) => `${prefix}_${crypto.randomUUID()}`;

export const generateFolio = (now = new Date(), customLetter?: string) => {
  // Format: PB-[A-Z][0-9]{4} (e.g. PB-C0005)
  const letterCode = customLetter
    ? customLetter.toUpperCase()
    : String.fromCharCode(65 + (Math.floor(now.getTime() / (24 * 60 * 60 * 1000)) % 26));

  const randomBytes = new Uint16Array(1);
  crypto.getRandomValues(randomBytes);
  const numberCode = String(randomBytes[0] % 10000).padStart(4, '0');

  return `PB-${letterCode}${numberCode}`;
};

export const generatePreviewFolio = (now = new Date(), customLetter?: string) => generateFolio(now, customLetter);

export const normalizePhone = (value: unknown) => {
  const digits = String(value ?? '').replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('52')) {
    return digits.slice(2);
  }
  return digits;
};

export const parseJsonDetail = (value: unknown): Record<string, unknown> | undefined => {
  if (typeof value !== 'string' || !value.trim()) return undefined;
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed as Record<string, unknown> : undefined;
  } catch {
    return undefined;
  }
};

export const parseJsonSnapshot = (value: unknown): Record<string, unknown> | undefined => parseJsonDetail(value);

export type FormattedCustomizationSummary = {
  lines: string[];
  summaryText: string;
  hasCustomizations: boolean;
};

export const buildFormattedCustomizationSummary = (snapshot: Record<string, unknown> | undefined): FormattedCustomizationSummary => {
  if (!snapshot) return { lines: [], summaryText: '', hasCustomizations: false };

  const lines: string[] = [];

  // 1. Single burger / item removed ingredients
  if (Array.isArray(snapshot.removedIngredients) && snapshot.removedIngredients.length > 0) {
    for (const ing of snapshot.removedIngredients) {
      if (typeof ing === 'string' && ing.trim()) {
        lines.push(`❌ SIN ${ing.trim()}`);
      }
    }
  }

  // 2. Single burger / item extras
  if (Array.isArray(snapshot.extras) && snapshot.extras.length > 0) {
    for (const ext of snapshot.extras) {
      if (ext && typeof ext === 'object') {
        const rawExt = ext as Record<string, unknown>;
        const name = typeof rawExt.name === 'string' ? rawExt.name.trim() : '';
        const price = Number(rawExt.price);
        if (name) {
          lines.push(`➕ EXTRA ${name}${Number.isFinite(price) && price > 0 ? ` (+$${price})` : ''}`);
        }
      }
    }
  }

  // 3. Single burger note
  if (typeof snapshot.burgerNote === 'string' && snapshot.burgerNote.trim()) {
    lines.push(`📝 NOTA: ${snapshot.burgerNote.trim()}`);
  }

  // 4. Combo burgers breakdown
  if (Array.isArray(snapshot.comboBurgers) && snapshot.comboBurgers.length > 0) {
    snapshot.comboBurgers.forEach((cb: unknown, idx: number) => {
      if (!cb || typeof cb !== 'object') return;
      const rawCb = cb as Record<string, unknown>;
      const bName = typeof rawCb.name === 'string' && rawCb.name.trim() ? rawCb.name.trim() : `Hamburguesa ${idx + 1}`;
      lines.push(`🍔 Burger ${idx + 1}: ${bName}`);
      if (Array.isArray(rawCb.removedIngredients) && rawCb.removedIngredients.length > 0) {
        rawCb.removedIngredients.forEach((ing: unknown) => {
          if (typeof ing === 'string' && ing.trim()) lines.push(`   • ❌ SIN ${ing.trim()}`);
        });
      }
      if (Array.isArray(rawCb.extras) && rawCb.extras.length > 0) {
        rawCb.extras.forEach((ext: unknown) => {
          if (!ext || typeof ext !== 'object') return;
          const rawExt = ext as Record<string, unknown>;
          const name = typeof rawExt.name === 'string' ? rawExt.name.trim() : '';
          const price = Number(rawExt.price);
          if (name) lines.push(`   • ➕ EXTRA ${name}${Number.isFinite(price) && price > 0 ? ` (+$${price})` : ''}`);
        });
      }
      if (typeof rawCb.burgerNote === 'string' && rawCb.burgerNote.trim()) {
        lines.push(`   • 📝 NOTA: ${rawCb.burgerNote.trim()}`);
      }
    });
  }

  // 5. Garnish
  if (snapshot.garnish && typeof snapshot.garnish === 'object') {
    const g = snapshot.garnish as Record<string, unknown>;
    const gName = typeof g.name === 'string' ? g.name.trim() : '';
    const upcharge = Number(g.upcharge);
    if (gName) {
      lines.push(`🍟 Acompañamiento: ${gName}${Number.isFinite(upcharge) && upcharge > 0 ? ` (+$${upcharge})` : ''}`);
    }
  }

  // 6. Included drink
  if (snapshot.includedDrink && typeof snapshot.includedDrink === 'object') {
    const d = snapshot.includedDrink as Record<string, unknown>;
    const dName = typeof d.name === 'string' ? d.name.trim() : '';
    if (dName) {
      lines.push(`🥤 Bebida: ${dName}`);
    }
  }

  // 7. SideQuest Extras
  if (Array.isArray(snapshot.sideQuestExtras) && snapshot.sideQuestExtras.length > 0) {
    for (const sq of snapshot.sideQuestExtras) {
      if (sq && typeof sq === 'object') {
        const rawSq = sq as Record<string, unknown>;
        const name = typeof rawSq.name === 'string' ? rawSq.name.trim() : '';
        const price = Number(rawSq.price);
        if (name) {
          lines.push(`➕ EXTRA ${name}${Number.isFinite(price) && price > 0 ? ` (+$${price})` : ''}`);
        }
      }
    }
  }

  return {
    lines,
    summaryText: lines.join(' | '),
    hasCustomizations: lines.length > 0
  };
};

export const mapD1OrderItemToOrderV2Item = (row: any): OrderV2Item => {
  const snapshot = parseJsonSnapshot(row.snapshot_json ?? row.snapshotJson);
  const formatted = buildFormattedCustomizationSummary(snapshot);
  const enrichedSnapshot = snapshot
    ? {
        ...snapshot,
        formattedCustomizationLines: formatted.lines,
        formattedSummaryText: formatted.summaryText,
        hasCustomizations: formatted.hasCustomizations
      }
    : undefined;

  const modifiers = Array.isArray(snapshot?.modifiers) ? (snapshot.modifiers as OrderV2Item['modifiers']) : undefined;
  const components = Array.isArray(snapshot?.components) ? (snapshot.components as OrderV2Item['components']) : undefined;

  return {
    id: String(row.id),
    orderId: String(row.order_id ?? row.orderId),
    sku: String(row.sku),
    name: String(row.name),
    qty: Number(row.qty),
    unitPrice: centsToPrice(row.unit_price_cents ?? row.unitPriceCents),
    lineTotal: centsToPrice(row.line_total_cents ?? row.lineTotalCents),
    modifiers,
    components,
    snapshot: enrichedSnapshot,
    createdAt: row.created_at ?? row.createdAt ? String(row.created_at ?? row.createdAt) : undefined
  };
};

export const mapD1OrderEventToOrderV2Event = (row: any): OrderV2Event => ({
  id: String(row.id),
  orderId: String(row.order_id ?? row.orderId),
  type: String(row.type),
  previousStatus: row.previous_status ?? row.previousStatus ? String(row.previous_status ?? row.previousStatus) as OrderV2Status : undefined,
  nextStatus: row.next_status ?? row.nextStatus ? String(row.next_status ?? row.nextStatus) as OrderV2Status : undefined,
  detail: parseJsonDetail(row.detail_json ?? row.detailJson),
  actor: String(row.actor ?? 'system'),
  createdAt: String(row.created_at ?? row.createdAt)
});

export const mapD1OrderToOrderV2 = (row: any, items: OrderV2Item[] = [], events?: OrderV2Event[]): OrderV2 => {
  let delivery: OrderV2DeliveryInfo | undefined;
  if (row.delivery_json || row.deliveryJson) {
    try {
      delivery = JSON.parse(row.delivery_json ?? row.deliveryJson);
    } catch {}
  }
  const rawCustomerName = String(row.customer_name ?? row.customerName);
  if (!delivery && rawCustomerName) {
    const scheduledMatch = rawCustomerName.match(/ENTREGA PROGRAMADA:\s*(\d{4}-\d{2}-\d{2})/i);
    if (scheduledMatch) {
      delivery = {
        location: rawCustomerName.replace(/\[?ENTREGA PROGRAMADA:[^\]]+\]?/gi, '').trim(),
        isScheduled: true,
        scheduledDate: scheduledMatch[1],
      };
    }
  }

  if (!delivery && items.length > 0) {
    for (const item of items) {
      const itemDelivery = (item.snapshot as any)?.delivery as OrderV2DeliveryInfo | undefined;
      if (itemDelivery && (itemDelivery.location || itemDelivery.scheduledDate || itemDelivery.isScheduled)) {
        delivery = itemDelivery;
        break;
      }
    }
  }

  const cleanName = rawCustomerName.replace(/\[?ENTREGA PROGRAMADA:[^\]]+\]?/gi, '').trim();

  return {
    id: String(row.id),
    folio: String(row.folio),
    customerName: cleanName,
    customerPhone: String(row.customer_phone ?? row.customerPhone),
    delivery,
    orderMode: String(row.order_mode ?? row.orderMode) as OrderV2['orderMode'],
    paymentMethod: String(row.payment_method ?? row.paymentMethod) as OrderV2['paymentMethod'],
    paymentStatus: String(row.payment_status ?? row.paymentStatus) as OrderV2['paymentStatus'],
    notes: row.notes ? String(row.notes) : undefined,
    subtotal: centsToPrice(row.subtotal_cents ?? row.subtotalCents),
    total: centsToPrice(row.total_cents ?? row.totalCents),
    status: String(row.status) as OrderV2Status,
    source: String(row.source) as OrderV2['source'],
    createdAt: String(row.created_at ?? row.createdAt),
    updatedAt: String(row.updated_at ?? row.updatedAt),
    archivedAt: row.archived_at ?? row.archivedAt ? String(row.archived_at ?? row.archivedAt) : undefined,
    items,
    events
  };
};

export const validateStatusTransition = (current: OrderV2Status, next: OrderV2Status): boolean => {
  if (TERMINAL_STATUSES.has(current)) return false;
  return STATUS_TRANSITIONS[current]?.includes(next) ?? false;
};

const safeEqual = (left: string, right: string): boolean => {
  if (left.length !== right.length) return false;
  let result = 0;
  for (let i = 0; i < left.length; i += 1) result |= left.charCodeAt(i) ^ right.charCodeAt(i);
  return result === 0;
};

export const INTERNAL_SESSION_COOKIE = 'bog_internal_session';
export const INTERNAL_SESSION_MAX_AGE_SECONDS = 60 * 60 * 12;

const textEncoder = new TextEncoder();

const base64UrlEncode = (input: ArrayBuffer | Uint8Array | string): string => {
  const bytes =
    typeof input === 'string'
      ? textEncoder.encode(input)
      : input instanceof Uint8Array
        ? input
        : new Uint8Array(input);
  let binary = '';
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
};

const parseCookieHeader = (cookieHeader: string | null): Record<string, string> => {
  if (!cookieHeader) return {};
  return cookieHeader.split(';').reduce<Record<string, string>>((cookies, part) => {
    const [rawName, ...rawValue] = part.trim().split('=');
    if (!rawName) return cookies;
    cookies[rawName] = rawValue.join('=');
    return cookies;
  }, {});
};

const getSessionSecret = (env: AdminEnv): string => (env.BOG_INTERNAL_PIN || '').trim();

export const hasInternalAuthSecret = (env: AdminEnv): boolean => Boolean(getSessionSecret(env));

const getHmacKey = async (secret: string) =>
  crypto.subtle.importKey('raw', textEncoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);

const signSessionPayload = async (payload: string, secret: string): Promise<string> => {
  const key = await getHmacKey(secret);
  const signature = await crypto.subtle.sign('HMAC', key, textEncoder.encode(payload));
  return base64UrlEncode(signature);
};

export const createInternalSessionValue = async (env: AdminEnv, now = Date.now()): Promise<string | null> => {
  const secret = getSessionSecret(env);
  if (!secret) return null;
  const expiresAt = now + INTERNAL_SESSION_MAX_AGE_SECONDS * 1000;
  const payload = base64UrlEncode(JSON.stringify({ exp: expiresAt, nonce: crypto.randomUUID() }));
  const signature = await signSessionPayload(payload, secret);
  return `${payload}.${signature}`;
};

export const verifyInternalSessionValue = async (value: string, env: AdminEnv, now = Date.now()): Promise<boolean> => {
  const secret = getSessionSecret(env);
  if (!secret) return false;
  const [payload, signature] = value.split('.');
  if (!payload || !signature) return false;
  const expectedSignature = await signSessionPayload(payload, secret);
  if (!safeEqual(signature, expectedSignature)) return false;
  try {
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
    const decoded = atob(normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '='));
    const parsed = JSON.parse(decoded) as { exp?: unknown };
    return typeof parsed.exp === 'number' && Number.isFinite(parsed.exp) && parsed.exp > now;
  } catch {
    return false;
  }
};

export const buildInternalSessionCookie = (request: Request, value: string, maxAge = INTERNAL_SESSION_MAX_AGE_SECONDS): string => {
  const url = new URL(request.url);
  const secure = url.protocol === 'https:' ? '; Secure' : '';
  return `${INTERNAL_SESSION_COOKIE}=${value}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${maxAge}${secure}`;
};

export const buildExpiredInternalSessionCookie = (request: Request): string => {
  const url = new URL(request.url);
  const secure = url.protocol === 'https:' ? '; Secure' : '';
  return `${INTERNAL_SESSION_COOKIE}=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0${secure}`;
};

export const hasValidInternalSession = async (request: Request, env: AdminEnv): Promise<boolean> => {
  const session = parseCookieHeader(request.headers.get('Cookie'))[INTERNAL_SESSION_COOKIE];
  return session ? verifyInternalSessionValue(session, env) : false;
};

const isSameOriginRequest = (request: Request): boolean => {
  const origin = request.headers.get('Origin');
  if (!origin) return true;
  try {
    return origin === new URL(request.url).origin;
  } catch {
    return false;
  }
};

export const requireAdminToken = async (request: Request, env: AdminEnv): Promise<Response | null> => {
  const sessionSecret = getSessionSecret(env);
  if (!sessionSecret) return errorResponse(503, 'AUTH_NOT_CONFIGURED', 'Internal auth is not configured.');
  if (!isSameOriginRequest(request)) return errorResponse(401, 'UNAUTHORIZED', 'Unauthorized.');
  if (await hasValidInternalSession(request, env)) return null;
  return errorResponse(401, 'UNAUTHORIZED', 'Unauthorized.');
};

export const requireInternalOrigin = async (request: Request): Promise<Response | null> => {
  if (!isSameOriginRequest(request)) return errorResponse(401, 'UNAUTHORIZED', 'Unauthorized.');
  return null;
};

export const fetchOrderBundle = async (db: D1Database, orderId: string): Promise<OrderV2 | null> => {
  const orderRow = await db.prepare('SELECT * FROM orders_v2 WHERE id = ? LIMIT 1').bind(orderId).first();
  if (!orderRow) return null;
  const [itemsResult, eventsResult] = await Promise.all([
    db.prepare('SELECT * FROM order_items_v2 WHERE order_id = ? ORDER BY created_at ASC').bind(orderId).all(),
    db.prepare('SELECT * FROM order_events_v2 WHERE order_id = ? ORDER BY created_at ASC').bind(orderId).all()
  ]);
  return mapD1OrderToOrderV2(
    orderRow,
    (itemsResult.results ?? []).map(mapD1OrderItemToOrderV2Item),
    (eventsResult.results ?? []).map(mapD1OrderEventToOrderV2Event)
  );
};
