/**
 * OrderTicketModal.tsx — PR-V3-11
 *
 * Generador de Tickets Verticales (formato recibo 80mm/58mm POS térmico):
 * - Visualización fidedigna de comanda vertical estilo recibo térmico con tipografía monoespaciada.
 * - Desglose estructurado de ítems, combos, remociones [SIN], extras [+EXTRA] y guarniciones.
 * - Acciones rápidas: Imprimir ticket en impresora térmica, Copiar texto plano y Enviar por WhatsApp.
 */

import React, { useState } from 'react';
import {
  Printer,
  Copy,
  CheckCircle2,
  MessageCircle,
  FileText,
  X,
  MapPin,
  Clock,
  ShoppingBag,
  Bike,
  Sparkles,
} from 'lucide-react';
import { Dialog } from '@ui/dialog';
import { Button } from '@ui/button';
import { Badge } from '@ui/badge';
import type { OrderV2 } from '@config/index';
import {
  normalizeOrderItems,
  formatCurrency,
  formatOrderTime,
  formatOrderDate,
  formatDeliveryLocation,
  formatDeliverySchedule,
  PAYMENT_METHOD_LABELS,
  PAYMENT_STATUS_CONFIGS,
} from '../../features/orders';
import {
  generateVerticalTicketText,
  printVerticalTicket,
} from '../../features/payments';

export interface OrderTicketModalProps {
  order: OrderV2 | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenWhatsApp?: (order: OrderV2) => void;
}

export function OrderTicketModal({
  order,
  isOpen,
  onClose,
  onOpenWhatsApp,
}: OrderTicketModalProps) {
  const [copied, setCopied] = useState(false);

  if (!order) return null;

  const normalizedItems = normalizeOrderItems(order.items);
  const paymentStatusConfig =
    PAYMENT_STATUS_CONFIGS[order.paymentStatus] || PAYMENT_STATUS_CONFIGS.pending;
  const methodLabel = PAYMENT_METHOD_LABELS[order.paymentMethod] || 'Efectivo';
  const location = formatDeliveryLocation(order.delivery, order.orderMode);
  const schedule = formatDeliverySchedule(order.delivery, order.createdAt);
  const dateStr = formatOrderDate(order.createdAt);
  const timeStr = formatOrderTime(order.createdAt);

  const handleCopyText = () => {
    const text = generateVerticalTicketText(order);
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  const handlePrint = () => {
    printVerticalTicket(order);
  };

  const handleWhatsApp = () => {
    onClose();
    if (onOpenWhatsApp) {
      onOpenWhatsApp(order);
    }
  };

  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      maxWidth="md"
      className="p-0 overflow-hidden max-h-[92vh] flex flex-col bg-surface-card"
    >
      {/* ─── Header del Modal ──────────────────────────────────────────────── */}
      <div className="p-4 sm:p-5 border-b border-line bg-surface-raised flex items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-accent-soft border border-accent/30 flex items-center justify-center text-accent shrink-0 shadow-xs">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-black text-text-primary">
                Ticket de Pedido
              </h3>
              <Badge variant="default" className="text-[10px] font-extrabold">
                #{order.folio}
              </Badge>
            </div>
            <p className="text-xs text-text-secondary font-medium">
              Formato POS térmico estandarizado (80mm)
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="p-2 rounded-xl text-text-muted hover:text-text-primary hover:bg-surface transition-colors"
          title="Cerrar modal"
          aria-label="Cerrar modal"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* ─── Contenedor del Ticket Térmico 80mm con Scroll ──────────────────── */}
      <div className="p-4 sm:p-6 bg-surface overflow-y-auto max-h-[calc(92vh-140px)] flex justify-center">
        {/* Hoja de Ticket Recibo (80mm Style) */}
        <div className="w-full max-w-[380px] bg-white text-zinc-900 rounded-2xl shadow-floating border border-zinc-200 p-6 space-y-4 font-mono text-xs select-text">
          {/* Encabezado de Marca */}
          <div className="text-center space-y-1 border-b border-dashed border-zinc-300 pb-4">
            <h2 className="text-lg font-black tracking-tight text-zinc-950">
              BURGERS.EXE
            </h2>
            <p className="text-[10px] uppercase font-bold text-zinc-600 tracking-widest">
              Smash Burgers & Sides
            </p>
            <div className="inline-block mt-1 px-2 py-0.5 rounded bg-zinc-100 text-zinc-800 text-[11px] font-black tracking-wider">
              #{order.folio}
            </div>
          </div>

          {/* Metadata del Pedido */}
          <div className="space-y-1 text-[11px] text-zinc-700 border-b border-dashed border-zinc-300 pb-3">
            <div className="flex justify-between">
              <span className="text-zinc-500">Fecha:</span>
              <span className="font-bold">{dateStr} {timeStr}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Cliente:</span>
              <span className="font-bold text-zinc-900 truncate max-w-[180px]">
                {order.customerName}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Teléfono:</span>
              <span className="font-bold">{order.customerPhone}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Modo:</span>
              <span className="font-bold uppercase">
                {order.orderMode === 'pickup' ? 'Pickup (En Local)' : 'Delivery'}
              </span>
            </div>
            <div className="flex justify-between items-baseline">
              <span className="text-zinc-500">Ubicación:</span>
              <span className="font-bold text-right truncate max-w-[180px]">
                {location}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Horario:</span>
              <span className="font-bold">{schedule}</span>
            </div>
          </div>

          {/* Tabla de Ítems */}
          <div className="space-y-3 border-b border-dashed border-zinc-300 pb-4">
            <div className="flex justify-between text-[10px] font-bold text-zinc-500 uppercase border-b border-zinc-200 pb-1">
              <span>Cant & Descripción</span>
              <span>Total</span>
            </div>

            {normalizedItems.map((item, idx) => (
              <div key={item.id || idx} className="space-y-1 text-xs">
                <div className="flex justify-between items-baseline">
                  <div className="flex items-baseline gap-1.5 font-bold text-zinc-950">
                    <span className="text-zinc-600">{item.qty}x</span>
                    <span className="leading-snug">{item.name}</span>
                  </div>
                  <span className="font-bold text-zinc-900 shrink-0 ml-2">
                    {formatCurrency(item.lineTotal || item.unitPrice * item.qty)}
                  </span>
                </div>

                {/* Modificadores */}
                <div className="pl-4 space-y-0.5 text-[11px] text-zinc-600">
                  {item.garnish && (
                    <div className="flex items-center gap-1">
                      <span>• Guarnición: {item.garnish.name}</span>
                      {item.garnish.upcharge ? (
                        <span className="font-bold">
                          (+{formatCurrency(item.garnish.upcharge)})
                        </span>
                      ) : null}
                    </div>
                  )}

                  {item.includedDrink && (
                    <div>• Bebida: {item.includedDrink.name}</div>
                  )}

                  {item.removedIngredients.length > 0 && (
                    <div className="text-red-600 font-medium">
                      • SIN: {item.removedIngredients.join(', ')}
                    </div>
                  )}

                  {item.extras.length > 0 && (
                    <div className="text-emerald-700 font-medium">
                      • +EXTRA: {item.extras.map((e) => e.name).join(', ')}
                    </div>
                  )}

                  {item.burgerNote && (
                    <div className="italic text-zinc-500">
                      • Nota: "{item.burgerNote}"
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Resumen Financiero */}
          <div className="space-y-1.5 text-xs border-b border-dashed border-zinc-300 pb-3">
            <div className="flex justify-between text-zinc-600">
              <span>Subtotal:</span>
              <span>{formatCurrency(order.subtotal || order.total)}</span>
            </div>

            <div className="flex justify-between items-baseline pt-1 border-t border-zinc-200">
              <span className="text-sm font-black text-zinc-950">TOTAL:</span>
              <span className="text-base font-black text-zinc-950">
                {formatCurrency(order.total)}
              </span>
            </div>

            <div className="flex justify-between items-center pt-1 text-[11px]">
              <span className="text-zinc-600">Forma de Pago:</span>
              <span className="font-bold text-zinc-900">{methodLabel}</span>
            </div>

            <div className="flex justify-between items-center text-[11px]">
              <span className="text-zinc-600">Estado de Cobro:</span>
              <span
                className={`font-black px-1.5 py-0.2 rounded text-[10px] uppercase ${
                  order.paymentStatus === 'paid'
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-amber-100 text-amber-800'
                }`}
              >
                {paymentStatusConfig.label}
              </span>
            </div>
          </div>

          {/* Notas generales del pedido */}
          {order.notes && (
            <div className="text-[11px] text-zinc-700 bg-amber-50 p-2.5 rounded-lg border border-amber-200">
              <span className="font-bold text-amber-900 block">Notas del pedido:</span>
              <span>{order.notes}</span>
            </div>
          )}

          {/* Pie de Recibo */}
          <div className="text-center space-y-1 pt-2 text-[10px] text-zinc-500">
            <p className="font-bold text-zinc-700">¡GRACIAS POR TU COMPRA!</p>
            <p>www.burgers-exe.com</p>
            <p className="text-[9px] text-zinc-400">--- Fin del ticket ---</p>
          </div>
        </div>
      </div>

      {/* ─── Footer con Botones de Acción ──────────────────────────────────── */}
      <div className="p-4 sm:p-5 border-t border-line bg-surface-raised flex flex-wrap items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-2">
          {onOpenWhatsApp && (
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={handleWhatsApp}
              className="text-xs font-bold text-emerald-600 hover:text-emerald-700"
            >
              <MessageCircle className="w-4 h-4 mr-1.5" />
              <span>WhatsApp</span>
            </Button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="md"
            onClick={handleCopyText}
            className="text-xs font-bold"
          >
            {copied ? (
              <>
                <CheckCircle2 className="w-4 h-4 mr-1.5 text-emerald-600" />
                <span className="text-emerald-600 font-extrabold">¡Texto Copiado!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 mr-1.5" />
                <span>Copiar Texto</span>
              </>
            )}
          </Button>

          <Button
            type="button"
            variant="default"
            size="md"
            onClick={handlePrint}
            className="text-xs font-bold shadow-sm"
          >
            <Printer className="w-4 h-4 mr-1.5" />
            <span>Imprimir Ticket</span>
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
