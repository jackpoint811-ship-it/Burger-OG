import React, { useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Plus, Check, Sparkles } from 'lucide-react';
import { useUIStore, useCartStore, menuItemToCartItem } from '../../stores';
import { resolveCatalogAssetUrl } from '@config/assets';
import { getActiveTenant } from '@config';
import { formatCurrency } from '../../utils/format';
import { ProductFallbackSvg } from '../shared/ProductFallbackSvg';
import type { MenuItem } from '@config/contracts';

export interface ProductCardProps {
  item: MenuItem;
}

export function ProductCard({ item }: ProductCardProps) {
  const openProductDrawer = useUIStore((s) => s.openProductDrawer);
  const pushToast = useUIStore((s) => s.pushToast);
  const addItem = useCartStore((s) => s.addItem);
  const cartItems = useCartStore((s) => s.items);

  const tenant = getActiveTenant();
  const [justAdded, setJustAdded] = useState(false);

  const imageUrl = resolveCatalogAssetUrl(item.imageUrl, item.imageKey);
  const isAvailable = item.isAvailable !== false;

  const catLower = item.category.toLowerCase();
  const isCombo = Boolean(item.comboConfig?.isCombo) || catLower === 'combos' || catLower === 'paquetes';
  const isBurger = catLower === 'burgers' || catLower === 'hamburguesas';
  const isTorta = catLower === 'tortas' || catLower === 'chilaquiles' || catLower === 'cajas' || catLower === 'desayunos';
  const isPlatillo = catLower === 'platillos';
  const requiresCustomization = isCombo || isBurger || isTorta || isPlatillo;

  const isPromo = Boolean(
    item.isPromoActive && item.promoPrice != null && item.promoPrice < item.price
  );
  const effectivePrice = isPromo && item.promoPrice != null ? item.promoPrice : item.price;

  // Quantity of this SKU in cart
  const inCartQty = cartItems
    .filter((cartItem) => cartItem.sku.toUpperCase() === item.sku.toUpperCase())
    .reduce((sum, ci) => sum + ci.quantity, 0);

  const handleCardClick = () => {
    if (!isAvailable) return;
    openProductDrawer(item);
  };

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAvailable) return;

    if (requiresCustomization) {
      // For burgers and combos, open customization drawer
      openProductDrawer(item);
      return;
    }

    // Quick add to cart
    addItem(menuItemToCartItem(item, 1));
    pushToast(`Agregaste 1x ${item.name} al carrito`, 'success', 2500);

    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1200);
  };

  const shouldReduceMotion = useReducedMotion();

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isAvailable) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      openProductDrawer(item);
    }
  };

  return (
    <motion.article
      whileTap={!shouldReduceMotion && isAvailable ? { scale: 0.98 } : undefined}
      tabIndex={isAvailable ? 0 : -1}
      role="button"
      onClick={handleCardClick}
      onKeyDown={handleKeyDown}
      aria-label={`${item.name}, ${formatCurrency(effectivePrice)}`}
      aria-disabled={!isAvailable}
      className={`group relative flex flex-col justify-between bg-surface-card border border-line shadow-card hover:shadow-panel hover:border-text-muted/30 focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none transition-all cursor-pointer overflow-hidden p-3 sm:p-4 select-none ${
        !isAvailable ? 'opacity-60 grayscale-[40%] cursor-not-allowed' : ''
      }`}
      style={{ borderRadius: 'var(--radius-card)' }}
    >
      {/* Top Media & Badges */}
      <div
        className="relative aspect-4/3 w-full overflow-hidden bg-surface-raised mb-3 border border-line/60"
        style={{ borderRadius: 'calc(var(--radius-card) * 0.75)' }}
      >
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={item.name}
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <ProductFallbackSvg type={item.category} className="w-full h-full" />
        )}

        {/* Floating Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1 z-10">
          {isPromo && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-red-600 text-white text-[10px] font-extrabold shadow-sm">
              <Sparkles className="w-2.5 h-2.5" />
              PROMO
            </span>
          )}
          {item.isFeatured && !isPromo && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500 text-white text-[10px] font-extrabold shadow-sm">
              ⭐ TOP
            </span>
          )}
          {item.badge && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-neutral-900/80 text-white text-[10px] font-bold backdrop-blur-xs">
              {item.badge}
            </span>
          )}
        </div>

        {/* In-cart count bubble */}
        {inCartQty > 0 && (
          <motion.div
            key={inCartQty}
            initial={shouldReduceMotion ? false : { scale: 1.25, opacity: 0.8 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 350, damping: 20 }}
            className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-accent text-white text-xs font-extrabold shadow-md tabular-nums"
          >
            {inCartQty} en carrito
          </motion.div>
        )}

        {!isAvailable && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center">
            <span className="px-3 py-1 rounded-full bg-neutral-900 text-white text-xs font-bold uppercase tracking-wider">
              Agotado
            </span>
          </div>
        )}
      </div>

      {/* Product Information */}
      <div className="flex-1 flex flex-col justify-between gap-3">
        <div>
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-text-secondary uppercase tracking-wider mb-0.5">
            <span>{item.category}</span>
            {isCombo && <span className="text-accent font-extrabold">· {tenant.theme.terminology?.combosLabel ? 'Combo' : 'Combo'}</span>}
          </div>
          <h3 className="font-bold text-sm sm:text-base text-text-primary group-hover:text-accent transition-colors line-clamp-1 leading-snug">
            {item.name}
          </h3>
          {item.description && (
            <p className="text-xs text-text-secondary line-clamp-2 mt-1 leading-relaxed">
              {item.description}
            </p>
          )}
        </div>

        {/* Price & Action Row */}
        <div className="flex items-center justify-between gap-2 pt-2 border-t border-line/50">
          <div className="flex flex-col">
            {isPromo && (
              <span className="text-[11px] text-text-muted line-through tabular-nums">
                {formatCurrency(item.price)}
              </span>
            )}
            <span className={`text-base font-extrabold tabular-nums ${isPromo ? 'text-accent' : 'text-text-primary'}`}>
              {formatCurrency(effectivePrice)}
            </span>
          </div>

          {/* Quick-add / Customize CTA */}
          {isAvailable && (
            <button
              type="button"
              onClick={handleQuickAdd}
              style={{ borderRadius: 'var(--radius-btn)' }}
              className={`flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold transition-all cursor-pointer min-h-[44px] min-w-[44px] active:scale-[0.96] focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none ${
                justAdded
                  ? 'bg-accent text-white'
                  : requiresCustomization
                  ? 'bg-surface-raised hover:bg-surface text-text-primary border border-line'
                  : 'bg-accent text-white hover:bg-accent-dark shadow-sm'
              }`}
              aria-label={
                requiresCustomization
                  ? `Personalizar ${item.name}`
                  : `Agregar ${item.name} al carrito`
              }
            >
              {justAdded ? (
                <>
                  <Check className="w-4 h-4" />
                  <span className="hidden sm:inline">Listo</span>
                </>
              ) : requiresCustomization ? (
                <span>Personalizar</span>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  <span className="hidden sm:inline">Agregar</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </motion.article>
  );
}
