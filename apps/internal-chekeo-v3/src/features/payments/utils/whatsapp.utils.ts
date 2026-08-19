/**
 * whatsapp.utils.ts — PR-V3-11
 *
 * Utilidades de formateo telefónico, enlaces wa.me y plantillas preformateadas
 * de mensajes para el WhatsApp Bridge de Chekeo V3.
 */

import type { OrderV2 } from '@config/index';
import {
  normalizeOrderItems,
  formatCurrency,
  formatOrderTime,
  formatDeliveryLocation,
  formatDeliverySchedule,
  PAYMENT_METHOD_LABELS,
  PAYMENT_STATUS_CONFIGS,
} from '../../orders';
import { DEFAULT_BANK_DETAILS, type BankAccountDetails, type WhatsAppTemplateKey, type WhatsAppMessageTemplate } from '../types/payments.types';

/**
 * Normaliza cualquier número telefónico mexicano a formato internacional estándar (521XXXXXXXXXX o 52XXXXXXXXXX).
 */
export function normalizeWhatsAppPhone(phone?: string): string {
  if (!phone) return '';
  const digits = phone.replace(/\D/g, '');

  if (digits.length === 10) {
    return `521${digits}`;
  }
  if (digits.length === 12 && digits.startsWith('52')) {
    return digits;
  }
  if (digits.length === 13 && digits.startsWith('521')) {
    return digits;
  }
  return digits;
}

/**
 * Genera la URL directa a WhatsApp Web o App móvil con texto pre-cargado y codificado.
 */
export function buildWhatsAppUrl(phone?: string, text?: string): string {
  const normalizedPhone = normalizeWhatsAppPhone(phone);
  if (!normalizedPhone) return '#';
  const encodedText = text ? `?text=${encodeURIComponent(text)}` : '';
  return `https://wa.me/${normalizedPhone}${encodedText}`;
}

/**
 * Plantilla 1: Confirmación de Pago
 */
export function buildPaymentConfirmationMessage(order: OrderV2, extraNote?: string): string {
  const customerName = order.customerName?.trim() || 'Cliente';
  const folio = order.folio;
  const total = formatCurrency(order.total);
  const location = formatDeliveryLocation(order.delivery, order.orderMode);
  const schedule = formatDeliverySchedule(order.delivery, order.createdAt);
  const methodLabel = PAYMENT_METHOD_LABELS[order.paymentMethod] || 'Efectivo';

  const lines = [
    `¡Hola ${customerName}! 🍔✨`,
    '',
    `*Tu pago para el pedido #${folio} ha sido VALIDADO Y CONFIRMADO.*`,
    '',
    `• *Total Pagado:* ${total}`,
    `• *Método:* ${methodLabel}`,
    `• *Entrega en:* ${location}`,
    `• *Horario estimado:* ${schedule}`,
    '',
    '¡Tu pedido ya está en fila de preparación! Te avisaremos en cuanto esté en camino o listo para entrega.',
  ];

  if (extraNote?.trim()) {
    lines.push('', `*Nota:* ${extraNote.trim()}`);
  }

  lines.push('', '¡Muchas gracias por elegir Burgers.exe! 🔥');
  return lines.join('\n');
}

/**
 * Plantilla 2: Aviso de Pedido en Camino / Listo
 */
export function buildOrderOnTheWayMessage(order: OrderV2, extraNote?: string): string {
  const customerName = order.customerName?.trim() || 'Cliente';
  const folio = order.folio;
  const location = formatDeliveryLocation(order.delivery, order.orderMode);
  const isPickup = order.orderMode === 'pickup';

  const actionText = isPickup
    ? `¡Tu pedido *#${folio}* ya está *LISTO PARA RECOGER* en el punto de entrega!`
    : `¡Tu pedido *#${folio}* ya va *EN CAMINO* hacia ${location}! 🛵💨`;

  const lines = [
    `¡Hola ${customerName}! 🚀`,
    '',
    actionText,
    '',
    isPickup
      ? 'Puedes pasar a recogerlo con tu número de folio.'
      : 'Por favor mantén tu teléfono a la mano para coordinar la entrega en cuanto llegue el repartidor.',
  ];

  if (extraNote?.trim()) {
    lines.push('', `*Indicaciones:* ${extraNote.trim()}`);
  }

  lines.push('', '¡Que lo disfrutes al máximo! 🍔✨');
  return lines.join('\n');
}

/**
 * Plantilla 3: Resumen de Ticket
 */
export function buildTicketSummaryMessage(order: OrderV2, extraNote?: string): string {
  const customerName = order.customerName?.trim() || 'Cliente';
  const folio = order.folio;
  const total = formatCurrency(order.total);
  const location = formatDeliveryLocation(order.delivery, order.orderMode);
  const methodLabel = PAYMENT_METHOD_LABELS[order.paymentMethod] || 'Efectivo';
  const paymentStatus = order.paymentStatus === 'paid' ? 'Pagado ✅' : 'Pendiente ⏳';

  const normalizedItems = normalizeOrderItems(order.items);

  const itemLines = normalizedItems.map((item) => {
    const itemTotal = formatCurrency(item.lineTotal || item.unitPrice * item.qty);
    let desc = `• ${item.qty}x ${item.name} (${itemTotal})`;

    const subDetails: string[] = [];
    if (item.garnish) {
      subDetails.push(`  🍟 Guarnición: ${item.garnish.name}${item.garnish.upcharge ? ` (+${formatCurrency(item.garnish.upcharge)})` : ''}`);
    }
    if (item.includedDrink) {
      subDetails.push(`  🥤 Bebida: ${item.includedDrink.name}`);
    }
    if (item.removedIngredients.length > 0) {
      subDetails.push(`  🚫 Sin: ${item.removedIngredients.join(', ')}`);
    }
    if (item.extras.length > 0) {
      subDetails.push(`  ➕ Extras: ${item.extras.map((e) => e.name).join(', ')}`);
    }
    if (item.burgerNote) {
      subDetails.push(`  📝 Nota: "${item.burgerNote}"`);
    }

    if (subDetails.length > 0) {
      return `${desc}\n${subDetails.join('\n')}`;
    }
    return desc;
  });

  const lines = [
    `🧾 *Burgers.exe — Comprobante de Pedido #${folio}*`,
    '',
    `¡Hola ${customerName}! Aquí tienes el resumen detallado de tu orden:`,
    '',
    '*Detalle de Ítems:*',
    ...itemLines,
    '',
    '--------------------------------',
    `• *TOTAL A PAGAR:* ${total}`,
    `• *Forma de Pago:* ${methodLabel} (${paymentStatus})`,
    `• *Entrega:* ${location}`,
    '--------------------------------',
  ];

  if (order.notes) {
    lines.push(`• *Notas del pedido:* ${order.notes}`);
  }

  if (extraNote?.trim()) {
    lines.push('', `*Nota adicional:* ${extraNote.trim()}`);
  }

  lines.push('', '¡Cualquier duda estamos a tu disposición por este medio! ✨');
  return lines.join('\n');
}

/**
 * Plantilla 4: Recordatorio de Transferencia SPEI
 */
export function buildSpeiReminderMessage(
  order: OrderV2,
  extraNote?: string,
  bankDetails: BankAccountDetails = DEFAULT_BANK_DETAILS
): string {
  const customerName = order.customerName?.trim() || 'Cliente';
  const folio = order.folio;
  const total = formatCurrency(order.total);

  const lines = [
    `¡Hola ${customerName}! ⏳`,
    '',
    `Tu pedido *#${folio}* por un total de *${total}* está registrado y en espera de tu comprobante de pago por transferencia SPEI.`,
    '',
    '*Datos Bancarios para Transferir:*',
    `• *Banco:* ${bankDetails.bankName}`,
    `• *Beneficiario:* ${bankDetails.accountHolder}`,
    `• *CLABE Interbancaria:* ${bankDetails.clabe}`,
    `• *Concepto / Referencia:* ${bankDetails.referencePrefix} ${folio}`,
    '',
    'En cuanto realices la transferencia, compártenos tu comprobante por este chat para validar tu pedido e ingresarlo a cocina de inmediato. 🍳🔥',
  ];

  if (extraNote?.trim()) {
    lines.push('', `*Nota:* ${extraNote.trim()}`);
  }

  return lines.join('\n');
}

/**
 * Colección de plantillas estándar disponibles en el WhatsApp Bridge.
 */
export const WHATSAPP_TEMPLATES: WhatsAppMessageTemplate[] = [
  {
    key: 'confirmation',
    title: 'Confirmación de Pago',
    shortLabel: 'Pago Confirmado',
    description: 'Avisa al cliente que su transferencia o pago fue validado con éxito.',
    iconName: 'check-circle',
    generate: (order, note) => buildPaymentConfirmationMessage(order, note),
  },
  {
    key: 'on_the_way',
    title: 'Aviso en Camino / Listo',
    shortLabel: 'En Camino / Listo',
    description: 'Notifica que el pedido fue despachado o está listo para entrega.',
    iconName: 'truck',
    generate: (order, note) => buildOrderOnTheWayMessage(order, note),
  },
  {
    key: 'ticket_summary',
    title: 'Resumen de Ticket',
    shortLabel: 'Resumen Completo',
    description: 'Envía el desglose completo de ítems, totales y forma de pago.',
    iconName: 'receipt',
    generate: (order, note) => buildTicketSummaryMessage(order, note),
  },
  {
    key: 'spei_reminder',
    title: 'Recordatorio de Transferencia SPEI',
    shortLabel: 'Recordatorio SPEI',
    description: 'Envía los datos bancarios y CLABE para órdenes con pago pendiente.',
    iconName: 'clock',
    generate: (order, note) => buildSpeiReminderMessage(order, note),
  },
  {
    key: 'custom',
    title: 'Mensaje Personalizado',
    shortLabel: 'Personalizado',
    description: 'Escribe un mensaje libre para el cliente conservando el enlace directo.',
    iconName: 'edit-3',
    generate: (order, note) => {
      const name = order.customerName?.trim() || 'Cliente';
      const base = `¡Hola ${name}! Te contactamos de Burgers.exe respecto a tu orden #${order.folio}:`;
      return note?.trim() ? `${base}\n\n${note.trim()}` : base;
    },
  },
];
