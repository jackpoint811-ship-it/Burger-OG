/**
 * admin.api.ts — PR-V3-12
 *
 * Cliente de API para el backend administrativo de Chekeo V3 (Hono.js).
 * Cubre: Menú & Stock, Torres & Horarios, Banners, Sorteos, Corte de Caja e Ingredientes.
 */

import type {
  MenuItem,
  MenuCategory,
  CatalogBanner,
  TowerSchedule,
  PublicConfig,
  RaffleCampaignV2,
  RaffleSummaryResponse,
  RaffleReferralCodesAdminResponse,
  RaffleReferralCodeMutationResponse,
  RaffleReferralsAdminResponse,
  RaffleReferralMutationResponse,
  RaffleTicketAdjustmentMutationResponse,
  OrdersV2SummaryResponse,
  OrderV2Environment,
  IngredientsV2AdminResponse,
  IngredientV2MutationResponse,
  ProductIngredientRecipeV2Response,
} from '@config/index';
import { apiFetch } from '../../shared/api-client';
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
  CashCutSummaryData,
} from '../types/admin.types';

// ==========================================
// 1. MENÚ & STOCK
// ==========================================

export async function fetchAdminMenuItems(): Promise<MenuItem[]> {
  const res = await apiFetch<{ ok: boolean; items: MenuItem[] }>('/api/menu-v2-admin/items');
  return res.items ?? [];
}

export async function createAdminMenuItem(payload: CreateMenuItemPayload): Promise<MenuItem> {
  const res = await apiFetch<{ ok: boolean; item: MenuItem }>('/api/menu-v2-admin/items', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return res.item;
}

export async function updateAdminMenuItem(sku: string, payload: UpdateMenuItemPayload): Promise<MenuItem> {
  const res = await apiFetch<{ ok: boolean; item: MenuItem }>(`/api/menu-v2-admin/items/${encodeURIComponent(sku)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return res.item;
}

export async function deleteAdminMenuItem(sku: string): Promise<string> {
  const res = await apiFetch<{ ok: boolean; sku: string }>(`/api/menu-v2-admin/items/${encodeURIComponent(sku)}`, {
    method: 'DELETE',
  });
  return res.sku;
}

export async function updateMenuItemAvailability(sku: string, isAvailable: boolean): Promise<MenuItem> {
  const res = await apiFetch<{ ok: boolean; item: MenuItem }>(`/api/menu-v2-admin/items/${encodeURIComponent(sku)}/availability`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ isAvailable }),
  });
  return res.item;
}

export async function uploadMenuItemImage(sku: string, file: File): Promise<{ item: MenuItem; imageKey: string; assetUrl: string }> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`/api/menu-v2-admin/items/${encodeURIComponent(sku)}/image`, {
    method: 'POST',
    body: formData,
    credentials: 'include',
  });

  const data = (await response.json()) as { ok: boolean; error?: string; item: MenuItem; imageKey: string; assetUrl: string };
  if (!response.ok || !data.ok) {
    throw new Error(data.error || 'Error al subir la imagen del producto');
  }

  return data;
}

export async function deleteMenuItemImage(sku: string): Promise<MenuItem> {
  const res = await apiFetch<{ ok: boolean; item: MenuItem; removed: boolean }>(`/api/menu-v2-admin/items/${encodeURIComponent(sku)}/image`, {
    method: 'DELETE',
  });
  return res.item;
}

export async function fetchAdminCategories(): Promise<MenuCategory[]> {
  const res = await apiFetch<{ ok: boolean; categories: MenuCategory[] }>('/api/menu-v2-admin/categories');
  return res.categories ?? [];
}

export async function saveAdminCategories(categories: MenuCategory[]): Promise<MenuCategory[]> {
  const res = await apiFetch<{ ok: boolean; categories: MenuCategory[] }>('/api/menu-v2-admin/categories', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ categories }),
  });
  return res.categories ?? [];
}

export async function deleteAdminCategory(key: string): Promise<string> {
  const res = await apiFetch<{ ok: boolean; deletedKey: string }>(`/api/menu-v2-admin/categories/${encodeURIComponent(key)}`, {
    method: 'DELETE',
  });
  return res.deletedKey;
}

export async function fetchAdminSiteConfig(): Promise<PublicConfig> {
  const res = await apiFetch<{ ok: boolean; publicConfig: PublicConfig }>('/api/menu-v2-admin/site-config');
  return res.publicConfig;
}

export async function updateAdminSiteConfig(payload: { publicMode?: string; catalogEnabled?: boolean }): Promise<PublicConfig> {
  const res = await apiFetch<{ ok: boolean; publicConfig: PublicConfig }>('/api/menu-v2-admin/site-config', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return res.publicConfig;
}

// ==========================================
// 2. TORRES & HORARIOS
// ==========================================

export async function fetchAdminTowerSchedules(): Promise<TowerSchedule[]> {
  const res = await apiFetch<{ ok: boolean; schedules?: TowerSchedule[]; towers?: TowerSchedule[] }>('/api/menu-v2-admin/tower-schedules');
  return res.schedules ?? res.towers ?? [];
}

export async function updateAdminTowerSchedule(id: string, payload: UpdateTowerSchedulePayload): Promise<TowerSchedule> {
  const res = await apiFetch<{ ok: boolean; tower: TowerSchedule }>(`/api/menu-v2-admin/tower-schedules/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return res.tower;
}

// ==========================================
// 3. BANNERS PROMOCIONALES
// ==========================================

export async function fetchAdminCatalogBanners(): Promise<CatalogBanner[]> {
  const res = await apiFetch<{ ok: boolean; banners: CatalogBanner[] }>('/api/menu-v2-admin/catalog-banners');
  return res.banners ?? [];
}

export async function createAdminCatalogBanner(payload: CreateCatalogBannerPayload): Promise<CatalogBanner> {
  const res = await apiFetch<{ ok: boolean; banner: CatalogBanner }>('/api/menu-v2-admin/catalog-banners', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return res.banner;
}

export async function updateAdminCatalogBanner(id: string, payload: UpdateCatalogBannerPayload): Promise<CatalogBanner> {
  const res = await apiFetch<{ ok: boolean; banner: CatalogBanner }>(`/api/menu-v2-admin/catalog-banners/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return res.banner;
}

export async function deleteAdminCatalogBanner(id: string): Promise<string> {
  const res = await apiFetch<{ ok: boolean; id: string }>(`/api/menu-v2-admin/catalog-banners/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
  return res.id;
}

export async function uploadCatalogBannerImage(id: string, file: File): Promise<{ banner: CatalogBanner; imageKey: string; assetUrl: string }> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`/api/menu-v2-admin/catalog-banners/${encodeURIComponent(id)}/image`, {
    method: 'POST',
    body: formData,
    credentials: 'include',
  });

  const data = (await response.json()) as { ok: boolean; error?: string; banner: CatalogBanner; imageKey: string; assetUrl: string };
  if (!response.ok || !data.ok) {
    throw new Error(data.error || 'Error al subir la imagen del banner');
  }

  return data;
}

export async function deleteCatalogBannerImage(id: string): Promise<CatalogBanner> {
  const res = await apiFetch<{ ok: boolean; banner: CatalogBanner; removed: boolean }>(`/api/menu-v2-admin/catalog-banners/${encodeURIComponent(id)}/image`, {
    method: 'DELETE',
  });
  return res.banner;
}

// ==========================================
// 4. SORTEOS & BOLETOS
// ==========================================

export async function fetchAdminRaffleCampaigns(): Promise<RaffleCampaignV2[]> {
  const res = await apiFetch<{ ok: boolean; data: { campaigns: RaffleCampaignV2[] } }>('/api/raffles-v2-admin/campaigns');
  return res.data?.campaigns ?? [];
}

export async function createAdminRaffleCampaign(payload: CreateRaffleCampaignAdminPayload): Promise<RaffleCampaignV2> {
  const res = await apiFetch<{ ok: boolean; data: { campaign: RaffleCampaignV2 } }>('/api/raffles-v2-admin/campaigns', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return res.data.campaign;
}

export async function updateAdminRaffleCampaign(id: string, payload: UpdateRaffleCampaignAdminPayload): Promise<RaffleCampaignV2> {
  const res = await apiFetch<{ ok: boolean; data: { campaign: RaffleCampaignV2 } }>(`/api/raffles-v2-admin/campaigns/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return res.data.campaign;
}

export async function deleteAdminRaffleCampaign(id: string): Promise<RaffleCampaignV2> {
  const res = await apiFetch<{ ok: boolean; data: { campaign: RaffleCampaignV2 } }>(`/api/raffles-v2-admin/campaigns/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
  return res.data.campaign;
}

export async function fetchAdminRaffleSummary(campaignId?: string, q?: string): Promise<NonNullable<RaffleSummaryResponse['data']>> {
  const searchParams = new URLSearchParams();
  if (campaignId) searchParams.set('campaignId', campaignId);
  if (q) searchParams.set('q', q);

  const queryStr = searchParams.toString();
  const endpoint = `/api/raffles-v2-admin/summary${queryStr ? `?${queryStr}` : ''}`;
  const res = await apiFetch<RaffleSummaryResponse>(endpoint);
  if (!res.ok || !res.data) throw new Error(res.error?.message || 'Error al obtener resumen de sorteo');
  return res.data;
}

export async function fetchAdminReferralCodes(campaignId: string, q?: string) {
  const searchParams = new URLSearchParams({ campaignId });
  if (q) searchParams.set('q', q);

  const res = await apiFetch<RaffleReferralCodesAdminResponse>(`/api/raffles-v2-admin/referral-codes?${searchParams.toString()}`);
  return res.data?.codes ?? [];
}

export async function createAdminReferralCode(payload: CreateReferralCodeAdminPayload) {
  const res = await apiFetch<RaffleReferralCodeMutationResponse>('/api/raffles-v2-admin/referral-codes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return res.data?.code;
}

export async function updateAdminReferralCode(id: string, payload: { isActive?: boolean; labelText?: string; ownerName?: string }) {
  const res = await apiFetch<RaffleReferralCodeMutationResponse>(`/api/raffles-v2-admin/referral-codes/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return res.data?.code;
}

export async function fetchAdminReferrals(campaignId: string, status?: string, q?: string) {
  const searchParams = new URLSearchParams({ campaignId });
  if (status && status !== 'all') searchParams.set('status', status);
  if (q) searchParams.set('q', q);

  const res = await apiFetch<RaffleReferralsAdminResponse>(`/api/raffles-v2-admin/referrals?${searchParams.toString()}`);
  return res.data?.referrals ?? [];
}

export async function updateAdminReferral(id: string, payload: { status: 'valid' | 'invalid' | 'pending'; invalidReason?: string }) {
  const res = await apiFetch<RaffleReferralMutationResponse>(`/api/raffles-v2-admin/referrals/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return res.data?.referral;
}

export async function createAdminTicketAdjustment(payload: CreateTicketAdjustmentAdminPayload) {
  const res = await apiFetch<RaffleTicketAdjustmentMutationResponse>('/api/raffles-v2-admin/ticket-adjustments', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return res.data?.adjustment;
}

export async function updateAdminTicketAdjustment(id: string, payload: { status: 'active' | 'reverted'; actor?: string }) {
  const res = await apiFetch<RaffleTicketAdjustmentMutationResponse>(`/api/raffles-v2-admin/ticket-adjustments/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return res.data?.adjustment;
}

// ==========================================
// 5. CORTE DE CAJA & ARQUEO
// ==========================================

export async function fetchCashCutReport(options: { from?: string; to?: string; environment?: OrderV2Environment } = {}): Promise<CashCutSummaryData> {
  const searchParams = new URLSearchParams();
  if (options.from) searchParams.set('from', options.from);
  if (options.to) searchParams.set('to', options.to);
  if (options.environment) searchParams.set('environment', options.environment);

  const queryStr = searchParams.toString();
  const endpoint = `/api/orders-v2-admin/cash-cut${queryStr ? `?${queryStr}` : ''}`;
  const res = await apiFetch<{ ok: boolean; data: CashCutSummaryData }>(endpoint, {
    method: 'POST',
  });
  return res.data;
}

export async function fetchOrdersSummary(options: { from?: string; to?: string; environment?: OrderV2Environment; limit?: number } = {}): Promise<NonNullable<OrdersV2SummaryResponse['data']>> {
  const searchParams = new URLSearchParams();
  if (options.from) searchParams.set('from', options.from);
  if (options.to) searchParams.set('to', options.to);
  if (options.environment) searchParams.set('environment', options.environment);
  if (options.limit) searchParams.set('limit', String(options.limit));

  const queryStr = searchParams.toString();
  const endpoint = `/api/orders-v2-admin/summary${queryStr ? `?${queryStr}` : ''}`;
  const res = await apiFetch<OrdersV2SummaryResponse>(endpoint);
  if (!res.ok || !res.data) throw new Error(res.error?.message || 'Error al obtener resumen de órdenes');
  return res.data;
}

export function getOrdersExportCsvUrl(options: { from?: string; to?: string; status?: string; environment?: OrderV2Environment; includeTerminal?: boolean } = {}): string {
  const searchParams = new URLSearchParams();
  if (options.from) searchParams.set('from', options.from);
  if (options.to) searchParams.set('to', options.to);
  if (options.status) searchParams.set('status', options.status);
  if (options.environment) searchParams.set('environment', options.environment);
  if (options.includeTerminal != null) searchParams.set('includeTerminal', options.includeTerminal ? '1' : '0');

  const queryStr = searchParams.toString();
  return `/api/orders-v2-admin/export.csv${queryStr ? `?${queryStr}` : ''}`;
}

// ==========================================
// 6. INGREDIENTES & RECETAS
// ==========================================

export async function fetchAdminIngredients() {
  const res = await apiFetch<IngredientsV2AdminResponse>('/api/ingredients-v2-admin');
  return res.data?.ingredients ?? [];
}

export async function createAdminIngredient(payload: { name: string; unit: string; unitPriceCents?: number | null; isActive?: boolean; sortOrder?: number }) {
  const res = await apiFetch<IngredientV2MutationResponse>('/api/ingredients-v2-admin', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return res.data?.ingredient;
}

export async function updateAdminIngredient(id: string, payload: { name?: string; unit?: string; unitPriceCents?: number | null; isActive?: boolean; sortOrder?: number }) {
  const res = await apiFetch<IngredientV2MutationResponse>(`/api/ingredients-v2-admin/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return res.data?.ingredient;
}

export async function fetchAdminProductRecipes(sku: string) {
  const res = await apiFetch<ProductIngredientRecipeV2Response>(`/api/ingredients-v2-admin/recipes/${encodeURIComponent(sku)}`);
  return res.data?.recipes ?? [];
}

export async function updateAdminProductRecipes(sku: string, recipes: Array<{ ingredientId: string; quantityPerUnit: number }>) {
  const res = await apiFetch<ProductIngredientRecipeV2Response>(`/api/ingredients-v2-admin/recipes/${encodeURIComponent(sku)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ recipes }),
  });
  return res.data?.recipes ?? [];
}
