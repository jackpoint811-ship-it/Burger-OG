/**
 * IngredientsAdminPanel.tsx — PR-V3-12
 *
 * Submódulo de Administración de Insumos, Ingredientes y Recetas por Producto.
 * Permite gestionar costos unitarios y cantidades necesarias para el Resumen K de Cocina.
 */

import React, { useState } from 'react';
import {
  Wheat,
  Plus,
  Edit2,
  Trash2,
  Check,
  X,
  Sparkles,
  UtensilsCrossed,
  DollarSign,
  Scale,
  RefreshCw,
} from 'lucide-react';
import type { IngredientV2, IngredientV2Unit, MenuItem } from '@config/index';
import { Button } from '@ui/button';
import { Badge } from '@ui/badge';
import { useAdminIngredients, useAdminMenu } from '../../features/admin/hooks/use-admin';

const UNIT_OPTIONS: Array<{ value: IngredientV2Unit; label: string }> = [
  { value: 'pieza', label: 'Pieza (pza)' },
  { value: 'g', label: 'Gramos (g)' },
  { value: 'kg', label: 'Kilogramos (kg)' },
  { value: 'ml', label: 'Mililitros (ml)' },
  { value: 'l', label: 'Litros (l)' },
  { value: 'paquete', label: 'Paquete' },
  { value: 'bolsa', label: 'Bolsa' },
];

export interface IngredientsAdminPanelProps {
  activeToolId?: string;
  onSelectTool?: (toolId: string) => void;
}

export function IngredientsAdminPanel({ activeToolId, onSelectTool }: IngredientsAdminPanelProps = {}) {
  const [selectedSku, setSelectedSku] = useState<string>('BURGER-OG');
  const { items } = useAdminMenu();
  const {
    ingredients,
    recipes,
    isLoading,
    createIngredientMutation,
    updateIngredientMutation,
    updateRecipesMutation,
  } = useAdminIngredients(selectedSku);

  const [isIngredientModalOpen, setIsIngredientModalOpen] = useState(false);
  const [editingIngredient, setEditingIngredient] = useState<IngredientV2 | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  // Form State for Ingredient
  const [ingName, setIngName] = useState('');
  const [ingUnit, setIngUnit] = useState<IngredientV2Unit>('pieza');
  const [ingPriceCents, setIngPriceCents] = useState('');
  const [ingSortOrder, setIngSortOrder] = useState('0');
  const [ingIsActive, setIngIsActive] = useState(true);

  // Recipe editing state
  const [recipeQuantities, setRecipeQuantities] = useState<Record<string, number>>({});

  const handleOpenCreateIngredient = () => {
    setEditingIngredient(null);
    setIngName('');
    setIngUnit('pieza');
    setIngPriceCents('0');
    setIngSortOrder(String(ingredients.length + 1));
    setIngIsActive(true);
    setIsIngredientModalOpen(true);
  };

  const handleOpenEditIngredient = (ing: IngredientV2) => {
    setEditingIngredient(ing);
    setIngName(ing.name);
    setIngUnit(ing.unit);
    setIngPriceCents(ing.unitPriceCents != null ? String(ing.unitPriceCents / 100) : '');
    setIngSortOrder(String(ing.sortOrder ?? 0));
    setIngIsActive(ing.isActive);
    setIsIngredientModalOpen(true);
  };

  const handleSaveIngredient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ingName.trim()) return;

    const pricePesos = Number(ingPriceCents);
    const unitPriceCents = Number.isFinite(pricePesos) && pricePesos >= 0 ? Math.round(pricePesos * 100) : null;

    try {
      if (editingIngredient) {
        await updateIngredientMutation.mutateAsync({
          id: editingIngredient.id,
          payload: {
            name: ingName.trim(),
            unit: ingUnit,
            unitPriceCents,
            sortOrder: Number(ingSortOrder) || 0,
            isActive: ingIsActive,
          },
        });
        setNotice(`Ingrediente ${ingName} actualizado.`);
      } else {
        await createIngredientMutation.mutateAsync({
          name: ingName.trim(),
          unit: ingUnit,
          unitPriceCents,
          sortOrder: Number(ingSortOrder) || 0,
          isActive: ingIsActive,
        });
        setNotice(`Ingrediente ${ingName} registrado con éxito.`);
      }
      setIsIngredientModalOpen(false);
      setTimeout(() => setNotice(null), 3000);
    } catch {
      // Handled
    }
  };

  const handleSaveRecipe = async () => {
    const list = Object.entries(recipeQuantities)
      .filter(([_, qty]) => qty > 0)
      .map(([ingredientId, quantityPerUnit]) => ({
        ingredientId,
        quantityPerUnit,
      }));

    try {
      await updateRecipesMutation.mutateAsync({
        sku: selectedSku,
        recipes: list,
      });
      setNotice(`Receta de ${selectedSku} guardada.`);
      setTimeout(() => setNotice(null), 3000);
    } catch {
      // Handled
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {notice && (
        <div className="p-3 rounded-2xl bg-accent-soft border border-accent/20 text-accent text-xs font-bold flex items-center justify-between">
          <span>{notice}</span>
          <button onClick={() => setNotice(null)} className="opacity-70 hover:opacity-100">
            ×
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-surface-card p-5 rounded-3xl border border-line shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-accent-soft text-accent flex items-center justify-center font-bold shrink-0">
            <Wheat className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-text-primary">
              Catálogo Maestro de Insumos & Recetas
            </h3>
            <p className="text-xs text-text-secondary">
              Gestiona los ingredientes de producción para abastecimiento y costeo en Resumen K.
            </p>
          </div>
        </div>

        <Button
          type="button"
          onClick={handleOpenCreateIngredient}
          className="text-xs font-bold bg-accent text-white"
        >
          <Plus className="w-4 h-4 mr-1" />
          Nuevo Insumo
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Lista de Insumos Maestros */}
        <div className="bg-surface-card rounded-3xl border border-line p-6 shadow-card space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-text-primary flex items-center gap-2">
              <Scale className="w-4 h-4 text-accent" />
              Insumos Registrados ({ingredients.length})
            </h4>
          </div>

          <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
            {ingredients.map((ing) => (
              <div
                key={ing.id}
                className="p-3.5 rounded-2xl bg-surface-raised/40 border border-line flex items-center justify-between gap-2 hover:border-accent/30 transition-all"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-text-primary">{ing.name}</span>
                    <Badge variant="outline" className="text-[10px]">
                      {ing.unit}
                    </Badge>
                  </div>
                  {ing.unitPriceCents != null && (
                    <span className="text-[11px] text-text-secondary">
                      Costo estimado: ${(ing.unitPriceCents / 100).toFixed(2)} por {ing.unit}
                    </span>
                  )}
                </div>

                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => handleOpenEditIngredient(ing)}
                  className="text-xs h-7 px-2.5 rounded-lg"
                >
                  <Edit2 className="w-3 h-3 mr-1" />
                  Editar
                </Button>
              </div>
            ))}
          </div>
        </div>

        {/* Editor de Receta por Producto */}
        <div className="bg-surface-card rounded-3xl border border-line p-6 shadow-card space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-text-primary flex items-center gap-2">
              <UtensilsCrossed className="w-4 h-4 text-accent" />
              Receta por Producto
            </h4>

            {/* Selector de Producto */}
            <select
              value={selectedSku}
              onChange={(e) => setSelectedSku(e.target.value)}
              className="px-3 py-1.5 text-xs rounded-xl bg-surface-raised border border-line text-text-primary font-bold outline-none focus:border-accent"
            >
              {items.map((item) => (
                <option key={item.sku} value={item.sku}>
                  {item.name} ({item.sku})
                </option>
              ))}
            </select>
          </div>

          <p className="text-xs text-text-secondary">
            Indica las porciones de cada insumo requeridas para preparar 1 unidad de {selectedSku}.
          </p>

          <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
            {ingredients.map((ing) => {
              const currentQty =
                recipeQuantities[ing.id] ??
                (recipes.find((r) => r.ingredientId === ing.id)?.quantityPerUnit ?? 0);

              return (
                <div
                  key={ing.id}
                  className="p-3 rounded-2xl bg-surface-raised/40 border border-line flex items-center justify-between gap-3"
                >
                  <span className="text-xs font-semibold text-text-primary truncate">
                    {ing.name} ({ing.unit})
                  </span>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      value={currentQty}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setRecipeQuantities((prev) => ({ ...prev, [ing.id]: val }));
                      }}
                      className="w-20 px-2 py-1 text-xs rounded-xl bg-surface-card border border-line text-text-primary font-bold font-mono outline-none focus:border-accent text-right"
                    />
                    <span className="text-[10px] text-text-muted w-8">{ing.unit}</span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-2 border-t border-line flex items-center justify-end">
            <Button
              type="button"
              onClick={handleSaveRecipe}
              disabled={updateRecipesMutation.isPending}
              className="text-xs font-bold bg-accent text-white"
            >
              <Check className="w-3.5 h-3.5 mr-1" />
              Guardar Receta de {selectedSku}
            </Button>
          </div>
        </div>
      </div>

      {/* Modal Crear / Editar Insumo */}
      {isIngredientModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-surface-card w-full max-w-md rounded-3xl border border-line shadow-2xl p-6 space-y-4">
            <h3 className="text-base font-bold text-text-primary">
              {editingIngredient ? 'Editar Insumo' : 'Registrar Nuevo Insumo'}
            </h3>

            <form onSubmit={handleSaveIngredient} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1">
                  Nombre del Insumo *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Carne Smash 90g, Pan Brioche..."
                  value={ingName}
                  onChange={(e) => setIngName(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-surface-raised border border-line text-text-primary outline-none focus:border-accent font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-text-secondary mb-1">
                    Unidad de Medida *
                  </label>
                  <select
                    value={ingUnit}
                    onChange={(e) => setIngUnit(e.target.value as IngredientV2Unit)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-surface-raised border border-line text-text-primary outline-none focus:border-accent"
                  >
                    {UNIT_OPTIONS.map((u) => (
                      <option key={u.value} value={u.value}>
                        {u.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-text-secondary mb-1">
                    Costo por Unidad ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="15.50"
                    value={ingPriceCents}
                    onChange={(e) => setIngPriceCents(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-surface-raised border border-line text-text-primary outline-none focus:border-accent font-bold"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsIngredientModalOpen(false)}
                  className="text-xs"
                >
                  Cancelar
                </Button>
                <Button type="submit" className="text-xs font-bold bg-accent text-white">
                  Guardar Insumo
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
