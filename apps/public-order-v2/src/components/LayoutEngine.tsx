import React, { useState, useEffect, useRef } from "react";
import type { MenuCategory, MenuItem } from "@config/index";
import type { GlobalTheme, LayoutModule } from "../types/design";
import { formatCurrency } from "../lib/order";
import {
  resolveCatalogAssetUrl,
  mapMenuItemsToCatalogProducts,
  getCategoryEmoji,
} from "../lib/catalog-mode";
import { handleAssetImageError, getCyberpunkSvgPlaceholder } from "../utils/assets";
import { useCatalogCart } from "./CatalogCartContext";
import { motion, AnimatePresence } from "framer-motion";

export interface LayoutEngineProps {
  module: LayoutModule;
  globalTheme?: GlobalTheme;
  chekeoItems?: MenuItem[];
  chekeoCategories?: MenuCategory[];
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
  isLoading = false,
  onProductSelect,
  onAction,
  activeCategoryKey = "all",
  onSelectCategory,
}: LayoutEngineProps) {
  const { addItem, count: cartCount, total: cartTotal } = useCatalogCart();
  const [bannerIndex, setBannerIndex] = useState(0);

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
    const banners = [
      {
        id: "b1",
        badge1: "DESCUENTO $0",
        badge2: "⚡ CLICK Y COPIA",
        title: "⚡ ENVÍO GRATIS $0",
        subtitle: "En tus compras mayores a $150 con código BURGER.EXE",
        icon: "🚀",
        gradient: "linear-gradient(135deg, #15803D 0%, #16A34A 100%)",
        action: () => {
          try {
            navigator.clipboard.writeText("BURGER.EXE");
          } catch { /* noop */ }
          if (onAction) onAction("TOAST:🎟️|¡Código BURGER.EXE copiado al portapapeles!");
        },
      },
      {
        id: "b2",
        badge1: "🔥 2x1 FLASH",
        badge2: "COMBO SPECIAL",
        title: "🔥 COMBO OVERCLOCK 2x1",
        subtitle: "Aprovecha 2 hamburguesas dobles al precio de 1 en Combos",
        icon: "🍔",
        gradient: "linear-gradient(135deg, #C2410C 0%, #EA580C 100%)",
        action: () => {
          if (onSelectCategory) onSelectCategory("combos");
          if (onAction) onAction("TOAST:🔥|Categoría Combos seleccionada");
        },
      },
      {
        id: "b3",
        badge1: "🎟️ RIFAS",
        badge2: "GRAN SORTEO",
        title: "🎟️ SORTEO PS5 PRO",
        subtitle: "Gana boletos gratis en cada compra superior a $200",
        icon: "🎮",
        gradient: "linear-gradient(135deg, #4338CA 0%, #6366F1 100%)",
        action: () => {
          window.location.href = "/tickets";
        },
      },
    ];

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
        <span
          style={{
            display: "block",
            fontSize: "10px",
            fontFamily: "'Inter', sans-serif",
            fontWeight: 800,
            color: "var(--color-text-muted)",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            marginBottom: "6px",
            paddingLeft: "4px",
          }}
        >
          CARRUSEL PROMOS #1
        </span>
        <div style={{ position: "relative", width: "100%", overflow: "hidden", borderRadius: "16px" }}>
          <motion.div
            key={activeBanner.id}
            initial={{ opacity: 0.7, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0.7, x: -20 }}
            transition={{ duration: 0.3 }}
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
              cursor: "pointer",
              userSelect: "none",
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

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ maxWidth: "72%" }}>
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
              </div>
              <div
                style={{
                  fontSize: "42px",
                  userSelect: "none",
                  filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.3))",
                }}
              >
                {activeBanner.icon}
              </div>
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
    const handleReorder = () => {
      if (chekeoItems.length > 0) {
        const firstItem = chekeoItems[0];
        const mapped = mapMenuItemsToCatalogProducts([firstItem], chekeoCategories)[0];
        if (mapped) addItem(mapped);
      }
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
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
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
            }}
          >
            🍔
          </div>
          <div>
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
              }}
            >
              CyberPunk Double
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
      ...chekeoCategories.map((c) => ({
        key: c.key,
        name: `${getCategoryEmoji(c.key, c.name)} ${c.name}`,
      })),
    ];

    return (
      <nav
        aria-label="Categorías"
        style={{
          width: "100%",
          position: "sticky",
          top: 0,
          zIndex: 30,
          display: "flex",
          alignItems: "center",
          gap: "8px",
          overflowX: "auto",
          paddingTop: "8px",
          paddingBottom: "8px",
          marginTop: "6px",
          marginBottom: "12px",
          backgroundColor: "var(--color-bg-base)",
          backdropFilter: "blur(8px)",
          WebkitOverflowScrolling: "touch",
        }}
      >
        {categoryPills.map((cat) => {
          const isActive = activeCategoryKey === cat.key;
          return (
            <button
              key={cat.key}
              type="button"
              style={{
                position: "relative",
                flexShrink: 0,
                padding: "8px 16px",
                borderRadius: "9999px",
                fontSize: "12px",
                fontFamily: "'Inter', sans-serif",
                fontWeight: 700,
                border: isActive ? "1px solid var(--color-accent)" : "1px solid var(--color-line)",
                backgroundColor: isActive ? "var(--color-accent)" : "var(--color-surface)",
                color: isActive ? "#FFFFFF" : "var(--color-text-primary)",
                boxShadow: isActive ? "0 2px 10px rgba(22, 163, 74, 0.25)" : "var(--shadow-card)",
                cursor: "pointer",
                transition: "all 0.2s ease",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                whiteSpace: "nowrap",
              }}
              onClick={(e) => {
                if (onSelectCategory) onSelectCategory(cat.key);
                if (onAction) onAction(`SELECT_CATEGORY:${cat.key}`);
                e.currentTarget.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
              }}
            >
              {cat.name}
            </button>
          );
        })}
      </nav>
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
                  border: "1px solid var(--color-line)",
                  borderRadius: "16px",
                  padding: "12px",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  position: "relative",
                  cursor: "pointer",
                  boxSizing: "border-box",
                  boxShadow: "var(--shadow-card)",
                }}
                onClick={() => onProductSelect && onProductSelect(item)}
              >
                {/* Badge */}
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
                    height: "108px",
                    backgroundColor: "var(--color-surface-alt)",
                    borderRadius: "12px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginTop: "8px",
                    marginBottom: "8px",
                    border: "1px solid var(--color-line-soft)",
                    overflow: "hidden",
                  }}
                >
                  {assetUrl ? (
                    <img
                      src={assetUrl}
                      alt={item.name}
                      style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "12px" }}
                      onError={(e) => handleAssetImageError(e, item.name)}
                    />
                  ) : (
                    <img
                      src={getCyberpunkSvgPlaceholder(item.name)}
                      alt={item.name}
                      style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "12px" }}
                    />
                  )}
                </div>

                {/* Info & Precio */}
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
                    <motion.button
                      type="button"
                      whileTap={{ scale: 0.85 }}
                      aria-label={`Agregar ${item.name} al carrito`}
                      style={{
                        width: "30px",
                        height: "30px",
                        borderRadius: "50%",
                        backgroundColor: "var(--color-accent-soft)",
                        border: "1px solid var(--color-accent)",
                        color: "var(--color-accent)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "16px",
                        fontWeight: "bold",
                        cursor: "pointer",
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        const mapped = mapMenuItemsToCatalogProducts([item], chekeoCategories)[0];
                        if (mapped) addItem(mapped);
                        if (onAction) onAction(`TOAST:🛒|${item.name} agregado al pedido`);
                      }}
                    >
                      +
                    </motion.button>
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
      ? chekeoItems
      : chekeoItems.filter((i) => i.category === activeCategoryKey);

    const fallbackBadges = ["🔥 TOP 1", "2x1 FLASH", "ULTRA", "CRISPY", "REFRESH"];

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
            <span>🍔</span> GRILLA DE CATÁLOGO ({activeCategoryKey === "all" || !activeCategoryKey ? "📖 Todo" : activeCategoryKey})
          </h2>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, 1fr)",
            gap: "12px",
          }}
        >
          {filteredItems.map((item, idx) => {
            const badgeText = item.badge || item.promoLabel || fallbackBadges[idx % fallbackBadges.length];
            const assetUrl = resolveCatalogAssetUrl(item.imageUrl, item.imageKey);

            return (
              <motion.article
                key={item.sku || `cat-prod-${idx}`}
                whileTap={{ scale: 0.97 }}
                style={{
                  backgroundColor: "var(--color-surface)",
                  border: "1px solid var(--color-line)",
                  borderRadius: "16px",
                  padding: "12px",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  position: "relative",
                  cursor: "pointer",
                  boxSizing: "border-box",
                  boxShadow: "var(--shadow-card)",
                }}
                onClick={() => onProductSelect && onProductSelect(item)}
              >
                {/* Top-left green badge pill */}
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
                    height: "120px",
                    backgroundColor: "var(--color-surface-alt)",
                    borderRadius: "12px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginTop: "8px",
                    marginBottom: "8px",
                    border: "1px solid var(--color-line-soft)",
                    overflow: "hidden",
                  }}
                >
                  {assetUrl ? (
                    <img
                      src={assetUrl}
                      alt={item.name}
                      style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "12px" }}
                      onError={(e) => handleAssetImageError(e, item.name)}
                    />
                  ) : (
                    <img
                      src={getCyberpunkSvgPlaceholder(item.name)}
                      alt={item.name}
                      style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "12px" }}
                    />
                  )}
                </div>

                {/* Product title & Price */}
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
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      paddingTop: "8px",
                      borderTop: "1px solid var(--color-line-soft)",
                    }}
                  >
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
                    <motion.button
                      type="button"
                      whileTap={{ scale: 0.85 }}
                      aria-label={`Agregar ${item.name}`}
                      style={{
                        width: "32px",
                        height: "32px",
                        borderRadius: "50%",
                        backgroundColor: "var(--color-accent-soft)",
                        border: "1px solid var(--color-accent)",
                        color: "var(--color-accent)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "18px",
                        fontWeight: "bold",
                        cursor: "pointer",
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        const mapped = mapMenuItemsToCatalogProducts([item], chekeoCategories)[0];
                        if (mapped) addItem(mapped);
                        if (onAction) onAction(`TOAST:🛒|${item.name} agregado al pedido`);
                      }}
                    >
                      +
                    </motion.button>
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
