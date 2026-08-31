-- ============================================================================
-- 0001_saas_control_plane.sql — Esquema D1 del Control Plane SaaS Multi-Tenant
-- ============================================================================

PRAGMA foreign_keys = ON;

-- 1. Tabla Maestra de Tenants (Restaurantes y Marcas Alojadas)
CREATE TABLE IF NOT EXISTS saas_tenants (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  brand_name TEXT NOT NULL,
  short_name TEXT NOT NULL,
  tagline TEXT,
  logo_emoji TEXT NOT NULL DEFAULT '🍽️',
  default_food_type TEXT NOT NULL DEFAULT 'other',
  accent_color TEXT NOT NULL DEFAULT '#16A34A',
  radius_style TEXT NOT NULL DEFAULT 'rounded',
  plan_tier TEXT NOT NULL DEFAULT 'starter',
  status TEXT NOT NULL DEFAULT 'active',
  owner_email TEXT,
  owner_phone TEXT,
  pin_code TEXT NOT NULL DEFAULT '1234',
  menu_template TEXT NOT NULL DEFAULT 'burgers',
  custom_domain TEXT,
  features_override_json TEXT DEFAULT '{}',
  theme_override_json TEXT DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 2. Tabla de Suscripciones y Facturación (Stripe / Planes)
CREATE TABLE IF NOT EXISTS saas_subscriptions (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  plan_tier TEXT NOT NULL DEFAULT 'starter',
  status TEXT NOT NULL DEFAULT 'active',
  current_period_start TEXT,
  current_period_end TEXT,
  cancel_at_period_end INTEGER NOT NULL DEFAULT 0,
  trial_ends_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES saas_tenants(id) ON DELETE CASCADE
);

-- 3. Tabla de Usuarios y Operadores por Tenant
CREATE TABLE IF NOT EXISTS saas_users (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'owner',
  name TEXT NOT NULL,
  phone TEXT,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES saas_tenants(id) ON DELETE CASCADE
);

-- 4. Bitácora de Auditoría del Control Plane
CREATE TABLE IF NOT EXISTS saas_audit_logs (
  id TEXT PRIMARY KEY,
  tenant_id TEXT,
  actor TEXT NOT NULL,
  action TEXT NOT NULL,
  details_json TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Índices de Alto Rendimiento para D1
CREATE INDEX IF NOT EXISTS idx_saas_tenants_slug ON saas_tenants(slug);
CREATE INDEX IF NOT EXISTS idx_saas_tenants_status ON saas_tenants(status);
CREATE INDEX IF NOT EXISTS idx_saas_subscriptions_tenant ON saas_subscriptions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_saas_subscriptions_status ON saas_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_saas_users_tenant ON saas_users(tenant_id);
CREATE INDEX IF NOT EXISTS idx_saas_audit_tenant ON saas_audit_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_saas_audit_created ON saas_audit_logs(created_at);
