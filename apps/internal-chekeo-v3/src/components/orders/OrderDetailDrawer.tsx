/**
 * OrderDetailDrawer.tsx — PR-V3-09
 *
 * Drawer lateral/inferior para inspección completa del pedido, desglose de ítems,
 * historial de eventos / auditoría y acciones de avance o cancelación.
 */

import React from 'react';
import {
  Clock,
  MapPin,
  Phone,
  MessageCircle,
  ShoppingBag,
  Bike,
  CreditCard,
  Ban,
  Flame,
  Check,
  PackageCheck,
  Calendar,
  AlertCircle,
  Copy,
  CheckCircle2,
  Utensils,
  CupSoda,
  Plus,
  CircleSlash2,
} from 'lucide-react';
import { Drawer } from '@ui/drawer';
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
  formatOrderDate,
  formatDeliveryLocation,
  formatDeliverySchedule,
  getWhatsAppLink,
  useUpdateOrderStatusMutation,
} from '../../features/orders';

export interface OrderDetailDrawerProps {
  order: OrderV2 | null;
  open: boolean;
  onClose: () => void;
  onOpenCancelModal?: (order: OrderV2) => void;
}

export function OrderDetailDrawer({
  order,
  open,
  onClose,
  onOpenCancelModal,
}: OrderDetailDrawerProps) {
  const [copiedFolio, setCopiedFolio] = React.useState(false);
  const updateStatusMutation = useUpdateOrderStatusMutation();

  if (!order) return null;

  const normalizedItems = normalizeOrderItems(order.items);
  const statusConfig = ORDER_STATUS_CONFIGS[order.status] || ORDER_STATUS_CONFIGS.new;
  const paymentStatusConfig =
    PAYMENT_STATUS_CONFIGS[order.paymentStatus] || PAYMENT_STATUS_CONFIGS.pending;
  const isTerminal = order.status === 'delivered' || order.status === 'cancelled';

  const handleCopyFolio = () => {
    navigator.clipboard.writeText(order.folio);
    setCopiedFolio(true);
    setTimeout(() => setCopiedFolio(false), 2000);
  };

  const handleStatusChange = async (newStatus: OrderV2Status) => {
    await updateStatusMutation.mutateAsync({
      orderId: order.id,
      status: newStatus,
    });
  };

  return (
    <Drawer
      open={open}
      onClose={onClose}
      className="max-w-xl"
      title={
        <div className="flex items-center gap-2">
          <span className="text-xl font-black text-text-primary">Pedido #{order.folio}</span>
          <button
            type="button"
            onClick={handleCopyFolio}
            className="p-1 rounded-lg text-text-secondary hover:bg-surface-raised transition-colors"
            title="Copiar folio"
            aria-label="Copiar folio"
          >
            {copiedFolio ? (
              <CheckCircle2 className="w-4 h-4 text-accent" />
            ) : (
              <Copy className="w-4 h-4 text-text-muted hover:text-text-primary" />
            )}
          </button>
        </div>
      }
    >
      <div className="space-y-6 pb-4">
        {/* Header de Estado y Fecha */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-surface-raised border border-line">
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider border ${statusConfig.badgeClass}`}>
              {statusConfig.shortLabel}
            </span>
            <Badge variant="outline" className="text-[11px] font-bold flex items-center gap-1">
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
            </Badge>
          </div>
          <div className="text-right">
            <p className="text-xs font-semibold text-text-secondary">Creado</p>
            <p className="text-xs font-bold text-text-primary">
              {formatOrderDate(order.createdAt)} • {formatOrderTime(order.createdAt)}
            </p>
          </div>
        </div>

        {/* Sección 1: Datos del Cliente & Contacto */}
        <div className="space-y-3 p-4 rounded-2xl bg-surface border border-line">
          <h4 className="text-xs font-extrabold uppercase tracking-wider text-text-secondary">
            Datos de Entrega y Cliente
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-xs text-text-muted">Cliente</p>
              <p className="font-bold text-text-primary">{order.customerName}</p>
            </div>
            <div>
              <p className="text-xs text-text-muted">Teléfono</p>
              <div className="flex items-center gap-2 mt-0.5">
                <a
                  href={`tel:${order.customerPhone}`}
                  className="font-bold text-text-primary hover:text-accent flex items-center gap-1"
                >
                  <Phone className="w-3.5 h-3.5 text-text-muted" />
                  <span>{order.customerPhone}</span>
                </a>
                <a
                  href={getWhatsAppLink(
                    order.customerPhone,
                    `Hola ${order.customerName}, te escribimos de Burgers.exe sobre tu pedido #${order.folio}:`
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-emerald-500/15 text-emerald-600 text-xs font-bold hover:bg-emerald-500/25 transition-colors cursor-pointer"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>WhatsApp</span>
                </a>
              </div>
            </div>

            <div className="sm:col-span-2 pt-2 border-t border-line/60">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs text-text-muted">Ubicación de Entrega</p>
                  <p className="font-bold text-text-primary">
                    {formatDeliveryLocation(order.delivery, order.orderMode)}
                  </p>
                </div>
              </div>
            </div>

            <div className="sm:col-span-2">
              <div className="flex items-start gap-2">
                <Clock className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs text-text-muted">Horario de Entrega</p>
                  <p className="font-bold text-text-primary">
                    {formatDeliverySchedule(order.delivery, order.createdAt)}
                  </p>
                </div>
              </div>
            </div>

            {order.notes && (
              <div className="sm:col-span-2 p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs">
                <p className="font-bold text-amber-700 dark:text-amber-300 mb-0.5 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>Nota del Cliente:</span>
                </p>
                <p className="text-amber-800 dark:text-amber-200">{order.notes}</p>
              </div>
            )}
          </div>
        </div>

        {/* Sección 2: Desglose de Productos */}
        <div className="space-y-3">
          <h4 className="text-xs font-extrabold uppercase tracking-wider text-text-secondary">
            Productos de la Comanda ({normalizedItems.length})
          </h4>
          <div className="space-y-3">
            {normalizedItems.map((item, idx) => (
              <div
                key={item.id || idx}
                className="p-3.5 rounded-2xl bg-surface-raised border border-line space-y-2.5"
              >
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-accent/15 text-accent text-xs font-black flex items-center justify-center">
                      {item.qty}x
                    </span>
                    <span className="font-bold text-text-primary">{item.name}</span>
                  </div>
                  <span className="font-bold text-text-primary">
                    {formatCurrency(item.lineTotal || item.unitPrice * item.qty)}
                  </span>
                </div>

                {/* Guarnición y Bebida de combo */}
                {(item.garnish || item.includedDrink) && (
                  <div className="pl-8 space-y-1 text-xs text-text-secondary">
                    {item.garnish && (
                      <div className="flex items-center gap-1.5">
                        <Utensils className="w-3.5 h-3.5 text-accent shrink-0" />
                        <span className="font-semibold">{item.garnish.name}</span>
                        {item.garnish.upcharge ? (
                          <span className="text-accent font-bold">
                            (+{formatCurrency(item.garnish.upcharge)})
                          </span>
                        ) : null}
                      </div>
                    )}
                    {item.includedDrink && (
                      <div className="flex items-center gap-1.5">
                        <CupSoda className="w-3.5 h-3.5 text-sky-500 shrink-0" />
                        <span className="font-semibold">{item.includedDrink.name}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Remociones */}
                {item.removedIngredients.length > 0 && (
                  <div className="pl-8 flex flex-wrap gap-1">
                    {item.removedIngredients.map((ing, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-red-500/10 text-red-600 dark:text-red-400 text-[11px] font-bold border border-red-500/20"
                      >
                        <CircleSlash2 className="w-2.5 h-2.5 shrink-0" />
                        <span>Sin {ing}</span>
                      </span>
                    ))}
                  </div>
                )}

                {/* Extras */}
                {item.extras.length > 0 && (
                  <div className="pl-8 flex flex-wrap gap-1">
                    {item.extras.map((extra, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-accent-soft text-accent text-[11px] font-bold border border-accent/20"
                      >
                        <Plus className="w-2.5 h-2.5 shrink-0" />
                        <span>{extra.name} {extra.price ? `(${formatCurrency(extra.price)})` : ''}</span>
                      </span>
                    ))}
                  </div>
                )}

                {/* Nota para cocina */}
                {item.burgerNote && (
                  <div className="pl-8 text-xs text-text-muted italic">
                    Nota: "{item.burgerNote}"
                  </div>
                )}

                {/* Desglose de hamburguesas secundarias en combo */}
                {item.comboBurgers && item.comboBurgers.length > 0 && (
                  <div className="pl-8 pt-2 border-t border-line/40 space-y-1.5">
                    {item.comboBurgers.map((burger, bIdx) => (
                      <div key={bIdx} className="text-xs bg-surface p-2.5 rounded-2xl border border-line/60 space-y-1.5">
                        <span className="font-bold text-text-primary flex items-center gap-1.5">
                          <Utensils className="w-3 h-3 text-accent shrink-0" />
                          <span>{burger.name}</span>
                        </span>
                        {burger.removedIngredients.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {burger.removedIngredients.map((ing, bi) => (
                              <span key={bi} className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded bg-red-500/10 text-red-600 text-[10px] font-bold">
                                <CircleSlash2 className="w-2.5 h-2.5 shrink-0" />
                                <span>Sin {ing}</span>
                              </span>
                            ))}
                          </div>
                        )}
                        {burger.extras.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {burger.extras.map((ext, bi) => (
                              <span key={bi} className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded bg-accent/10 text-accent text-[10px] font-bold">
                                <Plus className="w-2.5 h-2.5 shrink-0" />
                                <span>{ext.name}</span>
                              </span>
                            ))}
                          </div>
                        )}
                        {burger.burgerNote && (
                          <p className="text-[11px] text-text-muted italic">Nota: {burger.burgerNote}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Sección 3: Resumen Financiero & Pago */}
        <div className="p-4 rounded-2xl bg-surface-raised border border-line space-y-2 text-sm">
          <div className="flex justify-between text-text-secondary text-xs">
            <span>Método de Pago:</span>
            <span className="font-bold text-text-primary">
              {PAYMENT_METHOD_LABELS[order.paymentMethod] || order.paymentMethod}
            </span>
          </div>
          <div className="flex justify-between text-text-secondary text-xs">
            <span>Estado de Pago:</span>
            <span className={`px-2 py-0.5 rounded-md text-[11px] font-extrabold border ${paymentStatusConfig.badgeClass}`}>
              {paymentStatusConfig.label}
            </span>
          </div>
          <div className="pt-2 border-t border-line flex justify-between items-center text-base">
            <span className="font-bold text-text-primary">Total del Pedido</span>
            <span className="text-xl font-black text-accent">{formatCurrency(order.total)}</span>
          </div>
        </div>

        {/* Sección 4: Historial / Auditoría de Eventos */}
        {order.events && order.events.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-text-secondary">
              Historial de Estados
            </h4>
            <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
              {order.events.map((event) => (
                <div
                  key={event.id}
                  className="flex items-center justify-between p-2 rounded-xl bg-surface border border-line text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-text-primary">{event.type}</span>
                    {event.nextStatus && (
                      <Badge variant="outline" className="text-[10px]">
                        → {ORDER_STATUS_CONFIGS[event.nextStatus]?.shortLabel || event.nextStatus}
                      </Badge>
                    )}
                  </div>
                  <span className="text-text-muted text-[11px]">
                    {formatOrderTime(event.createdAt)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Sección 5: Barra de Acciones de Estado */}
        <div className="pt-4 border-t border-line space-y-3">
          <h4 className="text-xs font-extrabold uppercase tracking-wider text-text-secondary">
            Acciones Operativas
          </h4>
          <div className="flex flex-wrap gap-2">
            {order.status !== 'preparing' && order.status !== 'ready' && order.status !== 'delivered' && (
              <Button
                type="button"
                variant="default"
                size="md"
                className="flex-1"
                disabled={updateStatusMutation.isPending}
                onClick={() => handleStatusChange('preparing')}
              >
                <Flame className="w-4 h-4 mr-2" />
                <span>Mover a Preparando</span>
              </Button>
            )}

            {order.status !== 'ready' && order.status !== 'delivered' && (
              <Button
                type="button"
                variant="default"
                size="md"
                className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                disabled={updateStatusMutation.isPending}
                onClick={() => handleStatusChange('ready')}
              >
                <Check className="w-4 h-4 mr-2" />
                <span>Marcar como Listo</span>
              </Button>
            )}

            {order.status !== 'delivered' && (
              <Button
                type="button"
                variant="secondary"
                size="md"
                className="flex-1"
                disabled={updateStatusMutation.isPending}
                onClick={() => handleStatusChange('delivered')}
              >
                <PackageCheck className="w-4 h-4 mr-2" />
                <span>Marcar Entregado</span>
              </Button>
            )}

            {!isTerminal && onOpenCancelModal && (
              <Button
                type="button"
                variant="destructive"
                size="md"
                disabled={updateStatusMutation.isPending}
                onClick={() => onOpenCancelModal(order)}
              >
                <Ban className="w-4 h-4 mr-2" />
                <span>Cancelar</span>
              </Button>
            )}
          </div>
        </div>
      </div>
    </Drawer>
  );
}
