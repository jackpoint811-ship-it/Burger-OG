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
  const { items, total, setQty, removeItem, clear } = useCatalogCart();
  const closeRef = useRef<HTMLButtonElement | null>(null);
  const dialogRef = useRef<HTMLElement | null>(null);
  const titleId = useId();

  const orderEnvironment = useMemo(getPublicOrderEnvironment, []);
  const isPreviewMode = orderEnvironment === "preview";

  const [step, setStep] = useState<1 | 2>(1);

  const [location, setLocation] = useState<"Torre GGA" | "Torre Valcob">(() => {
    try {
      return (localStorage.getItem("pov2-customer-location") as any) || "Torre GGA";
    } catch {
      return "Torre GGA";
    }
  });

  const [name, setName] = useState(() => {
    try {
      return localStorage.getItem("pov2-customer-name") || "";
    } catch {
      return "";
    }
  });

  const [phone, setPhone] = useState(() => {
    try {
      return localStorage.getItem("pov2-customer-phone") || "";
    } catch {
      return "";
    }
  });

  const [notes, setNotes] = useState("");

  const [paymentMethod, setPaymentMethod] = useState<OrderV2PaymentMethod>("cash");
  const [wantsWhatsapp, setWantsWhatsapp] = useState(true);
  const [checkoutState, setCheckoutState] = useState<CheckoutState>({ status: "idle" });

  const shouldReduceMotion = useReducedMotion();

  // Persist customer details in localStorage
  useEffect(() => {
    try {
      if (name) localStorage.setItem("pov2-customer-name", name);
      if (phone) localStorage.setItem("pov2-customer-phone", phone);
      if (location) localStorage.setItem("pov2-customer-location", location);
    } catch {
      /* noop */
    }
  }, [name, phone, location]);

  const idempotencyKeyRef = useRef(generateIdempotencyKey());
  const prevSnapshotRef = useRef("");

  const currentSnapshot = JSON.stringify({
    items: items.map((i) => `${i.productId}:${i.qty}`),
    name,
    phone,
    location,
    paymentMethod,
    notes,
  });
  if (currentSnapshot !== prevSnapshotRef.current) {
    prevSnapshotRef.current = currentSnapshot;
    idempotencyKeyRef.current = generateIdempotencyKey();
  }

  useEffect(() => {
    if (!isOpen) {
      setCheckoutState({ status: "idle" });
      setStep(1);
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

      const focusableElements = Array.from(dialogRef.current?.querySelectorAll<HTMLElement>(focusableSelector) ?? []);
      if (!focusableElements.length) {
        event.preventDefault();
        return;
      }

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

  const handleNextStep = (e: FormEvent) => {
    e.preventDefault();
    if (items.length === 0) return;
    setStep(2);
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
      setCheckoutState({ status: "error", error: "Por favor, ingresa tu nombre completo." });
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

      const fullCustomerName = `${name.trim()} (${location})${notes.trim() ? ` [Nota: ${notes.trim()}]` : ""}`;

      const response = await createOrderV2(
        {
          customer: { name: fullCustomerName, phone: normalizedPhone },
          orderMode: "pickup",
          paymentMethod,
          items: payloadItems,
          ...(isPreviewMode ? { environment: orderEnvironment } : {}),
        },
        idempotencyKeyRef.current
      );

      const order = response.data?.order;
      if (!order) {
        throw new Error(response.error?.message || "El backend no devolvió folio de confirmación.");
      }

      setCheckoutState({ status: "success", folio: order.folio });

      try {
        localStorage.setItem("pov2-last-order", JSON.stringify(items));
      } catch {
        /* ignore */
      }

      idempotencyKeyRef.current = generateIdempotencyKey();
      clear();
    } catch (error) {
      setCheckoutState({
        status: "error",
        error: error instanceof Error ? error.message : "No se pudo enviar el pedido. Intenta de nuevo.",
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
        <div className="catalog-drawer__handle" aria-hidden="true" />

        <header className="catalog-drawer__header catalog-cart-drawer__header">
          <div className="catalog-cart-drawer__title-row">
            <h2 id={titleId} className="catalog-cart-drawer__title">
              <span className="catalog-cart-drawer__title-icon" aria-hidden="true">
                {checkoutState.status === "success" ? "✅" : "📝"}
              </span>
              {checkoutState.status === "success" ? "¡Pedido exitoso!" : "Checkout"}
            </h2>
          </div>
          <button ref={closeRef} type="button" className="catalog-drawer__close" onClick={onClose} aria-label="Cerrar checkout">
            <span aria-hidden="true">×</span>
          </button>
        </header>

        {/* ── Indicador de Pasos del Wizard ── */}
        {checkoutState.status !== "success" && (
          <div className="catalog-checkout-wizard-bar">
            <button
              type="button"
              className={`catalog-checkout-wizard-step ${step === 1 ? "catalog-checkout-wizard-step--active" : "catalog-checkout-wizard-step--done"}`}
              onClick={() => setStep(1)}
            >
              <span>{step === 2 ? "✓" : "1"}</span>
              <strong>1. Resumen y Pago</strong>
            </button>
            <div className="catalog-checkout-wizard-divider" />
            <button
              type="button"
              className={`catalog-checkout-wizard-step ${step === 2 ? "catalog-checkout-wizard-step--active" : ""}`}
              onClick={() => {
                if (items.length > 0) setStep(2);
              }}
            >
              <span>2</span>
              <strong>2. Tus Datos</strong>
            </button>
          </div>
        )}

        {/* ── PANTALLA DE ÉXITO DE CONFIRMACIÓN ── */}
        {checkoutState.status === "success" ? (
          <div className="catalog-checkout-success">
            <svg viewBox="0 0 120 120" fill="none" className="catalog-checkout-success__icon" aria-hidden="true">
              <circle cx="60" cy="60" r="56" fill="var(--color-accent)" fillOpacity="0.08" stroke="var(--color-accent)" strokeWidth="2" />
              <path d="M36 62L52 78L84 46" stroke="var(--color-accent)" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <p className="catalog-checkout-success__headline">¡Pedido exitoso!</p>
            <p className="catalog-checkout-success__subcopy">Tu orden ha sido registrada correctamente y ha entrado a preparación.</p>
            <div className="catalog-checkout-success__folio-card">
              <span>Folio de seguimiento:</span>
              <strong>#{checkoutState.folio}</strong>
            </div>

            <button type="button" className="catalog-checkout__submit" onClick={onClose} style={{ marginTop: "24px" }}>
              Cerrar y volver al menú
            </button>
          </div>
        ) : (
          <div className="catalog-checkout-form-container">
            {/* ── PASO 1: Resumen, Ubicación y Pago ── */}
            {step === 1 && (
              <form className="catalog-checkout-form" onSubmit={handleNextStep}>
                <div className="catalog-checkout-form__fields">
                  {/* Resumen interactivo de ítems */}
                  <div className="catalog-checkout-summary-box">
                    <div className="catalog-checkout-summary-header">
                      <span>🛒 Tu pedido ({items.reduce((acc, i) => acc + i.qty, 0)} productos)</span>
                    </div>
                    <ul className="catalog-checkout-summary-list">
                      {items.map((cartItem) => (
                        <li key={cartItem.cartItemId} className="catalog-checkout-summary-item">
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <span className="catalog-checkout-item-name">{cartItem.name}</span>
                            <span className="catalog-checkout-item-price">
                              {formatCurrency((cartItem.price + (cartItem.upgrades?.reduce((sum, u) => sum + u.price * u.qty, 0) || 0)) * cartItem.qty)}
                            </span>
                            {cartItem.mods && cartItem.mods.length > 0 && (
                              <span className="catalog-checkout-item-mods">{cartItem.mods.join(", ")}</span>
                            )}
                            {cartItem.upgrades && cartItem.upgrades.length > 0 && (
                              <div className="catalog-checkout-item-upgrades">
                                {cartItem.upgrades.map((u) => (
                                  <span key={u.id}>
                                    + {u.qty}x {u.name} ({formatCurrency(u.price)})
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            <button type="button" className="catalog-checkout-qty-btn" onClick={() => setQty(cartItem.cartItemId, cartItem.qty - 1)}>
                              −
                            </button>
                            <span style={{ fontWeight: 800, minWidth: "16px", textAlign: "center" }}>{cartItem.qty}</span>
                            <button type="button" className="catalog-checkout-qty-btn" onClick={() => setQty(cartItem.cartItemId, cartItem.qty + 1)}>
                              +
                            </button>
                            <button type="button" className="catalog-checkout-remove-btn" onClick={() => removeItem(cartItem.cartItemId)}>
                              ×
                            </button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* 📍 SELECCIONA LA UBICACIÓN (2 botones: Torre GGA / Torre Valcob) */}
                  <div className="catalog-checkout-field">
                    <span id="location-label">Selecciona la ubicación *</span>
                    <div className="catalog-checkout-location-grid">
                      <button
                        type="button"
                        className={`catalog-checkout-location-btn ${location === "Torre GGA" ? "catalog-checkout-location-btn--active" : ""}`}
                        onClick={() => setLocation("Torre GGA")}
                      >
                        🏢 Torre GGA
                      </button>
                      <button
                        type="button"
                        className={`catalog-checkout-location-btn ${location === "Torre Valcob" ? "catalog-checkout-location-btn--active" : ""}`}
                        onClick={() => setLocation("Torre Valcob")}
                      >
                        🏢 Torre Valcob
                      </button>
                    </div>
                  </div>

                  {/* 💳 FORMA DE PAGO (3 opciones exactas: Efectivo, Transferencia, Confirmar por WA) */}
                  <div className="catalog-checkout-field">
                    <span id="payment-label">Forma de pago *</span>
                    <div className="catalog-checkout-chips" role="radiogroup" aria-labelledby="payment-label">
                      <button
                        type="button"
                        role="radio"
                        aria-checked={paymentMethod === "cash"}
                        className={paymentMethod === "cash" ? "catalog-checkout-chip active" : "catalog-checkout-chip"}
                        onClick={() => setPaymentMethod("cash")}
                      >
                        <span aria-hidden="true">💵</span> Efectivo
                      </button>
                      <button
                        type="button"
                        role="radio"
                        aria-checked={paymentMethod === "transfer"}
                        className={paymentMethod === "transfer" ? "catalog-checkout-chip active" : "catalog-checkout-chip"}
                        onClick={() => setPaymentMethod("transfer")}
                      >
                        <span aria-hidden="true">📱</span> Transferencia
                      </button>
                      <button
                        type="button"
                        role="radio"
                        aria-checked={paymentMethod === "unknown"}
                        className={paymentMethod === "unknown" ? "catalog-checkout-chip active" : "catalog-checkout-chip"}
                        onClick={() => setPaymentMethod("unknown")}
                      >
                        <span aria-hidden="true">💬</span> Confirmar por WA
                      </button>
                    </div>
                  </div>
                </div>

                <div className="catalog-cart-drawer__footer">
                  <div className="catalog-cart-drawer__total">
                    <div className="catalog-cart-drawer__total-label">
                      <span>Total a pagar</span>
                      <span className="catalog-cart-drawer__iva-note">IVA incluido</span>
                    </div>
                    <strong>{formatCurrency(total)}</strong>
                  </div>
                  <button type="submit" className="catalog-checkout__submit" disabled={items.length === 0}>
                    <span>Siguiente: Tus Datos →</span>
                  </button>
                </div>
              </form>
            )}

            {/* ── PASO 2: Datos del Cliente, Notas y Confirmación ── */}
            {step === 2 && (
              <form className="catalog-checkout-form" onSubmit={handleSubmit}>
                <div className="catalog-checkout-form__fields">
                  <div className="catalog-checkout-step-recap">
                    <span>
                      Ubicación: <strong>{location}</strong>
                    </span>
                    <span>
                      Pago: <strong>{paymentMethod === "cash" ? "Efectivo" : paymentMethod === "transfer" ? "Transferencia" : "Confirmar por WA"}</strong>
                    </span>
                    <button type="button" className="catalog-checkout-recap-edit" onClick={() => setStep(1)}>
                      Cambiar
                    </button>
                  </div>

                  <label className="catalog-checkout-field">
                    <span>Nombre completo *</span>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Ej: Juan Pérez"
                      required
                      disabled={checkoutState.status === "submitting"}
                    />
                  </label>

                  <label className="catalog-checkout-field">
                    <span>Teléfono (WhatsApp) * (10 dígitos)</span>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="Ej: 55 1234 5678"
                      required
                      disabled={checkoutState.status === "submitting"}
                    />
                  </label>

                  {/* 📝 CAMPO DE NOTAS ESPECIALES (Opcional) */}
                  <label className="catalog-checkout-field">
                    <span>Instrucciones de entrega / Notas (opcional)</span>
                    <input
                      type="text"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Ej: Entregar en recepción Piso 4"
                      disabled={checkoutState.status === "submitting"}
                    />
                  </label>

                  <label className="catalog-checkout-wa-optin">
                    <input
                      type="checkbox"
                      checked={wantsWhatsapp}
                      onChange={(e) => setWantsWhatsapp(e.target.checked)}
                      disabled={checkoutState.status === "submitting"}
                    />
                    <span>✉️ Recibir confirmación de estatus por WhatsApp</span>
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
                  <button type="submit" className="catalog-checkout__submit" disabled={checkoutState.status === "submitting" || items.length === 0}>
                    <span className="catalog-checkout__submit-icon" aria-hidden="true">
                      {checkoutState.status === "submitting" ? "⏳" : "🚀"}
                    </span>
                    <span>{checkoutState.status === "submitting" ? "Pedido exitoso..." : `Confirmar y Enviar (${formatCurrency(total)})`}</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </motion.section>
    </motion.div>
  );
}
