import { useEffect, useState, useMemo, useCallback } from 'react';
import type { ComboOptionGroup, MenuItem, MenuV2Response } from '@config/index';
import { Button, Card } from '@ui/index';

const DEFAULT_COMBO_GROUPS: ComboOptionGroup[] = [
  { id: 'grp-1', name: '1. Hamburguesa Principal', isRequired: true, minSelections: 1, maxSelections: 1, options: [{ sku: 'BRG-OG', upchargeCents: 0 }] },
  { id: 'grp-2', name: '2. Guarnición', isRequired: true, minSelections: 1, maxSelections: 1, options: [{ sku: 'PAPAS_OG', upchargeCents: 0 }, { sku: 'AROS_CEBOLLA', upchargeCents: 500 }] },
  { id: 'grp-3', name: '3. Bebida', isRequired: true, minSelections: 1, maxSelections: 1, options: [{ sku: 'DRK-COKE', upchargeCents: 0 }] },
  { id: 'grp-4', name: '4. Extra u Opciones', isRequired: false, minSelections: 0, maxSelections: 1, options: [] },
];

export function ComboBuilderTool() {
  const [combos, setCombos] = useState<MenuItem[]>([]);
  const [allItems, setAllItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  // Editor Modal State
  const [editingCombo, setEditingCombo] = useState<MenuItem | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [sku, setSku] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [bundlePrice, setBundlePrice] = useState('99.00');
  const [isAvailable, setIsAvailable] = useState(true);
  const [comboGroups, setComboGroups] = useState<ComboOptionGroup[]>(DEFAULT_COMBO_GROUPS);
  const [saving, setSaving] = useState(false);

  const loadMenu = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/menu-v2', { credentials: 'include' });
      const data = (await res.json()) as MenuV2Response;
      const itemsList = data.items ?? [];
      setAllItems(itemsList);
      setCombos(itemsList.filter((i) => i.category === 'combos' || Boolean(i.comboConfig?.isCombo)));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al cargar combos');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMenu();
  }, [loadMenu]);

  const handleOpenEdit = (combo: MenuItem) => {
    setEditingCombo(combo);
    setIsCreating(false);
    setSku(combo.sku);
    setName(combo.name);
    setDescription(combo.description);
    setBundlePrice(combo.comboConfig?.bundlePriceCents ? (combo.comboConfig.bundlePriceCents / 100).toFixed(2) : String(combo.price));
    setIsAvailable(combo.isAvailable);
    setComboGroups(combo.comboConfig?.optionGroups?.length ? combo.comboConfig.optionGroups : DEFAULT_COMBO_GROUPS);
    setError(null);
  };

  const handleOpenCreate = () => {
    setEditingCombo(null);
    setIsCreating(true);
    setSku('');
    setName('');
    setDescription('');
    setBundlePrice('99.00');
    setIsAvailable(true);
    setComboGroups(DEFAULT_COMBO_GROUPS);
    setError(null);
  };

  const handleSaveCombo = async () => {
    setError(null);
    const effectiveSku = sku.trim() ? sku.trim().toUpperCase() : `COMBO-${name.trim().toUpperCase().replace(/[^A-Z0-9]+/g, '-')}`;
    if (!name.trim()) { setError('Nombre del combo requerido'); return; }

    const priceVal = Number(bundlePrice);
    if (!Number.isFinite(priceVal) || priceVal < 0) { setError('Precio del bundle inválido'); return; }

    setSaving(true);
    try {
      const endpoint = isCreating ? '/api/menu-v2-admin/items' : `/api/menu-v2-admin/items/${encodeURIComponent(sku)}`;
      const res = await fetch(endpoint, {
        method: isCreating ? 'POST' : 'PATCH',
        credentials: 'include',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          sku: effectiveSku,
          name: name.trim(),
          description: description.trim() || 'Combo especial con guarnición y bebida',
          price: priceVal,
          category: 'combos',
          isAvailable,
          isFeatured: true,
          comboConfig: {
            isCombo: true,
            bundlePriceCents: Math.round(priceVal * 100),
            optionGroups: comboGroups,
          },
        }),
      });

      const data = (await res.json()) as { ok: boolean; error?: string };
      if (!res.ok || !data.ok) throw new Error(data.error ?? 'Error al guardar el combo');

      setNotice(`Combo ${name} guardado correctamente`);
      setTimeout(() => setNotice(null), 3000);
      setEditingCombo(null);
      setIsCreating(false);
      loadMenu();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al guardar combo');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between border-b border-zinc-800 pb-4">
        <div>
          <h2 className="text-xl font-black text-fuchsia-300 flex items-center gap-2">
            🔥 Creador y Mantenimiento de Combos
          </h2>
          <p className="text-xs text-zinc-400">Configura paquetes bundle, grupos de opciones y sobreprecios (upcharges).</p>
        </div>
        <Button
          type="button"
          className="bg-fuchsia-500 text-zinc-950 font-bold text-xs whitespace-nowrap min-h-10"
          onClick={handleOpenCreate}
        >
          + Crear Nuevo Combo
        </Button>
      </div>

      {notice ? <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-xs text-emerald-200">{notice}</div> : null}
      {error ? <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-700/50 text-xs text-rose-200">{error}</div> : null}

      {/* Grid of Combos */}
      {loading ? (
        <Card className="p-8 text-center text-zinc-400 text-sm">Cargando paquetes de combos...</Card>
      ) : combos.length === 0 ? (
        <Card className="p-8 text-center text-zinc-500 text-sm border-dashed">
          No hay combos registrados. Haz clic en <strong>+ Crear Nuevo Combo</strong> para comenzar.
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {combos.map((combo) => {
            const config = combo.comboConfig;
            const groupsCount = config?.optionGroups?.length ?? 0;
            return (
              <Card key={combo.sku} className="p-4 border border-zinc-800 bg-zinc-900/80 flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-[10px] font-mono font-bold text-fuchsia-300 bg-fuchsia-950/60 px-2 py-0.5 rounded border border-fuchsia-500/30">
                      {combo.sku}
                    </span>
                    <span
                      className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                        combo.isAvailable
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                      }`}
                    >
                      {combo.isAvailable ? '✓ Combo Activo' : '✕ Pausado'}
                    </span>
                  </div>

                  <h3 className="font-bold text-zinc-100 text-base">{combo.name}</h3>
                  <p className="text-xs text-zinc-400 line-clamp-2 mt-1">{combo.description}</p>

                  {/* Groups summary */}
                  <div className="mt-3 p-2 rounded-xl bg-zinc-950 border border-zinc-800/80 space-y-1">
                    <span className="text-[10px] font-black uppercase text-fuchsia-400">
                      {groupsCount} Grupos de selección configurados:
                    </span>
                    <ul className="text-xs text-zinc-300 space-y-0.5">
                      {config?.optionGroups?.map((g, idx) => (
                        <li key={idx} className="truncate">
                          • {g.name} ({g.options.length} opciones)
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="pt-3 border-t border-zinc-800 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-zinc-500 font-bold block">PRECIO BUNDLE</span>
                    <span className="text-lg font-black text-fuchsia-300">${Number(combo.price).toFixed(2)} MXN</span>
                  </div>
                  <Button
                    type="button"
                    className="bg-zinc-800 border border-zinc-700 text-zinc-100 text-xs font-bold"
                    onClick={() => handleOpenEdit(combo)}
                  >
                    ✏️ Editar Grupos
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Editor Modal */}
      {(editingCombo || isCreating) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-3xl bg-zinc-950 border border-zinc-800 text-zinc-100 rounded-2xl shadow-2xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-900/60">
              <h3 className="font-black text-lg text-fuchsia-300">
                {isCreating ? "Crear Combo Especial" : `Configurar: ${name}`}
              </h3>
              <button type="button" onClick={() => { setEditingCombo(null); setIsCreating(false); }} className="text-zinc-400 hover:text-zinc-100 text-lg">
                ✕
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs uppercase tracking-widest text-zinc-400 font-bold">SKU Combo</label>
                  <input
                    className="w-full mt-1 px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-100 text-sm font-mono focus:border-fuchsia-400 outline-none"
                    value={sku}
                    readOnly={!isCreating}
                    onChange={(e) => setSku(e.target.value.toUpperCase().replace(/[^A-Z0-9-]+/g, '-'))}
                    placeholder="COMBO-OG"
                  />
                </div>
                <div>
                  <label className="text-xs uppercase tracking-widest text-zinc-400 font-bold">Nombre Combo</label>
                  <input
                    className="w-full mt-1 px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-100 text-sm font-bold focus:border-fuchsia-400 outline-none"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Combo OG 2x1"
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs uppercase tracking-widest text-zinc-400 font-bold">Precio Promocional Bundle ($ MXN)</label>
                  <input
                    className="w-full mt-1 px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-100 font-black text-sm focus:border-fuchsia-400 outline-none"
                    value={bundlePrice}
                    onChange={(e) => setBundlePrice(e.target.value)}
                    placeholder="99.00"
                  />
                </div>
                <div className="flex items-end">
                  <label className="flex items-center gap-2 text-xs font-bold text-zinc-200 cursor-pointer p-3 rounded-xl bg-zinc-900 border border-zinc-800 w-full">
                    <input type="checkbox" checked={isAvailable} onChange={(e) => setIsAvailable(e.target.checked)} className="rounded" />
                    ✓ Combo Activo en Tienda Público
                  </label>
                </div>
              </div>

              {/* 4 Groups Manager */}
              <div className="space-y-4 pt-4 border-t border-zinc-800">
                <h4 className="text-xs font-black uppercase tracking-widest text-fuchsia-400">
                  Grupos de Opciones del Combo (Hasta 4 Grupos)
                </h4>

                <div className="space-y-3">
                  {comboGroups.map((grp, gIdx) => (
                    <div key={grp.id || gIdx} className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/60 space-y-3">
                      <div className="flex gap-2 items-center">
                        <input
                          className="w-full px-3 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-xs font-bold text-zinc-100 focus:border-fuchsia-400 outline-none"
                          value={grp.name}
                          onChange={(e) => {
                            const next = [...comboGroups];
                            next[gIdx] = { ...next[gIdx], name: e.target.value };
                            setComboGroups(next);
                          }}
                          placeholder="Nombre del Grupo"
                        />
                      </div>

                      <div className="space-y-2 pl-2 border-l-2 border-fuchsia-500/30">
                        <span className="text-[11px] text-zinc-400 font-bold">Opciones asignadas y sobreprecio:</span>
                        {grp.options.map((opt, oIdx) => (
                          <div key={oIdx} className="flex gap-2 items-center">
                            <select
                              className="flex-1 px-2 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-zinc-200 outline-none"
                              value={opt.sku}
                              onChange={(e) => {
                                const nextGrp = [...comboGroups];
                                const nextOpt = [...nextGrp[gIdx].options];
                                nextOpt[oIdx] = { ...nextOpt[oIdx], sku: e.target.value };
                                nextGrp[gIdx].options = nextOpt;
                                setComboGroups(nextGrp);
                              }}
                            >
                              <option value="">-- Selecciona SKU --</option>
                              {allItems.map((it) => (
                                <option key={it.sku} value={it.sku}>
                                  [{it.sku}] {it.name} (${Number(it.price).toFixed(2)})
                                </option>
                              ))}
                            </select>
                            <span className="text-xs text-zinc-400 font-bold">+ $</span>
                            <input
                              className="w-20 px-2 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-zinc-200 text-center font-bold"
                              value={opt.upchargeCents / 100}
                              onChange={(e) => {
                                const nextGrp = [...comboGroups];
                                const nextOpt = [...nextGrp[gIdx].options];
                                nextOpt[oIdx] = { ...nextOpt[oIdx], upchargeCents: Math.round(Number(e.target.value) * 100) || 0 };
                                nextGrp[gIdx].options = nextOpt;
                                setComboGroups(nextGrp);
                              }}
                              placeholder="0"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const nextGrp = [...comboGroups];
                                nextGrp[gIdx].options = nextGrp[gIdx].options.filter((_, i) => i !== oIdx);
                                setComboGroups(nextGrp);
                              }}
                              className="text-xs text-rose-400 font-bold hover:text-rose-200 px-2"
                            >
                              Quitar
                            </button>
                          </div>
                        ))}
                        <Button
                          type="button"
                          className="mt-1 text-xs bg-zinc-800 border border-zinc-700 text-zinc-200 py-1 px-3 min-h-0"
                          onClick={() => {
                            const nextGrp = [...comboGroups];
                            nextGrp[gIdx].options.push({ sku: "", upchargeCents: 0 });
                            setComboGroups(nextGrp);
                          }}
                        >
                          + Agregar Opcion SKU
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 px-6 py-4 border-t border-zinc-800 bg-zinc-900/80">
              <Button type="button" className="flex-1 border border-zinc-700 bg-zinc-900 text-zinc-200" onClick={() => { setEditingCombo(null); setIsCreating(false); }}>
                Cancelar
              </Button>
              <Button type="button" className="flex-1 bg-fuchsia-500 text-zinc-950 font-bold disabled:opacity-40" onClick={handleSaveCombo} disabled={saving}>
                {saving ? "Guardando…" : "Guardar Combo"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
