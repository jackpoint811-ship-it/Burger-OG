import React, { useState, useEffect } from 'react';
import {
  Building2,
  DollarSign,
  Plus,
  RefreshCw,
  Zap,
  Server,
  Layers,
  ChefHat,
  ShoppingBag,
  CreditCard,
  Lock,
  Globe,
  ShieldCheck,
} from 'lucide-react';
import { Button } from '@ui/button';
import { Badge } from '@ui/badge';
import { TENANTS_REGISTRY } from '@config';
import { SAAS_PLANS, type SaaSPlanTier } from '@config';
import { TenantOnboardingModal } from './TenantOnboardingModal';
import { ComingSoonModal } from '@ui/coming-soon-modal';

export function SaaSHubView() {
  const [activeSection, setActiveSection] = useState<'tenants' | 'billing' | 'infra'>('tenants');
  const [metrics, setMetrics] = useState<any>(null);
  const [tenants, setTenants] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [isComingSoonOpen, setIsComingSoonOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState('');

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
      console.error('[SaaSHub Fetch Error]', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSaaSData();
  }, []);

  const handleOpenComingSoon = (title: string) => {
    setModalTitle(title);
    setIsComingSoonOpen(true);
  };

  const registeredTenants = Object.entries(TENANTS_REGISTRY).filter(
    ([key], index, self) => self.findIndex(([, val]) => val.id === key) === index
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-3 sm:p-6 lg:p-8 font-sans selection:bg-purple-500 selection:text-white">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* 1. Header Principal del SaaS Hub */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 sm:p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl backdrop-blur-xl">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 via-indigo-500 to-cyan-400 flex items-center justify-center text-white shadow-lg shadow-purple-500/20">
              <Zap className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                  Chekeo Cloud Engine
                </h1>
                <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30 text-[10px] font-black uppercase">
                  SaaS Control Plane
                </Badge>
              </div>
              <p className="text-xs text-slate-400">
                Centro de Mando & Gestión Multi-Tenant de Restaurantes en Cloudflare Edge.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={fetchSaaSData}
              disabled={isLoading}
              className="h-10 px-3.5 rounded-xl text-xs font-bold border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-200 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Sincronizar</span>
            </Button>

            <Button
              type="button"
              variant="default"
              size="sm"
              onClick={() => setIsOnboardingOpen(true)}
              className="h-10 px-4 rounded-xl text-xs font-black gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-lg shadow-purple-600/30 cursor-pointer active:scale-98"
            >
              <Plus className="w-4 h-4" />
              <span>+ Nuevo Restaurante</span>
            </Button>
          </div>
        </header>

        {/* 2. KPIs Globales de la Plataforma */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
          <div className="p-4 sm:p-5 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-1 shadow-lg">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                <span>MRR Global Plataforma</span>
              </span>
              <Badge className="bg-emerald-500/15 text-emerald-300 border-emerald-500/30 text-[9px] font-bold">
                Beta $0
              </Badge>
            </div>
            <p className="text-2xl sm:text-3xl font-black text-white tabular-nums tracking-tight">
              ${metrics?.totalMonthlyRecurringRevenueUsd || 278}
              <span className="text-xs text-slate-400 font-normal"> USD/mes</span>
            </p>
            <p className="text-[11px] text-slate-400">Ingresos recurrentes proyectados</p>
          </div>

          <div className="p-4 sm:p-5 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-1 shadow-lg">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-cyan-400" />
                <span>Restaurantes Alojados</span>
              </span>
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            </div>
            <p className="text-2xl sm:text-3xl font-black text-white tabular-nums tracking-tight">
              {metrics?.activeTenantsCount || registeredTenants.length}
            </p>
            <p className="text-[11px] text-slate-400">Instancias activas e independientes</p>
          </div>

          <div className="p-4 sm:p-5 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-1 shadow-lg">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1.5">
                <ShoppingBag className="w-3.5 h-3.5 text-purple-400" />
                <span>Comandas en la Red</span>
              </span>
            </div>
            <p className="text-2xl sm:text-3xl font-black text-white tabular-nums tracking-tight">
              {metrics?.totalOrdersProcessedAllTime?.toLocaleString() || '1,420'}
            </p>
            <p className="text-[11px] text-slate-400">Pedidos totales procesados</p>
          </div>

          <div className="p-4 sm:p-5 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-1 shadow-lg">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1.5">
                <Server className="w-3.5 h-3.5 text-emerald-400" />
                <span>Infraestructura Cloud</span>
              </span>
              <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/40 text-[9px] font-black">
                100% OK
              </Badge>
            </div>
            <p className="text-lg font-black text-white tracking-tight flex items-center gap-2 pt-1">
              <span>Cloudflare Edge</span>
            </p>
            <p className="text-[11px] text-slate-400">D1 + R2 + Pages Functions</p>
          </div>
        </div>

        {/* 3. Selector de Secciones del SaaS */}
        <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-slate-900/80 border border-slate-800 w-fit">
          <button
            type="button"
            onClick={() => setActiveSection('tenants')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
              activeSection === 'tenants'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            🏢 Proyectos & Restaurantes ({registeredTenants.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveSection('billing')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
              activeSection === 'billing'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            💳 Planes & Facturación Stripe
          </button>

          <button
            type="button"
            onClick={() => setActiveSection('infra')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
              activeSection === 'infra'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            ⚡ Control Plane & Cloudflare D1
          </button>
        </div>

        {/* 4. SECCIÓN 1: Directorio de Proyectos / Restaurantes */}
        {activeSection === 'tenants' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-black text-white">Flota de Restaurantes (Tenants)</h2>
                <p className="text-xs text-slate-400">
                  Cada restaurante opera con su propio menú, cocina KDS, inventario y tienda pública.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {registeredTenants.map(([key, t]) => {
                const isFlagship = t.id === 'burgers-exe';
                const planKey: SaaSPlanTier = isFlagship ? 'enterprise' : t.id === 'amsi-tortas' ? 'pro' : 'starter';
                const plan = SAAS_PLANS[planKey];

                return (
                  <div
                    key={key}
                    className="flex flex-col justify-between p-5 rounded-3xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition-all shadow-xl space-y-4 group"
                  >
                    <div className="space-y-3">
                      {/* Header de Tarjeta */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl border shadow-md shrink-0"
                            style={{
                              backgroundColor: `${t.theme.accentColor}20`,
                              borderColor: `${t.theme.accentColor}40`,
                            }}
                          >
                            {t.logoEmoji}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-black text-base text-white group-hover:text-purple-300 transition-colors">
                                {t.brandName}
                              </h3>
                            </div>
                            <p className="text-xs text-slate-400 font-mono">
                              id: {t.id}
                            </p>
                          </div>
                        </div>

                        <Badge
                          className={`text-[10px] font-black uppercase ${
                            isFlagship
                              ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                              : 'bg-slate-800 text-slate-300 border-slate-700'
                          }`}
                        >
                          {isFlagship ? '👑 Cliente Insignia' : `Plan ${plan.badge}`}
                        </Badge>
                      </div>

                      {/* Tagline / Descripción */}
                      <p className="text-xs text-slate-300 leading-relaxed">
                        {t.tagline || 'Restaurante habilitado en la plataforma Chekeo.'}
                      </p>

                      {/* Color de Marca y Parámetros */}
                      <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-400 font-medium">Color de Marca:</span>
                          <div className="flex items-center gap-1.5">
                            <span
                              className="w-3.5 h-3.5 rounded-full border border-white/20"
                              style={{ backgroundColor: t.theme.accentColor }}
                            />
                            <span className="font-mono text-[11px] text-slate-200">{t.theme.accentColor}</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-400 font-medium">Estaciones KDS:</span>
                          <span className="font-bold text-slate-200">{plan.maxKitchenStations} Estaciones</span>
                        </div>

                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-400 font-medium">Subdominio URL:</span>
                          <span className="font-mono text-[10px] text-purple-400 truncate max-w-[150px]">
                            {t.id}.chekeo.io
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Acciones del Restaurante */}
                    <div className="pt-3 border-t border-slate-800/80 grid grid-cols-2 gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(`/?tenant=${t.id}`, '_blank')}
                        className="h-9 px-2.5 rounded-xl text-xs font-bold gap-1.5 border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-200 cursor-pointer"
                      >
                        <Globe className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Tienda Online</span>
                      </Button>

                      <Button
                        type="button"
                        variant="default"
                        size="sm"
                        onClick={() => window.open(`/chekeo/?tenant=${t.id}`, '_blank')}
                        className="h-9 px-2.5 rounded-xl text-xs font-black gap-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white cursor-pointer shadow-md"
                      >
                        <ChefHat className="w-3.5 h-3.5" />
                        <span>Entrar a POS</span>
                      </Button>
                    </div>
                  </div>
                );
              })}

              {/* Tarjeta para Crear Nuevo Restaurante */}
              <div
                onClick={() => setIsOnboardingOpen(true)}
                className="flex flex-col items-center justify-center p-8 rounded-3xl border-2 border-dashed border-slate-800 hover:border-purple-500/60 bg-slate-900/40 hover:bg-slate-900/80 transition-all cursor-pointer text-center space-y-3 min-h-[280px] group"
              >
                <div className="w-14 h-14 rounded-2xl bg-purple-500/10 text-purple-400 border border-purple-500/20 flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg shadow-purple-500/10">
                  <Plus className="w-7 h-7" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-black text-base text-white group-hover:text-purple-300">
                    Desplegar Nuevo Restaurante
                  </h3>
                  <p className="text-xs text-slate-400 max-w-xs">
                    Asistente en 3 pasos: Marca, Menú base y Acceso POS instantáneo.
                  </p>
                </div>
                <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30 text-[10px] font-bold">
                  Alta Self-Serve
                </Badge>
              </div>
            </div>
          </div>
        )}

        {/* 5. SECCIÓN 2: Planes & Facturación SaaS (Stripe) */}
        {activeSection === 'billing' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-black text-white">Niveles de Suscripción SaaS (Stripe)</h2>
                <p className="text-xs text-slate-400">
                  Modelos de cobro recurrente mensual para restaurantes clientes.
                </p>
              </div>
              <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30 text-xs font-bold flex items-center gap-1">
                <Lock className="w-3 h-3" />
                <span>Cobros automáticos: Próximamente</span>
              </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {(Object.keys(SAAS_PLANS) as SaaSPlanTier[]).map((tierKey) => {
                const plan = SAAS_PLANS[tierKey];
                return (
                  <div
                    key={tierKey}
                    className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 flex flex-col justify-between space-y-4 shadow-xl"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/40 text-[10px] font-black uppercase">
                          {plan.badge}
                        </Badge>
                        <span className="text-xs font-mono text-slate-400 font-bold">{plan.id}</span>
                      </div>

                      <h3 className="text-xl font-black text-white">{plan.name}</h3>
                      <div className="flex items-baseline gap-2">
                        <p className="text-3xl font-black text-white tabular-nums">
                          {plan.monthlyPriceFormatted}
                        </p>
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed">{plan.description}</p>

                      <div className="pt-3 border-t border-slate-800 space-y-2">
                        <p className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                          Incluye:
                        </p>
                        <ul className="space-y-1.5 text-xs text-slate-300">
                          {plan.features.map((feat, idx) => (
                            <li key={idx} className="flex items-start gap-2">
                              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                              <span>{feat}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => handleOpenComingSoon(`Configuración de Facturación para Plan ${plan.name}`)}
                      className="w-full h-10 rounded-xl text-xs font-bold border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 cursor-pointer gap-1.5"
                    >
                      <CreditCard className="w-3.5 h-3.5 text-purple-400" />
                      <span>Configurar en Stripe</span>
                    </Button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 6. SECCIÓN 3: Infraestructura & Cloudflare D1 */}
        {activeSection === 'infra' && (
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-black text-white">Infraestructura del Control Plane</h2>
              <p className="text-xs text-slate-400">
                Topología aislada de Cloudflare D1, R2 y Pages Functions para el SaaS.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-5 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-3 shadow-xl">
                <div className="flex items-center gap-2 text-cyan-400">
                  <Server className="w-5 h-5" />
                  <h3 className="font-black text-sm text-white">Cloudflare D1 Control Plane</h3>
                </div>
                <p className="text-xs text-slate-300">
                  Base de datos relacional SQLite que almacena los tenants, usuarios, roles y suscripciones.
                </p>
                <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 font-mono text-[11px] text-slate-300 space-y-1">
                  <p className="text-emerald-400 font-bold">resto-saas-control-plane-production</p>
                  <p className="text-slate-400">Tablas: saas_tenants, saas_subscriptions, saas_users</p>
                </div>
              </div>

              <div className="p-5 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-3 shadow-xl">
                <div className="flex items-center gap-2 text-purple-400">
                  <Layers className="w-5 h-5" />
                  <h3 className="font-black text-sm text-white">Cloudflare R2 Brand Assets</h3>
                </div>
                <p className="text-xs text-slate-300">
                  Almacenamiento de objetos S3/R2 para logos, banners y fotos de menú de los restaurantes.
                </p>
                <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 font-mono text-[11px] text-slate-300 space-y-1">
                  <p className="text-purple-400 font-bold">resto-saas-brand-assets</p>
                  <p className="text-slate-400">Aislamiento por prefijo de tenant / assets públicos</p>
                </div>
              </div>

              <div className="p-5 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-3 shadow-xl">
                <div className="flex items-center gap-2 text-emerald-400">
                  <Zap className="w-5 h-5" />
                  <h3 className="font-black text-sm text-white">Hono.js SaaS Edge Router</h3>
                </div>
                <p className="text-xs text-slate-300">
                  Microservicios serverless en Cloudflare Pages para onboarding y facturación.
                </p>
                <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 font-mono text-[11px] text-slate-300 space-y-1">
                  <p className="text-cyan-400 font-bold">/api/saas/*</p>
                  <p className="text-slate-400">Onboarding, Tenants, Billing & Webhooks</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal de Onboarding */}
      <TenantOnboardingModal
        isOpen={isOnboardingOpen}
        onClose={() => {
          setIsOnboardingOpen(false);
          fetchSaaSData();
        }}
      />

      {/* Modal de Próximamente */}
      <ComingSoonModal
        open={isComingSoonOpen}
        onClose={() => setIsComingSoonOpen(false)}
        title={modalTitle}
        description="Esta función de la pasarela Stripe estará disponible próximamente al configurar tus claves de producción."
        badgeLabel="Próximamente"
      />
    </div>
  );
}
