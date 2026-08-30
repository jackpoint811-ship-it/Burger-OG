import React from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { ShoppingBag, ArrowRight } from 'lucide-react';
import { useCartStore, selectCartCount, selectCartTotal, useUIStore } from '../../stores';
import { getActiveTenant } from '@config';
import { formatCurrency } from '../../utils/format';

export function CartBar() {
  const totalItems = useCartStore(selectCartCount);
  const totalAmount = useCartStore(selectCartTotal);
  const openDrawer = useUIStore((s) => s.openDrawer);
  const activeDrawer = useUIStore((s) => s.activeDrawer);
  const shouldReduceMotion = useReducedMotion();
  const tenant = getActiveTenant();

  // Hide cart bar if cart is empty or if any drawer is currently open
  const isVisible = totalItems > 0 && !activeDrawer;

  return (
    <AnimatePresence>
      {isVisible && (
        <aside
          className="fixed bottom-4 left-4 right-4 pb-[max(0rem,env(safe-area-inset-bottom))] max-w-[768px] mx-auto z-40"
          aria-label="Resumen flotante del carrito"
        >
          <motion.div
            initial={shouldReduceMotion ? { opacity: 0 } : { y: 60, opacity: 0 }}
            animate={shouldReduceMotion ? { opacity: 1 } : { y: 0, opacity: 1 }}
            exit={shouldReduceMotion ? { opacity: 0 } : { y: 60, opacity: 0 }}
            transition={{ type: 'spring', damping: 24, stiffness: 220 }}
            onClick={() => openDrawer('cart')}
            style={{ borderRadius: 'var(--radius-card)' }}
            className="flex items-center justify-between gap-3 p-2.5 sm:p-3 px-4 bg-accent text-white shadow-cta hover:bg-accent-dark transition-colors cursor-pointer min-h-[52px] select-none"
          >
            {/* Left Info */}
            <div className="flex items-center gap-3">
              <motion.div
                key={totalItems}
                initial={shouldReduceMotion ? false : { scale: 1.3 }}
                animate={{ scale: 1 }}
                className="w-8 h-8 rounded-full bg-white text-accent flex items-center justify-center font-extrabold text-sm shadow-xs shrink-0"
                aria-label={`${totalItems} ${totalItems === 1 ? (tenant.theme.terminology?.itemSingular || 'producto') : (tenant.theme.terminology?.itemPlural || 'productos')}`}
              >
                {totalItems}
              </motion.div>

              <div className="flex flex-col">
                <span className="text-[10px] font-extrabold tracking-wider uppercase opacity-90 leading-tight">
                  Mi Pedido {tenant.logoEmoji}
                </span>
                <span className="text-base font-extrabold tracking-tight leading-tight tabular-nums">
                  {formatCurrency(totalAmount)}
                </span>
              </div>
            </div>

            {/* Right Action */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                openDrawer('cart');
              }}
              style={{ borderRadius: 'var(--radius-btn)' }}
              className="flex items-center gap-1.5 px-4 py-2 bg-white text-accent font-extrabold text-xs sm:text-sm hover:bg-gray-100 active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none transition-all shadow-xs cursor-pointer min-h-[44px]"
            >
              <span>{tenant.theme.terminology?.cartCtaLabel || 'Ver Pedido'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </motion.div>
        </aside>
      )}
    </AnimatePresence>
  );
}
