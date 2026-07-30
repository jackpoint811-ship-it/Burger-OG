import {
  buildOrderEnvironmentCondition,
  errorResponse,
  json,
  parseOrderEnvironmentFromRequest,
  requireAdminToken,
  type AdminEnv
} from '../_orders-v2-utils';

type Env = AdminEnv;

const isDateOnly = (value: string) => /^\d{4}-\d{2}-\d{2}$/.test(value);

export const onRequestGet: PagesFunction<Env> = async ({ env, request }) => {
  if (!env.BOG_MENU_DB) return errorResponse(503, 'MISSING_DB', 'BOG_MENU_DB no está configurado.');
  const authError = await requireAdminToken(request, env);
  if (authError) return authError;

  const url = new URL(request.url);
  const params = url.searchParams;
  const environment = parseOrderEnvironmentFromRequest(request);
  if (!environment) return errorResponse(400, 'INVALID_ENVIRONMENT', 'Ambiente de orden inválido.');

  const from = params.get('from')?.trim() ?? '';
  const to = params.get('to')?.trim() ?? '';
  if ((from && !isDateOnly(from)) || (to && !isDateOnly(to))) {
    return errorResponse(400, 'INVALID_DATE', 'Fechas inválidas.');
  }

  const conditions: string[] = ['archived_at IS NULL'];
  const bindings: Array<string | number> = [];

  const envCondition = buildOrderEnvironmentCondition(environment);
  conditions.push(envCondition.condition);
  bindings.push(envCondition.binding);

  if (from) {
    conditions.push('created_at >= ?');
    bindings.push(`${from}T00:00:00.000Z`);
  }
  if (to) {
    conditions.push('created_at <= ?');
    bindings.push(`${to}T23:59:59.999Z`);
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  try {
    const [overallResult, byPaymentMethodResult, byOrderModeResult, byPaymentStatusResult] = await Promise.all([
      env.BOG_MENU_DB.prepare(
        `SELECT 
          COUNT(*) as total_orders, 
          COALESCE(SUM(total_cents), 0) as total_sales_cents 
         FROM orders_v2 ${whereClause} AND status != 'cancelled'`
      ).bind(...bindings).first<{ total_orders: number; total_sales_cents: number }>(),

      env.BOG_MENU_DB.prepare(
        `SELECT 
          payment_method, 
          COUNT(*) as count, 
          COALESCE(SUM(total_cents), 0) as total_cents 
         FROM orders_v2 ${whereClause} AND status != 'cancelled' 
         GROUP BY payment_method`
      ).bind(...bindings).all<{ payment_method: string; count: number; total_cents: number }>(),

      env.BOG_MENU_DB.prepare(
        `SELECT 
          order_mode, 
          COUNT(*) as count, 
          COALESCE(SUM(total_cents), 0) as total_cents 
         FROM orders_v2 ${whereClause} AND status != 'cancelled' 
         GROUP BY order_mode`
      ).bind(...bindings).all<{ order_mode: string; count: number; total_cents: number }>(),

      env.BOG_MENU_DB.prepare(
        `SELECT 
          payment_status, 
          COUNT(*) as count, 
          COALESCE(SUM(total_cents), 0) as total_cents 
         FROM orders_v2 ${whereClause} 
         GROUP BY payment_status`
      ).bind(...bindings).all<{ payment_status: string; count: number; total_cents: number }>()
    ]);

    const totalSalesCents = Number(overallResult?.total_sales_cents ?? 0);
    const totalOrdersCount = Number(overallResult?.total_orders ?? 0);

    const byPaymentMethod: Record<string, { count: number; totalCents: number; totalPesos: number }> = {
      cash: { count: 0, totalCents: 0, totalPesos: 0 },
      transfer: { count: 0, totalCents: 0, totalPesos: 0 },
      card: { count: 0, totalCents: 0, totalPesos: 0 },
      unknown: { count: 0, totalCents: 0, totalPesos: 0 }
    };

    (byPaymentMethodResult.results ?? []).forEach((row) => {
      const key = String(row.payment_method);
      if (byPaymentMethod[key]) {
        byPaymentMethod[key] = {
          count: Number(row.count),
          totalCents: Number(row.total_cents),
          totalPesos: Number(row.total_cents) / 100
        };
      }
    });

    const byOrderMode: Record<string, { count: number; totalCents: number; totalPesos: number }> = {
      pickup: { count: 0, totalCents: 0, totalPesos: 0 },
      delivery: { count: 0, totalCents: 0, totalPesos: 0 }
    };

    (byOrderModeResult.results ?? []).forEach((row) => {
      const key = String(row.order_mode);
      if (byOrderMode[key]) {
        byOrderMode[key] = {
          count: Number(row.count),
          totalCents: Number(row.total_cents),
          totalPesos: Number(row.total_cents) / 100
        };
      }
    });

    const byPaymentStatus: Record<string, { count: number; totalCents: number; totalPesos: number }> = {
      pending: { count: 0, totalCents: 0, totalPesos: 0 },
      paid: { count: 0, totalCents: 0, totalPesos: 0 },
      cancelled: { count: 0, totalCents: 0, totalPesos: 0 }
    };

    (byPaymentStatusResult.results ?? []).forEach((row) => {
      const key = String(row.payment_status);
      if (byPaymentStatus[key]) {
        byPaymentStatus[key] = {
          count: Number(row.count),
          totalCents: Number(row.total_cents),
          totalPesos: Number(row.total_cents) / 100
        };
      }
    });

    return json(200, {
      ok: true,
      data: {
        environment,
        from: from || null,
        to: to || null,
        totalOrders: totalOrdersCount,
        totalSalesCents,
        totalSalesPesos: totalSalesCents / 100,
        byPaymentMethod,
        byOrderMode,
        byPaymentStatus
      }
    });
  } catch {
    return errorResponse(500, 'INTERNAL_ERROR', 'No se pudo generar el corte de caja.');
  }
};

export const onRequest: PagesFunction<Env> = async (context) => {
  if (context.request.method !== 'GET') return errorResponse(405, 'METHOD_NOT_ALLOWED', 'Use GET.');
  return onRequestGet(context);
};
