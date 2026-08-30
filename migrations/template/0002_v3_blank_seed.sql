-- ============================================================================
-- 0002_v3_blank_seed.sql — Initial Blank Seed for Template Base ('tamplet')
-- ============================================================================

-- 1. Categorías Genéricas
INSERT OR REPLACE INTO menu_categories (id, key, name, emoji, sort_order) VALUES
  ('cat_platillos', 'platillos', 'Platillos Principales', '🍽️', 1),
  ('cat_bebidas', 'bebidas', 'Bebidas', '🥤', 2),
  ('cat_complementos', 'complementos', 'Complementos', '🍟', 3),
  ('cat_extras', 'extras', 'Extras & Aderezos', '🥫', 4);

-- 2. Rutas de Entrega Iniciales
INSERT OR REPLACE INTO tower_schedules (id, tower_key, tower_name, emoji, active_days_json, order_start_time, order_end_time, delivery_start_time, delivery_end_time, delivery_label, is_active) VALUES
  ('sch_principal', 'sucursal_principal', 'Mostrador / Sucursal Principal', '🏪', '[1,2,3,4,5,6,7]', '08:00', '22:00', '08:30', '22:30', 'Horario continuo', 1),
  ('sch_domicilio', 'domicilio_zona_1', 'Entrega a Domicilio (Zona 1)', '🛵', '[1,2,3,4,5,6,7]', '09:00', '21:30', '09:30', '22:00', 'Ruta express', 1);

-- 3. Configuración del Sitio en Blanco
INSERT OR REPLACE INTO site_config (id, brand_name, currency, order_modes_json, support_phone, hero_cta, notice, catalog_mode, catalog_config_json) VALUES
  ('config_default', 'Mi Restaurante', 'MXN', '["pickup","delivery"]', '+52 55 0000 0000', 'Armar mi pedido', '¡Bienvenidos a nuestro menú digital!', 'catalog', '{"orderWindow":{"enabled":true,"startTime":"08:00","endTime":"22:00","timezone":"America/Mexico_City"},"deliveryWindow":{"startTime":"08:30","endTime":"22:30","label":"Horario continuo"},"sameDayOrders":{"enabled":true,"paymentPercentRequired":100}}');
