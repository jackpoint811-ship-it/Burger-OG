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
import { DollarSign, ArrowRightLeft, Clock, Banknote } from 'lucide-react';
import type { FinancialSummary, PaymentFilterMethod } from '../../features/payments';
import { formatCurrency } from '../../features/orders';

export interface PaymentKpiHeaderProps {
  financialSummary: FinancialSummary;
  selectedMethod?: PaymentFilterMethod;
  onFilterByPending: () => void;
  /** @deprecated usar onFilterByPending */
  onFilterByPendingSpei?: () => void;
  onFilterByMethod?: (method: PaymentFilterMethod) => void;
}

export function PaymentKpiHeader({
  financialSummary,
  selectedMethod = 'all',
  onFilterByPending,
  onFilterByPendingSpei,
  onFilterByMethod,
}: PaymentKpiHeaderProps) {
  const handlePendingClick = onFilterByPending || onFilterByPendingSpei;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
      {/* KPI 1: Total Ventas Activas */}
      <div
        onClick={() => onFilterByMethod?.('all')}
        className={`bg-surface-card p-3.5 sm:p-4 rounded-3xl border shadow-card space-y-1.5 transition-all cursor-pointer select-none ${
          selectedMethod === 'all'
            ? 'border-accent/40 ring-1 ring-accent/20'
            : 'border-line hover:border-accent/30'
        }`}
        title="Clic para ver todas las ventas"
        role="button"
        tabIndex={0}
      >
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-text-muted">
            Total Ventas
          </span>
          <div className="w-7 h-7 rounded-xl bg-accent-soft text-accent flex items-center justify-center shadow-xs">
            <DollarSign className="w-3.5 h-3.5" />
          </div>
        </div>
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-xl sm:text-2xl font-black text-accent tracking-tight">
            {formatCurrency(financialSummary.totalRevenue)}
          </span>
          <span className="text-[11px] font-bold text-text-secondary">
            {financialSummary.totalOrdersCount}
          </span>
        </div>
      </div>

      {/* KPI 2: Transferencias */}
      <div
        onClick={() => onFilterByMethod?.('transfer')}
        className={`bg-surface-card p-3.5 sm:p-4 rounded-3xl border shadow-card space-y-1.5 transition-all cursor-pointer select-none ${
          selectedMethod === 'transfer'
            ? 'border-blue-500/50 ring-1 ring-blue-500/20 bg-blue-500/[0.02]'
            : 'border-line hover:border-blue-500/30'
        }`}
        title="Clic para filtrar únicamente pagos por transferencia"
        role="button"
        tabIndex={0}
      >
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-text-muted">
            Transferencias
          </span>
          <div className="w-7 h-7 rounded-xl bg-blue-500/15 text-blue-600 dark:text-blue-400 flex items-center justify-center shadow-xs">
            <ArrowRightLeft className="w-3.5 h-3.5" />
          </div>
        </div>
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-xl sm:text-2xl font-black text-text-primary tracking-tight">
            {formatCurrency(financialSummary.transferRevenue)}
          </span>
          <span className="text-[11px] font-bold text-text-secondary">
            {financialSummary.transferCount}
          </span>
        </div>
      </div>

      {/* KPI 3: Efectivo */}
      <div
        onClick={() => onFilterByMethod?.('cash')}
        className={`bg-surface-card p-3.5 sm:p-4 rounded-3xl border shadow-card space-y-1.5 transition-all cursor-pointer select-none ${
          selectedMethod === 'cash'
            ? 'border-emerald-500/50 ring-1 ring-emerald-500/20 bg-emerald-500/[0.02]'
            : 'border-line hover:border-emerald-500/30'
        }`}
        title="Clic para filtrar únicamente cobros en efectivo"
        role="button"
        tabIndex={0}
      >
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-text-muted">
            Efectivo
          </span>
          <div className="w-7 h-7 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-xs">
            <Banknote className="w-3.5 h-3.5" />
          </div>
        </div>
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-xl sm:text-2xl font-black text-text-primary tracking-tight">
            {formatCurrency(financialSummary.cashRevenue)}
          </span>
          <span className="text-[11px] font-bold text-text-secondary">
            {financialSummary.cashCount}
          </span>
        </div>
      </div>

      {/* KPI 4: Por confirmar (Universal para todos los métodos) */}
      <div
        className={`p-3.5 sm:p-4 rounded-3xl border shadow-card space-y-1.5 transition-all cursor-pointer select-none group ${
          financialSummary.pendingTotalCount > 0
            ? 'bg-amber-500/10 border-amber-500/30 ring-2 ring-amber-500/20 hover:border-amber-500/50'
            : 'bg-surface-card border-line hover:border-line/80'
        }`}
        onClick={handlePendingClick}
        title="Filtrar todos los pagos por confirmar (conmuta fecha a Todos)"
        role="button"
        tabIndex={0}
      >
        <div className="flex items-center justify-between">
          <span
            className={`text-[10px] font-extrabold uppercase tracking-wider ${
              financialSummary.pendingTotalCount > 0
                ? 'text-amber-700 dark:text-amber-300'
                : 'text-text-muted'
            }`}
          >
            Por confirmar
          </span>
          <div
            className={`w-7 h-7 rounded-xl flex items-center justify-center shadow-xs ${
              financialSummary.pendingTotalCount > 0
                ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400 animate-pulse'
                : 'bg-surface-raised text-text-muted'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
          </div>
        </div>
        <div className="flex items-baseline justify-between gap-2">
          <span
            className={`text-xl sm:text-2xl font-black tracking-tight ${
              financialSummary.pendingTotalCount > 0
                ? 'text-amber-600 dark:text-amber-400'
                : 'text-text-primary'
            }`}
          >
            {formatCurrency(financialSummary.pendingTotalAmount)}
          </span>
          <span className="text-[11px] font-bold text-text-secondary">
            {financialSummary.pendingTotalCount} por confirmar
          </span>
        </div>
      </div>
    </div>
  );
}
