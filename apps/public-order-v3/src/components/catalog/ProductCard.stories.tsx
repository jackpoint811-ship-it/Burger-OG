import type { Meta, StoryObj } from '@storybook/react';
import { ProductCard } from './ProductCard';
import type { MenuItem } from '@config/contracts';

const mockBurger: MenuItem = {
  sku: 'BURGER_OG_SENCILLA',
  name: 'Hamburguesa OG Sencilla',
  description: 'Carne smash 100% de res, queso americano derretido, cebolla picada, pepinillos y aderezo de la casa.',
  price: 149,
  category: 'burgers',
  badge: 'Más Vendida',
  isAvailable: true,
  isFeatured: true,
  sortOrder: 1,
  tags: ['smash', 'og'],
  upsellItems: ['PAPAS_ESPECIALES', 'COCA_COLA'],
  comboLinks: ['COMBO_OG_SENCILLA'],
};

const meta: Meta<typeof ProductCard> = {
  title: 'Public Order V3 / Catálogo / ProductCard',
  component: ProductCard,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof ProductCard>;

export const Estandar: Story = {
  args: {
    item: mockBurger,
  },
};

export const EnPromocion: Story = {
  args: {
    item: {
      ...mockBurger,
      name: 'Combo OG Doble + Papas',
      category: 'combos',
      price: 249,
      isPromoActive: true,
      promoPrice: 199,
      promoLabel: '20% OFF HOY',
      badge: 'PROMO FLASH',
    },
  },
};

export const Agotado: Story = {
  args: {
    item: {
      ...mockBurger,
      name: 'Hamburguesa Especial Trufa',
      isAvailable: false,
    },
  },
};
