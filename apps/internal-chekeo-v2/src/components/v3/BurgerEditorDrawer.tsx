import { useEffect, useState, useRef } from 'react';
import type { MenuCategory, MenuItem, IngredientV2, ProductIngredientRecipeV2 } from '@config/index';
import { Button } from '@ui/index';
import { fetchIngredientsV2Admin, fetchProductRecipeV2Admin, saveProductRecipeV2Admin } from '../../lib/ingredients-v2-admin';

const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

type BurgerEditorDrawerProps = {
  item: MenuItem | null;
  isCreating: boolean;
  categories: MenuCategory[];
  onClose: () => void;
  onSaved: () => void;
};

type RecipeRow = {
  ingredientId: string;
  quantityPerUnit: number;
};

export function BurgerEditorDrawer({ item, isCreating, categories, onClose, onSaved }: BurgerEditorDrawerProps) {
  const [sku, setSku] = useState(item?.sku ?? '');
  const [name, setName] = useState(item?.name ?? '');
  const [description, setDescription] = useState(item?.description ?? '');
  const [price, setPrice] = useState(item?.price ? String(item.price) : '85');
  const [category, setCategory] = useState<MenuCategory['key']>(item?.category ?? 'burgers');
  const [isAvailable, setIsAvailable] = useState(item?.isAvailable ?? true);
  const [isFeatured, setIsFeatured] = useState(item?.isFeatured ?? false);
  const [badge, setBadge] = useState(item?.badge ?? '');
  const [sortOrder, setSortOrder] = useState(item?.sortOrder ? String(item.sortOrder) : '10');
  
  // Image state
  const [imageUrl, setImageUrl] = useState(item?.imageUrl ?? '');
  const [imageKey, setImageKey] = useState(item?.imageKey ?? '');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Stock state
  const [stockManaged, setStockManaged] = useState(item?.stockManaged ?? false);
  const [stockRemaining, setStockRemaining] = useState(item?.stockRemaining != null ? String(item.stockRemaining) : '');
  const [stockLimit, setStockLimit] = useState(item?.stockLimit != null ? String(item.stockLimit) : '');

  // Recipe state
  const [availableIngredients, setAvailableIngredients] = useState<IngredientV2[]>([]);
  const [recipeRows, setRecipeRows] = useState<RecipeRow[]>([]);
  const [loadingRecipe, setLoadingRecipe] = useState(false);
  const [savingRecipe, setSavingRecipe] = useState(false);

  // General form state
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load ingredients & current item recipe
  useEffect(() => {
    let mounted = true;
    const loadRecipeData = async () => {
      setLoadingRecipe(true);
      try {
        const [allIngs, itemRecipes] = await Promise.all([
          fetchIngredientsV2Admin(),
          item?.sku ? fetchProductRecipeV2Admin(item.sku) : Promise.resolve([])
        ]);
        if (!mounted) return;
        setAvailableIngredients(allIngs);
        setRecipeRows(itemRecipes.map((r) => ({ ingredientId: r.ingredientId, quantityPerUnit: r.quantityPerUnit })));
      } catch (e) {
        if (!mounted) return;
        console.error("Error cargando receta", e);
      } finally {
        if (mounted) setLoadingRecipe(false);
      }
    };
    loadRecipeData();
    return () => { mounted = false; };
  }, [item?.sku]);

  // Image helpers
  const imagePreviewUrl = selectedFile
    ? URL.createObjectURL(selectedFile)
    : imageUrl || (imageKey ? `/api/assets-v2/${imageKey.split('/').map(encodeURIComponent).join('/')}` : undefined);

  const handleUploadImage = async () => {
    if (!selectedFile || isCreating) return;
    if (selectedFile.size > MAX_IMAGE_BYTES) {
      setImageError("La imagen debe pesar menos de 5 MB");
      return;
    }
    setUploadingImage(true);
    setImageError(null);
    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      const res = await fetch(`/api/menu-v2-admin/items/${encodeURIComponent(sku)}/image`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });
      const data = await res.json() as { ok: boolean; imageKey?: string; assetUrl?: string; error?: string };
      if (!res.ok || !data.ok) throw new Error(data.error ?? "Error al subir imagen");
      setImageKey(data.imageKey ?? '');
      if (data.assetUrl) setImageUrl(data.assetUrl);
      setSelectedFile(null);
    } catch (e) {
      setImageError(e instanceof Error ? e.message : "Error al subir imagen");
    } finally {
      setUploadingImage(false);
    }
  };

  // Recipe row handlers
  const addRecipeRow = () => {
    if (!availableIngredients.length) return;
    const unusedIng = availableIngredients.find((ing) => !recipeRows.some((r) => r.ingredientId === ing.id));
    const nextId = unusedIng ? unusedIng.id : availableIngredients[0]!.id;
    setRecipeRows((prev) => [...prev, { ingredientId: nextId, quantityPerUnit: 1 }]);
  };

  const updateRecipeRow = (index: number, patch: Partial<RecipeRow>) => {
    setRecipeRows((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], ...patch };
      return next;
    });
  };

  const removeRecipeRow = (index: number) => {
    setRecipeRows((prev) => prev.filter((_, i) => i !== index));
  };

  // Save product form
  const handleSave = async () => {
    setError(null);
    const effectiveSku = sku.trim() ? sku.trim().toUpperCase() : name.trim().toUpperCase().replace(/[^A-Z0-9]+/g, '-');
    if (!name.trim()) { setError("Nombre de producto requerido"); return; }
    if (!(Number(price) >= 0)) { setError("Precio inválido"); return; }

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
          description: description.trim(),
          price: Number(price),
          category,
          isAvailable,
          isFeatured,
          badge: badge.trim() || null,
          sortOrder: Number(sortOrder) || 10,
          imageUrl: imageUrl.trim() || null,
          imageKey: imageKey.trim() || null,
          stockManaged,
          stockLimit: stockManaged && stockLimit ? Number(stockLimit) : null,
          stockRemaining: stockManaged && stockRemaining ? Number(stockRemaining) : null,
        }),
      });

      const data = await res.json() as { ok: boolean; error?: string };
      if (!res.ok || !data.ok) throw new Error(data.error ?? "Error al guardar producto");

      // Save recipe if rows exist or updated
      if (recipeRows.length > 0) {
        setSavingRecipe(true);
        await saveProductRecipeV2Admin(effectiveSku, recipeRows.map(r => ({ ingredientId: r.ingredientId, quantityPerUnit: Number(r.quantityPerUnit) || 1 })));
      }

      onSaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al guardar");
    } finally {
      setSaving(false);
      setSavingRecipe(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm transition-opacity">
      <div className="w-full max-w-2xl bg-zinc-950 border-l border-zinc-800 text-zinc-100 flex flex-col h-full shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-900/60">
          <div>
            <h3 className="text-lg font-black text-amber-100">{isCreating ? "Crear Producto Nuevo" : `Editar: ${name || sku}`}</h3>
            <p className="text-xs text-zinc-400">{isCreating ? "Asigna nombre, precio, receta e imágenes" : `SKU: ${sku}`}</p>
          </div>
          <button type="button" onClick={onClose} className="p-2 rounded-xl text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100 text-lg">
            ✕
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {error ? <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-700/50 text-xs text-rose-200">{error}</div> : null}

          {/* Datos Generales */}
          <div className="space-y-4">
            <h4 className="text-xs font-black uppercase tracking-widest text-amber-400">1. Datos del Producto</h4>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs uppercase tracking-widest text-zinc-400 font-bold">SKU</label>
                <input
                  className="w-full mt-1 px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-100 text-sm font-mono focus:border-amber-400 outline-none"
                  value={sku}
                  readOnly={!isCreating}
                  onChange={(e) => setSku(e.target.value.toUpperCase().replace(/[^A-Z0-9-]+/g, '-'))}
                  placeholder="ej. BRG-OG"
                />
              </div>
              <div>
                <label className="text-xs uppercase tracking-widest text-zinc-400 font-bold">Nombre del Producto</label>
                <input
                  className="w-full mt-1 px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-100 text-sm focus:border-amber-400 outline-none font-bold"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="ej. Cheeseburger Smash"
                />
              </div>
            </div>

            <div>
              <label className="text-xs uppercase tracking-widest text-zinc-400 font-bold">Descripción</label>
              <textarea
                className="w-full mt-1 px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-100 text-sm min-h-[70px] focus:border-amber-400 outline-none"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Descripción amigable de ingredientes..."
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-xs uppercase tracking-widest text-zinc-400 font-bold">Precio ($ MXN)</label>
                <input
                  className="w-full mt-1 px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-100 text-sm font-bold focus:border-amber-400 outline-none"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="85.00"
                />
              </div>
              <div>
                <label className="text-xs uppercase tracking-widest text-zinc-400 font-bold">Categoría</label>
                <select
                  className="w-full mt-1 px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-100 text-sm focus:border-amber-400 outline-none"
                  value={category}
                  onChange={(e) => setCategory(e.target.value as MenuCategory['key'])}
                >
                  <option value="burgers">🍔 Hamburguesas</option>
                  <option value="combos">🔥 Combos</option>
                  <option value="guarniciones">🍟 Guarniciones</option>
                  <option value="drinks">🥤 Bebidas</option>
                  <option value="extras">🧀 Extras</option>
                </select>
              </div>
              <div>
                <label className="text-xs uppercase tracking-widest text-zinc-400 font-bold">Orden Visual</label>
                <input
                  className="w-full mt-1 px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-100 text-sm focus:border-amber-400 outline-none"
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value)}
                  placeholder="10"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 p-3 rounded-xl border border-zinc-800 bg-zinc-900/50">
              <label className="flex items-center gap-2 text-xs font-bold cursor-pointer text-zinc-200">
                <input type="checkbox" checked={isAvailable} onChange={(e) => setIsAvailable(e.target.checked)} className="rounded" />
                ✓ Disponible
              </label>
              <label className="flex items-center gap-2 text-xs font-bold cursor-pointer text-amber-300">
                <input type="checkbox" checked={isFeatured} onChange={(e) => setIsFeatured(e.target.checked)} className="rounded" />
                ⭐ Destacado
              </label>
              <div className="col-span-1">
                <input
                  className="w-full px-2 py-1 text-xs rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-200 placeholder-zinc-500"
                  value={badge}
                  onChange={(e) => setBadge(e.target.value)}
                  placeholder="Badge (ej. Best Seller)"
                />
              </div>
            </div>
          </div>

          {/* 🥬 Receta e Ingredientes D1 */}
          <div className="space-y-3 pt-4 border-t border-zinc-800">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-black uppercase tracking-widest text-emerald-400">2. Receta de Ingredientes (Single Source)</h4>
                <p className="text-[11px] text-zinc-400">Los ingredientes vinculados se muestran al cliente y habilitan remociones en KDS.</p>
              </div>
              <Button type="button" className="text-xs bg-zinc-800 border border-zinc-700 text-zinc-200 py-1 px-3 min-h-0" onClick={addRecipeRow}>
                + Agregar Ingrediente
              </Button>
            </div>

            {loadingRecipe ? (
              <p className="text-xs text-zinc-400 py-2">Cargando receta de ingrediente...</p>
            ) : recipeRows.length === 0 ? (
              <div className="p-3 rounded-xl border border-dashed border-zinc-800 bg-zinc-900/30 text-center text-xs text-zinc-500">
                Sin ingredientes en la receta. Haz clic en <strong>+ Agregar Ingrediente</strong> para vincular.
              </div>
            ) : (
              <div className="space-y-2">
                {recipeRows.map((row, index) => {
                  const selectedIng = availableIngredients.find((i) => i.id === row.ingredientId);
                  return (
                    <div key={index} className="flex items-center gap-2 p-2 rounded-xl border border-zinc-800 bg-zinc-900/60">
                      <select
                        className="flex-1 px-2 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-zinc-200 outline-none"
                        value={row.ingredientId}
                        onChange={(e) => updateRecipeRow(index, { ingredientId: e.target.value })}
                      >
                        {availableIngredients.map((ing) => (
                          <option key={ing.id} value={ing.id}>
                            {ing.name} ({ing.unit})
                          </option>
                        ))}
                      </select>
                      <span className="text-xs text-zinc-400">Cant:</span>
                      <input
                        className="w-16 px-2 py-1 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-zinc-200 text-center font-bold"
                        type="number"
                        min="1"
                        value={row.quantityPerUnit}
                        onChange={(e) => updateRecipeRow(index, { quantityPerUnit: Number(e.target.value) || 1 })}
                      />
                      <span className="text-xs text-zinc-500 font-mono">{selectedIng?.unit || 'pieza'}</span>
                      <button
                        type="button"
                        onClick={() => removeRecipeRow(index)}
                        className="p-1 text-rose-400 hover:text-rose-200 text-xs font-bold"
                      >
                        ✕
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Imagen y Asset R2 */}
          <div className="space-y-3 pt-4 border-t border-zinc-800">
            <h4 className="text-xs font-black uppercase tracking-widest text-cyan-400">3. Fotografía del Producto (Cloudflare R2)</h4>
            <div className="flex gap-4 items-start p-3 rounded-xl border border-cyan-500/20 bg-cyan-950/10">
              <div className="w-24 h-24 rounded-xl border border-zinc-800 bg-zinc-900 overflow-hidden flex items-center justify-center shrink-0">
                {imagePreviewUrl ? (
                  <img src={imagePreviewUrl} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-xs text-zinc-500 text-center">Sin imagen</span>
                )}
              </div>
              <div className="flex-1 min-w-0 space-y-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={ACCEPTED_IMAGE_TYPES.join(',')}
                  disabled={uploadingImage || isCreating}
                  onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)}
                  className="block w-full text-xs text-zinc-400 file:mr-2 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-cyan-500/20 file:text-cyan-300"
                />
                {isCreating ? (
                  <p className="text-[11px] text-amber-300">Guarda el producto primero para habilitar la subida directa a R2.</p>
                ) : (
                  <Button
                    type="button"
                    className="w-full bg-cyan-400 text-black text-xs font-bold py-1.5 min-h-0 disabled:opacity-40"
                    disabled={!selectedFile || uploadingImage}
                    onClick={handleUploadImage}
                  >
                    {uploadingImage ? "Subiendo a R2…" : "Subir Fotografía"}
                  </Button>
                )}
                {imageError ? <p className="text-xs text-rose-300">{imageError}</p> : null}
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center gap-3 px-6 py-4 border-t border-zinc-800 bg-zinc-900/80">
          <Button type="button" className="flex-1 border border-zinc-700 bg-zinc-900 text-zinc-200" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button type="button" className="flex-1 bg-amber-400 text-zinc-950 font-bold disabled:opacity-40" onClick={handleSave} disabled={saving || savingRecipe}>
            {saving || savingRecipe ? "Guardando…" : "Guardar Producto"}
          </Button>
        </div>
      </div>
    </div>
  );
}
