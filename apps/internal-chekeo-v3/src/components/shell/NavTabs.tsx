/**
 * NavTabs.tsx — Chekeo V3 + SaaS Platform Multi-Tenant
 *
 * Navegación principal accesible por pestañas para Chekeo V3 usando @ui/tabs.
 *
 * Pestañas:
 * 1. Resumen K (Mise en place & insumos)
 * 2. Pedidos (Cola y folios)
 * 3. Cocina (KDS Plancha & Sides)
 * 4. Pagos (Tickets y WhatsApp)
 * 5. Admin (Panel de Control de la Marca)
 * 6. SaaS Platform (Super Admin Multi-Tenant & Onboarding de Marcas)
 */

import React from 'react';
import { ClipboardList, ShoppingBag, ChefHat, CreditCard, Settings, Lock, Sparkles } from 'lucide-react';
import { TabsList, TabsTrigger } from '@ui/tabs';
import { useAuthStore } from '../../features/auth';

export type ChekeoTab = 'resumenK' | 'pedidos' | 'cocina' | 'pagos' | 'admin' | 'saas';

export interface TabItem {
  id: ChekeoTab;
  label: string;
  shortLabel: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string | number;
  highlight?: boolean;
}

export const CHEKEO_TABS: TabItem[] = [
  {
    id: 'resumenK',
    label: 'Resumen K',
    shortLabel: 'Resumen K',
    subtitle: 'Mise en Place & Insumos',
    icon: ClipboardList,
  },
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
    subtitle: 'KDS Plancha & Sides',
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
    subtitle: 'Panel de Marca',
    icon: Settings,
  },
  {
    id: 'saas',
    label: 'SaaS Platform',
    shortLabel: 'SaaS',
    subtitle: 'Super Admin & Marcas',
    icon: Sparkles,
    highlight: true,
  },
];

interface NavTabsProps {
  activeTab: ChekeoTab;
  onTabChange?: (tab: ChekeoTab) => void;
}

export function NavTabs({ activeTab, onTabChange }: NavTabsProps) {
  const { isAuthenticated } = useAuthStore();

  return (
    <div className="w-full bg-surface-card border-b border-line px-2 sm:px-6 py-2 transition-colors duration-200">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <TabsList className="w-full sm:w-auto h-auto p-1 bg-surface-raised border border-line rounded-2xl grid grid-cols-6 sm:flex gap-1">
          {CHEKEO_TABS.map((tab) => {
            const isTabAdmin = tab.id === 'admin';
            const Icon = isTabAdmin && !isAuthenticated ? Lock : tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <TabsTrigger
                key={tab.id}
                value={tab.id}
                onClick={() => onTabChange?.(tab.id)}
                className={`flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer min-h-[44px] select-none ${
                  isActive
                    ? 'bg-surface-card text-accent shadow-sm border border-line/60 ring-1 ring-accent/20'
                    : tab.highlight
                    ? 'text-purple-600 dark:text-purple-400 hover:bg-purple-500/10'
                    : 'text-text-secondary hover:text-text-primary hover:bg-surface'
                }`}
                aria-label={`Pestaña ${tab.label}: ${tab.subtitle}`}
              >
                <Icon
                  className={`w-4 h-4 sm:w-4.5 sm:h-4.5 shrink-0 ${
                    isActive
                      ? 'text-accent'
                      : tab.highlight
                      ? 'text-purple-500'
                      : isTabAdmin && !isAuthenticated
                      ? 'text-amber-500'
                      : 'text-text-muted'
                  }`}
                />
                <div className="flex flex-col items-center sm:items-start text-center sm:text-left leading-tight">
                  <div className="flex items-center gap-1">
                    <span className="font-extrabold">{tab.shortLabel}</span>
                    {tab.highlight && (
                      <span className="hidden sm:inline-block text-[9px] font-black uppercase px-1 py-0.2 rounded bg-purple-500/20 text-purple-600 dark:text-purple-300">
                        Pro
                      </span>
                    )}
                    {isTabAdmin && !isAuthenticated && (
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 sm:hidden" />
                    )}
                  </div>
                  <span className="hidden lg:inline text-[10px] font-medium text-text-muted">
                    {isTabAdmin && !isAuthenticated ? '🔒 PIN Requerido' : tab.subtitle}
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
