import type { MenuCategory, MenuItem, SiteConfig, CatalogBanner } from "@config/index";
import { useCallback, useEffect, useState } from "react";
import { CatalogProductDrawer } from "./CatalogProductDrawer";
import { CatalogCartDrawer } from "./CatalogCartDrawer";
import { CatalogCheckoutDrawer } from "./CatalogCheckoutDrawer";
import { CatalogCartBar } from "./CatalogCartBar";
import { CatalogCartProvider } from "./CatalogCartContext";
import { AnimatePresence } from "framer-motion";
import { DynamicRenderer } from "./DynamicRenderer";
import { CatalogToast, type ToastMessage } from "./CatalogToast";
import type { DesignSpecification } from "../types/design";
import { DEFAULT_STUDIO_DESIGN_SPEC } from "../lib/default-design-spec";
import {
  type CatalogProduct,
  mapMenuItemsToCatalogProducts,
} from "../lib/catalog-mode";

type CatalogModeAppProps = {
  items: MenuItem[];
  categories: MenuCategory[];
  siteConfig: SiteConfig;
  catalogBanners?: CatalogBanner[];
  source?: string;
  designSpec?: DesignSpecification | null;
};

/** ───────────────────────────────────────────────────
 * Hook: dark mode con persistencia en localStorage
 * y fallback a prefers-color-scheme del sistema.
 * Aplica .theme-dark en <html> para activar tokens.
 * ─────────────────────────────────────────────────── */
function useDarkMode() {
  const [isDark, setIsDark] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem("pov2-theme");
      if (stored !== null) return stored === "dark";
    } catch { /* noop */ }
    return typeof window !== "undefined"
      ? window.matchMedia("(prefers-color-scheme: dark)").matches
      : false;
  });

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add("theme-dark");
    } else {
      root.classList.remove("theme-dark");
    }
    try { localStorage.setItem("pov2-theme", isDark ? "dark" : "light"); } catch { /* noop */ }
  }, [isDark]);

  const toggle = useCallback(() => setIsDark((d) => !d), []);
  return { isDark, toggle };
}

function CatalogModeAppInner({ items, categories, siteConfig, catalogBanners = [], source, designSpec }: CatalogModeAppProps) {
  const [selectedProduct, setSelectedProduct] = useState<CatalogProduct | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [activeToast, setActiveToast] = useState<ToastMessage | null>(null);
  const { isDark, toggle: toggleDark } = useDarkMode();

  const closeProductDrawer = useCallback(() => setSelectedProduct(null), []);
  const openCart = useCallback(() => setIsCartOpen(true), []);
  const closeCart = useCallback(() => setIsCartOpen(false), []);
  const openCheckout = useCallback(() => {
    setIsCartOpen(false);
    setIsCheckoutOpen(true);
  }, []);
  const closeCheckout = useCallback(() => setIsCheckoutOpen(false), []);

  const triggerToast = useCallback((emoji: string, message: string) => {
    const newToast: ToastMessage = {
      id: `toast-${Date.now()}`,
      emoji,
      message,
    };
    setActiveToast(newToast);
    setTimeout(() => {
      setActiveToast((current) => (current?.id === newToast.id ? null : current));
    }, 2800);
  }, []);

  return (
    <>
      {/* ── Header fijo de la app ─────────────────────────────────────────── */}
      <header className="site-header" role="banner">
        <div className="site-header__container">
          <div className="site-header__brand">
            <a href="/" className="site-header__logo-link" aria-label="Burgers.exe — Inicio">
              <svg
                className="site-header__logo-icon"
                width="32"
                height="32"
                viewBox="0 0 32 32"
                fill="none"
                aria-hidden="true"
              >
                <rect width="32" height="32" rx="10" fill="var(--color-accent-soft)" stroke="var(--color-accent-line)" />
                <path d="M 8 11 C 8 7, 24 7, 24 11 Z" fill="var(--color-accent)" />
                <rect x="7" y="14" width="18" height="3" rx="1.5" fill="var(--color-warning)" />
                <path d="M 8 20 H 24 C 24 23, 20 25, 16 25 C 12 25, 8 23, 8 20 Z" fill="var(--color-accent)" />
              </svg>
              <span className="site-header__logo-text">
                Burgers<span className="site-header__logo-ext">.exe</span>
              </span>
            </a>
          </div>

          <div className="site-header__status">
            <span
              className="store-status-badge store-status-badge--open"
              role="status"
              aria-label="Estado del servicio: Abierto"
            >
              <span className="store-status-badge__dot" aria-hidden="true" />
              <span>Abierto</span>
            </span>
          </div>

          <div className="site-header__actions">
            <a href="/tickets" className="site-header__tickets-btn" aria-label="Consultar tickets de rifas">
              <span aria-hidden="true">🎟️</span>
              <span className="site-header__tickets-label">Tickets</span>
            </a>
            <button
              id="dark-mode-toggle"
              type="button"
              className="site-header__theme-toggle"
              onClick={toggleDark}
              aria-label={isDark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
              aria-pressed={isDark}
            >
              <span aria-hidden="true">{isDark ? "☀️" : "🌙"}</span>
            </button>
          </div>
        </div>
      </header>

      <main
        className="catalog-shell"
        style={{
          maxWidth: "430px",
          margin: "0 auto",
          paddingLeft: "12px",
          paddingRight: "12px",
          paddingBottom: "96px",
        }}
        aria-labelledby="catalogTitle"
      >
        {/* ── Headless UI Dynamic Renderer ───────── */}
        <DynamicRenderer
          spec={designSpec || DEFAULT_STUDIO_DESIGN_SPEC}
          chekeoItems={items}
          chekeoCategories={categories}
          onProductSelect={(item) => {
            const mapped = mapMenuItemsToCatalogProducts([item], categories)[0];
            if (mapped) setSelectedProduct(mapped);
          }}
          onAction={(action) => {
            if (action === "OPEN_CHECKOUT") openCheckout();
            if (action === "OPEN_CART") openCart();
            if (action.startsWith("TOAST:")) {
              const parts = action.replace("TOAST:", "").split("|");
              triggerToast(parts[0] || "✅", parts[1] || "Acción realizada");
            }
          }}
        />
      </main>

      <CatalogToast toast={activeToast} hasCartBar={true} />

      <AnimatePresence>
        <CatalogCartBar key="cart-bar" onOpenCart={openCart} />
      </AnimatePresence>
      <AnimatePresence>
        {selectedProduct && <CatalogProductDrawer key="product-drawer" product={selectedProduct} onClose={closeProductDrawer} />}
      </AnimatePresence>
      <AnimatePresence>
        {isCartOpen && <CatalogCartDrawer key="cart-drawer" isOpen={isCartOpen} onClose={closeCart} onCheckout={openCheckout} />}
      </AnimatePresence>
      <AnimatePresence>
        {isCheckoutOpen && <CatalogCheckoutDrawer key="checkout-drawer" isOpen={isCheckoutOpen} onClose={closeCheckout} />}
      </AnimatePresence>
    </>
  );
}

export function CatalogModeApp(props: CatalogModeAppProps) {
  return (
    <CatalogCartProvider>
      <CatalogModeAppInner {...props} />
    </CatalogCartProvider>
  );
}
