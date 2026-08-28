import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { RotateCcw, ArrowRight, Sparkles } from 'lucide-react';
import { useUIStore, useCartStore, type CartItem } from '../../stores';
import { formatCurrency } from '../../utils/format';

export function ReorderModule() {
  const [lastOrderItems, setLastOrderItems] = useState<CartItem[]>([]);
  const addItem = useCartStore((s) => s.addItem);
  const openDrawer = useUIStore((s) => s.openDrawer);
  const pushToast = useUIStore((s) => s.pushToast);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('pov3-last-order') || localStorage.getItem('pov2-last-order');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setLastOrderItems(parsed);
        }
      }
    } catch {
      // Ignored
    }
  }, []);

  if (lastOrderItems.length === 0) return null;

  const orderTitle = lastOrderItems
    .map((item) => `${item.quantity}x ${item.name}`)
    .join(', ');

  const orderTotal = lastOrderItems.reduce(
    (sum, item) => sum + item.unitPrice * item.quantity,
    0
  );

  const handleReorder = () => {
    lastOrderItems.forEach((item) => {
      addItem(item);
    });

    pushToast('¡Último pedido agregado al carrito!', 'success', 2500);
    openDrawer('cart');
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full my-3 p-3.5 sm:p-4 rounded-3xl bg-surface-card border border-accent/30 shadow-card hover:border-accent transition-all relative overflow-hidden"
      aria-label="Repetir último pedido"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-2xl bg-accent-soft text-accent flex items-center justify-center font-bold shrink-0">
            <RotateCcw className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wider text-accent">
              <Sparkles className="w-3 h-3" />
              <span>1-Click Reorder</span>
            </div>
            <h3 className="text-xs sm:text-sm font-bold text-text-primary truncate">
              {orderTitle}
            </h3>
            <p className="text-[11px] text-text-secondary">
              Total: <strong>{formatCurrency(orderTotal)}</strong>
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleReorder}
          className="flex items-center gap-1 px-4 py-2.5 rounded-2xl bg-accent text-white hover:bg-accent-dark focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none font-extrabold text-xs tracking-wide shadow-sm transition-all shrink-0 cursor-pointer min-h-[44px]"
        >
          <span>PEDIR</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </motion.section>
  );
}
