/**
 * cart.store.ts — PR-V3-04
 *
 * Zustand store centralizado del carrito de Public Order V3.
 * Reemplaza el estado disperso en el god component V2.
 *
 * Tipos derivados desde @burgers/config (packages/config/src/schemas.ts).
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { ZodMenuItem } from '@config/schemas';

// ─── Tipos del carrito ────────────────────────────────────────────────────────

export interface CartItemCustomization {
  /** Etiqueta de línea para identificación interna */
  lineKey?: string;
  itemKind?: 'burger' | 'combo' | 'garnish' | 'drink' | 'other';
  removedIngredients?: string[];
  extras?: Array<{ sku?: string; name: string; price?: number }>;
  burgerNote?: string;
  garnish?: { sku?: string; name: string; upcharge?: number } | null;
  includedDrink?: { sku?: string; name: string } | null;
  sideQuestExtras?: Array<{ sku?: string; name: string; price?: number; itemKind?: 'garnish' | 'drink' }>;
  comboBurgers?: Array<{
    sku?: string;
    name: string;
    removedIngredients: string[];
    extras: Array<{ sku?: string; name: string; price?: number }>;
    burgerNote?: string;
  }>;
  extrasTotalCents?: number;
  sideQuestExtrasTotalCents?: number;
  includedGarnishUpchargeCents?: number;
}

export interface CartItem {
  /** ID único de línea en el carrito (UUID generado al agregar) */
  cartLineId: string;
  sku: string;
  name: string;
  /** Precio base en pesos (no centavos) */
  unitPrice: number;
  quantity: number;
  customization?: CartItemCustomization;
  /** Precio efectivo de línea = (unitPrice + extras upcharges) × quantity */
  lineTotal: number;
}

// ─── Estado y acciones ────────────────────────────────────────────────────────

interface CartState {
  items: CartItem[];
  /** Total de pesos calculado del carrito */
  totalAmount: number;
  /** Número total de productos (suma de quantities) */
  totalItems: number;
}

interface CartActions {
  /**
   * Agrega un ítem al carrito.
   * Si ya existe una línea con el mismo cartLineId, incrementa la cantidad.
   */
  addItem: (item: Omit<CartItem, 'cartLineId'> & { cartLineId?: string }) => void;
  /**
   * Actualiza la cantidad de una línea específica.
   * Si qty <= 0, elimina la línea.
   */
  updateQuantity: (cartLineId: string, qty: number) => void;
  /** Elimina una línea del carrito */
  removeItem: (cartLineId: string) => void;
  /** Vacía completamente el carrito */
  clearCart: () => void;
  /** Carga el carrito desde un snapshot (ej. re-order) */
  loadSnapshot: (items: CartItem[]) => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function generateLineId(): string {
  return `line_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function computeLineTotals(items: CartItem[]): { totalAmount: number; totalItems: number } {
  return items.reduce(
    (acc, item) => ({
      totalAmount: acc.totalAmount + item.lineTotal,
      totalItems: acc.totalItems + item.quantity,
    }),
    { totalAmount: 0, totalItems: 0 }
  );
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useCartStore = create<CartState & CartActions>()(
  persist(
    (set, get) => ({
      // Estado inicial
      items: [],
      totalAmount: 0,
      totalItems: 0,

      // ── Acciones ──────────────────────────────────────────────────────────

      addItem: (incoming) => {
        const cartLineId = incoming.cartLineId ?? generateLineId();
        const existing = get().items.find((i) => i.cartLineId === cartLineId);

        let nextItems: CartItem[];

        if (existing) {
          // Línea existente: suma cantidad
          nextItems = get().items.map((i) =>
            i.cartLineId === cartLineId
              ? {
                  ...i,
                  quantity: i.quantity + incoming.quantity,
                  lineTotal: (i.quantity + incoming.quantity) * i.unitPrice,
                }
              : i
          );
        } else {
          // Línea nueva
          const newItem: CartItem = { ...incoming, cartLineId };
          nextItems = [...get().items, newItem];
        }

        set({ items: nextItems, ...computeLineTotals(nextItems) });
      },

      updateQuantity: (cartLineId, qty) => {
        let nextItems: CartItem[];
        if (qty <= 0) {
          nextItems = get().items.filter((i) => i.cartLineId !== cartLineId);
        } else {
          nextItems = get().items.map((i) =>
            i.cartLineId === cartLineId
              ? { ...i, quantity: qty, lineTotal: qty * i.unitPrice }
              : i
          );
        }
        set({ items: nextItems, ...computeLineTotals(nextItems) });
      },

      removeItem: (cartLineId) => {
        const nextItems = get().items.filter((i) => i.cartLineId !== cartLineId);
        set({ items: nextItems, ...computeLineTotals(nextItems) });
      },

      clearCart: () => {
        set({ items: [], totalAmount: 0, totalItems: 0 });
      },

      loadSnapshot: (items) => {
        set({ items, ...computeLineTotals(items) });
      },
    }),
    {
      name: 'burgers-v3-cart',
      storage: createJSONStorage(() => localStorage),
      // Solo persistimos items; totales se recomputan al rehidratar
      partialize: (state) => ({ items: state.items }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          const { totalAmount, totalItems } = computeLineTotals(state.items);
          state.totalAmount = totalAmount;
          state.totalItems = totalItems;
        }
      },
    }
  )
);

// ─── Selectores ───────────────────────────────────────────────────────────────

export const selectCartItems = (s: CartState) => s.items;
export const selectCartTotal = (s: CartState) => s.totalAmount;
export const selectCartCount = (s: CartState) => s.totalItems;
export const selectIsCartEmpty = (s: CartState) => s.items.length === 0;

/**
 * Selector compuesto: cantidad de una línea específica.
 * Uso: useCartStore(selectItemQty(cartLineId))
 */
export const selectItemQty =
  (cartLineId: string) =>
  (s: CartState): number =>
    s.items.find((i) => i.cartLineId === cartLineId)?.quantity ?? 0;

// ─── Helper para construir CartItem desde MenuItem ────────────────────────────

export function menuItemToCartItem(
  item: ZodMenuItem,
  quantity = 1,
  customization?: CartItemCustomization
): Omit<CartItem, 'cartLineId'> {
  const effectivePrice = item.isPromoActive && item.promoPrice != null ? item.promoPrice : item.price;
  const extrasCents = customization?.extrasTotalCents ?? 0;
  const garnishUpchargeCents = customization?.includedGarnishUpchargeCents ?? 0;
  const sideQuestCents = customization?.sideQuestExtrasTotalCents ?? 0;
  const upchargeTotal = (extrasCents + garnishUpchargeCents + sideQuestCents) / 100;
  const unitPrice = effectivePrice + upchargeTotal;

  return {
    sku: item.sku,
    name: item.name,
    unitPrice,
    quantity,
    customization,
    lineTotal: unitPrice * quantity,
  };
}
