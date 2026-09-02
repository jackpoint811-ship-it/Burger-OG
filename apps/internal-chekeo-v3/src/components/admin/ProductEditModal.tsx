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
  Sliders,
  UtensilsCrossed,
  Plus,
} from 'lucide-react';
import type { MenuItem, MenuCategory, MenuItemComboConfig, ComboOptionGroup, ComboItemOption } from '@config/index';
import { Drawer } from '@ui/drawer';
import { Button } from '@ui/button';
import { Badge } from '@ui/badge';
import type { CreateMenuItemPayload, UpdateMenuItemPayload } from '../../features/admin/types/admin.types';

export interface ProductEditModalProps {
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

  // Combo states
  const [isCombo, setIsCombo] = useState(false);
  const [bundlePrice, setBundlePrice] = useState('');
  const [comboLinks, setComboLinks] = useState<string[]>([]);
  const [optionGroups, setOptionGroups] = useState<ComboOptionGroup[]>([]);

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

      const existingComboConfig = item.comboConfig as MenuItemComboConfig | undefined;
      const itemIsCombo = Boolean(existingComboConfig?.isCombo || item.category === 'combos');
      setIsCombo(itemIsCombo);
      setBundlePrice(existingComboConfig?.bundlePriceCents ? String(existingComboConfig.bundlePriceCents / 100) : '');
      setComboLinks(Array.isArray(item.comboLinks) ? item.comboLinks : []);
      setOptionGroups(Array.isArray(existingComboConfig?.optionGroups) ? JSON.parse(JSON.stringify(existingComboConfig.optionGroups)) : []);

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

  // Helpers de Combo y Grupos de Opciones
  const handleAddOptionGroup = (type: 'guarnicion' | 'bebida' | 'custom') => {
    let newGroup: ComboOptionGroup;
    if (type === 'guarnicion') {
      const sideItems = (allItems || []).filter((p) => p.category?.toLowerCase() === 'sides');
      newGroup = {
        id: `side-${Date.now()}`,
        name: 'Elige tu Guarnición',
        isRequired: true,
        minSelections: 1,
        maxSelections: 1,
        options: sideItems.length > 0
          ? sideItems.map((s, idx) => ({
              sku: s.sku,
              isDefault: idx === 0,
              upchargeCents: 0,
            }))
          : [{ sku: 'SIDE-FRIES', isDefault: true, upchargeCents: 0 }],
      };
    } else if (type === 'bebida') {
      const drinkItems = (allItems || []).filter((p) => p.category?.toLowerCase() === 'drinks');
      newGroup = {
        id: `drink-${Date.now()}`,
        name: 'Elige tu Bebida',
        isRequired: true,
        minSelections: 1,
        maxSelections: 1,
        options: drinkItems.length > 0
          ? drinkItems.map((d, idx) => ({
              sku: d.sku,
              isDefault: idx === 0,
              upchargeCents: 0,
            }))
          : [{ sku: 'DRINK-COKE', isDefault: true, upchargeCents: 0 }],
      };
    } else {
      newGroup = {
        id: `opt-${Date.now()}`,
        name: 'Grupo de Opciones',
        isRequired: false,
        minSelections: 0,
        maxSelections: 1,
        options: [{ sku: '', isDefault: false, upchargeCents: 0 }],
      };
    }
    setOptionGroups((prev) => [...prev, newGroup]);
  };

  const handleRemoveOptionGroup = (index: number) => {
    setOptionGroups((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleUpdateOptionGroup = (index: number, field: keyof ComboOptionGroup, value: any) => {
    setOptionGroups((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleAddOptionToGroup = (groupIndex: number) => {
    setOptionGroups((prev) => {
      const updated = [...prev];
      const group = updated[groupIndex];
      const firstAvailableSku = (allItems || [])[0]?.sku || '';
      group.options = [
        ...group.options,
        { sku: firstAvailableSku, isDefault: false, upchargeCents: 0 },
      ];
      return updated;
    });
  };

  const handleRemoveOptionFromGroup = (groupIndex: number, optionIndex: number) => {
    setOptionGroups((prev) => {
      const updated = [...prev];
      updated[groupIndex].options = updated[groupIndex].options.filter((_, idx) => idx !== optionIndex);
      return updated;
    });
  };

  const handleUpdateOption = (
    groupIndex: number,
    optionIndex: number,
    field: keyof ComboItemOption,
    value: any
  ) => {
    setOptionGroups((prev) => {
      const updated = [...prev];
      const options = [...updated[groupIndex].options];
      if (field === 'isDefault' && value === true) {
        options.forEach((opt, idx) => {
          opt.isDefault = idx === optionIndex;
        });
      } else {
        options[optionIndex] = { ...options[optionIndex], [field]: value };
      }
      updated[groupIndex].options = options;
      return updated;
    });
  };

  const handleToggleComboLink = (burgerSku: string) => {
    setComboLinks((prev) =>
      prev.includes(burgerSku) ? prev.filter((s) => s !== burgerSku) : [...prev, burgerSku]
    );
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

    let comboConfigPayload: MenuItemComboConfig | null = null;
    if (isCombo) {
      const parsedBundle = bundlePrice.trim() ? parseFloat(bundlePrice) : cleanPrice;
      const validOptionGroups: ComboOptionGroup[] = optionGroups
        .filter((g) => g.name.trim().length > 0)
        .map((g) => ({
          ...g,
          options: g.options.filter((o) => o.sku.trim().length > 0),
        }));

      comboConfigPayload = {
        isCombo: true,
        bundlePriceCents: Math.round(parsedBundle * 100),
        optionGroups: validOptionGroups,
      };
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
      comboLinks: isCombo ? comboLinks : [],
      comboConfig: comboConfigPayload,
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

        {/* Sección: Configuración de Combo & Opciones */}
        <div className="p-4 rounded-2xl bg-surface-raised border border-line space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-text-primary flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-accent" />
                Configuración de Combo & Opciones
              </span>
              <p className="text-[10px] text-text-muted">
                Habilita selección de guarniciones, bebidas o personalizaciones en la tienda pública.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={isCombo}
                onChange={(e) => {
                  const next = e.target.checked;
                  setIsCombo(next);
                  if (next && optionGroups.length === 0) {
                    handleAddOptionGroup('guarnicion');
                  }
                }}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-line peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-accent cursor-pointer" />
            </label>
          </div>

          {isCombo && (
            <div className="space-y-4 pt-2 border-t border-line/60 animate-in fade-in duration-200">
              {/* Bundle Price & Included Burgers */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-text-secondary mb-1">
                    Precio Paquete Combo ($ MXN)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    placeholder={price || '189.00'}
                    value={bundlePrice}
                    onChange={(e) => setBundlePrice(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs rounded-xl bg-surface-card border border-line text-text-primary outline-none focus:border-accent font-mono font-bold"
                  />
                  <span className="text-[10px] text-text-muted mt-1 block">
                    Si se deja vacío, tomará el precio regular del producto.
                  </span>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-text-secondary mb-1">
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
                            className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
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
                    <span className="text-xs font-bold text-text-primary">
                      Grupos de Opciones ({optionGroups.length})
                    </span>
                    <p className="text-[10px] text-text-muted">
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
                      className="text-[10px] h-7 px-2 rounded-lg border-dashed"
                    >
                      + Guarnición
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleAddOptionGroup('bebida')}
                      className="text-[10px] h-7 px-2 rounded-lg border-dashed"
                    >
                      + Bebida
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleAddOptionGroup('custom')}
                      className="text-[10px] h-7 px-2 rounded-lg border-dashed"
                    >
                      + Personalizado
                    </Button>
                  </div>
                </div>

                {/* Option Groups List */}
                {optionGroups.length === 0 ? (
                  <div className="p-4 rounded-xl bg-surface-card border border-dashed border-line text-center space-y-1">
                    <UtensilsCrossed className="w-5 h-5 text-text-muted mx-auto" />
                    <p className="text-xs font-semibold text-text-secondary">
                      Sin grupos de opciones configurados
                    </p>
                    <p className="text-[10px] text-text-muted">
                      Usa los botones superiores para agregar un grupo de guarnición o bebida.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {optionGroups.map((group, gIdx) => (
                      <div
                        key={group.id || gIdx}
                        className="p-3 rounded-xl bg-surface-card border border-line space-y-2.5 shadow-xs"
                      >
                        {/* Group Header */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-line/60">
                          <div className="flex items-center gap-2 flex-1">
                            <span className="w-5 h-5 rounded-md bg-accent/15 text-accent text-[11px] font-bold flex items-center justify-center shrink-0">
                              {gIdx + 1}
                            </span>
                            <input
                              type="text"
                              value={group.name}
                              onChange={(e) => handleUpdateOptionGroup(gIdx, 'name', e.target.value)}
                              placeholder="Nombre del grupo (ej. Elige tu Guarnición)"
                              className="px-2 py-1 text-xs font-bold rounded-lg bg-surface-raised border border-line text-text-primary outline-none focus:border-accent flex-1"
                            />
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <label className="flex items-center gap-1 text-[11px] font-semibold text-text-secondary cursor-pointer">
                              <input
                                type="checkbox"
                                checked={group.isRequired}
                                onChange={(e) => handleUpdateOptionGroup(gIdx, 'isRequired', e.target.checked)}
                                className="rounded text-accent focus:ring-accent w-3.5 h-3.5"
                              />
                              <span>Obligatorio</span>
                            </label>

                            <div className="flex items-center gap-1 text-[10px] text-text-muted font-mono">
                              <span>min:</span>
                              <input
                                type="number"
                                min="0"
                                max="5"
                                value={group.minSelections}
                                onChange={(e) => handleUpdateOptionGroup(gIdx, 'minSelections', Number(e.target.value))}
                                className="w-8 px-1 py-0.5 text-center text-xs rounded bg-surface-raised border border-line"
                              />
                              <span>max:</span>
                              <input
                                type="number"
                                min="1"
                                max="10"
                                value={group.maxSelections}
                                onChange={(e) => handleUpdateOptionGroup(gIdx, 'maxSelections', Number(e.target.value))}
                                className="w-8 px-1 py-0.5 text-center text-xs rounded bg-surface-raised border border-line"
                              />
                            </div>

                            <button
                              type="button"
                              onClick={() => handleRemoveOptionGroup(gIdx)}
                              className="w-6 h-6 rounded-md text-text-muted hover:text-destructive hover:bg-destructive/10 flex items-center justify-center transition-colors cursor-pointer"
                              title="Eliminar grupo"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Options within group */}
                        <div className="space-y-1.5">
                          {group.options.map((opt, oIdx) => (
                            <div
                              key={oIdx}
                              className="flex items-center gap-2 p-1.5 rounded-lg bg-surface-raised border border-line/60"
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
                              <div className="w-24 shrink-0 flex items-center gap-1">
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
                                  className="w-full px-1.5 py-1 text-xs font-mono text-center rounded-lg bg-surface-card border border-line text-text-primary outline-none focus:border-accent font-bold"
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
                                className="w-6 h-6 rounded-md text-text-muted hover:text-destructive hover:bg-destructive/10 flex items-center justify-center transition-colors shrink-0 cursor-pointer"
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
                            className="w-full h-7 rounded-lg border-dashed border-line text-[10px] font-semibold text-text-secondary hover:text-text-primary hover:border-accent"
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
