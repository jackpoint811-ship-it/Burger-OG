/**
 * orders.api.ts — PR-V3-09
 *
 * Cliente de API para el módulo de Pedidos de Chekeo V3 (consumo de /api/orders-v2-admin).
 */

import type {
  OrderV2,
  OrderV2Status,
  OrderV2Environment,
  FetchOrdersV2AdminOptions,
  OrdersV2AdminResponse,
  UpdateOrderV2StatusResponse,
  UpdateOrderV2PaymentPayload,
  UpdateOrderV2PaymentResponse,
  ArchiveOrderV2Response,
  UnarchiveOrderV2Response,
  BatchArchiveOrdersV2Response,
  OrdersV2SummaryResponse,
} from '@config/index';
import {
  getChekeoRuntimeEnvironment,
  getOrderEnvironmentForChekeoRuntime,
} from '@config/index';
import { apiFetch } from '../../shared/api-client';

const ORDERS_ADMIN_ENDPOINT = '/api/orders-v2-admin';

export interface FetchOrdersV2SummaryOptions {
  from?: string;
  to?: string;
  includeTerminal?: boolean;
  limit?: number;
  topLimit?: number;
  environment?: OrderV2Environment;
}

/**
 * Obtiene el ambiente actual por defecto para las solicitudes de Chekeo (production o preview).
 */
export function getDefaultOrderEnvironment(): OrderV2Environment {
  const runtimeEnv = getChekeoRuntimeEnvironment();
  return getOrderEnvironmentForChekeoRuntime(runtimeEnv);
}

/**
 * Consulta la lista de pedidos en Cloudflare D1 a través del backend Hono.
 */
export async function fetchChekeoOrders(
  options: FetchOrdersV2AdminOptions = {}
): Promise<OrderV2[]> {
  const environment = options.environment || getDefaultOrderEnvironment();
  const params = new URLSearchParams();

  params.set('environment', environment);
  params.set('includeTerminal', String(Boolean(options.includeTerminal ?? true)));

  if (options.limit) {
    params.set('limit', String(options.limit));
  }
  if (options.archived) {
    params.set('archived', options.archived);
  }
  if (options.search?.trim()) {
    params.set('search', options.search.trim());
  }
  if (options.from?.trim()) {
    params.set('from', options.from.trim());
  }
  if (options.to?.trim()) {
    params.set('to', options.to.trim());
  }

  const queryString = params.toString();
  const endpoint = `${ORDERS_ADMIN_ENDPOINT}${queryString ? `?${queryString}` : ''}`;

  const response = await apiFetch<OrdersV2AdminResponse>(endpoint);

  if (!response?.ok) {
    throw new Error(response?.error?.message || 'No se pudieron listar los pedidos.');
  }

  return response.data?.orders ?? [];
}

/**
 * Consulta el resumen y métricas de cierre de pedidos.
 */
export async function fetchChekeoOrderSummary(
  options: FetchOrdersV2SummaryOptions = {}
): Promise<NonNullable<OrdersV2SummaryResponse['data']>> {
  const environment = options.environment || getDefaultOrderEnvironment();
  const params = new URLSearchParams();

  params.set('environment', environment);
  if (options.from?.trim()) params.set('from', options.from.trim());
  if (options.to?.trim()) params.set('to', options.to.trim());
  if (typeof options.includeTerminal === 'boolean') {
    params.set('includeTerminal', String(options.includeTerminal));
  }
  if (typeof options.limit === 'number' && Number.isFinite(options.limit)) {
    params.set('limit', String(options.limit));
  }
  if (typeof options.topLimit === 'number' && Number.isFinite(options.topLimit)) {
    params.set('topLimit', String(options.topLimit));
  }

  const queryString = params.toString();
  const endpoint = `${ORDERS_ADMIN_ENDPOINT}/summary${queryString ? `?${queryString}` : ''}`;

  const response = await apiFetch<OrdersV2SummaryResponse>(endpoint);

  if (!response?.ok || !response.data) {
    throw new Error(response?.error?.message || 'No se pudo cargar el resumen de pedidos.');
  }

  return response.data;
}

/**
 * Actualiza el estado operativo de un pedido (new -> preparing -> ready -> delivered -> cancelled).
 */
export async function updateOrderStatus(
  orderId: string,
  status: OrderV2Status,
  environment?: OrderV2Environment,
  reason?: string
): Promise<OrderV2> {
  const env = environment || getDefaultOrderEnvironment();
  const endpoint = `${ORDERS_ADMIN_ENDPOINT}/${encodeURIComponent(orderId)}/status`;

  const response = await apiFetch<UpdateOrderV2StatusResponse>(endpoint, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      status,
      reason,
      environment: env,
    }),
  });

  if (!response?.ok || !response.data?.order) {
    throw new Error(response?.error?.message || 'No se pudo actualizar el estado del pedido.');
  }

  return response.data.order;
}

/**
 * Actualiza el estado de pago de un pedido (paid, pending, cancelled) y notas operativas.
 */
export async function updateOrderPayment(
  orderId: string,
  payload: UpdateOrderV2PaymentPayload,
  environment?: OrderV2Environment
): Promise<OrderV2> {
  const env = environment || payload.environment || getDefaultOrderEnvironment();
  const endpoint = `${ORDERS_ADMIN_ENDPOINT}/${encodeURIComponent(orderId)}/payment`;

  const response = await apiFetch<UpdateOrderV2PaymentResponse>(endpoint, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...payload,
      environment: env,
    }),
  });

  if (!response?.ok || !response.data?.order) {
    throw new Error(response?.error?.message || 'No se pudo actualizar el estado de pago.');
  }

  return response.data.order;
}

/**
 * Envía un pedido cancelado al basurero / archivo.
 */
export async function archiveOrder(
  orderId: string,
  environment?: OrderV2Environment
): Promise<OrderV2> {
  const env = environment || getDefaultOrderEnvironment();
  const endpoint = `${ORDERS_ADMIN_ENDPOINT}/${encodeURIComponent(orderId)}/archive?environment=${env}`;

  const response = await apiFetch<ArchiveOrderV2Response>(endpoint, {
    method: 'PATCH',
  });

  if (!response?.ok || !response.data?.order) {
    throw new Error(response?.error?.message || 'No se pudo archivar el pedido.');
  }

  return response.data.order;
}

/**
 * Restaura un pedido archivado desde el basurero.
 */
export async function unarchiveOrder(
  orderId: string,
  environment?: OrderV2Environment
): Promise<OrderV2> {
  const env = environment || getDefaultOrderEnvironment();
  const endpoint = `${ORDERS_ADMIN_ENDPOINT}/${encodeURIComponent(orderId)}/unarchive?environment=${env}`;

  const response = await apiFetch<UnarchiveOrderV2Response>(endpoint, {
    method: 'PATCH',
  });

  if (!response?.ok || !response.data?.order) {
    throw new Error(response?.error?.message || 'No se pudo restaurar el pedido.');
  }

  return response.data.order;
}

/**
 * Archiva múltiples pedidos en lote para limpieza de turno.
 */
export async function batchArchiveOrders(
  orderIds: string[],
  environment?: OrderV2Environment,
  cancelReason?: string
): Promise<NonNullable<BatchArchiveOrdersV2Response['data']>> {
  const env = environment || getDefaultOrderEnvironment();
  const endpoint = `${ORDERS_ADMIN_ENDPOINT}/batch-archive`;

  const response = await apiFetch<BatchArchiveOrdersV2Response>(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      orderIds,
      environment: env,
      cancelReason,
    }),
  });

  if (!response?.ok || !response.data) {
    throw new Error(response?.error?.message || 'No se pudieron archivar los pedidos en lote.');
  }

  return response.data;
}
