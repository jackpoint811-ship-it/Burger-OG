import { Hono } from 'hono';
import type { AppEnv } from '../_types';
import { errorResponse, generateId, json, parseJsonObject, requireAdminToken } from '../_orders-v2-utils';
import { mapD1Ingredient, mapD1Recipe, normalizeIngredientPayload } from '../_ingredients-v2-utils';

export const ingredientsAdminRouter = new Hono<AppEnv>();

type RecipeInput = { ingredientId: string; quantityPerUnit: number };

const normalizeSku = (value: unknown) =>
  String(value ?? '')
    .trim()
    .toUpperCase();

const loadRecipes = async (db: D1Database, sku: string) => {
  const result = await db
    .prepare(
      `SELECT r.*, i.name AS ingredient_name, i.unit AS ingredient_unit, i.unit_price_cents AS ingredient_unit_price_cents,
            i.is_quantifiable AS ingredient_is_quantifiable, i.is_active AS ingredient_is_active, i.sort_order AS ingredient_sort_order,
            i.created_at AS ingredient_created_at, i.updated_at AS ingredient_updated_at
     FROM product_ingredient_recipes_v2 r
     JOIN ingredients_v2 i ON i.id = r.ingredient_id
     WHERE r.product_sku = ?
     ORDER BY i.sort_order ASC, i.name ASC`
    )
    .bind(sku)
    .all();
  return (result.results ?? []).map(mapD1Recipe);
};

const parseRecipeInputs = (body: Record<string, unknown>): RecipeInput[] | Response => {
  const raw = Array.isArray(body.recipes) ? body.recipes : [];
  const seen = new Set<string>();
  const recipes: RecipeInput[] = [];
  for (const entry of raw) {
    if (!entry || typeof entry !== 'object' || Array.isArray(entry))
      return errorResponse(400, 'INVALID_RECIPE', 'Receta inválida.');
    const item = entry as Record<string, unknown>;
    const ingredientId = String(item.ingredientId ?? item.ingredient_id ?? '').trim();
    const quantityPerUnit = Number(item.quantityPerUnit ?? item.quantity_per_unit);
    if (!ingredientId || !Number.isFinite(quantityPerUnit) || quantityPerUnit <= 0)
      return errorResponse(400, 'INVALID_RECIPE', 'Cantidad por producto inválida.');
    if (!seen.has(ingredientId)) {
      seen.add(ingredientId);
      recipes.push({ ingredientId, quantityPerUnit });
    }
  }
  return recipes;
};

// GET /api/ingredients-v2-admin
ingredientsAdminRouter.get('/', async (c) => {
  if (!c.env.BOG_MENU_DB) return errorResponse(503, 'D1_NOT_CONFIGURED', 'BOG_MENU_DB no está configurado.');
  const authError = await requireAdminToken(c.req.raw, c.env);
  if (authError) return authError;

  const result = await c.env.BOG_MENU_DB.prepare('SELECT * FROM ingredients_v2 ORDER BY sort_order ASC, name ASC').all();
  return json(200, { ok: true, data: { ingredients: (result.results ?? []).map(mapD1Ingredient) } });
});

// POST /api/ingredients-v2-admin
ingredientsAdminRouter.post('/', async (c) => {
  if (!c.env.BOG_MENU_DB) return errorResponse(503, 'D1_NOT_CONFIGURED', 'BOG_MENU_DB no está configurado.');
  const authError = await requireAdminToken(c.req.raw, c.env);
  if (authError) return authError;

  const body = await parseJsonObject(c.req.raw);
  if (!body) return errorResponse(400, 'INVALID_JSON', 'JSON inválido.');
  const payload = normalizeIngredientPayload(body);
  if (payload instanceof Response) return payload;

  const id = generateId('ing');
  await c.env.BOG_MENU_DB.prepare(
    `INSERT INTO ingredients_v2 (id, name, unit, unit_price_cents, is_quantifiable, is_active, sort_order)
     VALUES (?, ?, ?, ?, 1, ?, ?)`
  )
    .bind(id, payload.name, payload.unit, payload.unitPriceCents, payload.isActive ? 1 : 0, payload.sortOrder)
    .run();

  const row = await c.env.BOG_MENU_DB.prepare('SELECT * FROM ingredients_v2 WHERE id = ? LIMIT 1').bind(id).first();
  return json(201, { ok: true, data: { ingredient: mapD1Ingredient(row) } });
});

// GET /api/ingredients-v2-admin/recipes/:sku
ingredientsAdminRouter.get('/recipes/:sku', async (c) => {
  if (!c.env.BOG_MENU_DB) return errorResponse(503, 'D1_NOT_CONFIGURED', 'BOG_MENU_DB no está configurado.');
  const authError = await requireAdminToken(c.req.raw, c.env);
  if (authError) return authError;

  const sku = normalizeSku(c.req.param('sku'));
  if (!sku) return errorResponse(400, 'INVALID_SKU', 'Producto inválido.');

  return json(200, {
    ok: true,
    data: { productSku: sku, recipes: await loadRecipes(c.env.BOG_MENU_DB, sku) }
  });
});

// PATCH /api/ingredients-v2-admin/recipes/:sku
ingredientsAdminRouter.patch('/recipes/:sku', async (c) => {
  if (!c.env.BOG_MENU_DB) return errorResponse(503, 'D1_NOT_CONFIGURED', 'BOG_MENU_DB no está configurado.');
  const authError = await requireAdminToken(c.req.raw, c.env);
  if (authError) return authError;

  const sku = normalizeSku(c.req.param('sku'));
  if (!sku) return errorResponse(400, 'INVALID_SKU', 'Producto inválido.');

  const db = c.env.BOG_MENU_DB;
  const product = await db.prepare('SELECT sku FROM menu_items WHERE sku = ? LIMIT 1').bind(sku).first();
  if (!product) return errorResponse(404, 'PRODUCT_NOT_FOUND', 'Producto no encontrado.');

  const body = await parseJsonObject(c.req.raw);
  if (!body) return errorResponse(400, 'INVALID_JSON', 'JSON inválido.');
  const recipes = parseRecipeInputs(body);
  if (recipes instanceof Response) return recipes;

  if (recipes.length) {
    const placeholders = recipes.map(() => '?').join(', ');
    const ingredientResult = await db
      .prepare(`SELECT id FROM ingredients_v2 WHERE id IN (${placeholders})`)
      .bind(...recipes.map((recipe) => recipe.ingredientId))
      .all<{ id: string }>();
    const validIds = new Set((ingredientResult.results ?? []).map((row) => String(row.id)));
    if (validIds.size !== recipes.length) return errorResponse(400, 'INGREDIENT_NOT_FOUND', 'Uno o más ingredientes no existen.');
  }

  const statements = [db.prepare('DELETE FROM product_ingredient_recipes_v2 WHERE product_sku = ?').bind(sku)];
  recipes.forEach((recipe) => {
    statements.push(
      db
        .prepare(`INSERT INTO product_ingredient_recipes_v2 (id, product_sku, ingredient_id, quantity_per_unit) VALUES (?, ?, ?, ?)`)
        .bind(generateId('rec'), sku, recipe.ingredientId, recipe.quantityPerUnit)
    );
  });
  await db.batch(statements);

  return json(200, {
    ok: true,
    data: { productSku: sku, recipes: await loadRecipes(db, sku) }
  });
});

// PATCH /api/ingredients-v2-admin/:id
ingredientsAdminRouter.patch('/:id', async (c) => {
  if (!c.env.BOG_MENU_DB) return errorResponse(503, 'D1_NOT_CONFIGURED', 'BOG_MENU_DB no está configurado.');
  const authError = await requireAdminToken(c.req.raw, c.env);
  if (authError) return authError;

  const id = String(c.req.param('id') ?? '').trim();
  if (!id) return errorResponse(400, 'INVALID_ID', 'Ingrediente inválido.');

  const existing = await c.env.BOG_MENU_DB.prepare('SELECT * FROM ingredients_v2 WHERE id = ? LIMIT 1').bind(id).first<any>();
  if (!existing) return errorResponse(404, 'NOT_FOUND', 'Ingrediente no encontrado.');

  const body = await parseJsonObject(c.req.raw);
  if (!body) return errorResponse(400, 'INVALID_JSON', 'JSON inválido.');
  const payload = normalizeIngredientPayload({
    name: body.name ?? existing.name,
    unit: body.unit ?? existing.unit,
    unitPriceCents: Object.prototype.hasOwnProperty.call(body, 'unitPriceCents') ? body.unitPriceCents : existing.unit_price_cents,
    isActive: Object.prototype.hasOwnProperty.call(body, 'isActive') ? body.isActive : Boolean(existing.is_active),
    sortOrder: body.sortOrder ?? existing.sort_order
  });
  if (payload instanceof Response) return payload;

  await c.env.BOG_MENU_DB.prepare(
    `UPDATE ingredients_v2 SET name = ?, unit = ?, unit_price_cents = ?, is_active = ?, sort_order = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`
  )
    .bind(payload.name, payload.unit, payload.unitPriceCents, payload.isActive ? 1 : 0, payload.sortOrder, id)
    .run();

  const row = await c.env.BOG_MENU_DB.prepare('SELECT * FROM ingredients_v2 WHERE id = ? LIMIT 1').bind(id).first();
  return json(200, { ok: true, data: { ingredient: mapD1Ingredient(row) } });
});
