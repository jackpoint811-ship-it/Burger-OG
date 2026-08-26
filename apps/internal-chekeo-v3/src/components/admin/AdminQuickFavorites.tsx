/**
 * AdminQuickFavorites.tsx — Chekeo V3
 *
 * Franja superior de Favoritos y Accesos Rápidos fijados por el usuario.
 * Persistidos dinámicamente en localStorage con soporte para fijar/desfijar (Pin/Unpin ⭐).
 */

import React from 'react';
import { Star, Zap } from 'lucide-react';
import type { AdminMasterCategory, AdminPinnedFavorite } from '../../features/admin/types/admin.types';
import { useAdminPinnedFavorites } from '../../features/admin/hooks/use-admin-pinned-favorites';
import { getAdminIcon } from '../../features/admin/utils/admin-icons.utils';

export interface AdminQuickFavoritesProps {
  activeCategory?: AdminMasterCategory;
  activeToolId?: string;
  onNavigate: (category: AdminMasterCategory, toolId?: string) => void;
  className?: string;
}

export function AdminQuickFavorites({
  activeCategory,
  activeToolId,
  onNavigate,
  className = '',
}: AdminQuickFavoritesProps) {
  const { favorites, unpin } = useAdminPinnedFavorites();

  if (favorites.length === 0) {
    return null;
  }

  return (
    <div className={`w-full space-y-2 ${className}`}>
      <div className="flex items-center justify-between px-1">
        <span className="text-[11px] font-black uppercase tracking-wider text-text-muted flex items-center gap-1.5">
          <Zap className="w-3 h-3 text-accent" />
          <span>Accesos Rápidos & Favoritos</span>
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-2.5">
        {favorites.map((fav) => {
          const Icon = getAdminIcon(fav.iconName);
          const isSelected =
            activeCategory === fav.category && (!fav.toolId || activeToolId === fav.toolId);

          return (
            <div
              key={fav.id}
              className={`relative rounded-2xl border text-left transition-all flex flex-col justify-between p-3 cursor-pointer select-none group min-h-[72px] ${
                isSelected
                  ? 'bg-surface-card border-accent shadow-card ring-2 ring-accent/25'
                  : 'bg-surface-card border-line hover:border-accent/40 hover:bg-surface-raised/60 shadow-xs'
              }`}
              onClick={() => onNavigate(fav.category, fav.toolId)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onNavigate(fav.category, fav.toolId);
                }
              }}
              aria-label={`Acceso rápido a ${fav.title}`}
            >
              <div className="flex items-center justify-between w-full">
                <div className="p-1.5 rounded-xl bg-surface-raised border border-line/60 text-text-primary group-hover:text-accent transition-colors">
                  <Icon className="w-4 h-4" />
                </div>

                <div className="flex items-center gap-1">
                  <span className="text-[9px] font-black uppercase tracking-wider text-text-muted px-1.5 py-0.5 rounded-md bg-surface-raised border border-line/60">
                    {fav.tag}
                  </span>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      unpin(fav.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 focus:opacity-100 p-1 text-amber-500 hover:text-amber-600 transition-opacity cursor-pointer"
                    title="Desfijar de favoritos"
                    aria-label={`Desfijar ${fav.title} de favoritos`}
                  >
                    <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                  </button>
                </div>
              </div>

              <div>
                <p className="text-xs font-black text-text-primary group-hover:text-accent transition-colors truncate">
                  {fav.title}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
