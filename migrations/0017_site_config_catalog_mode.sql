-- Migration 0017: site_config catalog_mode & public_mode columns
PRAGMA foreign_keys = ON;

ALTER TABLE site_config ADD COLUMN public_mode TEXT NOT NULL DEFAULT 'flow';
ALTER TABLE site_config ADD COLUMN catalog_enabled INTEGER NOT NULL DEFAULT 0;
