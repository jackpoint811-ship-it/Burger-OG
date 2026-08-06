-- Migration 0019: Add delivery_json column to orders_v2 table
-- Ensures order delivery metadata (location, isScheduled, scheduledDate, scheduledTime, customerNotes)
-- is persisted directly on the orders_v2 row in D1.

ALTER TABLE orders_v2 ADD COLUMN delivery_json TEXT;
