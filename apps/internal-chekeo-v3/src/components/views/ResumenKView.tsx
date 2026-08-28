/**
 * ResumenKView.tsx — Chekeo V3
 *
 * Pantalla Principal (HOME / Tab 1) de Chekeo V3:
 * - Centro de comando de turno y Mise en Place operativo.
 * - Barra ejecutiva de 4 KPIs reactiva a la fecha seleccionada con navegación cruzada (Cocina, Pagos, Pedidos).
 * - Riel Horizontal de Fechas unificado con Zona Horaria Oficial CDMX.
 * - Mise en Place completo: Desglose Logístico por Torres, 7 Insumos Clave & Restock, 4 Estaciones en Paralelo, Modificaciones y Modo D1.
 */

import React, { useState, useMemo } from 'react';
import {
  Flame,
  CreditCard,
  ShoppingBag,
  DollarSign,
  ArrowRight,
  ClipboardList,
} from 'lucide-react';
import { useChekeoOrdersQuery } from '../../features/orders';
import {
  useKitchenDisplay,
  extractKitchenTicketItems,
} from '../../features/kitchen';
import { KitchenSummaryK } from '../kitchen';
import {
  HorizontalDateCalendarFilter,
  extractOrderTargetDate,
} from '../shared/HorizontalDateCalendarFilter';
import type { ChekeoTab } from '../shell';
import { getCdmxTodayString, formatCdmxDateString } from '@config/index';

interface ResumenKViewProps {
  onTabChange: (tab: ChekeoTab) => void;
}

export function ResumenKView({ onTabChange }: ResumenKViewProps) {
  const [selectedDate, setSelectedDate] = useState<string>('today');

  const { orders } = useChekeoOrdersQuery({
    includeTerminal: false,
    autoRefresh: true,
    refetchIntervalMs: 15000,
  });

  // Fecha de hoy en formato YYYY-MM-DD (Zona Horaria Oficial CDMX)
  const todayStr = useMemo(() => getCdmxTodayString(), []);

  // Filtrar pedidos por la fecha seleccionada en el calendario
  const periodOrders = useMemo(() => {
    return orders.filter((order) => {
      if (selectedDate === 'all') return true;
      const targetDate = extractOrderTargetDate(order, todayStr);
      if (selectedDate === 'today') return targetDate === todayStr;
      if (selectedDate === 'past') return targetDate < todayStr;
      return targetDate === selectedDate;
    });
  }, [orders, selectedDate, todayStr]);

  // Métricas ejecutivas calculadas reactivamente según el período seleccionado
  const metrics = useMemo(() => {
    const activeOrders = periodOrders.filter(
      (o) => o.status !== 'delivered' && o.status !== 'cancelled'
    );
    const pendingPayments = activeOrders.filter((o) => o.paymentStatus === 'pending');
    const prepOrders = activeOrders.filter(
      (o) => o.status === 'new' || o.status === 'preparing'
    );
    const readyOrders = activeOrders.filter((o) => o.status === 'ready');

    // Total de venta en pesos para el período (excluyendo cancelados)
    const validPeriodOrders = periodOrders.filter((o) => o.status !== 'cancelled');
    const totalSalesPesos = validPeriodOrders.reduce((acc, o) => acc + (o.total ?? 0), 0);

    // Contar hamburguesas activas por preparar en el período
    const { totalBurgersCount } = extractKitchenTicketItems(
      prepOrders.flatMap((o) => o.items || [])
    );

    return {
      activeCount: activeOrders.length,
      pendingPaymentsCount: pendingPayments.length,
      prepCount: prepOrders.length,
      readyCount: readyOrders.length,
      totalSalesPesos,
      periodOrdersCount: validPeriodOrders.length,
      totalBurgersToPrep: totalBurgersCount,
    };
  }, [periodOrders]);

  // Etiqueta legible de la fecha seleccionada
  const dateLabel = useMemo(() => {
    if (selectedDate === 'today') return `Hoy (${formatCdmxDateString(todayStr)})`;
    if (selectedDate === 'all') return 'Todos los Pedidos Activos';
    if (selectedDate === 'past') return 'Pedidos Anteriores';
    return formatCdmxDateString(selectedDate);
  }, [selectedDate, todayStr]);

  return (
    <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-200">
      {/* ─── Hero Header: Resumen de Turno Slop-Free ─────────────────────────── */}
      <div className="bg-surface-card p-4 sm:p-5 rounded-3xl border border-line shadow-card space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-accent/15 text-accent flex items-center justify-center font-black shrink-0 shadow-xs">
              <ClipboardList className="w-5 h-5 text-accent" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-black text-text-primary tracking-tight">
                  Resumen K
                </h1>
                <span className="px-2.5 py-0.5 rounded-lg bg-surface-raised border border-line text-xs font-bold text-text-secondary">
                  {dateLabel}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-surface-raised border border-line text-xs font-bold text-text-primary select-none">
              <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
              <span>D1 En Vivo</span>
            </span>
          </div>
        </div>

        {/* ─── Cuadrícula de Semáforo (4 Métricas Clave Reactivas) ───────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
          {/* 1. Cocina Activa */}
          <button
            type="button"
            onClick={() => onTabChange('cocina')}
            className="group flex flex-col justify-between p-3.5 rounded-2xl bg-surface-raised border border-line hover:border-accent/50 hover:bg-accent-soft/30 active:scale-[0.98] transition-all text-left cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent min-h-[96px]"
            aria-label={`Cocina activa: ${metrics.prepCount} pedidos, ${metrics.totalBurgersToPrep} burgers. Abrir Cocina.`}
          >
            <div className="flex items-center justify-between w-full">
              <span className="text-xs font-black text-text-secondary group-hover:text-accent transition-colors flex items-center gap-1.5">
                <Flame className="w-4 h-4 text-amber-500 shrink-0" />
                <span>Cocina Activa</span>
              </span>
              <ArrowRight className="w-3.5 h-3.5 text-text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <p className="text-2xl sm:text-3xl font-black text-text-primary my-1 tabular-nums">
              {metrics.prepCount}
            </p>
            <p className="text-[11px] font-bold text-text-muted tabular-nums">
              {metrics.totalBurgersToPrep} burgers
            </p>
          </button>

          {/* 2. Pagos Pendientes */}
          <button
            type="button"
            onClick={() => onTabChange('pagos')}
            className="group flex flex-col justify-between p-3.5 rounded-2xl bg-surface-raised border border-line hover:border-amber-500/50 hover:bg-amber-500/5 active:scale-[0.98] transition-all text-left cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent min-h-[96px]"
            aria-label={`Por cobrar: ${metrics.pendingPaymentsCount} cobros pendientes. Abrir Pagos.`}
          >
            <div className="flex items-center justify-between w-full">
              <span className="text-xs font-black text-text-secondary group-hover:text-amber-500 transition-colors flex items-center gap-1.5">
                <CreditCard className="w-4 h-4 text-amber-500 shrink-0" />
                <span>Por Cobrar</span>
              </span>
              <ArrowRight className="w-3.5 h-3.5 text-text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <p className="text-2xl sm:text-3xl font-black text-text-primary my-1 tabular-nums">
              {metrics.pendingPaymentsCount}
            </p>
            <p className="text-[11px] font-bold text-text-muted tabular-nums">
              {metrics.pendingPaymentsCount === 1 ? '1 pendiente' : `${metrics.pendingPaymentsCount} pendientes`}
            </p>
          </button>

          {/* 3. Pedidos Activos */}
          <button
            type="button"
            onClick={() => onTabChange('pedidos')}
            className="group flex flex-col justify-between p-3.5 rounded-2xl bg-surface-raised border border-line hover:border-accent/50 hover:bg-accent-soft/30 active:scale-[0.98] transition-all text-left cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent min-h-[96px]"
            aria-label={`Pedidos activos: ${metrics.activeCount} en proceso. Abrir Pedidos.`}
          >
            <div className="flex items-center justify-between w-full">
              <span className="text-xs font-black text-text-secondary group-hover:text-accent transition-colors flex items-center gap-1.5">
                <ShoppingBag className="w-4 h-4 text-accent shrink-0" />
                <span>Pedidos Activos</span>
              </span>
              <ArrowRight className="w-3.5 h-3.5 text-text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <p className="text-2xl sm:text-3xl font-black text-text-primary my-1 tabular-nums">
              {metrics.activeCount}
            </p>
            <p className="text-[11px] font-bold text-text-muted">
              En turno
            </p>
          </button>

          {/* 4. Venta del Período */}
          <button
            type="button"
            onClick={() => onTabChange('pagos')}
            className="group flex flex-col justify-between p-3.5 rounded-2xl bg-surface-raised border border-line hover:border-emerald-500/50 hover:bg-emerald-500/5 active:scale-[0.98] transition-all text-left cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent min-h-[96px]"
            aria-label={`Venta del período: $${metrics.totalSalesPesos.toFixed(2)} pesos, ${metrics.periodOrdersCount} órdenes. Abrir Pagos.`}
          >
            <div className="flex items-center justify-between w-full">
              <span className="text-xs font-black text-text-secondary group-hover:text-emerald-500 transition-colors flex items-center gap-1.5">
                <DollarSign className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Venta</span>
              </span>
              <ArrowRight className="w-3.5 h-3.5 text-text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <p className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400 my-1 tabular-nums">
              ${metrics.totalSalesPesos.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
            </p>
            <p className="text-[11px] font-bold text-text-muted tabular-nums">
              {metrics.periodOrdersCount} órdenes
            </p>
          </button>
        </div>
      </div>

      {/* ─── Nivel 2: Riel Horizontal de Fechas ──────────────────────────────── */}
      <div className="bg-surface-card p-3 sm:p-4 rounded-3xl border border-line shadow-xs">
        <HorizontalDateCalendarFilter
          orders={orders}
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
        />
      </div>

      {/* ─── Nivel 3: Contenido Central de Resumen K & Mise en Place ─────────── */}
      <div id="resumenk-content-panel" role="region" aria-label="Mise en Place y Resumen K">
        <KitchenSummaryK selectedDate={selectedDate} />
      </div>
    </div>
  );
}
