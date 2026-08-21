import React from 'react';
import { useCategories, useMenuItems, useCategoryBanners } from '../../features';
import { resolveCatalogAssetUrl } from '@config/assets';
import { ProductCard } from './ProductCard';
import { FeaturedRail } from './FeaturedRail';
import { ReorderModule } from './ReorderModule';
import type { MenuCategory, MenuItem } from '@config/contracts';

export function ProductGrid() {
  const { categories, isLoading: isCategoriesLoading } = useCategories();
  const { items: allItems, isLoading: isItemsLoading } = useMenuItems();
  const { categoryBanners } = useCategoryBanners();

  const isLoading = isCategoriesLoading || isItemsLoading;

  if (isLoading) {
    return (
      <div className="w-full space-y-8 py-6">
        {[1, 2].map((section) => (
          <div key={section} className="space-y-4">
            <div className="h-7 w-48 rounded-xl bg-surface animate-pulse" />
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {[1, 2, 3].map((card) => (
                <div key={card} className="h-64 rounded-3xl bg-surface animate-pulse" />
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (categories.length === 0 && allItems.length === 0) {
    return (
      <div className="text-center py-16 px-4 bg-surface-card rounded-3xl border border-line my-6">
        <span className="text-4xl mb-2 block">🍔</span>
        <h3 className="text-lg font-bold text-text-primary">Menú en actualización</h3>
        <p className="text-sm text-text-secondary mt-1 max-w-sm mx-auto">
          Estamos preparando los mejores ingredientes. Vuelve a consultar en unos momentos.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full space-y-8 py-2 pb-28">
      {/* 1-Click Reorder Module (Visible si hay orden previa) */}
      <ReorderModule />

      {/* Top Vendidos Horizontal Rail */}
      <FeaturedRail />

      {/* Categorized Products List */}
      {categories.map((category: MenuCategory) => {
        const categoryItems = allItems.filter(
          (item: MenuItem) =>
            item.category.toLowerCase() === category.key.toLowerCase() && item.isHidden !== true
        );

        if (categoryItems.length === 0) return null;

        // Category banner (if configured)
        const banner = categoryBanners.find(
          (b) => b.categoryKey.toLowerCase() === category.key.toLowerCase()
        );
        const bannerUrl = banner
          ? resolveCatalogAssetUrl(banner.imageUrl, banner.imageKey)
          : undefined;

        return (
          <section
            key={category.id || category.key}
            id={`category-${category.key.toLowerCase()}`}
            className="space-y-4 scroll-mt-20"
          >
            {/* Category Header */}
            <div className="flex items-center justify-between gap-2 border-b border-line pb-2">
              <div className="flex items-center gap-2">
                {category.emoji && (
                  <span className="text-xl" aria-hidden="true">
                    {category.emoji}
                  </span>
                )}
                <h2 className="text-lg sm:text-xl font-extrabold text-text-primary tracking-tight">
                  {category.name}
                </h2>
              </div>
              <span className="text-xs font-bold text-text-muted bg-surface px-2.5 py-1 rounded-full border border-line">
                {categoryItems.length} {categoryItems.length === 1 ? 'ítem' : 'ítems'}
              </span>
            </div>

            {/* Optional Category Banner */}
            {banner && (banner.title || bannerUrl) && (
              <div className="relative overflow-hidden rounded-2xl bg-surface border border-line p-4 mb-2 flex items-center justify-between gap-4">
                {bannerUrl && (
                  <img
                    src={bannerUrl}
                    alt={banner.title || category.name}
                    className="absolute inset-0 w-full h-full object-cover -z-10 opacity-20"
                  />
                )}
                <div>
                  {banner.title && (
                    <h3 className="text-sm font-bold text-text-primary">{banner.title}</h3>
                  )}
                  {banner.subtitle && (
                    <p className="text-xs text-text-secondary mt-0.5">{banner.subtitle}</p>
                  )}
                </div>
              </div>
            )}

            {/* Products Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {categoryItems.map((item: MenuItem) => (
                <ProductCard key={item.sku} item={item} />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
