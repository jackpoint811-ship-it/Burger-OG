import { useEffect, useId, useRef, useState, type MouseEvent } from "react";
import { type CatalogProduct, type CatalogProductType, PRODUCT_TYPE_LABELS, resolveCatalogAssetUrl } from "../lib/catalog-mode";
import { CATALOG_CART_MAX_QTY } from "../lib/catalog-cart";
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
  onClose: () => void;
};

const ADDED_FEEDBACK_MS = 1400;

const focusableSelector = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

export function CatalogProductDrawer({ product, onClose }: CatalogProductDrawerProps) {
  const { items, addItem } = useCatalogCart();
  const [justAdded, setJustAdded] = useState(false);
  const [selectedMods, setSelectedMods] = useState<string[]>([]);
  const closeRef = useRef<HTMLButtonElement | null>(null);
  const dialogRef = useRef<HTMLElement | null>(null);
  const feedbackTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const titleId = useId();
  const descriptionId = useId();
  const shouldReduceMotion = useReducedMotion();
  const src = product ? resolveCatalogAssetUrl(product.imageUrl, product.imageKey) : undefined;

  const currentItem = items.find((i) => i.productId === product?.id);
  const isAtMax = currentItem ? currentItem.qty >= CATALOG_CART_MAX_QTY : false;

  useEffect(() => {
    setJustAdded(false);
    setSelectedMods([]);
    if (feedbackTimer.current) clearTimeout(feedbackTimer.current);
  }, [product?.id]);

  useEffect(() => {
    return () => { if (feedbackTimer.current) clearTimeout(feedbackTimer.current); };
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

  const handleBackdropClick = (event: MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) onClose();
  };

  const handleAddToCart = () => {
    if (justAdded) {
      onClose();
      return;
    }
    if (isAtMax) return;
    addItem(product, selectedMods);
    setJustAdded(true);
    if (feedbackTimer.current) clearTimeout(feedbackTimer.current);
    feedbackTimer.current = setTimeout(() => setJustAdded(false), 2000);
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
        {/* ── Handle bar ────────────────────────────────── */}
        <div className="catalog-drawer__handle" aria-hidden="true" />

        {/* ── Media 16:9 con overlay degradado ─────────── */}
        <div className="catalog-drawer__media" aria-hidden="true">
          {src
            ? <img src={src} alt="" decoding="async" loading="lazy" />
            : <DrawerFallbackSvg type={product.type} />}
          <div className="catalog-drawer__media-overlay" />
          {/* Badges flotantes sobre la imagen */}
          <div className="catalog-drawer__media-badges">
            {product.type === "combo" && (
              <span className="catalog-badge catalog-badge--best-seller">🔥 Más Vendido</span>
            )}
            {product.isFeatured && product.type !== "combo" && (
              <span className="catalog-badge catalog-badge--featured">⭐ Destacado</span>
            )}
            {product.badge && product.type !== "combo" && !product.isFeatured && (
              <span className="catalog-badge catalog-badge--custom">{product.badge}</span>
            )}
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

          {product.description ? <p id={descriptionId} className="catalog-drawer__description">{product.description}</p> : null}

          <div className="catalog-drawer__details">
            <div className="catalog-drawer__price-row">
              <strong className="catalog-drawer__price">{formatCurrency(product.price)}</strong>
              {currentItem && currentItem.qty > 0 && (
                <span className="catalog-drawer__qty-badge">
                  {currentItem.qty} en carrito
                </span>
              )}
            </div>
            <span className={product.isAvailable ? "catalog-drawer__availability" : "catalog-drawer__availability catalog-drawer__availability--unavailable"}>
              {product.isAvailable ? "✓ Disponible" : "✗ No disponible"}
            </span>
          </div>

          {product.type === "burger" ? (
            <div className="catalog-drawer__mods">
              <p className="catalog-drawer__mods-title">Personaliza tu burger</p>
              <div className="catalog-drawer__mods-grid">
                {["Sin cebolla", "Sin pepinillos", "Sin tomate", "Extra queso"].map((mod) => (
                  <label key={mod} className="catalog-drawer__mod-label">
                    <input
                      type="checkbox"
                      checked={selectedMods.includes(mod)}
                      onChange={(e) => {
                        if (e.target.checked) setSelectedMods([...selectedMods, mod]);
                        else setSelectedMods(selectedMods.filter((m) => m !== mod));
                      }}
                    />
                    <span>{mod}</span>
                  </label>
                ))}
              </div>
            </div>
          ) : null}
          {product.type === "topping" ? <p className="catalog-drawer__notice">Los toppings se entregan por separado.</p> : null}

          <div className="catalog-drawer__footer">
            {product.isAvailable ? (
              <button
                type="button"
                className={`catalog-drawer__add-btn${justAdded ? " catalog-drawer__add-btn--added" : ""}${isAtMax && !justAdded ? " catalog-drawer__add-btn--max" : ""}`}
                onClick={handleAddToCart}
                aria-live="polite"
                disabled={isAtMax && !justAdded}
              >
                <span className="catalog-drawer__add-btn-icon" aria-hidden="true">
                  {justAdded ? "✅" : isAtMax ? "—" : "+"}
                </span>
                <span>
                  {justAdded ? "¡Agregado! Volver al menú" : isAtMax ? "Límite alcanzado" : "Agregar al carrito"}
                </span>
              </button>
            ) : (
              <button type="button" className="catalog-drawer__add-btn catalog-drawer__add-btn--unavailable" disabled>
                <span aria-hidden="true">✗</span>
                <span>No disponible</span>
              </button>
            )}
          </div>
        </div>
      </motion.section>
    </motion.div>
  );
}
