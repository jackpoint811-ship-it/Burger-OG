/**
 * OrdersList.tsx — PR-V3-09
 *
 * Contenedor de lista y cuadrícula adaptativa de pedidos:
 * - Renderizado en cuadrícula responsive mobile-first
 * - Skeletons de carga suave
 * - Estados vacíos informativos con botón de restablecimiento de filtros.
 */

import React from 'react';
import { ShoppingBag, FilterX, RotateCcw } from 'lucide-react';
import { Skeleton } from '@ui/skeleton';
import { Button } from '@ui/button';
import type { OrderV2 } from '@config/index';
import { OrderCard } from './OrderCard';

export interface OrdersListProps {
  orders: OrderV2[];
  isLoading: boolean;
  totalUnfilteredCount: number;
  onOpenDetail: (order: OrderV2) => void;
  onOpenCancel: (order: OrderV2) => void;
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

      <div className="space-y-2">
        <Skeleton className="h-4 w-3/4 rounded-lg" />
        <Skeleton className="h-4 w-1/2 rounded-lg" />
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
  onOpenDetail,
  onOpenCancel,
  onResetFilters,
}: OrdersListProps) {
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
              ? 'No hay pedidos registrados'
              : 'No se encontraron pedidos con estos filtros'}
          </h3>
          <p className="text-xs text-text-secondary">
            {totalUnfilteredCount === 0
              ? 'Cuando los clientes completen órdenes desde la app pública aparecerán aquí automáticamente en tiempo real.'
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

  return (
    <div className="space-y-3">
      {/* Resumen de conteo */}
      <div className="flex items-center justify-between px-1 text-xs font-bold text-text-muted">
        <span>
          Mostrando {orders.length} {orders.length === 1 ? 'pedido' : 'pedidos'}
          {totalUnfilteredCount !== orders.length && ` de ${totalUnfilteredCount}`}
        </span>
      </div>

      {/* Grid de Pedidos */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {orders.map((order) => (
          <OrderCard
            key={order.id}
            order={order}
            onOpenDetail={onOpenDetail}
            onOpenCancel={onOpenCancel}
          />
        ))}
      </div>
    </div>
  );
}
