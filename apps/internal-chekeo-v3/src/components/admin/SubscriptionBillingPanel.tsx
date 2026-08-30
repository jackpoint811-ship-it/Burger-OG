import React, { useState } from 'react';
import { CreditCard, CheckCircle2, ShieldCheck, Zap, Sparkles, Lock, Gift } from 'lucide-react';
import { Button } from '@ui/button';
import { Badge } from '@ui/badge';
import { ComingSoonModal } from '@ui/coming-soon-modal';
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
  const [isComingSoonOpen, setIsComingSoonOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState('Pasarela de Facturación SaaS');

  // Durante la fase beta, todas las marcas tienen acceso Pro ilimitado gratuito
  const currentTier: SaaSPlanTier = 'pro';
  const currentPlan = SAAS_PLANS[currentTier];

  const handleOpenComingSoon = (title: string) => {
    setModalTitle(title);
    setIsComingSoonOpen(true);
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* 1. Banner Informativo de Acceso Anticipado / Beta Gratuita */}
      <div className="p-4 rounded-3xl bg-gradient-to-r from-emerald-500/10 via-accent/5 to-purple-500/10 border border-accent/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-accent text-white flex items-center justify-center shrink-0 shadow-xs">
            <Gift className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-black text-text-primary">
                Fase de Acceso Anticipado (Beta Gratuita)
              </h3>
              <Badge className="bg-accent/15 text-accent border-accent/30 font-black text-[10px] uppercase">
                $0 Costo
              </Badge>
            </div>
            <p className="text-xs text-text-secondary">
              Todas las funciones avanzadas están activas sin costo para <strong className="text-text-primary">{tenant.brandName}</strong>. Los cobros automáticos están en modo <span className="font-bold text-amber-600 dark:text-amber-400">Próximamente</span>.
            </p>
          </div>
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => handleOpenComingSoon('Facturación Automatizada & Pagos con Tarjeta')}
          className="h-9 px-3 rounded-xl text-xs font-bold gap-1.5 cursor-pointer border-line shrink-0 active:scale-98"
        >
          <Lock className="w-3.5 h-3.5 text-amber-500" />
          <span>Pasarela de Pago · Próximamente</span>
        </Button>
      </div>

      {/* 2. Tarjeta Resumen del Plan Actual */}
      <div className="bg-surface-card p-5 sm:p-6 rounded-3xl border border-line shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xl sm:text-2xl font-black text-text-primary">
                Plan {currentPlan.name}
              </span>
              <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 font-black text-xs">
                {currentPlan.badge} · Beta Gratuita
              </Badge>
            </div>
            <p className="text-xs text-text-secondary">
              Operación completa habilitada sin comisiones ni cargos recurrentes.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleOpenComingSoon('Portal de Facturas & Tarjetas')}
              className="h-10 px-4 rounded-xl text-xs font-bold gap-2 cursor-pointer border-line active:scale-98 text-text-secondary hover:text-text-primary"
            >
              <CreditCard className="w-4 h-4 text-accent" />
              <span>Portal de Facturación</span>
              <Badge className="text-[9px] bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20">
                Próximamente
              </Badge>
            </Button>
          </div>
        </div>

        {/* Límites y Cuotas */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-line/60">
          <div className="p-3 rounded-2xl bg-surface border border-line/60 space-y-1">
            <p className="text-[11px] font-bold text-text-muted">Pedidos del Mes</p>
            <p className="text-sm font-black text-text-primary flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-accent" />
              <span>Ilimitados (100% Gratis)</span>
            </p>
          </div>
          <div className="p-3 rounded-2xl bg-surface border border-line/60 space-y-1">
            <p className="text-[11px] font-bold text-text-muted">Estaciones KDS Cocina</p>
            <p className="text-sm font-black text-text-primary flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-blue-500" />
              <span>2 Estaciones Habilitadas</span>
            </p>
          </div>
          <div className="p-3 rounded-2xl bg-surface border border-line/60 space-y-1">
            <p className="text-[11px] font-bold text-text-muted">Calculadora Insumos</p>
            <p className="text-sm font-black text-text-primary flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-purple-500" />
              <span>Resumen K Desbloqueado</span>
            </p>
          </div>
        </div>
      </div>

      {/* 3. Matriz de Planes Futuros */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-sm font-black text-text-primary uppercase tracking-wider">
            Niveles de Servicio & Planes
          </h3>
          <span className="text-xs text-amber-600 dark:text-amber-400 font-bold flex items-center gap-1">
            <Lock className="w-3 h-3" />
            <span>Cobros en línea: Próximamente</span>
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
                    Plan Activo (Beta)
                  </span>
                )}

                <div className="space-y-3">
                  <div className="space-y-1">
                    <p className="text-xs font-black text-text-muted uppercase tracking-wider">
                      {plan.badge}
                    </p>
                    <h4 className="text-lg font-black text-text-primary">{plan.name}</h4>
                    <div className="flex items-baseline gap-2">
                      <p className="text-2xl font-black text-text-primary tabular-nums">
                        {plan.monthlyPriceFormatted}
                      </p>
                      <Badge variant="outline" className="text-[10px] text-amber-600 dark:text-amber-400 border-amber-500/30 bg-amber-500/5">
                        Próximamente
                      </Badge>
                    </div>
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
                      className="w-full h-10 rounded-xl text-xs font-bold opacity-90 cursor-default bg-accent/5 border-accent/30 text-accent"
                    >
                      ✓ Activo en Acceso Anticipado
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => handleOpenComingSoon(`Plan ${plan.name}`)}
                      className="w-full h-10 rounded-xl text-xs font-bold gap-1.5 cursor-pointer border-line active:scale-98 text-text-secondary hover:text-text-primary"
                    >
                      <Lock className="w-3.5 h-3.5 text-amber-500" />
                      <span>Ver Detalles · Próximamente</span>
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal de Próximamente */}
      <ComingSoonModal
        open={isComingSoonOpen}
        onClose={() => setIsComingSoonOpen(false)}
        title={modalTitle}
        description="Durante la fase de pruebas y lanzamiento anticipado, todas las herramientas están disponibles sin costo para los restaurantes. La pasarela de facturación y cobros automáticos estará disponible próximamente."
        alternativeNotice="Los comensales pueden realizar sus pedidos normalmente y pagar por Transferencia o Efectivo sin comisiones de plataforma."
        badgeLabel="Próximamente"
      />
    </div>
  );
}
