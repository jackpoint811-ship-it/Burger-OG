-- PREVIEW RESET ORDERS SCRIPT
-- Safely cleans order tables in D1 Preview database (burgers-exe-menu-v2-preview).
-- DO NOT EXECUTE ON PRODUCTION (burgers-exe-menu-live).

PRAGMA foreign_keys = ON;

DELETE FROM order_events_v2;
DELETE FROM order_items_v2;
DELETE FROM order_items;
DELETE FROM orders_v2;

-- Confirm clean state
SELECT COUNT(*) AS remaining_orders FROM orders_v2;
