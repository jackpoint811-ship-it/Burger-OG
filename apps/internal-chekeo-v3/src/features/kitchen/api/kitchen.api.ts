/**
 * kitchen.api.ts — PR-V3-10
 *
 * Cliente de API para Cocina y Resumen K de Chekeo V3 (consumo de /api/kitchen-v2-admin y /api/orders-v2-admin).
 */

import type {
  KitchenSummaryKResponse,
  OrderV2Environment,
  UpdateKitchenItemPayload,
  UpdateKitchenItemResponse,
} from '@config/index';
import {
  getChekeoRuntimeEnvironment,
  getOrderEnvironmentForChekeoRuntime,
} from '@config/index';
import { apiFetch } from '../../shared/api-client';

const KITCHEN_ADMIN_ENDPOINT = '/api/kitchen-v2-admin';
const ORDERS_ADMIN_ENDPOINT = '/api/orders-v2-admin';

export function getDefaultKitchenEnvironment(): OrderV2Environment {
  const runtimeEnv = getChekeoRuntimeEnvironment();
  return getOrderEnvironmentForChekeoRuntime(runtimeEnv);
}

/**
 * Consulta el Resumen K de insumos calculados en Cloudflare D1.
 */
export async function fetchKitchenSummaryK(
  date?: string,
  environment?: OrderV2Environment
): Promise<NonNullable<KitchenSummaryKResponse['data']>> {
  const env = environment || getDefaultKitchenEnvironment();
  const params = new URLSearchParams();

  params.set('environment', env);
  if (date?.trim()) {
    params.set('date', date.trim());
  }

  const queryString = params.toString();
  const endpoint = `${KITCHEN_ADMIN_ENDPOINT}/summary-k${queryString ? `?${queryString}` : ''}`;

  const response = await apiFetch<KitchenSummaryKResponse>(endpoint);

  if (!response?.ok || !response.data) {
    throw new Error(response?.error?.message || 'No se pudo cargar el Resumen K de cocina.');
  }

  return response.data;
}

/**
 * Marca o desmarca un ítem individual de cocina como hecho.
 */
export async function updateKitchenItemStatus(
  orderId: string,
  payload: UpdateKitchenItemPayload
): Promise<NonNullable<UpdateKitchenItemResponse['data']>> {
  const env = payload.environment || getDefaultKitchenEnvironment();
  const endpoint = `${ORDERS_ADMIN_ENDPOINT}/${encodeURIComponent(orderId)}/kitchen-item`;

  const response = await apiFetch<UpdateKitchenItemResponse>(endpoint, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...payload,
      environment: env,
    }),
  });

  if (!response?.ok || !response.data) {
    throw new Error(response?.error?.message || 'No se pudo actualizar el estado del ítem.');
  }

  return response.data;
}
