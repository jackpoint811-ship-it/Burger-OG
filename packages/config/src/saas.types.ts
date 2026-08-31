/**
 * saas.types.ts — Contratos y Tipos del Motor SaaS Multi-Tenant
 */

export type SaaSPlanTier = 'starter' | 'pro' | 'enterprise';

export interface SaaSPlanDefinition {
  id: SaaSPlanTier;
  name: string;
  badge: string;
  description: string;
  monthlyPriceCents: number;
  monthlyPriceFormatted: string;
  maxMonthlyOrders: number | 'unlimited';
  maxKitchenStations: number;
  hasSummaryKCalculator: boolean;
  hasCustomDomain: boolean;
  hasPrioritySupport: boolean;
  hasDedicatedR2Bucket: boolean;
  features: string[];
}

export const SAAS_PLANS: Record<SaaSPlanTier, SaaSPlanDefinition> = {
  starter: {
    id: 'starter',
    name: 'Starter / Dark Kitchen',
    badge: 'Starter',
    description: 'Ideal para dark kitchens y nuevos restaurantes con una sola estación de despacho.',
    monthlyPriceCents: 2900,
    monthlyPriceFormatted: '$29 USD/mes',
    maxMonthlyOrders: 300,
    maxKitchenStations: 1,
    hasSummaryKCalculator: true,
    hasCustomDomain: false,
    hasPrioritySupport: false,
    hasDedicatedR2Bucket: false,
    features: [
      'Hasta 300 pedidos mensuales',
      '1 Estación KDS de Cocina',
      'Punto de Venta POS & Catálogo PWA',
      'Calculadora Resumen K de Insumos',
      'Comprobantes de Pago WhatsApp & Efectivo',
    ],
  },
  pro: {
    id: 'pro',
    name: 'Pro / Alto Volumen',
    badge: 'Popular',
    description: 'Para restaurantes consolidados con múltiples estaciones de cocina (Plancha + SideQuest).',
    monthlyPriceCents: 7900,
    monthlyPriceFormatted: '$79 USD/mes',
    maxMonthlyOrders: 2000,
    maxKitchenStations: 2,
    hasSummaryKCalculator: true,
    hasCustomDomain: true,
    hasPrioritySupport: true,
    hasDedicatedR2Bucket: false,
    features: [
      'Hasta 2,000 pedidos mensuales',
      '2 Estaciones KDS Desacopladas (Plancha & SideQuest)',
      'Subdominio personalizado (ej. tu-restaurante.chekeo.io)',
      'Corte de Caja Diario & Histórico de 14 Días',
      'Gestión de Banners, Rifas y Promociones',
      'Soporte Prioritario por WhatsApp',
    ],
  },
  enterprise: {
    id: 'enterprise',
    name: 'Enterprise / Franquicia Flagship',
    badge: 'Empresarial',
    description: 'Plataforma completa sin límites para marcas flagship y cadenas multisede.',
    monthlyPriceCents: 19900,
    monthlyPriceFormatted: '$199 USD/mes',
    maxMonthlyOrders: 'unlimited',
    maxKitchenStations: 5,
    hasSummaryKCalculator: true,
    hasCustomDomain: true,
    hasPrioritySupport: true,
    hasDedicatedR2Bucket: true,
    features: [
      'Pedidos mensuales ilimitados',
      'Hasta 5 Estaciones KDS Especializadas',
      'Dominio Propio Independiente (Cloudflare Custom Hostname)',
      'Bucket R2 dedicado y aislamiento total de datos',
      'Múltiples sucursales y comanderías simultáneas',
      'SLA de 99.9% y soporte telefónico 24/7',
    ],
  },
};

export type SaaSSubscriptionStatus =
  | 'trialing'
  | 'active'
  | 'past_due'
  | 'canceled'
  | 'unpaid'
  | 'incomplete';

export interface SaaSSubscription {
  id: string;
  tenantId: string;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  planTier: SaaSPlanTier;
  status: SaaSSubscriptionStatus;
  currentPeriodStart?: string;
  currentPeriodEnd?: string;
  cancelAtPeriodEnd: boolean;
  trialEndsAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SaaSTenantRecord {
  id: string;
  slug: string;
  brandName: string;
  shortName: string;
  tagline?: string;
  logoEmoji: string;
  defaultFoodType: string;
  accentColor: string;
  radiusStyle: 'rounded' | 'modern' | 'sharp';
  planTier: SaaSPlanTier;
  status: 'active' | 'trial' | 'suspended';
  ownerEmail?: string;
  ownerPhone?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SaaSPlatformMetrics {
  totalMonthlyRecurringRevenueUsd: number;
  activeTenantsCount: number;
  totalOrdersProcessedAllTime: number;
  plansBreakdown: {
    starter: number;
    pro: number;
    enterprise: number;
  };
}
