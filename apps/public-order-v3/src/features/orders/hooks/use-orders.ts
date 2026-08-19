/**
 * use-orders.ts — PR-V3-05
 *
 * Hooks de TanStack Query para creación de pedidos públicos y sincronización de estado.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import type {
  CreateOrderV2Payload,
  CreateOrderV2Response,
  OrderV2Environment,
} from '@config/index';
import { createOrder } from '../api/orders.api';
import { menuKeys } from '../../menu/hooks/use-menu';
import { raffleKeys } from '../../raffles/hooks/use-raffles';
import { useCartStore, type CartItem } from '../../../stores/cart.store';
import { useCheckoutStore, type CheckoutFormData } from '../../../stores/checkout.store';

export const orderKeys = {
  all: ['orders'] as const,
  lists: () => [...orderKeys.all, 'list'] as const,
  details: () => [...orderKeys.all, 'detail'] as const,
  detail: (id: string) => [...orderKeys.details(), id] as const,
};

/**
 * Helper para transformar los items del carrito y el formulario de checkout
 * en el payload estandarizado para la API /api/orders-v2.
 */
export function cartAndFormToCreateOrderPayload(
  items: CartItem[],
  form: CheckoutFormData,
  environment?: OrderV2Environment
): CreateOrderV2Payload {
  const env: OrderV2Environment =
    environment ??
    (typeof window !== 'undefined' &&
    (window.location.hostname.includes('preview') || window.location.hostname.includes('localhost'))
      ? 'preview'
      : 'production');

  return {
    customer: {
      name: form.customerName.trim(),
      phone: form.customerPhone.trim(),
    },
    delivery: {
      location: form.locationKey,
      isScheduled: form.isScheduled,
      scheduledDate: form.isScheduled && form.scheduledDate ? form.scheduledDate : undefined,
      scheduledTime: form.isScheduled && form.scheduledTime ? form.scheduledTime : undefined,
      customerNotes: form.customerNotes.trim() || undefined,
    },
    orderMode: form.orderMode,
    paymentMethod: form.paymentMethod,
    notes: form.customerNotes.trim() || undefined,
    referralCode: form.referralCode.trim() || undefined,
    environment: env,
    items: items.map((item, idx) => {
      const cust = item.customization;
      return {
        sku: item.sku,
        qty: item.quantity,
        lineKey: cust?.lineKey ?? item.cartLineId,
        itemDisplayIndex: idx + 1,
        itemKind: cust?.itemKind ?? 'other',
        removedIngredients: cust?.removedIngredients ?? [],
        extras: cust?.extras ?? [],
        burgerNote: cust?.burgerNote,
        garnish: cust?.garnish,
        includedDrink: cust?.includedDrink,
        sideQuestExtras: cust?.sideQuestExtras ?? [],
        comboBurgers: cust?.comboBurgers ?? [],
        extrasTotalCents: cust?.extrasTotalCents,
        sideQuestExtrasTotalCents: cust?.sideQuestExtrasTotalCents,
        includedGarnishUpchargeCents: cust?.includedGarnishUpchargeCents,
      };
    }),
  };
}

export type UseCreateOrderMutationOptions = {
  onSuccess?: (data: CreateOrderV2Response) => void;
  onError?: (error: Error) => void;
  clearCartOnSuccess?: boolean;
};

/**
 * Mutation hook para enviar un pedido al backend.
 * Sincroniza automáticamente con Zustand checkoutStore y cartStore e invalida queries relevantes.
 */
export function useCreateOrderMutation(options?: UseCreateOrderMutationOptions) {
  const queryClient = useQueryClient();
  const setSubmitting = useCheckoutStore((s) => s.setSubmitting);
  const setSubmitError = useCheckoutStore((s) => s.setSubmitError);
  const setLastOrderFolio = useCheckoutStore((s) => s.setLastOrderFolio);
  const clearCart = useCartStore((s) => s.clearCart);

  return useMutation<
    CreateOrderV2Response,
    Error,
    { payload: CreateOrderV2Payload; idempotencyKey?: string }
  >({
    mutationFn: ({ payload, idempotencyKey }) => createOrder(payload, idempotencyKey),
    onMutate: () => {
      setSubmitting(true);
      setSubmitError(null);
    },
    onSuccess: (data) => {
      setSubmitting(false);
      setSubmitError(null);

      if (data.data?.order?.folio) {
        setLastOrderFolio(data.data.order.folio);
      }

      if (options?.clearCartOnSuccess !== false) {
        clearCart();
      }

      // Invalidamos queries para refrescar stock de catálogo y balance de tickets/sorteos
      queryClient.invalidateQueries({ queryKey: menuKeys.all });
      queryClient.invalidateQueries({ queryKey: raffleKeys.all });

      options?.onSuccess?.(data);
    },
    onError: (error) => {
      setSubmitting(false);
      setSubmitError(error.message || 'Ocurrió un error al enviar el pedido. Intenta nuevamente.');
      options?.onError?.(error);
    },
  });
}
