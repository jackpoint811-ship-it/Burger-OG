import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Plus } from 'lucide-react';
import { useFeaturedItems, useMenuItems } from '../../features';
import { useUIStore, useCartStore, menuItemToCartItem } from '../../stores';
import { resolveCatalogAssetUrl } from '@config/assets';
import { formatCurrency } from '../../utils/format';
import { ProductFallbackSvg } from '../shared/ProductFallbackSvg';
import type { MenuItem } from '@config/contracts';

export function FeaturedRail() {
  const { featuredItems } = useFeaturedItems();
  const { items: allMenuItems } = useMenuItems();
  const openProductDrawer = useUIStore((s) => s.openProductDrawer);
  const pushToast = useUIStore((s) => s.pushToast);
  const addItem = useCartStore((s) => s.addItem);
  const cartItems = useCartStore((s) => s.items);

  // Si no hay productos marcados como featured, tomar los primeros 4 del menú (excluyendo extras y no disponibles)
  const displayItems: MenuItem[] =
    featuredItems.length > 0
      ? featuredItems
      : (allMenuItems ?? [])
          .filter((i: MenuItem) => i.isAvailable !== false && i.category.toLowerCase() !== 'extras')
          .slice(0, 4);

  if (displayItems.length === 0) return null;

  const handleItemClick = (item: MenuItem) => {
    openProductDrawer(item);
  };

  const handleQuickAdd = (item: MenuItem, e: React.MouseEvent) => {
    e.stopPropagation();
    const isCombo = item.comboConfig?.isCombo || item.category.toLowerCase() === 'combos';
    const isBurger = item.category.toLowerCase() === 'burgers';

    if (isCombo || isBurger) {
      openProductDrawer(item);
      return;
    }

    addItem(menuItemToCartItem(item, 1));
    pushToast(`Agregaste 1x ${item.name} al carrito`, 'success', 2000);
  };

  return (
    <section className="w-full my-4" aria-label="Productos más pedidos">
      <div className="flex items-center justify-between mb-2 px-1">
        <h2 className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-text-primary flex items-center gap-1.5">
          <span className="text-amber-500">⭐</span>
          <span>Top Vendidos (Más Pedidos)</span>
        </h2>
      </div>

      <div className="flex overflow-x-auto gap-3 pb-2 pt-1 -mx-4 px-4 scrollbar-none snap-x touch-pan-x">
        {displayItems.map((item, idx) => {
          const imageUrl = resolveCatalogAssetUrl(item.imageUrl, item.imageKey);
          const isPromo = Boolean(
            item.isPromoActive && item.promoPrice != null && item.promoPrice < item.price
          );
          const effectivePrice = isPromo && item.promoPrice != null ? item.promoPrice : item.price;
          const inCartQty = cartItems
            .filter((ci) => ci.sku.toUpperCase() === item.sku.toUpperCase())
            .reduce((sum, ci) => sum + ci.quantity, 0);

          return (
            <motion.div
              key={item.sku || idx}
              whileTap={{ scale: 0.97 }}
              onClick={() => handleItemClick(item)}
              className="w-[145px] sm:w-[165px] shrink-0 snap-start flex flex-col justify-between rounded-2xl bg-surface-card border border-line p-2.5 sm:p-3 cursor-pointer shadow-card hover:shadow-panel transition-all select-none relative overflow-hidden"
            >
              {/* Badge Top */}
              <div className="absolute top-2 left-2 z-10">
                <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-xs text-amber-400 text-[9px] font-extrabold uppercase border border-amber-400/30">
                  <Sparkles className="w-2.5 h-2.5" />
                  {idx === 0 ? 'TOP 1' : idx === 1 ? 'TOP 2' : 'POPULAR'}
                </span>
              </div>

              {/* In Cart Badge */}
              {inCartQty > 0 && (
                <div className="absolute top-2 right-2 z-10 px-1.5 py-0.5 rounded-full bg-accent text-white text-[10px] font-extrabold shadow-sm">
                  {inCartQty}
                </div>
              )}

              {/* Image */}
              <div className="w-full aspect-square rounded-xl overflow-hidden bg-surface mb-2 border border-line/60">
                {imageUrl ? (
                  <img
                    src={imageUrl}
                    alt={item.name}
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <ProductFallbackSvg type={item.category} className="w-full h-full" />
                )}
              </div>

              {/* Info */}
              <div className="flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="text-xs font-bold text-text-primary line-clamp-1 leading-snug">
                    {item.name}
                  </h3>
                  <span className="text-[10px] text-text-muted uppercase tracking-wider block">
                    {item.category}
                  </span>
                </div>

                <div className="flex items-center justify-between pt-2 mt-1 border-t border-line/40">
                  <span className="text-xs font-extrabold text-accent tabular-nums">
                    {formatCurrency(effectivePrice)}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => handleQuickAdd(item, e)}
                    className="w-11 h-11 rounded-xl bg-accent text-white flex items-center justify-center hover:bg-accent-dark active:scale-[0.92] focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none transition-all cursor-pointer min-h-[44px] min-w-[44px]"
                    aria-label={`Pedir ${item.name}`}
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
