/**
 * AdminView.tsx — PR-V3-08
 *
 * Vista placeholder & esqueleto base para el módulo de Administración y Catálogo (PR-V3-12).
 * Hub central: Menú & Precios, Torres & Horarios, Banners, Sorteos y Corte de Caja.
 */

import React from 'react';
import { Settings, UtensilsCrossed, Building2, Image as ImageIcon, Gift, Calculator, Sparkles, ChevronRight, Shield } from 'lucide-react';
import { Badge } from '@ui/badge';
import { Button } from '@ui/button';

export function AdminView() {
  const adminModules = [
    {
      title: 'Menú & Precios',
      description: 'Gestión de productos, combos, disponibilidad de stock, modificadores e ingredientes.',
      icon: UtensilsCrossed,
      badge: '14 Platillos Activos',
      tone: 'accent',
    },
    {
      title: 'Torres & Horarios',
      description: 'Configuración de torres de entrega (GGA, Valcob), horarios límite (1:30 PM) y días activos.',
      icon: Building2,
      badge: '2 Torres Activas',
      tone: 'primary',
    },
    {
      title: 'Banners Promocionales',
      description: 'Administración del carrusel superior del catálogo y banners promocionales por categoría.',
      icon: ImageIcon,
      badge: '3 Banners en Rotación',
      tone: 'primary',
    },
    {
      title: 'Sorteos & Referidos',
      description: 'Control de la rifa activa, registro de participantes, folios acumulados y código de referido.',
      icon: Gift,
      badge: 'Campaña Activa',
      tone: 'accent',
    },
    {
      title: 'Corte de Caja (Corte Z)',
      description: 'Resumen financiero consolidado del turno, totalización por método de pago y exportación.',
      icon: Calculator,
      badge: 'Listo para Corte',
      tone: 'warning',
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header del Panel de Administración */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-surface-card p-5 rounded-3xl border border-line shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-accent-soft flex items-center justify-center text-accent shrink-0">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-text-primary">
              Panel de Control Administrativo
            </h2>
            <p className="text-xs text-text-secondary">
              Configuración de catálogo, logística de torres, promociones y reportes operativos.
            </p>
          </div>
        </div>

        <Badge variant="default" className="self-start sm:self-auto py-1 px-3">
          Sesión Administrador Activa
        </Badge>
      </div>

      {/* Grid de Módulos de Administración */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {adminModules.map((module, idx) => {
          const Icon = module.icon;
          return (
            <div
              key={idx}
              className="bg-surface-card rounded-3xl p-6 border border-line shadow-card space-y-4 hover:border-accent/40 transition-all flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-2xl bg-surface-raised border border-line flex items-center justify-center text-accent">
                    <Icon className="w-5 h-5" />
                  </div>
                  <Badge variant="secondary" className="text-[10px]">
                    {module.badge}
                  </Badge>
                </div>

                <h3 className="text-base font-bold text-text-primary">{module.title}</h3>
                <p className="text-xs text-text-secondary leading-relaxed">
                  {module.description}
                </p>
              </div>

              <div className="pt-2">
                <Button
                  variant="secondary"
                  disabled
                  className="w-full justify-between text-xs font-bold rounded-xl opacity-80 cursor-not-allowed"
                >
                  <span>Configurar</span>
                  <ChevronRight className="w-4 h-4 text-text-muted" />
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Banner Informativo del Roadmap */}
      <div className="p-5 rounded-3xl bg-accent-soft border border-accent/20 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 text-center sm:text-left">
          <div className="w-10 h-10 rounded-2xl bg-accent/20 flex items-center justify-center text-accent shrink-0">
            <Settings className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-text-primary">
              Módulo de Administración Completo — Próximo PR-V3-12
            </h4>
            <p className="text-xs text-text-secondary">
              CRUD de productos e ingredientes, configuración de horarios y torres, banners dinámicos, sorteos y corte Z.
            </p>
          </div>
        </div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-card border border-line text-xs font-bold text-accent shadow-xs">
          <Sparkles className="w-4 h-4" />
          <span>Esqueleto Listo</span>
        </div>
      </div>
    </div>
  );
}
