/**
 * index.ts — PR-V3-04
 *
 * Barrel export de todos los Zustand stores de Public Order V3.
 */

export {
  useCartStore,
  menuItemToCartItem,
  selectCartItems,
  selectCartTotal,
  selectCartCount,
  selectIsCartEmpty,
  selectItemQty,
} from './cart.store';
export type { CartItem, CartItemCustomization } from './cart.store';

export {
  useUIStore,
  selectActiveDrawer,
  selectSelectedProduct,
  selectActiveCategoryKey,
  selectToasts,
  selectIsDrawerOpen,
} from './ui.store';
export type { DrawerName, ToastMessage } from './ui.store';

export {
  useCheckoutStore,
  selectCheckoutForm,
  selectIsSubmitting,
  selectSubmitError,
  selectLastOrderFolio,
} from './checkout.store';
export type { CheckoutFormData, PaymentMethod, OrderMode } from './checkout.store';
