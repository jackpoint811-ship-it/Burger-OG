import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { X, Plus, Minus, Check, Sparkles, ChevronDown, ChevronUp } from 'lucide-react';
import { useUIStore, useCartStore, type CartItemCustomization } from '../../stores';
import { useMenuRecipes, useMenuItems } from '../../features';
import { resolveCatalogAssetUrl } from '@config/assets';
import { formatCurrency } from '../../utils/format';
import { ProductFallbackSvg } from '../shared/ProductFallbackSvg';
import { QuantityStepper } from '@ui/stepper';
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
  const editingCartItem = useUIStore((s) => s.editingCartItem);
  const closeDrawer = useUIStore((s) => s.closeDrawer);
  const pushToast = useUIStore((s) => s.pushToast);
  const addItem = useCartStore((s) => s.addItem);
  const updateItem = useCartStore((s) => s.updateItem);

  const isOpen = activeDrawer === 'product' && Boolean(selectedProduct);
  const product = selectedProduct;

  const shouldReduceMotion = useReducedMotion();
  const { getRecipeForSku } = useMenuRecipes();
  const recipeIngredients = useMemo(() => {
    return product ? getRecipeForSku(product.sku) : [];
  }, [product, getRecipeForSku]);

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

  // Available extras products from menu (D1) con estado isAvailable real
  const availableExtras = useMemo(() => {
    return allMenuItems
      .filter((item) => item.category.toLowerCase() === 'extras')
      .map((item) => ({
        sku: item.sku,
        name: item.name,
        price: item.isPromoActive && item.promoPrice != null ? item.promoPrice : item.price,
        isAvailable: item.isAvailable !== false,
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

  // Available side options (calculado de upchargeCents de D1 y validando isAvailable)
  const sideOptions = useMemo(() => {
    if (!isCombo) return [];
    if (sideGroup && sideGroup.options.length > 0) {
      return sideGroup.options.map((opt) => {
        const item = allMenuItems.find((p) => p.sku.toUpperCase() === opt.sku.toUpperCase());
        const isAvailable = item ? item.isAvailable !== false : true;
        const upcharge = (opt.upchargeCents || 0) / 100;
        return {
          sku: opt.sku,
          name: item?.name ?? opt.sku,
          upcharge,
          isDefault: opt.isDefault,
          isAvailable,
        };
      });
    }
    // Fallback to all items in guarniciones category
    const sides = allMenuItems.filter(
      (p) => p.category.toLowerCase() === 'guarniciones'
    );
    const basePrice = sides[0]?.price ?? 25;
    return sides.map((p, idx) => {
      const diff = Math.max(0, p.price - basePrice);
      return {
        sku: p.sku,
        name: p.name,
        upcharge: diff,
        isDefault: idx === 0,
        isAvailable: p.isAvailable !== false,
      };
    });
  }, [isCombo, sideGroup, allMenuItems]);

  // Available drink options (validando isAvailable)
  const drinkOptions = useMemo(() => {
    if (!isCombo) return [];
    if (drinkGroup && drinkGroup.options.length > 0) {
      return drinkGroup.options.map((opt) => {
        const item = allMenuItems.find((p) => p.sku.toUpperCase() === opt.sku.toUpperCase());
        const isAvailable = item ? item.isAvailable !== false : true;
        return {
          sku: opt.sku,
          name: item?.name ?? opt.sku,
          upcharge: (opt.upchargeCents || 0) / 100,
          isDefault: opt.isDefault,
          isAvailable,
        };
      });
    }
    // Fallback to all items in drinks category
    return allMenuItems
      .filter(
        (p) =>
          p.category.toLowerCase() === 'drinks' || p.category.toLowerCase() === 'bebidas'
      )
      .map((p, idx) => ({
        sku: p.sku,
        name: p.name,
        upcharge: 0,
        isDefault: idx === 0,
        isAvailable: p.isAvailable !== false,
      }));
  }, [isCombo, drinkGroup, allMenuItems]);

  // Burgers included in combo (FILTRADAS ESTRICTAMENTE POR CATEGORÍA BURGERS CON INFERENCIA RESILIENTE)
  const comboBurgerProducts = useMemo(() => {
    if (!isCombo || !product) return [];
    const fromLinks = (product.comboLinks ?? [])
      .map((linkSku) => allMenuItems.find((p) => p.sku.toUpperCase() === linkSku.toUpperCase()))
      .filter((p): p is MenuItem => Boolean(p && p.category.toLowerCase() === 'burgers' && p.isAvailable !== false));

    if (fromLinks.length > 0) return fromLinks;

    // Fallback resiliente: Buscar hamburguesa coincidente en el menú por SKU limpio o nombre
    const cleanSku = product.sku.replace(/^COMBO_?/i, '');
    const matched = allMenuItems.find(
      (p) =>
        p.category.toLowerCase() === 'burgers' &&
        p.isAvailable !== false &&
        (p.sku.toUpperCase() === cleanSku.toUpperCase() ||
          product.name.toLowerCase().includes(p.name.toLowerCase()))
    );

    if (matched) return [matched];

    // Fallback final: Primera burger disponible
    const firstBurger = allMenuItems.find(
      (p) => p.category.toLowerCase() === 'burgers' && p.isAvailable !== false
    );
    return firstBurger ? [firstBurger] : (product.category.toLowerCase() === 'burgers' ? [product] : []);
  }, [isCombo, product, allMenuItems]);

  // Reset or initialize state when product changes or drawer opens
  useEffect(() => {
    if (isOpen && product) {
      if (editingCartItem) {
        setQuantity(editingCartItem.quantity);
        const custom = editingCartItem.customization;

        const hasMods = Boolean(
          (custom?.removedIngredients && custom.removedIngredients.length > 0) ||
            (custom?.extras && custom.extras.length > 0) ||
            custom?.burgerNote
        );
        setMode(hasMods ? 'customize' : 'original');
        setRemovedIngredients(custom?.removedIngredients ?? []);

        // Parse extras
        const parsedExtras: Array<{ sku: string; name: string; price: number; qty: number }> = [];
        (custom?.extras ?? []).forEach((ext) => {
          const match = ext.name.match(/^(\d+)x\s+(.*)$/);
          const qty = match ? parseInt(match[1], 10) : 1;
          const cleanName = match ? match[2] : ext.name;
          const originalExtra = availableExtras.find(
            (ae) => ae.sku === ext.sku || ae.name.toLowerCase() === cleanName.toLowerCase()
          );
          parsedExtras.push({
            sku: ext.sku ?? originalExtra?.sku ?? cleanName,
            name: originalExtra?.name ?? cleanName,
            price: originalExtra?.price ?? (ext.price ? ext.price / qty : 0),
            qty,
          });
        });
        setExtras(parsedExtras);
        setSpecialNote(custom?.burgerNote ?? '');

        setSelectedSideSku(custom?.garnish?.sku ?? sideOptions[0]?.sku ?? '');
        setSelectedDrinkSku(custom?.includedDrink?.sku ?? drinkOptions[0]?.sku ?? '');

        const initialDrafts: Record<number, ComboBurgerDraft> = {};
        comboBurgerProducts.forEach((b, idx) => {
          const savedComboBurger = custom?.comboBurgers?.[idx];
          const savedDraftExtras: Array<{ sku: string; name: string; price: number; qty: number }> = [];
          (savedComboBurger?.extras ?? []).forEach((ext) => {
            const match = ext.name.match(/^(\d+)x\s+(.*)$/);
            const qty = match ? parseInt(match[1], 10) : 1;
            const cleanName = match ? match[2] : ext.name;
            const originalExtra = availableExtras.find(
              (ae) => ae.sku === ext.sku || ae.name.toLowerCase() === cleanName.toLowerCase()
            );
            savedDraftExtras.push({
              sku: ext.sku ?? originalExtra?.sku ?? cleanName,
              name: originalExtra?.name ?? cleanName,
              price: originalExtra?.price ?? (ext.price ? ext.price / qty : 0),
              qty,
            });
          });

          initialDrafts[idx] = {
            sku: b.sku,
            name: b.name,
            removedIngredients: savedComboBurger?.removedIngredients ?? [],
            extras: savedDraftExtras,
            note: savedComboBurger?.burgerNote ?? '',
          };
        });
        setComboBurgerDrafts(initialDrafts);
      } else {
        setQuantity(1);
        setMode('original');
        setRemovedIngredients([]);
        setExtras([]);
        setSpecialNote('');

        const defaultSide =
          sideOptions.find((s) => s.isDefault && s.isAvailable) ||
          sideOptions.find((s) => s.isAvailable) ||
          sideOptions[0];
        setSelectedSideSku(defaultSide?.sku ?? '');

        const defaultDrink =
          drinkOptions.find((d) => d.isDefault && d.isAvailable) ||
          drinkOptions.find((d) => d.isAvailable) ||
          drinkOptions[0];
        setSelectedDrinkSku(defaultDrink?.sku ?? '');

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
      }
      setExpandedComboBurger(null);
    }
  }, [isOpen, product?.sku, editingCartItem?.cartLineId]);

  // Escape key handler
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeDrawer();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, closeDrawer]);

  const imageUrl = product ? resolveCatalogAssetUrl(product.imageUrl, product.imageKey) : undefined;
  const isPromo = Boolean(
    product?.isPromoActive && product?.promoPrice != null && product.promoPrice < product.price
  );
  const basePrice = product ? (isPromo && product.promoPrice != null ? product.promoPrice : product.price) : 0;

  // Selected side upcharge (priorizando opción disponible)
  const selectedSide =
    sideOptions.find((s) => s.sku === selectedSideSku && s.isAvailable !== false) ||
    sideOptions.find((s) => s.isAvailable !== false) ||
    sideOptions.find((s) => s.sku === selectedSideSku);
  const sideUpcharge = selectedSide?.upcharge ?? 0;

  // Selected drink upcharge (priorizando opción disponible)
  const selectedDrink =
    drinkOptions.find((d) => d.sku === selectedDrinkSku && d.isAvailable !== false) ||
    drinkOptions.find((d) => d.isAvailable !== false) ||
    drinkOptions.find((d) => d.sku === selectedDrinkSku);
  const drinkUpcharge = selectedDrink?.upcharge ?? 0;

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
    drinkUpcharge +
    (mode === 'customize' ? extrasTotal : 0) +
    comboBurgersExtrasTotal;
  const lineTotal = unitPrice * quantity;

  // Detección de si el ítem actual tiene personalizaciones activas
  const hasCustomizations = useMemo(() => {
    if (isCombo) {
      const hasSideUpcharge = Boolean(selectedSide && selectedSide.upcharge > 0);
      const hasCustomBurgers = Object.values(comboBurgerDrafts).some(
        (d) =>
          d.removedIngredients.length > 0 ||
          d.extras.length > 0 ||
          Boolean(d.note?.trim())
      );
      return hasSideUpcharge || hasCustomBurgers;
    }
    if (product?.category.toLowerCase() === 'burgers') {
      return (
        mode === 'customize' &&
        (removedIngredients.length > 0 || extras.length > 0 || Boolean(specialNote.trim()))
      );
    }
    return false;
  }, [isCombo, selectedSide, comboBurgerDrafts, product, mode, removedIngredients, extras, specialNote]);

  // Texto contextual del botón CTA
  const ctaButtonLabel = useMemo(() => {
    const itemType = isCombo ? 'combos' : 'burgers';
    const singleItemType = isCombo ? 'combo' : 'burger';

    if (editingCartItem) {
      if (quantity > 1) {
        return hasCustomizations
          ? `Guardar (${quantity} ${itemType} personalizadas)`
          : `Guardar (${quantity} ${itemType})`;
      }
      return 'Guardar Cambios';
    }

    if (quantity > 1) {
      if (hasCustomizations) {
        return `Agregar ${quantity} ${itemType} personalizadas`;
      }
      return `Agregar ${quantity} ${itemType} (Original)`;
    }

    if (hasCustomizations) {
      return `Agregar 1 ${singleItemType} personalizada`;
    }
    return 'Agregar al pedido';
  }, [editingCartItem, quantity, hasCustomizations, isCombo]);

  // Handlers for single burger modifications
  const handleToggleRemoveIngredient = (ing: string) => {
    setRemovedIngredients((prev) =>
      prev.includes(ing) ? prev.filter((i) => i !== ing) : [...prev, ing]
    );
  };

  const handleExtraQuantityChange = (
    extraItem: { sku: string; name: string; price: number; isAvailable?: boolean },
    delta: number
  ) => {
    if (delta > 0 && extraItem.isAvailable === false) return;
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
    extraItem: { sku: string; name: string; price: number; isAvailable?: boolean },
    delta: number
  ) => {
    if (delta > 0 && extraItem.isAvailable === false) return;
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
    if (!product) return;
    const isBurger = product.category.toLowerCase() === 'burgers';

    const customization: CartItemCustomization = {
      itemKind: isCombo ? 'combo' : isBurger ? 'burger' : 'other',
      removedIngredients: !isCombo && mode === 'customize' ? removedIngredients : [],
      extras:
        !isCombo && mode === 'customize'
          ? extras
              .filter(
                (e) =>
                  e.qty > 0 &&
                  availableExtras.find((ae) => ae.sku === e.sku)?.isAvailable !== false
              )
              .map((e) => ({ sku: e.sku, name: `${e.qty}x ${e.name}`, price: e.price * e.qty, qty: e.qty }))
          : [],
      burgerNote: !isCombo ? (specialNote.trim() || undefined) : undefined,
      garnish:
        isCombo && selectedSide
          ? {
              sku: selectedSide.sku,
              name: selectedSide.name,
              upcharge: selectedSide.upcharge,
            }
          : undefined,
      includedDrink:
        isCombo && selectedDrink
          ? {
              sku: selectedDrink.sku,
              name: selectedDrink.name,
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
                extras: (draft?.extras ?? [])
                  .filter(
                    (e) =>
                      e.qty > 0 &&
                      availableExtras.find((ae) => ae.sku === e.sku)?.isAvailable !== false
                  )
                  .map((e) => ({
                    sku: e.sku,
                    name: `${e.qty}x ${e.name}`,
                    price: e.price * e.qty,
                    qty: e.qty,
                  })),
                burgerNote: draft?.note?.trim() || undefined,
              };
            })
          : undefined,
      extrasTotalCents: Math.round((mode === 'customize' ? extrasTotal : 0) * 100),
      includedGarnishUpchargeCents: Math.round(sideUpcharge * 100),
    };

    if (editingCartItem) {
      updateItem(editingCartItem.cartLineId, {
        quantity,
        unitPrice,
        lineTotal,
        customization,
      });
      pushToast(`Actualizaste ${product.name} en tu pedido`, 'success', 2500);
    } else {
      addItem({
        sku: product.sku,
        name: product.name,
        unitPrice,
        quantity,
        customization,
        lineTotal,
      });
      pushToast(`Agregaste ${quantity}x ${product.name} a tu pedido`, 'success', 2500);
    }

    closeDrawer();
  };

  return (
    <AnimatePresence>
      {isOpen && product && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={(e) => {
              e.stopPropagation();
              closeDrawer();
            }}
            aria-hidden="true"
          />

          {/* Drawer Panel */}
          <motion.div
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
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
                  onClick={(e) => {
                    e.stopPropagation();
                    closeDrawer();
                  }}
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

              {/* ── BURGER CUSTOMIZATION (Unit) ── */}
              {product.category.toLowerCase() === 'burgers' && (
                <div className="p-4 rounded-2xl bg-surface border border-line space-y-3.5">
                  {/* 🥗 Ingredientes de la receta D1 */}
                  {recipeIngredients.length > 0 && (
                    <div>
                      <span className="text-[11px] font-extrabold text-text-muted uppercase tracking-wider block mb-1.5">
                        🥗 INGREDIENTES DE LA RECETA
                      </span>
                      <ul className="space-y-1 text-xs text-text-secondary">
                        {recipeIngredients.map((ing, idx) => (
                          <li key={idx} className="flex items-center gap-1.5">
                            <span className="text-accent">•</span>
                            <span>{ing}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Botones Receta Original vs Personalizar */}
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-line/60">
                    <button
                      type="button"
                      onClick={() => setMode('original')}
                      className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer min-h-[44px] flex items-center justify-center gap-1.5 ${
                        mode === 'original'
                          ? 'bg-accent/10 text-accent border-2 border-accent font-extrabold shadow-xs'
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
                          ? 'bg-accent/10 text-accent border-2 border-accent font-extrabold shadow-xs'
                          : 'bg-surface-card text-text-secondary hover:text-text-primary border border-line'
                      }`}
                    >
                      🛠️ Personalizar
                    </button>
                  </div>

                  {/* Personalización desplegada al pulsar 'customize' */}
                  {mode === 'customize' && (
                    <div className="space-y-4 pt-3 border-t border-line/60">
                      {/* 1. Ingredientes a quitar */}
                      {recipeIngredients.length > 0 && (
                        <div>
                          <span className="text-xs font-bold text-text-primary block mb-2">
                            Personaliza ingredientes (Toca para quitar):
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
                                      ? 'bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/30 font-extrabold'
                                      : 'bg-surface-card text-text-primary border border-line hover:border-text-muted'
                                  }`}
                                >
                                  {isRemoved ? (
                                    <>
                                      <X className="w-3.5 h-3.5" />
                                      <span>✕ Sin {ing}</span>
                                    </>
                                  ) : (
                                    <>
                                      <Check className="w-3.5 h-3.5 text-accent" />
                                      <span>✓ {ing}</span>
                                    </>
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* 2. Extras / Upgrades */}
                      {availableExtras.length > 0 && (
                        <div>
                          <span className="text-xs font-bold text-text-primary block mb-2">
                            Extras y Adicionales:
                          </span>
                          <div className="space-y-2">
                            {availableExtras.map((extra) => {
                              const currentQty = extras.find((e) => e.sku === extra.sku)?.qty ?? 0;
                              const isAvailable = extra.isAvailable !== false;

                              return (
                                <div
                                  key={extra.sku}
                                  className={`flex items-center justify-between p-2.5 rounded-xl border transition-all ${
                                    !isAvailable
                                      ? 'bg-surface/50 border-line/60 opacity-60 select-none'
                                      : 'bg-surface-card border-line'
                                  }`}
                                >
                                  <div>
                                    <div className="flex items-center gap-1.5">
                                      <span
                                        className={`text-xs font-bold ${
                                          !isAvailable
                                            ? 'text-text-muted line-through'
                                            : 'text-text-primary'
                                        }`}
                                      >
                                        {extra.name}
                                      </span>
                                      {!isAvailable && (
                                        <span className="text-[10px] font-extrabold text-red-500 bg-red-500/10 px-1.5 py-0.5 rounded border border-red-500/20">
                                          Agotado
                                        </span>
                                      )}
                                    </div>
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
                                      onClick={() => isAvailable && handleExtraQuantityChange(extra, 1)}
                                      disabled={!isAvailable}
                                      className="w-8 h-8 rounded-lg bg-accent text-white flex items-center justify-center hover:bg-accent-dark disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer min-h-[36px] min-w-[36px]"
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

                      {/* 3. Instrucciones de cocina */}
                      <div>
                        <label htmlFor="kitchen-special-note" className="text-xs font-bold text-text-primary block mb-1.5">
                          Instrucciones de cocina (opcional):
                        </label>
                        <textarea
                          id="kitchen-special-note"
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
                  {/* 1. Burgers incluidas en el combo */}
                  {comboBurgerProducts.length > 0 && (
                    <div className="p-4 rounded-2xl bg-surface border border-line space-y-3">
                      <div>
                        <span className="text-xs font-extrabold text-text-primary uppercase tracking-wide block">
                          🍔 1. BURGERS DEL COMBO
                        </span>
                        <p className="text-[11px] text-text-secondary mt-0.5">
                          Toca cada burger para quitar ingredientes o agregar extras.
                        </p>
                      </div>
                      <div className="space-y-2">
                        {comboBurgerProducts.map((burger, idx) => {
                          const isExpanded = expandedComboBurger === idx;
                          const draft = comboBurgerDrafts[idx];
                          const burgerIngredients = getRecipeForSku(burger.sku || burger.name);

                          const hasModifications =
                            (draft?.removedIngredients.length ?? 0) > 0 ||
                            (draft?.extras.length ?? 0) > 0 ||
                            Boolean(draft?.note);

                          const draftSummary = [
                            ...(draft?.removedIngredients ?? []).map((m) => `Sin ${m}`),
                            ...(draft?.extras ?? []).filter((e) => e.qty > 0).map((e) => `${e.qty}x ${e.name}`),
                          ].join(' · ');

                          return (
                            <div
                              key={idx}
                              className="rounded-xl border border-line bg-surface-card overflow-hidden"
                            >
                              <button
                                type="button"
                                aria-expanded={isExpanded}
                                aria-controls={`combo-burger-panel-${idx}`}
                                onClick={() => setExpandedComboBurger(isExpanded ? null : idx)}
                                className="w-full flex items-center justify-between p-3 text-left hover:bg-surface transition-colors cursor-pointer min-h-[44px] focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
                              >
                                <div>
                                  <span className="text-xs font-bold text-text-primary block">
                                    {burger.name} {comboBurgerProducts.length > 1 ? `#${idx + 1}` : ''}
                                  </span>
                                  <span className={`text-[11px] font-bold ${hasModifications ? 'text-accent' : 'text-text-muted'}`}>
                                    {hasModifications ? `✓ ${draftSummary || 'Personalizada'}` : 'Receta original'}
                                  </span>
                                </div>
                                <div className="text-text-muted">
                                  {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                </div>
                              </button>

                              {isExpanded && (
                                <div id={`combo-burger-panel-${idx}`} className="p-3 border-t border-line space-y-3 bg-surface/50">
                                  {/* Removals */}
                                  {burgerIngredients.length > 0 && (
                                    <div>
                                      <span className="text-[11px] font-bold text-text-primary block mb-1.5">
                                        Quitar ingredientes:
                                      </span>
                                      <div className="flex flex-wrap gap-1.5">
                                        {burgerIngredients.map((ing) => {
                                          const isRemoved = draft?.removedIngredients.includes(ing);
                                          return (
                                            <button
                                              key={ing}
                                              type="button"
                                              onClick={() => handleComboBurgerToggleRemove(idx, ing)}
                                              className={`px-2.5 py-1 rounded-full text-[11px] font-bold transition-all cursor-pointer min-h-[32px] flex items-center gap-1 ${
                                                isRemoved
                                                  ? 'bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/30 font-extrabold'
                                                  : 'bg-surface-card text-text-primary border border-line hover:border-text-muted'
                                              }`}
                                            >
                                              {isRemoved ? `✕ Sin ${ing}` : `✓ ${ing}`}
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
                                        {availableExtras.map((extra) => {
                                          const currentQty =
                                            draft?.extras.find((e) => e.sku === extra.sku)?.qty ?? 0;
                                          const isAvailable = extra.isAvailable !== false;

                                          return (
                                            <div
                                              key={extra.sku}
                                              className={`flex items-center justify-between p-2 rounded-lg border text-xs transition-all ${
                                                !isAvailable
                                                  ? 'bg-surface/50 border-line/60 opacity-60 select-none'
                                                  : 'bg-surface-card border-line'
                                              }`}
                                            >
                                              <div>
                                                <div className="flex items-center gap-1.5">
                                                  <span
                                                    className={`font-bold ${
                                                      !isAvailable
                                                        ? 'text-text-muted line-through'
                                                        : 'text-text-primary'
                                                    }`}
                                                  >
                                                    {extra.name}
                                                  </span>
                                                  {!isAvailable && (
                                                    <span className="text-[9px] font-extrabold text-red-500 bg-red-500/10 px-1 py-0.5 rounded border border-red-500/20">
                                                      Agotado
                                                    </span>
                                                  )}
                                                </div>
                                                <span className="text-[10px] text-accent font-bold">
                                                  +{formatCurrency(extra.price)}
                                                </span>
                                              </div>
                                              <div className="flex items-center gap-1.5">
                                                <button
                                                  type="button"
                                                  onClick={() => handleComboBurgerExtraChange(idx, extra, -1)}
                                                  disabled={currentQty === 0}
                                                  className="w-6 h-6 rounded bg-surface border border-line flex items-center justify-center disabled:opacity-30 cursor-pointer min-h-[32px] min-w-[32px]"
                                                >
                                                  <Minus className="w-3 h-3" />
                                                </button>
                                                <span className="w-4 text-center font-bold text-xs">
                                                  {currentQty}
                                                </span>
                                                <button
                                                  type="button"
                                                  onClick={() => isAvailable && handleComboBurgerExtraChange(idx, extra, 1)}
                                                  disabled={!isAvailable}
                                                  className="w-6 h-6 rounded bg-accent text-white flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer min-h-[32px] min-w-[32px]"
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

                  {/* 2. Side Selection (Guarnición) */}
                  {sideOptions.length > 0 && (
                    <div className="p-4 rounded-2xl bg-surface border border-line space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-extrabold text-text-primary uppercase tracking-wide">
                          🍟 2. ELIGE TU GUARNICIÓN
                        </span>
                      </div>
                      <div className="space-y-2">
                        {sideOptions.map((side) => {
                          const isSelected = selectedSideSku === side.sku;
                          const isAvailable = side.isAvailable !== false;

                          return (
                            <label
                              key={side.sku}
                              className={`flex items-center justify-between p-3 rounded-xl border transition-all min-h-[44px] ${
                                !isAvailable
                                  ? 'border-line/60 bg-surface/50 opacity-50 cursor-not-allowed select-none'
                                  : isSelected
                                  ? 'border-accent bg-accent/5 ring-1 ring-accent cursor-pointer'
                                  : 'border-line bg-surface-card hover:border-text-muted/30 cursor-pointer'
                              }`}
                            >
                              <div className="flex items-center gap-2.5">
                                <input
                                  type="radio"
                                  name="combo-side"
                                  disabled={!isAvailable}
                                  checked={isSelected && isAvailable}
                                  onChange={() => isAvailable && setSelectedSideSku(side.sku)}
                                  className="w-4 h-4 text-accent accent-accent disabled:opacity-40"
                                />
                                <span
                                  className={`text-xs font-bold ${
                                    !isAvailable ? 'text-text-muted line-through' : 'text-text-primary'
                                  }`}
                                >
                                  {side.name}
                                </span>
                              </div>
                              {!isAvailable ? (
                                <span className="text-[11px] font-bold text-red-500 bg-red-500/10 px-2 py-0.5 rounded-md border border-red-500/20">
                                  Agotado
                                </span>
                              ) : (
                                <span className="text-xs font-extrabold text-accent">
                                  {side.upcharge > 0 ? `+${formatCurrency(side.upcharge)}` : 'Incluida'}
                                </span>
                              )}
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* 3. Drink Selection (Bebida) */}
                  {drinkOptions.length > 0 && (
                    <div className="p-4 rounded-2xl bg-surface border border-line space-y-2.5">
                      <span className="text-xs font-extrabold text-text-primary uppercase tracking-wide">
                        🥤 3. ELIGE TU BEBIDA
                      </span>
                      <div className="space-y-2">
                        {drinkOptions.map((drink) => {
                          const isSelected = selectedDrinkSku === drink.sku;
                          const isAvailable = drink.isAvailable !== false;

                          return (
                            <label
                              key={drink.sku}
                              className={`flex items-center justify-between p-3 rounded-xl border transition-all min-h-[44px] ${
                                !isAvailable
                                  ? 'border-line/60 bg-surface/50 opacity-50 cursor-not-allowed select-none'
                                  : isSelected
                                  ? 'border-accent bg-accent/5 ring-1 ring-accent cursor-pointer'
                                  : 'border-line bg-surface-card hover:border-text-muted/30 cursor-pointer'
                              }`}
                            >
                              <div className="flex items-center gap-2.5">
                                <input
                                  type="radio"
                                  name="combo-drink"
                                  disabled={!isAvailable}
                                  checked={isSelected && isAvailable}
                                  onChange={() => isAvailable && setSelectedDrinkSku(drink.sku)}
                                  className="w-4 h-4 text-accent accent-accent disabled:opacity-40"
                                />
                                <span
                                  className={`text-xs font-bold ${
                                    !isAvailable ? 'text-text-muted line-through' : 'text-text-primary'
                                  }`}
                                >
                                  {drink.name}
                                </span>
                              </div>
                              {!isAvailable ? (
                                <span className="text-[11px] font-bold text-red-500 bg-red-500/10 px-2 py-0.5 rounded-md border border-red-500/20">
                                  Agotado
                                </span>
                              ) : (
                                <span className="text-xs font-extrabold text-accent">
                                  {drink.upcharge > 0 ? `+${formatCurrency(drink.upcharge)}` : 'Incluida'}
                                </span>
                              )}
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Banner Reasegurador cuando se seleccionan 2 o más unidades personalizadas */}
              {hasCustomizations && quantity > 1 && (
                <motion.div
                  role="status"
                  aria-live="polite"
                  initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 6 }}
                  animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
                  className="p-3.5 rounded-2xl bg-accent/10 border border-accent/25 flex items-start gap-2.5 text-xs text-text-primary shadow-xs"
                >
                  <Sparkles className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <p className="font-black text-accent">
                      {isCombo
                        ? `Los ${quantity} combos se prepararán con estas mismas elecciones.`
                        : `Las ${quantity} hamburguesas se prepararán con esta misma personalización.`}
                    </p>
                    <p className="text-[11px] text-text-secondary leading-relaxed">
                      ¿Quieres otra hamburguesa con receta original o personalización distinta? Agrégalas por separado a tu pedido.
                    </p>
                  </div>
                </motion.div>
              )}
            </div>

            {/* Sticky CTA Footer */}
            <div className="border-t border-line bg-surface-card p-4 sm:p-5 flex flex-col gap-2 shadow-panel shrink-0">
              <div className="flex items-center justify-between gap-3 sm:gap-4">
                {/* Quantity Stepper */}
                <QuantityStepper
                  value={quantity}
                  onChange={setQuantity}
                  min={1}
                  size="default"
                  ariaLabel="Cantidad del producto"
                />

                {/* Add/Save CTA */}
                <button
                  type="button"
                  onClick={handleAddToCart}
                  className="flex-1 py-3.5 px-4 rounded-2xl bg-accent text-white font-extrabold text-xs sm:text-base hover:bg-accent-dark active:scale-[0.98] transition-transform shadow-cta cursor-pointer min-h-[48px] flex items-center justify-between gap-2"
                >
                  <span className="truncate">{ctaButtonLabel}</span>
                  <span className="shrink-0 tabular-nums font-black">{formatCurrency(lineTotal)}</span>
                </button>
              </div>

              {/* Helper caption debajo del stepper cuando quantity > 1 */}
              {quantity > 1 && (
                <div className="text-[11px] font-bold px-1 text-text-secondary flex items-center gap-1.5 animate-in fade-in">
                  <span className="w-1.5 h-1.5 rounded-full bg-accent shrink-0" />
                  <span>
                    {hasCustomizations
                      ? `Las ${quantity} unidades tendrán la misma personalización.`
                      : `Las ${quantity} unidades se prepararán con Receta Original.`}
                  </span>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
