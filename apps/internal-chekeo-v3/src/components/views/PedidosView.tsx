/**
 * PedidosView.tsx — PR-V3-09
 *
 * Vista principal del módulo de Pedidos en Chekeo V3:
 * - Consulta de pedidos en tiempo real con TanStack Query y auto-refresco
 * - Filtrado reactivo por texto (folio, cliente, teléfono), estado, modo y torre
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

export function PedidosView() {
  const [filters, setFilters] = useState<OrdersFilterState>({
    search: '',
    status: 'all',
    mode: 'all',
    tower: 'all',
    dateHorizon: 'all',
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
    return orders.filter((order) => {
      // 1. Filtro de Búsqueda por texto (Folio, Cliente, Teléfono o Notas)
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

      // 2. Filtro de Estado
      if (filters.status !== 'all' && order.status !== filters.status) {
        return false;
      }

      // 3. Filtro de Modo (Pickup / Delivery)
      if (filters.mode !== 'all' && order.orderMode !== filters.mode) {
        return false;
      }

      // 4. Filtro de Torre / Ubicación
      if (filters.tower !== 'all') {
        const orderLoc = (order.delivery?.location || '').toLowerCase();
        if (!orderLoc.includes(filters.tower.toLowerCase())) {
          return false;
        }
      }

      // 5. Filtro de Horizonte de Fecha (Hoy / Mañana / Todos)
      if (filters.dateHorizon !== 'all') {
        const now = new Date();
        const orderDate = new Date(order.createdAt);
        const isSameDay =
          now.getFullYear() === orderDate.getFullYear() &&
          now.getMonth() === orderDate.getMonth() &&
          now.getDate() === orderDate.getDate();

        if (filters.dateHorizon === 'today' && !isSameDay) {
          return false;
        }

        if (filters.dateHorizon === 'tomorrow') {
          const tomorrow = new Date(now);
          tomorrow.setDate(tomorrow.getDate() + 1);
          const isTomorrow =
            tomorrow.getFullYear() === orderDate.getFullYear() &&
            tomorrow.getMonth() === orderDate.getMonth() &&
            tomorrow.getDate() === orderDate.getDate();

          if (!isTomorrow) return false;
        }
      }

      return true;
    });
  }, [orders, filters]);

  // Mantener actualizado el pedido en el drawer si cambian los datos en segundo plano
  const currentDetailOrder = useMemo(() => {
    if (!selectedOrderDetail) return null;
    return orders.find((o) => o.id === selectedOrderDetail.id) || selectedOrderDetail;
  }, [orders, selectedOrderDetail]);

  const handleResetFilters = () => {
    setFilters({
      search: '',
      status: 'all',
      mode: 'all',
      tower: 'all',
      dateHorizon: 'all',
      autoRefresh: true,
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
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
