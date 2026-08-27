/**
 * payments.types.ts — PR-V3-11
 *
 * Tipos de datos, modelos de resumen financiero y plantillas de WhatsApp
 * para el módulo de Pagos y Conciliación de Chekeo V3.
 */

import type { OrderV2, OrderV2PaymentMethod, OrderV2PaymentStatus } from '@config/index';

export type PaymentFilterMethod = 'all' | 'transfer' | 'cash' | 'card';
export type PaymentFilterStatus = 'all' | 'pending' | 'paid' | 'cancelled';
export type PaymentFilterMode = 'all' | 'pickup' | 'delivery';
export type PaymentDateHorizon = 'today' | 'all';

export interface PaymentFilterCriteria {
  search?: string;
  method?: PaymentFilterMethod;
  status?: PaymentFilterStatus;
  mode?: PaymentFilterMode;
  tower?: string;
  selectedDate?: string;
  dateHorizon?: PaymentDateHorizon;
}

export interface FinancialSummary {
  // Totales generales (órdenes activas no canceladas)
  totalRevenue: number;
  totalOrdersCount: number;

  // Desglose por método de pago
  transferRevenue: number;
  transferCount: number;
  cashRevenue: number;
  cashCount: number;
  cardRevenue: number;
  cardCount: number;

  // Conciliación y estados
  pendingTransferCount: number;
  pendingTransferAmount: number;
  pendingCashCount: number;
  pendingCashAmount: number;
  pendingTotalCount: number;
  pendingTotalAmount: number;
  paidTotalCount: number;
  paidTotalAmount: number;
  cancelledTotalCount: number;
  cancelledTotalAmount: number;
}

export type WhatsAppTemplateKey =
  | 'confirmation'
  | 'on_the_way'
  | 'ticket_summary'
  | 'spei_reminder'
  | 'custom';

export interface WhatsAppMessageTemplate {
  key: WhatsAppTemplateKey;
  title: string;
  shortLabel: string;
  description: string;
  iconName: 'check-circle' | 'truck' | 'receipt' | 'clock' | 'edit-3';
  generate: (order: OrderV2, extraNote?: string) => string;
}

export interface BankAccountDetails {
  bankName: string;
  accountHolder: string;
  clabe: string;
  accountNumber?: string;
  referencePrefix?: string;
}

export const DEFAULT_BANK_DETAILS: BankAccountDetails = {
  bankName: 'BBVA México',
  accountHolder: 'Burgers.exe S.A.',
  clabe: '012180015948372615',
  accountNumber: '1594837261',
  referencePrefix: 'BURGERS',
};
