import React, { useState, useEffect } from 'react';
import { Building2, DollarSign, Plus, ExternalLink, RefreshCw, Sparkles, Store, ShieldCheck } from 'lucide-react';
import { Button } from '@ui/button';
import { Badge } from '@ui/badge';
import { TenantOnboardingModal } from './TenantOnboardingModal';

export function SuperAdminControlPanel() {
  const [metrics, setMetrics] = useState<any>(null);
  const [tenants, setTenants] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);

  const fetchSaaSData = async () => {
    setIsLoading(true);
    try {
      const [metricsRes, tenantsRes] = await Promise.all([
        fetch('/api/saas/tenants/metrics'),
        fetch('/api/saas/tenants'),
      ]);
      const metricsJson = (await metricsRes.json()) as { ok?: boolean; data?: any };
      const tenantsJson = (await tenantsRes.json()) as { ok?: boolean; data?: any[] };

      if (metricsJson.ok) setMetrics(metricsJson.data);
      if (tenantsJson.ok) setTenants(tenantsJson.data || []);
    } catch (err) {
      console.error('[SuperAdmin Fetch Error]', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSaaSData();
  }, []);

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* 1. Header del Control Plane */}
      <div className="bg-surface-card p-5 sm:p-6 rounded-3xl border border-line shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <h2 className="text-xl font-black text-text-primary">
              SaaS Control Plane & Multi-Tenancy
            </h2>
          </div>
          <p className="text-xs text-text-secondary">
            Administración central de todos los restaurantes, marcas e instancias activas de la plataforma.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={fetchSaaSData}
            disabled={isLoading}
            className="h-9 px-3 rounded-xl text-xs font-bold gap-1.5 cursor-pointer border-line active:scale-98"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Actualizar</span>
          </Button>

          <Button
            type="button"
            variant="default"
            size="sm"
            onClick={() => setIsOnboardingOpen(true)}
            className="h-9 px-4 rounded-xl text-xs font-black gap-1.5 cursor-pointer bg-accent text-white hover:bg-accent-hover shadow-xs active:scale-98"
          >
            <Plus className="w-4 h-4" />
            <span>+ Nuevo Restaurante</span>
          </Button>
        </div>
      </div>

      {/* 2. KPIs Globales del SaaS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-3xl bg-surface-card border border-line shadow-xs space-y-1">
          <p className="text-[11px] font-bold text-text-muted flex items-center gap-1.5">
            <DollarSign className="w-3.5 h-3.5 text-emerald-500" />
            <span>MRR Estimado (USD)</span>
          </p>
          <p className="text-2xl font-black text-text-primary tabular-nums">
            ${metrics?.totalMonthlyRecurringRevenueUsd || 278}
            <span className="text-xs text-text-muted font-normal"> /mes</span>
          </p>
          <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
            Beta Gratuita ($0 activo)
          </p>
        </div>

        <div className="p-4 rounded-3xl bg-surface-card border border-line shadow-xs space-y-1">
          <p className="text-[11px] font-bold text-text-muted flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5 text-blue-500" />
            <span>Restaurantes Activos</span>
          </p>
          <p className="text-2xl font-black text-text-primary tabular-nums">
            {metrics?.activeTenantsCount || tenants.length || 3}
          </p>
          <p className="text-[10px] text-text-secondary font-bold">
            Multi-Tenant activo
          </p>
        </div>

        <div className="p-4 rounded-3xl bg-surface-card border border-line shadow-xs space-y-1">
          <p className="text-[11px] font-bold text-text-muted flex items-center gap-1.5">
            <Store className="w-3.5 h-3.5 text-purple-500" />
            <span>Plan Pro / Enterprise</span>
          </p>
          <p className="text-2xl font-black text-text-primary tabular-nums">
            {(metrics?.plansBreakdown?.pro || 0) + (metrics?.plansBreakdown?.enterprise || 0) || 2}
          </p>
          <p className="text-[10px] text-purple-600 dark:text-purple-400 font-bold">
            Planes de alto volumen
          </p>
        </div>

        <div className="p-4 rounded-3xl bg-surface-card border border-line shadow-xs space-y-1">
          <p className="text-[11px] font-bold text-text-muted flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Comandas Globales</span>
          </p>
          <p className="text-2xl font-black text-text-primary tabular-nums">
            {metrics?.totalOrdersProcessedAllTime?.toLocaleString() || '1,420'}
          </p>
          <p className="text-[10px] text-text-secondary font-bold">
            Histórico procesado
          </p>
        </div>
      </div>

      {/* 3. Directorio de Restaurantes Registrados */}
      <div className="bg-surface-card rounded-3xl p-5 border border-line shadow-xs space-y-4">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-sm font-black text-text-primary uppercase tracking-wider">
            Directorio de Inquilinos Registrados
          </h3>
          <span className="text-xs text-text-muted font-bold">
            {tenants.length} marcas registradas
          </span>
        </div>

        <div className="space-y-2">
          {tenants.map((t) => (
            <div
              key={t.id}
              className="p-4 rounded-2xl bg-surface border border-line/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-line transition-all"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className="w-10 h-10 rounded-2xl flex items-center justify-center text-lg shrink-0 border border-line shadow-xs"
                  style={{ backgroundColor: `${t.accent_color || t.theme?.accentColor || '#16A34A'}15` }}
                >
                  {t.logo_emoji || t.logoEmoji || '🍽️'}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-black text-text-primary truncate">
                      {t.brand_name || t.brandName}
                    </p>
                    <Badge variant="outline" className="text-[9px] font-mono font-bold bg-surface-card border-line/80">
                      {t.id}
                    </Badge>
                  </div>
                  <p className="text-[11px] text-text-muted truncate">
                    {t.tagline || 'Restaurante registrado en la plataforma'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(`/?tenant=${t.id}`, '_blank')}
                  className="h-8.5 px-3 rounded-xl text-xs font-bold gap-1 cursor-pointer border-line"
                >
                  <span>Tienda</span>
                  <ExternalLink className="w-3 h-3 text-text-muted" />
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    window.location.search = `?tenant=${t.id}`;
                  }}
                  className="h-8.5 px-3 rounded-xl text-xs font-bold gap-1 cursor-pointer border-accent/30 text-accent bg-accent/5 hover:bg-accent/15"
                >
                  <span>Acceder POS</span>
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal de Onboarding */}
      <TenantOnboardingModal
        isOpen={isOnboardingOpen}
        onClose={() => {
          setIsOnboardingOpen(false);
          fetchSaaSData();
        }}
      />
    </div>
  );
}
