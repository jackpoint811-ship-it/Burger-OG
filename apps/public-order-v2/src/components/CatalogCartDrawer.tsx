import { useEffect, useId, useRef, type MouseEvent } from "react";
import { formatCurrency } from "../lib/order";
import { resolveCatalogAssetUrl } from "../lib/catalog-mode";
import { CATALOG_CART_MAX_QTY } from "../lib/catalog-cart";
import { useCatalogCart } from "./CatalogCartContext";
import { motion, useReducedMotion } from "framer-motion";

type CatalogCartDrawerProps = {
  isOpen: boolean;
  onClose: () => void;
  onCheckout: () => void;
};

const focusableSelector = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

export function CatalogCartDrawer({ isOpen, onClose, onCheckout }: CatalogCartDrawerProps) {
  const { items, total, setQty, removeItem } = useCatalogCart();
  const closeRef = useRef<HTMLButtonElement | null>(null);
  const dialogRef = useRef<HTMLElement | null>(null);
  const titleId = useId();
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    if (!isOpen) return;

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

      const focusableElements = Array.from(
        dialogRef.current?.querySelectorAll<HTMLElement>(focusableSelector) ?? []
      );
      if (!focusableElements.length) { event.preventDefault(); return; }

      const first = focusableElements[0];
      const last = focusableElements[focusableElements.length - 1];
      const active = document.activeElement;

      if (event.shiftKey && (active === first || !dialogRef.current?.contains(active))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (active === last || !dialogRef.current?.contains(active))) {
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
  }, [isOpen, onClose]);

  const handleBackdropClick = (event: MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) onClose();
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
        className="catalog-drawer catalog-cart-drawer"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        initial={shouldReduceMotion ? { opacity: 0 } : { y: "100%" }}
        animate={shouldReduceMotion ? { opacity: 1 } : { y: 0 }}
        exit={shouldReduceMotion ? { opacity: 0 } : { y: "100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
      >
        {/* ── Handle bar ── */}
        <div className="catalog-drawer__handle" aria-hidden="true" />

        <header className="catalog-drawer__header catalog-cart-drawer__header">
          <div className="catalog-cart-drawer__title-row">
            <h2 id={titleId} className="catalog-cart-drawer__title">
              <span className="catalog-cart-drawer__title-icon" aria-hidden="true">🛒</span>
              Tu carrito
            </h2>
            {items.length > 0 && (
              <span className="catalog-cart-drawer__item-count">
                {items.reduce((acc, i) => acc + i.qty, 0)} {items.reduce((acc, i) => acc + i.qty, 0) === 1 ? "producto" : "productos"}
              </span>
            )}
          </div>
          <button
            ref={closeRef}
            type="button"
            className="catalog-drawer__close"
            onClick={onClose}
            aria-label="Cerrar carrito"
          >
            <span aria-hidden="true">×</span>
          </button>
        </header>

        {items.length === 0 ? (
          <div className="catalog-cart-drawer__empty">
            <svg viewBox="0 0 120 120" fill="none" className="catalog-cart-drawer__empty-svg" aria-hidden="true">
              <circle cx="60" cy="60" r="58" fill="currentColor" fillOpacity="0.04" stroke="var(--color-accent)" strokeWidth="1" strokeOpacity="0.2" />
              <path d="M30 40H38L46 82H88" stroke="var(--color-accent)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" strokeOpacity="0.5" />
              <circle cx="52" cy="92" r="6" fill="var(--color-accent)" fillOpacity="0.3" stroke="var(--color-accent)" strokeWidth="2" />
              <circle cx="80" cy="92" r="6" fill="var(--color-accent)" fillOpacity="0.3" stroke="var(--color-accent)" strokeWidth="2" />
              <path d="M46 50H90L86 74H50L46 50Z" fill="var(--color-accent)" fillOpacity="0.08" stroke="var(--color-accent)" strokeWidth="2" strokeLinejoin="round" />
              <path d="M62 58V68M68 58V68M74 58V68" stroke="var(--color-accent)" strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.4" />
            </svg>
            <p className="catalog-cart-drawer__empty-text">Tu carrito está vacío</p>
            <p className="catalog-cart-drawer__empty-hint">Agrega productos del menú para empezar</p>
            <button type="button" className="catalog-cart-drawer__empty-cta" onClick={onClose}>
              ← Explorar menú
            </button>
          </div>
        ) : (
          <>
            <ul className="catalog-cart-drawer__list" aria-label="Productos en el carrito">
              {items.map((item) => {
                const src = resolveCatalogAssetUrl(item.imageUrl, item.imageKey);
                return (
                  <li key={item.cartItemId} className="catalog-cart-item">
                    <div className="catalog-cart-item__image" aria-hidden="true">
                      {src
                        ? <img src={src} alt="" decoding="async" loading="lazy" />
                        : <span className="catalog-cart-item__image-placeholder" />
                      }
                    </div>
                    <div className="catalog-cart-item__info">
                      <p className="catalog-cart-item__name">{item.name}</p>
                      <div className="catalog-cart-item__price-row">
                        <span className="catalog-cart-item__price">
                          {formatCurrency(item.price + (item.upgrades?.reduce((sum, u) => sum + u.price * u.qty, 0) || 0))}
                        </span>
                        {item.qty > 1 && (
                          <span className="catalog-cart-item__subtotal">
                            × {item.qty} = {formatCurrency((item.price + (item.upgrades?.reduce((sum, u) => sum + u.price * u.qty, 0) || 0)) * item.qty)}
                          </span>
                        )}
                      </div>
                      {item.mods && item.mods.length > 0 && (
                        <div style={{ fontSize: "11px", color: "var(--color-danger)", marginTop: "4px" }}>
                          {item.mods.join(", ")}
                        </div>
                      )}
                      {item.upgrades && item.upgrades.length > 0 && (
                        <div style={{ fontSize: "11px", color: "var(--color-accent)", marginTop: "2px", display: "flex", flexDirection: "column", gap: "2px" }}>
                          {item.upgrades.map(u => (
                            <span key={u.id}>+ {u.qty}x {u.name} ({formatCurrency(u.price)})</span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="catalog-cart-item__controls">
                      <button
                        type="button"
                        className="catalog-cart-item__qty-btn"
                        aria-label={`Reducir cantidad de ${item.name}`}
                        onClick={() => setQty(item.cartItemId, item.qty - 1)}
                      >
                        −
                      </button>
                      <span className="catalog-cart-item__qty" aria-label={`Cantidad: ${item.qty}`}>
                        {item.qty}
                      </span>
                      <button
                        type="button"
                        className="catalog-cart-item__qty-btn"
                        aria-label={`Aumentar cantidad de ${item.name}`}
                        disabled={item.qty >= CATALOG_CART_MAX_QTY}
                        onClick={() => setQty(item.cartItemId, item.qty + 1)}
                      >
                        +
                      </button>
                    </div>
                    <button
                      type="button"
                      className="catalog-cart-item__remove"
                      aria-label={`Eliminar ${item.name} del carrito`}
                      onClick={() => removeItem(item.cartItemId)}
                    >
                      <span aria-hidden="true">×</span>
                    </button>
                  </li>
                );
              })}
            </ul>

            <div className="catalog-cart-drawer__footer">
              <div className="catalog-cart-drawer__total">
                <div className="catalog-cart-drawer__total-label">
                  <span>Total</span>
                  <span className="catalog-cart-drawer__iva-note">IVA incluido</span>
                </div>
                <strong>{formatCurrency(total)}</strong>
              </div>
              <button
                type="button"
                className="catalog-cart-drawer__checkout"
                onClick={onCheckout}
              >
                <span className="catalog-cart-drawer__checkout-icon" aria-hidden="true">→</span>
                <span>Ir a Checkout</span>
              </button>
            </div>
          </>
        )}
      </motion.section>
    </motion.div>
  );
}
