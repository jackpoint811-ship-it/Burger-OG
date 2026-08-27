/**
 * CocinaView.tsx — PR-V3-10 / Refinamiento Operativo V3 (Paso 1)
 *
 * Vista principal de Cocina de Chekeo V3 adaptada a las 3 estaciones operativas:
 * - Nivel 1: Selector de Estaciones (role="tablist") con badges en vivo y badge de Cocina en Vivo
 * - Nivel 2: Riel Horizontal de Fechas para filtrar pedidos de hoy, programados o anteriores
 * - Nivel 3: Área de Producción Directa (Preparación, Side Quest o Resumen K)
 */

import React, { useState, useMemo } from 'react';
import { Flame, UtensilsCrossed, ClipboardList } from 'lucide-react';
import { KitchenDisplay, KitchenSummaryK } from '../kitchen';
import {
  HorizontalDateCalendarFilter,
  extractOrderTargetDate,
} from '../shared/HorizontalDateCalendarFilter';
import { useChekeoOrdersQuery } from '../../features/orders';
import {
  extractKitchenTicketItems,
  extractKitchenProductionUnits,
  useKitchenItemTracking,
} from '../../features/kitchen';

import { getCdmxTodayString } from '@config/index';

export type KitchenLaneTab = 'prep' | 'sideQuest' | 'summaryK';

export function CocinaView() {
  const [activeTab, setActiveTab] = useState<KitchenLaneTab>('prep');
  const [selectedDate, setSelectedDate] = useState<string>('today');

  const { isStationDone } = useKitchenItemTracking();

  // Consulta de pedidos para el calendario horizontal y contadores en vivo
  const { orders } = useChekeoOrdersQuery({
    includeTerminal: false,
    autoRefresh: true,
    refetchIntervalMs: 15000,
  });

  // Contadores reactivos para los badges de las pestañas basados estrictamente en unidades físicas reales
  const { prepPendingCount, sideQuestPendingCount } = useMemo(() => {
    const todayStr = getCdmxTodayString();

    let prepCount = 0;
    let sideCount = 0;

    orders.forEach((order) => {
      // Solo contar pedidos activos (new o preparing)
      if (order.status !== 'new' && order.status !== 'preparing') return;

      // Filtrar por fecha si no es 'all'
      if (selectedDate !== 'all') {
        const targetDate = extractOrderTargetDate(order, todayStr);
        if (selectedDate === 'today' && targetDate !== todayStr) return;
        if (selectedDate === 'past' && targetDate >= todayStr) return;
        if (selectedDate !== 'today' && selectedDate !== 'past' && targetDate !== selectedDate) return;
      }

      const { items } = extractKitchenTicketItems(order.items || []);
      const units = extractKitchenProductionUnits(order.id, items);

      const hasPrep = units.some((u) => u.station === 'prep');
      const hasSide = units.some((u) => u.station === 'sideQuest');

      if (hasPrep && !isStationDone(order.id, 'prep')) prepCount++;
      if (hasSide && !isStationDone(order.id, 'sideQuest')) sideCount++;
    });

    return { prepPendingCount: prepCount, sideQuestPendingCount: sideCount };
  }, [orders, selectedDate, isStationDone]);

  const laneTabs = [
    {
      id: 'prep' as KitchenLaneTab,
      label: 'Preparación',
      icon: Flame,
      badge: prepPendingCount,
      ariaControls: 'kitchen-prep-panel',
    },
    {
      id: 'sideQuest' as KitchenLaneTab,
      label: 'Side Quest',
      icon: UtensilsCrossed,
      badge: sideQuestPendingCount,
      ariaControls: 'kitchen-sidequest-panel',
    },
    {
      id: 'summaryK' as KitchenLaneTab,
      label: 'Resumen K',
      icon: ClipboardList,
      badge: null,
      ariaControls: 'kitchen-summaryk-panel',
    },
  ];

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      {/* ─── NIVEL 1: Selector de Estación Operativa ───────────────────────────── */}
      <div
        role="tablist"
        aria-label="Estaciones de Cocina"
        className="flex items-center justify-between gap-3 flex-wrap bg-surface-card p-2 sm:p-2.5 rounded-3xl border border-line shadow-xs"
      >
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 no-scrollbar">
          {laneTabs.map((tab) => {
            const isActive = activeTab === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                role="tab"
                id={`kitchen-tab-${tab.id}`}
                aria-selected={isActive}
                aria-controls={tab.ariaControls}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`min-h-[44px] px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-black flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap select-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none ${
                  isActive
                    ? 'bg-text-primary text-surface-card shadow-xs'
                    : 'text-text-secondary hover:text-text-primary hover:bg-surface-raised'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-surface-card' : 'text-accent'}`} />
                <span>{tab.label}</span>
                {typeof tab.badge === 'number' && tab.badge > 0 ? (
                  <span
                    className={`px-2 py-0.5 rounded-full text-[11px] font-black ${
                      isActive
                        ? 'bg-surface-card text-text-primary'
                        : 'bg-surface-raised text-text-secondary'
                    }`}
                  >
                    {tab.badge}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>

        {/* Badge de Estado Operativo */}
        <div className="hidden sm:flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-accent/10 border border-accent/20 text-accent text-xs font-black select-none">
          <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
          <span>Cocina en Vivo</span>
        </div>
      </div>

      {/* ─── NIVEL 2: Riel Horizontal de Fechas ────────────────────────────────── */}
      <div className="bg-surface-card p-3 sm:p-4 rounded-3xl border border-line shadow-xs">
        <HorizontalDateCalendarFilter
          orders={orders}
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
        />
      </div>

      {/* ─── NIVEL 3: Área de Producción Directa ──────────────────────────────── */}
      <div
        id={`kitchen-${activeTab}-panel`}
        role="tabpanel"
        aria-labelledby={`kitchen-tab-${activeTab}`}
      >
        {activeTab === 'prep' && (
          <KitchenDisplay laneMode="prep" selectedDate={selectedDate} />
        )}
        {activeTab === 'sideQuest' && (
          <KitchenDisplay laneMode="sideQuest" selectedDate={selectedDate} />
        )}
        {activeTab === 'summaryK' && (
          <KitchenSummaryK selectedDate={selectedDate} />
        )}
      </div>
    </div>
  );
}
