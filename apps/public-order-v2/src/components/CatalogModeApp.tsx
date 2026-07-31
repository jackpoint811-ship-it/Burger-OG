import type { MenuCategory, MenuItem, SiteConfig, CatalogBanner } from "@config/index";
import { useCallback, useEffect, useMemo, useState } from "react";
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
import { TowerScheduleModal, getTowerStatus } from "./TowerScheduleModal";
import {
  type CatalogProduct,
  mapMenuItemsToCatalogProducts,
  getCategoryEmoji,
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
 * Hook: tema nativo con fallback a prefers-color-scheme del sistema.
 * Escucha cambios del sistema en tiempo real y permite alternancia de 2 modos (☀️/🌙).
 * Aplica .theme-dark / .theme-light en <html> y actualiza meta theme-color.
 * ─────────────────────────────────────────────────── */
function useSystemTheme() {
  const [isDark, setIsDark] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem("pov2-theme");
      if (stored !== null) return stored === "dark";
    } catch {
      /* noop */
    }
    return typeof window !== "undefined"
      ? window.matchMedia("(prefers-color-scheme: dark)").matches
      : false;
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const handleChange = (e: MediaQueryListEvent) => {
      try {
        if (localStorage.getItem("pov2-theme") === null) {
          setIsDark(e.matches);
        }
      } catch {
        setIsDark(e.matches);
      }
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add("theme-dark");
      root.classList.remove("theme-light");
    } else {
      root.classList.remove("theme-dark");
      root.classList.add("theme-light");
    }

    let metaTheme = document.querySelector('meta[name="theme-color"]');
    if (!metaTheme) {
      metaTheme = document.createElement("meta");
      metaTheme.setAttribute("name", "theme-color");
      document.head.appendChild(metaTheme);
    }
    metaTheme.setAttribute("content", isDark ? "#121212" : "#F5F2EE");
  }, [isDark]);

  const toggleDark = useCallback(() => {
    setIsDark((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("pov2-theme", next ? "dark" : "light");
      } catch {
        /* noop */
      }
      return next;
    });
  }, []);

  return { isDark, toggleDark };
}



function CatalogModeAppInner({ items, categories, siteConfig, catalogBanners = [], source, designSpec }: CatalogModeAppProps) {
  const [selectedProduct, setSelectedProduct] = useState<CatalogProduct | null>(null);
  const [editingCartItem, setEditingCartItem] = useState<any>(null);
  const [activeCategoryKey, setActiveCategoryKey] = useState<string>("all");
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [activeToast, setActiveToast] = useState<ToastMessage | null>(null);
  const [isTowerModalOpen, setIsTowerModalOpen] = useState(false);
  const [selectedTowerKey, setSelectedTowerKey] = useState<string | null>(null);
  const { isDark, toggleDark } = useSystemTheme();

  const towerStatus = useMemo(() => getTowerStatus(), []);

  const catalogProducts = useMemo(() => mapMenuItemsToCatalogProducts(items, categories), [items, categories]);

  const categoryPills = useMemo(
    () => [
      { key: "all", name: "📖 Todo" },
      ...categories.map((c) => ({
        key: c.key,
        name: `${getCategoryEmoji(c.key, c.name)} ${c.name}`,
      })),
    ],
    [categories]
  );

  const closeProductDrawer = useCallback(() => {
    setSelectedProduct(null);
    setEditingCartItem(null);
  }, []);

  const openCart = useCallback(() => setIsCartOpen(true), []);
  const closeCart = useCallback(() => setIsCartOpen(false), []);
  const openCheckout = useCallback(() => {
    setIsCartOpen(false);
    setIsCheckoutOpen(true);
  }, []);
  const closeCheckout = useCallback(() => setIsCheckoutOpen(false), []);

  const handleEditCartItem = useCallback(
    (cartItem: any) => {
      const foundProduct = catalogProducts.find((p: CatalogProduct) => p.id === cartItem.productId);
      if (foundProduct) {
        setSelectedProduct(foundProduct);
        setEditingCartItem(cartItem);
        setIsCartOpen(false);
      }
    },
    [catalogProducts]
  );

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

      {/* ── Sub-barra de entregas por edificio (desplaza naturalmente con la página) ── */}
      <div className="site-header__sub-bar">
        <div className="site-header__sub-bar-container">
          <span className="store-status-badge store-status-badge--open" role="status" aria-label="Estado del servicio: Tomando pedidos">
            <span className="store-status-badge__dot" aria-hidden="true" />
            <span>Tomando pedidos</span>
          </span>

          <div className="site-header__towers-bar">
            <button
              type="button"
              className={`tower-pill-btn ${towerStatus.gga.active ? "tower-pill-btn--active" : "tower-pill-btn--off"}`}
              onClick={() => {
                setSelectedTowerKey("gga");
                setIsTowerModalOpen(true);
              }}
              aria-label={`Ver horario de ${towerStatus.gga.name} (${towerStatus.gga.active ? "Disponible hoy" : "Inactivo hoy"})`}
            >
              <span className="tower-pill-btn__emoji">🏢</span>
              <span className="tower-pill-btn__label">Torre GGA</span>
              <span className={`tower-pill-btn__dot ${towerStatus.gga.active ? "tower-pill-btn__dot--active" : "tower-pill-btn__dot--off"}`} />
            </button>

            <button
              type="button"
              className={`tower-pill-btn ${towerStatus.valcob.active ? "tower-pill-btn--active" : "tower-pill-btn--off"}`}
              onClick={() => {
                setSelectedTowerKey("valcob");
                setIsTowerModalOpen(true);
              }}
              aria-label={`Ver horario de ${towerStatus.valcob.name} (${towerStatus.valcob.active ? "Disponible hoy" : "Inactivo hoy"})`}
            >
              <span className="tower-pill-btn__emoji">🏢</span>
              <span className="tower-pill-btn__label">Torre Valcob</span>
              <span className={`tower-pill-btn__dot ${towerStatus.valcob.active ? "tower-pill-btn__dot--active" : "tower-pill-btn__dot--off"}`} />
            </button>
          </div>
        </div>
      </div>

      <main className="catalog-shell" aria-labelledby="catalogTitle">
        {/* ── Headless UI Dynamic Renderer ───────── */}
        <DynamicRenderer
          spec={designSpec || DEFAULT_STUDIO_DESIGN_SPEC}
          chekeoItems={items}
          chekeoCategories={categories}
          activeCategoryKey={activeCategoryKey}
          onSelectCategory={setActiveCategoryKey}
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
        {selectedProduct && (
          <CatalogProductDrawer
            key="product-drawer"
            product={selectedProduct}
            initialCartItem={editingCartItem}
            onClose={closeProductDrawer}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {isCartOpen && (
          <CatalogCartDrawer
            key="cart-drawer"
            isOpen={isCartOpen}
            onClose={closeCart}
            onCheckout={openCheckout}
            onEditItem={handleEditCartItem}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {isCheckoutOpen && <CatalogCheckoutDrawer key="checkout-drawer" isOpen={isCheckoutOpen} onClose={closeCheckout} />}
      </AnimatePresence>

      {/* ── Modal de Horario por Edificio ────────────────────────────── */}
      <TowerScheduleModal
        isOpen={isTowerModalOpen}
        onClose={() => setIsTowerModalOpen(false)}
        selectedTowerKey={selectedTowerKey}
      />
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
