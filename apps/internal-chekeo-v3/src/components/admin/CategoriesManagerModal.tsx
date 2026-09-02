/**
 * CategoriesManagerModal.tsx — Burgers.exe V3 Chekeo Admin
 *
 * Modal accesible de Administración y Reordenamiento de Categorías del Catálogo.
 * Permite:
 * - Reordenar categorías mediante botones accesibles de desplazamiento (Arriba/Abajo).
 * - Editar nombres de categorías y asignar emojis visuales representativos.
 * - Crear nuevas categorías con slug autogenerado.
 * - Eliminar categorías no utilizadas con prevención referencial de productos huérfanos.
 * - Cumple con las directrices de diseño UI/UX Pro Max (WCAG AA, targets táctiles >= 44px).
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Layers,
  ChevronUp,
  ChevronDown,
  Plus,
  Trash2,
  Check,
  AlertTriangle,
  Sparkles,
  Info,
} from 'lucide-react';
import type { MenuCategory, MenuItem } from '@config/index';
import { Button } from '@ui/button';
import { Badge } from '@ui/badge';

interface CategoriesManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: MenuCategory[];
  items: MenuItem[];
  onSaveCategories: (categories: MenuCategory[]) => Promise<void>;
  onDeleteCategory: (key: string) => Promise<void>;
  isSaving: boolean;
}

const POPULAR_EMOJIS = ['🍔', '🍟', '🥤', '🎁', '⚡', '🍗', '🥗', '🍦', '☕', '🍺', '🧀', '🥓', '🌭'];

export function CategoriesManagerModal({
  isOpen,
  onClose,
  categories: initialCategories,
  items,
  onSaveCategories,
  onDeleteCategory,
  isSaving,
}: CategoriesManagerModalProps) {
  const [categoriesList, setCategoriesList] = useState<MenuCategory[]>([]);
  const [newCatName, setNewCatName] = useState('');
  const [newCatKey, setNewCatKey] = useState('');
  const [newCatEmoji, setNewCatEmoji] = useState('🍔');
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);
  const [deletingKey, setDeletingKey] = useState<string | null>(null);

  // Sync state with props on open
  useEffect(() => {
    if (isOpen) {
      const sorted = [...initialCategories].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
      setCategoriesList(sorted);
      setErrorNotice(null);
      setSuccessNotice(null);
      setIsAddingNew(false);
      setNewCatName('');
      setNewCatKey('');
      setNewCatEmoji('🍔');
    }
  }, [isOpen, initialCategories]);

  // Compute item count map per category key
  const itemCountByCategory = useMemo(() => {
    const map = new Map<string, number>();
    for (const item of items) {
      const cat = item.category?.toLowerCase() || '';
      map.set(cat, (map.get(cat) || 0) + 1);
    }
    return map;
  }, [items]);

  if (!isOpen) return null;

  // Auto-generate key/slug from name
  const handleNameChange = (val: string) => {
    setNewCatName(val);
    const slug = val
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    setNewCatKey(slug);
  };

  // Move category up
  const handleMoveUp = (index: number) => {
    if (index <= 0) return;
    const next = [...categoriesList];
    const temp = next[index];
    next[index] = next[index - 1];
    next[index - 1] = temp;
    // Update sortOrder
    const reordered = next.map((cat, idx) => ({ ...cat, sortOrder: idx + 1 }));
    setCategoriesList(reordered);
  };

  // Move category down
  const handleMoveDown = (index: number) => {
    if (index >= categoriesList.length - 1) return;
    const next = [...categoriesList];
    const temp = next[index];
    next[index] = next[index + 1];
    next[index + 1] = temp;
    // Update sortOrder
    const reordered = next.map((cat, idx) => ({ ...cat, sortOrder: idx + 1 }));
    setCategoriesList(reordered);
  };

  // Edit category field
  const handleUpdateCategory = (index: number, field: keyof MenuCategory, value: any) => {
    setCategoriesList((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  // Add new category to list
  const handleAddCategory = () => {
    const trimmedName = newCatName.trim();
    const trimmedKey = newCatKey.trim().toLowerCase();

    if (!trimmedName) {
      setErrorNotice('El nombre de la categoría es obligatorio.');
      return;
    }

    if (!trimmedKey) {
      setErrorNotice('La clave (slug) de la categoría es obligatoria.');
      return;
    }

    if (!/^[a-z0-9-]+$/.test(trimmedKey)) {
      setErrorNotice('La clave debe contener solo letras minúsculas, números y guiones.');
      return;
    }

    if (categoriesList.some((c) => c.key.toLowerCase() === trimmedKey)) {
      setErrorNotice(`Ya existe una categoría con la clave "${trimmedKey}".`);
      return;
    }

    const newCategory: MenuCategory = {
      id: `cat-${trimmedKey}`,
      key: trimmedKey,
      name: trimmedName,
      emoji: newCatEmoji.trim() || undefined,
      sortOrder: categoriesList.length + 1,
    };

    setCategoriesList((prev) => [...prev, newCategory]);
    setNewCatName('');
    setNewCatKey('');
    setNewCatEmoji('🍔');
    setIsAddingNew(false);
    setErrorNotice(null);
    setSuccessNotice(`Categoría "${trimmedName}" agregada a la lista. Recuerda hacer clic en Guardar.`);
  };

  // Delete category with confirmation
  const handleDeleteCategory = async (cat: MenuCategory) => {
    const assigned = itemCountByCategory.get(cat.key.toLowerCase()) || 0;
    if (assigned > 0) {
      setErrorNotice(
        `No se puede eliminar "${cat.name}": tiene ${assigned} platillo(s) asignado(s). Reasigna o elimina los platillos antes.`
      );
      return;
    }

    try {
      setDeletingKey(cat.key);
      await onDeleteCategory(cat.key);
      setCategoriesList((prev) => prev.filter((c) => c.key !== cat.key));
      setSuccessNotice(`Categoría "${cat.name}" eliminada correctamente.`);
      setDeletingKey(null);
    } catch (err: any) {
      setErrorNotice(err?.message || 'Error al eliminar la categoría.');
      setDeletingKey(null);
    }
  };

  // Save all categories
  const handleSaveAll = async () => {
    setErrorNotice(null);
    setSuccessNotice(null);

    // Re-index sort order
    const toSave = categoriesList.map((cat, idx) => ({
      ...cat,
      sortOrder: idx + 1,
    }));

    try {
      await onSaveCategories(toSave);
      setSuccessNotice('¡Categorías actualizadas y guardadas con éxito!');
      setTimeout(() => {
        onClose();
      }, 700);
    } catch (err: any) {
      setErrorNotice(err?.message || 'Error al guardar los cambios de categorías.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="bg-surface-card w-full max-w-2xl rounded-3xl border border-line shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby="categories-modal-title"
      >
        {/* Header */}
        <div className="p-5 border-b border-line flex items-center justify-between bg-surface-raised/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-accent-soft text-accent flex items-center justify-center font-bold">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 id="categories-modal-title" className="text-base font-bold text-text-primary">
                  Gestor de Categorías
                </h3>
                <Badge variant="outline" className="text-[10px] font-bold">
                  {categoriesList.length} activas
                </Badge>
              </div>
              <p className="text-xs text-text-secondary">
                Configura el orden, emojis y nombres para la barra de navegación del menú público.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-text-secondary hover:text-text-primary hover:bg-surface-raised transition-colors"
            aria-label="Cerrar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Notices */}
        {errorNotice && (
          <div className="mx-5 mt-4 p-3 rounded-2xl bg-destructive/10 border border-destructive/20 text-destructive text-xs font-bold flex items-center justify-between animate-in slide-in-from-top-2 duration-200">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorNotice}</span>
            </div>
            <button onClick={() => setErrorNotice(null)} className="opacity-70 hover:opacity-100">
              ×
            </button>
          </div>
        )}

        {successNotice && (
          <div className="mx-5 mt-4 p-3 rounded-2xl bg-accent-soft border border-accent/20 text-accent text-xs font-bold flex items-center justify-between animate-in slide-in-from-top-2 duration-200">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 shrink-0" />
              <span>{successNotice}</span>
            </div>
            <button onClick={() => setSuccessNotice(null)} className="opacity-70 hover:opacity-100">
              ×
            </button>
          </div>
        )}

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {/* Tip Banner */}
          <div className="p-3.5 rounded-2xl bg-surface-raised border border-line flex items-start gap-2.5 text-xs text-text-secondary">
            <Info className="w-4 h-4 text-accent shrink-0 mt-0.5" />
            <p>
              El orden visual de arriba a abajo en esta lista corresponde al orden horizontal de izquierda a derecha en la app pública.
            </p>
          </div>

          {/* Categories List */}
          <div className="space-y-2">
            {categoriesList.map((cat, index) => {
              const assignedCount = itemCountByCategory.get(cat.key.toLowerCase()) || 0;
              const isFirst = index === 0;
              const isLast = index === categoriesList.length - 1;
              const isDeleting = deletingKey === cat.key;

              return (
                <div
                  key={cat.key || cat.id}
                  className="p-3 rounded-2xl bg-surface border border-line hover:border-accent/30 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs"
                >
                  {/* Left: Reorder controls & Emoji & Name */}
                  <div className="flex items-center gap-2.5 flex-1 min-w-0">
                    {/* Stepper buttons */}
                    <div className="flex flex-col gap-0.5">
                      <button
                        type="button"
                        onClick={() => handleMoveUp(index)}
                        disabled={isFirst}
                        className="w-6 h-5 rounded-md bg-surface-card border border-line flex items-center justify-center text-text-secondary hover:text-text-primary disabled:opacity-20 transition-opacity"
                        title="Mover arriba"
                        aria-label={`Mover ${cat.name} arriba`}
                      >
                        <ChevronUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMoveDown(index)}
                        disabled={isLast}
                        className="w-6 h-5 rounded-md bg-surface-card border border-line flex items-center justify-center text-text-secondary hover:text-text-primary disabled:opacity-20 transition-opacity"
                        title="Mover abajo"
                        aria-label={`Mover ${cat.name} abajo`}
                      >
                        <ChevronDown className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Order Badge */}
                    <span className="w-5 text-center text-xs font-mono font-bold text-text-muted">
                      #{index + 1}
                    </span>

                    {/* Emoji input / button */}
                    <div className="relative">
                      <input
                        type="text"
                        value={cat.emoji || ''}
                        onChange={(e) => handleUpdateCategory(index, 'emoji', e.target.value)}
                        maxLength={4}
                        placeholder="Emoji"
                        className="w-10 h-10 rounded-xl bg-surface-card border border-line text-center text-base font-bold text-text-primary outline-none focus:border-accent"
                        title="Emoji de la categoría"
                      />
                    </div>

                    {/* Category Name Input */}
                    <div className="flex-1 min-w-0">
                      <input
                        type="text"
                        value={cat.name}
                        onChange={(e) => handleUpdateCategory(index, 'name', e.target.value)}
                        className="w-full px-3 py-2 text-xs font-bold rounded-xl bg-surface-card border border-line text-text-primary outline-none focus:border-accent"
                        placeholder="Nombre de la categoría"
                      />
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] font-mono text-text-muted">
                          slug: {cat.key}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Items count & Delete button */}
                  <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-line">
                    <Badge
                      variant={assignedCount > 0 ? 'secondary' : 'outline'}
                      className="text-[10px] font-semibold"
                    >
                      {assignedCount} {assignedCount === 1 ? 'platillo' : 'platillos'}
                    </Badge>

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteCategory(cat)}
                      disabled={assignedCount > 0 || isDeleting}
                      className={`h-9 px-2.5 rounded-xl text-xs font-bold transition-all ${
                        assignedCount > 0
                          ? 'opacity-30 cursor-not-allowed text-text-muted'
                          : 'text-destructive border-destructive/20 hover:bg-destructive/10'
                      }`}
                      title={
                        assignedCount > 0
                          ? `No se puede eliminar: tiene ${assignedCount} platillo(s) asignado(s)`
                          : 'Eliminar categoría'
                      }
                    >
                      <Trash2 className="w-3.5 h-3.5 mr-1" />
                      <span>{isDeleting ? 'Borrando…' : 'Eliminar'}</span>
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* "+ Nueva Categoría" Accordion Card */}
          <div className="pt-2">
            {!isAddingNew ? (
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAddingNew(true)}
                className="w-full h-11 rounded-2xl border-dashed border-line text-xs font-bold text-text-primary hover:border-accent hover:text-accent flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span>+ Agregar Nueva Categoría</span>
              </Button>
            ) : (
              <div className="p-4 rounded-3xl bg-surface-raised border border-line space-y-3 animate-in fade-in duration-200">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-extrabold text-text-primary flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-accent" />
                    <span>Crear Nueva Categoría</span>
                  </h4>
                  <button
                    type="button"
                    onClick={() => setIsAddingNew(false)}
                    className="text-text-muted hover:text-text-primary text-xs"
                  >
                    Cancelar
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Emoji selector */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold text-text-secondary block">
                      Emoji
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={newCatEmoji}
                        onChange={(e) => setNewCatEmoji(e.target.value)}
                        maxLength={4}
                        className="w-11 h-10 rounded-xl bg-surface-card border border-line text-center text-lg font-bold text-text-primary outline-none focus:border-accent"
                      />
                      {/* Quick emoji presets */}
                      <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none">
                        {POPULAR_EMOJIS.slice(0, 5).map((em) => (
                          <button
                            key={em}
                            type="button"
                            onClick={() => setNewCatEmoji(em)}
                            className="w-7 h-7 rounded-lg bg-surface-card border border-line text-sm flex items-center justify-center hover:bg-surface-raised"
                          >
                            {em}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Nombre */}
                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="text-[11px] font-semibold text-text-secondary block">
                      Nombre de la Categoría
                    </label>
                    <input
                      type="text"
                      value={newCatName}
                      onChange={(e) => handleNameChange(e.target.value)}
                      placeholder="Ej. Postres, Shakes, Alitas..."
                      className="w-full px-3 py-2 text-xs rounded-xl bg-surface-card border border-line text-text-primary outline-none focus:border-accent font-bold"
                    />
                    <div className="text-[10px] text-text-muted font-mono flex items-center gap-1">
                      <span>Slug: {newCatKey || '—'}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-line">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsAddingNew(false)}
                    className="text-xs h-9 rounded-xl"
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleAddCategory}
                    className="text-xs h-9 rounded-xl bg-accent text-white font-bold"
                  >
                    <Plus className="w-3.5 h-3.5 mr-1" />
                    Insertar en Lista
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-line bg-surface-raised/50 flex items-center justify-between gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isSaving}
            className="text-xs font-bold h-10 px-4 rounded-2xl"
          >
            Cerrar
          </Button>

          <Button
            type="button"
            onClick={handleSaveAll}
            disabled={isSaving}
            className="text-xs font-bold h-10 px-5 rounded-2xl bg-accent text-white shadow-xs"
          >
            {isSaving ? (
              <span className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Guardando…
              </span>
            ) : (
              <span className="flex items-center gap-1.5">
                <Check className="w-4 h-4" />
                Guardar Cambios
              </span>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
