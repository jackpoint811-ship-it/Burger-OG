-- =============================================================================
-- SaaS Control Plane: Seed Inicial de Tenants Fundacionales
-- =============================================================================

-- Tenant #0: Burgers.exe (Cliente Insignia / Flagship)
INSERT OR REPLACE INTO saas_tenants (
  id, slug, brand_name, short_name, tagline, logo_emoji, default_food_type,
  accent_color, accent_color_dark, surface_color, surface_card_color, radius_style,
  owner_email, owner_phone, support_phone,
  bank_name, bank_account_holder, bank_clabe,
  status, created_at, updated_at
) VALUES (
  'burgers-exe', 'burgers', 'Burgers.exe', 'Burgers.exe', 'Hamburguesas artesanales premium en tu torre', '🍔', 'burger',
  '#16A34A', '#22C55E', '#F5F2EE', '#FFFFFF', 'rounded',
  'admin@burgers.exe', '5512345678', '5512345678',
  'BBVA México', 'Burgers.exe S.A. de C.V.', '012180001234567890',
  'active', datetime('now'), datetime('now')
);

INSERT OR REPLACE INTO saas_subscriptions (
  id, tenant_id, stripe_customer_id, stripe_subscription_id, plan_tier, status,
  monthly_price_cents, currency, current_period_end, created_at, updated_at
) VALUES (
  'sub_burgers_flagship', 'burgers-exe', 'cus_burgers_flagship', 'sub_burgers_enterprise', 'enterprise', 'active',
  19900, 'USD', datetime('now', '+1 year'), datetime('now'), datetime('now')
);

INSERT OR REPLACE INTO saas_users (
  id, tenant_id, email, name, role, pin_code, is_active
) VALUES (
  'usr_burgers_admin', 'burgers-exe', 'admin@burgers.exe', 'Chekeo Master', 'owner', '1234', 1
);

-- Tenant #1: Amsi Tortas (Especialidad Desayunos & Chilaquiles)
INSERT OR REPLACE INTO saas_tenants (
  id, slug, brand_name, short_name, tagline, logo_emoji, default_food_type,
  accent_color, accent_color_dark, surface_color, surface_card_color, radius_style,
  owner_email, owner_phone, support_phone,
  bank_name, bank_account_holder, bank_clabe,
  status, created_at, updated_at
) VALUES (
  'amsi-tortas', 'amsitortas', 'Amsi Tortas', 'Amsi', 'Tortas de chilaquiles & desayunos con sazón casero', '🥪', 'torta',
  '#EA580C', '#F97316', '#FAF6F0', '#FFFFFF', 'modern',
  'contacto@amsitortas.com', '5598765432', '5598765432',
  'Santander México', 'Amsi Alimentos', '014180009876543210',
  'active', datetime('now'), datetime('now')
);

INSERT OR REPLACE INTO saas_subscriptions (
  id, tenant_id, stripe_customer_id, stripe_subscription_id, plan_tier, status,
  monthly_price_cents, currency, current_period_end, created_at, updated_at
) VALUES (
  'sub_amsi_pro', 'amsi-tortas', 'cus_amsi_tortas', 'sub_amsi_pro_tier', 'pro', 'active',
  7900, 'USD', datetime('now', '+1 month'), datetime('now'), datetime('now')
);

INSERT OR REPLACE INTO saas_users (
  id, tenant_id, email, name, role, pin_code, is_active
) VALUES (
  'usr_amsi_admin', 'amsi-tortas', 'admin@amsitortas.com', 'Amsi Admin', 'owner', '1234', 1
);

-- Tenant #2: Template en Blanco (Para nuevos registros / Onboarding)
INSERT OR REPLACE INTO saas_tenants (
  id, slug, brand_name, short_name, tagline, logo_emoji, default_food_type,
  accent_color, accent_color_dark, surface_color, surface_card_color, radius_style,
  owner_email, owner_phone, support_phone,
  bank_name, bank_account_holder, bank_clabe,
  status, created_at, updated_at
) VALUES (
  'tamplet', 'tamplet', 'Mi Restaurante', 'MiResto', 'Tu comida favorita lista para ordenar', '🍽️', 'other',
  '#2563EB', '#3B82F6', '#F8FAFC', '#FFFFFF', 'modern',
  'demo@resto.app', '5500000000', '5500000000',
  'Banco Base', 'Mi Restaurante Demo', '000000000000000000',
  'trial', datetime('now'), datetime('now')
);

INSERT OR REPLACE INTO saas_subscriptions (
  id, tenant_id, stripe_customer_id, stripe_subscription_id, plan_tier, status,
  monthly_price_cents, currency, current_period_end, created_at, updated_at
) VALUES (
  'sub_tamplet_starter', 'tamplet', 'cus_tamplet_starter', 'sub_tamplet_trial', 'starter', 'trialing',
  2900, 'USD', datetime('now', '+14 days'), datetime('now'), datetime('now')
);
