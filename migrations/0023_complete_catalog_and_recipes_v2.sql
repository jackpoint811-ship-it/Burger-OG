PRAGMA foreign_keys = ON;

-- 1. Agregar / Actualizar la Hamburguesa EL DIABLO
INSERT INTO menu_items (
  id, sku, category_key, name, description, price_cents, tags_json, badge, promo_label,
  is_available, is_featured, sort_order, image_url, image_key, combo_links_json,
  upsell_items_json, updated_at
) VALUES (
  'menu-el-diablo',
  'EL_DIABLO',
  'burgers',
  'Burger El Diablo',
  'No apta para miedosos. Carne Sirloin, queso crema suavizante, el crunch único de las rajas tempura y el toque picante de rajas de nachos.',
  9500,
  '["burger","spicy"]',
  'Nuevo',
  'Spicy',
  1,
  1,
  3,
  NULL,
  'menu/EL_DIABLO.png',
  '["PAPAS_ESPECIALES"]',
  '["EXTRA_TOCINO","EXTRA_QUESO_CREMA"]',
  CURRENT_TIMESTAMP
) ON CONFLICT(sku) DO UPDATE SET
  name = excluded.name,
  description = excluded.description,
  price_cents = excluded.price_cents,
  tags_json = excluded.tags_json,
  badge = excluded.badge,
  promo_label = excluded.promo_label,
  is_available = excluded.is_available,
  is_featured = excluded.is_featured,
  sort_order = excluded.sort_order,
  updated_at = CURRENT_TIMESTAMP;

-- 2. Receta para Burger El Diablo
INSERT OR REPLACE INTO product_ingredient_recipes_v2 (id, product_sku, ingredient_id, quantity_per_unit, updated_at) VALUES
  ('rec_diablo_pan', 'EL_DIABLO', 'ing_pan_bimbollo', 1.0, CURRENT_TIMESTAMP),
  ('rec_diablo_carne', 'EL_DIABLO', 'ing_carne_sirloin', 1.0, CURRENT_TIMESTAMP),
  ('rec_diablo_tocino', 'EL_DIABLO', 'ing_tocino', 1.0, CURRENT_TIMESTAMP),
  ('rec_diablo_q_amer', 'EL_DIABLO', 'ing_queso_americano', 1.0, CURRENT_TIMESTAMP),
  ('rec_diablo_q_crema', 'EL_DIABLO', 'ing_queso_crema', 30.0, CURRENT_TIMESTAMP),
  ('rec_diablo_nachos', 'EL_DIABLO', 'ing_rajas_nachos', 20.0, CURRENT_TIMESTAMP),
  ('rec_diablo_tempura', 'EL_DIABLO', 'ing_rajas_tempura', 20.0, CURRENT_TIMESTAMP),
  ('rec_diablo_catsup', 'EL_DIABLO', 'ing_catsup', 1.0, CURRENT_TIMESTAMP);

-- 3. Actualizar / Activar Guarniciones
UPDATE menu_items SET name = 'Papas OG', description = 'Papas crujientes de 100g con nuestro sazón original de ajo, páprika y especias. No se comparten.', price_cents = 2500, is_available = 1, sort_order = 10 WHERE sku = 'PAPAS_OG';
UPDATE menu_items SET name = 'Papas Especiales', description = 'Papas horneadas al punto perfecto con un toque ahumado y picosito de chipotle.', price_cents = 2500, is_available = 1, sort_order = 11 WHERE sku = 'PAPAS_ESPECIALES';
UPDATE menu_items SET name = 'Papas Lemon & Pepper', description = 'Toque cítrico de limón con la fuerza de la pimienta negra molida. Ultra adictivas.', price_cents = 2500, is_available = 1, sort_order = 12 WHERE sku = 'PAPAS_LEMON_PEPPER';
UPDATE menu_items SET name = 'Aros de Cebolla', description = 'Anillos dorados con empanizado súper crujiente y cebolla dulce por dentro.', price_cents = 3000, is_available = 1, sort_order = 13 WHERE sku = 'AROS_CEBOLLA';

-- 4. Actualizar / Activar Combos
UPDATE menu_items SET name = 'Combo OG Full Loaded', description = 'Tu Hamburguesa OG con sus vegetales y doble queso, acompañada de papitas recién hechas y refresco helado.', price_cents = 9900, is_available = 1, combo_links_json = '["PAPAS_OG","OG"]', sort_order = 1 WHERE sku = '0001' OR sku = 'COMBO-OG';
UPDATE menu_items SET name = 'Combo BBQ Master', description = 'Paquete completo con extra de tocino y aros crujientes. Acompáñalo con unas papitas y refresco helado.', price_cents = 9900, is_available = 1, combo_links_json = '["PAPAS_OG","BBQ"]', sort_order = 2 WHERE sku = 'COMBO-BBQ';

INSERT INTO menu_items (
  id, sku, category_key, name, description, price_cents, tags_json, badge, promo_label,
  is_available, is_featured, sort_order, image_url, image_key, combo_links_json,
  upsell_items_json, updated_at
) VALUES (
  'menu-combo-diablo',
  'COMBO-EL-DIABLO',
  'combos',
  'Combo El Diablo',
  'La picante Diablo con rajas tempura y queso crema, junto a tus papas y un refresco helado para apagar el fuego.',
  10900,
  '["combo","spicy"]',
  'Hack',
  'Hack Price',
  1,
  1,
  3,
  NULL,
  'menu/COMBO-EL-DIABLO.png',
  '["PAPAS_ESPECIALES","EL_DIABLO"]',
  '[]',
  CURRENT_TIMESTAMP
) ON CONFLICT(sku) DO UPDATE SET
  name = excluded.name,
  description = excluded.description,
  price_cents = excluded.price_cents,
  is_available = excluded.is_available,
  sort_order = excluded.sort_order,
  updated_at = CURRENT_TIMESTAMP;

-- 5. Actualizar / Activar Extras
UPDATE menu_items SET name = 'Pepinillos', description = 'Rodajas extra de pepinillo encurtido con el crunch ácido ideal.', price_cents = 500, is_available = 1 WHERE sku = 'EXTRA_PEPINILLOS';
UPDATE menu_items SET name = 'Queso americano', description = 'Extra loncha de queso americano cremoso.', price_cents = 700, is_available = 1 WHERE sku = 'EXTRA_QUESO_AMERICANO';
UPDATE menu_items SET name = 'Queso manchego', description = 'Sabor intenso con extra queso manchego derretido.', price_cents = 700, is_available = 1 WHERE sku = 'EXTRA_QUESO_MANCHEGO';
UPDATE menu_items SET name = 'Tocino', description = 'Tiras adicionales de tocino ahumado súper crujiente.', price_cents = 1000, is_available = 1 WHERE sku = 'EXTRA_TOCINO';
UPDATE menu_items SET name = 'Catsup', description = 'Sobre extra de salsa catsup dulce clásica.', price_cents = 100, is_available = 1 WHERE sku = 'EXTRA_CATSUP';
UPDATE menu_items SET name = 'Mostaza', description = 'Sobre extra de mostaza con punch ácido.', price_cents = 100, is_available = 1 WHERE sku = 'EXTRA_MOSTAZA';
UPDATE menu_items SET name = 'Tomate', description = 'Rodaja extra de jitomate fresco.', price_cents = 500, is_available = 1 WHERE sku = 'EXTRA_TOMATE';

INSERT INTO menu_items (
  id, sku, category_key, name, description, price_cents, tags_json, badge, promo_label,
  is_available, is_featured, sort_order, image_url, image_key, combo_links_json,
  upsell_items_json, updated_at
) VALUES
  ('menu-extra-queso-crema', 'EXTRA_QUESO_CREMA', 'extras', 'Queso Crema', 'Porción de queso crema suave.', 1000, '["extra"]', NULL, NULL, 1, 0, 27, NULL, NULL, '[]', '[]', CURRENT_TIMESTAMP),
  ('menu-extra-rajas-tempura', 'EXTRA_RAJAS_TEMPURA', 'extras', 'Rajas Tempura', 'Crujiente tempura picante.', 1000, '["extra"]', NULL, NULL, 1, 0, 28, NULL, NULL, '[]', '[]', CURRENT_TIMESTAMP),
  ('menu-extra-salsa-bbq', 'EXTRA_SALSA_BBQ', 'extras', 'Salsa BBQ', 'Dipping extra de salsa BBQ ahumada.', 500, '["extra"]', NULL, NULL, 1, 0, 29, NULL, NULL, '[]', '[]', CURRENT_TIMESTAMP)
ON CONFLICT(sku) DO UPDATE SET
  name = excluded.name,
  description = excluded.description,
  price_cents = excluded.price_cents,
  is_available = excluded.is_available,
  updated_at = CURRENT_TIMESTAMP;

-- 6. Agregar / Activar Bebidas
INSERT INTO menu_items (
  id, sku, category_key, name, description, price_cents, tags_json, badge, promo_label,
  is_available, is_featured, sort_order, image_url, image_key, combo_links_json,
  upsell_items_json, updated_at
) VALUES
  ('menu-drk-coke', 'DRK-COKE', 'drinks', 'Coca-Cola Original', 'La clásica helada 355ml.', 3500, '["drink"]', NULL, NULL, 1, 0, 30, NULL, 'menu/coke.png', '[]', '[]', CURRENT_TIMESTAMP),
  ('menu-drk-coke-zero', 'DRK-COKE-ZERO', 'drinks', 'Coca-Cola Zero', 'El mismo sabor cero azúcar 355ml.', 3500, '["drink"]', NULL, NULL, 1, 0, 31, NULL, 'menu/coke-zero.png', '[]', '[]', CURRENT_TIMESTAMP),
  ('menu-drk-water', 'DRK-WATER', 'drinks', 'Agua Ciel', 'Agua pura embotellada 600ml.', 2500, '["drink"]', NULL, NULL, 1, 0, 32, NULL, 'menu/water.png', '[]', '[]', CURRENT_TIMESTAMP)
ON CONFLICT(sku) DO UPDATE SET
  name = excluded.name,
  description = excluded.description,
  price_cents = excluded.price_cents,
  is_available = excluded.is_available,
  updated_at = CURRENT_TIMESTAMP;
