import type { Meta, StoryObj } from '@storybook/react';
import { OrderCard } from './OrderCard';
import type { OrderV2 } from '@config/index';

const baseMockOrder: OrderV2 = {
  id: 'ord_sample_01',
  folio: '042',
  customerName: 'Rodrigo Alarcón',
  customerPhone: '5512345678',
  status: 'new',
  paymentStatus: 'paid',
  paymentMethod: 'transfer',
  orderMode: 'delivery',
  source: 'public-v2-preview',
  delivery: {
    location: 'Torre GGA · Depto 402',
    isScheduled: false,
    scheduledDate: new Date().toISOString().split('T')[0],
  },
  items: [
    {
      id: 'item_1',
      orderId: 'ord_sample_01',
      sku: 'BURGER_OG_DOBLE',
      name: 'Hamburguesa OG Doble',
      qty: 1,
      unitPrice: 189,
      lineTotal: 234,
      modifiers: [
        { type: 'remove', name: 'Cebolla', priceCents: 0 },
        { type: 'extra', name: 'Carne Extra', priceCents: 4500 },
      ],
    },
    {
      id: 'item_2',
      orderId: 'ord_sample_01',
      sku: 'PAPAS_ESPECIALES',
      name: 'Papas Especiales',
      qty: 1,
      unitPrice: 65,
      lineTotal: 65,
    },
    {
      id: 'item_3',
      orderId: 'ord_sample_01',
      sku: 'COCA_COLA',
      name: 'Coca-Cola 355ml',
      qty: 1,
      unitPrice: 35,
      lineTotal: 35,
    },
  ],
  subtotal: 334,
  total: 334,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const meta: Meta<typeof OrderCard> = {
  title: 'Chekeo V3 / Pedidos / OrderCard',
  component: OrderCard,
  tags: ['autodocs'],
  argTypes: {
    isPriority: {
      control: 'boolean',
      description: 'Destaca la comanda con borde de prioridad',
    },
    selected: {
      control: 'boolean',
      description: 'Indica si está seleccionada en el lote',
    },
    isArchived: {
      control: 'boolean',
      description: 'Estado archivado',
    },
  },
};

export default meta;
type Story = StoryObj<typeof OrderCard>;

export const NuevoPagado: Story = {
  args: {
    order: baseMockOrder,
    isPriority: false,
    selected: false,
    onOpenDetail: () => alert('Abrir detalle'),
    onOpenCancel: () => alert('Abrir cancelación'),
  },
};

export const UrgentePrioritario: Story = {
  args: {
    order: {
      ...baseMockOrder,
      folio: '099',
      customerName: 'Dra. Patricia Garza',
      delivery: {
        ...baseMockOrder.delivery,
        location: 'Torre Valcob · PH-01',
      },
    },
    isPriority: true,
    selected: false,
    onOpenDetail: () => alert('Abrir detalle'),
    onOpenCancel: () => alert('Abrir cancelación'),
  },
};

export const EnPreparacion: Story = {
  args: {
    order: {
      ...baseMockOrder,
      folio: '043',
      status: 'preparing',
    },
    isPriority: false,
    selected: false,
    onOpenDetail: () => alert('Abrir detalle'),
    onOpenCancel: () => alert('Abrir cancelación'),
  },
};

export const ListoParaEntrega: Story = {
  args: {
    order: {
      ...baseMockOrder,
      folio: '044',
      status: 'ready',
    },
    isPriority: false,
    selected: false,
    onOpenDetail: () => alert('Abrir detalle'),
    onOpenCancel: () => alert('Abrir cancelación'),
  },
};

export const PorConfirmarPago: Story = {
  args: {
    order: {
      ...baseMockOrder,
      folio: '045',
      paymentStatus: 'pending',
      paymentMethod: 'cash',
    },
    isPriority: false,
    selected: false,
    onOpenDetail: () => alert('Abrir detalle'),
    onOpenCancel: () => alert('Abrir cancelación'),
  },
};
