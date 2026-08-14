/**
 * Public API: GET /api/tower-schedules
 * Returns active tower schedules for the public app.
 * No auth required — this is read by customers.
 */

type Env = { BOG_MENU_DB?: D1Database };

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

export type TowerSchedulePublic = {
  id?: string;
  towerKey: string;
  towerName: string;
  emoji: string;
  activeDays: number[];
  orderStartTime: string;
  orderEndTime: string;
  deliveryStartTime: string;
  deliveryEndTime: string;
  deliveryLabel: string | null;
  isActive: boolean;
};

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store, no-cache, must-revalidate',
    },
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

const mapRow = (row: TowerRow): TowerSchedulePublic => ({
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
});

export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  if (!env.BOG_MENU_DB) {
    return json(503, { ok: false, error: 'D1 database not configured' });
  }

  try {
    const { results } = await env.BOG_MENU_DB.prepare(
      'SELECT * FROM tower_schedules ORDER BY tower_key ASC',
    ).all<TowerRow>();

    const towers = (results ?? []).map(mapRow);
    return json(200, { ok: true, towers, source: 'd1' });
  } catch {
    return json(500, { ok: false, error: 'Failed to load tower schedules' });
  }
};

export const onRequest: PagesFunction<Env> = async (context) => {
  if (context.request.method !== 'GET') return json(405, { ok: false, error: 'Use GET.' });
  return onRequestGet(context);
};
