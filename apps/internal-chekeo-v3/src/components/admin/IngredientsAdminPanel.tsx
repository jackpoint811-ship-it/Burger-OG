/**
 * IngredientsAdminPanel.tsx — Chekeo V3
 *
 * Submódulo de Administración de Insumos, Materia Prima, Recetas y Costeo de Producción.
 * Integrado con Dynamic UI Components (@ui/kpi-card, @ui/drawer, @ui/badge, @ui/button),
 * calculadora de Food Cost % y Margen Bruto en tiempo real conectada a Cloudflare D1 y Resumen K.
 */

import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  Search,
  CheckCircle2,
  TrendingUp,
  Percent,
  AlertCircle,
} from 'lucide-react';
import type { IngredientV2, IngredientV2Unit, MenuItem } from '@config/index';
import { Button } from '@ui/button';
import { Badge } from '@ui/badge';
import { KpiCard } from '@ui/kpi-card';
import { Drawer } from '@ui/drawer';
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
  const [searchIngQuery, setSearchIngQuery] = useState<string>('');
  const { items } = useAdminMenu();
  const {
    ingredients,
    recipes,
    isLoading,
    createIngredientMutation,
    updateIngredientMutation,
    updateRecipesMutation,
  } = useAdminIngredients(selectedSku);

  const [isIngredientDrawerOpen, setIsIngredientDrawerOpen] = useState(false);
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

  // Seleccionar primer SKU disponible si no está seleccionado
  useEffect(() => {
    if (items.length > 0 && !items.some((i) => i.sku === selectedSku)) {
      setSelectedSku(items[0].sku);
    }
  }, [items, selectedSku]);

  // Producto actualmente seleccionado
  const selectedProduct = useMemo(() => {
    return items.find((i) => i.sku === selectedSku) || items[0] || null;
  }, [items, selectedSku]);

  // Insumos filtrados por búsqueda
  const filteredIngredients = useMemo(() => {
    if (!searchIngQuery.trim()) return ingredients;
    const q = searchIngQuery.toLowerCase();
    return ingredients.filter((ing) => ing.name.toLowerCase().includes(q) || ing.unit.toLowerCase().includes(q));
  }, [ingredients, searchIngQuery]);

  // Costeo en Tiempo Real de la Receta
  const costAnalysis = useMemo(() => {
    let totalRecipeCost = 0;

    ingredients.forEach((ing) => {
      const qty =
        recipeQuantities[ing.id] ??
        (recipes.find((r) => r.ingredientId === ing.id)?.quantityPerUnit ?? 0);

      if (qty > 0 && ing.unitPriceCents != null) {
        totalRecipeCost += (ing.unitPriceCents / 100) * qty;
      }
    });

    const menuPrice = selectedProduct?.price ?? 0;
    const grossMargin = Math.max(0, menuPrice - totalRecipeCost);
    const foodCostPct = menuPrice > 0 ? (totalRecipeCost / menuPrice) * 100 : 0;
    const marginPct = menuPrice > 0 ? (grossMargin / menuPrice) * 100 : 0;

    return {
      totalRecipeCost,
      menuPrice,
      grossMargin,
      foodCostPct,
      marginPct,
    };
  }, [ingredients, recipes, recipeQuantities, selectedProduct]);

  const handleOpenCreateIngredient = () => {
    setEditingIngredient(null);
    setIngName('');
    setIngUnit('pieza');
    setIngPriceCents('0');
    setIngSortOrder(String(ingredients.length + 1));
    setIngIsActive(true);
    setIsIngredientDrawerOpen(true);
  };

  const handleOpenEditIngredient = (ing: IngredientV2) => {
    setEditingIngredient(ing);
    setIngName(ing.name);
    setIngUnit(ing.unit);
    setIngPriceCents(ing.unitPriceCents != null ? String(ing.unitPriceCents / 100) : '');
    setIngSortOrder(String(ing.sortOrder ?? 0));
    setIngIsActive(ing.isActive);
    setIsIngredientDrawerOpen(true);
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
        setNotice(`Insumo "${ingName}" actualizado con éxito.`);
      } else {
        await createIngredientMutation.mutateAsync({
          name: ingName.trim(),
          unit: ingUnit,
          unitPriceCents,
          sortOrder: Number(ingSortOrder) || 0,
          isActive: ingIsActive,
        });
        setNotice(`Insumo "${ingName}" registrado en D1.`);
      }
      setIsIngredientDrawerOpen(false);
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
      setNotice(`✓ Receta de ${selectedProduct?.name || selectedSku} guardada y sincronizada con Resumen K.`);
      setTimeout(() => setNotice(null), 3500);
    } catch {
      // Handled
    }
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-300">
      {/* Toast Flotante */}
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

      {/* 1. Tarjetas KPI Reactivas de Costeo (@ui/kpi-card) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard
          title="Total Insumos D1"
          value={ingredients.length}
          subtitle="Materia prima activa"
          icon={<Wheat className="w-4 h-4" />}
          variant="default"
        />
        <KpiCard
          title="Costo de Receta"
          value={`$${costAnalysis.totalRecipeCost.toFixed(2)}`}
          subtitle={`Para 1x ${selectedProduct?.name || selectedSku}`}
          icon={<DollarSign className="w-4 h-4" />}
          variant="accent"
        />
        <KpiCard
          title="Margen Bruto"
          value={`$${costAnalysis.grossMargin.toFixed(2)}`}
          subtitle={`${costAnalysis.marginPct.toFixed(1)}% de utilidad`}
          icon={<TrendingUp className="w-4 h-4" />}
          variant={costAnalysis.marginPct >= 65 ? 'success' : 'warning'}
        />
        <KpiCard
          title="Food Cost %"
          value={`${costAnalysis.foodCostPct.toFixed(1)}%`}
          subtitle={`Precio venta: $${costAnalysis.menuPrice.toFixed(2)}`}
          icon={<Percent className="w-4 h-4" />}
          variant={costAnalysis.foodCostPct <= 35 ? 'success' : 'warning'}
        />
      </div>

      {/* 2. Banner de Cabecera con Botón de Nuevo Insumo */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-surface-card p-4 rounded-3xl border border-line shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-accent/15 text-accent flex items-center justify-center font-bold shrink-0">
            <Scale className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-black text-text-primary">
              Materia Prima & Recetario K
            </h3>
            <p className="text-xs text-text-secondary">
              Configura gramajes y piezas por producto para abastecimiento del turno y costeo exacto.
            </p>
          </div>
        </div>

        <Button
          type="button"
          onClick={handleOpenCreateIngredient}
          className="text-xs font-black bg-accent text-white h-8.5 px-3 rounded-xl cursor-pointer active:scale-95 self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5 mr-1" />
          Nuevo Insumo
        </Button>
      </div>

      {/* 3. Grid Dual: Insumos Registrados vs Receta del Producto */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
        {/* Panel Izquierdo: Catálogo de Insumos */}
        <div className="bg-surface-card rounded-3xl border border-line p-5 sm:p-6 shadow-card space-y-4">
          <div className="flex items-center justify-between gap-2">
            <h4 className="text-sm font-black text-text-primary flex items-center gap-2">
              <Wheat className="w-4 h-4 text-accent" />
              Insumos Registrados ({filteredIngredients.length})
            </h4>

            <div className="relative w-40">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted" />
              <input
                type="text"
                placeholder="Buscar..."
                value={searchIngQuery}
                onChange={(e) => setSearchIngQuery(e.target.value)}
                className="w-full pl-7 pr-2.5 py-1 text-xs rounded-xl bg-surface-raised border border-line text-text-primary outline-none focus:border-accent font-medium"
              />
            </div>
          </div>

          <div className="space-y-2 max-h-[460px] overflow-y-auto pr-1">
            {filteredIngredients.map((ing) => (
              <div
                key={ing.id}
                className="p-3 rounded-2xl bg-surface-raised border border-line flex items-center justify-between gap-2 hover:border-accent/30 transition-all"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-text-primary">{ing.name}</span>
                    <Badge variant="outline" className="text-[10px] font-mono">
                      {ing.unit}
                    </Badge>
                  </div>
                  {ing.unitPriceCents != null && (
                    <p className="text-[11px] text-text-secondary font-mono mt-0.5">
                      Costo: ${(ing.unitPriceCents / 100).toFixed(2)} MXN / {ing.unit}
                    </p>
                  )}
                </div>

                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => handleOpenEditIngredient(ing)}
                  className="text-xs h-7 px-2.5 rounded-lg font-bold cursor-pointer active:scale-95"
                >
                  <Edit2 className="w-3 h-3 mr-1" />
                  Editar
                </Button>
              </div>
            ))}
          </div>
        </div>

        {/* Panel Derecho: Receta del Producto Seleccionado */}
        <div className="bg-surface-card rounded-3xl border border-line p-5 sm:p-6 shadow-card space-y-4">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <h4 className="text-sm font-black text-text-primary flex items-center gap-2">
              <UtensilsCrossed className="w-4 h-4 text-accent" />
              Receta de Producción
            </h4>

            {/* Selector de Platillo */}
            <select
              value={selectedSku}
              onChange={(e) => setSelectedSku(e.target.value)}
              className="px-3 py-1.5 text-xs rounded-xl bg-surface-raised border border-line text-text-primary font-black outline-none focus:border-accent"
            >
              {items.map((item) => (
                <option key={item.sku} value={item.sku}>
                  {item.name} (${item.price.toFixed(2)})
                </option>
              ))}
            </select>
          </div>

          {/* Barra de Rentabilidad Visual */}
          <div className="p-3 rounded-2xl bg-surface-raised border border-line space-y-2">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-text-secondary">Rentabilidad de {selectedProduct?.name}:</span>
              <span className="font-mono text-accent">{costAnalysis.marginPct.toFixed(1)}% Margen</span>
            </div>
            <div className="h-2.5 w-full rounded-full bg-surface-card border border-line overflow-hidden flex">
              <div
                style={{ width: `${Math.min(100, costAnalysis.marginPct)}%` }}
                className={`transition-all rounded-full ${
                  costAnalysis.marginPct >= 65 ? 'bg-emerald-500' : costAnalysis.marginPct >= 50 ? 'bg-amber-500' : 'bg-red-500'
                }`}
              />
            </div>
          </div>

          <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
            {ingredients.map((ing) => {
              const currentQty =
                recipeQuantities[ing.id] ??
                (recipes.find((r) => r.ingredientId === ing.id)?.quantityPerUnit ?? 0);

              return (
                <div
                  key={ing.id}
                  className="p-3 rounded-2xl bg-surface-raised border border-line flex items-center justify-between gap-3"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-text-primary truncate">
                      {ing.name}
                    </p>
                    <p className="text-[10px] text-text-muted font-mono">
                      {ing.unitPriceCents != null ? `$${((ing.unitPriceCents / 100) * (currentQty || 0)).toFixed(2)} MXN` : 'Sin costo'}
                    </p>
                  </div>

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
                      className="w-16 px-2 py-1 text-xs rounded-xl bg-surface-card border border-line text-text-primary font-black font-mono outline-none focus:border-accent text-right"
                    />
                    <span className="text-[11px] font-bold text-text-muted w-10">{ing.unit}</span>
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
              className="text-xs font-black bg-accent text-white px-5 rounded-xl cursor-pointer active:scale-95"
            >
              <Check className="w-3.5 h-3.5 mr-1" />
              {updateRecipesMutation.isPending ? 'Guardando...' : `Guardar Receta de ${selectedProduct?.name || selectedSku}`}
            </Button>
          </div>
        </div>
      </div>

      {/* 4. Drawer de Creación / Edición de Insumo */}
      <Drawer
        open={isIngredientDrawerOpen}
        onClose={() => setIsIngredientDrawerOpen(false)}
        title={
          <div className="flex items-center gap-2">
            <Wheat className="w-5 h-5 text-accent" />
            <span>{editingIngredient ? 'Editar Insumo' : 'Registrar Nuevo Insumo'}</span>
          </div>
        }
        description="Agrega materia prima para costeo y cálculo del Mise en Place diario."
        className="max-w-md"
      >
        <form onSubmit={handleSaveIngredient} className="space-y-4 pt-1">
          <div>
            <label className="block text-[11px] font-bold text-text-secondary mb-1">
              Nombre del Insumo *
            </label>
            <input
              type="text"
              required
              placeholder="Ej. Carne Smash 90g, Pan Brioche..."
              value={ingName}
              onChange={(e) => setIngName(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl bg-surface-raised border border-line text-text-primary outline-none focus:border-accent font-bold"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-text-secondary mb-1">
                Unidad de Medida *
              </label>
              <select
                value={ingUnit}
                onChange={(e) => setIngUnit(e.target.value as IngredientV2Unit)}
                className="w-full px-3 py-2 text-xs rounded-xl bg-surface-raised border border-line text-text-primary outline-none focus:border-accent font-bold"
              >
                {UNIT_OPTIONS.map((u) => (
                  <option key={u.value} value={u.value}>
                    {u.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-text-secondary mb-1">
                Costo Unitario ($ MXN)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                placeholder="15.50"
                value={ingPriceCents}
                onChange={(e) => setIngPriceCents(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl bg-surface-raised border border-line text-text-primary outline-none focus:border-accent font-mono font-bold"
              />
            </div>
          </div>

          <div className="pt-2 border-t border-line flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsIngredientDrawerOpen(false)}
              className="text-xs rounded-xl"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={createIngredientMutation.isPending || updateIngredientMutation.isPending}
              className="text-xs font-black bg-accent text-white rounded-xl cursor-pointer active:scale-95"
            >
              <Check className="w-3.5 h-3.5 mr-1" />
              {editingIngredient ? 'Actualizar Insumo' : 'Guardar Insumo'}
            </Button>
          </div>
        </form>
      </Drawer>
    </div>
  );
}
