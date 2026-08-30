import type { TenantConfig } from '../tenant.types';

export const AMSI_TORTAS_TENANT: TenantConfig = {
  id: 'amsi-tortas',
  brandName: 'Amsi Tortas',
  shortName: 'Amsi Tortas',
  tagline: 'Tortas de Chilaquiles & Especialidades',
  categoryHeadline: 'Tortas de Chilaquiles & Desayunos',
  logoEmoji: '🥪',
  defaultFoodType: 'torta',
  theme: {
    accentColor: '#EA580C',        // Naranja salsa chipotle tostada
    accentColorDark: '#F97316',
    accentColorSoft: 'rgba(234, 88, 12, 0.12)',
    secondaryColor: '#16A34A',     // Verde cilantro fresco
    surfaceColor: '#FAF6F0',       // Crema cálido masa/maíz
    surfaceCardColor: '#FFFFFF',
    surfaceRaisedColor: '#F3EBE1',
    surfaceAltColor: '#FDFBF7',
    lineColor: '#E8DFD5',
    shadowCta: '0 6px 24px rgba(234, 88, 12, 0.38)',
    heroGradient: 'from-orange-600 via-amber-600 to-red-600',

    // Curvaturas y Formas Artesanales
    radiusStyle: 'rounded',
    radiusCard: '1.25rem',        // 20px
    radiusButton: '1rem',          // 16px
    radiusBadge: '9999px',
    radiusInput: '0.75rem',        // 12px

    // Vocabulario Amsi Tortas
    terminology: {
      itemSingular: 'Torta',
      itemPlural: 'Tortas',
      customizationTitle: 'Personalizar mi Torta de Chilaquiles',
      combosLabel: 'Paquetes con Café & Jugo',
      cartCtaLabel: 'Ordenar mis Tortas',
      searchPlaceholder: 'Buscar tortas, chilaquiles, café de olla...',
      heroHeadline: '¡Tortas de chilaquiles calientitas!',
      heroSubtitle: 'Totopos dorados con salsas caseras y telera artesanal al momento.',
    },
    accentLabel: 'Naranja Salsa Chipotle',
  },
  bankPayment: {
    bankName: 'BBVA',
    accountHolder: 'Amsi Tortas Oficial',
    clabe: '012180000000000000',
  },
  supportPhone: '+52 55 0000 0000',
  whatsappTemplates: {
    orderGreeting: '¡Hola Amsi Tortas! 🥪 Quiero confirmar mi pedido:',
    paymentFollowUp: 'Hola, te escribimos de Amsi Tortas sobre tu pedido:',
    orderReady: '¡Tu pedido de Amsi Tortas está listo y bien calientito! 🥪🔥',
    orderDelivered: '¡Muchas gracias por elegir Amsi Tortas! 🥪 Esperamos que las disfrutes.',
  },
  features: {
    // Tienda Pública con funciones bloqueadas en "Próximamente"
    rafflesAndReferrals: 'coming-soon',       // 1. Sorteos & Referidos
    couponsAndPromoCodes: 'coming-soon',      // 2. Cupones de descuento
    onlineCardPayments: 'coming-soon',        // 3. Tarjeta en línea (Stripe/MP)
    liveGpsTracking: 'coming-soon',           // 4. Rastreo GPS en vivo
    loyaltyPointsRewards: 'coming-soon',      // 5. Puntos Amsi / Cashback
    advancedWeeklyScheduling: 'coming-soon',  // 6. Pedidos semanales
    groupOfficeOrdering: 'coming-soon',       // 7. Pedido grupal de oficina
    inAppLiveChatSupport: 'coming-soon',      // 8. Chat de soporte en app

    // Chekeo POS / KDS / Admin con bloqueos "Próximamente"
    cashCutZReports: 'coming-soon',           // 9. Arqueo Z avanzado
    salesAnalyticsExport: 'coming-soon',      // 10. Dashboard de métricas exportables
    inventoryWasteTracking: 'coming-soon',    // 11. Control de mermas/stock
    cfdiInvoicing: 'coming-soon',             // 12. Facturación CFDI 4.0
    autoThermalPrinting: 'coming-soon',       // 13. Auto-impresión ESC/POS
    decoupledMultiStationKds: 'coming-soon',  // 14. KDS 4 estaciones (1 estación activa)
    smsPushOrderNotifications: 'coming-soon', // 15. Notificaciones Push / SMS

    // Funciones activas al 100%
    promotionalBanners: 'enabled',
    recipeCustomization: 'enabled',
    oneClickReorder: 'enabled',
  },
};
