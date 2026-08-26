/**
 * admin.types.ts — Chekeo V3
 *
 * Definiciones de tipos para el Panel de Control Administrativo de Chekeo V3:
 * - Categorías Maestras y Navegación Jerárquica Multinivel
 * - Subcategorías y Herramientas Especializadas
 * - Sistema de Favoritos Dinámicos (Pin/Unpin)
 * - Buscador Command Palette
 * - Menú, Torres, Banners, Sorteos, Corte Z e Insumos
 */

import type {
  MenuItem,
  MenuCategory,
  CatalogBanner,
  TowerSchedule,
  RaffleCampaignV2,
  RaffleParticipantSummary,
  RaffleTicketAdjustmentV2,
  RaffleReferralCodeV2,
  RaffleReferralV2,
  OrdersV2SummaryResponse,
  OrderV2Environment,
  IngredientV2,
  ProductIngredientRecipeV2,
} from '@config/index';

export type AdminMasterCategory =
  | 'menu'
  | 'towers'
  | 'banners'
  | 'raffles'
  | 'cashcut'
  | 'ingredients';

export type AdminActiveTab = 'overview' | AdminMasterCategory;

export type AdminNavigationLevel = 'overview' | 'category' | 'tool';

export interface AdminRouteState {
  level: AdminNavigationLevel;
  category?: AdminMasterCategory;
  toolId?: string;
}

export interface AdminPinnedFavorite {
  id: string;
  title: string;
  shortTitle: string;
  category: AdminMasterCategory;
  toolId?: string;
  iconName: string;
  tag: string;
  description?: string;
}

export interface AdminSearchItem {
  id: string;
  title: string;
  description: string;
  category: AdminMasterCategory;
  categoryLabel: string;
  toolId?: string;
  keywords: string[];
  iconName: string;
}

export type CreateMenuItemPayload = {
  sku: string;
  name: string;
  description: string;
  price: number;
  category: string;
  isAvailable: boolean;
  isHidden?: boolean;
  isFeatured: boolean;
  sortOrder: number;
  imageUrl?: string;
  imageKey?: string;
  badge?: string;
  promoLabel?: string;
  promoPrice?: number | null;
  isPromoActive?: boolean;
  promoExpiresAt?: string | null;
  stockManaged?: boolean;
  stockLimit?: number | null;
  stockRemaining?: number | null;
  comboLinks?: string[];
  comboConfig?: any;
};

export type UpdateMenuItemPayload = Partial<CreateMenuItemPayload>;

export type CreateCatalogBannerPayload = {
  title: string;
  subtitle?: string;
  ctaLabel?: string;
  imageKey?: string;
  imageUrl?: string;
  bgPreset?: string;
  badgeText?: string;
  badgeColor?: string;
  ctaActionType?: 'category' | 'product' | 'raffle' | 'url' | string;
  ctaTarget?: string;
  isActive: boolean;
  sortOrder: number;
};

export type UpdateCatalogBannerPayload = Partial<CreateCatalogBannerPayload>;

export type UpdateTowerSchedulePayload = {
  towerName?: string;
  emoji?: string;
  activeDays?: number[];
  orderStartTime?: string;
  orderEndTime?: string;
  deliveryStartTime?: string;
  deliveryEndTime?: string;
  deliveryLabel?: string | null;
  isActive?: boolean;
};

export type CreateRaffleCampaignAdminPayload = {
  title: string;
  description?: string;
  rulesText?: string;
  startsAt?: string;
  endsAt?: string;
  ticketPerBurger?: number;
  ticketPerReferral?: number;
  isActive?: boolean;
};

export type UpdateRaffleCampaignAdminPayload = Partial<CreateRaffleCampaignAdminPayload>;

export type CreateTicketAdjustmentAdminPayload = {
  campaignId: string;
  participantKey: string;
  ticketsDelta: number;
  reason: string;
  actor?: string;
};

export type CreateReferralCodeAdminPayload = {
  campaignId: string;
  ownerName: string;
  ownerPhone: string;
  burgerWord: string;
  number: number;
};

export type CashCutSummaryData = {
  environment?: OrderV2Environment;
  from: string | null;
  to: string | null;
  totalOrders: number;
  totalSalesCents: number;
  totalSalesPesos: number;
  byPaymentMethod: Record<string, { count: number; totalCents: number; totalPesos: number }>;
  byOrderMode: Record<string, { count: number; totalCents: number; totalPesos: number }>;
  byPaymentStatus: Record<string, { count: number; totalCents: number; totalPesos: number }>;
};

export type OrdersSummaryData = NonNullable<OrdersV2SummaryResponse['data']>;

export type CashCutFilterPreset = 'today' | 'yesterday' | 'week' | 'custom';
