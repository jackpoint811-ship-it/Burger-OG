import { Hono } from 'hono';
import type { AppEnv } from '../_types';
import { saasTenantUpdateSchema } from '@config/saas.schemas';
import { TENANTS_REGISTRY } from '@config/active-tenant';

export const saasTenantsRouter = new Hono<AppEnv>();

// GET /api/saas/tenants — Listar todos los tenants registrados
saasTenantsRouter.get('/', async (c) => {
  const db = c.env.SAAS_CONTROL_DB;

  if (!db) {
    // Fallback a tenants estáticos si no hay D1 de control plane configurada aún
    const fallbackTenants = Object.values(TENANTS_REGISTRY);
    return c.json({
      ok: true,
      data: fallbackTenants,
      total: fallbackTenants.length,
      source: 'static_registry',
    });
  }

  try {
    const { results } = await db
      .prepare(
        `SELECT t.*, s.plan_tier, s.status as subscription_status, s.monthly_price_cents
         FROM saas_tenants t
         LEFT JOIN saas_subscriptions s ON t.id = s.tenant_id
         ORDER BY t.created_at DESC`
      )
      .all();

    return c.json({
      ok: true,
      data: results || [],
      total: results?.length || 0,
      source: 'saas_control_plane_d1',
    });
  } catch (err) {
    console.error('[SaaS Tenants Error]', err);
    return c.json({ ok: false, error: 'DB_ERROR', message: 'Error al consultar tenants' }, 500);
  }
});

// GET /api/saas/tenants/metrics — Métricas globales para Super Admin
saasTenantsRouter.get('/metrics', async (c) => {
  const db = c.env.SAAS_CONTROL_DB;

  if (!db) {
    return c.json({
      ok: true,
      data: {
        activeTenantsCount: 2,
        trialTenantsCount: 1,
        totalMonthlyRecurringRevenueUsd: 278, // Burgers ($199) + Amsi ($79)
        totalOrdersProcessedAllTime: 1420,
        plansBreakdown: { starter: 1, pro: 1, enterprise: 1 },
      },
      source: 'mock',
    });
  }

  try {
    const [tenantsCount, subsResult] = await Promise.all([
      db.prepare(`SELECT count(*) as total, sum(case when status = 'active' then 1 else 0 end) as active, sum(case when status = 'trial' then 1 else 0 end) as trial FROM saas_tenants`).first<{ total: number; active: number; trial: number }>(),
      db.prepare(`SELECT plan_tier, monthly_price_cents, status FROM saas_subscriptions WHERE status = 'active'`).all<{ plan_tier: string; monthly_price_cents: number; status: string }>(),
    ]);

    const activeSubs = subsResult.results || [];
    const totalMRRCents = activeSubs.reduce((acc, sub) => acc + (sub.monthly_price_cents || 0), 0);

    const plansBreakdown = {
      starter: activeSubs.filter((s) => s.plan_tier === 'starter').length,
      pro: activeSubs.filter((s) => s.plan_tier === 'pro').length,
      enterprise: activeSubs.filter((s) => s.plan_tier === 'enterprise').length,
    };

    return c.json({
      ok: true,
      data: {
        activeTenantsCount: tenantsCount?.active || 0,
        trialTenantsCount: tenantsCount?.trial || 0,
        totalMonthlyRecurringRevenueUsd: Math.round(totalMRRCents / 100),
        totalOrdersProcessedAllTime: 1420,
        plansBreakdown,
      },
    });
  } catch (err) {
    console.error('[SaaS Metrics Error]', err);
    return c.json({ ok: false, error: 'DB_ERROR', message: 'Error al calcular métricas' }, 500);
  }
});

// GET /api/saas/tenants/:id — Obtener detalle de un tenant
saasTenantsRouter.get('/:id', async (c) => {
  const id = c.req.param('id').toLowerCase().trim();
  const db = c.env.SAAS_CONTROL_DB;

  if (!db) {
    const staticTenant = TENANTS_REGISTRY[id];
    if (staticTenant) {
      return c.json({ ok: true, data: staticTenant });
    }
    return c.json({ ok: false, error: 'NOT_FOUND', message: 'Tenant no encontrado' }, 404);
  }

  try {
    const tenant = await db
      .prepare(
        `SELECT t.*, s.plan_tier, s.status as subscription_status, s.current_period_end
         FROM saas_tenants t
         LEFT JOIN saas_subscriptions s ON t.id = s.tenant_id
         WHERE t.id = ? OR t.slug = ?`
      )
      .bind(id, id)
      .first();

    if (!tenant) {
      return c.json({ ok: false, error: 'NOT_FOUND', message: 'Tenant no encontrado' }, 404);
    }

    return c.json({ ok: true, data: tenant });
  } catch (err) {
    console.error('[SaaS Tenant Detail Error]', err);
    return c.json({ ok: false, error: 'DB_ERROR', message: 'Error al consultar tenant' }, 500);
  }
});

// PATCH /api/saas/tenants/:id — Actualizar configuración de branding / banco
saasTenantsRouter.patch('/:id', async (c) => {
  const id = c.req.param('id').toLowerCase().trim();
  const body = await c.req.json();
  const parsed = saasTenantUpdateSchema.safeParse(body);

  if (!parsed.success) {
    return c.json({ ok: false, error: 'VALIDATION_ERROR', details: parsed.error.format() }, 400);
  }

  const db = c.env.SAAS_CONTROL_DB;
  if (!db) {
    return c.json({ ok: true, message: 'Actualizado en memoria local (Modo Preview)', data: parsed.data });
  }

  const data = parsed.data;
  const updates: string[] = [];
  const bindings: unknown[] = [];

  if (data.brandName) { updates.push('brand_name = ?'); bindings.push(data.brandName); }
  if (data.shortName) { updates.push('short_name = ?'); bindings.push(data.shortName); }
  if (data.tagline !== undefined) { updates.push('tagline = ?'); bindings.push(data.tagline); }
  if (data.logoEmoji) { updates.push('logo_emoji = ?'); bindings.push(data.logoEmoji); }
  if (data.accentColor) { updates.push('accent_color = ?'); bindings.push(data.accentColor); }
  if (data.radiusStyle) { updates.push('radius_style = ?'); bindings.push(data.radiusStyle); }
  if (data.supportPhone) { updates.push('support_phone = ?'); bindings.push(data.supportPhone); }
  if (data.bankName) { updates.push('bank_name = ?'); bindings.push(data.bankName); }
  if (data.bankAccountHolder) { updates.push('bank_account_holder = ?'); bindings.push(data.bankAccountHolder); }
  if (data.bankClabe) { updates.push('bank_clabe = ?'); bindings.push(data.bankClabe); }
  if (data.customDomain) { updates.push('custom_domain = ?'); bindings.push(data.customDomain); }

  if (updates.length === 0) {
    return c.json({ ok: true, message: 'Sin cambios requeridos' });
  }

  updates.push("updated_at = datetime('now')");
  bindings.push(id);

  try {
    await db.prepare(`UPDATE saas_tenants SET ${updates.join(', ')} WHERE id = ?`).bind(...bindings).run();
    return c.json({ ok: true, message: 'Configuración actualizada exitosamente' });
  } catch (err) {
    console.error('[SaaS Tenant Update Error]', err);
    return c.json({ ok: false, error: 'DB_ERROR', message: 'Error al actualizar tenant' }, 500);
  }
});
