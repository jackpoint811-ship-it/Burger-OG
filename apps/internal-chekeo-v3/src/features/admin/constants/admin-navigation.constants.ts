/**
 * admin-navigation.constants.ts — Chekeo V3
 *
 * Estructura jerárquica de Categorías Maestras, Submenús y Buscador Global
 * para el Panel de Control de Admin V3.
 */

import type {
  AdminMasterCategory,
  AdminPinnedFavorite,
  AdminSearchItem,
} from '../types/admin.types';

export interface AdminCategoryDefinition {
  id: AdminMasterCategory;
  title: string;
  shortTitle: string;
  subtitle: string;
  tag: string;
  iconName: string;
  colorClass: string;
  badgeColor: string;
  subcategories: AdminSubcategoryDefinition[];
}

export interface AdminSubcategoryDefinition {
  id: string;
  title: string;
  shortTitle: string;
  description: string;
  iconName: string;
  tag: string;
}

export const ADMIN_CATEGORIES_CONFIG: AdminCategoryDefinition[] = [
  {
    id: 'menu',
    title: 'Menú, Catálogo & Stock',
    shortTitle: 'Menú & Stock',
    subtitle: 'Catálogo, precios en vivo, existencias y fotos en R2',
    tag: 'Catálogo',
    iconName: 'UtensilsCrossed',
    colorClass: 'text-accent bg-accent/10 border-accent/20',
    badgeColor: 'bg-accent/10 text-accent border-accent/20',
    subcategories: [
      {
        id: 'catalog',
        title: 'Catálogo Completo',
        shortTitle: 'Catálogo',
        description: 'Gestión y edición de platillos, hamburguesas, combos y modificadores.',
        iconName: 'Layers',
        tag: 'Platillos',
      },
      {
        id: 'quick-stock',
        title: 'Control de Stock Diario',
        shortTitle: 'Stock',
        description: 'Pausa rápida de platillos agotados y ajuste de existencias del turno en vivo.',
        iconName: 'Zap',
        tag: 'Existencias',
      },
      {
        id: 'promos',
        title: 'Promociones & Ofertas',
        shortTitle: 'Promociones',
        description: 'Platillos en oferta, precios promocionales y badges de descuento.',
        iconName: 'Sparkles',
        tag: 'Ofertas',
      },
      {
        id: 'create',
        title: 'Dar de Alta Platillo',
        shortTitle: 'Nuevo Platillo',
        description: 'Crea un nuevo platillo o combo con optimización de foto en R2.',
        iconName: 'Plus',
        tag: 'Crear',
      },
    ],
  },
  {
    id: 'towers',
    title: 'Torres, Logística & Horarios',
    shortTitle: 'Torres & Rutas',
    subtitle: 'Edificios corporativos, ventanas de entrega y horas de corte',
    tag: 'Logística',
    iconName: 'Building2',
    colorClass: 'text-blue-500 bg-blue-500/10 border-blue-500/20',
    badgeColor: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    subcategories: [
      {
        id: 'active-towers',
        title: 'Edificios & Rutas Activas',
        shortTitle: 'Edificios',
        description: 'Habilitar o pausar la recepción de pedidos para Torre GGA y Torre Valcob.',
        iconName: 'Building2',
        tag: 'Edificios',
      },
      {
        id: 'schedules',
        title: 'Horarios de Entrega & Corte',
        shortTitle: 'Horarios',
        description: 'Ventanas de entrega a comensales y hora límite de recepción de pedidos.',
        iconName: 'Clock',
        tag: 'Horarios',
      },
      {
        id: 'service-days',
        title: 'Días Operativos de Servicio',
        shortTitle: 'Días de Ruta',
        description: 'Días hábiles de la semana habilitados para entrega corporativa.',
        iconName: 'Calendar',
        tag: 'Calendario',
      },
    ],
  },
  {
    id: 'banners',
    title: 'Marketing & Banners Tienda',
    shortTitle: 'Banners & Promos',
    subtitle: 'Carrusel interactivo en tienda pública con Live Preview WYSIWYG',
    tag: 'Marketing',
    iconName: 'Image',
    colorClass: 'text-purple-500 bg-purple-500/10 border-purple-500/20',
    badgeColor: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
    subcategories: [
      {
        id: 'carousel',
        title: 'Carrusel de Tienda Pública',
        shortTitle: 'Carrusel',
        description: 'Banners activos visibles por los comensales y orden de rotación.',
        iconName: 'Image',
        tag: 'Visuales',
      },
      {
        id: 'cta-links',
        title: 'Acciones & Enlaces Directos',
        shortTitle: 'Links CTA',
        description: 'Configuración de botones directos a categorías, combos o dinámicas.',
        iconName: 'ArrowUpRight',
        tag: 'Acciones',
      },
      {
        id: 'create',
        title: 'Crear Nuevo Banner',
        shortTitle: 'Nuevo Banner',
        description: 'Diseñador de banners con gradientes temáticos y Live Preview en tiempo real.',
        iconName: 'Plus',
        tag: 'Crear',
      },
    ],
  },
  {
    id: 'raffles',
    title: 'Lealtad, Sorteos & Referidos',
    shortTitle: 'Sorteos & Rifas',
    subtitle: 'Boletos por compra y referidos, ruleta de selección de ganador',
    tag: 'Lealtad',
    iconName: 'Gift',
    colorClass: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
    badgeColor: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
    subcategories: [
      {
        id: 'campaign',
        title: 'Campaña Activa & Reglas',
        shortTitle: 'Campaña',
        description: 'Título de la rifa, fechas de vigencia y boletos emitidos por pedido.',
        iconName: 'Trophy',
        tag: 'Reglas',
      },
      {
        id: 'participants',
        title: 'Participantes & Auditoría',
        shortTitle: 'Participantes',
        description: 'Listado de clientes con saldo de boletos y ajuste manual auditado.',
        iconName: 'Users',
        tag: 'Boletos',
      },
      {
        id: 'referrals',
        title: 'Códigos de Referidos',
        shortTitle: 'Referidos',
        description: 'Gestión de códigos únicos de recomendación palabra+número.',
        iconName: 'Share2',
        tag: 'Códigos',
      },
      {
        id: 'roulette',
        title: 'Ruleta de Ganador',
        shortTitle: 'Ruleta',
        description: 'Sorteo animado en vivo con selección aleatoria ponderada por boletos.',
        iconName: 'Sparkles',
        tag: 'Sorteo',
      },
    ],
  },
  {
    id: 'cashcut',
    title: 'Finanzas, Arqueo & Corte Z',
    shortTitle: 'Corte de Caja',
    subtitle: 'Balance del turno, conciliación Transferencia vs Efectivo y CSV',
    tag: 'Finanzas',
    iconName: 'Calculator',
    colorClass: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
    badgeColor: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
    subcategories: [
      {
        id: 'today-cut',
        title: 'Corte de Turno Hoy (CDMX)',
        shortTitle: 'Corte Hoy',
        description: 'Ingreso bruto, pedidos entregados y ticket promedio del día en hora CDMX.',
        iconName: 'Calculator',
        tag: 'Balance',
      },
      {
        id: 'reconciliation',
        title: 'Conciliación de Métodos',
        shortTitle: 'Conciliación',
        description: 'Desglose exacto de cobros en Transferencia vs Efectivo en caja.',
        iconName: 'CreditCard',
        tag: 'Métodos',
      },
      {
        id: 'export-csv',
        title: 'Exportar Reporte a CSV',
        shortTitle: 'Exportar CSV',
        description: 'Descarga del archivo estructurado con el historial de pedidos para contabilidad.',
        iconName: 'FileSpreadsheet',
        tag: 'Reportes',
      },
      {
        id: 'z-cut',
        title: 'Realizar Arqueo Z',
        shortTitle: 'Arqueo Z',
        description: 'Cierre formal de turno con archivado de órdenes procesadas.',
        iconName: 'ShieldCheck',
        tag: 'Cierre',
      },
    ],
  },
  {
    id: 'ingredients',
    title: 'Insumos, Recetas & Costeo',
    shortTitle: 'Insumos & Costeo',
    subtitle: 'Materia prima en D1, costeo unitario y recetas del Resumen K',
    tag: 'Cocina',
    iconName: 'Wheat',
    colorClass: 'text-orange-500 bg-orange-500/10 border-orange-500/20',
    badgeColor: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
    subcategories: [
      {
        id: 'catalog',
        title: 'Catálogo de Insumos D1',
        shortTitle: 'Materia Prima',
        description: 'Precios de compra, unidades de medida y stock de ingredientes.',
        iconName: 'Wheat',
        tag: 'Insumos',
      },
      {
        id: 'recipes',
        title: 'Recetario por Hamburguesa',
        shortTitle: 'Recetario K',
        description: 'Porciones de ingredientes vinculadas directamente al Resumen K de Cocina.',
        iconName: 'ChefHat',
        tag: 'Recetas',
      },
      {
        id: 'costing',
        title: 'Costeo & Rendimiento',
        shortTitle: 'Costeo',
        description: 'Cálculo de costo de alimentos (Food Cost) y margen por producto.',
        iconName: 'TrendingUp',
        tag: 'Márgenes',
      },
    ],
  },
  {
    id: 'billing',
    title: 'Facturación & Suscripción SaaS',
    shortTitle: 'Mi Suscripción',
    subtitle: 'Plan activo de Chekeo, límites, facturas y portal Stripe',
    tag: 'SaaS',
    iconName: 'CreditCard',
    colorClass: 'text-sky-500 bg-sky-500/10 border-sky-500/20',
    badgeColor: 'bg-sky-500/10 text-sky-500 border-sky-500/20',
    subcategories: [
      {
        id: 'current-plan',
        title: 'Plan Activo & Cuotas',
        shortTitle: 'Mi Plan',
        description: 'Límites de pedidos, estaciones KDS y estado de facturación.',
        iconName: 'CreditCard',
        tag: 'Plan',
      },
      {
        id: 'upgrade',
        title: 'Mejorar Plan / Upgrades',
        shortTitle: 'Upgrades',
        description: 'Desbloquea KDS multi-estación, dominios propios y soporte 24/7.',
        iconName: 'Sparkles',
        tag: 'Planes',
      },
    ],
  },
  {
    id: 'superadmin',
    title: 'SaaS Control Plane & Marcas',
    shortTitle: 'Super Admin',
    subtitle: 'Directorio de todos los restaurantes, MRR y onboarding',
    tag: 'Control',
    iconName: 'ShieldCheck',
    colorClass: 'text-rose-500 bg-rose-500/10 border-rose-500/20',
    badgeColor: 'bg-rose-500/10 text-rose-500 border-rose-500/20',
    subcategories: [
      {
        id: 'tenants-directory',
        title: 'Directorio de Restaurantes',
        shortTitle: 'Marcas',
        description: 'Listado global de inquilinos, acceso directo a tiendas y POS.',
        iconName: 'Building2',
        tag: 'Directorio',
      },
      {
        id: 'onboarding-wizard',
        title: 'Lanzar Nuevo Restaurante',
        shortTitle: 'Nuevo Resto',
        description: 'Asistente de alta de nuevos restaurantes en 3 pasos.',
        iconName: 'Plus',
        tag: 'Alta',
      },
    ],
  },
];

export const DEFAULT_PINNED_FAVORITES: AdminPinnedFavorite[] = [
  {
    id: 'fav-cashcut-today',
    title: 'Corte de Turno Hoy',
    shortTitle: 'Corte Hoy',
    category: 'cashcut',
    toolId: 'today-cut',
    iconName: 'Calculator',
    tag: 'Finanzas',
  },
  {
    id: 'fav-menu-stock',
    title: 'Control de Stock Diario',
    shortTitle: 'Stock',
    category: 'menu',
    toolId: 'quick-stock',
    iconName: 'UtensilsCrossed',
    tag: 'Catálogo',
  },
  {
    id: 'fav-towers-active',
    title: 'Edificios & Horarios',
    shortTitle: 'Torres',
    category: 'towers',
    toolId: 'active-towers',
    iconName: 'Building2',
    tag: 'Logística',
  },
  {
    id: 'fav-billing-plan',
    title: 'Mi Suscripción SaaS',
    shortTitle: 'Suscripción',
    category: 'billing',
    toolId: 'current-plan',
    iconName: 'CreditCard',
    tag: 'SaaS',
  },
  {
    id: 'fav-superadmin-hub',
    title: 'Super Admin Multi-Tenant',
    shortTitle: 'Super Admin',
    category: 'superadmin',
    toolId: 'tenants-directory',
    iconName: 'ShieldCheck',
    tag: 'Control',
  },
  {
    id: 'fav-ingredients-catalog',
    title: 'Insumos & Costos D1',
    shortTitle: 'Insumos',
    category: 'ingredients',
    toolId: 'catalog',
    iconName: 'Wheat',
    tag: 'Cocina',
  },
];

export const ADMIN_SEARCH_INDEX: AdminSearchItem[] = [
  // Menú
  {
    id: 'search-menu-all',
    title: 'Catálogo Completo de Menú',
    description: 'Gestión de hamburguesas, combos, papas, bebidas y precios.',
    category: 'menu',
    categoryLabel: 'Menú & Stock',
    toolId: 'catalog',
    keywords: ['menu', 'platillos', 'burgers', 'combos', 'precios', 'fotos', 'catalogo', 'papas'],
    iconName: 'UtensilsCrossed',
  },
  {
    id: 'search-menu-stock',
    title: 'Control de Stock Diario',
    description: 'Pausar o habilitar existencias de platillos en tiempo real.',
    category: 'menu',
    categoryLabel: 'Menú & Stock',
    toolId: 'quick-stock',
    keywords: ['stock', 'agotado', 'disponible', 'pausar', 'existencias', 'limite'],
    iconName: 'Zap',
  },
  {
    id: 'search-menu-promos',
    title: 'Promociones & Precios en Oferta',
    description: 'Precios de oferta y etiquetas de promoción activa.',
    category: 'menu',
    categoryLabel: 'Menú & Stock',
    toolId: 'promos',
    keywords: ['promociones', 'ofertas', 'descuentos', 'promo', 'rebajas'],
    iconName: 'Sparkles',
  },
  {
    id: 'search-menu-create',
    title: 'Dar de Alta Nuevo Platillo',
    description: 'Crear una nueva hamburguesa, combo o guarnición con foto en R2.',
    category: 'menu',
    categoryLabel: 'Menú & Stock',
    toolId: 'create',
    keywords: ['crear', 'nuevo', 'alta', 'agregar', 'platillo', 'foto'],
    iconName: 'Plus',
  },

  // Torres
  {
    id: 'search-towers-all',
    title: 'Torres Corporativas & Horarios',
    description: 'Configurar Torre GGA, Torre Valcob, cortes y entregas.',
    category: 'towers',
    categoryLabel: 'Torres & Horarios',
    toolId: 'active-towers',
    keywords: ['torres', 'gga', 'valcob', 'edificios', 'rutas', 'horarios', 'corte', 'entrega'],
    iconName: 'Building2',
  },

  // Banners
  {
    id: 'search-banners-all',
    title: 'Banners de Tienda Pública',
    description: 'Carrusel publicitario, promociones visuales y Live Preview.',
    category: 'banners',
    categoryLabel: 'Marketing & Banners',
    toolId: 'carousel',
    keywords: ['banners', 'publicidad', 'carrusel', 'promocion', 'imagenes', 'wysiwyg'],
    iconName: 'Image',
  },

  // Sorteos
  {
    id: 'search-raffles-roulette',
    title: 'Ruleta de Ganador de Sorteo',
    description: 'Sorteo animado en vivo para seleccionar al ganador.',
    category: 'raffles',
    categoryLabel: 'Lealtad & Sorteos',
    toolId: 'roulette',
    keywords: ['ruleta', 'sorteo', 'rifa', 'ganador', 'premios', 'girar'],
    iconName: 'Sparkles',
  },
  {
    id: 'search-raffles-tickets',
    title: 'Participantes & Boletos de Rifa',
    description: 'Consultar boletos por cliente y realizar ajustes manuales.',
    category: 'raffles',
    categoryLabel: 'Lealtad & Sorteos',
    toolId: 'participants',
    keywords: ['boletos', 'participantes', 'tickets', 'referidos', 'ajuste'],
    iconName: 'Users',
  },

  // Finanzas
  {
    id: 'search-cashcut-today',
    title: 'Corte de Caja de Hoy (Arqueo Z)',
    description: 'Ventas brutas del día, conciliación Transferencia vs Efectivo.',
    category: 'cashcut',
    categoryLabel: 'Finanzas & Corte',
    toolId: 'today-cut',
    keywords: ['corte', 'caja', 'arqueo', 'dinero', 'ventas', 'spei', 'transferencia', 'efectivo', 'z'],
    iconName: 'Calculator',
  },

  // Insumos
  {
    id: 'search-ingredients-all',
    title: 'Insumos, Recetas & Food Cost',
    description: 'Materia prima en D1, costeo por burger y Resumen K.',
    category: 'ingredients',
    categoryLabel: 'Insumos & Recetas',
    toolId: 'catalog',
    keywords: ['insumos', 'recetas', 'ingredientes', 'carne', 'pan', 'costos', 'resumen k', 'food cost'],
    iconName: 'Wheat',
  },

  // SaaS Facturación
  {
    id: 'search-billing-all',
    title: 'Mi Suscripción & Facturación SaaS',
    description: 'Administrar plan de Chekeo, límites y portal Stripe.',
    category: 'billing',
    categoryLabel: 'Mi Suscripción',
    toolId: 'current-plan',
    keywords: ['suscripcion', 'plan', 'stripe', 'pago', 'facturacion', 'upgrade', 'tarjeta'],
    iconName: 'CreditCard',
  },

  // SaaS Super Admin
  {
    id: 'search-superadmin-all',
    title: 'Super Admin Multi-Tenant',
    description: 'Directorio de restaurantes, métricas MRR y nuevo restaurante.',
    category: 'superadmin',
    categoryLabel: 'Super Admin',
    toolId: 'tenants-directory',
    keywords: ['superadmin', 'tenants', 'mrr', 'restaurantes', 'onboarding', 'alta', 'marcas'],
    iconName: 'ShieldCheck',
  },
];
