import { Hono } from 'hono';
import type { AppEnv } from '../_types';
import { saasOnboardingSchema } from '@config/saas.schemas';
import { SAAS_PLANS } from '@config/saas.types';

export const saasOnboardingRouter = new Hono<AppEnv>();

// POST /api/saas/onboarding — Registrar un nuevo restaurante en el SaaS
saasOnboardingRouter.post('/', async (c) => {
  const body = await c.req.json();
  const parsed = saasOnboardingSchema.safeParse(body);

  if (!parsed.success) {
    return c.json({
      ok: false,
      error: 'VALIDATION_ERROR',
      message: 'Datos de registro incompletos o inválidos',
      details: parsed.error.format(),
    }, 400);
  }

  const data = parsed.data;
  const tenantId = data.slug.toLowerCase().trim();
  const db = c.env.SAAS_CONTROL_DB;
  const planConfig = SAAS_PLANS[data.planTier] || SAAS_PLANS.starter;

  if (!db) {
    // Modo local / Preview sin D1 Control Plane
    return c.json({
      ok: true,
      message: `¡Restaurante "${data.brandName}" registrado con éxito en modo preview!`,
      data: {
        tenantId,
        slug: data.slug,
        brandName: data.brandName,
        planTier: data.planTier,
        storeUrl: `https://${data.slug}.chekeo.io`,
        adminUrl: `https://app.chekeo.io/?tenant=${data.slug}`,
        pinCode: data.pinCode,
        isTrial: true,
      },
    }, 201);
  }

  try {
    // 1. Verificar si el slug ya está ocupado
    const existing = await db
      .prepare('SELECT id FROM saas_tenants WHERE id = ? OR slug = ?')
      .bind(tenantId, data.slug)
      .first();

    if (existing) {
      return c.json({
        ok: false,
        error: 'SLUG_TAKEN',
        message: `El identificador "${data.slug}" ya está en uso. Por favor elige otro.`,
      }, 409);
    }

    // 2. Insertar Tenant en saas_tenants
    await db
      .prepare(
        `INSERT INTO saas_tenants (
          id, slug, brand_name, short_name, tagline, logo_emoji, default_food_type,
          accent_color, radius_style, owner_email, owner_phone,
          bank_name, bank_account_holder, bank_clabe, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(
        tenantId,
        data.slug,
        data.brandName,
        data.shortName,
        data.tagline || '',
        data.logoEmoji,
        data.defaultFoodType,
        data.accentColor,
        data.radiusStyle,
        data.ownerEmail,
        data.ownerPhone,
        data.bankName || '',
        data.bankAccountHolder || '',
        data.bankClabe || '',
        'trial'
      )
      .run();

    // 3. Crear Registro de Suscripción en saas_subscriptions
    const subscriptionId = `sub_${tenantId}_${Date.now()}`;
    const stripeCustomerId = `cus_${tenantId}_${Date.now()}`;

    await db
      .prepare(
        `INSERT INTO saas_subscriptions (
          id, tenant_id, stripe_customer_id, plan_tier, status,
          monthly_price_cents, currency, current_period_end
        ) VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now', '+14 days'))`
      )
      .bind(
        subscriptionId,
        tenantId,
        stripeCustomerId,
        data.planTier,
        'trialing',
        planConfig.monthlyPriceCents,
        'USD'
      )
      .run();

    // 4. Crear Usuario Dueño en saas_users
    const userId = `usr_${tenantId}_owner`;
    await db
      .prepare(
        `INSERT INTO saas_users (id, tenant_id, email, name, role, pin_code, is_active)
         VALUES (?, ?, ?, ?, ?, ?, 1)`
      )
      .bind(
        userId,
        tenantId,
        data.ownerEmail,
        data.shortName,
        'owner',
        data.pinCode
      )
      .run();

    // 5. Registrar en Log de Auditoría
    await db
      .prepare(
        `INSERT INTO saas_audit_logs (id, tenant_id, user_id, action, metadata_json)
         VALUES (?, ?, ?, ?, ?)`
      )
      .bind(
        `log_${Date.now()}`,
        tenantId,
        userId,
        'tenant_onboarded',
        JSON.stringify({ template: data.menuTemplate, plan: data.planTier })
      )
      .run();

    return c.json({
      ok: true,
      message: `¡Restaurante "${data.brandName}" creado exitosamente!`,
      data: {
        tenantId,
        slug: data.slug,
        brandName: data.brandName,
        planTier: data.planTier,
        storeUrl: `https://${data.slug}.chekeo.io`,
        adminUrl: `https://app.chekeo.io/?tenant=${data.slug}`,
        pinCode: data.pinCode,
        isTrial: true,
        trialDaysRemaining: 14,
      },
    }, 201);
  } catch (err) {
    console.error('[SaaS Onboarding Error]', err);
    return c.json({ ok: false, error: 'SERVER_ERROR', message: 'Error interno al registrar restaurante' }, 500);
  }
});
