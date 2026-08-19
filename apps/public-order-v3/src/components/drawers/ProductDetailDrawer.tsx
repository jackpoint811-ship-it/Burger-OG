import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { X, Plus, Minus, Check, Sparkles, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { useUIStore, useCartStore, type CartItemCustomization } from '../../stores';
import { useItemRecipe, useMenuItems } from '../../features';
import { resolveCatalogAssetUrl } from '@config/assets';
import { formatCurrency } from '../../utils/format';
import { ProductFallbackSvg } from '../shared/ProductFallbackSvg';
import type { MenuItem, ComboOptionGroup } from '@config/contracts';

interface ComboBurgerDraft {
  sku?: string;
  name: string;
  removedIngredients: string[];
  extras: Array<{ sku?: string; name: string; price: number; qty: number }>;
  note: string;
}

export function ProductDetailDrawer() {
  const activeDrawer = useUIStore((s) => s.activeDrawer);
  const selectedProduct = useUIStore((s) => s.selectedProduct);
  const closeDrawer = useUIStore((s) => s.closeDrawer);
  const pushToast = useUIStore((s) => s.pushToast);
  const addItem = useCartStore((s) => s.addItem);

  const isOpen = activeDrawer === 'product' && Boolean(selectedProduct);
  const product = selectedProduct;

  const shouldReduceMotion = useReducedMotion();
  const recipeIngredients = useItemRecipe(product?.sku);
  const { items: allMenuItems } = useMenuItems();

  // State
  const [quantity, setQuantity] = useState(1);
  const [mode, setMode] = useState<'original' | 'customize'>('original');
  const [removedIngredients, setRemovedIngredients] = useState<string[]>([]);
  const [extras, setExtras] = useState<Array<{ sku: string; name: string; price: number; qty: number }>>([]);
  const [specialNote, setSpecialNote] = useState('');

  // Combos State
  const [selectedSideSku, setSelectedSideSku] = useState<string>('');
  const [selectedDrinkSku, setSelectedDrinkSku] = useState<string>('');
  const [comboBurgerDrafts, setComboBurgerDrafts] = useState<Record<number, ComboBurgerDraft>>({});
  const [expandedComboBurger, setExpandedComboBurger] = useState<number | null>(null);

  // Available extras products from menu
  const availableExtras = useMemo(() => {
    return allMenuItems
      .filter((item) => item.category.toLowerCase() === 'extras' && item.isAvailable !== false)
      .map((item) => ({
        sku: item.sku,
        name: item.name,
        price: item.isPromoActive && item.promoPrice != null ? item.promoPrice : item.price,
      }));
  }, [allMenuItems]);

  // Combo Option Groups (Guarniciones y Bebidas)
  const isCombo = Boolean(product?.comboConfig?.isCombo || product?.category.toLowerCase() === 'combos');
  const optionGroups: ComboOptionGroup[] = product?.comboConfig?.optionGroups ?? [];

  const sideGroup = optionGroups.find(
    (g) => g.name.toLowerCase().includes('guarnici') || g.name.toLowerCase().includes('side')
  );
  const drinkGroup = optionGroups.find(
    (g) => g.name.toLowerCase().includes('bebida') || g.name.toLowerCase().includes('drink')
  );

  // Available side options
  const sideOptions = useMemo(() => {
    if (!isCombo) return [];
    if (sideGroup && sideGroup.options.length > 0) {
      return sideGroup.options
        .map((opt) => {
          const item = allMenuItems.find((p) => p.sku.toUpperCase() === opt.sku.toUpperCase());
          return {
            sku: opt.sku,
            name: item?.name ?? opt.sku,
            upcharge: (opt.upchargeCents || 0) / 100,
            isDefault: opt.isDefault,
          };
        });
    }
    // Fallback to all items in guarniciones category
    return allMenuItems
      .filter((p) => p.category.toLowerCase() === 'guarniciones' && p.isAvailable !== false)
      .map((p, idx) => ({
        sku: p.sku,
        name: p.name,
        upcharge: 0,
        isDefault: idx === 0,
      }));
  }, [isCombo, sideGroup, allMenuItems]);

  // Available drink options
  const drinkOptions = useMemo(() => {
    if (!isCombo) return [];
    if (drinkGroup && drinkGroup.options.length > 0) {
      return drinkGroup.options
        .map((opt) => {
          const item = allMenuItems.find((p) => p.sku.toUpperCase() === opt.sku.toUpperCase());
          return {
            sku: opt.sku,
            name: item?.name ?? opt.sku,
            upcharge: (opt.upchargeCents || 0) / 100,
            isDefault: opt.isDefault,
          };
        });
    }
    return [];
  }, [isCombo, drinkGroup, allMenuItems]);

  // Burgers included in combo
  const comboBurgerProducts = useMemo(() => {
    if (!isCombo || !product) return [];
    const fromLinks = (product.comboLinks ?? [])
      .map((linkSku) => allMenuItems.find((p) => p.sku.toUpperCase() === linkSku.toUpperCase()))
      .filter((p): p is MenuItem => Boolean(p));

    if (fromLinks.length > 0) return fromLinks;
    return [product];
  }, [isCombo, product, allMenuItems]);

  // Reset state on drawer open
  useEffect(() => {
    if (isOpen && product) {
      setQuantity(1);
      setMode('original');
      setRemovedIngredients([]);
      setExtras([]);
      setSpecialNote('');

      // Default side
      const defaultSide = sideOptions.find((s) => s.isDefault) || sideOptions[0];
      setSelectedSideSku(defaultSide?.sku ?? '');

      // Default drink
      const defaultDrink = drinkOptions.find((d) => d.isDefault) || drinkOptions[0];
      setSelectedDrinkSku(defaultDrink?.sku ?? '');

      // Reset combo burger drafts
      const initialDrafts: Record<number, ComboBurgerDraft> = {};
      comboBurgerProducts.forEach((b, idx) => {
        initialDrafts[idx] = {
          sku: b.sku,
          name: b.name,
          removedIngredients: [],
          extras: [],
          note: '',
        };
      });
      setComboBurgerDrafts(initialDrafts);
      setExpandedComboBurger(null);
    }
  }, [isOpen, product, sideOptions, drinkOptions, comboBurgerProducts]);

  // Escape key handler
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeDrawer();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, closeDrawer]);

  if (!isOpen || !product) return null;

  const imageUrl = resolveCatalogAssetUrl(product.imageUrl, product.imageKey);
  const isPromo = Boolean(
    product.isPromoActive && product.promoPrice != null && product.promoPrice < product.price
  );
  const basePrice = isPromo && product.promoPrice != null ? product.promoPrice : product.price;

  // Selected side upcharge
  const selectedSide = sideOptions.find((s) => s.sku === selectedSideSku);
  const sideUpcharge = selectedSide?.upcharge ?? 0;

  // Extras total
  const extrasTotal = extras.reduce((sum, e) => sum + e.price * e.qty, 0);

  // Combo burgers extras total
  const comboBurgersExtrasTotal = Object.values(comboBurgerDrafts).reduce(
    (sum, draft) => sum + draft.extras.reduce((s, e) => s + e.price * e.qty, 0),
    0
  );

  // Unit and Line Total
  const unitPrice =
    basePrice +
    sideUpcharge +
    (mode === 'customize' ? extrasTotal : 0) +
    comboBurgersExtrasTotal;
  const lineTotal = unitPrice * quantity;

  // Handlers for single burger modifications
  const handleToggleRemoveIngredient = (ing: string) => {
    setRemovedIngredients((prev) =>
      prev.includes(ing) ? prev.filter((i) => i !== ing) : [...prev, ing]
    );
  };

  const handleExtraQuantityChange = (extraItem: { sku: string; name: string; price: number }, delta: number) => {
    setExtras((prev) => {
      const existing = prev.find((e) => e.sku === extraItem.sku);
      if (existing) {
        const nextQty = existing.qty + delta;
        if (nextQty <= 0) return prev.filter((e) => e.sku !== extraItem.sku);
        return prev.map((e) => (e.sku === extraItem.sku ? { ...e, qty: nextQty } : e));
      }
      if (delta > 0) {
        return [...prev, { ...extraItem, qty: delta }];
      }
      return prev;
    });
  };

  // Handlers for combo burger modifications
  const handleComboBurgerToggleRemove = (index: number, ing: string) => {
    setComboBurgerDrafts((prev) => {
      const current = prev[index] ?? {
        name: comboBurgerProducts[index]?.name ?? 'Burger',
        removedIngredients: [],
        extras: [],
        note: '',
      };
      const exists = current.removedIngredients.includes(ing);
      const nextRemoved = exists
        ? current.removedIngredients.filter((i) => i !== ing)
        : [...current.removedIngredients, ing];
      return { ...prev, [index]: { ...current, removedIngredients: nextRemoved } };
    });
  };

  const handleComboBurgerExtraChange = (
    index: number,
    extraItem: { sku: string; name: string; price: number },
    delta: number
  ) => {
    setComboBurgerDrafts((prev) => {
      const current = prev[index] ?? {
        name: comboBurgerProducts[index]?.name ?? 'Burger',
        removedIngredients: [],
        extras: [],
        note: '',
      };
      const existing = current.extras.find((e) => e.sku === extraItem.sku);
      let nextExtras = current.extras;
      if (existing) {
        const nextQty = existing.qty + delta;
        if (nextQty <= 0) {
          nextExtras = current.extras.filter((e) => e.sku !== extraItem.sku);
        } else {
          nextExtras = current.extras.map((e) =>
            e.sku === extraItem.sku ? { ...e, qty: nextQty } : e
          );
        }
      } else if (delta > 0) {
        nextExtras = [...current.extras, { ...extraItem, qty: delta }];
      }
      return { ...prev, [index]: { ...current, extras: nextExtras } };
    });
  };

  const handleComboBurgerNoteChange = (index: number, note: string) => {
    setComboBurgerDrafts((prev) => {
      const current = prev[index] ?? {
        name: comboBurgerProducts[index]?.name ?? 'Burger',
        removedIngredients: [],
        extras: [],
        note: '',
      };
      return { ...prev, [index]: { ...current, note } };
    });
  };

  const handleAddToCart = () => {
    const isBurger = product.category.toLowerCase() === 'burgers';

    const customization: CartItemCustomization = {
      itemKind: isCombo ? 'combo' : isBurger ? 'burger' : 'other',
      removedIngredients: mode === 'customize' ? removedIngredients : [],
      extras:
        mode === 'customize'
          ? extras.map((e) => ({ sku: e.sku, name: `${e.qty}x ${e.name}`, price: e.price * e.qty }))
          : [],
      burgerNote: specialNote.trim() || undefined,
      garnish:
        isCombo && selectedSide
          ? {
              sku: selectedSide.sku,
              name: selectedSide.name,
              upcharge: selectedSide.upcharge,
            }
          : undefined,
      includedDrink:
        isCombo && selectedDrinkSku
          ? {
              sku: selectedDrinkSku,
              name: drinkOptions.find((d) => d.sku === selectedDrinkSku)?.name ?? selectedDrinkSku,
            }
          : undefined,
      comboBurgers:
        isCombo && comboBurgerProducts.length > 0
          ? comboBurgerProducts.map((burger, idx) => {
              const draft = comboBurgerDrafts[idx];
              return {
                sku: burger.sku,
                name: burger.name,
                removedIngredients: draft?.removedIngredients ?? [],
                extras: (draft?.extras ?? []).map((e) => ({
                  sku: e.sku,
                  name: `${e.qty}x ${e.name}`,
                  price: e.price * e.qty,
                })),
                burgerNote: draft?.note?.trim() || undefined,
              };
            })
          : undefined,
      extrasTotalCents: Math.round(extrasTotal * 100),
      includedGarnishUpchargeCents: Math.round(sideUpcharge * 100),
    };

    addItem({
      sku: product.sku,
      name: product.name,
      unitPrice,
      quantity,
      customization,
      lineTotal,
    });

    pushToast(`Agregaste ${quantity}x ${product.name} a tu pedido`, 'success', 2500);
    closeDrawer();
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
          aria-labelledby="drawer-product-title"
          className="relative z-50 w-full max-w-lg rounded-t-3xl sm:rounded-3xl bg-surface-card border-t sm:border border-line shadow-floating max-h-[92vh] flex flex-col overflow-hidden"
          initial={shouldReduceMotion ? { opacity: 0 } : { y: '100%' }}
          animate={shouldReduceMotion ? { opacity: 1 } : { y: 0 }}
          exit={shouldReduceMotion ? { opacity: 0 } : { y: '100%' }}
          transition={{ type: 'spring', damping: 26, stiffness: 220 }}
        >
          {/* Top Handle on Mobile */}
          <div className="mx-auto mt-3 h-1.5 w-12 rounded-full bg-line sm:hidden shrink-0" />

          {/* Scrollable Body */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
            {/* Header / Media */}
            <div className="relative aspect-16/9 w-full rounded-2xl overflow-hidden bg-surface border border-line/60">
              {imageUrl ? (
                <img
                  src={imageUrl}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <ProductFallbackSvg type={product.category} className="w-full h-full" />
              )}

              {/* Close button floating on image */}
              <button
                type="button"
                onClick={closeDrawer}
                className="absolute top-2.5 right-2.5 w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition-colors cursor-pointer min-h-[44px] min-w-[44px]"
                aria-label="Cerrar personalización"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Badges */}
              <div className="absolute top-2.5 left-2.5 flex flex-col gap-1">
                {isPromo && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-red-600 text-white text-[10px] font-extrabold shadow-sm">
                    <Sparkles className="w-2.5 h-2.5" /> PROMO
                  </span>
                )}
                {product.isFeatured && !isPromo && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500 text-white text-[10px] font-extrabold shadow-sm">
                    ⭐ TOP
                  </span>
                )}
                {isCombo && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-accent text-white text-[10px] font-extrabold shadow-sm">
                    🍔 COMBO
                  </span>
                )}
              </div>
            </div>

            {/* Product Title & Info */}
            <div>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 id="drawer-product-title" className="text-xl sm:text-2xl font-extrabold text-text-primary">
                    {product.name}
                  </h2>
                  <span className="text-xs font-bold text-text-muted uppercase tracking-wider">
                    {product.category}
                  </span>
                </div>
                <div className="text-right">
                  {isPromo && (
                    <span className="text-xs text-text-muted line-through block">
                      {formatCurrency(product.price)}
                    </span>
                  )}
                  <span className="text-xl font-extrabold text-accent">
                    {formatCurrency(unitPrice)}
                  </span>
                </div>
              </div>

              {product.description && (
                <p className="text-xs sm:text-sm text-text-secondary mt-2 leading-relaxed">
                  {product.description}
                </p>
              )}
            </div>

            {/* ── BURGER CUSTOMIZATION ── */}
            {product.category.toLowerCase() === 'burgers' && (
              <div className="p-4 rounded-2xl bg-surface border border-line space-y-4">
                {/* Mode Selector */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setMode('original')}
                    className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer min-h-[44px] flex items-center justify-center gap-1.5 ${
                      mode === 'original'
                        ? 'bg-accent text-white shadow-sm'
                        : 'bg-surface-card text-text-secondary hover:text-text-primary border border-line'
                    }`}
                  >
                    🍔 Receta Original
                  </button>
                  <button
                    type="button"
                    onClick={() => setMode('customize')}
                    className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer min-h-[44px] flex items-center justify-center gap-1.5 ${
                      mode === 'customize'
                        ? 'bg-accent text-white shadow-sm'
                        : 'bg-surface-card text-text-secondary hover:text-text-primary border border-line'
                    }`}
                  >
                    🛠️ Personalizar
                  </button>
                </div>

                {/* Customization Details */}
                {mode === 'customize' && (
                  <div className="space-y-4 pt-2 border-t border-line/60">
                    {/* Ingredients to Remove */}
                    {recipeIngredients.length > 0 && (
                      <div>
                        <span className="text-xs font-bold text-text-primary block mb-2">
                          Ingredientes (Toca para quitar):
                        </span>
                        <div className="flex flex-wrap gap-2">
                          {recipeIngredients.map((ing) => {
                            const isRemoved = removedIngredients.includes(ing);
                            return (
                              <button
                                key={ing}
                                type="button"
                                onClick={() => handleToggleRemoveIngredient(ing)}
                                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer min-h-[36px] flex items-center gap-1.5 ${
                                  isRemoved
                                    ? 'bg-red-500/15 text-red-600 border border-red-500/30'
                                    : 'bg-surface-card text-text-primary border border-line hover:border-text-muted'
                                }`}
                              >
                                {isRemoved ? (
                                  <>
                                    <X className="w-3.5 h-3.5" />
                                    <span>Sin {ing}</span>
                                  </>
                                ) : (
                                  <>
                                    <Check className="w-3.5 h-3.5 text-accent" />
                                    <span>{ing}</span>
                                  </>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Extras / Upgrades */}
                    {availableExtras.length > 0 && (
                      <div>
                        <span className="text-xs font-bold text-text-primary block mb-2">
                          Agregar Extras e Ingredientes:
                        </span>
                        <div className="space-y-2">
                          {availableExtras.map((extra) => {
                            const currentQty = extras.find((e) => e.sku === extra.sku)?.qty ?? 0;
                            return (
                              <div
                                key={extra.sku}
                                className="flex items-center justify-between p-2.5 rounded-xl bg-surface-card border border-line"
                              >
                                <div>
                                  <span className="text-xs font-bold text-text-primary block">
                                    {extra.name}
                                  </span>
                                  <span className="text-[11px] font-bold text-accent">
                                    +{formatCurrency(extra.price)}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => handleExtraQuantityChange(extra, -1)}
                                    disabled={currentQty === 0}
                                    className="w-8 h-8 rounded-lg bg-surface border border-line flex items-center justify-center text-text-primary hover:bg-surface-raised disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer min-h-[36px] min-w-[36px]"
                                    aria-label={`Quitar 1 ${extra.name}`}
                                  >
                                    <Minus className="w-4 h-4" />
                                  </button>
                                  <span className="w-5 text-center text-xs font-bold text-text-primary">
                                    {currentQty}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => handleExtraQuantityChange(extra, 1)}
                                    className="w-8 h-8 rounded-lg bg-accent text-white flex items-center justify-center hover:bg-accent-dark cursor-pointer min-h-[36px] min-w-[36px]"
                                    aria-label={`Agregar 1 ${extra.name}`}
                                  >
                                    <Plus className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Special Note */}
                    <div>
                      <label className="text-xs font-bold text-text-primary block mb-1.5">
                        Instrucciones de cocina (opcional):
                      </label>
                      <textarea
                        value={specialNote}
                        onChange={(e) => setSpecialNote(e.target.value)}
                        placeholder="Ej. Carne bien cocida, cebolla extra dorada..."
                        rows={2}
                        maxLength={160}
                        className="w-full p-2.5 rounded-xl bg-surface-card border border-line text-xs text-text-primary focus:outline-hidden focus:ring-2 focus:ring-accent resize-none"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── COMBO CUSTOMIZATION ── */}
            {isCombo && (
              <div className="space-y-4">
                {/* 1. Side Selection (Guarnición) */}
                {sideOptions.length > 0 && (
                  <div className="p-4 rounded-2xl bg-surface border border-line space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold text-text-primary uppercase tracking-wide">
                        🍟 1. Elige tu Guarnición (Obligatoria)
                      </span>
                    </div>
                    <div className="space-y-2">
                      {sideOptions.map((side) => {
                        const isSelected = selectedSideSku === side.sku;
                        return (
                          <label
                            key={side.sku}
                            className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer min-h-[44px] ${
                              isSelected
                                ? 'border-accent bg-accent/5 ring-1 ring-accent'
                                : 'border-line bg-surface-card hover:border-text-muted/30'
                            }`}
                          >
                            <div className="flex items-center gap-2.5">
                              <input
                                type="radio"
                                name="combo-side"
                                checked={isSelected}
                                onChange={() => setSelectedSideSku(side.sku)}
                                className="w-4 h-4 text-accent accent-accent"
                              />
                              <span className="text-xs font-bold text-text-primary">
                                {side.name}
                              </span>
                            </div>
                            <span className="text-xs font-extrabold text-accent">
                              {side.upcharge > 0 ? `+${formatCurrency(side.upcharge)}` : 'Incluida'}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 2. Drink Selection (Bebida) */}
                {drinkOptions.length > 0 && (
                  <div className="p-4 rounded-2xl bg-surface border border-line space-y-2.5">
                    <span className="text-xs font-extrabold text-text-primary uppercase tracking-wide">
                      🥤 2. Elige tu Bebida
                    </span>
                    <div className="space-y-2">
                      {drinkOptions.map((drink) => {
                        const isSelected = selectedDrinkSku === drink.sku;
                        return (
                          <label
                            key={drink.sku}
                            className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer min-h-[44px] ${
                              isSelected
                                ? 'border-accent bg-accent/5 ring-1 ring-accent'
                                : 'border-line bg-surface-card hover:border-text-muted/30'
                            }`}
                          >
                            <div className="flex items-center gap-2.5">
                              <input
                                type="radio"
                                name="combo-drink"
                                checked={isSelected}
                                onChange={() => setSelectedDrinkSku(drink.sku)}
                                className="w-4 h-4 text-accent accent-accent"
                              />
                              <span className="text-xs font-bold text-text-primary">
                                {drink.name}
                              </span>
                            </div>
                            <span className="text-xs font-extrabold text-accent">
                              {drink.upcharge > 0 ? `+${formatCurrency(drink.upcharge)}` : 'Incluida'}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 3. Customize Burgers in Combo */}
                {comboBurgerProducts.length > 0 && (
                  <div className="p-4 rounded-2xl bg-surface border border-line space-y-3">
                    <span className="text-xs font-extrabold text-text-primary uppercase tracking-wide block">
                      🍔 3. Personaliza las Burgers del Combo
                    </span>
                    <div className="space-y-2">
                      {comboBurgerProducts.map((burger, idx) => {
                        const isExpanded = expandedComboBurger === idx;
                        const draft = comboBurgerDrafts[idx];
                        const burgerRecipe = burger.sku ? allMenuItems.find((p) => p.sku === burger.sku)?.tags || [] : [];

                        const hasModifications =
                          (draft?.removedIngredients.length ?? 0) > 0 ||
                          (draft?.extras.length ?? 0) > 0 ||
                          Boolean(draft?.note);

                        return (
                          <div
                            key={idx}
                            className="rounded-xl border border-line bg-surface-card overflow-hidden"
                          >
                            <button
                              type="button"
                              onClick={() => setExpandedComboBurger(isExpanded ? null : idx)}
                              className="w-full flex items-center justify-between p-3 text-left hover:bg-surface transition-colors cursor-pointer min-h-[44px]"
                            >
                              <div>
                                <span className="text-xs font-bold text-text-primary block">
                                  {burger.name} {comboBurgerProducts.length > 1 ? `#${idx + 1}` : ''}
                                </span>
                                <span className="text-[11px] text-text-muted">
                                  {hasModifications ? '✓ Personalizada' : 'Receta original'}
                                </span>
                              </div>
                              <div className="text-text-muted">
                                {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                              </div>
                            </button>

                            {isExpanded && (
                              <div className="p-3 border-t border-line space-y-3 bg-surface/50">
                                {/* Removals */}
                                {recipeIngredients.length > 0 && (
                                  <div>
                                    <span className="text-[11px] font-bold text-text-primary block mb-1.5">
                                      Quitar ingredientes:
                                    </span>
                                    <div className="flex flex-wrap gap-1.5">
                                      {recipeIngredients.map((ing) => {
                                        const isRemoved = draft?.removedIngredients.includes(ing);
                                        return (
                                          <button
                                            key={ing}
                                            type="button"
                                            onClick={() => handleComboBurgerToggleRemove(idx, ing)}
                                            className={`px-2.5 py-1 rounded-full text-[11px] font-bold transition-all cursor-pointer min-h-[32px] flex items-center gap-1 ${
                                              isRemoved
                                                ? 'bg-red-500/15 text-red-600 border border-red-500/30'
                                                : 'bg-surface-card text-text-primary border border-line'
                                            }`}
                                          >
                                            {isRemoved ? `Sin ${ing}` : ing}
                                          </button>
                                        );
                                      })}
                                    </div>
                                  </div>
                                )}

                                {/* Extras */}
                                {availableExtras.length > 0 && (
                                  <div>
                                    <span className="text-[11px] font-bold text-text-primary block mb-1.5">
                                      Extras para esta burger:
                                    </span>
                                    <div className="space-y-1.5">
                                      {availableExtras.slice(0, 3).map((extra) => {
                                        const currentQty =
                                          draft?.extras.find((e) => e.sku === extra.sku)?.qty ?? 0;
                                        return (
                                          <div
                                            key={extra.sku}
                                            className="flex items-center justify-between p-2 rounded-lg bg-surface-card border border-line text-xs"
                                          >
                                            <span>{extra.name} (+{formatCurrency(extra.price)})</span>
                                            <div className="flex items-center gap-1.5">
                                              <button
                                                type="button"
                                                onClick={() => handleComboBurgerExtraChange(idx, extra, -1)}
                                                disabled={currentQty === 0}
                                                className="w-6 h-6 rounded bg-surface border border-line flex items-center justify-center disabled:opacity-30 cursor-pointer min-h-[32px] min-w-[32px]"
                                              >
                                                <Minus className="w-3 h-3" />
                                              </button>
                                              <span className="w-4 text-center font-bold">{currentQty}</span>
                                              <button
                                                type="button"
                                                onClick={() => handleComboBurgerExtraChange(idx, extra, 1)}
                                                className="w-6 h-6 rounded bg-accent text-white flex items-center justify-center cursor-pointer min-h-[32px] min-w-[32px]"
                                              >
                                                <Plus className="w-3 h-3" />
                                              </button>
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                )}

                                {/* Note */}
                                <div>
                                  <input
                                    type="text"
                                    value={draft?.note ?? ''}
                                    onChange={(e) => handleComboBurgerNoteChange(idx, e.target.value)}
                                    placeholder="Nota para esta burger..."
                                    maxLength={100}
                                    className="w-full p-2 rounded-lg bg-surface-card border border-line text-xs text-text-primary"
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Sticky CTA Footer */}
          <div className="border-t border-line bg-surface-card p-4 sm:p-5 flex items-center justify-between gap-4 shadow-panel shrink-0">
            {/* Quantity Stepper */}
            <div className="flex items-center gap-2 bg-surface p-1.5 rounded-2xl border border-line shrink-0">
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                disabled={quantity <= 1}
                className="w-9 h-9 rounded-xl bg-surface-card border border-line flex items-center justify-center text-text-primary hover:bg-surface-raised disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer min-h-[44px] min-w-[44px]"
                aria-label="Disminuir cantidad"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="w-6 text-center font-extrabold text-sm text-text-primary">
                {quantity}
              </span>
              <button
                type="button"
                onClick={() => setQuantity((q) => q + 1)}
                className="w-9 h-9 rounded-xl bg-surface-card border border-line flex items-center justify-center text-text-primary hover:bg-surface-raised transition-colors cursor-pointer min-h-[44px] min-w-[44px]"
                aria-label="Aumentar cantidad"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {/* Add to Cart CTA */}
            <button
              type="button"
              onClick={handleAddToCart}
              className="flex-1 py-3.5 px-4 rounded-2xl bg-accent text-white font-extrabold text-sm sm:text-base hover:bg-accent-dark transition-colors shadow-cta cursor-pointer min-h-[48px] flex items-center justify-between"
            >
              <span>Agregar al pedido</span>
              <span>{formatCurrency(lineTotal)}</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
