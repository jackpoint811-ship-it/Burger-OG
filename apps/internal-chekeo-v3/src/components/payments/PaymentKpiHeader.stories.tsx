import type { Meta, StoryObj } from '@storybook/react';
import { PaymentKpiHeader } from './PaymentKpiHeader';
import type { FinancialSummary } from '../../features/payments';

const mockSummary: FinancialSummary = {
  totalRevenue: 14850,
  totalOrdersCount: 42,
  transferRevenue: 9800,
  transferCount: 28,
  cashRevenue: 5050,
  cashCount: 14,
  cardRevenue: 0,
  cardCount: 0,
  pendingTransferCount: 2,
  pendingTransferAmount: 700,
  pendingTotalCount: 4,
  pendingTotalAmount: 1350,
  paidTotalCount: 38,
  paidTotalAmount: 13500,
  cancelledTotalCount: 0,
  cancelledTotalAmount: 0,
};

const meta: Meta<typeof PaymentKpiHeader> = {
  title: 'Chekeo V3 / Pagos / PaymentKpiHeader',
  component: PaymentKpiHeader,
  tags: ['autodocs'],
  argTypes: {
    selectedMethod: {
      control: 'select',
      options: ['all', 'transfer', 'cash'],
      description: 'Método actualmente filtrado',
    },
  },
};

export default meta;
type Story = StoryObj<typeof PaymentKpiHeader>;

export const TodosLosCobros: Story = {
  args: {
    financialSummary: mockSummary,
    selectedMethod: 'all',
    onFilterByPending: () => alert('Filtro activado: Por Confirmar'),
    onFilterByMethod: (method) => alert(`Filtro activado: ${method}`),
  },
};

export const FiltradoTransferencia: Story = {
  args: {
    financialSummary: mockSummary,
    selectedMethod: 'transfer',
    onFilterByPending: () => alert('Filtro activado: Por Confirmar'),
    onFilterByMethod: (method) => alert(`Filtro activado: ${method}`),
  },
};

export const SinCobrosPendientes: Story = {
  args: {
    financialSummary: {
      ...mockSummary,
      pendingTotalAmount: 0,
      pendingTotalCount: 0,
      pendingTransferCount: 0,
      pendingTransferAmount: 0,
    },
    selectedMethod: 'all',
    onFilterByPending: () => alert('Filtro activado: Por Confirmar'),
    onFilterByMethod: (method) => alert(`Filtro activado: ${method}`),
  },
};
