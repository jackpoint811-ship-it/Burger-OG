/**
 * CategoryManagerModal.tsx — Chekeo V3
 *
 * Drawer gestual interactivo para la gestión completa de categorías del menú en D1.
 * Permite crear nuevas categorías, editar nombres, cambiar emojis y reordenar prioridades.
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FolderTree,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Check,
  Sparkles,
  AlertCircle,
} from 'lucide-react';
import type { MenuCategory, MenuItem } from '@config/index';
import { Drawer } from '@ui/drawer';
import { Button } from '@ui/button';
import { Badge } from '@ui/badge';

const SUGGESTED_EMOJIS = ['🍔', '🍟', '🥤', '✨', '🥫', '🥪', '🍰', '🔥', '⭐', '🥗', '🍗', '🌭'];

export interface CategoryManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: MenuCategory[];
  items?: MenuItem[];
  onSaveCategories: (categories: MenuCategory[]) => Promise<unknown>;
  onDeleteCategory?: (key: string) => Promise<unknown>;
  isSaving: boolean;
}

export function CategoryManagerModal({
  isOpen,
  onClose,
  categories,
  items = [],
  onSaveCategories,
  onDeleteCategory,
  isSaving,
}: CategoryManagerModalProps) {
  const [localCategories, setLocalCategories] = useState<MenuCategory[]>([]);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newKey, setNewKey] = useState('');
  const [newName, setNewName] = useState('');
  const [newEmoji, setNewEmoji] = useState('🍔');
  const [error, setError] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [deletingKey, setDeletingKey] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setLocalCategories(JSON.parse(JSON.stringify(categories)));
      setEditingKey(null);
      setIsAddingNew(false);
      setError(null);
      setHasChanges(false);
      setDeletingKey(null);
    }
  }, [isOpen, categories]);

  const handleMove = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= localCategories.length) return;

    const updated = [...localCategories];
    const itemToMove = updated[index];
    updated.splice(index, 1);
    updated.splice(targetIndex, 0, itemToMove);

    // Reasignar sortOrder
    const reordered = updated.map((cat, idx) => ({
      ...cat,
      sortOrder: idx + 1,
    }));

    setLocalCategories(reordered);
    setHasChanges(true);
  };

  const handleUpdateField = (key: string, field: keyof MenuCategory, value: string | number) => {
    setLocalCategories((prev) =>
      prev.map((c) => (c.key === key ? { ...c, [field]: value } : c))
    );
    setHasChanges(true);
  };

  const handleDeleteCategory = async (key: string) => {
    if (localCategories.length <= 1) {
      setError('Debes mantener al menos una categoría en el menú.');
      return;
    }

    const assignedCount = (items || []).filter((i) => i.category === key).length;
    if (assignedCount > 0) {
      setError(
        `No se puede eliminar la categoría "${key}" porque tiene ${assignedCount} platillo(s) asignado(s). Reasigna o elimina los platillos primero.`
      );
      return;
    }

    if (onDeleteCategory) {
      try {
        setDeletingKey(key);
        await onDeleteCategory(key);
        setLocalCategories((prev) => prev.filter((c) => c.key !== key));
        setHasChanges(true);
        setError(null);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Error al eliminar la categoría de D1.');
      } finally {
        setDeletingKey(null);
      }
    } else {
      setLocalCategories((prev) => prev.filter((c) => c.key !== key));
      setHasChanges(true);
      setError(null);
    }
  };

  const handleAddNewCategory = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanName = newName.trim();
    let cleanKey = newKey.trim().toLowerCase().replace(/[^a-z0-9-_]/g, '-');

    if (!cleanName) {
      setError('El nombre de la categoría es requerido.');
      return;
    }

    if (!cleanKey) {
      cleanKey = cleanName.toLowerCase().replace(/[^a-z0-9-_]/g, '-');
    }

    if (localCategories.some((c) => c.key === cleanKey)) {
      setError(`Ya existe una categoría con la clave "${cleanKey}".`);
      return;
    }

    const newCategory: MenuCategory = {
      id: `cat-${cleanKey}`,
      key: cleanKey,
      name: cleanName,
      emoji: newEmoji,
      sortOrder: localCategories.length + 1,
    };

    setLocalCategories((prev) => [...prev, newCategory]);
    setIsAddingNew(false);
    setNewKey('');
    setNewName('');
    setNewEmoji('🍔');
    setHasChanges(true);
  };

  const handleSave = async () => {
    try {
      await onSaveCategories(localCategories);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar categorías.');
    }
  };

  return (
    <Drawer
      open={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <FolderTree className="w-5 h-5 text-accent" />
          <span>Gestor de Categorías</span>
        </div>
      }
      description="Organiza las secciones, nombres, emojis y el orden de aparición en la tienda."
      className="max-w-xl"
    >
      <div className="space-y-4 pt-1">
        {error && (
          <div className="p-3 rounded-2xl bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Lista de Categorías Existentes */}
        <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
          <AnimatePresence initial={false}>
            {localCategories.map((cat, index) => {
              const isEditing = editingKey === cat.key;
              const assignedCount = (items || []).filter((i) => i.category === cat.key).length;

              return (
                <motion.div
                  key={cat.key}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="p-3 sm:p-3.5 rounded-2xl bg-surface-raised border border-line shadow-xs flex flex-col gap-2 transition-all hover:border-accent/30"
                >
                  <div className="flex items-center justify-between gap-2">
                    {/* Reordenamiento y Emoji */}
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <div className="flex flex-col gap-0.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleMove(index, 'up')}
                          disabled={index === 0}
                          className="w-6 h-5 rounded bg-surface-card border border-line flex items-center justify-center text-text-muted hover:text-text-primary disabled:opacity-30 cursor-pointer"
                          title="Subir posición"
                        >
                          <ArrowUp className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMove(index, 'down')}
                          disabled={index === localCategories.length - 1}
                          className="w-6 h-5 rounded bg-surface-card border border-line flex items-center justify-center text-text-muted hover:text-text-primary disabled:opacity-30 cursor-pointer"
                          title="Bajar posición"
                        >
                          <ArrowDown className="w-3 h-3" />
                        </button>
                      </div>

                      {/* Emoji Selector Rápido */}
                      <div className="relative group shrink-0">
                        <button
                          type="button"
                          onClick={() => setEditingKey(isEditing ? null : cat.key)}
                          className="w-9 h-9 rounded-xl bg-surface-card border border-line flex items-center justify-center text-lg hover:bg-surface-raised transition-all cursor-pointer"
                          title="Cambiar emoji"
                        >
                          {cat.emoji || '📁'}
                        </button>
                      </div>

                      {/* Nombre y Key */}
                      <div className="min-w-0 flex-1">
                        {isEditing ? (
                          <input
                            type="text"
                            value={cat.name}
                            onChange={(e) => handleUpdateField(cat.key, 'name', e.target.value)}
                            className="w-full px-2.5 py-1 text-xs rounded-lg bg-surface-card border border-line text-text-primary font-bold outline-none focus:border-accent"
                          />
                        ) : (
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-xs font-black text-text-primary truncate">
                              {cat.name}
                            </span>
                            <Badge variant="outline" className="text-[10px] font-mono text-text-muted">
                              {cat.key}
                            </Badge>
                            <Badge
                              variant="secondary"
                              className={`text-[10px] font-semibold ${
                                assignedCount > 0 ? 'text-accent bg-accent/10 border-accent/20' : 'text-text-muted'
                              }`}
                            >
                              {assignedCount} platillo{assignedCount === 1 ? '' : 's'}
                            </Badge>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Acciones */}
                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingKey(isEditing ? null : cat.key)}
                        className="h-8 px-2.5 rounded-lg text-xs font-bold"
                      >
                        {isEditing ? 'Listo' : 'Editar'}
                      </Button>

                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        disabled={assignedCount > 0 || isSaving || deletingKey === cat.key}
                        onClick={() => handleDeleteCategory(cat.key)}
                        className={`h-8 w-8 p-0 rounded-lg transition-all ${
                          assignedCount > 0
                            ? 'opacity-30 cursor-not-allowed text-text-muted'
                            : 'text-destructive hover:bg-destructive/10'
                        }`}
                        title={
                          assignedCount > 0
                            ? `No se puede eliminar: tiene ${assignedCount} platillo(s) asignado(s)`
                            : 'Eliminar categoría'
                        }
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>

                  {/* Selector expandido de emojis al editar */}
                  {isEditing && (
                    <div className="pt-2 border-t border-line/60 flex items-center gap-1.5 overflow-x-auto pb-1">
                      <span className="text-[10px] font-bold text-text-muted shrink-0">Emojis:</span>
                      {SUGGESTED_EMOJIS.map((emoji) => (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => handleUpdateField(cat.key, 'emoji', emoji)}
                          className={`w-7 h-7 rounded-lg text-sm flex items-center justify-center cursor-pointer transition-all ${
                            cat.emoji === emoji
                              ? 'bg-accent/20 border border-accent scale-110'
                              : 'bg-surface-card hover:bg-surface-raised border border-line'
                          }`}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {/* Sección para agregar nueva categoría */}
        {isAddingNew ? (
          <form
            onSubmit={handleAddNewCategory}
            className="p-4 rounded-2xl bg-surface-card border border-line shadow-sm space-y-3 animate-in fade-in zoom-in-95 duration-200"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-text-primary flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-accent" />
                Nueva Categoría
              </span>
              <button
                type="button"
                onClick={() => setIsAddingNew(false)}
                className="text-[11px] font-bold text-text-muted hover:text-text-primary cursor-pointer"
              >
                Cancelar
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[10px] font-bold uppercase text-text-muted mb-1">
                  Nombre Público *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Postres, Especiales..."
                  value={newName}
                  onChange={(e) => {
                    setNewName(e.target.value);
                    if (!newKey) {
                      setNewKey(e.target.value.toLowerCase().replace(/[^a-z0-9-_]/g, '-'));
                    }
                  }}
                  className="w-full px-3 py-1.5 text-xs rounded-xl bg-surface-raised border border-line text-text-primary outline-none focus:border-accent font-bold"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-text-muted mb-1">
                  Clave Identificador (Slug) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="postres"
                  value={newKey}
                  onChange={(e) => setNewKey(e.target.value.toLowerCase().replace(/[^a-z0-9-_]/g, '-'))}
                  className="w-full px-3 py-1.5 text-xs rounded-xl bg-surface-raised border border-line text-text-primary font-mono outline-none focus:border-accent"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase text-text-muted mb-1">
                Emoji de Categoría
              </label>
              <div className="flex items-center gap-1.5 flex-wrap">
                {SUGGESTED_EMOJIS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => setNewEmoji(emoji)}
                    className={`w-8 h-8 rounded-xl text-base flex items-center justify-center cursor-pointer transition-all ${
                      newEmoji === emoji
                        ? 'bg-accent/20 border border-accent scale-110 shadow-xs'
                        : 'bg-surface-raised hover:bg-surface border border-line'
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <Button
                type="submit"
                size="sm"
                className="text-xs font-bold bg-accent text-white rounded-xl"
              >
                <Plus className="w-3.5 h-3.5 mr-1" />
                Agregar a la Lista
              </Button>
            </div>
          </form>
        ) : (
          <Button
            type="button"
            variant="outline"
            onClick={() => setIsAddingNew(true)}
            className="w-full h-10 rounded-2xl text-xs font-bold border-dashed border-line text-text-secondary hover:text-text-primary hover:border-accent/40"
          >
            <Plus className="w-3.5 h-3.5 mr-1 text-accent" />
            Crear Nueva Categoría
          </Button>
        )}

        {/* Footer con Botón Guardar */}
        <div className="pt-3 border-t border-line flex items-center justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose} className="text-xs rounded-xl">
            Cerrar
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={!hasChanges || isSaving}
            className="text-xs font-bold bg-accent text-white rounded-xl"
          >
            <Check className="w-3.5 h-3.5 mr-1" />
            {isSaving ? 'Guardando...' : 'Guardar Cambios'}
          </Button>
        </div>
      </div>
    </Drawer>
  );
}
