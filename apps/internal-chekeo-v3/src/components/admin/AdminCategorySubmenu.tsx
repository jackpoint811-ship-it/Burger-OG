/**
 * AdminCategorySubmenu.tsx — Chekeo V3
 *
 * Pantalla de Submenú dedicada para cada Categoría Maestra en 2 Columnas:
 * - Despliegue amplio de herramientas y subcategorías
 * - Botón de pin ⭐ por cada herramienta específica
 * - Botón de entrada directa al modo de trabajo operativo
 */

import React from 'react';
import { ArrowRight, Star, ArrowLeft } from 'lucide-react';
import { Button } from '@ui/button';
import { Badge } from '@ui/badge';
import type { AdminMasterCategory } from '../../features/admin/types/admin.types';
import { ADMIN_CATEGORIES_CONFIG } from '../../features/admin/constants/admin-navigation.constants';
import { useAdminPinnedFavorites } from '../../features/admin/hooks/use-admin-pinned-favorites';
import { getAdminIcon } from '../../features/admin/utils/admin-icons.utils';

export interface AdminCategorySubmenuProps {
  category: AdminMasterCategory;
  onSelectTool: (toolId: string) => void;
  onBackToOverview: () => void;
  className?: string;
}

export function AdminCategorySubmenu({
  category,
  onSelectTool,
  onBackToOverview,
  className = '',
}: AdminCategorySubmenuProps) {
  const categoryDef = ADMIN_CATEGORIES_CONFIG.find((c) => c.id === category);
  const { isPinned, togglePin } = useAdminPinnedFavorites();

  if (!categoryDef) {
    return (
      <div className="p-8 text-center text-xs text-text-muted">
        Categoría no encontrada.{' '}
        <button
          type="button"
          onClick={onBackToOverview}
          className="text-accent underline font-bold cursor-pointer"
        >
          Volver al panel principal
        </button>
      </div>
    );
  }

  const CategoryIcon = getAdminIcon(categoryDef.iconName);

  return (
    <div className={`space-y-5 animate-in fade-in duration-200 ${className}`}>
      {/* Cabecera del Submenú */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-surface-card p-5 rounded-3xl border border-line shadow-xs">
        <div className="flex items-center gap-3.5">
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold shrink-0 border ${categoryDef.colorClass}`}
          >
            <CategoryIcon className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black text-text-primary">
                {categoryDef.title}
              </h2>
              <Badge variant="outline" className={`text-[10px] font-black ${categoryDef.badgeColor}`}>
                {categoryDef.tag}
              </Badge>
            </div>
            <p className="text-xs text-text-secondary mt-0.5">
              {categoryDef.subtitle}
            </p>
          </div>
        </div>

        <Button
          type="button"
          variant="outline"
          onClick={onBackToOverview}
          className="h-9 px-3 rounded-2xl text-xs font-bold gap-1.5 cursor-pointer text-text-secondary hover:text-text-primary self-start sm:self-auto border-line"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Volver al Panel General</span>
        </Button>
      </div>

      {/* Grilla en 2 Columnas de las Herramientas del Submenú */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
        {categoryDef.subcategories.map((sub) => {
          const SubIcon = getAdminIcon(sub.iconName);
          const favoriteId = `fav-${categoryDef.id}-${sub.id}`;
          const pinned = isPinned(favoriteId);

          return (
            <div
              key={sub.id}
              className="bg-surface-card rounded-3xl p-5 sm:p-6 border border-line shadow-card hover:border-accent/40 transition-all flex flex-col justify-between space-y-4 group"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-surface-raised border border-line/60 flex items-center justify-center text-text-primary group-hover:text-accent transition-colors shrink-0">
                      <SubIcon className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-text-primary group-hover:text-accent transition-colors">
                        {sub.title}
                      </h3>
                      <span className="text-[10px] font-bold text-text-muted">
                        {sub.tag}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      togglePin({
                        id: favoriteId,
                        title: sub.title,
                        shortTitle: sub.shortTitle,
                        category: categoryDef.id,
                        toolId: sub.id,
                        iconName: sub.iconName,
                        tag: categoryDef.tag,
                        description: sub.description,
                      })
                    }
                    className={`p-2 rounded-xl border transition-all cursor-pointer ${
                      pinned
                        ? 'bg-amber-500/10 border-amber-500/30 text-amber-500'
                        : 'bg-surface-raised border-line/60 text-text-muted hover:text-amber-500'
                    }`}
                    title={pinned ? 'Desfijar de favoritos' : 'Fijar herramienta en favoritos'}
                    aria-label={`Fijar herramienta ${sub.title} en favoritos`}
                  >
                    <Star className={`w-3.5 h-3.5 ${pinned ? 'fill-amber-500' : ''}`} />
                  </button>
                </div>

                <p className="text-xs text-text-secondary leading-relaxed">
                  {sub.description}
                </p>
              </div>

              <div className="pt-2">
                <Button
                  type="button"
                  onClick={() => onSelectTool(sub.id)}
                  className="w-full h-9.5 rounded-2xl font-bold text-xs bg-accent text-white hover:bg-accent-hover transition-all gap-1.5 cursor-pointer shadow-cta"
                >
                  <span>Abrir Herramienta</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
