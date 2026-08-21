/**
 * BannersAdminPanel.tsx — PR-V3-12
 *
 * Submódulo de Administración de Banners Promocionales para el Carrusel Público.
 * Permite crear, editar, reordenar, activar/pausar y subir imágenes a R2.
 */

import React, { useState, useRef } from 'react';
import {
  Image as ImageIcon,
  Plus,
  Edit2,
  Trash2,
  Check,
  X,
  Upload,
  Sparkles,
  Eye,
  EyeOff,
  Layers,
  ArrowRight,
  RefreshCw,
  Palette,
} from 'lucide-react';
import type { CatalogBanner } from '@config/index';
import { Button } from '@ui/button';
import { Badge } from '@ui/badge';
import { useAdminBanners, useAdminMenu } from '../../features/admin/hooks/use-admin';
import type { CreateCatalogBannerPayload, UpdateCatalogBannerPayload } from '../../features/admin/types/admin.types';

const BG_PRESETS = [
  { key: 'gradient-emerald', label: 'Verde Smash', style: 'linear-gradient(135deg, #15803D 0%, #16A34A 100%)', text: '#ffffff' },
  { key: 'gradient-amber', label: 'Fuego Ámbar', style: 'linear-gradient(135deg, #C2410C 0%, #EA580C 100%)', text: '#ffffff' },
  { key: 'gradient-indigo', label: 'Índigo Místico', style: 'linear-gradient(135deg, #4338CA 0%, #6366F1 100%)', text: '#ffffff' },
  { key: 'gradient-rose', label: 'Smash Rose', style: 'linear-gradient(135deg, #BE185D 0%, #E11D48 100%)', text: '#ffffff' },
  { key: 'gradient-cyan', label: 'Cyan Vibrante', style: 'linear-gradient(135deg, #0891B2 0%, #06B6D4 100%)', text: '#ffffff' },
  { key: 'gradient-dark', label: 'Carbón Premium', style: 'linear-gradient(135deg, #18181B 0%, #27272A 100%)', text: '#ffffff' },
];

const BADGE_COLORS = [
  { key: 'emerald', label: 'Verde', cls: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' },
  { key: 'amber', label: 'Ámbar', cls: 'bg-amber-500/20 text-amber-300 border-amber-500/40' },
  { key: 'rose', label: 'Rose', cls: 'bg-rose-500/20 text-rose-300 border-rose-500/40' },
  { key: 'indigo', label: 'Índigo', cls: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40' },
  { key: 'cyan', label: 'Cyan', cls: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40' },
];

export function BannersAdminPanel() {
  const {
    banners,
    isLoading,
    isError,
    error,
    refetchBanners,
    createBannerMutation,
    updateBannerMutation,
    deleteBannerMutation,
    uploadBannerImageMutation,
    deleteBannerImageMutation,
  } = useAdminBanners();

  const { items: menuItems = [], categories: menuCategories = [] } = useAdminMenu();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<CatalogBanner | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [ctaLabel, setCtaLabel] = useState('');
  const [ctaActionType, setCtaActionType] = useState('category');
  const [ctaTarget, setCtaTarget] = useState('');
  const [badgeText, setBadgeText] = useState('');
  const [badgeColor, setBadgeColor] = useState('emerald');
  const [bgPreset, setBgPreset] = useState('gradient-emerald');
  const [sortOrder, setSortOrder] = useState('0');
  const [isActive, setIsActive] = useState(true);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleOpenCreate = () => {
    setEditingBanner(null);
    setTitle('');
    setSubtitle('');
    setCtaLabel('Pedir ahora');
    setCtaActionType('category');
    setCtaTarget('burgers');
    setBadgeText('PROMO');
    setBadgeColor('emerald');
    setBgPreset('gradient-emerald');
    setSortOrder(String(banners.length + 1));
    setIsActive(true);
    setSelectedFile(null);
    setImagePreview(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (banner: CatalogBanner) => {
    setEditingBanner(banner);
    setTitle(banner.title);
    setSubtitle(banner.subtitle || '');
    setCtaLabel(banner.ctaLabel || '');
    setCtaActionType(banner.ctaActionType || 'category');
    setCtaTarget(banner.ctaTarget || '');
    setBadgeText(banner.badgeText || '');
    setBadgeColor(banner.badgeColor || 'emerald');
    setBgPreset(banner.bgPreset || 'gradient-emerald');
    setSortOrder(String(banner.sortOrder ?? 0));
    setIsActive(banner.isActive ?? true);
    setSelectedFile(null);
    setImagePreview(
      banner.imageUrl ||
        (banner.imageKey ? `/api/assets-v2/${encodeURIComponent(banner.imageKey)}` : null)
    );
    setIsModalOpen(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleSaveBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const payload: CreateCatalogBannerPayload = {
      title: title.trim(),
      subtitle: subtitle.trim() || undefined,
      ctaLabel: ctaLabel.trim() || undefined,
      ctaActionType,
      ctaTarget: ctaTarget.trim() || undefined,
      badgeText: badgeText.trim() || undefined,
      badgeColor,
      bgPreset,
      sortOrder: Number(sortOrder) || 0,
      isActive,
    };

    try {
      if (editingBanner) {
        await updateBannerMutation.mutateAsync({ id: editingBanner.id, payload });
        if (selectedFile) {
          await uploadBannerImageMutation.mutateAsync({ id: editingBanner.id, file: selectedFile });
        }
        setNotice('Banner actualizado correctamente.');
      } else {
        const newBanner = await createBannerMutation.mutateAsync(payload);
        if (selectedFile && newBanner?.id) {
          await uploadBannerImageMutation.mutateAsync({ id: newBanner.id, file: selectedFile });
        }
        setNotice('Banner creado con éxito.');
      }
      setIsModalOpen(false);
      setTimeout(() => setNotice(null), 3000);
    } catch {
      // Handled
    }
  };

  const handleToggleActive = async (banner: CatalogBanner) => {
    const nextActive = !banner.isActive;
    try {
      await updateBannerMutation.mutateAsync({ id: banner.id, payload: { isActive: nextActive } });
      setNotice(`Banner "${banner.title}" ${nextActive ? 'activado ✓' : 'pausado ⏸️'}`);
      setTimeout(() => setNotice(null), 2500);
    } catch {
      // Handled
    }
  };

  const handleDeleteBanner = async (id: string) => {
    try {
      await deleteBannerMutation.mutateAsync(id);
      setDeletingId(null);
      setNotice('Banner eliminado del carrusel.');
      setTimeout(() => setNotice(null), 2500);
    } catch {
      // Handled
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Notice */}
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
            <ImageIcon className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-text-primary">
              Banners Promocionales del Catálogo
            </h3>
            <p className="text-xs text-text-secondary">
              Personaliza las tarjetas de bienvenida y ofertas interactivas del carrusel superior.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            onClick={handleOpenCreate}
            className="text-xs font-bold bg-accent text-white"
          >
            <Plus className="w-4 h-4 mr-1" />
            Nuevo Banner
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={() => refetchBanners()}
            className="p-2 h-9 w-9 text-text-secondary"
            title="Refrescar banners"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* Lista de Banners */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-44 rounded-3xl bg-surface-card border border-line animate-pulse p-4" />
          ))}
        </div>
      ) : banners.length === 0 ? (
        <div className="p-12 rounded-3xl bg-surface-card border border-line text-center space-y-3">
          <ImageIcon className="w-10 h-10 text-text-muted mx-auto" />
          <h4 className="text-sm font-bold text-text-primary">No hay banners configurados</h4>
          <p className="text-xs text-text-secondary">Crea el primer banner interactivo para tus clientes.</p>
          <Button type="button" onClick={handleOpenCreate} className="text-xs font-bold bg-accent text-white">
            <Plus className="w-4 h-4 mr-1" />
            Crear Banner
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {banners.map((banner) => {
            const preset = BG_PRESETS.find((p) => p.key === banner.bgPreset) || BG_PRESETS[0];
            const badgeMeta = BADGE_COLORS.find((b) => b.key === banner.badgeColor) || BADGE_COLORS[0];
            const imgUrl = banner.imageUrl || (banner.imageKey ? `/api/assets-v2/${encodeURIComponent(banner.imageKey)}` : null);

            return (
              <div
                key={banner.id}
                className={`rounded-3xl border overflow-hidden flex flex-col justify-between shadow-card transition-all ${
                  banner.isActive ? 'border-line' : 'border-line opacity-60'
                }`}
              >
                {/* Visual Banner Preview Card */}
                <div
                  className="p-6 text-white relative flex flex-col justify-between min-h-[140px]"
                  style={{ background: preset?.style }}
                >
                  <div className="flex items-start justify-between gap-2">
                    {banner.badgeText && (
                      <span className={`text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-lg border ${badgeMeta?.cls}`}>
                        {banner.badgeText}
                      </span>
                    )}
                    <span className="text-[10px] font-bold bg-black/30 px-2 py-0.5 rounded-full ml-auto">
                      Orden: {banner.sortOrder}
                    </span>
                  </div>

                  <div className="space-y-1 my-3">
                    <h4 className="text-base font-extrabold leading-tight text-white">{banner.title}</h4>
                    {banner.subtitle && (
                      <p className="text-xs text-white/80 line-clamp-1">{banner.subtitle}</p>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    {banner.ctaLabel ? (
                      <span className="inline-flex items-center gap-1 text-xs font-bold bg-white text-neutral-900 px-3 py-1 rounded-xl shadow-xs">
                        {banner.ctaLabel}
                        <ArrowRight className="w-3 h-3" />
                      </span>
                    ) : (
                      <div />
                    )}

                    {imgUrl && (
                      <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-md">Con Asset</span>
                    )}
                  </div>
                </div>

                {/* Controles del Banner */}
                <div className="p-4 bg-surface-card border-t border-line flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => handleToggleActive(banner)}
                      className={`text-xs h-8 px-3 rounded-xl font-bold ${
                        banner.isActive ? 'text-accent border-accent/30' : 'text-text-muted'
                      }`}
                    >
                      {banner.isActive ? (
                        <>
                          <Eye className="w-3.5 h-3.5 mr-1 text-accent" />
                          Activo en Carrusel
                        </>
                      ) : (
                        <>
                          <EyeOff className="w-3.5 h-3.5 mr-1" />
                          Pausado
                        </>
                      )}
                    </Button>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => handleOpenEdit(banner)}
                      className="text-xs h-8 px-3 rounded-xl font-bold"
                    >
                      <Edit2 className="w-3.5 h-3.5 mr-1" />
                      Editar
                    </Button>

                    {deletingId === banner.id ? (
                      <div className="flex items-center gap-1">
                        <Button
                          type="button"
                          variant="destructive"
                          onClick={() => handleDeleteBanner(banner.id)}
                          className="text-[10px] h-8 px-2 rounded-xl font-bold"
                        >
                          Sí, borrar
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setDeletingId(null)}
                          className="text-[10px] h-8 px-2 rounded-xl"
                        >
                          No
                        </Button>
                      </div>
                    ) : (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setDeletingId(banner.id)}
                        className="text-xs h-8 px-2.5 rounded-xl text-destructive hover:bg-destructive/10"
                        title="Eliminar banner"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal de Creación / Edición de Banner */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-surface-card w-full max-w-xl rounded-3xl border border-line shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-5 border-b border-line flex items-center justify-between bg-surface-raised/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-accent-soft text-accent flex items-center justify-center font-bold">
                  <Palette className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-text-primary">
                    {editingBanner ? 'Editar Banner' : 'Crear Nuevo Banner'}
                  </h3>
                  <p className="text-xs text-text-secondary">Ajusta los textos, colores de gradiente y acción.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full bg-surface-raised flex items-center justify-center text-text-secondary hover:text-text-primary"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Live WYSIWYG Mockup Preview */}
            <div className="p-4 bg-surface border-b border-line shrink-0">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-text-muted block mb-2">
                👁️ Vista Previa en Vivo (Móvil)
              </span>
              <div
                className="w-full rounded-2xl p-4 sm:p-5 text-white relative overflow-hidden shadow-lg border border-white/15"
                style={{
                  background:
                    BG_PRESETS.find((p) => p.key === bgPreset)?.style ||
                    'linear-gradient(135deg, #15803D 0%, #16A34A 100%)',
                }}
              >
                <div className="flex items-center justify-between gap-3 relative z-10">
                  <div className="space-y-1 max-w-[70%]">
                    {badgeText && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-black/40 text-white text-[10px] font-extrabold uppercase border border-white/20">
                        ⭐ {badgeText}
                      </span>
                    )}
                    <h4 className="text-base font-extrabold leading-tight text-white line-clamp-2">
                      {title || 'Título del Banner'}
                    </h4>
                    {subtitle && (
                      <p className="text-xs text-white/80 line-clamp-1">
                        {subtitle}
                      </p>
                    )}
                    {ctaLabel && (
                      <span className="inline-block mt-2 text-[11px] font-extrabold bg-white/20 hover:bg-white/30 px-3 py-1 rounded-lg backdrop-blur-xs border border-white/30">
                        {ctaLabel} →
                      </span>
                    )}
                  </div>
                  {imagePreview ? (
                    <img
                      src={imagePreview}
                      alt="Banner Preview"
                      className="w-16 h-16 rounded-xl object-cover border border-white/30 shrink-0 shadow-md"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-2xl shrink-0">
                      🍔
                    </div>
                  )}
                </div>
              </div>
            </div>

            <form onSubmit={handleSaveBanner} className="p-6 overflow-y-auto space-y-4 flex-1">
              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1">
                  Título Principal *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. ¡Llegó la nueva BBQ Bacon Smash!"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-surface-raised border border-line text-text-primary outline-none focus:border-accent font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1">
                  Subtítulo / Mensaje Secundario
                </label>
                <input
                  type="text"
                  placeholder="Ej. Doble carne smash con salsa BBQ ahumada casera."
                  value={subtitle}
                  onChange={(e) => setSubtitle(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-surface-raised border border-line text-text-primary outline-none focus:border-accent"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-text-secondary mb-1">
                    Texto del Botón CTA
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. Pedir ahora"
                    value={ctaLabel}
                    onChange={(e) => setCtaLabel(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-surface-raised border border-line text-text-primary outline-none focus:border-accent"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-text-secondary mb-1">
                    Texto de la Etiqueta (Badge)
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. NUEVO, 20% OFF"
                    value={badgeText}
                    onChange={(e) => setBadgeText(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-surface-raised border border-line text-text-primary outline-none focus:border-accent font-bold uppercase"
                  />
                </div>
              </div>

              {/* Selector de Fondo (Preset) */}
              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1.5">
                  Estilo de Gradiente de Fondo
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {BG_PRESETS.map((preset) => (
                    <button
                      key={preset.key}
                      type="button"
                      onClick={() => setBgPreset(preset.key)}
                      className={`h-12 rounded-xl p-2 text-left relative overflow-hidden transition-all flex items-center justify-between text-white text-[11px] font-bold ${
                        bgPreset === preset.key ? 'ring-2 ring-accent ring-offset-2' : 'opacity-80 hover:opacity-100'
                      }`}
                      style={{ background: preset.style }}
                    >
                      <span className="truncate">{preset.label}</span>
                      {bgPreset === preset.key && <Check className="w-3.5 h-3.5 shrink-0 ml-1" />}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-text-secondary mb-1">
                    Tipo de Acción CTA
                  </label>
                  <select
                    value={ctaActionType}
                    onChange={(e) => {
                      const newType = e.target.value;
                      setCtaActionType(newType);
                      if (newType === 'category' && menuCategories[0]) {
                        setCtaTarget(menuCategories[0].key);
                      } else if (newType === 'product' && menuItems[0]) {
                        setCtaTarget(menuItems[0].sku);
                      } else if (newType === 'raffle') {
                        setCtaTarget('/tickets');
                      }
                    }}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-surface-raised border border-line text-text-primary outline-none focus:border-accent"
                  >
                    <option value="category">Filtrar Categoría</option>
                    <option value="product">Abrir Producto</option>
                    <option value="raffle">Ir a Sorteos</option>
                    <option value="url">Enlace Externo</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-text-secondary mb-1">
                    Destino (Target)
                  </label>
                  {ctaActionType === 'category' ? (
                    <select
                      value={ctaTarget}
                      onChange={(e) => setCtaTarget(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl bg-surface-raised border border-line text-text-primary outline-none focus:border-accent"
                    >
                      <option value="">-- Selecciona una categoría --</option>
                      {menuCategories.map((c) => (
                        <option key={c.key} value={c.key}>
                          {c.emoji || '📁'} {c.name} ({c.key})
                        </option>
                      ))}
                    </select>
                  ) : ctaActionType === 'product' ? (
                    <select
                      value={ctaTarget}
                      onChange={(e) => setCtaTarget(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl bg-surface-raised border border-line text-text-primary outline-none focus:border-accent"
                    >
                      <option value="">-- Selecciona un producto --</option>
                      {menuItems.map((p) => (
                        <option key={p.sku} value={p.sku}>
                          {p.name} ({p.sku}) — ${p.price}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      placeholder={ctaActionType === 'url' ? 'https://...' : 'Ej. /tickets o cupón'}
                      value={ctaTarget}
                      onChange={(e) => setCtaTarget(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl bg-surface-raised border border-line text-text-primary outline-none focus:border-accent"
                    />
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-text-secondary mb-1">
                    Orden de Visualización
                  </label>
                  <input
                    type="number"
                    value={sortOrder}
                    onChange={(e) => setSortOrder(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-surface-raised border border-line text-text-primary outline-none focus:border-accent"
                  />
                </div>

                <div className="flex items-end pb-1">
                  <label className="flex items-center gap-2 text-xs font-bold text-text-primary cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isActive}
                      onChange={(e) => setIsActive(e.target.checked)}
                      className="rounded text-accent w-4 h-4"
                    />
                    <span>Activar de inmediato</span>
                  </label>
                </div>
              </div>

              {/* Subida de Imagen */}
              <div className="p-4 rounded-2xl bg-surface-raised border border-line space-y-2">
                <label className="block text-xs font-semibold text-text-secondary">
                  Imagen Opcional de Acompañamiento
                </label>
                <div className="flex items-center gap-3">
                  {imagePreview && (
                    <img src={imagePreview} alt="Preview" className="w-12 h-12 rounded-xl object-cover border border-line" />
                  )}
                  <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
                  <Button
                    type="button"
                    variant="outline"
                    className="text-xs h-8 px-3"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="w-3.5 h-3.5 mr-1" />
                    Subir Imagen
                  </Button>
                </div>
              </div>

              <div className="pt-4 border-t border-line flex items-center justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} className="text-xs">
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={createBannerMutation.isPending || updateBannerMutation.isPending}
                  className="text-xs font-bold bg-accent text-white"
                >
                  <Check className="w-3.5 h-3.5 mr-1" />
                  Guardar Banner
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
