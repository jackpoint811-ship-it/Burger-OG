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

import React, { useState, useMemo } from 'react';
import {
  Flame,
  Utensils,
  Layers,
  Sparkles,
  RefreshCw,
  Calendar,
  AlertCircle,
  TrendingUp,
  PackageCheck,
  ChefHat,
  Scale,
  Building2,
  CheckCircle2,
  FileText,
  Wine,
  Tag,
  Boxes,
} from 'lucide-react';
import { Badge } from '@ui/badge';
import { Button } from '@ui/button';
import { Skeleton } from '@ui/skeleton';
import {
  useKitchenDisplay,
  useKitchenSummaryKQuery,
  computeKitchenAggregates,
  type AggregatedMiseEnPlace,
} from '../../features/kitchen';
import { extractOrderTargetDate } from '../shared/HorizontalDateCalendarFilter';
import type { OrderV2 } from '@config/index';
import { getCdmxTodayString, formatCdmxDateString } from '@config/index';

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

export function KitchenSummaryK({ selectedDate = 'today' }: KitchenSummaryKProps) {
  const [viewMode, setViewMode] = useState<'production' | 'd1Ingredients'>('production');
  const [stationFilter, setStationFilter] = useState<'all' | 'prep' | 'sideQuest' | 'drinks' | 'extras'>('all');

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

  const dateLabel = useMemo(() => {
    if (selectedDate === 'today') return `Hoy (${formatCdmxDateString(todayStr)})`;
    if (selectedDate === 'all') return 'Todos los Pedidos Activos';
    if (selectedDate === 'past') return 'Pedidos Anteriores';
    return formatCdmxDateString(selectedDate);
  }, [selectedDate, todayStr]);

  const porHacer =
    aggregates.recipes.reduce((acc, r) => acc + r.pendingQty, 0) +
    aggregates.garnishes.reduce((acc, g) => acc + g.pendingQty, 0);

  const hechas =
    aggregates.recipes.reduce((acc, r) => acc + r.readyQty, 0) +
    aggregates.garnishes.reduce((acc, g) => acc + g.readyQty, 0);

  const originalPercent =
    aggregates.totalBurgers > 0
      ? Math.round((aggregates.originalRecipeCount / aggregates.totalBurgers) * 100)
      : 100;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* ─── Encabezado Principal & Selector de Modo ──────────────────────────── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-surface-card p-4 sm:p-5 rounded-3xl border border-line shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-accent/15 text-accent flex items-center justify-center font-black text-xl shrink-0">
            <ChefHat className="w-6 h-6 text-accent" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg sm:text-xl font-black tracking-tight text-text-primary">
                Resumen K — Mise en Place & Restock
              </h2>
              <span className="px-2.5 py-0.5 rounded-lg bg-accent/15 text-accent text-[11px] font-black uppercase tracking-wider">
                Control de Insumos
              </span>
            </div>
            <p className="text-xs font-bold text-text-secondary mt-0.5">
              {dateLabel} · Unificación canónica por receta física, precocción de sides y checklist de restock.
            </p>
          </div>
        </div>

        {/* Controles: Selector de Modo y Refresco */}
        <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap self-end lg:self-auto">
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
              onClick={() => setViewMode('production')}
              className={`min-h-[36px] px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer select-none ${
                viewMode === 'production'
                  ? 'bg-text-primary text-surface-card shadow-xs'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              📊 Producción & Restock
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={viewMode === 'd1Ingredients'}
              onClick={() => setViewMode('d1Ingredients')}
              className={`min-h-[36px] px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer select-none ${
                viewMode === 'd1Ingredients'
                  ? 'bg-text-primary text-surface-card shadow-xs'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              ⚖️ Insumos D1
            </button>
          </div>

          {/* Control de Refresco Rápido */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefreshAll}
            disabled={isRefreshing}
            className="min-h-[44px] px-3.5 rounded-2xl border-line flex items-center gap-1.5 text-xs font-black cursor-pointer hover:bg-surface-raised"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refrescar</span>
          </Button>
        </div>
      </div>

      {viewMode === 'production' ? (
        <>
          {/* ─── 📦 Módulo 1: Checklist de Insumos Físicos & Control de Restock ──── */}
          <div className="p-5 sm:p-6 rounded-3xl bg-surface-card border-2 border-line shadow-card space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-line">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-accent text-white flex items-center justify-center font-black shrink-0 shadow-xs">
                  <Boxes className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-base text-text-primary tracking-tight">
                    📦 Checklist de Insumos Físicos & Control de Restock
                  </h3>
                  <p className="text-xs font-bold text-text-muted">
                    Existencias mínimas a tener listas antes de abrir el servicio. Si tienes menos, ¡haz restock!
                  </p>
                </div>
              </div>

              {/* Ratio de Receta Original */}
              <div className="flex items-center gap-3 bg-surface-raised px-3.5 py-1.5 rounded-2xl border border-line self-start sm:self-auto">
                <span className="text-[11px] font-black text-emerald-600 dark:text-emerald-400">
                  {aggregates.originalRecipeCount} Original
                </span>
                <span className="text-text-muted">·</span>
                <span className="text-[11px] font-black text-amber-600 dark:text-amber-400">
                  {aggregates.customizedRecipeCount} Modificadas
                </span>
                <div className="w-20 h-2 bg-surface-card rounded-full overflow-hidden flex border border-line">
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
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
              {/* 1. Patties */}
              <div className="p-3.5 rounded-2xl bg-surface-raised border border-line space-y-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-text-muted flex items-center gap-1">
                  <span>🥩</span>
                  <span>PATTIES</span>
                </span>
                <p className="text-2xl sm:text-3xl font-black text-text-primary">
                  {isLoading ? <Skeleton className="h-8 w-12" /> : aggregates.suppliesChecklist.patties}
                </p>
                <p className="text-[10px] font-bold text-text-muted leading-tight">
                  Bolitas a pesar/descongelar
                </p>
              </div>

              {/* 2. Bollos de Pan */}
              <div className="p-3.5 rounded-2xl bg-surface-raised border border-line space-y-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-text-muted flex items-center gap-1">
                  <span>🍞</span>
                  <span>BOLLOS PAN</span>
                </span>
                <p className="text-2xl sm:text-3xl font-black text-text-primary">
                  {isLoading ? <Skeleton className="h-8 w-12" /> : aggregates.suppliesChecklist.buns}
                </p>
                <p className="text-[10px] font-bold text-text-muted leading-tight">
                  Piezas de pan a tostar
                </p>
              </div>

              {/* 3. Queso Americano */}
              <div className="p-3.5 rounded-2xl bg-surface-raised border border-line space-y-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1">
                  <span>🧀</span>
                  <span>QUESO AMER.</span>
                </span>
                <p className="text-2xl sm:text-3xl font-black text-amber-600 dark:text-amber-400">
                  {isLoading ? <Skeleton className="h-8 w-12" /> : aggregates.suppliesChecklist.cheeseSlices}
                </p>
                <p className="text-[10px] font-bold text-text-muted leading-tight">
                  Rebanadas necesarias
                </p>
              </div>

              {/* 4. Tocino */}
              <div className="p-3.5 rounded-2xl bg-surface-raised border border-line space-y-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-rose-600 dark:text-rose-400 flex items-center gap-1">
                  <span>🥓</span>
                  <span>TOCINO</span>
                </span>
                <p className="text-2xl sm:text-3xl font-black text-rose-600 dark:text-rose-400">
                  {isLoading ? <Skeleton className="h-8 w-12" /> : aggregates.suppliesChecklist.baconPortions}
                </p>
                <p className="text-[10px] font-bold text-text-muted leading-tight">
                  Porciones a dorar
                </p>
              </div>

              {/* 5. Guarniciones / Papas */}
              <div className="p-3.5 rounded-2xl bg-surface-raised border border-line space-y-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1">
                  <span>🍟</span>
                  <span>SIDES TOTAL</span>
                </span>
                <p className="text-2xl sm:text-3xl font-black text-amber-600 dark:text-amber-400">
                  {isLoading ? <Skeleton className="h-8 w-12" /> : aggregates.suppliesChecklist.garnishPortions}
                </p>
                <p className="text-[10px] font-bold text-text-muted leading-tight">
                  Porciones a pesar/precocer
                </p>
              </div>

              {/* 6. Bebidas Frías */}
              <div className="p-3.5 rounded-2xl bg-surface-raised border border-line space-y-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-blue-600 dark:text-blue-400 flex items-center gap-1">
                  <span>🥤</span>
                  <span>BEBIDAS</span>
                </span>
                <p className="text-2xl sm:text-3xl font-black text-blue-600 dark:text-blue-400">
                  {isLoading ? <Skeleton className="h-8 w-12" /> : aggregates.suppliesChecklist.coldDrinks}
                </p>
                <p className="text-[10px] font-bold text-text-muted leading-tight">
                  Latas a refrigerar
                </p>
              </div>

              {/* 7. Dips & Extras */}
              <div className="p-3.5 rounded-2xl bg-surface-raised border border-line space-y-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <span>🥫</span>
                  <span>DIPS / SALSAS</span>
                </span>
                <p className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400">
                  {isLoading ? <Skeleton className="h-8 w-12" /> : aggregates.suppliesChecklist.dipPortions}
                </p>
                <p className="text-[10px] font-bold text-text-muted leading-tight">
                  Vasitos a porcionar
                </p>
              </div>
            </div>
          </div>

          {/* ─── 🎛️ Filtros Rápidos Tipo Chip por Estación ──────────────────────── */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            <span className="text-xs font-black uppercase tracking-wider text-text-muted shrink-0 mr-1">
              Ver Estación:
            </span>
            <button
              type="button"
              onClick={() => setStationFilter('all')}
              className={`px-3 py-1.5 rounded-2xl text-xs font-black transition-all cursor-pointer shrink-0 border select-none ${
                stationFilter === 'all'
                  ? 'bg-text-primary text-surface-card border-text-primary shadow-xs'
                  : 'bg-surface-card border-line text-text-secondary hover:text-text-primary'
              }`}
            >
              🌐 Todas ({aggregates.totalBurgers + aggregates.totalGarnishes + aggregates.totalDrinks + aggregates.totalExtras})
            </button>
            <button
              type="button"
              onClick={() => setStationFilter('prep')}
              className={`px-3 py-1.5 rounded-2xl text-xs font-black transition-all cursor-pointer shrink-0 border select-none ${
                stationFilter === 'prep'
                  ? 'bg-text-primary text-surface-card border-text-primary shadow-xs'
                  : 'bg-surface-card border-line text-text-secondary hover:text-text-primary'
              }`}
            >
              🍔 Plancha ({aggregates.totalBurgers})
            </button>
            <button
              type="button"
              onClick={() => setStationFilter('sideQuest')}
              className={`px-3 py-1.5 rounded-2xl text-xs font-black transition-all cursor-pointer shrink-0 border select-none ${
                stationFilter === 'sideQuest'
                  ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                  : 'bg-surface-card border-line text-text-secondary hover:text-text-primary'
              }`}
            >
              🍟 Freidora / Sides ({aggregates.totalGarnishes})
            </button>
            <button
              type="button"
              onClick={() => setStationFilter('drinks')}
              className={`px-3 py-1.5 rounded-2xl text-xs font-black transition-all cursor-pointer shrink-0 border select-none ${
                stationFilter === 'drinks'
                  ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                  : 'bg-surface-card border-line text-text-secondary hover:text-text-primary'
              }`}
            >
              🥤 Bebidas ({aggregates.totalDrinks})
            </button>
            <button
              type="button"
              onClick={() => setStationFilter('extras')}
              className={`px-3 py-1.5 rounded-2xl text-xs font-black transition-all cursor-pointer shrink-0 border select-none ${
                stationFilter === 'extras'
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                  : 'bg-surface-card border-line text-text-secondary hover:text-text-primary'
              }`}
            >
              🥫 Extras & Dips ({aggregates.totalExtras})
            </button>
          </div>

          {/* ─── 4 Estaciones de Producción en Paralelo (o Filtradas) ─────────── */}
          <div
            className={`grid gap-4 sm:gap-5 ${
              stationFilter === 'all'
                ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'
                : 'grid-cols-1'
            }`}
          >
            {/* ─── 1. Plancha (Burgers por Receta Canónica) ───────────────────── */}
            {(stationFilter === 'all' || stationFilter === 'prep') && (
              <div className="p-5 rounded-3xl bg-surface-card border-2 border-line shadow-card space-y-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-line">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">🍔</span>
                      <div>
                        <h3 className="font-black text-base text-text-primary tracking-tight">
                          Plancha (Burgers)
                        </h3>
                        <p className="text-[11px] font-bold text-text-muted">
                          {aggregates.totalPatties} patties · {aggregates.totalBuns} panes
                        </p>
                      </div>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-xl bg-accent/15 text-accent font-black text-xs">
                      {aggregates.recipes.length} recetas
                    </span>
                  </div>

                  <div className="mt-3.5 space-y-2.5">
                    {aggregates.recipes.length > 0 ? (
                      aggregates.recipes.map((rec, i) => (
                        <div
                          key={rec.name || i}
                          className="p-3 rounded-2xl bg-surface-raised border border-line flex items-center justify-between gap-3"
                        >
                          <div className="min-w-0">
                            <p className="font-black text-sm text-text-primary truncate">
                              {rec.name}
                            </p>
                            <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                              {rec.comboQty > 0 && rec.individualQty > 0 ? (
                                <span className="text-[10px] font-extrabold text-text-muted">
                                  {rec.individualQty} indiv · {rec.comboQty} combo
                                </span>
                              ) : rec.comboQty > 0 ? (
                                <span className="text-[10px] font-extrabold text-text-muted">
                                  En combo
                                </span>
                              ) : (
                                <span className="text-[10px] font-extrabold text-text-muted">
                                  Individual
                                </span>
                              )}
                              {rec.pattiesCount > 1 ? (
                                <span className="px-1.5 py-0.2 rounded bg-amber-500/15 text-amber-700 dark:text-amber-300 text-[9px] font-black">
                                  {rec.pattiesCount} patties
                                </span>
                              ) : null}
                              {rec.extraPattiesCount > 0 ? (
                                <span className="px-1.5 py-0.2 rounded bg-rose-500/15 text-rose-700 dark:text-rose-300 text-[9px] font-black">
                                  +{rec.extraPattiesCount} extra carne
                                </span>
                              ) : null}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <div className="text-right text-xs">
                              <span className="font-bold text-amber-600 dark:text-amber-400">
                                {rec.pendingQty} pendientes
                              </span>
                              {rec.readyQty > 0 ? (
                                <span className="text-emerald-600 dark:text-emerald-400 block text-[11px]">
                                  {rec.readyQty} listas
                                </span>
                              ) : null}
                            </div>
                            <span className="w-9 h-9 rounded-xl bg-text-primary text-surface-card font-black text-sm flex items-center justify-center shadow-xs">
                              {rec.totalQty}
                            </span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="py-8 text-center text-text-muted text-xs font-bold">
                        Sin hamburguesas activas
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-3 border-t border-line text-xs font-bold text-text-muted flex justify-between">
                  <span>Total a cocinar:</span>
                  <span className="font-black text-text-primary">{aggregates.totalBurgers} unidades</span>
                </div>
              </div>
            )}

            {/* ─── 2. Freidora (Precocción & Pesaje de Side Quests) ─────────────── */}
            {(stationFilter === 'all' || stationFilter === 'sideQuest') && (
              <div className="p-5 rounded-3xl bg-surface-card border-2 border-line shadow-card space-y-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-line">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">🍟</span>
                      <div>
                        <h3 className="font-black text-base text-text-primary tracking-tight">
                          Freidora (Side Quests)
                        </h3>
                        <p className="text-[11px] font-bold text-text-muted">
                          Pesaje & Precocción de papas y aros
                        </p>
                      </div>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 font-black text-xs">
                      {aggregates.garnishes.length} tipos
                    </span>
                  </div>

                  <div className="mt-3.5 space-y-2.5">
                    {aggregates.garnishes.length > 0 ? (
                      aggregates.garnishes.map((garnish, i) => (
                        <div
                          key={garnish.name || i}
                          className="p-3 rounded-2xl bg-surface-raised border border-line flex items-center justify-between gap-3"
                        >
                          <p className="font-black text-sm text-text-primary truncate">
                            {garnish.name}
                          </p>

                          <div className="flex items-center gap-2 shrink-0">
                            <div className="text-right text-xs">
                              <span className="font-bold text-amber-600 dark:text-amber-400">
                                {garnish.pendingQty} por freír
                              </span>
                              {garnish.readyQty > 0 ? (
                                <span className="text-emerald-600 dark:text-emerald-400 block text-[11px]">
                                  {garnish.readyQty} listas
                                </span>
                              ) : null}
                            </div>
                            <span className="w-9 h-9 rounded-xl bg-amber-600 text-white font-black text-sm flex items-center justify-center shadow-xs">
                              {garnish.totalQty}
                            </span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="py-8 text-center text-text-muted text-xs font-bold">
                        Sin guarniciones activas
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-3 border-t border-line text-xs font-bold text-text-muted flex justify-between">
                  <span>Total porciones a pesar:</span>
                  <span className="font-black text-amber-600 dark:text-amber-400">
                    {aggregates.totalGarnishes} porciones
                  </span>
                </div>
              </div>
            )}

            {/* ─── 3. Bebidas & Fríos ─────────────────────────────────────────── */}
            {(stationFilter === 'all' || stationFilter === 'drinks') && (
              <div className="p-5 rounded-3xl bg-surface-card border-2 border-line shadow-card space-y-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-line">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">🥤</span>
                      <div>
                        <h3 className="font-black text-base text-text-primary tracking-tight">
                          Bebidas & Fríos
                        </h3>
                        <p className="text-[11px] font-bold text-text-muted">
                          Latas a enfriar para el turno
                        </p>
                      </div>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-xl bg-blue-500/15 text-blue-600 dark:text-blue-400 font-black text-xs">
                      {aggregates.drinks.length} marcas
                    </span>
                  </div>

                  <div className="mt-3.5 space-y-2.5">
                    {aggregates.drinks.length > 0 ? (
                      aggregates.drinks.map((drink, i) => (
                        <div
                          key={drink.name || i}
                          className="p-3 rounded-2xl bg-surface-raised border border-line flex items-center justify-between gap-3"
                        >
                          <p className="font-black text-sm text-text-primary truncate">
                            {drink.name}
                          </p>

                          <span className="w-9 h-9 rounded-xl bg-blue-600 text-white font-black text-sm flex items-center justify-center shrink-0 shadow-xs">
                            {drink.totalQty}
                          </span>
                        </div>
                      ))
                    ) : (
                      <div className="py-8 text-center text-text-muted text-xs font-bold">
                        Sin bebidas registradas
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-3 border-t border-line text-xs font-bold text-text-muted flex justify-between">
                  <span>Total latas/piezas:</span>
                  <span className="font-black text-blue-600 dark:text-blue-400">
                    {aggregates.totalDrinks} piezas
                  </span>
                </div>
              </div>
            )}

            {/* ─── 4. Extras & Dips ───────────────────────────────────────────── */}
            {(stationFilter === 'all' || stationFilter === 'extras') && (
              <div className="p-5 rounded-3xl bg-surface-card border-2 border-line shadow-card space-y-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-line">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">🥫</span>
                      <div>
                        <h3 className="font-black text-base text-text-primary tracking-tight">
                          Extras & Dips
                        </h3>
                        <p className="text-[11px] font-bold text-text-muted">
                          Porciones adicionales y aderezos
                        </p>
                      </div>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-black text-xs">
                      {aggregates.extras.length} extras
                    </span>
                  </div>

                  <div className="mt-3.5 space-y-2.5">
                    {aggregates.extras.length > 0 ? (
                      aggregates.extras.map((extra, i) => (
                        <div
                          key={extra.name || i}
                          className="p-3 rounded-2xl bg-surface-raised border border-line flex items-center justify-between gap-3"
                        >
                          <span className="font-black text-sm text-text-primary truncate">
                            +{extra.name}
                          </span>

                          <span className="w-9 h-9 rounded-xl bg-emerald-600 text-white font-black text-sm flex items-center justify-center shrink-0 shadow-xs">
                            {extra.totalQty}
                          </span>
                        </div>
                      ))
                    ) : (
                      <div className="py-8 text-center text-text-muted text-xs font-bold">
                        Sin extras solicitados
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-3 border-t border-line text-xs font-bold text-text-muted flex justify-between">
                  <span>Total extras:</span>
                  <span className="font-black text-emerald-600 dark:text-emerald-400">
                    {aggregates.totalExtras} porciones
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* ─── Modificaciones de Línea & Logística por Torre ────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Panel de Modificaciones Acumuladas */}
            <div className="p-5 sm:p-6 rounded-3xl bg-surface-card border-2 border-line shadow-card space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-line">
                <div className="flex items-center gap-2">
                  <span className="text-xl">🥗</span>
                  <div>
                    <h3 className="font-black text-base text-text-primary tracking-tight">
                      Mise en Place de Modificaciones (Línea de Armado)
                    </h3>
                    <p className="text-xs font-bold text-text-muted">
                      Ingredientes a omitir en el ensamblaje con desglose de hamburguesas afectadas.
                    </p>
                  </div>
                </div>
                <Badge variant="outline" className="font-black text-xs border-line">
                  {aggregates.removedIngredients.length} ingredientes afectados
                </Badge>
              </div>

              <div className="space-y-3">
                {aggregates.removedIngredients.length > 0 ? (
                  <div className="grid grid-cols-1 gap-2.5">
                    {aggregates.removedIngredients.map((rem) => (
                      <div
                        key={rem.name}
                        className="p-3.5 rounded-2xl bg-red-500/10 border border-red-500/25 space-y-1.5"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-black text-sm text-red-700 dark:text-red-300 truncate">
                            🔴 SIN {rem.name.toUpperCase()}
                          </span>
                          <span className="px-2.5 py-1 rounded-xl bg-red-600 text-white font-black text-xs shrink-0 shadow-xs">
                            x{rem.count}
                          </span>
                        </div>
                        {rem.affectedBurgers && rem.affectedBurgers.length > 0 ? (
                          <p className="text-[11px] font-extrabold text-red-700/80 dark:text-red-300/80 pl-1">
                            ↳ {rem.affectedBurgers.join(' · ')}
                          </p>
                        ) : null}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 dark:text-emerald-300 text-xs font-bold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Todas las hamburguesas activas van con Receta Original al 100%.</span>
                  </div>
                )}
              </div>
            </div>

            {/* Panel de Desglose Logístico por Torre */}
            <div className="p-5 sm:p-6 rounded-3xl bg-surface-card border-2 border-line shadow-card space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-line">
                <div className="flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-accent" />
                  <div>
                    <h3 className="font-black text-base text-text-primary tracking-tight">
                      Desglose Logístico de Empaque por Torre
                    </h3>
                    <p className="text-xs font-bold text-text-muted">
                      Distribución de pedidos para entrega y armado de bolsas.
                    </p>
                  </div>
                </div>
                <Badge variant="outline" className="font-black text-xs border-line">
                  {aggregates.activeOrdersCount} pedidos totales
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
                      className="p-4 rounded-2xl bg-surface-raised border border-line space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-black text-sm text-text-primary flex items-center gap-1.5">
                          <span>🏢</span>
                          <span>{tower.location}</span>
                        </span>
                        <span className="px-2 py-0.5 rounded-lg bg-text-primary text-surface-card text-xs font-black">
                          {tower.totalOrders} pedidos
                        </span>
                      </div>

                      {/* Métricas de Productos por Torre */}
                      <div className="grid grid-cols-3 gap-1.5 text-center text-xs">
                        <div className="p-1.5 rounded-xl bg-surface-card border border-line">
                          <span className="text-[10px] font-extrabold text-text-muted block">
                            BURGERS
                          </span>
                          <span className="font-black text-text-primary">
                            {tower.totalBurgers}
                          </span>
                        </div>
                        <div className="p-1.5 rounded-xl bg-surface-card border border-line">
                          <span className="text-[10px] font-extrabold text-text-muted block">
                            SIDES
                          </span>
                          <span className="font-black text-amber-600 dark:text-amber-400">
                            {tower.totalGarnishes}
                          </span>
                        </div>
                        <div className="p-1.5 rounded-xl bg-surface-card border border-line">
                          <span className="text-[10px] font-extrabold text-text-muted block">
                            BEBIDAS
                          </span>
                          <span className="font-black text-blue-600 dark:text-blue-400">
                            {tower.totalDrinks}
                          </span>
                        </div>
                      </div>

                      {/* Barra de Avance de Torre */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-[11px] font-bold text-text-muted">
                          <span>Avance de empaque:</span>
                          <span className="font-black text-text-primary">
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
            </div>
          </div>
        </>
      ) : (
        /* ─── Vista de Insumos & Costeo D1 ────────────────────────────────────── */
        <div className="space-y-6 animate-in fade-in duration-200">
          {summaryKData && summaryKData.ingredients && summaryKData.ingredients.length > 0 ? (
            <div className="p-5 sm:p-6 rounded-3xl bg-surface-card border-2 border-line shadow-card space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-line flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <Scale className="w-5 h-5 text-accent" />
                  <div>
                    <h3 className="font-black text-base text-text-primary tracking-tight">
                      Consumo de Insumos e Ingredientes (Base Cloudflare D1)
                    </h3>
                    <p className="text-xs font-bold text-text-muted">
                      Desglose de materia prima en gramos, litros y piezas calculado por recetas.
                    </p>
                  </div>
                </div>
                {summaryKData.totals.estimatedCostCents ? (
                  <span className="font-black text-sm text-emerald-600 dark:text-emerald-400 px-3 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                    Costo Total Estimado: {formatCurrency(summaryKData.totals.estimatedCostCents / 100)}
                  </span>
                ) : null}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {summaryKData.ingredients.map((ing) => (
                  <div
                    key={ing.ingredientId}
                    className="p-3.5 rounded-2xl bg-surface-raised border border-line flex items-center justify-between gap-3"
                  >
                    <div>
                      <p className="font-black text-sm text-text-primary">{ing.name}</p>
                      <p className="text-xs text-text-muted font-semibold">
                        {ing.unitPriceCents !== null
                          ? `PU: ${formatCurrency(ing.unitPriceCents / 100)}`
                          : 'Sin precio configurado'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-black text-sm text-accent">
                        {ing.quantity.toFixed(2)} {ing.unit}
                      </p>
                      {ing.estimatedCostCents !== null ? (
                        <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                          {formatCurrency(ing.estimatedCostCents / 100)}
                        </p>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="p-8 sm:p-12 rounded-3xl bg-surface-card border-2 border-line shadow-card text-center space-y-4">
              <div className="w-16 h-16 rounded-3xl bg-accent/15 text-accent flex items-center justify-center mx-auto">
                <Scale className="w-8 h-8 text-accent" />
              </div>
              <div className="max-w-md mx-auto space-y-1.5">
                <h4 className="font-black text-base text-text-primary">
                  Insumos y Gramajes en D1
                </h4>
                <p className="text-xs font-bold text-text-secondary leading-relaxed">
                  Para ver el desglose en gramos de carne, piezas de queso o costo de mermas, configura las recetas de insumos en el panel de Administración de Chekeo.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setViewMode('production')}
                className="rounded-2xl border-line text-xs font-black cursor-pointer"
              >
                Volver a Producción en Vivo
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
