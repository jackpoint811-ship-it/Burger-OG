/**
 * Admin API: /api/menu-v2-admin/tower-schedules
 * GET  → list all tower schedules (including inactive)
 * POST → create a new tower
 */

import { requireAdminToken, type AdminEnv } from '../_orders-v2-utils';

type Env = AdminEnv;

type TowerRow = {
  id: string;
  tower_key: string;
  tower_name: string;
  emoji: string;
  active_days_json: string;
  order_start_time: string;
  order_end_time: string;
  delivery_start_time: string;
  delivery_end_time: string;
  delivery_label: string | null;
  is_active: number;
  updated_at: string;
};

const json = (status: number, payload: unknown) =>
  new Response(JSON.stringify(payload), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
  });

const parseDays = (raw: string | null): number[] => {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((d: unknown) => typeof d === 'number' && d >= 0 && d <= 6) : [];
  } catch {
    return [];
  }
};

const mapTower = (row: TowerRow) => ({
  id: row.id,
  towerKey: row.tower_key,
  towerName: row.tower_name,
  emoji: row.emoji || '🏢',
  activeDays: parseDays(row.active_days_json),
  orderStartTime: row.order_start_time,
  orderEndTime: row.order_end_time,
  deliveryStartTime: row.delivery_start_time,
  deliveryEndTime: row.delivery_end_time,
  deliveryLabel: row.delivery_label ?? null,
  isActive: Number(row.is_active) === 1,
  updatedAt: row.updated_at,
});

export const onRequestGet: PagesFunction<Env> = async ({ env, request }) => {
  if (!env.BOG_MENU_DB) return json(503, { ok: false, error: 'Database disabled' });
  const authError = await requireAdminToken(request, env);
  if (authError) return authError;

  try {
    const { results } = await env.BOG_MENU_DB.prepare(
      'SELECT * FROM tower_schedules ORDER BY tower_key ASC',
    ).all<TowerRow>();
    return json(200, { ok: true, towers: (results ?? []).map(mapTower) });
  } catch {
    return json(500, { ok: false, error: 'No se pudieron consultar las torres' });
  }
};

export const onRequest: PagesFunction<Env> = async (context) => {
  if (context.request.method === 'GET') return onRequestGet(context);
  return json(405, { ok: false, error: 'Method Not Allowed' });
};
