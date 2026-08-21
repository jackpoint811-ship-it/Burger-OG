/**
 * orders.api.ts — PR-V3-05
 *
 * Llamadas de API para creación y procesamiento de pedidos públicos.
 */

import type { CreateOrderV2Payload, CreateOrderV2Response } from '@config/index';
import { apiFetch } from '../../shared/api-client';

const ORDERS_V2_ENDPOINT = '/api/orders-v2';

function generateIdempotencyKey(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `idem-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export async function createOrder(
  payload: CreateOrderV2Payload,
  idempotencyKey?: string
): Promise<CreateOrderV2Response> {
  const key = idempotencyKey || payload.idempotencyKey || generateIdempotencyKey();

  const response = await apiFetch<CreateOrderV2Response>(ORDERS_V2_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Idempotency-Key': key,
    },
    body: JSON.stringify({
      ...payload,
      idempotencyKey: key,
    }),
  });

  if (!response?.ok || !response?.data?.order) {
    throw new Error(
      response?.error?.message || 'El servidor no confirmó la creación del pedido.'
    );
  }

  return response;
}
