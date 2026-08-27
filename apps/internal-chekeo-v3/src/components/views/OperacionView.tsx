/**
 * OperacionView.tsx — Chekeo V3
 *
 * Dashboard de inicio y semáforo operativo del turno:
 * - Semáforo del turno en vivo: Cocina activa, Pagos pendientes, Pedidos abiertos y Venta del día.
 * - Tarjeta inteligente de Siguiente Acción Prioritaria.
 * - Mini cola de comandas urgentes con navegación directa.
 * - Mini Resumen K de insumos y producción.
 */

import React, { useMemo } from 'react';
import {
  Flame,
  CreditCard,
  ShoppingBag,
  DollarSign,
  ArrowRight,
  Clock,
  MapPin,
  ChefHat,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { Badge } from '@ui/badge';
import { Button } from '@ui/button';
import { useChekeoOrdersQuery } from '../../features/orders';
import { useKitchenDisplay } from '../../features/kitchen';
import type { ChekeoTab } from '../shell';
import type { OrderV2 } from '@config/index';
import { getCdmxTodayString } from '@config/index';

interface OperacionViewProps {
  onTabChange: (tab: ChekeoTab) => void;
}

export function OperacionView({ onTabChange }: OperacionViewProps) {
  const { orders, counts, isLoading } = useChekeoOrdersQuery({
    autoRefresh: true,
    refetchIntervalMs: 15000,
  });

  const { tickets, aggregates } = useKitchenDisplay({
    autoRefresh: true,
  });

  // Fecha de hoy en formato YYYY-MM-DD (Zona Horaria Oficial CDMX)
  const todayStr = useMemo(() => getCdmxTodayString(), []);

  // Métricas calculadas reactivamente
  const metrics = useMemo(() => {
    const activeOrders = orders.filter(
      (o) => o.status !== 'delivered' && o.status !== 'cancelled'
    );
    const pendingPayments = activeOrders.filter((o) => o.paymentStatus === 'pending');
    const prepOrders = activeOrders.filter(
      (o) => o.status === 'new' || o.status === 'preparing'
    );
    const readyOrders = activeOrders.filter((o) => o.status === 'ready');

    // Total de venta de pedidos de hoy (excluyendo cancelados)
    const todayOrders = orders.filter((o) => {
      const orderDate = o.createdAt.split('T')[0];
      return orderDate === todayStr && o.status !== 'cancelled';
    });

    const totalSalesPesos = todayOrders.reduce((acc, o) => acc + (o.total ?? 0), 0);

    return {
      activeCount: activeOrders.length,
      pendingPaymentsCount: pendingPayments.length,
      prepCount: prepOrders.length,
      readyCount: readyOrders.length,
      totalSalesPesos,
      todayOrdersCount: todayOrders.length,
      actionableOrders: activeOrders.slice(0, 4),
    };
  }, [orders, todayStr]);

  // Determinar la Siguiente Acción Prioritaria
  const nextAction = useMemo(() => {
    if (metrics.pendingPaymentsCount > 0) {
      return {
        title: 'Confirmar pagos pendientes',
        detail: `${metrics.pendingPaymentsCount} orden${metrics.pendingPaymentsCount === 1 ? '' : 'es'} requieren validación de cobro o comprobante Transferencia.`,
        cta: 'Abrir Pagos',
        tab: 'pagos' as ChekeoTab,
        badgeColor: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30',
      };
    }
    if (metrics.prepCount > 0) {
      return {
        title: 'Preparar comandas en cocina',
        detail: `${metrics.prepCount} orden${metrics.prepCount === 1 ? '' : 'es'} están en cola de plancha / freidora.`,
        cta: 'Abrir Cocina',
        tab: 'cocina' as ChekeoTab,
        badgeColor: 'bg-accent-soft text-accent border-accent/30',
      };
    }
    if (metrics.readyCount > 0) {
      return {
        title: 'Entregar pedidos listos',
        detail: `${metrics.readyCount} orden${metrics.readyCount === 1 ? '' : 'es'} listas para empaque y despacho al cliente.`,
        cta: 'Abrir Pedidos',
        tab: 'pedidos' as ChekeoTab,
        badgeColor: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
      };
    }
    return {
      title: 'Operación al día',
      detail: 'No hay pedidos abiertos que requieran atención inmediata.',
      cta: 'Ver Pedidos',
      tab: 'pedidos' as ChekeoTab,
      badgeColor: 'bg-zinc-500/15 text-zinc-600 dark:text-zinc-400 border-zinc-500/30',
    };
  }, [metrics]);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* ─── Hero Header: Resumen de Turno ───────────────────────────────────── */}
      <div className="bg-surface-card p-5 sm:p-6 rounded-3xl border border-line shadow-card space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <span className="px-3 py-1 text-xs font-black uppercase tracking-wider rounded-full bg-accent-soft text-accent border border-accent/25 inline-flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Resumen Operativo</span>
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-text-primary mt-1.5 tracking-tight">
              Control de Turno en Vivo
            </h2>
            <p className="text-xs text-text-secondary mt-0.5">
              Lectura en tiempo real del flujo de cocina, cobranza y entregas.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-surface-raised border border-line text-xs font-bold text-text-primary">
              <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
              <span>D1 En Vivo</span>
            </span>
          </div>
        </div>

        {/* ─── Cuadrícula de Semáforo (4 Métricas Clave) ─────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* 1. Cocina Activa */}
          <button
            type="button"
            onClick={() => onTabChange('cocina')}
            className="group flex flex-col justify-between p-4 rounded-2xl bg-surface-raised border border-line hover:border-accent/50 hover:bg-accent-soft/30 transition-all text-left cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            <div className="flex items-center justify-between w-full">
              <span className="text-xs font-bold text-text-secondary group-hover:text-accent transition-colors flex items-center gap-1.5">
                <Flame className="w-4 h-4 text-amber-500 shrink-0" />
                <span>Cocina Activa</span>
              </span>
              <ArrowRight className="w-3.5 h-3.5 text-text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <p className="text-2xl sm:text-3xl font-black text-text-primary my-1.5">
              {metrics.prepCount}
            </p>
            <p className="text-[11px] text-text-muted">
              {aggregates.totalBurgers} burgers por preparar
            </p>
          </button>


          {/* 2. Pagos Pendientes */}
          <button
            type="button"
            onClick={() => onTabChange('pagos')}
            className="group flex flex-col justify-between p-4 rounded-2xl bg-surface-raised border border-line hover:border-amber-500/50 hover:bg-amber-500/5 transition-all text-left cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            <div className="flex items-center justify-between w-full">
              <span className="text-xs font-bold text-text-secondary group-hover:text-amber-500 transition-colors flex items-center gap-1.5">
                <CreditCard className="w-4 h-4 text-amber-500 shrink-0" />
                <span>Por Cobrar</span>
              </span>
              <ArrowRight className="w-3.5 h-3.5 text-text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <p className="text-2xl sm:text-3xl font-black text-text-primary my-1.5">
              {metrics.pendingPaymentsCount}
            </p>
            <p className="text-[11px] text-text-muted">
              {metrics.pendingPaymentsCount === 1 ? '1 cobro pendiente' : `${metrics.pendingPaymentsCount} cobros pendientes`}
            </p>
          </button>

          {/* 3. Pedidos Activos */}
          <button
            type="button"
            onClick={() => onTabChange('pedidos')}
            className="group flex flex-col justify-between p-4 rounded-2xl bg-surface-raised border border-line hover:border-accent/50 hover:bg-accent-soft/30 transition-all text-left cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            <div className="flex items-center justify-between w-full">
              <span className="text-xs font-bold text-text-secondary group-hover:text-accent transition-colors flex items-center gap-1.5">
                <ShoppingBag className="w-4 h-4 text-accent shrink-0" />
                <span>Pedidos Activos</span>
              </span>
              <ArrowRight className="w-3.5 h-3.5 text-text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <p className="text-2xl sm:text-3xl font-black text-text-primary my-1.5">
              {metrics.activeCount}
            </p>
            <p className="text-[11px] text-text-muted">
              En proceso de turno
            </p>
          </button>

          {/* 4. Venta de Hoy */}
          <button
            type="button"
            onClick={() => onTabChange('pedidos')}
            className="group flex flex-col justify-between p-4 rounded-2xl bg-surface-raised border border-line hover:border-emerald-500/50 hover:bg-emerald-500/5 transition-all text-left cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            <div className="flex items-center justify-between w-full">
              <span className="text-xs font-bold text-text-secondary group-hover:text-emerald-500 transition-colors flex items-center gap-1.5">
                <DollarSign className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Venta de Hoy</span>
              </span>
              <ArrowRight className="w-3.5 h-3.5 text-text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <p className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400 my-1.5">
              ${metrics.totalSalesPesos.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
            </p>
            <p className="text-[11px] text-text-muted">
              {metrics.todayOrdersCount} órdenes registradas
            </p>
          </button>
        </div>
      </div>

      {/* ─── Siguiente Acción Prioritaria ────────────────────────────────────── */}
      <div className="bg-surface-card p-5 sm:p-6 rounded-3xl border border-line shadow-card space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-0.5">
            <span className={`px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider rounded-md border ${nextAction.badgeColor}`}>
              Siguiente Acción Prioritaria
            </span>
            <h3 className="text-lg font-black text-text-primary tracking-tight mt-1">
              {nextAction.title}
            </h3>
            <p className="text-xs text-text-secondary">
              {nextAction.detail}
            </p>
          </div>

          <Button
            type="button"
            variant="default"
            size="sm"
            onClick={() => onTabChange(nextAction.tab)}
            className="font-extrabold text-xs px-4 py-2.5 rounded-xl shadow-xs"
          >
            <span>{nextAction.cta}</span>
            <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
          </Button>
        </div>

        {/* Mini Lista de Comandas Activas */}
        <div className="space-y-2.5 pt-2">
          {metrics.actionableOrders.length > 0 ? (
            metrics.actionableOrders.map((order) => (
              <button
                key={order.id}
                type="button"
                onClick={() => onTabChange(order.paymentStatus === 'pending' ? 'pagos' : 'pedidos')}
                className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-surface-raised border border-line hover:border-accent/40 hover:bg-surface transition-all text-left cursor-pointer group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                <div className="min-w-0 pr-3">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-black text-sm text-text-primary group-hover:text-accent transition-colors">
                      #{order.folio}
                    </span>
                    <span className="font-bold text-xs text-text-secondary truncate">
                      {order.customerName}
                    </span>
                  </div>
                  <p className="text-xs text-text-muted truncate">
                    {order.items.map((i) => `${i.qty ?? 1}x ${i.name}`).join(' · ')}
                  </p>
                </div>

                <div className="flex flex-col items-end shrink-0 gap-1">
                  <Badge
                    variant={order.paymentStatus === 'paid' ? 'success' : 'warning'}
                    className="text-[10px]"
                  >
                    {order.paymentStatus === 'paid' ? 'Pagado' : 'Cobro Pendiente'}
                  </Badge>
                  <strong className="text-xs font-black text-emerald-600 dark:text-emerald-400">
                    ${(order.total ?? 0).toFixed(2)}
                  </strong>
                </div>
              </button>
            ))
          ) : (
            <div className="text-center py-4 bg-surface-raised rounded-2xl border border-dashed border-line">
              <CheckCircle2 className="w-5 h-5 text-accent mx-auto mb-1 opacity-70" />
              <p className="text-xs font-semibold text-text-muted">
                No hay comandas pendientes de resolver.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ─── Mini Resumen K (Mise en Place) ─────────────────────────────────── */}
      <div className="bg-surface-card p-5 sm:p-6 rounded-3xl border border-line shadow-card flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1 min-w-0">
          <span className="text-[10px] font-black uppercase tracking-wider text-accent flex items-center gap-1.5">
            <ChefHat className="w-3.5 h-3.5" />
            <span>Mise en Place de Insumos</span>
          </span>
          <h3 className="text-base font-black text-text-primary">
            Mini Resumen K de Cocina
          </h3>
          <div className="flex flex-wrap items-center gap-2.5 pt-1 text-xs font-bold text-text-secondary">
            <span className="px-2.5 py-1 rounded-lg bg-surface-raised border border-line">
              Burgers: <strong className="text-text-primary ml-1">{aggregates.totalBurgers}</strong>
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-surface-raised border border-line">
              Sides: <strong className="text-text-primary ml-1">{aggregates.totalGarnishes}</strong>
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-surface-raised border border-line">
              En Cola: <strong className="text-text-primary ml-1">{tickets.length} tickets</strong>
            </span>
          </div>
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onTabChange('cocina')}
          className="font-bold text-xs shrink-0 rounded-xl"
        >
          <span>Abrir Cocina Completa</span>
          <ArrowRight className="w-3.5 h-3.5 ml-1" />
        </Button>
      </div>
    </div>
  );
}
