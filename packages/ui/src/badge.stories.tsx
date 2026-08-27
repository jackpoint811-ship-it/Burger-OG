import type { Meta, StoryObj } from '@storybook/react';
import { Badge } from './badge';

const meta: Meta<typeof Badge> = {
  title: 'Design System / Badge',
  component: Badge,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'secondary', 'outline', 'destructive', 'success', 'warning'],
      description: 'Variante semántica del badge',
    },
    children: {
      control: 'text',
      description: 'Texto de la etiqueta',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Badge>;

export const Default: Story = {
  args: {
    children: 'CHEKEO V3',
    variant: 'default',
  },
};

export const Success: Story = {
  args: {
    children: '✓ Pagado',
    variant: 'success',
  },
};

export const Warning: Story = {
  args: {
    children: '⏱️ Por Confirmar',
    variant: 'warning',
  },
};

export const Destructive: Story = {
  args: {
    children: 'Cancelado',
    variant: 'destructive',
  },
};

export const Outline: Story = {
  args: {
    children: 'Torre GGA · Depto 402',
    variant: 'outline',
  },
};
