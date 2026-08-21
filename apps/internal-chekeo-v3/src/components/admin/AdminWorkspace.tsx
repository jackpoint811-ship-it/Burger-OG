/**
 * AdminWorkspace.tsx — PR-V3-12
 *
 * Workspace central modular para todas las herramientas administrativas de Chekeo V3.
 * Integra: Menú & Stock, Torres & Horarios, Banners, Sorteos, Corte de Caja e Insumos.
 */

import React, { useState } from 'react';
import {
  UtensilsCrossed,
  Building2,
  Image as ImageIcon,
  Gift,
  Calculator,
  Wheat,
  Shield,
  Sparkles,
} from 'lucide-react';
import { Badge } from '@ui/badge';
import type { AdminActiveTab } from '../../features/admin/types/admin.types';
import { MenuStockPanel } from './MenuStockPanel';
import { TowersAdminPanel } from './TowersAdminPanel';
import { BannersAdminPanel } from './BannersAdminPanel';
import { RafflesAdminPanel } from './RafflesAdminPanel';
import { CashCutPanel } from './CashCutPanel';
import { IngredientsAdminPanel } from './IngredientsAdminPanel';

interface AdminWorkspaceProps {
  initialTab?: AdminActiveTab;
}

export function AdminWorkspace({ initialTab = 'menu' }: AdminWorkspaceProps) {
  const [activeTab, setActiveTab] = useState<AdminActiveTab>(initialTab);

  const tabs: Array<{
    id: AdminActiveTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: string;
  }> = [
    { id: 'menu', label: 'Menú & Stock', icon: UtensilsCrossed },
    { id: 'towers', label: 'Torres & Horarios', icon: Building2 },
    { id: 'banners', label: 'Banners', icon: ImageIcon },
    { id: 'raffles', label: 'Sorteos & Boletos', icon: Gift },
    { id: 'cashcut', label: 'Corte de Caja', icon: Calculator },
    { id: 'ingredients', label: 'Insumos & Recetas', icon: Wheat },
  ];

  return (
    <div className="space-y-6">
      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none border-b border-line">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isSelected = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
                isSelected
                  ? 'bg-text-primary text-surface-card shadow-card'
                  : 'bg-surface-card text-text-secondary hover:text-text-primary border border-line hover:border-accent/40'
              }`}
            >
              <Icon className={`w-4 h-4 ${isSelected ? 'text-accent' : 'text-text-muted'}`} />
              <span>{tab.label}</span>
              {tab.badge && (
                <span className="text-[10px] bg-accent-soft text-accent px-1.5 py-0.5 rounded-md font-extrabold">
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Panel Render */}
      <div className="min-h-[500px]">
        {activeTab === 'menu' && <MenuStockPanel />}
        {activeTab === 'towers' && <TowersAdminPanel />}
        {activeTab === 'banners' && <BannersAdminPanel />}
        {activeTab === 'raffles' && <RafflesAdminPanel />}
        {activeTab === 'cashcut' && <CashCutPanel />}
        {activeTab === 'ingredients' && <IngredientsAdminPanel />}
      </div>
    </div>
  );
}
