/**
 * use-banners.ts — PR-V3-05
 *
 * Hooks para banners promocionales de catálogo y banners por categoría.
 */

import type { CatalogBanner, MenuCategoryBanner } from '@config/index';
import { useMenuQuery } from '../../menu/hooks/use-menu';

/**
 * Hook para obtener los banners principales del carrusel de catálogo.
 */
export function useCatalogBanners() {
  const query = useMenuQuery();
  const catalogBanners: CatalogBanner[] = (query.data?.catalogBanners ?? [])
    .filter((banner) => banner.isActive !== false)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  return {
    ...query,
    catalogBanners,
  };
}

/**
 * Hook para obtener el banner correspondiente a una categoría específica.
 */
export function useCategoryBanner(categoryKey?: string) {
  const query = useMenuQuery();
  const categoryBanner: MenuCategoryBanner | undefined = categoryKey
    ? query.data?.categoryBanners?.find(
        (b) => b.categoryKey.toLowerCase() === categoryKey.toLowerCase()
      )
    : undefined;

  return {
    ...query,
    categoryBanner,
  };
}

/**
 * Hook para obtener todos los banners de categorías disponibles.
 */
export function useCategoryBanners() {
  const query = useMenuQuery();
  const categoryBanners: MenuCategoryBanner[] = query.data?.categoryBanners ?? [];

  return {
    ...query,
    categoryBanners,
  };
}
