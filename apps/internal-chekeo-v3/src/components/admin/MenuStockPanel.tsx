/**
 * MenuStockPanel.tsx — Chekeo V3
 *
 * Submódulo de Administración de Menú, Precios y Stock Diario.
 * Integrado con Dynamic UI Components (@ui/kpi-card, @ui/segmented-control, @ui/drawer, @ui/skeleton),
 * animaciones Framer Motion, acciones en lote y gestor de categorías en D1.
 */

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  UtensilsCrossed,
  Search,
  Plus,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
  CheckCircle2,
  XCircle,
  Sparkles,
  RefreshCw,
  Zap,
  FolderTree,
  RotateCcw,
  Check,
  Pause,
} from 'lucide-react';
import type { MenuItem } from '@config/index';
import { Button } from '@ui/button';
import { Badge } from '@ui/badge';
import { KpiCard } from '@ui/kpi-card';
import { SegmentedControl } from '@ui/segmented-control';
import { Skeleton } from '@ui/skeleton';
import { useAdminMenu } from '../../features/admin/hooks/use-admin';
import { ProductEditModal } from './ProductEditModal';
import { CategoryManagerModal } from './CategoryManagerModal';
import type { CreateMenuItemPayload, UpdateMenuItemPayload } from '../../features/admin/types/admin.types';

export interface MenuStockPanelProps {
  activeToolId?: string;
  onSelectTool?: (toolId: string) => void;
}

export function MenuStockPanel({ activeToolId = 'catalog', onSelectTool }: MenuStockPanelProps) {
  const {
    items,
    categories,
    isLoading,
    refetchMenu,
    createItemMutation,
    updateItemMutation,
    deleteItemMutation,
    toggleAvailabilityMutation,
    uploadImageMutation,
    deleteImageMutation,
    saveCategoriesMutation,
    deleteCategoryMutation,
  } = useAdminMenu();

  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [deletingSku, setDeletingSku] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [isBatchProcessing, setIsBatchProcessing] = useState(false);

  // Sincronizar activeToolId con estado interno
  React.useEffect(() => {
    if (activeToolId === 'create') {
      setSelectedItem(null);
      setIsEditModalOpen(true);
    } else if (activeToolId === 'promos') {
      setStatusFilter('promos');
    } else if (activeToolId === 'quick-stock') {
      setStatusFilter('stock-managed');
    }
  }, [activeToolId]);

  // Estadísticas y conteos en vivo
  const stats = useMemo(() => {
    const total = items.length;
    const available = items.filter((i) => i.isAvailable && (!i.stockManaged || (i.stockRemaining ?? 0) > 0)).length;
    const soldOut = total - available;
    const stockManagedCount = items.filter((i) => i.stockManaged).length;
    const promoCount = items.filter((i) => i.isPromoActive).length;
    const hiddenCount = items.filter((i) => i.isHidden).length;
    return { total, available, soldOut, stockManagedCount, promoCount, hiddenCount };
  }, [items]);

  // Filtrado reactivo de productos
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      // 1. Filtro por status
      if (statusFilter === 'available') {
        const isItemAvailable = item.isAvailable && (!item.stockManaged || (item.stockRemaining ?? 0) > 0);
        if (!isItemAvailable) return false;
      } else if (statusFilter === 'soldout') {
        const isItemAvailable = item.isAvailable && (!item.stockManaged || (item.stockRemaining ?? 0) > 0);
        if (isItemAvailable) return false;
      } else if (statusFilter === 'hidden') {
        if (!item.isHidden) return false;
      } else if (statusFilter === 'promos') {
        if (!item.isPromoActive) return false;
      } else if (statusFilter === 'stock-managed') {
        if (!item.stockManaged) return false;
      }

      // 2. Filtro por categoría seleccionada
      const matchCat = activeCategory === 'all' || item.category === activeCategory;

      // 3. Filtro por búsqueda
      const matchSearch =
        !searchQuery.trim() ||
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()));

      return matchCat && matchSearch;
    });
  }, [items, activeCategory, statusFilter, searchQuery]);

  const showToast = (msg: string) => {
    setNotice(msg);
    setTimeout(() => setNotice(null), 3500);
  };

  const handleOpenCreate = () => {
    setSelectedItem(null);
    setIsEditModalOpen(true);
  };

  const handleOpenEdit = (item: MenuItem) => {
    setSelectedItem(item);
    setIsEditModalOpen(true);
  };

  const handleSaveItem = async (
    sku: string,
    payload: CreateMenuItemPayload | UpdateMenuItemPayload,
    file?: File | null
  ) => {
    if (selectedItem) {
      await updateItemMutation.mutateAsync({ sku: selectedItem.sku, payload });
      if (file) {
        await uploadImageMutation.mutateAsync({ sku: selectedItem.sku, file });
      }
      showToast(`Platillo "${payload.name || sku}" actualizado correctamente.`);
    } else {
      await createItemMutation.mutateAsync(payload as CreateMenuItemPayload);
      if (file) {
        await uploadImageMutation.mutateAsync({ sku, file });
      }
      showToast(`Platillo "${payload.name || sku}" dado de alta con éxito.`);
    }
  };

  const handleToggleAvailability = async (item: MenuItem) => {
    const nextState = !item.isAvailable;
    try {
      await toggleAvailabilityMutation.mutateAsync({ sku: item.sku, isAvailable: nextState });
      showToast(`${item.name} marcado como ${nextState ? '🟢 DISPONIBLE' : '🔴 AGOTADO'}.`);
    } catch {
      // Handled
    }
  };

  const handleToggleHidden = async (item: MenuItem) => {
    const nextHidden = !item.isHidden;
    try {
      await updateItemMutation.mutateAsync({ sku: item.sku, payload: { isHidden: nextHidden } });
      showToast(`${item.name} ahora está ${nextHidden ? '👁️‍🗨️ OCULTO del menú' : '👁️ VISIBLE'}.`);
    } catch {
      // Handled
    }
  };

  const handleQuickStockChange = async (item: MenuItem, delta: number) => {
    if (!item.stockManaged) return;
    const current = item.stockRemaining ?? 0;
    const next = Math.max(0, current + delta);
    try {
      await updateItemMutation.mutateAsync({
        sku: item.sku,
        payload: {
          stockRemaining: next,
          isAvailable: next > 0 ? true : item.isAvailable,
        },
      });
    } catch {
      // Handled
    }
  };

  const handleDeleteItem = async (sku: string) => {
    try {
      await deleteItemMutation.mutateAsync(sku);
      setDeletingSku(null);
      showToast(`Platillo ${sku} eliminado permanentemente.`);
    } catch {
      // Handled
    }
  };

  // Acciones en Lote (Batch Operations)
  const handleBatchRestockAll = async () => {
    setIsBatchProcessing(true);
    try {
      const stockItems = items.filter((i) => i.stockManaged && i.stockLimit != null);
      for (const it of stockItems) {
        await updateItemMutation.mutateAsync({
          sku: it.sku,
          payload: {
            stockRemaining: it.stockLimit,
            isAvailable: true,
          },
        });
      }
      showToast(`✓ Se reabastecieron ${stockItems.length} platillos a su límite diario.`);
    } finally {
      setIsBatchProcessing(false);
    }
  };

  const handleBatchPauseSoldOut = async () => {
    setIsBatchProcessing(true);
    try {
      const zeroStockItems = items.filter((i) => i.isAvailable && i.stockManaged && (i.stockRemaining ?? 0) <= 0);
      for (const it of zeroStockItems) {
        await updateItemMutation.mutateAsync({
          sku: it.sku,
          payload: { isAvailable: false },
        });
      }
      showToast(`⏸️ Se pausaron ${zeroStockItems.length} platillos con stock agotado.`);
    } finally {
      setIsBatchProcessing(false);
    }
  };

  // Configuración de SegmentedControl para Filtros de Estado
  const statusFilterItems = [
    { id: 'all', label: 'Todos', count: stats.total },
    { id: 'available', label: 'En Vivo', count: stats.available },
    { id: 'soldout', label: 'Agotados', count: stats.soldOut },
    { id: 'promos', label: 'Ofertas', count: stats.promoCount },
    { id: 'hidden', label: 'Ocultos', count: stats.hiddenCount },
  ];

  return (
    <div className="space-y-5 animate-in fade-in duration-300">
      {/* Toast Flotante de Notificación */}
      <AnimatePresence>
        {notice && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-3.5 rounded-2xl bg-accent-soft border border-accent/20 text-accent text-xs font-black flex items-center justify-between shadow-sm"
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-accent" />
              <span>{notice}</span>
            </div>
            <button
              type="button"
              onClick={() => setNotice(null)}
              className="opacity-70 hover:opacity-100 cursor-pointer text-base leading-none"
            >
              ×
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 1. Tarjetas KPI Reactivas (@ui/kpi-card) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard
          title="Total Platillos"
          value={stats.total}
          subtitle={`${categories.length} categorías D1`}
          icon={<UtensilsCrossed className="w-4 h-4" />}
          variant="default"
          isActive={statusFilter === 'all'}
          onClick={() => setStatusFilter('all')}
        />
        <KpiCard
          title="En Vivo / Activos"
          value={stats.available}
          subtitle="Visibles en tienda"
          icon={<Check className="w-4 h-4" />}
          variant="accent"
          isActive={statusFilter === 'available'}
          onClick={() => setStatusFilter('available')}
        />
        <KpiCard
          title="Agotados"
          value={stats.soldOut}
          subtitle={`${stats.stockManagedCount} con stock controlado`}
          icon={<XCircle className="w-4 h-4" />}
          variant="warning"
          isActive={statusFilter === 'soldout'}
          onClick={() => setStatusFilter('soldout')}
        />
        <KpiCard
          title="En Promoción"
          value={stats.promoCount}
          subtitle="Con precio de oferta"
          icon={<Sparkles className="w-4 h-4" />}
          variant="info"
          isActive={statusFilter === 'promos'}
          onClick={() => setStatusFilter('promos')}
        />
      </div>

      {/* 2. Barra de Filtro de Estado con SegmentedControl */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-surface-card p-3.5 sm:p-4 rounded-3xl border border-line shadow-xs">
        <SegmentedControl
          items={statusFilterItems}
          value={statusFilter}
          onChange={setStatusFilter}
          layoutId="menu-status-segmented"
          size="sm"
          className="w-full sm:w-auto"
        />

        {/* Buscador & CTA de Creación */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-48">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              type="text"
              placeholder="Buscar por nombre o SKU..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl bg-surface-raised border border-line text-text-primary placeholder-text-muted outline-none focus:border-accent font-medium"
            />
          </div>

          <Button
            type="button"
            onClick={handleOpenCreate}
            className="text-xs font-bold bg-accent text-white shrink-0 px-3 h-8.5 rounded-xl cursor-pointer active:scale-95"
          >
            <Plus className="w-3.5 h-3.5 mr-1" />
            Nuevo
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={() => refetchMenu()}
            className="p-2 shrink-0 h-8.5 w-8.5 text-text-secondary hover:text-text-primary rounded-xl cursor-pointer"
            title="Refrescar catálogo"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* 3. Carrusel de Categorías con Gestor Integrado */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <button
          type="button"
          onClick={() => setActiveCategory('all')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer select-none active:scale-95 ${
            activeCategory === 'all'
              ? 'bg-text-primary text-surface-card shadow-xs font-black'
              : 'bg-surface-card border border-line text-text-secondary hover:text-text-primary'
          }`}
        >
          Todas ({items.length})
        </button>

        {categories.map((cat) => {
          const count = items.filter((i) => i.category === cat.key).length;
          const isCatActive = activeCategory === cat.key;

          return (
            <button
              key={cat.key}
              type="button"
              onClick={() => setActiveCategory(cat.key)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 cursor-pointer select-none active:scale-95 ${
                isCatActive
                  ? 'bg-text-primary text-surface-card shadow-xs font-black'
                  : 'bg-surface-card border border-line text-text-secondary hover:text-text-primary'
              }`}
            >
              {cat.emoji && <span>{cat.emoji}</span>}
              <span>{cat.name}</span>
              <span className="text-[10px] opacity-70 font-mono">({count})</span>
            </button>
          );
        })}

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setIsCategoryModalOpen(true)}
          className="h-8 px-2.5 rounded-xl text-xs font-bold border-dashed border-accent/40 text-accent hover:bg-accent/10 shrink-0 gap-1"
        >
          <FolderTree className="w-3.5 h-3.5" />
          <span>Gestionar Categorías</span>
        </Button>
      </div>

      {/* 4. Barra Rápida de Acciones en Lote (Batch Bar) */}
      <div className="p-3 sm:p-3.5 rounded-2xl bg-surface-card border border-line shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 text-xs">
        <div className="flex items-center gap-2 text-text-secondary">
          <Zap className="w-4 h-4 text-accent shrink-0" />
          <span className="font-bold">Acciones Rápidas del Turno:</span>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isBatchProcessing}
            onClick={handleBatchRestockAll}
            className="h-8 px-3 rounded-xl text-xs font-bold border-line text-text-secondary hover:text-text-primary active:scale-95"
          >
            <RotateCcw className="w-3 h-3 mr-1 text-accent" />
            Reabastecer al Límite
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isBatchProcessing}
            onClick={handleBatchPauseSoldOut}
            className="h-8 px-3 rounded-xl text-xs font-bold border-line text-destructive hover:bg-destructive/10 active:scale-95"
          >
            <Pause className="w-3 h-3 mr-1 text-destructive" />
            Pausar Agotados
          </Button>
        </div>
      </div>

      {/* 5. Grid de Productos con Animación */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {[1, 2, 3, 4, 5, 6].map((idx) => (
            <div key={idx} className="h-44 rounded-3xl bg-surface-card border border-line p-4 space-y-3">
              <div className="flex items-center gap-3">
                <Skeleton className="w-14 h-14 rounded-2xl" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-32 rounded" />
                  <Skeleton className="h-3 w-48 rounded" />
                </div>
              </div>
              <Skeleton className="h-8 w-full rounded-xl" />
              <Skeleton className="h-8 w-full rounded-xl" />
            </div>
          ))}
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="p-8 sm:p-12 rounded-3xl bg-surface-card border border-line text-center space-y-3">
          <UtensilsCrossed className="w-10 h-10 text-text-muted mx-auto" />
          <h3 className="text-sm font-bold text-text-primary">
            No se encontraron platillos con los filtros seleccionados
          </h3>
          <p className="text-xs text-text-secondary max-w-md mx-auto">
            Ajusta los filtros de estado o categoría, o crea un nuevo platillo en este catálogo.
          </p>
          <Button
            type="button"
            onClick={handleOpenCreate}
            className="text-xs bg-accent text-white font-bold cursor-pointer rounded-xl px-4"
          >
            <Plus className="w-4 h-4 mr-1" />
            Crear Nuevo Platillo
          </Button>
        </div>
      ) : (
        <motion.div
          layout
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4"
        >
          <AnimatePresence>
            {filteredItems.map((item) => {
              const isItemAvailable = item.isAvailable && (!item.stockManaged || (item.stockRemaining ?? 0) > 0);
              const imageUrl = item.imageUrl || (item.imageKey ? `/api/assets-v2/${encodeURIComponent(item.imageKey)}` : null);

              return (
                <motion.div
                  key={item.sku}
                  layout
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={{ duration: 0.2 }}
                  className={`bg-surface-card rounded-2xl sm:rounded-3xl border p-4 sm:p-5 shadow-card flex flex-col justify-between transition-all space-y-3 sm:space-y-4 ${
                    !isItemAvailable ? 'border-destructive/30 bg-destructive/5' : 'border-line hover:border-accent/40'
                  }`}
                >
                  {/* Header de la Tarjeta */}
                  <div className="space-y-2.5 sm:space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      {/* Thumbnail */}
                      <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-surface-raised border border-line flex items-center justify-center overflow-hidden shrink-0 shadow-xs">
                        {imageUrl ? (
                          <img src={imageUrl} alt={item.name} className="w-full h-full object-cover" />
                        ) : (
                          <UtensilsCrossed className="w-6 h-6 text-text-muted" />
                        )}
                      </div>

                      {/* Metadata & Status */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap mb-1">
                          <Badge variant="secondary" className="text-[10px] font-bold">
                            {item.category}
                          </Badge>
                          {item.badge && (
                            <Badge variant="default" className="text-[10px] bg-accent font-black">
                              {item.badge}
                            </Badge>
                          )}
                          {item.isHidden && (
                            <Badge variant="outline" className="text-[10px] text-amber-500 border-amber-500/30">
                              Oculto
                            </Badge>
                          )}
                        </div>

                        <h4 className="text-sm sm:text-base font-black text-text-primary truncate" title={item.name}>
                          {item.name}
                        </h4>
                        {item.description && (
                          <p className="text-[11px] text-text-secondary line-clamp-1 mt-0.5">
                            {item.description}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Precios & Promo */}
                    <div className="flex items-baseline gap-2 pt-1 border-t border-line">
                      <span className="text-base font-extrabold text-text-primary font-mono tabular-nums">
                        ${(item.isPromoActive && item.promoPrice != null ? item.promoPrice : item.price).toFixed(2)}{' '}
                        <span className="text-[10px] font-normal text-text-secondary">MXN</span>
                      </span>
                      {item.isPromoActive && item.promoPrice != null && (
                        <span className="text-xs text-text-muted line-through font-mono tabular-nums">
                          ${item.price.toFixed(2)}
                        </span>
                      )}
                      {item.isPromoActive && item.promoLabel && (
                        <span className="text-[10px] font-bold text-accent bg-accent-soft px-1.5 py-0.5 rounded-md">
                          {item.promoLabel}
                        </span>
                      )}
                    </div>

                    {/* Stock Management Bar */}
                    {item.stockManaged && (
                      <div className="p-2.5 rounded-2xl bg-surface-raised border border-line flex items-center justify-between gap-2">
                        <div className="text-[11px] min-w-0">
                          <span className="font-semibold text-text-secondary">Stock: </span>
                          <span
                            className={`font-black font-mono tabular-nums ${
                              (item.stockRemaining ?? 0) <= 5 ? 'text-destructive' : 'text-accent'
                            }`}
                          >
                            {item.stockRemaining ?? 0}
                          </span>
                          <span className="text-text-muted font-mono tabular-nums"> / {item.stockLimit ?? '—'}</span>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleQuickStockChange(item, -1)}
                            disabled={(item.stockRemaining ?? 0) <= 0}
                            className="w-8 h-8 rounded-xl bg-surface-card border border-line font-black text-xs flex items-center justify-center hover:bg-surface-raised disabled:opacity-30 cursor-pointer active:scale-90 shadow-xs"
                            aria-label={`Restar stock a ${item.name}`}
                          >
                            -
                          </button>
                          <button
                            type="button"
                            onClick={() => handleQuickStockChange(item, 1)}
                            className="w-8 h-8 rounded-xl bg-surface-card border border-line font-black text-xs flex items-center justify-center hover:bg-surface-raised cursor-pointer active:scale-90 shadow-xs"
                            aria-label={`Sumar stock a ${item.name}`}
                          >
                            +
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Acciones Rápidas */}
                  <div className="pt-2 border-t border-line space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      {/* Toggle En Vivo / Agotado */}
                      <Button
                        type="button"
                        variant={isItemAvailable ? 'secondary' : 'outline'}
                        onClick={() => handleToggleAvailability(item)}
                        className={`text-xs font-bold flex-1 min-h-[38px] rounded-xl justify-center cursor-pointer active:scale-95 ${
                          isItemAvailable ? 'text-accent border-accent/30' : 'text-destructive border-destructive/30'
                        }`}
                      >
                        {isItemAvailable ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-accent" />
                            En Vivo
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3.5 h-3.5 mr-1 text-destructive" />
                            Agotado
                          </>
                        )}
                      </Button>

                      {/* Toggle Ocultar */}
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => handleToggleHidden(item)}
                        className="text-xs min-h-[38px] px-2.5 rounded-xl text-text-secondary hover:text-text-primary cursor-pointer active:scale-95"
                        title={item.isHidden ? 'Mostrar en catálogo' : 'Ocultar del catálogo'}
                        aria-label={item.isHidden ? 'Mostrar en catálogo' : 'Ocultar del catálogo'}
                      >
                        {item.isHidden ? <EyeOff className="w-3.5 h-3.5 text-amber-500" /> : <Eye className="w-3.5 h-3.5" />}
                      </Button>

                      {/* Editar */}
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => handleOpenEdit(item)}
                        className="text-xs min-h-[38px] px-3 rounded-xl font-bold cursor-pointer active:scale-95"
                      >
                        <Edit2 className="w-3.5 h-3.5 mr-1" />
                        Editar
                      </Button>

                      {/* Eliminar */}
                      {deletingSku === item.sku ? (
                        <div className="flex items-center gap-1">
                          <Button
                            type="button"
                            variant="destructive"
                            onClick={() => handleDeleteItem(item.sku)}
                            className="text-[10px] min-h-[38px] px-2 rounded-xl font-bold cursor-pointer"
                          >
                            Sí
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setDeletingSku(null)}
                            className="text-[10px] min-h-[38px] px-2 rounded-xl cursor-pointer"
                          >
                            No
                          </Button>
                        </div>
                      ) : (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setDeletingSku(item.sku)}
                          className="text-xs min-h-[38px] px-2.5 rounded-xl text-destructive hover:bg-destructive/10 cursor-pointer active:scale-95"
                          title="Eliminar producto"
                          aria-label={`Eliminar ${item.name}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Drawer de Edición/Creación de Producto */}
      <ProductEditModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        item={selectedItem}
        categories={categories}
        allItems={items}
        onSave={handleSaveItem}
        onDeleteImage={deleteImageMutation.mutateAsync}
        isSaving={createItemMutation.isPending || updateItemMutation.isPending || uploadImageMutation.isPending}
      />

      {/* Drawer de Gestión de Categorías */}
      <CategoryManagerModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        categories={categories}
        items={items}
        onSaveCategories={saveCategoriesMutation.mutateAsync}
        onDeleteCategory={deleteCategoryMutation.mutateAsync}
        isSaving={saveCategoriesMutation.isPending || deleteCategoryMutation.isPending}
      />
    </div>
  );
}
