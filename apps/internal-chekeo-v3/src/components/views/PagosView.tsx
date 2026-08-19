/**
 * PagosView.tsx — PR-V3-11
 *
 * Vista principal de Pagos y Conciliación para Chekeo V3:
 * - Integración de PaymentsManager con resumen financiero en tiempo real.
 * - Validación de transferencias SPEI en 1-clic.
 * - Generador de tickets térmicos 80mm y WhatsApp Bridge integrado.
 */

import React from 'react';
import { PaymentsManager } from '../payments';

export function PagosView() {
  return <PaymentsManager />;
}
