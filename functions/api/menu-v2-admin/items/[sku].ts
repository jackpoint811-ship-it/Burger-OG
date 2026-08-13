import { validateAssetKey, validateImageUrl } from '../../_asset-utils';
import { mapD1ItemToMenuItem } from '../../_menu-v2-utils';
import { requireAdminToken, type AdminEnv } from '../../_orders-v2-utils';

type Env = AdminEnv;

type UpdatePayload = {
  name: string;
  description: string;
  price: number;
  promoPriceCents: number | null;
  isPromoActive: boolean;
  promoExpiresAt: string | null;
  comboConfigJson: string | null;
  isAvailable: boolean;
  isFeatured: boolean;
  badge: string | null;
  promoLabel: string | null;
  sortOrder: number;
  imageUrl: string | null;
  imageKey: string | null;
  stockManaged: boolean;
  stockLimit: number | null;
  stockRemaining: number | null;
  comboLinks: string[];
};

const json = (status: number, payload: unknown) =>
  new Response(JSON.stringify(payload), { status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' } });

const normalizeLinkArray = (value: unknown): string[] | null => {
  if (!Array.isArray(value)) return null;
  const links = value
    .map((entry) => (typeof entry === 'string' ? entry.trim().toUpperCase() : ''))
    .filter((entry) => entry.length > 0);
  return [...new Set(links)];
};

const normalizeOptionalString = (value: unknown): string | null => {
  if (value == null) return null;
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const parseBody = (input: unknown): UpdatePayload | null => {
  if (!input || typeof input !== 'object') return null;
  const body = input as Record<string, unknown>;
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const description = typeof body.description === 'string' ? body.description.trim() : '';
  const price = typeof body.price === 'number' ? body.price : Number.NaN;
  const isAvailable = body.isAvailable;
  const isFeatured = body.isFeatured;
  const sortOrder = typeof body.sortOrder === 'number' ? body.sortOrder : Number.NaN;
  const imageUrl = validateImageUrl(body.imageUrl);
  const imageKey = validateAssetKey(body.imageKey);
  const comboLinks = normalizeLinkArray(body.comboLinks);

  const stockManaged = Boolean(body.stockManaged);
  const stockRemainingRaw = body.stockRemaining == null || body.stockRemaining === '' ? null : Number(body.stockRemaining);
  const stockLimitRaw = body.stockLimit == null || body.stockLimit === '' ? stockRemainingRaw : Number(body.stockLimit);

  const promoPriceRaw = body.promoPrice == null || body.promoPrice === '' ? null : Number(body.promoPrice);
  const promoPriceCents = promoPriceRaw != null && Number.isFinite(promoPriceRaw) && promoPriceRaw >= 0 ? Math.round(promoPriceRaw * 100) : null;
  const isPromoActive = Boolean(body.isPromoActive);
  const promoExpiresAt = normalizeOptionalString(body.promoExpiresAt);
  const comboConfigJson = body.comboConfig ? JSON.stringify(body.comboConfig) : null;

  if (!name || typeof description !== 'string' || !Number.isFinite(price) || price < 0 || !Number.isInteger(sortOrder) || typeof isAvailable !== 'boolean' || typeof isFeatured !== 'boolean' || imageUrl === undefined || imageKey === undefined || comboLinks === null) {
    return null;
  }
  if (stockManaged && (stockRemainingRaw == null || !Number.isInteger(stockRemainingRaw) || stockRemainingRaw < 0)) return null;
  if (stockLimitRaw != null && (!Number.isInteger(stockLimitRaw) || stockLimitRaw < 0)) return null;

  return {
    name,
    description,
    price,
    promoPriceCents,
    isPromoActive,
    promoExpiresAt,
    comboConfigJson,
    isAvailable,
    isFeatured,
    badge: normalizeOptionalString(body.badge),
    promoLabel: normalizeOptionalString(body.promoLabel),
    sortOrder,
    imageUrl,
    imageKey,
    stockManaged,
    stockLimit: stockManaged ? stockLimitRaw : null,
    stockRemaining: stockManaged ? stockRemainingRaw : null,
    comboLinks
  };
};

export const onRequestPatch: PagesFunction<Env> = async ({ env, params, request }) => {
  if (!env.BOG_MENU_DB) return json(503, { ok: false, error: 'Admin disabled' });
  const authError = await requireAdminToken(request, env);
  if (authError) return authError;

  const sku = String(params.sku ?? '').trim();
  if (!sku) return json(400, { ok: false, error: 'Invalid SKU' });

  let raw: any;
  try {
    raw = await request.json();
  } catch {
    return json(400, { ok: false, error: 'Invalid payload' });
  }

  if (!raw || typeof raw !== 'object') return json(400, { ok: false, error: 'Invalid payload' });

  // Fetch existing item to support partial updates
  const existing = await env.BOG_MENU_DB.prepare(
    `SELECT sku, category_key AS category, name, description, price_cents AS priceCents, promo_price_cents AS promoPriceCents, is_promo_active AS isPromoActive, promo_expires_at AS promoExpiresAt, combo_config_json AS comboConfigJson, is_available AS isAvailable, COALESCE(is_hidden, 0) AS isHidden, is_featured AS isFeatured, badge, promo_label AS promoLabel, sort_order AS sortOrder, image_url AS imageUrl, image_key AS imageKey, stock_managed AS stockManaged, stock_limit AS stockLimit, stock_remaining AS stockRemaining, combo_links_json AS comboLinksJson FROM menu_items WHERE sku = ? LIMIT 1`
  )
    .bind(sku)
    .first<any>();

  if (!existing) return json(404, { ok: false, error: 'Item not found' });

  // Merge incoming payload with existing fields
  const name = raw.name !== undefined ? String(raw.name).trim() : String(existing.name);
  const description = raw.description !== undefined ? String(raw.description).trim() : String(existing.description);
  
  const priceVal = raw.price !== undefined ? Number(raw.price) : existing.priceCents / 100;
  const priceCents = Math.round(priceVal * 100);

  const promoPriceRaw = raw.promoPrice !== undefined ? (raw.promoPrice === null || raw.promoPrice === '' ? null : Number(raw.promoPrice)) : null;
  const promoPriceCents = raw.promoPrice !== undefined ? (promoPriceRaw != null && Number.isFinite(promoPriceRaw) && promoPriceRaw >= 0 ? Math.round(promoPriceRaw * 100) : null) : existing.promoPriceCents;
  const isPromoActive = raw.isPromoActive !== undefined ? (raw.isPromoActive ? 1 : 0) : Boolean(existing.isPromoActive) ? 1 : 0;
  const promoExpiresAt = raw.promoExpiresAt !== undefined ? normalizeOptionalString(raw.promoExpiresAt) : existing.promoExpiresAt;
  const promoLabel = raw.promoLabel !== undefined ? normalizeOptionalString(raw.promoLabel) : existing.promoLabel;

  const comboConfigJson = raw.comboConfig !== undefined ? (raw.comboConfig ? JSON.stringify(raw.comboConfig) : null) : existing.comboConfigJson;
  const isAvailable = raw.isAvailable !== undefined ? (raw.isAvailable ? 1 : 0) : Boolean(existing.isAvailable) ? 1 : 0;
  const isHidden = raw.isHidden !== undefined ? (raw.isHidden ? 1 : 0) : Boolean(existing.isHidden) ? 1 : 0;
  const isFeatured = raw.isFeatured !== undefined ? (raw.isFeatured ? 1 : 0) : Boolean(existing.isFeatured) ? 1 : 0;
  const badge = raw.badge !== undefined ? normalizeOptionalString(raw.badge) : existing.badge;
  const sortOrder = raw.sortOrder !== undefined ? Number(raw.sortOrder) : Number(existing.sortOrder);

  const imageUrl = raw.imageUrl !== undefined ? validateImageUrl(raw.imageUrl) : existing.imageUrl;
  const imageKey = raw.imageKey !== undefined ? validateAssetKey(raw.imageKey) : existing.imageKey;

  const stockManaged = raw.stockManaged !== undefined ? (raw.stockManaged ? 1 : 0) : Boolean(existing.stockManaged) ? 1 : 0;
  const stockRemaining = raw.stockRemaining !== undefined ? (raw.stockRemaining == null ? null : Number(raw.stockRemaining)) : existing.stockRemaining;
  const stockLimit = raw.stockLimit !== undefined ? (raw.stockLimit == null ? null : Number(raw.stockLimit)) : existing.stockLimit;

  let comboLinksJson = existing.comboLinksJson;
  if (raw.comboLinks !== undefined) {
    const links = normalizeLinkArray(raw.comboLinks);
    comboLinksJson = JSON.stringify(links ?? []);
  }

  const soldOutAt = stockManaged && (stockRemaining ?? 0) <= 0 ? new Date().toISOString() : null;

  const updateResult = await env.BOG_MENU_DB.prepare(
    `UPDATE menu_items
     SET name = ?, description = ?, price_cents = ?, promo_price_cents = ?, is_promo_active = ?, promo_expires_at = ?, combo_config_json = ?, is_available = ?, is_hidden = ?, is_featured = ?, badge = ?, promo_label = ?, sort_order = ?, image_url = ?, image_key = ?, combo_links_json = ?, stock_managed = ?, stock_limit = ?, stock_remaining = ?, sold_out_at = ?, updated_at = CURRENT_TIMESTAMP
     WHERE sku = ?`
  )
    .bind(name, description, priceCents, promoPriceCents, isPromoActive, promoExpiresAt, comboConfigJson, isAvailable, isHidden, isFeatured, badge, promoLabel, sortOrder, imageUrl, imageKey, comboLinksJson, stockManaged, stockLimit, stockRemaining, soldOutAt, sku)
    .run();

  if (!updateResult.success) return json(500, { ok: false, error: 'Database update failed' });

  const updatedRow = await env.BOG_MENU_DB.prepare(
    `SELECT sku, category_key AS category, name, description, price_cents AS price, tags_json, badge, promo_label AS promoLabel, promo_price_cents AS promoPriceCents, is_promo_active AS isPromoActive, promo_expires_at AS promoExpiresAt, combo_config_json AS comboConfig, is_available AS isAvailable, COALESCE(is_hidden, 0) AS isHidden,
            CASE WHEN stock_managed = 1 AND COALESCE(stock_remaining, 0) <= 0 THEN 0 ELSE is_available END AS effectiveIsAvailable,
            stock_managed AS stockManaged, stock_limit AS stockLimit, stock_remaining AS stockRemaining, sold_out_at AS soldOutAt,
            is_featured AS isFeatured, sort_order AS sortOrder, image_url AS imageUrl, image_key AS imageKey, combo_links_json, upsell_items_json, updated_at AS updatedAt FROM menu_items WHERE sku = ? LIMIT 1`
  )
    .bind(sku)
    .first();

  if (!updatedRow) return json(404, { ok: false, error: 'Item not found after update' });

  return json(200, { ok: true, item: mapD1ItemToMenuItem(updatedRow) });
};

export const onRequestDelete: PagesFunction<Env> = async ({ env, params, request }) => {
  if (!env.BOG_MENU_DB) return json(503, { ok: false, error: 'Admin disabled' });
  const authError = await requireAdminToken(request, env);
  if (authError) return authError;

  const sku = String(params.sku ?? '').trim();
  if (!sku) return json(400, { ok: false, error: 'SKU inválido' });

  const existing = await env.BOG_MENU_DB.prepare('SELECT sku FROM menu_items WHERE sku = ? LIMIT 1').bind(sku).first();
  if (!existing) return json(404, { ok: false, error: 'Producto no encontrado' });

  try {
    await env.BOG_MENU_DB.prepare('DELETE FROM product_ingredient_recipes_v2 WHERE product_sku = ?').bind(sku).run();
  } catch (e) {
    console.error('Error al limpiar recetas vinculadas:', e);
  }

  const deleteResult = await env.BOG_MENU_DB.prepare('DELETE FROM menu_items WHERE sku = ?').bind(sku).run();
  if (!deleteResult.success) return json(500, { ok: false, error: 'No se pudo eliminar el producto de la base de datos' });

  return json(200, { ok: true, sku });
};
