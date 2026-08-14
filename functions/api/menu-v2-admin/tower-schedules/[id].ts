/**
 * Admin API: PATCH /api/menu-v2-admin/tower-schedules/:id
 * Updates a single tower schedule.
 */

import { requireAdminToken, type AdminEnv } from '../../_orders-v2-utils';

type Env = AdminEnv;

const json = (status: number, payload: unknown) =>
  new Response(JSON.stringify(payload), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
  });

const isValidDaysArray = (value: unknown): value is number[] => {
  if (!Array.isArray(value)) return false;
  return value.every((d) => typeof d === 'number' && Number.isInteger(d) && d >= 0 && d <= 6);
};

const normalizeTime = (value: unknown): string | null => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  const match = trimmed.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return null;
  const hours = parseInt(match[1]!, 10);
  const minutes = parseInt(match[2]!, 10);
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
};

export const onRequestPatch: PagesFunction<Env, 'id'> = async ({ env, request, params }) => {
  if (!env.BOG_MENU_DB) return json(503, { ok: false, error: 'Admin disabled' });
  const authError = await requireAdminToken(request, env);
  if (authError) return authError;

  const id = params.id as string;
  if (!id) return json(400, { ok: false, error: 'ID is required' });

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return json(400, { ok: false, error: 'Invalid payload' });
  }
  if (!raw || typeof raw !== 'object' || Array.isArray(raw))
    return json(400, { ok: false, error: 'Invalid payload' });

  const body = raw as Record<string, unknown>;
  const updates: string[] = [];
  const bindings: unknown[] = [];

  if (typeof body.towerName === 'string' && body.towerName.trim()) {
    updates.push('tower_name = ?');
    bindings.push(body.towerName.trim());
  }

  if (typeof body.emoji === 'string') {
    updates.push('emoji = ?');
    bindings.push(body.emoji.trim() || '🏢');
  }

  if ('activeDays' in body) {
    if (!isValidDaysArray(body.activeDays)) return json(400, { ok: false, error: 'activeDays must be array of day numbers (0-6)' });
    updates.push('active_days_json = ?');
    bindings.push(JSON.stringify(body.activeDays));
  }

  if ('orderStartTime' in body) {
    const normalized = normalizeTime(body.orderStartTime);
    if (!normalized) return json(400, { ok: false, error: 'orderStartTime must be valid HH:MM' });
    updates.push('order_start_time = ?');
    bindings.push(normalized);
  }

  if ('orderEndTime' in body) {
    const normalized = normalizeTime(body.orderEndTime);
    if (!normalized) return json(400, { ok: false, error: 'orderEndTime must be valid HH:MM' });
    updates.push('order_end_time = ?');
    bindings.push(normalized);
  }

  if ('deliveryStartTime' in body) {
    const normalized = normalizeTime(body.deliveryStartTime);
    if (!normalized) return json(400, { ok: false, error: 'deliveryStartTime must be valid HH:MM' });
    updates.push('delivery_start_time = ?');
    bindings.push(normalized);
  }

  if ('deliveryEndTime' in body) {
    const normalized = normalizeTime(body.deliveryEndTime);
    if (!normalized) return json(400, { ok: false, error: 'deliveryEndTime must be valid HH:MM' });
    updates.push('delivery_end_time = ?');
    bindings.push(normalized);
  }

  if ('deliveryLabel' in body) {
    updates.push('delivery_label = ?');
    bindings.push(typeof body.deliveryLabel === 'string' && body.deliveryLabel.trim() ? body.deliveryLabel.trim() : null);
  }

  if (typeof body.isActive === 'boolean') {
    updates.push('is_active = ?');
    bindings.push(body.isActive ? 1 : 0);
  }

  if (updates.length === 0) return json(400, { ok: false, error: 'No fields to update' });

  updates.push('updated_at = CURRENT_TIMESTAMP');
  bindings.push(id, id);

  try {
    const result = await env.BOG_MENU_DB.prepare(
      `UPDATE tower_schedules SET ${updates.join(', ')} WHERE id = ? OR tower_key = ?`,
    )
      .bind(...bindings)
      .run();

    if (!result.success || result.meta.changes === 0) {
      return json(404, { ok: false, error: 'Tower not found' });
    }

    const row = await env.BOG_MENU_DB.prepare('SELECT * FROM tower_schedules WHERE id = ? OR tower_key = ? LIMIT 1')
      .bind(id, id)
      .first<any>();

    if (!row) return json(500, { ok: false, error: 'Error fetching updated tower' });

    const parseDays = (raw: string | null): number[] => {
      if (!raw) return [];
      try {
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed.filter((d: unknown) => typeof d === 'number') : [];
      } catch {
        return [];
      }
    };

    return json(200, {
      ok: true,
      tower: {
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
      },
    });
  } catch (e) {
    return json(500, { ok: false, error: e instanceof Error ? e.message : 'Error updating tower' });
  }
};

export const onRequest: PagesFunction<Env, 'id'> = async (context) => {
  if (context.request.method === 'PATCH') return onRequestPatch(context);
  return json(405, { ok: false, error: 'Method Not Allowed' });
};
