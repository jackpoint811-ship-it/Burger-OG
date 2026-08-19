/**
 * CocinaView.tsx — PR-V3-08
 *
 * Vista placeholder & esqueleto base para la pantalla KDS de Cocina (PR-V3-10).
 * Enfocado en armado preciso, tiempos de preparación y mod de ingredientes destacados.
 */

import React, { useState } from 'react';
import { ChefHat, Volume2, VolumeX, Flame, Clock, Sparkles, Check, AlertTriangle } from 'lucide-react';
import { Skeleton } from '@ui/skeleton';
import { Badge } from '@ui/badge';
import { Button } from '@ui/button';

export function CocinaView() {
  const [soundEnabled, setSoundEnabled] = useState(true);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* KDS Control Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-surface-card p-4 rounded-3xl border border-line shadow-xs">
        {/* Estaciones de Cocina */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 no-scrollbar">
          <div className="flex items-center gap-1.5 font-bold text-xs text-text-primary mr-2">
            <Flame className="w-4 h-4 text-accent" />
            <span>Estación:</span>
          </div>
          {[
            { label: 'Todas las Estaciones', active: true, count: 6 },
            { label: 'Parrilla / Burgers', count: 4 },
            { label: 'Freidora / Papas & Aros', count: 2 },
          ].map((item, idx) => (
            <button
              key={idx}
              type="button"
              disabled
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap flex items-center gap-1.5 transition-colors ${
                item.active
                  ? 'bg-accent text-white shadow-xs'
                  : 'bg-surface-raised border border-line text-text-secondary'
              }`}
            >
              <span>{item.label}</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                  item.active ? 'bg-white/20 text-white' : 'bg-surface text-text-muted'
                }`}
              >
                {item.count}
              </span>
            </button>
          ))}
        </div>

        {/* Controles KDS: Alerta Sonora y Leyenda de Tiempos */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          {/* Indicador de semáforo de tiempos */}
          <div className="hidden lg:flex items-center gap-2 text-[11px] font-bold text-text-muted px-3 py-1 rounded-xl bg-surface-raised border border-line">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span> &lt;10m
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-amber-500"></span> 10-20m
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span> &gt;20m
            </span>
          </div>

          {/* Toggle de Alerta Sonora */}
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="flex items-center gap-1.5 text-xs"
            title={soundEnabled ? 'Silenciar alertas sonoras' : 'Activar sonido KDS'}
          >
            {soundEnabled ? (
              <>
                <Volume2 className="w-3.5 h-3.5 text-accent" />
                <span>Audio KDS</span>
              </>
            ) : (
              <>
                <VolumeX className="w-3.5 h-3.5 text-text-muted" />
                <span>Silenciado</span>
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Grid de Comandas KDS (Esqueletos representativos para Cocina) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          { folio: '#ORD-0184', time: '04:12', tone: 'success', status: 'En Parrilla', items: 2 },
          { folio: '#ORD-0185', time: '14:30', tone: 'warning', status: 'Armado', items: 3 },
          { folio: '#ORD-0186', time: '22:05', tone: 'danger', status: 'Retrasado', items: 1 },
        ].map((ticket, idx) => (
          <div
            key={idx}
            className="bg-surface-card rounded-3xl p-5 border-2 border-line shadow-card space-y-4 flex flex-col justify-between"
          >
            {/* Header del Ticket KDS */}
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-line">
                <div className="flex items-center gap-2">
                  <span className="text-lg font-black text-text-primary">{ticket.folio}</span>
                  <Badge variant={ticket.tone === 'success' ? 'default' : ticket.tone === 'warning' ? 'warning' : 'destructive'}>
                    {ticket.status}
                  </Badge>
                </div>
                <div
                  className={`flex items-center gap-1 font-mono font-black text-sm px-2.5 py-1 rounded-xl ${
                    ticket.tone === 'danger'
                      ? 'bg-red-500/15 text-red-600 border border-red-500/30'
                      : ticket.tone === 'warning'
                      ? 'bg-amber-500/15 text-amber-600 border border-amber-500/30'
                      : 'bg-emerald-500/15 text-emerald-600 border border-emerald-500/30'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>{ticket.time}</span>
                </div>
              </div>

              {/* Contenido del Ticket con Mods destacados */}
              <div className="mt-4 space-y-3 text-sm">
                <div className="p-3 rounded-2xl bg-surface-raised border border-line">
                  <div className="font-black text-text-primary text-base flex justify-between">
                    <span>1x Burger OG</span>
                    <span className="text-xs px-2 py-0.5 rounded bg-accent/15 text-accent font-bold">Unidad #1</span>
                  </div>

                  {/* Mods / Remociones resaltadas en rojo */}
                  <div className="mt-2 space-y-1 text-xs">
                    <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-red-500/15 text-red-600 font-extrabold mr-1 mb-1">
                      <span>❌ Sin Pepinillos</span>
                    </div>
                    <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-red-500/15 text-red-600 font-extrabold mr-1 mb-1">
                      <span>❌ Sin Mostaza</span>
                    </div>
                    <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-600 font-extrabold mr-1 mb-1">
                      <span>➕ Extra Tocino</span>
                    </div>
                  </div>

                  {/* Guarnición de combo */}
                  <div className="mt-2 pt-2 border-t border-line/60 text-xs font-semibold text-text-secondary">
                    <span>🍟 Papas Francesas • 🥤 Coca-Cola Zero</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Acción de Comanda KDS */}
            <div className="pt-2">
              <Button disabled className="w-full h-11 rounded-2xl font-bold flex items-center justify-center gap-2 opacity-80 cursor-not-allowed">
                <Check className="w-4 h-4" />
                <span>Marcar Comanda Lista</span>
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Banner Informativo del Roadmap */}
      <div className="p-5 rounded-3xl bg-accent-soft border border-accent/20 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 text-center sm:text-left">
          <div className="w-10 h-10 rounded-2xl bg-accent/20 flex items-center justify-center text-accent shrink-0">
            <ChefHat className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-text-primary">
              Módulo de Cocina (KDS) — Próximo PR-V3-10
            </h4>
            <p className="text-xs text-text-secondary">
              Pantalla de producción en tiempo real con desglose por burger, mods destacados, semáforo de tiempos y alertas de sonido.
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
