import type { TenantFeatureFlags, TenantRadiusStyle, FoodTypeKind } from './tenant.types';

export type SaaSPlanTier = 'starter' | 'pro' | 'enterprise';

export type SaaSSubscriptionStatus = 'active' | 'past_due' | 'canceled' | 'trialing' | 'incomplete';

export interface SaaSPlanConfig {
  id: SaaSPlanTier;
  name: string;
  badge: string;
  monthlyPriceCents: number;
  monthlyPriceFormatted: string;
  description: string;
  features: string[];
  limits: {
    maxMonthlyOrders: number | 'unlimited';
    kdsStations: number;
    customDomain: boolean;
    stripeConnectCardPayments: boolean;
    miseEnPlaceSummaryK: boolean;
    autoThermalPrinting: boolean;
    prioritySupport: boolean;
  };
}

export const SAAS_PLANS: Record<SaaSPlanTier, SaaSPlanConfig> = {
  starter: {
    id: 'starter',
    name: 'Starter / Dark Kitchen',
    badge: '🍳 Básico',
    monthlyPriceCents: 2900,
    monthlyPriceFormatted: '$29 USD/mes',
    description: 'Para cocinas emergentes y restaurantes que inician su digitalización.',
    features: [
      'Tienda pública PWA con catálogo y personalización',
      'Comandería Chekeo POS y toma de pedidos en vivo',
      'Recepción de pedidos y confirmación por WhatsApp',
      'Cobros por Transferencia y Efectivo',
      'Hasta 150 pedidos al mes',
    ],
    limits: {
      maxMonthlyOrders: 150,
      kdsStations: 1,
      customDomain: false,
      stripeConnectCardPayments: false,
      miseEnPlaceSummaryK: false,
      autoThermalPrinting: false,
      prioritySupport: false,
    },
  },
  pro: {
    id: 'pro',
    name: 'Pro / Alto Volumen',
    badge: '🍔 Recomendado',
    monthlyPriceCents: 7900,
    monthlyPriceFormatted: '$79 USD/mes',
    description: 'Para restaurantes consolidados que buscan máxima velocidad y control de insumos.',
    features: [
      'Todo lo del plan Starter',
      'Pedidos ilimitados sin comisiones',
      'KDS Cocina con 2 estaciones independientes (Plancha + Side Quest)',
      'Resumen K (Calculadora de Insumos & Mise en Place)',
      'Banners dinámicos y promociones avanzadas',
      'Sorteos y códigos de referidos para fidelización',
    ],
    limits: {
      maxMonthlyOrders: 'unlimited',
      kdsStations: 2,
      customDomain: false,
      stripeConnectCardPayments: false,
      miseEnPlaceSummaryK: true,
      autoThermalPrinting: false,
      prioritySupport: true,
    },
  },
  enterprise: {
    id: 'enterprise',
    name: 'Enterprise / Multi-Sucursal',
    badge: '🏢 Corporativo',
    monthlyPriceCents: 19900,
    monthlyPriceFormatted: '$199 USD/mes',
    description: 'Para marcas en expansión, cadenas de restaurantes y operaciones de escala.',
    features: [
      'Todo lo del plan Pro',
      'Dominio propio personalizado con SSL automático (Cloudflare for SaaS)',
      'Pagos con tarjeta en línea vía Stripe Connect',
      'KDS Multi-estación desacoplado (hasta 4 estaciones)',
      'Impresión térmica automática ESC/POS en red',
      'Soporte prioritario 24/7 y onboarding asistido',
    ],
    limits: {
      maxMonthlyOrders: 'unlimited',
      kdsStations: 4,
      customDomain: true,
      stripeConnectCardPayments: true,
      miseEnPlaceSummaryK: true,
      autoThermalPrinting: true,
      prioritySupport: true,
    },
  },
};

export interface SaaSTenantRecord {
  id: string;
  slug: string;
  brandName: string;
  shortName: string;
  tagline?: string;
  logoEmoji: string;
  logoUrl?: string;
  defaultFoodType: FoodTypeKind;
  accentColor: string;
  accentColorDark: string;
  surfaceColor: string;
  surfaceCardColor: string;
  radiusStyle: TenantRadiusStyle;
  ownerEmail: string;
  ownerPhone: string;
  supportPhone?: string;
  bankName?: string;
  bankAccountHolder?: string;
  bankClabe?: string;
  customDomain?: string;
  d1DatabaseId?: string;
  status: 'trial' | 'active' | 'past_due' | 'suspended' | 'cancelled';
  featuresJson?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SaaSSubscriptionRecord {
  id: string;
  tenantId: string;
  stripeCustomerId: string;
  stripeSubscriptionId?: string;
  planTier: SaaSPlanTier;
  status: SaaSSubscriptionStatus;
  currentPeriodStart?: string;
  currentPeriodEnd?: string;
  cancelAtPeriodEnd: boolean;
  monthlyPriceCents: number;
  currency: string;
  createdAt: string;
  updatedAt: string;
}

export interface SaaSUserRecord {
  id: string;
  tenantId: string;
  email: string;
  name?: string;
  role: 'owner' | 'admin' | 'kitchen' | 'cashier';
  pinCode: string;
  isActive: boolean;
  createdAt: string;
}

export interface SaaSOnboardingPayload {
  // Paso 1: Marca & Branding
  brandName: string;
  shortName: string;
  slug: string;
  tagline?: string;
  logoEmoji: string;
  defaultFoodType: FoodTypeKind;
  accentColor: string;
  radiusStyle: TenantRadiusStyle;

  // Paso 2: Datos de Contacto & Dueño
  ownerEmail: string;
  ownerPhone: string;
  pinCode: string;

  // Paso 3: Cobros & Plan
  planTier: SaaSPlanTier;
  bankName?: string;
  bankAccountHolder?: string;
  bankClabe?: string;

  // Template de Menú Inicial
  menuTemplate: 'burgers' | 'tortas_chilaquiles' | 'tacos' | 'blank';
}

export interface SaaSMetricsSummary {
  activeTenantsCount: number;
  trialTenantsCount: number;
  totalMonthlyRecurringRevenueUsd: number;
  totalOrdersProcessedAllTime: number;
  plansBreakdown: {
    starter: number;
    pro: number;
    enterprise: number;
  };
}
