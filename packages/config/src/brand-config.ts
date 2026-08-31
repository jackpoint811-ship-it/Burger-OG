/**
 * brand-config.ts — Configuración Canónica de Marca para Burgers.exe
 *
 * Fuente única de verdad para la identidad visual, terminología y datos de Burgers.exe.
 */

export interface BrandTheme {
  accentColor: string;
  accentColorDark: string;
  accentColorSoft: string;
  secondaryColor: string;
  surfaceColor: string;
  surfaceCardColor: string;
  surfaceRaisedColor: string;
  surfaceAltColor: string;
  lineColor: string;
  shadowCta: string;
  heroGradient: string;
  radiusStyle: 'modern' | 'sharp' | 'pill';
  radiusCard: string;
  radiusButton: string;
  radiusBadge: string;
  radiusInput: string;
  terminology: {
    itemSingular: string;
    itemPlural: string;
    customizationTitle: string;
    combosLabel: string;
    cartCtaLabel: string;
    searchPlaceholder: string;
    heroHeadline: string;
    heroSubtitle: string;
  };
  accentLabel: string;
}

export interface BrandBankPayment {
  bankName: string;
  accountHolder: string;
  clabe: string;
}

export interface BrandConfig {
  id: string;
  brandName: string;
  shortName: string;
  tagline: string;
  categoryHeadline: string;
  logoEmoji: string;
  defaultFoodType: string;
  theme: BrandTheme;
  bankPayment: BrandBankPayment;
  supportPhone: string;
  whatsappTemplates: {
    orderGreeting: string;
    paymentFollowUp: string;
    orderReady: string;
    orderDelivered: string;
  };
  features: Record<string, 'enabled' | 'disabled' | 'coming-soon'>;
}

export const BRAND_CONFIG: BrandConfig = {
  id: 'burgers-exe',
  brandName: 'Burgers.exe',
  shortName: 'Burgers.exe',
  tagline: 'Smash Burgers Artesanales',
  categoryHeadline: 'Menú & Burgers',
  logoEmoji: '🍔',
  defaultFoodType: 'burger',
  theme: {
    accentColor: '#16A34A',        // Verde bosque premium
    accentColorDark: '#22C55E',
    accentColorSoft: 'rgba(22, 163, 74, 0.12)',
    secondaryColor: '#EAB308',     // Amarillo queso cheddar fundido
    surfaceColor: '#F5F2EE',       // Crema suave cálido
    surfaceCardColor: '#FFFFFF',
    surfaceRaisedColor: '#EAE6E1',
    surfaceAltColor: '#F9FAFB',
    lineColor: '#E2DCD5',
    shadowCta: '0 4px 20px rgba(22, 163, 74, 0.35)',
    heroGradient: 'from-amber-500/20 via-orange-500/10 to-transparent',

    radiusStyle: 'modern',
    radiusCard: '1rem',           // 16px
    radiusButton: '0.75rem',       // 12px
    radiusBadge: '9999px',
    radiusInput: '0.75rem',

    terminology: {
      itemSingular: 'Burger',
      itemPlural: 'Burgers',
      customizationTitle: 'Personalizar mi Burger',
      combosLabel: 'Combos & Paquetes',
      cartCtaLabel: 'Armar mi Pedido',
      searchPlaceholder: 'Buscar smash burgers, combos, papas...',
      heroHeadline: '¡Smash burgers artesanales!',
      heroSubtitle: 'Carne 100% de res, pan brioche sellado y queso fundido al momento.',
    },
    accentLabel: 'Verde Bosque',
  },
  bankPayment: {
    bankName: 'BBVA',
    accountHolder: 'Burgers.exe Oficial',
    clabe: '012180000000000000',
  },
  supportPhone: '+52 55 0000 0000',
  whatsappTemplates: {
    orderGreeting: '¡Hola Burgers.exe! 👋 Quiero confirmar mi pedido:',
    paymentFollowUp: 'Hola, te contactamos de Burgers.exe sobre tu pedido:',
    orderReady: '¡Tu orden de Burgers.exe está lista! 🔥',
    orderDelivered: '¡Muchas gracias por elegir Burgers.exe! 🔥',
  },
  features: {
    rafflesAndReferrals: 'enabled',
    couponsAndPromoCodes: 'disabled',
    onlineCardPayments: 'disabled',
    liveGpsTracking: 'disabled',
    loyaltyPointsRewards: 'disabled',
    advancedWeeklyScheduling: 'enabled',
    groupOfficeOrdering: 'disabled',
    inAppLiveChatSupport: 'disabled',
    cashCutZReports: 'enabled',
    salesAnalyticsExport: 'enabled',
    inventoryWasteTracking: 'enabled',
    cfdiInvoicing: 'disabled',
    autoThermalPrinting: 'disabled',
    decoupledMultiStationKds: 'enabled',
    smsPushOrderNotifications: 'disabled',
    promotionalBanners: 'enabled',
    recipeCustomization: 'enabled',
    oneClickReorder: 'enabled',
  },
};

/**
 * Helper de compatibilidad para componentes existentes.
 */
export function getBrandConfig(): BrandConfig {
  return BRAND_CONFIG;
}

export function getActiveTenant(): BrandConfig {
  return BRAND_CONFIG;
}

export function isFeatureEnabled(featureKey: string, _brand = BRAND_CONFIG): boolean {
  return BRAND_CONFIG.features[featureKey] === 'enabled';
}
