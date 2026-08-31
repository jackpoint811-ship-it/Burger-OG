-- ============================================================================
-- 0002_saas_control_plane_seed.sql — Seed Canónico de Tenants para el SaaS
-- ============================================================================

-- 1. Tenant Flagship #0: Burgers.exe
INSERT OR REPLACE INTO saas_tenants (
  id,
  slug,
  brand_name,
  short_name,
  tagline,
  logo_emoji,
  default_food_type,
  accent_color,
  radius_style,
  plan_tier,
  status,
  owner_email,
  owner_phone,
  pin_code,
  menu_template,
  custom_domain,
  features_override_json,
  theme_override_json
) VALUES (
  'burgers-exe',
  'burgers-exe',
  'Burgers.exe',
  'Burgers.exe',
  'Hamburguesas artesanales, smash y combos a tu medida.',
  '🍔',
  'burger',
  '#16A34A',
  'rounded',
  'enterprise',
  'active',
  'admin@burgers.exe',
  '+525512345678',
  '1234',
  'burgers',
  'burgers-exe.pages.dev',
  '{}',
  '{}'
);

INSERT OR REPLACE INTO saas_subscriptions (
  id,
  tenant_id,
  stripe_customer_id,
  stripe_subscription_id,
  plan_tier,
  status,
  current_period_start,
  current_period_end,
  cancel_at_period_end
) VALUES (
  'sub_flagship_burgers_exe',
  'burgers-exe',
  'cus_flagship_enterprise',
  'sub_flagship_enterprise_0',
  'enterprise',
  'active',
  '2026-08-01 00:00:00',
  '2027-08-01 00:00:00',
  0
);

INSERT OR REPLACE INTO saas_users (
  id,
  tenant_id,
  email,
  role,
  name,
  phone,
  is_active
) VALUES (
  'usr_burgers_owner',
  'burgers-exe',
  'admin@burgers.exe',
  'owner',
  'Burgers.exe Master Admin',
  '+525512345678',
  1
);

-- 2. Tenant #1: Amsi Tortas
INSERT OR REPLACE INTO saas_tenants (
  id,
  slug,
  brand_name,
  short_name,
  tagline,
  logo_emoji,
  default_food_type,
  accent_color,
  radius_style,
  plan_tier,
  status,
  owner_email,
  owner_phone,
  pin_code,
  menu_template,
  custom_domain,
  features_override_json,
  theme_override_json
) VALUES (
  'amsi-tortas',
  'amsi-tortas',
  'Amsi Tortas',
  'Amsi Tortas',
  'Tortas de chilaquiles con milanesa, desayunos mexicanos y café de olla.',
  '🥪',
  'torta',
  '#EA580C',
  'rounded',
  'pro',
  'active',
  'hola@amsitortas.com',
  '+525587654321',
  '1234',
  'tortas_chilaquiles',
  'amsi-tortas.pages.dev',
  '{}',
  '{}'
);

INSERT OR REPLACE INTO saas_subscriptions (
  id,
  tenant_id,
  stripe_customer_id,
  stripe_subscription_id,
  plan_tier,
  status,
  current_period_start,
  current_period_end,
  cancel_at_period_end
) VALUES (
  'sub_amsi_tortas_pro',
  'amsi-tortas',
  'cus_amsi_tortas',
  'sub_amsi_tortas_pro_1',
  'pro',
  'active',
  '2026-08-20 00:00:00',
  '2026-09-20 00:00:00',
  0
);

INSERT OR REPLACE INTO saas_users (
  id,
  tenant_id,
  email,
  role,
  name,
  phone,
  is_active
) VALUES (
  'usr_amsi_owner',
  'amsi-tortas',
  'hola@amsitortas.com',
  'owner',
  'Amsi Tortas Administrador',
  '+525587654321',
  1
);

-- 3. Tenant #2: Template Base en Blanco ('tamplet')
INSERT OR REPLACE INTO saas_tenants (
  id,
  slug,
  brand_name,
  short_name,
  tagline,
  logo_emoji,
  default_food_type,
  accent_color,
  radius_style,
  plan_tier,
  status,
  owner_email,
  owner_phone,
  pin_code,
  menu_template,
  custom_domain,
  features_override_json,
  theme_override_json
) VALUES (
  'tamplet',
  'tamplet',
  'Template Base',
  'Template',
  'Instancia base lista para clonar y desplegar nuevas marcas.',
  '📋',
  'other',
  '#2563EB',
  'rounded',
  'starter',
  'active',
  'support@chekeo.io',
  '+525500000000',
  '1234',
  'blank',
  'tamplet.chekeo.io',
  '{}',
  '{}'
);

INSERT OR REPLACE INTO saas_subscriptions (
  id,
  tenant_id,
  stripe_customer_id,
  stripe_subscription_id,
  plan_tier,
  status,
  current_period_start,
  current_period_end,
  cancel_at_period_end
) VALUES (
  'sub_template_starter',
  'tamplet',
  'cus_tamplet_starter',
  'sub_tamplet_starter_0',
  'starter',
  'active',
  '2026-08-30 00:00:00',
  '2026-09-30 00:00:00',
  0
);
