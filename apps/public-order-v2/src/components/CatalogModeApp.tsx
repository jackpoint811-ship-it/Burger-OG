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
import { TowerScheduleModal, getTowerStatus, type DynamicTowerSchedule } from "./TowerScheduleModal";
import {
  type CatalogProduct,
  mapMenuItemsToCatalogProducts,
  getCategoryEmoji,
} from "../lib/catalog-mode";

type CatalogModeAppProps = {
  items: MenuItem[];
  categories: MenuCategory[];
  siteConfig: SiteConfig;
  recipes?: Record<string, string[]>;
  catalogBanners?: CatalogBanner[];
  categoryBanners?: any[];
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



function CatalogModeAppInner({ items, categories, siteConfig, recipes, catalogBanners = [], categoryBanners = [], source, designSpec }: CatalogModeAppProps) {
  const [selectedProduct, setSelectedProduct] = useState<CatalogProduct | null>(null);
  const [editingCartItem, setEditingCartItem] = useState<any>(null);
  const [activeCategoryKey, setActiveCategoryKey] = useState<string>("all");
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [activeToast, setActiveToast] = useState<ToastMessage | null>(null);
  const [isTowerModalOpen, setIsTowerModalOpen] = useState(false);
  const [selectedTowerKey, setSelectedTowerKey] = useState<string | null>(null);
  const [towers, setTowers] = useState<DynamicTowerSchedule[]>([]);
  const { isDark, toggleDark } = useSystemTheme();

  useEffect(() => {
    fetch("/api/tower-schedules")
      .then((res) => res.json())
      .then((data: any) => {
        if (data?.ok && Array.isArray(data.towers)) {
          setTowers(data.towers);
        }
      })
      .catch(() => {
        /* silent fallback */
      });
  }, []);

  const towerStatus = useMemo(() => getTowerStatus(towers), [towers]);

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
                width="34"
                height="34"
                viewBox="0 0 36 36"
                fill="none"
                aria-hidden="true"
              >
                <rect width="36" height="36" rx="10" fill="var(--color-accent-soft)" stroke="var(--color-accent-line)" strokeWidth="1.5" />
                <path d="M 8 13 C 8 7, 28 7, 28 13 Z" fill="var(--color-accent)" />
                <rect x="7" y="15" width="22" height="3" rx="1.5" fill="var(--color-warning)" />
                <rect x="6" y="19" width="24" height="4" rx="2" fill="var(--color-accent)" opacity="0.85" />
                <path d="M 8 24 H 28 C 28 27, 23 29, 18 29 C 13 29, 8 27, 8 24 Z" fill="var(--color-accent)" />
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
            {towerStatus.towersList.map((t) => (
              <button
                key={t.key || t.name}
                type="button"
                className={`tower-pill-btn ${t.active ? "tower-pill-btn--active" : "tower-pill-btn--off"}`}
                onClick={() => {
                  setSelectedTowerKey(t.key);
                  setIsTowerModalOpen(true);
                }}
                aria-label={`Ver horario de ${t.name} (${t.active ? "Disponible hoy" : "Inactivo hoy"})`}
              >
                <span className="tower-pill-btn__emoji">{t.emoji}</span>
                <span className="tower-pill-btn__label">{t.name}</span>
                <span className={`tower-pill-btn__dot ${t.active ? "tower-pill-btn__dot--active" : "tower-pill-btn__dot--off"}`} />
              </button>
            ))}
          </div>
        </div>
      </div>

      <main className="catalog-shell" aria-labelledby="catalogTitle">
        {/* ── Headless UI Dynamic Renderer ───────── */}
        <DynamicRenderer
          spec={designSpec || DEFAULT_STUDIO_DESIGN_SPEC}
          chekeoItems={items}
          chekeoCategories={categories}
          catalogBanners={catalogBanners}
          categoryBanners={categoryBanners}
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

      {/* ── Pie de página oficial Premium Casual ────────────────────────── */}
      <footer className="site-footer" role="contentinfo">
        <div className="site-footer__container">
          <div className="site-footer__brand">
            <span className="site-footer__logo-text">Burgers<span className="site-footer__logo-ext">.exe</span></span>
            <p className="site-footer__tagline">Smash burgers artesanales hechas al instante con ingredientes frescos.</p>
          </div>
          <div className="site-footer__links">
            <a href="/tickets" className="site-footer__link">🎟️ Mis Tickets de Rifas</a>
            <a href="https://chat.whatsapp.com/GycE5zALOypGPvJVaMfbPp" target="_blank" rel="noopener noreferrer" className="site-footer__link">💬 Grupo de WhatsApp</a>
          </div>
          <div className="site-footer__copy">
            © {new Date().getFullYear()} Burgers.exe — Hecho con ❤️ para ti.
          </div>
        </div>
      </footer>

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
            recipeIngredients={(selectedProduct.sku && recipes?.[selectedProduct.sku]) || recipes?.[selectedProduct.id]}
            recipesBySku={recipes}
            allProducts={catalogProducts}
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
        {isCheckoutOpen && <CatalogCheckoutDrawer key="checkout-drawer" isOpen={isCheckoutOpen} onClose={closeCheckout} towers={towers} />}
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
