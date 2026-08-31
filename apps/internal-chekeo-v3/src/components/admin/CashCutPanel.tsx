/**
 * CashCutPanel.tsx — Chekeo V3
 *
 * Submódulo de Finanzas, Arqueo de Caja (Corte Z) y Conciliación de Pagos.
 * Integrado con Dynamic UI Components (@ui/kpi-card, @ui/segmented-control, @ui/drawer, @ui/badge),
 * calculadora de arqueo físico en tiempo real (caja cuadrada / sobrante / faltante) y exportación contable CSV.
 */

import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calculator,
  Download,
  Calendar,
  DollarSign,
  TrendingUp,
  CreditCard,
  Banknote,
  Smartphone,
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
  RefreshCw,
  Clock,
  ShieldCheck,
  Building2,
  Store,
  Sparkles,
  Equal,
} from 'lucide-react';
import { Button } from '@ui/button';
import { Badge } from '@ui/badge';
import { KpiCard } from '@ui/kpi-card';
import { SegmentedControl } from '@ui/segmented-control';
import { Drawer } from '@ui/drawer';
import { getCdmxTodayString } from '@config/index';
import { getCdmxYesterdayString, getCdmxPastDaysString } from '../../features/payments';
import { useAdminCashCut } from '../../features/admin/hooks/use-admin';
import { getOrdersExportCsvUrl } from '../../features/admin/api/admin.api';
import type { CashCutFilterPreset } from '../../features/admin/types/admin.types';

export interface CashCutPanelProps {
  activeToolId?: string;
  onSelectTool?: (toolId: string) => void;
}

export function CashCutPanel({ activeToolId, onSelectTool }: CashCutPanelProps = {}) {
  const [preset, setPreset] = useState<string>('today');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [isArchiveDrawerOpen, setIsArchiveDrawerOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('Cierre de turno');
  const [physicalCashCount, setPhysicalCashCount] = useState<string>('');
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  // Sincronizar activeToolId con apertura del Drawer
  useEffect(() => {
    if (activeToolId === 'z-cut') {
      setIsArchiveDrawerOpen(true);
    }
  }, [activeToolId]);

  // Cálculo de rango de fechas en CDMX
  const dateRange = useMemo(() => {
    const today = getCdmxTodayString();
    if (preset === 'today') {
      return { from: today, to: today };
    }
    if (preset === 'yesterday') {
      const y = getCdmxYesterdayString();
      return { from: y, to: y };
    }
    if (preset === 'week') {
      const fromDate = getCdmxPastDaysString(7);
      return { from: fromDate, to: today };
    }
    return { from: customFrom || today, to: customTo || today };
  }, [preset, customFrom, customTo]);

  const { cashCutData, summaryData, isLoading, refetch, batchArchiveMutation } =
    useAdminCashCut({ from: dateRange.from, to: dateRange.to });

  const totalSales = cashCutData?.totalSalesPesos ?? (summaryData?.totals?.grossSales ?? 0);
  const totalOrders = cashCutData?.totalOrders ?? (summaryData?.totals?.orders ?? 0);
  const avgTicket = summaryData?.totals?.averageTicket ?? (totalOrders > 0 ? totalSales / totalOrders : 0);

  // Desglose por Método de Pago
  const cashTotal = cashCutData?.byPaymentMethod?.cash?.totalPesos ?? 0;
  const transferTotal = cashCutData?.byPaymentMethod?.transfer?.totalPesos ?? 0;
  const cardTotal = cashCutData?.byPaymentMethod?.card?.totalPesos ?? 0;

  const cashOrders = cashCutData?.byPaymentMethod?.cash?.count ?? 0;
  const transferOrders = cashCutData?.byPaymentMethod?.transfer?.count ?? 0;
  const cardOrders = cashCutData?.byPaymentMethod?.card?.count ?? 0;

  const cashPct = totalSales > 0 ? Math.round((cashTotal / totalSales) * 100) : 0;
  const transferPct = totalSales > 0 ? Math.round((transferTotal / totalSales) * 100) : 0;
  const cardPct = totalSales > 0 ? Math.round((cardTotal / totalSales) * 100) : 0;

  // Desglose por Canal
  const deliveryTotal = cashCutData?.byOrderMode?.delivery?.totalPesos ?? 0;
  const pickupTotal = cashCutData?.byOrderMode?.pickup?.totalPesos ?? 0;
  const deliveryOrders = cashCutData?.byOrderMode?.delivery?.count ?? 0;
  const pickupOrders = cashCutData?.byOrderMode?.pickup?.count ?? 0;

  // Calculadora de Arqueo Físico en tiempo real
  const cashDifference = useMemo(() => {
    if (!physicalCashCount) return null;
    const counted = parseFloat(physicalCashCount);
    if (isNaN(counted)) return null;
    const diff = counted - cashTotal;
    return {
      counted,
      diff,
      isBalanced: Math.abs(diff) < 0.01,
      isOver: diff > 0.01,
      isUnder: diff < -0.01,
    };
  }, [physicalCashCount, cashTotal]);

  const handleExportCsv = () => {
    const url = getOrdersExportCsvUrl({ from: dateRange.from, to: dateRange.to, includeTerminal: true });
    window.open(url, '_blank');
  };

  const handleBatchArchive = async () => {
    const recentIds = summaryData?.recentOrders?.map((o) => o.id) || [];
    if (recentIds.length === 0) return;

    try {
      const res = (await batchArchiveMutation.mutateAsync({
        orderIds: recentIds,
        cancelReason,
      })) as { archivedCount?: number };
      setIsArchiveDrawerOpen(false);
      setActionNotice(`✓ Arqueo Z completado: ${res?.archivedCount ?? recentIds.length} órdenes archivadas para el corte.`);
      setTimeout(() => setActionNotice(null), 4000);
    } catch {
      // Handled
    }
  };

  // Elementos de SegmentedControl para el Horizonte
  const presetSegmentItems = [
    { id: 'today', label: '⚡ Turno de Hoy' },
    { id: 'yesterday', label: '⏪ Turno de Ayer' },
    { id: 'week', label: '📊 Últimos 7 Días' },
    { id: 'custom', label: '🗓️ Rango Manual' },
  ];

  return (
    <div className="space-y-5 animate-in fade-in duration-300">
      {/* Toast Flotante */}
      <AnimatePresence>
        {actionNotice && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-3.5 rounded-2xl bg-accent-soft border border-accent/20 text-accent text-xs font-black flex items-center justify-between shadow-sm"
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-accent" />
              <span>{actionNotice}</span>
            </div>
            <button
              type="button"
              onClick={() => setActionNotice(null)}
              className="opacity-70 hover:opacity-100 cursor-pointer text-base leading-none"
            >
              ×
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 1. Tarjetas KPI Reactivas (@ui/kpi-card) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard
          title="Venta Bruta Total"
          value={`$${totalSales.toFixed(2)}`}
          subtitle={`${totalOrders} pedidos totales`}
          icon={<DollarSign className="w-4 h-4" />}
          variant="accent"
        />
        <KpiCard
          title="Ticket Promedio"
          value={`$${avgTicket.toFixed(2)}`}
          subtitle="Por orden entregada"
          icon={<TrendingUp className="w-4 h-4" />}
          variant="default"
        />
        <KpiCard
          title="Efectivo en Caja"
          value={`$${cashTotal.toFixed(2)}`}
          subtitle={`${cashOrders} cobros (${cashPct}%)`}
          icon={<Banknote className="w-4 h-4" />}
          variant="success"
        />
        <KpiCard
          title="Transferencias SPEI"
          value={`$${transferTotal.toFixed(2)}`}
          subtitle={`${transferOrders} cobros (${transferPct}%)`}
          icon={<Smartphone className="w-4 h-4" />}
          variant="info"
        />
      </div>

      {/* 2. Selector de Horizonte con SegmentedControl */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-surface-card p-3.5 sm:p-4 rounded-3xl border border-line shadow-xs">
        <SegmentedControl
          items={presetSegmentItems}
          value={preset}
          onChange={setPreset}
          layoutId="cashcut-presets-segmented"
          size="sm"
          className="w-full sm:w-auto"
        />

        {preset === 'custom' && (
          <div className="flex items-center gap-2 animate-in fade-in duration-200">
            <input
              type="date"
              value={customFrom}
              onChange={(e) => setCustomFrom(e.target.value)}
              className="px-2.5 py-1 text-xs rounded-xl bg-surface-raised border border-line text-text-primary outline-none focus:border-accent font-bold"
            />
            <span className="text-xs text-text-muted font-bold">a</span>
            <input
              type="date"
              value={customTo}
              onChange={(e) => setCustomTo(e.target.value)}
              className="px-2.5 py-1 text-xs rounded-xl bg-surface-raised border border-line text-text-primary outline-none focus:border-accent font-bold"
            />
          </div>
        )}

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <Button
            type="button"
            variant="outline"
            onClick={handleExportCsv}
            className="text-xs font-black h-8.5 px-3 rounded-xl cursor-pointer active:scale-95"
          >
            <Download className="w-3.5 h-3.5 mr-1.5 text-accent" />
            Exportar CSV
          </Button>

          <Button
            type="button"
            onClick={() => setIsArchiveDrawerOpen(true)}
            className="text-xs font-black bg-accent text-white h-8.5 px-3 rounded-xl cursor-pointer active:scale-95"
          >
            <Calculator className="w-3.5 h-3.5 mr-1.5" />
            Corte Z
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={() => refetch()}
            className="p-2 h-8.5 w-8.5 text-text-secondary hover:text-text-primary rounded-xl cursor-pointer"
            title="Refrescar balance"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* 3. Desgloses Visuales por Método de Pago & Entrega */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
        {/* Desglose por Forma de Pago */}
        <div className="bg-surface-card rounded-3xl border border-line p-5 sm:p-6 shadow-card space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-black text-text-primary flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-accent" />
              Proporción de Métodos de Pago
            </h4>
            <Badge variant="secondary" className="text-[10px] font-bold">
              ${totalSales.toFixed(2)} MXN
            </Badge>
          </div>

          {/* Barra Proporcional de Colores */}
          <div className="space-y-1.5">
            <div className="h-3.5 w-full rounded-full bg-surface-raised overflow-hidden flex p-0.5 border border-line/60">
              <div style={{ width: `${cashPct}%` }} className="bg-emerald-500 rounded-l-full transition-all" />
              <div style={{ width: `${transferPct}%` }} className="bg-sky-500 transition-all" />
              <div style={{ width: `${cardPct}%` }} className="bg-purple-500 rounded-r-full transition-all" />
            </div>
            <div className="flex items-center justify-between text-[11px] font-mono font-bold">
              <span className="text-emerald-600 dark:text-emerald-400">● Efectivo ({cashPct}%)</span>
              <span className="text-sky-600 dark:text-sky-400">● SPEI ({transferPct}%)</span>
              <span className="text-purple-600 dark:text-purple-400">● Tarjeta ({cardPct}%)</span>
            </div>
          </div>

          <div className="space-y-2.5 pt-1">
            {/* Efectivo */}
            <div className="p-3 rounded-2xl bg-surface-raised border border-line flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                  <Banknote className="w-5 h-5" />
                </div>
                <div>
                  <h5 className="text-xs font-black text-text-primary">Efectivo en Caja Físico</h5>
                  <p className="text-[11px] text-text-secondary font-medium">{cashOrders} pedidos cobrados</p>
                </div>
              </div>
              <span className="text-base font-black text-text-primary font-mono tabular-nums">
                ${cashTotal.toFixed(2)}
              </span>
            </div>

            {/* Transferencia */}
            <div className="p-3 rounded-2xl bg-surface-raised border border-line flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-sky-500/15 text-sky-600 dark:text-sky-400 flex items-center justify-center font-bold">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <h5 className="text-xs font-black text-text-primary">Transferencias Bancarias (SPEI)</h5>
                  <p className="text-[11px] text-text-secondary font-medium">{transferOrders} pedidos transferidos</p>
                </div>
              </div>
              <span className="text-base font-black text-text-primary font-mono tabular-nums">
                ${transferTotal.toFixed(2)}
              </span>
            </div>

            {/* Tarjeta */}
            <div className="p-3 rounded-2xl bg-surface-raised border border-line flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-purple-500/15 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h5 className="text-xs font-black text-text-primary">Terminal POS / Tarjeta</h5>
                  <p className="text-[11px] text-text-secondary font-medium">{cardOrders} pedidos con tarjeta</p>
                </div>
              </div>
              <span className="text-base font-black text-text-primary font-mono tabular-nums">
                ${cardTotal.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Canales de Entrega & Top Platillos */}
        <div className="bg-surface-card rounded-3xl border border-line p-5 sm:p-6 shadow-card space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-black text-text-primary flex items-center gap-2">
              <Building2 className="w-4 h-4 text-accent" />
              Canales de Distribución & Top Ventas
            </h4>
            <Badge variant="secondary" className="text-[10px] font-bold">
              {totalOrders} Órdenes
            </Badge>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-3.5 rounded-2xl bg-surface-raised border border-line space-y-1">
              <span className="text-xs font-bold text-text-secondary flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5 text-accent" /> Delivery a Torres
              </span>
              <p className="text-lg font-black text-text-primary font-mono tabular-nums">${deliveryTotal.toFixed(2)}</p>
              <p className="text-[10px] text-text-muted font-medium">{deliveryOrders} pedidos entregados</p>
            </div>

            <div className="p-3.5 rounded-2xl bg-surface-raised border border-line space-y-1">
              <span className="text-xs font-bold text-text-secondary flex items-center gap-1">
                <Store className="w-3.5 h-3.5 text-accent" /> Pickup Mostrador
              </span>
              <p className="text-lg font-black text-text-primary font-mono tabular-nums">${pickupTotal.toFixed(2)}</p>
              <p className="text-[10px] text-text-muted font-medium">{pickupOrders} pedidos recogidos</p>
            </div>
          </div>

          {/* Top Platillos */}
          <div className="space-y-2 pt-1">
            <span className="text-xs font-black text-text-primary flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-accent" />
              Platillos Más Vendidos del Turno
            </span>
            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {(summaryData?.topItems || []).slice(0, 5).map((item, idx) => (
                <div
                  key={item.sku}
                  className="p-2.5 rounded-xl bg-surface-raised border border-line flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-5 h-5 rounded-md bg-surface-card border border-line font-mono font-bold text-[10px] flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <span className="font-bold text-text-primary truncate">
                      {item.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2.5 shrink-0 font-mono">
                    <span className="font-black text-accent">{item.qty} pzas</span>
                    <span className="text-text-secondary font-bold tabular-nums">${item.total.toFixed(2)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 4. Drawer de Corte Z & Calculadora de Arqueo Físico */}
      <Drawer
        open={isArchiveDrawerOpen}
        onClose={() => setIsArchiveDrawerOpen(false)}
        title={
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-accent" />
            <span>Arqueo de Turno & Corte Z</span>
          </div>
        }
        description="Verifica el efectivo físico de la caja registradora contra el total registrado en el sistema."
        className="max-w-xl"
      >
        <div className="space-y-4 pt-1">
          {/* Resumen del Sistema */}
          <div className="p-4 rounded-2xl bg-surface-raised border border-line space-y-2 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-text-secondary font-bold">Venta Total del Período:</span>
              <span className="font-black text-accent text-sm font-mono tabular-nums">
                ${totalSales.toFixed(2)} MXN
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-text-secondary font-bold">Efectivo Teórico en Caja:</span>
              <span className="font-black text-text-primary text-sm font-mono tabular-nums">
                ${cashTotal.toFixed(2)} MXN
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-text-secondary font-bold">Transferencias SPEI Conciliadas:</span>
              <span className="font-bold text-text-primary font-mono tabular-nums">
                ${transferTotal.toFixed(2)} MXN
              </span>
            </div>
          </div>

          {/* Calculadora de Efectivo Físico */}
          <div className="p-4 rounded-2xl bg-surface-card border border-line space-y-3 shadow-xs">
            <label className="block text-xs font-black text-text-primary">
              Conteo de Efectivo Físico en Caja Registradora
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-text-muted font-mono">
                $
              </span>
              <input
                type="number"
                step="0.5"
                min="0"
                placeholder="Ingresa el monto total contado..."
                value={physicalCashCount}
                onChange={(e) => setPhysicalCashCount(e.target.value)}
                className="w-full pl-7 pr-3 py-2 text-sm rounded-xl bg-surface-raised border border-line text-text-primary outline-none focus:border-accent font-mono font-black"
              />
            </div>

            {/* Resultado de la Conciliación */}
            {cashDifference && (
              <div
                className={`p-3 rounded-xl border flex items-center justify-between text-xs font-bold ${
                  cashDifference.isBalanced
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                    : cashDifference.isOver
                    ? 'bg-sky-500/10 border-sky-500/30 text-sky-600 dark:text-sky-400'
                    : 'bg-destructive/10 border-destructive/30 text-destructive'
                }`}
              >
                <div className="flex items-center gap-2">
                  {cashDifference.isBalanced ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                  )}
                  <span>
                    {cashDifference.isBalanced
                      ? 'Caja Cuadrada Perfecta ($0.00)'
                      : cashDifference.isOver
                      ? `Sobrante en Caja: +$${cashDifference.diff.toFixed(2)} MXN`
                      : `Faltante en Caja: -$${Math.abs(cashDifference.diff).toFixed(2)} MXN`}
                  </span>
                </div>
                <span className="font-mono tabular-nums font-black">
                  {cashDifference.diff >= 0 ? `+$${cashDifference.diff.toFixed(2)}` : `-$${Math.abs(cashDifference.diff).toFixed(2)}`}
                </span>
              </div>
            )}
          </div>

          {/* Nota de Cierre */}
          <div>
            <label className="block text-[11px] font-bold text-text-secondary mb-1">
              Nota / Folio de Cierre de Turno
            </label>
            <input
              type="text"
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Ej. Cierre Turno Matutino GGA"
              className="w-full px-3 py-2 text-xs rounded-xl bg-surface-raised border border-line text-text-primary outline-none focus:border-accent font-medium"
            />
          </div>

          {/* Botones de Acción */}
          <div className="pt-3 border-t border-line flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsArchiveDrawerOpen(false)}
              className="text-xs rounded-xl"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleBatchArchive}
              disabled={batchArchiveMutation.isPending}
              className="text-xs font-black bg-accent text-white rounded-xl cursor-pointer active:scale-95"
            >
              <ShieldCheck className="w-3.5 h-3.5 mr-1" />
              {batchArchiveMutation.isPending ? 'Procesando...' : 'Confirmar Corte Z'}
            </Button>
          </div>
        </div>
      </Drawer>
    </div>
  );
}
