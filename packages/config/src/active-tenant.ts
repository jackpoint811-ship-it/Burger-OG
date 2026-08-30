import { BURGERS_EXE_TENANT } from './tenants/burgers-exe.tenant';
import { TAMPLET_TENANT } from './tenants/tamplet.tenant';
import { AMSI_TORTAS_TENANT } from './tenants/amsi-tortas.tenant';
import type { TenantConfig, TenantFeatureFlags, FeatureStatus } from './tenant.types';

export const TENANTS_REGISTRY: Record<string, TenantConfig> = {
  'burgers-exe': BURGERS_EXE_TENANT,
  'tamplet': TAMPLET_TENANT,
  'template': TAMPLET_TENANT,
  'amsi-tortas': AMSI_TORTAS_TENANT,
  'amsi': AMSI_TORTAS_TENANT,
};

export function resolveTenantId(): string {
  // 1. Inyección por variable de compilación Node / Vite
  if (typeof process !== 'undefined' && process.env?.APP_TENANT) {
    return process.env.APP_TENANT.toLowerCase().trim();
  }

  // 2. Variable global o import.meta si está disponible en Vite
  // @ts-ignore
  if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_APP_TENANT) {
    // @ts-ignore
    return import.meta.env.VITE_APP_TENANT.toLowerCase().trim();
  }

  // 3. Detección por Hostname en navegador
  if (typeof window !== 'undefined' && window.location) {
    const hostname = window.location.hostname.toLowerCase();
    if (hostname.includes('amsi') || hostname.includes('torta')) return 'amsi-tortas';
    if (hostname.includes('tamplet') || hostname.includes('template')) return 'tamplet';

    // Query param override for testing (ej. ?tenant=amsi-tortas)
    const params = new URLSearchParams(window.location.search);
    const tenantParam = params.get('tenant') || params.get('brand');
    if (tenantParam && TENANTS_REGISTRY[tenantParam.toLowerCase().trim()]) {
      return tenantParam.toLowerCase().trim();
    }
  }

  return 'burgers-exe';
}

export function getActiveTenant(): TenantConfig {
  const tenantId = resolveTenantId();
  return TENANTS_REGISTRY[tenantId] || BURGERS_EXE_TENANT;
}

export function isFeatureEnabled(featureKey: keyof TenantFeatureFlags, tenant = getActiveTenant()): boolean {
  return tenant.features[featureKey] === 'enabled';
}

export function isFeatureComingSoon(featureKey: keyof TenantFeatureFlags, tenant = getActiveTenant()): boolean {
  return tenant.features[featureKey] === 'coming-soon';
}

export function isFeatureDisabled(featureKey: keyof TenantFeatureFlags, tenant = getActiveTenant()): boolean {
  return tenant.features[featureKey] === 'disabled';
}

export function getFeatureStatus(featureKey: keyof TenantFeatureFlags, tenant = getActiveTenant()): FeatureStatus {
  return tenant.features[featureKey] ?? 'disabled';
}
