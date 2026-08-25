/**
 * PaymentKpiHeader.tsx — Chekeo V3 Pagos Refinement
 *
 * 4 Tarjetas KPI financieras reactivas en cabecera:
 * - Total Ventas: Facturación activa no cancelada + conteo de pedidos.
 * - Transferencias SPEI: Total recaudado por SPEI + conteo.
 * - Efectivo en Entrega: Total en efectivo + conteo.
 * - Por Conciliar (SPEI): Alerta interactiva con glow ámbar pulsante y click-to-filter
 *   que conmuta la fecha a 'Todos' y activa los filtros transfer + pending.
 */

import React from 'react';
import { DollarSign, ArrowRightLeft, Clock, Banknote } from 'lucide-react';
import type { FinancialSummary } from '../../features/payments';
import { formatCurrency } from '../../features/orders';

export interface PaymentKpiHeaderProps {
  financialSummary: FinancialSummary;
  onFilterByPendingSpei: () => void;
}

export function PaymentKpiHeader({
  financialSummary,
  onFilterByPendingSpei,
}: PaymentKpiHeaderProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {/* KPI 1: Total Ventas Activas */}
      <div className="bg-surface-card p-4 sm:p-5 rounded-3xl border border-line shadow-card space-y-2 hover:border-accent/30 transition-all">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-text-muted">
            Total Ventas
          </span>
          <div className="w-8 h-8 rounded-2xl bg-accent-soft text-accent flex items-center justify-center shadow-xs">
            <DollarSign className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-2xl sm:text-3xl font-black text-accent tracking-tight">
            {formatCurrency(financialSummary.totalRevenue)}
          </span>
          <span className="text-xs font-bold text-text-secondary">
            {financialSummary.totalOrdersCount} pedidos
          </span>
        </div>
      </div>

      {/* KPI 2: Transferencias SPEI */}
      <div className="bg-surface-card p-4 sm:p-5 rounded-3xl border border-line shadow-card space-y-2 hover:border-blue-500/30 transition-all">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-text-muted">
            Transferencias SPEI
          </span>
          <div className="w-8 h-8 rounded-2xl bg-blue-500/15 text-blue-600 dark:text-blue-400 flex items-center justify-center shadow-xs">
            <ArrowRightLeft className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-2xl sm:text-3xl font-black text-text-primary tracking-tight">
            {formatCurrency(financialSummary.transferRevenue)}
          </span>
          <span className="text-xs font-bold text-text-secondary">
            {financialSummary.transferCount} pedidos
          </span>
        </div>
      </div>

      {/* KPI 3: Efectivo en Entrega */}
      <div className="bg-surface-card p-4 sm:p-5 rounded-3xl border border-line shadow-card space-y-2 hover:border-emerald-500/30 transition-all">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-text-muted">
            Efectivo en Entrega
          </span>
          <div className="w-8 h-8 rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-xs">
            <Banknote className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-2xl sm:text-3xl font-black text-text-primary tracking-tight">
            {formatCurrency(financialSummary.cashRevenue)}
          </span>
          <span className="text-xs font-bold text-text-secondary">
            {financialSummary.cashCount} pedidos
          </span>
        </div>
      </div>

      {/* KPI 4: Conciliación / Por Validar (Click-to-Filter) */}
      <div
        className={`p-4 sm:p-5 rounded-3xl border shadow-card space-y-2 transition-all cursor-pointer select-none group ${
          financialSummary.pendingTransferCount > 0
            ? 'bg-amber-500/10 border-amber-500/30 ring-2 ring-amber-500/20 hover:border-amber-500/50'
            : 'bg-surface-card border-line hover:border-line/80'
        }`}
        onClick={onFilterByPendingSpei}
        title="Filtrar todas las transferencias por validar (conmuta fecha a Todos)"
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onFilterByPendingSpei();
          }
        }}
      >
        <div className="flex items-center justify-between">
          <span
            className={`text-[11px] font-extrabold uppercase tracking-wider ${
              financialSummary.pendingTransferCount > 0
                ? 'text-amber-700 dark:text-amber-300'
                : 'text-text-muted'
            }`}
          >
            Por Conciliar (SPEI)
          </span>
          <div
            className={`w-8 h-8 rounded-2xl flex items-center justify-center shadow-xs ${
              financialSummary.pendingTransferCount > 0
                ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400 animate-pulse'
                : 'bg-surface-raised text-text-muted'
            }`}
          >
            <Clock className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-baseline justify-between gap-2">
          <span
            className={`text-2xl sm:text-3xl font-black tracking-tight ${
              financialSummary.pendingTransferCount > 0
                ? 'text-amber-600 dark:text-amber-400'
                : 'text-text-primary'
            }`}
          >
            {formatCurrency(financialSummary.pendingTransferAmount)}
          </span>
          <span className="text-xs font-bold text-text-secondary">
            {financialSummary.pendingTransferCount} pendientes
          </span>
        </div>
      </div>
    </div>
  );
}
