-- ============================================================================
-- 0001_v3_clean_schema.sql — Consolidated Clean Schema for Burgers.exe / White-Label Core
-- ============================================================================

PRAGMA foreign_keys = ON;

-- 1. Categorías de Menú
CREATE TABLE IF NOT EXISTS menu_categories (
  id TEXT PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  emoji TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 2. Productos de Menú (Con soporte para combos, stocks, promos e ingredientes)
CREATE TABLE IF NOT EXISTS menu_items (
  id TEXT PRIMARY KEY,
  sku TEXT NOT NULL UNIQUE,
  category_key TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  price_cents INTEGER NOT NULL,
  promo_price_cents INTEGER,
  is_promo_active INTEGER NOT NULL DEFAULT 0,
  promo_expires_at TEXT,
  combo_config_json TEXT,
  stock_managed INTEGER NOT NULL DEFAULT 0,
  stock_limit INTEGER,
  stock_remaining INTEGER,
  sold_out_at TEXT,
  is_hidden INTEGER NOT NULL DEFAULT 0,
  tags_json TEXT NOT NULL DEFAULT '[]',
  badge TEXT,
  promo_label TEXT,
  is_available INTEGER NOT NULL DEFAULT 1,
  is_featured INTEGER NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0,
  image_url TEXT,
  image_key TEXT,
  combo_links_json TEXT NOT NULL DEFAULT '[]',
  upsell_items_json TEXT NOT NULL DEFAULT '[]',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (category_key) REFERENCES menu_categories(key)
);

-- 3. Insumos e Ingredientes Base
CREATE TABLE IF NOT EXISTS ingredients_v2 (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  unit TEXT NOT NULL DEFAULT 'pza',
  unit_price_cents INTEGER NOT NULL DEFAULT 0,
  category TEXT NOT NULL DEFAULT 'general',
  is_active INTEGER NOT NULL DEFAULT 1,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 4. Recetas de Productos (Mapeo Producto <-> Insumos para Personalización y KDS)
CREATE TABLE IF NOT EXISTS product_ingredient_recipes_v2 (
  id TEXT PRIMARY KEY,
  product_sku TEXT NOT NULL,
  ingredient_id TEXT NOT NULL,
  quantity_per_unit REAL NOT NULL DEFAULT 1.0,
  is_removable INTEGER NOT NULL DEFAULT 1,
  is_extra_available INTEGER NOT NULL DEFAULT 1,
  extra_price_cents INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_sku) REFERENCES menu_items(sku) ON DELETE CASCADE,
  FOREIGN KEY (ingredient_id) REFERENCES ingredients_v2(id) ON DELETE CASCADE,
  UNIQUE(product_sku, ingredient_id)
);

-- 5. Banners por Categoría
CREATE TABLE IF NOT EXISTS menu_category_banners (
  category_key TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  subtitle TEXT,
  image_key TEXT,
  image_url TEXT,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 6. Tarjetas Promocionales
CREATE TABLE IF NOT EXISTS promo_cards (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  badge TEXT,
  promo_label TEXT,
  is_featured INTEGER NOT NULL DEFAULT 0,
  is_available INTEGER NOT NULL DEFAULT 1,
  sort_order INTEGER NOT NULL DEFAULT 0,
  tags_json TEXT NOT NULL DEFAULT '[]',
  combo_links_json TEXT NOT NULL DEFAULT '[]',
  asset_alt TEXT NOT NULL DEFAULT '',
  asset_placeholder TEXT NOT NULL DEFAULT 'combo',
  asset_image_url TEXT,
  asset_image_key TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 7. Banners Promocionales y Carrusel
CREATE TABLE IF NOT EXISTS catalog_banners (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  subtitle TEXT,
  cta_label TEXT,
  image_key TEXT,
  image_url TEXT,
  is_active INTEGER NOT NULL DEFAULT 1,
  sort_order INTEGER NOT NULL DEFAULT 0,
  bg_preset TEXT,
  badge_text TEXT,
  badge_color TEXT,
  cta_action_type TEXT,
  cta_target TEXT,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 8. Horarios y Rutas de Entrega
CREATE TABLE IF NOT EXISTS tower_schedules (
  id TEXT PRIMARY KEY,
  tower_key TEXT NOT NULL UNIQUE,
  tower_name TEXT NOT NULL,
  emoji TEXT NOT NULL DEFAULT '🏢',
  active_days_json TEXT NOT NULL DEFAULT '[1,2,3,4,5]',
  order_start_time TEXT NOT NULL DEFAULT '08:00',
  order_end_time TEXT NOT NULL DEFAULT '13:30',
  delivery_start_time TEXT NOT NULL DEFAULT '13:30',
  delivery_end_time TEXT NOT NULL DEFAULT '14:30',
  delivery_label TEXT,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 9. Configuración Global del Sitio
CREATE TABLE IF NOT EXISTS site_config (
  id TEXT PRIMARY KEY,
  brand_name TEXT NOT NULL,
  currency TEXT NOT NULL DEFAULT 'MXN',
  order_modes_json TEXT NOT NULL DEFAULT '["pickup","delivery"]',
  support_phone TEXT NOT NULL DEFAULT '',
  hero_cta TEXT NOT NULL DEFAULT 'Armar mi pedido',
  notice TEXT NOT NULL DEFAULT '',
  catalog_mode TEXT NOT NULL DEFAULT 'catalog',
  catalog_config_json TEXT,
  bank_name TEXT,
  bank_account_holder TEXT,
  bank_clabe TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 10. Pedidos Principales
CREATE TABLE IF NOT EXISTS orders_v2 (
  id TEXT PRIMARY KEY,
  folio TEXT NOT NULL UNIQUE,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_notes TEXT,
  order_mode TEXT NOT NULL DEFAULT 'delivery',
  delivery_json TEXT NOT NULL DEFAULT '{}',
  payment_method TEXT NOT NULL DEFAULT 'cash',
  payment_status TEXT NOT NULL DEFAULT 'pending',
  subtotal_cents INTEGER NOT NULL DEFAULT 0,
  discount_cents INTEGER NOT NULL DEFAULT 0,
  total_cents INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'new',
  source TEXT NOT NULL DEFAULT 'public-v2',
  scheduled_for TEXT,
  target_date TEXT,
  archived_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 11. Ítems del Pedido
CREATE TABLE IF NOT EXISTS order_items_v2 (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL,
  sku TEXT NOT NULL,
  name TEXT NOT NULL,
  unit_price_cents INTEGER NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  customizations_json TEXT NOT NULL DEFAULT '{}',
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders_v2(id) ON DELETE CASCADE
);

-- 12. Bitácora de Eventos de Pedidos
CREATE TABLE IF NOT EXISTS order_events_v2 (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  payload_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders_v2(id) ON DELETE CASCADE
);

-- 13. Sorteos y Campañas de Referidos
CREATE TABLE IF NOT EXISTS raffle_campaigns_v2 (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  prize_details TEXT,
  min_order_cents INTEGER NOT NULL DEFAULT 0,
  is_active INTEGER NOT NULL DEFAULT 1,
  starts_at TEXT,
  ends_at TEXT,
  image_url TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 14. Índices de Alto Rendimiento
CREATE INDEX IF NOT EXISTS idx_menu_items_cat_sort ON menu_items(category_key, sort_order);
CREATE INDEX IF NOT EXISTS idx_menu_items_avail ON menu_items(is_available, is_hidden);
CREATE INDEX IF NOT EXISTS idx_orders_v2_status ON orders_v2(status, created_at);
CREATE INDEX IF NOT EXISTS idx_orders_v2_date ON orders_v2(target_date);
CREATE INDEX IF NOT EXISTS idx_orders_v2_archived ON orders_v2(archived_at);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items_v2(order_id);
CREATE INDEX IF NOT EXISTS idx_recipes_product_sku ON product_ingredient_recipes_v2(product_sku);
