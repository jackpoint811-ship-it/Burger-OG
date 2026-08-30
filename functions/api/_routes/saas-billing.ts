import { Hono } from 'hono';
import type { AppEnv } from '../_types';
import { saasCheckoutSchema, saasBillingPortalSchema } from '@config/saas.schemas';
import { SAAS_PLANS, type SaaSPlanTier } from '@config/saas.types';

export const saasBillingRouter = new Hono<AppEnv>();

// POST /api/saas/billing/checkout — Crear sesión de Stripe Checkout
saasBillingRouter.post('/checkout', async (c) => {
  const body = await c.req.json();
  const parsed = saasCheckoutSchema.safeParse(body);

  if (!parsed.success) {
    return c.json({ ok: false, error: 'VALIDATION_ERROR', details: parsed.error.format() }, 400);
  }

  const { tenantId, planTier, successUrl, cancelUrl } = parsed.data;
  const planConfig = SAAS_PLANS[planTier as SaaSPlanTier] || SAAS_PLANS.pro;
  const stripeKey = c.env.STRIPE_SECRET_KEY;

  if (!stripeKey) {
    // Modo Simulación / Sandbox cuando no hay clave Stripe configurada
    const mockCheckoutUrl = `${successUrl}?session_id=mock_cs_${Date.now()}&tenant=${tenantId}&plan=${planTier}`;
    return c.json({
      ok: true,
      data: {
        sessionId: `cs_mock_${Date.now()}`,
        checkoutUrl: mockCheckoutUrl,
        mode: 'sandbox_simulation',
        message: 'Modo simulación activo. Configura STRIPE_SECRET_KEY en Cloudflare para producción.',
      },
    });
  }

  try {
    // Llamada directa a la API REST de Stripe
    const params = new URLSearchParams();
    params.append('payment_method_types[]', 'card');
    params.append('mode', 'subscription');
    params.append('client_reference_id', tenantId);
    params.append('success_url', successUrl);
    params.append('cancel_url', cancelUrl);
    params.append('line_items[0][price_data][currency]', 'usd');
    params.append('line_items[0][price_data][product_data][name]', `Suscripción Chekeo SaaS - Plan ${planConfig.name}`);
    params.append('line_items[0][price_data][product_data][description]', planConfig.description);
    params.append('line_items[0][price_data][recurring][interval]', 'month');
    params.append('line_items[0][price_data][unit_amount]', planConfig.monthlyPriceCents.toString());
    params.append('metadata[tenantId]', tenantId);
    params.append('metadata[planTier]', planTier);

    const stripeRes = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${stripeKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    const stripeData = (await stripeRes.json()) as { id?: string; url?: string; error?: { message: string } };

    if (!stripeRes.ok || !stripeData.url) {
      console.error('[Stripe Error]', stripeData);
      return c.json({ ok: false, error: 'STRIPE_ERROR', message: stripeData.error?.message || 'Error en Stripe Checkout' }, 502);
    }

    return c.json({
      ok: true,
      data: {
        sessionId: stripeData.id,
        checkoutUrl: stripeData.url,
      },
    });
  } catch (err) {
    console.error('[SaaS Checkout Error]', err);
    return c.json({ ok: false, error: 'SERVER_ERROR', message: 'Error al conectar con pasarela de pagos' }, 500);
  }
});

// POST /api/saas/billing/portal — Crear enlace al Stripe Customer Portal
saasBillingRouter.post('/portal', async (c) => {
  const body = await c.req.json();
  const parsed = saasBillingPortalSchema.safeParse(body);

  if (!parsed.success) {
    return c.json({ ok: false, error: 'VALIDATION_ERROR', details: parsed.error.format() }, 400);
  }

  const { tenantId, returnUrl } = parsed.data;
  const stripeKey = c.env.STRIPE_SECRET_KEY;
  const db = c.env.SAAS_CONTROL_DB;

  if (!stripeKey || !db) {
    return c.json({
      ok: true,
      data: {
        portalUrl: `${returnUrl}?portal_simulated=true`,
        mode: 'sandbox_simulation',
      },
    });
  }

  try {
    const sub = await db
      .prepare('SELECT stripe_customer_id FROM saas_subscriptions WHERE tenant_id = ?')
      .bind(tenantId)
      .first<{ stripe_customer_id: string }>();

    if (!sub?.stripe_customer_id || sub.stripe_customer_id.startsWith('cus_')) {
      return c.json({ ok: false, error: 'NO_CUSTOMER', message: 'El restaurante no tiene cliente registrado en Stripe' }, 400);
    }

    const params = new URLSearchParams();
    params.append('customer', sub.stripe_customer_id);
    params.append('return_url', returnUrl);

    const stripeRes = await fetch('https://api.stripe.com/v1/billing_portal/sessions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${stripeKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    const portalData = (await stripeRes.json()) as { url?: string; error?: { message: string } };

    if (!stripeRes.ok || !portalData.url) {
      return c.json({ ok: false, error: 'STRIPE_ERROR', message: portalData.error?.message || 'Error al generar Customer Portal' }, 502);
    }

    return c.json({
      ok: true,
      data: {
        portalUrl: portalData.url,
      },
    });
  } catch (err) {
    console.error('[SaaS Portal Error]', err);
    return c.json({ ok: false, error: 'SERVER_ERROR', message: 'Error interno de portal de facturación' }, 500);
  }
});

// POST /api/saas/billing/webhook — Receptor de Webhooks de Stripe con Idempotencia
saasBillingRouter.post('/webhook', async (c) => {
  const db = c.env.SAAS_CONTROL_DB;
  const payload = await c.req.text();
  let event: { id: string; type: string; data?: { object: Record<string, unknown> } };

  try {
    event = JSON.parse(payload);
  } catch {
    return c.json({ ok: false, error: 'INVALID_JSON' }, 400);
  }

  if (!event.id || !event.type) {
    return c.json({ ok: false, error: 'INVALID_EVENT' }, 400);
  }

  if (!db) {
    return c.json({ ok: true, message: 'Evento recibido en modo preview (sin DB)', eventId: event.id });
  }

  try {
    // 1. Verificación de Idempotencia: ¿Ya se procesó este evento?
    const processed = await db
      .prepare('SELECT id FROM saas_webhook_events WHERE id = ?')
      .bind(event.id)
      .first();

    if (processed) {
      return c.json({ ok: true, message: 'Evento ya procesado previamente (Idempotente)' });
    }

    const obj = event.data?.object || {};
    const tenantId = (obj.metadata as Record<string, string>)?.tenantId || (obj.client_reference_id as string);

    // 2. Procesar según tipo de evento
    if (event.type === 'checkout.session.completed') {
      const customerId = obj.customer as string;
      const subscriptionId = obj.subscription as string;
      const planTier = (obj.metadata as Record<string, string>)?.planTier || 'pro';

      if (tenantId) {
        await db
          .prepare(
            `UPDATE saas_subscriptions
             SET stripe_customer_id = ?, stripe_subscription_id = ?, plan_tier = ?, status = 'active', updated_at = datetime('now')
             WHERE tenant_id = ?`
          )
          .bind(customerId, subscriptionId, planTier, tenantId)
          .run();

        await db
          .prepare(`UPDATE saas_tenants SET status = 'active', updated_at = datetime('now') WHERE id = ?`)
          .bind(tenantId)
          .run();
      }
    } else if (event.type === 'customer.subscription.updated') {
      const status = obj.status as string;
      const subscriptionId = obj.id as string;
      const periodEnd = obj.current_period_end ? new Date((obj.current_period_end as number) * 1000).toISOString() : null;

      await db
        .prepare(
          `UPDATE saas_subscriptions
           SET status = ?, current_period_end = coalesce(?, current_period_end), updated_at = datetime('now')
           WHERE stripe_subscription_id = ?`
        )
        .bind(status, periodEnd, subscriptionId)
        .run();
    } else if (event.type === 'customer.subscription.deleted') {
      const subscriptionId = obj.id as string;

      await db
        .prepare(
          `UPDATE saas_subscriptions
           SET status = 'canceled', cancel_at_period_end = 1, updated_at = datetime('now')
           WHERE stripe_subscription_id = ?`
        )
        .bind(subscriptionId)
        .run();
    }

    // 3. Registrar en saas_webhook_events
    await db
      .prepare('INSERT INTO saas_webhook_events (id, event_type, tenant_id, payload_json) VALUES (?, ?, ?, ?)')
      .bind(event.id, event.type, tenantId || null, payload)
      .run();

    return c.json({ ok: true, message: `Evento ${event.type} procesado exitosamente` });
  } catch (err) {
    console.error('[SaaS Webhook Error]', err);
    return c.json({ ok: false, error: 'WEBHOOK_PROCESSING_FAILED' }, 500);
  }
});
