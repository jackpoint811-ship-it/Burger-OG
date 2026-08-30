-- ============================================================================
-- 0002_amsi_tortas_seed.sql — Authentic Seed for 'Amsi Tortas' (Tortas de Chilaquiles)
-- ============================================================================

-- 1. Categorías
INSERT OR REPLACE INTO menu_categories (id, key, name, emoji, sort_order) VALUES
  ('cat_tortas', 'tortas', 'Tortas de Chilaquiles', '🥪', 1),
  ('cat_cajas', 'cajas', 'Chilaquiles en Caja', '📦', 2),
  ('cat_desayunos', 'desayunos', 'Desayunos & Huevos', '🍳', 3),
  ('cat_bebidas', 'bebidas', 'Bebidas & Jugos', '🥤', 4),
  ('cat_extras', 'extras', 'Extras & Salsas', '🥫', 5);

-- 2. Insumos e Ingredientes Base (ingredients_v2)
INSERT OR REPLACE INTO ingredients_v2 (id, name, unit, unit_price_cents, category, is_active) VALUES
  ('ing_telera', 'Telera Artesanal Dorada', 'pza', 500, 'panaderia', 1),
  ('ing_totopos', 'Totopos de Maíz Nixtamalizado', 'porc', 800, 'chilaquiles', 1),
  ('ing_salsa_verde', 'Salsa Verde Tomatillo', 'porc', 600, 'salsas', 1),
  ('ing_salsa_roja', 'Salsa Roja Chipotle', 'porc', 600, 'salsas', 1),
  ('ing_frijoles', 'Frijoles Refritos Untados', 'porc', 400, 'bases', 1),
  ('ing_crema', 'Crema Ácida de Rancho', 'porc', 500, 'lacteos', 1),
  ('ing_queso_cotija', 'Queso Cotija Rallado', 'porc', 600, 'lacteos', 1),
  ('ing_cebolla', 'Cebolla Morada Picada', 'porc', 200, 'vegetales', 1),
  ('ing_cilantro', 'Cilantro Fresco', 'porc', 200, 'vegetales', 1),
  ('ing_milanesa', 'Milanesa de Res Crujiente', 'pza', 3500, 'proteinas', 1),
  ('ing_pollo', 'Pechuga de Pollo Deshebrada', 'porc', 2500, 'proteinas', 1),
  ('ing_cecina', 'Cecina Artesanal de Yecapixtla', 'porc', 4000, 'proteinas', 1),
  ('ing_huevo', 'Huevo Estrellado Tierno', 'pza', 1200, 'proteinas', 1),
  ('ing_aguacate', 'Aguacate Fresco Hass', 'porc', 1500, 'vegetales', 1);

-- 3. Menú de Productos (menu_items)
INSERT OR REPLACE INTO menu_items (id, sku, category_key, name, description, price_cents, is_available, is_featured, sort_order, badge, promo_label, is_hidden, tags_json) VALUES
  ('item_torta_roja_milanesa', 'torta-chilaquiles-rojos-milanesa', 'tortas', 'Torta de Chilaquiles Rojos con Milanesa', 'Telera dorada con frijoles refritos, totopos crujientes bañados en salsa roja chipotle, milanesa de res, crema de rancho, queso cotija y cebolla morada.', 9500, 1, 1, 1, 'MÁS VENDIDA', 'Especialidad', 0, '["popular","chilaquiles","milanesa"]'),
  ('item_torta_verde_pollo', 'torta-chilaquiles-verdes-pollo', 'tortas', 'Torta de Chilaquiles Verdes con Pollo', 'Telera crujiente con frijoles untados, chilaquiles verdes con tomatillo asado, pechuga de pollo deshebrada, crema, queso cotija y cilantro fresco.', 8500, 1, 1, 2, 'FAVORITA', NULL, 0, '["popular","pollo","verde"]'),
  ('item_torta_divorciada_cecina', 'torta-chilaquiles-divorciados-cecina', 'tortas', 'Torta Divorciada con Cecina de Yecapixtla', 'Lo mejor de dos mundos: mitad salsa verde y mitad salsa roja, coronada con cecina artesanal dorada a la plancha, aguacate fresco, crema y queso.', 11000, 1, 1, 3, 'PREMIUM', 'Recomendación del Chef', 0, '["premium","cecina","divorciados"]'),
  ('item_torta_huevo', 'torta-chilaquiles-huevo', 'tortas', 'Torta de Chilaquiles con Huevo Estrellado', 'El clásico desayuno en telera: chilaquiles a elegir (verdes o rojos), huevo estrellado tierno con yema líquida, crema, queso fresco y frijoles.', 7500, 1, 0, 4, 'DESAYUNO', NULL, 0, '["desayuno","huevo","vegetariano"]'),
  ('item_caja_especial', 'caja-chilaquiles-especiales', 'cajas', 'Caja de Chilaquiles Especiales Amsi', 'Generosa porción de totopos bañados al momento en salsa verde o roja, servidos con frijoles refritos, crema, queso cotija, cebolla morada y bolillo con mantequilla.', 9000, 1, 1, 5, 'EN CAJA', NULL, 0, '["caja","chilaquiles"]'),
  ('item_cafe_olla', 'cafe-de-olla', 'bebidas', 'Café de Olla Artesanal', 'Café de grano recién preparado con piloncillo, canela y un toque de clavo. Calientito y reconfortante (350ml).', 3500, 1, 0, 6, 'TRADICIONAL', NULL, 0, '["caliente","cafe"]'),
  ('item_jugo_naranja', 'jugo-naranja-500', 'bebidas', 'Jugo de Naranja Natural 500ml', 'Jugo 100% natural recién exprimido todas las mañanas. Sin azúcar añadida.', 4500, 1, 0, 7, 'FRESCO', NULL, 0, '["fresco","jugo","natural"]'),
  ('item_extra_aguacate', 'extra-aguacate', 'extras', 'Porción Extra de Aguacate Hass', 'Rebanadas de aguacate fresco maduro.', 2000, 1, 0, 8, NULL, NULL, 1, '["extra"]'),
  ('item_extra_milanesa', 'extra-milanesa', 'extras', 'Milanesa de Res Adicional', 'Milanesa de res completa doradita para añadir a cualquier platillo.', 4000, 1, 0, 9, NULL, NULL, 1, '["extra"]'),
  ('item_extra_salsa', 'extra-salsa', 'extras', 'Salsa Adicional (Roja o Verde)', 'Porción extra de salsa verde o roja.', 1500, 1, 0, 10, NULL, NULL, 1, '["extra"]');

-- 4. Recetas de Productos (product_ingredient_recipes_v2)
-- A. Torta Chilaquiles Rojos con Milanesa
INSERT OR REPLACE INTO product_ingredient_recipes_v2 (id, product_sku, ingredient_id, quantity_per_unit, is_removable, is_extra_available, extra_price_cents) VALUES
  ('rec_trm_telera', 'torta-chilaquiles-rojos-milanesa', 'ing_telera', 1, 0, 0, 0),
  ('rec_trm_totopos', 'torta-chilaquiles-rojos-milanesa', 'ing_totopos', 1, 0, 1, 1500),
  ('rec_trm_salsa_roja', 'torta-chilaquiles-rojos-milanesa', 'ing_salsa_roja', 1, 1, 1, 1500),
  ('rec_trm_milanesa', 'torta-chilaquiles-rojos-milanesa', 'ing_milanesa', 1, 1, 1, 4000),
  ('rec_trm_frijoles', 'torta-chilaquiles-rojos-milanesa', 'ing_frijoles', 1, 1, 1, 1000),
  ('rec_trm_crema', 'torta-chilaquiles-rojos-milanesa', 'ing_crema', 1, 1, 1, 1000),
  ('rec_trm_queso', 'torta-chilaquiles-rojos-milanesa', 'ing_queso_cotija', 1, 1, 1, 1000),
  ('rec_trm_cebolla', 'torta-chilaquiles-rojos-milanesa', 'ing_cebolla', 1, 1, 1, 500),
  ('rec_trm_aguacate', 'torta-chilaquiles-rojos-milanesa', 'ing_aguacate', 0, 0, 1, 2000);

-- B. Torta Chilaquiles Verdes con Pollo
INSERT OR REPLACE INTO product_ingredient_recipes_v2 (id, product_sku, ingredient_id, quantity_per_unit, is_removable, is_extra_available, extra_price_cents) VALUES
  ('rec_tvp_telera', 'torta-chilaquiles-verdes-pollo', 'ing_telera', 1, 0, 0, 0),
  ('rec_tvp_totopos', 'torta-chilaquiles-verdes-pollo', 'ing_totopos', 1, 0, 1, 1500),
  ('rec_tvp_salsa_verde', 'torta-chilaquiles-verdes-pollo', 'ing_salsa_verde', 1, 1, 1, 1500),
  ('rec_tvp_pollo', 'torta-chilaquiles-verdes-pollo', 'ing_pollo', 1, 1, 1, 3000),
  ('rec_tvp_frijoles', 'torta-chilaquiles-verdes-pollo', 'ing_frijoles', 1, 1, 1, 1000),
  ('rec_tvp_crema', 'torta-chilaquiles-verdes-pollo', 'ing_crema', 1, 1, 1, 1000),
  ('rec_tvp_queso', 'torta-chilaquiles-verdes-pollo', 'ing_queso_cotija', 1, 1, 1, 1000),
  ('rec_tvp_cebolla', 'torta-chilaquiles-verdes-pollo', 'ing_cebolla', 1, 1, 1, 500),
  ('rec_tvp_cilantro', 'torta-chilaquiles-verdes-pollo', 'ing_cilantro', 1, 1, 1, 500),
  ('rec_tvp_aguacate', 'torta-chilaquiles-verdes-pollo', 'ing_aguacate', 0, 0, 1, 2000);

-- C. Torta Divorciada con Cecina
INSERT OR REPLACE INTO product_ingredient_recipes_v2 (id, product_sku, ingredient_id, quantity_per_unit, is_removable, is_extra_available, extra_price_cents) VALUES
  ('rec_tdc_telera', 'torta-chilaquiles-divorciados-cecina', 'ing_telera', 1, 0, 0, 0),
  ('rec_tdc_totopos', 'torta-chilaquiles-divorciados-cecina', 'ing_totopos', 1, 0, 1, 1500),
  ('rec_tdc_salsa_verde', 'torta-chilaquiles-divorciados-cecina', 'ing_salsa_verde', 1, 1, 1, 1500),
  ('rec_tdc_salsa_roja', 'torta-chilaquiles-divorciados-cecina', 'ing_salsa_roja', 1, 1, 1, 1500),
  ('rec_tdc_cecina', 'torta-chilaquiles-divorciados-cecina', 'ing_cecina', 1, 1, 1, 4500),
  ('rec_tdc_frijoles', 'torta-chilaquiles-divorciados-cecina', 'ing_frijoles', 1, 1, 1, 1000),
  ('rec_tdc_crema', 'torta-chilaquiles-divorciados-cecina', 'ing_crema', 1, 1, 1, 1000),
  ('rec_tdc_queso', 'torta-chilaquiles-divorciados-cecina', 'ing_queso_cotija', 1, 1, 1, 1000),
  ('rec_tdc_cebolla', 'torta-chilaquiles-divorciados-cecina', 'ing_cebolla', 1, 1, 1, 500),
  ('rec_tdc_aguacate', 'torta-chilaquiles-divorciados-cecina', 'ing_aguacate', 1, 1, 1, 2000);

-- D. Torta con Huevo Estrellado
INSERT OR REPLACE INTO product_ingredient_recipes_v2 (id, product_sku, ingredient_id, quantity_per_unit, is_removable, is_extra_available, extra_price_cents) VALUES
  ('rec_the_telera', 'torta-chilaquiles-huevo', 'ing_telera', 1, 0, 0, 0),
  ('rec_the_totopos', 'torta-chilaquiles-huevo', 'ing_totopos', 1, 0, 1, 1500),
  ('rec_the_salsa_verde', 'torta-chilaquiles-huevo', 'ing_salsa_verde', 1, 1, 1, 1500),
  ('rec_the_huevo', 'torta-chilaquiles-huevo', 'ing_huevo', 1, 1, 1, 1500),
  ('rec_the_frijoles', 'torta-chilaquiles-huevo', 'ing_frijoles', 1, 1, 1, 1000),
  ('rec_the_crema', 'torta-chilaquiles-huevo', 'ing_crema', 1, 1, 1, 1000),
  ('rec_the_queso', 'torta-chilaquiles-huevo', 'ing_queso_cotija', 1, 1, 1, 1000),
  ('rec_the_cebolla', 'torta-chilaquiles-huevo', 'ing_cebolla', 1, 1, 1, 500);

-- 5. Banners Promocionales (catalog_banners)
INSERT OR REPLACE INTO catalog_banners (id, title, subtitle, badge, gradient, cta_text, cta_action, target_sku, is_active, sort_order) VALUES
  ('banner_amsi_1', '¡Tortas de Chilaquiles Calientitas!', 'Preparadas al momento con totopos dorados y salsas artesanales.', 'ESPECIALIDAD', 'from-amber-500/20 via-orange-500/10 to-transparent', 'Ver Torta Especial', 'open_product', 'torta-chilaquiles-rojos-milanesa', 1, 1),
  ('banner_amsi_2', 'Café de Olla + Torta Favorita', 'Acompaña tu desayuno con café tradicional con canela y piloncillo.', 'DESAYUNO COMPLETO', 'from-orange-500/20 via-red-500/10 to-transparent', 'Ordenar Ahora', 'open_category', 'tortas', 1, 2);

-- 6. Rutas de Entrega para Amsi Tortas (tower_schedules)
INSERT OR REPLACE INTO tower_schedules (id, tower_key, tower_name, emoji, active_days_json, order_start_time, order_end_time, delivery_start_time, delivery_end_time, delivery_label, is_active) VALUES
  ('sch_amsi_local', 'sucursal_amsi', 'Mostrador / Pick-up Amsi', '🥪', '[1,2,3,4,5,6,7]', '07:30', '16:00', '08:00', '16:30', 'Horario Matutino', 1),
  ('sch_amsi_corporativo', 'ruta_oficinas', 'Ruta Oficinas & Corporativos', '🏢', '[1,2,3,4,5]', '07:30', '11:30', '10:00', '12:30', 'Entregas 10:00 - 12:30', 1);

-- 7. Configuración de Sitio (site_config)
INSERT OR REPLACE INTO site_config (id, brand_name, currency, order_modes_json, support_phone, hero_cta, notice, catalog_mode, catalog_config_json, bank_name, bank_account_holder, bank_clabe) VALUES
  ('config_amsi', 'Amsi Tortas', 'MXN', '["pickup","delivery"]', '+52 55 0000 0000', 'Pedir mis tortas', '¡Tortas de chilaquiles preparadas al momento! 🥪', 'catalog', '{"orderWindow":{"enabled":true,"startTime":"07:30","endTime":"16:00","timezone":"America/Mexico_City"},"deliveryWindow":{"startTime":"08:00","endTime":"16:30","label":"Horario Matutino"},"sameDayOrders":{"enabled":true,"paymentPercentRequired":100}}', 'BBVA', 'Amsi Tortas Oficial', '012180000000000000');
