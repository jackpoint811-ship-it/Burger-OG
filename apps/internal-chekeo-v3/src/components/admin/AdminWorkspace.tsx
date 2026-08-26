/**
 * AdminWorkspace.tsx — Chekeo V3
 *
 * Workspace central del Panel de Control de Admin V3:
 * - Migas de pan (Breadcrumbs) interactivas
 * - Franja superior de Accesos Rápidos / Favoritos en pastillas compactas
 * - Dashboard principal en 2 Columnas con 6 tarjetas de módulos enriquecidas
 * - Sub-navegación fluida y renderizado de módulos individuales
 */

import React, { useState } from 'react';
import {
  UtensilsCrossed,
  Building2,
  Image as ImageIcon,
  Gift,
  Calculator,
  Wheat,
  LayoutGrid,
} from 'lucide-react';
import type { AdminActiveTab } from '../../features/admin/types/admin.types';
import { AdminBreadcrumbs } from './AdminBreadcrumbs';
import { AdminQuickFavorites } from './AdminQuickFavorites';
import { AdminDashboardGrid } from './AdminDashboardGrid';
import { MenuStockPanel } from './MenuStockPanel';
import { TowersAdminPanel } from './TowersAdminPanel';
import { BannersAdminPanel } from './BannersAdminPanel';
import { RafflesAdminPanel } from './RafflesAdminPanel';
import { CashCutPanel } from './CashCutPanel';
import { IngredientsAdminPanel } from './IngredientsAdminPanel';

interface AdminWorkspaceProps {
  initialTab?: AdminActiveTab;
  onLockAdmin?: () => void;
}

export function AdminWorkspace({ initialTab = 'overview', onLockAdmin }: AdminWorkspaceProps) {
  const [activeTab, setActiveTab] = useState<AdminActiveTab>(initialTab);

  const subTabs: Array<{
    id: Exclude<AdminActiveTab, 'overview'>;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
  }> = [
    { id: 'menu', label: 'Menú & Stock', icon: UtensilsCrossed },
    { id: 'towers', label: 'Torres & Horarios', icon: Building2 },
    { id: 'banners', label: 'Banners', icon: ImageIcon },
    { id: 'raffles', label: 'Sorteos & Boletos', icon: Gift },
    { id: 'cashcut', label: 'Corte de Caja', icon: Calculator },
    { id: 'ingredients', label: 'Insumos & Recetas', icon: Wheat },
  ];

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* 1. Migas de Pan (Breadcrumbs) */}
      <AdminBreadcrumbs
        activeTab={activeTab}
        onNavigate={setActiveTab}
        onLockAdmin={onLockAdmin}
      />

      {/* 2. Franja de Favoritos / Accesos Rápidos en Cuadritos Pequeños */}
      <AdminQuickFavorites
        activeTab={activeTab}
        onNavigate={setActiveTab}
      />

      {/* 3. Renderizado Condicional: Dashboard Grid en 2 Columnas vs Módulo Específico */}
      {activeTab === 'overview' ? (
        <AdminDashboardGrid onNavigate={setActiveTab} />
      ) : (
        <div className="space-y-4">
          {/* Barra de Sub-Pestañas Rápida cuando se está en un módulo */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none border-b border-line">
            <button
              type="button"
              onClick={() => setActiveTab('overview')}
              className="px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 bg-surface-card text-text-secondary hover:text-text-primary border border-line hover:border-accent/40 cursor-pointer"
            >
              <LayoutGrid className="w-3.5 h-3.5 text-accent" />
              <span>Panel General</span>
            </button>

            {subTabs.map((tab) => {
              const Icon = tab.icon;
              const isSelected = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
                    isSelected
                      ? 'bg-text-primary text-surface-card shadow-xs font-black'
                      : 'bg-surface-card text-text-secondary hover:text-text-primary border border-line hover:border-accent/40'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-accent' : 'text-text-muted'}`} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Viewport del Módulo Seleccionado */}
          <div className="min-h-[500px]">
            {activeTab === 'menu' && <MenuStockPanel />}
            {activeTab === 'towers' && <TowersAdminPanel />}
            {activeTab === 'banners' && <BannersAdminPanel />}
            {activeTab === 'raffles' && <RafflesAdminPanel />}
            {activeTab === 'cashcut' && <CashCutPanel />}
            {activeTab === 'ingredients' && <IngredientsAdminPanel />}
          </div>
        </div>
      )}
    </div>
  );
}
