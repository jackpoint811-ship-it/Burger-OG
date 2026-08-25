/**
 * PedidosView.tsx — PR-V3-09 / Refinamiento Operativo V3
 *
 * Vista principal del módulo de Pedidos en Chekeo V3:
 * - Nivel 1: Filtro de Riel Horizontal de Fechas (14 días + Hoy + Anteriores + Todos)
 * - Nivel 2: Barra Unificada con Buscador Universal, Ribbon de Estados (con 🗑️ Archivados),
 *   botón discreto de Filtros Avanzados y auto-refresco a 15s.
 * - Selección múltiple y Barra Flotante de Acciones en Lote (BatchActionBar) para limpieza de turno.
 * - Modal de confirmación seguro (BatchConfirmModal).
 * - Lista de comandas con realce de pedido prioritario (OrderCard V3).
 * - Drawer de detalle completo y modal de cancelación segura.
 */

import React, { useState, useMemo } from 'react';
import type { OrderV2 } from '@config/index';
import {
  useChekeoOrdersQuery,
  useArchiveOrderMutation,
  useUnarchiveOrderMutation,
  useBatchArchiveOrdersMutation,
} from '../../features/orders';
import {
  OrdersFilterBar,
  OrdersList,
  OrderDetailDrawer,
  CancelOrderModal,
  BatchActionBar,
  BatchConfirmModal,
  type OrdersFilterState,
} from '../orders';
import {
  HorizontalDateCalendarFilter,
  extractOrderTargetDate,
} from '../shared/HorizontalDateCalendarFilter';

export function PedidosView() {
  const [selectedDate, setSelectedDate] = useState<string>('today');
  const [filters, setFilters] = useState<OrdersFilterState>({
    search: '',
    status: 'all',
    mode: 'all',
    tower: 'all',
    autoRefresh: true,
  });

  const [selectedOrderDetail, setSelectedOrderDetail] = useState<OrderV2 | null>(null);
  const [orderToCancel, setOrderToCancel] = useState<OrderV2 | null>(null);
  const [selectedOrderIds, setSelectedOrderIds] = useState<Set<string>>(new Set());
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [batchBusy, setBatchBusy] = useState(false);

  // Mutaciones de TanStack Query
  const archiveMutation = useArchiveOrderMutation();
  const unarchiveMutation = useUnarchiveOrderMutation();
  const batchArchiveMutation = useBatchArchiveOrdersMutation();

  // Hook de consulta TanStack Query v5 (Órdenes activas y archivadas)
  const {
    orders,
    archivedOrders,
    counts,
    isLoading,
    isFetching,
    refetch,
  } = useChekeoOrdersQuery({
    autoRefresh: filters.autoRefresh,
    refetchIntervalMs: 15000,
  });

  const isArchivedView = filters.status === 'archived';
  const baseOrderPool = isArchivedView ? archivedOrders : orders;

  // Extraer lista única de torres/ubicaciones presentes en los pedidos
  const availableTowers = useMemo(() => {
    const towersSet = new Set<string>();
    orders.forEach((order) => {
      const location = order.delivery?.location?.trim();
      if (location) {
        const match = location.match(/^(Torre\s+[^•-]+)/i);
        if (match) {
          towersSet.add(match[1].trim());
        } else {
          towersSet.add(location.split('•')[0].trim());
        }
      }
    });
    return Array.from(towersSet);
  }, [orders]);

  // Filtrado de pedidos según los criterios activos
  const filteredOrders = useMemo(() => {
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    return baseOrderPool.filter((order) => {
      // 1. Filtro por Fecha de Entrega (Riel Horizontal)
      if (selectedDate !== 'all') {
        const targetDate = extractOrderTargetDate(order, todayStr);
        if (selectedDate === 'today' && targetDate !== todayStr) {
          return false;
        }
        if (selectedDate === 'past' && targetDate >= todayStr) {
          return false;
        }
        if (selectedDate !== 'today' && selectedDate !== 'past' && targetDate !== selectedDate) {
          return false;
        }
      }

      // 2. Filtro de Búsqueda por texto (Folio, Cliente, Teléfono, Notas, Torre o Ítems)
      if (filters.search.trim()) {
        const term = filters.search.toLowerCase().trim();
        const matchesFolio = order.folio.toLowerCase().includes(term);
        const matchesName = order.customerName.toLowerCase().includes(term);
        const matchesPhone = order.customerPhone.toLowerCase().includes(term);
        const matchesNotes = order.notes?.toLowerCase().includes(term) ?? false;
        const matchesLocation = (order.delivery?.location || '').toLowerCase().includes(term);
        const matchesItems = order.items.some((item) =>
          item.name.toLowerCase().includes(term)
        );

        if (
          !matchesFolio &&
          !matchesName &&
          !matchesPhone &&
          !matchesNotes &&
          !matchesLocation &&
          !matchesItems
        ) {
          return false;
        }
      }

      // 3. Filtro de Estado (Si no es 'all' ni 'archived')
      if (filters.status !== 'all' && filters.status !== 'archived') {
        const targetDate = extractOrderTargetDate(order, todayStr);
        const isOrderToday = targetDate === todayStr;
        const displayStatus = order.status === 'new' && !isOrderToday ? 'preparing' : order.status;
        if (displayStatus !== filters.status) {
          return false;
        }
      }

      // 4. Filtro de Modo (Pickup / Delivery)
      if (filters.mode !== 'all' && order.orderMode !== filters.mode) {
        return false;
      }

      // 5. Filtro de Torre / Ubicación
      if (filters.tower !== 'all') {
        const orderLoc = (order.delivery?.location || '').toLowerCase();
        if (!orderLoc.includes(filters.tower.toLowerCase())) {
          return false;
        }
      }

      return true;
    });
  }, [baseOrderPool, filters, selectedDate]);

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

  const selectedOrdersList = useMemo(() => {
    return baseOrderPool.filter((o) => selectedOrderIds.has(o.id));
  }, [baseOrderPool, selectedOrderIds]);

  const activeSelectedCount = useMemo(() => {
    return selectedOrdersList.filter((o) => o.status !== 'cancelled').length;
  }, [selectedOrdersList]);

  const cancelledSelectedCount = useMemo(() => {
    return selectedOrdersList.filter((o) => o.status === 'cancelled').length;
  }, [selectedOrdersList]);

  // Ejecución de Archivado en Lote
  const handleBatchArchiveClick = () => {
    if (selectedOrderIds.size === 0) return;
    if (activeSelectedCount > 0) {
      setConfirmModalOpen(true);
    } else {
      void handleExecuteBatchArchive();
    }
  };

  const handleExecuteBatchArchive = async () => {
    if (selectedOrderIds.size === 0) return;
    setBatchBusy(true);
    try {
      await batchArchiveMutation.mutateAsync({
        orderIds: Array.from(selectedOrderIds),
        cancelReason: 'Limpieza de turno',
      });
      setSelectedOrderIds(new Set());
      setConfirmModalOpen(false);
      refetch();
    } catch {
      // Error manejado por query mutation
    } finally {
      setBatchBusy(false);
    }
  };

  // Ejecución de Restauración en Lote
  const handleExecuteBatchRestore = async () => {
    if (selectedOrderIds.size === 0) return;
    setBatchBusy(true);
    try {
      for (const id of Array.from(selectedOrderIds)) {
        await unarchiveMutation.mutateAsync({ orderId: id });
      }
      setSelectedOrderIds(new Set());
      refetch();
    } catch {
      // Error manejado por query mutation
    } finally {
      setBatchBusy(false);
    }
  };

  // Acciones individuales
  const handleArchiveOrder = async (order: OrderV2) => {
    setBatchBusy(true);
    try {
      if (order.status !== 'cancelled') {
        await batchArchiveMutation.mutateAsync({
          orderIds: [order.id],
          cancelReason: 'Cancelado para basurero',
        });
      } else {
        await archiveMutation.mutateAsync({ orderId: order.id });
      }
      refetch();
    } finally {
      setBatchBusy(false);
    }
  };

  const handleUnarchiveOrder = async (order: OrderV2) => {
    setBatchBusy(true);
    try {
      await unarchiveMutation.mutateAsync({ orderId: order.id });
      refetch();
    } finally {
      setBatchBusy(false);
    }
  };

  // Mantener actualizado el pedido en el drawer si cambian los datos en segundo plano
  const currentDetailOrder = useMemo(() => {
    if (!selectedOrderDetail) return null;
    return baseOrderPool.find((o) => o.id === selectedOrderDetail.id) || selectedOrderDetail;
  }, [baseOrderPool, selectedOrderDetail]);

  const handleResetFilters = () => {
    setSelectedDate('all');
    setFilters({
      search: '',
      status: 'all',
      mode: 'all',
      tower: 'all',
      autoRefresh: true,
    });
    setSelectedOrderIds(new Set());
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-300 pb-16">
      {/* Nivel 1: Riel Horizontal de Fechas */}
      <div className="bg-surface-card p-4 rounded-3xl border border-line shadow-xs">
        <HorizontalDateCalendarFilter
          orders={baseOrderPool}
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
        />
      </div>

      {/* Nivel 2: Barra de Filtros Unificada (Buscador + Ribbon + Filtros Popover) */}
      <OrdersFilterBar
        filters={filters}
        onFilterChange={setFilters}
        counts={counts}
        availableTowers={availableTowers}
        isFetching={isFetching}
        onRefresh={() => refetch()}
      />

      {/* Lista de Pedidos en Grid */}
      <OrdersList
        orders={filteredOrders}
        isLoading={isLoading}
        totalUnfilteredCount={baseOrderPool.length}
        selectedOrderIds={selectedOrderIds}
        onToggleSelectOrder={handleToggleSelectOrder}
        onToggleSelectAll={handleToggleSelectAll}
        isArchivedView={isArchivedView}
        onOpenDetail={(order) => setSelectedOrderDetail(order)}
        onOpenCancel={(order) => setOrderToCancel(order)}
        onArchiveOrder={handleArchiveOrder}
        onUnarchiveOrder={handleUnarchiveOrder}
        onResetFilters={handleResetFilters}
      />

      {/* Barra Flotante Inferior de Acciones en Lote */}
      <BatchActionBar
        selectedCount={selectedOrderIds.size}
        activeCount={activeSelectedCount}
        cancelledCount={cancelledSelectedCount}
        isArchivedView={isArchivedView}
        onClearSelection={handleClearSelection}
        onBatchArchive={handleBatchArchiveClick}
        onBatchRestore={handleExecuteBatchRestore}
        busy={batchBusy}
      />

      {/* Modal de Confirmación de Archivado Masivo */}
      <BatchConfirmModal
        open={confirmModalOpen}
        onClose={() => setConfirmModalOpen(false)}
        onConfirm={handleExecuteBatchArchive}
        totalCount={selectedOrderIds.size}
        activeCount={activeSelectedCount}
        cancelledCount={cancelledSelectedCount}
        busy={batchBusy}
      />

      {/* Drawer de Detalle Completo de Pedido */}
      <OrderDetailDrawer
        order={currentDetailOrder}
        open={Boolean(selectedOrderDetail)}
        onClose={() => setSelectedOrderDetail(null)}
        onOpenCancelModal={(order) => {
          setSelectedOrderDetail(null);
          setOrderToCancel(order);
        }}
      />

      {/* Modal de Cancelación de Pedido */}
      <CancelOrderModal
        order={orderToCancel}
        open={Boolean(orderToCancel)}
        onClose={() => setOrderToCancel(null)}
      />
    </div>
  );
}
