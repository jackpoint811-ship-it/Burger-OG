/**
 * PedidosView.tsx — PR-V3-08
 *
 * Vista placeholder & esqueleto base para el módulo de Pedidos (PR-V3-09).
 * Estandarización de jerarquía visual: Total destacado, Dónde entregar y Fecha programada.
 */

import React from 'react';
import { ShoppingBag, Search, Filter, Calendar, MapPin, Sparkles, RefreshCw, CheckCircle2, Clock } from 'lucide-react';
import { Skeleton } from '@ui/skeleton';
import { Badge } from '@ui/badge';
import { Button } from '@ui/button';

export function PedidosView() {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Barra de Filtros y Control */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-surface-card p-4 rounded-3xl border border-line shadow-xs">
        {/* Búsqueda rápida */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-text-muted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Buscar por folio, cliente o teléfono…"
            disabled
            className="w-full pl-10 pr-4 h-11 rounded-2xl bg-surface-raised border border-line text-sm text-text-primary placeholder:text-text-muted cursor-not-allowed opacity-80"
          />
        </div>

        {/* Filtros de Estado */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0 no-scrollbar">
          {[
            { label: 'Todos', active: true, count: 12 },
            { label: 'Nuevos', count: 4 },
            { label: 'En Preparación', count: 5 },
            { label: 'En Ruta', count: 3 },
            { label: 'Entregados', count: 28 },
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
      </div>

      {/* Ribbon de Calendario & Torres (Filtro Horizontal) */}
      <div className="flex items-center justify-between gap-3 bg-surface-card p-3 sm:p-4 rounded-2xl border border-line">
        <div className="flex items-center gap-2 text-xs font-bold text-text-secondary">
          <Calendar className="w-4 h-4 text-accent" />
          <span>Filtro de Fecha:</span>
          <Badge variant="default">Hoy (Mié 19 Ago)</Badge>
          <Badge variant="secondary">Mañana (Jue 20 Ago)</Badge>
          <Badge variant="secondary">Viernes (21 Ago)</Badge>
        </div>

        <div className="hidden sm:flex items-center gap-2 text-xs font-semibold text-text-muted">
          <MapPin className="w-3.5 h-3.5" />
          <span>Todas las Torres (GGA / Valcob)</span>
        </div>
      </div>

      {/* Grid de Tarjetas de Pedidos (Esqueletos representativos) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3].map((item) => (
          <div
            key={item}
            className="bg-surface-card rounded-3xl p-5 border border-line shadow-card space-y-4 hover:border-accent/40 transition-colors"
          >
            {/* Header del pedido: Folio y Estado */}
            <div className="flex items-center justify-between border-b border-line pb-3">
              <div className="flex items-center gap-2">
                <span className="text-base font-black text-text-primary">#ORD-0{item}84</span>
                <Badge variant={item === 1 ? 'default' : 'warning'}>
                  {item === 1 ? 'Nuevo' : 'En Preparación'}
                </Badge>
              </div>
              <span className="text-xl font-black text-accent">$310 MXN</span>
            </div>

            {/* Datos de entrega (Jerarquía V3) */}
            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-2 text-text-primary font-bold">
                <MapPin className="w-4 h-4 text-accent shrink-0" />
                <span>Torre GGA • Piso 8, Depto 804</span>
              </div>
              <div className="flex items-center gap-2 text-text-secondary font-medium">
                <Clock className="w-4 h-4 text-text-muted shrink-0" />
                <span>📅 Entrega Hoy (13:45 - 14:15)</span>
              </div>
            </div>

            {/* Ítems del pedido preview */}
            <div className="p-3 rounded-2xl bg-surface-raised border border-line space-y-1 text-xs">
              <div className="flex justify-between font-bold text-text-primary">
                <span>1x Combo Burger OG</span>
                <span>$210</span>
              </div>
              <p className="text-[11px] text-text-muted">
                Papas Francesas • Coca-Cola Zero • Sin Pepinillos
              </p>
              <div className="flex justify-between font-bold text-text-primary pt-1 border-t border-line/50">
                <span>1x Burger BBQ Especial</span>
                <span>$100</span>
              </div>
            </div>

            {/* Skeleton Action Bar */}
            <div className="flex gap-2 pt-1">
              <Skeleton className="h-9 flex-1 rounded-xl" />
              <Skeleton className="h-9 w-20 rounded-xl" />
            </div>
          </div>
        ))}
      </div>

      {/* Banner Informativo del Roadmap */}
      <div className="p-5 rounded-3xl bg-accent-soft border border-accent/20 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 text-center sm:text-left">
          <div className="w-10 h-10 rounded-2xl bg-accent/20 flex items-center justify-center text-accent shrink-0">
            <ShoppingBag className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-text-primary">
              Módulo de Pedidos — Próximo PR-V3-09
            </h4>
            <p className="text-xs text-text-secondary">
              Gestión reactiva de comandas, avance de estados, folios de seguimiento y filtros en tiempo real.
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
