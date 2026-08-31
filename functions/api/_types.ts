import type { Hono } from 'hono';

export type Bindings = {
  BOG_MENU_DB?: D1Database;
  BOG_MENU_ASSETS?: R2Bucket;
  BOG_INTERNAL_PIN?: string;
  ORDERS_V2_WRITE_ENABLED?: string;
  BOG_ENVIRONMENT?: string;
};

export type Variables = {
  adminAuthenticated?: boolean;
  orderEnvironment?: 'production' | 'preview';
};

export type AppEnv = {
  Bindings: Bindings;
  Variables: Variables;
};

export type AppHono = Hono<AppEnv>;
