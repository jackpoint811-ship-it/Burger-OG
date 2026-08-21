/**
 * menu.api.ts — PR-V3-05
 *
 * Llamadas de API para el catálogo y menú público.
 */

import { DEFAULT_PUBLIC_CONFIG, DEFAULT_SITE_CONFIG, type MenuV2Response } from '@config/index';
import { apiFetch } from '../../shared/api-client';

const MENU_ENDPOINT = '/api/menu-v2';

export async function fetchMenu(): Promise<MenuV2Response> {
  const data = await apiFetch<MenuV2Response>(MENU_ENDPOINT, {
    cache: 'no-store',
  });

  if (!Array.isArray(data?.items) || !Array.isArray(data?.promos) || !Array.isArray(data?.categories)) {
    throw new Error('La respuesta del menú no contiene las colecciones requeridas (items, promos, categories).');
  }

  return {
    ...data,
    siteConfig: data.siteConfig ?? DEFAULT_SITE_CONFIG,
    publicConfig: data.publicConfig ?? DEFAULT_PUBLIC_CONFIG,
    catalogBanners: Array.isArray(data.catalogBanners) ? data.catalogBanners : [],
    categoryBanners: Array.isArray(data.categoryBanners) ? data.categoryBanners : [],
    recipes: data.recipes ?? {},
  };
}
