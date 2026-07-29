import React from "react";
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

  if (!module || typeof module !== "object" || module.visible === false) {
    return null;
  }

  const moduleType = (typeof module.type === "string" ? module.type : "").toLowerCase();

  // 1. HEADER MODULE
  if (moduleType === "header") {
    return (
      <header
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          backgroundColor: "#18181b",
          color: "#00FF66",
          borderRadius: "16px",
          padding: "12px 16px",
          border: "1px solid rgba(0, 255, 102, 0.2)",
          boxShadow: "0 4px 20px rgba(0, 0, 0, 0.5)",
          boxSizing: "border-box",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "12px",
              backgroundColor: "rgba(0, 255, 102, 0.1)",
              border: "1px solid rgba(0, 255, 102, 0.3)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "20px",
            }}
          >
            🍔
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <h1
                style={{
                  margin: 0,
                  fontSize: "14px",
                  fontFamily: "monospace",
                  fontWeight: 900,
                  color: "#FFFFFF",
                  letterSpacing: "0.05em",
                  textTransform: "uppercase",
                }}
              >
                BURGERS<span style={{ color: "#00FF66" }}>.EXE</span>
              </h1>
              <span
                style={{
                  fontSize: "10px",
                  fontFamily: "monospace",
                  fontWeight: 700,
                  padding: "2px 6px",
                  borderRadius: "4px",
                  backgroundColor: "rgba(255, 183, 3, 0.2)",
                  border: "1px solid rgba(255, 183, 3, 0.4)",
                  color: "#FFB703",
                }}
              >
                ONLINE
              </span>
            </div>
            <p
              style={{
                margin: "2px 0 0 0",
                fontSize: "11px",
                fontFamily: "monospace",
                color: "#00FF66",
                opacity: 0.8,
              }}
            >
              {module.subtitle || "Ready to play?"}
            </p>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <button
            type="button"
            style={{
              position: "relative",
              width: "40px",
              height: "40px",
              borderRadius: "12px",
              backgroundColor: "#18181b",
              border: "1px solid #27272a",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "18px",
              cursor: "pointer",
            }}
            onClick={() => onAction && onAction("OPEN_CART")}
            aria-label="Abrir carrito"
          >
            🛒
            {cartCount > 0 && (
              <span
                style={{
                  position: "absolute",
                  top: "-4px",
                  right: "-4px",
                  width: "14px",
                  height: "14px",
                  borderRadius: "50%",
                  backgroundColor: "#DC2626",
                  border: "2px solid #121212",
                }}
              />
            )}
          </button>
        </div>
      </header>
    );
  }

  // 2. BANNER CAROUSEL 1 (PROMO BANNERS)
  if (moduleType === "banner_carousel_1" || moduleType === "banner_carousel") {
    return (
      <section style={{ width: "100%", marginTop: "12px", marginBottom: "12px" }}>
        <div
          style={{
            width: "100%",
            borderRadius: "16px",
            padding: "20px",
            position: "relative",
            overflow: "hidden",
            background: "linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)",
            boxShadow: "0 8px 24px rgba(37, 99, 235, 0.25)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            boxSizing: "border-box",
            cursor: module.isClickable ? "pointer" : "default",
          }}
          onClick={() => module.isClickable && onAction && onAction(module.clickAction || "BANNER_CLICK")}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
            <span
              style={{
                backgroundColor: "rgba(0, 0, 0, 0.35)",
                color: "#FFFFFF",
                fontSize: "10px",
                fontFamily: "monospace",
                fontWeight: 800,
                padding: "4px 8px",
                borderRadius: "6px",
                border: "1px solid rgba(255, 255, 255, 0.2)",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              DESCUENTO $0
            </span>
            <span
              style={{
                backgroundColor: "rgba(0, 255, 102, 0.2)",
                color: "#00FF66",
                fontSize: "10px",
                fontFamily: "monospace",
                fontWeight: 800,
                padding: "4px 8px",
                borderRadius: "6px",
                border: "1px solid rgba(0, 255, 102, 0.4)",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              ⚡ CLICK
            </span>
          </div>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ maxWidth: "70%" }}>
              <h2
                style={{
                  margin: 0,
                  fontSize: "18px",
                  fontFamily: "monospace",
                  fontWeight: 900,
                  color: "#FFFFFF",
                  letterSpacing: "-0.02em",
                  lineHeight: 1.2,
                }}
              >
                ⚡ ENVÍO GRATIS $0
              </h2>
              <p
                style={{
                  margin: "6px 0 0 0",
                  fontSize: "12px",
                  fontFamily: "sans-serif",
                  color: "rgba(255, 255, 255, 0.9)",
                  lineHeight: 1.3,
                }}
              >
                En tus compras mayores a $150 con código BURGER.EXE
              </p>
            </div>
            <div
              style={{
                fontSize: "44px",
                userSelect: "none",
                filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.3))",
              }}
            >
              🚀
            </div>
          </div>

          {/* 3 dots indicator */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", marginTop: "14px" }}>
            <span style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "rgba(255, 255, 255, 0.3)" }} />
            <span style={{ width: "12px", height: "8px", borderRadius: "4px", backgroundColor: "#00FF66", boxShadow: "0 0 8px #00FF66" }} />
            <span style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "rgba(255, 255, 255, 0.3)" }} />
          </div>
        </div>
      </section>
    );
  }

  // 3. REORDER MODULE (1-CLICK REORDER)
  if (moduleType === "reorder") {
    return (
      <section
        style={{
          width: "100%",
          marginTop: "12px",
          marginBottom: "12px",
          backgroundColor: "#18181b",
          borderRadius: "16px",
          padding: "14px 16px",
          border: "1px solid #27272a",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          boxSizing: "border-box",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div
            style={{
              width: "44px",
              height: "44px",
              borderRadius: "12px",
              backgroundColor: "rgba(249, 115, 22, 0.12)",
              border: "1px solid rgba(249, 115, 22, 0.3)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "22px",
            }}
          >
            🍔
          </div>
          <div>
            <span
              style={{
                fontSize: "11px",
                fontFamily: "monospace",
                fontWeight: 800,
                color: "#F97316",
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
                fontFamily: "monospace",
                fontWeight: 900,
                color: "#FFFFFF",
              }}
            >
              CyberPunk Double
            </h3>
            <p
              style={{
                margin: "2px 0 0 0",
                fontSize: "11px",
                fontFamily: "monospace",
                color: "#A1A1AA",
              }}
            >
              Repetir último pedido
            </p>
          </div>
        </div>

        <button
          type="button"
          style={{
            padding: "10px 18px",
            borderRadius: "12px",
            backgroundColor: "#F97316",
            color: "#000000",
            fontFamily: "monospace",
            fontWeight: 900,
            fontSize: "12px",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            border: "none",
            cursor: "pointer",
            boxShadow: "0 0 12px rgba(249, 115, 22, 0.4)",
            transition: "transform 0.15s ease, background-color 0.15s ease",
          }}
          onClick={() => onAction && onAction("REORDER_CLICK")}
        >
          PEDIR
        </button>
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
          marginTop: "8px",
          marginBottom: "8px",
          backgroundColor: "#0B0B0B",
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
                flexShrink: 0,
                padding: "8px 16px",
                borderRadius: "9999px",
                fontSize: "12px",
                fontFamily: "monospace",
                fontWeight: 700,
                border: isActive ? "1px solid #00FF66" : "1px solid #27272a",
                backgroundColor: isActive ? "#00FF66" : "#18181b",
                color: isActive ? "#000000" : "#FFFFFF",
                boxShadow: isActive ? "0 0 12px rgba(0, 255, 102, 0.4)" : "none",
                cursor: "pointer",
                transition: "all 0.2s ease",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                whiteSpace: "nowrap",
              }}
              onClick={() => {
                if (onSelectCategory) {
                  onSelectCategory(cat.key);
                }
                if (onAction) {
                  onAction(`SELECT_CATEGORY:${cat.key}`);
                }
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
      <section style={{ width: "100%", marginTop: "16px", marginBottom: "16px" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "12px",
          }}
        >
          <h2
            style={{
              margin: 0,
              fontSize: "14px",
              fontFamily: "monospace",
              fontWeight: 900,
              color: "#FFFFFF",
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
              <div
                key={item.sku || `feat-${idx}`}
                style={{
                  flexShrink: 0,
                  width: "176px",
                  backgroundColor: "#18181b",
                  border: "1px solid #27272a",
                  borderRadius: "16px",
                  padding: "12px",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  position: "relative",
                  cursor: "pointer",
                  boxSizing: "border-box",
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
                    backgroundColor: "#00FF66",
                    color: "#000000",
                    fontSize: "9px",
                    fontFamily: "monospace",
                    fontWeight: 900,
                    padding: "2px 8px",
                    borderRadius: "6px",
                    boxShadow: "0 2px 4px rgba(0,0,0,0.4)",
                    textTransform: "uppercase",
                  }}
                >
                  {badgeText}
                </div>

                {/* Center R2 product image in #09090b container */}
                <div
                  style={{
                    width: "100%",
                    height: "112px",
                    backgroundColor: "#09090b",
                    borderRadius: "12px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginTop: "8px",
                    marginBottom: "8px",
                    border: "1px solid rgba(255,255,255,0.05)",
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

                {/* Info & Price */}
                <div>
                  <h3
                    style={{
                      margin: 0,
                      fontSize: "12px",
                      fontFamily: "monospace",
                      fontWeight: 700,
                      color: "#FFFFFF",
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
                      borderTop: "1px solid #27272a",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "13px",
                        fontFamily: "monospace",
                        fontWeight: 900,
                        color: "#00FF66",
                      }}
                    >
                      {formatCurrency(item.price)}
                    </span>
                    <button
                      type="button"
                      aria-label={`Agregar ${item.name} al carrito`}
                      style={{
                        width: "30px",
                        height: "30px",
                        borderRadius: "50%",
                        backgroundColor: "rgba(0, 255, 102, 0.1)",
                        border: "1px solid #00FF66",
                        color: "#00FF66",
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
                      }}
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
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
      <section style={{ width: "100%", marginTop: "16px", marginBottom: "16px" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "12px",
          }}
        >
          <h2
            style={{
              margin: 0,
              fontSize: "14px",
              fontFamily: "monospace",
              fontWeight: 900,
              color: "#FFFFFF",
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
              <article
                key={item.sku || `cat-prod-${idx}`}
                style={{
                  backgroundColor: "#18181b",
                  border: "1px solid #27272a",
                  borderRadius: "16px",
                  padding: "12px",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  position: "relative",
                  cursor: "pointer",
                  boxSizing: "border-box",
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
                    backgroundColor: "#00FF66",
                    color: "#000000",
                    fontSize: "9px",
                    fontFamily: "monospace",
                    fontWeight: 900,
                    padding: "2px 8px",
                    borderRadius: "6px",
                    boxShadow: "0 2px 4px rgba(0,0,0,0.4)",
                    textTransform: "uppercase",
                  }}
                >
                  {badgeText}
                </div>

                {/* Center R2 product image in #09090b container */}
                <div
                  style={{
                    width: "100%",
                    height: "128px",
                    backgroundColor: "#09090b",
                    borderRadius: "12px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginTop: "8px",
                    marginBottom: "8px",
                    border: "1px solid rgba(255,255,255,0.05)",
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

                {/* Product title (white) & Price in neon green #00FF66 with (+) button */}
                <div>
                  <h3
                    style={{
                      margin: "0 0 8px 0",
                      fontSize: "12px",
                      fontFamily: "monospace",
                      fontWeight: 700,
                      color: "#FFFFFF",
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
                      borderTop: "1px solid #27272a",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "14px",
                        fontFamily: "monospace",
                        fontWeight: 900,
                        color: "#00FF66",
                      }}
                    >
                      {formatCurrency(item.price)}
                    </span>
                    <button
                      type="button"
                      aria-label={`Agregar ${item.name}`}
                      style={{
                        width: "32px",
                        height: "32px",
                        borderRadius: "50%",
                        backgroundColor: "rgba(0, 255, 102, 0.1)",
                        border: "1px solid #00FF66",
                        color: "#00FF66",
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
                      }}
                    >
                      +
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    );
  }

  // 7. CART BAR MODULE (BARRA CARRITO FLOTANTE)
  if (moduleType === "cart_bar") {
    if (cartCount === 0) return null;

    return (
      <aside
        style={{
          position: "fixed",
          bottom: "12px",
          left: "12px",
          right: "12px",
          maxWidth: "430px",
          margin: "0 auto",
          zIndex: 40,
          backgroundColor: "#00FF66",
          color: "#000000",
          borderRadius: "16px",
          padding: "14px 16px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          boxShadow: "0 8px 32px rgba(0, 255, 102, 0.35)",
          cursor: "pointer",
          boxSizing: "border-box",
        }}
        onClick={() => onAction && onAction("OPEN_CHECKOUT")}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div
            style={{
              width: "32px",
              height: "32px",
              borderRadius: "50%",
              backgroundColor: "#000000",
              color: "#00FF66",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: "monospace",
              fontWeight: 900,
              fontSize: "14px",
            }}
          >
            {cartCount}
          </div>
          <div>
            <span
              style={{
                fontSize: "11px",
                fontFamily: "monospace",
                fontWeight: 900,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                display: "block",
              }}
            >
              MI PEDIDO
            </span>
            <span
              style={{
                fontSize: "14px",
                fontFamily: "monospace",
                fontWeight: 900,
                color: "#000000",
              }}
            >
              {formatCurrency(cartTotal)}
            </span>
          </div>
        </div>

        <button
          type="button"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            fontSize: "12px",
            fontFamily: "monospace",
            fontWeight: 900,
            textTransform: "uppercase",
            backgroundColor: "#000000",
            color: "#00FF66",
            padding: "8px 16px",
            borderRadius: "12px",
            border: "none",
            cursor: "pointer",
            boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
          }}
        >
          Checkout &rarr;
        </button>
      </aside>
    );
  }

  return null;
}
