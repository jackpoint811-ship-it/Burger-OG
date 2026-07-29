import { useEffect, useId, useMemo, useRef, useState, type MouseEvent, type FormEvent } from "react";
import type { OrderV2PaymentMethod, OrderV2ItemKind } from "@config/index";
import { getPublicOrderEnvironment } from "@config/index";
import { formatCurrency } from "../lib/order";
import { useCatalogCart } from "./CatalogCartContext";
import { createOrderV2 } from "../lib/orders-v2";
import { motion, useReducedMotion } from "framer-motion";
import type { CatalogProductType } from "../lib/catalog-mode";

/** Map catalog product types to backend OrderV2ItemKind values. */
const catalogTypeToItemKind: Record<CatalogProductType, OrderV2ItemKind> = {
  burger: "burger",
  combo: "combo",
  side: "garnish",
  topping: "other",
  drink: "drink",
};

type CatalogCheckoutDrawerProps = {
  isOpen: boolean;
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

const normalizePhoneDigits = (phone: string) => {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("52")) {
    return digits.slice(2);
  }
  return digits;
};

type CheckoutState = {
  status: "idle" | "submitting" | "success" | "error";
  error?: string;
  folio?: string;
};

/** Generate a fresh idempotency key. */
const generateIdempotencyKey = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `catalog-${Date.now()}-${Math.random()}`;

export function CatalogCheckoutDrawer({ isOpen, onClose }: CatalogCheckoutDrawerProps) {
  const { items, total, clear } = useCatalogCart();
  const closeRef = useRef<HTMLButtonElement | null>(null);
  const dialogRef = useRef<HTMLElement | null>(null);
  const titleId = useId();

  const orderEnvironment = useMemo(getPublicOrderEnvironment, []);
  const isPreviewMode = orderEnvironment === "preview";

  const [name, setName] = useState(() => {
    try { return localStorage.getItem("pov2-customer-name") || ""; } catch { return ""; }
  });
  const [phone, setPhone] = useState(() => {
    try { return localStorage.getItem("pov2-customer-phone") || ""; } catch { return ""; }
  });
  const [paymentMethod, setPaymentMethod] = useState<OrderV2PaymentMethod>("unknown");
  const [wantsWhatsapp, setWantsWhatsapp] = useState(true);
  const [checkoutState, setCheckoutState] = useState<CheckoutState>({ status: "idle" });

  const shouldReduceMotion = useReducedMotion();

  // Persist customer details in localStorage
  useEffect(() => {
    try {
      if (name) localStorage.setItem("pov2-customer-name", name);
      if (phone) localStorage.setItem("pov2-customer-phone", phone);
    } catch { /* noop */ }
  }, [name, phone]);

  // Stable idempotency key: regenerated only when cart or customer data changes.
  const idempotencyKeyRef = useRef(generateIdempotencyKey());
  const prevSnapshotRef = useRef("");

  // Regenerate key when cart contents or customer info changes.
  const currentSnapshot = JSON.stringify({ items: items.map(i => `${i.productId}:${i.qty}`), name, phone, paymentMethod });
  if (currentSnapshot !== prevSnapshotRef.current) {
    prevSnapshotRef.current = currentSnapshot;
    idempotencyKeyRef.current = generateIdempotencyKey();
  }

  useEffect(() => {
    if (!isOpen) {
      // Reset submission state when closed without wiping saved customer details
      setCheckoutState({ status: "idle" });
      setPaymentMethod("unknown");
      setWantsWhatsapp(true);
      return;
    }

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

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (items.length === 0) return;

    const normalizedPhone = normalizePhoneDigits(phone);
    if (normalizedPhone.length !== 10) {
      setCheckoutState({ status: "error", error: "El teléfono debe tener exactamente 10 dígitos." });
      return;
    }

    if (!name.trim()) {
      setCheckoutState({ status: "error", error: "Por favor, ingresa tu nombre." });
      return;
    }

    setCheckoutState({ status: "submitting" });

    try {
      const payloadItems = items.map((item) => ({
        sku: item.productId,
        qty: item.qty,
        itemKind: catalogTypeToItemKind[item.type] ?? ("other" as OrderV2ItemKind),
        name: item.name,
      }));

      const response = await createOrderV2({
        customer: { name: name.trim(), phone: normalizedPhone },
        orderMode: "pickup",
        paymentMethod,
        items: payloadItems,
        ...(isPreviewMode ? { environment: orderEnvironment } : {}),
      }, idempotencyKeyRef.current);

      const order = response.data?.order;
      if (!order) {
        throw new Error(response.error?.message || "El backend no devolvió folio de confirmación.");
      }

      setCheckoutState({ status: "success", folio: order.folio });
      // Regenerate key so next order gets a fresh one.
      idempotencyKeyRef.current = generateIdempotencyKey();
      clear();
    } catch (error) {
      setCheckoutState({ 
        status: "error", 
        error: error instanceof Error ? error.message : "No se pudo enviar el pedido. Intenta de nuevo." 
      });
    }
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
        className="catalog-drawer catalog-checkout-drawer"
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
              <span className="catalog-cart-drawer__title-icon" aria-hidden="true">
                {checkoutState.status === "success" ? "✅" : "📝"}
              </span>
              {checkoutState.status === "success" ? "Pedido recibido" : "Checkout"}
            </h2>
          </div>
          <button
            ref={closeRef}
            type="button"
            className="catalog-drawer__close"
            onClick={onClose}
            aria-label="Cerrar checkout"
          >
            <span aria-hidden="true">×</span>
          </button>
        </header>

        {checkoutState.status === "success" ? (
          <div className="catalog-checkout-success">
            <svg viewBox="0 0 120 120" fill="none" className="catalog-checkout-success__icon" aria-hidden="true">
              <circle cx="60" cy="60" r="56" fill="var(--color-accent)" fillOpacity="0.08" stroke="var(--color-accent)" strokeWidth="2" />
              <path d="M36 62L52 78L84 46" stroke="var(--color-accent)" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <p className="catalog-checkout-success__headline">¡Pedido confirmado!</p>
            <p className="catalog-checkout-success__subcopy">Tu orden ha entrado a preparación.</p>
            <div className="catalog-checkout-success__folio-card">
              <span>Folio</span>
              <strong>{checkoutState.folio}</strong>
            </div>
            {wantsWhatsapp && (
              <a
                href="https://chat.whatsapp.com/GycE5zALOypGPvJVaMfbPp"
                target="_blank"
                rel="noopener noreferrer"
                className="catalog-checkout-success__wa-link"
              >
                <span aria-hidden="true">📲</span>
                Únete al grupo de WhatsApp
              </a>
            )}
            <p className="catalog-checkout-success__whatsapp-note">
              Te contactaremos por WhatsApp para cualquier novedad.
            </p>
            <button type="button" className="catalog-checkout__submit" onClick={onClose}>
              Cerrar y explorar menú
            </button>
          </div>
        ) : (
          <form className="catalog-checkout-form" onSubmit={handleSubmit}>
            <div className="catalog-checkout-form__fields">
              <label className="catalog-checkout-field">
                <span>Nombre</span>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Tu nombre"
                  required
                  disabled={checkoutState.status === "submitting"}
                />
              </label>
              
              <label className="catalog-checkout-field">
                <span>Teléfono (WhatsApp)</span>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="10 dígitos"
                  required
                  disabled={checkoutState.status === "submitting"}
                />
              </label>

              <div className="catalog-checkout-field">
                <span id="payment-label">Método de pago</span>
                <div className="catalog-checkout-chips" role="radiogroup" aria-labelledby="payment-label">
                  <button
                    type="button"
                    role="radio"
                    aria-checked={paymentMethod === "cash"}
                    className={paymentMethod === "cash" ? "catalog-checkout-chip active" : "catalog-checkout-chip"}
                    onClick={() => setPaymentMethod("cash")}
                    disabled={checkoutState.status === "submitting"}
                  >
                    <span aria-hidden="true">💵</span> Efectivo
                  </button>
                  <button
                    type="button"
                    role="radio"
                    aria-checked={paymentMethod === "transfer"}
                    className={paymentMethod === "transfer" ? "catalog-checkout-chip active" : "catalog-checkout-chip"}
                    onClick={() => setPaymentMethod("transfer")}
                    disabled={checkoutState.status === "submitting"}
                  >
                    <span aria-hidden="true">🏦</span> Transferencia
                  </button>
                  <button
                    type="button"
                    role="radio"
                    aria-checked={paymentMethod === "unknown"}
                    className={paymentMethod === "unknown" ? "catalog-checkout-chip active" : "catalog-checkout-chip"}
                    onClick={() => setPaymentMethod("unknown")}
                    disabled={checkoutState.status === "submitting"}
                  >
                    <span aria-hidden="true">📲</span> Confirmar por WA
                  </button>
                </div>
              </div>

              <label className="catalog-checkout-wa-optin">
                <input
                  type="checkbox"
                  checked={wantsWhatsapp}
                  onChange={(e) => setWantsWhatsapp(e.target.checked)}
                  disabled={checkoutState.status === "submitting"}
                />
                <span>✉️ Quiero unirme al grupo oficial de WhatsApp</span>
              </label>

              {checkoutState.status === "error" && (
                <div className="catalog-checkout-error" role="alert">
                  {checkoutState.error}
                </div>
              )}
            </div>

            <div className="catalog-cart-drawer__footer">
              <div className="catalog-cart-drawer__total">
                <div className="catalog-cart-drawer__total-label">
                  <span>Total a pagar</span>
                  <span className="catalog-cart-drawer__iva-note">IVA incluido</span>
                </div>
                <strong>{formatCurrency(total)}</strong>
              </div>
              <button 
                type="submit" 
                className="catalog-checkout__submit" 
                disabled={checkoutState.status === "submitting" || items.length === 0}
              >
                <span className="catalog-checkout__submit-icon" aria-hidden="true">
                  {checkoutState.status === "submitting" ? "⏳" : "→"}
                </span>
                <span>{checkoutState.status === "submitting" ? "Procesando..." : "Enviar pedido"}</span>
              </button>
            </div>
          </form>
        )}
      </motion.section>
    </motion.div>
  );
}
