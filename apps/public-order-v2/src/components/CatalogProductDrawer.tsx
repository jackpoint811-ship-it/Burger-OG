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

const COMBO_SIDES = [
  { label: "Papas a la francesa tradicionales", extraPrice: 0 },
  { label: "Papas sazonadas especial", extraPrice: 0 },
  { label: "Aros de Cebolla crujientes (+ $5)", extraPrice: 5 },
];

export function CatalogProductDrawer({ product, initialCartItem, onClose }: CatalogProductDrawerProps) {
  const { items, addItem, updateItem } = useCatalogCart();
  const [justAdded, setJustAdded] = useState(false);
  const [removedMods, setRemovedMods] = useState<string[]>([]);
  const [upgrades, setUpgrades] = useState<{ id: string; name: string; price: number; qty: number }[]>([]);
  const [comboSide, setComboSide] = useState<string>(COMBO_SIDES[0].label);
  const [comboMode, setComboMode] = useState<"original" | "customize">("original");

  const closeRef = useRef<HTMLButtonElement | null>(null);
  const dialogRef = useRef<HTMLElement | null>(null);
  const feedbackTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const titleId = useId();
  const descriptionId = useId();
  const shouldReduceMotion = useReducedMotion();
  const src = product ? resolveCatalogAssetUrl(product.imageUrl, product.imageKey) : undefined;

  const isEditing = Boolean(initialCartItem);

  useEffect(() => {
    setJustAdded(false);
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
        setComboSide(COMBO_SIDES[0].label);
      }

      if (parsedRemoved.length > 0 || (initialCartItem.upgrades && initialCartItem.upgrades.length > 0)) {
        setComboMode("customize");
      } else {
        setComboMode("original");
      }
    } else {
      setRemovedMods([]);
      setUpgrades([]);
      setComboSide(COMBO_SIDES[0].label);
      setComboMode("original");
    }
    if (feedbackTimer.current) clearTimeout(feedbackTimer.current);
  }, [product?.id, initialCartItem]);

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
    if (product.type !== "combo") return 0;
    const sideObj = COMBO_SIDES.find((s) => s.label === comboSide);
    return sideObj ? sideObj.extraPrice : 0;
  }, [product.type, comboSide]);

  const currentTotal = useMemo(() => {
    const upgradesTotal = upgrades.reduce((sum, u) => sum + u.price * u.qty, 0);
    return product.price + comboExtraPrice + upgradesTotal;
  }, [product.price, comboExtraPrice, upgrades]);

  const handleAddToCart = () => {
    if (justAdded) {
      onClose();
      return;
    }
    if (isAtMax && !isEditing) return;

    const modsList: string[] = [];
    if (comboMode === "customize" || product.type !== "combo") {
      modsList.push(...removedMods.map((m) => `Sin ${m}`));
    }
    if (product.type === "combo") {
      modsList.push(`Guarnición: ${comboSide}`);
    }
    const activeUpgrades = comboMode === "customize" || product.type !== "combo" ? upgrades.filter((u) => u.qty > 0) : [];

    if (isEditing && initialCartItem) {
      updateItem(initialCartItem.cartItemId, product, modsList, activeUpgrades);
    } else {
      addItem(product, modsList, activeUpgrades);
    }

    setJustAdded(true);
    if (feedbackTimer.current) clearTimeout(feedbackTimer.current);
    feedbackTimer.current = setTimeout(() => {
      setJustAdded(false);
      onClose();
    }, 1200);
  };

  const AVAILABLE_MODS = ["Cebolla", "Pepinillos", "Tomate", "Lechuga", "Mostaza", "Ketchup"];
  const AVAILABLE_UPGRADES = [
    { id: "u1", name: "Extra Queso Americano", price: 15 },
    { id: "u2", name: "Extra Tocino Crujiente", price: 25 },
    { id: "u3", name: "Carne Smash Adicional", price: 45 },
    { id: "u4", name: "Salsa de la casa extra", price: 10 },
  ];

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

          {/* ── Copi de Descripción oficial ── */}
          {product.description ? (
            <p id={descriptionId} className="catalog-drawer__description">
              {product.description}
            </p>
          ) : (
            <p id={descriptionId} className="catalog-drawer__description">
              {product.type === "burger"
                ? "Receta artesanal con 100% carne smash de res seleccionada, sazón especial y pan brioche horneado."
                : product.type === "combo"
                ? "Combo completo con tu hamburguesa especial fija, guarnición y bebida bien fría."
                : "Preparado al momento con ingredientes frescos de primera calidad."}
            </p>
          )}

          {/* ── Lista de Ingredientes Incluidos SOLO para Burgers Solas ── */}
          {product.type === "burger" && (
            <div className="catalog-drawer__ingredients-card">
              <span className="catalog-drawer__section-subtitle">
                🥗 INGREDIENTES INCLUIDOS
              </span>
              <ul className="catalog-drawer__ingredients-list">
                <li>• Pan Brioche artesanal horneado</li>
                <li>• 100% Carne Smash de res seleccionada</li>
                <li>• Doble Queso Americano / Manchego</li>
                <li>• Tocino crujiente dorado</li>
                <li>• Pepinillos artesanales & Jitomate fresco</li>
                <li>• Aderezo especial de la casa</li>
              </ul>
            </div>
          )}

          <div className="catalog-drawer__details">
            <div className="catalog-drawer__price-row">
              <strong className="catalog-drawer__price">{formatCurrency(currentTotal)}</strong>
              {currentItem && currentItem.qty > 0 && !isEditing && (
                <span className="catalog-drawer__qty-badge">{currentItem.qty} en carrito</span>
              )}
            </div>
            <span className={product.isAvailable ? "catalog-drawer__availability" : "catalog-drawer__availability catalog-drawer__availability--unavailable"}>
              {product.isAvailable ? "✓ Disponible" : "✕ No disponible"}
            </span>
          </div>

          {/* ── MODAL ESPECÍFICO PARA COMBOS ── */}
          {product.type === "combo" && (
            <div className="catalog-drawer__combo-box">
              <div className="catalog-drawer__combo-notice">
                <span>🍔 La hamburguesa del combo es única y fija (Receta de la Casa BBQ / OG).</span>
              </div>

              {/* Selector de Guarnición */}
              <div className="catalog-drawer__combo-sides">
                <p className="catalog-drawer__mods-title">🍟 Elige tu guarnición del combo:</p>
                <div className="catalog-drawer__radio-group">
                  {COMBO_SIDES.map((side) => (
                    <label key={side.label} className="catalog-drawer__radio-label">
                      <input
                        type="radio"
                        name="combo-side-opt"
                        checked={comboSide === side.label}
                        onChange={() => setComboSide(side.label)}
                      />
                      <span>{side.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* 2 Botones de Modo para Combos */}
              <div className="catalog-drawer__combo-toggle-row">
                <button
                  type="button"
                  className={`catalog-drawer__combo-mode-btn ${comboMode === "original" ? "catalog-drawer__combo-mode-btn--active" : ""}`}
                  onClick={() => setComboMode("original")}
                >
                  🍔 Receta Original
                </button>
                <button
                  type="button"
                  className={`catalog-drawer__combo-mode-btn ${comboMode === "customize" ? "catalog-drawer__combo-mode-btn--active" : ""}`}
                  onClick={() => setComboMode("customize")}
                >
                  🛠️ Personalizar
                </button>
              </div>
            </div>
          )}

          {/* ── PERSONALIZACIÓN Y EXTRAS (Burgers solas o Combos en modo Customize) ── */}
          {(product.type === "burger" || (product.type === "combo" && comboMode === "customize")) && (
            <>
              {/* Badges Verde / Rojo con tachado (Sin texto 'sin costo') */}
              <div className="catalog-drawer__mods">
                <p className="catalog-drawer__mods-title">Personaliza ingredientes</p>
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

              {/* Upgrades & Extras con costo explícito (+ $15, + $25) */}
              <div className="catalog-drawer__mods" style={{ marginTop: "16px" }}>
                <p className="catalog-drawer__mods-title">Agrega extras adicionales</p>
                <div className="catalog-drawer__upgrades-grid">
                  {AVAILABLE_UPGRADES.map((upgrade) => {
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
            </>
          )}

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
