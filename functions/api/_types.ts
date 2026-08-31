import type { Hono } from 'hono';

export type Bindings = {
  BOG_MENU_DB?: D1Database;
  BOG_MENU_ASSETS?: R2Bucket;
  BOG_INTERNAL_PIN?: string;
  ORDERS_V2_WRITE_ENABLED?: string;
  BOG_ENVIRONMENT?: string;
  SAAS_CONTROL_PLANE_DB?: D1Database;
  SAAS_BRAND_ASSETS?: R2Bucket;
  SAAS_ADMIN_KEY?: string;
  APP_TENANT?: string;
};

export type Variables = {
  adminAuthenticated?: boolean;
  orderEnvironment?: 'production' | 'preview';
  tenantId?: string;
};

export type AppEnv = {
  Bindings: Bindings;
  Variables: Variables;
};

export type AppHono = Hono<AppEnv>;
