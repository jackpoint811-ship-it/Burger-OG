-- Migration 0016: Banners 100% Personalizables
-- Añadir campos para presets de fondo degradado, badges editables y acciones de clic.

PRAGMA foreign_keys = ON;

ALTER TABLE catalog_banners ADD COLUMN bg_preset TEXT NULL;
ALTER TABLE catalog_banners ADD COLUMN badge_text TEXT NULL;
ALTER TABLE catalog_banners ADD COLUMN badge_color TEXT NULL;
ALTER TABLE catalog_banners ADD COLUMN cta_action_type TEXT NULL;
ALTER TABLE catalog_banners ADD COLUMN cta_target TEXT NULL;
