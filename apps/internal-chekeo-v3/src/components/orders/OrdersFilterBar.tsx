/**
 * OrdersFilterBar.tsx — PR-V3-09 / Refinamiento UX/UI V3
 *
 * Barra de control y filtrado simplificada y desaturada:
 * - Nivel 1: Buscador Universal amplio y botón discreto de Filtros (Torre GGA / Torre Valcob con badge de activos).
 * - Nivel 2: Ribbon horizontal fluido de estados con conteos en vivo (incluyendo 🗑️ Archivados).
 * - Chips interactivos de filtros secundarios activos y botón 1-click de restablecer.
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  Search,
  X,
  SlidersHorizontal,
  RotateCcw,
  Check,
  Archive,
  Building,
  Loader2,
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
  availableTowers?: string[];
  isFetching?: boolean;
  onRefresh?: () => void;
}

export function OrdersFilterBar({
  filters,
  onFilterChange,
  counts,
  isFetching = false,
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

  // Contar cuántos filtros secundarios están activos (torre)
  const activeSecondaryFiltersCount = filters.tower !== 'all' ? 1 : 0;

  const statusTabs: Array<{
    id: 'all' | OrderV2Status | 'archived';
    label: string;
    count: number;
    icon?: React.ComponentType<{ className?: string }>;
    badgeClass?: string;
  }> = [
    { id: 'all', label: 'Todos', count: counts.all },
    { id: 'new', label: 'Nuevos', count: counts.new, badgeClass: 'bg-blue-500/20 text-blue-600 dark:text-blue-400' },
    { id: 'preparing', label: 'Preparando', count: counts.preparing, badgeClass: 'bg-amber-500/20 text-amber-600 dark:text-amber-400' },
    { id: 'ready', label: 'Listos', count: counts.ready, badgeClass: 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400' },
    { id: 'delivered', label: 'Entregados', count: counts.delivered },
    { id: 'cancelled', label: 'Cancelados', count: counts.cancelled, badgeClass: 'bg-red-500/20 text-red-600 dark:text-red-400' },
    { id: 'archived', label: 'Archivados', icon: Archive, count: counts.archived, badgeClass: 'bg-zinc-500/20 text-zinc-600 dark:text-zinc-400' },
  ];

  return (
    <div className="space-y-3 bg-surface-card p-4 sm:p-5 rounded-3xl border border-line shadow-xs relative">
      {/* ─── Fila 1: Buscador Universal + Filtros de Torre ─────────────────── */}
      <div className="flex items-center justify-between gap-2.5">
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
          {filters.search ? (
            <button
              type="button"
              onClick={() => onFilterChange((prev) => ({ ...prev, search: '' }))}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary p-0.5 rounded-full cursor-pointer"
              aria-label="Limpiar búsqueda"
            >
              <X className="w-4 h-4" />
            </button>
          ) : isFetching ? (
            <Loader2 className="w-4 h-4 text-accent animate-spin absolute right-3.5 top-1/2 -translate-y-1/2" />
          ) : null}
        </div>

        {/* Botón Discreto de Filtros (Popover) */}
        <div className="relative shrink-0" ref={popoverRef}>
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
            title="Filtros por Torre de Entrega"
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
                    onClick={() =>
                      onFilterChange((prev) => ({ ...prev, mode: 'all', tower: 'all' }))
                    }
                    className="text-[11px] font-bold text-accent hover:underline cursor-pointer"
                  >
                    Restablecer
                  </button>
                )}
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
                      (t.id === 'all' && filters.tower === 'all') ||
                      (t.id !== 'all' && filters.tower.toLowerCase().includes(t.id.toLowerCase().replace('torre ', '')));
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => onFilterChange((prev) => ({ ...prev, tower: t.id }))}
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

      {/* ─── Fila 2: Ribbon Horizontal de Estados ──────────────────────────── */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 no-scrollbar border-t border-line/60 pt-2.5">
        {statusTabs.map((tab) => {
          const isActive = filters.status === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() =>
                onFilterChange((prev) => ({ ...prev, status: tab.id }))
              }
              className={`px-3 py-1.5 rounded-2xl text-xs font-bold whitespace-nowrap flex items-center gap-1.5 transition-all cursor-pointer select-none ${
                isActive
                  ? 'bg-text-primary text-surface-card shadow-xs'
                  : 'bg-surface-raised border border-line text-text-secondary hover:text-text-primary hover:border-line/80'
              }`}
            >
              {tab.icon && <tab.icon className="w-3.5 h-3.5 shrink-0" />}
              <span>{tab.label}</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                  isActive
                    ? 'bg-surface-card/20 text-surface-card'
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
      {filters.tower !== 'all' && (
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-line/60 text-xs">
          <span className="text-text-muted font-bold text-[11px]">Filtros activos:</span>

          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-accent-soft text-accent text-xs font-bold border border-accent/20">
            <Building className="w-3 h-3" />
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

          <button
            type="button"
            onClick={() => onFilterChange((prev) => ({ ...prev, search: '', status: 'all', mode: 'all', tower: 'all' }))}
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
