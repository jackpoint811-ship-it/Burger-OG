import { z } from 'zod';

// ==========================================
// 1. Catálogo & Menú Schemas
// ==========================================

export const AvailabilitySchema = z.object({
  isAvailable: z.boolean(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  days: z.array(z.number()).optional(),
});

export const AssetRefSchema = z.object({
  imageUrl: z.string().optional(),
  imageKey: z.string().optional(),
  contentType: z.string().optional(),
  alt: z.string().default(''),
  placeholder: z.string().default(''),
});

export const ComboItemOptionSchema = z.object({
  sku: z.string(),
  isDefault: z.boolean().optional(),
  upchargeCents: z.number().int().default(0),
});

export const ComboOptionGroupSchema = z.object({
  id: z.string(),
  name: z.string(),
  isRequired: z.boolean().default(false),
  minSelections: z.number().int().default(0),
  maxSelections: z.number().int().default(1),
  options: z.array(ComboItemOptionSchema).default([]),
});

export const MenuItemComboConfigSchema = z.object({
  isCombo: z.boolean().default(false),
  bundlePriceCents: z.number().int().default(0),
  optionGroups: z.array(ComboOptionGroupSchema).default([]),
});

export const MenuCategorySchema = z.object({
  id: z.string(),
  key: z.string(),
  name: z.string(),
  emoji: z.string().optional(),
  sortOrder: z.number().int().default(0),
  updatedAt: z.string().optional(),
});

export const MenuItemSchema = z.object({
  sku: z.string().min(1, 'SKU requerido'),
  category: z.string(),
  name: z.string().min(1, 'Nombre requerido'),
  description: z.string().default(''),
  price: z.number().nonnegative(),
  promoPrice: z.number().nonnegative().optional(),
  isPromoActive: z.boolean().optional(),
  promoExpiresAt: z.string().optional(),
  comboConfig: MenuItemComboConfigSchema.optional(),
  imageUrl: z.string().optional(),
  imageKey: z.string().optional(),
  badge: z.string().optional(),
  promoLabel: z.string().optional(),
  isFeatured: z.boolean().default(false),
  isAvailable: z.boolean().default(true),
  isHidden: z.boolean().optional(),
  stockManaged: z.boolean().optional(),
  stockLimit: z.number().nullable().optional(),
  stockRemaining: z.number().nullable().optional(),
  soldOutAt: z.string().nullable().optional(),
  sortOrder: z.number().default(0),
  tags: z.array(z.string()).default([]),
  upsellItems: z.array(z.string()).default([]),
  comboLinks: z.array(z.string()).default([]),
  updatedAt: z.string().optional(),
  availability: AvailabilitySchema.optional(),
});

export const MenuCategoryBannerSchema = z.object({
  categoryKey: z.string(),
  title: z.string().optional(),
  subtitle: z.string().optional(),
  imageKey: z.string().optional(),
  imageUrl: z.string().optional(),
  updatedAt: z.string().default(''),
});

export const CatalogBannerSchema = z.object({
  id: z.string(),
  title: z.string(),
  subtitle: z.string().optional(),
  ctaLabel: z.string().optional(),
  imageKey: z.string().optional(),
  imageUrl: z.string().optional(),
  bgPreset: z.string().optional(),
  badgeText: z.string().optional(),
  badgeColor: z.string().optional(),
  ctaActionType: z.string().optional(),
  ctaTarget: z.string().optional(),
  isActive: z.boolean().default(true),
  sortOrder: z.number().default(0),
  updatedAt: z.string().optional(),
});

// ==========================================
// 2. Horarios por Torre
// ==========================================

export const TowerScheduleSchema = z.object({
  id: z.string(),
  towerKey: z.string(),
  towerName: z.string(),
  emoji: z.string().default('🏢'),
  activeDays: z.array(z.number()),
  orderStartTime: z.string(),
  orderEndTime: z.string(),
  deliveryStartTime: z.string(),
  deliveryEndTime: z.string(),
  deliveryLabel: z.string().nullable().optional(),
  isActive: z.boolean().default(true),
  updatedAt: z.string().optional(),
});

// ==========================================
// 3. Creación de Pedidos (Public Order V3)
// ==========================================

export const CreateOrderItemCustomizationSchema = z.object({
  lineKey: z.string().optional(),
  itemDisplayIndex: z.number().int().optional(),
  itemKind: z.enum(['burger', 'combo', 'garnish', 'drink', 'other']).optional(),
  removedIngredients: z.array(z.string()).optional(),
  extras: z.array(z.object({
    sku: z.string().optional(),
    name: z.string(),
    price: z.number().optional(),
  })).optional(),
  burgerNote: z.string().optional(),
  garnish: z.object({
    sku: z.string().optional(),
    name: z.string(),
    upcharge: z.number().optional(),
  }).nullable().optional(),
  includedDrink: z.object({
    sku: z.string().optional(),
    name: z.string(),
  }).nullable().optional(),
  sideQuestExtras: z.array(z.object({
    sku: z.string().optional(),
    name: z.string(),
    price: z.number().optional(),
    itemKind: z.enum(['garnish', 'drink']).optional(),
  })).optional(),
  comboBurgers: z.array(z.object({
    sku: z.string().optional(),
    name: z.string(),
    removedIngredients: z.array(z.string()),
    extras: z.array(z.object({
      sku: z.string().optional(),
      name: z.string(),
      price: z.number().optional(),
    })),
    burgerNote: z.string().optional(),
  })).optional(),
  extrasTotalCents: z.number().optional(),
  sideQuestExtrasTotalCents: z.number().optional(),
  includedGarnishUpchargeCents: z.number().optional(),
});

export const CreateOrderItemSchema = z.object({
  sku: z.string().min(1, 'SKU requerido'),
  quantity: z.number().int().positive('La cantidad debe ser mayor a 0'),
  customization: CreateOrderItemCustomizationSchema.optional(),
  note: z.string().optional(),
});

export const CreateOrderV2PayloadSchema = z.object({
  customerName: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  customerPhone: z.string().regex(/^\d{10}$/, 'Ingresa un número telefónico de 10 dígitos'),
  locationKey: z.string().min(1, 'Selecciona una torre de entrega'),
  orderMode: z.enum(['pickup', 'delivery']).default('delivery'),
  paymentMethod: z.enum(['cash', 'transfer', 'card', 'unknown']).default('cash'),
  items: z.array(CreateOrderItemSchema).min(1, 'El carrito no puede estar vacío'),
  customerNotes: z.string().optional(),
  idempotencyKey: z.string().optional(),
  isScheduled: z.boolean().optional(),
  scheduledDate: z.string().optional(),
  scheduledTime: z.string().optional(),
  referralCode: z.string().optional(),
  wantsWhatsappGroup: z.boolean().optional(),
});

// ==========================================
// 4. Pedidos Completos (OrderV2 DTO)
// ==========================================

export const OrderV2DeliveryInfoSchema = z.object({
  location: z.string().optional(),
  isScheduled: z.boolean().optional(),
  scheduledDate: z.string().optional(),
  scheduledTime: z.string().optional(),
  customerNotes: z.string().optional(),
});

export const OrderV2ItemSchema = z.object({
  id: z.string(),
  orderId: z.string(),
  sku: z.string(),
  name: z.string(),
  qty: z.number().int().positive(),
  unitPrice: z.number(),
  lineTotal: z.number(),
  modifiers: z.array(z.object({
    type: z.enum(['remove', 'extra', 'upgrade', 'note']),
    code: z.string().optional(),
    name: z.string(),
    priceCents: z.number(),
  })).optional(),
  components: z.array(z.object({
    kind: z.enum(['garnish', 'drink', 'side']),
    sku: z.string(),
    name: z.string(),
    upchargeCents: z.number(),
  })).optional(),
  snapshot: z.record(z.string(), z.unknown()).optional(),
  createdAt: z.string().optional(),
});

export const OrderV2Schema = z.object({
  id: z.string(),
  folio: z.string(),
  customerName: z.string(),
  customerPhone: z.string(),
  location: z.string(),
  mode: z.enum(['pickup', 'delivery']),
  status: z.enum(['new', 'preparing', 'ready', 'delivered', 'cancelled']),
  paymentMethod: z.enum(['cash', 'transfer', 'card', 'unknown']),
  paymentStatus: z.enum(['pending', 'paid', 'cancelled']),
  paymentAmount: z.number(),
  total: z.number(),
  notes: z.string().optional(),
  environment: z.enum(['production', 'preview']),
  source: z.enum(['public-v2', 'public-v2-preview', 'internal-v2', 'seed', 'import']),
  items: z.array(OrderV2ItemSchema),
  delivery: OrderV2DeliveryInfoSchema.optional(),
  createdAt: z.string(),
  updatedAt: z.string().optional(),
  archivedAt: z.string().nullable().optional(),
  raffleTicketsCount: z.number().int().optional(),
});

// ==========================================
// 5. Sorteos & Referidos Schemas
// ==========================================

export const RaffleCampaignSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Nombre de campaña requerido'),
  description: z.string().default(''),
  status: z.enum(['draft', 'active', 'paused', 'completed']).default('active'),
  ticketsPerOrder: z.number().int().default(1),
  ticketsPerBurger: z.number().int().default(1),
  ticketsPerCombo: z.number().int().default(2),
  ticketsPerReferral: z.number().int().default(2),
  bannerImageUrl: z.string().optional(),
  detailImageUrl: z.string().optional(),
  startsAt: z.string().optional(),
  endsAt: z.string().optional(),
  drawDate: z.string().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

// ==========================================
// 6. Ingredientes & Recetas Schemas
// ==========================================

export const IngredientSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Nombre de ingrediente requerido'),
  category: z.string().default('general'),
  unit: z.string().default('pz'),
  costPerUnitCents: z.number().int().default(0),
  isRemovable: z.boolean().default(true),
  isExtra: z.boolean().default(false),
  extraPriceCents: z.number().int().default(0),
  isActive: z.boolean().default(true),
});

// ==========================================
// Inferred TypeScript Types
// ==========================================

export type ZodMenuItem = z.infer<typeof MenuItemSchema>;
export type ZodMenuCategory = z.infer<typeof MenuCategorySchema>;
export type ZodTowerSchedule = z.infer<typeof TowerScheduleSchema>;
export type ZodCreateOrderPayload = z.infer<typeof CreateOrderV2PayloadSchema>;
export type ZodOrderV2 = z.infer<typeof OrderV2Schema>;
export type ZodRaffleCampaign = z.infer<typeof RaffleCampaignSchema>;
export type ZodIngredient = z.infer<typeof IngredientSchema>;

// ==========================================
// Validation Helpers
// ==========================================

export function validateCreateOrderPayload(data: unknown): { success: true; data: ZodCreateOrderPayload } | { success: false; error: string; fieldErrors: Record<string, string[] | undefined> } {
  const result = CreateOrderV2PayloadSchema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  const formatted = result.error.flatten();
  return {
    success: false,
    error: result.error.issues[0]?.message ?? 'Datos de pedido inválidos',
    fieldErrors: formatted.fieldErrors,
  };
}

export function validateMenuItem(data: unknown): { success: true; data: ZodMenuItem } | { success: false; error: string } {
  const result = MenuItemSchema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return {
    success: false,
    error: result.error.issues[0]?.message ?? 'Datos de producto inválidos',
  };
}
