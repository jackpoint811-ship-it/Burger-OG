export interface Metadata {
  version?: string;
  name?: string;
  exportTimestamp?: string;
  [key: string]: unknown;
}

export interface GlobalTheme {
  primaryColor?: string;
  accentColor?: string;
  backgroundColor?: string;
  surfaceColor?: string;
  textColor?: string;
  fontFamily?: string;
  [key: string]: unknown;
}

export interface BannerRef {
  id: string;
  title?: string;
  description?: string;
  imageUrl?: string;
  assetId?: string;
  actionUrl?: string;
  targetSku?: string;
  badge?: string;
  [key: string]: unknown;
}

export interface ContentReferences {
  banners?: Record<string, BannerRef>;
  productSkus?: string[];
  [key: string]: unknown;
}

export interface LayoutModule {
  id: string;
  type:
    | "HEADER"
    | "BANNER_CAROUSEL_1"
    | "REORDER"
    | "BANNER_RAIL"
    | "FEATURED"
    | "CATEGORIES_STICKY"
    | "CATEGORIES_HORIZONTAL"
    | "CATALOG"
    | "HERO_BANNER"
    | "GRID"
    | "CATEGORY_NAV"
    | "CART_BAR"
    | string;
  title?: string;
  subtitle?: string;
  variant?: string;
  visible: boolean;
  density?: "ONE_COLUMN" | "TWO_COLUMNS" | "HORIZONTAL_LIST" | string;
  bgColor?: string;
  textColor?: string;
  borderRadius?: number | string;
  padding?: number | string;
  isClickable?: boolean;
  clickAction?: string;
  itemRefs?: string[];
  categoryKey?: string;
  [key: string]: unknown;
}

export interface DesignSpecification {
  metadata?: Metadata;
  globalTheme?: GlobalTheme;
  layout: LayoutModule[];
  contentReferences?: ContentReferences;
  [key: string]: unknown;
}
