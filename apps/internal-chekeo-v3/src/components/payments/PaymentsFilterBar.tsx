/**
 * PaymentsFilterBar.tsx — Chekeo V3 Pagos Refinement
 *
 * Barra de control y filtrado simplificada a 2 niveles en tiempo real:
 * - Nivel 1: Buscador Universal inteligente (#ORD-..., cliente, teléfono, torre, notas o producto),
 *   botón de Datos Bancarios BBVA, Popover de Filtros Avanzados (Modo & Torre con badge) y auto-refresco 15s.
 * - Nivel 2: Ribbon dual de Métodos de Pago (con conteos y alerta en SPEI) y Estados de Cobro (Por Validar, Pagados, Cancelados).
 * - Nivel 3: Chips interactivos de filtros activos y botón 1-click de restablecer.
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  Search,
  X,
  RefreshCw,
  SlidersHorizontal,
  MapPin,
  ShoppingBag,
  Bike,
  RotateCcw,
  Check,
  Building2,
  ArrowRightLeft,
  DollarSign,
  CreditCard,
  CheckCircle2,
  Clock,
  Ban,
} from 'lucide-react';
import { Button } from '@ui/button';
import type {
  PaymentFilterMethod,
  PaymentFilterStatus,
  PaymentFilterMode,
  FinancialSummary,
} from '../../features/payments';

export interface PaymentsFilterBarProps {
  search: string;
  onSearchChange: (search: string) => void;
  method: PaymentFilterMethod;
  onMethodChange: (method: PaymentFilterMethod) => void;
  status: PaymentFilterStatus;
  onStatusChange: (status: PaymentFilterStatus) => void;
  mode: PaymentFilterMode;
  onModeChange: (mode: PaymentFilterMode) => void;
  tower: string;
  onTowerChange: (tower: string) => void;
  availableTowers: string[];
  autoRefresh: boolean;
  onAutoRefreshChange: (auto: boolean) => void;
  isFetching: boolean;
  onRefresh: () => void;
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
  mode,
  onModeChange,
  tower,
  onTowerChange,
  availableTowers,
  autoRefresh,
  onAutoRefreshChange,
  isFetching,
  onRefresh,
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

  // Contar filtros secundarios activos
  const activeSecondaryFiltersCount = (mode !== 'all' ? 1 : 0) + (tower !== 'all' ? 1 : 0);

  const methodTabs: Array<{
    id: PaymentFilterMethod;
    label: string;
    count: number;
    alertCount?: number;
    icon?: React.ComponentType<{ className?: string }>;
  }> = [
    { id: 'all', label: 'Todos los Métodos', count: allOrdersCount },
    {
      id: 'transfer',
      label: 'SPEI / Transf.',
      count: financialSummary.transferCount,
      alertCount: financialSummary.pendingTransferCount,
      icon: ArrowRightLeft,
    },
    {
      id: 'cash',
      label: 'Efectivo',
      count: financialSummary.cashCount,
      icon: DollarSign,
    },
    {
      id: 'card',
      label: 'Tarjeta',
      count: financialSummary.cardCount,
      icon: CreditCard,
    },
  ];

  const statusTabs: Array<{
    id: PaymentFilterStatus;
    label: string;
    count?: number;
    badgeClass?: string;
    icon?: React.ComponentType<{ className?: string }>;
  }> = [
    { id: 'all', label: 'Todos los Estados' },
    {
      id: 'pending',
      label: 'Por Validar',
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
      {/* ─── Fila 1: Buscador Universal + Datos Bancarios + Filtros Avanzados + Refresco ─ */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
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
          {search && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary p-0.5 rounded-full cursor-pointer"
              aria-label="Limpiar búsqueda"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Botones de Control */}
        <div className="flex items-center gap-2 self-end sm:self-auto shrink-0 relative">
          {/* Botón de Datos Bancarios BBVA */}
          <Button
            type="button"
            variant="outline"
            size="md"
            onClick={onOpenBankDetails}
            className="h-11 px-3 rounded-2xl border-line text-xs font-bold text-blue-600 dark:text-blue-400 hover:bg-blue-500/10 flex items-center gap-1.5 cursor-pointer"
            title="Ver y copiar cuenta bancaria BBVA"
          >
            <Building2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Cuenta BBVA</span>
          </Button>

          {/* Botón Discreto de Filtros Avanzados (Popover) */}
          <div className="relative" ref={popoverRef}>
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={() => setShowAdvancedFilters((prev) => !prev)}
              className={`h-11 px-3.5 rounded-2xl border-line text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeSecondaryFiltersCount > 0
                  ? 'bg-accent/10 border-accent/40 text-accent'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
              title="Filtros avanzados por Modo y Torre"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Filtros</span>
              {activeSecondaryFiltersCount > 0 && (
                <span className="ml-1 px-1.5 py-0.2 rounded-full bg-accent text-white text-[10px] font-black">
                  {activeSecondaryFiltersCount}
                </span>
              )}
            </Button>

            {/* Panel Popover de Filtros Avanzados */}
            {showAdvancedFilters && (
              <div className="absolute right-0 top-12 mt-1 z-40 w-72 p-4 bg-surface-card border border-line rounded-3xl shadow-floating space-y-4 animate-in fade-in zoom-in-95 duration-150">
                <div className="flex items-center justify-between border-b border-line pb-2">
                  <span className="text-xs font-black uppercase tracking-wider text-text-primary">
                    Filtros Avanzados
                  </span>
                  {activeSecondaryFiltersCount > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        onModeChange('all');
                        onTowerChange('all');
                      }}
                      className="text-[11px] font-bold text-accent hover:underline cursor-pointer"
                    >
                      Restablecer
                    </button>
                  )}
                </div>

                {/* Modo de Pedido */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-text-muted">Modo de Entrega</label>
                  <div className="grid grid-cols-3 gap-1 bg-surface-raised p-1 rounded-xl border border-line">
                    {(['all', 'pickup', 'delivery'] as const).map((m) => {
                      const isSelected = mode === m;
                      return (
                        <button
                          key={m}
                          type="button"
                          onClick={() => onModeChange(m)}
                          className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all text-center cursor-pointer ${
                            isSelected
                              ? 'bg-accent text-white shadow-xs'
                              : 'text-text-secondary hover:text-text-primary'
                          }`}
                        >
                          {m === 'all' ? 'Todos' : m === 'pickup' ? 'Pickup' : 'Delivery'}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Selector de Torre */}
                {availableTowers.length > 0 && (
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-text-muted">Torre / Ubicación</label>
                    <div className="relative">
                      <select
                        value={tower}
                        onChange={(e) => onTowerChange(e.target.value)}
                        className="w-full bg-surface-raised text-xs font-bold text-text-primary p-2.5 rounded-xl border border-line focus:outline-none focus:border-accent cursor-pointer"
                      >
                        <option value="all">Todas las Torres</option>
                        {availableTowers.map((t) => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

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

          {/* Toggle Auto-Refresh & Botón Refrescar */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => onAutoRefreshChange(!autoRefresh)}
              className={`h-11 px-3 rounded-2xl border text-xs font-bold flex items-center gap-2 transition-all select-none cursor-pointer ${
                autoRefresh
                  ? 'bg-accent-soft border-accent/30 text-accent'
                  : 'bg-surface-raised border-line text-text-muted hover:text-text-secondary'
              }`}
              title={
                autoRefresh
                  ? 'Auto-refresco activo cada 15s (clic para pausar)'
                  : 'Auto-refresco pausado (clic para activar)'
              }
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  autoRefresh ? 'bg-accent animate-pulse' : 'bg-text-muted'
                }`}
              />
              <span className="hidden md:inline">Auto 15s</span>
            </button>

            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={onRefresh}
              disabled={isFetching}
              className="h-11 px-3 rounded-2xl border-line text-xs font-bold cursor-pointer"
              title="Refrescar lista de cobros"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin text-accent' : 'text-text-secondary'}`}
              />
            </Button>
          </div>
        </div>
      </div>

      {/* ─── Fila 2: Ribbon Dual (Métodos de Pago & Estados de Cobro) ────────── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2.5 pt-2 border-t border-line/60">
        {/* Ribbon de Métodos de Pago */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          {methodTabs.map((tab) => {
            const isActive = method === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onMethodChange(tab.id)}
                className={`px-3 py-1.5 rounded-2xl text-xs font-bold whitespace-nowrap flex items-center gap-1.5 transition-all cursor-pointer ${
                  isActive
                    ? 'bg-accent text-white shadow-xs'
                    : 'bg-surface-raised border border-line text-text-secondary hover:text-text-primary hover:border-line/80'
                }`}
              >
                {tab.icon && <tab.icon className="w-3.5 h-3.5 shrink-0" />}
                <span>{tab.label}</span>
                <span
                  className={`px-2 py-0.2 rounded-full text-[10px] font-extrabold ${
                    isActive
                      ? 'bg-white/20 text-white'
                      : 'bg-surface text-text-muted'
                  }`}
                >
                  {tab.count}
                </span>
                {tab.alertCount && tab.alertCount > 0 ? (
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse shrink-0" />
                ) : null}
              </button>
            );
          })}
        </div>

        {/* Ribbon de Estados de Cobro */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar shrink-0">
          {statusTabs.map((st) => {
            const isActive = status === st.id;
            return (
              <button
                key={st.id}
                type="button"
                onClick={() => onStatusChange(st.id)}
                className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold whitespace-nowrap flex items-center gap-1 transition-all cursor-pointer ${
                  isActive
                    ? 'bg-text-primary text-surface-card shadow-xs'
                    : 'bg-surface text-text-muted hover:text-text-primary border border-line'
                }`}
              >
                {st.icon && <st.icon className="w-3 h-3 shrink-0" />}
                <span>{st.label}</span>
                {st.count !== undefined && st.id !== 'all' && (
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                      isActive ? 'bg-surface-card/20 text-surface-card' : st.badgeClass
                    }`}
                  >
                    {st.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ─── Fila 3: Pastillas de Filtros Activos (Condicional) ─────────────── */}
      {activeSecondaryFiltersCount > 0 && (
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-line/60 text-xs">
          <span className="text-text-muted font-bold text-[11px]">Filtros activos:</span>
          {mode !== 'all' && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-accent-soft text-accent text-xs font-bold border border-accent/20">
              {mode === 'pickup' ? (
                <>
                  <ShoppingBag className="w-3 h-3 shrink-0" />
                  <span>Pickup</span>
                </>
              ) : (
                <>
                  <Bike className="w-3 h-3 shrink-0" />
                  <span>Delivery</span>
                </>
              )}
              <button
                type="button"
                onClick={() => onModeChange('all')}
                className="hover:text-accent/80 ml-0.5 cursor-pointer"
                title="Quitar filtro de modo"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {tower !== 'all' && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-accent-soft text-accent text-xs font-bold border border-accent/20">
              <MapPin className="w-3 h-3" />
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
