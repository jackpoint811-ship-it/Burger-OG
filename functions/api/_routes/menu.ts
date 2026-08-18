import { Hono } from 'hono';
import type { AppEnv } from '../_types';
import type {
  MenuCategory,
  MenuItem,
  MenuV2Response,
  PromoCard,
  PublicConfig,
  SiteConfig
} from '../../../packages/config/src';
import {
  mapD1CatalogBanner,
  mapD1CategoryBanner,
  mapD1ItemToMenuItem,
  mapD1PromoToPromoCard,
  parseJsonArray
} from '../_menu-v2-utils';
import { DEFAULT_PUBLIC_CONFIG, DEFAULT_SITE_CONFIG } from '../../../packages/config/src';
import { menuCategories, menuItems, promoCards, publicConfig, siteConfig } from '../../../packages/config/src/mock-data';

export const menuRouter = new Hono<AppEnv>();

const CATEGORY_LABELS: Record<MenuCategory['key'], string> = {
  burgers: 'Burgers',
  extras: 'Extras',
  guarniciones: 'Guarniciones',
  drinks: 'Bebidas',
  combos: 'Combos'
};

const fallbackPayload = (source: MenuV2Response['source']): MenuV2Response => ({
  categories: [...menuCategories].sort((a, b) => a.sortOrder - b.sortOrder),
  items: [...menuItems].sort((a, b) => a.sortOrder - b.sortOrder),
  promos: [...promoCards].sort((a, b) => a.sortOrder - b.sortOrder),
  categoryBanners: [],
  catalogBanners: [],
  siteConfig: siteConfig,
  publicConfig: publicConfig,
  recipes: {},
  updatedAt: new Date().toISOString(),
  source
});

const json = (payload: MenuV2Response, cacheControl = 'no-store') =>
  new Response(JSON.stringify(payload), {
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': cacheControl }
  });

const optionalAll = async <T>(query: D1PreparedStatement, label: string): Promise<T[]> => {
  try {
    const result = await query.all<T>();
    return result.results ?? [];
  } catch (error) {
    console.error(`[menu-v2] optionalAll failed (${label}):`, error);
    return [];
  }
};

const optionalFirst = async <T>(query: D1PreparedStatement, label: string): Promise<T | null> => {
  try {
    return await query.first<T>();
  } catch (error) {
    console.error(`[menu-v2] optionalFirst failed (${label}):`, error);
    return null;
  }
};

const isMenuCategoryKey = (value: unknown): value is MenuCategory['key'] =>
  value === 'burgers' || value === 'combos' || value === 'extras' || value === 'guarniciones' || value === 'drinks';

const deriveCategoriesFromItems = (items: MenuItem[]): MenuCategory[] => {
  const firstSortByCategory = new Map<MenuCategory['key'], number>();
  for (const item of items) {
    if (!firstSortByCategory.has(item.category)) firstSortByCategory.set(item.category, item.sortOrder);
  }
  return [...firstSortByCategory.entries()]
    .sort((a, b) => a[1] - b[1])
    .map(([key], index) => ({ id: `cat-${key}`, key, name: CATEGORY_LABELS[key], sortOrder: index + 1 }));
};

const resolveCategories = (rows: any[], items: MenuItem[]): MenuCategory[] => {
  const categories = rows
    .map((row) => ({
      id: String(row.id ?? `cat-${row.key}`),
      key: row.key as MenuCategory['key'],
      name: String(row.name ?? CATEGORY_LABELS[row.key as MenuCategory['key']] ?? row.key),
      emoji: row.emoji ? String(row.emoji) : undefined,
      sortOrder: Number(row.sortOrder ?? row.sort_order ?? 0),
      updatedAt: row.updatedAt ?? row.updated_at ?? undefined
    }))
    .sort((a, b) => a.sortOrder - b.sortOrder);
  return categories.length ? categories : deriveCategoriesFromItems(items);
};

const resolveSiteConfig = (row: any | null): SiteConfig => {
  if (!row) return { ...DEFAULT_SITE_CONFIG, notice: '' };
  return {
    brandName: row.brand_name ?? row.brandName ?? DEFAULT_SITE_CONFIG.brandName,
    currency: row.currency === 'MXN' ? 'MXN' : DEFAULT_SITE_CONFIG.currency,
    orderModes: (parseJsonArray(row.order_modes_json ?? row.orderModes).filter((mode) => mode === 'pickup' || mode === 'delivery') as SiteConfig['orderModes']).length
      ? (parseJsonArray(row.order_modes_json ?? row.orderModes).filter((mode) => mode === 'pickup' || mode === 'delivery') as SiteConfig['orderModes'])
      : DEFAULT_SITE_CONFIG.orderModes,
    supportPhone: row.support_phone ?? row.supportPhone ?? DEFAULT_SITE_CONFIG.supportPhone,
    heroCta: row.hero_cta ?? row.heroCta ?? DEFAULT_SITE_CONFIG.heroCta,
    notice: row.notice ?? '',
    updatedAt: row.updatedAt ?? row.updated_at ?? undefined
  };
};

const resolvePublicConfigFromRow = (row: any | null): PublicConfig => {
  if (!row) return DEFAULT_PUBLIC_CONFIG;
  return {
    publicMode: row.public_mode === 'flow' || row.publicMode === 'flow' ? 'flow' : 'catalog',
    catalogEnabled: row.catalog_enabled !== undefined || row.catalogEnabled !== undefined
      ? Number(row.catalog_enabled ?? row.catalogEnabled) === 1
      : true,
    updatedAt: row.updatedAt ?? row.updated_at ?? undefined
  };
};

// GET /api/menu-v2
menuRouter.get('/', async (c) => {
  if (!c.env.BOG_MENU_DB) {
    return json(fallbackPayload('fallback'), 'no-store');
  }
  try {
    let itemsResult = await optionalAll<any>(
      c.env.BOG_MENU_DB.prepare(`
      SELECT
        sku,
        category_key AS category,
        name,
        description,
        price_cents AS price,
        is_available AS isAvailable,
        CASE WHEN stock_managed = 1 AND COALESCE(stock_remaining, 0) <= 0 THEN 0 ELSE is_available END AS effectiveIsAvailable,
        stock_managed AS stockManaged,
        stock_limit AS stockLimit,
        stock_remaining AS stockRemaining,
        sold_out_at AS soldOutAt,
        is_featured AS isFeatured,
        sort_order AS sortOrder,
        image_url AS imageUrl,
        image_key AS imageKey,
        tags_json,
        combo_links_json,
        upsell_items_json,
        badge,
        promo_label AS promoLabel,
        promo_price_cents AS promoPriceCents,
        is_promo_active AS isPromoActive,
        promo_expires_at AS promoExpiresAt,
        combo_config_json AS comboConfig,
        COALESCE(is_hidden, 0) AS isHidden,
        updated_at AS updatedAt
      FROM menu_items
      ORDER BY category_key ASC, sort_order ASC, sku ASC
    `),
      'menu_items_with_hidden'
    );

    if (!itemsResult || itemsResult.length === 0) {
      itemsResult = await optionalAll<any>(
        c.env.BOG_MENU_DB.prepare(`
        SELECT
          sku,
          category_key AS category,
          name,
          description,
          price_cents AS price,
          is_available AS isAvailable,
          CASE WHEN stock_managed = 1 AND COALESCE(stock_remaining, 0) <= 0 THEN 0 ELSE is_available END AS effectiveIsAvailable,
          stock_managed AS stockManaged,
          stock_limit AS stockLimit,
          stock_remaining AS stockRemaining,
          sold_out_at AS soldOutAt,
          is_featured AS isFeatured,
          sort_order AS sortOrder,
          image_url AS imageUrl,
          image_key AS imageKey,
          tags_json,
          combo_links_json,
          upsell_items_json,
          badge,
          promo_label AS promoLabel,
          promo_price_cents AS promoPriceCents,
          is_promo_active AS isPromoActive,
          promo_expires_at AS promoExpiresAt,
          combo_config_json AS comboConfig,
          0 AS isHidden,
          updated_at AS updatedAt
        FROM menu_items
        ORDER BY category_key ASC, sort_order ASC, sku ASC
      `),
        'menu_items_fallback'
      );
    }

    const items: MenuItem[] = (itemsResult ?? [])
      .filter((row: any) => Number(row.isHidden) !== 1)
      .map((row: any) => mapD1ItemToMenuItem(row))
      .sort((a, b) => a.sortOrder - b.sortOrder);

    if (!items.length) {
      return json(fallbackPayload('fallback'), 'no-store');
    }

    let [categoryRows, promoRows, bannerRows, catalogBannerRows, configRow, recipeRows] = await Promise.all([
      optionalAll<any>(
        c.env.BOG_MENU_DB.prepare('SELECT id, key, name, emoji, sort_order AS sortOrder, updated_at AS updatedAt FROM menu_categories ORDER BY sort_order ASC'),
        'menu_categories'
      ),
      optionalAll<any>(
        c.env.BOG_MENU_DB.prepare(
          'SELECT id, title, description, badge, promo_label AS promoLabel, is_featured AS isFeatured, is_available AS isAvailable, sort_order AS sortOrder, tags_json, combo_links_json, asset_alt, asset_placeholder, asset_image_url, asset_image_key, updated_at AS updatedAt FROM promo_cards ORDER BY sort_order ASC'
        ),
        'promo_cards'
      ),
      optionalAll<any>(
        c.env.BOG_MENU_DB.prepare(
          'SELECT category_key AS categoryKey, title, subtitle, image_key AS imageKey, image_url AS imageUrl, updated_at AS updatedAt FROM menu_category_banners ORDER BY category_key ASC'
        ),
        'menu_category_banners'
      ),
      optionalAll<any>(
        c.env.BOG_MENU_DB.prepare(
          'SELECT id, title, subtitle, cta_label, image_key, image_url, bg_preset, badge_text, badge_color, cta_action_type, cta_target, is_active, sort_order, updated_at FROM catalog_banners WHERE is_active = 1 ORDER BY sort_order ASC'
        ),
        'catalog_banners'
      ),
      optionalFirst<any>(
        c.env.BOG_MENU_DB.prepare('SELECT brand_name, currency, order_modes_json, support_phone, hero_cta, notice, public_mode, catalog_enabled, updated_at AS updatedAt FROM site_config ORDER BY updated_at DESC LIMIT 1'),
        'site_config'
      ),
      optionalAll<any>(
        c.env.BOG_MENU_DB.prepare(`
        SELECT r.product_sku AS sku, i.name AS ingredientName
        FROM product_ingredient_recipes_v2 r
        JOIN ingredients_v2 i ON r.ingredient_id = i.id
        WHERE i.is_active = 1
        ORDER BY i.sort_order ASC, i.name ASC
      `),
        'product_ingredient_recipes_v2'
      )
    ]);

    if (!configRow && c.env.BOG_MENU_DB) {
      configRow = await optionalFirst<any>(
        c.env.BOG_MENU_DB.prepare('SELECT brand_name, currency, order_modes_json, support_phone, hero_cta, notice, updated_at AS updatedAt FROM site_config ORDER BY updated_at DESC LIMIT 1'),
        'site_config_fallback'
      );
    }

    const categories = resolveCategories(categoryRows, items);
    const promos: PromoCard[] = promoRows.map((row: any) => mapD1PromoToPromoCard(row));
    const categoryBanners = bannerRows.map((row: any) => mapD1CategoryBanner(row)).filter((banner) => isMenuCategoryKey(banner.categoryKey));
    const catalogBanners = catalogBannerRows.map((row: any) => mapD1CatalogBanner(row));
    const resolvedSiteConfig = resolveSiteConfig(configRow);
    const resolvedPublicConfig = resolvePublicConfigFromRow(configRow);

    const recipes: Record<string, string[]> = {};
    for (const rRow of recipeRows) {
      if (rRow.sku && rRow.ingredientName) {
        if (!recipes[rRow.sku]) recipes[rRow.sku] = [];
        recipes[rRow.sku].push(String(rRow.ingredientName));
      }
    }

    const updatedAt = [
      ...items.map((item) => item.updatedAt ?? ''),
      ...promos.map((promo) => promo.updatedAt ?? ''),
      ...categoryBanners.map((banner) => banner.updatedAt ?? ''),
      ...catalogBanners.map((banner) => banner.updatedAt ?? ''),
      resolvedSiteConfig.updatedAt ?? '',
      resolvedPublicConfig.updatedAt ?? ''
    ]
      .filter(Boolean)
      .sort()
      .at(-1) ?? new Date().toISOString();

    return json({
      categories,
      items,
      promos,
      recipes,
      categoryBanners,
      catalogBanners,
      siteConfig: resolvedSiteConfig,
      publicConfig: resolvedPublicConfig,
      updatedAt,
      source: 'd1'
    });
  } catch (error) {
    console.error('[menu-v2] Unexpected error, returning fallback menu:', error);
    return json(fallbackPayload('fallback'), 'no-store');
  }
});
