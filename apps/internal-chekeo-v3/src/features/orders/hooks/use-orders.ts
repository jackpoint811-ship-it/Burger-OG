/**
 * use-orders.ts — PR-V3-09
 *
 * Hooks de TanStack Query v5 para el módulo de Pedidos de Chekeo V3:
 * - useChekeoOrdersQuery: Consulta de pedidos con refetch interval y conteos reactivos.
 * - useUpdateOrderStatusMutation: Mutación para avanzar y cambiar estados de pedidos.
 * - useUpdateOrderPaymentMutation: Mutación para actualización de estados de pago.
 * - useArchiveOrderMutation & useUnarchiveOrderMutation: Acciones de papelera/archivo.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  type OrderV2,
  type OrderV2Status,
  type OrderV2Environment,
  type FetchOrdersV2AdminOptions,
  type UpdateOrderV2PaymentPayload,
  getCdmxTodayString,
} from '@config/index';
import {
  fetchChekeoOrders,
  fetchChekeoOrderSummary,
  updateOrderStatus,
  updateOrderPayment,
  archiveOrder,
  unarchiveOrder,
  batchArchiveOrders,
  type FetchOrdersV2SummaryOptions,
} from '../api/orders.api';
import type { OrderCounts } from '../types/orders.types';
import { extractOrderTargetDate } from '../../../components/shared/HorizontalDateCalendarFilter';

// ─── Query Keys ───────────────────────────────────────────────────────────────

export const chekeoOrderKeys = {
  all: ['chekeo-orders'] as const,
  lists: () => [...chekeoOrderKeys.all, 'list'] as const,
  list: (options: FetchOrdersV2AdminOptions = {}) =>
    [...chekeoOrderKeys.lists(), options] as const,
  summaries: () => [...chekeoOrderKeys.all, 'summary'] as const,
  summary: (options: FetchOrdersV2SummaryOptions = {}) =>
    [...chekeoOrderKeys.summaries(), options] as const,
};

// ─── Hooks de Consulta ────────────────────────────────────────────────────────

export interface UseChekeoOrdersQueryOptions extends FetchOrdersV2AdminOptions {
  autoRefresh?: boolean;
  refetchIntervalMs?: number;
  enabled?: boolean;
}

export function useChekeoOrdersQuery(options: UseChekeoOrdersQueryOptions = {}) {
  const {
    autoRefresh = true,
    refetchIntervalMs = 15000,
    enabled = true,
    ...fetchOptions
  } = options;

  const query = useQuery({
    queryKey: chekeoOrderKeys.list(fetchOptions),
    queryFn: () => fetchChekeoOrders(fetchOptions),
    refetchInterval: autoRefresh ? refetchIntervalMs : false,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
    staleTime: 5000,
    enabled,
  });

  const orders = query.data ?? [];

  // Hook para consultar órdenes archivadas
  const archivedQuery = useQuery({
    queryKey: chekeoOrderKeys.list({ ...fetchOptions, archived: 'true' }),
    queryFn: () => fetchChekeoOrders({ ...fetchOptions, archived: 'true' }),
    refetchInterval: autoRefresh ? refetchIntervalMs * 2 : false,
    staleTime: 10000,
    enabled,
  });

  const archivedOrders = archivedQuery.data ?? [];

  // Calcular conteos por estado a partir de la lista activa
  const todayStr = getCdmxTodayString();

  const isOrderToday = (order: OrderV2) => extractOrderTargetDate(order, todayStr) === todayStr;

  const counts: OrderCounts = {
    all: orders.length,
    new: orders.filter((o) => o.status === 'new' && isOrderToday(o)).length,
    preparing: orders.filter((o) => o.status === 'preparing' || (o.status === 'new' && !isOrderToday(o))).length,
    ready: orders.filter((o) => o.status === 'ready').length,
    delivered: orders.filter((o) => o.status === 'delivered').length,
    cancelled: orders.filter((o) => o.status === 'cancelled').length,
    archived: archivedOrders.length,
  };

  return {
    ...query,
    orders,
    archivedOrders,
    archivedQuery,
    counts,
  };
}

export function useChekeoArchivedOrdersQuery(
  options: UseChekeoOrdersQueryOptions = {}
) {
  const {
    autoRefresh = false,
    refetchIntervalMs = 30000,
    enabled = true,
    ...fetchOptions
  } = options;

  return useQuery({
    queryKey: chekeoOrderKeys.list({ ...fetchOptions, archived: 'true' }),
    queryFn: () => fetchChekeoOrders({ ...fetchOptions, archived: 'true' }),
    refetchInterval: autoRefresh ? refetchIntervalMs : false,
    staleTime: 10000,
    enabled,
  });
}

export function useChekeoOrderSummaryQuery(
  options: FetchOrdersV2SummaryOptions = {},
  enabled = true
) {
  return useQuery({
    queryKey: chekeoOrderKeys.summary(options),
    queryFn: () => fetchChekeoOrderSummary(options),
    staleTime: 30000,
    enabled,
  });
}

// ─── Hooks de Mutación ────────────────────────────────────────────────────────

export interface UpdateOrderStatusVariables {
  orderId: string;
  status: OrderV2Status;
  environment?: OrderV2Environment;
  reason?: string;
}

export function useUpdateOrderStatusMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ orderId, status, environment, reason }: UpdateOrderStatusVariables) =>
      updateOrderStatus(orderId, status, environment, reason),
    onSuccess: (updatedOrder) => {
      // Invalidar todas las consultas de pedidos para refrescar listas y conteos
      queryClient.invalidateQueries({ queryKey: chekeoOrderKeys.all });

      // Actualizar caché de forma optimista en las listas existentes
      queryClient.setQueriesData<OrderV2[]>(
        { queryKey: chekeoOrderKeys.lists() },
        (oldOrders) => {
          if (!oldOrders) return [updatedOrder];
          return oldOrders.map((order) =>
            order.id === updatedOrder.id ? updatedOrder : order
          );
        }
      );
    },
  });
}

export interface UpdateOrderPaymentVariables {
  orderId: string;
  payload: UpdateOrderV2PaymentPayload;
  environment?: OrderV2Environment;
}

export function useUpdateOrderPaymentMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ orderId, payload, environment }: UpdateOrderPaymentVariables) =>
      updateOrderPayment(orderId, payload, environment),
    onSuccess: (updatedOrder) => {
      queryClient.invalidateQueries({ queryKey: chekeoOrderKeys.all });
      queryClient.setQueriesData<OrderV2[]>(
        { queryKey: chekeoOrderKeys.lists() },
        (oldOrders) => {
          if (!oldOrders) return [updatedOrder];
          return oldOrders.map((order) =>
            order.id === updatedOrder.id ? updatedOrder : order
          );
        }
      );
    },
  });
}

export function useArchiveOrderMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ orderId, environment }: { orderId: string; environment?: OrderV2Environment }) =>
      archiveOrder(orderId, environment),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: chekeoOrderKeys.all });
    },
  });
}

export function useUnarchiveOrderMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ orderId, environment }: { orderId: string; environment?: OrderV2Environment }) =>
      unarchiveOrder(orderId, environment),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: chekeoOrderKeys.all });
    },
  });
}

export function useBatchArchiveOrdersMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      orderIds,
      environment,
      cancelReason,
    }: {
      orderIds: string[];
      environment?: OrderV2Environment;
      cancelReason?: string;
    }) => batchArchiveOrders(orderIds, environment, cancelReason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: chekeoOrderKeys.all });
    },
  });
}
