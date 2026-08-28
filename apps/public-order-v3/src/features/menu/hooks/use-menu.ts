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
    ? [...query.data.categories]
        .filter((cat) => cat.key.toLowerCase() !== 'extras')
        .sort((a, b) => a.sortOrder - b.sortOrder)
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
 * Recetas canónicas de producción de respaldo para asegurar que todas las burgers
 * y combos muestren sus ingredientes removibles sin importar variaciones de SKU.
 */
export const CANONICAL_BURGER_RECIPES: Record<string, string[]> = {
  OG: [
    'Pan Bimbollo parrillero',
    'Carne Sirloin Especial',
    'Queso americano',
    'Queso manchego',
    'Tocino',
    'Lechuga',
    'Jitomate',
    'Pepinillos',
    'Mayonesa',
    'Catsup',
    'Mostaza',
  ],
  BBQ: [
    'Pan Bimbollo parrillero',
    'Carne Sirloin Especial',
    'Queso americano',
    'Queso manchego',
    'Tocino',
    'Catsup',
    'Aros de cebolla',
    'Salsa BBQ',
  ],
  EL_DIABLO: [
    'Pan Bimbollo parrillero',
    'Carne Sirloin Especial',
    'Tocino',
    'Queso americano',
    'Queso crema',
    'Rajas tempura',
    'Catsup',
  ],
};

/**
 * Función canónica para buscar la lista de ingredientes removibles de una burger o producto
 * por su SKU, tolerante a prefijos (BRG-, COMBO-, PROMO-) y mayúsculas/minúsculas.
 */
export function lookupRecipeBySku(
  sku?: string,
  recipes?: Record<string, string[]>
): string[] {
  if (!sku) return CANONICAL_BURGER_RECIPES.OG;

  const rawKey = sku.trim().toUpperCase();
  const normalizedKey = rawKey
    .replace(/^(?:BRG|BURGER|COMBO|PROMO)-?/, '')
    .replace(/[^A-Z0-9_]/g, '');

  if (recipes) {
    if (recipes[rawKey]?.length) return recipes[rawKey];
    if (recipes[normalizedKey]?.length) return recipes[normalizedKey];
    // Intento con búsqueda parcial en claves del diccionario D1
    const matchingKey = Object.keys(recipes).find(
      (k) => k.toUpperCase() === rawKey || k.toUpperCase() === normalizedKey
    );
    if (matchingKey && recipes[matchingKey]?.length) {
      return recipes[matchingKey];
    }
  }

  // Fallbacks canónicos de recetas según el SKU
  if (normalizedKey.includes('BBQ')) return CANONICAL_BURGER_RECIPES.BBQ;
  if (normalizedKey.includes('DIABLO')) return CANONICAL_BURGER_RECIPES.EL_DIABLO;
  return CANONICAL_BURGER_RECIPES.OG;
}

/**
 * Hook selector para obtener los ingredientes/receta de un producto según su SKU.
 */
export function useItemRecipe(sku?: string): string[] {
  const query = useMenuQuery();
  return lookupRecipeBySku(sku, query.data?.recipes);
}

/**
 * Hook selector para obtener el diccionario completo de recetas y función de consulta.
 */
export function useMenuRecipes() {
  const query = useMenuQuery();
  const recipes = query.data?.recipes ?? {};

  return {
    ...query,
    recipes,
    getRecipeForSku: (sku?: string) => lookupRecipeBySku(sku, recipes),
  };
}
