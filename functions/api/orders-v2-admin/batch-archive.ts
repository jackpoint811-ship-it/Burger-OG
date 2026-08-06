import {
  assertOrderMatchesEnvironment,
  errorResponse,
  fetchOrderBundle,
  generateId,
  json,
  parseJsonObject,
  parseOrderEnvironmentFromRequest,
  requireAdminToken,
  type AdminEnv
} from '../_orders-v2-utils';

export const onRequestPost: PagesFunction<AdminEnv> = async ({ env, request }) => {
  if (!env.BOG_MENU_DB) return errorResponse(503, 'MISSING_DB', 'BOG_MENU_DB no está configurado.');
  const authError = await requireAdminToken(request, env);
  if (authError) return authError;

  const payload = await parseJsonObject(request);
  if (!payload) return errorResponse(400, 'INVALID_PAYLOAD', 'Payload JSON inválido.');

  const orderIds = Array.isArray(payload.orderIds)
    ? payload.orderIds.map((id) => String(id).trim()).filter(Boolean)
    : [];
  if (!orderIds.length) return errorResponse(400, 'INVALID_ORDER_IDS', 'Debe proporcionar al menos un ID de orden.');
  if (orderIds.length > 100) return errorResponse(400, 'BATCH_LIMIT_EXCEEDED', 'No se pueden procesar más de 100 órdenes por lote.');

  const cancelReason = typeof payload.cancelReason === 'string' && payload.cancelReason.trim()
    ? payload.cancelReason.trim()
    : 'Limpieza de turno';

  const environment = parseOrderEnvironmentFromRequest(request) ?? (typeof payload.environment === 'string' ? payload.environment as any : 'production');
  if (!environment) return errorResponse(400, 'INVALID_ENVIRONMENT', 'Ambiente de orden inválido.');

  try {
    const placeholders = orderIds.map(() => '?').join(', ');
    const query = `SELECT * FROM orders_v2 WHERE id IN (${placeholders})`;
    const resultRows = await env.BOG_MENU_DB.prepare(query).bind(...orderIds).all();
    const rows = resultRows.results ?? [];
    if (!rows.length) return errorResponse(404, 'NOT_FOUND', 'No se encontraron las órdenes especificadas.');

    const now = new Date().toISOString();
    const batchStatements: any[] = [];
    let cancelledCount = 0;
    let archivedCount = 0;
    const processedIds: string[] = [];

    for (const row of rows) {
      const environmentError = assertOrderMatchesEnvironment(row, environment);
      if (environmentError) continue;

      const id = String(row.id);
      const currentStatus = String(row.status);
      const isCancelled = currentStatus === 'cancelled';
      processedIds.push(id);

      if (!isCancelled) {
        // First cancel, then archive
        cancelledCount++;
        archivedCount++;
        const cancelEvtId = generateId('evt');
        const archiveEvtId = generateId('evt');
        const cancelDetail = JSON.stringify({ reason: cancelReason, source: 'internal-v2', environment, batch: true });
        const archiveDetail = JSON.stringify({ source: 'internal-v2', archiveType: 'soft-batch', environment });

        batchStatements.push(
          env.BOG_MENU_DB.prepare(
            "UPDATE orders_v2 SET status = 'cancelled', archived_at = ?, updated_at = ? WHERE id = ?"
          ).bind(now, now, id),
          env.BOG_MENU_DB.prepare(
            `INSERT INTO order_events_v2 (id, order_id, type, previous_status, next_status, detail_json, actor, created_at)
             VALUES (?, ?, 'ORDER_CANCELLED', ?, 'cancelled', ?, 'internal-v2', ?)`
          ).bind(cancelEvtId, id, currentStatus, cancelDetail, now),
          env.BOG_MENU_DB.prepare(
            `INSERT INTO order_events_v2 (id, order_id, type, previous_status, next_status, detail_json, actor, created_at)
             VALUES (?, ?, 'ORDER_ARCHIVED', 'cancelled', 'cancelled', ?, 'internal-v2', ?)`
          ).bind(archiveEvtId, id, archiveDetail, now)
        );
      } else if (!row.archived_at) {
        // Already cancelled, just archive
        archivedCount++;
        const archiveEvtId = generateId('evt');
        const archiveDetail = JSON.stringify({ source: 'internal-v2', archiveType: 'soft-batch', environment });

        batchStatements.push(
          env.BOG_MENU_DB.prepare(
            "UPDATE orders_v2 SET archived_at = ?, updated_at = ? WHERE id = ? AND status = 'cancelled' AND archived_at IS NULL"
          ).bind(now, now, id),
          env.BOG_MENU_DB.prepare(
            `INSERT INTO order_events_v2 (id, order_id, type, previous_status, next_status, detail_json, actor, created_at)
             VALUES (?, ?, 'ORDER_ARCHIVED', 'cancelled', 'cancelled', ?, 'internal-v2', ?)`
          ).bind(archiveEvtId, id, archiveDetail, now)
        );
      }
    }

    if (batchStatements.length > 0) {
      const batchResult = await env.BOG_MENU_DB.batch(batchStatements);
      if (!batchResult.every((res) => res.success)) {
        return errorResponse(500, 'INTERNAL_ERROR', 'No se pudieron archivar las órdenes en lote.');
      }
    }

    const updatedOrders: any[] = [];
    for (const id of processedIds) {
      const bundle = await fetchOrderBundle(env.BOG_MENU_DB, id);
      if (bundle) updatedOrders.push(bundle);
    }

    return json(200, {
      ok: true,
      data: {
        archivedCount,
        cancelledCount,
        orders: updatedOrders
      }
    });
  } catch {
    return errorResponse(500, 'INTERNAL_ERROR', 'Error al procesar el archivado en lote.');
  }
};

export const onRequest: PagesFunction<AdminEnv> = async (context) => {
  if (context.request.method !== 'POST') return errorResponse(405, 'METHOD_NOT_ALLOWED', 'Use POST.');
  return onRequestPost(context);
};
