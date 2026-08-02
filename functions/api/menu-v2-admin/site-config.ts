import { requireAdminToken, type AdminEnv } from '../_orders-v2-utils';
import { type PublicConfig } from '../../../packages/config/src';

type Env = AdminEnv;

const json = (status: number, payload: unknown) =>
  new Response(JSON.stringify(payload), { status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' } });

export const onRequestGet: PagesFunction<Env> = async ({ env, request }) => {
  if (!env.BOG_MENU_DB) return json(503, { ok: false, error: 'Database disabled' });
  const authError = await requireAdminToken(request, env);
  if (authError) return authError;

  try {
    const row = await env.BOG_MENU_DB.prepare(
      'SELECT public_mode, catalog_enabled, updated_at AS updatedAt FROM site_config ORDER BY updated_at DESC LIMIT 1'
    ).first<any>();

    const resolved: PublicConfig = {
      publicMode: row?.public_mode === 'catalog' || row?.publicMode === 'catalog' ? 'catalog' : 'flow',
      catalogEnabled: Number(row?.catalog_enabled ?? row?.catalogEnabled) === 1,
      updatedAt: row?.updatedAt ?? row?.updated_at ?? undefined
    };

    return json(200, { ok: true, publicConfig: resolved });
  } catch {
    return json(500, { ok: false, error: 'No se pudo consultar la configuración del sitio' });
  }
};

export const onRequestPatch: PagesFunction<Env> = async ({ env, request }) => {
  if (!env.BOG_MENU_DB) return json(503, { ok: false, error: 'Admin disabled' });
  const authError = await requireAdminToken(request, env);
  if (authError) return authError;

  let body: any;
  try { body = await request.json(); } catch { return json(400, { ok: false, error: 'Payload inválido' }); }

  const publicMode = body?.publicMode === 'catalog' ? 'catalog' : body?.publicMode === 'flow' ? 'flow' : undefined;
  const catalogEnabled = typeof body?.catalogEnabled === 'boolean' ? body.catalogEnabled : undefined;

  if (publicMode === undefined && catalogEnabled === undefined) {
    return json(400, { ok: false, error: 'Debes proporcionar publicMode o catalogEnabled' });
  }

  try {
    const existing = await env.BOG_MENU_DB.prepare(
      'SELECT id, public_mode, catalog_enabled FROM site_config ORDER BY updated_at DESC LIMIT 1'
    ).first<any>();

    const nextMode = publicMode ?? existing?.public_mode ?? 'flow';
    const nextEnabled = catalogEnabled !== undefined ? (catalogEnabled ? 1 : 0) : (existing?.catalog_enabled ?? 0);

    if (existing?.id) {
      await env.BOG_MENU_DB.prepare(
        'UPDATE site_config SET public_mode = ?, catalog_enabled = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
      ).bind(nextMode, nextEnabled, existing.id).run();
    } else {
      await env.BOG_MENU_DB.prepare(
        `INSERT INTO site_config (id, brand_name, currency, order_modes_json, support_phone, hero_cta, notice, public_mode, catalog_enabled, updated_at)
         VALUES ('default', 'Burgers.exe', 'MXN', '["pickup","delivery"]', '+52 55 0000 0000', 'Pedir ahora', '', ?, ?, CURRENT_TIMESTAMP)`
      ).bind(nextMode, nextEnabled).run();
    }

    const updatedRow = await env.BOG_MENU_DB.prepare(
      'SELECT public_mode, catalog_enabled, updated_at AS updatedAt FROM site_config ORDER BY updated_at DESC LIMIT 1'
    ).first<any>();

    const updatedConfig: PublicConfig = {
      publicMode: updatedRow?.public_mode === 'catalog' ? 'catalog' : 'flow',
      catalogEnabled: Number(updatedRow?.catalog_enabled) === 1,
      updatedAt: updatedRow?.updatedAt ?? updatedRow?.updated_at ?? new Date().toISOString()
    };

    return json(200, { ok: true, publicConfig: updatedConfig });
  } catch (e) {
    return json(500, { ok: false, error: e instanceof Error ? e.message : 'Error al actualizar configuración' });
  }
};

export const onRequest: PagesFunction<Env> = async (context) => {
  if (context.request.method === 'GET') return onRequestGet(context);
  if (context.request.method === 'PATCH' || context.request.method === 'POST') return onRequestPatch(context);
  return json(405, { ok: false, error: 'Method Not Allowed' });
};
