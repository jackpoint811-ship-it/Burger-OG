import React from 'react';
import { ShieldCheck, Lock, Zap } from 'lucide-react';
import { Button } from '@ui/button';

import type { AdminMasterCategory, AdminPinnedFavorite } from '../../features/admin/types/admin.types';
import { ADMIN_CATEGORIES_CONFIG, type AdminCategoryDefinition } from '../../features/admin/constants/admin-navigation.constants';
import { useAdminPinnedFavorites } from '../../features/admin/hooks/use-admin-pinned-favorites';
import { getAdminIcon } from '../../features/admin/utils/admin-icons.utils';
import { AdminSearchBar } from './AdminSearchBar';

export interface AdminHubGridProps {
  onOpenModule: (category: AdminMasterCategory, toolId?: string) => void;
  onLockAdmin?: () => void;
  className?: string;
}

export function AdminHubGrid({
  onOpenModule,
  onLockAdmin,
  className = '',
}: AdminHubGridProps) {
  const { favorites, unpin } = useAdminPinnedFavorites();

  return (
    <div className={`space-y-6 ${className}`}>
      {/* 1. Header */}
      <div className="bg-surface-card rounded-2xl p-3.5 border border-line shadow-xs flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-9 h-9 rounded-xl bg-accent-soft border border-accent/20 text-accent flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h1 className="text-base font-black text-text-primary m-0 leading-none">Admin</h1>
        </div>

        <div className="flex items-center gap-2 w-full justify-end min-w-0">
          <AdminSearchBar onSelect={(cat, tool) => onOpenModule(cat, tool)} />
          {onLockAdmin && (
            <Button
              variant="outline"
              onClick={onLockAdmin}
              className="h-9 px-2.5 sm:px-3 rounded-xl border-red-500/20 text-red-600 dark:text-red-400 bg-red-500/5 hover:bg-red-500/15 gap-1.5 shrink-0"
              title="Bloquear"
            >
              <Lock className="w-4 h-4" />
              <span className="hidden sm:inline font-bold text-xs">Bloquear</span>
            </Button>
          )}
        </div>
      </div>

      {/* 2. Quick Access section */}
      {favorites.length > 0 && (
        <section className="space-y-2.5">
          <div className="flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-text-muted" />
            <h2 className="text-[11px] font-black uppercase tracking-wider text-text-muted m-0">
              Acceso Rápido
            </h2>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
            {favorites.map((fav) => (
              <QuickActionChip
                key={fav.id}
                favorite={fav}
                onTap={() => onOpenModule(fav.category, fav.toolId)}
                onUnpin={() => unpin(fav.id)}
              />
            ))}
          </div>
        </section>
      )}

      {/* 3. Modules section */}
      <section className="space-y-2.5">
        <h2 className="text-[11px] font-black uppercase tracking-wider text-text-muted m-0">
          Módulos
        </h2>
        <div className="grid grid-cols-2 gap-2.5">
          {ADMIN_CATEGORIES_CONFIG.map((cat) => (
            <ModuleCard
              key={cat.id}
              category={cat}
              onOpen={() => onOpenModule(cat.id)}
            />
          ))}
        </div>
      </section>
    </div>
  );
}

function QuickActionChip({
  favorite,
  onTap,
  onUnpin,
}: {
  favorite: AdminPinnedFavorite;
  onTap: () => void;
  onUnpin: () => void;
}) {
  const Icon = getAdminIcon(favorite.iconName);

  return (
    <button
      type="button"
      onClick={onTap}
      onContextMenu={(e) => {
        e.preventDefault();
        onUnpin();
      }}
      className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-2xl bg-surface-card border border-line shadow-xs hover:border-accent/40 active:scale-[0.96] transition-all cursor-pointer min-h-[var(--touch-target-min)] focus-visible:ring-2 focus-visible:ring-accent"
      title={`Abrir ${favorite.title} (Clic derecho para desfijar)`}
    >
      <Icon className="w-5 h-5 text-text-secondary" />
      <span className="text-[11px] font-bold text-text-primary text-center leading-tight">
        {favorite.shortTitle}
      </span>
    </button>
  );
}

function ModuleCard({
  category,
  onOpen,
}: {
  category: AdminCategoryDefinition;
  onOpen: () => void;
}) {
  const Icon = getAdminIcon(category.iconName);

  return (
    <button
      type="button"
      onClick={onOpen}
      className="bg-surface-card rounded-2xl p-3.5 border border-line shadow-xs hover:border-accent/40 active:scale-[0.98] transition-all cursor-pointer text-left focus-visible:ring-2 focus-visible:ring-accent group min-w-0 relative"
    >
      <div className="flex items-center justify-between gap-2 mb-2.5">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${category.colorClass}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <div className="min-w-0">
        <h3 className="text-sm font-black text-text-primary group-hover:text-accent transition-colors truncate">
          {category.shortTitle}
        </h3>
        <p className="text-[11px] text-text-muted truncate mt-0.5">
          {category.subtitle}
        </p>
      </div>
    </button>
  );
}
