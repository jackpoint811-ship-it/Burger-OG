import { z } from 'zod';

export const saasOnboardingSchema = z.object({
  brandName: z.string().min(2, 'El nombre de la marca debe tener al menos 2 caracteres').max(60),
  shortName: z.string().min(2, 'El nombre corto debe tener al menos 2 caracteres').max(30),
  slug: z
    .string()
    .min(2, 'El slug debe tener al menos 2 caracteres')
    .max(30)
    .regex(/^[a-z0-9-]+$/, 'El slug solo puede contener letras minúsculas, números y guiones'),
  tagline: z.string().max(120).optional(),
  logoEmoji: z.string().min(1).max(10).default('🍽️'),
  defaultFoodType: z.enum([
    'burger',
    'torta',
    'chilaquiles',
    'combo',
    'side',
    'drink',
    'extra',
    'dessert',
    'other',
  ]).default('other'),
  accentColor: z.string().regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, 'Color hexadecimal inválido').default('#16A34A'),
  radiusStyle: z.enum(['sharp', 'modern', 'rounded', 'pill']).default('rounded'),

  ownerEmail: z.string().email('Correo electrónico inválido'),
  ownerPhone: z.string().min(10, 'El teléfono debe tener al menos 10 dígitos').max(15),
  pinCode: z.string().min(4, 'El PIN debe tener 4 dígitos').max(6).default('1234'),

  planTier: z.enum(['starter', 'pro', 'enterprise']).default('starter'),
  bankName: z.string().max(60).optional(),
  bankAccountHolder: z.string().max(80).optional(),
  bankClabe: z.string().max(20).optional(),

  menuTemplate: z.enum(['burgers', 'tortas_chilaquiles', 'tacos', 'blank']).default('blank'),
});

export const saasCheckoutSchema = z.object({
  tenantId: z.string().min(1, 'ID del tenant requerido'),
  planTier: z.enum(['starter', 'pro', 'enterprise']),
  successUrl: z.string().url('URL de éxito inválida'),
  cancelUrl: z.string().url('URL de cancelación inválida'),
});

export const saasBillingPortalSchema = z.object({
  tenantId: z.string().min(1, 'ID del tenant requerido'),
  returnUrl: z.string().url('URL de retorno inválida'),
});

export const saasTenantUpdateSchema = z.object({
  brandName: z.string().min(2).max(60).optional(),
  shortName: z.string().min(2).max(30).optional(),
  tagline: z.string().max(120).optional(),
  logoEmoji: z.string().min(1).max(10).optional(),
  accentColor: z.string().regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/).optional(),
  radiusStyle: z.enum(['sharp', 'modern', 'rounded', 'pill']).optional(),
  supportPhone: z.string().max(15).optional(),
  bankName: z.string().max(60).optional(),
  bankAccountHolder: z.string().max(80).optional(),
  bankClabe: z.string().max(20).optional(),
  customDomain: z.string().max(100).optional(),
});
