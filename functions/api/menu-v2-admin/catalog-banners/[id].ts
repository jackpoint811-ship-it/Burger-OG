import { normalizeAssetKey, validateAssetKey, validateImageUrl } from '../../_asset-utils';
import { mapD1CatalogBanner, DEFAULT_CATALOG_BANNERS } from '../../_menu-v2-utils';
import { requireAdminToken, type AdminEnv } from '../../_orders-v2-utils';

type Env = AdminEnv & { BOG_MENU_ASSETS?: R2Bucket };

const json = (status: number, payload: unknown) =>
  new Response(JSON.stringify(payload), { status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' } });

const normalizeOptionalString = (value: unknown): string | null | undefined => {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed || null;
};

const ensureDefaultBannerExists = async (db: D1Database, id: string) => {
  if (!id.startsWith('cb-default-')) return;
  const def = DEFAULT_CATALOG_BANNERS.find((b) => b.id === id);
  if (!def) return;
  try {
    await db.prepare(
      `INSERT OR IGNORE INTO catalog_banners (id, title, subtitle, cta_label, bg_preset, badge_text, is_active, sort_order, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`
    ).bind(def.id, def.title, def.subtitle, def.cta_label, def.bg_preset, def.badge_text, def.is_active, def.sort_order).run();
  } catch {
    try {
      await db.prepare(
        `INSERT OR IGNORE INTO catalog_banners (id, title, subtitle, cta_label, is_active, sort_order, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`
      ).bind(def.id, def.title, def.subtitle, def.cta_label, def.is_active, def.sort_order).run();
    } catch {
      /* table might not exist yet */
    }
  }
};

export const onRequestPatch: PagesFunction<Env, 'id'> = async ({ env, request, params }) => {
  if (!env.BOG_MENU_DB) return json(503, { ok: false, error: 'Admin disabled' });
  const authError = await requireAdminToken(request, env);
  if (authError) return authError;

  const id = params.id as string;
  if (!id) return json(400, { ok: false, error: 'ID is required' });

  await ensureDefaultBannerExists(env.BOG_MENU_DB, id);

  let raw: unknown;
  try { raw = await request.json(); } catch { return json(400, { ok: false, error: 'Invalid payload' }); }
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return json(400, { ok: false, error: 'Invalid payload' });
  const body = raw as Record<string, unknown>;

  const updates: string[] = [];
  const bindings: any[] = [];

  if (typeof body.title === 'string' && body.title.trim()) {
    updates.push('title = ?');
    bindings.push(body.title.trim());
  }

  const subtitle = normalizeOptionalString(body.subtitle);
  if (subtitle !== undefined) {
    updates.push('subtitle = ?');
    bindings.push(subtitle);
  }

  const ctaLabel = normalizeOptionalString(body.ctaLabel);
  if (ctaLabel !== undefined) {
    updates.push('cta_label = ?');
    bindings.push(ctaLabel);
  }

  const bgPreset = normalizeOptionalString(body.bgPreset);
  if (bgPreset !== undefined) {
    updates.push('bg_preset = ?');
    bindings.push(bgPreset);
  }

  const badgeText = normalizeOptionalString(body.badgeText);
  if (badgeText !== undefined) {
    updates.push('badge_text = ?');
    bindings.push(badgeText);
  }

  const badgeColor = normalizeOptionalString(body.badgeColor);
  if (badgeColor !== undefined) {
    updates.push('badge_color = ?');
    bindings.push(badgeColor);
  }

  const ctaActionType = normalizeOptionalString(body.ctaActionType);
  if (ctaActionType !== undefined) {
    updates.push('cta_action_type = ?');
    bindings.push(ctaActionType);
  }

  const ctaTarget = normalizeOptionalString(body.ctaTarget);
  if (ctaTarget !== undefined) {
    updates.push('cta_target = ?');
    bindings.push(ctaTarget);
  }

  if ('imageUrl' in body) {
    const imageUrl = validateImageUrl(body.imageUrl);
    if (imageUrl === undefined) return json(400, { ok: false, error: 'Invalid image URL' });
    updates.push('image_url = ?');
    bindings.push(imageUrl);
  }

  if ('imageKey' in body) {
    const imageKey = validateAssetKey(body.imageKey);
    if (imageKey === undefined) return json(400, { ok: false, error: 'Invalid image key' });
    updates.push('image_key = ?');
    bindings.push(imageKey);
  }

  if (typeof body.isActive === 'boolean') {
    updates.push('is_active = ?');
    bindings.push(body.isActive ? 1 : 0);
  }

  if (body.sortOrder !== undefined && (typeof body.sortOrder !== 'number' || !Number.isInteger(body.sortOrder))) {
    return json(400, { ok: false, error: 'sortOrder must be an integer' });
  }
  if (typeof body.sortOrder === 'number') {
    updates.push('sort_order = ?');
    bindings.push(body.sortOrder);
  }

  if (updates.length === 0) return json(400, { ok: false, error: 'No fields to update' });

  updates.push('updated_at = CURRENT_TIMESTAMP');
  bindings.push(id);

  try {
    await env.BOG_MENU_DB.prepare(
      `UPDATE catalog_banners SET ${updates.join(', ')} WHERE id = ?`
    ).bind(...bindings).run();
  } catch {
    // Fallback: update using base columns only in case optional columns do not exist
    const baseUpdates: string[] = [];
    const baseBindings: any[] = [];
    if (typeof body.title === 'string' && body.title.trim()) { baseUpdates.push('title = ?'); baseBindings.push(body.title.trim()); }
    const sub = normalizeOptionalString(body.subtitle); if (sub !== undefined) { baseUpdates.push('subtitle = ?'); baseBindings.push(sub); }
    const cta = normalizeOptionalString(body.ctaLabel); if (cta !== undefined) { baseUpdates.push('cta_label = ?'); baseBindings.push(cta); }
    if ('imageUrl' in body && validateImageUrl(body.imageUrl) !== undefined) { baseUpdates.push('image_url = ?'); baseBindings.push(validateImageUrl(body.imageUrl)); }
    if ('imageKey' in body && validateAssetKey(body.imageKey) !== undefined) { baseUpdates.push('image_key = ?'); baseBindings.push(validateAssetKey(body.imageKey)); }
    if (typeof body.isActive === 'boolean') { baseUpdates.push('is_active = ?'); baseBindings.push(body.isActive ? 1 : 0); }
    if (typeof body.sortOrder === 'number') { baseUpdates.push('sort_order = ?'); baseBindings.push(body.sortOrder); }
    if (baseUpdates.length > 0) {
      baseUpdates.push('updated_at = CURRENT_TIMESTAMP');
      baseBindings.push(id);
      try {
        await env.BOG_MENU_DB.prepare(`UPDATE catalog_banners SET ${baseUpdates.join(', ')} WHERE id = ?`).bind(...baseBindings).run();
      } catch {
        /* ignore fallback update error */
      }
    }
  }

  try {
    const row = await env.BOG_MENU_DB.prepare('SELECT * FROM catalog_banners WHERE id = ? LIMIT 1').bind(id).first();
    if (row) return json(200, { ok: true, banner: mapD1CatalogBanner(row) });
  } catch {
    /* ignore select error */
  }

  if (id.startsWith('cb-default-')) {
    const def = DEFAULT_CATALOG_BANNERS.find((b) => b.id === id) ?? DEFAULT_CATALOG_BANNERS[0];
    return json(200, {
      ok: true,
      banner: mapD1CatalogBanner({
        ...def,
        title: typeof body.title === 'string' ? body.title : def.title,
        subtitle: typeof body.subtitle === 'string' ? body.subtitle : def.subtitle,
        cta_label: typeof body.ctaLabel === 'string' ? body.ctaLabel : def.cta_label,
        bg_preset: typeof body.bgPreset === 'string' ? body.bgPreset : def.bg_preset,
        badge_text: typeof body.badgeText === 'string' ? body.badgeText : def.badge_text,
        is_active: typeof body.isActive === 'boolean' ? (body.isActive ? 1 : 0) : def.is_active,
        sort_order: typeof body.sortOrder === 'number' ? body.sortOrder : def.sort_order,
      }),
    });
  }

  return json(404, { ok: false, error: 'Banner not found' });
};

export const onRequestDelete: PagesFunction<Env, 'id'> = async ({ env, request, params }) => {
  if (!env.BOG_MENU_DB) return json(503, { ok: false, error: 'Admin disabled' });
  const authError = await requireAdminToken(request, env);
  if (authError) return authError;

  const id = params.id as string;
  if (!id) return json(400, { ok: false, error: 'ID is required' });

  const currentBanner = await env.BOG_MENU_DB.prepare('SELECT image_key FROM catalog_banners WHERE id = ?').bind(id).first<{ image_key: string | null }>();
  const result = await env.BOG_MENU_DB.prepare('DELETE FROM catalog_banners WHERE id = ?').bind(id).run();

  if (!result.success || (result.meta.changes === 0 && !id.startsWith('cb-default-'))) {
    return json(404, { ok: false, error: 'Banner not found' });
  }

  const imageKey = normalizeAssetKey(currentBanner?.image_key);
  if (imageKey && env.BOG_MENU_ASSETS) {
    try { await env.BOG_MENU_ASSETS.delete(imageKey); } catch { /* ignore R2 deletion failure */ }
  }

  return json(200, { ok: true, id });
};

export const onRequest: PagesFunction<Env, 'id'> = async (context) => {
  if (context.request.method === 'PATCH') return onRequestPatch(context);
  if (context.request.method === 'DELETE') return onRequestDelete(context);
  return json(405, { ok: false, error: 'Method Not Allowed' });
};
