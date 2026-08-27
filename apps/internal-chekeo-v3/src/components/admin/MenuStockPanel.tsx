/**
 * MenuStockPanel.tsx — PR-V3-12
 *
 * Submódulo de Administración de Menú, Precios y Stock Diario.
 * Permite activar/desactivar productos en vivo, controlar existencias, modificar precios y promociones.
 */

import React, { useState, useMemo } from 'react';
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
  AlertTriangle,
  Flame,
  Layers,
  Sparkles,
  RefreshCw,
  SlidersHorizontal,
  Zap,
} from 'lucide-react';
import type { MenuItem } from '@config/index';
import { Button } from '@ui/button';
import { Badge } from '@ui/badge';
import { Card } from '@ui/card';
import { useAdminMenu } from '../../features/admin/hooks/use-admin';
import { ProductEditModal } from './ProductEditModal';
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
    isError,
    error,
    refetchMenu,
    createItemMutation,
    updateItemMutation,
    deleteItemMutation,
    toggleAvailabilityMutation,
    uploadImageMutation,
    deleteImageMutation,
  } = useAdminMenu();

  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deletingSku, setDeletingSku] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  // Auto-open modal if activeToolId is 'create'
  React.useEffect(() => {
    if (activeToolId === 'create') {
      setSelectedItem(null);
      setIsModalOpen(true);
    }
  }, [activeToolId]);

  // Filter items based on activeToolId, activeCategory and search
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      // Si el tool activo es 'promos', filtrar solo productos con oferta activa
      if (activeToolId === 'promos' && !item.isPromoActive) {
        return false;
      }

      // Filtro por categoría seleccionada
      const matchCat = activeCategory === 'all' || item.category === activeCategory;
      const matchSearch =
        !searchQuery.trim() ||
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.sku.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [items, activeCategory, searchQuery, activeToolId]);

  // Summary counts
  const stats = useMemo(() => {
    const total = items.length;
    const available = items.filter((i) => i.isAvailable && (!i.stockManaged || (i.stockRemaining ?? 0) > 0)).length;
    const soldOut = total - available;
    const stockManagedCount = items.filter((i) => i.stockManaged).length;
    const promoCount = items.filter((i) => i.isPromoActive).length;
    return { total, available, soldOut, stockManagedCount, promoCount };
  }, [items]);

  const handleOpenCreate = () => {
    setSelectedItem(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: MenuItem) => {
    setSelectedItem(item);
    setIsModalOpen(true);
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
      setNotice(`Producto ${payload.name || sku} actualizado correctamente.`);
    } else {
      await createItemMutation.mutateAsync(payload as CreateMenuItemPayload);
      if (file) {
        await uploadImageMutation.mutateAsync({ sku, file });
      }
      setNotice(`Producto ${payload.name || sku} creado con éxito.`);
    }
    setTimeout(() => setNotice(null), 3500);
  };

  const handleToggleAvailability = async (item: MenuItem) => {
    const nextState = !item.isAvailable;
    try {
      await toggleAvailabilityMutation.mutateAsync({ sku: item.sku, isAvailable: nextState });
      setNotice(`${item.name} marcado como ${nextState ? '✓ DISPONIBLE' : '✕ AGOTADO'}.`);
      setTimeout(() => setNotice(null), 2500);
    } catch {
      // Error handled by mutation
    }
  };

  const handleToggleHidden = async (item: MenuItem) => {
    const nextHidden = !item.isHidden;
    try {
      await updateItemMutation.mutateAsync({ sku: item.sku, payload: { isHidden: nextHidden } });
      setNotice(`${item.name} ahora está ${nextHidden ? '👁️‍🗨️ OCULTO del catálogo' : '👁️ VISIBLE'}.`);
      setTimeout(() => setNotice(null), 2500);
    } catch {
      // Error handled
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
      // Error
    }
  };

  const handleDeleteItem = async (sku: string) => {
    try {
      await deleteItemMutation.mutateAsync(sku);
      setDeletingSku(null);
      setNotice(`Producto ${sku} eliminado permanentemente.`);
      setTimeout(() => setNotice(null), 3000);
    } catch {
      // Error
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Banner Notice */}
      {notice && (
        <div className="p-3 rounded-2xl bg-accent-soft border border-accent/20 text-accent text-xs font-bold flex items-center justify-between animate-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>{notice}</span>
          </div>
          <button onClick={() => setNotice(null)} className="opacity-70 hover:opacity-100">
            ×
          </button>
        </div>
      )}

      {/* Sub-tool Info Banners */}
      {activeToolId === 'quick-stock' && (
        <div className="p-3.5 sm:p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 min-w-0">
            <Zap className="w-4 h-4 text-amber-500 shrink-0" />
            <span className="font-bold shrink-0">Control de Stock:</span>
            <span className="text-text-secondary truncate">
              Pausa o activa platillos y ajusta existencias del turno en 1 toque.
            </span>
          </div>
          {onSelectTool && (
            <button
              type="button"
              onClick={() => onSelectTool('catalog')}
              className="text-accent underline font-bold cursor-pointer shrink-0 text-xs"
            >
              Ver catálogo
            </button>
          )}
        </div>
      )}

      {activeToolId === 'promos' && (
        <div className="p-3.5 sm:p-4 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-800 dark:text-purple-300 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 min-w-0">
            <Sparkles className="w-4 h-4 text-purple-500 shrink-0" />
            <span className="font-bold shrink-0">Promociones Activas:</span>
            <span className="text-text-secondary truncate">
              Mostrando platillos con oferta y precio promocional activo.
            </span>
          </div>
          {onSelectTool && (
            <button
              type="button"
              onClick={() => onSelectTool('catalog')}
              className="text-accent underline font-bold cursor-pointer shrink-0 text-xs"
            >
              Ver catálogo
            </button>
          )}
        </div>
      )}

      {/* KPI Summary Bar en Móvil (1 sola línea limpia, ahorra 250px verticales) */}
      <div className="flex sm:hidden items-center justify-between gap-2 p-3 rounded-2xl bg-surface-card border border-line shadow-xs text-xs font-bold">
        <div className="flex items-center gap-1.5 text-text-primary">
          <UtensilsCrossed className="w-3.5 h-3.5 text-text-muted" />
          <span>{stats.total}</span>
          <span className="text-[10px] text-text-muted font-normal">platillos</span>
        </div>
        <div className="w-px h-3.5 bg-line" />
        <div className="flex items-center gap-1.5 text-accent">
          <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
          <span>{stats.available}</span>
          <span className="text-[10px] font-normal">activos</span>
        </div>
        <div className="w-px h-3.5 bg-line" />
        <div className="flex items-center gap-1.5 text-destructive">
          <span>{stats.soldOut}</span>
          <span className="text-[10px] font-normal">agotados</span>
        </div>
        {stats.promoCount > 0 && (
          <>
            <div className="w-px h-3.5 bg-line" />
            <div className="flex items-center gap-1 text-amber-500">
              <span>{stats.promoCount}</span>
              <span className="text-[10px] font-normal">ofertas</span>
            </div>
          </>
        )}
      </div>

      {/* KPI Header Bar en Tablet / Desktop */}
      <div className="hidden sm:grid sm:grid-cols-5 gap-3">
        <div className="p-4 rounded-3xl bg-surface-card border border-line shadow-xs space-y-1">
          <span className="text-[11px] font-semibold text-text-secondary">Total Platillos</span>
          <p className="text-xl font-bold text-text-primary">{stats.total}</p>
        </div>

        <div className="p-4 rounded-3xl bg-surface-card border border-line shadow-xs space-y-1">
          <span className="text-[11px] font-semibold text-accent">En Vivo / Activos</span>
          <p className="text-xl font-bold text-accent">{stats.available}</p>
        </div>

        <div className="p-4 rounded-3xl bg-surface-card border border-line shadow-xs space-y-1">
          <span className="text-[11px] font-semibold text-destructive">Agotados</span>
          <p className="text-xl font-bold text-destructive">{stats.soldOut}</p>
        </div>

        <div className="p-4 rounded-3xl bg-surface-card border border-line shadow-xs space-y-1">
          <span className="text-[11px] font-semibold text-text-secondary">Stock Controlado</span>
          <p className="text-xl font-bold text-text-primary">{stats.stockManagedCount}</p>
        </div>

        <div className="p-4 rounded-3xl bg-surface-card border border-line shadow-xs space-y-1">
          <span className="text-[11px] font-semibold text-amber-500">Con Oferta Activa</span>
          <p className="text-xl font-bold text-amber-500">{stats.promoCount}</p>
        </div>
      </div>

      {/* Control Bar: Categorías, Buscador y Botón Crear */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 sm:gap-4 bg-surface-card p-3.5 sm:p-4 rounded-3xl border border-line shadow-xs">
        {/* Categorías */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          <button
            type="button"
            onClick={() => setActiveCategory('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
              activeCategory === 'all'
                ? 'bg-text-primary text-surface-card shadow-xs font-black'
                : 'bg-surface-raised text-text-secondary hover:text-text-primary'
            }`}
          >
            Todos ({items.length})
          </button>
          {categories.map((cat) => {
            const count = items.filter((i) => i.category === cat.key).length;
            const isCatActive = activeCategory === cat.key;
            return (
              <button
                key={cat.key}
                type="button"
                onClick={() => setActiveCategory(cat.key)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 cursor-pointer ${
                  isCatActive
                    ? 'bg-text-primary text-surface-card shadow-xs font-black'
                    : 'bg-surface-raised text-text-secondary hover:text-text-primary'
                }`}
              >
                {cat.emoji && <span>{cat.emoji}</span>}
                <span>{cat.name}</span>
                <span className="text-[10px] opacity-70 font-mono">({count})</span>
              </button>
            );
          })}
        </div>

        {/* Buscador & CTA */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1 md:w-56">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              type="text"
              placeholder="Buscar platillo..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-2 text-xs rounded-xl bg-surface-raised border border-line text-text-primary placeholder-text-muted outline-none focus:border-accent"
            />
          </div>

          <Button
            type="button"
            onClick={handleOpenCreate}
            className="text-xs font-bold bg-accent text-white shrink-0 px-3 h-9 rounded-xl cursor-pointer"
          >
            <Plus className="w-4 h-4 mr-1" />
            Nuevo
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={() => refetchMenu()}
            className="p-2 shrink-0 h-9 w-9 text-text-secondary hover:text-text-primary rounded-xl cursor-pointer"
            title="Refrescar catálogo"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* Grid de Productos */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {[1, 2, 3, 4, 5, 6].map((idx) => (
            <div key={idx} className="h-44 rounded-3xl bg-surface-card border border-line animate-pulse p-4 space-y-3" />
          ))}
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="p-8 sm:p-12 rounded-3xl bg-surface-card border border-line text-center space-y-3">
          <UtensilsCrossed className="w-10 h-10 text-text-muted mx-auto" />
          <h3 className="text-sm font-bold text-text-primary">
            {activeToolId === 'promos' ? 'No hay platillos en promoción' : 'No se encontraron platillos'}
          </h3>
          <p className="text-xs text-text-secondary">
            {activeToolId === 'promos'
              ? 'Edita un platillo para asignarle un precio de oferta y activarlo.'
              : 'Ajusta los filtros o crea un nuevo producto en este catálogo.'}
          </p>
          <Button type="button" onClick={handleOpenCreate} className="text-xs bg-accent text-white font-bold cursor-pointer">
            <Plus className="w-4 h-4 mr-1" />
            Crear Primer Producto
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {filteredItems.map((item) => {
            const isItemAvailable = item.isAvailable && (!item.stockManaged || (item.stockRemaining ?? 0) > 0);
            const imageUrl = item.imageUrl || (item.imageKey ? `/api/assets-v2/${encodeURIComponent(item.imageKey)}` : null);

            return (
              <div
                key={item.sku}
                className={`bg-surface-card rounded-2xl sm:rounded-3xl border p-4 sm:p-5 shadow-card flex flex-col justify-between transition-all space-y-3 sm:space-y-4 ${
                  !isItemAvailable ? 'border-destructive/30 bg-destructive/5' : 'border-line hover:border-accent/40'
                }`}
              >
                {/* Header de la Tarjeta */}
                <div className="space-y-2.5 sm:space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    {/* Thumbnail */}
                    <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-surface-raised border border-line flex items-center justify-center overflow-hidden shrink-0">
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
                    <span className="text-base font-extrabold text-text-primary font-mono">
                      ${(item.isPromoActive && item.promoPrice != null ? item.promoPrice : item.price).toFixed(2)}{' '}
                      <span className="text-[10px] font-normal text-text-secondary">MXN</span>
                    </span>
                    {item.isPromoActive && item.promoPrice != null && (
                      <span className="text-xs text-text-muted line-through font-mono">
                        ${item.price.toFixed(2)}
                      </span>
                    )}
                    {item.isPromoActive && item.promoLabel && (
                      <span className="text-[10px] font-bold text-accent bg-accent-soft px-1.5 py-0.5 rounded-md">
                        {item.promoLabel}
                      </span>
                    )}
                  </div>

                  {/* Stock Management Bar (Si aplica o en vista quick-stock) */}
                  {(item.stockManaged || activeToolId === 'quick-stock') && (
                    <div className="p-2.5 rounded-2xl bg-surface-raised border border-line flex items-center justify-between gap-2">
                      <div className="text-[11px] min-w-0">
                        <span className="font-semibold text-text-secondary">Stock: </span>
                        <span className={`font-bold font-mono ${(item.stockRemaining ?? 0) <= 5 ? 'text-destructive' : 'text-accent'}`}>
                          {item.stockRemaining ?? 0}
                        </span>
                        <span className="text-text-muted font-mono"> / {item.stockLimit ?? '—'}</span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleQuickStockChange(item, -1)}
                          disabled={(item.stockRemaining ?? 0) <= 0}
                          className="w-7 h-7 rounded-xl bg-surface-card border border-line font-bold text-xs flex items-center justify-center hover:bg-surface-raised disabled:opacity-30 cursor-pointer active:scale-95 shadow-xs"
                          aria-label={`Restar stock a ${item.name}`}
                        >
                          -
                        </button>
                        <button
                          type="button"
                          onClick={() => handleQuickStockChange(item, 1)}
                          className="w-7 h-7 rounded-xl bg-surface-card border border-line font-bold text-xs flex items-center justify-center hover:bg-surface-raised cursor-pointer active:scale-95 shadow-xs"
                          aria-label={`Sumar stock a ${item.name}`}
                        >
                          +
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Acciones Rápidas & Botones */}
                <div className="pt-2 border-t border-line space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    {/* Toggle En Vivo / Agotado */}
                    <Button
                      type="button"
                      variant={isItemAvailable ? 'secondary' : 'outline'}
                      onClick={() => handleToggleAvailability(item)}
                      className={`text-xs font-bold flex-1 min-h-[38px] rounded-xl justify-center cursor-pointer ${
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
                      className="text-xs min-h-[38px] px-2.5 rounded-xl text-text-secondary hover:text-text-primary cursor-pointer"
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
                      className="text-xs min-h-[38px] px-3 rounded-xl font-bold cursor-pointer"
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
                          Confirmar
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
                        className="text-xs min-h-[38px] px-2.5 rounded-xl text-destructive hover:bg-destructive/10 cursor-pointer"
                        title="Eliminar producto"
                        aria-label={`Eliminar ${item.name}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal de Edición/Creación */}
      <ProductEditModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        item={selectedItem}
        categories={categories}
        onSave={handleSaveItem}
        onDeleteImage={deleteImageMutation.mutateAsync}
        isSaving={createItemMutation.isPending || updateItemMutation.isPending || uploadImageMutation.isPending}
      />
    </div>
  );
}
