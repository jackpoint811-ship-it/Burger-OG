/**
 * OrdersFilterBar.tsx — PR-V3-09 / Refinamiento V3
 *
 * Barra de control y filtrado simplificada a 2 niveles en tiempo real:
 * - Nivel 1: Buscador Universal inteligente (#ORD-..., cliente, teléfono, torre, notas o producto),
 *   botón discreto de Filtros Avanzados (Modo & Torre con badge de activos) y control de auto-refresco.
 * - Nivel 2: Ribbon horizontal fluido de estados con conteos en vivo (incluyendo 🗑️ Archivados).
 * - Chips interactivos de filtros activos y botón 1-click de restablecer.
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
} from 'lucide-react';
import { Button } from '@ui/button';
import type { OrderV2Status, OrderV2Mode } from '@config/index';
import type { OrderCounts } from '../../features/orders';

export interface OrdersFilterState {
  search: string;
  status: 'all' | OrderV2Status | 'archived';
  mode: 'all' | OrderV2Mode;
  tower: string;
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
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Cerrar popover al hacer click fuera
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

  // Contar cuántos filtros secundarios están activos (modo o torre)
  const activeSecondaryFiltersCount =
    (filters.mode !== 'all' ? 1 : 0) + (filters.tower !== 'all' ? 1 : 0);

  const hasAnyActiveFilters =
    Boolean(filters.search.trim()) ||
    filters.status !== 'all' ||
    filters.mode !== 'all' ||
    filters.tower !== 'all';

  const statusTabs: Array<{
    id: 'all' | OrderV2Status | 'archived';
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
    { id: 'archived', label: '🗑️ Archivados', count: counts.archived, badgeClass: 'bg-zinc-500/20 text-zinc-600 dark:text-zinc-400' },
  ];

  return (
    <div className="space-y-3 bg-surface-card p-4 sm:p-5 rounded-3xl border border-line shadow-xs relative">
      {/* ─── Fila 1: Buscador Universal + Filtros Avanzados + Refresco ───────── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
        {/* Buscador Universal Rápido */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-text-muted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={filters.search}
            onChange={(e) =>
              onFilterChange((prev) => ({ ...prev, search: e.target.value }))
            }
            placeholder="Buscar por folio (#ORD-...), cliente, torre, teléfono o notas…"
            className="w-full pl-10 pr-10 h-11 rounded-2xl bg-surface-raised border border-line text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all"
          />
          {filters.search && (
            <button
              type="button"
              onClick={() => onFilterChange((prev) => ({ ...prev, search: '' }))}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary p-0.5 rounded-full cursor-pointer"
              aria-label="Limpiar búsqueda"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Botones de Control: Filtros Avanzados + Auto-Refresco */}
        <div className="flex items-center gap-2 self-end sm:self-auto shrink-0 relative">
          {/* Botón Discreto de Filtros Avanzados (Popover) */}
          <div className="relative" ref={popoverRef}>
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={() => setShowAdvancedFilters((prev) => !prev)}
              className={`h-11 px-3.5 rounded-2xl border-line text-xs font-bold flex items-center gap-1.5 transition-all ${
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
                      onClick={() =>
                        onFilterChange((prev) => ({ ...prev, mode: 'all', tower: 'all' }))
                      }
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
                    {(['all', 'pickup', 'delivery'] as const).map((mode) => {
                      const isSelected = filters.mode === mode;
                      return (
                        <button
                          key={mode}
                          type="button"
                          onClick={() =>
                            onFilterChange((prev) => ({ ...prev, mode }))
                          }
                          className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all text-center cursor-pointer ${
                            isSelected
                              ? 'bg-accent text-white shadow-xs'
                              : 'text-text-secondary hover:text-text-primary'
                          }`}
                        >
                          {mode === 'all' ? 'Todos' : mode === 'pickup' ? 'Pickup' : 'Delivery'}
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
                        value={filters.tower}
                        onChange={(e) =>
                          onFilterChange((prev) => ({ ...prev, tower: e.target.value }))
                        }
                        className="w-full bg-surface-raised text-xs font-bold text-text-primary p-2.5 rounded-xl border border-line focus:outline-none focus:border-accent cursor-pointer"
                      >
                        <option value="all">Todas las Torres</option>
                        {availableTowers.map((tower) => (
                          <option key={tower} value={tower}>
                            {tower}
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
                  className="w-full text-xs font-bold h-9"
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
              onClick={() =>
                onFilterChange((prev) => ({ ...prev, autoRefresh: !prev.autoRefresh }))
              }
              className={`h-11 px-3 rounded-2xl border text-xs font-bold flex items-center gap-2 transition-all select-none cursor-pointer ${
                filters.autoRefresh
                  ? 'bg-accent-soft border-accent/30 text-accent'
                  : 'bg-surface-raised border-line text-text-muted hover:text-text-secondary'
              }`}
              title={
                filters.autoRefresh
                  ? 'Auto-refresco activo cada 15s (clic para pausar)'
                  : 'Auto-refresco pausado (clic para activar)'
              }
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  filters.autoRefresh ? 'bg-accent animate-pulse' : 'bg-text-muted'
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
              className="h-11 px-3 rounded-2xl border-line text-xs font-bold"
              title="Refrescar lista de pedidos"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin text-accent' : 'text-text-secondary'}`}
              />
            </Button>
          </div>
        </div>
      </div>

      {/* ─── Fila 2: Ribbon Horizontal de Estados ──────────────────────────── */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar pt-0.5">
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

      {/* ─── Fila 3: Pastillas de Filtros Activos (Condicional) ─────────────── */}
      {activeSecondaryFiltersCount > 0 && (
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-line/60 text-xs">
          <span className="text-text-muted font-bold text-[11px]">Filtros activos:</span>
          {filters.mode !== 'all' && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-accent-soft text-accent text-xs font-bold border border-accent/20">
              <span>{filters.mode === 'pickup' ? '🛍️ Pickup' : '🛵 Delivery'}</span>
              <button
                type="button"
                onClick={() => onFilterChange((prev) => ({ ...prev, mode: 'all' }))}
                className="hover:text-accent/80 ml-0.5 cursor-pointer"
                title="Quitar filtro de modo"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {filters.tower !== 'all' && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-accent-soft text-accent text-xs font-bold border border-accent/20">
              <MapPin className="w-3 h-3" />
              <span>{filters.tower}</span>
              <button
                type="button"
                onClick={() => onFilterChange((prev) => ({ ...prev, tower: 'all' }))}
                className="hover:text-accent/80 ml-0.5 cursor-pointer"
                title="Quitar filtro de torre"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          <button
            type="button"
            onClick={() =>
              onFilterChange((prev) => ({ ...prev, mode: 'all', tower: 'all', search: '' }))
            }
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
