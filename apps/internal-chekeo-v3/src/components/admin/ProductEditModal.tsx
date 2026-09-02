/**
 * ProductEditModal.tsx — PR-V3-12
 *
 * Modal accesible de creación y edición completa de productos del menú.
 * Soporta SKU, nombre, descripción, precio, categoría, promociones, stock controlado e imagen.
 */

import React, { useState, useEffect, useRef } from 'react';
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
  Layers,
  ChevronDown,
  ChevronUp,
  Plus,
  Sliders,
  UtensilsCrossed,
} from 'lucide-react';
import type {
  MenuItem,
  MenuCategory,
  MenuItemComboConfig,
  ComboOptionGroup,
  ComboItemOption,
} from '@config/index';
import { Button } from '@ui/button';
import { Badge } from '@ui/badge';
import type { CreateMenuItemPayload, UpdateMenuItemPayload } from '../../features/admin/types/admin.types';

interface ProductEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: MenuItem | null;
  categories: MenuCategory[];
  allItems?: MenuItem[];
  onSave: (sku: string, payload: CreateMenuItemPayload | UpdateMenuItemPayload, file?: File | null) => Promise<void>;
  onDeleteImage?: (sku: string) => Promise<unknown>;
  isSaving: boolean;
}

export function ProductEditModal({
  isOpen,
  onClose,
  item,
  categories,
  allItems = [],
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

  // Combo & Option groups states
  const [isCombo, setIsCombo] = useState(false);
  const [bundlePrice, setBundlePrice] = useState('');
  const [comboLinks, setComboLinks] = useState<string[]>([]);
  const [optionGroups, setOptionGroups] = useState<ComboOptionGroup[]>([]);
  const [isComboSectionOpen, setIsComboSectionOpen] = useState(false);

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

      const itemIsCombo = Boolean(item.comboConfig?.isCombo || item.category === 'combos');
      setIsCombo(itemIsCombo);
      setBundlePrice(item.comboConfig?.bundlePriceCents != null ? String(item.comboConfig.bundlePriceCents / 100) : '');
      setComboLinks(item.comboLinks || []);
      setOptionGroups(
        item.comboConfig?.optionGroups
          ? JSON.parse(JSON.stringify(item.comboConfig.optionGroups))
          : []
      );
      setIsComboSectionOpen(itemIsCombo);

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

      setIsCombo(false);
      setBundlePrice('');
      setComboLinks([]);
      setOptionGroups([]);
      setIsComboSectionOpen(false);

      setImagePreview(null);
      setSelectedFile(null);
      setRemoveExistingImage(false);
    }
    setError(null);
  }, [isOpen, item, categories]);

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
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Option groups & combo helpers
  const handleAddOptionGroup = (type: 'guarnicion' | 'bebida' | 'custom') => {
    if (type === 'guarnicion') {
      const defaultGuarniciones = (allItems || [])
        .filter((p) => p.category?.toLowerCase() === 'guarniciones' && p.isAvailable !== false)
        .slice(0, 4)
        .map((p, idx) => ({
          sku: p.sku,
          isDefault: idx === 0,
          upchargeCents: 0,
        }));

      setOptionGroups((prev) => [
        ...prev,
        {
          id: `side-${Date.now()}`,
          name: 'Elige tu Guarnición',
          isRequired: true,
          minSelections: 1,
          maxSelections: 1,
          options: defaultGuarniciones.length > 0 ? defaultGuarniciones : [
            { sku: 'SIDE-FRIES', isDefault: true, upchargeCents: 0 },
          ],
        },
      ]);
    } else if (type === 'bebida') {
      const defaultDrinks = (allItems || [])
        .filter((p) => p.category?.toLowerCase() === 'drinks' && p.isAvailable !== false)
        .slice(0, 4)
        .map((p, idx) => ({
          sku: p.sku,
          isDefault: idx === 0,
          upchargeCents: 0,
        }));

      setOptionGroups((prev) => [
        ...prev,
        {
          id: `drink-${Date.now()}`,
          name: 'Elige tu Bebida',
          isRequired: false,
          minSelections: 0,
          maxSelections: 1,
          options: defaultDrinks.length > 0 ? defaultDrinks : [
            { sku: 'DRINK-COKE', isDefault: true, upchargeCents: 0 },
          ],
        },
      ]);
    } else {
      setOptionGroups((prev) => [
        ...prev,
        {
          id: `opt-${Date.now()}`,
          name: 'Grupo de Opciones',
          isRequired: false,
          minSelections: 0,
          maxSelections: 1,
          options: [],
        },
      ]);
    }
  };

  const handleRemoveOptionGroup = (groupIndex: number) => {
    setOptionGroups((prev) => prev.filter((_, idx) => idx !== groupIndex));
  };

  const handleUpdateOptionGroup = (groupIndex: number, field: keyof ComboOptionGroup, val: any) => {
    setOptionGroups((prev) => {
      const copy = [...prev];
      copy[groupIndex] = { ...copy[groupIndex], [field]: val };
      return copy;
    });
  };

  const handleAddOptionToGroup = (groupIndex: number) => {
    setOptionGroups((prev) => {
      const copy = [...prev];
      const grp = copy[groupIndex];
      const newOptions = [...grp.options, { sku: '', isDefault: grp.options.length === 0, upchargeCents: 0 }];
      copy[groupIndex] = { ...grp, options: newOptions };
      return copy;
    });
  };

  const handleRemoveOptionFromGroup = (groupIndex: number, optIndex: number) => {
    setOptionGroups((prev) => {
      const copy = [...prev];
      const grp = copy[groupIndex];
      copy[groupIndex] = {
        ...grp,
        options: grp.options.filter((_, idx) => idx !== optIndex),
      };
      return copy;
    });
  };

  const handleUpdateOption = (groupIndex: number, optIndex: number, field: keyof ComboItemOption, val: any) => {
    setOptionGroups((prev) => {
      const copy = [...prev];
      const grp = copy[groupIndex];
      const opts = [...grp.options];
      opts[optIndex] = { ...opts[optIndex], [field]: val };
      // Si se marca como default y el grupo es single-select (maxSelections === 1), desmarcar los demás
      if (field === 'isDefault' && val === true && grp.maxSelections === 1) {
        opts.forEach((o, i) => {
          if (i !== optIndex) o.isDefault = false;
        });
      }
      copy[groupIndex] = { ...grp, options: opts };
      return copy;
    });
  };

  const handleToggleComboLink = (linkSku: string) => {
    setComboLinks((prev) =>
      prev.includes(linkSku) ? prev.filter((s) => s !== linkSku) : [...prev, linkSku]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanSku = sku.trim().toUpperCase();
    if (!cleanSku) {
      setError('El SKU es obligatorio (ej. BURGER-OG)');
      return;
    }

    if (!name.trim()) {
      setError('El nombre del producto es obligatorio');
      return;
    }

    const numPrice = Number(price);
    if (Number.isNaN(numPrice) || numPrice < 0) {
      setError('El precio debe ser un número mayor o igual a 0');
      return;
    }

    // Limpiar y estructurar comboConfig
    let comboConfigPayload: MenuItemComboConfig | null = null;
    if (isCombo) {
      const cleanedGroups: ComboOptionGroup[] = optionGroups
        .filter((g) => g.name.trim().length > 0)
        .map((g) => ({
          id: g.id || `group-${Date.now()}`,
          name: g.name.trim(),
          isRequired: Boolean(g.isRequired),
          minSelections: Math.max(0, Number(g.minSelections) || 0),
          maxSelections: Math.max(1, Number(g.maxSelections) || 1),
          options: g.options
            .filter((o) => o.sku.trim().length > 0)
            .map((o) => ({
              sku: o.sku.trim().toUpperCase(),
              isDefault: Boolean(o.isDefault),
              upchargeCents: Math.max(0, Math.round(Number(o.upchargeCents) || 0)),
            })),
        }));

      const numBundlePrice = bundlePrice ? Number(bundlePrice) : numPrice;
      const bundlePriceCents = Number.isFinite(numBundlePrice) && numBundlePrice >= 0
        ? Math.round(numBundlePrice * 100)
        : Math.round(numPrice * 100);

      comboConfigPayload = {
        isCombo: true,
        bundlePriceCents,
        optionGroups: cleanedGroups,
      };
    }

    const payload: CreateMenuItemPayload = {
      sku: cleanSku,
      name: name.trim(),
      description: description.trim(),
      category,
      price: numPrice,
      badge: badge.trim() || undefined,
      sortOrder: Number(sortOrder) || 0,
      isAvailable,
      isHidden,
      isFeatured,
      isPromoActive,
      promoLabel: promoLabel.trim() || undefined,
      promoPrice: isPromoActive && promoPrice ? Number(promoPrice) : null,
      promoExpiresAt: isPromoActive && promoExpiresAt ? new Date(promoExpiresAt).toISOString() : null,
      stockManaged,
      stockLimit: stockManaged && stockLimit ? Number(stockLimit) : null,
      stockRemaining: stockManaged && stockRemaining ? Number(stockRemaining) : null,
      comboLinks: isCombo ? comboLinks : [],
      comboConfig: comboConfigPayload,
    };

    try {
      if (removeExistingImage && item?.sku && onDeleteImage) {
        await onDeleteImage(item.sku);
      }
      await onSave(cleanSku, payload, selectedFile);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Error al guardar el producto');
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

          {/* Sección: Configuración de Combo y Grupos de Opciones */}
          <div className="space-y-4 pt-4 border-t border-line">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-text-muted flex items-center gap-2">
                <Sliders className="w-3.5 h-3.5 text-accent" />
                Configuración de Combo & Opciones
              </h4>
              <Badge variant={isCombo ? 'default' : 'outline'} className="text-[10px]">
                {isCombo ? 'Modo Combo Activo' : 'Producto Individual'}
              </Badge>
            </div>

            <div className="p-4 rounded-3xl bg-surface-raised border border-line space-y-4">
              {/* Main Switch */}
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-text-primary">
                    ¿Es un Combo o Platillo con Opciones?
                  </span>
                  <p className="text-[11px] text-text-secondary">
                    Habilita la selección de guarniciones, bebidas o personalizaciones en la app pública.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isCombo}
                    onChange={(e) => {
                      const next = e.target.checked;
                      setIsCombo(next);
                      if (next) {
                        setIsComboSectionOpen(true);
                        if (optionGroups.length === 0) {
                          handleAddOptionGroup('guarnicion');
                        }
                      }
                    }}
                    className="sr-only peer"
                  />
                  <div className="w-10 h-5 bg-line peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-accent"></div>
                </label>
              </div>

              {isCombo && (
                <div className="space-y-4 pt-2 border-t border-line animate-in fade-in duration-200">
                  {/* Bundle Price & Included Products (comboLinks) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-text-secondary mb-1">
                        Precio Paquete Combo ($ MXN)
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-text-muted">$</span>
                        <input
                          type="number"
                          step="0.5"
                          min="0"
                          placeholder={price || '189.00'}
                          value={bundlePrice}
                          onChange={(e) => setBundlePrice(e.target.value)}
                          className="w-full pl-7 pr-3 py-2 text-xs rounded-xl bg-surface-card border border-line text-text-primary outline-none focus:border-accent font-mono font-bold"
                        />
                      </div>
                      <span className="text-[10px] text-text-muted mt-1 block">
                        Si se deja vacío, tomará el precio regular del producto.
                      </span>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-text-secondary mb-1">
                        Platillos Base Incluidos (comboLinks)
                      </label>
                      <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-2 rounded-xl bg-surface-card border border-line">
                        {(allItems || [])
                          .filter((p) => p.category?.toLowerCase() === 'burgers')
                          .map((b) => {
                            const isLinked = comboLinks.includes(b.sku);
                            return (
                              <button
                                key={b.sku}
                                type="button"
                                onClick={() => handleToggleComboLink(b.sku)}
                                className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all ${
                                  isLinked
                                    ? 'bg-accent text-white shadow-xs'
                                    : 'bg-surface-raised text-text-secondary hover:text-text-primary'
                                }`}
                              >
                                {isLinked ? '✓ ' : '+ '}
                                {b.name}
                              </button>
                            );
                          })}
                      </div>
                      <span className="text-[10px] text-text-muted mt-1 block">
                        Permite que el cliente personalice la receta de la hamburguesa en el checkout.
                      </span>
                    </div>
                  </div>

                  {/* Option Groups Manager */}
                  <div className="space-y-3 pt-2">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <span className="text-xs font-extrabold text-text-primary">
                          Grupos de Opciones ({optionGroups.length})
                        </span>
                        <p className="text-[11px] text-text-secondary">
                          Guarniciones, bebidas o pasos obligatorios/opcionales.
                        </p>
                      </div>

                      {/* Preset Add Buttons */}
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleAddOptionGroup('guarnicion')}
                          className="text-[11px] h-8 px-2.5 rounded-xl border-dashed"
                        >
                          + Guarnición
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleAddOptionGroup('bebida')}
                          className="text-[11px] h-8 px-2.5 rounded-xl border-dashed"
                        >
                          + Bebida
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleAddOptionGroup('custom')}
                          className="text-[11px] h-8 px-2.5 rounded-xl border-dashed"
                        >
                          + Personalizado
                        </Button>
                      </div>
                    </div>

                    {/* Option Groups List */}
                    {optionGroups.length === 0 ? (
                      <div className="p-6 rounded-2xl bg-surface-card border border-dashed border-line text-center space-y-2">
                        <UtensilsCrossed className="w-6 h-6 text-text-muted mx-auto" />
                        <p className="text-xs font-semibold text-text-secondary">
                          Sin grupos de opciones configurados
                        </p>
                        <p className="text-[11px] text-text-muted">
                          Usa los botones superiores para agregar un grupo de guarnición o bebida.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {optionGroups.map((group, gIdx) => (
                          <div
                            key={group.id || gIdx}
                            className="p-3.5 rounded-2xl bg-surface-card border border-line space-y-3 shadow-xs"
                          >
                            {/* Group Header */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-line">
                              <div className="flex items-center gap-2 flex-1">
                                <span className="w-5 h-5 rounded-lg bg-accent-soft text-accent text-xs font-bold flex items-center justify-center shrink-0">
                                  {gIdx + 1}
                                </span>
                                <input
                                  type="text"
                                  value={group.name}
                                  onChange={(e) => handleUpdateOptionGroup(gIdx, 'name', e.target.value)}
                                  placeholder="Nombre del grupo (ej. Elige tu Guarnición)"
                                  className="px-2.5 py-1 text-xs font-bold rounded-lg bg-surface-raised border border-line text-text-primary outline-none focus:border-accent flex-1"
                                />
                              </div>

                              <div className="flex items-center gap-2 shrink-0">
                                <label className="flex items-center gap-1.5 text-[11px] font-semibold text-text-secondary cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={group.isRequired}
                                    onChange={(e) => handleUpdateOptionGroup(gIdx, 'isRequired', e.target.checked)}
                                    className="rounded text-accent focus:ring-accent w-3.5 h-3.5"
                                  />
                                  <span>Obligatorio</span>
                                </label>

                                <div className="flex items-center gap-1 text-[11px] text-text-muted font-mono">
                                  <span>min:</span>
                                  <input
                                    type="number"
                                    min="0"
                                    max="5"
                                    value={group.minSelections}
                                    onChange={(e) => handleUpdateOptionGroup(gIdx, 'minSelections', Number(e.target.value))}
                                    className="w-9 px-1 py-0.5 text-center text-xs rounded bg-surface-raised border border-line"
                                  />
                                  <span>max:</span>
                                  <input
                                    type="number"
                                    min="1"
                                    max="10"
                                    value={group.maxSelections}
                                    onChange={(e) => handleUpdateOptionGroup(gIdx, 'maxSelections', Number(e.target.value))}
                                    className="w-9 px-1 py-0.5 text-center text-xs rounded bg-surface-raised border border-line"
                                  />
                                </div>

                                <button
                                  type="button"
                                  onClick={() => handleRemoveOptionGroup(gIdx)}
                                  className="w-7 h-7 rounded-lg text-text-muted hover:text-destructive hover:bg-destructive/10 flex items-center justify-center transition-colors"
                                  title="Eliminar grupo"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>

                            {/* Options within group */}
                            <div className="space-y-2">
                              {group.options.map((opt, oIdx) => (
                                <div
                                  key={oIdx}
                                  className="flex items-center gap-2 p-2 rounded-xl bg-surface-raised border border-line/60"
                                >
                                  {/* SKU Selector */}
                                  <div className="flex-1 min-w-0">
                                    <select
                                      value={opt.sku}
                                      onChange={(e) => handleUpdateOption(gIdx, oIdx, 'sku', e.target.value)}
                                      className="w-full px-2 py-1 text-xs rounded-lg bg-surface-card border border-line text-text-primary outline-none focus:border-accent font-semibold"
                                    >
                                      <option value="">-- Selecciona producto --</option>
                                      {(allItems || []).map((p) => (
                                        <option key={p.sku} value={p.sku}>
                                          {p.name} ({p.sku})
                                        </option>
                                      ))}
                                    </select>
                                  </div>

                                  {/* Upcharge Input */}
                                  <div className="w-28 shrink-0 flex items-center gap-1">
                                    <span className="text-[10px] text-text-muted font-bold">+$</span>
                                    <input
                                      type="number"
                                      step="1"
                                      min="0"
                                      placeholder="0"
                                      value={(opt.upchargeCents || 0) / 100}
                                      onChange={(e) =>
                                        handleUpdateOption(
                                          gIdx,
                                          oIdx,
                                          'upchargeCents',
                                          Math.round(Number(e.target.value || 0) * 100)
                                        )
                                      }
                                      className="w-full px-2 py-1 text-xs font-mono text-center rounded-lg bg-surface-card border border-line text-text-primary outline-none focus:border-accent font-bold"
                                      title="Cargo extra en pesos MXN"
                                    />
                                  </div>

                                  {/* isDefault Checkbox */}
                                  <label
                                    className="flex items-center gap-1 text-[10px] font-semibold text-text-secondary cursor-pointer shrink-0"
                                    title="Opción seleccionada por defecto"
                                  >
                                    <input
                                      type="checkbox"
                                      checked={Boolean(opt.isDefault)}
                                      onChange={(e) =>
                                        handleUpdateOption(gIdx, oIdx, 'isDefault', e.target.checked)
                                      }
                                      className="rounded text-accent focus:ring-accent w-3.5 h-3.5"
                                    />
                                    <span>Default</span>
                                  </label>

                                  {/* Delete Option */}
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveOptionFromGroup(gIdx, oIdx)}
                                    className="w-6 h-6 rounded-md text-text-muted hover:text-destructive hover:bg-destructive/10 flex items-center justify-center transition-colors shrink-0"
                                    title="Quitar opción"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
                              ))}

                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => handleAddOptionToGroup(gIdx)}
                                className="w-full h-8 rounded-xl border-dashed border-line text-[11px] font-semibold text-text-secondary hover:text-text-primary hover:border-accent"
                              >
                                <Plus className="w-3 h-3 mr-1" />
                                Añadir Opción a este Grupo
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
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
