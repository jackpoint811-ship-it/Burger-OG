/**
 * PagosView.tsx — Chekeo V3 Pagos Refinement
 *
 * Vista principal y orquestador del módulo de Pagos y Conciliación:
 * - Nivel 1: Riel Horizontal de Fechas (14 días CDMX + Hoy + Anteriores + Todos).
 * - Nivel 2: 4 Tarjetas KPI financieras con click-to-filter inteligente.
 * - Nivel 3: Barra de Control Unificada con Buscador Universal, botón BBVA, Popover de Filtros y Ribbon dual.
 * - Nivel 4: Lista responsiva de tarjetas con 3 Hechos Clave, acciones 1-clic y select-all.
 * - Nivel 5: Barra Flotante de Acciones en Lote (Validar / Revertir / Copiar Arqueo) con modal de confirmación.
 * - Modales integrados: Ticket Térmico 80mm, WhatsApp Bridge, Cuenta Bancaria BBVA y Detalle Completo.
 */

import React, { useState, useMemo } from 'react';
import type { OrderV2 } from '@config/index';
import {
  usePayments,
  generateBatchPaymentSummaryText,
  type PaymentFilterMethod,
} from '../../features/payments';
import {
  PaymentPeriodSelector,
  PaymentKpiHeader,
  PaymentsFilterBar,
  PaymentsList,
  PaymentBatchActionBar,
  PaymentBatchConfirmModal,
  BankDetailsModal,
  OrderTicketModal,
  WhatsAppActionModal,
} from '../payments';
import { OrderDetailDrawer } from '../orders/OrderDetailDrawer';

export function PagosView() {
  const {
    allOrders,
    periodOrders,
    periodOrdersCount,
    filteredOrders,
    financialSummary,
    availableTowers,
    isLoading,
    isFetching,
    refetch,
    filters,
    setSearch,
    setSelectedDate,
    setMethodFilter,
    setStatusFilter,
    setModeFilter,
    setTowerFilter,
    setAutoRefresh,
    resetFilters,
    markAsPaid,
    markAsPending,
    markBatchAsPaid,
    markBatchAsPending,
  } = usePayments();

  // Estados de modales interactivos
  const [selectedTicketOrder, setSelectedTicketOrder] = useState<OrderV2 | null>(null);
  const [selectedWhatsAppOrder, setSelectedWhatsAppOrder] = useState<OrderV2 | null>(null);
  const [selectedDetailOrder, setSelectedDetailOrder] = useState<OrderV2 | null>(null);
  const [bankDetailsOpen, setBankDetailsOpen] = useState(false);

  // Estados de selección múltiple y acciones en lote
  const [selectedOrderIds, setSelectedOrderIds] = useState<Set<string>>(new Set());
  const [batchConfirmOpen, setBatchConfirmOpen] = useState(false);
  const [batchActionType, setBatchActionType] = useState<'validate' | 'revert'>('validate');
  const [batchBusy, setBatchBusy] = useState(false);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);

  // Acción de 1-clic desde tarjeta
  const handleTogglePaymentStatus = async (order: OrderV2) => {
    setUpdatingOrderId(order.id);
    try {
      if (order.paymentStatus === 'paid') {
        await markAsPending(order.id, 'Marcado como por confirmar desde módulo de Pagos');
      } else {
        await markAsPaid(order.id, 'Pago confirmado en módulo de Pagos');
      }
    } finally {
      setUpdatingOrderId(null);
    }
  };

  // Click inteligente en KPI "Por confirmar" -> Alterna filtro 'pending' dentro del período seleccionado
  const handleFilterByPending = () => {
    setStatusFilter((prev) => (prev === 'pending' ? 'all' : 'pending'));
  };

  // Click inteligente en KPI de método -> Alterna el método seleccionado
  const handleFilterByMethod = (method: PaymentFilterMethod) => {
    setMethodFilter((prev) => (prev === method ? 'all' : method));
  };

  // Selección múltiple
  const handleToggleSelectOrder = (orderId: string) => {
    setSelectedOrderIds((prev) => {
      const next = new Set(prev);
      if (next.has(orderId)) {
        next.delete(orderId);
      } else {
        next.add(orderId);
      }
      return next;
    });
  };

  const handleToggleSelectAll = () => {
    if (selectedOrderIds.size >= filteredOrders.length && filteredOrders.length > 0) {
      setSelectedOrderIds(new Set());
    } else {
      setSelectedOrderIds(new Set(filteredOrders.map((o) => o.id)));
    }
  };

  const handleClearSelection = () => {
    setSelectedOrderIds(new Set());
  };

  // Lista de órdenes seleccionadas actualmente
  const selectedOrdersList = useMemo(() => {
    return allOrders.filter((o) => selectedOrderIds.has(o.id));
  }, [allOrders, selectedOrderIds]);

  const selectedTotalAmount = useMemo(() => {
    return selectedOrdersList.reduce((sum, o) => sum + (o.total ?? 0), 0);
  }, [selectedOrdersList]);

  const selectedPendingCount = useMemo(() => {
    return selectedOrdersList.filter((o) => o.paymentStatus === 'pending').length;
  }, [selectedOrdersList]);

  const selectedPaidCount = useMemo(() => {
    return selectedOrdersList.filter((o) => o.paymentStatus === 'paid').length;
  }, [selectedOrdersList]);

  // Apertura de modal de confirmación en lote
  const handleBatchValidateClick = () => {
    setBatchActionType('validate');
    setBatchConfirmOpen(true);
  };

  const handleBatchRevertClick = () => {
    setBatchActionType('revert');
    setBatchConfirmOpen(true);
  };

  // Ejecución de la mutación en lote
  const handleExecuteBatchAction = async () => {
    if (selectedOrderIds.size === 0) return;
    setBatchBusy(true);
    try {
      const ids = Array.from(selectedOrderIds);
      if (batchActionType === 'validate') {
        await markBatchAsPaid(ids, 'Confirmación en lote desde Chekeo Pagos');
      } else {
        await markBatchAsPending(ids, 'Reversión en lote a por confirmar desde Chekeo Pagos');
      }
      setSelectedOrderIds(new Set());
      setBatchConfirmOpen(false);
      refetch();
    } finally {
      setBatchBusy(false);
    }
  };

  // Copiar resumen de arqueo al portapapeles
  const handleCopyBatchSummary = () => {
    const text = generateBatchPaymentSummaryText(selectedOrdersList);
    navigator.clipboard.writeText(text);
  };

  // Mantener actualizado el pedido en el drawer de detalle si se actualiza en segundo plano
  const currentDetailOrder = useMemo(() => {
    if (!selectedDetailOrder) return null;
    return allOrders.find((o) => o.id === selectedDetailOrder.id) || selectedDetailOrder;
  }, [allOrders, selectedDetailOrder]);

  return (
    <div className="space-y-5 animate-in fade-in duration-300 pb-16">
      {/* ─── 1. Selector de Período Financiero & Mini Calendario ───────────── */}
      <PaymentPeriodSelector
        orders={allOrders}
        selectedDate={filters.selectedDate}
        onSelectDate={setSelectedDate}
      />

      {/* ─── 2. Header Financiero / 4 KPIs Reactivos (Click-to-Filter) ───── */}
      <PaymentKpiHeader
        financialSummary={financialSummary}
        selectedDate={filters.selectedDate}
        selectedMethod={filters.method}
        selectedStatus={filters.status}
        onFilterByPending={handleFilterByPending}
        onFilterByMethod={handleFilterByMethod}
      />

      {/* ─── 3. Barra de Filtros y Búsqueda Unificada ──────────────────────── */}
      <PaymentsFilterBar
        search={filters.search}
        onSearchChange={setSearch}
        method={filters.method}
        onMethodChange={setMethodFilter}
        status={filters.status}
        onStatusChange={setStatusFilter}
        tower={filters.tower}
        onTowerChange={setTowerFilter}
        isFetching={isFetching}
        financialSummary={financialSummary}
        allOrdersCount={periodOrdersCount}
        onOpenBankDetails={() => setBankDetailsOpen(true)}
        onResetFilters={resetFilters}
      />

      {/* ─── 4. Lista y Grilla de Cobros ────────────────────────────────────── */}
      <PaymentsList
        orders={filteredOrders}
        isLoading={isLoading}
        totalUnfilteredCount={allOrders.length}
        selectedOrderIds={selectedOrderIds}
        onToggleSelectOrder={handleToggleSelectOrder}
        onToggleSelectAll={handleToggleSelectAll}
        updatingOrderId={updatingOrderId}
        onTogglePaymentStatus={handleTogglePaymentStatus}
        onOpenTicket={(order) => setSelectedTicketOrder(order)}
        onOpenWhatsApp={(order) => setSelectedWhatsAppOrder(order)}
        onOpenDetail={(order) => setSelectedDetailOrder(order)}
        onResetFilters={resetFilters}
      />

      {/* ─── 5. Barra Flotante de Acciones en Lote ─────────────────────────── */}
      <PaymentBatchActionBar
        selectedCount={selectedOrderIds.size}
        selectedTotalAmount={selectedTotalAmount}
        pendingCount={selectedPendingCount}
        paidCount={selectedPaidCount}
        onClearSelection={handleClearSelection}
        onBatchValidate={handleBatchValidateClick}
        onBatchRevert={handleBatchRevertClick}
        onCopySummary={handleCopyBatchSummary}
        busy={batchBusy}
      />

      {/* ─── 6. Modales Interactivos ────────────────────────────────────────── */}
      {/* Modal de Confirmación de Operación Masiva */}
      <PaymentBatchConfirmModal
        open={batchConfirmOpen}
        onClose={() => setBatchConfirmOpen(false)}
        onConfirm={handleExecuteBatchAction}
        actionType={batchActionType}
        totalCount={selectedOrderIds.size}
        totalAmount={selectedTotalAmount}
        busy={batchBusy}
      />

      {/* Modal de Cuenta Bancaria BBVA */}
      <BankDetailsModal
        open={bankDetailsOpen}
        onClose={() => setBankDetailsOpen(false)}
      />

      {/* Modal de Ticket Térmico 80mm */}
      <OrderTicketModal
        order={selectedTicketOrder}
        isOpen={Boolean(selectedTicketOrder)}
        onClose={() => setSelectedTicketOrder(null)}
        onOpenWhatsApp={(order) => {
          setSelectedTicketOrder(null);
          setSelectedWhatsAppOrder(order);
        }}
      />

      {/* Modal de WhatsApp Bridge */}
      <WhatsAppActionModal
        order={selectedWhatsAppOrder}
        isOpen={Boolean(selectedWhatsAppOrder)}
        onClose={() => setSelectedWhatsAppOrder(null)}
      />

      {/* Drawer de Detalle Completo de la Comanda */}
      <OrderDetailDrawer
        order={currentDetailOrder}
        open={Boolean(selectedDetailOrder)}
        onClose={() => setSelectedDetailOrder(null)}
      />
    </div>
  );
}
