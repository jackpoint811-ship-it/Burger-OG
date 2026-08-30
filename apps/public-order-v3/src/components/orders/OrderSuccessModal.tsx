import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import {
  CheckCircle2,
  Copy,
  Check,
  MessageSquare,
  Users,
  Building2,
  Calendar,
  CreditCard,
  Sparkles,
  ArrowLeft,
} from 'lucide-react';
import type { CreateOrderV2Response } from '@config/contracts';
import { getActiveTenant } from '@config';
import { formatCurrency } from '../../utils/format';

export interface OrderSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderResponse: CreateOrderV2Response | null;
  orderDetails?: {
    customerName: string;
    customerPhone: string;
    locationName: string;
    deliveryLabel: string;
    isScheduled: boolean;
    scheduledDate?: string;
    paymentMethod: string;
    total: number;
    supportPhone?: string;
  } | null;
}

const OFFICIAL_WA_GROUP_URL = 'https://chat.whatsapp.com/GycE5zALOypGPvJVaMfbPp';
const DEFAULT_SUPPORT_PHONE = '5212221234567';

export function OrderSuccessModal({
  isOpen,
  onClose,
  orderResponse,
  orderDetails,
}: OrderSuccessModalProps) {
  const shouldReduceMotion = useReducedMotion();
  const [copiedFolio, setCopiedFolio] = useState(false);
  const [copiedReferral, setCopiedReferral] = useState(false);

  const folio = orderResponse?.data?.order?.folio || 'ORD-V3';
  const total = orderResponse?.data?.order?.total ?? orderDetails?.total ?? 0;
  const customerName = orderDetails?.customerName || 'Cliente';
  const locationName = orderDetails?.locationName || 'Torre Corporativa';
  const isScheduled = orderDetails?.isScheduled || false;
  const scheduledDate = orderDetails?.scheduledDate || '';
  const deliveryLabel = orderDetails?.deliveryLabel || '1:30 PM';
  const paymentMethod = orderDetails?.paymentMethod || 'cash';
  const supportPhone = (orderDetails?.supportPhone || DEFAULT_SUPPORT_PHONE).replace(/\D/g, '');

  const earnedTickets = orderResponse?.data?.earnedTickets;
  const activeRaffleTitle = orderResponse?.data?.activeRaffleTitle;
  const customerReferralCode = orderResponse?.data?.customerReferralCode;

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleCopyFolio = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(folio);
      setCopiedFolio(true);
      setTimeout(() => setCopiedFolio(false), 2500);
    }
  };

  const handleCopyReferral = () => {
    if (customerReferralCode && typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(customerReferralCode);
      setCopiedReferral(true);
      setTimeout(() => setCopiedReferral(false), 2500);
    }
  };

  const paymentLabel =
    paymentMethod === 'cash'
      ? '💵 Efectivo contra entrega'
      : paymentMethod === 'transfer'
      ? '📱 Transferencia'
      : '💬 Confirmar por WhatsApp';

  const tenant = getActiveTenant();

  // Construct WhatsApp direct confirmation message
  const waText = encodeURIComponent(
    `¡Hola ${tenant.brandName}! 👋\n` +
      `Acabo de realizar mi pedido *#${folio}* a nombre de *${customerName}*.\n` +
      `📍 Entrega: *${locationName}* (${isScheduled ? `Programado: ${scheduledDate}` : 'Hoy'} a las ${deliveryLabel})\n` +
      `💰 Total: *${formatCurrency(total)}*\n` +
      `💳 Método de pago: *${paymentLabel}*\n\n` +
      (paymentMethod === 'transfer'
        ? `Adjunto mi comprobante de transferencia bancaria para validación. ✨`
        : `¡Quedo atento a la entrega! ${tenant.logoEmoji}`)
  );

  const waSendReceiptUrl = `https://wa.me/${supportPhone || DEFAULT_SUPPORT_PHONE}?text=${waText}`;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          className="fixed inset-0 bg-black/60 backdrop-blur-xs"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          aria-hidden="true"
        />

        {/* Modal Card */}
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-labelledby="order-success-title"
          className="relative z-50 w-full max-w-lg rounded-3xl bg-surface-card border border-line shadow-floating max-h-[92vh] flex flex-col overflow-hidden"
          initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.92, y: 20 }}
          animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, scale: 1, y: 0 }}
          exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.92, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        >
          {/* Scrollable Content */}
          <div className="p-6 sm:p-7 overflow-y-auto space-y-5 flex-1">
            {/* Celebration Icon & Title */}
            <div className="text-center space-y-2 pt-2">
              <motion.div
                initial={shouldReduceMotion ? {} : { scale: 0 }}
                animate={shouldReduceMotion ? {} : { scale: 1 }}
                transition={{ type: 'spring', delay: 0.1, damping: 15 }}
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-accent/15 text-accent mx-auto flex items-center justify-center border-2 border-accent/20 shadow-panel"
              >
                <CheckCircle2 className="w-10 h-10 sm:w-12 sm:h-12" />
              </motion.div>
              <h2
                id="order-success-title"
                className="text-2xl sm:text-3xl font-extrabold text-text-primary tracking-tight"
              >
                ¡Pedido Confirmado!
              </h2>
              <p className="text-sm text-text-secondary max-w-sm mx-auto">
                Tu orden ha sido registrada en cocina y comenzará a prepararse puntualmente para tu
                entrega.
              </p>
            </div>

            {/* Folio Highlight Card */}
            <div className="p-4 rounded-2xl bg-surface border border-line flex items-center justify-between gap-3 shadow-xs">
              <div className="space-y-0.5">
                <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">
                  Folio de seguimiento
                </span>
                <p className="text-xl sm:text-2xl font-black text-accent tracking-tight">
                  #{folio}
                </p>
              </div>
              <button
                type="button"
                onClick={handleCopyFolio}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-surface-card border border-line text-xs font-bold text-text-primary hover:border-accent/40 transition-colors cursor-pointer min-h-[44px]"
                aria-label="Copiar folio del pedido"
              >
                {copiedFolio ? (
                  <>
                    <Check className="w-4 h-4 text-accent" />
                    <span className="text-accent">¡Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 text-text-secondary" />
                    <span>Copiar</span>
                  </>
                )}
              </button>
            </div>

            {/* Order Summary Details */}
            <div className="p-4 rounded-2xl bg-surface-card border border-line space-y-2.5 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-line">
                <span className="text-text-muted flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-accent" />
                  Punto de entrega
                </span>
                <span className="font-bold text-text-primary">{locationName}</span>
              </div>

              <div className="flex items-center justify-between pb-2 border-b border-line">
                <span className="text-text-muted flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-accent" />
                  Horario de entrega
                </span>
                <span className="font-bold text-text-primary">
                  {isScheduled ? `📅 ${scheduledDate} · ${deliveryLabel}` : `⚡ Hoy · ${deliveryLabel}`}
                </span>
              </div>

              <div className="flex items-center justify-between pb-2 border-b border-line">
                <span className="text-text-muted flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5 text-accent" />
                  Forma de pago
                </span>
                <span className="font-bold text-text-primary">{paymentLabel}</span>
              </div>

              <div className="flex items-center justify-between pt-1 text-sm font-extrabold">
                <span className="text-text-primary">Total</span>
                <span className="text-base text-accent font-black">{formatCurrency(total)}</span>
              </div>
            </div>

            {/* Raffle / Referral Reward Banner */}
            {earnedTickets && earnedTickets.totalTickets > 0 && (
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-2 text-xs">
                <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-bold">
                  <span className="text-base" aria-hidden="true">🎁</span>
                  <span>
                    ¡Ganaste {earnedTickets.totalTickets} boletos para el sorteo!
                  </span>
                </div>
                {activeRaffleTitle && (
                  <p className="text-text-secondary font-medium">
                    Participas activamente en: <strong>{activeRaffleTitle}</strong>.
                  </p>
                )}
                {customerReferralCode && (
                  <div className="pt-1 flex items-center justify-between gap-2 border-t border-amber-500/20">
                    <span className="text-text-muted">Tu código de referido:</span>
                    <button
                      type="button"
                      onClick={handleCopyReferral}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500/15 text-amber-700 dark:text-amber-300 font-black tracking-wider hover:bg-amber-500/25 transition-colors cursor-pointer"
                    >
                      <span>{customerReferralCode}</span>
                      {copiedReferral ? (
                        <Check className="w-3.5 h-3.5 text-accent" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* WhatsApp Actions */}
            <div className="space-y-2.5 pt-1">
              <a
                href={waSendReceiptUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3.5 px-4 rounded-2xl bg-[#16A34A] hover:bg-[#15803D] text-white font-extrabold text-sm flex items-center justify-center gap-2 transition-colors shadow-cta cursor-pointer min-h-[48px]"
              >
                <MessageSquare className="w-4 h-4" />
                <span>
                  {paymentMethod === 'transfer'
                    ? '📲 Enviar comprobante por WhatsApp'
                    : '📲 Confirmar en WhatsApp'}
                </span>
              </a>

              <a
                href={OFFICIAL_WA_GROUP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3 px-4 rounded-2xl bg-surface border border-line hover:border-accent/40 text-text-primary font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer min-h-[44px]"
              >
                <Users className="w-4 h-4 text-accent" />
                <span>💬 Unirme a la comunidad oficial de WhatsApp</span>
              </a>
            </div>
          </div>

          {/* Footer Back to Menu CTA */}
          <div className="p-4 sm:p-5 border-t border-line bg-surface-card shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="w-full py-3 px-4 rounded-2xl bg-surface border border-line text-text-primary hover:bg-surface-raised font-bold text-sm transition-colors cursor-pointer min-h-[48px] flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-4 h-4 text-text-secondary" />
              <span>Volver al Menú de Productos</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
