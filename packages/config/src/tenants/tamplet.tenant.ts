import type { TenantConfig } from '../tenant.types';

export const TAMPLET_TENANT: TenantConfig = {
  id: 'tamplet',
  brandName: 'Mi Restaurante',
  shortName: 'Restaurante',
  tagline: 'Menú Digital & Pedidos',
  categoryHeadline: 'Especialidades',
  logoEmoji: '🍽️',
  defaultFoodType: 'other',
  theme: {
    accentColor: '#2563EB',        // Azul moderno neutro
    accentColorDark: '#3B82F6',
    accentColorSoft: 'rgba(37, 99, 235, 0.1)',
    secondaryColor: '#4F46E5',
    surfaceColor: '#F8FAFC',       // Fondo gris neutro claro
    surfaceCardColor: '#FFFFFF',
    surfaceRaisedColor: '#F1F5F9',
    surfaceAltColor: '#F8FAFC',
    lineColor: '#E2E8F0',
    shadowCta: '0 4px 20px rgba(37, 99, 235, 0.3)',
    heroGradient: 'from-blue-600 via-indigo-600 to-slate-800',

    radiusStyle: 'modern',
    radiusCard: '0.75rem',        // 12px
    radiusButton: '0.5rem',        // 8px
    radiusBadge: '9999px',
    radiusInput: '0.5rem',

    terminology: {
      itemSingular: 'Platillo',
      itemPlural: 'Platillos',
      customizationTitle: 'Personalizar platillo',
      combosLabel: 'Paquetes & Combos',
      cartCtaLabel: 'Realizar Pedido',
      searchPlaceholder: 'Buscar platillos, bebidas, postres...',
      heroHeadline: '¡Bienvenidos a nuestro menú digital!',
      heroSubtitle: 'Ordena tus platillos favoritos en línea de forma rápida y sencilla.',
    },
    accentLabel: 'Azul Neutro',
  },
  bankPayment: {
    bankName: 'Banco',
    accountHolder: 'Titular de Cuenta',
    clabe: '000000000000000000',
  },
  supportPhone: '+52 55 0000 0000',
  whatsappTemplates: {
    orderGreeting: '¡Hola! 👋 Quiero confirmar mi pedido:',
    paymentFollowUp: 'Hola, te escribimos respecto a tu pedido:',
    orderReady: '¡Tu pedido está listo! ✨',
    orderDelivered: '¡Muchas gracias por tu compra!',
  },
  features: {
    rafflesAndReferrals: 'coming-soon',
    couponsAndPromoCodes: 'coming-soon',
    onlineCardPayments: 'coming-soon',
    liveGpsTracking: 'coming-soon',
    loyaltyPointsRewards: 'coming-soon',
    advancedWeeklyScheduling: 'enabled',
    groupOfficeOrdering: 'coming-soon',
    inAppLiveChatSupport: 'coming-soon',
    cashCutZReports: 'coming-soon',
    salesAnalyticsExport: 'coming-soon',
    inventoryWasteTracking: 'coming-soon',
    cfdiInvoicing: 'coming-soon',
    autoThermalPrinting: 'coming-soon',
    decoupledMultiStationKds: 'enabled',
    smsPushOrderNotifications: 'coming-soon',
    promotionalBanners: 'enabled',
    recipeCustomization: 'enabled',
    oneClickReorder: 'enabled',
  },
};
