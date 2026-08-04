-- Migration 0018: Tower schedules
-- Allows Chekeo operators to control delivery days/hours per tower
-- instead of hardcoding them in the public app.

CREATE TABLE IF NOT EXISTS tower_schedules (
  id TEXT PRIMARY KEY,
  tower_key TEXT NOT NULL UNIQUE,
  tower_name TEXT NOT NULL,
  emoji TEXT NOT NULL DEFAULT '🏢',
  active_days_json TEXT NOT NULL DEFAULT '[]',
  order_start_time TEXT NOT NULL DEFAULT '09:00',
  order_end_time TEXT NOT NULL DEFAULT '11:30',
  delivery_start_time TEXT NOT NULL DEFAULT '13:30',
  delivery_end_time TEXT NOT NULL DEFAULT '14:00',
  delivery_label TEXT NULL,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_tower_schedules_active ON tower_schedules(is_active);

-- Seed default towers matching current hardcoded values
INSERT OR IGNORE INTO tower_schedules (id, tower_key, tower_name, emoji, active_days_json, order_start_time, order_end_time, delivery_start_time, delivery_end_time, delivery_label, is_active)
VALUES
  ('tower-gga', 'gga', 'Torre GGA', '🏢', '[1,3,5]', '09:00', '11:30', '13:30', '14:00', '1:30 PM a 2:00 PM', 1),
  ('tower-valcob', 'valcob', 'Torre Valcob', '🏢', '[2,4,5]', '09:00', '11:30', '13:30', '14:00', '1:30 PM a 2:00 PM', 1);
