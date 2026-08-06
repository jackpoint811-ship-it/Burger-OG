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
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between border-b border-zinc-800 pb-4">
        <div>
          <h2 className="text-xl font-black text-amber-100 flex items-center gap-2">
            📦 Catálogo & Stock Diario
          </h2>
          <p className="text-xs text-zinc-400">Gestiona existencias al instante y edita recetas de hamburguesas.</p>
        </div>

        <div className="flex gap-3 w-full md:w-auto">
          <input
            className="px-3 py-2 text-xs rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-100 placeholder-zinc-500 flex-1 md:w-64 outline-none focus:border-amber-400"
            placeholder="Buscar por nombre o SKU..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <Button
            type="button"
            className="bg-amber-400 text-zinc-950 font-bold text-xs whitespace-nowrap min-h-10"
            onClick={handleOpenCreate}
          >
            + Crear Producto
          </Button>
        </div>
      </div>

      {notice ? <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-xs text-emerald-200">{notice}</div> : null}
      {error ? <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-700/50 text-xs text-rose-200">{error}</div> : null}

      {/* Category Filter Pills */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        <button
          type="button"
          onClick={() => setActiveCategory('all')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
            activeCategory === 'all'
              ? 'bg-amber-400 text-zinc-950 shadow-md'
              : 'bg-zinc-900 border border-zinc-800 text-zinc-300 hover:bg-zinc-800'
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
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                activeCategory === catKey
                  ? 'bg-amber-400 text-zinc-950 shadow-md'
                  : 'bg-zinc-900 border border-zinc-800 text-zinc-300 hover:bg-zinc-800'
              }`}
            >
              {ITEM_CATEGORY_LABELS[catKey] || catKey} ({count})
            </button>
          );
        })}
      </div>

      {/* Loading state */}
      {loading ? (
        <Card className="p-8 text-center text-zinc-400 text-sm">Cargando existencias del catálogo...</Card>
      ) : filteredItems.length === 0 ? (
        <Card className="p-8 text-center text-zinc-500 text-sm border-dashed">
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
                    ? 'border-zinc-800 bg-zinc-900/80 hover:border-zinc-700'
                    : 'border-rose-950/60 bg-zinc-950/60 opacity-80'
                }`}
              >
                <div>
                  {/* Top Row: SKU & Badge */}
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-[10px] font-mono font-bold text-zinc-400 bg-zinc-950 px-2 py-0.5 rounded border border-zinc-800">
                      {item.sku}
                    </span>
                    <span
                      className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                        item.isAvailable
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                      }`}
                    >
                      {item.isAvailable ? '✓ Disponible' : '✕ Agotado'}
                    </span>
                  </div>

                  {/* Item Image / Placeholder & Info */}
                  <div className="flex gap-3 mb-3">
                    <div className="w-14 h-14 rounded-xl bg-zinc-950 border border-zinc-800 overflow-hidden shrink-0 flex items-center justify-center">
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
                      <h4 className="font-bold text-zinc-100 text-sm truncate">{item.name}</h4>
                      <p className="text-xs text-zinc-400 line-clamp-2 mt-0.5">{item.description}</p>
                    </div>
                  </div>
                </div>

                {/* Bottom Row: Price & Actions */}
                <div className="pt-3 border-t border-zinc-800/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-zinc-400 font-semibold">Precio Público:</span>
                    <span className="text-base font-black text-amber-400">${Number(item.price).toFixed(2)} MXN</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => handleToggleAvailability(item)}
                      className={`px-2 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                        item.isAvailable
                          ? 'bg-rose-950/40 border-rose-800/60 text-rose-200 hover:bg-rose-900/60'
                          : 'bg-emerald-950/40 border-emerald-800/60 text-emerald-200 hover:bg-emerald-900/60'
                      }`}
                    >
                      {isBusy ? '...' : item.isAvailable ? 'Marcar Agotado' : 'Marcar Disponible'}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(item)}
                      className="px-2 py-1.5 rounded-xl text-xs font-bold bg-zinc-800 border border-zinc-700 text-zinc-200 hover:bg-zinc-700 transition-colors"
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
