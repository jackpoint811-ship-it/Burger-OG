import { useEffect, useState, useMemo, useCallback } from 'react';
import type { MenuItem, MenuV2Response } from '@config/index';
import { Button, Card } from '@ui/index';

export function PromosManagementTool() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<'active' | 'all'>('active');
  const [searchQuery, setSearchQuery] = useState('');

  // Editing promo state
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [isPromoActive, setIsPromoActive] = useState(false);
  const [promoPrice, setPromoPrice] = useState('');
  const [promoLabel, setPromoLabel] = useState('Lanzamiento');
  const [saving, setSaving] = useState(false);
  const [togglingSku, setTogglingSku] = useState<string | null>(null);

  const loadMenu = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/menu-v2', { credentials: 'include' });
      const data = (await res.json()) as MenuV2Response;
      setItems(data.items ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al cargar promociones');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMenu();
  }, [loadMenu]);

  // Quick toggle promo active status
  const handleTogglePromoActive = async (item: MenuItem) => {
    if (togglingSku) return;
    setTogglingSku(item.sku);
    setNotice(null);
    try {
      const nextStatus = !item.isPromoActive;
      const res = await fetch(`/api/menu-v2-admin/items/${encodeURIComponent(item.sku)}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          isPromoActive: nextStatus,
          promoPrice: nextStatus ? (item.promoPrice ?? Math.round(item.price * 0.85)) : item.promoPrice,
          promoLabel: item.promoLabel || 'Precio Especial',
        }),
      });

      const data = (await res.json()) as { ok: boolean; error?: string };
      if (!res.ok || !data.ok) throw new Error(data.error ?? 'Error al cambiar estado de la oferta');

      setItems((prev) =>
        prev.map((it) => (it.sku === item.sku ? { ...it, isPromoActive: nextStatus } : it))
      );
      setNotice(`Oferta especial para ${item.name} ${nextStatus ? 'ACTIVADA' : 'DESACTIVADA'}`);
      setTimeout(() => setNotice(null), 3000);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al cambiar oferta');
    } finally {
      setTogglingSku(null);
    }
  };

  const handleOpenEdit = (item: MenuItem) => {
    setEditingItem(item);
    setIsPromoActive(Boolean(item.isPromoActive));
    setPromoPrice(item.promoPrice != null ? String(item.promoPrice) : String(Math.round(item.price * 0.85)));
    setPromoLabel(item.promoLabel || 'Lanzamiento');
    setError(null);
  };

  const handleSavePromoDetails = async () => {
    if (!editingItem) return;
    setError(null);
    const pVal = Number(promoPrice);
    if (!Number.isFinite(pVal) || pVal < 0) {
      setError('Precio promocional inválido');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`/api/menu-v2-admin/items/${encodeURIComponent(editingItem.sku)}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          isPromoActive,
          promoPrice: pVal,
          promoLabel: promoLabel.trim() || 'Precio Especial',
        }),
      });

      const data = (await res.json()) as { ok: boolean; error?: string };
      if (!res.ok || !data.ok) throw new Error(data.error ?? 'Error al guardar oferta');

      setNotice(`Oferta de ${editingItem.name} guardada correctamente`);
      setTimeout(() => setNotice(null), 3000);
      setEditingItem(null);
      loadMenu();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al guardar oferta');
    } finally {
      setSaving(false);
    }
  };

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesTab = activeTab === 'all' || Boolean(item.isPromoActive);
      const matchesQuery =
        !searchQuery.trim() ||
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.sku.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesTab && matchesQuery;
    });
  }, [items, activeTab, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between border-b border-zinc-800 pb-4">
        <div>
          <h2 className="text-xl font-black text-amber-400 flex items-center gap-2">
            ⚡ Módulo de Ofertas Especiales y Precios Promocionales
          </h2>
          <p className="text-xs text-zinc-400">Enciende o apaga precios promocionales tachados y etiquetas en tiempo real.</p>
        </div>

        <div className="flex gap-3 w-full md:w-auto">
          <input
            className="px-3 py-2 text-xs rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-100 placeholder-zinc-500 flex-1 md:w-64 outline-none focus:border-amber-400"
            placeholder="Buscar producto por nombre..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {notice ? <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-xs text-emerald-200">{notice}</div> : null}
      {error ? <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-700/50 text-xs text-rose-200">{error}</div> : null}

      {/* Filter Tabs */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setActiveTab('active')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'active'
              ? 'bg-amber-400 text-zinc-950 shadow-md'
              : 'bg-zinc-900 border border-zinc-800 text-zinc-300 hover:bg-zinc-800'
          }`}
        >
          ⚡ Ofertas Activas ({items.filter((i) => i.isPromoActive).length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('all')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'all'
              ? 'bg-amber-400 text-zinc-950 shadow-md'
              : 'bg-zinc-900 border border-zinc-800 text-zinc-300 hover:bg-zinc-800'
          }`}
        >
          📖 Todos los Productos ({items.length})
        </button>
      </div>

      {/* Grid of Promos */}
      {loading ? (
        <Card className="p-8 text-center text-zinc-400 text-sm">Cargando promociones...</Card>
      ) : filteredItems.length === 0 ? (
        <Card className="p-8 text-center text-zinc-500 text-sm border-dashed">
          No hay promociones {activeTab === 'active' ? 'activas' : 'registradas'} para el filtro actual.
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems.map((item) => {
            const isToggling = togglingSku === item.sku;
            return (
              <Card
                key={item.sku}
                className={`p-4 border flex flex-col justify-between space-y-4 transition-all ${
                  item.isPromoActive
                    ? 'border-amber-500/40 bg-amber-950/10'
                    : 'border-zinc-800 bg-zinc-900/80 opacity-80'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-[10px] font-mono font-bold text-zinc-400 bg-zinc-950 px-2 py-0.5 rounded border border-zinc-800">
                      {item.sku}
                    </span>
                    <span
                      className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full ${
                        item.isPromoActive
                          ? 'bg-amber-400 text-zinc-950 font-extrabold shadow'
                          : 'bg-zinc-800 text-zinc-400'
                      }`}
                    >
                      {item.isPromoActive ? `⚡ ${item.promoLabel || 'OFERTA'}` : 'Sin Oferta'}
                    </span>
                  </div>

                  <h3 className="font-bold text-zinc-100 text-sm leading-snug">{item.name}</h3>
                  <p className="text-xs text-zinc-400 line-clamp-2 mt-1">{item.description}</p>
                </div>

                <div className="pt-3 border-t border-zinc-800/80 space-y-3">
                  <div className="flex items-baseline justify-between">
                    <span className="text-xs text-zinc-400 font-semibold">Precio:</span>
                    {item.isPromoActive && item.promoPrice != null && item.promoPrice < item.price ? (
                      <div className="flex items-baseline gap-2">
                        <span className="text-xs line-through opacity-50 text-zinc-400">${Number(item.price).toFixed(2)}</span>
                        <span className="text-base font-black text-emerald-400">${Number(item.promoPrice).toFixed(2)} MXN</span>
                      </div>
                    ) : (
                      <span className="text-base font-black text-amber-400">${Number(item.price).toFixed(2)} MXN</span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      disabled={isToggling}
                      onClick={() => handleTogglePromoActive(item)}
                      className={`px-2 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                        item.isPromoActive
                          ? 'bg-rose-950/40 border-rose-800/60 text-rose-200 hover:bg-rose-900/60'
                          : 'bg-amber-500/20 border-amber-500/40 text-amber-200 hover:bg-amber-500/30'
                      }`}
                    >
                      {isToggling ? '...' : item.isPromoActive ? 'Apagar Oferta' : '⚡ Activar Oferta'}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(item)}
                      className="px-2 py-1.5 rounded-xl text-xs font-bold bg-zinc-800 border border-zinc-700 text-zinc-200 hover:bg-zinc-700 transition-colors"
                    >
                      ⚙️ Configurar
                    </button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Promo Config Modal */}
      {editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-md bg-zinc-950 border border-zinc-800 text-zinc-100 rounded-2xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-900/60">
              <h3 className="font-black text-lg text-amber-300">Configurar Oferta: {editingItem.name}</h3>
              <button type="button" onClick={() => setEditingItem(null)} className="text-zinc-400 hover:text-zinc-100 text-lg">
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4">
              <label className="flex items-center gap-2 text-xs font-bold text-amber-200 cursor-pointer p-3 rounded-xl bg-amber-950/20 border border-amber-500/30">
                <input type="checkbox" checked={isPromoActive} onChange={(e) => setIsPromoActive(e.target.checked)} className="rounded" />
                ⚡ Activar Oferta Especial (Muestra precio tachado)
              </label>

              <div>
                <label className="text-xs uppercase tracking-widest text-zinc-400 font-bold">Precio Regular ($ MXN)</label>
                <input
                  className="w-full mt-1 px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 text-sm font-bold opacity-60 cursor-not-allowed"
                  value={editingItem.price}
                  readOnly
                />
              </div>

              <div>
                <label className="text-xs uppercase tracking-widest text-zinc-400 font-bold">Precio Promocional ($ MXN)</label>
                <input
                  className="w-full mt-1 px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-100 font-black text-sm focus:border-amber-400 outline-none"
                  value={promoPrice}
                  onChange={(e) => setPromoPrice(e.target.value)}
                  placeholder="ej. 75.00"
                />
              </div>

              <div>
                <label className="text-xs uppercase tracking-widest text-zinc-400 font-bold">Etiqueta de la Oferta</label>
                <input
                  className="w-full mt-1 px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-100 text-sm focus:border-amber-400 outline-none"
                  value={promoLabel}
                  onChange={(e) => setPromoLabel(e.target.value)}
                  placeholder="ej. Lanzamiento / Especial"
                />
              </div>
            </div>

            <div className="flex items-center gap-3 px-6 py-4 border-t border-zinc-800 bg-zinc-900/80">
              <Button type="button" className="flex-1 border border-zinc-700 bg-zinc-900 text-zinc-200" onClick={() => setEditingItem(null)}>
                Cancelar
              </Button>
              <Button type="button" className="flex-1 bg-amber-400 text-zinc-950 font-bold disabled:opacity-40" onClick={handleSavePromoDetails} disabled={saving}>
                {saving ? "Guardando…" : "Guardar Oferta"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
