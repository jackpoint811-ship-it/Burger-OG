/**
 * PaymentCard.tsx — Chekeo V3 Pagos Refinement (UX Polish)
 *
 * Tarjeta de cobro individual y conciliación reactiva:
 * - Checkbox de selección múltiple para acciones en lote.
 * - Folio destacado con copiado rápido al portapapeles.
 * - Realce visual si es una transferencia SPEI por validar.
 * - Grilla de 3 Hechos Clave:
 *   1. Total formateado.
 *   2. Entrega exclusiva a Torre GGA / Torre Valcob (con depto).
 *   3. Fecha con icono de rayito (Zap) para Hoy vs. calendario (CalendarDays) con fecha real para después.
 * - Contacto rápido con enlace a WhatsApp y desglose con iconografía Lucide.
 * - 4 Acciones de 1-toque: Validar/Revertir, Ver Ticket 80mm, WhatsApp Bridge y Detalle completo.
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
  Check,
  Loader2,
  AlertTriangle,
  Plus,
  CircleSlash2,
  Utensils,
  CupSoda,
  ArrowRightLeft,
  DollarSign,
  CreditCard,
} from 'lucide-react';
import { Button } from '@ui/button';
import type { OrderV2 } from '@config/index';
import {
  normalizeOrderItems,
  formatCurrency,
  formatOrderTime,
  getWhatsAppLink,
  ORDER_STATUS_CONFIGS,
} from '../../features/orders';
import {
  formatTowerDeliveryLabel,
  formatOrderTargetDateInfo,
} from '../../features/payments';

export interface PaymentCardProps {
  order: OrderV2;
  selected?: boolean;
  onToggleSelect?: (orderId: string) => void;
  onTogglePaymentStatus: (order: OrderV2) => void;
  isUpdating?: boolean;
  onOpenTicket: (order: OrderV2) => void;
  onOpenWhatsApp: (order: OrderV2) => void;
  onOpenDetail: (order: OrderV2) => void;
}

export function PaymentCard({
  order,
  selected = false,
  onToggleSelect,
  onTogglePaymentStatus,
  isUpdating = false,
  onOpenTicket,
  onOpenWhatsApp,
  onOpenDetail,
}: PaymentCardProps) {
  const [copiedFolio, setCopiedFolio] = useState(false);

  const isPaid = order.paymentStatus === 'paid';
  const isCancelled = order.paymentStatus === 'cancelled' || order.status === 'cancelled';
  const isSPEI = order.paymentMethod === 'transfer';
  const normalizedItems = normalizeOrderItems(order.items);
  const statusConfig = ORDER_STATUS_CONFIGS[order.status] || ORDER_STATUS_CONFIGS.new;

  const towerLocation = formatTowerDeliveryLabel(
    order.delivery as Record<string, unknown> | null | undefined
  );
  const dateInfo = formatOrderTargetDateInfo(order);

  const handleCopyFolio = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(order.folio);
    setCopiedFolio(true);
    setTimeout(() => setCopiedFolio(false), 2000);
  };

  return (
    <div
      className={`bg-surface-card rounded-3xl p-4 sm:p-5 border transition-all duration-200 space-y-3 flex flex-col justify-between ${
        selected
          ? 'ring-2 ring-accent border-accent/50 bg-accent/[0.02] shadow-card'
          : !isPaid && isSPEI && !isCancelled
          ? 'border-amber-500/40 ring-1 ring-amber-500/20 shadow-card bg-amber-500/[0.015]'
          : 'border-line shadow-card hover:border-accent/30'
      }`}
    >
      <div className="space-y-3">
        {/* ─── Header: Checkbox + Folio + Método + Estado de Cobro ─────────────── */}
        <div className="flex items-start justify-between gap-2 border-b border-line pb-2.5">
          <div className="flex items-start gap-2.5 min-w-0">
            {/* Checkbox de Selección Múltiple */}
            {onToggleSelect && (
              <input
                type="checkbox"
                checked={selected}
                onChange={() => onToggleSelect(order.id)}
                onClick={(e) => e.stopPropagation()}
                aria-label={`Seleccionar cobro ${order.folio}`}
                className="w-4 h-4 mt-0.5 rounded border-line bg-surface text-accent focus:ring-accent focus:ring-offset-surface cursor-pointer shrink-0"
              />
            )}

            <div className="space-y-1 min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-base font-black text-text-primary tracking-tight">
                  #{order.folio}
                </span>

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
                {/* Badge de Método de Pago */}
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold uppercase tracking-wider border ${
                    isSPEI
                      ? 'bg-blue-500/15 text-blue-600 border-blue-500/20 dark:text-blue-400'
                      : order.paymentMethod === 'cash'
                      ? 'bg-emerald-500/15 text-emerald-600 border-emerald-500/20 dark:text-emerald-400'
                      : 'bg-purple-500/15 text-purple-600 border-purple-500/20 dark:text-purple-400'
                  }`}
                >
                  {isSPEI ? (
                    <>
                      <ArrowRightLeft className="w-3 h-3 shrink-0" />
                      <span>SPEI</span>
                    </>
                  ) : order.paymentMethod === 'cash' ? (
                    <>
                      <DollarSign className="w-3 h-3 shrink-0" />
                      <span>Efectivo</span>
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-3 h-3 shrink-0" />
                      <span>Tarjeta</span>
                    </>
                  )}
                </span>

                {/* Badge de Estado Operativo */}
                <span
                  className={`inline-flex items-center px-2 py-0.2 rounded-full text-[10px] font-bold border ${statusConfig.badgeClass}`}
                >
                  {statusConfig.shortLabel}
                </span>
              </div>
            </div>
          </div>

          <div className="text-right shrink-0">
            <span className="text-lg sm:text-xl font-black text-accent block">
              {formatCurrency(order.total)}
            </span>
            <span
              className={`inline-block text-[10px] font-extrabold uppercase px-2 py-0.2 rounded-md border ${
                isPaid
                  ? 'bg-emerald-500/15 text-emerald-600 border-emerald-500/20 dark:text-emerald-400'
                  : isCancelled
                  ? 'bg-red-500/15 text-red-600 border-red-500/20 dark:text-red-400'
                  : 'bg-amber-500/15 text-amber-600 border-amber-500/20 dark:text-amber-400 animate-pulse'
              }`}
            >
              {isPaid ? 'Pagado' : isCancelled ? 'Cancelado' : 'Por Validar'}
            </span>
          </div>
        </div>

        {/* ─── Cuadrícula de 3 Hechos Clave (Total, Entrega Torre, Fecha) ───────── */}
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
                `Hola ${order.customerName}, te contactamos de Burgers.exe sobre tu pago del pedido #${order.folio}:`
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

        {/* ─── Desglose Limpio de Comanda con Lucide Icons ───────────────────── */}
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

      {/* ─── 4 Acciones de 1-Toque ─────────────────────────────────────────── */}
      <div className="space-y-2 pt-2 border-t border-line">
        {/* Botón Principal: Validar / Revertir */}
        {!isCancelled && (
          <Button
            type="button"
            variant={isPaid ? 'secondary' : 'default'}
            size="sm"
            onClick={() => onTogglePaymentStatus(order)}
            disabled={isUpdating}
            className={`w-full text-xs font-bold flex items-center justify-center gap-1.5 min-h-[38px] cursor-pointer ${
              !isPaid
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            {isUpdating ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : isPaid ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Pago Validado (Clic para revertir)</span>
              </>
            ) : (
              <>
                <Check className="w-3.5 h-3.5 text-white" />
                <span>1-Clic: Validar Pago</span>
              </>
            )}
          </Button>
        )}

        {/* 3 Botones Secundarios: Ticket, WhatsApp y Detalle */}
        <div className="grid grid-cols-3 gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenTicket(order)}
            className="text-xs font-bold flex items-center justify-center gap-1 min-h-[36px] cursor-pointer"
            title="Ver ticket térmico 80mm"
          >
            <FileText className="w-3.5 h-3.5 text-accent" />
            <span>Ticket</span>
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenWhatsApp(order)}
            className="text-xs font-bold flex items-center justify-center gap-1 text-emerald-600 hover:text-emerald-700 min-h-[36px] cursor-pointer"
            title="Abrir WhatsApp Bridge con plantillas"
          >
            <MessageCircle className="w-3.5 h-3.5" />
            <span>WhatsApp</span>
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenDetail(order)}
            className="text-xs font-bold flex items-center justify-center gap-1 min-h-[36px] cursor-pointer"
            title="Ver detalle completo de la orden"
          >
            <span>Detalle</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
