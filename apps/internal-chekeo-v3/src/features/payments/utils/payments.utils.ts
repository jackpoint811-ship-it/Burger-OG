/**
 * payments.utils.ts — PR-V3-11
 *
 * Utilidades de cálculo financiero, métricas de conciliación y filtrado de pedidos.
 */

import type { OrderV2, OrderV2PaymentMethod, OrderV2PaymentStatus } from '@config/index';
import { getCdmxTodayString, formatCdmxDateString } from '@config/index';
import type {
  FinancialSummary,
  PaymentFilterMethod,
  PaymentFilterStatus,
  PaymentFilterMode,
  PaymentDateHorizon,
  PaymentFilterCriteria,
} from '../types/payments.types';

/**
 * Obtiene la fecha de ayer (YYYY-MM-DD) en la zona horaria de la Ciudad de México.
 */
export function getCdmxYesterdayString(): string {
  const todayStr = getCdmxTodayString();
  const [year, month, day] = todayStr.split('-').map(Number);
  const prevDate = new Date(year, month - 1, day - 1);
  const y = prevDate.getFullYear();
  const m = String(prevDate.getMonth() + 1).padStart(2, '0');
  const d = String(prevDate.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Obtiene la fecha de hace N días (YYYY-MM-DD) en la zona horaria de la Ciudad de México.
 */
export function getCdmxPastDaysString(daysAgo: number): string {
  const todayStr = getCdmxTodayString();
  const [year, month, day] = todayStr.split('-').map(Number);
  const pastDate = new Date(year, month - 1, day - daysAgo);
  const y = pastDate.getFullYear();
  const m = String(pastDate.getMonth() + 1).padStart(2, '0');
  const d = String(pastDate.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Formatea una fecha YYYY-MM-DD en texto amigable y conciso (ej. "26 Ago 2026").
 */
export function formatCdmxFriendlyDate(dateStr: string): string {
  if (!dateStr || !dateStr.includes('-')) return dateStr;
  try {
    const [year, month, day] = dateStr.split('-').map(Number);
    const d = new Date(year, month - 1, day);
    const monthShort = d.toLocaleDateString('es-MX', { month: 'short' });
    const capitalizedMonth = monthShort.charAt(0).toUpperCase() + monthShort.slice(1).replace('.', '');
    return `${day} ${capitalizedMonth} ${year}`;
  } catch {
    return dateStr;
  }
}

/**
 * Determina si una fecha ISO corresponde a "hoy" en la zona horaria de la Ciudad de México.
 */
export function isOrderFromTodayCDMX(isoString?: string): boolean {
  if (!isoString) return false;
  try {
    const todayStr = getCdmxTodayString();
    const orderDateStr = formatCdmxDateString(isoString);
    return orderDateStr === todayStr;
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

import { formatCurrency, PAYMENT_METHOD_LABELS } from '../../orders';
import { extractOrderTargetDate } from '../../../components/shared/HorizontalDateCalendarFilter';

/**
 * Filtra una lista de pedidos según criterios de búsqueda, método, estado, modo, torre y período de fecha.
 */
export function filterPaymentsOrders(
  orders: OrderV2[],
  criteria: PaymentFilterCriteria
): OrderV2[] {
  const {
    search = '',
    method = 'all',
    status = 'all',
    mode = 'all',
    tower = 'all',
    selectedDate = 'today',
    dateHorizon = 'all',
  } = criteria;
  const searchLower = search.trim().toLowerCase();

  const todayStr = getCdmxTodayString();
  const yesterdayStr = getCdmxYesterdayString();
  const sevenDaysAgoStr = getCdmxPastDaysString(7);

  return orders.filter((order) => {
    // 1. Filtro por Período / Fecha
    if (selectedDate !== 'all') {
      const targetDate = extractOrderTargetDate(order, todayStr);
      if (selectedDate === 'today') {
        if (targetDate !== todayStr) return false;
      } else if (selectedDate === 'yesterday') {
        if (targetDate !== yesterdayStr) return false;
      } else if (selectedDate === 'week') {
        if (targetDate < sevenDaysAgoStr || targetDate > todayStr) return false;
      } else if (selectedDate === 'past') {
        if (targetDate >= todayStr) return false;
      } else if (selectedDate !== 'today' && selectedDate !== 'yesterday' && selectedDate !== 'week' && selectedDate !== 'past') {
        // Fecha específica YYYY-MM-DD
        if (targetDate !== selectedDate) return false;
      }
    } else if (dateHorizon === 'today' && !isOrderFromTodayCDMX(order.createdAt)) {
      return false;
    }

    // 2. Filtro por método de pago
    if (method !== 'all' && order.paymentMethod !== method) {
      return false;
    }

    // 3. Filtro por estado de cobro
    if (status !== 'all') {
      if (status === 'pending' && order.paymentStatus !== 'pending') return false;
      if (status === 'paid' && order.paymentStatus !== 'paid') return false;
      if (status === 'cancelled' && order.paymentStatus !== 'cancelled' && order.status !== 'cancelled') {
        return false;
      }
    }

    // 4. Filtro por modo de entrega (pickup / delivery)
    if (mode !== 'all' && order.orderMode !== mode) {
      return false;
    }

    // 5. Filtro por torre / ubicación
    if (tower && tower !== 'all') {
      const locationLower = (order.delivery?.location || '').toLowerCase();
      if (!locationLower.includes(tower.toLowerCase())) {
        return false;
      }
    }

    // 6. Filtro de búsqueda libre enriquecido
    if (searchLower) {
      const folioMatch = order.folio?.toLowerCase().includes(searchLower);
      const nameMatch = order.customerName?.toLowerCase().includes(searchLower);
      const phoneMatch = order.customerPhone?.includes(searchLower);
      const locationMatch = order.delivery?.location?.toLowerCase().includes(searchLower);
      const notesMatch = order.notes?.toLowerCase().includes(searchLower);
      const itemsMatch = order.items?.some((item) =>
        item.name?.toLowerCase().includes(searchLower)
      );

      if (!folioMatch && !nameMatch && !phoneMatch && !locationMatch && !notesMatch && !itemsMatch) {
        return false;
      }
    }

    return true;
  });
}

/**
 * Genera un texto formateado de arqueo y conciliación para órdenes seleccionadas.
 */
export function generateBatchPaymentSummaryText(orders: OrderV2[]): string {
  if (orders.length === 0) return 'No hay órdenes seleccionadas.';

  const totalAmount = orders.reduce((sum, o) => sum + (o.total ?? 0), 0);
  const paidCount = orders.filter((o) => o.paymentStatus === 'paid').length;
  const pendingCount = orders.filter((o) => o.paymentStatus === 'pending').length;

  const lines = [
    '📊 RESUMEN DE ARQUEO / CONCILIACIÓN — BURGERS.EXE',
    `Fecha: ${new Date().toLocaleDateString('es-MX', { timeZone: 'America/Mexico_City' })}`,
    `Total Órdenes: ${orders.length} | Monto Total: ${formatCurrency(totalAmount)}`,
    `Pagadas: ${paidCount} | Por confirmar: ${pendingCount}`,
    '----------------------------------------',
  ];

  orders.forEach((order, index) => {
    const method =
      order.paymentMethod === 'transfer'
        ? 'Transferencia'
        : order.paymentMethod === 'cash'
        ? 'Efectivo'
        : 'Tarjeta';
    const status = order.paymentStatus === 'paid' ? 'PAGADO' : 'POR CONFIRMAR';
    lines.push(
      `${index + 1}. #${order.folio} — ${order.customerName} | ${method} | ${status} | ${formatCurrency(order.total)}`
    );
  });

  lines.push('----------------------------------------');
  lines.push(`TOTAL ACUMULADO: ${formatCurrency(totalAmount)}`);

  return lines.join('\n');
}
