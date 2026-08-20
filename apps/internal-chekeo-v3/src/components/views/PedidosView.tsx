/**
 * PedidosView.tsx — PR-V3-09 / Refinamiento Operativo V3
 *
 * Vista principal del módulo de Pedidos en Chekeo V3:
 * - Filtro de Riel Horizontal de Fechas (14 días + Hoy + Anteriores + Todos)
 * - Consulta de pedidos en tiempo real con TanStack Query y auto-refresco a 15s
 * - Filtrado reactivo por texto (folio, cliente, teléfono, notas), estado, modo y torre
 * - Lista de comandas con acciones de avance de estado
 * - Drawer de detalle completo y modal de cancelación segura.
 */

import React, { useState, useMemo } from 'react';
import type { OrderV2 } from '@config/index';
import { useChekeoOrdersQuery } from '../../features/orders';
import {
  OrdersFilterBar,
  OrdersList,
  OrderDetailDrawer,
  CancelOrderModal,
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

  // Hook de consulta TanStack Query v5
  const {
    orders,
    counts,
    isLoading,
    isFetching,
    refetch,
  } = useChekeoOrdersQuery({
    autoRefresh: filters.autoRefresh,
    refetchIntervalMs: 15000,
  });

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

    return orders.filter((order) => {
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

      // 2. Filtro de Búsqueda por texto (Folio, Cliente, Teléfono o Notas)
      if (filters.search.trim()) {
        const term = filters.search.toLowerCase().trim();
        const matchesFolio = order.folio.toLowerCase().includes(term);
        const matchesName = order.customerName.toLowerCase().includes(term);
        const matchesPhone = order.customerPhone.toLowerCase().includes(term);
        const matchesNotes = order.notes?.toLowerCase().includes(term) ?? false;
        const matchesItems = order.items.some((item) =>
          item.name.toLowerCase().includes(term)
        );

        if (
          !matchesFolio &&
          !matchesName &&
          !matchesPhone &&
          !matchesNotes &&
          !matchesItems
        ) {
          return false;
        }
      }

      // 3. Filtro de Estado
      if (filters.status !== 'all' && order.status !== filters.status) {
        return false;
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
  }, [orders, filters, selectedDate]);

  // Mantener actualizado el pedido en el drawer si cambian los datos en segundo plano
  const currentDetailOrder = useMemo(() => {
    if (!selectedOrderDetail) return null;
    return orders.find((o) => o.id === selectedOrderDetail.id) || selectedOrderDetail;
  }, [orders, selectedOrderDetail]);

  const handleResetFilters = () => {
    setSelectedDate('all');
    setFilters({
      search: '',
      status: 'all',
      mode: 'all',
      tower: 'all',
      autoRefresh: true,
    });
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-300">
      {/* Riel Horizontal de Fechas */}
      <div className="bg-surface-card p-4 rounded-3xl border border-line shadow-xs">
        <HorizontalDateCalendarFilter
          orders={orders}
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
        />
      </div>

      {/* Barra de Filtros y Control */}
      <OrdersFilterBar
        filters={filters}
        onFilterChange={setFilters}
        counts={counts}
        availableTowers={availableTowers}
        isFetching={isFetching}
        onRefresh={() => refetch()}
      />

      {/* Lista de Pedidos */}
      <OrdersList
        orders={filteredOrders}
        isLoading={isLoading}
        totalUnfilteredCount={orders.length}
        onOpenDetail={(order) => setSelectedOrderDetail(order)}
        onOpenCancel={(order) => setOrderToCancel(order)}
        onResetFilters={handleResetFilters}
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
