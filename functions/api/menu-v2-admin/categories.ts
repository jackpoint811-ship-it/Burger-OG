import { requireAdminToken, type AdminEnv } from '../_orders-v2-utils';

type Env = AdminEnv;

type CategoryPayload = {
  id?: string;
  key: string;
  name: string;
  emoji?: string | null;
  sortOrder: number;
};

const json = (status: number, payload: unknown) =>
  new Response(JSON.stringify(payload), { status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' } });

export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  if (!env.BOG_MENU_DB) return json(503, { ok: false, error: 'Admin disabled' });
  try {
    const result = await env.BOG_MENU_DB.prepare('SELECT id, key, name, emoji, sort_order AS sortOrder, updated_at AS updatedAt FROM menu_categories ORDER BY sort_order ASC').all();
    return json(200, { ok: true, categories: result.results ?? [] });
  } catch (err) {
    return json(500, { ok: false, error: String(err) });
  }
};

export const onRequestPost: PagesFunction<Env> = async ({ env, request }) => {
  if (!env.BOG_MENU_DB) return json(503, { ok: false, error: 'Admin disabled' });
  const authError = await requireAdminToken(request, env);
  if (authError) return authError;

  let raw: unknown;
  try { raw = await request.json(); } catch { return json(400, { ok: false, error: 'Invalid payload' }); }

  const categories = Array.isArray((raw as any)?.categories) ? (raw as any).categories as CategoryPayload[] : null;
  if (!categories) return json(400, { ok: false, error: 'Invalid categories payload' });

  const statements: D1PreparedStatement[] = [];
  for (const cat of categories) {
    if (!cat.key || !cat.name) continue;
    const catId = cat.id || `cat-${cat.key}`;
    statements.push(
      env.BOG_MENU_DB.prepare(
        `INSERT INTO menu_categories (id, key, name, emoji, sort_order, updated_at)
         VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
         ON CONFLICT(key) DO UPDATE SET
           name = excluded.name,
           emoji = excluded.emoji,
           sort_order = excluded.sort_order,
           updated_at = CURRENT_TIMESTAMP`
      ).bind(catId, cat.key, cat.name.trim(), cat.emoji ? cat.emoji.trim() : null, Number(cat.sortOrder) || 0)
    );
  }

  if (statements.length > 0) {
    await env.BOG_MENU_DB.batch(statements);
  }

  const updatedRows = await env.BOG_MENU_DB.prepare('SELECT id, key, name, emoji, sort_order AS sortOrder, updated_at AS updatedAt FROM menu_categories ORDER BY sort_order ASC').all();
  return json(200, { ok: true, categories: updatedRows.results ?? [] });
};
