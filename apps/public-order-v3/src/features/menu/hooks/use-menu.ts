/**
 * use-menu.ts — PR-V3-05
 *
 * Hooks de TanStack Query para catálogo, menú, categorías, productos y recetas.
 */

import { useQuery } from '@tanstack/react-query';
import type {
  MenuCategory,
  MenuItem,
  MenuV2Response,
  PromoCard,
  PublicConfig,
  SiteConfig,
} from '@config/index';
import { fetchMenu } from '../api/menu.api';

export const menuKeys = {
  all: ['menu'] as const,
  lists: () => [...menuKeys.all, 'list'] as const,
  details: () => [...menuKeys.all, 'detail'] as const,
  detail: (sku: string) => [...menuKeys.details(), sku] as const,
};

/**
 * Hook principal para cargar el menú y catálogo completo con TanStack Query.
 */
export function useMenuQuery(options?: { enabled?: boolean }) {
  return useQuery<MenuV2Response, Error>({
    queryKey: menuKeys.all,
    queryFn: fetchMenu,
    staleTime: 1000 * 60 * 5, // 5 minutos de caché fresca
    gcTime: 1000 * 60 * 15, // 15 minutos en recolección de basura
    enabled: options?.enabled ?? true,
  });
}

/**
 * Hook selector para obtener categorías ordenadas por sortOrder.
 */
export function useCategories() {
  const query = useMenuQuery();
  const categories: MenuCategory[] = query.data?.categories
    ? [...query.data.categories].sort((a, b) => a.sortOrder - b.sortOrder)
    : [];

  return {
    ...query,
    categories,
  };
}

/**
 * Hook selector para obtener los ítems del menú, opcionalmente filtrados por categoría.
 */
export function useMenuItems(categoryKey?: string) {
  const query = useMenuQuery();
  const allItems: MenuItem[] = query.data?.items
    ? [...query.data.items].sort((a, b) => a.sortOrder - b.sortOrder)
    : [];

  const items = categoryKey
    ? allItems.filter((item) => item.category.toLowerCase() === categoryKey.toLowerCase())
    : allItems;

  return {
    ...query,
    items,
  };
}

/**
 * Hook selector para obtener productos destacados (Top Vendidos / Recomendados).
 */
export function useFeaturedItems() {
  const query = useMenuQuery();
  const featuredItems: MenuItem[] = (query.data?.items ?? [])
    .filter((item) => item.isFeatured && item.isAvailable)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  return {
    ...query,
    featuredItems,
  };
}

/**
 * Hook selector para buscar un producto específico por SKU.
 */
export function useMenuItem(sku?: string) {
  const query = useMenuQuery();
  const item: MenuItem | undefined = sku
    ? query.data?.items?.find((i) => i.sku.toUpperCase() === sku.toUpperCase())
    : undefined;

  return {
    ...query,
    item,
  };
}

/**
 * Hook selector para obtener las tarjetas de promociones activas.
 */
export function usePromos() {
  const query = useMenuQuery();
  const promos: PromoCard[] = query.data?.promos
    ? [...query.data.promos].sort((a, b) => a.sortOrder - b.sortOrder)
    : [];

  return {
    ...query,
    promos,
  };
}

/**
 * Hook selector para obtener la configuración general de la tienda/sitio.
 */
export function useSiteConfig() {
  const query = useMenuQuery();
  const siteConfig: SiteConfig | undefined = query.data?.siteConfig;

  return {
    ...query,
    siteConfig,
  };
}

/**
 * Hook selector para obtener la configuración pública (modo catálogo/flujo).
 */
export function usePublicConfig() {
  const query = useMenuQuery();
  const publicConfig: PublicConfig | undefined = query.data?.publicConfig;

  return {
    ...query,
    publicConfig,
  };
}

/**
 * Hook selector para obtener los ingredientes/receta de un producto según su SKU.
 */
export function useItemRecipe(sku?: string): string[] {
  const query = useMenuQuery();
  if (!sku || !query.data?.recipes) return [];
  return query.data.recipes[sku] ?? query.data.recipes[sku.toUpperCase()] ?? [];
}
