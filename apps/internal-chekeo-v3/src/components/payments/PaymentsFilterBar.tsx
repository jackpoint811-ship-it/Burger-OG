/**
 * PaymentsFilterBar.tsx — Chekeo V3 Pagos Refinement (UX Polish)
 *
 * Barra de control y filtrado desaturada y sin ruido:
 * - Fila 1: Buscador Universal amplio, botón de Cuenta BBVA y Popover discreto de Filtros (Método & Torre GGA/Valcob).
 * - Fila 2: Único Ribbon Horizontal visible de Estados de Cobro (Todos, Por confirmar, Pagados, Cancelados).
 * - Fila 3: Chips interactivos de filtros secundarios activos y botón 1-click de restablecer.
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  Search,
  X,
  SlidersHorizontal,
  Building2,
  CheckCircle2,
  Clock,
  Ban,
  RotateCcw,
  Check,
  Building,
  ArrowRightLeft,
  DollarSign,
  CreditCard,
  Loader2,
} from 'lucide-react';
import { Button } from '@ui/button';
import type {
  PaymentFilterMethod,
  PaymentFilterStatus,
  FinancialSummary,
} from '../../features/payments';

export interface PaymentsFilterBarProps {
  search: string;
  onSearchChange: (search: string) => void;
  method: PaymentFilterMethod;
  onMethodChange: (method: PaymentFilterMethod) => void;
  status: PaymentFilterStatus;
  onStatusChange: (status: PaymentFilterStatus) => void;
  tower: string;
  onTowerChange: (tower: string) => void;
  isFetching?: boolean;
  financialSummary: FinancialSummary;
  allOrdersCount: number;
  onOpenBankDetails: () => void;
  onResetFilters: () => void;
}

export function PaymentsFilterBar({
  search,
  onSearchChange,
  method,
  onMethodChange,
  status,
  onStatusChange,
  tower,
  onTowerChange,
  isFetching = false,
  financialSummary,
  allOrdersCount,
  onOpenBankDetails,
  onResetFilters,
}: PaymentsFilterBarProps) {
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Cerrar popover al hacer clic fuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setShowAdvancedFilters(false);
      }
    }
    if (showAdvancedFilters) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showAdvancedFilters]);

  // Contar filtros secundarios activos (Método y Torre)
  const activeSecondaryFiltersCount = (method !== 'all' ? 1 : 0) + (tower !== 'all' ? 1 : 0);

  const statusTabs: Array<{
    id: PaymentFilterStatus;
    label: string;
    count?: number;
    badgeClass?: string;
    icon?: React.ComponentType<{ className?: string }>;
  }> = [
    { id: 'all', label: 'Todos los Estados', count: allOrdersCount },
    {
      id: 'pending',
      label: 'Por confirmar',
      count: financialSummary.pendingTotalCount,
      badgeClass: 'bg-amber-500/20 text-amber-600 dark:text-amber-400',
      icon: Clock,
    },
    {
      id: 'paid',
      label: 'Pagados',
      count: financialSummary.paidTotalCount,
      badgeClass: 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400',
      icon: CheckCircle2,
    },
    {
      id: 'cancelled',
      label: 'Cancelados',
      count: financialSummary.cancelledTotalCount,
      badgeClass: 'bg-rose-500/20 text-rose-600 dark:text-rose-400',
      icon: Ban,
    },
  ];

  return (
    <div className="space-y-3 bg-surface-card p-4 sm:p-5 rounded-3xl border border-line shadow-xs relative">
      {/* ─── Fila 1: Buscador Universal + Datos Bancarios BBVA + Popover Filtros ─ */}
      <div className="flex items-center justify-between gap-2.5">
        {/* Buscador Universal Rápido */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-text-muted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Buscar por folio (#ORD-...), cliente, torre, teléfono o notas…"
            className="w-full pl-10 pr-10 h-11 rounded-2xl bg-surface-raised border border-line text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all"
          />
          {search ? (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary p-0.5 rounded-full cursor-pointer"
              aria-label="Limpiar búsqueda"
            >
              <X className="w-4 h-4" />
            </button>
          ) : isFetching ? (
            <Loader2 className="w-4 h-4 text-accent animate-spin absolute right-3.5 top-1/2 -translate-y-1/2" />
          ) : null}
        </div>

        {/* Botones de Control: Cuenta BBVA y Filtros */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Botón de Datos Bancarios BBVA */}
          <Button
            type="button"
            variant="outline"
            size="md"
            onClick={onOpenBankDetails}
            className="h-11 px-3.5 rounded-2xl border-line text-xs font-bold text-blue-600 dark:text-blue-400 hover:bg-blue-500/10 flex items-center gap-1.5 cursor-pointer shadow-xs"
            title="Ver y copiar cuenta bancaria oficial BBVA"
          >
            <Building2 className="w-4 h-4" />
            <span className="hidden sm:inline">Cuenta BBVA</span>
          </Button>

          {/* Botón Discreto de Filtros Avanzados (Popover) */}
          <div className="relative" ref={popoverRef}>
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={() => setShowAdvancedFilters((prev) => !prev)}
              className={`h-11 px-3.5 rounded-2xl border-line text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs ${
                activeSecondaryFiltersCount > 0
                  ? 'bg-accent/10 border-accent/40 text-accent'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
              title="Filtros por Método de Pago y Torre"
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span>Filtros</span>
              {activeSecondaryFiltersCount > 0 && (
                <span className="ml-1 px-1.5 py-0.2 rounded-full bg-accent text-white text-[10px] font-black">
                  {activeSecondaryFiltersCount}
                </span>
              )}
            </Button>

            {/* Panel Popover de Filtros */}
            {showAdvancedFilters && (
              <div className="absolute right-0 top-12 mt-1 z-40 w-72 p-4 bg-surface-card border border-line rounded-3xl shadow-floating space-y-4 animate-in fade-in zoom-in-95 duration-150">
                <div className="flex items-center justify-between border-b border-line pb-2">
                  <span className="text-xs font-black uppercase tracking-wider text-text-primary">
                    Filtros
                  </span>
                  {activeSecondaryFiltersCount > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        onMethodChange('all');
                        onTowerChange('all');
                      }}
                      className="text-[11px] font-bold text-accent hover:underline cursor-pointer"
                    >
                      Restablecer
                    </button>
                  )}
                </div>

                {/* Método de Pago */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-text-muted">Método de Pago</label>
                  <div className="grid grid-cols-2 gap-1 bg-surface-raised p-1 rounded-xl border border-line">
                    {[
                      { id: 'all' as const, label: 'Todos' },
                      { id: 'transfer' as const, label: 'Transferencia' },
                      { id: 'cash' as const, label: 'Efectivo' },
                      { id: 'card' as const, label: 'Tarjeta' },
                    ].map((m) => {
                      const isSelected = method === m.id;
                      return (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => onMethodChange(m.id)}
                          className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all text-center cursor-pointer ${
                            isSelected
                              ? 'bg-accent text-white shadow-xs'
                              : 'text-text-secondary hover:text-text-primary'
                          }`}
                        >
                          {m.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Selector de Torre Exclusiva (Torre GGA / Torre Valcob) */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-text-muted">Torre de Entrega</label>
                  <div className="grid grid-cols-1 gap-1 bg-surface-raised p-1 rounded-xl border border-line">
                    {[
                      { id: 'all', label: 'Todas las Torres' },
                      { id: 'Torre GGA', label: 'Torre GGA' },
                      { id: 'Torre Valcob', label: 'Torre Valcob' },
                    ].map((t) => {
                      const isSelected =
                        (t.id === 'all' && tower === 'all') ||
                        (t.id !== 'all' && tower.toLowerCase().includes(t.id.toLowerCase().replace('torre ', '')));
                      return (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => onTowerChange(t.id)}
                          className={`py-1.5 px-3 rounded-lg text-xs font-bold transition-all text-left flex items-center justify-between cursor-pointer ${
                            isSelected
                              ? 'bg-accent text-white shadow-xs'
                              : 'text-text-secondary hover:text-text-primary'
                          }`}
                        >
                          <div className="flex items-center gap-1.5">
                            <Building className="w-3.5 h-3.5" />
                            <span>{t.label}</span>
                          </div>
                          {isSelected && <Check className="w-3.5 h-3.5" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <Button
                  type="button"
                  variant="default"
                  size="sm"
                  onClick={() => setShowAdvancedFilters(false)}
                  className="w-full text-xs font-bold h-9 cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5 mr-1" />
                  <span>Aplicar</span>
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ─── Fila 2: Único Ribbon Visible de Estados de Cobro ───────────────── */}
      <div className="flex items-center gap-2 overflow-x-auto pb-0.5 no-scrollbar border-t border-line/60 pt-2.5">
        {statusTabs.map((st) => {
          const isActive = status === st.id;
          return (
            <button
              key={st.id}
              type="button"
              onClick={() => onStatusChange(st.id)}
              className={`px-3.5 py-1.5 rounded-2xl text-xs font-bold whitespace-nowrap flex items-center gap-1.5 transition-all cursor-pointer select-none ${
                isActive
                  ? 'bg-text-primary text-surface-card shadow-xs'
                  : 'bg-surface-raised border border-line text-text-secondary hover:text-text-primary hover:border-line/80'
              }`}
            >
              {st.icon && <st.icon className="w-3.5 h-3.5 shrink-0" />}
              <span>{st.label}</span>
              {st.count !== undefined && (
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                    isActive
                      ? 'bg-surface-card/20 text-surface-card'
                      : st.badgeClass || 'bg-surface text-text-muted'
                  }`}
                >
                  {st.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ─── Fila 3: Pastillas de Filtros Activos (Condicional) ─────────────── */}
      {activeSecondaryFiltersCount > 0 && (
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-line/60 text-xs">
          <span className="text-text-muted font-bold text-[11px]">Filtros activos:</span>

          {method !== 'all' && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-accent-soft text-accent text-xs font-bold border border-accent/20">
              {method === 'transfer' ? (
                <>
                  <ArrowRightLeft className="w-3 h-3 shrink-0" />
                  <span>Transferencia</span>
                </>
              ) : method === 'cash' ? (
                <>
                  <DollarSign className="w-3 h-3 shrink-0" />
                  <span>Efectivo</span>
                </>
              ) : (
                <>
                  <CreditCard className="w-3 h-3 shrink-0" />
                  <span>Tarjeta</span>
                </>
              )}
              <button
                type="button"
                onClick={() => onMethodChange('all')}
                className="hover:text-accent/80 ml-0.5 cursor-pointer"
                title="Quitar filtro de método"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {tower !== 'all' && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-accent-soft text-accent text-xs font-bold border border-accent/20">
              <Building className="w-3 h-3" />
              <span>{tower}</span>
              <button
                type="button"
                onClick={() => onTowerChange('all')}
                className="hover:text-accent/80 ml-0.5 cursor-pointer"
                title="Quitar filtro de torre"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          <button
            type="button"
            onClick={onResetFilters}
            className="text-[11px] font-bold text-text-muted hover:text-text-primary ml-auto flex items-center gap-1 cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Restablecer</span>
          </button>
        </div>
      )}
    </div>
  );
}
