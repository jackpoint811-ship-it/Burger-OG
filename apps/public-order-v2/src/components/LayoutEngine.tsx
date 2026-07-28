import React, { useMemo } from "react";
import type { MenuCategory, MenuItem } from "@config/index";
import type { GlobalTheme, LayoutModule } from "../types/design";
import { formatCurrency } from "../lib/order";
import { getCloudflareAssetUrl, handleAssetImageError } from "../utils/assets";

export interface LayoutEngineProps {
  module: LayoutModule;
  globalTheme?: GlobalTheme;
  chekeoItems?: MenuItem[];
  chekeoCategories?: MenuCategory[];
  isLoading?: boolean;
  onProductSelect?: (product: MenuItem) => void;
  onAction?: (action: string) => void;
}

const DEFAULT_BADGES: Record<string, string> = {
  b1: "2x1 FLASH",
  b2: "COMBO VIP",
  b3: "ENVÍO $0",
  "cyberpunk-double": "TOP 1",
  "matrix-bacon": "2x1 FLASH",
  "overclock-triple": "ULTRA",
  "papas-crisscross": "CRISPY",
  "nuggets-rgb": "GLITCH",
  "monster-refresher": "REFRESH",
  "controller-coop": "MEJOR VALOR",
};

const DEFAULT_CATALOG_MOCK_ITEMS = [
  { sku: "cyberpunk-double", name: "CyberPunk Double Patty .EXE", price: 189, badge: "🔥 TOP 1", emoji: "🍔" },
  { sku: "matrix-bacon", name: "Matrix Bacon & Jalapeño", price: 165, badge: "2x1 FLASH", emoji: "🥓" },
  { sku: "overclock-triple", name: "Overclock Triple Melt", price: 219, badge: "ULTRA", emoji: "🔥" },
  { sku: "papas-crisscross", name: "Papas Gamer CrissCross Ne...", price: 85, badge: "CRISPY", emoji: "🍟" },
  { sku: "nuggets-rgb", name: "Nuggets RGB Glitch (10 Pzs)", price: 129, badge: "GLITCH", emoji: "🍗" },
  { sku: "monster-refresher", name: "Monster Energy Refresher S...", price: 79, badge: "REFRESH", emoji: "🥤" },
];

export function LayoutEngine({
  module,
  globalTheme,
  chekeoItems = [],
  chekeoCategories = [],
  isLoading = false,
  onProductSelect,
  onAction,
}: LayoutEngineProps) {
  if (!module || typeof module !== "object" || module.visible === false) {
    return null;
  }

  const moduleType = (typeof module.type === "string" ? module.type : "").toLowerCase();

  const containerStyle: React.CSSProperties = {
    backgroundColor: typeof module.bgColor === "string" ? module.bgColor : "#121212",
    color: typeof module.textColor === "string" ? module.textColor : "#00FF66",
    borderRadius: module.borderRadius ? `${module.borderRadius}px` : "16px",
    padding: module.padding ? `${module.padding}px` : "12px",
  };

  // 1. HEADER MODULE
  if (moduleType === "header") {
    return (
      <header
        className="w-full flex items-center justify-between border border-[#00FF66]/20 shadow-[0_4px_20px_rgba(0,0,0,0.5)] my-2"
        style={containerStyle}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#00FF66]/10 border border-[#00FF66]/30 flex items-center justify-center text-xl shadow-[0_0_10px_rgba(0,255,102,0.2)]">
            🍔
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-mono font-black text-white tracking-wide uppercase">
                BURGERS<span className="text-[#00FF66]">.EXE</span>
              </h1>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-[#FFB703]/20 border border-[#FFB703]/40 text-[#FFB703]">
                7 MÓDULOS
              </span>
            </div>
            <p className="text-xs font-mono text-[#00FF66] opacity-80 mt-0.5">
              {module.subtitle || "Ready to play?"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            className="px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs font-mono text-zinc-300 flex items-center gap-1.5 hover:border-zinc-700"
            onClick={() => onAction && onAction("TOGGLE_EDITION")}
          >
            <span>🔧</span> Edición
          </button>
          <button
            type="button"
            className="px-3 py-1.5 rounded-lg bg-[#00FF66] text-black font-mono font-bold text-xs flex items-center gap-1.5 shadow-[0_0_12px_rgba(0,255,102,0.4)]"
            onClick={() => onAction && onAction("TOGGLE_PREVIEW")}
          >
            <span>📱</span> Preview
          </button>
          <div className="relative ml-1">
            <button
              type="button"
              className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-lg relative"
              onClick={() => onAction && onAction("OPEN_CART")}
            >
              🛒
              <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-red-500 border-2 border-[#121212]" />
            </button>
          </div>
        </div>
      </header>
    );
  }

  // 2. BANNER CAROUSEL 1 (PROMO BANNERS)
  if (moduleType === "banner_carousel_1" || moduleType === "banner_carousel") {
    return (
      <section className="w-full my-3" style={containerStyle}>
        <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-zinc-400 mb-2">
          {module.title || "CARRUSEL PROMOS #1"}
        </div>
        <div
          className={`relative w-full rounded-2xl p-5 overflow-hidden shadow-lg border border-orange-500/30 transition-transform ${
            module.isClickable ? "cursor-pointer hover:scale-[0.99]" : ""
          }`}
          style={{
            background: "linear-gradient(135deg, #E65100 0%, #F57C00 50%, #FF8F00 100%)",
          }}
          onClick={() => module.isClickable && onAction && onAction(module.clickAction || "BANNER_CLICK")}
        >
          <div className="inline-block bg-black/40 backdrop-blur-md px-3 py-1 rounded-md text-[10px] font-mono font-black text-amber-300 border border-amber-400/40 uppercase tracking-wide mb-2">
            COMBO VIP
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-1 max-w-[70%]">
              <h2 className="text-lg font-mono font-black text-white tracking-tight flex items-center gap-2">
                <span>🎮</span> BUNDLE GAMER NIGHT
              </h2>
              <p className="text-xs text-orange-100/90 font-sans leading-snug">
                Burger + Papas + Bebida + 2 Tickets de Sorteo
              </p>
            </div>
            <div className="text-5xl filter drop-shadow-[0_4px_8px_rgba(0,0,0,0.4)] select-none">
              🕹️
            </div>
          </div>

          {/* Indicator dots */}
          <div className="flex items-center justify-center gap-1.5 mt-4">
            <span className="w-2 h-2 rounded-full bg-black/40" />
            <span className="w-3 h-2 rounded-full bg-[#00FF66] shadow-[0_0_8px_#00FF66]" />
            <span className="w-2 h-2 rounded-full bg-black/40" />
          </div>
        </div>
      </section>
    );
  }

  // 3. REORDER MODULE (1-CLICK REORDER)
  if (moduleType === "reorder") {
    return (
      <section
        className="w-full my-3 flex items-center justify-between border border-[#00FF66]/20"
        style={containerStyle}
      >
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-2xl">
            🍔
          </div>
          <div>
            <span className="text-[11px] font-mono font-bold text-amber-400 block uppercase">
              1-Click Reorder
            </span>
            <h3 className="text-sm font-mono font-black text-white">
              CyberPunk Double
            </h3>
            <p className="text-xs font-mono text-zinc-400">Repetir último pedido</p>
          </div>
        </div>

        <button
          type="button"
          className="px-5 py-2.5 rounded-xl bg-[#FF8F00] text-black font-mono font-black text-xs uppercase tracking-wider shadow-[0_0_12px_rgba(255,143,0,0.4)] hover:bg-amber-400 active:scale-95 transition-all"
          onClick={() => onAction && onAction("REORDER_CLICK")}
        >
          PEDIR
        </button>
      </section>
    );
  }

  // 4. CATEGORIES HORIZONTAL / STICKY NAV
  if (moduleType === "categories_horizontal" || moduleType === "categories_sticky") {
    const categories = [
      { key: "all", name: "📖 Todo" },
      { key: "combos", name: "🔥 Combos" },
      { key: "burgers", name: "🍔 Burgers" },
      { key: "sides", name: "🍟 Guarniciones" },
      { key: "drinks", name: "🥤 Bebidas" },
      { key: "desserts", name: "🍦 Postres" },
    ];

    return (
      <nav
        aria-label="Categorías"
        className="w-full sticky top-0 z-30 flex items-center gap-2 overflow-x-auto py-2 scrollbar-none snap-x my-2"
        style={{ backgroundColor: "#0B0B0B" }}
      >
        {categories.map((cat, idx) => {
          const isSelected = idx === 0;
          return (
            <button
              key={cat.key}
              type="button"
              className={`snap-start flex-shrink-0 px-4 py-2 rounded-full text-xs font-mono font-bold transition-all duration-200 border flex items-center gap-1.5 ${
                isSelected
                  ? "bg-[#00FF66] text-black border-[#00FF66] shadow-[0_0_12px_rgba(0,255,102,0.4)]"
                  : "bg-[#18181b] text-zinc-300 border-zinc-800 hover:border-zinc-700"
              }`}
              onClick={() => onAction && onAction(`SELECT_CATEGORY:${cat.key}`)}
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
    const featuredItems = chekeoItems.length > 0
      ? chekeoItems.filter((i) => i.isAvailable !== false).slice(0, 4)
      : DEFAULT_CATALOG_MOCK_ITEMS.slice(0, 3);

    return (
      <section className="w-full my-4" style={containerStyle}>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-mono font-black text-white uppercase tracking-wider flex items-center gap-1.5">
            <span>⭐</span> TOP VENDIDOS (MÁS PEDIDOS)
          </h2>
          <button
            type="button"
            className="text-xs font-mono text-[#00FF66] hover:underline"
            onClick={() => onAction && onAction("VIEW_ALL_FEATURED")}
          >
            Ver todos
          </button>
        </div>

        <div className="flex overflow-x-auto gap-3 pb-2 scrollbar-none snap-x">
          {featuredItems.map((item, idx) => {
            const badge = DEFAULT_BADGES[item.sku] || (idx === 0 ? "🔥 TOP 1" : idx === 1 ? "2x1 FLASH" : "ULTRA");
            const price = typeof item.price === "number" ? item.price : 189;
            const emoji = (item as any).emoji || "🍔";

            return (
              <div
                key={item.sku || `feat-${idx}`}
                className="snap-start flex-shrink-0 w-44 bg-[#18181b] border border-zinc-800 hover:border-[#00FF66]/50 rounded-2xl p-3 flex flex-col justify-between transition-all relative group cursor-pointer"
                onClick={() => onProductSelect && onProductSelect(item as MenuItem)}
              >
                {/* Badge */}
                <div className="absolute top-2 left-2 z-10 bg-[#00FF66] text-black text-[9px] font-mono font-black px-2 py-0.5 rounded-md shadow">
                  {badge}
                </div>

                {/* Graphic */}
                <div className="w-full h-28 bg-[#09090b] rounded-xl flex items-center justify-center text-4xl my-2 border border-zinc-800/80 group-hover:scale-105 transition-transform">
                  {(item as any).imageUrl ? (
                    <img src={(item as any).imageUrl} alt={item.name} className="w-full h-full object-cover rounded-xl" onError={(e) => handleAssetImageError(e, item.name)} />
                  ) : (
                    <span>{emoji}</span>
                  )}
                </div>

                {/* Info */}
                <div>
                  <h3 className="text-xs font-mono font-bold text-white line-clamp-2 min-h-[32px] leading-tight">
                    {item.name}
                  </h3>
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-zinc-800">
                    <span className="text-xs font-mono font-black text-[#00FF66]">
                      {formatCurrency(price)}
                    </span>
                    <button
                      type="button"
                      className="w-7 h-7 rounded-full bg-[#00FF66]/10 border border-[#00FF66] text-[#00FF66] flex items-center justify-center text-sm font-bold hover:bg-[#00FF66] hover:text-black transition-colors"
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
    const catalogProducts = chekeoItems.length > 0
      ? chekeoItems
      : DEFAULT_CATALOG_MOCK_ITEMS;

    return (
      <section className="w-full my-4" style={containerStyle}>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-mono font-black text-white uppercase tracking-wider flex items-center gap-1.5">
            <span>🍔</span> GRILLA DE CATÁLOGO (📖 Todo)
          </h2>
          <button
            type="button"
            className="px-3 py-1 rounded-lg bg-[#00FF66]/10 border border-[#00FF66]/40 text-[#00FF66] text-[10px] font-mono font-bold uppercase flex items-center gap-1"
            onClick={() => onAction && onAction("TOGGLE_EDIT_MODE")}
          >
            <span>🔧</span> MODO EDICIÓN
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {catalogProducts.map((item, idx) => {
            const badge = DEFAULT_BADGES[item.sku] || (idx === 0 ? "🔥 TOP 1" : idx === 1 ? "2x1 FLASH" : idx === 2 ? "ULTRA" : idx === 3 ? "CRISPY" : "REFRESH");
            const price = typeof item.price === "number" ? item.price : 165;
            const emoji = (item as any).emoji || (idx % 2 === 0 ? "🍔" : "🥓");

            return (
              <article
                key={item.sku || `cat-prod-${idx}`}
                className="bg-[#18181b] border border-zinc-800 hover:border-[#00FF66]/50 rounded-2xl p-3 flex flex-col justify-between transition-all relative group cursor-pointer"
                onClick={() => onProductSelect && onProductSelect(item as MenuItem)}
              >
                {/* Top Badge */}
                <div className="absolute top-2.5 left-2.5 z-10 bg-[#00FF66] text-black text-[9px] font-mono font-black px-2 py-0.5 rounded-md shadow">
                  {badge}
                </div>

                {/* Item Graphic */}
                <div className="w-full h-32 bg-[#09090b] rounded-xl flex items-center justify-center text-5xl my-2 border border-zinc-800/80 group-hover:scale-105 transition-transform">
                  {(item as any).imageUrl ? (
                    <img src={(item as any).imageUrl} alt={item.name} className="w-full h-full object-cover rounded-xl" onError={(e) => handleAssetImageError(e, item.name)} />
                  ) : (
                    <span>{emoji}</span>
                  )}
                </div>

                {/* Product Name & Price */}
                <div>
                  <h3 className="text-xs font-mono font-bold text-white line-clamp-2 min-h-[32px] leading-tight mb-2">
                    {item.name}
                  </h3>
                  <div className="flex items-center justify-between pt-2 border-t border-zinc-800/80">
                    <span className="text-sm font-mono font-black text-[#00FF66]">
                      {formatCurrency(price)}
                    </span>
                    <button
                      type="button"
                      aria-label={`Agregar ${item.name}`}
                      className="w-8 h-8 rounded-full bg-[#00FF66]/10 border border-[#00FF66] text-[#00FF66] flex items-center justify-center text-base font-bold hover:bg-[#00FF66] hover:text-black transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onProductSelect) onProductSelect(item as MenuItem);
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
    return (
      <aside
        className="fixed bottom-3 left-3 right-3 z-40 bg-[#00FF66] text-black rounded-2xl p-3.5 flex items-center justify-between shadow-[0_8px_32px_rgba(0,255,102,0.35)] cursor-pointer hover:bg-[#22C55E] transition-all"
        onClick={() => onAction && onAction("OPEN_CHECKOUT")}
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-black text-[#00FF66] flex items-center justify-center font-mono font-black text-sm">
            1
          </div>
          <div>
            <span className="text-xs font-mono font-black uppercase tracking-wider block">
              MI PEDIDO
            </span>
            <span className="text-sm font-mono font-black text-black">
              $189 MXN
            </span>
          </div>
        </div>

        <button
          type="button"
          className="flex items-center gap-2 text-xs font-mono font-black uppercase bg-black text-[#00FF66] px-4 py-2 rounded-xl shadow"
        >
          Checkout &rarr;
        </button>
      </aside>
    );
  }

  return null;
}
