/**
 * ui.store.ts — PR-V3-04
 *
 * Zustand store de estado de la UI para Public Order V3.
 * Controla: drawers, toast, categoría activa y producto seleccionado.
 */

import { create } from 'zustand';
import type { ZodMenuItem } from '@config/schemas';
import type { CartItem } from './cart.store';

// ─── Tipos ────────────────────────────────────────────────────────────────────

export type DrawerName = 'product' | 'cart' | 'checkout';

export interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
  durationMs?: number;
}

interface UIState {
  /** Drawer actualmente abierto, o null si ninguno */
  activeDrawer: DrawerName | null;
  /** Producto seleccionado para el ProductDrawer */
  selectedProduct: ZodMenuItem | null;
  /** Ítem del carrito actualmente en edición (o null si es producto nuevo) */
  editingCartItem: CartItem | null;
  /** Clave de categoría activa en la navegación horizontal */
  activeCategoryKey: string | null;
  /** Cola de toasts */
  toasts: ToastMessage[];
}

interface UIActions {
  openDrawer: (drawer: DrawerName) => void;
  closeDrawer: () => void;
  openProductDrawer: (product: ZodMenuItem, editingCartItem?: CartItem | null) => void;
  setActiveCategoryKey: (key: string | null) => void;
  pushToast: (message: string, type?: ToastMessage['type'], durationMs?: number) => void;
  dismissToast: (id: string) => void;
  clearToasts: () => void;
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useUIStore = create<UIState & UIActions>()((set, get) => ({
  // Estado inicial
  activeDrawer: null,
  selectedProduct: null,
  editingCartItem: null,
  activeCategoryKey: null,
  toasts: [],

  // ── Acciones ────────────────────────────────────────────────────────────────

  openDrawer: (drawer) => set({ activeDrawer: drawer }),

  closeDrawer: () => set({ activeDrawer: null, editingCartItem: null }),

  openProductDrawer: (product, editingCartItem = null) =>
    set({ selectedProduct: product, editingCartItem, activeDrawer: 'product' }),

  setActiveCategoryKey: (key) => set({ activeCategoryKey: key }),

  pushToast: (message, type = 'success', durationMs = 3000) => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const toast: ToastMessage = { id, message, type, durationMs };
    set({ toasts: [...get().toasts, toast] });

    // Auto-dismiss
    if (durationMs > 0) {
      setTimeout(() => {
        set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
      }, durationMs);
    }
  },

  dismissToast: (id) =>
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),

  clearToasts: () => set({ toasts: [] }),
}));

// ─── Selectores ───────────────────────────────────────────────────────────────

export const selectActiveDrawer = (s: UIState) => s.activeDrawer;
export const selectSelectedProduct = (s: UIState) => s.selectedProduct;
export const selectActiveCategoryKey = (s: UIState) => s.activeCategoryKey;
export const selectToasts = (s: UIState) => s.toasts;
export const selectIsDrawerOpen = (name: DrawerName) => (s: UIState) =>
  s.activeDrawer === name;
