-- =============================================================================
-- SaaS Control Plane: Schema de Control Central y Multi-Tenancy
-- Base de Datos: resto-saas-control-plane-production / preview
-- =============================================================================

-- 1. Inquilinos / Restaurantes Registrados en la Plataforma
CREATE TABLE IF NOT EXISTS saas_tenants (
  id TEXT PRIMARY KEY,                       -- Slug único (ej: 'burgers-exe', 'amsi-tortas', 'tacos-el-guero')
  slug TEXT UNIQUE NOT NULL,                 -- Subdominio canónico (ej: 'burgers', 'amsitortas')
  brand_name TEXT NOT NULL,                  -- Nombre comercial (ej: 'Burgers.exe', 'Amsi Tortas')
  short_name TEXT NOT NULL,
  tagline TEXT DEFAULT '',
  logo_emoji TEXT DEFAULT '🍔',
  logo_url TEXT,
  default_food_type TEXT DEFAULT 'burger',   -- 'burger', 'torta', 'taco', 'pizza', 'other'
  
  -- Identidad Visual y Estilos (Taste Skill)
  accent_color TEXT DEFAULT '#16A34A',
  accent_color_dark TEXT DEFAULT '#22C55E',
  surface_color TEXT DEFAULT '#F5F2EE',
  surface_card_color TEXT DEFAULT '#FFFFFF',
  radius_style TEXT DEFAULT 'rounded',       -- 'sharp', 'modern', 'rounded', 'pill'
  
  -- Información de Contacto y Dueño
  owner_email TEXT NOT NULL,
  owner_phone TEXT NOT NULL,
  support_phone TEXT,
  
  -- Datos Bancarios para Cobro Directo (Transferencia / SPEI)
  bank_name TEXT,
  bank_account_holder TEXT,
  bank_clabe TEXT,
  
  -- Configuración de Dominio y Despliegue
  custom_domain TEXT UNIQUE,                 -- ej: 'pedidos.burgers.com'
  d1_database_id TEXT,                       -- ID opcional de D1 física dedicada
  
  -- Estado y Lifecycle
  status TEXT NOT NULL DEFAULT 'active',     -- 'trial', 'active', 'past_due', 'suspended', 'cancelled'
  features_json TEXT,                        -- JSON serializado de TenantFeatureFlags
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 2. Facturación y Suscripciones SaaS (Stripe Integration)
CREATE TABLE IF NOT EXISTS saas_subscriptions (
  id TEXT PRIMARY KEY,                       -- 'sub_...' o UUID
  tenant_id TEXT NOT NULL REFERENCES saas_tenants(id) ON DELETE CASCADE,
  stripe_customer_id TEXT UNIQUE NOT NULL,
  stripe_subscription_id TEXT UNIQUE,
  plan_tier TEXT NOT NULL DEFAULT 'starter', -- 'starter', 'pro', 'enterprise'
  status TEXT NOT NULL DEFAULT 'active',     -- 'active', 'past_due', 'canceled', 'trialing', 'incomplete'
  current_period_start TEXT,
  current_period_end TEXT,
  cancel_at_period_end INTEGER DEFAULT 0,
  monthly_price_cents INTEGER NOT NULL DEFAULT 2900, -- $29.00 USD
  currency TEXT DEFAULT 'USD',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 3. Usuarios Administradores y Personal del Restaurante
CREATE TABLE IF NOT EXISTS saas_users (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES saas_tenants(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT,
  role TEXT NOT NULL DEFAULT 'admin',        -- 'owner', 'admin', 'kitchen', 'cashier'
  pin_code TEXT NOT NULL DEFAULT '1234',
  is_active INTEGER DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (tenant_id, email)
);

-- 4. Registro Idempotente de Webhooks de Stripe
CREATE TABLE IF NOT EXISTS saas_webhook_events (
  id TEXT PRIMARY KEY,                       -- 'evt_...' de Stripe
  event_type TEXT NOT NULL,
  tenant_id TEXT,
  payload_json TEXT NOT NULL,
  processed_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 5. Registro de Auditoría y Actividad del SaaS
CREATE TABLE IF NOT EXISTS saas_audit_logs (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  user_id TEXT,
  action TEXT NOT NULL,                      -- 'tenant_created', 'plan_upgraded', 'settings_updated', etc.
  metadata_json TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Índices de Rendimiento
CREATE INDEX IF NOT EXISTS idx_saas_tenants_slug ON saas_tenants(slug);
CREATE INDEX IF NOT EXISTS idx_saas_tenants_status ON saas_tenants(status);
CREATE INDEX IF NOT EXISTS idx_saas_subs_tenant ON saas_subscriptions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_saas_subs_stripe_cust ON saas_subscriptions(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_saas_users_tenant ON saas_users(tenant_id);
CREATE INDEX IF NOT EXISTS idx_saas_audit_tenant ON saas_audit_logs(tenant_id);
