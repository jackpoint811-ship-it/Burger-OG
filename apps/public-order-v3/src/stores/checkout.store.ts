/**
 * checkout.store.ts — PR-V3-04
 *
 * Zustand store del formulario de checkout para Public Order V3.
 * Persiste los datos del cliente entre sesiones para reutilización.
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// ─── Tipos ────────────────────────────────────────────────────────────────────

export type PaymentMethod = 'cash' | 'transfer' | 'card' | 'unknown';
export type OrderMode = 'pickup' | 'delivery';

export interface CheckoutFormData {
  customerName: string;
  customerPhone: string;
  locationKey: string;
  orderMode: OrderMode;
  paymentMethod: PaymentMethod;
  customerNotes: string;
  isScheduled: boolean;
  scheduledDate: string;
  scheduledTime: string;
  referralCode: string;
  wantsWhatsappGroup: boolean;
}

interface CheckoutState {
  form: CheckoutFormData;
  /** Estado de envío del pedido */
  submitting: boolean;
  /** Error de envío (mensaje para el usuario) */
  submitError: string | null;
  /** Folio del último pedido enviado exitosamente */
  lastOrderFolio: string | null;
}

interface CheckoutActions {
  /** Actualiza uno o varios campos del formulario */
  updateField: <K extends keyof CheckoutFormData>(key: K, value: CheckoutFormData[K]) => void;
  /** Actualiza múltiples campos a la vez */
  patchForm: (patch: Partial<CheckoutFormData>) => void;
  /** Marca el comienzo de un envío */
  setSubmitting: (value: boolean) => void;
  /** Registra el error de envío */
  setSubmitError: (error: string | null) => void;
  /** Guarda el folio del pedido exitoso */
  setLastOrderFolio: (folio: string) => void;
  /** Reinicia el formulario a valores vacíos (pero preserva datos del cliente) */
  resetAfterOrder: () => void;
  /** Resetea todo el estado de checkout */
  resetAll: () => void;
}

// ─── Valores por defecto ──────────────────────────────────────────────────────

const DEFAULT_FORM: CheckoutFormData = {
  customerName: '',
  customerPhone: '',
  locationKey: '',
  orderMode: 'delivery',
  paymentMethod: 'cash',
  customerNotes: '',
  isScheduled: false,
  scheduledDate: '',
  scheduledTime: '',
  referralCode: '',
  wantsWhatsappGroup: false,
};

// ─── Store ────────────────────────────────────────────────────────────────────

export const useCheckoutStore = create<CheckoutState & CheckoutActions>()(
  persist(
    (set, get) => ({
      // Estado inicial
      form: { ...DEFAULT_FORM },
      submitting: false,
      submitError: null,
      lastOrderFolio: null,

      // ── Acciones ──────────────────────────────────────────────────────────

      updateField: (key, value) =>
        set((s) => ({ form: { ...s.form, [key]: value } })),

      patchForm: (patch) =>
        set((s) => ({ form: { ...s.form, ...patch } })),

      setSubmitting: (value) => set({ submitting: value }),

      setSubmitError: (error) => set({ submitError: error }),

      setLastOrderFolio: (folio) => set({ lastOrderFolio: folio }),

      resetAfterOrder: () => {
        // Preserva nombre, teléfono y torre (para re-pedido cómodo)
        const { customerName, customerPhone, locationKey } = get().form;
        set({
          form: {
            ...DEFAULT_FORM,
            customerName,
            customerPhone,
            locationKey,
          },
          submitting: false,
          submitError: null,
        });
      },

      resetAll: () =>
        set({
          form: { ...DEFAULT_FORM },
          submitting: false,
          submitError: null,
          lastOrderFolio: null,
        }),
    }),
    {
      name: 'burgers-v3-checkout',
      storage: createJSONStorage(() => localStorage),
      // Solo persistimos nombre, teléfono y torre (datos del cliente)
      partialize: (state) => ({
        form: {
          customerName: state.form.customerName,
          customerPhone: state.form.customerPhone,
          locationKey: state.form.locationKey,
        },
      }),
    }
  )
);

// ─── Selectores ───────────────────────────────────────────────────────────────

export const selectCheckoutForm = (s: CheckoutState) => s.form;
export const selectIsSubmitting = (s: CheckoutState) => s.submitting;
export const selectSubmitError = (s: CheckoutState) => s.submitError;
export const selectLastOrderFolio = (s: CheckoutState) => s.lastOrderFolio;
