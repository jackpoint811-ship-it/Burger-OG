import { useEffect, useState, useMemo, useCallback } from 'react';
import type { MenuCategory, MenuItem, MenuV2Response } from '@config/index';
import { Button, Card } from '@ui/index';
import { BurgerEditorDrawer } from './BurgerEditorDrawer';

const ITEM_CATEGORY_LABELS: Record<string, string> = {
  burgers: '🍔 Hamburguesas',
  combos: '🔥 Combos',
  guarniciones: '🍟 Guarniciones',
  drinks: '🥤 Bebidas',
  extras: '🧀 Extras',
};

export function MenuStockTool() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Drawer state
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  // Availability toggle state
  const [togglingSku, setTogglingSku] = useState<string | null>(null);

  const loadMenu = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/menu-v2', { credentials: 'include' });
      const data = (await res.json()) as MenuV2Response;
      setItems(data.items ?? []);
      setCategories(data.categories ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al cargar el menú');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMenu();
  }, [loadMenu]);

  // Toggle availability
  const handleToggleAvailability = async (item: MenuItem) => {
    if (togglingSku) return;
    setTogglingSku(item.sku);
    setNotice(null);
    try {
      const nextStatus = !item.isAvailable;
      const res = await fetch(`/api/menu-v2-admin/items/${encodeURIComponent(item.sku)}/availability`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ isAvailable: nextStatus }),
      });
      const data = await res.json() as { ok: boolean; item?: MenuItem; error?: string };
      if (!res.ok || !data.ok) throw new Error(data.error ?? 'Error al actualizar disponibilidad');
      
      setItems((prev) => prev.map((it) => (it.sku === item.sku ? { ...it, isAvailable: nextStatus } : it)));
      setNotice(`${item.name} (${item.sku}) marcado como ${nextStatus ? '✓ Disponible' : '✕ Agotado'}`);
      setTimeout(() => setNotice(null), 3000);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al actualizar disponibilidad');
    } finally {
      setTogglingSku(null);
    }
  };

  // Filtered items
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      // Exclude pure combos from stock tool if desired, or show all
      if (item.category === 'combos') return false;
      const matchesCategory = activeCategory === 'all' || item.category === activeCategory;
      const matchesQuery = !searchQuery.trim() || 
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        item.sku.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesQuery;
    });
  }, [items, activeCategory, searchQuery]);

  const handleOpenEdit = (item: MenuItem) => {
    setEditingItem(item);
    setIsCreating(false);
    setIsDrawerOpen(true);
  };

  const handleOpenCreate = () => {
    setEditingItem(null);
    setIsCreating(true);
    setIsDrawerOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Top Action Bar */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between border-b border-neutral-200 pb-4">
        <div>
          <h2 className="text-xl font-bold text-neutral-800 flex items-center gap-2">
            📦 Catálogo & Stock Diario
          </h2>
          <p className="text-xs text-neutral-500">Gestiona existencias al instante y edita recetas de hamburguesas.</p>
        </div>

        <div className="flex gap-3 w-full md:w-auto">
          <input
            className="px-3 py-2 text-xs rounded-xl bg-[#F5F2EE] border border-neutral-200 text-neutral-800 placeholder-neutral-400 flex-1 md:w-64 outline-none focus:border-[#16A34A]"
            placeholder="Buscar por nombre o SKU..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <Button
            type="button"
            className="bg-[#16A34A] text-white font-semibold text-xs whitespace-nowrap min-h-10"
            onClick={handleOpenCreate}
          >
            + Crear Producto
          </Button>
        </div>
      </div>

      {notice ? <div className="p-3 rounded-xl bg-green-50 border border-green-200 text-xs text-green-800">{notice}</div> : null}
      {error ? <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700">{error}</div> : null}

      {/* Category Filter Pills */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        <button
          type="button"
          onClick={() => setActiveCategory('all')}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 ${
            activeCategory === 'all'
              ? 'bg-[#16A34A] text-white shadow-sm'
              : 'bg-neutral-100 border border-neutral-300 text-neutral-600 hover:bg-neutral-200'
          }`}
        >
          📖 Todos ({items.filter(i => i.category !== 'combos').length})
        </button>
        {['burgers', 'guarniciones', 'drinks', 'extras'].map((catKey) => {
          const count = items.filter((i) => i.category === catKey).length;
          return (
            <button
              key={catKey}
              type="button"
              onClick={() => setActiveCategory(catKey)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 ${
                activeCategory === catKey
                  ? 'bg-[#16A34A] text-white shadow-sm'
                  : 'bg-neutral-100 border border-neutral-300 text-neutral-600 hover:bg-neutral-200'
              }`}
            >
              {ITEM_CATEGORY_LABELS[catKey] || catKey} ({count})
            </button>
          );
        })}
      </div>

      {/* Loading state */}
      {loading ? (
        <Card className="p-8 text-center text-neutral-500 text-sm">Cargando existencias del catálogo...</Card>
      ) : filteredItems.length === 0 ? (
        <Card className="p-8 text-center text-neutral-400 text-sm border-dashed border-neutral-300">
          No se encontraron productos para la categoría o filtro seleccionado.
        </Card>
      ) : (
        /* Product Cards Grid */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredItems.map((item) => {
            const isBusy = togglingSku === item.sku;
            return (
              <Card
                key={item.sku}
                className={`flex flex-col justify-between p-4 transition-all border ${
                  item.isAvailable
                    ? 'border-neutral-200 bg-white hover:border-neutral-300'
                    : 'border-red-200 bg-red-50/50 opacity-80'
                }`}
              >
                <div>
                  {/* Top Row: SKU & Badge */}
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-[10px] font-mono font-semibold text-[#16A34A] bg-green-50 px-2 py-0.5 rounded border border-green-200">
                      {item.sku}
                    </span>
                    <span
                      className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full ${
                        item.isAvailable
                          ? 'bg-green-100 text-green-700 border border-green-200'
                          : 'bg-red-100 text-red-700 border border-red-200'
                      }`}
                    >
                      {item.isAvailable ? '✓ Disponible' : '✕ Agotado'}
                    </span>
                  </div>

                  {/* Item Image / Placeholder & Info */}
                  <div className="flex gap-3 mb-3">
                    <div className="w-14 h-14 rounded-xl bg-[#F5F2EE] border border-neutral-200 overflow-hidden shrink-0 flex items-center justify-center">
                      {item.imageUrl || item.imageKey ? (
                        <img
                          src={item.imageUrl || `/api/assets-v2/${item.imageKey}`}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-xl">🍔</span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="font-semibold text-neutral-800 text-sm truncate">{item.name}</h4>
                      <p className="text-xs text-neutral-500 line-clamp-2 mt-0.5">{item.description}</p>
                    </div>
                  </div>
                </div>

                {/* Bottom Row: Price & Actions */}
                <div className="pt-3 border-t border-neutral-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-neutral-500 font-semibold">Precio Público:</span>
                    <span className="text-base font-bold text-[#16A34A]">${Number(item.price).toFixed(2)} MXN</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => handleToggleAvailability(item)}
                      className={`px-2 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
                        item.isAvailable
                          ? 'bg-red-50 border-red-200 text-red-700 hover:bg-red-100'
                          : 'bg-green-50 border-green-200 text-green-700 hover:bg-green-100'
                      }`}
                    >
                      {isBusy ? '...' : item.isAvailable ? 'Marcar Agotado' : 'Marcar Disponible'}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(item)}
                      className="px-2 py-1.5 rounded-xl text-xs font-semibold bg-neutral-100 border border-neutral-300 text-neutral-700 hover:bg-neutral-200 transition-colors"
                    >
                      ✏️ Editar / Receta
                    </button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Drawer Overlay */}
      {isDrawerOpen && (
        <BurgerEditorDrawer
          item={editingItem}
          isCreating={isCreating}
          categories={categories}
          onClose={() => setIsDrawerOpen(false)}
          onSaved={() => {
            setIsDrawerOpen(false);
            loadMenu();
          }}
        />
      )}
    </div>
  );
}
