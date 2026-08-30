/**
 * saas.schemas.ts — Esquemas de Validación Zod para SaaS Multi-Tenant
 */

import { z } from 'zod';

export const saasPlanTierSchema = z.enum(['starter', 'pro', 'enterprise']);

export const saasOnboardingSchema = z.object({
  brandName: z.string().min(2, 'El nombre del restaurante debe tener al menos 2 caracteres').max(50),
  shortName: z.string().min(2).max(25),
  slug: z
    .string()
    .min(2)
    .max(30)
    .regex(/^[a-z0-9-]+$/, 'El slug solo puede contener letras minúsculas, números y guiones'),
  tagline: z.string().max(100).optional().default(''),
  logoEmoji: z.string().min(1).max(8).default('🍽️'),
  defaultFoodType: z.enum(['burger', 'torta', 'pizza', 'taco', 'drink', 'side', 'combo', 'other']).default('other'),
  accentColor: z
    .string()
    .regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, 'Color hexadecimal inválido')
    .default('#16A34A'),
  radiusStyle: z.enum(['rounded', 'modern', 'sharp']).default('rounded'),
  ownerEmail: z.string().email('Correo electrónico inválido'),
  ownerPhone: z.string().min(8, 'Teléfono debe tener al menos 8 dígitos').max(20),
  pinCode: z.string().length(4, 'El PIN debe ser de 4 dígitos').regex(/^\d+$/, 'Solo dígitos').default('1234'),
  planTier: saasPlanTierSchema.default('starter'),
  menuTemplate: z.enum(['burgers', 'tortas_chilaquiles', 'tacos', 'blank']).default('burgers'),
});

export const saasCheckoutSchema = z.object({
  tenantId: z.string().min(1),
  planTier: saasPlanTierSchema,
  successUrl: z.string().url().optional(),
  cancelUrl: z.string().url().optional(),
});

export const saasBillingPortalSchema = z.object({
  tenantId: z.string().min(1),
  returnUrl: z.string().url().optional(),
});

export type SaasOnboardingInput = z.infer<typeof saasOnboardingSchema>;
export type SaasCheckoutInput = z.infer<typeof saasCheckoutSchema>;
export type SaasBillingPortalInput = z.infer<typeof saasBillingPortalSchema>;
