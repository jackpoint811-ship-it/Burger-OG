import type { MenuCategory, MenuItem, MenuItemComboConfig } from "@config/index";

export type CatalogProductType = "burger" | "combo" | "side" | "topping" | "drink";

export type CatalogProduct = {
  id: string;
  sku?: string;
  type: CatalogProductType;
  categoryId: string;
  categoryKey: MenuCategory["key"];
  categoryName: string;
  name: string;
  description?: string;
  price: number;
  promoPrice?: number;
  isPromoActive?: boolean;
  promoLabel?: string;
  comboConfig?: MenuItemComboConfig;
  imageUrl?: string;
  imageKey?: string;
  badge?: string;
  isAvailable: boolean;
  isFeatured: boolean;
  sortOrder: number;
};

export const PRODUCT_TYPE_LABELS: Record<CatalogProductType, string> = {
  burger: "Burger fija",
  combo: "Combo",
  side: "Guarnición",
  topping: "Topping separado",
  drink: "Bebida",
};



const SAFE_IMAGE_KEY_PATTERN = /^[a-zA-Z0-9/_.,@-]+$/;

const isSafeSameOriginPath = (value: string) => {
  if (!value.startsWith("/")) return false;
  if (value.startsWith("//") || value.includes("\\") || value.includes("..")) return false;
  return true;
};

const isSafeHttpsImageUrl = (value: string) => {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && !url.username && !url.password;
  } catch {
    return false;
  }
};

const isSafeAssetKey = (value: string) => {
  const key = value.trim().replace(/^\/+/, "");
  if (!key || !SAFE_IMAGE_KEY_PATTERN.test(key) || key.includes("..") || key.includes("\\") || key.includes("//")) return false;
  return key.split("/").every((segment) => segment && segment !== "." && segment !== "..");
};

export const resolveCatalogAssetUrl = (imageUrl?: string, imageKey?: string): string | undefined => {
  const trimmedKey = imageKey?.trim().replace(/^\/+/, "");
  if (trimmedKey && isSafeAssetKey(trimmedKey)) {
    return `/api/assets-v2/${trimmedKey.split("/").map((segment) => encodeURIComponent(segment)).join("/")}`;
  }

  const trimmedUrl = imageUrl?.trim();
  if (trimmedUrl && (isSafeSameOriginPath(trimmedUrl) || isSafeHttpsImageUrl(trimmedUrl))) return trimmedUrl;
  return undefined;
};

export function mapMenuCategoryToCatalogProductType(category: MenuCategory["key"]): CatalogProductType {
  if (category === "burgers") return "burger";
  if (category === "combos") return "combo";
  if (category === "guarniciones") return "side";
  if (category === "drinks") return "drink";
  return "topping";
}

export function mapMenuItemsToCatalogProducts(items: MenuItem[], categories: MenuCategory[]): CatalogProduct[] {
  const categoryByKey = new Map(categories.map((category) => [category.key, category]));

  return items
    .map((item) => {
      const category = categoryByKey.get(item.category);

      return {
        id: item.sku,
        sku: item.sku,
        type: mapMenuCategoryToCatalogProductType(item.category),
        categoryId: category?.id ?? item.category,
        categoryKey: item.category,
        categoryName: category?.name ?? item.category,
        name: item.name,
        description: item.description,
        price: item.price,
        promoPrice: item.promoPrice,
        isPromoActive: item.isPromoActive,
        promoLabel: item.promoLabel,
        comboConfig: item.comboConfig,
        imageUrl: item.imageUrl,
        imageKey: item.imageKey,
        badge: item.badge ?? (item.isPromoActive ? (item.promoLabel || "⚡ PRECIO ESPECIAL") : item.promoLabel),
        isAvailable: item.isAvailable,
        isFeatured: item.isFeatured,
        sortOrder: item.sortOrder
      };
    })
    .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name));
}

export function getCategoryEmoji(key: string, name: string): string {
  const k = key.toLowerCase();
  const n = name.toLowerCase();
  if (k.includes("burg") || n.includes("burg")) return "🍔";
  if (k.includes("combo") || n.includes("combo")) return "🔥";
  if (k.includes("entr") || k.includes("side") || n.includes("papas") || n.includes("entr")) return "🍟";
  if (k.includes("beb") || k.includes("drink") || n.includes("beb")) return "🥤";
  if (k.includes("postre") || n.includes("postre")) return "🍦";
  return "🏷️";
}
