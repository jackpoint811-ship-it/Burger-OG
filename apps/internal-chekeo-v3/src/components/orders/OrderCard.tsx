/**
 * OrderCard.tsx — PR-V3-09 / Refinamiento V3
 *
 * Tarjeta de comanda reactiva y accesible de Chekeo V3:
 * - Checkbox para selección múltiple / acciones en lote.
 * - Realce visual de pedido prioritario (isPriority).
 * - Folio destacado con botón de copiado rápido y badges de estado y modo.
 * - Grilla de 3 Hechos Clave (Total, Dónde Entregar y Fecha/Horario con badge programado).
 * - Desglose visual limpio de comanda con iconografía SVG profesional (Lucide).
 * - Botones de acción rápida: Avance de estado, Detalle, Cancelar, Archivar y Restaurar.
 */

import React, { useState } from 'react';
import {
  MapPin,
  Clock,
  CalendarClock,
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
  Archive,
  RotateCcw,
  Sparkles,
  Plus,
  CircleSlash2,
  Utensils,
  CupSoda,
} from 'lucide-react';
import { Button } from '@ui/button';
import type { OrderV2 } from '@config/index';
import {
  normalizeOrderItems,
  ORDER_STATUS_CONFIGS,
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
  selected?: boolean;
  onToggleSelect?: (orderId: string) => void;
  isPriority?: boolean;
  isArchived?: boolean;
  onOpenDetail: (order: OrderV2) => void;
  onOpenCancel: (order: OrderV2) => void;
  onArchive?: (order: OrderV2) => void;
  onUnarchive?: (order: OrderV2) => void;
}

export function OrderCard({
  order,
  selected = false,
  onToggleSelect,
  isPriority = false,
  isArchived = false,
  onOpenDetail,
  onOpenCancel,
  onArchive,
  onUnarchive,
}: OrderCardProps) {
  const [copiedFolio, setCopiedFolio] = useState(false);
  const updateStatusMutation = useUpdateOrderStatusMutation();

  const normalizedItems = normalizeOrderItems(order.items);
  const statusConfig = ORDER_STATUS_CONFIGS[order.status] || ORDER_STATUS_CONFIGS.new;
  const paymentStatusConfig =
    PAYMENT_STATUS_CONFIGS[order.paymentStatus] || PAYMENT_STATUS_CONFIGS.pending;
  const isTerminal = order.status === 'delivered' || order.status === 'cancelled';

  // Detectar si la entrega es programada
  const delivery = order.delivery as Record<string, unknown> | undefined;
  const isScheduled = Boolean(
    delivery?.scheduledDate || delivery?.scheduledDeliveryDate || delivery?.scheduledTime
  );

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
    <div
      className={`bg-surface-card rounded-3xl p-4 sm:p-5 border transition-all duration-200 space-y-3.5 flex flex-col justify-between ${
        selected
          ? 'ring-2 ring-accent border-accent/50 bg-accent/[0.02] shadow-card'
          : isPriority
          ? 'ring-2 ring-accent/60 border-accent/40 shadow-card bg-accent/[0.015]'
          : 'border-line shadow-card hover:border-accent/30'
      }`}
    >
      <div className="space-y-3">
        {/* ─── Header: Checkbox + Folio + Estado + Total ─────────────────────── */}
        <div className="flex items-start justify-between gap-2 border-b border-line pb-3">
          <div className="flex items-start gap-2.5 min-w-0">
            {/* Checkbox de Selección Múltiple */}
            {onToggleSelect && (
              <input
                type="checkbox"
                checked={selected}
                onChange={() => onToggleSelect(order.id)}
                onClick={(e) => e.stopPropagation()}
                aria-label={`Seleccionar pedido ${order.folio}`}
                className="w-4 h-4 mt-0.5 rounded border-line bg-surface text-accent focus:ring-accent focus:ring-offset-surface cursor-pointer shrink-0"
              />
            )}

            <div className="space-y-1 min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-base font-black text-text-primary tracking-tight">
                  #{order.folio}
                </span>

                {isPriority && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.2 rounded-full text-[10px] font-black uppercase bg-accent-soft text-accent border border-accent/30 animate-pulse">
                    <Sparkles className="w-2.5 h-2.5 shrink-0" />
                    <span>Prioridad</span>
                  </span>
                )}

                <button
                  type="button"
                  onClick={handleCopyFolio}
                  className="p-1 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-raised transition-colors cursor-pointer"
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
                  className={`inline-flex items-center px-2 py-0.2 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                    isArchived
                      ? 'bg-zinc-500/15 text-zinc-500 border-zinc-500/20'
                      : statusConfig.badgeClass
                  }`}
                >
                  {isArchived ? 'Archivado' : statusConfig.shortLabel}
                </span>

                <span className="inline-flex items-center gap-1 px-2 py-0.2 rounded-full text-[10px] font-bold bg-surface-raised text-text-secondary border border-line">
                  {order.orderMode === 'pickup' ? (
                    <>
                      <ShoppingBag className="w-2.5 h-2.5 text-accent shrink-0" />
                      <span>Pickup</span>
                    </>
                  ) : (
                    <>
                      <Bike className="w-2.5 h-2.5 text-accent shrink-0" />
                      <span>Delivery</span>
                    </>
                  )}
                </span>
              </div>
            </div>
          </div>

          <div className="text-right shrink-0">
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

        {/* ─── Caja de 3 Hechos Clave (Total, Dónde Entregar y Fecha) ─────────── */}
        <div className="grid grid-cols-3 gap-2 p-2.5 rounded-2xl bg-surface-raised border border-line text-xs">
          <div className="flex flex-col justify-center">
            <span className="text-[10px] font-black uppercase tracking-wider text-text-muted">Total</span>
            <strong className="text-xs sm:text-sm font-black text-accent truncate">
              {formatCurrency(order.total)}
            </strong>
          </div>

          <div className="flex flex-col justify-center min-w-0">
            <span className="text-[10px] font-black uppercase tracking-wider text-text-muted">Entrega</span>
            <strong
              className="text-[11px] sm:text-xs font-bold text-text-primary truncate flex items-center gap-1"
              title={formatDeliveryLocation(order.delivery, order.orderMode)}
            >
              <MapPin className="w-3 h-3 text-accent shrink-0" />
              <span className="truncate">{formatDeliveryLocation(order.delivery, order.orderMode)}</span>
            </strong>
          </div>

          <div className="flex flex-col justify-center min-w-0">
            <span className="text-[10px] font-black uppercase tracking-wider text-text-muted">Fecha</span>
            {isScheduled ? (
              <span
                className="text-[11px] sm:text-xs font-black text-amber-600 dark:text-amber-400 truncate flex items-center gap-1"
                title={formatDeliverySchedule(order.delivery, order.createdAt)}
              >
                <CalendarClock className="w-3 h-3 shrink-0" />
                <span>Programado</span>
              </span>
            ) : (
              <span
                className="text-[11px] sm:text-xs font-bold text-text-primary truncate flex items-center gap-1"
                title={formatDeliverySchedule(order.delivery, order.createdAt)}
              >
                <Clock className="w-3 h-3 text-text-muted shrink-0" />
                <span>Hoy</span>
              </span>
            )}
          </div>
        </div>

        {/* ─── Datos de Cliente y Contacto ───────────────────────────────────── */}
        <div className="flex items-center justify-between gap-2 text-xs pt-0.5">
          <div className="flex items-center gap-1.5 font-bold text-text-primary truncate">
            <span className="truncate">{order.customerName}</span>
            {order.customerPhone && (
              <span className="text-text-muted text-[11px] font-normal hidden sm:inline">
                ({order.customerPhone})
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-text-muted text-[11px] font-medium">
              {formatOrderTime(order.createdAt)}
            </span>
            <a
              href={getWhatsAppLink(
                order.customerPhone,
                `Hola ${order.customerName}, te contactamos de Burgers.exe sobre tu orden #${order.folio}:`
              )}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-500/15 transition-colors cursor-pointer"
              title="Escribir por WhatsApp"
              aria-label="WhatsApp"
            >
              <MessageCircle className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* ─── Desglose Limpio de Comanda ────────────────────────────────────── */}
        <div className="p-3 rounded-2xl bg-surface-raised border border-line space-y-2 text-xs">
          {normalizedItems.map((item, idx) => (
            <div key={item.id || idx} className="space-y-1">
              <div className="flex justify-between items-baseline font-bold text-text-primary">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="w-4 h-4 rounded bg-accent/15 text-accent text-[10px] font-black flex items-center justify-center shrink-0">
                    {item.qty}
                  </span>
                  <span className="truncate">{item.name}</span>
                </div>
                <span className="text-text-secondary font-semibold shrink-0 ml-2">
                  {formatCurrency(item.lineTotal || item.unitPrice * item.qty)}
                </span>
              </div>

              {/* Guarnición y Bebida de combo */}
              {(item.garnish || item.includedDrink) && (
                <div className="pl-5 space-y-0.5 text-[11px] text-text-secondary font-medium">
                  {item.garnish && (
                    <div className="flex items-center gap-1.5">
                      <Utensils className="w-3 h-3 text-accent shrink-0" />
                      <span>{item.garnish.name}</span>
                      {item.garnish.upcharge ? (
                        <span className="text-accent font-bold">
                          (+{formatCurrency(item.garnish.upcharge)})
                        </span>
                      ) : null}
                    </div>
                  )}
                  {item.includedDrink && (
                    <div className="flex items-center gap-1.5">
                      <CupSoda className="w-3 h-3 text-sky-500 shrink-0" />
                      <span>{item.includedDrink.name}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Remociones */}
              {item.removedIngredients.length > 0 && (
                <div className="pl-5 flex flex-wrap gap-1">
                  {item.removedIngredients.map((ing, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-red-500/10 text-red-600 dark:text-red-400 text-[10px] font-bold border border-red-500/20"
                    >
                      <CircleSlash2 className="w-2.5 h-2.5 shrink-0" />
                      <span>Sin {ing}</span>
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
                      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-accent-soft text-accent text-[10px] font-bold border border-accent/20"
                    >
                      <Plus className="w-2.5 h-2.5 shrink-0" />
                      <span>{extra.name}</span>
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
        {/* Caso 1: Órdenes archivadas -> Botón Restaurar */}
        {isArchived && onUnarchive ? (
          <Button
            type="button"
            variant="default"
            size="sm"
            onClick={() => onUnarchive(order)}
            className="flex-1 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white min-h-[38px] cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
            <span>Restaurar a Operaciones</span>
          </Button>
        ) : (
          <>
            {/* Caso 2: Avance dinámico de estado */}
            {statusConfig.nextStatus && (
              <Button
                type="button"
                variant="default"
                size="sm"
                onClick={handleAdvanceStatus}
                disabled={updateStatusMutation.isPending}
                className="flex-1 text-xs font-bold min-h-[38px] cursor-pointer"
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

            {/* Caso 3: Canceladas -> Botón Mandar a Basurero */}
            {order.status === 'cancelled' && onArchive && (
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={() => onArchive(order)}
                className="flex-1 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white min-h-[38px] cursor-pointer"
              >
                <Archive className="w-3.5 h-3.5 mr-1.5" />
                <span>Archivar</span>
              </Button>
            )}
          </>
        )}

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onOpenDetail(order)}
          className="text-xs font-bold min-h-[38px] cursor-pointer"
          title="Ver detalle completo"
        >
          <FileText className="w-3.5 h-3.5 sm:mr-1" />
          <span className="hidden sm:inline">Detalle</span>
        </Button>

        {!isTerminal && !isArchived && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onOpenCancel(order)}
            className="text-text-muted hover:text-danger hover:bg-danger-soft p-2 h-9 min-h-[38px] cursor-pointer"
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
