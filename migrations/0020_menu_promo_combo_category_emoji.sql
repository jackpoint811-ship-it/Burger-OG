-- Add columns for promo prices, active state, expiration, combo options config and category emojis
ALTER TABLE menu_items ADD COLUMN promo_price_cents INTEGER DEFAULT NULL;
ALTER TABLE menu_items ADD COLUMN is_promo_active INTEGER NOT NULL DEFAULT 0;
ALTER TABLE menu_items ADD COLUMN promo_expires_at TEXT DEFAULT NULL;
ALTER TABLE menu_items ADD COLUMN combo_config_json TEXT DEFAULT NULL;
ALTER TABLE menu_categories ADD COLUMN emoji TEXT DEFAULT NULL;
