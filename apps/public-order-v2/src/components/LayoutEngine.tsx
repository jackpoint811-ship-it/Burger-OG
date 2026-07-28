import React, { useMemo } from "react";
import type { MenuCategory, MenuItem } from "@config/index";
import type { GlobalTheme, LayoutModule } from "../types/design";
import { formatCurrency } from "../lib/order";
import {
  getCloudflareAssetUrl,
  getCyberpunkSvgPlaceholder,
  handleAssetImageError,
} from "../utils/assets";

export interface LayoutEngineProps {
  module: LayoutModule;
  globalTheme?: GlobalTheme;
  chekeoItems?: MenuItem[];
  chekeoCategories?: MenuCategory[];
  isLoading?: boolean;
  onProductSelect?: (product: MenuItem) => void;
  onAction?: (action: string) => void;
}

export function LayoutEngine({
  module,
  globalTheme,
  chekeoItems = [],
  chekeoCategories = [],
  isLoading = false,
  onProductSelect,
  onAction,
}: LayoutEngineProps) {
  // Defensive guard: If module is null, undefined, or hidden, return null
  if (!module || typeof module !== "object" || module.visible === false) {
    return null;
  }

  // Determine layout density class with safe string guard
  const density =
    typeof module.density === "string" ? module.density : "TWO_COLUMNS";
  const getDensityContainerClass = () => {
    switch (density) {
      case "ONE_COLUMN":
        return "grid grid-cols-1 gap-4 w-full";
      case "HORIZONTAL_LIST":
        return "flex overflow-x-auto gap-3 pb-3 snap-x snap-mandatory scrollbar-none w-full";
      case "TWO_COLUMNS":
      default:
        return "grid grid-cols-2 gap-3 sm:gap-4 w-full";
    }
  };

  // Live Chekeo Content Injection & Priority Overrides with safe optional chaining & string guards
  const itemsToRender = useMemo(() => {
    const safeChekeoItems = Array.isArray(chekeoItems)
      ? chekeoItems.filter(Boolean)
      : [];
    if (safeChekeoItems.length === 0) return [];

    const safeItemRefs = Array.isArray(module.itemRefs) ? module.itemRefs : [];

    // 1. If explicit itemRefs provided, match against chekeoItems with priority override
    if (safeItemRefs.length > 0) {
      const matched: MenuItem[] = [];

      for (const ref of safeItemRefs) {
        if (!ref || typeof ref !== "string") continue;
        const refLower = ref.toLowerCase();

        const liveMatch = safeChekeoItems.find(
          (item) =>
            item &&
            (item.sku === ref ||
              item.sku?.toLowerCase() === refLower ||
              (typeof item.name === "string" && item.name.toLowerCase() === refLower))
        );

        if (liveMatch) {
          // Priority Override: Live Chekeo product data overrides static reference text
          matched.push({
            ...liveMatch,
            price: typeof liveMatch.price === "number" ? liveMatch.price : 0,
            name: liveMatch.name || "Producto",
            isAvailable: liveMatch.isAvailable !== false,
            description: liveMatch.description || "",
            imageUrl:
              liveMatch.imageUrl ||
              (typeof liveMatch.imageKey === "string" && liveMatch.imageKey
                ? getCloudflareAssetUrl(liveMatch.imageKey)
                : undefined),
          });
        }
      }
      return matched;
    }

    // 2. If categoryKey is set, filter chekeoItems by category
    const catKey =
      typeof module.categoryKey === "string"
        ? module.categoryKey.toLowerCase()
        : null;
    if (catKey) {
      return safeChekeoItems.filter(
        (item) =>
          item &&
          (item.category === module.categoryKey ||
            item.category?.toLowerCase() === catKey)
      );
    }

    // 3. If module type is FEATURED, filter by isFeatured
    const moduleType =
      typeof module.type === "string" ? module.type.toUpperCase() : "";
    if (moduleType === "FEATURED") {
      return safeChekeoItems.filter((item) => item && Boolean(item.isFeatured));
    }

    // 4. Default: Return all chekeo items
    return safeChekeoItems;
  }, [chekeoItems, module.itemRefs, module.categoryKey, module.type]);

  // Handle module click action
  const handleModuleClick = (e: React.SyntheticEvent) => {
    if (
      module.isClickable &&
      typeof module.clickAction === "string" &&
      module.clickAction &&
      onAction
    ) {
      e.stopPropagation();
      onAction(module.clickAction);
    }
  };

  // Keyboard accessibility handler for clickable module elements
  const handleModuleKeyDown = (e: React.KeyboardEvent) => {
    if (module.isClickable && (e.key === "Enter" || e.key === " ")) {
      e.preventDefault();
      handleModuleClick(e);
    }
  };

  // Inline custom module styles combined with global theme fallbacks
  const containerStyle: React.CSSProperties = {
    backgroundColor:
      (typeof module.bgColor === "string" && module.bgColor) ||
      (typeof globalTheme?.surfaceColor === "string" && globalTheme.surfaceColor) ||
      undefined,
    color:
      (typeof module.textColor === "string" && module.textColor) ||
      (typeof globalTheme?.textColor === "string" && globalTheme.textColor) ||
      undefined,
    borderRadius:
      (typeof module.borderRadius === "string" && module.borderRadius) || undefined,
    padding:
      (typeof module.padding === "string" && module.padding) || undefined,
    fontFamily:
      (typeof globalTheme?.fontFamily === "string" && globalTheme.fontFamily) ||
      undefined,
  };

  // Render skeleton loaders for pending Chekeo items or when isLoading is true
  const renderSkeletons = (count = 4) => {
    const isHorizontal = density === "HORIZONTAL_LIST";
    const safeId = module.id || "mod";
    return (
      <div className={getDensityContainerClass()}>
        {Array.from({ length: count }).map((_, idx) => (
          <div
            key={`skeleton-${safeId}-${idx}`}
            className={`animate-pulse motion-reduce:animate-none bg-[#12161c]/90 border border-zinc-800/80 rounded-xl p-3 flex flex-col justify-between ${
              isHorizontal ? "flex-shrink-0 w-64 snap-start h-56" : "h-64 w-full"
            }`}
          >
            <div className="bg-zinc-800/60 rounded-lg h-32 w-full mb-3 border border-green-500/10" />
            <div className="space-y-2">
              <div className="bg-zinc-800/70 rounded h-4 w-3/4" />
              <div className="bg-zinc-800/40 rounded h-3 w-1/2" />
            </div>
            <div className="flex justify-between items-center mt-3 pt-2 border-t border-zinc-800/50">
              <div className="bg-green-500/20 rounded h-5 w-16" />
              <div className="bg-zinc-800/80 rounded h-7 w-20" />
            </div>
          </div>
        ))}
      </div>
    );
  };

  const moduleType =
    typeof module.type === "string" ? module.type.toUpperCase() : "";
  const isModuleClickable = Boolean(module.isClickable);

  // Render Category Navigation Module
  if (moduleType === "CATEGORY_NAV") {
    const categories =
      Array.isArray(chekeoCategories) && chekeoCategories.length > 0
        ? chekeoCategories.filter(Boolean)
        : [
            { id: "1", key: "burgers", name: "Burgers", sortOrder: 1 },
            { id: "2", key: "combos", name: "Combos", sortOrder: 2 },
            { id: "3", key: "guarniciones", name: "Sides", sortOrder: 3 },
            { id: "4", key: "extras", name: "Extras", sortOrder: 4 },
            { id: "5", key: "drinks", name: "Bebidas", sortOrder: 5 },
          ];

    return (
      <section
        role={isModuleClickable ? "button" : undefined}
        tabIndex={isModuleClickable ? 0 : undefined}
        aria-label={module.title || "Navegación por categorías"}
        onKeyDown={isModuleClickable ? handleModuleKeyDown : undefined}
        className={`w-full my-4 ${
          isModuleClickable
            ? "cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00ff66] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0b0e14]"
            : ""
        }`}
        style={containerStyle}
        onClick={handleModuleClick}
      >
        {module.title && (
          <h3 className="text-sm uppercase tracking-wider font-mono font-bold text-emerald-400 mb-2 flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse motion-reduce:animate-none" />
            {module.title}
          </h3>
        )}
        <div
          role="tablist"
          aria-label="Categorías de menú"
          className="flex overflow-x-auto gap-2 pb-2 scrollbar-none snap-x"
        >
          {categories.map((cat, idx) => {
            const catKey = cat.key || `cat-${idx}`;
            const catName = cat.name || catKey;
            const moduleCatKeyLower = module.categoryKey?.toLowerCase();
            const catKeyLower = cat.key?.toLowerCase();
            const isActive = Boolean(
              module.categoryKey &&
                cat.key &&
                (module.categoryKey === cat.key || moduleCatKeyLower === catKeyLower)
            );
            return (
              <button
                key={cat.id || catKey}
                type="button"
                role="tab"
                aria-selected={isActive}
                aria-label={`Seleccionar categoría ${catName}`}
                className={`snap-start flex-shrink-0 min-h-[44px] px-4 py-2.5 rounded-lg text-xs font-mono font-semibold transition-all duration-200 border flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00ff66] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0b0e14] ${
                  isActive
                    ? "bg-emerald-500/20 border-emerald-400 text-emerald-300 shadow-[0_0_12px_rgba(0,255,102,0.25)]"
                    : "bg-zinc-900/80 border-zinc-800 text-zinc-300 hover:border-zinc-700 hover:text-white"
                }`}
                onClick={(e) => {
                  if (isModuleClickable) {
                    e.stopPropagation();
                  }
                  if (onAction && cat.key) {
                    onAction(`SELECT_CATEGORY:${cat.key}`);
                  }
                }}
              >
                {catName}
              </button>
            );
          })}
        </div>
      </section>
    );
  }

  // Render Hero Banner Module
  if (moduleType === "HERO_BANNER") {
    return (
      <section
        role={isModuleClickable ? "button" : undefined}
        tabIndex={isModuleClickable ? 0 : undefined}
        aria-label={module.title ? `Banner ${module.title}` : "Banner principal"}
        onKeyDown={isModuleClickable ? handleModuleKeyDown : undefined}
        className={`relative w-full overflow-hidden rounded-2xl border border-emerald-500/40 bg-zinc-950 p-6 my-4 text-white shadow-[0_0_20px_rgba(0,255,102,0.15)] ${
          isModuleClickable
            ? "cursor-pointer hover:border-emerald-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00ff66] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0b0e14]"
            : ""
        }`}
        style={containerStyle}
        onClick={handleModuleClick}
      >
        <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none font-mono text-6xl font-black text-emerald-500 select-none">
          EXE
        </div>
        {module.title && (
          <h2 className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-white mb-2 uppercase">
            <span className="text-emerald-400">//</span> {module.title}
          </h2>
        )}
        <p className="text-sm text-zinc-400 max-w-lg mb-4 font-sans leading-relaxed">
          Sabor cyberpunk directo a tu mesa. Ingredientes frescos, cortes de alta calidad y queso fundido.
        </p>
        <div className="flex items-center gap-3">
          <button
            type="button"
            aria-label={module.title ? `Ver catálogo de ${module.title}` : "Ver Catálogo"}
            className="min-h-[44px] min-w-[44px] px-5 py-2.5 rounded-xl bg-emerald-500 text-black font-mono font-bold text-xs uppercase tracking-wider hover:bg-emerald-400 transition-colors shadow-[0_0_15px_rgba(0,255,102,0.4)] inline-flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00ff66] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0b0e14]"
            onClick={(e) => {
              if (
                module.clickAction &&
                typeof module.clickAction === "string" &&
                onAction
              ) {
                e.stopPropagation();
                onAction(module.clickAction);
              }
            }}
          >
            Ver Catálogo
          </button>
        </div>
      </section>
    );
  }

  // Main Product Grid / Rail Renderer (BANNER_RAIL, FEATURED, CATALOG, GRID)
  return (
    <section
      role={isModuleClickable ? "button" : undefined}
      tabIndex={isModuleClickable ? 0 : undefined}
      aria-label={module.title ? `Sección ${module.title}` : "Sección de productos"}
      onKeyDown={isModuleClickable ? handleModuleKeyDown : undefined}
      className={`w-full my-6 ${
        isModuleClickable
          ? "cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00ff66] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0b0e14]"
          : ""
      }`}
      style={containerStyle}
      onClick={handleModuleClick}
    >
      {module.title && (
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-mono font-bold uppercase tracking-wide text-white flex items-center gap-2">
            <span className="text-emerald-400">//</span> {module.title}
          </h2>
          {isModuleClickable &&
            typeof module.clickAction === "string" &&
            module.clickAction && (
              <span className="text-xs font-mono text-emerald-400 hover:underline">
                Ver más &rarr;
              </span>
            )}
        </div>
      )}

      {/* Loading state: show skeletons */}
      {isLoading ? (
        renderSkeletons(
          Array.isArray(module.itemRefs) ? module.itemRefs.length || 4 : 4
        )
      ) : itemsToRender.length === 0 ? (
        // Empty state for module
        <div className="p-6 text-center border border-dashed border-zinc-800 rounded-xl bg-zinc-950/50">
          <p className="text-xs font-mono text-zinc-500">
            [SYS_MSG] No hay productos disponibles en esta sección.
          </p>
        </div>
      ) : (
        <div className={getDensityContainerClass()}>
          {itemsToRender.map((product, pIdx) => {
            if (!product) return null;
            const isHorizontal = density === "HORIZONTAL_LIST";
            const catOrName = product.category || product.name || "";
            const imageUrl =
              product.imageUrl ||
              (typeof product.imageKey === "string" && product.imageKey
                ? getCloudflareAssetUrl(product.imageKey)
                : getCyberpunkSvgPlaceholder(catOrName));

            const isAvailable = product.isAvailable !== false;
            const productName = product.name || "Producto";
            const productKey = product.sku || `prod-${pIdx}`;

            return (
              <article
                key={productKey}
                className={`group relative bg-[#0d0f12] border border-zinc-800 hover:border-emerald-500/60 rounded-xl p-3 transition-all duration-200 flex flex-col justify-between ${
                  isHorizontal ? "flex-shrink-0 w-64 snap-start" : "w-full"
                } ${!isAvailable ? "opacity-60" : ""}`}
              >
                {/* Product Badge */}
                {product.badge && (
                  <div className="absolute top-2 left-2 z-10 bg-emerald-500 text-black text-[10px] font-mono font-black px-2 py-0.5 rounded shadow">
                    {product.badge}
                  </div>
                )}

                {/* Product Image Container */}
                <div className="relative w-full h-36 mb-3 rounded-lg overflow-hidden bg-zinc-950 flex items-center justify-center border border-zinc-800/80">
                  <img
                    src={imageUrl}
                    alt={productName}
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    onError={(e) => handleAssetImageError(e, catOrName)}
                  />

                  {!isAvailable && (
                    <div className="absolute inset-0 bg-black/75 backdrop-blur-[1px] flex items-center justify-center">
                      <span className="text-xs font-mono font-bold text-red-400 uppercase tracking-widest border border-red-500/40 bg-red-950/80 px-2 py-1 rounded">
                        Agotado
                      </span>
                    </div>
                  )}
                </div>

                {/* Product Info */}
                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="text-sm font-mono font-bold text-zinc-100 group-hover:text-emerald-400 transition-colors line-clamp-1">
                      {productName}
                    </h3>
                    {product.description && (
                      <p className="text-xs text-zinc-400 mt-1 line-clamp-2 leading-relaxed">
                        {product.description}
                      </p>
                    )}
                  </div>

                  <div className="mt-3 pt-2 border-t border-zinc-800/80 flex items-center justify-between">
                    <span className="text-sm font-mono font-extrabold text-emerald-400">
                      {formatCurrency(
                        typeof product.price === "number" ? product.price : 0
                      )}
                    </span>

                    <button
                      type="button"
                      disabled={!isAvailable}
                      aria-label={
                        isAvailable
                          ? `Agregar ${productName} al pedido`
                          : `${productName} está agotado`
                      }
                      className={`min-h-[44px] min-w-[44px] px-3 py-2 rounded-lg text-xs font-mono font-bold uppercase transition-all flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00ff66] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0b0e14] ${
                        isAvailable
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/40 hover:bg-emerald-500 hover:text-black active:scale-95 cursor-pointer"
                          : "bg-zinc-800 text-zinc-500 cursor-not-allowed border border-transparent"
                      }`}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (isAvailable && onProductSelect) {
                          onProductSelect(product);
                        }
                      }}
                    >
                      {isAvailable ? "Agregar" : "Agotado"}
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

