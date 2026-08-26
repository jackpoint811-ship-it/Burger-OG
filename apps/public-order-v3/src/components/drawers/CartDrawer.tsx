import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { X, Trash2, Plus, Minus, ArrowRight, ShoppingBag, RotateCcw, Sparkles } from 'lucide-react';
import {
  useUIStore,
  useCartStore,
  selectCartItems,
  selectCartTotal,
  selectCartCount,
  type CartItem,
} from '../../stores';
import { useMenuItems } from '../../features';
import { resolveCatalogAssetUrl } from '@config/assets';
import { formatCurrency } from '../../utils/format';
import { ProductFallbackSvg } from '../shared/ProductFallbackSvg';

export function CartDrawer() {
  const activeDrawer = useUIStore((s) => s.activeDrawer);
  const closeDrawer = useUIStore((s) => s.closeDrawer);
  const openDrawer = useUIStore((s) => s.openDrawer);
  const openProductDrawer = useUIStore((s) => s.openProductDrawer);

  const items = useCartStore(selectCartItems);
  const totalAmount = useCartStore(selectCartTotal);
  const totalItems = useCartStore(selectCartCount);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const removeItem = useCartStore((s) => s.removeItem);
  const clearCart = useCartStore((s) => s.clearCart);
  const loadSnapshot = useCartStore((s) => s.loadSnapshot);

  const { items: allMenuItems } = useMenuItems();
  const shouldReduceMotion = useReducedMotion();

  const isOpen = activeDrawer === 'cart';

  // Last order re-order feature
  const [lastOrder, setLastOrder] = useState<CartItem[] | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('burgers-v3-last-order') || localStorage.getItem('pov2-last-order');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setLastOrder(parsed);
        }
      }
    } catch {
      /* ignore */
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeDrawer();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, closeDrawer]);

  if (!isOpen) return null;

  const handleReorder = () => {
    if (lastOrder && lastOrder.length > 0) {
      loadSnapshot(lastOrder);
    }
  };

  const handleEditItem = (item: CartItem) => {
    const menuItem = allMenuItems.find((p) => p.sku.toUpperCase() === item.sku.toUpperCase());
    if (menuItem) {
      openProductDrawer(menuItem, item);
    }
  };

  const handleCheckout = () => {
    openDrawer('checkout');
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
        {/* Backdrop */}
        <motion.div
          className="fixed inset-0 bg-black/60 backdrop-blur-xs"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={closeDrawer}
          aria-hidden="true"
        />

        {/* Drawer Panel */}
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-labelledby="drawer-cart-title"
          className="relative z-50 w-full max-w-lg rounded-t-3xl sm:rounded-3xl bg-surface-card border-t sm:border border-line shadow-floating max-h-[92vh] flex flex-col overflow-hidden"
          initial={shouldReduceMotion ? { opacity: 0 } : { y: '100%' }}
          animate={shouldReduceMotion ? { opacity: 1 } : { y: 0 }}
          exit={shouldReduceMotion ? { opacity: 0 } : { y: '100%' }}
          transition={{ type: 'spring', damping: 26, stiffness: 220 }}
        >
          {/* Mobile Handle */}
          <div className="mx-auto mt-3 h-1.5 w-12 rounded-full bg-line sm:hidden shrink-0" />

          {/* Header */}
          <div className="flex items-center justify-between p-4 sm:p-5 border-b border-line">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-accent/10 text-accent flex items-center justify-center font-bold">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div>
                <h2 id="drawer-cart-title" className="text-lg font-bold text-text-primary">
                  Tu Carrito
                </h2>
                <p className="text-xs text-text-secondary">
                  {totalItems} {totalItems === 1 ? 'producto' : 'productos'} en total
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {items.length > 0 && (
                <button
                  type="button"
                  onClick={clearCart}
                  className="text-xs text-text-muted hover:text-red-500 font-bold px-2 py-1 transition-colors cursor-pointer min-h-[36px] flex items-center justify-center"
                >
                  Vaciar
                </button>
              )}
              <button
                type="button"
                onClick={closeDrawer}
                className="rounded-full p-2 text-text-secondary hover:bg-surface hover:text-text-primary transition-colors cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
                aria-label="Cerrar carrito"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Content Body */}
          {items.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4">
              <div className="w-20 h-20 rounded-full bg-accent/10 flex items-center justify-center text-accent">
                <ShoppingBag className="w-10 h-10 opacity-60" />
              </div>
              <div>
                <h3 className="text-base font-bold text-text-primary">Tu carrito está vacío</h3>
                <p className="text-xs text-text-secondary mt-1 max-w-xs">
                  Explora nuestras smash burgers artesanales y agrega tus favoritas.
                </p>
              </div>

              {/* 1-Tap Reorder if available */}
              {lastOrder && (
                <div className="w-full max-w-xs p-3.5 rounded-2xl bg-surface border border-line text-left space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-text-primary">
                    <Sparkles className="w-3.5 h-3.5 text-accent" />
                    <span>¿Repetir tu último pedido?</span>
                  </div>
                  <p className="text-[11px] text-text-secondary line-clamp-1">
                    {lastOrder.map((i) => `${i.quantity}x ${i.name}`).join(', ')}
                  </p>
                  <button
                    type="button"
                    onClick={handleReorder}
                    className="w-full py-2 px-3 rounded-xl bg-accent text-white text-xs font-bold hover:bg-accent-dark transition-colors flex items-center justify-center gap-1.5 cursor-pointer min-h-[38px]"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Cargar Último Pedido</span>
                  </button>
                </div>
              )}

              <button
                type="button"
                onClick={closeDrawer}
                className="py-2.5 px-6 rounded-2xl bg-surface hover:bg-surface-raised border border-line text-xs font-bold text-text-primary transition-colors cursor-pointer min-h-[44px]"
              >
                ← Explorar Menú
              </button>
            </div>
          ) : (
            <>
              {/* Item List */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3">
                {items.map((item) => {
                  const menuItem = allMenuItems.find(
                    (p) => p.sku.toUpperCase() === item.sku.toUpperCase()
                  );
                  const imageUrl = menuItem
                    ? resolveCatalogAssetUrl(menuItem.imageUrl, menuItem.imageKey)
                    : undefined;

                  const custom = item.customization;
                  const hasCustomizations = Boolean(
                    custom &&
                      ((custom.removedIngredients && custom.removedIngredients.length > 0) ||
                        (custom.extras && custom.extras.length > 0) ||
                        custom.garnish ||
                        custom.includedDrink ||
                        custom.burgerNote ||
                        (custom.comboBurgers && custom.comboBurgers.length > 0))
                  );

                  return (
                    <div
                      key={item.cartLineId}
                      className="p-3.5 rounded-2xl bg-surface border border-line space-y-2.5"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 min-w-0">
                          {/* Thumbnail */}
                          <div className="w-14 h-14 rounded-xl overflow-hidden bg-surface-card border border-line/60 shrink-0">
                            {imageUrl ? (
                              <img
                                src={imageUrl}
                                alt={item.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <ProductFallbackSvg
                                type={menuItem?.category || 'burger'}
                                className="w-full h-full p-1"
                              />
                            )}
                          </div>

                          {/* Info */}
                          <div className="min-w-0">
                            <h4 className="text-sm font-bold text-text-primary truncate">
                              {item.name}
                            </h4>
                            <div className="flex items-center gap-2 mt-0.5 text-xs">
                              <span className="font-extrabold text-accent">
                                {formatCurrency(item.unitPrice)}
                              </span>
                              {item.quantity > 1 && (
                                <span className="text-text-muted">
                                  × {item.quantity} = {formatCurrency(item.lineTotal)}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Quantity Stepper & Remove */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.cartLineId, item.quantity - 1)}
                            className="w-7 h-7 rounded-lg bg-surface-card border border-line flex items-center justify-center text-text-primary hover:bg-surface-raised cursor-pointer min-h-[36px] min-w-[36px]"
                            aria-label={`Disminuir cantidad de ${item.name}`}
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="w-5 text-center text-xs font-bold text-text-primary">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.cartLineId, item.quantity + 1)}
                            className="w-7 h-7 rounded-lg bg-accent text-white flex items-center justify-center hover:bg-accent-dark cursor-pointer min-h-[36px] min-w-[36px]"
                            aria-label={`Aumentar cantidad de ${item.name}`}
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => removeItem(item.cartLineId)}
                            className="w-7 h-7 rounded-lg text-text-muted hover:text-red-500 flex items-center justify-center cursor-pointer min-h-[36px] min-w-[36px] ml-1"
                            aria-label={`Eliminar ${item.name}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Customization Badges Breakdown */}
                      {hasCustomizations && custom && (
                        <div className="pt-2 border-t border-line/60 text-[11px] space-y-1.5 text-text-secondary">
                          {/* Insignia reaseguradora de personalización por volumen */}
                          {item.quantity > 1 && (
                            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-accent/10 text-accent font-black text-[10px] mb-0.5">
                              <Sparkles className="w-3 h-3 text-accent shrink-0" />
                              <span>Aplica a las {item.quantity} unidades</span>
                            </div>
                          )}

                          {/* Guarnición */}
                          {custom.garnish && (
                            <div className="font-bold text-text-primary">
                              🍟 Guarnición: {custom.garnish.name}
                              {(custom.garnish.upcharge ?? 0) > 0 &&
                                ` (+${formatCurrency(custom.garnish.upcharge!)})`}
                            </div>
                          )}

                          {/* Bebida */}
                          {custom.includedDrink && (
                            <div className="font-bold text-text-primary">
                              🥤 Bebida: {custom.includedDrink.name}
                            </div>
                          )}

                          {/* Removed ingredients */}
                          {custom.removedIngredients && custom.removedIngredients.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {custom.removedIngredients.map((ing) => (
                                <span
                                  key={ing}
                                  className="px-2 py-0.5 rounded-md bg-red-500/10 text-red-600 font-bold"
                                >
                                  Sin {ing}
                                </span>
                              ))}
                            </div>
                          )}

                          {/* Extras */}
                          {custom.extras && custom.extras.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {custom.extras.map((extra, idx) => (
                                <span
                                  key={idx}
                                  className="px-2 py-0.5 rounded-md bg-accent/10 text-accent font-bold"
                                >
                                  + {extra.name}
                                </span>
                              ))}
                            </div>
                          )}

                          {/* Combo Burgers list */}
                          {custom.comboBurgers && custom.comboBurgers.length > 0 && (
                            <div className="space-y-0.5 pt-0.5">
                              {custom.comboBurgers.map((b, bIdx) => {
                                const bDetails = [
                                  ...b.removedIngredients.map((r) => `Sin ${r}`),
                                  ...b.extras.map((e) => e.name),
                                  ...(b.burgerNote ? [b.burgerNote] : []),
                                ];
                                return (
                                  <div key={bIdx} className="text-text-muted">
                                    🍔 {b.name}: {bDetails.length > 0 ? bDetails.join(', ') : 'Original'}
                                  </div>
                                );
                              })}
                            </div>
                          )}

                          {/* Note */}
                          {custom.burgerNote && (
                            <div className="italic text-text-muted">
                              Nota: &quot;{custom.burgerNote}&quot;
                            </div>
                          )}
                        </div>
                      )}

                      {/* Edit customization link */}
                      {(hasCustomizations || menuItem?.category.toLowerCase() === 'burgers' || menuItem?.category.toLowerCase() === 'combos') && (
                        <div className="pt-1.5 border-t border-line/40 flex justify-end">
                          <button
                            type="button"
                            onClick={() => handleEditItem(item)}
                            className="text-[11px] font-bold text-accent hover:underline flex items-center gap-1 cursor-pointer py-0.5"
                          >
                            <span>✏️ Editar personalización</span>
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Sticky Total & Checkout CTA */}
              <div className="border-t border-line bg-surface-card p-4 sm:p-5 space-y-3 shadow-panel shrink-0">
                <div className="space-y-1.5 text-xs">
                  <div className="flex items-center justify-between text-text-secondary">
                    <span>Subtotal</span>
                    <span>{formatCurrency(totalAmount)}</span>
                  </div>
                  <div className="flex items-center justify-between text-text-secondary">
                    <span>Entrega</span>
                    <span className="font-bold text-accent">En tu torre (Sin costo)</span>
                  </div>
                  <div className="flex items-center justify-between text-base font-extrabold text-text-primary pt-1 border-t border-line">
                    <span>Total</span>
                    <span className="text-xl text-accent">{formatCurrency(totalAmount)}</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleCheckout}
                  className="w-full py-3.5 px-4 rounded-2xl bg-accent text-white font-extrabold text-base hover:bg-accent-dark transition-colors shadow-cta cursor-pointer min-h-[48px] flex items-center justify-between"
                >
                  <span>Continuar al Checkout</span>
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
