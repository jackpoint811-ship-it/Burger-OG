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
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between border-b border-neutral-200 pb-4">
        <div>
          <h2 className="text-xl font-bold text-neutral-800 flex items-center gap-2">
            ⚡ Módulo de Ofertas Especiales y Precios Promocionales
          </h2>
          <p className="text-xs text-neutral-500">Enciende o apaga precios promocionales tachados y etiquetas en tiempo real.</p>
        </div>

        <div className="flex gap-3 w-full md:w-auto">
          <input
            className="px-3 py-2 text-xs rounded-xl bg-[#F5F2EE] border border-neutral-200 text-neutral-800 placeholder-neutral-400 flex-1 md:w-64 outline-none focus:border-[#16A34A]"
            placeholder="Buscar producto por nombre..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {notice ? <div className="p-3 rounded-xl bg-green-50 border border-green-200 text-xs text-green-800">{notice}</div> : null}
      {error ? <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700">{error}</div> : null}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setActiveTab('active')}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'active'
              ? 'bg-[#16A34A] text-white shadow-sm'
              : 'bg-neutral-100 border border-neutral-300 text-neutral-600 hover:bg-neutral-200'
          }`}
        >
          ⚡ Ofertas Activas ({items.filter((i) => i.isPromoActive).length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('all')}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'all'
              ? 'bg-[#16A34A] text-white shadow-sm'
              : 'bg-neutral-100 border border-neutral-300 text-neutral-600 hover:bg-neutral-200'
          }`}
        >
          📖 Todos los Productos ({items.length})
        </button>
      </div>

      {loading ? (
        <Card className="p-8 text-center text-neutral-500 text-sm">Cargando promociones...</Card>
      ) : filteredItems.length === 0 ? (
        <Card className="p-8 text-center text-neutral-400 text-sm border-dashed border-neutral-300">
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
                    ? 'border-amber-300 bg-amber-50'
                    : 'border-neutral-200 bg-white opacity-80'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-[10px] font-mono font-semibold text-[#16A34A] bg-green-50 px-2 py-0.5 rounded border border-green-200">
                      {item.sku}
                    </span>
                    <span
                      className={`text-[10px] font-semibold uppercase px-2.5 py-0.5 rounded-full ${
                        item.isPromoActive
                          ? 'bg-amber-100 text-amber-800 border border-amber-300'
                          : 'bg-neutral-100 text-neutral-500 border border-neutral-200'
                      }`}
                    >
                      {item.isPromoActive ? `⚡ ${item.promoLabel || 'OFERTA'}` : 'Sin Oferta'}
                    </span>
                  </div>

                  <h3 className="font-semibold text-neutral-800 text-sm leading-snug">{item.name}</h3>
                  <p className="text-xs text-neutral-500 line-clamp-2 mt-1">{item.description}</p>
                </div>

                <div className="pt-3 border-t border-neutral-200 space-y-3">
                  <div className="flex items-baseline justify-between">
                    <span className="text-xs text-neutral-500 font-semibold">Precio:</span>
                    {item.isPromoActive && item.promoPrice != null && item.promoPrice < item.price ? (
                      <div className="flex items-baseline gap-2">
                        <span className="text-xs line-through opacity-50 text-neutral-400">${Number(item.price).toFixed(2)}</span>
                        <span className="text-base font-bold text-[#16A34A]">${Number(item.promoPrice).toFixed(2)} MXN</span>
                      </div>
                    ) : (
                      <span className="text-base font-bold text-neutral-800">${Number(item.price).toFixed(2)} MXN</span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      disabled={isToggling}
                      onClick={() => handleTogglePromoActive(item)}
                      className={`px-2 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
                        item.isPromoActive
                          ? 'bg-red-50 border-red-200 text-red-700 hover:bg-red-100'
                          : 'bg-green-50 border-green-200 text-green-700 hover:bg-green-100'
                      }`}
                    >
                      {isToggling ? '...' : item.isPromoActive ? 'Apagar Oferta' : '⚡ Activar Oferta'}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(item)}
                      className="px-2 py-1.5 rounded-xl text-xs font-semibold bg-neutral-100 border border-neutral-300 text-neutral-700 hover:bg-neutral-200 transition-colors"
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

      {editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white border border-neutral-200 text-neutral-800 rounded-2xl shadow-xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 bg-[#F5F2EE]">
              <h3 className="font-bold text-lg text-neutral-800">Configurar Oferta: {editingItem.name}</h3>
              <button type="button" onClick={() => setEditingItem(null)} className="text-neutral-400 hover:text-neutral-600 text-lg">
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4">
              <label className="flex items-center gap-2 text-xs font-semibold text-[#16A34A] cursor-pointer p-3 rounded-xl bg-green-50 border border-green-200">
                <input type="checkbox" checked={isPromoActive} onChange={(e) => setIsPromoActive(e.target.checked)} className="rounded" />
                ⚡ Activar Oferta Especial (Muestra precio tachado)
              </label>

              <div>
                <label className="text-xs uppercase tracking-widest text-neutral-500 font-semibold">Precio Regular ($ MXN)</label>
                <input
                  className="w-full mt-1 px-3 py-2 rounded-xl bg-neutral-100 border border-neutral-200 text-neutral-500 text-sm font-semibold opacity-60 cursor-not-allowed"
                  value={editingItem.price}
                  readOnly
                />
              </div>

              <div>
                <label className="text-xs uppercase tracking-widest text-neutral-500 font-semibold">Precio Promocional ($ MXN)</label>
                <input
                  className="w-full mt-1 px-3 py-2 rounded-xl bg-[#F5F2EE] border border-neutral-200 text-neutral-800 font-bold text-sm focus:border-[#16A34A] outline-none"
                  value={promoPrice}
                  onChange={(e) => setPromoPrice(e.target.value)}
                  placeholder="ej. 75.00"
                />
              </div>

              <div>
                <label className="text-xs uppercase tracking-widest text-neutral-500 font-semibold">Etiqueta de la Oferta</label>
                <input
                  className="w-full mt-1 px-3 py-2 rounded-xl bg-[#F5F2EE] border border-neutral-200 text-neutral-800 text-sm focus:border-[#16A34A] outline-none"
                  value={promoLabel}
                  onChange={(e) => setPromoLabel(e.target.value)}
                  placeholder="ej. Lanzamiento / Especial"
                />
              </div>
            </div>

            <div className="flex items-center gap-3 px-6 py-4 border-t border-neutral-200 bg-[#F5F2EE]">
              <Button type="button" className="flex-1 border border-neutral-300 bg-white text-neutral-700" onClick={() => setEditingItem(null)}>
                Cancelar
              </Button>
              <Button type="button" className="flex-1 bg-[#16A34A] text-white font-semibold disabled:opacity-40" onClick={handleSavePromoDetails} disabled={saving}>
                {saving ? "Guardando…" : "Guardar Oferta"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
