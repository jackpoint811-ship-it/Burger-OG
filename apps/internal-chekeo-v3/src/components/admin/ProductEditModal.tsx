/**
 * ProductEditModal.tsx — PR-V3-12
 *
 * Modal accesible de creación y edición completa de productos del menú.
 * Soporta SKU, nombre, descripción, precio, categoría, promociones, stock controlado e imagen.
 */

import React, { useState, useEffect, useRef } from 'react';
import { X, Upload, Trash2, Check, AlertCircle, Sparkles, Package, DollarSign, Tag, Image as ImageIcon } from 'lucide-react';
import type { MenuItem, MenuCategory } from '@config/index';
import { Button } from '@ui/button';
import { Badge } from '@ui/badge';
import type { CreateMenuItemPayload, UpdateMenuItemPayload } from '../../features/admin/types/admin.types';

interface ProductEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: MenuItem | null;
  categories: MenuCategory[];
  onSave: (sku: string, payload: CreateMenuItemPayload | UpdateMenuItemPayload, file?: File | null) => Promise<void>;
  onDeleteImage?: (sku: string) => Promise<unknown>;
  isSaving: boolean;
}

export function ProductEditModal({
  isOpen,
  onClose,
  item,
  categories,
  onSave,
  onDeleteImage,
  isSaving,
}: ProductEditModalProps) {
  const isCreating = !item;
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form states
  const [sku, setSku] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('burgers');
  const [price, setPrice] = useState('');
  const [badge, setBadge] = useState('');
  const [sortOrder, setSortOrder] = useState('0');
  const [isAvailable, setIsAvailable] = useState(true);
  const [isHidden, setIsHidden] = useState(false);
  const [isFeatured, setIsFeatured] = useState(false);

  // Promo states
  const [isPromoActive, setIsPromoActive] = useState(false);
  const [promoPrice, setPromoPrice] = useState('');
  const [promoLabel, setPromoLabel] = useState('');
  const [promoExpiresAt, setPromoExpiresAt] = useState('');

  // Stock states
  const [stockManaged, setStockManaged] = useState(false);
  const [stockLimit, setStockLimit] = useState('');
  const [stockRemaining, setStockRemaining] = useState('');

  // Image states
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [removeExistingImage, setRemoveExistingImage] = useState(false);

  // Validation
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    if (item) {
      setSku(item.sku);
      setName(item.name);
      setDescription(item.description || '');
      setCategory(item.category || 'burgers');
      setPrice(String(item.price));
      setBadge(item.badge || '');
      setSortOrder(String(item.sortOrder ?? 0));
      setIsAvailable(item.isAvailable ?? true);
      setIsHidden(Boolean(item.isHidden));
      setIsFeatured(Boolean(item.isFeatured));

      setIsPromoActive(Boolean(item.isPromoActive));
      setPromoPrice(item.promoPrice != null ? String(item.promoPrice) : '');
      setPromoLabel(item.promoLabel || '');
      setPromoExpiresAt(item.promoExpiresAt ? item.promoExpiresAt.slice(0, 16) : '');

      setStockManaged(Boolean(item.stockManaged));
      setStockLimit(item.stockLimit != null ? String(item.stockLimit) : '');
      setStockRemaining(item.stockRemaining != null ? String(item.stockRemaining) : '');

      setImagePreview(
        item.imageUrl ||
          (item.imageKey ? `/api/assets-v2/${encodeURIComponent(item.imageKey)}` : null)
      );
      setSelectedFile(null);
      setRemoveExistingImage(false);
    } else {
      // Defaults for creation
      setSku('');
      setName('');
      setDescription('');
      setCategory(categories[0]?.key || 'burgers');
      setPrice('');
      setBadge('');
      setSortOrder('0');
      setIsAvailable(true);
      setIsHidden(false);
      setIsFeatured(false);

      setIsPromoActive(false);
      setPromoPrice('');
      setPromoLabel('');
      setPromoExpiresAt('');

      setStockManaged(false);
      setStockLimit('50');
      setStockRemaining('50');

      setImagePreview(null);
      setSelectedFile(null);
      setRemoveExistingImage(false);
    }
    setError(null);
  }, [isOpen, item, categories]);

  // Listener para cerrar con tecla Escape
  useEffect(() => {
    if (!isOpen) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        onClose();
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError('La imagen no puede pesar más de 5 MB');
      return;
    }

    setSelectedFile(file);
    setImagePreview(URL.createObjectURL(file));
    setRemoveExistingImage(false);
    setError(null);
  };

  const handleRemoveImage = () => {
    setSelectedFile(null);
    setImagePreview(null);
    setRemoveExistingImage(true);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    const cleanSku = sku.trim().toUpperCase();
    const cleanName = name.trim();
    const cleanPrice = parseFloat(price);

    if (!cleanSku) {
      setError('El SKU es obligatorio (ej. BURGER_OG_SENCILLA)');
      return;
    }
    if (!cleanName) {
      setError('El nombre del producto es obligatorio');
      return;
    }
    if (isNaN(cleanPrice) || cleanPrice < 0) {
      setError('El precio debe ser un número válido mayor o igual a 0');
      return;
    }

    let parsedPromoPrice: number | null = null;
    if (isPromoActive) {
      parsedPromoPrice = parseFloat(promoPrice);
      if (isNaN(parsedPromoPrice) || parsedPromoPrice < 0) {
        setError('El precio promocional debe ser un número válido');
        return;
      }
    }

    let parsedStockLimit: number | null = null;
    let parsedStockRemaining: number | null = null;
    if (stockManaged) {
      parsedStockLimit = parseInt(stockLimit, 10);
      parsedStockRemaining = parseInt(stockRemaining, 10);
      if (isNaN(parsedStockLimit) || parsedStockLimit < 0) {
        setError('El límite de stock debe ser un entero positivo');
        return;
      }
      if (isNaN(parsedStockRemaining) || parsedStockRemaining < 0) {
        setError('El stock restante debe ser un entero positivo');
        return;
      }
    }

    const payload: CreateMenuItemPayload = {
      sku: cleanSku,
      name: cleanName,
      description: description.trim(),
      category,
      price: cleanPrice,
      badge: badge.trim() || undefined,
      sortOrder: parseInt(sortOrder, 10) || 0,
      isAvailable,
      isHidden,
      isFeatured,
      isPromoActive,
      promoPrice: parsedPromoPrice,
      promoLabel: promoLabel.trim() || undefined,
      promoExpiresAt: promoExpiresAt ? new Date(promoExpiresAt).toISOString() : null,
      stockManaged,
      stockLimit: parsedStockLimit,
      stockRemaining: parsedStockRemaining,
      comboLinks: item?.comboLinks || [],
    };

    try {
      if (removeExistingImage && item?.sku && onDeleteImage) {
        await onDeleteImage(item.sku);
      }
      await onSave(cleanSku, payload, selectedFile);
      onClose();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al guardar el producto';
      setError(message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="bg-surface-card w-full max-w-2xl rounded-3xl border border-line shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        {/* Header */}
        <div className="p-5 border-b border-line flex items-center justify-between bg-surface-raised/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-accent-soft text-accent flex items-center justify-center font-bold">
              {isCreating ? <Sparkles className="w-5 h-5" /> : <Package className="w-5 h-5" />}
            </div>
            <div>
              <h3 id="modal-title" className="text-base font-bold text-text-primary">
                {isCreating ? 'Crear Nuevo Producto' : `Editar ${item.name}`}
              </h3>
              <p className="text-xs text-text-secondary">
                {isCreating ? 'Agrega un nuevo producto o combo al catálogo.' : `SKU: ${item.sku}`}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-surface-raised flex items-center justify-center text-text-secondary hover:text-text-primary transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body (Scrollable) */}
        <form id="product-form" onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6 flex-1">
          {error && (
            <div className="p-3 rounded-2xl bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Sección 1: Datos Básicos */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-text-muted flex items-center gap-2">
              <Tag className="w-3.5 h-3.5" />
              Información General
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1">
                  SKU (Identificador Único) *
                </label>
                <input
                  type="text"
                  required
                  disabled={!isCreating}
                  placeholder="EJ. BURGER-OG"
                  value={sku}
                  onChange={(e) => setSku(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-surface-raised border border-line text-text-primary placeholder-text-muted outline-none focus:border-accent disabled:opacity-60 font-mono uppercase"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1">
                  Categoría *
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-surface-raised border border-line text-text-primary outline-none focus:border-accent"
                >
                  {categories.map((cat) => (
                    <option key={cat.key} value={cat.key}>
                      {cat.emoji ? `${cat.emoji} ` : ''}
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1">
                Nombre del Producto *
              </label>
              <input
                type="text"
                required
                placeholder="Nombre para el catálogo..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl bg-surface-raised border border-line text-text-primary placeholder-text-muted outline-none focus:border-accent font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1">
                Descripción detallada
              </label>
              <textarea
                rows={2}
                placeholder="Ingredientes, preparación o detalles para el cliente..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl bg-surface-raised border border-line text-text-primary placeholder-text-muted outline-none focus:border-accent resize-none"
              />
            </div>
          </div>

          {/* Sección 2: Precios y Ofertas */}
          <div className="space-y-4 pt-4 border-t border-line">
            <h4 className="text-xs font-bold uppercase tracking-wider text-text-muted flex items-center gap-2">
              <DollarSign className="w-3.5 h-3.5" />
              Precios y Promociones
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1">
                  Precio Regular ($ MXN) *
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  required
                  placeholder="149.00"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-surface-raised border border-line text-text-primary placeholder-text-muted outline-none focus:border-accent font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1">
                  Badge / Etiqueta
                </label>
                <input
                  type="text"
                  placeholder="Ej. TOP VENTAS, NUEVO"
                  value={badge}
                  onChange={(e) => setBadge(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-surface-raised border border-line text-text-primary placeholder-text-muted outline-none focus:border-accent"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1">
                  Orden de Visualización
                </label>
                <input
                  type="number"
                  placeholder="0"
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-surface-raised border border-line text-text-primary placeholder-text-muted outline-none focus:border-accent"
                />
              </div>
            </div>

            {/* Toggle Promo */}
            <div className="p-4 rounded-2xl bg-surface-raised border border-line space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-text-primary">Activar Precio Promocional</span>
                  <p className="text-[11px] text-text-secondary">Aplica un descuento tachando el precio regular.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isPromoActive}
                    onChange={(e) => setIsPromoActive(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-10 h-5 bg-line peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-accent"></div>
                </label>
              </div>

              {isPromoActive && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-text-secondary mb-1">
                      Precio Promo ($)
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      placeholder="129.00"
                      value={promoPrice}
                      onChange={(e) => setPromoPrice(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs rounded-xl bg-surface-card border border-line text-text-primary outline-none focus:border-accent"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-text-secondary mb-1">
                      Texto Promo
                    </label>
                    <input
                      type="text"
                      placeholder="Ej. -15% OFF"
                      value={promoLabel}
                      onChange={(e) => setPromoLabel(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs rounded-xl bg-surface-card border border-line text-text-primary outline-none focus:border-accent"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-text-secondary mb-1">
                      Expira (Opcional)
                    </label>
                    <input
                      type="datetime-local"
                      value={promoExpiresAt}
                      onChange={(e) => setPromoExpiresAt(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs rounded-xl bg-surface-card border border-line text-text-primary outline-none focus:border-accent"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Sección 3: Stock y Existencias */}
          <div className="space-y-4 pt-4 border-t border-line">
            <h4 className="text-xs font-bold uppercase tracking-wider text-text-muted flex items-center gap-2">
              <Package className="w-3.5 h-3.5" />
              Control de Stock & Visibilidad
            </h4>

            <div className="p-4 rounded-2xl bg-surface-raised border border-line space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-text-primary">Control de Stock Diario</span>
                  <p className="text-[11px] text-text-secondary">
                    Decrementa automáticamente con cada orden y marca como agotado al llegar a 0.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={stockManaged}
                    onChange={(e) => setStockManaged(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-10 h-5 bg-line peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-accent"></div>
                </label>
              </div>

              {stockManaged && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-text-secondary mb-1">
                      Límite Diario (Capacidad)
                    </label>
                    <input
                      type="number"
                      placeholder="50"
                      value={stockLimit}
                      onChange={(e) => setStockLimit(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs rounded-xl bg-surface-card border border-line text-text-primary outline-none focus:border-accent"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-text-secondary mb-1">
                      Stock Restante Actual
                    </label>
                    <input
                      type="number"
                      placeholder="50"
                      value={stockRemaining}
                      onChange={(e) => setStockRemaining(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs rounded-xl bg-surface-card border border-line text-text-primary outline-none focus:border-accent"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Quick toggles */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <label className="flex items-center gap-2 p-3 rounded-2xl bg-surface-raised border border-line cursor-pointer hover:border-accent/40">
                <input
                  type="checkbox"
                  checked={isAvailable}
                  onChange={(e) => setIsAvailable(e.target.checked)}
                  className="rounded text-accent focus:ring-accent w-4 h-4"
                />
                <span className="text-xs font-bold text-text-primary">Disponible (En Vivo)</span>
              </label>

              <label className="flex items-center gap-2 p-3 rounded-2xl bg-surface-raised border border-line cursor-pointer hover:border-accent/40">
                <input
                  type="checkbox"
                  checked={isHidden}
                  onChange={(e) => setIsHidden(e.target.checked)}
                  className="rounded text-accent focus:ring-accent w-4 h-4"
                />
                <span className="text-xs font-bold text-text-primary">Ocultar del Menú</span>
              </label>

              <label className="flex items-center gap-2 p-3 rounded-2xl bg-surface-raised border border-line cursor-pointer hover:border-accent/40">
                <input
                  type="checkbox"
                  checked={isFeatured}
                  onChange={(e) => setIsFeatured(e.target.checked)}
                  className="rounded text-accent focus:ring-accent w-4 h-4"
                />
                <span className="text-xs font-bold text-text-primary">Destacado (Top)</span>
              </label>
            </div>
          </div>

          {/* Sección 4: Imagen del Producto */}
          <div className="space-y-4 pt-4 border-t border-line">
            <h4 className="text-xs font-bold uppercase tracking-wider text-text-muted flex items-center gap-2">
              <ImageIcon className="w-3.5 h-3.5" />
              Imagen del Producto (R2 Asset)
            </h4>

            <div className="flex flex-col sm:flex-row items-center gap-4 p-4 rounded-2xl bg-surface-raised border border-line">
              <div className="w-24 h-24 rounded-2xl bg-surface-card border border-line flex items-center justify-center overflow-hidden shrink-0">
                {imagePreview ? (
                  <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <ImageIcon className="w-8 h-8 text-text-muted" />
                )}
              </div>

              <div className="space-y-2 flex-1 text-center sm:text-left">
                <p className="text-xs text-text-secondary">
                  Formatos permitidos: JPG, PNG, WebP o AVIF (máx. 5 MB).
                </p>
                <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/jpeg,image/png,image/webp,image/avif"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    className="text-xs h-8 px-3"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="w-3.5 h-3.5 mr-1" />
                    Seleccionar Imagen
                  </Button>
                  {imagePreview && (
                    <Button
                      type="button"
                      variant="outline"
                      className="text-xs h-8 px-3 text-destructive hover:bg-destructive/10"
                      onClick={handleRemoveImage}
                    >
                      <Trash2 className="w-3.5 h-3.5 mr-1" />
                      Quitar Imagen
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="p-5 border-t border-line flex items-center justify-end gap-3 bg-surface-raised/50">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSaving} className="text-xs">
            Cancelar
          </Button>
          <Button
            type="submit"
            form="product-form"
            disabled={isSaving}
            className="text-xs font-bold bg-accent text-white"
          >
            {isSaving ? (
              <span>Guardando...</span>
            ) : (
              <span className="flex items-center gap-1">
                <Check className="w-4 h-4" />
                {isCreating ? 'Crear Producto' : 'Guardar Cambios'}
              </span>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
