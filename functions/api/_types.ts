import type { Hono } from 'hono';

export type Bindings = {
  // Bindings canónicos de Restaurante (Base / Tenant)
  BOG_MENU_DB?: D1Database;
  BOG_MENU_ASSETS?: R2Bucket;
  BOG_INTERNAL_PIN?: string;
  ORDERS_V2_WRITE_ENABLED?: string;
  BOG_ENVIRONMENT?: string;

  // Bindings exclusivos del SaaS Control Plane
  SAAS_CONTROL_DB?: D1Database;
  SAAS_ASSETS_BUCKET?: R2Bucket;
  STRIPE_SECRET_KEY?: string;
  STRIPE_WEBHOOK_SECRET?: string;
  SAAS_MODE_ENABLED?: string;
};

export type Variables = {
  adminAuthenticated?: boolean;
  orderEnvironment?: 'production' | 'preview';
  resolvedTenantId?: string;
};

export type AppEnv = {
  Bindings: Bindings;
  Variables: Variables;
};

export type AppHono = Hono<AppEnv>;
