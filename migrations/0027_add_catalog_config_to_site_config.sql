-- Migration 0027: Add public_mode and catalog_enabled to site_config
-- Ensures site_config explicitly supports catalog mode selection in D1

ALTER TABLE site_config ADD COLUMN public_mode TEXT NOT NULL DEFAULT 'catalog';
ALTER TABLE site_config ADD COLUMN catalog_enabled INTEGER NOT NULL DEFAULT 1;
