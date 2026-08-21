/**
 * use-payments.ts — PR-V3-11
 *
 * Hooks de TanStack Query v5 para el módulo de Conciliación de Pagos de Chekeo V3:
 * - Filtros combinados reactivos (método, estado de cobro, fecha y búsqueda).
 * - Cómputo memoizado de métricas financieras y conciliación en vivo.
 * - Acciones rápidas de 1-clic para validación de transferencias y actualización de pagos.
 */

import { useState, useMemo, useCallback } from 'react';
import type { OrderV2, OrderV2PaymentStatus } from '@config/index';
import { useChekeoOrdersQuery, useUpdateOrderPaymentMutation } from '../../orders';
import { computeFinancialSummary, filterPaymentsOrders } from '../utils/payments.utils';
import type {
  PaymentFilterMethod,
  PaymentFilterStatus,
  PaymentDateHorizon,
  FinancialSummary,
} from '../types/payments.types';

export interface UsePaymentsOptions {
  autoRefresh?: boolean;
  refetchIntervalMs?: number;
  initialHorizon?: PaymentDateHorizon;
}

export function usePayments(options: UsePaymentsOptions = {}) {
  const { autoRefresh = true, refetchIntervalMs = 15000, initialHorizon = 'all' } = options;

  // Estado de filtros
  const [search, setSearch] = useState('');
  const [methodFilter, setMethodFilter] = useState<PaymentFilterMethod>('all');
  const [statusFilter, setStatusFilter] = useState<PaymentFilterStatus>('all');
  const [dateHorizon, setDateHorizon] = useState<PaymentDateHorizon>(initialHorizon);

  // Consulta de pedidos
  const ordersQuery = useChekeoOrdersQuery({
    autoRefresh,
    refetchIntervalMs,
    includeTerminal: true,
  });

  const updatePaymentMutation = useUpdateOrderPaymentMutation();

  const allOrders = ordersQuery.orders ?? [];

  // Resumen financiero global (calculado sobre todos los pedidos activos de la base de datos)
  const financialSummary: FinancialSummary = useMemo(() => {
    return computeFinancialSummary(allOrders);
  }, [allOrders]);

  // Lista filtrada de pedidos según los criterios seleccionados
  const filteredOrders: OrderV2[] = useMemo(() => {
    return filterPaymentsOrders(allOrders, {
      search,
      method: methodFilter,
      status: statusFilter,
      dateHorizon,
    });
  }, [allOrders, search, methodFilter, statusFilter, dateHorizon]);

  // Acción rápida: Marcar como Pagado / Validado
  const markAsPaid = useCallback(
    async (orderId: string, notes?: string) => {
      return updatePaymentMutation.mutateAsync({
        orderId,
        payload: {
          paymentStatus: 'paid',
          notes,
        },
      });
    },
    [updatePaymentMutation]
  );

  // Acción rápida: Marcar como Pendiente de Validación
  const markAsPending = useCallback(
    async (orderId: string, notes?: string) => {
      return updatePaymentMutation.mutateAsync({
        orderId,
        payload: {
          paymentStatus: 'pending',
          notes,
        },
      });
    },
    [updatePaymentMutation]
  );

  // Restablecer filtros
  const resetFilters = useCallback(() => {
    setSearch('');
    setMethodFilter('all');
    setStatusFilter('all');
    setDateHorizon('all');
  }, []);

  return {
    // Datos y estados
    allOrders,
    filteredOrders,
    financialSummary,
    isLoading: ordersQuery.isLoading,
    isFetching: ordersQuery.isFetching,
    isUpdatingPayment: updatePaymentMutation.isPending,
    refetch: ordersQuery.refetch,

    // Filtros y setters
    filters: {
      search,
      method: methodFilter,
      status: statusFilter,
      dateHorizon,
    },
    setSearch,
    setMethodFilter,
    setStatusFilter,
    setDateHorizon,
    resetFilters,

    // Mutaciones
    markAsPaid,
    markAsPending,
  };
}
