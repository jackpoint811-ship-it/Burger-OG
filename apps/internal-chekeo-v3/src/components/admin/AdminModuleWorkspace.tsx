/**
 * AdminModuleWorkspace.tsx — Chekeo V3
 *
 * Pantalla 2: Workspace Dedicado Maestro-Detalle a Pantalla Completa:
 * - Barra superior con Migas de Pan, Botón [ ← Volver al Hub ], Botón ⭐ Pin y [ 🔒 Bloquear ]
 * - Sidebar lateral izquierdo con Favoritos Rápidos y Herramientas del Módulo
 * - Lienzo central derecho a pantalla completa para trabajo sin distracciones
 * - Adaptable para Mobile / Tablet / Desktop
 */

import React, { useState, useEffect, lazy, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ChevronRight, Home, Star, Lock, Zap } from 'lucide-react';
import { Button } from '@ui/button';
import { Badge } from '@ui/badge';
import { Skeleton } from '@ui/skeleton';
import type { AdminMasterCategory } from '../../features/admin/types/admin.types';
import { ADMIN_CATEGORIES_CONFIG } from '../../features/admin/constants/admin-navigation.constants';
import { useAdminPinnedFavorites } from '../../features/admin/hooks/use-admin-pinned-favorites';
import { getAdminIcon } from '../../features/admin/utils/admin-icons.utils';
import { AdminSearchBar } from './AdminSearchBar';

// Lazy loading granular para cada panel de administración
const MenuStockPanel = lazy(() =>
  import('./MenuStockPanel').then((m) => ({ default: m.MenuStockPanel }))
);
const TowersAdminPanel = lazy(() =>
  import('./TowersAdminPanel').then((m) => ({ default: m.TowersAdminPanel }))
);
const BannersAdminPanel = lazy(() =>
  import('./BannersAdminPanel').then((m) => ({ default: m.BannersAdminPanel }))
);
const RafflesAdminPanel = lazy(() =>
  import('./RafflesAdminPanel').then((m) => ({ default: m.RafflesAdminPanel }))
);
const CashCutPanel = lazy(() =>
  import('./CashCutPanel').then((m) => ({ default: m.CashCutPanel }))
);
const IngredientsAdminPanel = lazy(() =>
  import('./IngredientsAdminPanel').then((m) => ({ default: m.IngredientsAdminPanel }))
);

function AdminPanelLoadingFallback() {
  return (
    <div className="bg-surface-card p-5 rounded-3xl border border-line shadow-xs space-y-4 animate-in fade-in duration-200">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-44 rounded-xl" />
        <Skeleton className="h-8 w-28 rounded-xl" />
      </div>
      <Skeleton className="h-20 w-full rounded-2xl" />
      <div className="space-y-3">
        <Skeleton className="h-14 w-full rounded-xl" />
        <Skeleton className="h-14 w-full rounded-xl" />
        <Skeleton className="h-14 w-full rounded-xl" />
      </div>
    </div>
  );
}

export interface AdminModuleWorkspaceProps {
  category: AdminMasterCategory;
  initialToolId?: string;
  onBackToHub: () => void;
  onNavigateModule: (category: AdminMasterCategory, toolId?: string) => void;
  onLockAdmin?: () => void;
  className?: string;
}

export function AdminModuleWorkspace({
  category,
  initialToolId,
  onBackToHub,
  onNavigateModule,
  onLockAdmin,
  className = '',
}: AdminModuleWorkspaceProps) {
  const categoryDef = ADMIN_CATEGORIES_CONFIG.find((c) => c.id === category);
  const [activeToolId, setActiveToolId] = useState<string>(() => {
    return initialToolId || categoryDef?.subcategories[0]?.id || 'root';
  });

  const { favorites, isPinned, togglePin } = useAdminPinnedFavorites();

  // Sincronizar si cambia initialToolId desde fuera
  useEffect(() => {
    if (initialToolId) {
      setActiveToolId(initialToolId);
    }
  }, [initialToolId]);

  // Manejo de atajo de teclado Escape para volver al Hub
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onBackToHub();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onBackToHub]);

  if (!categoryDef) {
    return (
      <div className="p-8 text-center text-xs text-text-muted">
        Módulo no encontrado.{' '}
        <button
          type="button"
          onClick={onBackToHub}
          className="text-accent underline font-bold cursor-pointer"
        >
          Volver al panel general
        </button>
      </div>
    );
  }

  const activeSubcategory = categoryDef.subcategories.find((s) => s.id === activeToolId);
  const currentFavoriteId = `fav-${categoryDef.id}-${activeToolId}`;
  const isCurrentPinned = isPinned(currentFavoriteId);

  const handleToggleCurrentPin = () => {
    if (activeSubcategory) {
      togglePin({
        id: currentFavoriteId,
        title: activeSubcategory.title,
        shortTitle: activeSubcategory.shortTitle,
        category: categoryDef.id,
        toolId: activeSubcategory.id,
        iconName: activeSubcategory.iconName,
        tag: categoryDef.tag,
        description: activeSubcategory.description,
      });
    } else {
      togglePin({
        id: `fav-${categoryDef.id}-root`,
        title: categoryDef.title,
        shortTitle: categoryDef.shortTitle,
        category: categoryDef.id,
        iconName: categoryDef.iconName,
        tag: categoryDef.tag,
      });
    }
  };

  const CategoryIcon = getAdminIcon(categoryDef.iconName);

  return (
    <div className={`space-y-4 sm:space-y-5 animate-in fade-in duration-200 ${className}`}>
      {/* 1. Barra Superior del Workspace */}
      <div className="bg-surface-card p-3.5 sm:p-4 rounded-3xl border border-line shadow-xs space-y-2.5 sm:space-y-0">
        {/* Fila Principal de Navegación */}
        <div className="flex items-center justify-between gap-3">
          {/* Botón Volver y Título */}
          <div className="flex items-center gap-2.5 min-w-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onBackToHub}
              className="h-8.5 sm:h-9 px-2.5 sm:px-3 rounded-xl text-xs font-bold gap-1.5 cursor-pointer text-text-secondary hover:text-text-primary border-line shrink-0 active:scale-98"
              title="Volver al Panel General (Esc)"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Volver</span>
            </Button>

            {/* Migas de Pan (Visible en Tablet/Desktop) */}
            <nav aria-label="Migas de pan" className="hidden sm:flex items-center gap-1.5 text-xs font-bold shrink-0">
              <button
                type="button"
                onClick={onBackToHub}
                className="flex items-center gap-1 text-text-muted hover:text-text-primary transition-colors cursor-pointer"
              >
                <Home className="w-3.5 h-3.5" />
                <span>Panel Admin</span>
              </button>
              <ChevronRight className="w-3.5 h-3.5 text-text-muted" />
              <div className="flex items-center gap-1.5 text-text-primary font-black">
                <CategoryIcon className="w-3.5 h-3.5 text-accent" />
                <span>{categoryDef.title}</span>
              </div>
              {activeSubcategory && (
                <>
                  <ChevronRight className="w-3.5 h-3.5 text-text-muted" />
                  <Badge variant="outline" className="text-[10px] font-black bg-accent/10 text-accent border-accent/20">
                    {activeSubcategory.shortTitle}
                  </Badge>
                </>
              )}
            </nav>

            {/* Título Compacto en Móvil */}
            <div className="flex sm:hidden items-center gap-1.5 min-w-0">
              <CategoryIcon className="w-4 h-4 text-accent shrink-0" />
              <span className="text-xs font-black text-text-primary truncate">
                {categoryDef.shortTitle}
              </span>
              {activeSubcategory && (
                <span className="text-[10px] font-bold text-text-muted truncate">
                  · {activeSubcategory.shortTitle}
                </span>
              )}
            </div>
          </div>

          {/* Acciones de Cabecera */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* 🔍 Buscador Lupita Accesible */}
            <AdminSearchBar onSelect={(cat, tool) => onNavigateModule(cat, tool)} />

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleToggleCurrentPin}
              className={`h-8.5 sm:h-9 px-2 sm:px-2.5 rounded-xl text-xs font-bold gap-1.5 cursor-pointer border-line active:scale-98 ${
                isCurrentPinned
                  ? 'text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/20'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
              title={isCurrentPinned ? 'Desfijar de favoritos' : 'Fijar herramienta en favoritos'}
              aria-label={isCurrentPinned ? 'Desfijar de favoritos' : 'Fijar herramienta en favoritos'}
            >
              <Star
                className={`w-3.5 h-3.5 ${
                  isCurrentPinned ? 'fill-amber-500 text-amber-500' : 'text-text-muted'
                }`}
              />
              <span className="hidden md:inline">
                {isCurrentPinned ? 'Fijado' : 'Fijar ⭐'}
              </span>
            </Button>

            {onLockAdmin && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onLockAdmin}
                className="h-8.5 sm:h-9 px-2.5 sm:px-3 rounded-xl text-xs font-bold gap-1.5 cursor-pointer text-red-600 dark:text-red-400 border-red-500/20 bg-red-500/5 hover:bg-red-500/15 active:scale-98"
                title="Bloquear panel de administración"
              >
                <Lock className="w-3.5 h-3.5" />
                <span className="hidden lg:inline">Bloquear</span>
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Selector de Herramientas Horizontal en Móvil (Segmented Rail Accesible con LayoutId) */}
      <div
        role="tablist"
        aria-label={`Herramientas de ${categoryDef.title}`}
        className="flex md:hidden overflow-x-auto scrollbar-none gap-2 pb-1"
      >
        {categoryDef.subcategories.map((sub) => {
          const SubIcon = getAdminIcon(sub.iconName);
          const isSelected = activeToolId === sub.id;

          return (
            <button
              key={sub.id}
              type="button"
              role="tab"
              aria-selected={isSelected}
              aria-label={sub.title}
              onClick={() => setActiveToolId(sub.id)}
              className={`relative flex items-center gap-2 min-h-11 px-3.5 rounded-2xl border shrink-0 transition-all cursor-pointer select-none text-left active:scale-95 focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none ${
                isSelected
                  ? 'text-surface-card font-black border-text-primary'
                  : 'bg-surface-card border-line hover:border-accent/40 text-text-secondary hover:text-text-primary shadow-xs'
              }`}
            >
              {isSelected && (
                <motion.div
                  layoutId="activeWorkspaceToolMobile"
                  transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                  className="absolute inset-0 bg-text-primary rounded-2xl z-0 shadow-xs"
                />
              )}
              <SubIcon
                className={`w-4 h-4 relative z-10 ${isSelected ? 'text-accent' : 'text-text-muted'}`}
              />
              <span className="text-xs font-bold relative z-10">{sub.shortTitle}</span>
            </button>
          );
        })}
      </div>

      {/* 2. Layout Maestro-Detalle (Sidebar en Desktop + Lienzo Central) */}
      <div className="flex flex-col md:flex-row items-start gap-4 sm:gap-5">
        {/* Sidebar Lateral Izquierdo (Solo Desktop/Tablet) */}
        <aside className="hidden md:block w-64 lg:w-72 shrink-0 space-y-4">
          {/* Herramientas del Módulo Actual */}
          <div className="bg-surface-card rounded-3xl p-3.5 sm:p-4 border border-line shadow-xs space-y-2">
            <div className="px-2 py-1 flex items-center justify-between">
              <span className="text-[11px] font-black uppercase tracking-wider text-text-muted">
                Herramientas del Módulo
              </span>
              <span className="text-[10px] font-bold text-accent">
                {categoryDef.subcategories.length} opciones
              </span>
            </div>

            <div className="space-y-1" role="tablist" aria-label={`Herramientas de ${categoryDef.title}`}>
              {categoryDef.subcategories.map((sub) => {
                const SubIcon = getAdminIcon(sub.iconName);
                const isSelected = activeToolId === sub.id;

                return (
                  <button
                    key={sub.id}
                    type="button"
                    role="tab"
                    aria-selected={isSelected}
                    aria-label={sub.title}
                    onClick={() => setActiveToolId(sub.id)}
                    className={`relative w-full flex items-center justify-between gap-2.5 p-2.5 rounded-2xl text-left transition-all cursor-pointer select-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none ${
                      isSelected
                        ? 'text-surface-card font-black'
                        : 'bg-surface hover:bg-surface-raised border border-line/60 text-text-secondary hover:text-text-primary'
                    }`}
                  >
                    {isSelected && (
                      <motion.div
                        layoutId="activeWorkspaceToolDesktop"
                        transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                        className="absolute inset-0 bg-text-primary rounded-2xl z-0 shadow-xs"
                      />
                    )}
                    <div className="relative z-10 flex items-center gap-2.5 min-w-0">
                      <div
                        className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                          isSelected
                            ? 'bg-accent text-white'
                            : 'bg-surface-raised text-text-muted border border-line/60'
                        }`}
                      >
                        <SubIcon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs truncate leading-tight">
                          {sub.shortTitle}
                        </p>
                        <p
                          className={`text-[10px] truncate ${
                            isSelected ? 'text-surface-card/80' : 'text-text-muted'
                          }`}
                        >
                          {sub.tag}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Sección de Favoritos Rápidos en Sidebar (para saltar a otro módulo) */}
          {favorites.length > 0 && (
            <div className="bg-surface-card rounded-3xl p-3.5 sm:p-4 border border-line shadow-xs space-y-2">
              <div className="px-2 py-1 flex items-center justify-between">
                <span className="text-[11px] font-black uppercase tracking-wider text-text-muted flex items-center gap-1.5">
                  <Zap className="w-3 h-3 text-accent" />
                  <span>Favoritos Rápidos</span>
                </span>
              </div>

              <div className="space-y-1">
                {favorites.map((fav) => {
                  const FavIcon = getAdminIcon(fav.iconName);
                  const isCurrent =
                    fav.category === categoryDef.id &&
                    (!fav.toolId || fav.toolId === activeToolId);

                  return (
                    <button
                      key={fav.id}
                      type="button"
                      onClick={() => onNavigateModule(fav.category, fav.toolId)}
                      className={`w-full flex items-center justify-between gap-2 p-2 rounded-xl text-left transition-all cursor-pointer select-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none ${
                        isCurrent
                          ? 'bg-accent/10 text-accent font-bold ring-1 ring-accent/20'
                          : 'text-text-secondary hover:text-text-primary hover:bg-surface-raised'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <FavIcon className="w-3.5 h-3.5 shrink-0" />
                        <span className="text-xs font-bold truncate">
                          {fav.shortTitle}
                        </span>
                      </div>
                      <span className="text-[9px] font-mono text-text-muted px-1.5 py-0.5 rounded bg-surface-raised border border-line/60">
                        {fav.tag}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </aside>

        {/* Lienzo Principal Derecho (Ancho Total a Pantalla Completa) */}
        <main className="flex-1 min-w-0 w-full">
          <div className="min-h-[550px]">
            <Suspense fallback={<AdminPanelLoadingFallback />}>
              {category === 'menu' && (
                <MenuStockPanel activeToolId={activeToolId} onSelectTool={setActiveToolId} />
              )}
              {category === 'towers' && (
                <TowersAdminPanel activeToolId={activeToolId} onSelectTool={setActiveToolId} />
              )}
              {category === 'banners' && (
                <BannersAdminPanel activeToolId={activeToolId} onSelectTool={setActiveToolId} />
              )}
              {category === 'raffles' && (
                <RafflesAdminPanel activeToolId={activeToolId} onSelectTool={setActiveToolId} />
              )}
              {category === 'cashcut' && (
                <CashCutPanel activeToolId={activeToolId} onSelectTool={setActiveToolId} />
              )}
              {category === 'ingredients' && (
                <IngredientsAdminPanel activeToolId={activeToolId} onSelectTool={setActiveToolId} />
              )}
            </Suspense>
          </div>
        </main>
      </div>
    </div>
  );
}
