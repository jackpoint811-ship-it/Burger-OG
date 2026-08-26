/**
 * AdminBreadcrumbs.tsx — Chekeo V3
 *
 * Componente de navegación jerárquica y migas de pan para el Panel de Control de Admin:
 * - Accesibilidad semántica con <nav> y <ol> / <li>
 * - Acceso directo a la raíz del Panel de Control
 * - Botón destacado '← Volver al Panel' cuando se está dentro de un submódulo
 * - Botón rápido '🔒 Bloquear Admin' para cerrar sesión administrativa
 */

import React from 'react';
import {
  Home,
  ChevronRight,
  ArrowLeft,
  UtensilsCrossed,
  Building2,
  Image as ImageIcon,
  Gift,
  Calculator,
  Wheat,
  Lock,
  LayoutGrid,
} from 'lucide-react';
import { Button } from '@ui/button';
import type { AdminActiveTab } from '../../features/admin/types/admin.types';

export interface AdminBreadcrumbsProps {
  activeTab: AdminActiveTab;
  onNavigate: (tab: AdminActiveTab) => void;
  onLockAdmin?: () => void;
  className?: string;
}

const TAB_METADATA: Record<
  Exclude<AdminActiveTab, 'overview'>,
  { label: string; icon: React.ComponentType<{ className?: string }> }
> = {
  menu: { label: 'Menú & Stock', icon: UtensilsCrossed },
  towers: { label: 'Torres & Horarios', icon: Building2 },
  banners: { label: 'Banners Promocionales', icon: ImageIcon },
  raffles: { label: 'Sorteos & Boletos', icon: Gift },
  cashcut: { label: 'Corte de Caja (Corte Z)', icon: Calculator },
  ingredients: { label: 'Insumos & Recetas', icon: Wheat },
};

export function AdminBreadcrumbs({
  activeTab,
  onNavigate,
  onLockAdmin,
  className = '',
}: AdminBreadcrumbsProps) {
  const isOverview = activeTab === 'overview';
  const currentMeta = !isOverview ? TAB_METADATA[activeTab] : null;
  const ActiveIcon = currentMeta?.icon;

  return (
    <nav
      aria-label="Migas de pan de administración"
      className={`flex items-center justify-between gap-3 bg-surface-card p-3.5 sm:p-4 rounded-3xl border border-line shadow-xs transition-all ${className}`}
    >
      {/* Ruta Jerárquica */}
      <ol className="flex items-center gap-2 text-xs font-bold text-text-secondary overflow-x-auto scrollbar-none py-0.5">
        <li>
          <button
            type="button"
            onClick={() => onNavigate('overview')}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl transition-all cursor-pointer select-none ${
              isOverview
                ? 'bg-surface-raised text-accent font-black ring-1 ring-accent/30'
                : 'text-text-secondary hover:text-text-primary hover:bg-surface-raised'
            }`}
            aria-current={isOverview ? 'page' : undefined}
          >
            <Home className="w-3.5 h-3.5 text-accent shrink-0" />
            <span>Panel Admin</span>
          </button>
        </li>

        {!isOverview && currentMeta && ActiveIcon && (
          <>
            <li aria-hidden="true" className="text-text-muted">
              <ChevronRight className="w-3.5 h-3.5" />
            </li>
            <li>
              <span
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-accent/10 text-accent font-black text-xs ring-1 ring-accent/20"
                aria-current="page"
              >
                <ActiveIcon className="w-3.5 h-3.5 shrink-0" />
                <span>{currentMeta.label}</span>
              </span>
            </li>
          </>
        )}
      </ol>

      {/* Acciones Rápidas */}
      <div className="flex items-center gap-2 shrink-0">
        {!isOverview && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onNavigate('overview')}
            className="h-8.5 px-3 rounded-xl text-xs font-bold gap-1.5 cursor-pointer text-text-secondary hover:text-text-primary border-line"
            title="Regresar a la cuadrícula principal de módulos"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Volver al Panel</span>
          </Button>
        )}

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
            <span className="hidden md:inline">Bloquear Admin</span>
          </Button>
        )}
      </div>
    </nav>
  );
}
