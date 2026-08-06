PRAGMA foreign_keys = ON;

-- 1. Inserción de Ingredientes / Insumos Oficiales desde hoja de Recetas
INSERT OR REPLACE INTO ingredients_v2 (id, name, unit, unit_price_cents, is_quantifiable, is_active, sort_order, updated_at) VALUES
  ('ing_pan_bimbollo', 'Pan Bimbollo parrillero', 'pieza', NULL, 1, 1, 1, CURRENT_TIMESTAMP),
  ('ing_carne_sirloin', 'Carne Sirloin', 'pieza', NULL, 1, 1, 2, CURRENT_TIMESTAMP),
  ('ing_queso_americano', 'Queso americano', 'pieza', NULL, 1, 1, 3, CURRENT_TIMESTAMP),
  ('ing_queso_manchego', 'Queso manchego', 'pieza', NULL, 1, 1, 4, CURRENT_TIMESTAMP),
  ('ing_tocino', 'Tocino', 'pieza', NULL, 1, 1, 5, CURRENT_TIMESTAMP),
  ('ing_lechuga', 'Lechuga', 'pieza', NULL, 1, 1, 6, CURRENT_TIMESTAMP),
  ('ing_jitomate', 'Jitomate', 'pieza', NULL, 1, 1, 7, CURRENT_TIMESTAMP),
  ('ing_pepinillos', 'Pepinillos', 'pieza', NULL, 1, 1, 8, CURRENT_TIMESTAMP),
  ('ing_mayonesa', 'Mayonesa', 'g', NULL, 1, 1, 9, CURRENT_TIMESTAMP),
  ('ing_catsup', 'Catsup', 'pieza', NULL, 1, 1, 10, CURRENT_TIMESTAMP),
  ('ing_mostaza', 'Mostaza', 'pieza', NULL, 1, 1, 11, CURRENT_TIMESTAMP),
  ('ing_aros_cebolla', 'Aros de cebolla', 'pieza', NULL, 1, 1, 12, CURRENT_TIMESTAMP),
  ('ing_salsa_bbq', 'Salsa BBQ', 'ml', NULL, 1, 1, 13, CURRENT_TIMESTAMP),
  ('ing_queso_crema', 'Queso crema', 'g', NULL, 1, 1, 14, CURRENT_TIMESTAMP),
  ('ing_rajas_nachos', 'Rajas de nachos', 'g', NULL, 1, 1, 15, CURRENT_TIMESTAMP),
  ('ing_rajas_tempura', 'Rajas tempura', 'g', NULL, 1, 1, 16, CURRENT_TIMESTAMP),
  ('ing_papas', 'Papas congeladas', 'g', NULL, 1, 1, 17, CURRENT_TIMESTAMP),
  ('ing_aceite', 'Aceite', 'ml', NULL, 1, 1, 18, CURRENT_TIMESTAMP),
  ('ing_sal', 'Sal', 'g', NULL, 1, 1, 19, CURRENT_TIMESTAMP),
  ('ing_paprika', 'Páprika', 'g', NULL, 1, 1, 20, CURRENT_TIMESTAMP),
  ('ing_pimienta_molida', 'Pimienta molida', 'g', NULL, 1, 1, 21, CURRENT_TIMESTAMP),
  ('ing_ajo_polvo', 'Ajo en polvo', 'g', NULL, 1, 1, 22, CURRENT_TIMESTAMP),
  ('ing_chipotle_polvo', 'Chipotle en polvo', 'g', NULL, 1, 1, 23, CURRENT_TIMESTAMP),
  ('ing_lemon_pepper', 'Lemon & Pepper', 'g', NULL, 1, 1, 24, CURRENT_TIMESTAMP);

-- 2. Receta: Hamburguesa OG (SKU: OG)
INSERT OR REPLACE INTO product_ingredient_recipes_v2 (id, product_sku, ingredient_id, quantity_per_unit, updated_at) VALUES
  ('rec_og_pan', 'OG', 'ing_pan_bimbollo', 1.0, CURRENT_TIMESTAMP),
  ('rec_og_carne', 'OG', 'ing_carne_sirloin', 1.0, CURRENT_TIMESTAMP),
  ('rec_og_q_amer', 'OG', 'ing_queso_americano', 1.0, CURRENT_TIMESTAMP),
  ('rec_og_q_manch', 'OG', 'ing_queso_manchego', 0.5, CURRENT_TIMESTAMP),
  ('rec_og_tocino', 'OG', 'ing_tocino', 0.5, CURRENT_TIMESTAMP),
  ('rec_og_lechuga', 'OG', 'ing_lechuga', 1.0, CURRENT_TIMESTAMP),
  ('rec_og_jitomate', 'OG', 'ing_jitomate', 1.0, CURRENT_TIMESTAMP),
  ('rec_og_pepinillos', 'OG', 'ing_pepinillos', 2.0, CURRENT_TIMESTAMP),
  ('rec_og_mayo', 'OG', 'ing_mayonesa', 15.0, CURRENT_TIMESTAMP),
  ('rec_og_catsup', 'OG', 'ing_catsup', 1.0, CURRENT_TIMESTAMP),
  ('rec_og_mostaza', 'OG', 'ing_mostaza', 1.0, CURRENT_TIMESTAMP);

-- 3. Receta: Hamburguesa BBQ (SKU: BBQ)
INSERT OR REPLACE INTO product_ingredient_recipes_v2 (id, product_sku, ingredient_id, quantity_per_unit, updated_at) VALUES
  ('rec_bbq_pan', 'BBQ', 'ing_pan_bimbollo', 1.0, CURRENT_TIMESTAMP),
  ('rec_bbq_carne', 'BBQ', 'ing_carne_sirloin', 1.0, CURRENT_TIMESTAMP),
  ('rec_bbq_tocino', 'BBQ', 'ing_tocino', 2.0, CURRENT_TIMESTAMP),
  ('rec_bbq_q_amer', 'BBQ', 'ing_queso_americano', 1.0, CURRENT_TIMESTAMP),
  ('rec_bbq_q_manch', 'BBQ', 'ing_queso_manchego', 0.5, CURRENT_TIMESTAMP),
  ('rec_bbq_aros', 'BBQ', 'ing_aros_cebolla', 2.0, CURRENT_TIMESTAMP),
  ('rec_bbq_salsa', 'BBQ', 'ing_salsa_bbq', 15.0, CURRENT_TIMESTAMP),
  ('rec_bbq_catsup', 'BBQ', 'ing_catsup', 1.0, CURRENT_TIMESTAMP);

-- 4. Receta: Papas OG (SKU: PAPAS_OG)
INSERT OR REPLACE INTO product_ingredient_recipes_v2 (id, product_sku, ingredient_id, quantity_per_unit, updated_at) VALUES
  ('rec_papas_og_papas', 'PAPAS_OG', 'ing_papas', 100.0, CURRENT_TIMESTAMP),
  ('rec_papas_og_aceite', 'PAPAS_OG', 'ing_aceite', 22.5, CURRENT_TIMESTAMP),
  ('rec_papas_og_sal', 'PAPAS_OG', 'ing_sal', 2.0, CURRENT_TIMESTAMP),
  ('rec_papas_og_paprika', 'PAPAS_OG', 'ing_paprika', 1.0, CURRENT_TIMESTAMP),
  ('rec_papas_og_pimienta', 'PAPAS_OG', 'ing_pimienta_molida', 1.0, CURRENT_TIMESTAMP),
  ('rec_papas_og_ajo', 'PAPAS_OG', 'ing_ajo_polvo', 1.0, CURRENT_TIMESTAMP);

-- 5. Receta: Papas Especiales (SKU: PAPAS_ESPECIALES)
INSERT OR REPLACE INTO product_ingredient_recipes_v2 (id, product_sku, ingredient_id, quantity_per_unit, updated_at) VALUES
  ('rec_papas_esp_papas', 'PAPAS_ESPECIALES', 'ing_papas', 100.0, CURRENT_TIMESTAMP),
  ('rec_papas_esp_aceite', 'PAPAS_ESPECIALES', 'ing_aceite', 22.5, CURRENT_TIMESTAMP),
  ('rec_papas_esp_sal', 'PAPAS_ESPECIALES', 'ing_sal', 2.0, CURRENT_TIMESTAMP),
  ('rec_papas_esp_chipotle', 'PAPAS_ESPECIALES', 'ing_chipotle_polvo', 1.0, CURRENT_TIMESTAMP),
  ('rec_papas_esp_pimienta', 'PAPAS_ESPECIALES', 'ing_pimienta_molida', 1.0, CURRENT_TIMESTAMP);

-- 6. Receta: Papas Lemon & Pepper (SKU: PAPAS_LEMON_PEPPER)
INSERT OR REPLACE INTO product_ingredient_recipes_v2 (id, product_sku, ingredient_id, quantity_per_unit, updated_at) VALUES
  ('rec_papas_lemon_papas', 'PAPAS_LEMON_PEPPER', 'ing_papas', 100.0, CURRENT_TIMESTAMP),
  ('rec_papas_lemon_aceite', 'PAPAS_LEMON_PEPPER', 'ing_aceite', 22.5, CURRENT_TIMESTAMP),
  ('rec_papas_lemon_sazon', 'PAPAS_LEMON_PEPPER', 'ing_lemon_pepper', 3.0, CURRENT_TIMESTAMP);
