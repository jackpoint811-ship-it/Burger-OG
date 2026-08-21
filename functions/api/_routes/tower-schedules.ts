import { Hono } from 'hono';
import type { AppEnv } from '../_types';
import type { TowerSchedulePublic } from '../../../packages/config/src';

export const towerSchedulesRouter = new Hono<AppEnv>();

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

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store, no-cache, must-revalidate'
    }
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
  isActive: Number(row.is_active) === 1
});

towerSchedulesRouter.get('/', async (c) => {
  if (!c.env.BOG_MENU_DB) {
    return json(503, { ok: false, error: 'D1 database not configured' });
  }

  try {
    const { results } = await c.env.BOG_MENU_DB.prepare(
      'SELECT * FROM tower_schedules ORDER BY tower_key ASC'
    ).all<TowerRow>();

    const towers = (results ?? []).map(mapRow);
    return json(200, { ok: true, towers, source: 'd1' });
  } catch {
    return json(500, { ok: false, error: 'Failed to load tower schedules' });
  }
});
