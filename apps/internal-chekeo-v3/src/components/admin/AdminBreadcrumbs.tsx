/**
 * AdminBreadcrumbs.tsx — Chekeo V3
 *
 * Migas de pan jerárquicas y multinivel para el Panel de Control de Admin:
 * - Nivel 0: 🏠 Panel Admin
 * - Nivel 1: 🏠 Panel Admin  ›  [Categoría Maestra]
 * - Nivel 2: 🏠 Panel Admin  ›  [Categoría Maestra]  ›  [Sub-Herramienta]
 * - Botón de retroceso contextual con soporte para tecla Escape
 * - Botón ⭐ para fijar/desfijar en Favoritos
 * - Botón rápido para bloquear sesión de administración
 */

import React, { useEffect } from 'react';
import { Home, ChevronRight, ArrowLeft, Star, Lock } from 'lucide-react';
import { Button } from '@ui/button';
import type { AdminMasterCategory, AdminRouteState } from '../../features/admin/types/admin.types';
import { ADMIN_CATEGORIES_CONFIG } from '../../features/admin/constants/admin-navigation.constants';
import { useAdminPinnedFavorites } from '../../features/admin/hooks/use-admin-pinned-favorites';
import { getAdminIcon } from '../../features/admin/utils/admin-icons.utils';

export interface AdminBreadcrumbsProps {
  routeState: AdminRouteState;
  onNavigateHome: () => void;
  onNavigateCategory: (category: AdminMasterCategory) => void;
  onLockAdmin?: () => void;
  className?: string;
}

export function AdminBreadcrumbs({
  routeState,
  onNavigateHome,
  onNavigateCategory,
  onLockAdmin,
  className = '',
}: AdminBreadcrumbsProps) {
  const { isPinned, togglePin } = useAdminPinnedFavorites();

  const categoryDef = routeState.category
    ? ADMIN_CATEGORIES_CONFIG.find((c) => c.id === routeState.category)
    : null;

  const subcategoryDef =
    categoryDef && routeState.toolId
      ? categoryDef.subcategories.find((s) => s.id === routeState.toolId)
      : null;

  const isHub = routeState.view === 'hub';
  const isWorkspace = routeState.view === 'workspace';

  // Manejo de tecla Escape para retroceder un nivel
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isWorkspace) {
          onNavigateHome();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isWorkspace, onNavigateHome]);

  const currentFavoriteId = subcategoryDef
    ? `fav-${routeState.category}-${subcategoryDef.id}`
    : categoryDef
    ? `fav-${categoryDef.id}-root`
    : '';

  const isCurrentPinned = currentFavoriteId ? isPinned(currentFavoriteId) : false;

  const handleToggleCurrentPin = () => {
    if (subcategoryDef && categoryDef) {
      togglePin({
        id: currentFavoriteId,
        title: subcategoryDef.title,
        shortTitle: subcategoryDef.shortTitle,
        category: categoryDef.id,
        toolId: subcategoryDef.id,
        iconName: subcategoryDef.iconName,
        tag: categoryDef.tag,
      });
    } else if (categoryDef) {
      togglePin({
        id: currentFavoriteId,
        title: categoryDef.title,
        shortTitle: categoryDef.shortTitle,
        category: categoryDef.id,
        iconName: categoryDef.iconName,
        tag: categoryDef.tag,
      });
    }
  };

  return (
    <nav
      aria-label="Migas de pan de administración"
      className={`flex items-center justify-between gap-3 bg-surface-card p-3.5 sm:p-4 rounded-3xl border border-line shadow-xs transition-all ${className}`}
    >
      {/* Ruta Jerárquica */}
      <ol className="flex items-center gap-1.5 text-xs font-bold text-text-secondary overflow-x-auto scrollbar-none py-0.5 min-w-0">
        {/* Raíz: Panel Admin */}
        <li className="shrink-0">
          <button
            type="button"
            onClick={onNavigateHome}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl transition-all cursor-pointer select-none ${
              isHub
                ? 'bg-surface-raised text-accent font-black ring-1 ring-accent/30'
                : 'text-text-secondary hover:text-text-primary hover:bg-surface-raised'
            }`}
            aria-current={isHub ? 'page' : undefined}
          >
            <Home className="w-3.5 h-3.5 text-accent shrink-0" />
            <span>Panel Admin</span>
          </button>
        </li>

        {/* Nivel 1: Categoría Maestra */}
        {categoryDef && (
          <>
            <li aria-hidden="true" className="text-text-muted shrink-0">
              <ChevronRight className="w-3.5 h-3.5" />
            </li>
            <li className="shrink-0">
              <span
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-accent/10 text-accent font-black text-xs ring-1 ring-accent/20"
                aria-current="page"
              >
                <span>{categoryDef.shortTitle}</span>
              </span>
            </li>
          </>
        )}

        {/* Nivel 2: Sub-Herramienta */}
        {subcategoryDef && (
          <>
            <li aria-hidden="true" className="text-text-muted shrink-0">
              <ChevronRight className="w-3.5 h-3.5" />
            </li>
            <li className="shrink-0">
              <span
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-accent/10 text-accent font-black text-xs ring-1 ring-accent/20"
                aria-current="page"
              >
                <span>{subcategoryDef.title}</span>
              </span>
            </li>
          </>
        )}
      </ol>

      {/* Acciones Rápidas */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Botón ⭐ Fijar en Favoritos */}
        {isWorkspace && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleToggleCurrentPin}
            className={`h-8.5 px-2.5 rounded-xl text-xs font-bold gap-1.5 cursor-pointer border-line ${
              isCurrentPinned
                ? 'text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/20'
                : 'text-text-secondary hover:text-text-primary'
            }`}
            title={isCurrentPinned ? 'Desfijar de favoritos' : 'Fijar en favoritos'}
            aria-label={isCurrentPinned ? 'Desfijar de favoritos' : 'Fijar en favoritos'}
          >
            <Star
              className={`w-3.5 h-3.5 ${
                isCurrentPinned ? 'fill-amber-500 text-amber-500' : 'text-text-muted'
              }`}
            />
            <span className="hidden md:inline">
              {isCurrentPinned ? 'Fijado' : 'Fijar'}
            </span>
          </Button>
        )}

        {/* Botón Volver */}
        {isWorkspace && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onNavigateHome}
            className="h-8.5 px-3 rounded-xl text-xs font-bold gap-1.5 cursor-pointer text-text-secondary hover:text-text-primary border-line"
            title="Regresar al Hub (Esc)"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Volver al Hub</span>
          </Button>
        )}

        {/* Botón Bloquear Admin */}
        {onLockAdmin && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onLockAdmin}
            className="h-8.5 px-3 rounded-xl text-xs font-bold gap-1.5 cursor-pointer text-red-600 dark:text-red-400 border-red-500/20 bg-red-500/5 hover:bg-red-500/15"
            title="Bloquear y cerrar sesión de administración"
          >
            <Lock className="w-3.5 h-3.5" />
            <span className="hidden lg:inline">Bloquear Admin</span>
          </Button>
        )}
      </div>
    </nav>
  );
}
