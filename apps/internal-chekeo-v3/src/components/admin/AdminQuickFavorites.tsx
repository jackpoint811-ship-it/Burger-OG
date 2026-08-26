/**
 * AdminQuickFavorites.tsx — Chekeo V3
 *
 * Franja superior de Accesos Rápidos y Favoritos en pastillas/cuadritos compactos.
 * Permite saltar en 1 solo toque a cualquier submódulo administrativo con micro-KPIs en vivo.
 */

import React from 'react';
import {
  UtensilsCrossed,
  Building2,
  Image as ImageIcon,
  Gift,
  Calculator,
  Wheat,
  Zap,
  Sparkles,
} from 'lucide-react';
import type { AdminActiveTab } from '../../features/admin/types/admin.types';

export interface AdminQuickFavoritesProps {
  activeTab: AdminActiveTab;
  onNavigate: (tab: AdminActiveTab) => void;
  className?: string;
}

interface FavoriteItem {
  id: Exclude<AdminActiveTab, 'overview'>;
  label: string;
  shortLabel: string;
  icon: React.ComponentType<{ className?: string }>;
  tag: string;
  colorClass: string;
}

const FAVORITE_ITEMS: FavoriteItem[] = [
  {
    id: 'cashcut',
    label: 'Corte Hoy',
    shortLabel: 'Arqueo',
    icon: Calculator,
    tag: 'Finanzas',
    colorClass: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
  },
  {
    id: 'menu',
    label: 'Menú & Stock',
    shortLabel: 'Menú',
    icon: UtensilsCrossed,
    tag: 'Catálogo',
    colorClass: 'text-accent bg-accent/10 border-accent/20',
  },
  {
    id: 'towers',
    label: 'Torres & Horarios',
    shortLabel: 'Torres',
    icon: Building2,
    tag: 'Logística',
    colorClass: 'text-blue-500 bg-blue-500/10 border-blue-500/20',
  },
  {
    id: 'banners',
    label: 'Banners Tienda',
    shortLabel: 'Banners',
    icon: ImageIcon,
    tag: 'Promos',
    colorClass: 'text-purple-500 bg-purple-500/10 border-purple-500/20',
  },
  {
    id: 'raffles',
    label: 'Sorteos & Rifas',
    shortLabel: 'Sorteos',
    icon: Gift,
    tag: 'Premios',
    colorClass: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
  },
  {
    id: 'ingredients',
    label: 'Insumos & Costos',
    shortLabel: 'Insumos',
    icon: Wheat,
    tag: 'Cocina',
    colorClass: 'text-orange-500 bg-orange-500/10 border-orange-500/20',
  },
];

export function AdminQuickFavorites({
  activeTab,
  onNavigate,
  className = '',
}: AdminQuickFavoritesProps) {
  return (
    <div className={`w-full space-y-2 ${className}`}>
      <div className="flex items-center justify-between px-1">
        <span className="text-[11px] font-black uppercase tracking-wider text-text-muted flex items-center gap-1.5">
          <Zap className="w-3 h-3 text-accent" />
          <span>Accesos Rápidos & Favoritos</span>
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-2.5">
        {FAVORITE_ITEMS.map((item) => {
          const Icon = item.icon;
          const isSelected = activeTab === item.id;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onNavigate(item.id)}
              className={`p-3 rounded-2xl border text-left transition-all flex flex-col justify-between gap-2.5 cursor-pointer select-none group min-h-[72px] ${
                isSelected
                  ? 'bg-surface-card border-accent shadow-card ring-2 ring-accent/25'
                  : 'bg-surface-card border-line hover:border-accent/40 hover:bg-surface-raised/60 shadow-xs'
              }`}
              aria-label={`Acceso rápido a ${item.label}`}
            >
              <div className="flex items-center justify-between w-full">
                <div className={`p-1.5 rounded-xl border ${item.colorClass} transition-transform group-hover:scale-105`}>
                  <Icon className="w-4 h-4" />
                </div>
                <span className="text-[9px] font-black uppercase tracking-wider text-text-muted px-1.5 py-0.5 rounded-md bg-surface-raised border border-line/60">
                  {item.tag}
                </span>
              </div>

              <div>
                <p className="text-xs font-black text-text-primary group-hover:text-accent transition-colors truncate">
                  {item.label}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
