import { Hono, type Context } from 'hono';
import type { AppEnv } from '../_types';
import type { MenuCategory, PublicConfig } from '../../../packages/config/src';
import { normalizeAssetKey, validateAssetKey, validateImageUrl } from '../_asset-utils';
import {
  DEFAULT_CATALOG_BANNERS,
  mapD1CatalogBanner,
  mapD1CategoryBanner,
  mapD1ItemToMenuItem,
  mapD1PromoToPromoCard
} from '../_menu-v2-utils';
import { generateId, requireAdminToken } from '../_orders-v2-utils';

export const menuAdminRouter = new Hono<AppEnv>();

const CATEGORIES = new Set<MenuCategory['key']>(['burgers', 'combos', 'guarniciones', 'drinks', 'extras']);
const SKU_PATTERN = /^[A-Z0-9][A-Z0-9-]{1,48}[A-Z0-9]$/;
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/avif']);
const EXTENSIONS_BY_TYPE: Record<string, string[]> = {
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/webp': ['.webp'],
  'image/avif': ['.avif']
};
const GENERATED_EXTENSION_BY_TYPE: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/avif': 'avif'
};

const ITEM_SELECT =
  `SELECT sku, category_key AS category, name, description, price_cents AS price, tags_json, badge, promo_label AS promoLabel, promo_price_cents AS promoPriceCents, is_promo_active AS isPromoActive, promo_expires_at AS promoExpiresAt, combo_config_json AS comboConfig, is_available AS isAvailable, COALESCE(is_hidden, 0) AS isHidden,
          CASE WHEN stock_managed = 1 AND COALESCE(stock_remaining, 0) <= 0 THEN 0 ELSE is_available END AS effectiveIsAvailable,
          stock_managed AS stockManaged, stock_limit AS stockLimit, stock_remaining AS stockRemaining, sold_out_at AS soldOutAt,
          is_featured AS isFeatured, sort_order AS sortOrder, image_url AS imageUrl, image_key AS imageKey, combo_links_json, upsell_items_json, updated_at AS updatedAt
   FROM menu_items WHERE sku = ? LIMIT 1`;

const PROMO_SELECT =
  'SELECT id, title, description, badge, promo_label AS promoLabel, is_featured AS isFeatured, is_available AS isAvailable, sort_order AS sortOrder, tags_json, combo_links_json, asset_alt, asset_placeholder, asset_image_url, asset_image_key, asset_image_key AS imageKey, updated_at AS updatedAt FROM promo_cards WHERE id = ? LIMIT 1';

const BANNER_SELECT =
  'SELECT category_key AS categoryKey, title, subtitle, image_key AS imageKey, image_url AS imageUrl, updated_at AS updatedAt FROM menu_category_banners WHERE category_key = ? LIMIT 1';

const json = (status: number, payload: unknown) =>
  new Response(JSON.stringify(payload), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' }
  });

const normalizeLinkArray = (value: unknown): string[] | null => {
  if (!Array.isArray(value)) return null;
  const links = value.map((entry) => (typeof entry === 'string' ? entry.trim().toUpperCase() : '')).filter((entry) => entry.length > 0);
  return [...new Set(links)];
};

const normalizeOptionalString = (value: unknown): string | null => {
  if (value == null) return null;
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const normalizeSku = (value: unknown) =>
  typeof value === 'string'
    ? value
        .trim()
        .toUpperCase()
        .replace(/[^A-Z0-9-]+/g, '-')
        .replace(/-{2,}/g, '-')
        .replace(/^-|-$/g, '')
    : '';

const timestampForKey = (date = new Date()): string => date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
const encodeAssetUrl = (key: string): string => `/api/assets-v2/${key.split('/').map((segment) => encodeURIComponent(segment)).join('/')}`;

const getSafeFileExtension = (file: File): string | null => {
  const type = file.type.trim().toLowerCase();
  if (!ALLOWED_IMAGE_TYPES.has(type)) return null;
  const fileName = file.name.trim().toLowerCase();
  if (!fileName || fileName.startsWith('data:') || fileName.includes('\0')) return null;
  if (fileName.includes('/') || fileName.includes('\\') || fileName.includes('..')) return null;
  const allowedExtensions = EXTENSIONS_BY_TYPE[type] ?? [];
  if (!allowedExtensions.some((extension) => fileName.endsWith(extension))) return null;
  return GENERATED_EXTENSION_BY_TYPE[type] ?? null;
};

// -------------------------------------------------------------
// ITEMS
// -------------------------------------------------------------

// GET /api/menu-v2-admin/items
menuAdminRouter.get('/items', async (c) => {
  if (!c.env.BOG_MENU_DB) return json(503, { ok: false, error: 'Admin disabled' });
  const authError = await requireAdminToken(c.req.raw, c.env);
  if (authError) return authError;

  const result = await c.env.BOG_MENU_DB.prepare(
    `SELECT sku, category_key AS category, name, description, price_cents AS price, tags_json, badge, promo_label AS promoLabel, promo_price_cents AS promoPriceCents, is_promo_active AS isPromoActive, promo_expires_at AS promoExpiresAt, combo_config_json AS comboConfig, is_available AS isAvailable, COALESCE(is_hidden, 0) AS isHidden,
            CASE WHEN stock_managed = 1 AND COALESCE(stock_remaining, 0) <= 0 THEN 0 ELSE is_available END AS effectiveIsAvailable,
            stock_managed AS stockManaged, stock_limit AS stockLimit, stock_remaining AS stockRemaining, sold_out_at AS soldOutAt,
            is_featured AS isFeatured, sort_order AS sortOrder, image_url AS imageUrl, image_key AS imageKey, combo_links_json, upsell_items_json, updated_at AS updatedAt
     FROM menu_items ORDER BY category_key ASC, sort_order ASC, sku ASC`
  ).all();

  const items = (result.results ?? []).map(mapD1ItemToMenuItem);
  return json(200, { ok: true, items });
});

// POST /api/menu-v2-admin/items
menuAdminRouter.post('/items', async (c) => {
  if (!c.env.BOG_MENU_DB) return json(503, { ok: false, error: 'Admin disabled' });
  const authError = await requireAdminToken(c.req.raw, c.env);
  if (authError) return authError;

  let body: any;
  try {
    body = await c.req.json();
  } catch {
    return json(400, { ok: false, error: 'Invalid payload' });
  }

  const sku = normalizeSku(body.sku);
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const description = typeof body.description === 'string' ? body.description.trim() : '';
  const price = typeof body.price === 'number' ? body.price : Number.NaN;
  const category = typeof body.category === 'string' ? body.category : '';
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
  const isHidden = Boolean(body.isHidden);

  if (
    !SKU_PATTERN.test(sku) ||
    !name ||
    !Number.isFinite(price) ||
    price < 0 ||
    (!CATEGORIES.has(category as MenuCategory['key']) && !/^[a-z0-9-]{2,50}$/.test(category)) ||
    !Number.isInteger(sortOrder) ||
    typeof isAvailable !== 'boolean' ||
    typeof isFeatured !== 'boolean' ||
    imageUrl === undefined ||
    imageKey === undefined ||
    comboLinks === null
  ) {
    return json(400, { ok: false, error: 'Invalid payload' });
  }

  if (stockManaged && (stockRemainingRaw == null || !Number.isInteger(stockRemainingRaw) || stockRemainingRaw < 0)) {
    return json(400, { ok: false, error: 'Invalid stock configuration' });
  }

  const existing = await c.env.BOG_MENU_DB.prepare('SELECT sku FROM menu_items WHERE sku = ? LIMIT 1').bind(sku).first<{ sku: string }>();
  if (existing) return json(409, { ok: false, error: 'SKU ya existe' });

  const priceCents = Math.round(price * 100);
  const soldOutAt = stockManaged && (stockRemainingRaw ?? 0) <= 0 ? new Date().toISOString() : null;

  const result = await c.env.BOG_MENU_DB.prepare(
    `INSERT INTO menu_items (id, sku, category_key, name, description, price_cents, tags_json, badge, promo_label, promo_price_cents, is_promo_active, promo_expires_at, combo_config_json, is_available, is_hidden, is_featured, sort_order, image_url, image_key, combo_links_json, upsell_items_json, stock_managed, stock_limit, stock_remaining, sold_out_at, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, '[]', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, '[]', ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`
  )
    .bind(
      generateId('mi'),
      sku,
      category,
      name,
      description,
      priceCents,
      normalizeOptionalString(body.badge),
      normalizeOptionalString(body.promoLabel),
      promoPriceCents,
      isPromoActive ? 1 : 0,
      promoExpiresAt,
      comboConfigJson,
      isAvailable ? 1 : 0,
      isHidden ? 1 : 0,
      isFeatured ? 1 : 0,
      sortOrder,
      imageUrl,
      imageKey,
      JSON.stringify(comboLinks),
      stockManaged ? 1 : 0,
      stockLimitRaw,
      stockRemainingRaw,
      soldOutAt
    )
    .run();

  if (!result.success) return json(500, { ok: false, error: 'No se pudo crear producto' });
  const itemRow = await c.env.BOG_MENU_DB.prepare(ITEM_SELECT).bind(sku).first();
  return itemRow ? json(201, { ok: true, item: mapD1ItemToMenuItem(itemRow) }) : json(500, { ok: false, error: 'No se pudo recuperar producto' });
});

// PATCH /api/menu-v2-admin/items/:sku
menuAdminRouter.patch('/items/:sku', async (c) => {
  if (!c.env.BOG_MENU_DB) return json(503, { ok: false, error: 'Admin disabled' });
  const authError = await requireAdminToken(c.req.raw, c.env);
  if (authError) return authError;

  const sku = c.req.param('sku')?.trim() ?? '';
  if (!sku) return json(400, { ok: false, error: 'Invalid SKU' });

  let raw: any;
  try {
    raw = await c.req.json();
  } catch {
    return json(400, { ok: false, error: 'Invalid payload' });
  }

  const existing = await c.env.BOG_MENU_DB.prepare(
    `SELECT sku, category_key AS category, name, description, price_cents AS priceCents, promo_price_cents AS promoPriceCents, is_promo_active AS isPromoActive, promo_expires_at AS promoExpiresAt, combo_config_json AS comboConfigJson, is_available AS isAvailable, COALESCE(is_hidden, 0) AS isHidden, is_featured AS isFeatured, badge, promo_label AS promoLabel, sort_order AS sortOrder, image_url AS imageUrl, image_key AS imageKey, stock_managed AS stockManaged, stock_limit AS stockLimit, stock_remaining AS stockRemaining, combo_links_json AS comboLinksJson FROM menu_items WHERE sku = ? LIMIT 1`
  )
    .bind(sku)
    .first<any>();

  if (!existing) return json(404, { ok: false, error: 'Item not found' });

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

  const updateResult = await c.env.BOG_MENU_DB.prepare(
    `UPDATE menu_items
     SET name = ?, description = ?, price_cents = ?, promo_price_cents = ?, is_promo_active = ?, promo_expires_at = ?, combo_config_json = ?, is_available = ?, is_hidden = ?, is_featured = ?, badge = ?, promo_label = ?, sort_order = ?, image_url = ?, image_key = ?, combo_links_json = ?, stock_managed = ?, stock_limit = ?, stock_remaining = ?, sold_out_at = ?, updated_at = CURRENT_TIMESTAMP
     WHERE sku = ?`
  )
    .bind(
      name,
      description,
      priceCents,
      promoPriceCents,
      isPromoActive,
      promoExpiresAt,
      comboConfigJson,
      isAvailable,
      isHidden,
      isFeatured,
      badge,
      promoLabel,
      sortOrder,
      imageUrl,
      imageKey,
      comboLinksJson,
      stockManaged,
      stockLimit,
      stockRemaining,
      soldOutAt,
      sku
    )
    .run();

  if (!updateResult.success) return json(500, { ok: false, error: 'Database update failed' });
  const updatedRow = await c.env.BOG_MENU_DB.prepare(ITEM_SELECT).bind(sku).first();
  return updatedRow ? json(200, { ok: true, item: mapD1ItemToMenuItem(updatedRow) }) : json(404, { ok: false, error: 'Item not found' });
});

// DELETE /api/menu-v2-admin/items/:sku
menuAdminRouter.delete('/items/:sku', async (c) => {
  if (!c.env.BOG_MENU_DB) return json(503, { ok: false, error: 'Admin disabled' });
  const authError = await requireAdminToken(c.req.raw, c.env);
  if (authError) return authError;

  const sku = c.req.param('sku')?.trim() ?? '';
  if (!sku) return json(400, { ok: false, error: 'SKU inválido' });

  const existing = await c.env.BOG_MENU_DB.prepare('SELECT sku FROM menu_items WHERE sku = ? LIMIT 1').bind(sku).first();
  if (!existing) return json(404, { ok: false, error: 'Producto no encontrado' });

  try {
    await c.env.BOG_MENU_DB.prepare('DELETE FROM product_ingredient_recipes_v2 WHERE product_sku = ?').bind(sku).run();
  } catch (e) {
    console.error('Error al limpiar recetas vinculadas:', e);
  }

  const deleteResult = await c.env.BOG_MENU_DB.prepare('DELETE FROM menu_items WHERE sku = ?').bind(sku).run();
  if (!deleteResult.success) return json(500, { ok: false, error: 'No se pudo eliminar el producto de la base de datos' });

  return json(200, { ok: true, sku });
});

// PATCH /api/menu-v2-admin/items/:sku/availability
menuAdminRouter.patch('/items/:sku/availability', async (c) => {
  if (!c.env.BOG_MENU_DB) return json(503, { ok: false, error: 'Admin disabled' });
  const authError = await requireAdminToken(c.req.raw, c.env);
  if (authError) return authError;

  const sku = c.req.param('sku')?.trim() ?? '';
  if (!sku) return json(400, { ok: false, error: 'Invalid SKU' });

  let raw: any;
  try {
    raw = await c.req.json();
  } catch {
    return json(400, { ok: false, error: 'Invalid payload' });
  }

  const isAvailable = raw && typeof raw === 'object' ? raw.isAvailable : undefined;
  if (typeof isAvailable !== 'boolean') return json(400, { ok: false, error: 'Invalid payload' });

  const result = await c.env.BOG_MENU_DB.prepare('UPDATE menu_items SET is_available = ?, updated_at = CURRENT_TIMESTAMP WHERE sku = ?')
    .bind(isAvailable ? 1 : 0, sku)
    .run();

  if (!result.success || (result.meta?.changes ?? 0) < 1) return json(404, { ok: false, error: 'Item not found' });
  const itemRow = await c.env.BOG_MENU_DB.prepare(ITEM_SELECT).bind(sku).first();
  return itemRow ? json(200, { ok: true, item: mapD1ItemToMenuItem(itemRow) }) : json(404, { ok: false, error: 'Item not found' });
});

// POST /api/menu-v2-admin/items/:sku/image
menuAdminRouter.post('/items/:sku/image', async (c) => {
  if (!c.env.BOG_MENU_DB) return json(503, { ok: false, error: 'Admin disabled' });
  const authError = await requireAdminToken(c.req.raw, c.env);
  if (authError) return authError;

  const sku = c.req.param('sku')?.trim() ?? '';
  if (!sku) return json(400, { ok: false, error: 'Invalid SKU' });

  const db = c.env.BOG_MENU_DB;
  const bucket = c.env.BOG_MENU_ASSETS;
  if (!bucket) return json(503, { ok: false, error: 'R2 disabled' });

  const contentType = c.req.header('content-type') ?? '';
  if (!contentType.toLowerCase().includes('multipart/form-data')) return json(400, { ok: false, error: 'Expected multipart/form-data' });

  const currentItem = await db.prepare(ITEM_SELECT).bind(sku).first<any>();
  if (!currentItem) return json(404, { ok: false, error: 'Item not found' });

  let formData: FormData;
  try {
    formData = await c.req.formData();
  } catch {
    return json(400, { ok: false, error: 'Invalid multipart/form-data' });
  }

  const files = formData.getAll('file');
  if (files.length !== 1 || !(files[0] instanceof File)) return json(400, { ok: false, error: 'Upload exactly one image file' });

  const file = files[0];
  if (file.size <= 0) return json(400, { ok: false, error: 'Image file is required' });
  if (file.size > MAX_IMAGE_BYTES) return json(413, { ok: false, error: 'Image must be 5 MB or less' });

  const extension = getSafeFileExtension(file);
  if (!extension) return json(415, { ok: false, error: 'Unsupported image type. Use JPG, PNG, WebP or AVIF.' });

  const normalizedSku = sku.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'item';
  const key = `menu/${normalizedSku}-${timestampForKey()}.${extension}`;
  const fileBytes = await file.arrayBuffer();

  await bucket.put(key, fileBytes, {
    httpMetadata: { contentType: file.type.trim().toLowerCase() },
    customMetadata: { sku, uploadedBy: 'internal-chekeo-v2', purpose: 'menu-item' }
  });

  const result = await db.prepare('UPDATE menu_items SET image_key = ?, image_url = NULL, updated_at = CURRENT_TIMESTAMP WHERE sku = ?')
    .bind(key, sku)
    .run();

  if (!result.success || (result.meta?.changes ?? 0) < 1) {
    await bucket.delete(key).catch(() => undefined);
    return json(404, { ok: false, error: 'Item not found' });
  }

  if (currentItem.imageKey && typeof currentItem.imageKey === 'string' && currentItem.imageKey.startsWith('menu/')) {
    await bucket.delete(currentItem.imageKey).catch(() => undefined);
  }

  const updatedItem = await db.prepare(ITEM_SELECT).bind(sku).first();
  return json(200, { ok: true, item: mapD1ItemToMenuItem(updatedItem), imageKey: key, assetUrl: encodeAssetUrl(key) });
});

// DELETE /api/menu-v2-admin/items/:sku/image
menuAdminRouter.delete('/items/:sku/image', async (c) => {
  if (!c.env.BOG_MENU_DB) return json(503, { ok: false, error: 'Admin disabled' });
  const authError = await requireAdminToken(c.req.raw, c.env);
  if (authError) return authError;

  const sku = c.req.param('sku')?.trim() ?? '';
  if (!sku) return json(400, { ok: false, error: 'Invalid SKU' });

  const currentItem = await c.env.BOG_MENU_DB.prepare(ITEM_SELECT).bind(sku).first<any>();
  if (!currentItem) return json(404, { ok: false, error: 'Item not found' });

  if (c.env.BOG_MENU_ASSETS && currentItem.imageKey && typeof currentItem.imageKey === 'string' && currentItem.imageKey.startsWith('menu/')) {
    await c.env.BOG_MENU_ASSETS.delete(currentItem.imageKey).catch(() => undefined);
  }

  const result = await c.env.BOG_MENU_DB.prepare('UPDATE menu_items SET image_key = NULL, image_url = NULL, updated_at = CURRENT_TIMESTAMP WHERE sku = ?')
    .bind(sku)
    .run();

  if (!result.success || (result.meta?.changes ?? 0) < 1) return json(404, { ok: false, error: 'Item not found' });
  const updatedItem = await c.env.BOG_MENU_DB.prepare(ITEM_SELECT).bind(sku).first();
  return json(200, { ok: true, item: mapD1ItemToMenuItem(updatedItem), removed: true });
});

// -------------------------------------------------------------
// CATEGORIES
// -------------------------------------------------------------

// GET /api/menu-v2-admin/categories
menuAdminRouter.get('/categories', async (c) => {
  if (!c.env.BOG_MENU_DB) return json(503, { ok: false, error: 'Admin disabled' });
  try {
    const result = await c.env.BOG_MENU_DB.prepare('SELECT id, key, name, emoji, sort_order AS sortOrder, updated_at AS updatedAt FROM menu_categories ORDER BY sort_order ASC').all();
    return json(200, { ok: true, categories: result.results ?? [] });
  } catch (err) {
    return json(500, { ok: false, error: String(err) });
  }
});

// POST & PUT /api/menu-v2-admin/categories
const handleCategoriesSave = async (c: Context<AppEnv>) => {
  if (!c.env.BOG_MENU_DB) return json(503, { ok: false, error: 'Admin disabled' });
  const authError = await requireAdminToken(c.req.raw, c.env);
  if (authError) return authError;

  let raw: any;
  try {
    raw = await c.req.json();
  } catch {
    return json(400, { ok: false, error: 'Invalid payload' });
  }

  const categories = Array.isArray(raw?.categories) ? raw.categories : null;
  if (!categories) return json(400, { ok: false, error: 'Invalid categories payload' });

  const statements: D1PreparedStatement[] = [];
  for (const cat of categories) {
    if (!cat.key || !cat.name) continue;
    const catId = cat.id || `cat-${cat.key}`;
    statements.push(
      c.env.BOG_MENU_DB.prepare(
        `INSERT INTO menu_categories (id, key, name, emoji, sort_order, updated_at)
         VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
         ON CONFLICT(key) DO UPDATE SET
           name = excluded.name,
           emoji = excluded.emoji,
           sort_order = excluded.sort_order,
           updated_at = CURRENT_TIMESTAMP`
      ).bind(catId, cat.key, String(cat.name).trim(), cat.emoji ? String(cat.emoji).trim() : null, Number(cat.sortOrder) || 0)
    );
  }

  if (statements.length > 0) {
    await c.env.BOG_MENU_DB.batch(statements);
  }

  const updatedRows = await c.env.BOG_MENU_DB.prepare('SELECT id, key, name, emoji, sort_order AS sortOrder, updated_at AS updatedAt FROM menu_categories ORDER BY sort_order ASC').all();
  return json(200, { ok: true, categories: updatedRows.results ?? [] });
};
menuAdminRouter.post('/categories', handleCategoriesSave);
menuAdminRouter.put('/categories', handleCategoriesSave);

// DELETE /api/menu-v2-admin/categories/:key
menuAdminRouter.delete('/categories/:key', async (c) => {
  if (!c.env.BOG_MENU_DB) return json(503, { ok: false, error: 'Admin disabled' });
  const authError = await requireAdminToken(c.req.raw, c.env);
  if (authError) return authError;

  const key = c.req.param('key')?.trim()?.toLowerCase() ?? '';
  if (!key) return json(400, { ok: false, error: 'Clave de categoría requerida' });

  // Comprobar si existen productos asociados a esta categoría
  const itemCheck = await c.env.BOG_MENU_DB.prepare(
    'SELECT COUNT(*) as count FROM menu_items WHERE category_key = ?'
  ).bind(key).first<{ count: number }>();

  const assignedCount = itemCheck?.count ?? 0;
  if (assignedCount > 0) {
    return json(409, {
      ok: false,
      error: 'CATEGORY_IN_USE',
      message: `No se puede eliminar la categoría "${key}" porque tiene ${assignedCount} platillo(s) asignado(s). Reasigna o elimina los platillos primero.`
    });
  }

  await c.env.BOG_MENU_DB.prepare('DELETE FROM menu_categories WHERE key = ?').bind(key).run();
  return json(200, { ok: true, deletedKey: key });
});

// -------------------------------------------------------------
// CATEGORY BANNERS
// -------------------------------------------------------------

// GET & PATCH /api/menu-v2-admin/category-banners
menuAdminRouter.get('/category-banners', async (c) => {
  if (!c.env.BOG_MENU_DB) return json(503, { ok: false, error: 'Admin disabled' });
  try {
    const result = await c.env.BOG_MENU_DB.prepare('SELECT category_key AS categoryKey, title, subtitle, image_key AS imageKey, image_url AS imageUrl, updated_at AS updatedAt FROM menu_category_banners ORDER BY category_key ASC').all();
    return json(200, { ok: true, banners: (result.results ?? []).map(mapD1CategoryBanner) });
  } catch (err) {
    return json(500, { ok: false, error: String(err) });
  }
});

menuAdminRouter.patch('/category-banners', async (c) => {
  if (!c.env.BOG_MENU_DB) return json(503, { ok: false, error: 'Admin disabled' });
  const authError = await requireAdminToken(c.req.raw, c.env);
  if (authError) return authError;

  let body: any;
  try {
    body = await c.req.json();
  } catch {
    return json(400, { ok: false, error: 'Invalid payload' });
  }

  const categoryKey = typeof body.categoryKey === 'string' ? body.categoryKey : '';
  const imageUrl = validateImageUrl(body.imageUrl);
  const imageKey = validateAssetKey(body.imageKey);
  if (!CATEGORIES.has(categoryKey as MenuCategory['key']) || imageUrl === undefined || imageKey === undefined) {
    return json(400, { ok: false, error: 'Invalid payload' });
  }

  const result = await c.env.BOG_MENU_DB.prepare(
    `INSERT INTO menu_category_banners (category_key, title, subtitle, image_key, image_url, updated_at)
     VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
     ON CONFLICT(category_key) DO UPDATE SET
       title = excluded.title,
       subtitle = excluded.subtitle,
       image_key = excluded.image_key,
       image_url = excluded.image_url,
       updated_at = CURRENT_TIMESTAMP`
  )
    .bind(categoryKey, normalizeOptionalString(body.title), normalizeOptionalString(body.subtitle), imageKey, imageUrl)
    .run();

  if (!result.success) return json(500, { ok: false, error: 'No se pudo guardar banner' });
  const row = await c.env.BOG_MENU_DB.prepare(BANNER_SELECT).bind(categoryKey).first();
  return row ? json(200, { ok: true, banner: mapD1CategoryBanner(row) }) : json(500, { ok: false, error: 'No se pudo recuperar banner' });
});

// POST /api/menu-v2-admin/category-banners/:categoryKey/image
menuAdminRouter.post('/category-banners/:categoryKey/image', async (c) => {
  if (!c.env.BOG_MENU_DB) return json(503, { ok: false, error: 'Admin disabled' });
  const authError = await requireAdminToken(c.req.raw, c.env);
  if (authError) return authError;

  const categoryKey = c.req.param('categoryKey')?.trim() as MenuCategory['key'];
  if (!CATEGORIES.has(categoryKey)) return json(400, { ok: false, error: 'Categoría inválida' });

  const bucket = c.env.BOG_MENU_ASSETS;
  if (!bucket) return json(503, { ok: false, error: 'R2 disabled' });

  const contentType = c.req.header('content-type') ?? '';
  if (!contentType.toLowerCase().includes('multipart/form-data')) return json(400, { ok: false, error: 'Expected multipart/form-data' });

  let formData: FormData;
  try {
    formData = await c.req.formData();
  } catch {
    return json(400, { ok: false, error: 'Invalid multipart/form-data' });
  }

  const files = formData.getAll('file');
  if (files.length !== 1 || !(files[0] instanceof File)) return json(400, { ok: false, error: 'Upload exactly one image file' });

  const file = files[0];
  if (file.size <= 0) return json(400, { ok: false, error: 'Image file is required' });
  if (file.size > MAX_IMAGE_BYTES) return json(413, { ok: false, error: 'La imagen debe pesar 5 MB o menos' });

  const extension = getSafeFileExtension(file);
  if (!extension) return json(415, { ok: false, error: 'Usa JPG, PNG, WebP o AVIF.' });

  const currentBanner = await c.env.BOG_MENU_DB.prepare(BANNER_SELECT).bind(categoryKey).first<any>();
  const key = `category-banners/${categoryKey}/${categoryKey}-${timestampForKey()}.${extension}`;
  const bodyBytes = await file.arrayBuffer();

  await bucket.put(key, bodyBytes, {
    httpMetadata: { contentType: file.type.trim().toLowerCase() },
    customMetadata: { categoryKey, uploadedBy: 'internal-chekeo-v2', purpose: 'category-banner' }
  });

  const result = await c.env.BOG_MENU_DB.prepare(
    `INSERT INTO menu_category_banners (category_key, title, subtitle, image_key, image_url, updated_at)
     VALUES (?, NULL, NULL, ?, NULL, CURRENT_TIMESTAMP)
     ON CONFLICT(category_key) DO UPDATE SET
       image_key = excluded.image_key,
       image_url = NULL,
       updated_at = CURRENT_TIMESTAMP`
  )
    .bind(categoryKey, key)
    .run();

  if (!result.success) {
    await bucket.delete(key).catch(() => undefined);
    return json(500, { ok: false, error: 'No se pudo guardar la imagen del banner' });
  }

  if (currentBanner?.imageKey && typeof currentBanner.imageKey === 'string' && currentBanner.imageKey.startsWith('category-banners/')) {
    await bucket.delete(currentBanner.imageKey).catch(() => undefined);
  }

  const updatedBanner = await c.env.BOG_MENU_DB.prepare(BANNER_SELECT).bind(categoryKey).first();
  return json(200, { ok: true, banner: mapD1CategoryBanner(updatedBanner), imageKey: key, assetUrl: encodeAssetUrl(key) });
});

// DELETE /api/menu-v2-admin/category-banners/:categoryKey/image
menuAdminRouter.delete('/category-banners/:categoryKey/image', async (c) => {
  if (!c.env.BOG_MENU_DB) return json(503, { ok: false, error: 'Admin disabled' });
  const authError = await requireAdminToken(c.req.raw, c.env);
  if (authError) return authError;

  const categoryKey = c.req.param('categoryKey')?.trim() as MenuCategory['key'];
  if (!CATEGORIES.has(categoryKey)) return json(400, { ok: false, error: 'Categoría inválida' });

  const currentBanner = await c.env.BOG_MENU_DB.prepare(BANNER_SELECT).bind(categoryKey).first<any>();
  if (c.env.BOG_MENU_ASSETS && currentBanner?.imageKey && typeof currentBanner.imageKey === 'string' && currentBanner.imageKey.startsWith('category-banners/')) {
    await c.env.BOG_MENU_ASSETS.delete(currentBanner.imageKey).catch(() => undefined);
  }

  const result = await c.env.BOG_MENU_DB.prepare(
    `INSERT INTO menu_category_banners (category_key, title, subtitle, image_key, image_url, updated_at)
     VALUES (?, NULL, NULL, NULL, NULL, CURRENT_TIMESTAMP)
     ON CONFLICT(category_key) DO UPDATE SET
       image_key = NULL,
       image_url = NULL,
       updated_at = CURRENT_TIMESTAMP`
  )
    .bind(categoryKey)
    .run();

  if (!result.success) return json(500, { ok: false, error: 'No se pudo quitar la imagen del banner' });
  const updatedBanner = await c.env.BOG_MENU_DB.prepare(BANNER_SELECT).bind(categoryKey).first();
  return json(200, { ok: true, banner: mapD1CategoryBanner(updatedBanner), imageKey: null, assetUrl: null, removed: true });
});

// -------------------------------------------------------------
// CATALOG BANNERS
// -------------------------------------------------------------

// GET /api/menu-v2-admin/catalog-banners
menuAdminRouter.get('/catalog-banners', async (c) => {
  if (!c.env.BOG_MENU_DB) return json(503, { ok: false, error: 'Database disabled' });
  const authError = await requireAdminToken(c.req.raw, c.env);
  if (authError) return authError;

  try {
    const { results } = await c.env.BOG_MENU_DB.prepare('SELECT * FROM catalog_banners ORDER BY sort_order ASC').all();
    if (!results || results.length === 0) {
      for (const b of DEFAULT_CATALOG_BANNERS) {
        try {
          await c.env.BOG_MENU_DB.prepare(
            `INSERT OR IGNORE INTO catalog_banners (id, title, subtitle, cta_label, bg_preset, badge_text, is_active, sort_order, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`
          ).bind(b.id, b.title, b.subtitle, b.cta_label, b.bg_preset, b.badge_text, b.is_active, b.sort_order).run();
        } catch {
          /* ignore */
        }
      }
      const seeded = await c.env.BOG_MENU_DB.prepare('SELECT * FROM catalog_banners ORDER BY sort_order ASC').all();
      return json(200, { ok: true, banners: (seeded.results ?? []).map(mapD1CatalogBanner) });
    }
    const banners = (results ?? []).map(mapD1CatalogBanner);
    return json(200, { ok: true, banners });
  } catch {
    return json(200, { ok: true, banners: DEFAULT_CATALOG_BANNERS.map(mapD1CatalogBanner), fallback: true });
  }
});

// POST /api/menu-v2-admin/catalog-banners
menuAdminRouter.post('/catalog-banners', async (c) => {
  if (!c.env.BOG_MENU_DB) return json(503, { ok: false, error: 'Admin disabled' });
  const authError = await requireAdminToken(c.req.raw, c.env);
  if (authError) return authError;

  let body: any;
  try {
    body = await c.req.json();
  } catch {
    return json(400, { ok: false, error: 'Invalid payload' });
  }

  const id = `cb-${crypto.randomUUID()}`;
  const title = typeof body.title === 'string' ? body.title.trim() : '';
  const imageUrl = validateImageUrl(body.imageUrl);
  const imageKey = validateAssetKey(body.imageKey);
  if (imageUrl === undefined || imageKey === undefined) return json(400, { ok: false, error: 'Invalid image configuration' });

  const result = await c.env.BOG_MENU_DB.prepare(
    `INSERT INTO catalog_banners (id, title, subtitle, cta_label, image_key, image_url, bg_preset, badge_text, badge_color, cta_action_type, cta_target, is_active, sort_order, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`
  )
    .bind(
      id,
      title,
      normalizeOptionalString(body.subtitle),
      normalizeOptionalString(body.ctaLabel),
      imageKey,
      imageUrl,
      normalizeOptionalString(body.bgPreset),
      normalizeOptionalString(body.badgeText),
      normalizeOptionalString(body.badgeColor),
      normalizeOptionalString(body.ctaActionType),
      normalizeOptionalString(body.ctaTarget),
      typeof body.isActive === 'boolean' ? (body.isActive ? 1 : 0) : 1,
      Number(body.sortOrder) || 0
    )
    .run();

  if (!result.success) return json(500, { ok: false, error: 'No se pudo crear el banner' });
  const row = await c.env.BOG_MENU_DB.prepare('SELECT * FROM catalog_banners WHERE id = ? LIMIT 1').bind(id).first();
  return row ? json(201, { ok: true, banner: mapD1CatalogBanner(row) }) : json(500, { ok: false, error: 'No se pudo recuperar banner' });
});

// PATCH & PUT /api/menu-v2-admin/catalog-banners/:id
const handleCatalogBannerUpdate = async (c: Context<AppEnv>) => {
  if (!c.env.BOG_MENU_DB) return json(503, { ok: false, error: 'Admin disabled' });
  const authError = await requireAdminToken(c.req.raw, c.env);
  if (authError) return authError;

  const id = c.req.param('id')?.trim() ?? '';
  if (!id) return json(400, { ok: false, error: 'ID is required' });

  let body: any;
  try {
    body = await c.req.json();
  } catch {
    return json(400, { ok: false, error: 'Invalid payload' });
  }

  const updates: string[] = [];
  const bindings: any[] = [];

  if (typeof body.title === 'string' && body.title.trim()) {
    updates.push('title = ?');
    bindings.push(body.title.trim());
  }
  const subtitle = normalizeOptionalString(body.subtitle);
  if (subtitle !== undefined) {
    updates.push('subtitle = ?');
    bindings.push(subtitle);
  }
  const ctaLabel = normalizeOptionalString(body.ctaLabel);
  if (ctaLabel !== undefined) {
    updates.push('cta_label = ?');
    bindings.push(ctaLabel);
  }
  const bgPreset = normalizeOptionalString(body.bgPreset);
  if (bgPreset !== undefined) {
    updates.push('bg_preset = ?');
    bindings.push(bgPreset);
  }
  const badgeText = normalizeOptionalString(body.badgeText);
  if (badgeText !== undefined) {
    updates.push('badge_text = ?');
    bindings.push(badgeText);
  }
  const badgeColor = normalizeOptionalString(body.badgeColor);
  if (badgeColor !== undefined) {
    updates.push('badge_color = ?');
    bindings.push(badgeColor);
  }
  const ctaActionType = normalizeOptionalString(body.ctaActionType);
  if (ctaActionType !== undefined) {
    updates.push('cta_action_type = ?');
    bindings.push(ctaActionType);
  }
  const ctaTarget = normalizeOptionalString(body.ctaTarget);
  if (ctaTarget !== undefined) {
    updates.push('cta_target = ?');
    bindings.push(ctaTarget);
  }

  if ('imageUrl' in body) {
    const imageUrl = validateImageUrl(body.imageUrl);
    if (imageUrl === undefined) return json(400, { ok: false, error: 'Invalid image URL' });
    updates.push('image_url = ?');
    bindings.push(imageUrl);
  }
  if ('imageKey' in body) {
    const imageKey = validateAssetKey(body.imageKey);
    if (imageKey === undefined) return json(400, { ok: false, error: 'Invalid image key' });
    updates.push('image_key = ?');
    bindings.push(imageKey);
  }
  if (typeof body.isActive === 'boolean') {
    updates.push('is_active = ?');
    bindings.push(body.isActive ? 1 : 0);
  }
  if (typeof body.sortOrder === 'number') {
    updates.push('sort_order = ?');
    bindings.push(body.sortOrder);
  }

  if (updates.length === 0) return json(400, { ok: false, error: 'No fields to update' });
  updates.push('updated_at = CURRENT_TIMESTAMP');
  bindings.push(id);

  try {
    await c.env.BOG_MENU_DB.prepare(`UPDATE catalog_banners SET ${updates.join(', ')} WHERE id = ?`).bind(...bindings).run();
  } catch {
    /* fallback update */
  }

  const row = await c.env.BOG_MENU_DB.prepare('SELECT * FROM catalog_banners WHERE id = ? LIMIT 1').bind(id).first();
  if (row) return json(200, { ok: true, banner: mapD1CatalogBanner(row) });

  if (id.startsWith('cb-default-')) {
    const def = DEFAULT_CATALOG_BANNERS.find((b) => b.id === id) ?? DEFAULT_CATALOG_BANNERS[0];
    return json(200, { ok: true, banner: mapD1CatalogBanner(def) });
  }

  return json(404, { ok: false, error: 'Banner not found' });
};
menuAdminRouter.patch('/catalog-banners/:id', handleCatalogBannerUpdate);
menuAdminRouter.put('/catalog-banners/:id', handleCatalogBannerUpdate);

// DELETE /api/menu-v2-admin/catalog-banners/:id
menuAdminRouter.delete('/catalog-banners/:id', async (c) => {
  if (!c.env.BOG_MENU_DB) return json(503, { ok: false, error: 'Admin disabled' });
  const authError = await requireAdminToken(c.req.raw, c.env);
  if (authError) return authError;

  const id = c.req.param('id')?.trim() ?? '';
  if (!id) return json(400, { ok: false, error: 'ID is required' });

  const currentBanner = await c.env.BOG_MENU_DB.prepare('SELECT image_key FROM catalog_banners WHERE id = ?').bind(id).first<{ image_key: string | null }>();
  const result = await c.env.BOG_MENU_DB.prepare('DELETE FROM catalog_banners WHERE id = ?').bind(id).run();

  if (!result.success || (result.meta?.changes === 0 && !id.startsWith('cb-default-'))) {
    return json(404, { ok: false, error: 'Banner not found' });
  }

  const imageKey = normalizeAssetKey(currentBanner?.image_key);
  if (imageKey && c.env.BOG_MENU_ASSETS) {
    await c.env.BOG_MENU_ASSETS.delete(imageKey).catch(() => {});
  }

  return json(200, { ok: true, id });
});

// POST /api/menu-v2-admin/catalog-banners/:id/image
menuAdminRouter.post('/catalog-banners/:id/image', async (c) => {
  if (!c.env.BOG_MENU_DB) return json(503, { ok: false, error: 'Admin disabled' });
  const authError = await requireAdminToken(c.req.raw, c.env);
  if (authError) return authError;

  const id = c.req.param('id')?.trim() ?? '';
  if (!id) return json(400, { ok: false, error: 'ID is required' });

  const db = c.env.BOG_MENU_DB;
  const bucket = c.env.BOG_MENU_ASSETS;
  if (!bucket) return json(503, { ok: false, error: 'R2 disabled' });

  const contentType = c.req.header('content-type') ?? '';
  if (!contentType.toLowerCase().includes('multipart/form-data')) return json(400, { ok: false, error: 'Expected multipart/form-data' });

  let formData: FormData;
  try {
    formData = await c.req.formData();
  } catch {
    return json(400, { ok: false, error: 'Invalid multipart/form-data' });
  }

  const files = formData.getAll('file');
  if (files.length !== 1 || !(files[0] instanceof File)) return json(400, { ok: false, error: 'Upload exactly one image file' });

  const file = files[0];
  if (file.size <= 0) return json(400, { ok: false, error: 'Image file is required' });
  if (file.size > MAX_IMAGE_BYTES) return json(413, { ok: false, error: 'La imagen debe pesar 5 MB o menos' });

  const extension = getSafeFileExtension(file);
  if (!extension) return json(415, { ok: false, error: 'Usa JPG, PNG, WebP o AVIF.' });

  const currentBanner = await db.prepare('SELECT image_key FROM catalog_banners WHERE id = ?').bind(id).first<any>().catch(() => null);
  const key = `catalog-banners/${id}/${timestampForKey()}.${extension}`;
  const bodyBytes = await file.arrayBuffer();

  await bucket.put(key, bodyBytes, {
    httpMetadata: { contentType: file.type.trim().toLowerCase() },
    customMetadata: { bannerId: id, uploadedBy: 'internal-chekeo-v2', purpose: 'catalog-banner' }
  });

  const result = await db.prepare('UPDATE catalog_banners SET image_key = ?, image_url = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = ?').bind(key, id).run();
  if (!result.success || (result.meta?.changes ?? 0) === 0) {
    await bucket.delete(key).catch(() => {});
    return json(500, { ok: false, error: 'No se pudo actualizar la imagen del banner en DB' });
  }

  if (currentBanner?.image_key && typeof currentBanner.image_key === 'string' && currentBanner.image_key.startsWith('catalog-banners/')) {
    await bucket.delete(currentBanner.image_key).catch(() => {});
  }

  const updatedBanner = await db.prepare('SELECT * FROM catalog_banners WHERE id = ? LIMIT 1').bind(id).first();
  return json(200, { ok: true, banner: mapD1CatalogBanner(updatedBanner), imageKey: key, assetUrl: encodeAssetUrl(key) });
});

// DELETE /api/menu-v2-admin/catalog-banners/:id/image
menuAdminRouter.delete('/catalog-banners/:id/image', async (c) => {
  if (!c.env.BOG_MENU_DB) return json(503, { ok: false, error: 'Admin disabled' });
  const authError = await requireAdminToken(c.req.raw, c.env);
  if (authError) return authError;

  const id = c.req.param('id')?.trim() ?? '';
  if (!id) return json(400, { ok: false, error: 'ID is required' });

  const currentBanner = await c.env.BOG_MENU_DB.prepare('SELECT image_key FROM catalog_banners WHERE id = ?').bind(id).first<any>();
  if (!currentBanner) return json(404, { ok: false, error: 'Banner no encontrado' });

  const result = await c.env.BOG_MENU_DB.prepare('UPDATE catalog_banners SET image_key = NULL, image_url = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = ?').bind(id).run();
  if (!result.success || (result.meta?.changes ?? 0) === 0) return json(500, { ok: false, error: 'No se pudo quitar la imagen de DB' });

  if (c.env.BOG_MENU_ASSETS && currentBanner?.image_key && typeof currentBanner.image_key === 'string' && currentBanner.image_key.startsWith('catalog-banners/')) {
    await c.env.BOG_MENU_ASSETS.delete(currentBanner.image_key).catch(() => {});
  }

  const updatedBanner = await c.env.BOG_MENU_DB.prepare('SELECT * FROM catalog_banners WHERE id = ? LIMIT 1').bind(id).first();
  return json(200, { ok: true, banner: mapD1CatalogBanner(updatedBanner), imageKey: null, assetUrl: null, removed: true });
});

// -------------------------------------------------------------
// PROMOS
// -------------------------------------------------------------

// PATCH & PUT /api/menu-v2-admin/promos/:id
const handlePromoUpdate = async (c: Context<AppEnv>) => {
  if (!c.env.BOG_MENU_DB) return json(503, { ok: false, error: 'Admin disabled' });
  const authError = await requireAdminToken(c.req.raw, c.env);
  if (authError) return authError;

  const id = c.req.param('id')?.trim() ?? '';
  if (!id) return json(400, { ok: false, error: 'Invalid promo id' });

  let body: any;
  try {
    body = await c.req.json();
  } catch {
    return json(400, { ok: false, error: 'Invalid payload' });
  }

  const title = typeof body.title === 'string' ? body.title.trim() : '';
  const description = typeof body.description === 'string' ? body.description.trim() : '';
  const isAvailable = body.isAvailable;
  const isFeatured = body.isFeatured;
  const sortOrder = typeof body.sortOrder === 'number' ? body.sortOrder : Number.NaN;
  const imageUrl = validateImageUrl(body.imageUrl);
  const imageKey = validateAssetKey(body.imageKey);
  const comboLinks = normalizeLinkArray(body.comboLinks);

  if (
    !title ||
    !description ||
    typeof isAvailable !== 'boolean' ||
    typeof isFeatured !== 'boolean' ||
    !Number.isInteger(sortOrder) ||
    imageUrl === undefined ||
    imageKey === undefined ||
    comboLinks === null
  ) {
    return json(400, { ok: false, error: 'Invalid payload' });
  }

  const result = await c.env.BOG_MENU_DB.prepare(
    `UPDATE promo_cards
     SET title = ?, description = ?, badge = ?, promo_label = ?, is_available = ?, is_featured = ?, sort_order = ?, asset_image_url = ?, asset_image_key = ?, combo_links_json = ?, updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`
  )
    .bind(
      title,
      description,
      normalizeOptionalString(body.badge),
      normalizeOptionalString(body.promoLabel),
      isAvailable ? 1 : 0,
      isFeatured ? 1 : 0,
      sortOrder,
      imageUrl,
      imageKey,
      JSON.stringify(comboLinks),
      id
    )
    .run();

  if (!result.success || (result.meta?.changes ?? 0) < 1) return json(404, { ok: false, error: 'Promo not found' });
  const promoRow = await c.env.BOG_MENU_DB.prepare(PROMO_SELECT).bind(id).first();
  return promoRow ? json(200, { ok: true, promo: mapD1PromoToPromoCard(promoRow) }) : json(404, { ok: false, error: 'Promo not found' });
};
menuAdminRouter.patch('/promos/:id', handlePromoUpdate);
menuAdminRouter.put('/promos/:id', handlePromoUpdate);

// POST /api/menu-v2-admin/promos/:id/image
menuAdminRouter.post('/promos/:id/image', async (c) => {
  if (!c.env.BOG_MENU_DB) return json(503, { ok: false, error: 'Admin disabled' });
  const authError = await requireAdminToken(c.req.raw, c.env);
  if (authError) return authError;

  const id = c.req.param('id')?.trim() ?? '';
  if (!id) return json(400, { ok: false, error: 'Invalid promo id' });

  const bucket = c.env.BOG_MENU_ASSETS;
  if (!bucket) return json(503, { ok: false, error: 'R2 disabled' });

  const contentType = c.req.header('content-type') ?? '';
  if (!contentType.toLowerCase().includes('multipart/form-data')) return json(400, { ok: false, error: 'Expected multipart/form-data' });

  const currentPromo = await c.env.BOG_MENU_DB.prepare(PROMO_SELECT).bind(id).first<any>();
  if (!currentPromo) return json(404, { ok: false, error: 'Promo not found' });

  let formData: FormData;
  try {
    formData = await c.req.formData();
  } catch {
    return json(400, { ok: false, error: 'Invalid multipart/form-data' });
  }

  const files = formData.getAll('file');
  if (files.length !== 1 || !(files[0] instanceof File)) return json(400, { ok: false, error: 'Upload exactly one image file' });

  const file = files[0];
  if (file.size <= 0) return json(400, { ok: false, error: 'Image file is required' });
  if (file.size > MAX_IMAGE_BYTES) return json(413, { ok: false, error: 'Image must be 5 MB or less' });

  const extension = getSafeFileExtension(file);
  if (!extension) return json(415, { ok: false, error: 'Unsupported image type. Use JPG, PNG, WebP or AVIF.' });

  const normalizedPromo = id.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'promo';
  const key = `promos/${normalizedPromo}-${timestampForKey()}.${extension}`;
  const bodyBytes = await file.arrayBuffer();

  await bucket.put(key, bodyBytes, {
    httpMetadata: { contentType: file.type.trim().toLowerCase() },
    customMetadata: { promoId: id, uploadedBy: 'internal-chekeo-v2', purpose: 'promo-card' }
  });

  const result = await c.env.BOG_MENU_DB.prepare('UPDATE promo_cards SET asset_image_key = ?, asset_image_url = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
    .bind(key, id)
    .run();

  if (!result.success || (result.meta?.changes ?? 0) < 1) {
    await bucket.delete(key).catch(() => undefined);
    return json(500, { ok: false, error: 'Promo image could not be saved' });
  }

  const prevKey = currentPromo.imageKey ?? currentPromo.asset_image_key;
  if (prevKey && typeof prevKey === 'string' && prevKey.startsWith('promos/')) {
    await bucket.delete(prevKey).catch(() => undefined);
  }

  const updatedPromo = await c.env.BOG_MENU_DB.prepare(PROMO_SELECT).bind(id).first();
  return json(200, { ok: true, promo: mapD1PromoToPromoCard(updatedPromo), imageKey: key, assetUrl: encodeAssetUrl(key) });
});

// DELETE /api/menu-v2-admin/promos/:id/image
menuAdminRouter.delete('/promos/:id/image', async (c) => {
  if (!c.env.BOG_MENU_DB) return json(503, { ok: false, error: 'Admin disabled' });
  const authError = await requireAdminToken(c.req.raw, c.env);
  if (authError) return authError;

  const id = c.req.param('id')?.trim() ?? '';
  if (!id) return json(400, { ok: false, error: 'Invalid promo id' });

  const currentPromo = await c.env.BOG_MENU_DB.prepare(PROMO_SELECT).bind(id).first<any>();
  if (!currentPromo) return json(404, { ok: false, error: 'Promo not found' });

  const prevKey = currentPromo.imageKey ?? currentPromo.asset_image_key;
  if (c.env.BOG_MENU_ASSETS && prevKey && typeof prevKey === 'string' && prevKey.startsWith('promos/')) {
    await c.env.BOG_MENU_ASSETS.delete(prevKey).catch(() => undefined);
  }

  const result = await c.env.BOG_MENU_DB.prepare('UPDATE promo_cards SET asset_image_key = NULL, asset_image_url = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
    .bind(id)
    .run();

  if (!result.success || (result.meta?.changes ?? 0) < 1) return json(404, { ok: false, error: 'Promo not found' });
  const updatedPromo = await c.env.BOG_MENU_DB.prepare(PROMO_SELECT).bind(id).first();
  return json(200, { ok: true, promo: mapD1PromoToPromoCard(updatedPromo), removed: true });
});

// -------------------------------------------------------------
// SITE CONFIG
// -------------------------------------------------------------

// GET /api/menu-v2-admin/site-config
menuAdminRouter.get('/site-config', async (c) => {
  if (!c.env.BOG_MENU_DB) return json(503, { ok: false, error: 'Database disabled' });
  const authError = await requireAdminToken(c.req.raw, c.env);
  if (authError) return authError;

  try {
    const row = await c.env.BOG_MENU_DB.prepare('SELECT public_mode, catalog_enabled, updated_at AS updatedAt FROM site_config ORDER BY updated_at DESC LIMIT 1').first<any>();
    const resolved: PublicConfig = {
      publicMode: row?.public_mode === 'catalog' || row?.publicMode === 'catalog' ? 'catalog' : 'flow',
      catalogEnabled: Number(row?.catalog_enabled ?? row?.catalogEnabled) === 1,
      updatedAt: row?.updatedAt ?? row?.updated_at ?? undefined
    };
    return json(200, { ok: true, publicConfig: resolved });
  } catch {
    return json(500, { ok: false, error: 'No se pudo consultar la configuración del sitio' });
  }
});

// PATCH & POST & PUT /api/menu-v2-admin/site-config
const handleSiteConfigUpdate = async (c: Context<AppEnv>) => {
  if (!c.env.BOG_MENU_DB) return json(503, { ok: false, error: 'Admin disabled' });
  const authError = await requireAdminToken(c.req.raw, c.env);
  if (authError) return authError;

  let body: any;
  try {
    body = await c.req.json();
  } catch {
    return json(400, { ok: false, error: 'Payload inválido' });
  }

  const publicMode = body?.publicMode === 'catalog' ? 'catalog' : body?.publicMode === 'flow' ? 'flow' : undefined;
  const catalogEnabled = typeof body?.catalogEnabled === 'boolean' ? body.catalogEnabled : undefined;

  if (publicMode === undefined && catalogEnabled === undefined) {
    return json(400, { ok: false, error: 'Debes proporcionar publicMode o catalogEnabled' });
  }

  try {
    const existing = await c.env.BOG_MENU_DB.prepare('SELECT id, public_mode, catalog_enabled FROM site_config ORDER BY updated_at DESC LIMIT 1').first<any>();
    const nextMode = publicMode ?? existing?.public_mode ?? 'flow';
    const nextEnabled = catalogEnabled !== undefined ? (catalogEnabled ? 1 : 0) : existing?.catalog_enabled ?? 0;

    if (existing?.id) {
      await c.env.BOG_MENU_DB.prepare('UPDATE site_config SET public_mode = ?, catalog_enabled = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
        .bind(nextMode, nextEnabled, existing.id)
        .run();
    } else {
      await c.env.BOG_MENU_DB.prepare(
        `INSERT INTO site_config (id, brand_name, currency, order_modes_json, support_phone, hero_cta, notice, public_mode, catalog_enabled, updated_at)
         VALUES ('default', 'Burgers.exe', 'MXN', '["pickup","delivery"]', '+52 55 0000 0000', 'Pedir ahora', '', ?, ?, CURRENT_TIMESTAMP)`
      )
        .bind(nextMode, nextEnabled)
        .run();
    }

    const updatedRow = await c.env.BOG_MENU_DB.prepare('SELECT public_mode, catalog_enabled, updated_at AS updatedAt FROM site_config ORDER BY updated_at DESC LIMIT 1').first<any>();
    const updatedConfig: PublicConfig = {
      publicMode: updatedRow?.public_mode === 'catalog' ? 'catalog' : 'flow',
      catalogEnabled: Number(updatedRow?.catalog_enabled) === 1,
      updatedAt: updatedRow?.updatedAt ?? updatedRow?.updated_at ?? new Date().toISOString()
    };
    return json(200, { ok: true, publicConfig: updatedConfig });
  } catch (e) {
    return json(500, { ok: false, error: e instanceof Error ? e.message : 'Error al actualizar configuración' });
  }
};
menuAdminRouter.patch('/site-config', handleSiteConfigUpdate);
menuAdminRouter.post('/site-config', handleSiteConfigUpdate);
menuAdminRouter.put('/site-config', handleSiteConfigUpdate);

// -------------------------------------------------------------
// TOWER SCHEDULES
// -------------------------------------------------------------

// GET /api/menu-v2-admin/tower-schedules
menuAdminRouter.get('/tower-schedules', async (c) => {
  if (!c.env.BOG_MENU_DB) return json(503, { ok: false, error: 'Database disabled' });
  const authError = await requireAdminToken(c.req.raw, c.env);
  if (authError) return authError;

  try {
    const { results } = await c.env.BOG_MENU_DB.prepare('SELECT * FROM tower_schedules ORDER BY tower_key ASC').all<any>();
    const mapped = (results ?? []).map((row) => ({
      id: row.id,
      towerKey: row.tower_key,
      towerName: row.tower_name,
      emoji: row.emoji || '🏢',
      activeDays: (() => {
        try {
          const parsed = JSON.parse(row.active_days_json);
          return Array.isArray(parsed) ? parsed.filter((d: unknown) => typeof d === 'number' && d >= 0 && d <= 6) : [];
        } catch {
          return [];
        }
      })(),
      orderStartTime: row.order_start_time,
      orderEndTime: row.order_end_time,
      deliveryStartTime: row.delivery_start_time,
      deliveryEndTime: row.delivery_end_time,
      deliveryLabel: row.delivery_label ?? null,
      isActive: Number(row.is_active) === 1,
      updatedAt: row.updated_at
    }));
    return json(200, { ok: true, towers: mapped, schedules: mapped });
  } catch {
    return json(500, { ok: false, error: 'No se pudieron consultar las torres' });
  }
});

// PATCH & PUT /api/menu-v2-admin/tower-schedules/:id
const handleTowerScheduleUpdate = async (c: Context<AppEnv>) => {
  if (!c.env.BOG_MENU_DB) return json(503, { ok: false, error: 'Admin disabled' });
  const authError = await requireAdminToken(c.req.raw, c.env);
  if (authError) return authError;

  const id = c.req.param('id')?.trim() ?? '';
  if (!id) return json(400, { ok: false, error: 'ID is required' });

  let raw: any;
  try {
    raw = await c.req.json();
  } catch {
    return json(400, { ok: false, error: 'Invalid payload' });
  }

  const updates: string[] = [];
  const bindings: unknown[] = [];

  if (typeof raw.towerName === 'string' && raw.towerName.trim()) {
    updates.push('tower_name = ?');
    bindings.push(raw.towerName.trim());
  }
  if (typeof raw.emoji === 'string') {
    updates.push('emoji = ?');
    bindings.push(raw.emoji.trim() || '🏢');
  }
  if ('activeDays' in raw && Array.isArray(raw.activeDays)) {
    updates.push('active_days_json = ?');
    bindings.push(JSON.stringify(raw.activeDays));
  }
  if ('orderStartTime' in raw && typeof raw.orderStartTime === 'string') {
    updates.push('order_start_time = ?');
    bindings.push(raw.orderStartTime.trim());
  }
  if ('orderEndTime' in raw && typeof raw.orderEndTime === 'string') {
    updates.push('order_end_time = ?');
    bindings.push(raw.orderEndTime.trim());
  }
  if ('deliveryStartTime' in raw && typeof raw.deliveryStartTime === 'string') {
    updates.push('delivery_start_time = ?');
    bindings.push(raw.deliveryStartTime.trim());
  }
  if ('deliveryEndTime' in raw && typeof raw.deliveryEndTime === 'string') {
    updates.push('delivery_end_time = ?');
    bindings.push(raw.deliveryEndTime.trim());
  }
  if ('deliveryLabel' in raw) {
    updates.push('delivery_label = ?');
    bindings.push(typeof raw.deliveryLabel === 'string' && raw.deliveryLabel.trim() ? raw.deliveryLabel.trim() : null);
  }
  if (typeof raw.isActive === 'boolean') {
    updates.push('is_active = ?');
    bindings.push(raw.isActive ? 1 : 0);
  }

  if (updates.length === 0) return json(400, { ok: false, error: 'No fields to update' });
  updates.push('updated_at = CURRENT_TIMESTAMP');
  bindings.push(id, id);

  try {
    const result = await c.env.BOG_MENU_DB.prepare(`UPDATE tower_schedules SET ${updates.join(', ')} WHERE id = ? OR tower_key = ?`)
      .bind(...bindings)
      .run();

    if (!result.success || (result.meta?.changes ?? 0) === 0) {
      return json(404, { ok: false, error: 'Tower not found' });
    }

    const row = await c.env.BOG_MENU_DB.prepare('SELECT * FROM tower_schedules WHERE id = ? OR tower_key = ? LIMIT 1')
      .bind(id, id)
      .first<any>();

    if (!row) return json(500, { ok: false, error: 'Error fetching updated tower' });

    const parseDays = (rawStr: string | null): number[] => {
      if (!rawStr) return [];
      try {
        const parsed = JSON.parse(rawStr);
        return Array.isArray(parsed) ? parsed.filter((d: unknown) => typeof d === 'number') : [];
      } catch {
        return [];
      }
    };

    return json(200, {
      ok: true,
      tower: {
        id: row.id,
        towerKey: row.tower_key,
        towerName: row.tower_name,
        emoji: row.emoji || '🏢',
        activeDays: parseDays(row.active_days_json),
        orderStartTime: row.order_start_time,
        orderEndTime: row.order_end_time,
        deliveryStartTime: row.delivery_start_time,
        deliveryEndTime: row.delivery_end_time,
        deliveryLabel: row.delivery_label ?? null,
        isActive: Number(row.is_active) === 1,
        updatedAt: row.updated_at
      }
    });
  } catch (e) {
    return json(500, { ok: false, error: e instanceof Error ? e.message : 'Error updating tower' });
  }
};
menuAdminRouter.patch('/tower-schedules/:id', handleTowerScheduleUpdate);
menuAdminRouter.put('/tower-schedules/:id', handleTowerScheduleUpdate);
