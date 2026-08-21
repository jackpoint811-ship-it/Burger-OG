/**
 * use-admin.ts — PR-V3-12
 *
 * Hooks de TanStack Query v5 para el módulo de Administración de Chekeo V3.
 * Incluye query keys estructuradas, mutations con invalidación de caché optimizada.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type {
  MenuItem,
  MenuCategory,
  CatalogBanner,
  TowerSchedule,
  RaffleCampaignV2,
  OrderV2Environment,
} from '@config/index';
import {
  fetchAdminMenuItems,
  createAdminMenuItem,
  updateAdminMenuItem,
  deleteAdminMenuItem,
  updateMenuItemAvailability,
  uploadMenuItemImage,
  deleteMenuItemImage,
  fetchAdminCategories,
  saveAdminCategories,
  fetchAdminSiteConfig,
  updateAdminSiteConfig,
  fetchAdminTowerSchedules,
  updateAdminTowerSchedule,
  fetchAdminCatalogBanners,
  createAdminCatalogBanner,
  updateAdminCatalogBanner,
  deleteAdminCatalogBanner,
  uploadCatalogBannerImage,
  deleteCatalogBannerImage,
  fetchAdminRaffleCampaigns,
  createAdminRaffleCampaign,
  updateAdminRaffleCampaign,
  deleteAdminRaffleCampaign,
  fetchAdminRaffleSummary,
  fetchAdminReferralCodes,
  createAdminReferralCode,
  updateAdminReferralCode,
  fetchAdminReferrals,
  updateAdminReferral,
  createAdminTicketAdjustment,
  updateAdminTicketAdjustment,
  fetchCashCutReport,
  fetchOrdersSummary,
  fetchAdminIngredients,
  createAdminIngredient,
  updateAdminIngredient,
  fetchAdminProductRecipes,
  updateAdminProductRecipes,
} from '../api/admin.api';
import { batchArchiveOrders } from '../../orders/api/orders.api';
import type {
  CreateMenuItemPayload,
  UpdateMenuItemPayload,
  CreateCatalogBannerPayload,
  UpdateCatalogBannerPayload,
  UpdateTowerSchedulePayload,
  CreateRaffleCampaignAdminPayload,
  UpdateRaffleCampaignAdminPayload,
  CreateTicketAdjustmentAdminPayload,
  CreateReferralCodeAdminPayload,
} from '../types/admin.types';

// ==========================================
// QUERY KEYS
// ==========================================

export const adminKeys = {
  all: ['admin'] as const,
  menu: ['admin', 'menu'] as const,
  categories: ['admin', 'categories'] as const,
  siteConfig: ['admin', 'siteConfig'] as const,
  towers: ['admin', 'towers'] as const,
  banners: ['admin', 'banners'] as const,
  raffles: ['admin', 'raffles'] as const,
  raffleSummary: (campaignId?: string | null, q?: string) => ['admin', 'raffles', 'summary', campaignId ?? 'active', q ?? ''] as const,
  raffleCodes: (campaignId: string, q?: string) => ['admin', 'raffles', 'codes', campaignId, q ?? ''] as const,
  raffleReferrals: (campaignId: string, status?: string, q?: string) => ['admin', 'raffles', 'referrals', campaignId, status ?? 'all', q ?? ''] as const,
  cashcut: (opts: { from?: string; to?: string; environment?: OrderV2Environment } = {}) => ['admin', 'cashcut', opts] as const,
  ordersSummary: (opts: { from?: string; to?: string; environment?: OrderV2Environment } = {}) => ['admin', 'ordersSummary', opts] as const,
  ingredients: ['admin', 'ingredients'] as const,
  recipes: (sku: string) => ['admin', 'recipes', sku] as const,
};

// ==========================================
// 1. HOOK MENÚ & STOCK
// ==========================================

export function useAdminMenu() {
  const queryClient = useQueryClient();

  const menuQuery = useQuery({
    queryKey: adminKeys.menu,
    queryFn: fetchAdminMenuItems,
    staleTime: 1000 * 30, // 30s
  });

  const categoriesQuery = useQuery({
    queryKey: adminKeys.categories,
    queryFn: fetchAdminCategories,
    staleTime: 1000 * 60 * 5, // 5min
  });

  const siteConfigQuery = useQuery({
    queryKey: adminKeys.siteConfig,
    queryFn: fetchAdminSiteConfig,
    staleTime: 1000 * 60 * 5,
  });

  const createItemMutation = useMutation({
    mutationFn: (payload: CreateMenuItemPayload) => createAdminMenuItem(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.menu });
    },
  });

  const updateItemMutation = useMutation({
    mutationFn: ({ sku, payload }: { sku: string; payload: UpdateMenuItemPayload }) =>
      updateAdminMenuItem(sku, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.menu });
    },
  });

  const deleteItemMutation = useMutation({
    mutationFn: (sku: string) => deleteAdminMenuItem(sku),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.menu });
    },
  });

  const toggleAvailabilityMutation = useMutation({
    mutationFn: ({ sku, isAvailable }: { sku: string; isAvailable: boolean }) =>
      updateMenuItemAvailability(sku, isAvailable),
    onSuccess: (updatedItem) => {
      queryClient.setQueryData<MenuItem[]>(adminKeys.menu, (old) => {
        if (!old) return [updatedItem];
        return old.map((item) => (item.sku === updatedItem.sku ? updatedItem : item));
      });
      queryClient.invalidateQueries({ queryKey: adminKeys.menu });
    },
  });

  const uploadImageMutation = useMutation({
    mutationFn: ({ sku, file }: { sku: string; file: File }) => uploadMenuItemImage(sku, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.menu });
    },
  });

  const deleteImageMutation = useMutation({
    mutationFn: (sku: string) => deleteMenuItemImage(sku),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.menu });
    },
  });

  const saveCategoriesMutation = useMutation({
    mutationFn: (categories: MenuCategory[]) => saveAdminCategories(categories),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.categories });
    },
  });

  const updateSiteConfigMutation = useMutation({
    mutationFn: (payload: { publicMode?: string; catalogEnabled?: boolean }) => updateAdminSiteConfig(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.siteConfig });
    },
  });

  return {
    items: menuQuery.data ?? [],
    categories: categoriesQuery.data ?? [],
    siteConfig: siteConfigQuery.data,
    isLoading: menuQuery.isLoading || categoriesQuery.isLoading,
    isError: menuQuery.isError || categoriesQuery.isError,
    error: menuQuery.error || categoriesQuery.error,
    refetchMenu: menuQuery.refetch,
    createItemMutation,
    updateItemMutation,
    deleteItemMutation,
    toggleAvailabilityMutation,
    uploadImageMutation,
    deleteImageMutation,
    saveCategoriesMutation,
    updateSiteConfigMutation,
  };
}

// ==========================================
// 2. HOOK TORRES & HORARIOS
// ==========================================

export function useAdminTowers() {
  const queryClient = useQueryClient();

  const towersQuery = useQuery({
    queryKey: adminKeys.towers,
    queryFn: fetchAdminTowerSchedules,
    staleTime: 1000 * 60, // 1 min
  });

  const updateTowerMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateTowerSchedulePayload }) =>
      updateAdminTowerSchedule(id, payload),
    onSuccess: (updatedTower) => {
      queryClient.setQueryData<TowerSchedule[]>(adminKeys.towers, (old) => {
        if (!old) return [updatedTower];
        return old.map((t) => (t.id === updatedTower.id || t.towerKey === updatedTower.towerKey ? updatedTower : t));
      });
      queryClient.invalidateQueries({ queryKey: adminKeys.towers });
    },
  });

  return {
    towers: towersQuery.data ?? [],
    isLoading: towersQuery.isLoading,
    isError: towersQuery.isError,
    error: towersQuery.error,
    refetchTowers: towersQuery.refetch,
    updateTowerMutation,
  };
}

// ==========================================
// 3. HOOK BANNERS PROMOCIONALES
// ==========================================

export function useAdminBanners() {
  const queryClient = useQueryClient();

  const bannersQuery = useQuery({
    queryKey: adminKeys.banners,
    queryFn: fetchAdminCatalogBanners,
    staleTime: 1000 * 60, // 1 min
  });

  const createBannerMutation = useMutation({
    mutationFn: (payload: CreateCatalogBannerPayload) => createAdminCatalogBanner(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.banners });
    },
  });

  const updateBannerMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateCatalogBannerPayload }) =>
      updateAdminCatalogBanner(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.banners });
    },
  });

  const deleteBannerMutation = useMutation({
    mutationFn: (id: string) => deleteAdminCatalogBanner(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.banners });
    },
  });

  const uploadBannerImageMutation = useMutation({
    mutationFn: ({ id, file }: { id: string; file: File }) => uploadCatalogBannerImage(id, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.banners });
    },
  });

  const deleteBannerImageMutation = useMutation({
    mutationFn: (id: string) => deleteCatalogBannerImage(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.banners });
    },
  });

  return {
    banners: bannersQuery.data ?? [],
    isLoading: bannersQuery.isLoading,
    isError: bannersQuery.isError,
    error: bannersQuery.error,
    refetchBanners: bannersQuery.refetch,
    createBannerMutation,
    updateBannerMutation,
    deleteBannerMutation,
    uploadBannerImageMutation,
    deleteBannerImageMutation,
  };
}

// ==========================================
// 4. HOOK SORTEOS & BOLETOS
// ==========================================

export function useAdminRaffles(campaignId?: string | null, searchQuery = '') {
  const queryClient = useQueryClient();

  const campaignsQuery = useQuery({
    queryKey: adminKeys.raffles,
    queryFn: fetchAdminRaffleCampaigns,
    staleTime: 1000 * 60 * 2,
  });

  const activeCampaign = campaignsQuery.data?.find((c) => (campaignId ? c.id === campaignId : c.isActive)) ?? campaignsQuery.data?.[0];
  const effectiveCampaignId = activeCampaign?.id;

  const summaryQuery = useQuery({
    queryKey: adminKeys.raffleSummary(effectiveCampaignId, searchQuery),
    queryFn: () => fetchAdminRaffleSummary(effectiveCampaignId, searchQuery),
    enabled: Boolean(effectiveCampaignId),
    staleTime: 1000 * 15,
  });

  const referralCodesQuery = useQuery({
    queryKey: adminKeys.raffleCodes(effectiveCampaignId || '', searchQuery),
    queryFn: () => fetchAdminReferralCodes(effectiveCampaignId || '', searchQuery),
    enabled: Boolean(effectiveCampaignId),
    staleTime: 1000 * 30,
  });

  const referralsQuery = useQuery({
    queryKey: adminKeys.raffleReferrals(effectiveCampaignId || '', 'all', searchQuery),
    queryFn: () => fetchAdminReferrals(effectiveCampaignId || '', 'all', searchQuery),
    enabled: Boolean(effectiveCampaignId),
    staleTime: 1000 * 30,
  });

  const createCampaignMutation = useMutation({
    mutationFn: (payload: CreateRaffleCampaignAdminPayload) => createAdminRaffleCampaign(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.raffles });
    },
  });

  const updateCampaignMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateRaffleCampaignAdminPayload }) =>
      updateAdminRaffleCampaign(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.raffles });
      queryClient.invalidateQueries({ queryKey: ['admin', 'raffles', 'summary'] });
    },
  });

  const deleteCampaignMutation = useMutation({
    mutationFn: (id: string) => deleteAdminRaffleCampaign(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.raffles });
    },
  });

  const createAdjustmentMutation = useMutation({
    mutationFn: (payload: CreateTicketAdjustmentAdminPayload) => createAdminTicketAdjustment(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'raffles', 'summary'] });
    },
  });

  const updateAdjustmentMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: { status: 'active' | 'reverted'; actor?: string } }) =>
      updateAdminTicketAdjustment(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'raffles', 'summary'] });
    },
  });

  const createReferralCodeMutation = useMutation({
    mutationFn: (payload: CreateReferralCodeAdminPayload) => createAdminReferralCode(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'raffles', 'codes'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'raffles', 'summary'] });
    },
  });

  const updateReferralCodeMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: { isActive?: boolean; labelText?: string; ownerName?: string } }) =>
      updateAdminReferralCode(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'raffles', 'codes'] });
    },
  });

  const updateReferralMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: { status: 'valid' | 'invalid' | 'pending'; invalidReason?: string } }) =>
      updateAdminReferral(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'raffles', 'referrals'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'raffles', 'summary'] });
    },
  });

  return {
    campaigns: campaignsQuery.data ?? [],
    activeCampaign,
    summary: summaryQuery.data,
    referralCodes: referralCodesQuery.data ?? [],
    referrals: referralsQuery.data ?? [],
    isLoading: campaignsQuery.isLoading || summaryQuery.isLoading,
    isError: campaignsQuery.isError || summaryQuery.isError,
    error: campaignsQuery.error || summaryQuery.error,
    refetchSummary: summaryQuery.refetch,
    createCampaignMutation,
    updateCampaignMutation,
    deleteCampaignMutation,
    createAdjustmentMutation,
    updateAdjustmentMutation,
    createReferralCodeMutation,
    updateReferralCodeMutation,
    updateReferralMutation,
  };
}

// ==========================================
// 5. HOOK CORTE DE CAJA & ARQUEO
// ==========================================

export function useAdminCashCut(options: { from?: string; to?: string; environment?: OrderV2Environment } = {}) {
  const queryClient = useQueryClient();

  const cashCutQuery = useQuery({
    queryKey: adminKeys.cashcut(options),
    queryFn: () => fetchCashCutReport(options),
    staleTime: 1000 * 30, // 30s
  });

  const summaryQuery = useQuery({
    queryKey: adminKeys.ordersSummary(options),
    queryFn: () => fetchOrdersSummary(options),
    staleTime: 1000 * 30,
  });

  const batchArchiveMutation = useMutation({
    mutationFn: (payload: { orderIds: string[]; cancelReason?: string; environment?: OrderV2Environment }) =>
      batchArchiveOrders(payload.orderIds, payload.environment, payload.cancelReason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.cashcut(options) });
      queryClient.invalidateQueries({ queryKey: adminKeys.ordersSummary(options) });
      queryClient.invalidateQueries({ queryKey: ['orders-v2'] });
    },
  });

  return {
    cashCutData: cashCutQuery.data,
    summaryData: summaryQuery.data,
    isLoading: cashCutQuery.isLoading || summaryQuery.isLoading,
    isError: cashCutQuery.isError || summaryQuery.isError,
    error: cashCutQuery.error || summaryQuery.error,
    refetch: () => {
      cashCutQuery.refetch();
      summaryQuery.refetch();
    },
    batchArchiveMutation,
  };
}

// ==========================================
// 6. HOOK INGREDIENTES & RECETAS
// ==========================================

export function useAdminIngredients(skuForRecipe?: string) {
  const queryClient = useQueryClient();

  const ingredientsQuery = useQuery({
    queryKey: adminKeys.ingredients,
    queryFn: fetchAdminIngredients,
    staleTime: 1000 * 60 * 2,
  });

  const recipesQuery = useQuery({
    queryKey: adminKeys.recipes(skuForRecipe || ''),
    queryFn: () => fetchAdminProductRecipes(skuForRecipe || ''),
    enabled: Boolean(skuForRecipe),
    staleTime: 1000 * 60,
  });

  const createIngredientMutation = useMutation({
    mutationFn: (payload: { name: string; unit: string; unitPriceCents?: number | null; isActive?: boolean; sortOrder?: number }) =>
      createAdminIngredient(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.ingredients });
    },
  });

  const updateIngredientMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: { name?: string; unit?: string; unitPriceCents?: number | null; isActive?: boolean; sortOrder?: number } }) =>
      updateAdminIngredient(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.ingredients });
    },
  });

  const updateRecipesMutation = useMutation({
    mutationFn: ({ sku, recipes }: { sku: string; recipes: Array<{ ingredientId: string; quantityPerUnit: number }> }) =>
      updateAdminProductRecipes(sku, recipes),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: adminKeys.recipes(variables.sku) });
      queryClient.invalidateQueries({ queryKey: ['kitchen', 'summary-k'] });
    },
  });

  return {
    ingredients: ingredientsQuery.data ?? [],
    recipes: recipesQuery.data ?? [],
    isLoading: ingredientsQuery.isLoading || (Boolean(skuForRecipe) && recipesQuery.isLoading),
    isError: ingredientsQuery.isError || recipesQuery.isError,
    error: ingredientsQuery.error || recipesQuery.error,
    createIngredientMutation,
    updateIngredientMutation,
    updateRecipesMutation,
  };
}
