/**
 * BannersAdminPanel.tsx — Chekeo V3
 *
 * Submódulo de Marketing, Promociones y Banners del Carrusel Superior.
 * Integrado con Dynamic UI Components (@ui/kpi-card, @ui/drawer, @ui/badge, @ui/button),
 * Simulador interactivo WYSIWYG en vivo, reordenamiento 1-toque y assets en Cloudflare R2.
 */

import React, { useState, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  ArrowUp,
  ArrowDown,
  CheckCircle2,
  Smartphone,
} from 'lucide-react';
import type { CatalogBanner } from '@config/index';
import { Button } from '@ui/button';
import { Badge } from '@ui/badge';
import { KpiCard } from '@ui/kpi-card';
import { Drawer } from '@ui/drawer';
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

export interface BannersAdminPanelProps {
  activeToolId?: string;
  onSelectTool?: (toolId: string) => void;
}

export function BannersAdminPanel({ activeToolId, onSelectTool }: BannersAdminPanelProps = {}) {
  const {
    banners,
    isLoading,
    refetchBanners,
    createBannerMutation,
    updateBannerMutation,
    deleteBannerMutation,
    uploadBannerImageMutation,
  } = useAdminBanners();

  const { items: menuItems = [], categories: menuCategories = [] } = useAdminMenu();

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
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
    setCtaTarget(menuCategories[0]?.key || 'burgers');
    setBadgeText('PROMO');
    setBadgeColor('emerald');
    setBgPreset('gradient-emerald');
    setSortOrder(String(banners.length + 1));
    setIsActive(true);
    setSelectedFile(null);
    setImagePreview(null);
    setIsDrawerOpen(true);
  };

  React.useEffect(() => {
    if (activeToolId === 'create') {
      handleOpenCreate();
    }
  }, [activeToolId]);

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
    setIsDrawerOpen(true);
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
        setNotice(`Banner "${title}" actualizado correctamente.`);
      } else {
        const newBanner = await createBannerMutation.mutateAsync(payload);
        if (selectedFile && newBanner?.id) {
          await uploadBannerImageMutation.mutateAsync({ id: newBanner.id, file: selectedFile });
        }
        setNotice(`Banner "${title}" publicado con éxito.`);
      }
      setIsDrawerOpen(false);
      setTimeout(() => setNotice(null), 3000);
    } catch {
      // Handled
    }
  };

  const handleToggleActive = async (banner: CatalogBanner) => {
    const nextActive = !banner.isActive;
    try {
      await updateBannerMutation.mutateAsync({ id: banner.id, payload: { isActive: nextActive } });
      setNotice(`Banner "${banner.title}" ${nextActive ? 'activado en tienda ✓' : 'pausado ⏸️'}`);
      setTimeout(() => setNotice(null), 2500);
    } catch {
      // Handled
    }
  };

  const handleMoveOrder = async (banner: CatalogBanner, direction: 'up' | 'down') => {
    const sorted = [...banners].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
    const index = sorted.findIndex((b) => b.id === banner.id);
    if (index === -1) return;

    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= sorted.length) return;

    const targetBanner = sorted[targetIndex];
    const currentOrder = banner.sortOrder ?? index + 1;
    const targetOrder = targetBanner.sortOrder ?? targetIndex + 1;

    try {
      await updateBannerMutation.mutateAsync({ id: banner.id, payload: { sortOrder: targetOrder } });
      await updateBannerMutation.mutateAsync({ id: targetBanner.id, payload: { sortOrder: currentOrder } });
      setNotice('Orden de banners actualizado.');
      setTimeout(() => setNotice(null), 2000);
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

  // KPIs
  const stats = useMemo(() => {
    const total = banners.length;
    const active = banners.filter((b) => b.isActive).length;
    const paused = total - active;
    const withAssets = banners.filter((b) => b.imageUrl || b.imageKey).length;
    return { total, active, paused, withAssets };
  }, [banners]);

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

      {/* 1. Tarjetas KPI Reactivas (@ui/kpi-card) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard
          title="Total Banners"
          value={stats.total}
          subtitle="Campañas creadas"
          icon={<ImageIcon className="w-4 h-4" />}
          variant="default"
        />
        <KpiCard
          title="Activos en Tienda"
          value={stats.active}
          subtitle="Visibles en el carrusel"
          icon={<Check className="w-4 h-4" />}
          variant="accent"
        />
        <KpiCard
          title="Banners Pausados"
          value={stats.paused}
          subtitle="Desactivados temporalmente"
          icon={<EyeOff className="w-4 h-4" />}
          variant="warning"
        />
        <KpiCard
          title="Con Imagen R2"
          value={stats.withAssets}
          subtitle="Optimizados para CDN"
          icon={<Layers className="w-4 h-4" />}
          variant="info"
        />
      </div>

      {/* 2. Banner de Cabecera con Botón de Creación */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-surface-card p-4 rounded-3xl border border-line shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-accent/15 text-accent flex items-center justify-center font-bold shrink-0">
            <Palette className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-black text-text-primary">
              Diseñador de Banners & Marketing
            </h3>
            <p className="text-xs text-text-secondary">
              Gestiona los anuncios visuales, promociones y llamados a la acción de la cabecera.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Button
            type="button"
            onClick={handleOpenCreate}
            className="text-xs font-black bg-accent text-white h-8.5 px-3 rounded-xl cursor-pointer active:scale-95"
          >
            <Plus className="w-3.5 h-3.5 mr-1" />
            Nuevo Banner
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={() => refetchBanners()}
            className="p-2 h-8.5 w-8.5 text-text-secondary hover:text-text-primary rounded-xl cursor-pointer"
            title="Refrescar banners"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* 3. Grid de Banners con Reordenamiento */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-48 rounded-3xl bg-surface-card border border-line animate-pulse p-4" />
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
        <motion.div layout className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
          <AnimatePresence>
            {banners.map((banner, index) => {
              const preset = BG_PRESETS.find((p) => p.key === banner.bgPreset) || BG_PRESETS[0];
              const badgeMeta = BADGE_COLORS.find((b) => b.key === banner.badgeColor) || BADGE_COLORS[0];
              const imgUrl = banner.imageUrl || (banner.imageKey ? `/api/assets-v2/${encodeURIComponent(banner.imageKey)}` : null);

              return (
                <motion.div
                  key={banner.id}
                  layout
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  className={`rounded-3xl border overflow-hidden flex flex-col justify-between shadow-card transition-all ${
                    banner.isActive ? 'border-line hover:border-accent/40' : 'border-line opacity-60'
                  }`}
                >
                  {/* Tarjeta Visual de Banner */}
                  <div
                    className="p-5 sm:p-6 text-white relative flex flex-col justify-between min-h-[150px] shadow-inner"
                    style={{ background: preset?.style }}
                  >
                    <div className="flex items-start justify-between gap-2">
                      {banner.badgeText && (
                        <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-lg border ${badgeMeta?.cls}`}>
                          {banner.badgeText}
                        </span>
                      )}
                      <div className="flex items-center gap-1 ml-auto">
                        <button
                          type="button"
                          onClick={() => handleMoveOrder(banner, 'up')}
                          disabled={index === 0}
                          className="w-6 h-6 rounded-lg bg-black/40 text-white flex items-center justify-center disabled:opacity-30 cursor-pointer hover:bg-black/60"
                          title="Mover antes"
                        >
                          <ArrowUp className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMoveOrder(banner, 'down')}
                          disabled={index === banners.length - 1}
                          className="w-6 h-6 rounded-lg bg-black/40 text-white flex items-center justify-center disabled:opacity-30 cursor-pointer hover:bg-black/60"
                          title="Mover después"
                        >
                          <ArrowDown className="w-3 h-3" />
                        </button>
                        <span className="text-[10px] font-mono font-bold bg-black/40 px-2 py-0.5 rounded-full ml-1">
                          #{banner.sortOrder}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-1 my-3">
                      <h4 className="text-base sm:text-lg font-black leading-tight text-white">{banner.title}</h4>
                      {banner.subtitle && (
                        <p className="text-xs text-white/90 line-clamp-2">{banner.subtitle}</p>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      {banner.ctaLabel ? (
                        <span className="inline-flex items-center gap-1 text-xs font-black bg-white text-neutral-900 px-3 py-1 rounded-xl shadow-xs">
                          {banner.ctaLabel}
                          <ArrowRight className="w-3 h-3" />
                        </span>
                      ) : (
                        <div />
                      )}

                      {imgUrl && (
                        <span className="text-[10px] font-bold bg-white/20 px-2 py-0.5 rounded-md">Con Foto R2</span>
                      )}
                    </div>
                  </div>

                  {/* Barra de Acciones del Banner */}
                  <div className="p-3.5 sm:p-4 bg-surface-card border-t border-line flex items-center justify-between gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggleActive(banner)}
                      className={`text-xs h-8 px-3 rounded-xl font-bold cursor-pointer active:scale-95 ${
                        banner.isActive ? 'text-accent border-accent/30' : 'text-text-muted'
                      }`}
                    >
                      {banner.isActive ? (
                        <>
                          <Eye className="w-3.5 h-3.5 mr-1 text-accent" />
                          En Carrusel
                        </>
                      ) : (
                        <>
                          <EyeOff className="w-3.5 h-3.5 mr-1" />
                          Pausado
                        </>
                      )}
                    </Button>

                    <div className="flex items-center gap-1.5">
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => handleOpenEdit(banner)}
                        className="text-xs h-8 px-3 rounded-xl font-black cursor-pointer active:scale-95"
                      >
                        <Edit2 className="w-3.5 h-3.5 mr-1" />
                        Editar
                      </Button>

                      {deletingId === banner.id ? (
                        <div className="flex items-center gap-1">
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeleteBanner(banner.id)}
                            className="text-[10px] h-8 px-2 rounded-xl font-bold"
                          >
                            Sí
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
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
                          size="sm"
                          onClick={() => setDeletingId(banner.id)}
                          className="text-xs h-8 px-2.5 rounded-xl text-destructive hover:bg-destructive/10 cursor-pointer active:scale-95"
                          title="Eliminar banner"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>
      )}

      {/* 4. Drawer de Creación / Edición de Banner */}
      <Drawer
        open={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        title={
          <div className="flex items-center gap-2">
            <Palette className="w-5 h-5 text-accent" />
            <span>{editingBanner ? 'Editar Banner' : 'Crear Nuevo Banner'}</span>
          </div>
        }
        description="Personaliza el diseño visual, gradientes y acciones interactivas."
        className="max-w-xl"
      >
        <div className="space-y-4 pt-1">
          {/* Live Mobile Mockup Preview */}
          <div className="p-4 rounded-2xl bg-surface-raised border border-line space-y-2">
            <span className="text-[11px] font-black uppercase tracking-wider text-text-muted flex items-center gap-1.5">
              <Smartphone className="w-3.5 h-3.5 text-accent" />
              Vista Previa en Vivo (Móvil)
            </span>
            <div
              className="w-full rounded-2xl p-4 sm:p-5 text-white relative overflow-hidden shadow-md border border-white/20"
              style={{
                background:
                  BG_PRESETS.find((p) => p.key === bgPreset)?.style ||
                  'linear-gradient(135deg, #15803D 0%, #16A34A 100%)',
              }}
            >
              <div className="flex items-center justify-between gap-3 relative z-10">
                <div className="space-y-1 max-w-[70%]">
                  {badgeText && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-black/40 text-white text-[10px] font-black uppercase border border-white/20">
                      ⭐ {badgeText}
                    </span>
                  )}
                  <h4 className="text-base font-black leading-tight text-white line-clamp-2">
                    {title || 'Título del Banner'}
                  </h4>
                  {subtitle && (
                    <p className="text-xs text-white/90 line-clamp-2">
                      {subtitle}
                    </p>
                  )}
                  {ctaLabel && (
                    <span className="inline-block mt-2 text-[11px] font-black bg-white/25 hover:bg-white/35 px-3 py-1 rounded-lg backdrop-blur-xs border border-white/30 text-white">
                      {ctaLabel} →
                    </span>
                  )}
                </div>
                {imagePreview ? (
                  <img
                    src={imagePreview}
                    alt="Banner Preview"
                    className="w-16 h-16 rounded-2xl object-cover border border-white/30 shrink-0 shadow-md"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-2xl bg-white/15 border border-white/25 flex items-center justify-center text-2xl shrink-0">
                    🍔
                  </div>
                )}
              </div>
            </div>
          </div>

          <form onSubmit={handleSaveBanner} className="space-y-4">
            <div>
              <label className="block text-[11px] font-bold text-text-secondary mb-1">
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
              <label className="block text-[11px] font-bold text-text-secondary mb-1">
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
                <label className="block text-[11px] font-bold text-text-secondary mb-1">
                  Texto del Botón CTA
                </label>
                <input
                  type="text"
                  placeholder="Ej. Pedir ahora"
                  value={ctaLabel}
                  onChange={(e) => setCtaLabel(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-surface-raised border border-line text-text-primary outline-none focus:border-accent font-medium"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-text-secondary mb-1">
                  Etiqueta (Badge)
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

            {/* Presets de Gradiente */}
            <div>
              <label className="block text-[11px] font-bold text-text-secondary mb-1.5">
                Estilo de Gradiente de Fondo
              </label>
              <div className="grid grid-cols-3 gap-2">
                {BG_PRESETS.map((preset) => (
                  <button
                    key={preset.key}
                    type="button"
                    onClick={() => setBgPreset(preset.key)}
                    className={`h-11 rounded-xl p-2 text-left relative overflow-hidden transition-all flex items-center justify-between text-white text-[10px] font-black cursor-pointer ${
                      bgPreset === preset.key ? 'ring-2 ring-accent ring-offset-2 scale-102' : 'opacity-85 hover:opacity-100'
                    }`}
                    style={{ background: preset.style }}
                  >
                    <span className="truncate">{preset.label}</span>
                    {bgPreset === preset.key && <Check className="w-3.5 h-3.5 shrink-0 ml-1" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Selector de Destino */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-text-secondary mb-1">
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
                  className="w-full px-3 py-2 text-xs rounded-xl bg-surface-raised border border-line text-text-primary outline-none focus:border-accent font-bold"
                >
                  <option value="category">Filtrar Categoría</option>
                  <option value="product">Abrir Producto</option>
                  <option value="raffle">Ir a Sorteos</option>
                  <option value="url">Enlace Externo</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-text-secondary mb-1">
                  Destino (Target)
                </label>
                {ctaActionType === 'category' ? (
                  <select
                    value={ctaTarget}
                    onChange={(e) => setCtaTarget(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-surface-raised border border-line text-text-primary outline-none focus:border-accent font-medium"
                  >
                    {menuCategories.map((c) => (
                      <option key={c.key} value={c.key}>
                        {c.emoji || '📁'} {c.name}
                      </option>
                    ))}
                  </select>
                ) : ctaActionType === 'product' ? (
                  <select
                    value={ctaTarget}
                    onChange={(e) => setCtaTarget(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-surface-raised border border-line text-text-primary outline-none focus:border-accent font-medium"
                  >
                    {menuItems.map((p) => (
                      <option key={p.sku} value={p.sku}>
                        {p.name} (${p.price})
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    placeholder={ctaActionType === 'url' ? 'https://...' : 'Ej. /tickets'}
                    value={ctaTarget}
                    onChange={(e) => setCtaTarget(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-surface-raised border border-line text-text-primary outline-none focus:border-accent font-medium"
                  />
                )}
              </div>
            </div>

            {/* Imagen R2 */}
            <div className="p-3.5 rounded-2xl bg-surface-raised border border-line flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                {imagePreview ? (
                  <img src={imagePreview} alt="Preview" className="w-10 h-10 rounded-xl object-cover border border-line" />
                ) : (
                  <div className="w-10 h-10 rounded-xl bg-surface-card border border-line flex items-center justify-center text-text-muted">
                    <ImageIcon className="w-5 h-5" />
                  </div>
                )}
                <div>
                  <p className="text-xs font-bold text-text-primary">Foto del Banner</p>
                  <p className="text-[10px] text-text-muted">JPG, PNG o WebP</p>
                </div>
              </div>

              <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="text-xs h-8 px-3 rounded-xl"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="w-3.5 h-3.5 mr-1" />
                Subir
              </Button>
            </div>

            <div className="pt-3 border-t border-line flex items-center justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsDrawerOpen(false)} className="text-xs rounded-xl">
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={createBannerMutation.isPending || updateBannerMutation.isPending}
                className="text-xs font-black bg-accent text-white rounded-xl cursor-pointer active:scale-95"
              >
                <Check className="w-3.5 h-3.5 mr-1" />
                Guardar Banner
              </Button>
            </div>
          </form>
        </div>
      </Drawer>
    </div>
  );
}
