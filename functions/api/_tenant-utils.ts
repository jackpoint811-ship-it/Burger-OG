/**
 * _tenant-utils.ts — Utilidades de Resolución Multi-Tenant en Backend Cloudflare
 */

import type { Context } from 'hono';
import type { AppEnv } from './_types';
import { TENANTS_REGISTRY } from '../../packages/config/src/active-tenant';
import type { TenantConfig } from '../../packages/config/src/tenant.types';

/**
 * Resuelve el identificador de tenant activo a partir de la petición HTTP
 */
export function resolveRequestTenantId(c: Context<AppEnv>): string {
  // 1. Header explícito X-Tenant-Id
  const headerTenant = c.req.header('x-tenant-id') || c.req.header('x-brand-id');
  if (headerTenant && headerTenant.trim()) {
    return headerTenant.trim().toLowerCase();
  }

  // 2. Query param de URL (ej. ?tenant=amsi-tortas)
  const queryTenant = c.req.query('tenant') || c.req.query('brand');
  if (queryTenant && queryTenant.trim()) {
    return queryTenant.trim().toLowerCase();
  }

  // 3. Variable de entorno del Worker / Pages Function
  if (c.env?.APP_TENANT && c.env.APP_TENANT.trim()) {
    return c.env.APP_TENANT.trim().toLowerCase();
  }

  // 4. Hostname / Subdominio de Cloudflare Pages o Custom Domain
  const host = (c.req.header('host') || '').toLowerCase();
  if (host.includes('amsi') || host.includes('torta')) {
    return 'amsi-tortas';
  }
  if (host.includes('tamplet') || host.includes('template')) {
    return 'tamplet';
  }

  return 'burgers-exe';
}

/**
 * Obtiene la configuración estática o de fallback para un tenant
 */
export function getStaticTenantConfig(tenantId: string): TenantConfig {
  return TENANTS_REGISTRY[tenantId] || TENANTS_REGISTRY['burgers-exe'];
}

/**
 * Obtiene la base de datos D1 correspondiente para el Control Plane
 */
export function getControlPlaneDb(c: Context<AppEnv>): D1Database | undefined {
  return c.env?.SAAS_CONTROL_PLANE_DB || c.env?.BOG_MENU_DB;
}
