/**
 * NavTabs.tsx — Chekeo V3
 *
 * Navegación principal accesible por pestañas para Chekeo V3 usando @ui/tabs.
 *
 * Pestañas operativas del restaurante:
 * 1. Resumen K (Mise en place & insumos)
 * 2. Pedidos (Cola y folios)
 * 3. Cocina (KDS Plancha & Sides)
 * 4. Pagos (Tickets y WhatsApp)
 * 5. Admin (Panel de Control de la Marca)
 */

import React, { useMemo } from 'react';
import { ClipboardList, ShoppingBag, ChefHat, CreditCard, Settings, Lock } from 'lucide-react';
import { TabsList, TabsTrigger } from '@ui/tabs';
import { useAuthStore } from '../../features/auth';
import { useDepartmentStore } from '../../features/shared';
import { useChekeoOrdersQuery } from '../../features/orders';

export type ChekeoTab = 'resumenK' | 'pedidos' | 'cocina' | 'pagos' | 'admin';

export interface TabItem {
  id: ChekeoTab;
  label: string;
  shortLabel: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string | number;
}

export const COCINA_TABS: TabItem[] = [
  {
    id: 'cocina',
    label: 'KDS Cocina',
    shortLabel: 'KDS',
    subtitle: 'Plancha & Side Quest',
    icon: ChefHat,
  },
  {
    id: 'resumenK',
    label: 'Resumen K',
    shortLabel: 'Resumen K',
    subtitle: 'Mise en Place & Insumos',
    icon: ClipboardList,
  },
];

export const ADMIN_TABS: TabItem[] = [
  {
    id: 'resumenK',
    label: 'Operación',
    shortLabel: 'Operación',
    subtitle: 'Semáforo de Turno',
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
    id: 'pagos',
    label: 'Pagos',
    shortLabel: 'Pagos',
    subtitle: 'Tickets & SPEI',
    icon: CreditCard,
  },
  {
    id: 'admin',
    label: 'Admin',
    shortLabel: 'Admin',
    subtitle: 'Panel de Marca',
    icon: Settings,
  },
];

interface NavTabsProps {
  activeTab: ChekeoTab;
  onTabChange?: (tab: ChekeoTab) => void;
}

export function NavTabs({ activeTab, onTabChange }: NavTabsProps) {
  const { isAuthenticated } = useAuthStore();
  const { activeDepartment } = useDepartmentStore();

  const { orders } = useChekeoOrdersQuery({ autoRefresh: true, refetchIntervalMs: 15000 });

  // Métricas reactivas para badges de las pestañas
  const counts = useMemo(() => {
    const active = orders.filter((o) => o.status !== 'delivered' && o.status !== 'cancelled');
    const inKitchen = active.filter((o) => o.status === 'new' || o.status === 'preparing');
    const pendingPayment = active.filter((o) => o.paymentStatus === 'pending');
    return {
      kitchen: inKitchen.length,
      activeOrders: active.length,
      pendingPayment: pendingPayment.length,
    };
  }, [orders]);

  // Pestañas visibles según el departamento
  const visibleTabs = useMemo(() => {
    const baseTabs = activeDepartment === 'cocina' ? COCINA_TABS : ADMIN_TABS;
    return baseTabs.map((tab) => {
      let badge: number | undefined;
      if (tab.id === 'cocina' && counts.kitchen > 0) badge = counts.kitchen;
      if (tab.id === 'pedidos' && counts.activeOrders > 0) badge = counts.activeOrders;
      if (tab.id === 'pagos' && counts.pendingPayment > 0) badge = counts.pendingPayment;
      return { ...tab, badge };
    });
  }, [activeDepartment, counts]);

  const gridColsClass = activeDepartment === 'cocina' ? 'grid-cols-2' : 'grid-cols-4';

  return (
    <div className="w-full bg-surface-card border-b border-line px-2 sm:px-6 py-2 transition-colors duration-200">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <TabsList className={`w-full sm:w-auto h-auto p-1 bg-surface-raised border border-line rounded-2xl grid ${gridColsClass} sm:flex gap-1`}>
          {visibleTabs.map((tab) => {
            const isTabAdmin = tab.id === 'admin';
            const Icon = isTabAdmin && !isAuthenticated ? Lock : tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <TabsTrigger
                key={tab.id}
                value={tab.id}
                onClick={() => onTabChange?.(tab.id)}
                className={`flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer min-h-[44px] select-none ${
                  isActive
                    ? 'bg-surface-card text-accent shadow-sm border border-line/60 ring-1 ring-accent/20'
                    : 'text-text-secondary hover:text-text-primary hover:bg-surface'
                }`}
                aria-label={`Pestaña ${tab.label}: ${tab.subtitle}`}
              >
                <Icon
                  className={`w-4 h-4 sm:w-4.5 sm:h-4.5 shrink-0 ${
                    isActive
                      ? 'text-accent'
                      : isTabAdmin && !isAuthenticated
                      ? 'text-amber-500'
                      : 'text-text-muted'
                  }`}
                />
                <div className="flex flex-col items-center sm:items-start text-center sm:text-left leading-tight">
                  <div className="flex items-center gap-1">
                    <span className="font-extrabold">{tab.shortLabel}</span>
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

        {/* Indicador contextual de workspace a la derecha */}
        <div className="hidden sm:flex items-center gap-2 text-xs font-mono font-bold text-text-muted">
          <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
          <span>Workspace: {activeDepartment === 'cocina' ? 'Cocina & KDS' : 'Administración'}</span>
        </div>
      </div>
    </div>
  );
}
