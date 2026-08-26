/**
 * KitchenSummaryK.tsx — PR-V3-10
 *
 * Resumen K & Agregador de Insumos para Mise en Place y Producción de Cocina:
 * - Contador agregado en tiempo real de hamburguesas a producir por receta (OG, BBQ, Clásica, etc.)
 * - Contador consolidado de guarniciones (Papas Francesas, Aros de Cebolla, etc.)
 * - Resumen de extras totales para preparación de mise en place (Extra Tocino, Queso, etc.)
 * - Integración con backend Cloudflare D1 para costeo de insumos e inventario
 */

import React, { useMemo } from 'react';
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
  DollarSign,
} from 'lucide-react';
import { Badge } from '@ui/badge';
import { Button } from '@ui/button';
import { Skeleton } from '@ui/skeleton';
import {
  useKitchenDisplay,
  useKitchenSummaryKQuery,
  computeKitchenAggregates,
} from '../../features/kitchen';
import { extractOrderTargetDate } from '../shared/HorizontalDateCalendarFilter';
import type { OrderV2 } from '@config/index';

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
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

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
    error: summaryKError,
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

  const aggregates = useMemo(
    () => computeKitchenAggregates(filteredTickets),
    [filteredTickets]
  );

  const totalBurgers = aggregates.totalBurgers;
  const totalGuarniciones = aggregates.totalGarnishes;
  const combosDesglosados = aggregates.recipes
    .filter((r) => r.isComboChild)
    .reduce((acc, r) => acc + r.totalQty, 0);
  const sideQuestTotal = aggregates.totalGarnishes + aggregates.totalDrinks + aggregates.totalExtras;
  const porHacer =
    aggregates.recipes.reduce((acc, r) => acc + r.pendingQty, 0) +
    aggregates.garnishes.reduce((acc, g) => acc + g.pendingQty, 0);
  const hechas =
    aggregates.recipes.reduce((acc, r) => acc + r.readyQty, 0) +
    aggregates.garnishes.reduce((acc, g) => acc + g.readyQty, 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* ─── Encabezado de Control de Resumen K ────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-surface-card p-4 sm:p-5 rounded-3xl border border-line shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-accent/15 text-accent flex items-center justify-center font-black text-xl shrink-0">
            K
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-black tracking-tight text-text-primary flex items-center gap-2">
              <span>Resumen K — Agregador de Producción</span>
              <span className="px-2 py-0.5 rounded-lg bg-accent/15 text-accent text-[11px] font-black uppercase tracking-wider">
                Mise en Place
              </span>
            </h2>
            <p className="text-xs font-bold text-text-secondary">
              Cómputo en tiempo real de hamburguesas a armar, guarniciones y extras consolidados.
            </p>
          </div>
        </div>

        {/* Control de Refresco Rápido */}
        <div className="flex items-center gap-2.5 self-end sm:self-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefreshAll}
            disabled={isRefreshing}
            className="h-10 px-3.5 rounded-2xl border-line flex items-center gap-1.5 text-xs font-extrabold cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Refrescar</span>
          </Button>
        </div>
      </div>

      {/* ─── Tarjetas de Resumen KPI Estilo Producción ───────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {/* 1. Total Burgers */}
        <div className="p-4 rounded-3xl bg-surface-card border border-line shadow-card space-y-1">
          <span className="text-[11px] font-black uppercase tracking-wider text-text-muted">
            TOTAL BURGERS
          </span>
          <p className="text-3xl sm:text-4xl font-black text-text-primary">
            {isLoading ? <Skeleton className="h-9 w-12" /> : totalBurgers}
          </p>
        </div>

        {/* 2. Total Guarniciones */}
        <div className="p-4 rounded-3xl bg-surface-card border border-line shadow-card space-y-1">
          <span className="text-[11px] font-black uppercase tracking-wider text-text-muted">
            TOTAL GUARNICIONES
          </span>
          <p className="text-3xl sm:text-4xl font-black text-text-primary">
            {isLoading ? <Skeleton className="h-9 w-12" /> : totalGuarniciones}
          </p>
        </div>

        {/* 3. Combos Desglosados */}
        <div className="p-4 rounded-3xl bg-surface-card border border-line shadow-card space-y-1">
          <span className="text-[11px] font-black uppercase tracking-wider text-text-muted">
            COMBOS DESGLOSADOS
          </span>
          <p className="text-3xl sm:text-4xl font-black text-text-primary">
            {isLoading ? <Skeleton className="h-9 w-12" /> : combosDesglosados}
          </p>
        </div>

        {/* 4. Side Quest */}
        <div className="p-4 rounded-3xl bg-surface-card border border-line shadow-card space-y-1">
          <span className="text-[11px] font-black uppercase tracking-wider text-text-muted">
            SIDE QUEST
          </span>
          <p className="text-3xl sm:text-4xl font-black text-text-primary">
            {isLoading ? <Skeleton className="h-9 w-12" /> : sideQuestTotal}
          </p>
        </div>

        {/* 5. Por Hacer */}
        <div className="p-4 rounded-3xl bg-surface-card border border-line shadow-card space-y-1">
          <span className="text-[11px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-400">
            POR HACER
          </span>
          <p className="text-3xl sm:text-4xl font-black text-amber-600 dark:text-amber-400">
            {isLoading ? <Skeleton className="h-9 w-12" /> : porHacer}
          </p>
        </div>

        {/* 6. Hechas */}
        <div className="p-4 rounded-3xl bg-surface-card border border-line shadow-card space-y-1">
          <span className="text-[11px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
            HECHAS
          </span>
          <p className="text-3xl sm:text-4xl font-black text-emerald-600 dark:text-emerald-400">
            {isLoading ? <Skeleton className="h-9 w-12" /> : hechas}
          </p>
        </div>
      </div>


      {/* ─── Desglose de Producción ───────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ─── 1. Hamburguesas por Receta ─────────────────────────────────────── */}
        <div className="p-5 rounded-3xl bg-surface-card border border-line shadow-card space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-line">
              <div className="flex items-center gap-2">
                <span className="text-lg">🍔</span>
                <h3 className="font-black text-base text-text-primary tracking-tight">
                  Burgers por Receta
                </h3>
              </div>
              <span className="px-2.5 py-0.5 rounded-xl bg-accent/15 text-accent font-black text-xs">
                {aggregates.recipes.length} tipos
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
                      {rec.isComboChild ? (
                        <span className="text-[10px] font-extrabold text-text-muted uppercase tracking-wider">
                          De Combo
                        </span>
                      ) : null}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <div className="text-right text-xs">
                        <span className="font-bold text-amber-600 dark:text-amber-400">
                          {rec.pendingQty} en plancha
                        </span>
                        {rec.readyQty > 0 ? (
                          <span className="text-text-muted ml-1">
                            • {rec.readyQty} listas
                          </span>
                        ) : null}
                      </div>
                      <span className="w-9 h-9 rounded-xl bg-text-primary text-surface-card font-black text-sm flex items-center justify-center">
                        {rec.totalQty}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center text-text-muted text-xs font-bold">
                  Sin hamburguesas en la cola activa
                </div>
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-line text-xs font-bold text-text-muted flex justify-between">
            <span>Total a producir:</span>
            <span className="font-black text-text-primary">{aggregates.totalBurgers} unidades</span>
          </div>
        </div>

        {/* ─── 2. Guarniciones Consolidadas ─────────────────────────────────── */}
        <div className="p-5 rounded-3xl bg-surface-card border border-line shadow-card space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-line">
              <div className="flex items-center gap-2">
                <span className="text-lg">🍟</span>
                <h3 className="font-black text-base text-text-primary tracking-tight">
                  Guarniciones Totales
                </h3>
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
                          <span className="text-text-muted ml-1">
                            • {garnish.readyQty} listas
                          </span>
                        ) : null}
                      </div>
                      <span className="w-9 h-9 rounded-xl bg-amber-600 text-white font-black text-sm flex items-center justify-center">
                        {garnish.totalQty}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center text-text-muted text-xs font-bold">
                  Sin guarniciones en la cola activa
                </div>
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-line text-xs font-bold text-text-muted flex justify-between">
            <span>Total guarniciones:</span>
            <span className="font-black text-amber-600 dark:text-amber-400">
              {aggregates.totalGarnishes} porciones
            </span>
          </div>
        </div>

        {/* ─── 3. Extras Totales / Mise en Place ────────────────────────────── */}
        <div className="p-5 rounded-3xl bg-surface-card border border-line shadow-card space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-line">
              <div className="flex items-center gap-2">
                <span className="text-lg">🥓</span>
                <h3 className="font-black text-base text-text-primary tracking-tight">
                  Mise en Place (Extras)
                </h3>
              </div>
              <span className="px-2.5 py-0.5 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-black text-xs">
                {aggregates.extras.length} ítems
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

                    <span className="w-9 h-9 rounded-xl bg-emerald-600 text-white font-black text-sm flex items-center justify-center shrink-0">
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
            <span>Total extras a preparar:</span>
            <span className="font-black text-emerald-600 dark:text-emerald-400">
              {aggregates.totalExtras} porciones
            </span>
          </div>
        </div>
      </div>

      {/* ─── 4. Insumos e Ingredientes Estimados D1 ───────────────────────────── */}
      {summaryKData && summaryKData.ingredients && summaryKData.ingredients.length > 0 ? (
        <div className="p-5 sm:p-6 rounded-3xl bg-surface-card border border-line shadow-card space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-line">
            <div className="flex items-center gap-2">
              <Scale className="w-5 h-5 text-accent" />
              <h3 className="font-black text-base text-text-primary tracking-tight">
                Consumo de Insumos e Ingredientes (Base D1)
              </h3>
            </div>
            {summaryKData.totals.estimatedCostCents ? (
              <span className="font-black text-sm text-emerald-600 dark:text-emerald-400">
                Costo Total: {formatCurrency(summaryKData.totals.estimatedCostCents / 100)}
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
      ) : summaryKData && !summaryKData.hasRecipes ? (
        <div className="p-4 rounded-3xl bg-amber-500/10 border border-amber-500/30 flex items-center gap-3 text-amber-800 dark:text-amber-200 text-xs font-bold">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
          <span>
            Aún no se han configurado recetas de insumos en Chekeo para desglosar gramos y piezas brutas. El conteo de recetas y extras opera reactivamente en vivo.
          </span>
        </div>
      ) : null}
    </div>
  );
}
