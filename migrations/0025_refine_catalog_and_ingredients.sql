PRAGMA foreign_keys = ON;

-- 1. Renombrar Carne Sirloin a "Carne Sirloin Especial"
UPDATE ingredients_v2
SET name = 'Carne Sirloin Especial', updated_at = CURRENT_TIMESTAMP
WHERE id = 'ing_carne_sirloin';

-- 2. Eliminar el Pan duplicado antiguo (dejar solo Pan Bimbollo parrillero)
DELETE FROM product_ingredient_recipes_v2 WHERE ingredient_id = 'ing_3f8da2b9-2c0c-4d0c-888f-2d51d549d61f';
DELETE FROM ingredients_v2 WHERE id = 'ing_3f8da2b9-2c0c-4d0c-888f-2d51d549d61f';

-- 3. Eliminar EL DIABLO (burger y combo) del menú
DELETE FROM product_ingredient_recipes_v2 WHERE product_sku = 'EL_DIABLO';
DELETE FROM menu_items WHERE sku IN ('EL_DIABLO', 'COMBO-EL-DIABLO');

-- 4. Eliminar todas las bebidas del menú
DELETE FROM menu_items WHERE sku IN ('DRK-COKE', 'DRK-COKE-ZERO', 'DRK-WATER', 'DRK-COLA');

-- 5. Ajustar cantidades de recetas a enteros (1.0 pieza) en lugar de fracciones (0.5)
UPDATE product_ingredient_recipes_v2
SET quantity_per_unit = 1.0, updated_at = CURRENT_TIMESTAMP
WHERE ingredient_id IN ('ing_queso_manchego', 'ing_tocino') AND product_sku IN ('OG', 'BBQ');
