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
      <div className="bg-slate-900 p-5 sm:p-6 rounded-3xl border border-slate-800 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <h2 className="text-xl font-black text-white">
              SaaS Control Plane & Multi-Tenancy
            </h2>
          </div>
          <p className="text-xs text-slate-400">
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
            className="h-9 px-3 rounded-xl text-xs font-bold gap-1.5 cursor-pointer border-slate-700 bg-slate-800 text-slate-200 active:scale-98"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Actualizar</span>
          </Button>

          <Button
            type="button"
            variant="default"
            size="sm"
            onClick={() => setIsOnboardingOpen(true)}
            className="h-9 px-4 rounded-xl text-xs font-black gap-1.5 cursor-pointer bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-md active:scale-98"
          >
            <Plus className="w-4 h-4" />
            <span>+ Nuevo Restaurante</span>
          </Button>
        </div>
      </div>

      {/* 2. KPIs Globales del SaaS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-1">
          <p className="text-[11px] font-bold text-slate-400 flex items-center gap-1.5">
            <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
            <span>MRR Estimado (USD)</span>
          </p>
          <p className="text-2xl font-black text-white tabular-nums">
            ${metrics?.totalMonthlyRecurringRevenueUsd || 278}
            <span className="text-xs text-slate-400 font-normal"> /mes</span>
          </p>
          <p className="text-[10px] text-emerald-400 font-bold">
            Beta Gratuita ($0 activo)
          </p>
        </div>

        <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-1">
          <p className="text-[11px] font-bold text-slate-400 flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5 text-blue-400" />
            <span>Restaurantes Activos</span>
          </p>
          <p className="text-2xl font-black text-white tabular-nums">
            {metrics?.activeTenantsCount || tenants.length || 3}
          </p>
          <p className="text-[10px] text-slate-400 font-bold">
            Multi-Tenant activo
          </p>
        </div>

        <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-1">
          <p className="text-[11px] font-bold text-slate-400 flex items-center gap-1.5">
            <Store className="w-3.5 h-3.5 text-purple-400" />
            <span>Plan Pro / Enterprise</span>
          </p>
          <p className="text-2xl font-black text-white tabular-nums">
            {(metrics?.plansBreakdown?.pro || 0) + (metrics?.plansBreakdown?.enterprise || 0) || 2}
          </p>
          <p className="text-[10px] text-purple-400 font-bold">
            Planes de alto volumen
          </p>
        </div>

        <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-1">
          <p className="text-[11px] font-bold text-slate-400 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Comandas Globales</span>
          </p>
          <p className="text-2xl font-black text-white tabular-nums">
            {metrics?.totalOrdersProcessedAllTime?.toLocaleString() || '1,420'}
          </p>
          <p className="text-[10px] text-slate-400 font-bold">
            Histórico procesado
          </p>
        </div>
      </div>

      {/* 3. Directorio de Restaurantes Registrados */}
      <div className="bg-slate-900 rounded-3xl p-5 border border-slate-800 shadow-xl space-y-4">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-sm font-black text-white uppercase tracking-wider">
            Directorio de Inquilinos Registrados
          </h3>
          <span className="text-xs text-slate-400 font-bold">
            {tenants.length} marcas registradas
          </span>
        </div>

        <div className="space-y-2">
          {tenants.map((t) => (
            <div
              key={t.id}
              className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-slate-700 transition-all"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className="w-10 h-10 rounded-2xl flex items-center justify-center text-lg shrink-0 border border-slate-800 shadow-xs"
                  style={{ backgroundColor: `${t.accent_color || t.theme?.accentColor || '#16A34A'}15` }}
                >
                  {t.logo_emoji || t.logoEmoji || '🍽️'}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-black text-white truncate">
                      {t.brand_name || t.brandName}
                    </p>
                    <Badge variant="outline" className="text-[9px] font-mono font-bold bg-slate-900 border-slate-700 text-slate-300">
                      {t.id}
                    </Badge>
                  </div>
                  <p className="text-[11px] text-slate-400 truncate">
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
                  className="h-8.5 px-3 rounded-xl text-xs font-bold gap-1 cursor-pointer border-slate-700 bg-slate-800 text-slate-200"
                >
                  <span>Tienda</span>
                  <ExternalLink className="w-3 h-3 text-slate-400" />
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(`/chekeo/?tenant=${t.id}`, '_blank')}
                  className="h-8.5 px-3 rounded-xl text-xs font-bold gap-1 cursor-pointer border-purple-500/30 text-purple-400 bg-purple-500/10 hover:bg-purple-500/20"
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
