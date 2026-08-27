import type { Meta, StoryObj } from '@storybook/react';
import { Button } from './button';

const meta: Meta<typeof Button> = {
  title: 'Design System / Button',
  component: Button,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'secondary', 'outline', 'destructive', 'ghost', 'link'],
      description: 'Variante visual del botón según la jerarquía de acción',
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg', 'icon'],
      description: 'Tamaño del botón (todos cumplen con target táctil accesible)',
    },
    disabled: {
      control: 'boolean',
      description: 'Estado deshabilitado',
    },
    children: {
      control: 'text',
      description: 'Contenido del botón',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Button>;

export const Default: Story = {
  args: {
    children: 'Iniciar Pedido',
    variant: 'default',
    size: 'md',
  },
};

export const Secondary: Story = {
  args: {
    children: 'Ver Detalles',
    variant: 'secondary',
    size: 'md',
  },
};

export const Outline: Story = {
  args: {
    children: 'Modificar Comanda',
    variant: 'outline',
    size: 'md',
  },
};

export const Destructive: Story = {
  args: {
    children: 'Cancelar Orden',
    variant: 'destructive',
    size: 'md',
  },
};

export const LargeCTA: Story = {
  args: {
    children: 'Completar Pedido · $249.00',
    variant: 'default',
    size: 'lg',
    className: 'shadow-cta w-full max-w-sm font-black',
  },
};

export const Disabled: Story = {
  args: {
    children: 'Cocina Cerrada',
    variant: 'default',
    size: 'md',
    disabled: true,
  },
};
