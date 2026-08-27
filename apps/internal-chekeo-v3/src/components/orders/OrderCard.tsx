/**
 * OrderCard.tsx — PR-V3-09 / Refinamiento UX/UI V3
 *
 * Tarjeta de comanda reactiva y accesible de Chekeo V3:
 * - Checkbox para selección múltiple / acciones en lote.
 * - Realce visual de pedido prioritario (isPriority).
 * - Folio destacado con botón de copiado rápido y badges de estado y prioridad (sin chip redundante de pickup).
 * - Grilla de 3 Hechos Clave:
 *   1. Total formateado.
 *   2. Entrega exclusiva a Torre GGA / Torre Valcob (con depto).
 *   3. Fecha con icono de rayito (Zap) para Hoy vs. calendario (CalendarDays) con fecha real para después.
 * - Desglose visual limpio de comanda con iconografía SVG profesional (Lucide).
 * - Botones de acción rápida: Avance de estado, Detalle, Cancelar, Archivar y Restaurar.
 */

import React, { useState } from 'react';
import {
  MapPin,
  Zap,
  CalendarDays,
  MessageCircle,
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
import type { OrderV2, OrderV2Status } from '@config/index';
import {
  normalizeOrderItems,
  ORDER_STATUS_CONFIGS,
  PAYMENT_STATUS_CONFIGS,
  formatCurrency,
  formatOrderTime,
  formatTowerDeliveryLabel,
  formatOrderTargetDateInfo,
  getWhatsAppLink,
  useUpdateOrderStatusMutation,
} from '../../features/orders';
import {
  formatKitchenExtraLabel,
  formatKitchenRemovalLabel,
} from '../../features/kitchen';

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
  const dateInfo = formatOrderTargetDateInfo(order);

  // Si la orden es 'new' pero es programada/anterior (!dateInfo.isToday), se muestra como 'Preparando'
  const displayStatus: OrderV2Status =
    order.status === 'new' && !dateInfo.isToday ? 'preparing' : order.status;

  const statusConfig = ORDER_STATUS_CONFIGS[displayStatus] || ORDER_STATUS_CONFIGS.new;
  const paymentStatusConfig =
    PAYMENT_STATUS_CONFIGS[order.paymentStatus] || PAYMENT_STATUS_CONFIGS.pending;
  const isTerminal = order.status === 'delivered' || order.status === 'cancelled';

  const towerLocation = formatTowerDeliveryLabel(
    order.delivery as Record<string, unknown> | null | undefined
  );

  const handleCopyFolio = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(order.folio);
    setCopiedFolio(true);
    setTimeout(() => setCopiedFolio(false), 2000);
  };

  const handleAdvanceStatus = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const nextStatus =
      order.status === 'new'
        ? 'preparing'
        : order.status === 'preparing'
        ? 'ready'
        : order.status === 'ready'
        ? 'delivered'
        : null;

    if (!nextStatus) return;

    await updateStatusMutation.mutateAsync({
      orderId: order.id,
      status: nextStatus,
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

        {/* ─── Caja de 3 Hechos Clave (Total, Entrega Torre y Fecha) ─────────── */}
        <div className="grid grid-cols-3 gap-2 p-2.5 rounded-2xl bg-surface-raised/70 border border-line text-xs">
          {/* Total */}
          <div className="flex flex-col justify-center">
            <span className="text-[10px] font-black uppercase tracking-wider text-text-muted">Total</span>
            <strong className="text-xs sm:text-sm font-black text-accent truncate">
              {formatCurrency(order.total)}
            </strong>
          </div>

          {/* Entrega a Torre */}
          <div className="flex flex-col justify-center min-w-0">
            <span className="text-[10px] font-black uppercase tracking-wider text-text-muted">Entrega</span>
            <strong
              className="text-[11px] sm:text-xs font-bold text-text-primary truncate flex items-center gap-1"
              title={towerLocation}
            >
              <MapPin className="w-3 h-3 text-accent shrink-0" />
              <span className="truncate">{towerLocation}</span>
            </strong>
          </div>

          {/* Fecha Real (⚡ Rayito para Hoy vs 📅 Calendario para Después) */}
          <div className="flex flex-col justify-center min-w-0">
            <span className="text-[10px] font-black uppercase tracking-wider text-text-muted">Fecha</span>
            {dateInfo.isToday ? (
              <span
                className="text-[11px] sm:text-xs font-black text-emerald-600 dark:text-emerald-400 truncate flex items-center gap-1"
                title="Para entrega hoy"
              >
                <Zap className="w-3.5 h-3.5 text-emerald-500 shrink-0 fill-emerald-500/20" />
                <span>{dateInfo.label}</span>
              </span>
            ) : (
              <span
                className="text-[11px] sm:text-xs font-black text-blue-600 dark:text-blue-400 truncate flex items-center gap-1"
                title={`Fecha de entrega: ${dateInfo.label}`}
              >
                <CalendarDays className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                <span>{dateInfo.label}</span>
              </span>
            )}
          </div>
        </div>

        {/* ─── Datos de Cliente y Contacto Rápido ─────────────────────────────── */}
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
                `Hola ${order.customerName}, te contactamos de Burgers.exe sobre tu pedido #${order.folio}:`
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

        {/* ─── Desglose Visual Limpio con Iconografía Lucide ──────────────────── */}
        <div className="p-3 rounded-2xl bg-surface-raised/70 border border-line space-y-2 text-xs">
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

              {/* Modificaciones Unificadas (- Remociones / + Extras) */}
              {(item.removedIngredients.length > 0 || item.extras.length > 0) && (
                <div className="pl-5 flex flex-wrap gap-1 pt-0.5">
                  {item.removedIngredients.map((ing, i) => (
                    <span
                      key={`rem-${i}`}
                      className="inline-flex items-center px-1.5 py-0.5 rounded bg-red-500/10 text-red-600 dark:text-red-400 text-[10px] font-black border border-red-500/20"
                    >
                      {formatKitchenRemovalLabel(ing)}
                    </span>
                  ))}
                  {item.extras.map((extra, i) => (
                    <span
                      key={`ext-${i}`}
                      className="inline-flex items-center px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-[10px] font-black border border-emerald-500/20"
                    >
                      {formatKitchenExtraLabel(extra)}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}

          {/* Nota general */}
          {order.notes && (
            <div className="pt-2 border-t border-line/60 text-[11px] text-amber-700 dark:text-amber-300 font-medium flex items-start gap-1">
              <AlertTriangle className="w-3 h-3 text-amber-500 shrink-0 mt-0.5" />
              <span className="line-clamp-2">{order.notes}</span>
            </div>
          )}
        </div>
      </div>

      {/* ─── Botones de Acción Rápida (Footer) ──────────────────────────────── */}
      <div className="space-y-2 pt-2 border-t border-line">
        {/* Botón Principal: Avanzar Siguiente Estado */}
        {!isTerminal && statusConfig.nextStatus && (
          <Button
            type="button"
            variant="default"
            size="sm"
            onClick={handleAdvanceStatus}
            disabled={updateStatusMutation.isPending}
            className="w-full text-xs font-bold flex items-center justify-center gap-1.5 min-h-[38px] shadow-sm cursor-pointer"
          >
            {updateStatusMutation.isPending ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : statusConfig.nextStatus === 'preparing' ? (
              <>
                <Flame className="w-3.5 h-3.5 text-amber-300" />
                <span>Pasar a Cocina</span>
              </>
            ) : statusConfig.nextStatus === 'ready' ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-300" />
                <span>Marcar Listo</span>
              </>
            ) : statusConfig.nextStatus === 'delivered' ? (
              <>
                <PackageCheck className="w-3.5 h-3.5 text-white" />
                <span>Completar Entrega</span>
              </>
            ) : (
              <span>Avanzar Estado</span>
            )}
          </Button>
        )}

        {/* Botones Secundarios */}
        <div className="flex items-center justify-between gap-1.5">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenDetail(order)}
            className="flex-1 text-xs font-bold flex items-center justify-center gap-1 min-h-[36px] cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5 text-accent" />
            <span>Detalle</span>
          </Button>

          {/* Botón Cancelar (solo si no es terminal) */}
          {!isTerminal && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenCancel(order)}
              className="text-xs font-bold text-red-600 dark:text-red-400 hover:bg-red-500/10 border-red-500/20 px-2.5 min-h-[36px] cursor-pointer"
              title="Cancelar comanda"
            >
              <Ban className="w-3.5 h-3.5" />
            </Button>
          )}

          {/* Botón Restaurar (si está archivado) */}
          {isArchived && onUnarchive && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onUnarchive(order)}
              className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 border-emerald-500/20 px-2.5 min-h-[36px] cursor-pointer"
              title="Restaurar a pedidos activos"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Restaurar</span>
            </Button>
          )}

          {/* Botón Archivar Individual (si es terminal y no archivado) */}
          {isTerminal && !isArchived && onArchive && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onArchive(order)}
              className="text-xs font-bold text-text-muted hover:text-text-primary px-2.5 min-h-[36px] cursor-pointer"
              title="Archivar comanda"
            >
              <Archive className="w-3.5 h-3.5" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
