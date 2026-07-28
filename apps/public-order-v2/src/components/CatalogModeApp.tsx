import type { MenuCategory, MenuItem, SiteConfig, CatalogBanner } from "@config/index";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CatalogProductDrawer } from "./CatalogProductDrawer";
import { CatalogCartDrawer } from "./CatalogCartDrawer";
import { CatalogCheckoutDrawer } from "./CatalogCheckoutDrawer";
import { CatalogCartBar } from "./CatalogCartBar";
import { CatalogCartProvider, useCatalogCart } from "./CatalogCartContext";
import { AnimatePresence } from "framer-motion";
import { CatalogBannerRail } from "./CatalogBannerRail";
import { DynamicRenderer } from "./DynamicRenderer";
import type { DesignSpecification } from "../types/design";
import { DEFAULT_STUDIO_DESIGN_SPEC } from "../lib/default-design-spec";
import {
  type CatalogProduct,
  type CatalogProductType,
  PRODUCT_TYPE_LABELS,
  mapMenuItemsToCatalogProducts,
  resolveCatalogAssetUrl,
  getCategoryEmoji,
} from "../lib/catalog-mode";
import { formatCurrency } from "../lib/order";

type CatalogModeAppProps = {
  items: MenuItem[];
  categories: MenuCategory[];
  siteConfig: SiteConfig;
  catalogBanners?: CatalogBanner[];
  source?: string;
  designSpec?: DesignSpecification | null;
};

const CatalogFallbackSvg = ({ type }: { type: CatalogProductType }) => {
  switch (type) {
    case "burger":
      return (
        <svg viewBox="0 0 64 64" fill="none" className="catalog-fallback-icon" aria-hidden="true" focusable="false">
          <path d="M12 28C12 18 20.95 12 32 12C43.05 12 52 18 52 28H12Z" fill="var(--color-accent)" fillOpacity="0.25" stroke="var(--color-accent)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M16 22C18 20 20 20 22 22" stroke="var(--color-accent)" strokeWidth="2" strokeLinecap="round"/>
          <path d="M42 22C44 20 46 20 48 22" stroke="var(--color-accent)" strokeWidth="2" strokeLinecap="round"/>
          <path d="M10 33H54" stroke="#F59E0B" strokeWidth="3" strokeLinecap="round"/>
          <path d="M14 33L18 37L22 33L26 37L30 33L34 37L38 33L42 37L46 33L50 37" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <rect x="10" y="40" width="44" height="6" rx="3" fill="#C92027" fillOpacity="0.8" stroke="#C92027" strokeWidth="2"/>
          <path d="M12 49C12 51.2 13.8 53 16 53H48C50.2 53 52 51.2 52 49V49H12V49Z" fill="var(--color-accent)" fillOpacity="0.2" stroke="var(--color-accent)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      );
    case "combo":
      return (
        <svg viewBox="0 0 64 64" fill="none" className="catalog-fallback-icon" aria-hidden="true" focusable="false">
          <path d="M8 26C8 18.5 14.5 13 23 13C31.5 13 38 18.5 38 26H8Z" fill="var(--color-accent)" fillOpacity="0.2" stroke="var(--color-accent)" strokeWidth="2" strokeLinecap="round"/>
          <rect x="6" y="30" width="34" height="5" rx="2.5" fill="#F59E0B" stroke="#F59E0B" strokeWidth="1.5"/>
          <path d="M8 39H36V43C36 45.2 34.2 47 32 47H12C9.8 47 8 45.2 8 43V39Z" fill="var(--color-accent)" fillOpacity="0.2" stroke="var(--color-accent)" strokeWidth="2"/>
          <path d="M42 22L45 49H57L60 22H42Z" fill="var(--color-success)" fillOpacity="0.25" stroke="var(--color-success)" strokeWidth="2" strokeLinejoin="round"/>
          <path d="M51 22V13L56 9" stroke="var(--color-success)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <rect x="40" y="19" width="22" height="4" rx="2" fill="var(--color-success)" stroke="var(--color-success)"/>
        </svg>
      );
    case "side":
      return (
        <svg viewBox="0 0 64 64" fill="none" className="catalog-fallback-icon" aria-hidden="true" focusable="false">
          <path d="M18 28L14 10" stroke="#F59E0B" strokeWidth="3" strokeLinecap="round"/>
          <path d="M25 28L23 8" stroke="#F59E0B" strokeWidth="3" strokeLinecap="round"/>
          <path d="M32 28V6" stroke="#F59E0B" strokeWidth="3" strokeLinecap="round"/>
          <path d="M39 28L41 8" stroke="#F59E0B" strokeWidth="3" strokeLinecap="round"/>
          <path d="M46 28L50 10" stroke="#F59E0B" strokeWidth="3" strokeLinecap="round"/>
          <path d="M16 26H48L44 54H20L16 26Z" fill="#C92027" fillOpacity="0.3" stroke="#C92027" strokeWidth="2.5" strokeLinejoin="round"/>
          <path d="M22 36C28 40 36 40 42 36" stroke="var(--color-accent)" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      );
    case "drink":
      return (
        <svg viewBox="0 0 64 64" fill="none" className="catalog-fallback-icon" aria-hidden="true" focusable="false">
          <path d="M20 20L25 54H39L44 20H20Z" fill="var(--color-accent)" fillOpacity="0.15" stroke="var(--color-accent)" strokeWidth="2.5" strokeLinejoin="round"/>
          <path d="M34 20V8L42 4" stroke="#F59E0B" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          <rect x="18" y="16" width="28" height="5" rx="2.5" fill="var(--color-accent)" stroke="var(--color-accent)" strokeWidth="1.5"/>
          <path d="M22 32C28 35 36 35 42 32" stroke="var(--color-accent)" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      );
    case "topping":
      return (
        <svg viewBox="0 0 64 64" fill="none" className="catalog-fallback-icon" aria-hidden="true" focusable="false">
          <path d="M26 14C26 10 38 10 38 14V22H26V14Z" stroke="var(--color-success)" strokeWidth="2" strokeLinejoin="round"/>
          <path d="M20 22H44L48 54H16L20 22Z" fill="var(--color-success)" fillOpacity="0.2" stroke="var(--color-success)" strokeWidth="2.5" strokeLinejoin="round"/>
          <circle cx="32" cy="38" r="6" stroke="#F59E0B" strokeWidth="2"/>
          <path d="M32 32V44M26 38H38" stroke="#F59E0B" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      );
  }
};

const ProductMedia = ({ product, isHero = false }: { product: CatalogProduct; isHero?: boolean }) => {
  const src = resolveCatalogAssetUrl(product.imageUrl, product.imageKey);

  if (src) {
    return (
      <div className={isHero ? "catalog-card__hero-media" : "catalog-card__standard-thumb-inner"} aria-hidden="true">
        <img src={src} alt="" loading="lazy" decoding="async" />
      </div>
    );
  }

  return (
    <div
      className={`${isHero ? "catalog-card__hero-media" : "catalog-card__standard-thumb-inner"} catalog-fallback-thumbnail catalog-fallback-thumbnail--${product.type}`}
      aria-hidden="true"
    >
      <CatalogFallbackSvg type={product.type} />
    </div>
  );
};

const CatalogHeroCard = ({
  product,
  onOpen,
  onQuickAdd,
}: {
  product: CatalogProduct;
  onOpen: (product: CatalogProduct) => void;
  onQuickAdd: (e: React.MouseEvent | React.KeyboardEvent, product: CatalogProduct) => void;
}) => {
  const isAvailable = product.isAvailable;

  return (
    <article className={`catalog-card catalog-card--hero ${isAvailable ? "" : "catalog-card--disabled"}`}>
      <div
        className="catalog-card__detail-trigger catalog-card__hero-body"
        role="button"
        tabIndex={0}
        onClick={() => onOpen(product)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onOpen(product);
          }
        }}
        aria-label={`Ver detalle de ${product.name}${isAvailable ? "" : ", no disponible"}`}
      >
        <div className="catalog-card__hero-media-wrapper">
          <ProductMedia product={product} isHero />
          <div className="catalog-card__hero-overlay" aria-hidden="true" />
          <div className="catalog-card__badges">
            {product.type === "combo" && (
              <span className="catalog-badge catalog-badge--best-seller">🔥 Más Vendido</span>
            )}
            {product.isFeatured && (
              <span className="catalog-badge catalog-badge--featured">⭐ Destacado</span>
            )}
            {product.badge && product.type !== "combo" && !product.isFeatured && (
              <span className="catalog-badge catalog-badge--custom">{product.badge}</span>
            )}
          </div>
        </div>

        <div className="catalog-card__hero-content">
          <div className="catalog-card__eyebrow">
            <span>{PRODUCT_TYPE_LABELS[product.type]}</span>
          </div>
          <h3 className="catalog-card__hero-title">{product.name}</h3>
          {product.description && (
            <p className="catalog-card__hero-desc">{product.description}</p>
          )}
          <div className="catalog-card__hero-footer">
            <strong className="catalog-card__price">{formatCurrency(product.price)}</strong>
          </div>
        </div>
      </div>

      {isAvailable && (
        <button
          type="button"
          className="catalog-card__btn-add catalog-card__btn-add--hero"
          onClick={(e) => {
            e.stopPropagation();
            onQuickAdd(e, product);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.stopPropagation();
            }
          }}
          aria-label={`Agregar ${product.name} al carrito`}
        >
          + Agregar
        </button>
      )}
    </article>
  );
};

const CatalogStandardCard = ({
  product,
  onOpen,
  onQuickAdd,
}: {
  product: CatalogProduct;
  onOpen: (product: CatalogProduct) => void;
  onQuickAdd: (e: React.MouseEvent | React.KeyboardEvent, product: CatalogProduct) => void;
}) => {
  const isAvailable = product.isAvailable;

  return (
    <article className={`catalog-card catalog-card--standard ${isAvailable ? "" : "catalog-card--disabled"}`}>
      <div
        className="catalog-card__detail-trigger catalog-card__standard-body"
        role="button"
        tabIndex={0}
        onClick={() => onOpen(product)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onOpen(product);
          }
        }}
        aria-label={`Ver detalle de ${product.name}${isAvailable ? "" : ", no disponible"}`}
      >
        <div className="catalog-card__standard-info">
          <div className="catalog-card__eyebrow">
            <span>{PRODUCT_TYPE_LABELS[product.type]}</span>
            {product.badge && <em className="catalog-card__badge-inline">{product.badge}</em>}
          </div>
          <h3 className="catalog-card__standard-title">{product.name}</h3>
          {product.description && (
            <p className="catalog-card__standard-desc">{product.description}</p>
          )}
          <div className="catalog-card__standard-footer">
            <strong className="catalog-card__price">{formatCurrency(product.price)}</strong>
          </div>
        </div>

        <div className="catalog-card__standard-thumb">
          <ProductMedia product={product} isHero={false} />
        </div>
      </div>

      {isAvailable && (
        <button
          type="button"
          className="catalog-card__btn-add catalog-card__btn-add--standard"
          onClick={(e) => {
            e.stopPropagation();
            onQuickAdd(e, product);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.stopPropagation();
            }
          }}
          aria-label={`Agregar ${product.name} al carrito`}
        >
          + Agregar
        </button>
      )}
    </article>
  );
};

const CatalogProductCard = ({
  product,
  onOpen,
}: {
  product: CatalogProduct;
  onOpen: (product: CatalogProduct) => void;
}) => {
  const { addItem } = useCatalogCart();
  const isHero = product.type === "combo" || Boolean(product.isFeatured);

  const handleQuickAdd = useCallback(
    (e: React.MouseEvent | React.KeyboardEvent, p: CatalogProduct) => {
      e.stopPropagation();
      addItem(p);
    },
    [addItem]
  );

  if (isHero) {
    return <CatalogHeroCard product={product} onOpen={onOpen} onQuickAdd={handleQuickAdd} />;
  }

  return <CatalogStandardCard product={product} onOpen={onOpen} onQuickAdd={handleQuickAdd} />;
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
  const products = useMemo(() => mapMenuItemsToCatalogProducts(items, categories), [items, categories]);
  const visibleCategories = useMemo(() => {
    const categoryKeys = new Set(products.map((product) => product.categoryKey));
    return categories
      .filter((category) => categoryKeys.has(category.key))
      .sort((a, b) => a.sortOrder - b.sortOrder);
  }, [categories, products]);
  const [activeCategory, setActiveCategory] = useState<MenuCategory["key"] | "all">("all");
  const [selectedProduct, setSelectedProduct] = useState<CatalogProduct | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const { isDark, toggle: toggleDark } = useDarkMode();
  const closeProductDrawer = useCallback(() => setSelectedProduct(null), []);
  const openCart = useCallback(() => setIsCartOpen(true), []);
  const closeCart = useCallback(() => setIsCartOpen(false), []);
  const openCheckout = useCallback(() => {
    setIsCartOpen(false);
    setIsCheckoutOpen(true);
  }, []);
  const closeCheckout = useCallback(() => setIsCheckoutOpen(false), []);

  const categoryNavRef = useRef<HTMLElement>(null);
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  const categoryTabs = useMemo(
    () => [
      { key: "all" as const, name: "Todos", emoji: getCategoryEmoji("all", "Todos") },
      ...visibleCategories.map((c) => ({
        key: c.key,
        name: c.name,
        emoji: getCategoryEmoji(c.key, c.name),
      })),
    ],
    [visibleCategories]
  );

  const handleSelectCategory = useCallback((key: MenuCategory["key"] | "all") => {
    setActiveCategory(key);
    const btn = tabRefs.current[key];
    if (btn) {
      btn.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
    }
  }, []);

  const handleCategoryKeyDown = useCallback(
    (e: React.KeyboardEvent, currentIndex: number) => {
      let targetIndex = currentIndex;
      const total = categoryTabs.length;

      if (e.key === "ArrowRight" || e.key === "ArrowDown") {
        e.preventDefault();
        targetIndex = (currentIndex + 1) % total;
      } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        e.preventDefault();
        targetIndex = (currentIndex - 1 + total) % total;
      } else if (e.key === "Home") {
        e.preventDefault();
        targetIndex = 0;
      } else if (e.key === "End") {
        e.preventDefault();
        targetIndex = total - 1;
      } else {
        return;
      }

      const targetTab = categoryTabs[targetIndex];
      if (targetTab) {
        handleSelectCategory(targetTab.key);
        const btn = tabRefs.current[targetTab.key];
        btn?.focus();
      }
    },
    [categoryTabs, handleSelectCategory]
  );

  const filteredProducts = activeCategory === "all"
    ? products
    : products.filter((product) => product.categoryKey === activeCategory);

  return (
    <>
      {/* ── Header fijo de la app (PR 2) ─────────────────────────────────────────── */}
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

      <main className="catalog-shell px-3 max-w-md mx-auto pb-24" aria-labelledby="catalogTitle">
        {/* ── Headless UI Dynamic Renderer (Android Studio Export Spec) ───────── */}
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
          }}
        />
      </main>

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
