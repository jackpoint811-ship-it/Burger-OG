/**
 * PaymentKpiHeader.tsx — Chekeo V3 Pagos Refinement (UX Polish)
 *
 * 4 Tarjetas KPI financieras reactivas en cabecera:
 * - Total Ventas: Facturación activa + clic para ver todos los métodos.
 * - Transferencias: Total recaudado por transferencia + clic para filtrar transferencias.
 * - Efectivo: Total en efectivo + clic para filtrar efectivo.
 * - Por confirmar: Alerta interactiva con glow ámbar pulsante y click-to-filter
 *   que totaliza y filtra TODOS los pagos pendientes sin importar el método.
 */

import React from 'react';
import { DollarSign, ArrowRightLeft, Clock, Banknote, CheckCircle2 } from 'lucide-react';
import type { FinancialSummary, PaymentFilterMethod } from '../../features/payments';
import { formatCdmxFriendlyDate } from '../../features/payments';
import { formatCurrency } from '../../features/orders';

export interface PaymentKpiHeaderProps {
  financialSummary: FinancialSummary;
  selectedDate?: string;
  selectedMethod?: PaymentFilterMethod;
  selectedStatus?: string;
  onFilterByPending: () => void;
  /** @deprecated usar onFilterByPending */
  onFilterByPendingSpei?: () => void;
  onFilterByMethod?: (method: PaymentFilterMethod) => void;
}

export function PaymentKpiHeader({
  financialSummary,
  selectedDate = 'today',
  selectedMethod = 'all',
  selectedStatus = 'all',
  onFilterByPending,
  onFilterByPendingSpei,
  onFilterByMethod,
}: PaymentKpiHeaderProps) {
  const handlePendingClick = onFilterByPending || onFilterByPendingSpei;

  // Etiqueta contextual del período para la tarjeta principal de ventas
  const salesKpiLabel = React.useMemo(() => {
    if (selectedDate === 'today') return 'Venta de Hoy';
    if (selectedDate === 'yesterday') return 'Venta de Ayer';
    if (selectedDate === 'week') return 'Venta Esta Semana';
    if (selectedDate === 'past') return 'Venta Anterior';
    if (selectedDate && selectedDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
      return `Venta ${formatCdmxFriendlyDate(selectedDate)}`;
    }
    return 'Total Ventas';
  }, [selectedDate]);

  const isPendingActive = selectedStatus === 'pending';

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
      {/* KPI 1: Total Ventas Activas del Período / Día */}
      <div
        onClick={() => onFilterByMethod?.('all')}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onFilterByMethod?.('all');
          }
        }}
        className={`bg-surface-card p-3.5 sm:p-4 rounded-3xl border shadow-card space-y-1.5 transition-all cursor-pointer select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
          selectedMethod === 'all' && !isPendingActive
            ? 'border-accent/40 ring-1 ring-accent/20'
            : 'border-line hover:border-accent/30'
        }`}
        title={`Clic para ver todas las ventas (${salesKpiLabel})`}
        role="button"
        tabIndex={0}
        aria-label={`Filtrar todas las ventas (${salesKpiLabel})`}
      >
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-text-muted truncate">
            {salesKpiLabel}
          </span>
          <div className="w-7 h-7 rounded-xl bg-accent-soft text-accent flex items-center justify-center shadow-xs shrink-0">
            <DollarSign className="w-3.5 h-3.5" />
          </div>
        </div>
        <div className="flex items-baseline justify-between gap-1 flex-wrap">
          <span className="text-xl sm:text-2xl font-black text-accent tracking-tight">
            {formatCurrency(financialSummary.totalRevenue)}
          </span>
          <span className="text-[10px] sm:text-[11px] font-bold text-text-secondary">
            {financialSummary.totalOrdersCount} {financialSummary.totalOrdersCount === 1 ? 'pedido' : 'pedidos'}
          </span>
        </div>
        <div className="text-[10px] text-text-muted font-medium truncate">
          {financialSummary.paidTotalCount > 0
            ? `${formatCurrency(financialSummary.paidTotalAmount)} cobrados (${financialSummary.paidTotalCount})`
            : 'Sin cobros confirmados aún'}
        </div>
      </div>

      {/* KPI 2: Transferencias */}
      <div
        onClick={() => onFilterByMethod?.('transfer')}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onFilterByMethod?.('transfer');
          }
        }}
        className={`bg-surface-card p-3.5 sm:p-4 rounded-3xl border shadow-card space-y-1.5 transition-all cursor-pointer select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
          selectedMethod === 'transfer'
            ? 'border-blue-500/50 ring-1 ring-blue-500/20 bg-blue-500/[0.02]'
            : 'border-line hover:border-blue-500/30'
        }`}
        title="Clic para filtrar únicamente pagos por transferencia"
        role="button"
        tabIndex={0}
        aria-label="Filtrar por pagos con transferencia"
      >
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-text-muted">
            Transferencias
          </span>
          <div className="w-7 h-7 rounded-xl bg-blue-500/15 text-blue-600 dark:text-blue-400 flex items-center justify-center shadow-xs shrink-0">
            <ArrowRightLeft className="w-3.5 h-3.5" />
          </div>
        </div>
        <div className="flex items-baseline justify-between gap-1 flex-wrap">
          <span className="text-xl sm:text-2xl font-black text-text-primary tracking-tight">
            {formatCurrency(financialSummary.transferRevenue)}
          </span>
          <span className="text-[10px] sm:text-[11px] font-bold text-text-secondary">
            {financialSummary.transferCount} {financialSummary.transferCount === 1 ? 'pedido' : 'pedidos'}
          </span>
        </div>
        <div className="text-[10px] font-medium truncate">
          {financialSummary.pendingTransferCount > 0 ? (
            <span className="text-amber-700 dark:text-amber-300 font-bold animate-pulse">
              {financialSummary.pendingTransferCount} por validar ({formatCurrency(financialSummary.pendingTransferAmount)})
            </span>
          ) : financialSummary.transferCount > 0 ? (
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 inline" /> 100% validadas
            </span>
          ) : (
            <span className="text-text-muted">Sin transferencias</span>
          )}
        </div>
      </div>

      {/* KPI 3: Efectivo */}
      <div
        onClick={() => onFilterByMethod?.('cash')}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onFilterByMethod?.('cash');
          }
        }}
        className={`bg-surface-card p-3.5 sm:p-4 rounded-3xl border shadow-card space-y-1.5 transition-all cursor-pointer select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
          selectedMethod === 'cash'
            ? 'border-emerald-500/50 ring-1 ring-emerald-500/20 bg-emerald-500/[0.02]'
            : 'border-line hover:border-emerald-500/30'
        }`}
        title="Clic para filtrar únicamente cobros en efectivo"
        role="button"
        tabIndex={0}
        aria-label="Filtrar por pagos en efectivo"
      >
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-text-muted">
            Efectivo
          </span>
          <div className="w-7 h-7 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-xs shrink-0">
            <Banknote className="w-3.5 h-3.5" />
          </div>
        </div>
        <div className="flex items-baseline justify-between gap-1 flex-wrap">
          <span className="text-xl sm:text-2xl font-black text-text-primary tracking-tight">
            {formatCurrency(financialSummary.cashRevenue)}
          </span>
          <span className="text-[10px] sm:text-[11px] font-bold text-text-secondary">
            {financialSummary.cashCount} {financialSummary.cashCount === 1 ? 'pedido' : 'pedidos'}
          </span>
        </div>
        <div className="text-[10px] font-medium truncate">
          {financialSummary.pendingCashCount > 0 ? (
            <span className="text-amber-700 dark:text-amber-300 font-bold">
              {financialSummary.pendingCashCount} por cobrar ({formatCurrency(financialSummary.pendingCashAmount)})
            </span>
          ) : financialSummary.cashCount > 0 ? (
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 inline" /> 100% cobrado
            </span>
          ) : (
            <span className="text-text-muted">Sin efectivo</span>
          )}
        </div>
      </div>

      {/* KPI 4: Por Cobrar / Confirmar (Tarjeta Clave de Operación) */}
      <div
        className={`p-3.5 sm:p-4 rounded-3xl border shadow-card space-y-1.5 transition-all cursor-pointer select-none group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 ${
          isPendingActive
            ? 'bg-amber-500/15 border-amber-500 ring-2 ring-amber-500/40 shadow-card'
            : financialSummary.pendingTotalCount > 0
            ? 'bg-amber-500/10 border-amber-500/30 ring-1 ring-amber-500/20 hover:border-amber-500/50'
            : 'bg-surface-card border-line hover:border-line/80'
        }`}
        onClick={handlePendingClick}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handlePendingClick?.();
          }
        }}
        title="Filtrar pedidos por cobrar / confirmar en el período activo"
        role="button"
        tabIndex={0}
        aria-label="Filtrar pedidos por cobrar / confirmar"
      >
        <div className="flex items-center justify-between">
          <span
            className={`text-[10px] font-extrabold uppercase tracking-wider truncate ${
              financialSummary.pendingTotalCount > 0
                ? 'text-amber-700 dark:text-amber-300'
                : 'text-text-muted'
            }`}
          >
            Por Cobrar / Confirmar
          </span>
          <div
            className={`w-7 h-7 rounded-xl flex items-center justify-center shadow-xs shrink-0 ${
              financialSummary.pendingTotalCount > 0
                ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400 animate-pulse'
                : 'bg-surface-raised text-text-muted'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
          </div>
        </div>
        <div className="flex items-baseline justify-between gap-1 flex-wrap">
          <span
            className={`text-xl sm:text-2xl font-black tracking-tight ${
              financialSummary.pendingTotalCount > 0
                ? 'text-amber-600 dark:text-amber-400'
                : 'text-text-primary'
            }`}
          >
            {formatCurrency(financialSummary.pendingTotalAmount)}
          </span>
          <span className="text-[10px] sm:text-[11px] font-bold text-text-secondary">
            {financialSummary.pendingTotalCount} {financialSummary.pendingTotalCount === 1 ? 'pendiente' : 'pendientes'}
          </span>
        </div>
        <div className="text-[10px] font-medium truncate">
          {financialSummary.pendingTotalCount > 0 ? (
            <span className="text-amber-700 dark:text-amber-300 font-semibold truncate block">
              {financialSummary.pendingTransferCount > 0 && financialSummary.pendingCashCount > 0
                ? `Transf: ${formatCurrency(financialSummary.pendingTransferAmount)} · Efec: ${formatCurrency(financialSummary.pendingCashAmount)}`
                : financialSummary.pendingTransferCount > 0
                ? `${financialSummary.pendingTransferCount} transferencias por validar`
                : `${financialSummary.pendingCashCount} en efectivo al entregar`}
            </span>
          ) : (
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 inline" /> 100% cobrado · Al día
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
