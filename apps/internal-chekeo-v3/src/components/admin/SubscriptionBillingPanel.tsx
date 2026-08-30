import React, { useState } from 'react';
import { CreditCard, CheckCircle2, ArrowUpRight, ShieldCheck, Zap, Sparkles, ExternalLink } from 'lucide-react';
import { Button } from '@ui/button';
import { Badge } from '@ui/badge';
import { SAAS_PLANS, type SaaSPlanTier } from '@config/saas.types';
import { getActiveTenant } from '@config/active-tenant';

export interface SubscriptionBillingPanelProps {
  activeToolId?: string;
  onSelectTool?: (toolId: string) => void;
}

export function SubscriptionBillingPanel({
  activeToolId = 'current-plan',
  onSelectTool,
}: SubscriptionBillingPanelProps) {
  const tenant = getActiveTenant();
  const [selectedTier, setSelectedTier] = useState<SaaSPlanTier>('pro');
  const [isLoadingCheckout, setIsLoadingCheckout] = useState(false);
  const [isLoadingPortal, setIsLoadingPortal] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Determinar el plan activo
  const currentTier: SaaSPlanTier = 'pro';
  const currentPlan = SAAS_PLANS[currentTier];

  const handleOpenCustomerPortal = async () => {
    setIsLoadingPortal(true);
    setStatusMessage(null);
    try {
      const res = await fetch('/api/saas/billing/portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId: tenant.id,
          returnUrl: window.location.href,
        }),
      });
      const json = (await res.json()) as { ok?: boolean; message?: string; data?: { portalUrl?: string } };
      if (json.ok && json.data?.portalUrl) {
        window.location.href = json.data.portalUrl;
      } else {
        setStatusMessage(json.message || 'No se pudo abrir el portal de Stripe.');
      }
    } catch {
      setStatusMessage('Error de conexión con el portal de facturación.');
    } finally {
      setIsLoadingPortal(false);
    }
  };

  const handleUpgradePlan = async (tier: SaaSPlanTier) => {
    setIsLoadingCheckout(true);
    setStatusMessage(null);
    try {
      const res = await fetch('/api/saas/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId: tenant.id,
          planTier: tier,
          successUrl: `${window.location.origin}/?tenant=${tenant.id}&billing_success=true`,
          cancelUrl: window.location.href,
        }),
      });
      const json = (await res.json()) as { ok?: boolean; message?: string; data?: { checkoutUrl?: string } };
      if (json.ok && json.data?.checkoutUrl) {
        window.location.href = json.data.checkoutUrl;
      } else {
        setStatusMessage(json.message || 'Error al iniciar Stripe Checkout.');
      }
    } catch {
      setStatusMessage('Error al conectar con la pasarela de pagos.');
    } finally {
      setIsLoadingCheckout(false);
    }
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* 1. Tarjeta Resumen del Plan Actual */}
      <div className="bg-surface-card p-5 sm:p-6 rounded-3xl border border-line shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xl sm:text-2xl font-black text-text-primary">
                Plan {currentPlan.name}
              </span>
              <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 font-black text-xs">
                {currentPlan.badge} · Activo
              </Badge>
            </div>
            <p className="text-xs text-text-secondary">
              Facturación mensual activa para <strong className="text-text-primary">{tenant.brandName}</strong>.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleOpenCustomerPortal}
              disabled={isLoadingPortal}
              className="h-10 px-4 rounded-xl text-xs font-bold gap-2 cursor-pointer border-line active:scale-98"
            >
              <CreditCard className="w-4 h-4 text-accent" />
              <span>{isLoadingPortal ? 'Conectando...' : 'Portal de Facturas & Tarjetas'}</span>
              <ExternalLink className="w-3.5 h-3.5 text-text-muted" />
            </Button>
          </div>
        </div>

        {statusMessage && (
          <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-xs text-amber-700 dark:text-amber-300 font-bold">
            ℹ️ {statusMessage}
          </div>
        )}

        {/* Límites y Cuotas */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-line/60">
          <div className="p-3 rounded-2xl bg-surface border border-line/60 space-y-1">
            <p className="text-[11px] font-bold text-text-muted">Pedidos del Mes</p>
            <p className="text-sm font-black text-text-primary flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-accent" />
              <span>Ilimitados</span>
            </p>
          </div>
          <div className="p-3 rounded-2xl bg-surface border border-line/60 space-y-1">
            <p className="text-[11px] font-bold text-text-muted">Estaciones KDS Cocina</p>
            <p className="text-sm font-black text-text-primary flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-blue-500" />
              <span>2 Estaciones (Plancha + Sides)</span>
            </p>
          </div>
          <div className="p-3 rounded-2xl bg-surface border border-line/60 space-y-1">
            <p className="text-[11px] font-bold text-text-muted">Calculadora Insumos</p>
            <p className="text-sm font-black text-text-primary flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-purple-500" />
              <span>Resumen K Habilitado</span>
            </p>
          </div>
        </div>
      </div>

      {/* 2. Matriz de Comparación y Upgrade de Planes */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-sm font-black text-text-primary uppercase tracking-wider">
            Planes Disponibles de Chekeo SaaS
          </h3>
          <span className="text-xs text-text-muted font-bold">
            Sin contratos forzosos · Cancela en cualquier momento
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {(Object.keys(SAAS_PLANS) as SaaSPlanTier[]).map((tierKey) => {
            const plan = SAAS_PLANS[tierKey];
            const isCurrent = tierKey === currentTier;

            return (
              <div
                key={tierKey}
                className={`relative flex flex-col justify-between p-5 rounded-3xl border transition-all ${
                  isCurrent
                    ? 'bg-surface-card border-accent shadow-md ring-2 ring-accent/20'
                    : 'bg-surface-card border-line hover:border-line/80 shadow-xs'
                }`}
              >
                {isCurrent && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-accent text-white text-[10px] font-black uppercase tracking-wider px-3 py-0.5 rounded-full shadow-xs">
                    Tu Plan Actual
                  </span>
                )}

                <div className="space-y-3">
                  <div className="space-y-1">
                    <p className="text-xs font-black text-text-muted uppercase tracking-wider">
                      {plan.badge}
                    </p>
                    <h4 className="text-lg font-black text-text-primary">{plan.name}</h4>
                    <p className="text-2xl font-black text-text-primary tabular-nums">
                      {plan.monthlyPriceFormatted}
                    </p>
                    <p className="text-xs text-text-secondary leading-relaxed pt-1">
                      {plan.description}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-line/60 space-y-2">
                    <p className="text-[11px] font-black uppercase tracking-wider text-text-muted">
                      Incluye:
                    </p>
                    <ul className="space-y-1.5 text-xs text-text-secondary">
                      {plan.features.map((feat, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-accent shrink-0 mt-0.5" />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="pt-5 mt-4 border-t border-line/60">
                  {isCurrent ? (
                    <Button
                      type="button"
                      variant="outline"
                      disabled
                      className="w-full h-10 rounded-xl text-xs font-bold opacity-80 cursor-default"
                    >
                      Plan Activo
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      variant="default"
                      onClick={() => handleUpgradePlan(tierKey)}
                      disabled={isLoadingCheckout}
                      className="w-full h-10 rounded-xl text-xs font-black gap-1.5 cursor-pointer active:scale-98"
                    >
                      <span>Cambiar a {plan.name.split('/')[0]}</span>
                      <ArrowUpRight className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
