PRAGMA foreign_keys = ON;

-- 1. Actualización de Burger OG
UPDATE menu_items
SET
  name = 'Burger OG',
  description = 'La que inició todo. Carne Sirloin jugosa con doble queso, tocino crujiente y vegetales frescos. Cero fallas en el sistema.',
  price_cents = 8500,
  tags_json = '["burger","signature"]',
  badge = 'Best Seller',
  promo_label = 'Hot',
  is_available = 1,
  is_featured = 1,
  sort_order = 1,
  combo_links_json = '["PAPAS_OG"]',
  upsell_items_json = '["EXTRA_TOCINO","EXTRA_QUESO_AMERICANO"]',
  updated_at = CURRENT_TIMESTAMP
WHERE sku = 'OG';

-- 2. Actualización de Burger BBQ
UPDATE menu_items
SET
  name = 'Burger BBQ',
  description = 'Carne Sirloin con aros de cebolla crujientes metidos directo en tu hamburguesa, doble tocino y salsa BBQ chorreando. Puro goce.',
  price_cents = 8500,
  tags_json = '["burger","bbq"]',
  badge = 'Popular',
  promo_label = 'Top',
  is_available = 1,
  is_featured = 1,
  sort_order = 2,
  combo_links_json = '["PAPAS_OG"]',
  upsell_items_json = '["EXTRA_TOCINO","EXTRA_QUESO_MANCHEGO"]',
  updated_at = CURRENT_TIMESTAMP
WHERE sku = 'BBQ';
