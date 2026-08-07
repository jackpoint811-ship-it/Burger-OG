import { useEffect, useId, useRef, useState, useMemo, type MouseEvent } from "react";
import { type CatalogProduct, type CatalogProductType, PRODUCT_TYPE_LABELS, resolveCatalogAssetUrl } from "../lib/catalog-mode";
import { CATALOG_CART_MAX_QTY, type CatalogCartItem } from "../lib/catalog-cart";
import { formatCurrency } from "../lib/order";
import { useCatalogCart } from "./CatalogCartContext";
import { motion, useReducedMotion } from "framer-motion";

/* ── Inline SVG fallback para el media del drawer ──────── */
const DrawerFallbackSvg = ({ type }: { type: CatalogProductType }) => {
  const fills: Record<CatalogProductType, string> = {
    burger: "var(--color-accent)",
    combo: "var(--color-warning)",
    side: "var(--color-danger)",
    drink: "var(--color-success)",
    topping: "var(--color-accent)",
  };
  const color = fills[type] ?? fills.burger;

  return (
    <div className="catalog-drawer__media-fallback" aria-hidden="true">
      <svg viewBox="0 0 120 120" fill="none" className="catalog-drawer__fallback-icon">
        <circle cx="60" cy="60" r="58" fill="currentColor" fillOpacity="0.06" stroke={color} strokeWidth="1.5" strokeOpacity="0.3"/>
        {type === "burger" && (
          <>
            <path d="M24 54C24 34 40 22 60 22C80 22 96 34 96 54H24Z" fill={color} fillOpacity="0.25" stroke={color} strokeWidth="2"/>
            <path d="M20 66H100" stroke="#F59E0B" strokeWidth="4" strokeLinecap="round"/>
            <path d="M24 66L28 72L36 66L44 72L52 66L60 72L68 66L76 72L84 66L92 72L96 66" stroke="#F59E0B" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            <rect x="20" y="76" width="80" height="10" rx="5" fill="#C92027" fillOpacity="0.8" stroke="#C92027" strokeWidth="1.5"/>
            <path d="M24 92C24 96 28 99 32 99H88C92 99 96 96 96 92H24Z" fill={color} fillOpacity="0.2" stroke={color} strokeWidth="2"/>
          </>
        )}
        {type === "combo" && (
          <>
            <path d="M16 52C16 37 28 26 46 26S76 37 76 52H16Z" fill={color} fillOpacity="0.2" stroke={color} strokeWidth="2"/>
            <rect x="14" y="58" width="64" height="10" rx="5" fill="#F59E0B" stroke="#F59E0B" strokeWidth="1.5"/>
            <path d="M16 76H72V84C72 88 68 92 64 92H24C20 92 16 88 16 84V76Z" fill={color} fillOpacity="0.2" stroke={color} strokeWidth="2"/>
            <path d="M80 44L84 96H108L112 44H80Z" fill="var(--color-success)" fillOpacity="0.2" stroke="var(--color-success)" strokeWidth="2" strokeLinejoin="round"/>
            <path d="M96 44V28L106 20" stroke="var(--color-success)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            <rect x="78" y="40" width="36" height="6" rx="3" fill="var(--color-success)" stroke="var(--color-success)"/>
          </>
        )}
        {(type === "side" || type === "topping" || type === "drink") && (
          <>
            <path d="M40 96L36 36H84L80 96H40Z" fill={color} fillOpacity="0.2" stroke={color} strokeWidth="2" strokeLinejoin="round"/>
            <rect x="32" y="28" width="56" height="10" rx="5" fill={color} fillOpacity="0.3" stroke={color} strokeWidth="2"/>
            <path d="M46 62C54 68 66 68 74 62" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeOpacity="0.6"/>
          </>
        )}
      </svg>
      <p className="catalog-drawer__fallback-label">{PRODUCT_TYPE_LABELS[type]}</p>
    </div>
  );
};

type CatalogProductDrawerProps = {
  product: CatalogProduct;
  initialCartItem?: CatalogCartItem | null;
  recipeIngredients?: string[];
  allProducts?: CatalogProduct[];
  onClose: () => void;
};

const focusableSelector = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

export function CatalogProductDrawer({ product, initialCartItem, recipeIngredients, allProducts, onClose }: CatalogProductDrawerProps) {
  const { items, addItem, updateItem } = useCatalogCart();
  const [justAdded, setJustAdded] = useState(false);
  const [removedMods, setRemovedMods] = useState<string[]>([]);
  const [upgrades, setUpgrades] = useState<{ id: string; name: string; price: number; qty: number }[]>([]);
  const [comboSide, setComboSide] = useState<string>("");
  const [itemMode, setItemMode] = useState<"original" | "customize">("original");

  const closeRef = useRef<HTMLButtonElement | null>(null);
  const dialogRef = useRef<HTMLElement | null>(null);
  const feedbackTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const titleId = useId();
  const descriptionId = useId();
  const shouldReduceMotion = useReducedMotion();
  const src = product ? resolveCatalogAssetUrl(product.imageUrl, product.imageKey) : undefined;

  const isEditing = Boolean(initialCartItem);

  /* ── 1. Extras/Upgrades dinámicos desde Chekeo D1 (0 fallbacks) ── */
  const availableUpgrades = useMemo(() => {
    if (!allProducts || !allProducts.length) return [];
    return allProducts
      .filter((p) => (p.categoryKey === "extras" || p.type === "topping") && p.isAvailable)
      .map((p) => ({
        id: p.id,
        name: p.name,
        price: p.isPromoActive && p.promoPrice != null && p.promoPrice < p.price ? p.promoPrice : p.price,
      }));
  }, [allProducts]);

  /* ── 2. Guarniciones de combos dinámicas (priorizando configuración de Chekeo D1) ── */
  const comboSideOptions = useMemo(() => {
    if (!allProducts || !allProducts.length) return [];

    if (product.type === "combo" && product.comboConfig?.optionGroups) {
      const sideGroup = product.comboConfig.optionGroups.find(
        (g) => g.name.toLowerCase().includes("guarnici") || g.name.toLowerCase().includes("side")
      );
      if (sideGroup && sideGroup.options.length > 0) {
        return sideGroup.options
          .map((opt) => {
            const sideItem = allProducts.find((p) => p.sku === opt.sku);
            if (!sideItem || !sideItem.isAvailable) return null;
            const extraPrice = (opt.upchargeCents || 0) / 100;
            return {
              id: sideItem.id,
              label: extraPrice > 0 ? `${sideItem.name} (+ ${formatCurrency(extraPrice)})` : sideItem.name,
              rawLabel: sideItem.name,
              extraPrice: extraPrice,
            };
          })
          .filter(Boolean) as { id: string; label: string; rawLabel: string; extraPrice: number }[];
      }
    }

    const sides = allProducts.filter((p) => (p.categoryKey === "guarniciones" || p.type === "side") && p.isAvailable);
    if (!sides.length) return [];
    const basePrice = sides[0]?.price ?? 0;
    return sides.map((p) => {
      const effectivePrice = p.isPromoActive && p.promoPrice != null && p.promoPrice < p.price ? p.promoPrice : p.price;
      const diff = Math.max(0, effectivePrice - basePrice);
      return {
        id: p.id,
        label: diff > 0 ? `${p.name} (+ ${formatCurrency(diff)})` : p.name,
        rawLabel: p.name,
        extraPrice: diff,
      };
    });
  }, [allProducts, product]);

  /* ── 3. Ingredientes de receta dinámicos (0 fallbacks) ───── */
  const AVAILABLE_MODS = useMemo(() => {
    return recipeIngredients && recipeIngredients.length > 0 ? recipeIngredients : [];
  }, [recipeIngredients]);

  useEffect(() => {
    setJustAdded(false);
    const defaultSide = comboSideOptions.length > 0 ? comboSideOptions[0].label : "";

    if (initialCartItem) {
      const parsedRemoved = (initialCartItem.mods || [])
        .filter((m) => m.startsWith("Sin "))
        .map((m) => m.replace("Sin ", ""));
      setRemovedMods(parsedRemoved);
      setUpgrades(initialCartItem.upgrades || []);

      const sideMod = (initialCartItem.mods || []).find((m) => m.startsWith("Guarnición: "));
      if (sideMod) {
        setComboSide(sideMod.replace("Guarnición: ", ""));
      } else {
        setComboSide(defaultSide);
      }

      if (parsedRemoved.length > 0 || (initialCartItem.upgrades && initialCartItem.upgrades.length > 0)) {
        setItemMode("customize");
      } else {
        setItemMode("original");
      }
    } else {
      setRemovedMods([]);
      setUpgrades([]);
      setComboSide(defaultSide);
      setItemMode("original");
    }
    if (feedbackTimer.current) clearTimeout(feedbackTimer.current);
  }, [product?.id, initialCartItem, comboSideOptions]);

  useEffect(() => {
    return () => {
      if (feedbackTimer.current) clearTimeout(feedbackTimer.current);
    };
  }, []);

  useEffect(() => {
    if (!product) return;

    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousBodyOverflow = document.body.style.overflow;
    const focusFrame = window.requestAnimationFrame(() => closeRef.current?.focus({ preventScroll: true }));
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== "Tab") return;

      const focusableElements = Array.from(dialogRef.current?.querySelectorAll<HTMLElement>(focusableSelector) ?? []);
      if (!focusableElements.length) {
        event.preventDefault();
        return;
      }

      const first = focusableElements[0];
      const last = focusableElements[focusableElements.length - 1];
      const activeElement = document.activeElement;

      if (event.shiftKey && (activeElement === first || !dialogRef.current?.contains(activeElement))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (activeElement === last || !dialogRef.current?.contains(activeElement))) {
        event.preventDefault();
        first.focus();
      }
    };

    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKeyDown);

    return () => {
      window.cancelAnimationFrame(focusFrame);
      document.body.style.overflow = previousBodyOverflow;
      document.removeEventListener("keydown", onKeyDown);
      if (previous?.isConnected) previous.focus({ preventScroll: true });
    };
  }, [onClose, product]);

  if (!product) return null;

  const currentItem = items.find((i) => i.productId === product.id);
  const isAtMax = currentItem ? currentItem.qty >= CATALOG_CART_MAX_QTY : false;

  const handleBackdropClick = (event: MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) onClose();
  };

  const comboExtraPrice = useMemo(() => {
    if (product.type !== "combo" || !comboSide) return 0;
    const sideObj = comboSideOptions.find((s) => s.label === comboSide || s.rawLabel === comboSide);
    return sideObj ? sideObj.extraPrice : 0;
  }, [product.type, comboSide, comboSideOptions]);

  const effectiveBasePrice = useMemo(() => {
    if (product.isPromoActive && product.promoPrice != null && product.promoPrice < product.price) {
      return product.promoPrice;
    }
    return product.price;
  }, [product.isPromoActive, product.promoPrice, product.price]);

  const currentTotal = useMemo(() => {
    const upgradesTotal = upgrades.reduce((sum, u) => sum + u.price * u.qty, 0);
    return effectiveBasePrice + comboExtraPrice + (itemMode === "customize" ? upgradesTotal : 0);
  }, [effectiveBasePrice, comboExtraPrice, upgrades, itemMode]);

  const handleAddToCart = () => {
    if (justAdded) {
      onClose();
      return;
    }
    if (!product.isAvailable) return;
    if (isAtMax && !isEditing) return;

    const modsList: string[] = [];
    if (itemMode === "customize") {
      modsList.push(...removedMods.map((m) => `Sin ${m}`));
    }
    if (product.type === "combo" && comboSide) {
      modsList.push(`Guarnición: ${comboSide}`);
    }
    const activeUpgrades = itemMode === "customize" ? upgrades.filter((u) => u.qty > 0) : [];

    const effectiveProductToCart = {
      ...product,
      price: effectiveBasePrice
    };

    if (isEditing && initialCartItem) {
      updateItem(initialCartItem.cartItemId, effectiveProductToCart, modsList, activeUpgrades);
    } else {
      addItem(effectiveProductToCart, modsList, activeUpgrades);
    }

    setJustAdded(true);
    if (feedbackTimer.current) clearTimeout(feedbackTimer.current);
    feedbackTimer.current = setTimeout(() => {
      setJustAdded(false);
      onClose();
    }, 1200);
  };

  const handleModToggle = (mod: string) => {
    setRemovedMods((prev) => (prev.includes(mod) ? prev.filter((m) => m !== mod) : [...prev, mod]));
  };

  const handleUpgradeChange = (id: string, name: string, price: number, delta: number) => {
    setUpgrades((prev) => {
      const existing = prev.find((u) => u.id === id);
      if (existing) {
        const newQty = Math.max(0, existing.qty + delta);
        if (newQty === 0) return prev.filter((u) => u.id !== id);
        return prev.map((u) => (u.id === id ? { ...u, qty: newQty } : u));
      }
      if (delta > 0) return [...prev, { id, name, price, qty: delta }];
      return prev;
    });
  };

  return (
    <motion.div
      className="catalog-drawer-backdrop"
      role="presentation"
      onClick={handleBackdropClick}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      <motion.section
        ref={dialogRef as any}
        className="catalog-drawer"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={product.description ? descriptionId : undefined}
        initial={shouldReduceMotion ? { opacity: 0 } : { y: "100%" }}
        animate={shouldReduceMotion ? { opacity: 1 } : { y: 0 }}
        exit={shouldReduceMotion ? { opacity: 0 } : { y: "100%" }}
        transition={{ type: "tween", ease: "easeOut", duration: 0.25 }}
      >
        <div className="catalog-drawer__handle" aria-hidden="true" />

        <div className="catalog-drawer__media" aria-hidden="true">
          {src ? <img src={src} alt="" decoding="async" loading="lazy" /> : <DrawerFallbackSvg type={product.type} />}
          <div className="catalog-drawer__media-overlay" />
          <div className="catalog-drawer__media-badges">
            {product.type === "combo" && <span className="catalog-badge catalog-badge--best-seller">🔥 Combo Especial</span>}
            {product.isFeatured && product.type !== "combo" && <span className="catalog-badge catalog-badge--featured">⭐ Destacado</span>}
            {product.badge && product.type !== "combo" && !product.isFeatured && <span className="catalog-badge catalog-badge--custom">{product.badge}</span>}
          </div>
        </div>

        <div className="catalog-drawer__content">
          <header className="catalog-drawer__header">
            <div>
              <div className="catalog-drawer__eyebrow">
                <span>{PRODUCT_TYPE_LABELS[product.type]}</span>
                {product.badge ? <em>{product.badge}</em> : null}
              </div>
              <h2 id={titleId}>{product.name}</h2>
            </div>
            <button ref={closeRef} type="button" className="catalog-drawer__close" onClick={onClose} aria-label={`Cerrar detalle de ${product.name}`}>
              <span aria-hidden="true">×</span>
            </button>
          </header>

          {/* ── Descripción oficial desde D1 ── */}
          {product.description ? (
            <p id={descriptionId} className="catalog-drawer__description">
              {product.description}
            </p>
          ) : null}

          <div className="catalog-drawer__details">
            <div className="catalog-drawer__price-row">
              {product.isPromoActive && product.promoPrice != null && product.promoPrice < product.price ? (
                <div style={{ display: "flex", alignItems: "baseline", gap: "8px" }}>
                  <span style={{ fontSize: "14px", textDecoration: "line-through", opacity: 0.6 }}>{formatCurrency(product.price)}</span>
                  <strong className="catalog-drawer__price" style={{ color: "var(--color-accent)" }}>{formatCurrency(currentTotal)}</strong>
                </div>
              ) : (
                <strong className="catalog-drawer__price">{formatCurrency(currentTotal)}</strong>
              )}
              {currentItem && currentItem.qty > 0 && !isEditing && (
                <span className="catalog-drawer__qty-badge">{currentItem.qty} en carrito</span>
              )}
            </div>
            <span className={product.isAvailable ? "catalog-drawer__availability" : "catalog-drawer__availability catalog-drawer__availability--unavailable"}>
              {product.isAvailable ? "✓ Disponible" : "✕ No disponible"}
            </span>
          </div>

          {/* ── BURGERS Y COMBOS: Botones de Modo e Ingredientes ── */}
          {(product.type === "burger" || product.type === "combo") && (
            <div className="catalog-drawer__section-card" style={{ marginTop: "12px" }}>
              {AVAILABLE_MODS.length > 0 ? (
                <>
                  <span className="catalog-drawer__section-title">🥗 INGREDIENTES DE LA RECETA</span>
                  <ul className="catalog-drawer__ingredients-list" style={{ marginTop: "6px", fontSize: "13px", color: "var(--color-text-secondary)" }}>
                    {AVAILABLE_MODS.map((ing, idx) => (
                      <li key={idx}>• {ing}</li>
                    ))}
                  </ul>
                </>
              ) : null}

              {/* Botones Receta Original vs Personalizar */}
              <div className="catalog-drawer__mode-toggle-grid" style={{ marginTop: AVAILABLE_MODS.length > 0 ? "14px" : "0px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <button
                  type="button"
                  className={`catalog-drawer__mode-btn ${itemMode === "original" ? "catalog-drawer__mode-btn--active" : ""}`}
                  style={{
                    padding: "10px",
                    borderRadius: "var(--radius-sm)",
                    fontWeight: 700,
                    fontSize: "13px",
                    border: itemMode === "original" ? "2px solid var(--color-accent)" : "1px solid var(--color-line)",
                    background: itemMode === "original" ? "var(--color-accent-soft)" : "var(--color-surface)",
                    color: itemMode === "original" ? "var(--color-accent)" : "var(--color-text-secondary)",
                    cursor: "pointer"
                  }}
                  onClick={() => setItemMode("original")}
                >
                  🍔 Receta Original
                </button>
                <button
                  type="button"
                  className={`catalog-drawer__mode-btn ${itemMode === "customize" ? "catalog-drawer__mode-btn--active" : ""}`}
                  style={{
                    padding: "10px",
                    borderRadius: "var(--radius-sm)",
                    fontWeight: 700,
                    fontSize: "13px",
                    border: itemMode === "customize" ? "2px solid var(--color-accent)" : "1px solid var(--color-line)",
                    background: itemMode === "customize" ? "var(--color-accent-soft)" : "var(--color-surface)",
                    color: itemMode === "customize" ? "var(--color-accent)" : "var(--color-text-secondary)",
                    cursor: "pointer"
                  }}
                  onClick={() => setItemMode("customize")}
                >
                  🛠️ Personalizar
                </button>
              </div>
            </div>
          )}

          {/* ── OPCIONES DE COMBO: Guarnición Dinámica desde Chekeo ── */}
          {product.type === "combo" && comboSideOptions.length > 0 && (
            <div className="catalog-drawer__section-card" style={{ marginTop: "12px" }}>
              <span className="catalog-drawer__section-title">🍟 ELIGE TU GUARNICIÓN</span>
              <div className="catalog-drawer__radio-group" style={{ display: "grid", gap: "8px", marginTop: "8px" }}>
                {comboSideOptions.map((side) => (
                  <label key={side.id} className="catalog-drawer__radio-label" style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    padding: "10px 14px",
                    borderRadius: "var(--radius-sm)",
                    background: comboSide === side.label ? "var(--color-accent-soft)" : "var(--color-surface)",
                    border: comboSide === side.label ? "1px solid var(--color-accent)" : "1px solid var(--color-line)",
                    cursor: "pointer"
                  }}>
                    <input
                      type="radio"
                      name="combo-side-opt"
                      checked={comboSide === side.label}
                      onChange={() => setComboSide(side.label)}
                      style={{ accentColor: "var(--color-accent)", width: "18px", height: "18px" }}
                    />
                    <span style={{ fontSize: "13px", fontWeight: comboSide === side.label ? 700 : 500 }}>{side.label}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* ── PERSONALIZACIÓN Y EXTRAS (Desplegado solo en modo 'customize') ── */}
          {itemMode === "customize" && (
            <div className="catalog-drawer__section-card" style={{ marginTop: "12px" }}>
              {AVAILABLE_MODS.length > 0 && (
                <div className="catalog-drawer__mods">
                  <p className="catalog-drawer__mods-title">Personaliza ingredientes (Quitar)</p>
                  <div className="catalog-drawer__mods-grid">
                    {AVAILABLE_MODS.map((mod) => {
                      const isRemoved = removedMods.includes(mod);
                      return (
                        <button
                          key={mod}
                          type="button"
                          onClick={() => handleModToggle(mod)}
                          className={`catalog-drawer__mod-chip ${isRemoved ? "catalog-drawer__mod-chip--removed" : "catalog-drawer__mod-chip--active"}`}
                        >
                          {isRemoved ? `✕ Sin ${mod}` : `✓ ${mod}`}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Upgrades & Extras Dinámicos desde Chekeo */}
              {availableUpgrades.length > 0 && (
                <div className="catalog-drawer__mods" style={{ marginTop: "16px" }}>
                  <p className="catalog-drawer__mods-title">Agrega extras adicionales</p>
                  <div className="catalog-drawer__upgrades-grid">
                    {availableUpgrades.map((upgrade) => {
                      const currentQty = upgrades.find((u) => u.id === upgrade.id)?.qty || 0;
                      return (
                        <div key={upgrade.id} className="catalog-drawer__upgrade-card">
                          <div className="catalog-drawer__upgrade-info">
                            <span className="catalog-drawer__upgrade-name">{upgrade.name}</span>
                            <span className="catalog-drawer__upgrade-price">+{formatCurrency(upgrade.price)}</span>
                          </div>
                          <div className="catalog-drawer__upgrade-actions">
                            <button
                              type="button"
                              className={`catalog-drawer__upgrade-btn ${currentQty === 0 ? "catalog-drawer__upgrade-btn--disabled" : ""}`}
                              onClick={() => handleUpgradeChange(upgrade.id, upgrade.name, upgrade.price, -1)}
                              disabled={currentQty === 0}
                            >
                              −
                            </button>
                            <span className="catalog-drawer__upgrade-qty">{currentQty}</span>
                            <button
                              type="button"
                              className="catalog-drawer__upgrade-btn"
                              onClick={() => handleUpgradeChange(upgrade.id, upgrade.name, upgrade.price, 1)}
                            >
                              +
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── FOOTER DE CTA FIJO PEGAJOSO (Sticky Footer) ── */}
          <div className="catalog-drawer__footer">
            {product.isAvailable ? (
              <button
                type="button"
                className={`catalog-drawer__add-btn${justAdded ? " catalog-drawer__add-btn--added" : ""}`}
                onClick={handleAddToCart}
                aria-live="polite"
              >
                <span className="catalog-drawer__add-btn-icon" aria-hidden="true">
                  {justAdded ? "✅" : isEditing ? "✏️" : "🛒"}
                </span>
                <span>
                  {justAdded
                    ? "¡Guardado!"
                    : isEditing
                    ? `Guardar Cambios — ${formatCurrency(currentTotal)}`
                    : `Agregar al carrito — ${formatCurrency(currentTotal)}`}
                </span>
              </button>
            ) : (
              <button type="button" className="catalog-drawer__add-btn catalog-drawer__add-btn--unavailable" disabled>
                <span aria-hidden="true">✕</span>
                <span>No disponible</span>
              </button>
            )}
          </div>
        </div>
      </motion.section>
    </motion.div>
  );
}
