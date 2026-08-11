import { DEFAULT_PUBLIC_CONFIG, type MenuV2Response } from '@config/index';

export const toFallbackMenuResponse: MenuV2Response = {
  items: [],
  promos: [],
  categories: [],
  recipes: {},
  categoryBanners: [],
  catalogBanners: [],
  siteConfig: {
    brandName: "Burgers.exe",
    currency: "MXN",
    orderModes: ["pickup", "delivery"],
    supportPhone: "",
    heroCta: "Armar mi pedido",
    notice: "",
  },
  publicConfig: DEFAULT_PUBLIC_CONFIG,
  updatedAt: new Date().toISOString(),
  source: "fallback",
};

export async function loadMenuV2(): Promise<MenuV2Response> {
  try {
    const response = await fetch('/api/menu-v2', { cache: 'no-store', headers: { accept: 'application/json' } });
    if (!response.ok) {
      throw new Error(`Menu endpoint returned HTTP ${response.status}`);
    }
    const data = (await response.json()) as MenuV2Response;
    if (!Array.isArray(data?.items) || !Array.isArray(data?.promos) || !Array.isArray(data?.categories)) {
      throw new Error('Menu response is missing required arrays (items, promos, categories)');
    }
    return { ...data, publicConfig: data.publicConfig ?? DEFAULT_PUBLIC_CONFIG };
  } catch {
    return toFallbackMenuResponse;
  }
}
