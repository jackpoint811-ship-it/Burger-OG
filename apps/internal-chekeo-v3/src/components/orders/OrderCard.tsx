/**
 * OrderCard.tsx — PR-V3-09
 *
 * Tarjeta de pedido reactiva para el tablero de Pedidos de Chekeo V3:
 * - Folio destacado con botón de copiado rápido
 * - Badge de estado y modo (Pickup / Delivery)
 * - Ubicación y horario de entrega estandarizados
 * - Desglose visual de comanda (combos, guarniciones, remociones, extras y notas)
 * - Botones de acción rápida: Avance de estado, Ver detalle en Drawer y Cancelar.
 */

import React, { useState } from 'react';
import {
  MapPin,
  Clock,
  Phone,
  MessageCircle,
  ShoppingBag,
  Bike,
  Copy,
  CheckCircle2,
  FileText,
  Flame,
  Check,
  PackageCheck,
  Ban,
  Loader2,
  AlertTriangle,
} from 'lucide-react';
import { Badge } from '@ui/badge';
import { Button } from '@ui/button';
import type { OrderV2, OrderV2Status } from '@config/index';
import {
  normalizeOrderItems,
  ORDER_STATUS_CONFIGS,
  PAYMENT_METHOD_LABELS,
  PAYMENT_STATUS_CONFIGS,
  formatCurrency,
  formatOrderTime,
  formatDeliveryLocation,
  formatDeliverySchedule,
  getWhatsAppLink,
  useUpdateOrderStatusMutation,
} from '../../features/orders';

export interface OrderCardProps {
  order: OrderV2;
  onOpenDetail: (order: OrderV2) => void;
  onOpenCancel: (order: OrderV2) => void;
}

export function OrderCard({ order, onOpenDetail, onOpenCancel }: OrderCardProps) {
  const [copiedFolio, setCopiedFolio] = useState(false);
  const updateStatusMutation = useUpdateOrderStatusMutation();

  const normalizedItems = normalizeOrderItems(order.items);
  const statusConfig = ORDER_STATUS_CONFIGS[order.status] || ORDER_STATUS_CONFIGS.new;
  const paymentStatusConfig =
    PAYMENT_STATUS_CONFIGS[order.paymentStatus] || PAYMENT_STATUS_CONFIGS.pending;
  const isTerminal = order.status === 'delivered' || order.status === 'cancelled';

  const handleCopyFolio = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(order.folio);
    setCopiedFolio(true);
    setTimeout(() => setCopiedFolio(false), 2000);
  };

  const handleAdvanceStatus = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!statusConfig.nextStatus) return;

    await updateStatusMutation.mutateAsync({
      orderId: order.id,
      status: statusConfig.nextStatus,
    });
  };

  return (
    <div className="bg-surface-card rounded-3xl p-4 sm:p-5 border border-line shadow-card hover:border-accent/40 transition-all space-y-4 flex flex-col justify-between">
      {/* ─── Header: Folio, Estado y Total ─────────────────────────────────── */}
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-2 border-b border-line pb-3">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5">
              <span className="text-base font-black text-text-primary tracking-tight">
                #{order.folio}
              </span>
              <button
                type="button"
                onClick={handleCopyFolio}
                className="p-1 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-raised transition-colors"
                title="Copiar folio"
                aria-label="Copiar folio"
              >
                {copiedFolio ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-accent" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-extrabold uppercase tracking-wider border ${statusConfig.badgeClass}`}
              >
                {statusConfig.shortLabel}
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-surface-raised text-text-secondary border border-line">
                {order.orderMode === 'pickup' ? (
                  <>
                    <ShoppingBag className="w-3 h-3 text-accent" />
                    <span>Pickup</span>
                  </>
                ) : (
                  <>
                    <Bike className="w-3 h-3 text-accent" />
                    <span>Delivery</span>
                  </>
                )}
              </span>
            </div>
          </div>

          <div className="text-right">
            <span className="text-lg sm:text-xl font-black text-accent block">
              {formatCurrency(order.total)}
            </span>
            <span
              className={`inline-block text-[10px] font-extrabold uppercase px-2 py-0.2 rounded-md border ${paymentStatusConfig.badgeClass}`}
            >
              {paymentStatusConfig.label}
            </span>
          </div>
        </div>

        {/* ─── Datos de Ubicación y Cliente ──────────────────────────────────── */}
        <div className="space-y-1.5 text-xs">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 font-bold text-text-primary truncate">
              <MapPin className="w-3.5 h-3.5 text-accent shrink-0" />
              <span className="truncate">
                {formatDeliveryLocation(order.delivery, order.orderMode)}
              </span>
            </div>
            <span className="text-text-muted text-[11px] shrink-0 font-medium">
              {formatOrderTime(order.createdAt)}
            </span>
          </div>

          <div className="flex items-center justify-between gap-2 text-text-secondary">
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-text-muted shrink-0" />
              <span className="font-semibold">
                {formatDeliverySchedule(order.delivery, order.createdAt)}
              </span>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <span className="font-bold text-text-primary">{order.customerName}</span>
              <a
                href={getWhatsAppLink(
                  order.customerPhone,
                  `Hola ${order.customerName}, te contactamos de Burgers.exe sobre tu orden #${order.folio}:`
                )}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="p-1 rounded-md text-emerald-600 hover:bg-emerald-500/10 transition-colors"
                title="Escribir por WhatsApp"
                aria-label="WhatsApp"
              >
                <MessageCircle className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>

        {/* ─── Desglose de Comanda ───────────────────────────────────────────── */}
        <div className="p-3 rounded-2xl bg-surface-raised border border-line space-y-2 text-xs">
          {normalizedItems.map((item, idx) => (
            <div key={item.id || idx} className="space-y-1">
              <div className="flex justify-between items-baseline font-bold text-text-primary">
                <div className="flex items-center gap-1.5">
                  <span className="w-4 h-4 rounded bg-accent/15 text-accent text-[10px] font-black flex items-center justify-center">
                    {item.qty}
                  </span>
                  <span>{item.name}</span>
                </div>
                <span className="text-text-secondary font-semibold">
                  {formatCurrency(item.lineTotal || item.unitPrice * item.qty)}
                </span>
              </div>

              {/* Guarnición y Bebida de combo */}
              {(item.garnish || item.includedDrink) && (
                <div className="pl-5 space-y-0.5 text-[11px] text-text-secondary font-medium">
                  {item.garnish && (
                    <div className="flex items-center gap-1">
                      <span>🍟 {item.garnish.name}</span>
                      {item.garnish.upcharge ? (
                        <span className="text-accent font-bold">
                          (+{formatCurrency(item.garnish.upcharge)})
                        </span>
                      ) : null}
                    </div>
                  )}
                  {item.includedDrink && <div>🥤 {item.includedDrink.name}</div>}
                </div>
              )}

              {/* Remociones */}
              {item.removedIngredients.length > 0 && (
                <div className="pl-5 flex flex-wrap gap-1">
                  {item.removedIngredients.map((ing, i) => (
                    <span
                      key={i}
                      className="px-1.5 py-0.2 rounded bg-red-500/10 text-red-600 dark:text-red-400 text-[10px] font-bold"
                    >
                      Sin {ing}
                    </span>
                  ))}
                </div>
              )}

              {/* Extras */}
              {item.extras.length > 0 && (
                <div className="pl-5 flex flex-wrap gap-1">
                  {item.extras.map((extra, i) => (
                    <span
                      key={i}
                      className="px-1.5 py-0.2 rounded bg-accent-soft text-accent text-[10px] font-bold"
                    >
                      + {extra.name}
                    </span>
                  ))}
                </div>
              )}

              {/* Nota de cocina del ítem */}
              {item.burgerNote && (
                <p className="pl-5 text-[11px] text-text-muted italic">
                  "{item.burgerNote}"
                </p>
              )}
            </div>
          ))}

          {/* Nota general del pedido */}
          {order.notes && (
            <div className="pt-2 border-t border-line/60 text-[11px] text-amber-700 dark:text-amber-300 font-medium flex items-start gap-1">
              <AlertTriangle className="w-3 h-3 text-amber-500 shrink-0 mt-0.5" />
              <span className="line-clamp-2">{order.notes}</span>
            </div>
          )}
        </div>
      </div>

      {/* ─── Botones de Acción Rápida ──────────────────────────────────────── */}
      <div className="flex items-center gap-2 pt-2 border-t border-line">
        {statusConfig.nextStatus && (
          <Button
            type="button"
            variant="default"
            size="sm"
            onClick={handleAdvanceStatus}
            disabled={updateStatusMutation.isPending}
            className="flex-1 text-xs font-bold"
          >
            {updateStatusMutation.isPending ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
            ) : statusConfig.nextStatus === 'preparing' ? (
              <Flame className="w-3.5 h-3.5 mr-1.5 text-amber-300" />
            ) : statusConfig.nextStatus === 'ready' ? (
              <Check className="w-3.5 h-3.5 mr-1.5" />
            ) : (
              <PackageCheck className="w-3.5 h-3.5 mr-1.5" />
            )}
            <span>{statusConfig.nextActionLabel}</span>
          </Button>
        )}

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onOpenDetail(order)}
          className="text-xs font-bold"
          title="Ver detalle completo"
        >
          <FileText className="w-3.5 h-3.5 sm:mr-1" />
          <span className="hidden sm:inline">Detalle</span>
        </Button>

        {!isTerminal && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onOpenCancel(order)}
            className="text-text-muted hover:text-danger hover:bg-danger-soft p-2 h-9 min-h-[36px]"
            title="Cancelar pedido"
            aria-label="Cancelar pedido"
          >
            <Ban className="w-3.5 h-3.5" />
          </Button>
        )}
      </div>
    </div>
  );
}
