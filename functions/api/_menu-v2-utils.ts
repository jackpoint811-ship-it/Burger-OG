import type { CatalogBanner, MenuCategoryBanner, MenuItem, PromoCard } from '../../packages/config/src';

export const parseJsonArray = (value: unknown): string[] => {
  if (typeof value !== 'string') return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter((entry): entry is string => typeof entry === 'string') : [];
  } catch {
    return [];
  }
};

export const parseJsonObject = <T = Record<string, unknown>>(value: unknown): T | undefined => {
  if (typeof value === 'object' && value !== null) return value as T;
  if (typeof value !== 'string') return undefined;
  try {
    const parsed = JSON.parse(value);
    return typeof parsed === 'object' && parsed !== null ? (parsed as T) : undefined;
  } catch {
    return undefined;
  }
};

export const mapD1ItemToMenuItem = (row: any): MenuItem => ({
  sku: row.sku,
  category: row.category,
  name: row.name,
  description: row.description,
  price: Number(row.price) / 100,
  promoPrice: (row.promo_price_cents != null || row.promoPriceCents != null) && row.promo_price_cents !== '' && row.promoPriceCents !== '' ? Number(row.promo_price_cents ?? row.promoPriceCents) / 100 : undefined,
  isPromoActive: Boolean(row.is_promo_active ?? row.isPromoActive ?? false),
  promoExpiresAt: row.promo_expires_at ?? row.promoExpiresAt ?? undefined,
  comboConfig: parseJsonObject(row.combo_config_json ?? row.comboConfig),
  tags: parseJsonArray(row.tags_json),
  badge: row.badge ?? undefined,
  promoLabel: row.promoLabel ?? undefined,
  isAvailable: Boolean(row.effectiveIsAvailable ?? row.isAvailable),
  isHidden: Boolean(row.isHidden ?? row.is_hidden ?? false),
  stockManaged: Boolean(row.stockManaged ?? row.stock_managed ?? false),
  stockLimit: row.stockLimit ?? row.stock_limit ?? undefined,
  stockRemaining: row.stockRemaining ?? row.stock_remaining ?? undefined,
  soldOutAt: row.soldOutAt ?? row.sold_out_at ?? undefined,
  isFeatured: Boolean(row.isFeatured),
  sortOrder: Number(row.sortOrder),
  imageUrl: row.imageUrl ?? undefined,
  imageKey: row.imageKey ?? undefined,
  comboLinks: parseJsonArray(row.combo_links_json),
  upsellItems: parseJsonArray(row.upsell_items_json),
  updatedAt: row.updatedAt
});

export const mapD1PromoToPromoCard = (row: any): PromoCard => ({
  id: row.id,
  title: row.title,
  description: row.description,
  badge: row.badge ?? undefined,
  promoLabel: row.promoLabel ?? undefined,
  isFeatured: Boolean(row.isFeatured),
  isAvailable: Boolean(row.isAvailable),
  sortOrder: Number(row.sortOrder),
  tags: parseJsonArray(row.tags_json),
  comboLinks: parseJsonArray(row.combo_links_json),
  asset: {
    alt: row.asset_alt ?? row.title,
    placeholder: row.asset_placeholder ?? 'combo',
    imageUrl: row.asset_image_url ?? undefined,
    imageKey: row.asset_image_key ?? undefined
  },
  updatedAt: row.updatedAt
});


export const mapD1CategoryBanner = (row: any): MenuCategoryBanner => ({
  categoryKey: row.categoryKey ?? row.category_key,
  title: row.title ?? undefined,
  subtitle: row.subtitle ?? undefined,
  imageKey: row.imageKey ?? row.image_key ?? undefined,
  imageUrl: row.imageUrl ?? row.image_url ?? undefined,
  updatedAt: row.updatedAt ?? row.updated_at
});

export const mapD1CatalogBanner = (row: any): CatalogBanner => ({
  id: row.id,
  title: row.title,
  subtitle: row.subtitle ?? undefined,
  ctaLabel: row.cta_label ?? row.ctaLabel ?? undefined,
  imageKey: row.image_key ?? row.imageKey ?? undefined,
  imageUrl: row.image_url ?? row.imageUrl ?? undefined,
  bgPreset: row.bg_preset ?? row.bgPreset ?? undefined,
  badgeText: row.badge_text ?? row.badgeText ?? undefined,
  badgeColor: row.badge_color ?? row.badgeColor ?? undefined,
  ctaActionType: row.cta_action_type ?? row.ctaActionType ?? undefined,
  ctaTarget: row.cta_target ?? row.ctaTarget ?? undefined,
  isActive: Boolean(row.is_active ?? row.isActive ?? true),
  sortOrder: Number(row.sort_order ?? row.sortOrder ?? 0),
  updatedAt: row.updated_at ?? row.updatedAt ?? undefined,
});

export const DEFAULT_CATALOG_BANNERS = [
  {
    id: 'cb-default-1',
    title: '🔥 COMBO OVERCLOCK 2x1',
    subtitle: 'Lleva 2 combos seleccionados por el precio de 1',
    cta_label: 'Ver combo',
    image_key: null,
    image_url: null,
    bg_preset: 'green',
    badge_text: '🔥 PROMO 2X1',
    badge_color: null,
    cta_action_type: null,
    cta_target: null,
    is_active: 1,
    sort_order: 1,
  },
  {
    id: 'cb-default-2',
    title: '🎮 BUNDLE GAMER NIGHT',
    subtitle: 'Smash Burger + Papas Overclock + Bebida Cyber',
    cta_label: 'Pedir bundle',
    image_key: null,
    image_url: null,
    bg_preset: 'purple',
    badge_text: '🎮 DESTACADO',
    badge_color: null,
    cta_action_type: null,
    cta_target: null,
    is_active: 1,
    sort_order: 2,
  },
  {
    id: 'cb-default-3',
    title: '⚡ ENVÍO GRATIS $0',
    subtitle: 'En entregas programadas a tu oficina',
    cta_label: 'Ordenar ahora',
    image_key: null,
    image_url: null,
    bg_preset: 'orange',
    badge_text: '⚡ ENVÍO $0',
    badge_color: null,
    cta_action_type: null,
    cta_target: null,
    is_active: 1,
    sort_order: 3,
  },
];
