/**
 * KitchenSummaryK.tsx — Burgers.exe Chekeo V3
 *
 * Resumen K & Agregador de Insumos para Mise en Place, Precocción y Control de Restock Diario:
 * - Principio de Unificación Canónica V3: Las hamburguesas se agrupan por receta real sin duplicidad de combos.
 * - 📦 Checklist de Insumos Físicos & Control de Restock: Cálculo de carnes (patties base + extras), panes, quesos, tocinos, papas, bebidas y dips.
 * - 🍟 Precocción & Pesaje de Side Quests: Desglose exacto de porciones por receta de papas y aros.
 * - 4 Estaciones de Producción en paralelo con filtros tipo chip: Plancha, Freidora, Bebidas y Extras.
 * - Panel de Modificaciones con desglose de hamburguesas afectadas.
 * - Desglose Logístico por Torre: Conteo y avance de empaque para Torre GGA y Torre Valcob.
 * - Modo Dual accesible: Vista de Producción & Restock reactiva en vivo y Vista de Insumos/Costeo D1.
 */

import React, { useState, useMemo, useCallback } from 'react';
import {
  Flame,
  Utensils,
  Layers,
  RefreshCw,
  Scale,
  Building2,
  CheckCircle2,
  Wine,
  Tag,
  Boxes,
} from 'lucide-react';
import { Badge } from '@ui/badge';
import { Button } from '@ui/button';
import { Skeleton } from '@ui/skeleton';
import { cn } from '@ui/cn';
import {
  useKitchenDisplay,
  useKitchenSummaryKQuery,
  computeKitchenAggregates,
  formatKitchenExtraLabel,
  formatKitchenRemovalLabel,
} from '../../features/kitchen';
import { extractOrderTargetDate } from '../shared/HorizontalDateCalendarFilter';
import type { OrderV2 } from '@config/index';
import { getCdmxTodayString } from '@config/index';

function formatCurrency(pesos: number): string {
  const safeNumber = Number.isFinite(pesos) ? pesos : 0;
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(safeNumber);
}

export interface KitchenSummaryKProps {
  selectedDate?: string;
}

type StationFilterType = 'all' | 'prep' | 'sideQuest' | 'drinks' | 'extras';

interface SubmenuNavItem {
  id: string;
  sectionId: string;
  label: string;
  shortLabel: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number | string;
  isD1?: boolean;
}

export function KitchenSummaryK({ selectedDate = 'today' }: KitchenSummaryKProps) {
  const [viewMode, setViewMode] = useState<'production' | 'd1Ingredients'>('production');
  const [stationFilter, setStationFilter] = useState<StationFilterType>('all');
  const [activeSection, setActiveSection] = useState<string>('torres');

  const todayStr = getCdmxTodayString();

  const targetDateParam =
    selectedDate === 'today'
      ? todayStr
      : selectedDate === 'all' || selectedDate === 'past'
      ? undefined
      : selectedDate;

  const {
    tickets,
    isLoading: isOrdersLoading,
    isRefetching: isOrdersRefetching,
    refetch: refetchOrders,
  } = useKitchenDisplay();

  const {
    data: summaryKData,
    isLoading: isSummaryKLoading,
    isRefetching: isSummaryKRefetching,
    refetch: refetchSummaryK,
  } = useKitchenSummaryKQuery(targetDateParam);

  const handleRefreshAll = () => {
    void refetchOrders();
    void refetchSummaryK();
  };

  const isRefreshing = isOrdersRefetching || isSummaryKRefetching;
  const isLoading = isOrdersLoading && isSummaryKLoading;

  // Filtrar tickets correspondientes a la fecha seleccionada
  const filteredTickets = useMemo(() => {
    return tickets.filter((ticket) => {
      if (selectedDate === 'all') return true;

      const targetDate = extractOrderTargetDate(
        {
          ...ticket,
          delivery: {
            scheduledDate: ticket.scheduledDate,
            isScheduled: ticket.isScheduled,
          },
          createdAt: ticket.createdAtIso,
        } as unknown as OrderV2,
        todayStr
      );

      if (selectedDate === 'today') return targetDate === todayStr;
      if (selectedDate === 'past') return targetDate < todayStr;
      return targetDate === selectedDate;
    });
  }, [tickets, selectedDate, todayStr]);

  // Cómputo agregado canónico de insumos
  const aggregates = useMemo(
    () => computeKitchenAggregates(filteredTickets),
    [filteredTickets]
  );

  const originalPercent =
    aggregates.totalBurgers > 0
      ? Math.round((aggregates.originalRecipeCount / aggregates.totalBurgers) * 100)
      : 100;

  // Navegación suave por anclas
  const scrollToSection = useCallback((sectionId: string) => {
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  const handleNavClick = useCallback(
    (item: SubmenuNavItem) => {
      setActiveSection(item.id);
      if (item.isD1) {
        setViewMode('d1Ingredients');
        setTimeout(() => scrollToSection(item.sectionId), 50);
      } else {
        if (viewMode === 'd1Ingredients') {
          setViewMode('production');
          setTimeout(() => scrollToSection(item.sectionId), 50);
        } else {
          // Si hace clic en una estación específica y está filtrado, asegurar visibilidad
          if (item.id === 'plancha' && stationFilter !== 'all' && stationFilter !== 'prep') {
            setStationFilter('all');
          } else if (item.id === 'freidora' && stationFilter !== 'all' && stationFilter !== 'sideQuest') {
            setStationFilter('all');
          } else if (item.id === 'bebidas' && stationFilter !== 'all' && stationFilter !== 'drinks') {
            setStationFilter('all');
          } else if (item.id === 'extras' && stationFilter !== 'all' && stationFilter !== 'extras') {
            setStationFilter('all');
          }
          scrollToSection(item.sectionId);
        }
      }
    },
    [viewMode, stationFilter, scrollToSection]
  );

  // Definición de ítems para el submenú lateral
  const navItems: SubmenuNavItem[] = useMemo(
    () => [
      {
        id: 'torres',
        sectionId: 'section-torres',
        label: 'Torres',
        shortLabel: 'Torres',
        icon: Building2,
        badge: aggregates.activeOrdersCount,
      },
      {
        id: 'insumos',
        sectionId: 'section-insumos',
        label: 'Insumos',
        shortLabel: 'Insumos',
        icon: Boxes,
        badge: 7,
      },
      {
        id: 'plancha',
        sectionId: 'section-plancha',
        label: 'Plancha',
        shortLabel: 'Plancha',
        icon: Flame,
        badge: aggregates.totalBurgers,
      },
      {
        id: 'freidora',
        sectionId: 'section-freidora',
        label: 'Freidora',
        shortLabel: 'Freidora',
        icon: Utensils,
        badge: aggregates.totalGarnishes,
      },
      {
        id: 'bebidas',
        sectionId: 'section-bebidas',
        label: 'Bebidas',
        shortLabel: 'Bebidas',
        icon: Wine,
        badge: aggregates.totalDrinks,
      },
      {
        id: 'extras',
        sectionId: 'section-extras',
        label: 'Extras',
        shortLabel: 'Extras',
        icon: Tag,
        badge: aggregates.totalExtras,
      },
      {
        id: 'modificaciones',
        sectionId: 'section-modificaciones',
        label: 'Modificaciones',
        shortLabel: 'Mods',
        icon: Layers,
        badge: aggregates.removedIngredients.length,
      },
      {
        id: 'd1',
        sectionId: 'section-d1',
        label: 'Insumos D1',
        shortLabel: 'D1',
        icon: Scale,
        isD1: true,
      },
    ],
    [aggregates]
  );

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      {/* ─── Toolbar Superior Compacta Slop-Free ────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-surface-card p-3 sm:p-4 rounded-3xl border border-line shadow-xs">
        <div className="flex items-center gap-2">
          <span className="text-sm font-black text-text-primary tracking-tight">
            Mise en Place & Producción
          </span>
          <span className="px-2 py-0.5 rounded-md bg-accent-soft text-accent text-[11px] font-black uppercase tracking-wider">
            En Vivo
          </span>
        </div>

        {/* Controles de Modo y Refresco */}
        <div className="flex items-center gap-2">
          {/* Selector de Modo */}
          <div
            role="tablist"
            aria-label="Modo de Resumen K"
            className="flex items-center p-1 bg-surface-raised rounded-2xl border border-line"
          >
            <button
              type="button"
              role="tab"
              aria-selected={viewMode === 'production'}
              onClick={() => {
                setViewMode('production');
                setActiveSection('torres');
              }}
              className={cn(
                'min-h-9 px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer select-none flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent active:scale-[0.98]',
                viewMode === 'production'
                  ? 'bg-text-primary text-surface-card shadow-xs'
                  : 'text-text-secondary hover:text-text-primary'
              )}
            >
              <Boxes className="w-3.5 h-3.5" />
              <span>Producción</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={viewMode === 'd1Ingredients'}
              onClick={() => {
                setViewMode('d1Ingredients');
                setActiveSection('d1');
              }}
              className={cn(
                'min-h-9 px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer select-none flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent active:scale-[0.98]',
                viewMode === 'd1Ingredients'
                  ? 'bg-text-primary text-surface-card shadow-xs'
                  : 'text-text-secondary hover:text-text-primary'
              )}
            >
              <Scale className="w-3.5 h-3.5" />
              <span>Insumos D1</span>
            </button>
          </div>

          {/* Botón Refresco */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefreshAll}
            disabled={isRefreshing}
            className="min-h-9 px-3 rounded-2xl border-line flex items-center gap-1.5 text-xs font-black cursor-pointer hover:bg-surface-raised active:scale-[0.98]"
            aria-label="Refrescar datos de cocina"
          >
            <RefreshCw className={cn('w-3.5 h-3.5', isRefreshing && 'animate-spin')} />
            <span className="hidden sm:inline">Refrescar</span>
          </Button>
        </div>
      </div>

      {/* ─── Layout con Barra Lateral de Submenú de Iconos ────────────────────── */}
      <div className="flex flex-col md:flex-row gap-4 sm:gap-5 items-start">
        {/* ─── 1. Submenú Lateral (Desktop Sticky / Móvil Riel) ──────────────── */}
        <aside
          aria-label="Submenú de secciones de Resumen K"
          className="hidden md:flex flex-col gap-1.5 sticky top-4 w-14 shrink-0 bg-surface-card p-1.5 rounded-2xl border border-line shadow-xs self-start"
        >
          {navItems.map((item) => {
            const Icon = item.icon;
            const isItemActive =
              (item.isD1 && viewMode === 'd1Ingredients') ||
              (!item.isD1 && viewMode === 'production' && activeSection === item.id);

            return (
              <button
                type="button"
                key={item.id}
                onClick={() => handleNavClick(item)}
                className={cn(
                  'group relative flex flex-col items-center justify-center w-11 h-11 rounded-xl text-xs font-black transition-all cursor-pointer select-none active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
                  isItemActive
                    ? 'bg-text-primary text-surface-card shadow-xs'
                    : 'text-text-secondary hover:text-text-primary hover:bg-surface-raised'
                )}
                aria-label={`Ir a sección ${item.label}`}
                title={item.label}
              >
                <Icon className="w-5 h-5 shrink-0" />

                {item.badge !== undefined && Number(item.badge) > 0 && (
                  <span
                    className={cn(
                      'absolute -top-1 -right-1 px-1 min-w-[16px] h-4 rounded-full text-[9px] font-black flex items-center justify-center tabular-nums leading-none',
                      isItemActive
                        ? 'bg-accent text-white'
                        : 'bg-surface-raised border border-line text-text-primary'
                    )}
                  >
                    {item.badge}
                  </span>
                )}

                {/* Tooltip flotante */}
                <span className="pointer-events-none absolute left-full ml-2 px-2.5 py-1 rounded-lg bg-text-primary text-surface-card text-[11px] font-black opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-panel z-30 hidden lg:block">
                  {item.label}
                </span>
              </button>
            );
          })}
        </aside>

        {/* Submenú móvil horizontal */}
        <div className="flex md:hidden overflow-x-auto gap-1.5 p-1.5 bg-surface-card rounded-2xl border border-line scrollbar-none sticky top-2 z-20 shadow-xs w-full">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isItemActive =
              (item.isD1 && viewMode === 'd1Ingredients') ||
              (!item.isD1 && viewMode === 'production' && activeSection === item.id);

            return (
              <button
                type="button"
                key={item.id}
                onClick={() => handleNavClick(item)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-black transition-all cursor-pointer shrink-0 select-none min-h-[44px] active:scale-[0.98]',
                  isItemActive
                    ? 'bg-text-primary text-surface-card shadow-xs'
                    : 'bg-surface-raised text-text-secondary hover:text-text-primary'
                )}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.shortLabel}</span>
                {item.badge !== undefined && Number(item.badge) > 0 && (
                  <span
                    className={cn(
                      'px-1.5 py-0.2 rounded-full text-[10px] font-black tabular-nums',
                      isItemActive ? 'bg-accent text-white' : 'bg-surface-card text-text-primary'
                    )}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* ─── 2. Lienzo Principal de Secciones ──────────────────────────────── */}
        <div className="flex-1 min-w-0 space-y-4 sm:space-y-5 w-full">
          {viewMode === 'production' ? (
            <>
              {/* ─── 🏢 Módulo 1: Logística por Torre ────────────────────────── */}
              <section
                id="section-torres"
                aria-label="Logística por Torre"
                className="p-4 sm:p-5 rounded-3xl bg-surface-card border border-line shadow-card space-y-3"
              >
                <div className="flex items-center justify-between pb-2.5 border-b border-line">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-accent shrink-0" />
                    <h2 className="font-black text-sm sm:text-base text-text-primary tracking-tight">
                      Logística por Torre
                    </h2>
                  </div>
                  <Badge variant="outline" className="font-black text-xs border-line tabular-nums">
                    {aggregates.activeOrdersCount} órdenes
                  </Badge>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {aggregates.towerBreakdown.map((tower) => {
                    const percentReady =
                      tower.totalOrders > 0
                        ? Math.round((tower.readyOrders / tower.totalOrders) * 100)
                        : 0;

                    return (
                      <div
                        key={tower.location}
                        className="p-3.5 rounded-2xl bg-surface-raised border border-line space-y-2.5"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-black text-sm text-text-primary flex items-center gap-1.5">
                            <Building2 className="w-4 h-4 text-text-secondary" />
                            <span>{tower.location}</span>
                          </span>
                          <span className="px-2 py-0.5 rounded-lg bg-text-primary text-surface-card text-xs font-black tabular-nums">
                            {tower.totalOrders} órdenes
                          </span>
                        </div>

                        {/* Métricas por Torre */}
                        <div className="grid grid-cols-3 gap-1.5 text-center text-xs">
                          <div className="p-1.5 rounded-xl bg-surface-card border border-line">
                            <span className="text-[10px] font-black text-text-muted block">
                              BURGERS
                            </span>
                            <span className="font-black text-text-primary tabular-nums">
                              {tower.totalBurgers}
                            </span>
                          </div>
                          <div className="p-1.5 rounded-xl bg-surface-card border border-line">
                            <span className="text-[10px] font-black text-text-muted block">
                              SIDES
                            </span>
                            <span className="font-black text-amber-600 dark:text-amber-400 tabular-nums">
                              {tower.totalGarnishes}
                            </span>
                          </div>
                          <div className="p-1.5 rounded-xl bg-surface-card border border-line">
                            <span className="text-[10px] font-black text-text-muted block">
                              BEBIDAS
                            </span>
                            <span className="font-black text-blue-600 dark:text-blue-400 tabular-nums">
                              {tower.totalDrinks}
                            </span>
                          </div>
                        </div>

                        {/* Barra de Avance de Empaque */}
                        <div className="space-y-1">
                          <div className="flex justify-between text-[11px] font-bold text-text-muted">
                            <span>Empaque:</span>
                            <span className="font-black text-text-primary tabular-nums">
                              {tower.readyOrders}/{tower.totalOrders} ({percentReady}%)
                            </span>
                          </div>
                          <div className="w-full h-2 bg-surface-card rounded-full overflow-hidden border border-line">
                            <div
                              className="h-full bg-accent transition-all rounded-full"
                              style={{ width: `${percentReady}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>

              {/* ─── 📦 Módulo 2: Checklist de Insumos & Restock ──────────────── */}
              <section
                id="section-insumos"
                aria-label="Checklist de Insumos y Restock"
                className="p-4 sm:p-5 rounded-3xl bg-surface-card border border-line shadow-card space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-line">
                  <div className="flex items-center gap-2">
                    <Boxes className="w-5 h-5 text-accent shrink-0" />
                    <h2 className="font-black text-sm sm:text-base text-text-primary tracking-tight">
                      Checklist de Insumos & Restock
                    </h2>
                  </div>

                  {/* Ratio de Receta Original */}
                  <div className="flex items-center gap-2.5 bg-surface-raised px-3 py-1 rounded-xl border border-line self-start sm:self-auto">
                    <span className="text-[11px] font-black text-emerald-600 dark:text-emerald-400 tabular-nums">
                      {aggregates.originalRecipeCount} Original
                    </span>
                    <span className="text-text-muted">·</span>
                    <span className="text-[11px] font-black text-amber-600 dark:text-amber-400 tabular-nums">
                      {aggregates.customizedRecipeCount} Mods
                    </span>
                    <div className="w-16 h-2 bg-surface-card rounded-full overflow-hidden flex border border-line">
                      <div
                        className="h-full bg-emerald-500 rounded-full transition-all"
                        style={{ width: `${originalPercent}%` }}
                      />
                      <div
                        className="h-full bg-amber-500 rounded-full transition-all"
                        style={{ width: `${100 - originalPercent}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Grid de 7 Insumos Físicos Clave */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-2 sm:gap-2.5">
                  {/* 1. Patties */}
                  <div className="p-3 rounded-2xl bg-surface-raised border border-line space-y-0.5">
                    <span className="text-[10px] font-black uppercase tracking-wider text-text-muted">
                      🥩 PATTIES
                    </span>
                    <p className="text-xl sm:text-2xl font-black text-text-primary tabular-nums">
                      {isLoading ? <Skeleton className="h-7 w-10" /> : aggregates.suppliesChecklist.patties}
                    </p>
                    <p className="text-[10px] font-bold text-text-muted leading-none">
                      Bolitas carne
                    </p>
                  </div>

                  {/* 2. Bollos de Pan */}
                  <div className="p-3 rounded-2xl bg-surface-raised border border-line space-y-0.5">
                    <span className="text-[10px] font-black uppercase tracking-wider text-text-muted">
                      🍞 BOLLOS
                    </span>
                    <p className="text-xl sm:text-2xl font-black text-text-primary tabular-nums">
                      {isLoading ? <Skeleton className="h-7 w-10" /> : aggregates.suppliesChecklist.buns}
                    </p>
                    <p className="text-[10px] font-bold text-text-muted leading-none">
                      Panes a tostar
                    </p>
                  </div>

                  {/* 3. Queso Americano */}
                  <div className="p-3 rounded-2xl bg-surface-raised border border-line space-y-0.5">
                    <span className="text-[10px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-400">
                      🧀 QUESO
                    </span>
                    <p className="text-xl sm:text-2xl font-black text-amber-600 dark:text-amber-400 tabular-nums">
                      {isLoading ? <Skeleton className="h-7 w-10" /> : aggregates.suppliesChecklist.cheeseSlices}
                    </p>
                    <p className="text-[10px] font-bold text-text-muted leading-none">
                      Rebanadas
                    </p>
                  </div>

                  {/* 4. Tocino */}
                  <div className="p-3 rounded-2xl bg-surface-raised border border-line space-y-0.5">
                    <span className="text-[10px] font-black uppercase tracking-wider text-rose-600 dark:text-rose-400">
                      🥓 TOCINO
                    </span>
                    <p className="text-xl sm:text-2xl font-black text-rose-600 dark:text-rose-400 tabular-nums">
                      {isLoading ? <Skeleton className="h-7 w-10" /> : aggregates.suppliesChecklist.baconPortions}
                    </p>
                    <p className="text-[10px] font-bold text-text-muted leading-none">
                      Porciones
                    </p>
                  </div>

                  {/* 5. Guarniciones / Papas */}
                  <div className="p-3 rounded-2xl bg-surface-raised border border-line space-y-0.5">
                    <span className="text-[10px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-400">
                      🍟 SIDES
                    </span>
                    <p className="text-xl sm:text-2xl font-black text-amber-600 dark:text-amber-400 tabular-nums">
                      {isLoading ? <Skeleton className="h-7 w-10" /> : aggregates.suppliesChecklist.garnishPortions}
                    </p>
                    <p className="text-[10px] font-bold text-text-muted leading-none">
                      Porciones
                    </p>
                  </div>

                  {/* 6. Bebidas Frías */}
                  <div className="p-3 rounded-2xl bg-surface-raised border border-line space-y-0.5">
                    <span className="text-[10px] font-black uppercase tracking-wider text-blue-600 dark:text-blue-400">
                      🥤 BEBIDAS
                    </span>
                    <p className="text-xl sm:text-2xl font-black text-blue-600 dark:text-blue-400 tabular-nums">
                      {isLoading ? <Skeleton className="h-7 w-10" /> : aggregates.suppliesChecklist.coldDrinks}
                    </p>
                    <p className="text-[10px] font-bold text-text-muted leading-none">
                      Latas frías
                    </p>
                  </div>

                  {/* 7. Dips & Extras */}
                  <div className="p-3 rounded-2xl bg-surface-raised border border-line space-y-0.5">
                    <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                      🥫 DIPS
                    </span>
                    <p className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 tabular-nums">
                      {isLoading ? <Skeleton className="h-7 w-10" /> : aggregates.suppliesChecklist.dipPortions}
                    </p>
                    <p className="text-[10px] font-bold text-text-muted leading-none">
                      Vasitos
                    </p>
                  </div>
                </div>
              </section>

              {/* ─── 🎛️ Filtros Rápidos por Estación ────────────────────────────── */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                <button
                  type="button"
                  onClick={() => setStationFilter('all')}
                  className={cn(
                    'min-h-9 px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer shrink-0 border select-none flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent active:scale-[0.98]',
                    stationFilter === 'all'
                      ? 'bg-text-primary text-surface-card border-text-primary shadow-xs'
                      : 'bg-surface-card border-line text-text-secondary hover:text-text-primary'
                  )}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Todas ({aggregates.totalBurgers + aggregates.totalGarnishes + aggregates.totalDrinks + aggregates.totalExtras})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setStationFilter('prep')}
                  className={cn(
                    'min-h-9 px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer shrink-0 border select-none flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent active:scale-[0.98]',
                    stationFilter === 'prep'
                      ? 'bg-text-primary text-surface-card border-text-primary shadow-xs'
                      : 'bg-surface-card border-line text-text-secondary hover:text-text-primary'
                  )}
                >
                  <Flame className="w-3.5 h-3.5 text-amber-500" />
                  <span>Plancha ({aggregates.totalBurgers})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setStationFilter('sideQuest')}
                  className={cn(
                    'min-h-9 px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer shrink-0 border select-none flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 active:scale-[0.98]',
                    stationFilter === 'sideQuest'
                      ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                      : 'bg-surface-card border-line text-text-secondary hover:text-text-primary'
                  )}
                >
                  <Utensils className="w-3.5 h-3.5" />
                  <span>Freidora ({aggregates.totalGarnishes})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setStationFilter('drinks')}
                  className={cn(
                    'min-h-9 px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer shrink-0 border select-none flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 active:scale-[0.98]',
                    stationFilter === 'drinks'
                      ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                      : 'bg-surface-card border-line text-text-secondary hover:text-text-primary'
                  )}
                >
                  <Wine className="w-3.5 h-3.5" />
                  <span>Bebidas ({aggregates.totalDrinks})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setStationFilter('extras')}
                  className={cn(
                    'min-h-9 px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer shrink-0 border select-none flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 active:scale-[0.98]',
                    stationFilter === 'extras'
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                      : 'bg-surface-card border-line text-text-secondary hover:text-text-primary'
                  )}
                >
                  <Tag className="w-3.5 h-3.5" />
                  <span>Extras ({aggregates.totalExtras})</span>
                </button>
              </div>

              {/* ─── 4 Estaciones de Producción en Paralelo ────────────────────── */}
              <div
                id="section-estaciones"
                className={cn(
                  'grid gap-3 sm:gap-4',
                  stationFilter === 'all'
                    ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'
                    : 'grid-cols-1'
                )}
              >
                {/* ─── 1. Plancha ─────────────────────────────────────────────── */}
                {(stationFilter === 'all' || stationFilter === 'prep') && (
                  <section
                    id="section-plancha"
                    aria-label="Estación de Plancha"
                    className="p-4 rounded-3xl bg-surface-card border border-line shadow-card space-y-3 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between pb-2.5 border-b border-line">
                        <div className="flex items-center gap-1.5">
                          <Flame className="w-4 h-4 text-amber-500 shrink-0" />
                          <h3 className="font-black text-sm text-text-primary tracking-tight">
                            Plancha
                          </h3>
                        </div>
                        <span className="text-[11px] font-bold text-text-muted tabular-nums">
                          {aggregates.totalPatties} patties · {aggregates.totalBuns} panes
                        </span>
                      </div>

                      <div className="mt-3 space-y-2">
                        {aggregates.recipes.length > 0 ? (
                          aggregates.recipes.map((rec, i) => (
                            <div
                              key={rec.name || i}
                              className="p-2.5 rounded-2xl bg-surface-raised border border-line flex items-center justify-between gap-2.5"
                            >
                              <div className="min-w-0">
                                <p className="font-black text-xs sm:text-sm text-text-primary truncate">
                                  {rec.name}
                                </p>
                                <div className="flex items-center gap-1 flex-wrap mt-0.5">
                                  {rec.comboQty > 0 && rec.individualQty > 0 ? (
                                    <span className="text-[10px] font-bold text-text-muted tabular-nums">
                                      {rec.individualQty} indiv · {rec.comboQty} combo
                                    </span>
                                  ) : rec.comboQty > 0 ? (
                                    <span className="text-[10px] font-bold text-text-muted">
                                      En combo
                                    </span>
                                  ) : (
                                    <span className="text-[10px] font-bold text-text-muted">
                                      Individual
                                    </span>
                                  )}
                                  {rec.pattiesCount > 1 ? (
                                    <span className="px-1 py-0.2 rounded bg-amber-500/15 text-amber-700 dark:text-amber-300 text-[9px] font-black tabular-nums">
                                      {rec.pattiesCount}p
                                    </span>
                                  ) : null}
                                  {rec.extraPattiesCount > 0 ? (
                                    <span className="px-1 py-0.2 rounded bg-rose-500/15 text-rose-700 dark:text-rose-300 text-[9px] font-black tabular-nums">
                                      +{rec.extraPattiesCount} carne
                                    </span>
                                  ) : null}
                                </div>
                              </div>

                              <div className="flex items-center gap-2 shrink-0">
                                <div className="text-right text-[11px]">
                                  <span className="font-bold text-amber-600 dark:text-amber-400 tabular-nums">
                                    {rec.pendingQty} pend
                                  </span>
                                  {rec.readyQty > 0 ? (
                                    <span className="text-emerald-600 dark:text-emerald-400 block text-[10px] tabular-nums">
                                      {rec.readyQty} list
                                    </span>
                                  ) : null}
                                </div>
                                <span className="w-8 h-8 rounded-xl bg-text-primary text-surface-card font-black text-xs flex items-center justify-center shadow-xs tabular-nums">
                                  {rec.totalQty}
                                </span>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="py-6 text-center text-text-muted text-xs font-bold">
                            Sin hamburguesas
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="pt-2.5 border-t border-line text-xs font-bold text-text-muted flex justify-between">
                      <span>Total:</span>
                      <span className="font-black text-text-primary tabular-nums">
                        {aggregates.totalBurgers} burgers
                      </span>
                    </div>
                  </section>
                )}

                {/* ─── 2. Freidora ────────────────────────────────────────────── */}
                {(stationFilter === 'all' || stationFilter === 'sideQuest') && (
                  <section
                    id="section-freidora"
                    aria-label="Estación de Freidora"
                    className="p-4 rounded-3xl bg-surface-card border border-line shadow-card space-y-3 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between pb-2.5 border-b border-line">
                        <div className="flex items-center gap-1.5">
                          <Utensils className="w-4 h-4 text-amber-500 shrink-0" />
                          <h3 className="font-black text-sm text-text-primary tracking-tight">
                            Freidora
                          </h3>
                        </div>
                        <span className="text-[11px] font-bold text-text-muted tabular-nums">
                          {aggregates.garnishes.length} tipos
                        </span>
                      </div>

                      <div className="mt-3 space-y-2">
                        {aggregates.garnishes.length > 0 ? (
                          aggregates.garnishes.map((garnish, i) => (
                            <div
                              key={garnish.name || i}
                              className="p-2.5 rounded-2xl bg-surface-raised border border-line flex items-center justify-between gap-2.5"
                            >
                              <p className="font-black text-xs sm:text-sm text-text-primary truncate">
                                {garnish.name}
                              </p>

                              <div className="flex items-center gap-2 shrink-0">
                                <div className="text-right text-[11px]">
                                  <span className="font-bold text-amber-600 dark:text-amber-400 tabular-nums">
                                    {garnish.pendingQty} por freír
                                  </span>
                                  {garnish.readyQty > 0 ? (
                                    <span className="text-emerald-600 dark:text-emerald-400 block text-[10px] tabular-nums">
                                      {garnish.readyQty} listas
                                    </span>
                                  ) : null}
                                </div>
                                <span className="w-8 h-8 rounded-xl bg-amber-600 text-white font-black text-xs flex items-center justify-center shadow-xs tabular-nums">
                                  {garnish.totalQty}
                                </span>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="py-6 text-center text-text-muted text-xs font-bold">
                            Sin guarniciones
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="pt-2.5 border-t border-line text-xs font-bold text-text-muted flex justify-between">
                      <span>Total:</span>
                      <span className="font-black text-text-primary tabular-nums">
                        {aggregates.totalGarnishes} porciones
                      </span>
                    </div>
                  </section>
                )}

                {/* ─── 3. Bebidas Frías ───────────────────────────────────────── */}
                {(stationFilter === 'all' || stationFilter === 'drinks') && (
                  <section
                    id="section-bebidas"
                    aria-label="Estación de Bebidas"
                    className="p-4 rounded-3xl bg-surface-card border border-line shadow-card space-y-3 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between pb-2.5 border-b border-line">
                        <div className="flex items-center gap-1.5">
                          <Wine className="w-4 h-4 text-blue-500 shrink-0" />
                          <h3 className="font-black text-sm text-text-primary tracking-tight">
                            Bebidas
                          </h3>
                        </div>
                        <span className="text-[11px] font-bold text-text-muted tabular-nums">
                          {aggregates.drinks.length} tipos
                        </span>
                      </div>

                      <div className="mt-3 space-y-2">
                        {aggregates.drinks.length > 0 ? (
                          aggregates.drinks.map((drink, i) => (
                            <div
                              key={drink.name || i}
                              className="p-2.5 rounded-2xl bg-surface-raised border border-line flex items-center justify-between gap-2.5"
                            >
                              <p className="font-black text-xs sm:text-sm text-text-primary truncate">
                                {drink.name}
                              </p>

                              <div className="flex items-center gap-2 shrink-0">
                                <span className="w-8 h-8 rounded-xl bg-blue-600 text-white font-black text-xs flex items-center justify-center shadow-xs tabular-nums">
                                  {drink.totalQty}
                                </span>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="py-6 text-center text-text-muted text-xs font-bold">
                            Sin bebidas
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="pt-2.5 border-t border-line text-xs font-bold text-text-muted flex justify-between">
                      <span>Total:</span>
                      <span className="font-black text-text-primary tabular-nums">
                        {aggregates.totalDrinks} unidades
                      </span>
                    </div>
                  </section>
                )}

                {/* ─── 4. Extras y Dips ───────────────────────────────────────── */}
                {(stationFilter === 'all' || stationFilter === 'extras') && (
                  <section
                    id="section-extras"
                    aria-label="Estación de Extras y Dips"
                    className="p-4 rounded-3xl bg-surface-card border border-line shadow-card space-y-3 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between pb-2.5 border-b border-line">
                        <div className="flex items-center gap-1.5">
                          <Tag className="w-4 h-4 text-emerald-500 shrink-0" />
                          <h3 className="font-black text-sm text-text-primary tracking-tight">
                            Extras & Dips
                          </h3>
                        </div>
                        <span className="text-[11px] font-bold text-text-muted tabular-nums">
                          {aggregates.extras.length} tipos
                        </span>
                      </div>

                      <div className="mt-3 space-y-2">
                        {aggregates.extras.length > 0 ? (
                          aggregates.extras.map((extra, i) => (
                            <div
                              key={extra.name || i}
                              className="p-2.5 rounded-2xl bg-surface-raised border border-line flex items-center justify-between gap-2.5"
                            >
                              <p className="font-black text-xs sm:text-sm text-text-primary truncate">
                                {formatKitchenExtraLabel(extra)}
                              </p>

                              <div className="flex items-center gap-2 shrink-0">
                                <span className="w-8 h-8 rounded-xl bg-emerald-600 text-white font-black text-xs flex items-center justify-center shadow-xs tabular-nums">
                                  {extra.totalQty}
                                </span>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="py-6 text-center text-text-muted text-xs font-bold">
                            Sin extras
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="pt-2.5 border-t border-line text-xs font-bold text-text-muted flex justify-between">
                      <span>Total:</span>
                      <span className="font-black text-text-primary tabular-nums">
                        {aggregates.totalExtras} porciones
                      </span>
                    </div>
                  </section>
                )}
              </div>

              {/* ─── 🥗 Módulo 4: Modificaciones de Línea ────────────────────── */}
              <section
                id="section-modificaciones"
                aria-label="Modificaciones de Línea"
                className="p-4 sm:p-5 rounded-3xl bg-surface-card border border-line shadow-card space-y-3"
              >
                <div className="flex items-center justify-between pb-2.5 border-b border-line">
                  <div className="flex items-center gap-2">
                    <Layers className="w-5 h-5 text-red-500 shrink-0" />
                    <h2 className="font-black text-sm sm:text-base text-text-primary tracking-tight">
                      Modificaciones de Línea
                    </h2>
                  </div>
                  <Badge variant="outline" className="font-black text-xs border-line tabular-nums">
                    {aggregates.removedIngredients.length} ingredientes
                  </Badge>
                </div>

                <div className="space-y-3">
                  {aggregates.removedIngredients.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                      {aggregates.removedIngredients.map((rem) => (
                        <div
                          key={rem.name}
                          className="p-3 rounded-2xl bg-red-500/10 border border-red-500/25 space-y-1"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-black text-xs sm:text-sm text-red-700 dark:text-red-300 truncate">
                              {formatKitchenRemovalLabel(rem.name)}
                            </span>
                            <span className="px-2 py-0.5 rounded-lg bg-red-600 text-white font-black text-xs shrink-0 shadow-xs tabular-nums">
                              x{rem.count}
                            </span>
                          </div>
                          {rem.affectedBurgers && rem.affectedBurgers.length > 0 ? (
                            <p className="text-[10px] sm:text-[11px] font-bold text-red-700/80 dark:text-red-300/80 pl-0.5">
                              ↳ {rem.affectedBurgers.join(' · ')}
                            </p>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 dark:text-emerald-300 text-xs font-bold flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>100% Receta Original en todas las órdenes.</span>
                    </div>
                  )}
                </div>
              </section>
            </>
          ) : (
            /* ─── Vista de Insumos & Costeo D1 ──────────────────────────────── */
            <section
              id="section-d1"
              aria-label="Insumos y Gramajes D1"
              className="space-y-4 animate-in fade-in duration-200"
            >
              {summaryKData && summaryKData.ingredients && summaryKData.ingredients.length > 0 ? (
                <div className="p-4 sm:p-5 rounded-3xl bg-surface-card border border-line shadow-card space-y-3">
                  <div className="flex items-center justify-between pb-2.5 border-b border-line flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <Scale className="w-5 h-5 text-accent shrink-0" />
                      <h2 className="font-black text-sm sm:text-base text-text-primary tracking-tight">
                        Materia Prima (Cloudflare D1)
                      </h2>
                    </div>
                    {summaryKData.totals.estimatedCostCents ? (
                      <span className="font-black text-xs sm:text-sm text-emerald-600 dark:text-emerald-400 px-2.5 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/20 tabular-nums">
                        Costo Total: {formatCurrency(summaryKData.totals.estimatedCostCents / 100)}
                      </span>
                    ) : null}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                    {summaryKData.ingredients.map((ing) => (
                      <div
                        key={ing.ingredientId}
                        className="p-3 rounded-2xl bg-surface-raised border border-line flex items-center justify-between gap-3"
                      >
                        <div>
                          <p className="font-black text-xs sm:text-sm text-text-primary">{ing.name}</p>
                          <p className="text-[11px] text-text-muted font-semibold tabular-nums">
                            {ing.unitPriceCents !== null
                              ? `PU: ${formatCurrency(ing.unitPriceCents / 100)}`
                              : 'Sin precio'}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-black text-xs sm:text-sm text-accent tabular-nums">
                            {ing.quantity.toFixed(2)} {ing.unit}
                          </p>
                          {ing.estimatedCostCents !== null ? (
                            <p className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                              {formatCurrency(ing.estimatedCostCents / 100)}
                            </p>
                          ) : null}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="p-8 sm:p-12 rounded-3xl bg-surface-card border border-line shadow-card text-center space-y-3">
                  <div className="w-14 h-14 rounded-2xl bg-accent/15 text-accent flex items-center justify-center mx-auto shadow-xs">
                    <Scale className="w-7 h-7 text-accent" />
                  </div>
                  <div className="max-w-md mx-auto space-y-1">
                    <h3 className="font-black text-base text-text-primary">
                      Insumos y Gramajes en D1
                    </h3>
                    <p className="text-xs font-bold text-text-secondary">
                      Configura las recetas de insumos en el panel de Admin para ver costos y gramajes.
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setViewMode('production');
                      setActiveSection('torres');
                    }}
                    className="rounded-2xl border-line text-xs font-black cursor-pointer active:scale-[0.98]"
                  >
                    Volver a Producción
                  </Button>
                </div>
              )}
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
