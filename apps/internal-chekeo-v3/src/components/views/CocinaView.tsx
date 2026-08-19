/**
 * CocinaView.tsx — PR-V3-10
 *
 * Vista principal de Cocina de Chekeo V3:
 * - Sub-navegación entre Pantalla KDS (Kanban) y Resumen K (Mise en Place)
 * - Conexión directa a hooks y componentes de producción en tiempo real
 */

import React, { useState } from 'react';
import { ChefHat, LayoutGrid, FileSpreadsheet, Sparkles } from 'lucide-react';
import { KitchenDisplay, KitchenSummaryK } from '../kitchen';

export type CocinaSubView = 'kds' | 'summary-k';

export function CocinaView() {
  const [activeSubView, setActiveSubView] = useState<CocinaSubView>('kds');

  return (
    <div className="space-y-5">
      {/* ─── Selector de Sub-Vista (KDS vs Resumen K) ─────────────────────────── */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-surface-card border border-line shadow-xs">
          <button
            type="button"
            onClick={() => setActiveSubView('kds')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-black flex items-center gap-2 transition-all cursor-pointer ${
              activeSubView === 'kds'
                ? 'bg-text-primary text-surface-card shadow-xs'
                : 'text-text-secondary hover:text-text-primary hover:bg-surface-raised'
            }`}
          >
            <LayoutGrid className="w-4 h-4" />
            <span>Pantalla KDS (Kanban)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubView('summary-k')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-black flex items-center gap-2 transition-all cursor-pointer ${
              activeSubView === 'summary-k'
                ? 'bg-text-primary text-surface-card shadow-xs'
                : 'text-text-secondary hover:text-text-primary hover:bg-surface-raised'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Resumen K (Mise en Place)</span>
          </button>
        </div>

        {/* Badge de Estado Operativo */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-accent/10 border border-accent/20 text-accent text-xs font-black">
          <span className="w-2 h-2 rounded-full bg-accent animate-pulse"></span>
          <span>Cocina en Vivo</span>
        </div>
      </div>

      {/* ─── Renderizado de la Sub-Vista Activa ───────────────────────────────── */}
      {activeSubView === 'kds' ? <KitchenDisplay /> : <KitchenSummaryK />}
    </div>
  );
}
