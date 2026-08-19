/**
 * NavTabs.tsx — PR-V3-08
 *
 * Navegación principal accesible por pestañas para Chekeo V3 usando @ui/tabs.
 *
 * Pestañas operativas:
 * 1. Pedidos (Gestión, folios y filtros)
 * 2. Cocina (KDS, comandas en tiempo real e insumos)
 * 3. Pagos (Tickets, WhatsApp y conciliación)
 * 4. Admin (Menú, Torres, Banners, Sorteos y Corte de caja)
 */

import React from 'react';
import { ShoppingBag, ChefHat, CreditCard, Settings } from 'lucide-react';
import { TabsList, TabsTrigger } from '@ui/tabs';

export type ChekeoTab = 'pedidos' | 'cocina' | 'pagos' | 'admin';

export interface TabItem {
  id: ChekeoTab;
  label: string;
  shortLabel: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string | number;
}

export const CHEKEO_TABS: TabItem[] = [
  {
    id: 'pedidos',
    label: 'Pedidos',
    shortLabel: 'Pedidos',
    subtitle: 'Cola & Folios',
    icon: ShoppingBag,
  },
  {
    id: 'cocina',
    label: 'Cocina',
    shortLabel: 'Cocina',
    subtitle: 'KDS & Insumos',
    icon: ChefHat,
  },
  {
    id: 'pagos',
    label: 'Pagos',
    shortLabel: 'Pagos',
    subtitle: 'Tickets & WhatsApp',
    icon: CreditCard,
  },
  {
    id: 'admin',
    label: 'Admin',
    shortLabel: 'Admin',
    subtitle: 'Menú & Corte',
    icon: Settings,
  },
];

interface NavTabsProps {
  activeTab: ChekeoTab;
  onTabChange?: (tab: ChekeoTab) => void;
}

export function NavTabs({ activeTab, onTabChange }: NavTabsProps) {
  return (
    <div className="w-full bg-surface-card border-b border-line px-3 sm:px-6 py-2.5 transition-colors duration-200">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <TabsList className="w-full sm:w-auto h-auto p-1.5 bg-surface-raised border border-line rounded-2xl grid grid-cols-4 sm:flex gap-1">
          {CHEKEO_TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <TabsTrigger
                key={tab.id}
                value={tab.id}
                onClick={() => onTabChange?.(tab.id)}
                className={`flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2.5 px-2.5 sm:px-5 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer min-h-[44px] select-none ${
                  isActive
                    ? 'bg-surface-card text-accent shadow-sm border border-line/60'
                    : 'text-text-secondary hover:text-text-primary hover:bg-surface'
                }`}
                aria-label={`Pestaña ${tab.label}: ${tab.subtitle}`}
              >
                <Icon
                  className={`w-4 h-4 sm:w-4.5 sm:h-4.5 shrink-0 ${
                    isActive ? 'text-accent' : 'text-text-muted'
                  }`}
                />
                <div className="flex flex-col items-center sm:items-start text-center sm:text-left leading-tight">
                  <span className="font-extrabold">{tab.label}</span>
                  <span className="hidden lg:inline text-[10px] font-medium text-text-muted">
                    {tab.subtitle}
                  </span>
                </div>

                {tab.badge !== undefined && (
                  <span
                    className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-black ${
                      isActive
                        ? 'bg-accent text-white'
                        : 'bg-surface border border-line text-text-muted'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </TabsTrigger>
            );
          })}
        </TabsList>
      </div>
    </div>
  );
}
