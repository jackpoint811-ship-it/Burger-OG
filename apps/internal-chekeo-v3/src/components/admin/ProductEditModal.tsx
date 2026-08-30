/**
 * ProductEditModal.tsx — Chekeo V3
 *
 * Drawer accesible de creación y edición completa de productos del menú.
 * Soporta SKU, nombre, descripción, precio, categoría, promociones, cálculo de descuento en vivo,
 * stock controlado e imagen optimizada en R2.
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  X,
  Upload,
  Trash2,
  Check,
  AlertCircle,
  Sparkles,
  Package,
  DollarSign,
  Tag,
  Image as ImageIcon,
  Flame,
  TrendingDown,
  Eye,
  EyeOff,
} from 'lucide-react';
import type { MenuItem, MenuCategory } from '@config/index';
import { Drawer } from '@ui/drawer';
import { Button } from '@ui/button';
import { Badge } from '@ui/badge';
import type { CreateMenuItemPayload, UpdateMenuItemPayload } from '../../features/admin/types/admin.types';

export interface ProductEditModalProps {
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
      setCategory(item.category || categories[0]?.key || 'burgers');
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

  // Cálculos de descuento en tiempo real
  const promoSavings = useMemo(() => {
    const reg = parseFloat(price);
    const promo = parseFloat(promoPrice);
    if (!isPromoActive || isNaN(reg) || isNaN(promo) || reg <= 0 || promo >= reg) {
      return null;
    }
    const diff = reg - promo;
    const pct = Math.round((diff / reg) * 100);
    return { diff, pct };
  }, [price, promoPrice, isPromoActive]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError('La imagen no puede pesar más de 5 MB.');
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

    const cleanSku = sku.trim().toUpperCase();
    const cleanName = name.trim();
    const cleanPrice = parseFloat(price);

    if (!cleanSku) {
      setError('El SKU es obligatorio (ej. BURGER_OG).');
      return;
    }
    if (!cleanName) {
      setError('El nombre del producto es obligatorio.');
      return;
    }
    if (isNaN(cleanPrice) || cleanPrice < 0) {
      setError('El precio debe ser un número válido mayor o igual a 0.');
      return;
    }

    let parsedPromoPrice: number | null = null;
    if (isPromoActive) {
      parsedPromoPrice = parseFloat(promoPrice);
      if (isNaN(parsedPromoPrice) || parsedPromoPrice < 0) {
        setError('El precio promocional debe ser un número válido.');
        return;
      }
    }

    let parsedStockLimit: number | null = null;
    let parsedStockRemaining: number | null = null;
    if (stockManaged) {
      parsedStockLimit = parseInt(stockLimit, 10);
      parsedStockRemaining = parseInt(stockRemaining, 10);
      if (isNaN(parsedStockLimit) || parsedStockLimit < 0) {
        setError('El límite de stock debe ser un entero positivo.');
        return;
      }
      if (isNaN(parsedStockRemaining) || parsedStockRemaining < 0) {
        setError('El stock restante debe ser un entero positivo.');
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
      const message = err instanceof Error ? err.message : 'Error al guardar el producto.';
      setError(message);
    }
  };

  return (
    <Drawer
      open={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          {isCreating ? (
            <div className="w-8 h-8 rounded-xl bg-accent/15 text-accent flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
          ) : (
            <div className="w-8 h-8 rounded-xl bg-surface-raised text-text-primary flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
          )}
          <span>{isCreating ? 'Nuevo Platillo' : `Editar: ${item?.name}`}</span>
        </div>
      }
      description={isCreating ? 'Crea un nuevo producto para el catálogo público y comandas.' : `SKU: ${item?.sku}`}
      className="max-w-2xl"
    >
      <form id="product-edit-form" onSubmit={handleSubmit} className="space-y-5 pt-1">
        {error && (
          <div className="p-3 rounded-2xl bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* 1. Información General */}
        <div className="p-4 rounded-2xl bg-surface-raised border border-line space-y-3">
          <span className="text-[11px] font-black uppercase tracking-wider text-text-muted flex items-center gap-1.5">
            <Tag className="w-3.5 h-3.5 text-accent" />
            Datos Básicos
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-text-secondary mb-1">
                SKU (Identificador Único) *
              </label>
              <input
                type="text"
                required
                disabled={!isCreating}
                placeholder="EJ. BURGER-OG"
                value={sku}
                onChange={(e) => setSku(e.target.value.toUpperCase())}
                className="w-full px-3 py-2 text-xs rounded-xl bg-surface-card border border-line text-text-primary font-mono uppercase outline-none focus:border-accent disabled:opacity-60"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-text-secondary mb-1">
                Categoría *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl bg-surface-card border border-line text-text-primary outline-none focus:border-accent font-bold"
              >
                {categories.map((cat) => (
                  <option key={cat.key} value={cat.key}>
                    {cat.emoji ? `${cat.emoji} ` : '📁 '}
                    {cat.name} ({cat.key})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-text-secondary mb-1">
              Nombre del Platillo *
            </label>
            <input
              type="text"
              required
              placeholder="Ej. Doble Queso Smash"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl bg-surface-card border border-line text-text-primary font-bold outline-none focus:border-accent"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-text-secondary mb-1">
              Descripción para el Catálogo
            </label>
            <textarea
              rows={2}
              placeholder="Ingredientes, preparación y detalles para el comensal..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl bg-surface-card border border-line text-text-primary outline-none focus:border-accent resize-none"
            />
          </div>
        </div>

        {/* 2. Precios & Promociones con Calculadora en Vivo */}
        <div className="p-4 rounded-2xl bg-surface-raised border border-line space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-text-muted flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5 text-accent" />
              Precios & Promoción
            </span>
            {promoSavings && (
              <Badge variant="default" className="text-[10px] font-black bg-accent text-white flex items-center gap-1">
                <TrendingDown className="w-3 h-3" />
                <span>Ahorro: -${promoSavings.diff.toFixed(2)} ({promoSavings.pct}% OFF)</span>
              </Badge>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-text-secondary mb-1">
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
                className="w-full px-3 py-2 text-xs rounded-xl bg-surface-card border border-line text-text-primary font-bold font-mono outline-none focus:border-accent"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-text-secondary mb-1">
                Distintivo (Badge)
              </label>
              <input
                type="text"
                placeholder="Ej. TOP VENTAS"
                value={badge}
                onChange={(e) => setBadge(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl bg-surface-card border border-line text-text-primary outline-none focus:border-accent uppercase"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-text-secondary mb-1">
                Orden de Lista
              </label>
              <input
                type="number"
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl bg-surface-card border border-line text-text-primary font-mono outline-none focus:border-accent"
              />
            </div>
          </div>

          {/* Switch de Promoción */}
          <div className="pt-2 border-t border-line/60 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-text-primary">Activar Oferta / Descuento</span>
                <p className="text-[10px] text-text-muted">Muestra el precio tachado y badge de descuento.</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={isPromoActive}
                  onChange={(e) => setIsPromoActive(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-line peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-accent" />
              </label>
            </div>

            {isPromoActive && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 animate-in fade-in duration-200">
                <div>
                  <label className="block text-[10px] font-bold text-text-muted mb-1">
                    Precio en Oferta ($) *
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    placeholder="129.00"
                    value={promoPrice}
                    onChange={(e) => setPromoPrice(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs rounded-xl bg-surface-card border border-line text-text-primary font-bold font-mono outline-none focus:border-accent"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-text-muted mb-1">
                    Etiqueta Promo
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. -15% OFF"
                    value={promoLabel}
                    onChange={(e) => setPromoLabel(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs rounded-xl bg-surface-card border border-line text-text-primary font-bold outline-none focus:border-accent"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-text-muted mb-1">
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

        {/* 3. Control de Stock Diario */}
        <div className="p-4 rounded-2xl bg-surface-raised border border-line space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-text-primary flex items-center gap-1.5">
                <Package className="w-3.5 h-3.5 text-accent" />
                Control de Stock Diario
              </span>
              <p className="text-[10px] text-text-muted">
                Decrementa con cada pedido y marca como agotado al llegar a 0.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={stockManaged}
                onChange={(e) => setStockManaged(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-line peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-accent" />
            </label>
          </div>

          {stockManaged && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 animate-in fade-in duration-200">
              <div>
                <label className="block text-[10px] font-bold text-text-muted mb-1">
                  Límite Diario (Capacidad Máxima)
                </label>
                <input
                  type="number"
                  placeholder="50"
                  value={stockLimit}
                  onChange={(e) => setStockLimit(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs rounded-xl bg-surface-card border border-line text-text-primary font-bold font-mono outline-none focus:border-accent"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-text-muted mb-1">
                  Stock Restante del Turno
                </label>
                <input
                  type="number"
                  placeholder="50"
                  value={stockRemaining}
                  onChange={(e) => setStockRemaining(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs rounded-xl bg-surface-card border border-line text-text-primary font-bold font-mono outline-none focus:border-accent"
                />
              </div>
            </div>
          )}

          {/* Quick Toggles */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t border-line/60">
            <label className="flex items-center gap-2 p-2.5 rounded-xl bg-surface-card border border-line cursor-pointer hover:border-accent/40 text-xs font-bold text-text-primary">
              <input
                type="checkbox"
                checked={isAvailable}
                onChange={(e) => setIsAvailable(e.target.checked)}
                className="rounded text-accent w-4 h-4"
              />
              <span>🟢 En Vivo</span>
            </label>

            <label className="flex items-center gap-2 p-2.5 rounded-xl bg-surface-card border border-line cursor-pointer hover:border-accent/40 text-xs font-bold text-text-primary">
              <input
                type="checkbox"
                checked={isHidden}
                onChange={(e) => setIsHidden(e.target.checked)}
                className="rounded text-accent w-4 h-4"
              />
              <span>👁️‍🗨️ Oculto</span>
            </label>

            <label className="flex items-center gap-2 p-2.5 rounded-xl bg-surface-card border border-line cursor-pointer hover:border-accent/40 text-xs font-bold text-text-primary">
              <input
                type="checkbox"
                checked={isFeatured}
                onChange={(e) => setIsFeatured(e.target.checked)}
                className="rounded text-accent w-4 h-4"
              />
              <span>⭐ Top Vendido</span>
            </label>
          </div>
        </div>

        {/* 4. Imagen en Cloudflare R2 */}
        <div className="p-4 rounded-2xl bg-surface-raised border border-line space-y-3">
          <span className="text-[11px] font-black uppercase tracking-wider text-text-muted flex items-center gap-1.5">
            <ImageIcon className="w-3.5 h-3.5 text-accent" />
            Foto del Producto (R2 Asset)
          </span>

          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-2xl bg-surface-card border border-line flex items-center justify-center overflow-hidden shrink-0 shadow-xs">
              {imagePreview ? (
                <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
              ) : (
                <ImageIcon className="w-8 h-8 text-text-muted" />
              )}
            </div>

            <div className="space-y-1.5 flex-1 min-w-0">
              <p className="text-[11px] text-text-secondary">
                Formatos: JPG, PNG, WebP o AVIF (máx. 5 MB).
              </p>
              <div className="flex items-center gap-2 flex-wrap">
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
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-xs h-8 px-3 rounded-xl font-bold"
                >
                  <Upload className="w-3.5 h-3.5 mr-1" />
                  Seleccionar Foto
                </Button>
                {imagePreview && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleRemoveImage}
                    className="text-xs h-8 px-2.5 rounded-xl text-destructive hover:bg-destructive/10"
                    title="Quitar foto"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-line flex items-center justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSaving} className="text-xs rounded-xl">
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={isSaving}
            className="text-xs font-bold bg-accent text-white rounded-xl"
          >
            <Check className="w-3.5 h-3.5 mr-1" />
            {isSaving ? 'Guardando...' : isCreating ? 'Crear Platillo' : 'Guardar Cambios'}
          </Button>
        </div>
      </form>
    </Drawer>
  );
}
