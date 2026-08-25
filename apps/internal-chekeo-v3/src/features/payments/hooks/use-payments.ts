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
  PaymentFilterMode,
  PaymentDateHorizon,
  FinancialSummary,
} from '../types/payments.types';

export interface UsePaymentsOptions {
  autoRefresh?: boolean;
  refetchIntervalMs?: number;
  initialSelectedDate?: string;
}

export function usePayments(options: UsePaymentsOptions = {}) {
  const { autoRefresh: initialAutoRefresh = true, refetchIntervalMs = 15000, initialSelectedDate = 'today' } = options;

  // Estado de filtros
  const [search, setSearch] = useState('');
  const [selectedDate, setSelectedDate] = useState<string>(initialSelectedDate);
  const [methodFilter, setMethodFilter] = useState<PaymentFilterMethod>('all');
  const [statusFilter, setStatusFilter] = useState<PaymentFilterStatus>('all');
  const [modeFilter, setModeFilter] = useState<PaymentFilterMode>('all');
  const [towerFilter, setTowerFilter] = useState<string>('all');
  const [autoRefresh, setAutoRefresh] = useState<boolean>(initialAutoRefresh);

  // Consulta de pedidos
  const ordersQuery = useChekeoOrdersQuery({
    autoRefresh,
    refetchIntervalMs,
    includeTerminal: true,
  });

  const updatePaymentMutation = useUpdateOrderPaymentMutation();

  const allOrders = ordersQuery.orders ?? [];

  // Lista única de torres/ubicaciones disponibles extraídas dinámicamente de los pedidos
  const availableTowers = useMemo(() => {
    const towersSet = new Set<string>();
    allOrders.forEach((order) => {
      const location = order.delivery?.location?.trim();
      if (location) {
        const match = location.match(/^(Torre\s+[^•-]+)/i);
        if (match) {
          towersSet.add(match[1].trim());
        } else {
          towersSet.add(location.split('•')[0].trim());
        }
      }
    });
    return Array.from(towersSet);
  }, [allOrders]);

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
      mode: modeFilter,
      tower: towerFilter,
      selectedDate,
    });
  }, [allOrders, search, methodFilter, statusFilter, modeFilter, towerFilter, selectedDate]);

  // Acción rápida: Marcar como Pagado / Validado (Individual)
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

  // Acción rápida: Marcar como Pendiente de Validación (Individual)
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

  // Acción en Lote: Marcar múltiples pedidos como Pagados
  const markBatchAsPaid = useCallback(
    async (orderIds: string[], notes?: string) => {
      for (const orderId of orderIds) {
        await updatePaymentMutation.mutateAsync({
          orderId,
          payload: {
            paymentStatus: 'paid',
            notes: notes || 'Validación en lote de pagos',
          },
        });
      }
    },
    [updatePaymentMutation]
  );

  // Acción en Lote: Revertir múltiples pedidos a Pendiente
  const markBatchAsPending = useCallback(
    async (orderIds: string[], notes?: string) => {
      for (const orderId of orderIds) {
        await updatePaymentMutation.mutateAsync({
          orderId,
          payload: {
            paymentStatus: 'pending',
            notes: notes || 'Reversión en lote a pendiente',
          },
        });
      }
    },
    [updatePaymentMutation]
  );

  // Restablecer filtros
  const resetFilters = useCallback(() => {
    setSearch('');
    setSelectedDate('all');
    setMethodFilter('all');
    setStatusFilter('all');
    setModeFilter('all');
    setTowerFilter('all');
  }, []);

  return {
    // Datos y estados
    allOrders,
    filteredOrders,
    financialSummary,
    availableTowers,
    isLoading: ordersQuery.isLoading,
    isFetching: ordersQuery.isFetching,
    isUpdatingPayment: updatePaymentMutation.isPending,
    refetch: ordersQuery.refetch,

    // Filtros y setters
    filters: {
      search,
      selectedDate,
      method: methodFilter,
      status: statusFilter,
      mode: modeFilter,
      tower: towerFilter,
      autoRefresh,
    },
    setSearch,
    setSelectedDate,
    setMethodFilter,
    setStatusFilter,
    setModeFilter,
    setTowerFilter,
    setAutoRefresh,
    resetFilters,

    // Mutaciones
    markAsPaid,
    markAsPending,
    markBatchAsPaid,
    markBatchAsPending,
  };
}
