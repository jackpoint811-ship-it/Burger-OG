/**
 * PagosView.tsx — PR-V3-08
 *
 * Vista placeholder & esqueleto base para el módulo de Pagos y Conciliación (PR-V3-11).
 * Concentra: Tickets, verificación SPEI/Efectivo, acciones directas de WhatsApp y corte de caja.
 */

import React from 'react';
import { CreditCard, DollarSign, MessageCircle, CheckCircle2, Clock, Sparkles, Copy, FileText, ArrowUpRight } from 'lucide-react';
import { Badge } from '@ui/badge';
import { Button } from '@ui/button';
import { Skeleton } from '@ui/skeleton';

export function PagosView() {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Resumen Financiero del Día (KPI Cards) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {[
          { label: 'Total Ventas Hoy', amount: '$4,280', hint: '14 pedidos', tone: 'accent' },
          { label: 'Transferencia SPEI', amount: '$3,120', hint: '10 pedidos', tone: 'primary' },
          { label: 'Efectivo en Entrega', amount: '$1,160', hint: '4 pedidos', tone: 'primary' },
          { label: 'Por Conciliar', amount: '$620', hint: '2 pendientes', tone: 'warning' },
        ].map((kpi, idx) => (
          <div
            key={idx}
            className="bg-surface-card p-4 sm:p-5 rounded-3xl border border-line shadow-card space-y-2"
          >
            <span className="text-xs font-bold uppercase tracking-wider text-text-muted">
              {kpi.label}
            </span>
            <div className="flex items-baseline justify-between">
              <span
                className={`text-2xl sm:text-3xl font-black ${
                  kpi.tone === 'accent'
                    ? 'text-accent'
                    : kpi.tone === 'warning'
                    ? 'text-amber-500'
                    : 'text-text-primary'
                }`}
              >
                {kpi.amount}
              </span>
              <span className="text-xs font-semibold text-text-secondary">{kpi.hint}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Barra de Filtros de Pagos */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-surface-card p-4 rounded-3xl border border-line shadow-xs">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 no-scrollbar">
          {[
            { label: 'Todos los Pagos', active: true, count: 14 },
            { label: 'Por Verificar (SPEI)', count: 2 },
            { label: 'Pagados / Conciliados', count: 12 },
            { label: 'Efectivo', count: 4 },
          ].map((item, idx) => (
            <button
              key={idx}
              type="button"
              disabled
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap flex items-center gap-1.5 transition-colors ${
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

        <Button variant="outline" size="sm" disabled className="text-xs font-bold shrink-0">
          <FileText className="w-3.5 h-3.5 mr-1.5" />
          <span>Descargar Resumen</span>
        </Button>
      </div>

      {/* Lista de Conciliación de Pagos (Esqueletos representativos) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          { folio: '#ORD-0184', customer: 'Carlos Mendoza', phone: '55 1234 5678', method: 'SPEI', total: '$310', status: 'pending' },
          { folio: '#ORD-0185', customer: 'Fernanda Ruiz', phone: '55 8765 4321', method: 'Efectivo', total: '$420', status: 'paid' },
          { folio: '#ORD-0186', customer: 'Alejandro Soto', phone: '55 9988 7766', method: 'SPEI', total: '$210', status: 'paid' },
        ].map((item, idx) => (
          <div
            key={idx}
            className="bg-surface-card rounded-3xl p-5 border border-line shadow-card space-y-4"
          >
            <div className="flex items-center justify-between border-b border-line pb-3">
              <div>
                <span className="text-base font-black text-text-primary">{item.folio}</span>
                <p className="text-xs font-bold text-text-secondary">{item.customer}</p>
              </div>
              <div className="text-right">
                <span className="text-xl font-black text-accent">{item.total}</span>
                <div className="flex justify-end">
                  <Badge variant={item.status === 'paid' ? 'success' : 'warning'}>
                    {item.status === 'paid' ? 'Pagado' : 'Por Verificar'}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-surface-raised border border-line space-y-1.5 text-xs">
              <div className="flex justify-between text-text-secondary font-medium">
                <span>Método de Pago:</span>
                <span className="font-bold text-text-primary">{item.method}</span>
              </div>
              <div className="flex justify-between text-text-secondary font-medium">
                <span>Teléfono WhatsApp:</span>
                <span className="font-mono font-bold text-text-primary">{item.phone}</span>
              </div>
            </div>

            {/* Acciones de WhatsApp y Conciliación */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <Button
                variant="outline"
                size="sm"
                disabled
                className="text-xs font-bold flex items-center justify-center gap-1.5 opacity-80"
              >
                <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                <span>WhatsApp</span>
              </Button>

              <Button
                variant="secondary"
                size="sm"
                disabled
                className="text-xs font-bold flex items-center justify-center gap-1.5 opacity-80"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-accent" />
                <span>Conciliar</span>
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Banner Informativo del Roadmap */}
      <div className="p-5 rounded-3xl bg-accent-soft border border-accent/20 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 text-center sm:text-left">
          <div className="w-10 h-10 rounded-2xl bg-accent/20 flex items-center justify-center text-accent shrink-0">
            <CreditCard className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-text-primary">
              Módulo de Pagos & Conciliación — Próximo PR-V3-11
            </h4>
            <p className="text-xs text-text-secondary">
              Control de tickets, confirmación de transferencias SPEI, apertura directa de WhatsApp y comprobantes.
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
