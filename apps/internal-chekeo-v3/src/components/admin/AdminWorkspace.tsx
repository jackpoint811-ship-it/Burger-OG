/**
 * AdminWorkspace.tsx — Chekeo V3
 *
 * Workspace central del Panel de Control de Admin V3:
 * - Buscador Universal Command Palette (⌘K)
 * - Migas de Pan multinivel (Breadcrumbs)
 * - Franja de Favoritos dinámicos (⭐ Pin/Unpin)
 * - Hub de 6 Categorías Maestras en 2 Columnas
 * - Submenús interactivos en 2 Columnas por Categoría
 * - Viewport de trabajo operativo completo
 */

import React, { useState } from 'react';
import { ArrowLeft, LayoutGrid } from 'lucide-react';
import type {
  AdminMasterCategory,
  AdminRouteState,
} from '../../features/admin/types/admin.types';
import { ADMIN_CATEGORIES_CONFIG } from '../../features/admin/constants/admin-navigation.constants';
import { getAdminIcon } from '../../features/admin/utils/admin-icons.utils';
import { AdminSearchBar } from './AdminSearchBar';
import { AdminBreadcrumbs } from './AdminBreadcrumbs';
import { AdminQuickFavorites } from './AdminQuickFavorites';
import { AdminDashboardGrid } from './AdminDashboardGrid';
import { AdminCategorySubmenu } from './AdminCategorySubmenu';
import { MenuStockPanel } from './MenuStockPanel';
import { TowersAdminPanel } from './TowersAdminPanel';
import { BannersAdminPanel } from './BannersAdminPanel';
import { RafflesAdminPanel } from './RafflesAdminPanel';
import { CashCutPanel } from './CashCutPanel';
import { IngredientsAdminPanel } from './IngredientsAdminPanel';

interface AdminWorkspaceProps {
  initialCategory?: AdminMasterCategory;
  onLockAdmin?: () => void;
}

export function AdminWorkspace({ initialCategory, onLockAdmin }: AdminWorkspaceProps) {
  const [routeState, setRouteState] = useState<AdminRouteState>(() => {
    if (initialCategory) {
      return { level: 'tool', category: initialCategory, toolId: 'root' };
    }
    return { level: 'overview' };
  });

  const navigateToOverview = () => {
    setRouteState({ level: 'overview' });
  };

  const navigateToCategory = (category: AdminMasterCategory) => {
    setRouteState({ level: 'category', category });
  };

  const navigateToTool = (category: AdminMasterCategory, toolId?: string) => {
    setRouteState({
      level: 'tool',
      category,
      toolId: toolId || 'root',
    });
  };

  const activeCategoryDef = routeState.category
    ? ADMIN_CATEGORIES_CONFIG.find((c) => c.id === routeState.category)
    : null;

  return (
    <div className="space-y-4 sm:space-y-5 animate-in fade-in duration-200">
      {/* 1. Migas de Pan (Breadcrumbs) Multinivel */}
      <AdminBreadcrumbs
        routeState={routeState}
        onNavigateHome={navigateToOverview}
        onNavigateCategory={navigateToCategory}
        onLockAdmin={onLockAdmin}
      />

      {/* 2. Buscador Rápido Command Palette (Visible en Overview y Submenús) */}
      <AdminSearchBar onSelect={(cat, tool) => navigateToTool(cat, tool)} />

      {/* 3. Franja de Favoritos y Accesos Rápidos Dinámicos */}
      <AdminQuickFavorites
        activeCategory={routeState.category}
        activeToolId={routeState.toolId}
        onNavigate={(cat, tool) => navigateToTool(cat, tool)}
      />

      {/* 4. Cuerpo Principal Condicional */}
      {routeState.level === 'overview' && (
        <AdminDashboardGrid
          onSelectCategory={navigateToCategory}
          onSelectTool={navigateToTool}
        />
      )}

      {routeState.level === 'category' && routeState.category && (
        <AdminCategorySubmenu
          category={routeState.category}
          onSelectTool={(toolId) => navigateToTool(routeState.category!, toolId)}
          onBackToOverview={navigateToOverview}
        />
      )}

      {routeState.level === 'tool' && routeState.category && (
        <div className="space-y-4">
          {/* Barra de Sub-Navegación Rápida de Herramientas de la Categoría */}
          {activeCategoryDef && (
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none border-b border-line">
              <button
                type="button"
                onClick={() => navigateToCategory(routeState.category!)}
                className="px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 bg-surface-card text-text-secondary hover:text-text-primary border border-line hover:border-accent/40 cursor-pointer"
                title="Volver al submenú de la categoría"
              >
                <ArrowLeft className="w-3.5 h-3.5 text-accent" />
                <span>Submenú {activeCategoryDef.shortTitle}</span>
              </button>

              {activeCategoryDef.subcategories.map((sub) => {
                const SubIcon = getAdminIcon(sub.iconName);
                const isSelected = routeState.toolId === sub.id;

                return (
                  <button
                    key={sub.id}
                    type="button"
                    onClick={() => navigateToTool(routeState.category!, sub.id)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
                      isSelected
                        ? 'bg-text-primary text-surface-card shadow-xs font-black'
                        : 'bg-surface-card text-text-secondary hover:text-text-primary border border-line hover:border-accent/40'
                    }`}
                  >
                    <SubIcon
                      className={`w-3.5 h-3.5 ${isSelected ? 'text-accent' : 'text-text-muted'}`}
                    />
                    <span>{sub.shortTitle}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Viewport Operativo Completo */}
          <div className="min-h-[500px]">
            {routeState.category === 'menu' && <MenuStockPanel />}
            {routeState.category === 'towers' && <TowersAdminPanel />}
            {routeState.category === 'banners' && <BannersAdminPanel />}
            {routeState.category === 'raffles' && <RafflesAdminPanel />}
            {routeState.category === 'cashcut' && <CashCutPanel />}
            {routeState.category === 'ingredients' && <IngredientsAdminPanel />}
          </div>
        </div>
      )}
    </div>
  );
}
