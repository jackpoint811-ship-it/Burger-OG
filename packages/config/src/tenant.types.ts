export type FeatureStatus = 'enabled' | 'coming-soon' | 'disabled';

export type TenantFeatureFlags = {
  // Tienda Pública (Client PWA)
  /** Sorteos, rifas y códigos de referidos */
  rafflesAndReferrals: FeatureStatus;
  /** Cupones y códigos de descuento */
  couponsAndPromoCodes: FeatureStatus;
  /** Pagos con tarjeta en línea (Stripe / Mercado Pago) */
  onlineCardPayments: FeatureStatus;
  /** Rastreo GPS de repartidor en mapa */
  liveGpsTracking: FeatureStatus;
  /** Programa de puntos y cashback de fidelidad */
  loyaltyPointsRewards: FeatureStatus;
  /** Programación de pedidos para días posteriores / semanal */
  advancedWeeklyScheduling: FeatureStatus;
  /** Pedido grupal / Split Bill para oficinas */
  groupOfficeOrdering: FeatureStatus;
  /** Chat de soporte en vivo en la app */
  inAppLiveChatSupport: FeatureStatus;

  // Chekeo POS, KDS y Administración (Interno)
  /** Arqueo Z y auditoría de caja avanzada */
  cashCutZReports: FeatureStatus;
  /** Dashboard de métricas exportables y analíticas */
  salesAnalyticsExport: FeatureStatus;
  /** Control de inventario y alertas de mermas/stock */
  inventoryWasteTracking: FeatureStatus;
  /** Facturación electrónica CFDI 4.0 */
  cfdiInvoicing: FeatureStatus;
  /** Auto-impresión en red / Bluetooth ESC/POS */
  autoThermalPrinting: FeatureStatus;
  /** Comandería KDS multi-estación desacoplada (4 estaciones) */
  decoupledMultiStationKds: FeatureStatus;
  /** Notificaciones automáticas SMS / Push a clientes */
  smsPushOrderNotifications: FeatureStatus;

  // Características Generales
  /** Banners promocionales dinámicos */
  promotionalBanners: FeatureStatus;
  /** Personalización de ingredientes de recetas */
  recipeCustomization: FeatureStatus;
  /** Reordenar en 1-clic */
  oneClickReorder: FeatureStatus;
};

export type TenantTheme = {
  accentColor: string;
  accentColorDark: string;
  surfaceColor: string;
  surfaceCardColor: string;
  accentLabel?: string;
};

export type TenantBankPayment = {
  bankName: string;
  accountHolder: string;
  clabe: string;
  accountNumber?: string;
};

export type TenantWhatsappTemplates = {
  orderGreeting: string;
  paymentFollowUp: string;
  orderReady: string;
  orderDelivered?: string;
  orderCancelled?: string;
};

export type FoodTypeKind = 'burger' | 'torta' | 'chilaquiles' | 'combo' | 'side' | 'drink' | 'extra' | 'dessert' | 'other';

export type TenantConfig = {
  id: string;
  brandName: string;
  shortName: string;
  tagline: string;
  categoryHeadline: string;
  logoEmoji: string;
  defaultFoodType: FoodTypeKind;
  theme: TenantTheme;
  bankPayment: TenantBankPayment;
  supportPhone: string;
  whatsappTemplates: TenantWhatsappTemplates;
  features: TenantFeatureFlags;
};
