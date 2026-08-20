/**
 * CocinaView.tsx — PR-V3-10 / Refinamiento Operativo V3
 *
 * Vista principal de Cocina de Chekeo V3 adaptada a las 3 estaciones operativas:
 * 1. 🍔 Preparación (Plancha / Burgers)
 * 2. 🍟 Side Quest (Freidora / Papas & Empaque)
 * 3. 📋 Resumen K (Mise en Place de Insumos)
 *
 * Incluye el Riel Horizontal de Fechas para filtrar pedidos de hoy o entregas programadas.
 */

import React, { useState } from 'react';
import { ChefHat, Flame, Utensils, FileSpreadsheet } from 'lucide-react';
import { KitchenDisplay, KitchenSummaryK } from '../kitchen';
import { HorizontalDateCalendarFilter } from '../shared/HorizontalDateCalendarFilter';
import { useChekeoOrdersQuery } from '../../features/orders';

export type KitchenLaneTab = 'prep' | 'sideQuest' | 'summaryK';

export function CocinaView() {
  const [activeTab, setActiveTab] = useState<KitchenLaneTab>('prep');
  const [selectedDate, setSelectedDate] = useState<string>('today');

  // Consulta de pedidos para el calendario horizontal
  const { orders } = useChekeoOrdersQuery({
    includeTerminal: false,
    autoRefresh: true,
    refetchIntervalMs: 15000,
  });

  const laneTabs = [
    {
      id: 'prep' as KitchenLaneTab,
      label: '🍔 Preparación (Plancha)',
      desc: 'Hamburguesas y carnes smash',
    },
    {
      id: 'sideQuest' as KitchenLaneTab,
      label: '🍟 Side Quest (Freidora & Empaque)',
      desc: 'Papas, aros, bebidas y ensamble',
    },
    {
      id: 'summaryK' as KitchenLaneTab,
      label: '📋 Resumen K (Mise en Place)',
      desc: 'Totalizador de insumos',
    },
  ];

  return (
    <div className="space-y-5 animate-in fade-in duration-300">
      {/* ─── Riel Horizontal de Fechas ────────────────────────────────────────── */}
      <div className="bg-surface-card p-4 rounded-3xl border border-line shadow-xs">
        <HorizontalDateCalendarFilter
          orders={orders}
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
        />
      </div>

      {/* ─── Selector de Estación / Pestaña Operativa ─────────────────────────── */}
      <div className="flex items-center justify-between gap-3 flex-wrap bg-surface-card p-2 rounded-3xl border border-line shadow-xs">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 no-scrollbar">
          {laneTabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-black flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap select-none ${
                  isActive
                    ? 'bg-text-primary text-surface-card shadow-xs scale-[1.01]'
                    : 'text-text-secondary hover:text-text-primary hover:bg-surface-raised'
                }`}
              >
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Badge de Estado Operativo */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-accent/10 border border-accent/20 text-accent text-xs font-black">
          <span className="w-2 h-2 rounded-full bg-accent animate-pulse"></span>
          <span>Cocina en Vivo</span>
        </div>
      </div>

      {/* ─── Renderizado de la Estación Activa ────────────────────────────────── */}
      {activeTab === 'prep' && (
        <KitchenDisplay laneMode="prep" selectedDate={selectedDate} />
      )}
      {activeTab === 'sideQuest' && (
        <KitchenDisplay laneMode="sideQuest" selectedDate={selectedDate} />
      )}
      {activeTab === 'summaryK' && <KitchenSummaryK />}
    </div>
  );
}
