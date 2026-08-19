/**
 * OrdersFilterBar.tsx — PR-V3-09
 *
 * Barra de control y filtrado en tiempo real para Pedidos de Chekeo V3:
 * - Búsqueda instantánea por folio (#ORD-...), nombre o teléfono
 * - Pestañas de estado con conteos reactivos dinámicos
 * - Filtros por Modo (Pickup / Delivery) y Torre / Ubicación
 * - Filtro de horizonte de entrega (Hoy / Mañana / Todos)
 * - Botón de refresco manual con feedback y switch de auto-refresco (15s).
 */

import React from 'react';
import {
  Search,
  X,
  RefreshCw,
  MapPin,
  Calendar,
  Filter,
  ShoppingBag,
  Bike,
  Flame,
  CheckCircle2,
  Clock,
  Ban,
  Radio,
} from 'lucide-react';
import { Button } from '@ui/button';
import type { OrderV2Status, OrderV2Mode } from '@config/index';
import type { OrderCounts } from '../../features/orders';

export interface OrdersFilterState {
  search: string;
  status: 'all' | OrderV2Status;
  mode: 'all' | OrderV2Mode;
  tower: string;
  dateHorizon: 'today' | 'tomorrow' | 'all';
  autoRefresh: boolean;
}

export interface OrdersFilterBarProps {
  filters: OrdersFilterState;
  onFilterChange: (updater: (prev: OrdersFilterState) => OrdersFilterState) => void;
  counts: OrderCounts;
  availableTowers: string[];
  isFetching: boolean;
  onRefresh: () => void;
}

export function OrdersFilterBar({
  filters,
  onFilterChange,
  counts,
  availableTowers,
  isFetching,
  onRefresh,
}: OrdersFilterBarProps) {
  const statusTabs: Array<{
    id: 'all' | OrderV2Status;
    label: string;
    count: number;
    badgeClass?: string;
  }> = [
    { id: 'all', label: 'Todos', count: counts.all },
    { id: 'new', label: 'Nuevos', count: counts.new, badgeClass: 'bg-blue-500/20 text-blue-600 dark:text-blue-400' },
    { id: 'preparing', label: 'Preparando', count: counts.preparing, badgeClass: 'bg-amber-500/20 text-amber-600 dark:text-amber-400' },
    { id: 'ready', label: 'Listos', count: counts.ready, badgeClass: 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400' },
    { id: 'delivered', label: 'Entregados', count: counts.delivered },
    { id: 'cancelled', label: 'Cancelados', count: counts.cancelled, badgeClass: 'bg-red-500/20 text-red-600 dark:text-red-400' },
  ];

  return (
    <div className="space-y-3 bg-surface-card p-4 sm:p-5 rounded-3xl border border-line shadow-xs">
      {/* ─── Fila 1: Búsqueda y Acciones de Refresco ────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Input de Búsqueda Rápida */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-text-muted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={filters.search}
            onChange={(e) =>
              onFilterChange((prev) => ({ ...prev, search: e.target.value }))
            }
            placeholder="Buscar por folio (#ORD-...), cliente o teléfono…"
            className="w-full pl-10 pr-10 h-11 rounded-2xl bg-surface-raised border border-line text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all"
          />
          {filters.search && (
            <button
              type="button"
              onClick={() => onFilterChange((prev) => ({ ...prev, search: '' }))}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary p-0.5 rounded-full"
              aria-label="Limpiar búsqueda"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Controles de Refresco */}
        <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
          {/* Toggle Auto-Refresh */}
          <button
            type="button"
            onClick={() =>
              onFilterChange((prev) => ({ ...prev, autoRefresh: !prev.autoRefresh }))
            }
            className={`h-11 px-3.5 rounded-2xl border text-xs font-bold flex items-center gap-2 transition-all select-none ${
              filters.autoRefresh
                ? 'bg-accent-soft border-accent/30 text-accent'
                : 'bg-surface-raised border-line text-text-muted hover:text-text-secondary'
            }`}
            title={
              filters.autoRefresh
                ? 'Auto-refresco activo cada 15s'
                : 'Auto-refresco pausado'
            }
          >
            <span
              className={`w-2 h-2 rounded-full ${
                filters.autoRefresh ? 'bg-accent animate-pulse' : 'bg-text-muted'
              }`}
            />
            <span className="hidden md:inline">Auto 15s</span>
          </button>

          {/* Botón Refrescar Manual */}
          <Button
            type="button"
            variant="outline"
            size="md"
            onClick={onRefresh}
            disabled={isFetching}
            className="h-11 px-3.5 rounded-2xl border-line text-xs font-bold"
            title="Refrescar lista de pedidos"
          >
            <RefreshCw
              className={`w-4 h-4 ${isFetching ? 'animate-spin text-accent' : 'text-text-secondary'}`}
            />
            <span className="hidden md:inline ml-1.5">Refrescar</span>
          </Button>
        </div>
      </div>

      {/* ─── Fila 2: Pestañas de Estado (Ribbon horizontal) ────────────────── */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar pt-1">
        {statusTabs.map((tab) => {
          const isActive = filters.status === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() =>
                onFilterChange((prev) => ({ ...prev, status: tab.id }))
              }
              className={`px-3.5 py-2 rounded-2xl text-xs font-bold whitespace-nowrap flex items-center gap-2 transition-all cursor-pointer ${
                isActive
                  ? 'bg-accent text-white shadow-xs'
                  : 'bg-surface-raised border border-line text-text-secondary hover:text-text-primary hover:border-line/80'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`px-2 py-0.5 rounded-full text-[11px] font-extrabold ${
                  isActive
                    ? 'bg-white/20 text-white'
                    : tab.badgeClass || 'bg-surface text-text-muted'
                }`}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* ─── Fila 3: Filtros Secundarios (Modo, Torre y Fecha) ──────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-line/60 text-xs">
        {/* Filtro de Modo de Pedido */}
        <div className="flex items-center gap-1.5">
          <span className="text-text-muted font-bold mr-1">Modo:</span>
          {(['all', 'pickup', 'delivery'] as const).map((mode) => {
            const isSelected = filters.mode === mode;
            const label =
              mode === 'all' ? 'Todos' : mode === 'pickup' ? '🛍️ Pickup' : '🛵 Delivery';
            return (
              <button
                key={mode}
                type="button"
                onClick={() =>
                  onFilterChange((prev) => ({ ...prev, mode }))
                }
                className={`px-2.5 py-1 rounded-xl font-bold transition-colors ${
                  isSelected
                    ? 'bg-accent/15 text-accent border border-accent/20'
                    : 'text-text-secondary hover:text-text-primary hover:bg-surface-raised'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>

        {/* Filtros de Torre y Fecha */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Selector de Torre */}
          {availableTowers.length > 0 && (
            <div className="flex items-center gap-1.5 bg-surface-raised px-2.5 py-1 rounded-xl border border-line">
              <MapPin className="w-3.5 h-3.5 text-accent" />
              <select
                value={filters.tower}
                onChange={(e) =>
                  onFilterChange((prev) => ({ ...prev, tower: e.target.value }))
                }
                aria-label="Filtrar por torre"
                className="bg-transparent text-xs font-bold text-text-primary focus:outline-none cursor-pointer"
              >
                <option value="all">Todas las Torres</option>
                {availableTowers.map((tower) => (
                  <option key={tower} value={tower}>
                    {tower}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Filtro de Horizonte de Fecha */}
          <div className="flex items-center gap-1 bg-surface-raised px-1.5 py-0.5 rounded-xl border border-line">
            <Calendar className="w-3.5 h-3.5 text-accent ml-1 mr-0.5" />
            {(['today', 'tomorrow', 'all'] as const).map((horizon) => {
              const isSelected = filters.dateHorizon === horizon;
              const label =
                horizon === 'today'
                  ? 'Hoy'
                  : horizon === 'tomorrow'
                    ? 'Mañana'
                    : 'Todas';
              return (
                <button
                  key={horizon}
                  type="button"
                  onClick={() =>
                    onFilterChange((prev) => ({ ...prev, dateHorizon: horizon }))
                  }
                  className={`px-2 py-0.5 rounded-lg text-xs font-bold transition-colors ${
                    isSelected
                      ? 'bg-accent text-white shadow-xs'
                      : 'text-text-secondary hover:text-text-primary'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
