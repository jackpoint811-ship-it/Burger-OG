/**
 * CashCutPanel.tsx — PR-V3-12
 *
 * Submódulo de Corte de Caja, Arqueo Operativo del Turno (Corte Z) y Reportes Financieros.
 * Totalización por método de pago (Efectivo vs SPEI vs Tarjeta), ticket promedio, exportación CSV y cierre de turno.
 */

import React, { useState, useMemo } from 'react';
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
  Archive,
  RefreshCw,
  Clock,
  ArrowUpRight,
  ShieldCheck,
} from 'lucide-react';
import { Button } from '@ui/button';
import { Badge } from '@ui/badge';
import { Card } from '@ui/card';
import { useAdminCashCut } from '../../features/admin/hooks/use-admin';
import { getOrdersExportCsvUrl } from '../../features/admin/api/admin.api';
import type { CashCutFilterPreset } from '../../features/admin/types/admin.types';

export function CashCutPanel() {
  const [preset, setPreset] = useState<CashCutFilterPreset>('today');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [isArchiveModalOpen, setIsArchiveModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('Cierre de turno');
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  // Compute date range based on preset
  const dateRange = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    if (preset === 'today') {
      return { from: today, to: today };
    }
    if (preset === 'yesterday') {
      const y = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
      return { from: y, to: y };
    }
    if (preset === 'week') {
      const fromDate = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);
      return { from: fromDate, to: today };
    }
    return { from: customFrom || today, to: customTo || today };
  }, [preset, customFrom, customTo]);

  const { cashCutData, summaryData, isLoading, isError, error, refetch, batchArchiveMutation } =
    useAdminCashCut({ from: dateRange.from, to: dateRange.to });

  const totalSales = cashCutData?.totalSalesPesos ?? (summaryData?.totals?.grossSales ?? 0);
  const totalOrders = cashCutData?.totalOrders ?? (summaryData?.totals?.orders ?? 0);
  const avgTicket = summaryData?.totals?.averageTicket ?? (totalOrders > 0 ? totalSales / totalOrders : 0);

  // Payment Breakdown
  const cashTotal = cashCutData?.byPaymentMethod?.cash?.totalPesos ?? 0;
  const transferTotal = cashCutData?.byPaymentMethod?.transfer?.totalPesos ?? 0;
  const cardTotal = cashCutData?.byPaymentMethod?.card?.totalPesos ?? 0;

  const cashOrders = cashCutData?.byPaymentMethod?.cash?.count ?? 0;
  const transferOrders = cashCutData?.byPaymentMethod?.transfer?.count ?? 0;
  const cardOrders = cashCutData?.byPaymentMethod?.card?.count ?? 0;

  const cashPct = totalSales > 0 ? Math.round((cashTotal / totalSales) * 100) : 0;
  const transferPct = totalSales > 0 ? Math.round((transferTotal / totalSales) * 100) : 0;
  const cardPct = totalSales > 0 ? Math.round((cardTotal / totalSales) * 100) : 0;

  // Delivery vs Pickup Breakdown
  const deliveryTotal = cashCutData?.byOrderMode?.delivery?.totalPesos ?? 0;
  const pickupTotal = cashCutData?.byOrderMode?.pickup?.totalPesos ?? 0;
  const deliveryOrders = cashCutData?.byOrderMode?.delivery?.count ?? 0;
  const pickupOrders = cashCutData?.byOrderMode?.pickup?.count ?? 0;

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
      setIsArchiveModalOpen(false);
      setActionNotice(`Arqueo completado: ${res?.archivedCount ?? recentIds.length} órdenes procesadas archivadas.`);
      setTimeout(() => setActionNotice(null), 4000);
    } catch {
      // Handled
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Notice */}
      {actionNotice && (
        <div className="p-3 rounded-2xl bg-accent-soft border border-accent/20 text-accent text-xs font-bold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>{actionNotice}</span>
          </div>
          <button onClick={() => setActionNotice(null)} className="opacity-70 hover:opacity-100">
            ×
          </button>
        </div>
      )}

      {/* Date Horizon Ribbon */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-surface-card p-4 rounded-3xl border border-line shadow-xs">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 sm:pb-0 scrollbar-none">
          <button
            type="button"
            onClick={() => setPreset('today')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
              preset === 'today'
                ? 'bg-text-primary text-surface-card shadow-xs'
                : 'bg-surface-raised text-text-secondary hover:text-text-primary'
            }`}
          >
            📅 Turno de Hoy
          </button>
          <button
            type="button"
            onClick={() => setPreset('yesterday')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
              preset === 'yesterday'
                ? 'bg-text-primary text-surface-card shadow-xs'
                : 'bg-surface-raised text-text-secondary hover:text-text-primary'
            }`}
          >
            ⏪ Turno de Ayer
          </button>
          <button
            type="button"
            onClick={() => setPreset('week')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
              preset === 'week'
                ? 'bg-text-primary text-surface-card shadow-xs'
                : 'bg-surface-raised text-text-secondary hover:text-text-primary'
            }`}
          >
            📊 Últimos 7 Días
          </button>
          <button
            type="button"
            onClick={() => setPreset('custom')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
              preset === 'custom'
                ? 'bg-text-primary text-surface-card shadow-xs'
                : 'bg-surface-raised text-text-secondary hover:text-text-primary'
            }`}
          >
            🗓️ Rango Manual
          </button>
        </div>

        {preset === 'custom' && (
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={customFrom}
              onChange={(e) => setCustomFrom(e.target.value)}
              className="px-2.5 py-1 text-xs rounded-xl bg-surface-raised border border-line text-text-primary outline-none focus:border-accent"
            />
            <span className="text-xs text-text-muted">a</span>
            <input
              type="date"
              value={customTo}
              onChange={(e) => setCustomTo(e.target.value)}
              className="px-2.5 py-1 text-xs rounded-xl bg-surface-raised border border-line text-text-primary outline-none focus:border-accent"
            />
          </div>
        )}

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <Button
            type="button"
            variant="outline"
            onClick={handleExportCsv}
            className="text-xs font-bold h-9 px-3 text-text-primary"
          >
            <Download className="w-3.5 h-3.5 mr-1.5 text-accent" />
            Descargar CSV
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={() => refetch()}
            className="p-2 h-9 w-9 text-text-secondary"
            title="Refrescar balance"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* KPI Principal Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        {/* Total Vendido */}
        <div className="p-5 rounded-3xl bg-surface-card border border-line shadow-xs space-y-2">
          <div className="flex items-center justify-between text-text-secondary">
            <span className="text-xs font-semibold">Total Vendido</span>
            <div className="w-8 h-8 rounded-xl bg-accent-soft text-accent flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-accent">
            ${totalSales.toFixed(2)}{' '}
            <span className="text-xs font-semibold text-text-secondary">MXN</span>
          </p>
          <p className="text-[11px] text-text-muted">Ingreso bruto del periodo seleccionado</p>
        </div>

        {/* Ticket Promedio */}
        <div className="p-5 rounded-3xl bg-surface-card border border-line shadow-xs space-y-2">
          <div className="flex items-center justify-between text-text-secondary">
            <span className="text-xs font-semibold">Ticket Promedio</span>
            <div className="w-8 h-8 rounded-xl bg-surface-raised text-text-muted flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-text-primary">
            ${avgTicket.toFixed(2)}{' '}
            <span className="text-xs font-semibold text-text-secondary">MXN</span>
          </p>
          <p className="text-[11px] text-text-muted">Por orden no cancelada</p>
        </div>

        {/* Total Órdenes */}
        <div className="p-5 rounded-3xl bg-surface-card border border-line shadow-xs space-y-2">
          <div className="flex items-center justify-between text-text-secondary">
            <span className="text-xs font-semibold">Total de Pedidos</span>
            <div className="w-8 h-8 rounded-xl bg-surface-raised text-text-muted flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-text-primary">{totalOrders}</p>
          <div className="text-[11px] text-text-muted flex gap-2">
            <span className="text-accent">Entregados: {summaryData?.totals?.deliveredOrders ?? '—'}</span>
            <span className="text-destructive">Cancelados: {summaryData?.totals?.cancelledOrders ?? '—'}</span>
          </div>
        </div>

        {/* Cierre Z Quick Action */}
        <div className="p-5 rounded-3xl bg-surface-card border border-line shadow-xs flex flex-col justify-between space-y-3">
          <div>
            <span className="text-xs font-bold text-text-primary flex items-center gap-1.5">
              <Calculator className="w-4 h-4 text-accent" />
              Arqueo de Turno
            </span>
            <p className="text-[11px] text-text-secondary mt-1">
              Finaliza el turno actual y genera el corte Z de caja.
            </p>
          </div>

          <Button
            type="button"
            onClick={() => setIsArchiveModalOpen(true)}
            className="w-full text-xs font-bold bg-text-primary text-surface-card shadow-xs"
          >
            <ShieldCheck className="w-3.5 h-3.5 mr-1.5 text-accent" />
            Realizar Corte Z
          </Button>
        </div>
      </div>

      {/* Desglose por Método de Pago & Modo de Entrega */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Desglose Métodos de Pago */}
        <div className="bg-surface-card rounded-3xl border border-line p-6 shadow-xs space-y-5">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-text-primary flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-accent" />
              Desglose por Forma de Pago
            </h4>
            <Badge variant="secondary" className="text-[10px]">
              Balance Operativo
            </Badge>
          </div>

          {/* Visual Percentage Bar */}
          <div className="space-y-1.5">
            <div className="h-3 w-full rounded-full bg-surface-raised overflow-hidden flex">
              <div style={{ width: `${cashPct}%` }} className="bg-emerald-500 transition-all" title={`Efectivo ${cashPct}%`} />
              <div style={{ width: `${transferPct}%` }} className="bg-sky-500 transition-all" title={`SPEI ${transferPct}%`} />
              <div style={{ width: `${cardPct}%` }} className="bg-purple-500 transition-all" title={`Tarjeta ${cardPct}%`} />
            </div>
            <div className="flex items-center justify-between text-[10px] text-text-muted font-mono">
              <span className="text-emerald-500 font-bold">● Efectivo ({cashPct}%)</span>
              <span className="text-sky-500 font-bold">● SPEI ({transferPct}%)</span>
              <span className="text-purple-500 font-bold">● Tarjeta ({cardPct}%)</span>
            </div>
          </div>

          <div className="space-y-3">
            {/* Efectivo */}
            <div className="p-3.5 rounded-2xl bg-surface-raised/50 border border-line flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-bold">
                  <Banknote className="w-5 h-5" />
                </div>
                <div>
                  <h5 className="text-xs font-bold text-text-primary">Efectivo en Caja</h5>
                  <p className="text-[11px] text-text-secondary">{cashOrders} pedidos cobrados</p>
                </div>
              </div>
              <span className="text-base font-extrabold text-text-primary font-mono">
                ${cashTotal.toFixed(2)}
              </span>
            </div>

            {/* Transferencia SPEI */}
            <div className="p-3.5 rounded-2xl bg-surface-raised/50 border border-line flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-sky-500/10 text-sky-500 flex items-center justify-center font-bold">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <h5 className="text-xs font-bold text-text-primary">Transferencias SPEI</h5>
                  <p className="text-[11px] text-text-secondary">{transferOrders} pedidos transferidos</p>
                </div>
              </div>
              <span className="text-base font-extrabold text-text-primary font-mono">
                ${transferTotal.toFixed(2)}
              </span>
            </div>

            {/* Tarjeta */}
            <div className="p-3.5 rounded-2xl bg-surface-raised/50 border border-line flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center font-bold">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h5 className="text-xs font-bold text-text-primary">Tarjeta / POS</h5>
                  <p className="text-[11px] text-text-secondary">{cardOrders} pedidos con tarjeta</p>
                </div>
              </div>
              <span className="text-base font-extrabold text-text-primary font-mono">
                ${cardTotal.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Desglose por Modo de Entrega & Top Platillos */}
        <div className="bg-surface-card rounded-3xl border border-line p-6 shadow-xs space-y-5">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-text-primary flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-accent" />
              Canales de Entrega & Ventas
            </h4>
            <Badge variant="secondary" className="text-[10px]">
              Distribución
            </Badge>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-4 rounded-2xl bg-surface-raised border border-line space-y-1">
              <span className="text-xs font-semibold text-text-secondary">🏢 Delivery a Torres</span>
              <p className="text-lg font-bold text-text-primary">${deliveryTotal.toFixed(2)}</p>
              <p className="text-[10px] text-text-muted">{deliveryOrders} órdenes</p>
            </div>

            <div className="p-4 rounded-2xl bg-surface-raised border border-line space-y-1">
              <span className="text-xs font-semibold text-text-secondary">🚶 Pickup / Mostrador</span>
              <p className="text-lg font-bold text-text-primary">${pickupTotal.toFixed(2)}</p>
              <p className="text-[10px] text-text-muted">{pickupOrders} órdenes</p>
            </div>
          </div>

          {/* Top Platillos Vendidos */}
          <div className="space-y-2 pt-2">
            <span className="text-xs font-bold text-text-primary">Platillos Más Vendidos del Turno</span>
            <div className="space-y-1.5 max-h-48 overflow-y-auto">
              {(summaryData?.topItems || []).slice(0, 5).map((item, idx) => (
                <div
                  key={item.sku}
                  className="p-2.5 rounded-xl bg-surface-raised/40 border border-line flex items-center justify-between text-xs"
                >
                  <span className="font-semibold text-text-primary truncate">
                    {idx + 1}. {item.name}
                  </span>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="font-bold text-accent">{item.qty} pzas</span>
                    <span className="font-mono text-text-secondary">${item.total.toFixed(2)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Modal Corte Z & Cierre */}
      {isArchiveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-surface-card w-full max-w-md rounded-3xl border border-line shadow-2xl p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-accent-soft text-accent flex items-center justify-center">
                <Calculator className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-text-primary">Confirmar Cierre de Turno (Corte Z)</h3>
                <p className="text-xs text-text-secondary">Arqueo y finalización del turno operativo.</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-surface-raised border border-line space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-text-secondary">Total Cobrado:</span>
                <span className="font-bold text-accent">${totalSales.toFixed(2)} MXN</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Efectivo a entregar:</span>
                <span className="font-bold text-text-primary">${cashTotal.toFixed(2)} MXN</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Transferencias SPEI:</span>
                <span className="font-bold text-text-primary">${transferTotal.toFixed(2)} MXN</span>
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-text-secondary">Nota de Arqueo</label>
              <input
                type="text"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Ej. Cierre Turno Comida GGA"
                className="w-full px-3 py-2 text-xs rounded-xl bg-surface-raised border border-line text-text-primary outline-none focus:border-accent"
              />
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsArchiveModalOpen(false)}
                className="text-xs"
              >
                Cancelar
              </Button>
              <Button
                type="button"
                onClick={handleBatchArchive}
                disabled={batchArchiveMutation.isPending}
                className="text-xs font-bold bg-text-primary text-surface-card"
              >
                {batchArchiveMutation.isPending ? 'Procesando...' : 'Confirmar Corte Z'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
