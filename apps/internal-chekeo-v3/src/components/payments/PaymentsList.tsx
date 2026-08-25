/**
 * PaymentsList.tsx — Chekeo V3 Pagos Refinement
 *
 * Grilla responsiva de comandas para conciliación de cobros:
 * - Selección masiva / Select All checkbox.
 * - Skeletons animados de alta fidelidad durante la carga.
 * - Estado vacío estilizado con icono de recibo, mensaje contextual y botón para restablecer.
 */

import React from 'react';
import { Receipt, CheckSquare, Square, RotateCcw } from 'lucide-react';
import { Button } from '@ui/button';
import { Skeleton } from '@ui/skeleton';
import type { OrderV2 } from '@config/index';
import { PaymentCard } from './PaymentCard';

export interface PaymentsListProps {
  orders: OrderV2[];
  isLoading: boolean;
  totalUnfilteredCount: number;
  selectedOrderIds: Set<string>;
  onToggleSelectOrder: (orderId: string) => void;
  onToggleSelectAll: () => void;
  updatingOrderId: string | null;
  onTogglePaymentStatus: (order: OrderV2) => void;
  onOpenTicket: (order: OrderV2) => void;
  onOpenWhatsApp: (order: OrderV2) => void;
  onOpenDetail: (order: OrderV2) => void;
  onResetFilters: () => void;
}

export function PaymentsList({
  orders,
  isLoading,
  totalUnfilteredCount,
  selectedOrderIds,
  onToggleSelectOrder,
  onToggleSelectAll,
  updatingOrderId,
  onTogglePaymentStatus,
  onOpenTicket,
  onOpenWhatsApp,
  onOpenDetail,
  onResetFilters,
}: PaymentsListProps) {
  const isAllSelected = orders.length > 0 && selectedOrderIds.size >= orders.length;

  if (isLoading) {
    return (
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
            <Skeleton className="h-12 w-full rounded-2xl" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-3/4 rounded" />
              <Skeleton className="h-4 w-1/2 rounded" />
            </div>
            <Skeleton className="h-20 w-full rounded-2xl" />
            <div className="space-y-2 pt-2">
              <Skeleton className="h-10 w-full rounded-xl" />
              <div className="grid grid-cols-3 gap-2">
                <Skeleton className="h-9 rounded-xl" />
                <Skeleton className="h-9 rounded-xl" />
                <Skeleton className="h-9 rounded-xl" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="bg-surface-card rounded-3xl p-10 border border-line text-center space-y-3 shadow-card animate-in fade-in duration-200">
        <div className="w-12 h-12 rounded-2xl bg-surface-raised border border-line text-text-muted flex items-center justify-center mx-auto shadow-xs">
          <Receipt className="w-6 h-6" />
        </div>
        <h3 className="text-base font-black text-text-primary">
          {totalUnfilteredCount === 0
            ? 'No hay cobros registrados en el sistema'
            : 'No se encontraron pedidos con estos filtros'}
        </h3>
        <p className="text-xs text-text-secondary max-w-md mx-auto leading-relaxed">
          {totalUnfilteredCount === 0
            ? 'Cuando los clientes generen órdenes desde la app pública o POS, aparecerán aquí para conciliación.'
            : 'Intenta cambiar el criterio de búsqueda, seleccionar otro método de pago o restablecer los filtros.'}
        </p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onResetFilters}
          className="text-xs font-bold mt-2 cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
          <span>Restablecer Filtros</span>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Barra de Selección Rápida */}
      <div className="flex items-center justify-between px-1 text-xs">
        <button
          type="button"
          onClick={onToggleSelectAll}
          className="flex items-center gap-2 font-bold text-text-secondary hover:text-text-primary transition-colors cursor-pointer select-none"
        >
          {isAllSelected ? (
            <CheckSquare className="w-4 h-4 text-accent" />
          ) : (
            <Square className="w-4 h-4 text-text-muted" />
          )}
          <span>
            {isAllSelected ? 'Deseleccionar todos' : 'Seleccionar todos'} ({orders.length})
          </span>
        </button>

        <span className="text-text-muted text-[11px] font-medium">
          {orders.length} {orders.length === 1 ? 'comanda visible' : 'comandas visibles'}
        </span>
      </div>

      {/* Grid de Tarjetas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {orders.map((order) => (
          <PaymentCard
            key={order.id}
            order={order}
            selected={selectedOrderIds.has(order.id)}
            onToggleSelect={onToggleSelectOrder}
            onTogglePaymentStatus={onTogglePaymentStatus}
            isUpdating={updatingOrderId === order.id}
            onOpenTicket={onOpenTicket}
            onOpenWhatsApp={onOpenWhatsApp}
            onOpenDetail={onOpenDetail}
          />
        ))}
      </div>
    </div>
  );
}
