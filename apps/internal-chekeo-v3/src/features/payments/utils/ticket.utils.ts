/**
 * ticket.utils.ts — PR-V3-11
 *
 * Generador de tickets verticales estandarizados para impresora térmica de recibos (80mm / 58mm)
 * y exportador de texto plano para copia rápida.
 */

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
} from '../../orders';
import {
  formatKitchenExtraLabel,
  formatKitchenRemovalLabel,
} from '../../kitchen';

/**
 * Genera el contenido en texto monoespaciado estandarizado para impresión o copia.
 */
export function generateVerticalTicketText(order: OrderV2): string {
  const lineDivider = '========================================';
  const subDivider  = '----------------------------------------';
  const dateStr = formatOrderDate(order.createdAt);
  const timeStr = formatOrderTime(order.createdAt);
  const location = formatDeliveryLocation(order.delivery, order.orderMode);
  const schedule = formatDeliverySchedule(order.delivery, order.createdAt);
  const methodLabel = PAYMENT_METHOD_LABELS[order.paymentMethod] || 'Efectivo';
  const isPaid = order.paymentStatus === 'paid';
  const paymentStatusLabel = isPaid ? 'PAGADO / VALIDADO' : 'PENDIENTE DE COBRO';

  const normalizedItems = normalizeOrderItems(order.items);

  const lines: string[] = [
    lineDivider,
    '             BURGERS.EXE',
    '       SMASH BURGERS & SIDES',
    lineDivider,
    `FOLIO:   #${order.folio}`,
    `FECHA:   ${dateStr}  ${timeStr} (CDMX)`,
    `CLIENTE: ${order.customerName}`,
    `TEL:     ${order.customerPhone}`,
    `MODO:    ${order.orderMode.toUpperCase()}`,
    `ENTREGA: ${location}`,
    `HORARIO: ${schedule}`,
    subDivider,
    'CANT  PRODUCTO                    TOTAL',
    subDivider,
  ];

  normalizedItems.forEach((item) => {
    const qtyStr = `${item.qty}x`.padEnd(5, ' ');
    const lineTotalStr = formatCurrency(item.lineTotal || item.unitPrice * item.qty);
    const maxNameLen = 35 - lineTotalStr.length;
    const nameStr = item.name.length > maxNameLen ? `${item.name.slice(0, maxNameLen - 1)}…` : item.name;
    const padding = Math.max(1, 40 - qtyStr.length - nameStr.length - lineTotalStr.length);
    
    lines.push(`${qtyStr}${nameStr}${' '.repeat(padding)}${lineTotalStr}`);

    if (item.garnish) {
      const upchargeText = item.garnish.upcharge ? ` (+${formatCurrency(item.garnish.upcharge)})` : '';
      lines.push(`      • Guarnición: ${item.garnish.name}${upchargeText}`);
    }

    if (item.includedDrink) {
      lines.push(`      • Bebida: ${item.includedDrink.name}`);
    }

    if (item.removedIngredients.length > 0) {
      lines.push(`      • ${item.removedIngredients.map((r) => formatKitchenRemovalLabel(r)).join(', ')}`);
    }

    if (item.extras.length > 0) {
      lines.push(`      • ${item.extras.map((e) => formatKitchenExtraLabel(e)).join(', ')}`);
    }

    if (item.burgerNote) {
      lines.push(`      • Nota: "${item.burgerNote}"`);
    }
  });

  lines.push(subDivider);
  lines.push(`SUBTOTAL:                      ${formatCurrency(order.subtotal || order.total).padStart(9, ' ')}`);
  lines.push(`TOTAL:                         ${formatCurrency(order.total).padStart(9, ' ')}`);
  lines.push(subDivider);
  lines.push(`FORMA DE PAGO:  ${methodLabel}`);
  lines.push(`ESTADO DE PAGO: [ ${paymentStatusLabel} ]`);

  if (order.notes) {
    lines.push(subDivider);
    lines.push(`NOTAS: ${order.notes}`);
  }

  lines.push(lineDivider);
  lines.push('       ¡GRACIAS POR TU PREFERENCIA!');
  lines.push('          www.burgers-exe.com');
  lines.push(lineDivider);

  return lines.join('\n');
}

/**
 * Invoca el diálogo de impresión del navegador para el ticket 80mm.
 */
export function printVerticalTicket(order: OrderV2): void {
  const ticketText = generateVerticalTicketText(order);

  const printWindow = window.open('', '_blank', 'width=420,height=700');
  if (!printWindow) {
    alert('Por favor habilita las ventanas emergentes (popups) para imprimir el ticket.');
    return;
  }

  const html = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="utf-8">
      <title>Ticket #${order.folio} — Burgers.exe</title>
      <style>
        @page {
          size: 80mm auto;
          margin: 0;
        }
        body {
          font-family: 'Courier New', Courier, monospace, monospace;
          font-size: 12px;
          line-height: 1.35;
          color: #000;
          background: #fff;
          margin: 0;
          padding: 8mm 4mm;
          width: 72mm;
          max-width: 80mm;
          box-sizing: border-box;
        }
        pre {
          white-space: pre-wrap;
          word-wrap: break-word;
          margin: 0;
          font-family: inherit;
        }
        @media print {
          body {
            padding: 2mm;
            width: 100%;
          }
        }
      </style>
    </head>
    <body>
      <pre>${ticketText.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>
      <script>
        window.onload = function() {
          window.focus();
          window.print();
          setTimeout(function() { window.close(); }, 500);
        };
      </script>
    </body>
    </html>
  `;

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
}
