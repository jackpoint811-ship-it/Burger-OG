-- Migration 0026: Add is_hidden column to menu_items
-- Allows Chekeo operators to hide products from the public menu without deleting them from D1 or deleting recipes

ALTER TABLE menu_items ADD COLUMN is_hidden INTEGER NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_menu_items_hidden ON menu_items(is_hidden);
