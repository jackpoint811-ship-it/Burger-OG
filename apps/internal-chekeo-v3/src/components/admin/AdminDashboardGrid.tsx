/**
 * AdminDashboardGrid.tsx — Chekeo V3
 *
 * Cuadrícula principal en 2 Columnas para el Panel de Control de Admin V3:
 * - 6 tarjetas de módulos enriquecidas con KPIs en tiempo real
 * - Badges de estado operativo
 * - Botones de acción primaria y secundaria directa
 * - Diseño adaptativo mobile-first y elevación limpia Premium Casual
 */

import React, { useMemo } from 'react';
import {
  UtensilsCrossed,
  Building2,
  Image as ImageIcon,
  Gift,
  Calculator,
  Wheat,
  ArrowRight,
  Plus,
  CheckCircle2,
  AlertTriangle,
  Clock,
  DollarSign,
  Layers,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import { Button } from '@ui/button';
import { Badge } from '@ui/badge';
import { getCdmxTodayString } from '@config/index';
import type { AdminActiveTab } from '../../features/admin/types/admin.types';
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
  onNavigate: (tab: AdminActiveTab) => void;
  className?: string;
}

export function AdminDashboardGrid({ onNavigate, className = '' }: AdminDashboardGridProps) {
  const todayStr = useMemo(() => getCdmxTodayString(), []);

  // Live queries from each administrative domain
  const { items: menuItems = [] } = useAdminMenu();
  const { towers = [] } = useAdminTowers();
  const { banners = [] } = useAdminBanners();
  const { activeCampaign, summary: raffleSummary } = useAdminRaffles();
  const { cashCutData, summaryData } = useAdminCashCut({ from: todayStr, to: todayStr });
  const { ingredients = [] } = useAdminIngredients('BURGER-OG');

  // Stats calculation
  const menuStats = useMemo(() => {
    const total = menuItems.length;
    const available = menuItems.filter(
      (i) => i.isAvailable && (!i.stockManaged || (i.stockRemaining ?? 0) > 0)
    ).length;
    const soldOut = total - available;
    const promos = menuItems.filter((i) => i.isPromoActive).length;
    return { total, available, soldOut, promos };
  }, [menuItems]);

  const activeTowersCount = useMemo(() => {
    return towers.filter((t) => t.isActive).length;
  }, [towers]);

  const activeBannersCount = useMemo(() => {
    return banners.filter((b) => b.isActive).length;
  }, [banners]);

  const cashTodayTotal = useMemo(() => {
    return cashCutData?.totalSalesPesos ?? (summaryData?.totals?.grossSales ?? 0);
  }, [cashCutData, summaryData]);

  const cashTodayOrders = useMemo(() => {
    return cashCutData?.totalOrders ?? (summaryData?.totals?.orders ?? 0);
  }, [cashCutData, summaryData]);

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-between px-1">
        <div>
          <h3 className="text-base sm:text-lg font-black text-text-primary">
            Módulos del Panel de Control
          </h3>
          <p className="text-xs text-text-secondary">
            Selecciona un área para gestionar productos, horarios, promociones, sorteos o corte financiero.
          </p>
        </div>
      </div>

      {/* Grilla en 2 Columnas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-5">
        {/* ─── 1. Menú, Precios & Stock Diario ───────────────────────────── */}
        <div className="bg-surface-card rounded-3xl p-5 sm:p-6 border border-line shadow-card hover:border-accent/40 transition-all flex flex-col justify-between space-y-4 group">
          <div className="space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="w-12 h-12 rounded-2xl bg-accent/10 text-accent flex items-center justify-center font-bold shrink-0 border border-accent/20">
                <UtensilsCrossed className="w-6 h-6" />
              </div>
              <div className="flex items-center gap-1.5 flex-wrap justify-end">
                <Badge variant="default" className="text-[10px] bg-accent font-black">
                  {menuStats.available} en vivo
                </Badge>
                {menuStats.soldOut > 0 && (
                  <Badge variant="destructive" className="text-[10px]">
                    {menuStats.soldOut} agotados
                  </Badge>
                )}
                {menuStats.promos > 0 && (
                  <Badge variant="secondary" className="text-[10px] text-amber-600 dark:text-amber-400 bg-amber-500/10">
                    {menuStats.promos} promos
                  </Badge>
                )}
              </div>
            </div>

            <div>
              <h4 className="text-base font-black text-text-primary group-hover:text-accent transition-colors flex items-center gap-2">
                <span>Menú, Precios & Stock Diario</span>
              </h4>
              <p className="text-xs text-text-secondary mt-1 leading-relaxed">
                Control de catálogo, precios en vivo, existencias por platillo, modificadores y optimización de imágenes en Cloudflare R2.
              </p>
            </div>

            {/* Mini KPI Breakdown */}
            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-line/60 text-[11px]">
              <div className="bg-surface-raised p-2 rounded-xl border border-line/60">
                <span className="text-text-muted block text-[10px]">Total</span>
                <span className="font-black text-text-primary">{menuStats.total} platillos</span>
              </div>
              <div className="bg-surface-raised p-2 rounded-xl border border-line/60">
                <span className="text-text-muted block text-[10px]">Disponibles</span>
                <span className="font-black text-accent">{menuStats.available}</span>
              </div>
              <div className="bg-surface-raised p-2 rounded-xl border border-line/60">
                <span className="text-text-muted block text-[10px]">Ofertas</span>
                <span className="font-black text-amber-500">{menuStats.promos}</span>
              </div>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-between gap-2">
            <Button
              type="button"
              onClick={() => onNavigate('menu')}
              className="flex-1 h-10 rounded-2xl font-bold text-xs bg-accent text-white hover:bg-accent-dark transition-all gap-1.5 cursor-pointer shadow-cta"
            >
              <span>Gestionar Catálogo</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* ─── 2. Torres & Horarios de Entrega ──────────────────────────── */}
        <div className="bg-surface-card rounded-3xl p-5 sm:p-6 border border-line shadow-card hover:border-blue-500/40 transition-all flex flex-col justify-between space-y-4 group">
          <div className="space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center font-bold shrink-0 border border-blue-500/20">
                <Building2 className="w-6 h-6" />
              </div>
              <div className="flex items-center gap-1.5 flex-wrap justify-end">
                <Badge variant="outline" className="text-[10px] text-blue-600 dark:text-blue-400 border-blue-500/30 bg-blue-500/10 font-bold">
                  {activeTowersCount} torres activas
                </Badge>
              </div>
            </div>

            <div>
              <h4 className="text-base font-black text-text-primary group-hover:text-blue-500 transition-colors flex items-center gap-2">
                <span>Torres & Horarios de Entrega</span>
              </h4>
              <p className="text-xs text-text-secondary mt-1 leading-relaxed">
                Control de ventanas de entrega, horario límite de recepción de pedidos y días operativos para Torre GGA y Torre Valcob.
              </p>
            </div>

            {/* Mini Desglose de Torres */}
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-line/60 text-[11px]">
              <div className="bg-surface-raised p-2 rounded-xl border border-line/60">
                <div className="flex items-center justify-between mb-0.5">
                  <span className="font-bold text-text-primary">Torre GGA</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                </div>
                <span className="text-[10px] text-text-muted">Entrega 1:30 PM • Corte 1:00 PM</span>
              </div>
              <div className="bg-surface-raised p-2 rounded-xl border border-line/60">
                <div className="flex items-center justify-between mb-0.5">
                  <span className="font-bold text-text-primary">Torre Valcob</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                </div>
                <span className="text-[10px] text-text-muted">Entrega 2:00 PM • Corte 1:30 PM</span>
              </div>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-between gap-2">
            <Button
              type="button"
              onClick={() => onNavigate('towers')}
              className="flex-1 h-10 rounded-2xl font-bold text-xs bg-blue-600 hover:bg-blue-700 text-white transition-all gap-1.5 cursor-pointer shadow-xs"
            >
              <span>Configurar Horarios</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* ─── 3. Banners Promocionales ─────────────────────────────────── */}
        <div className="bg-surface-card rounded-3xl p-5 sm:p-6 border border-line shadow-card hover:border-purple-500/40 transition-all flex flex-col justify-between space-y-4 group">
          <div className="space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-500 flex items-center justify-center font-bold shrink-0 border border-purple-500/20">
                <ImageIcon className="w-6 h-6" />
              </div>
              <div className="flex items-center gap-1.5 flex-wrap justify-end">
                <Badge variant="outline" className="text-[10px] text-purple-600 dark:text-purple-400 border-purple-500/30 bg-purple-500/10 font-bold">
                  {activeBannersCount} banners en carrusel
                </Badge>
              </div>
            </div>

            <div>
              <h4 className="text-base font-black text-text-primary group-hover:text-purple-500 transition-colors flex items-center gap-2">
                <span>Banners Promocionales</span>
              </h4>
              <p className="text-xs text-text-secondary mt-1 leading-relaxed">
                Administración del carrusel interactivo en la tienda pública con Live Preview WYSIWYG, gradientes temáticos y links directos.
              </p>
            </div>

            {/* Live Preview Snippet */}
            <div className="p-3 rounded-2xl bg-gradient-to-r from-emerald-800 to-emerald-600 text-white shadow-xs">
              <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-wider mb-1">
                <span className="bg-white/20 px-2 py-0.5 rounded-md">PROMO ACTIVA</span>
                <span>Carrusel Público</span>
              </div>
              <p className="text-xs font-black truncate">
                {banners[0]?.title || 'Combo Burger OG + Papas Gratis'}
              </p>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-between gap-2">
            <Button
              type="button"
              onClick={() => onNavigate('banners')}
              className="flex-1 h-10 rounded-2xl font-bold text-xs bg-purple-600 hover:bg-purple-700 text-white transition-all gap-1.5 cursor-pointer shadow-xs"
            >
              <span>Administrar Banners</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* ─── 4. Sorteos, Boletos & Referidos ──────────────────────────── */}
        <div className="bg-surface-card rounded-3xl p-5 sm:p-6 border border-line shadow-card hover:border-amber-500/40 transition-all flex flex-col justify-between space-y-4 group">
          <div className="space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center font-bold shrink-0 border border-amber-500/20">
                <Gift className="w-6 h-6" />
              </div>
              <div className="flex items-center gap-1.5 flex-wrap justify-end">
                <Badge variant="outline" className="text-[10px] text-amber-600 dark:text-amber-400 border-amber-500/30 bg-amber-500/10 font-bold">
                  {raffleSummary?.totalTickets ?? 0} boletos emitidos
                </Badge>
              </div>
            </div>

            <div>
              <h4 className="text-base font-black text-text-primary group-hover:text-amber-500 transition-colors flex items-center gap-2">
                <span>Sorteos, Boletos & Referidos</span>
              </h4>
              <p className="text-xs text-text-secondary mt-1 leading-relaxed">
                Gestión de boletos por compra y recomendaciones de invitados, códigos únicos de cliente y ruleta de selección de ganador.
              </p>
            </div>

            {/* Campaign Summary */}
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-line/60 text-[11px]">
              <div className="bg-surface-raised p-2 rounded-xl border border-line/60">
                <span className="text-text-muted block text-[10px]">Campaña</span>
                <span className="font-bold text-text-primary truncate block">
                  {activeCampaign?.title || 'Sorteo Activo'}
                </span>
              </div>
              <div className="bg-surface-raised p-2 rounded-xl border border-line/60">
                <span className="text-text-muted block text-[10px]">Participantes</span>
                <span className="font-bold text-accent">
                  {raffleSummary?.totalParticipants ?? 0} clientes
                </span>
              </div>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-between gap-2">
            <Button
              type="button"
              onClick={() => onNavigate('raffles')}
              className="flex-1 h-10 rounded-2xl font-bold text-xs bg-amber-600 hover:bg-amber-700 text-white transition-all gap-1.5 cursor-pointer shadow-xs"
            >
              <span>Ver Participantes & Ruleta</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* ─── 5. Corte de Caja & Arqueo Z ──────────────────────────────── */}
        <div className="bg-surface-card rounded-3xl p-5 sm:p-6 border border-line shadow-card hover:border-emerald-500/40 transition-all flex flex-col justify-between space-y-4 group">
          <div className="space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-bold shrink-0 border border-emerald-500/20">
                <Calculator className="w-6 h-6" />
              </div>
              <div className="flex items-center gap-1.5 flex-wrap justify-end">
                <Badge variant="outline" className="text-[10px] text-emerald-600 dark:text-emerald-400 border-emerald-500/30 bg-emerald-500/10 font-bold">
                  {formatCurrency(cashTodayTotal)} hoy CDMX
                </Badge>
              </div>
            </div>

            <div>
              <h4 className="text-base font-black text-text-primary group-hover:text-emerald-500 transition-colors flex items-center gap-2">
                <span>Corte de Caja & Arqueo Z</span>
              </h4>
              <p className="text-xs text-text-secondary mt-1 leading-relaxed">
                Conciliación financiera por método de pago (Transferencia vs Efectivo), reporte de turno, ticket promedio y exportación CSV.
              </p>
            </div>

            {/* Financial Mini Summary */}
            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-line/60 text-[11px]">
              <div className="bg-surface-raised p-2 rounded-xl border border-line/60">
                <span className="text-text-muted block text-[10px]">Venta Hoy</span>
                <span className="font-black text-emerald-600 dark:text-emerald-400">
                  {formatCurrency(cashTodayTotal)}
                </span>
              </div>
              <div className="bg-surface-raised p-2 rounded-xl border border-line/60">
                <span className="text-text-muted block text-[10px]">Órdenes</span>
                <span className="font-black text-text-primary">{cashTodayOrders}</span>
              </div>
              <div className="bg-surface-raised p-2 rounded-xl border border-line/60">
                <span className="text-text-muted block text-[10px]">Ticket Prom.</span>
                <span className="font-black text-text-primary">
                  {formatCurrency(cashTodayOrders > 0 ? cashTodayTotal / cashTodayOrders : 0)}
                </span>
              </div>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-between gap-2">
            <Button
              type="button"
              onClick={() => onNavigate('cashcut')}
              className="flex-1 h-10 rounded-2xl font-bold text-xs bg-emerald-600 hover:bg-emerald-700 text-white transition-all gap-1.5 cursor-pointer shadow-xs"
            >
              <span>Realizar Arqueo Z</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* ─── 6. Insumos, Costos & Recetas ─────────────────────────────── */}
        <div className="bg-surface-card rounded-3xl p-5 sm:p-6 border border-line shadow-card hover:border-orange-500/40 transition-all flex flex-col justify-between space-y-4 group">
          <div className="space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="w-12 h-12 rounded-2xl bg-orange-500/10 text-orange-500 flex items-center justify-center font-bold shrink-0 border border-orange-500/20">
                <Wheat className="w-6 h-6" />
              </div>
              <div className="flex items-center gap-1.5 flex-wrap justify-end">
                <Badge variant="outline" className="text-[10px] text-orange-600 dark:text-orange-400 border-orange-500/30 bg-orange-500/10 font-bold">
                  {ingredients.length} insumos D1
                </Badge>
              </div>
            </div>

            <div>
              <h4 className="text-base font-black text-text-primary group-hover:text-orange-500 transition-colors flex items-center gap-2">
                <span>Insumos, Costos & Recetas</span>
              </h4>
              <p className="text-xs text-text-secondary mt-1 leading-relaxed">
                Catálogo de ingredientes de Cloudflare D1, costeo unitario y configuración de recetas por hamburguesa para el Resumen K de Cocina.
              </p>
            </div>

            {/* Insumos Snapshot */}
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-line/60 text-[11px]">
              <div className="bg-surface-raised p-2 rounded-xl border border-line/60">
                <span className="text-text-muted block text-[10px]">Insumos Registrados</span>
                <span className="font-black text-text-primary">{ingredients.length} ingredientes</span>
              </div>
              <div className="bg-surface-raised p-2 rounded-xl border border-line/60">
                <span className="text-text-muted block text-[10px]">Sincronización</span>
                <span className="font-bold text-accent">Resumen K en Vivo</span>
              </div>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-between gap-2">
            <Button
              type="button"
              onClick={() => onNavigate('ingredients')}
              className="flex-1 h-10 rounded-2xl font-bold text-xs bg-orange-600 hover:bg-orange-700 text-white transition-all gap-1.5 cursor-pointer shadow-xs"
            >
              <span>Administrar Insumos & Recetas</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
