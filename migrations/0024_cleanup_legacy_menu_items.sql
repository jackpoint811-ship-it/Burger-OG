PRAGMA foreign_keys = ON;

-- 1. Actualización de combo_links en promo_cards para apuntar a los SKUs activos
UPDATE promo_cards
SET combo_links_json = '["OG","PAPAS_OG"]'
WHERE id = 'PROMO-COMBO-OG';

UPDATE promo_cards
SET combo_links_json = '["BBQ"]'
WHERE id = 'PROMO-SPICY-NIGHT';

-- 2. Eliminación limpia de los ítems legacy en menu_items
DELETE FROM menu_items
WHERE sku IN (
  'BRG-OG',
  'BRG-SPICY',
  'GUA-FRIES',
  'EXT-BACON',
  'DRK-COLA'
);
