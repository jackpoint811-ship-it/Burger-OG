/**
 * AdminDashboardGrid.tsx — Chekeo V3
 *
 * Cuadrícula principal en 2 Columnas para el Panel de Control de Admin V3:
 * - 6 Categorías Maestras en diseño limpio, desaturado y espacioso
 * - Métricas operativas en vivo (D1 & Hono)
 * - Botón de pin ⭐ en cada categoría para fijar en favoritos
 * - Navegación directa al Submenú de cada categoría
 */

import React, { useMemo } from 'react';
import { ArrowRight, Star, ChevronRight } from 'lucide-react';
import { Button } from '@ui/button';
import { Badge } from '@ui/badge';
import { getCdmxTodayString } from '@config/index';
import type { AdminMasterCategory } from '../../features/admin/types/admin.types';
import { ADMIN_CATEGORIES_CONFIG } from '../../features/admin/constants/admin-navigation.constants';
import { useAdminPinnedFavorites } from '../../features/admin/hooks/use-admin-pinned-favorites';
import { getAdminIcon } from '../../features/admin/utils/admin-icons.utils';
import {
  useAdminMenu,
  useAdminTowers,
  useAdminBanners,
  useAdminRaffles,
  useAdminCashCut,
  useAdminIngredients,
} from '../../features/admin/hooks/use-admin';
import { formatCurrency } from '../../features/orders';

export interface AdminDashboardGridProps {
  onSelectCategory: (category: AdminMasterCategory) => void;
  onSelectTool: (category: AdminMasterCategory, toolId: string) => void;
  className?: string;
}

export function AdminDashboardGrid({
  onSelectCategory,
  onSelectTool,
  className = '',
}: AdminDashboardGridProps) {
  const todayStr = useMemo(() => getCdmxTodayString(), []);
  const { isPinned, togglePin } = useAdminPinnedFavorites();

  // Queries en vivo para métricas destacadas
  const { items: menuItems = [] } = useAdminMenu();
  const { towers = [] } = useAdminTowers();
  const { banners = [] } = useAdminBanners();
  const { activeCampaign, summary: raffleSummary } = useAdminRaffles();
  const { cashCutData, summaryData } = useAdminCashCut({ from: todayStr, to: todayStr });
  const { ingredients = [] } = useAdminIngredients('BURGER-OG');

  // Métrica única destacada por categoría
  const categoryMetrics = useMemo(() => {
    const totalMenu = menuItems.length;
    const availableMenu = menuItems.filter(
      (i) => i.isAvailable && (!i.stockManaged || (i.stockRemaining ?? 0) > 0)
    ).length;

    const activeTowers = towers.filter((t) => t.isActive).length;
    const activeBanners = banners.filter((b) => b.isActive).length;
    const totalTickets = raffleSummary?.totalTickets ?? 0;
    const todaySales = cashCutData?.totalSalesPesos ?? (summaryData?.totals?.grossSales ?? 0);

    return {
      menu: `${availableMenu} de ${totalMenu} platillos en vivo`,
      towers: `${activeTowers} edificios activos`,
      banners: `${activeBanners} banners en carrusel`,
      raffles: `${totalTickets} boletos emitidos`,
      cashcut: `${formatCurrency(todaySales)} venta hoy CDMX`,
      ingredients: `${ingredients.length} insumos en Cloudflare D1`,
    };
  }, [menuItems, towers, banners, raffleSummary, cashCutData, summaryData, ingredients]);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Grilla Estricta en 2 Columnas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
        {ADMIN_CATEGORIES_CONFIG.map((category) => {
          const Icon = getAdminIcon(category.iconName);
          const favoriteId = `fav-${category.id}-root`;
          const pinned = isPinned(favoriteId);
          const metricText = categoryMetrics[category.id];

          return (
            <div
              key={category.id}
              className="bg-surface-card rounded-3xl p-5 sm:p-6 border border-line shadow-card hover:border-accent/40 transition-all flex flex-col justify-between space-y-4 group"
            >
              <div className="space-y-3.5">
                {/* Cabecera de la Tarjeta */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold shrink-0 border ${category.colorClass}`}
                    >
                      <Icon className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-base font-black text-text-primary group-hover:text-accent transition-colors">
                        {category.title}
                      </h3>
                      <p className="text-xs text-text-secondary mt-0.5">
                        {category.subtitle}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      togglePin({
                        id: favoriteId,
                        title: category.title,
                        shortTitle: category.shortTitle,
                        category: category.id,
                        iconName: category.iconName,
                        tag: category.tag,
                      });
                    }}
                    className={`p-2 rounded-xl border transition-all cursor-pointer ${
                      pinned
                        ? 'bg-amber-500/10 border-amber-500/30 text-amber-500'
                        : 'bg-surface-raised border-line/60 text-text-muted hover:text-amber-500'
                    }`}
                    title={pinned ? 'Desfijar de favoritos' : 'Fijar categoría en favoritos'}
                    aria-label={`Fijar categoría ${category.title} en favoritos`}
                  >
                    <Star className={`w-4 h-4 ${pinned ? 'fill-amber-500' : ''}`} />
                  </button>
                </div>

                {/* Métrica Clave Única Destacada */}
                <div className="p-2.5 rounded-2xl bg-surface-raised border border-line/60 flex items-center justify-between">
                  <span className="text-[11px] font-bold text-text-muted uppercase tracking-wider">
                    Estado Operativo
                  </span>
                  <span className="text-xs font-black text-accent font-mono">
                    {metricText}
                  </span>
                </div>

                {/* Subcategorías / Herramientas Incluidas */}
                <div className="space-y-1.5 pt-1">
                  <span className="text-[10px] font-black uppercase tracking-wider text-text-muted">
                    Submenú & Herramientas:
                  </span>
                  <div className="grid grid-cols-2 gap-1.5">
                    {category.subcategories.map((sub) => {
                      const SubIcon = getAdminIcon(sub.iconName);
                      return (
                        <button
                          key={sub.id}
                          type="button"
                          onClick={() => onSelectTool(category.id, sub.id)}
                          className="flex items-center gap-1.5 p-2 rounded-xl bg-surface hover:bg-surface-raised/80 border border-line/60 text-left transition-colors cursor-pointer group/item"
                        >
                          <SubIcon className="w-3.5 h-3.5 text-text-muted group-hover/item:text-accent shrink-0" />
                          <span className="text-xs font-bold text-text-secondary group-hover/item:text-text-primary truncate">
                            {sub.shortTitle}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Botón Principal para entrar al Submenú */}
              <div className="pt-2">
                <Button
                  type="button"
                  onClick={() => onSelectCategory(category.id)}
                  className="w-full h-10 rounded-2xl font-bold text-xs bg-text-primary text-surface-card hover:bg-accent hover:text-white transition-all gap-1.5 cursor-pointer shadow-xs"
                >
                  <span>Entrar al Módulo ({category.subcategories.length} opciones)</span>
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
