import React, { useState, useEffect, useRef } from "react";
import type { MenuCategory, MenuItem, CatalogBanner, MenuCategoryBanner } from "@config/index";
import type { GlobalTheme, LayoutModule } from "../types/design";
import { formatCurrency } from "../lib/order";
import {
  resolveCatalogAssetUrl,
  mapMenuItemsToCatalogProducts,
  getCategoryEmoji,
} from "../lib/catalog-mode";
import { handleAssetImageError, getCasualSvgPlaceholder } from "../utils/assets";
import { useCatalogCart } from "./CatalogCartContext";
import { CatalogImage } from "./CatalogImage";
import { motion, AnimatePresence } from "framer-motion";

const BANNER_BG_PRESETS: Record<string, string> = {
  "gradient-cyan": "linear-gradient(135deg, #0891B2 0%, #06B6D4 100%)",
  "gradient-emerald": "linear-gradient(135deg, #15803D 0%, #16A34A 100%)",
  "gradient-amber": "linear-gradient(135deg, #C2410C 0%, #EA580C 100%)",
  "gradient-indigo": "linear-gradient(135deg, #4338CA 0%, #6366F1 100%)",
  "gradient-rose": "linear-gradient(135deg, #BE185D 0%, #E11D48 100%)",
  "gradient-dark": "linear-gradient(135deg, #18181B 0%, #27272A 100%)",
};

const DEFAULT_BANNER_GRADIENTS = [
  "linear-gradient(135deg, #15803D 0%, #16A34A 100%)",
  "linear-gradient(135deg, #C2410C 0%, #EA580C 100%)",
  "linear-gradient(135deg, #4338CA 0%, #6366F1 100%)",
];

const resolveBannerGradient = (bgPreset?: string, index = 0): string => {
  const preset = bgPreset ? BANNER_BG_PRESETS[bgPreset] : undefined;
  if (preset) return preset;
  if (bgPreset && bgPreset.trim().startsWith("linear-gradient")) return bgPreset.trim();
  return DEFAULT_BANNER_GRADIENTS[index % DEFAULT_BANNER_GRADIENTS.length];
};

export interface LayoutEngineProps {
  module: LayoutModule;
  globalTheme?: GlobalTheme;
  chekeoItems?: MenuItem[];
  chekeoCategories?: MenuCategory[];
  catalogBanners?: CatalogBanner[];
  categoryBanners?: MenuCategoryBanner[];
  isLoading?: boolean;
  onProductSelect?: (product: MenuItem) => void;
  onAction?: (action: string) => void;
  activeCategoryKey?: string;
  onSelectCategory?: (key: string) => void;
}

export function LayoutEngine({
  module,
  globalTheme,
  chekeoItems = [],
  chekeoCategories = [],
  catalogBanners = [],
  categoryBanners = [],
  isLoading = false,
  onProductSelect,
  onAction,
  activeCategoryKey = "all",
  onSelectCategory,
}: LayoutEngineProps) {
  const { items, addItem, count: cartCount, total: cartTotal } = useCatalogCart();
  const [bannerIndex, setBannerIndex] = useState(0);
  const [pulsingItemIds, setPulsingItemIds] = useState<Record<string, boolean>>({});

  const cartQtyByProductId = React.useMemo(() => {
    const map: Record<string, number> = {};
    for (const cartItem of items) {
      map[cartItem.productId] = (map[cartItem.productId] || 0) + cartItem.qty;
    }
    return map;
  }, [items]);

  const handleQuickAdd = (item: MenuItem, e: React.MouseEvent) => {
    e.stopPropagation();
    if (item.isAvailable === false) return;
    const mappedProduct = mapMenuItemsToCatalogProducts([item], chekeoCategories)[0];
    if (mappedProduct && mappedProduct.isAvailable !== false) {
      addItem(mappedProduct, [], []);
      setPulsingItemIds((prev) => ({ ...prev, [item.sku]: true }));
      setTimeout(() => {
        setPulsingItemIds((prev) => ({ ...prev, [item.sku]: false }));
      }, 500);
    }
  };

  if (!module || typeof module !== "object" || module.visible === false) {
    return null;
  }

  const moduleType = (typeof module.type === "string" ? module.type : "").toLowerCase();

  // 1. HEADER MODULE — Desactivado para evitar duplicar el site-header principal de la app
  if (moduleType === "header") {
    return null;
  }

  // 2. BANNER CAROUSEL 1 (SWIPEABLE PROMO BANNERS)
  if (moduleType === "banner_carousel_1" || moduleType === "banner_carousel") {
    const activeDbBanners = (catalogBanners || [])
      .filter((b) => b.isActive !== false)
      .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

    const defaultBanners = [
      {
        id: "b1",
        badge1: "PROMO EXCLUSIVA",
        badge2: "⚡ CÓDIGO BURGERS",
        title: "⚡ ENVÍO GRATIS $0",
        subtitle: "En tu primer pedido mayor a $150 con código BURGERS",
        ctaLabel: undefined as string | undefined,
        icon: "🍔",
        src: undefined as string | undefined,
        gradient: "linear-gradient(135deg, #15803D 0%, #16A34A 100%)",
        action: () => {
          try {
            navigator.clipboard.writeText("BURGERS");
          } catch { /* noop */ }
          if (onAction) onAction("TOAST:🎟️|¡Código BURGERS copiado al portapapeles!");
        },
      },
      {
        id: "b2",
        badge1: "🔥 2x1 FLASH",
        badge2: "SOLO HOY",
        title: "🔥 DOBLE SMASH 2x1",
        subtitle: "Aprovecha 2 hamburguesas dobles al precio de 1",
        ctaLabel: undefined as string | undefined,
        icon: "🍟",
        src: undefined as string | undefined,
        gradient: "linear-gradient(135deg, #C2410C 0%, #EA580C 100%)",
        action: () => {
          if (onSelectCategory) onSelectCategory("combos");
          if (onAction) onAction("TOAST:🔥|Categoría Combos seleccionada");
          document.getElementById("catalog-grid")?.scrollIntoView({ behavior: "smooth", block: "start" });
        },
      },
      {
        id: "b3",
        badge1: "🏆 SORTEO",
        badge2: "GANA COMBOS",
        title: "🏆 COMBOS GRATIS",
        subtitle: "Participa por un año de combos en cada pedido",
        ctaLabel: undefined as string | undefined,
        icon: "🎁",
        src: undefined as string | undefined,
        gradient: "linear-gradient(135deg, #4338CA 0%, #6366F1 100%)",
        action: () => {
          window.location.href = "/tickets";
        },
      },
    ];

    const banners = activeDbBanners.length > 0
      ? activeDbBanners.map((dbBanner, idx) => {
          const src = resolveCatalogAssetUrl(dbBanner.imageUrl, dbBanner.imageKey);
          return {
            id: dbBanner.id || `db-b-${idx}`,
            badge1: dbBanner.badgeText || "PROMO EXCLUSIVA",
            badge2: dbBanner.badgeColor ? `BANNER #${idx + 1}` : "DESTACADO",
            title: dbBanner.title,
            subtitle: dbBanner.subtitle || "",
            ctaLabel: dbBanner.ctaLabel,
            src,
            icon: dbBanner.badgeText ? "⭐" : "🍔",
            gradient: resolveBannerGradient(dbBanner.bgPreset, idx),
            action: () => {
              const rawType = dbBanner.ctaActionType?.toLowerCase()?.trim();
              const target = dbBanner.ctaTarget?.trim();

              // 1. Navegación a Categorías (ej. "combos", "burgers", "bebidas", "menu", "all")
              if (
                rawType === "category" ||
                rawType === "cat" ||
                target === "combos" ||
                target === "burgers" ||
                target === "bebidas" ||
                target === "menu" ||
                target === "all"
              ) {
                const catKey = target && target !== "menu" ? target : "combos";
                if (onSelectCategory) onSelectCategory(catKey);
                document.getElementById("catalog-grid")?.scrollIntoView({ behavior: "smooth", block: "start" });
                return;
              }

              // 2. Subpáginas Internas (ej. /tickets, /sorteo, etc.)
              if (rawType === "page" || rawType === "internal" || (target && target.startsWith("/"))) {
                if (target === "/menu" || target === "/") {
                  document.getElementById("catalog-grid")?.scrollIntoView({ behavior: "smooth", block: "start" });
                } else if (target) {
                  window.location.href = target;
                }
                return;
              }

              // 3. Links Externos (ej. http://... o https://...)
              if (
                rawType === "url" ||
                rawType === "external" ||
                (target && (target.startsWith("http://") || target.startsWith("https://")))
              ) {
                if (target) window.open(target, "_blank", "noopener,noreferrer");
                return;
              }

              // 4. Mensajes Toast explícitos
              if (rawType === "toast" || rawType === "message") {
                if (onAction) onAction(`TOAST:⭐|${target || dbBanner.title}`);
                return;
              }

              // 5. Mapeo genérico por target
              if (target) {
                if (onSelectCategory) onSelectCategory(target);
                document.getElementById("catalog-grid")?.scrollIntoView({ behavior: "smooth", block: "start" });
              } else if (onAction) {
                onAction(`TOAST:⭐|${dbBanner.title}`);
              }
            },
          };
        })
      : defaultBanners;

    // Autoplay cada 5s
    useEffect(() => {
      const timer = setInterval(() => {
        setBannerIndex((prev) => (prev + 1) % banners.length);
      }, 5000);
      return () => clearInterval(timer);
    }, [banners.length]);

    const activeBanner = banners[bannerIndex] || banners[0];

    return (
      <section style={{ width: "100%", marginTop: "8px", marginBottom: "12px" }}>
        <div style={{ position: "relative", width: "100%", overflow: "hidden", borderRadius: "16px" }}>
          <motion.div
            key={activeBanner.id}
            initial={{ opacity: 0.7, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0.7, x: -20 }}
            transition={{ duration: 0.3 }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.2}
            onDragEnd={(e, info) => {
              const swipeThreshold = 40;
              if (info.offset.x < -swipeThreshold) {
                setBannerIndex((prev) => (prev + 1) % banners.length);
              } else if (info.offset.x > swipeThreshold) {
                setBannerIndex((prev) => (prev === 0 ? banners.length - 1 : prev - 1));
              }
            }}
            style={{
              width: "100%",
              borderRadius: "16px",
              padding: "18px 20px",
              position: "relative",
              overflow: "hidden",
              background: activeBanner.gradient,
              boxShadow: "0 8px 24px rgba(0, 0, 0, 0.15)",
              border: "1px solid rgba(255, 255, 255, 0.15)",
              boxSizing: "border-box",
              cursor: "grab",
              userSelect: "none",
              touchAction: "pan-y",
            }}
            onClick={activeBanner.action}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
              <span
                style={{
                  backgroundColor: "rgba(0, 0, 0, 0.35)",
                  color: "#FFFFFF",
                  fontSize: "10px",
                  fontFamily: "'Inter', sans-serif",
                  fontWeight: 800,
                  padding: "4px 8px",
                  borderRadius: "6px",
                  border: "1px solid rgba(255, 255, 255, 0.2)",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                {activeBanner.badge1}
              </span>
              <span
                style={{
                  backgroundColor: "rgba(255, 255, 255, 0.2)",
                  color: "#FFFFFF",
                  fontSize: "10px",
                  fontFamily: "'Inter', sans-serif",
                  fontWeight: 800,
                  padding: "4px 8px",
                  borderRadius: "6px",
                  border: "1px solid rgba(255, 255, 255, 0.3)",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                {activeBanner.badge2}
              </span>
            </div>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px" }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <h2
                  style={{
                    margin: 0,
                    fontSize: "18px",
                    fontFamily: "'Inter', sans-serif",
                    fontWeight: 900,
                    color: "#FFFFFF",
                    letterSpacing: "-0.02em",
                    lineHeight: 1.2,
                  }}
                >
                  {activeBanner.title}
                </h2>
                {activeBanner.subtitle ? (
                  <p
                    style={{
                      margin: "6px 0 0 0",
                      fontSize: "12px",
                      fontFamily: "'Inter', sans-serif",
                      color: "rgba(255, 255, 255, 0.92)",
                      lineHeight: 1.3,
                    }}
                  >
                    {activeBanner.subtitle}
                  </p>
                ) : null}
                {activeBanner.ctaLabel ? (
                  <span
                    style={{
                      display: "inline-block",
                      marginTop: "10px",
                      fontSize: "11px",
                      fontWeight: 800,
                      color: "#FFFFFF",
                      backgroundColor: "rgba(0, 0, 0, 0.3)",
                      padding: "4px 10px",
                      borderRadius: "6px",
                      border: "1px solid rgba(255,255,255,0.25)",
                    }}
                  >
                    {activeBanner.ctaLabel} →
                  </span>
                ) : null}
              </div>
              {activeBanner.src ? (
                <div style={{ width: "64px", height: "64px", borderRadius: "12px", overflow: "hidden", flexShrink: 0, border: "1px solid rgba(255,255,255,0.2)" }}>
                  <CatalogImage src={activeBanner.src} alt={activeBanner.title} loading="eager" />
                </div>
              ) : (
                <div
                  style={{
                    fontSize: "42px",
                    userSelect: "none",
                    filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.3))",
                    flexShrink: 0,
                  }}
                >
                  {activeBanner.icon}
                </div>
              )}
            </div>

            {/* Puntos indicadores interactivos */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px",
                marginTop: "14px",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {banners.map((b, i) => (
                <span
                  key={b.id}
                  style={{
                    width: i === bannerIndex ? "16px" : "8px",
                    height: "8px",
                    borderRadius: "999px",
                    backgroundColor: i === bannerIndex ? "#FFFFFF" : "rgba(255, 255, 255, 0.4)",
                    transition: "all 0.25s ease",
                    cursor: "pointer",
                  }}
                  onClick={() => setBannerIndex(i)}
                />
              ))}
            </div>
          </motion.div>
        </div>
      </section>
    );
  }

  // 3. REORDER MODULE (1-CLICK REORDER)
  if (moduleType === "reorder") {
    let lastOrderItems: any[] = [];
    try {
      const stored = localStorage.getItem("pov2-last-order");
      if (stored) lastOrderItems = JSON.parse(stored);
    } catch { /* ignore */ }

    if (lastOrderItems.length === 0) return null; // Don't show if no previous order

    const title = lastOrderItems.map((i) => i.name).join(", ");

    const handleReorder = () => {
      lastOrderItems.forEach((cartItem) => {
        const menuItem = chekeoItems.find((i) => i.sku === cartItem.productId);
        if (menuItem) {
          const mapped = mapMenuItemsToCatalogProducts([menuItem], chekeoCategories)[0];
          for (let i = 0; i < cartItem.qty; i++) {
            if (mapped) addItem(mapped, cartItem.mods);
          }
        }
      });
      if (onAction) {
        onAction("TOAST:🍔|¡Último pedido agregado al carrito!");
        onAction("OPEN_CART");
      }
    };

    return (
      <section
        style={{
          width: "100%",
          marginTop: "8px",
          marginBottom: "12px",
          backgroundColor: "var(--color-surface)",
          borderRadius: "16px",
          padding: "14px 16px",
          border: "1px solid var(--color-line)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          boxShadow: "var(--shadow-card)",
          boxSizing: "border-box",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px", flex: 1, minWidth: 0 }}>
          <div
            style={{
              width: "42px",
              height: "42px",
              borderRadius: "12px",
              backgroundColor: "var(--color-accent-soft)",
              border: "1px solid var(--color-accent-line)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "20px",
              flexShrink: 0
            }}
          >
            🍔
          </div>
          <div style={{ minWidth: 0 }}>
            <span
              style={{
                fontSize: "10px",
                fontFamily: "'Inter', sans-serif",
                fontWeight: 800,
                color: "var(--color-accent)",
                display: "block",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              1-Click Reorder
            </span>
            <h3
              style={{
                margin: "2px 0 0 0",
                fontSize: "14px",
                fontFamily: "'Inter', sans-serif",
                fontWeight: 800,
                color: "var(--color-text-primary)",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {title}
            </h3>
            <p
              style={{
                margin: "2px 0 0 0",
                fontSize: "11px",
                fontFamily: "'Inter', sans-serif",
                color: "var(--color-text-muted)",
              }}
            >
              Repetir último pedido
            </p>
          </div>
        </div>

        <motion.button
          type="button"
          whileTap={{ scale: 0.94 }}
          style={{
            padding: "9px 16px",
            borderRadius: "9999px",
            backgroundColor: "var(--color-accent)",
            color: "#FFFFFF",
            fontFamily: "'Inter', sans-serif",
            fontWeight: 800,
            fontSize: "12px",
            textTransform: "uppercase",
            letterSpacing: "0.04em",
            border: "none",
            cursor: "pointer",
            boxShadow: "0 2px 8px rgba(22, 163, 74, 0.3)",
          }}
          onClick={handleReorder}
        >
          PEDIR
        </motion.button>
      </section>
    );
  }

  // 4. CATEGORIES HORIZONTAL / STICKY NAV
  if (moduleType === "categories_horizontal" || moduleType === "categories_sticky") {
    const categoryPills = [
      { key: "all", name: "📖 Todo" },
      ...chekeoCategories
        .filter((c) => c.key !== "extras")
        .map((c) => ({
          key: c.key,
          name: `${getCategoryEmoji(c.key, c.name)} ${c.name}`,
        })),
    ];

    return (
      <div className="catalog-category-sticky-header">
        <nav aria-label="Categorías" className="catalog-category-nav-scroll">
          {categoryPills.map((cat) => {
            const isActive = activeCategoryKey === cat.key;
            return (
              <button
                key={cat.key}
                type="button"
                className={`catalog-category-pill ${isActive ? "catalog-category-pill--active" : ""}`}
                onClick={(e) => {
                  if (onSelectCategory) onSelectCategory(cat.key);
                  if (onAction) onAction(`SELECT_CATEGORY:${cat.key}`);
                  e.currentTarget.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
                  setTimeout(() => {
                    const catalogSection = document.getElementById("catalog-grid");
                    if (catalogSection) {
                      catalogSection.scrollIntoView({ behavior: "smooth", block: "start" });
                    }
                  }, 50);
                }}
              >
                {cat.name}
              </button>
            );
          })}
        </nav>
      </div>
    );
  }

  // 5. FEATURED (TOP VENDIDOS)
  if (moduleType === "featured") {
    const featuredItems = chekeoItems.filter(
      (i) => i.isAvailable !== false && Boolean((i as MenuItem & { isFeatured?: boolean }).isFeatured)
    );
    const itemsToDisplay =
      featuredItems.length > 0
        ? featuredItems
        : chekeoItems.filter((i) => i.isAvailable !== false).slice(0, 4);

    return (
      <section style={{ width: "100%", marginTop: "12px", marginBottom: "16px" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "10px",
          }}
        >
          <h2
            style={{
              margin: 0,
              fontSize: "13px",
              fontFamily: "'Inter', sans-serif",
              fontWeight: 800,
              color: "var(--color-text-primary)",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <span>⭐</span> TOP VENDIDOS (MÁS PEDIDOS)
          </h2>
        </div>

        <div
          style={{
            display: "flex",
            overflowX: "auto",
            gap: "12px",
            paddingBottom: "8px",
            WebkitOverflowScrolling: "touch",
          }}
        >
          {itemsToDisplay.map((item, idx) => {
            const badgeText = item.badge || item.promoLabel || (idx === 0 ? "🔥 TOP 1" : idx === 1 ? "2x1 FLASH" : "ULTRA");
            const assetUrl = resolveCatalogAssetUrl(item.imageUrl, item.imageKey);

            return (
              <motion.div
                key={item.sku || `feat-${idx}`}
                whileTap={{ scale: 0.97 }}
                style={{
                  flexShrink: 0,
                  width: "168px",
                  backgroundColor: "var(--color-surface)",
                  border: "1px solid var(--color-line-soft)",
                  borderRadius: "16px",
                  padding: "0px",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  position: "relative",
                  cursor: "pointer",
                  boxSizing: "border-box",
                  boxShadow: "var(--shadow-card)",
                  overflow: "hidden",
                  willChange: "transform",
                  transform: "translateZ(0)",
                }}
                onClick={() => onProductSelect && onProductSelect(item)}
              >
                {/* Badge Qty */}
                {(() => {
                  const itemQty = cartQtyByProductId[item.sku] || 0;
                  if (itemQty > 0) {
                    return (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="catalog-card__badge-qty"
                      >
                        {itemQty}
                      </motion.div>
                    );
                  }
                  return null;
                })()}

                {/* Floating Plus Animation */}
                <AnimatePresence>
                  {pulsingItemIds[item.sku] && (
                    <div className="catalog-card__floating-plus">+1</div>
                  )}
                </AnimatePresence>

                {/* Promo Badge */}
                <div
                  style={{
                    position: "absolute",
                    top: "10px",
                    left: "10px",
                    zIndex: 10,
                    backgroundColor: "var(--color-accent-soft)",
                    color: "var(--color-accent)",
                    border: "1px solid var(--color-accent-line)",
                    fontSize: "9px",
                    fontFamily: "'Inter', sans-serif",
                    fontWeight: 800,
                    padding: "3px 7px",
                    borderRadius: "6px",
                    textTransform: "uppercase",
                  }}
                >
                  {badgeText}
                </div>

                {/* Imagen del producto */}
                <div
                  style={{
                    width: "100%",
                    height: "140px",
                    backgroundColor: "var(--color-surface-alt)",
                    borderRadius: "0px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginTop: "0px",
                    marginBottom: "0px",
                    borderBottom: "1px solid var(--color-line-soft)",
                    overflow: "hidden",
                  }}
                >
                  <CatalogImage
                    src={assetUrl || getCasualSvgPlaceholder(item.name)}
                    alt={item.name}
                    loading="lazy"
                  />
                </div>

                {/* Info & Precio */}
                <div style={{ padding: "12px", display: "flex", flexDirection: "column", flexGrow: 1, justifyContent: "space-between" }}>
                  <div>
                    <h3
                      style={{
                        margin: 0,
                        fontSize: "12px",
                        fontFamily: "'Inter', sans-serif",
                        fontWeight: 700,
                        color: "var(--color-text-primary)",
                        lineHeight: 1.3,
                        height: "32px",
                        overflow: "hidden",
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                      }}
                    >
                      {item.name}
                    </h3>
                    {item.description && (
                      <p
                        style={{
                          margin: "4px 0 0 0",
                          fontSize: "11px",
                          fontFamily: "'Inter', sans-serif",
                          color: "var(--color-text-secondary)",
                          lineHeight: 1.2,
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {item.description}
                      </p>
                    )}
                  </div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginTop: "8px",
                      paddingTop: "8px",
                      borderTop: "1px solid var(--color-line-soft)",
                    }}
                  >
                    {item.isPromoActive && item.promoPrice != null && item.promoPrice < item.price ? (
                      <div style={{ display: "flex", flexDirection: "column" }}>
                        <span style={{ fontSize: "10px", textDecoration: "line-through", opacity: 0.6, color: "var(--color-text-secondary)" }}>
                          {formatCurrency(item.price)}
                        </span>
                        <span style={{ fontSize: "13px", fontFamily: "'Inter', sans-serif", fontWeight: 800, color: "var(--color-accent)" }}>
                          {formatCurrency(item.promoPrice)}
                        </span>
                      </div>
                    ) : (
                      <span
                        style={{
                          fontSize: "13px",
                          fontFamily: "'Inter', sans-serif",
                          fontWeight: 800,
                          color: "var(--color-accent)",
                        }}
                      >
                        {formatCurrency(item.price)}
                      </span>
                    )}
                    <button
                      type="button"
                      disabled={item.isAvailable === false}
                      aria-label={item.isAvailable === false ? `${item.name} agotado` : `Agregar ${item.name} al carrito`}
                      className={`catalog-card__btn-add ${item.isAvailable === false ? "catalog-card__btn-add--disabled" : ""} ${pulsingItemIds[item.sku] ? "catalog-card__btn-add--pulse" : ""}`}
                      onClick={(e) => {
                        if (item.isAvailable === false) {
                          e.stopPropagation();
                          return;
                        }
                        handleQuickAdd(item, e);
                      }}
                    >
                      {item.isAvailable === false ? (
                        <span style={{ fontSize: "11px", fontWeight: 800 }} aria-hidden="true">✕</span>
                      ) : (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <line x1="12" y1="5" x2="12" y2="19" />
                          <line x1="5" y1="12" x2="19" y2="12" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>
    );
  }

  // 6. CATALOG (GRILLA DE CATÁLOGO)
  if (moduleType === "catalog" || moduleType === "grid") {
    const filteredItems = (activeCategoryKey === "all" || !activeCategoryKey)
      ? chekeoItems.filter((i) => i.category !== "extras")
      : chekeoItems.filter((i) => i.category === activeCategoryKey);

    const activeCategoryObj = chekeoCategories.find((c) => c.key === activeCategoryKey);
    const selectedCategoryName = (activeCategoryKey === "all" || !activeCategoryKey)
      ? "Todo"
      : activeCategoryObj?.name || activeCategoryKey;

    return (
      <section id="catalog-grid" style={{ width: "100%", marginTop: "12px", marginBottom: "16px" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "10px",
          }}
        >
          <h2
            style={{
              margin: 0,
              fontSize: "13px",
              fontFamily: "'Inter', sans-serif",
              fontWeight: 800,
              color: "var(--color-text-primary)",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <span>🍔</span> MENÚ — {selectedCategoryName.toUpperCase()}
          </h2>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 160px), 1fr))",
            gap: "12px",
          }}
        >
          {filteredItems.map((item, idx) => {
            const badgeText = item.badge || item.promoLabel;
            const assetUrl = resolveCatalogAssetUrl(item.imageUrl, item.imageKey);

            return (
              <motion.article
                key={item.sku || `cat-prod-${idx}`}
                whileTap={{ scale: 0.97 }}
                style={{
                  backgroundColor: "var(--color-surface)",
                  border: "1px solid var(--color-line-soft)",
                  borderRadius: "16px",
                  padding: "0px",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  position: "relative",
                  cursor: "pointer",
                  boxSizing: "border-box",
                  boxShadow: "var(--shadow-card)",
                  overflow: "hidden",
                  willChange: "transform",
                  transform: "translateZ(0)",
                }}
                onClick={() => onProductSelect && onProductSelect(item)}
              >
                {/* Top-left green badge pill */}
                {badgeText && (
                  <div
                    style={{
                      position: "absolute",
                      top: "10px",
                      left: "10px",
                      zIndex: 10,
                      backgroundColor: "var(--color-accent-soft)",
                      color: "var(--color-accent)",
                      border: "1px solid var(--color-accent-line)",
                      fontSize: "9px",
                      fontFamily: "'Inter', sans-serif",
                      fontWeight: 800,
                      padding: "3px 7px",
                      borderRadius: "6px",
                      textTransform: "uppercase",
                    }}
                  >
                    {badgeText}
                  </div>
                )}

                {/* Badge Qty */}
                {(() => {
                  const itemQty = cartQtyByProductId[item.sku] || 0;
                  if (itemQty > 0) {
                    return (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="catalog-card__badge-qty"
                      >
                        {itemQty}
                      </motion.div>
                    );
                  }
                  return null;
                })()}

                {/* Floating Plus Animation */}
                <AnimatePresence>
                  {pulsingItemIds[item.sku] && (
                    <div className="catalog-card__floating-plus">+1</div>
                  )}
                </AnimatePresence>

                {/* Imagen del producto */}
                <div
                  style={{
                    width: "100%",
                    aspectRatio: "4 / 3",
                    backgroundColor: "var(--color-surface-alt)",
                    borderRadius: "0px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginTop: "0px",
                    marginBottom: "0px",
                    borderBottom: "1px solid var(--color-line-soft)",
                    overflow: "hidden",
                  }}
                >
                  <CatalogImage
                    src={assetUrl || undefined}
                    alt={item.name}
                    loading="lazy"
                    fallbackSvg={
                      <div style={{ fontSize: "48px", opacity: 0.6, userSelect: "none" }}>
                        {getCategoryEmoji(item.category || "burger", item.name)}
                      </div>
                    }
                  />
                </div>

                {/* Product title & Price */}
                <div style={{ padding: "12px", display: "flex", flexDirection: "column", flexGrow: 1, justifyContent: "space-between" }}>
                  <div>
                    <h3
                      style={{
                        margin: "0 0 8px 0",
                        fontSize: "12px",
                        fontFamily: "'Inter', sans-serif",
                        fontWeight: 700,
                        color: "var(--color-text-primary)",
                        lineHeight: 1.3,
                        height: "32px",
                        overflow: "hidden",
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                      }}
                    >
                      {item.name}
                    </h3>
                    {item.description && (
                      <p
                        style={{
                          margin: "4px 0 0 0",
                          fontSize: "11px",
                          fontFamily: "'Inter', sans-serif",
                          color: "var(--color-text-secondary)",
                          lineHeight: 1.2,
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {item.description}
                      </p>
                    )}
                  </div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      paddingTop: "8px",
                      borderTop: "1px solid var(--color-line-soft)",
                    }}
                  >
                    {item.isPromoActive && item.promoPrice != null && item.promoPrice < item.price ? (
                      <div style={{ display: "flex", flexDirection: "column" }}>
                        <span style={{ fontSize: "10px", textDecoration: "line-through", opacity: 0.6, color: "var(--color-text-secondary)" }}>
                          {formatCurrency(item.price)}
                        </span>
                        <span style={{ fontSize: "14px", fontFamily: "'Inter', sans-serif", fontWeight: 800, color: "var(--color-accent)" }}>
                          {formatCurrency(item.promoPrice)}
                        </span>
                      </div>
                    ) : (
                      <span
                        style={{
                          fontSize: "14px",
                          fontFamily: "'Inter', sans-serif",
                          fontWeight: 800,
                          color: "var(--color-accent)",
                        }}
                      >
                        {formatCurrency(item.price)}
                      </span>
                    )}
                    {(() => {
                      const cartQty = cartQtyByProductId[(item as any).id || item.sku] || cartQtyByProductId[item.sku] || 0;
                      return (
                        <button
                          type="button"
                          disabled={item.isAvailable === false}
                          aria-label={item.isAvailable === false ? `${item.name} agotado` : `Agregar ${item.name}`}
                          className={`catalog-card__btn-add ${item.isAvailable === false ? "catalog-card__btn-add--disabled" : ""} ${pulsingItemIds[item.sku] ? "catalog-card__btn-add--pulse" : ""} ${cartQty > 0 ? "catalog-card__btn-add--has-qty" : ""}`}
                          onClick={(e) => {
                            if (item.isAvailable === false) {
                              e.stopPropagation();
                              return;
                            }
                            handleQuickAdd(item, e);
                          }}
                        >
                          {item.isAvailable === false ? (
                            <span style={{ fontSize: "11px", fontWeight: 800 }} aria-hidden="true">✕</span>
                          ) : cartQty > 0 ? (
                            <span style={{ fontSize: "12px", fontFamily: "'Inter', sans-serif", fontWeight: 800 }} aria-hidden="true">{cartQty}</span>
                          ) : (
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                              <line x1="12" y1="5" x2="12" y2="19" />
                              <line x1="5" y1="12" x2="19" y2="12" />
                            </svg>
                          )}
                        </button>
                      );
                    })()}
                  </div>
                </div>
              </motion.article>
            );
          })}
        </div>
      </section>
    );
  }

  // 7. CART BAR MODULE — Renderizado a través de CatalogCartBar en CatalogModeApp.tsx
  if (moduleType === "cart_bar") {
    return null;
  }

  return null;
}
