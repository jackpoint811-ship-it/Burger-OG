import { useEffect, useState, useCallback } from 'react';
import type { IngredientV2 } from '@config/index';
import { Button, Card } from '@ui/index';
import { createIngredientV2Admin, fetchIngredientsV2Admin, updateIngredientV2Admin } from '../../lib/ingredients-v2-admin';

const INGREDIENT_UNITS = ['pieza', 'g', 'kg', 'ml', 'l', 'paquete', 'bolsa'];

export function IngredientsMasterTool() {
  const [ingredients, setIngredients] = useState<IngredientV2[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  // Form state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const [name, setName] = useState('');
  const [unit, setUnit] = useState('pieza');
  const [unitPrice, setUnitPrice] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [sortOrder, setSortOrder] = useState('10');
  const [saving, setSaving] = useState(false);

  const loadIngredients = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchIngredientsV2Admin();
      setIngredients(data ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al cargar ingredientes');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadIngredients();
  }, [loadIngredients]);

  const handleOpenEdit = (ing: IngredientV2) => {
    setEditingId(ing.id);
    setIsCreating(false);
    setName(ing.name);
    setUnit(ing.unit);
    setUnitPrice(ing.unitPriceCents != null ? (ing.unitPriceCents / 100).toFixed(2) : '');
    setIsActive(ing.isActive);
    setSortOrder(String(ing.sortOrder));
    setError(null);
  };

  const handleOpenCreate = () => {
    setEditingId(null);
    setIsCreating(true);
    setName('');
    setUnit('pieza');
    setUnitPrice('');
    setIsActive(true);
    setSortOrder('10');
    setError(null);
  };

  const handleSave = async () => {
    setError(null);
    if (!name.trim()) { setError('Nombre del ingrediente requerido'); return; }

    const priceCents = unitPrice.trim() ? Math.round(Number(unitPrice) * 100) : null;
    setSaving(true);
    try {
      if (isCreating) {
        await createIngredientV2Admin({
          name: name.trim(),
          unit,
          unitPriceCents: priceCents,
          isActive,
          sortOrder: Number(sortOrder) || 10,
        });
        setNotice(`Ingrediente ${name} creado correctamente`);
      } else if (editingId) {
        await updateIngredientV2Admin(editingId, {
          name: name.trim(),
          unit,
          unitPriceCents: priceCents,
          isActive,
          sortOrder: Number(sortOrder) || 10,
        });
        setNotice(`Ingrediente ${name} actualizado correctamente`);
      }
      setTimeout(() => setNotice(null), 3000);
      setEditingId(null);
      setIsCreating(false);
      loadIngredients();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al guardar ingrediente');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between border-b border-neutral-200 pb-4">
        <div>
          <h2 className="text-xl font-bold text-neutral-800 flex items-center gap-2">
            🥬 Catálogo Maestro de Ingredientes (Single Source)
          </h2>
          <p className="text-xs text-neutral-500">Administra los insumos oficiales vinculados a recetas y comanda KDS.</p>
        </div>
        <Button
          type="button"
          className="bg-[#16A34A] text-white font-semibold text-xs whitespace-nowrap min-h-10"
          onClick={handleOpenCreate}
        >
          + Crear Ingrediente
        </Button>
      </div>

      {notice ? <div className="p-3 rounded-xl bg-green-50 border border-green-200 text-xs text-green-800">{notice}</div> : null}
      {error ? <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700">{error}</div> : null}

      {/* List / Table of Ingredients */}
      {loading ? (
        <Card className="p-8 text-center text-neutral-500 text-sm">Cargando ingredientes...</Card>
      ) : ingredients.length === 0 ? (
        <Card className="p-8 text-center text-neutral-400 text-sm border-dashed border-neutral-300">
          Sin ingredientes registrados. Haz clic en <strong>+ Crear Ingrediente</strong> para dar de alta.
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {ingredients.map((ing) => (
            <Card key={ing.id} className="p-4 border border-neutral-200 bg-white flex items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-semibold text-neutral-800">{ing.name}</span>
                  <span className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full ${
                    ing.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {ing.isActive ? 'Activo' : 'Inactivo'}
                  </span>
                </div>
                <div className="text-xs text-neutral-500 font-mono">
                  Unidad: <strong className="text-neutral-700">{ing.unit}</strong> | Precio Unit: {ing.unitPriceCents != null ? `$${(ing.unitPriceCents / 100).toFixed(2)} MXN` : 'Sin costo'}
                </div>
              </div>
              <Button
                type="button"
                className="bg-neutral-100 border border-neutral-300 text-neutral-700 text-xs py-1 px-3 min-h-0"
                onClick={() => handleOpenEdit(ing)}
              >
                ✏️ Editar
              </Button>
            </Card>
          ))}
        </div>
      )}

      {/* Editor Modal */}
      {(editingId || isCreating) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white border border-neutral-200 text-neutral-800 rounded-2xl shadow-xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 bg-[#F5F2EE]">
              <h3 className="font-bold text-lg text-neutral-800">
                {isCreating ? "Nuevo Ingrediente" : `Editar: ${name}`}
              </h3>
              <button type="button" onClick={() => { setEditingId(null); setIsCreating(false); }} className="text-neutral-400 hover:text-neutral-600 text-lg">
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="text-xs uppercase tracking-widest text-neutral-500 font-semibold">Nombre del Ingrediente</label>
                <input
                  className="w-full mt-1 px-3 py-2 rounded-xl bg-[#F5F2EE] border border-neutral-200 text-neutral-800 text-sm font-semibold focus:border-[#16A34A] outline-none"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="ej. Carne Smash de Res"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs uppercase tracking-widest text-neutral-500 font-semibold">Unidad de Medida</label>
                  <select
                    className="w-full mt-1 px-3 py-2 rounded-xl bg-[#F5F2EE] border border-neutral-200 text-neutral-800 text-sm focus:border-[#16A34A] outline-none"
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                  >
                    {INGREDIENT_UNITS.map((u) => (
                      <option key={u} value={u}>
                        {u}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs uppercase tracking-widest text-neutral-500 font-semibold">Precio Insumo ($ MXN)</label>
                  <input
                    className="w-full mt-1 px-3 py-2 rounded-xl bg-[#F5F2EE] border border-neutral-200 text-neutral-800 text-sm focus:border-[#16A34A] outline-none"
                    value={unitPrice}
                    onChange={(e) => setUnitPrice(e.target.value)}
                    placeholder="ej. 15.00"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs uppercase tracking-widest text-neutral-500 font-semibold">Orden</label>
                  <input
                    className="w-full mt-1 px-3 py-2 rounded-xl bg-[#F5F2EE] border border-neutral-200 text-neutral-800 text-sm focus:border-[#16A34A] outline-none"
                    value={sortOrder}
                    onChange={(e) => setSortOrder(e.target.value)}
                    placeholder="10"
                  />
                </div>
                <div className="flex items-end">
                  <label className="flex items-center gap-2 text-xs font-semibold text-neutral-700 cursor-pointer p-2.5 rounded-xl bg-[#F5F2EE] border border-neutral-200 w-full">
                    <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="rounded" />
                    ✓ Ingrediente Activo
                  </label>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 px-6 py-4 border-t border-neutral-200 bg-[#F5F2EE]">
              <Button type="button" className="flex-1 border border-neutral-300 bg-white text-neutral-700" onClick={() => { setEditingId(null); setIsCreating(false); }}>
                Cancelar
              </Button>
              <Button type="button" className="flex-1 bg-[#16A34A] text-white font-semibold disabled:opacity-40" onClick={handleSave} disabled={saving}>
                {saving ? "Guardando…" : "Guardar Ingrediente"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
