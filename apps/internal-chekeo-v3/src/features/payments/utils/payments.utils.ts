/**
 * payments.utils.ts — PR-V3-11
 *
 * Utilidades de cálculo financiero, métricas de conciliación y filtrado de pedidos.
 */

import type { OrderV2, OrderV2PaymentMethod, OrderV2PaymentStatus } from '@config/index';
import type {
  FinancialSummary,
  PaymentFilterMethod,
  PaymentFilterStatus,
  PaymentDateHorizon,
} from '../types/payments.types';

/**
 * Determina si una fecha ISO corresponde a "hoy" en la zona horaria de la Ciudad de México.
 */
export function isOrderFromTodayCDMX(isoString?: string): boolean {
  if (!isoString) return false;
  try {
    const orderDate = new Date(isoString);
    if (isNaN(orderDate.getTime())) return false;

    const now = new Date();
    const formatter = new Intl.DateTimeFormat('es-MX', {
      timeZone: 'America/Mexico_City',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });

    return formatter.format(orderDate) === formatter.format(now);
  } catch {
    return false;
  }
}

/**
 * Calcula el resumen financiero consolidado para una lista de pedidos.
 */
export function computeFinancialSummary(orders: OrderV2[]): FinancialSummary {
  let totalRevenue = 0;
  let totalOrdersCount = 0;

  let transferRevenue = 0;
  let transferCount = 0;
  let cashRevenue = 0;
  let cashCount = 0;
  let cardRevenue = 0;
  let cardCount = 0;

  let pendingTransferCount = 0;
  let pendingTransferAmount = 0;
  let pendingTotalCount = 0;
  let pendingTotalAmount = 0;
  let paidTotalCount = 0;
  let paidTotalAmount = 0;
  let cancelledTotalCount = 0;
  let cancelledTotalAmount = 0;

  for (const order of orders) {
    const isCancelled = order.status === 'cancelled' || order.paymentStatus === 'cancelled';
    const amount = Number.isFinite(order.total) ? order.total : 0;
    const method = order.paymentMethod;
    const paymentStatus = order.paymentStatus;

    if (isCancelled) {
      cancelledTotalCount += 1;
      cancelledTotalAmount += amount;
      continue;
    }

    // Órdenes activas (no canceladas)
    totalRevenue += amount;
    totalOrdersCount += 1;

    // Desglose por método de pago
    if (method === 'transfer') {
      transferRevenue += amount;
      transferCount += 1;
    } else if (method === 'cash') {
      cashRevenue += amount;
      cashCount += 1;
    } else if (method === 'card') {
      cardRevenue += amount;
      cardCount += 1;
    }

    // Desglose por estado de pago
    if (paymentStatus === 'paid') {
      paidTotalCount += 1;
      paidTotalAmount += amount;
    } else if (paymentStatus === 'pending') {
      pendingTotalCount += 1;
      pendingTotalAmount += amount;

      if (method === 'transfer') {
        pendingTransferCount += 1;
        pendingTransferAmount += amount;
      }
    }
  }

  return {
    totalRevenue,
    totalOrdersCount,
    transferRevenue,
    transferCount,
    cashRevenue,
    cashCount,
    cardRevenue,
    cardCount,
    pendingTransferCount,
    pendingTransferAmount,
    pendingTotalCount,
    pendingTotalAmount,
    paidTotalCount,
    paidTotalAmount,
    cancelledTotalCount,
    cancelledTotalAmount,
  };
}

export interface PaymentFilterCriteria {
  search?: string;
  method?: PaymentFilterMethod;
  status?: PaymentFilterStatus;
  dateHorizon?: PaymentDateHorizon;
}

/**
 * Filtra una lista de pedidos según criterios de búsqueda, método, estado y fecha.
 */
export function filterPaymentsOrders(
  orders: OrderV2[],
  criteria: PaymentFilterCriteria
): OrderV2[] {
  const { search = '', method = 'all', status = 'all', dateHorizon = 'all' } = criteria;
  const searchLower = search.trim().toLowerCase();

  return orders.filter((order) => {
    // Filtro por fecha (Hoy vs Todos)
    if (dateHorizon === 'today' && !isOrderFromTodayCDMX(order.createdAt)) {
      return false;
    }

    // Filtro por método de pago
    if (method !== 'all' && order.paymentMethod !== method) {
      return false;
    }

    // Filtro por estado de cobro
    if (status !== 'all') {
      if (status === 'pending' && order.paymentStatus !== 'pending') return false;
      if (status === 'paid' && order.paymentStatus !== 'paid') return false;
      if (status === 'cancelled' && order.paymentStatus !== 'cancelled' && order.status !== 'cancelled') {
        return false;
      }
    }

    // Filtro de búsqueda libre
    if (searchLower) {
      const folioMatch = order.folio?.toLowerCase().includes(searchLower);
      const nameMatch = order.customerName?.toLowerCase().includes(searchLower);
      const phoneMatch = order.customerPhone?.includes(searchLower);
      const locationMatch = order.delivery?.location?.toLowerCase().includes(searchLower);
      const idMatch = order.id?.toLowerCase().includes(searchLower);

      if (!folioMatch && !nameMatch && !phoneMatch && !locationMatch && !idMatch) {
        return false;
      }
    }

    return true;
  });
}
