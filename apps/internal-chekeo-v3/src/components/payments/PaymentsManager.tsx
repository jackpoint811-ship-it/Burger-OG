/**
 * PaymentsManager.tsx — PR-V3-11
 *
 * Módulo principal de Conciliación de Pagos y Control Financiero de Chekeo V3:
 * - Resumen financiero en cabecera con desglose de ventas por Efectivo vs. Transferencias vs. Tarjeta.
 * - Barra de filtros con búsqueda instantánea, filtro por método de pago y estado de cobro.
 * - Tabla y tarjetas de pedidos con acción de 1-clic para validar pagos y transferencias SPEI.
 * - Integración directa con generador de tickets verticales 80mm y WhatsApp Bridge.
 */

import React, { useState } from 'react';
import {
  CreditCard,
  DollarSign,
  ArrowRightLeft,
  CheckCircle2,
  Clock,
  Search,
  RotateCw,
  FileText,
  MessageCircle,
  AlertCircle,
  Copy,
  ExternalLink,
  Phone,
  MapPin,
  Calendar,
  X,
  ChevronDown,
  Loader2,
  Check,
  Ban,
  Receipt,
} from 'lucide-react';
import { Button } from '@ui/button';
import { Badge } from '@ui/badge';
import { Input } from '@ui/input';
import { Skeleton } from '@ui/skeleton';
import type { OrderV2, OrderV2PaymentMethod, OrderV2PaymentStatus } from '@config/index';
import {
  usePayments,
  type PaymentFilterMethod,
  type PaymentFilterStatus,
  type PaymentDateHorizon,
} from '../../features/payments';
import {
  normalizeOrderItems,
  formatCurrency,
  formatOrderTime,
  formatOrderDate,
  formatDeliveryLocation,
  formatDeliverySchedule,
  PAYMENT_METHOD_LABELS,
  PAYMENT_STATUS_CONFIGS,
  ORDER_STATUS_CONFIGS,
} from '../../features/orders';
import { OrderTicketModal } from './OrderTicketModal';
import { WhatsAppActionModal } from './WhatsAppAction';

export function PaymentsManager() {
  const {
    filteredOrders,
    allOrders,
    financialSummary,
    isLoading,
    isFetching,
    isUpdatingPayment,
    refetch,
    filters,
    setSearch,
    setMethodFilter,
    setStatusFilter,
    setDateHorizon,
    resetFilters,
    markAsPaid,
    markAsPending,
  } = usePayments();

  // Estados de modales interactivos
  const [selectedTicketOrder, setSelectedTicketOrder] = useState<OrderV2 | null>(null);
  const [selectedWhatsAppOrder, setSelectedWhatsAppOrder] = useState<OrderV2 | null>(null);
  const [copiedFolioId, setCopiedFolioId] = useState<string | null>(null);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);

  const handleCopyFolio = (order: OrderV2, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(order.folio);
    setCopiedFolioId(order.id);
    setTimeout(() => setCopiedFolioId(null), 2000);
  };

  const handleTogglePaymentStatus = async (order: OrderV2, e: React.MouseEvent) => {
    e.stopPropagation();
    setUpdatingOrderId(order.id);
    try {
      if (order.paymentStatus === 'paid') {
        await markAsPending(order.id, 'Marcado como pendiente desde módulo de Pagos');
      } else {
        await markAsPaid(order.id, 'Pago validado y confirmado en módulo de Pagos');
      }
    } finally {
      setUpdatingOrderId(null);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* ─── 1. Header Financiero / Resumen del Día ──────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* KPI 1: Total Ventas Activas */}
        <div className="bg-surface-card p-4 sm:p-5 rounded-3xl border border-line shadow-card space-y-2 hover:border-accent/30 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-text-muted">
              Total Ventas
            </span>
            <div className="w-7 h-7 rounded-xl bg-accent-soft text-accent flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-2xl sm:text-3xl font-black text-accent tracking-tight">
              {formatCurrency(financialSummary.totalRevenue)}
            </span>
            <span className="text-xs font-bold text-text-secondary">
              {financialSummary.totalOrdersCount} pedidos
            </span>
          </div>
        </div>

        {/* KPI 2: Transferencias SPEI */}
        <div className="bg-surface-card p-4 sm:p-5 rounded-3xl border border-line shadow-card space-y-2 hover:border-blue-500/30 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-text-muted">
              Transferencias SPEI
            </span>
            <div className="w-7 h-7 rounded-xl bg-blue-500/15 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <ArrowRightLeft className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-2xl sm:text-3xl font-black text-text-primary tracking-tight">
              {formatCurrency(financialSummary.transferRevenue)}
            </span>
            <span className="text-xs font-bold text-text-secondary">
              {financialSummary.transferCount} pedidos
            </span>
          </div>
        </div>

        {/* KPI 3: Efectivo en Entrega */}
        <div className="bg-surface-card p-4 sm:p-5 rounded-3xl border border-line shadow-card space-y-2 hover:border-emerald-500/30 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-text-muted">
              Efectivo en Entrega
            </span>
            <div className="w-7 h-7 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-2xl sm:text-3xl font-black text-text-primary tracking-tight">
              {formatCurrency(financialSummary.cashRevenue)}
            </span>
            <span className="text-xs font-bold text-text-secondary">
              {financialSummary.cashCount} pedidos
            </span>
          </div>
        </div>

        {/* KPI 4: Conciliación / Por Validar */}
        <div
          className={`p-4 sm:p-5 rounded-3xl border shadow-card space-y-2 transition-all cursor-pointer ${
            financialSummary.pendingTransferCount > 0
              ? 'bg-amber-500/10 border-amber-500/30 ring-1 ring-amber-500/20'
              : 'bg-surface-card border-line'
          }`}
          onClick={() => {
            setMethodFilter('transfer');
            setStatusFilter('pending');
          }}
          title="Filtrar transferencias por validar"
        >
          <div className="flex items-center justify-between">
            <span
              className={`text-[11px] font-extrabold uppercase tracking-wider ${
                financialSummary.pendingTransferCount > 0
                  ? 'text-amber-700 dark:text-amber-300'
                  : 'text-text-muted'
              }`}
            >
              Por Conciliar (SPEI)
            </span>
            <div
              className={`w-7 h-7 rounded-xl flex items-center justify-center ${
                financialSummary.pendingTransferCount > 0
                  ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400 animate-pulse'
                  : 'bg-surface-raised text-text-muted'
              }`}
            >
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between gap-2">
            <span
              className={`text-2xl sm:text-3xl font-black tracking-tight ${
                financialSummary.pendingTransferCount > 0
                  ? 'text-amber-600 dark:text-amber-400'
                  : 'text-text-primary'
              }`}
            >
              {formatCurrency(financialSummary.pendingTransferAmount)}
            </span>
            <span className="text-xs font-bold text-text-secondary">
              {financialSummary.pendingTransferCount} pendientes
            </span>
          </div>
        </div>
      </div>

      {/* ─── 2. Barra de Filtros y Búsqueda ─────────────────────────────────── */}
      <div className="bg-surface-card p-4 rounded-3xl border border-line shadow-card space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Campo de Búsqueda */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
            <Input
              type="text"
              value={filters.search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por folio, cliente, teléfono o torre…"
              className="pl-9 pr-8 text-xs h-10 bg-surface rounded-2xl border-line"
            />
            {filters.search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary p-0.5 rounded-full"
                title="Limpiar búsqueda"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Toggle de Horizonte y Refresco */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="inline-flex rounded-xl bg-surface-raised p-1 border border-line text-xs font-bold">
              <button
                type="button"
                onClick={() => setDateHorizon('today')}
                className={`px-3 py-1 rounded-lg transition-all ${
                  filters.dateHorizon === 'today'
                    ? 'bg-surface-card text-accent shadow-xs'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                Hoy
              </button>
              <button
                type="button"
                onClick={() => setDateHorizon('all')}
                className={`px-3 py-1 rounded-lg transition-all ${
                  filters.dateHorizon === 'all'
                    ? 'bg-surface-card text-accent shadow-xs'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                Todos
              </button>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isFetching}
              className="text-xs font-bold h-9"
              title="Refrescar lista de pedidos"
            >
              <RotateCw
                className={`w-3.5 h-3.5 mr-1.5 ${isFetching ? 'animate-spin text-accent' : ''}`}
              />
              <span>Refrescar</span>
            </Button>
          </div>
        </div>

        {/* Pestañas de Filtro por Método de Pago */}
        <div className="flex items-center justify-between gap-2 pt-2 border-t border-line/60 overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-1.5 shrink-0">
            {[
              { key: 'all', label: 'Todos los Métodos', count: allOrders.length },
              {
                key: 'transfer',
                label: 'Transferencias SPEI',
                count: financialSummary.transferCount,
                alertCount: financialSummary.pendingTransferCount,
              },
              {
                key: 'cash',
                label: 'Efectivo',
                count: financialSummary.cashCount,
              },
              {
                key: 'card',
                label: 'Tarjeta',
                count: financialSummary.cardCount,
              },
            ].map((tab) => {
              const active = filters.method === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setMethodFilter(tab.key as PaymentFilterMethod)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap flex items-center gap-1.5 transition-all ${
                    active
                      ? 'bg-accent text-white shadow-xs'
                      : 'bg-surface-raised border border-line text-text-secondary hover:text-text-primary'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                      active
                        ? 'bg-white/20 text-white'
                        : 'bg-surface text-text-muted'
                    }`}
                  >
                    {tab.count}
                  </span>
                  {tab.alertCount && tab.alertCount > 0 ? (
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                  ) : null}
                </button>
              );
            })}
          </div>

          {/* Filtro por Estado de Cobro */}
          <div className="flex items-center gap-1.5 shrink-0 pl-2 border-l border-line">
            {[
              { key: 'all', label: 'Todos los Estados' },
              { key: 'pending', label: 'Por Validar', alert: financialSummary.pendingTotalCount > 0 },
              { key: 'paid', label: 'Pagados' },
              { key: 'cancelled', label: 'Cancelados' },
            ].map((st) => {
              const active = filters.status === st.key;
              return (
                <button
                  key={st.key}
                  type="button"
                  onClick={() => setStatusFilter(st.key as PaymentFilterStatus)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                    active
                      ? 'bg-text-primary text-surface-card'
                      : 'bg-surface text-text-muted hover:text-text-primary border border-line'
                  }`}
                >
                  {st.label}
                  {st.alert && st.key === 'pending' && (
                    <span className="ml-1 text-[10px] text-amber-500 font-extrabold">
                      ({financialSummary.pendingTotalCount})
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ─── 3. Lista de Pedidos & Conciliación ─────────────────────────────── */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((idx) => (
            <div
              key={idx}
              className="bg-surface-card rounded-3xl p-5 border border-line shadow-card space-y-4"
            >
              <div className="flex justify-between items-center pb-3 border-b border-line">
                <Skeleton className="h-5 w-24 rounded-lg" />
                <Skeleton className="h-6 w-16 rounded-md" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-3/4 rounded" />
                <Skeleton className="h-4 w-1/2 rounded" />
              </div>
              <Skeleton className="h-16 w-full rounded-2xl" />
              <div className="flex gap-2">
                <Skeleton className="h-9 flex-1 rounded-xl" />
                <Skeleton className="h-9 flex-1 rounded-xl" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="bg-surface-card rounded-3xl p-10 border border-line text-center space-y-3 shadow-card">
          <div className="w-12 h-12 rounded-2xl bg-surface-raised border border-line text-text-muted flex items-center justify-center mx-auto">
            <Receipt className="w-6 h-6" />
          </div>
          <h3 className="text-base font-black text-text-primary">
            No se encontraron pedidos con estos filtros
          </h3>
          <p className="text-xs text-text-secondary max-w-sm mx-auto">
            Intenta cambiar el criterio de búsqueda, seleccionar otro método de pago o restablecer los filtros.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={resetFilters}
            className="text-xs font-bold mt-2"
          >
            Restablecer Filtros
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredOrders.map((order) => {
            const isUpdating = updatingOrderId === order.id;
            const isPaid = order.paymentStatus === 'paid';
            const isCancelled = order.paymentStatus === 'cancelled' || order.status === 'cancelled';
            const isSPEI = order.paymentMethod === 'transfer';
            const isCopied = copiedFolioId === order.id;
            const normalizedItems = normalizeOrderItems(order.items);
            const statusConfig = ORDER_STATUS_CONFIGS[order.status] || ORDER_STATUS_CONFIGS.new;
            const location = formatDeliveryLocation(order.delivery, order.orderMode);

            return (
              <div
                key={order.id}
                className={`bg-surface-card rounded-3xl p-5 border shadow-card transition-all space-y-4 flex flex-col justify-between ${
                  !isPaid && isSPEI && !isCancelled
                    ? 'border-amber-500/40 ring-1 ring-amber-500/20'
                    : 'border-line hover:border-accent/40'
                }`}
              >
                {/* Cabecera de la Tarjeta */}
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2 border-b border-line pb-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-base font-black text-text-primary tracking-tight">
                          #{order.folio}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => handleCopyFolio(order, e)}
                          className="p-1 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-raised transition-colors"
                          title="Copiar folio"
                        >
                          {isCopied ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-accent" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>

                      <div className="flex items-center gap-1.5 flex-wrap">
                        {/* Badge de Método de Pago */}
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold uppercase tracking-wider border ${
                            isSPEI
                              ? 'bg-blue-500/15 text-blue-600 border-blue-500/20 dark:text-blue-400'
                              : order.paymentMethod === 'cash'
                              ? 'bg-emerald-500/15 text-emerald-600 border-emerald-500/20 dark:text-emerald-400'
                              : 'bg-purple-500/15 text-purple-600 border-purple-500/20 dark:text-purple-400'
                          }`}
                        >
                          {isSPEI ? 'SPEI / Transf.' : order.paymentMethod === 'cash' ? 'Efectivo' : 'Tarjeta'}
                        </span>

                        {/* Badge de Estado Operativo */}
                        <span
                          className={`inline-flex items-center px-2 py-0.2 rounded-full text-[10px] font-bold border ${statusConfig.badgeClass}`}
                        >
                          {statusConfig.shortLabel}
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-xl font-black text-accent block">
                        {formatCurrency(order.total)}
                      </span>
                      <span
                        className={`inline-block text-[10px] font-extrabold uppercase px-2 py-0.2 rounded-md border ${
                          isPaid
                            ? 'bg-emerald-500/15 text-emerald-600 border-emerald-500/20 dark:text-emerald-400'
                            : isCancelled
                            ? 'bg-red-500/15 text-red-600 border-red-500/20 dark:text-red-400'
                            : 'bg-amber-500/15 text-amber-600 border-amber-500/20 dark:text-amber-400 animate-pulse'
                        }`}
                      >
                        {isPaid ? 'Pagado' : isCancelled ? 'Cancelado' : 'Por Validar'}
                      </span>
                    </div>
                  </div>

                  {/* Datos del Cliente y Entrega */}
                  <div className="space-y-1 text-xs">
                    <div className="flex items-center justify-between text-text-primary font-bold">
                      <span>{order.customerName}</span>
                      <span className="text-text-muted font-medium text-[11px]">
                        {formatOrderTime(order.createdAt)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-text-secondary text-[11px]">
                      <div className="flex items-center gap-1 truncate max-w-[190px]">
                        <MapPin className="w-3 h-3 text-accent shrink-0" />
                        <span className="truncate">{location}</span>
                      </div>
                      <span className="font-mono text-text-primary">
                        {order.customerPhone}
                      </span>
                    </div>
                  </div>

                  {/* Digest de Ítems */}
                  <div className="p-3 rounded-2xl bg-surface-raised border border-line text-xs space-y-1">
                    {normalizedItems.map((item, idx) => (
                      <div
                        key={item.id || idx}
                        className="flex justify-between items-baseline text-text-primary font-medium"
                      >
                        <span className="truncate pr-2">
                          <strong className="text-accent">{item.qty}x</strong> {item.name}
                        </span>
                        <span className="text-text-muted text-[11px] shrink-0">
                          {formatCurrency(item.lineTotal || item.unitPrice * item.qty)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* ─── Acciones y 1-Clic Validation ───────────────────────────── */}
                <div className="space-y-2 pt-2 border-t border-line">
                  {/* Botón de 1-Clic: Validar Pago / Revertir */}
                  {!isCancelled && (
                    <Button
                      type="button"
                      variant={isPaid ? 'secondary' : 'default'}
                      size="sm"
                      onClick={(e) => handleTogglePaymentStatus(order, e)}
                      disabled={isUpdating || isUpdatingPayment}
                      className={`w-full text-xs font-bold flex items-center justify-center gap-1.5 ${
                        !isPaid
                          ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm'
                          : 'text-text-secondary hover:text-text-primary'
                      }`}
                    >
                      {isUpdating ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : isPaid ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Pago Validado (Click para revertir)</span>
                        </>
                      ) : (
                        <>
                          <Check className="w-3.5 h-3.5 text-white" />
                          <span>1-Clic: Validar Pago</span>
                        </>
                      )}
                    </Button>
                  )}

                  {/* Botones secundarios: Ticket & WhatsApp */}
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedTicketOrder(order)}
                      className="text-xs font-bold flex items-center justify-center gap-1.5"
                    >
                      <FileText className="w-3.5 h-3.5 text-accent" />
                      <span>Ver Ticket</span>
                    </Button>

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedWhatsAppOrder(order)}
                      className="text-xs font-bold flex items-center justify-center gap-1.5 text-emerald-600 hover:text-emerald-700"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>WhatsApp</span>
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ─── 4. Modales de Ticket y WhatsApp ───────────────────────────────── */}
      <OrderTicketModal
        order={selectedTicketOrder}
        isOpen={Boolean(selectedTicketOrder)}
        onClose={() => setSelectedTicketOrder(null)}
        onOpenWhatsApp={(order) => {
          setSelectedTicketOrder(null);
          setSelectedWhatsAppOrder(order);
        }}
      />

      <WhatsAppActionModal
        order={selectedWhatsAppOrder}
        isOpen={Boolean(selectedWhatsAppOrder)}
        onClose={() => setSelectedWhatsAppOrder(null)}
      />
    </div>
  );
}
