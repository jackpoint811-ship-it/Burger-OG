/**
 * OrdersList.tsx — PR-V3-09 / Refinamiento V3
 *
 * Contenedor de lista y cuadrícula adaptativa de pedidos:
 * - Detección y realce de pedido prioritario / urgente
 * - Soporte para selección individual y checkbox maestro "Seleccionar todos"
 * - Skeletons de carga suave
 * - Estados vacíos informativos con botón de restablecimiento de filtros.
 */

import React, { useMemo } from 'react';
import { ShoppingBag, FilterX, RotateCcw } from 'lucide-react';
import { Skeleton } from '@ui/skeleton';
import { Button } from '@ui/button';
import type { OrderV2 } from '@config/index';
import { OrderCard } from './OrderCard';

export interface OrdersListProps {
  orders: OrderV2[];
  isLoading: boolean;
  totalUnfilteredCount: number;
  selectedOrderIds?: Set<string>;
  onToggleSelectOrder?: (orderId: string) => void;
  onToggleSelectAll?: () => void;
  isArchivedView?: boolean;
  onOpenDetail: (order: OrderV2) => void;
  onOpenCancel: (order: OrderV2) => void;
  onArchiveOrder?: (order: OrderV2) => void;
  onUnarchiveOrder?: (order: OrderV2) => void;
  onResetFilters?: () => void;
}

function OrderCardSkeleton() {
  return (
    <div className="bg-surface-card rounded-3xl p-5 border border-line shadow-card space-y-4">
      <div className="flex items-center justify-between border-b border-line pb-3">
        <div className="space-y-1.5">
          <Skeleton className="h-5 w-24 rounded-lg" />
          <div className="flex gap-2">
            <Skeleton className="h-4 w-16 rounded-full" />
            <Skeleton className="h-4 w-16 rounded-full" />
          </div>
        </div>
        <Skeleton className="h-7 w-20 rounded-xl" />
      </div>

      <div className="grid grid-cols-3 gap-2 p-2.5 rounded-2xl bg-surface-raised border border-line">
        <Skeleton className="h-8 rounded-lg" />
        <Skeleton className="h-8 rounded-lg" />
        <Skeleton className="h-8 rounded-lg" />
      </div>

      <div className="p-3 rounded-2xl bg-surface-raised border border-line space-y-2">
        <Skeleton className="h-4 w-full rounded-lg" />
        <Skeleton className="h-3 w-4/5 rounded-lg" />
        <Skeleton className="h-4 w-2/3 rounded-lg" />
      </div>

      <div className="flex gap-2 pt-2 border-t border-line">
        <Skeleton className="h-9 flex-1 rounded-xl" />
        <Skeleton className="h-9 w-20 rounded-xl" />
      </div>
    </div>
  );
}

export function OrdersList({
  orders,
  isLoading,
  totalUnfilteredCount,
  selectedOrderIds = new Set(),
  onToggleSelectOrder,
  onToggleSelectAll,
  isArchivedView = false,
  onOpenDetail,
  onOpenCancel,
  onArchiveOrder,
  onUnarchiveOrder,
  onResetFilters,
}: OrdersListProps) {
  // Detección automática del pedido prioritario (urgente)
  const priorityOrderId = useMemo(() => {
    if (isArchivedView || orders.length === 0) return null;
    const readyOrder = orders.find((o) => o.status === 'ready');
    if (readyOrder) return readyOrder.id;
    const preparingOrder = orders.find((o) => o.status === 'preparing');
    if (preparingOrder) return preparingOrder.id;
    const newOrder = orders.find((o) => o.status === 'new');
    if (newOrder) return newOrder.id;
    return null;
  }, [orders, isArchivedView]);

  // Estado de carga inicial
  if (isLoading && orders.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <Skeleton className="h-4 w-36 rounded-lg" />
          <Skeleton className="h-4 w-24 rounded-lg" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((idx) => (
            <OrderCardSkeleton key={idx} />
          ))}
        </div>
      </div>
    );
  }

  // Estado vacío: Sin resultados para los filtros seleccionados
  if (orders.length === 0) {
    return (
      <div className="bg-surface-card rounded-3xl border border-line p-8 sm:p-12 text-center space-y-4 shadow-card">
        <div className="w-16 h-16 rounded-3xl bg-surface-raised border border-line flex items-center justify-center mx-auto text-text-muted">
          {totalUnfilteredCount === 0 ? (
            <ShoppingBag className="w-8 h-8 text-accent/60" />
          ) : (
            <FilterX className="w-8 h-8 text-text-muted" />
          )}
        </div>
        <div className="max-w-md mx-auto space-y-1">
          <h3 className="text-base font-bold text-text-primary">
            {totalUnfilteredCount === 0
              ? isArchivedView
                ? 'El basurero de órdenes está vacío'
                : 'No hay pedidos registrados'
              : 'No se encontraron pedidos con estos filtros'}
          </h3>
          <p className="text-xs text-text-secondary">
            {totalUnfilteredCount === 0
              ? isArchivedView
                ? 'Cuando canceles pedidos o realices limpiezas de turno, aparecerán aquí para consulta o restauración.'
                : 'Cuando los clientes completen órdenes desde la app pública aparecerán aquí automáticamente en tiempo real.'
              : 'Intenta ajustar los términos de búsqueda, el estado seleccionado o el horizonte de fecha.'}
          </p>
        </div>
        {totalUnfilteredCount > 0 && onResetFilters && (
          <div className="pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onResetFilters}
              className="text-xs font-bold"
            >
              <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
              <span>Restablecer Filtros</span>
            </Button>
          </div>
        )}
      </div>
    );
  }

  const isAllSelected = selectedOrderIds.size > 0 && selectedOrderIds.size >= orders.length;

  return (
    <div className="space-y-3">
      {/* Resumen de conteo y Control Maestro de Selección */}
      <div className="flex items-center justify-between px-1 text-xs font-bold text-text-muted">
        <span>
          Mostrando {orders.length} {orders.length === 1 ? 'pedido' : 'pedidos'}
          {totalUnfilteredCount !== orders.length && ` de ${totalUnfilteredCount}`}
        </span>

        {onToggleSelectAll && (
          <label className="flex items-center gap-1.5 cursor-pointer text-text-secondary hover:text-text-primary select-none">
            <input
              type="checkbox"
              checked={isAllSelected}
              onChange={onToggleSelectAll}
              className="w-3.5 h-3.5 rounded border-line bg-surface text-accent focus:ring-accent cursor-pointer"
            />
            <span className="text-[11px]">
              {isAllSelected ? 'Deseleccionar todas' : `Seleccionar todas (${orders.length})`}
            </span>
          </label>
        )}
      </div>

      {/* Grid de Pedidos */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {orders.map((order) => (
          <OrderCard
            key={order.id}
            order={order}
            selected={selectedOrderIds.has(order.id)}
            onToggleSelect={onToggleSelectOrder}
            isPriority={order.id === priorityOrderId}
            isArchived={isArchivedView}
            onOpenDetail={onOpenDetail}
            onOpenCancel={onOpenCancel}
            onArchive={onArchiveOrder}
            onUnarchive={onUnarchiveOrder}
          />
        ))}
      </div>
    </div>
  );
}
