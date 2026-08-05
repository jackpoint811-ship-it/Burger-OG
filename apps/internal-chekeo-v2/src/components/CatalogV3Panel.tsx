import { useCallback, useEffect, useState } from 'react';
import type { CatalogBanner, PublicConfig } from '@config/index';
import { DEFAULT_CATALOG_SETTINGS } from '@config/index';
import { Button, Card } from '@ui/index';
import {
  ChefHat,
  ChevronLeft,
  Clock,
  Image as ImageIcon,
  Power,
  Store,
  Gift,
  Upload,
  Trash2,
  ArrowUp,
  ArrowDown,
  Eye,
  EyeOff,
  Type,
  Pencil,
  Calendar,
} from 'lucide-react';
import { CatalogAdminPanel } from './CatalogAdminPanel';
import { fetchRaffleCampaignsV2, updateRaffleCampaignV2 } from '../lib/raffles-v2-admin';

/* ──────────────────────────── types ──────────────────────────── */

type V3Section = 'home' | 'menu' | 'banners' | 'tienda' | 'sorteo';

type StoreStatus = { open: boolean; loading: boolean; error: string | null };

type BannerSlot = CatalogBanner & { _localFile?: File; _previewUrl?: string };

type RaffleCampaignMinimal = {
  id: string;
  title: string;
  isActive: boolean;
};

type TowerSchedule = {
  id: string;
  towerKey: string;
  towerName: string;
  emoji: string;
  activeDays: number[];
  orderStartTime: string;
  orderEndTime: string;
  deliveryStartTime: string;
  deliveryEndTime: string;
  deliveryLabel: string | null;
  isActive: boolean;
};

type BannerCreateMode = 'image' | 'text';

/* ──────────────────────────── constants ──────────────────────────── */

const MAX_BANNERS = 7;
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];

const DAY_LABELS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const DAY_INDICES = [0, 1, 2, 3, 4, 5, 6];

const BG_PRESETS: Array<{ key: string; label: string; style: React.CSSProperties }> = [
  { key: 'green', label: 'Verde', style: { background: 'linear-gradient(135deg, #16A34A, #059669)' } },
  { key: 'blue', label: 'Azul', style: { background: 'linear-gradient(135deg, #2563EB, #1D4ED8)' } },
  { key: 'purple', label: 'Morado', style: { background: 'linear-gradient(135deg, #7C3AED, #6D28D9)' } },
  { key: 'orange', label: 'Naranja', style: { background: 'linear-gradient(135deg, #EA580C, #DC2626)' } },
  { key: 'dark', label: 'Oscuro', style: { background: 'linear-gradient(135deg, #18181B, #27272A)' } },
  { key: 'gold', label: 'Dorado', style: { background: 'linear-gradient(135deg, #CA8A04, #B45309)' } },
];

const sectionCards: Array<{
  key: V3Section;
  icon: typeof ChefHat;
  title: string;
  description: string;
}> = [
  {
    key: 'menu',
    icon: ChefHat,
    title: 'Menú y Productos',
    description: 'Edita tu menú y precios',
  },
  {
    key: 'banners',
    icon: ImageIcon,
    title: 'Banners',
    description: 'Agrega o cambia tus imágenes promocionales',
  },
  {
    key: 'tienda',
    icon: Store,
    title: 'Mi Tienda',
    description: 'Horarios y abrir/cerrar',
  },
  {
    key: 'sorteo',
    icon: Gift,
    title: 'Sorteo',
    description: 'Activa o apaga tu sorteo',
  },
];

/* ──────────────────────────── helpers ──────────────────────────── */

const getAssetUrl = (imageUrl?: string, imageKey?: string): string | undefined => {
  const trimmedUrl = imageUrl?.trim();
  if (
    trimmedUrl &&
    ((trimmedUrl.startsWith('/') && !trimmedUrl.startsWith('//')) ||
      trimmedUrl.startsWith('https://'))
  )
    return trimmedUrl;
  const trimmedKey = imageKey?.trim();
  if (!trimmedKey) return undefined;
  return `/api/assets-v2/${trimmedKey
    .split('/')
    .map((s) => encodeURIComponent(s))
    .join('/')}`;
};

const formatDays = (days: number[]): string => {
  if (days.length === 0) return 'Ningún día';
  return days
    .sort((a, b) => a - b)
    .map((d) => DAY_LABELS[d] ?? '?')
    .join(', ');
};

/* ──────────────────────────── sub-components ──────────────────────────── */

/** Big toggle button used by store open/close and raffle on/off */
const BigToggle = ({
  active,
  loading,
  labelOn,
  labelOff,
  onToggle,
}: {
  active: boolean;
  loading: boolean;
  labelOn: string;
  labelOff: string;
  onToggle: () => void;
}) => (
  <button
    type="button"
    className={`v3-big-toggle ${active ? 'v3-big-toggle--active' : ''}`}
    onClick={onToggle}
    disabled={loading}
    aria-pressed={active}
  >
    <span className="v3-big-toggle__indicator">
      <Power size={28} aria-hidden="true" />
    </span>
    <span className="v3-big-toggle__copy">
      <span className="v3-big-toggle__status">
        {loading ? 'Actualizando…' : active ? 'ENCENDIDO' : 'APAGADO'}
      </span>
      <span className="v3-big-toggle__label">{active ? labelOn : labelOff}</span>
    </span>
  </button>
);

/** Section header with back button */
const SectionHeader = ({
  title,
  onBack,
}: {
  title: string;
  onBack: () => void;
}) => (
  <div className="v3-section-header">
    <button type="button" className="v3-back-btn" onClick={onBack} aria-label="Volver">
      <ChevronLeft size={20} aria-hidden="true" />
      <span>Volver</span>
    </button>
    <h2 className="v3-section-title">{title}</h2>
  </div>
);

const DEFAULT_PUBLIC_BANNERS_SLOTS: BannerSlot[] = [
  {
    id: 'cb-default-1',
    title: '🔥 COMBO OVERCLOCK 2x1',
    subtitle: 'Lleva 2 combos seleccionados por el precio de 1',
    ctaLabel: 'Ver combo',
    bgPreset: 'green',
    badgeText: '🔥 PROMO 2X1',
    isActive: true,
    sortOrder: 1,
  },
  {
    id: 'cb-default-2',
    title: '🎮 BUNDLE GAMER NIGHT',
    subtitle: 'Smash Burger + Papas Overclock + Bebida Cyber',
    ctaLabel: 'Pedir bundle',
    bgPreset: 'purple',
    badgeText: '🎮 DESTACADO',
    isActive: true,
    sortOrder: 2,
  },
  {
    id: 'cb-default-3',
    title: '⚡ ENVÍO GRATIS $0',
    subtitle: 'En entregas programadas a tu oficina',
    ctaLabel: 'Ordenar ahora',
    bgPreset: 'orange',
    badgeText: '⚡ ENVÍO $0',
    isActive: true,
    sortOrder: 3,
  },
];

/* ──────────────────── Section: Banners ──────────────────── */

const BannersSection = ({ onBack }: { onBack: () => void }) => {
  const [banners, setBanners] = useState<BannerSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  // New banner form state
  const [showForm, setShowForm] = useState(false);
  const [createMode, setCreateMode] = useState<BannerCreateMode>('image');
  const [newTitle, setNewTitle] = useState('');
  const [newSubtitle, setNewSubtitle] = useState('');
  const [newBadgeText, setNewBadgeText] = useState('');
  const [newCtaLabel, setNewCtaLabel] = useState('');
  const [newBgPreset, setNewBgPreset] = useState('green');
  const [newFile, setNewFile] = useState<File | null>(null);

  // Edit banner form state
  const [editingBanner, setEditingBanner] = useState<BannerSlot | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editSubtitle, setEditSubtitle] = useState('');
  const [editBadgeText, setEditBadgeText] = useState('');
  const [editCtaLabel, setEditCtaLabel] = useState('');
  const [editBgPreset, setEditBgPreset] = useState('green');

  const beginEditBanner = (banner: BannerSlot) => {
    setEditingBanner(banner);
    setEditTitle(banner.title || '');
    setEditSubtitle(banner.subtitle || '');
    setEditBadgeText(banner.badgeText || '');
    setEditCtaLabel(banner.ctaLabel || '');
    setEditBgPreset(banner.bgPreset || 'green');
    setError(null);
  };

  const cancelEditBanner = () => {
    setEditingBanner(null);
    setEditTitle('');
    setEditSubtitle('');
    setEditBadgeText('');
    setEditCtaLabel('');
    setEditBgPreset('green');
  };

  const saveEditBanner = async () => {
    if (!editingBanner) return;
    setSaving(editingBanner.id);
    setError(null);
    try {
      const res = await fetch(`/api/menu-v2-admin/catalog-banners/${encodeURIComponent(editingBanner.id)}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          title: editTitle.trim(),
          subtitle: editSubtitle.trim() || null,
          badgeText: editBadgeText.trim() || null,
          ctaLabel: editCtaLabel.trim() || null,
          bgPreset: editBgPreset,
        }),
      });
      const data = (await res.json()) as { ok: boolean; error?: string };
      if (!res.ok || !data.ok) throw new Error(data.error ?? 'Error al actualizar banner');
      setEditingBanner(null);
      await loadBanners();
      showNotice('Texto del banner actualizado');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error');
    } finally {
      setSaving(null);
    }
  };

  const loadBanners = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/menu-v2-admin/catalog-banners', { credentials: 'include' });
      const data = (await res.json()) as { ok: boolean; banners?: CatalogBanner[]; error?: string };
      if (!res.ok || !data.ok || !data.banners || data.banners.length === 0) {
        setBanners(DEFAULT_PUBLIC_BANNERS_SLOTS);
        return;
      }
      setBanners(
        (data.banners ?? [])
          .map((b: any) => ({
            id: b.id,
            title: b.title ?? '',
            subtitle: b.subtitle ?? null,
            ctaLabel: b.cta_label ?? b.ctaLabel ?? null,
            imageKey: b.image_key ?? b.imageKey ?? null,
            imageUrl: b.image_url ?? b.imageUrl ?? null,
            bgPreset: b.bg_preset ?? b.bgPreset ?? null,
            badgeText: b.badge_text ?? b.badgeText ?? null,
            badgeColor: b.badge_color ?? b.badgeColor ?? null,
            ctaActionType: b.cta_action_type ?? b.ctaActionType ?? null,
            ctaTarget: b.cta_target ?? b.ctaTarget ?? null,
            isActive: b.is_active === 1 || b.is_active === true || b.isActive === true,
            sortOrder: b.sort_order ?? b.sortOrder ?? 0,
          }))
          .sort((a: BannerSlot, b: BannerSlot) => a.sortOrder - b.sortOrder),
      );
    } catch {
      setBanners(DEFAULT_PUBLIC_BANNERS_SLOTS);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBanners();
  }, [loadBanners]);

  const showNotice = (msg: string) => {
    setNotice(msg);
    setTimeout(() => setNotice(null), 2500);
  };

  const toggleActive = async (banner: BannerSlot) => {
    setSaving(banner.id);
    try {
      const res = await fetch(`/api/menu-v2-admin/catalog-banners/${encodeURIComponent(banner.id)}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ isActive: !banner.isActive }),
      });
      const data = (await res.json()) as { ok: boolean; error?: string };
      if (!res.ok || !data.ok) throw new Error(data.error ?? 'Error al actualizar');
      setBanners((prev) =>
        prev.map((b) => (b.id === banner.id ? { ...b, isActive: !b.isActive } : b)),
      );
      showNotice(banner.isActive ? 'Banner desactivado' : 'Banner activado');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error');
    } finally {
      setSaving(null);
    }
  };

  const deleteBanner = async (banner: BannerSlot) => {
    if (!confirm(`¿Eliminar banner "${banner.title || 'Sin título'}"?`)) return;
    setSaving(banner.id);
    try {
      const res = await fetch(`/api/menu-v2-admin/catalog-banners/${encodeURIComponent(banner.id)}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      const data = (await res.json()) as { ok: boolean; error?: string };
      if (!res.ok || !data.ok) throw new Error(data.error ?? 'Error al eliminar');
      setBanners((prev) => prev.filter((b) => b.id !== banner.id));
      showNotice('Banner eliminado');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error');
    } finally {
      setSaving(null);
    }
  };

  const moveBanner = async (banner: BannerSlot, direction: 'up' | 'down') => {
    const idx = banners.findIndex((b) => b.id === banner.id);
    if (idx < 0) return;
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= banners.length) return;

    const reordered = [...banners];
    [reordered[idx], reordered[targetIdx]] = [reordered[targetIdx], reordered[idx]];
    reordered.forEach((b, i) => {
      b.sortOrder = i + 1;
    });
    setBanners(reordered);

    try {
      await Promise.all(
        [reordered[idx], reordered[targetIdx]].map((b) =>
          fetch(`/api/menu-v2-admin/catalog-banners/${encodeURIComponent(b.id)}`, {
            method: 'PATCH',
            credentials: 'include',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ sortOrder: b.sortOrder }),
          }),
        ),
      );
    } catch {
      loadBanners();
    }
  };

  const createBanner = async () => {
    if (banners.length >= MAX_BANNERS) {
      setError(`Máximo ${MAX_BANNERS} banners`);
      return;
    }

    if (createMode === 'image' && !newFile) {
      setError('Selecciona una imagen');
      return;
    }
    if (createMode === 'text' && !newTitle.trim()) {
      setError('Escribe un título para el banner');
      return;
    }

    if (newFile) {
      if (newFile.size > MAX_IMAGE_BYTES) {
        setError('La imagen debe pesar 5 MB o menos');
        return;
      }
      if (!ACCEPTED_IMAGE_TYPES.includes(newFile.type)) {
        setError('Usa JPG, PNG, WebP o AVIF');
        return;
      }
    }

    setSaving('new');
    setError(null);
    try {
      const payload: Record<string, unknown> = {
        title: newTitle.trim() || (createMode === 'image' ? '' : newTitle.trim()),
        subtitle: newSubtitle.trim() || null,
        badgeText: newBadgeText.trim() || null,
        ctaLabel: newCtaLabel.trim() || null,
        isActive: true,
        sortOrder: banners.length + 1,
      };
      if (createMode === 'text') {
        payload.bgPreset = newBgPreset;
      }

      const createRes = await fetch('/api/menu-v2-admin/catalog-banners', {
        method: 'POST',
        credentials: 'include',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const createData = (await createRes.json()) as {
        ok: boolean;
        banner?: CatalogBanner;
        error?: string;
      };
      if (!createRes.ok || !createData.ok || !createData.banner)
        throw new Error(createData.error ?? 'Error al crear banner');

      const bannerId = createData.banner.id;

      // Upload image if provided
      if (newFile) {
        const formData = new FormData();
        formData.append('file', newFile);
        const uploadRes = await fetch(
          `/api/menu-v2-admin/catalog-banners/${encodeURIComponent(bannerId)}/image`,
          {
            method: 'POST',
            credentials: 'include',
            body: formData,
          },
        );
        const uploadData = (await uploadRes.json()) as { ok: boolean; error?: string };
        if (!uploadRes.ok || !uploadData.ok)
          throw new Error(uploadData.error ?? 'Error al subir imagen');
      }

      // Reset form
      setShowForm(false);
      setNewTitle('');
      setNewSubtitle('');
      setNewBadgeText('');
      setNewCtaLabel('');
      setNewFile(null);
      setNewBgPreset('green');

      await loadBanners();
      showNotice('Banner creado');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error');
    } finally {
      setSaving(null);
    }
  };

  const replaceImage = async (banner: BannerSlot, file: File) => {
    if (file.size > MAX_IMAGE_BYTES) {
      setError('La imagen debe pesar 5 MB o menos');
      return;
    }
    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      setError('Usa JPG, PNG, WebP o AVIF');
      return;
    }

    setSaving(banner.id);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch(
        `/api/menu-v2-admin/catalog-banners/${encodeURIComponent(banner.id)}/image`,
        {
          method: 'POST',
          credentials: 'include',
          body: formData,
        },
      );
      const data = (await res.json()) as { ok: boolean; error?: string };
      if (!res.ok || !data.ok) throw new Error(data.error ?? 'Error al subir imagen');
      await loadBanners();
      showNotice('Imagen actualizada');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error');
    } finally {
      setSaving(null);
    }
  };

  return (
    <div className="v3-section">
      <SectionHeader title="Banners" onBack={onBack} />
      <p className="v3-section-desc">
        Hasta {MAX_BANNERS} banners para tu carrusel. Puedes subir una imagen o crear uno rápido solo con texto y fondo.
      </p>

      {notice && <div className="v3-notice">{notice}</div>}
      {error && <div className="v3-error">{error}</div>}

      {loading ? (
        <div className="v3-loading">Cargando banners…</div>
      ) : (
        <>
          <div className="v3-banner-grid">
            {banners.map((banner, idx) => {
              const src = getAssetUrl(banner.imageUrl, banner.imageKey);
              const isSaving = saving === banner.id;
              const bgPreset = BG_PRESETS.find((p) => p.key === banner.bgPreset);
              return (
                <div
                  key={banner.id}
                  className={`v3-banner-slot ${!banner.isActive ? 'v3-banner-slot--inactive' : ''}`}
                >
                  <div
                    className="v3-banner-slot__preview"
                    style={!src && bgPreset ? bgPreset.style : undefined}
                  >
                    {src ? (
                      <img src={src} alt={banner.title || `Banner ${idx + 1}`} />
                    ) : banner.title || banner.badgeText ? (
                      <div className="v3-banner-slot__text-preview">
                        {banner.badgeText && (
                          <span className="v3-banner-slot__text-badge">{banner.badgeText}</span>
                        )}
                        {banner.title && (
                          <span className="v3-banner-slot__text-title">{banner.title}</span>
                        )}
                        {banner.subtitle && (
                          <span className="v3-banner-slot__text-sub">{banner.subtitle}</span>
                        )}
                        {banner.ctaLabel && (
                          <span className="v3-banner-slot__text-cta">{banner.ctaLabel}</span>
                        )}
                      </div>
                    ) : (
                      <span className="v3-banner-slot__empty">Sin contenido</span>
                    )}
                  </div>
                  <div className="v3-banner-slot__actions">
                    <span className="v3-banner-slot__number">#{idx + 1}</span>
                    <button
                      type="button"
                      className="v3-icon-btn"
                      onClick={() => moveBanner(banner, 'up')}
                      disabled={idx === 0 || isSaving}
                      title="Mover arriba"
                      aria-label="Mover arriba"
                    >
                      <ArrowUp size={16} />
                    </button>
                    <button
                      type="button"
                      className="v3-icon-btn"
                      onClick={() => moveBanner(banner, 'down')}
                      disabled={idx === banners.length - 1 || isSaving}
                      title="Mover abajo"
                      aria-label="Mover abajo"
                    >
                      <ArrowDown size={16} />
                    </button>
                    <button
                      type="button"
                      className={`v3-icon-btn ${banner.isActive ? 'v3-icon-btn--active' : 'v3-icon-btn--muted'}`}
                      onClick={() => toggleActive(banner)}
                      disabled={isSaving}
                      title={banner.isActive ? 'Desactivar' : 'Activar'}
                      aria-label={banner.isActive ? 'Desactivar' : 'Activar'}
                    >
                      {banner.isActive ? <Eye size={16} /> : <EyeOff size={16} />}
                    </button>
                    <button
                      type="button"
                      className="v3-icon-btn"
                      onClick={() => beginEditBanner(banner)}
                      disabled={isSaving}
                      title="Editar texto"
                      aria-label="Editar texto"
                    >
                      <Pencil size={16} />
                    </button>
                    <label className="v3-icon-btn" title="Cambiar imagen" aria-label="Cambiar imagen">
                      <Upload size={16} />
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/avif"
                        className="sr-only"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) replaceImage(banner, file);
                          e.target.value = '';
                        }}
                      />
                    </label>
                    <button
                      type="button"
                      className="v3-icon-btn v3-icon-btn--danger"
                      onClick={() => deleteBanner(banner)}
                      disabled={isSaving}
                      title="Eliminar"
                      aria-label="Eliminar"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <p className="v3-banner-count">
            {banners.length} de {MAX_BANNERS} banners usados
          </p>

          {/* New banner form */}
          {banners.length < MAX_BANNERS && !showForm && (
            <button
              type="button"
              className="v3-add-banner-btn"
              onClick={() => setShowForm(true)}
            >
              + Agregar banner
            </button>
          )}

          {/* Edit banner form */}
          {editingBanner && (
            <Card className="v3-card v3-banner-form">
              <h3 className="v3-card-title">Editar texto del banner #{banners.findIndex(b => b.id === editingBanner.id) + 1}</h3>

              <label className="v3-field">
                <span className="v3-field__label">Insignia / Tag (opcional)</span>
                <input
                  type="text"
                  className="v3-field__input"
                  placeholder="Ej: 🔥 PROMO 2X1, ⚡ ENVÍO $0, 🎟️ SORTEO"
                  value={editBadgeText}
                  onChange={(e) => setEditBadgeText(e.target.value)}
                />
              </label>

              <label className="v3-field">
                <span className="v3-field__label">Título</span>
                <input
                  type="text"
                  className="v3-field__input"
                  placeholder="Ej: 🔥 COMBO OVERCLOCK 2x1"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                />
              </label>

              <label className="v3-field">
                <span className="v3-field__label">Subtítulo (opcional)</span>
                <input
                  type="text"
                  className="v3-field__input"
                  placeholder="Ej: Lleva 2 combos seleccionados por el precio de 1"
                  value={editSubtitle}
                  onChange={(e) => setEditSubtitle(e.target.value)}
                />
              </label>

              <label className="v3-field">
                <span className="v3-field__label">Texto del botón / CTA (opcional)</span>
                <input
                  type="text"
                  className="v3-field__input"
                  placeholder="Ej: Ver combo, Pedir ahora"
                  value={editCtaLabel}
                  onChange={(e) => setEditCtaLabel(e.target.value)}
                />
              </label>

              <div className="v3-field">
                <span className="v3-field__label">Color de fondo</span>
                <div className="v3-preset-grid">
                  {BG_PRESETS.map((preset) => (
                    <button
                      key={preset.key}
                      type="button"
                      className={`v3-preset-swatch ${editBgPreset === preset.key ? 'v3-preset-swatch--active' : ''}`}
                      style={preset.style}
                      onClick={() => setEditBgPreset(preset.key)}
                      title={preset.label}
                      aria-label={preset.label}
                    />
                  ))}
                </div>
              </div>

              <div className="v3-form-actions">
                <button
                  type="button"
                  className="v3-cancel-btn"
                  onClick={cancelEditBanner}
                >
                  Cancelar
                </button>
                <Button
                  type="button"
                  className="v3-save-btn"
                  onClick={saveEditBanner}
                  disabled={saving === editingBanner.id}
                >
                  {saving === editingBanner.id ? 'Guardando…' : 'Guardar cambios'}
                </Button>
              </div>
            </Card>
          )}

          {showForm && (
            <Card className="v3-card v3-banner-form">
              <h3 className="v3-card-title">Nuevo banner</h3>

              {/* Mode toggle */}
              <div className="v3-mode-toggle">
                <button
                  type="button"
                  className={`v3-mode-btn ${createMode === 'image' ? 'v3-mode-btn--active' : ''}`}
                  onClick={() => setCreateMode('image')}
                >
                  <ImageIcon size={16} /> Imagen
                </button>
                <button
                  type="button"
                  className={`v3-mode-btn ${createMode === 'text' ? 'v3-mode-btn--active' : ''}`}
                  onClick={() => setCreateMode('text')}
                >
                  <Type size={16} /> Solo texto
                </button>
              </div>

              {createMode === 'image' && (
                <label className="v3-file-drop">
                  {newFile ? (
                    <span className="v3-file-drop__name">{newFile.name}</span>
                  ) : (
                    <>
                      <Upload size={24} />
                      <span>Seleccionar imagen</span>
                      <span className="v3-file-drop__hint">JPG, PNG, WebP o AVIF · max 5 MB</span>
                    </>
                  )}
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/avif"
                    className="sr-only"
                    onChange={(e) => {
                      setNewFile(e.target.files?.[0] ?? null);
                    }}
                  />
                </label>
              )}

              {/* Insignia / Badge for text mode */}
              {createMode === 'text' && (
                <label className="v3-field">
                  <span className="v3-field__label">Insignia / Tag (opcional)</span>
                  <input
                    type="text"
                    className="v3-field__input"
                    placeholder="Ej: 🔥 PROMO 2X1, ⚡ ENVÍO $0, 🎟️ SORTEO"
                    value={newBadgeText}
                    onChange={(e) => setNewBadgeText(e.target.value)}
                  />
                </label>
              )}

              {/* Title — optional for image, required for text */}
              <label className="v3-field">
                <span className="v3-field__label">
                  Título {createMode === 'text' ? '' : '(opcional)'}
                </span>
                <input
                  type="text"
                  className="v3-field__input"
                  placeholder="Ej: 🔥 COMBO OVERCLOCK 2x1"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                />
              </label>

              {/* Subtitle */}
              <label className="v3-field">
                <span className="v3-field__label">Subtítulo (opcional)</span>
                <input
                  type="text"
                  className="v3-field__input"
                  placeholder="Ej: Lleva 2 combos seleccionados por el precio de 1"
                  value={newSubtitle}
                  onChange={(e) => setNewSubtitle(e.target.value)}
                />
              </label>

              {/* CTA Label for text mode */}
              {createMode === 'text' && (
                <label className="v3-field">
                  <span className="v3-field__label">Texto del botón / CTA (opcional)</span>
                  <input
                    type="text"
                    className="v3-field__input"
                    placeholder="Ej: Ver combo, Pedir ahora, Participar"
                    value={newCtaLabel}
                    onChange={(e) => setNewCtaLabel(e.target.value)}
                  />
                </label>
              )}

              {/* BG preset for text mode */}
              {createMode === 'text' && (
                <div className="v3-field">
                  <span className="v3-field__label">Color de fondo</span>
                  <div className="v3-preset-grid">
                    {BG_PRESETS.map((preset) => (
                      <button
                        key={preset.key}
                        type="button"
                        className={`v3-preset-swatch ${newBgPreset === preset.key ? 'v3-preset-swatch--active' : ''}`}
                        style={preset.style}
                        onClick={() => setNewBgPreset(preset.key)}
                        title={preset.label}
                        aria-label={preset.label}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="v3-form-actions">
                <button
                  type="button"
                  className="v3-cancel-btn"
                  onClick={() => {
                    setShowForm(false);
                    setNewFile(null);
                    setNewTitle('');
                    setNewSubtitle('');
                  }}
                >
                  Cancelar
                </button>
                <Button
                  type="button"
                  className="v3-save-btn"
                  onClick={createBanner}
                  disabled={saving === 'new'}
                >
                  {saving === 'new' ? 'Creando…' : 'Crear banner'}
                </Button>
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  );
};

/* ──────────────────── Section: Mi Tienda ──────────────────── */

const TiendaSection = ({ onBack }: { onBack: () => void }) => {
  const [store, setStore] = useState<StoreStatus>({ open: false, loading: true, error: null });
  const [towers, setTowers] = useState<TowerSchedule[]>([]);
  const [towersLoading, setTowersLoading] = useState(true);
  const [towerSaving, setTowerSaving] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const showNotice = (msg: string) => {
    setNotice(msg);
    setTimeout(() => setNotice(null), 3000);
  };

  // Load store status
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/menu-v2-admin/site-config', { credentials: 'include' });
        const data = (await res.json()) as { ok: boolean; publicConfig?: PublicConfig; error?: string };
        if (!res.ok || !data.ok) throw new Error(data.error ?? 'Error al cargar');
        setStore({ open: data.publicConfig?.catalogEnabled ?? false, loading: false, error: null });
      } catch (e) {
        setStore({ open: false, loading: false, error: e instanceof Error ? e.message : 'Error' });
      }
    })();
  }, []);

  // Load tower schedules
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/menu-v2-admin/tower-schedules', { credentials: 'include' });
        const data = (await res.json()) as { ok: boolean; towers?: TowerSchedule[]; error?: string };
        if (!res.ok || !data.ok) throw new Error(data.error ?? 'Error al cargar torres');
        setTowers(data.towers ?? []);
      } catch {
        // Fallback — table might not exist yet
        setTowers([
          {
            id: 'tower-gga',
            towerKey: 'gga',
            towerName: 'Torre GGA',
            emoji: '🏢',
            activeDays: [1, 3, 5],
            orderStartTime: '09:00',
            orderEndTime: '11:30',
            deliveryStartTime: '13:30',
            deliveryEndTime: '14:00',
            deliveryLabel: '1:30 PM a 2:00 PM',
            isActive: true,
          },
          {
            id: 'tower-valcob',
            towerKey: 'valcob',
            towerName: 'Torre Valcob',
            emoji: '🏢',
            activeDays: [2, 4, 5],
            orderStartTime: '09:00',
            orderEndTime: '11:30',
            deliveryStartTime: '13:30',
            deliveryEndTime: '14:00',
            deliveryLabel: '1:30 PM a 2:00 PM',
            isActive: true,
          },
        ]);
      } finally {
        setTowersLoading(false);
      }
    })();
  }, []);

  const toggleStore = async () => {
    setStore((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const res = await fetch('/api/menu-v2-admin/site-config', {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ catalogEnabled: !store.open }),
      });
      const data = (await res.json()) as { ok: boolean; publicConfig?: PublicConfig; error?: string };
      if (!res.ok || !data.ok) throw new Error(data.error ?? 'Error al actualizar');
      const isOpen = data.publicConfig?.catalogEnabled ?? !store.open;
      setStore({ open: isOpen, loading: false, error: null });
      showNotice(isOpen ? '¡Tienda abierta!' : 'Tienda cerrada');
    } catch (e) {
      setStore((prev) => ({ ...prev, loading: false, error: e instanceof Error ? e.message : 'Error' }));
    }
  };

  const toggleTowerDay = (tower: TowerSchedule, dayIndex: number) => {
    const newDays = tower.activeDays.includes(dayIndex)
      ? tower.activeDays.filter((d) => d !== dayIndex)
      : [...tower.activeDays, dayIndex].sort((a, b) => a - b);
    setTowers((prev) =>
      prev.map((t) => (t.id === tower.id ? { ...t, activeDays: newDays } : t)),
    );
  };

  const updateTowerField = (towerId: string, field: keyof TowerSchedule, value: string | boolean) => {
    setTowers((prev) =>
      prev.map((t) => (t.id === towerId ? { ...t, [field]: value } : t)),
    );
  };

  const saveTower = async (tower: TowerSchedule) => {
    setTowerSaving(tower.id);
    setError(null);
    try {
      const res = await fetch(`/api/menu-v2-admin/tower-schedules/${encodeURIComponent(tower.id)}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          towerName: tower.towerName,
          activeDays: tower.activeDays,
          orderStartTime: tower.orderStartTime,
          orderEndTime: tower.orderEndTime,
          deliveryStartTime: tower.deliveryStartTime,
          deliveryEndTime: tower.deliveryEndTime,
          isActive: tower.isActive,
        }),
      });
      const data = (await res.json()) as { ok: boolean; tower?: TowerSchedule; error?: string };
      if (!res.ok || !data.ok) throw new Error(data.error ?? 'Error al guardar');
      showNotice(`${tower.towerName} actualizada`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al guardar');
    } finally {
      setTowerSaving(null);
    }
  };

  return (
    <div className="v3-section">
      <SectionHeader title="Mi Tienda" onBack={onBack} />

      {notice && <div className="v3-notice">{notice}</div>}
      {error && <div className="v3-error">{error}</div>}
      {store.error && <div className="v3-error">{store.error}</div>}

      {/* Store open/close */}
      <Card className="v3-card">
        <h3 className="v3-card-title">
          <Power size={18} aria-hidden="true" />
          Estado de la tienda
        </h3>
        <p className="v3-card-desc">
          {store.open
            ? 'Tu tienda está visible para los clientes.'
            : 'Tu tienda está cerrada. Los clientes no pueden hacer pedidos.'}
        </p>
        <BigToggle
          active={store.open}
          loading={store.loading}
          labelOn="La tienda está abierta"
          labelOff="La tienda está cerrada"
          onToggle={toggleStore}
        />
      </Card>

      {/* Tower schedules */}
      <div className="v3-towers-header">
        <h3 className="v3-card-title" style={{ marginBottom: 0 }}>
          <Calendar size={18} aria-hidden="true" />
          Horarios por edificio
        </h3>
        <p className="v3-card-desc" style={{ marginBottom: 0 }}>
          Configura los días y horarios de cada torre de forma independiente.
        </p>
      </div>

      {towersLoading ? (
        <div className="v3-loading">Cargando torres…</div>
      ) : (
        <div className="v3-towers-grid">
          {towers.map((tower) => {
            const isSaving = towerSaving === tower.id;
            return (
              <Card key={tower.id} className="v3-card v3-tower-card">
                <div className="v3-tower-header">
                  <span className="v3-tower-emoji">{tower.emoji}</span>
                  <div>
                    <h4 className="v3-tower-name">{tower.towerName}</h4>
                    <span className="v3-tower-days-summary">{formatDays(tower.activeDays)}</span>
                  </div>
                  <button
                    type="button"
                    className={`v3-tower-toggle ${tower.isActive ? 'v3-tower-toggle--active' : ''}`}
                    onClick={() => updateTowerField(tower.id, 'isActive', !tower.isActive)}
                    aria-pressed={tower.isActive}
                    title={tower.isActive ? 'Activa' : 'Inactiva'}
                  >
                    {tower.isActive ? 'Activa' : 'Inactiva'}
                  </button>
                </div>

                {/* Days checkboxes */}
                <div className="v3-days-row">
                  {DAY_INDICES.map((dayIdx) => (
                    <button
                      key={dayIdx}
                      type="button"
                      className={`v3-day-chip ${tower.activeDays.includes(dayIdx) ? 'v3-day-chip--active' : ''}`}
                      onClick={() => toggleTowerDay(tower, dayIdx)}
                      aria-pressed={tower.activeDays.includes(dayIdx)}
                    >
                      {DAY_LABELS[dayIdx]}
                    </button>
                  ))}
                </div>

                {/* Times */}
                <div className="v3-times-grid">
                  <label className="v3-field">
                    <span className="v3-field__label">Pedidos desde</span>
                    <input
                      type="time"
                      className="v3-field__input"
                      value={tower.orderStartTime}
                      onChange={(e) => updateTowerField(tower.id, 'orderStartTime', e.target.value)}
                    />
                  </label>
                  <label className="v3-field">
                    <span className="v3-field__label">Pedidos hasta</span>
                    <input
                      type="time"
                      className="v3-field__input"
                      value={tower.orderEndTime}
                      onChange={(e) => updateTowerField(tower.id, 'orderEndTime', e.target.value)}
                    />
                  </label>
                  <label className="v3-field v3-field--full">
                    <span className="v3-field__label">Entrega (A partir de)</span>
                    <input
                      type="time"
                      className="v3-field__input"
                      value={tower.deliveryStartTime}
                      onChange={(e) => updateTowerField(tower.id, 'deliveryStartTime', e.target.value)}
                    />
                  </label>
                </div>

                <Button
                  type="button"
                  className="v3-save-btn"
                  onClick={() => saveTower(tower)}
                  disabled={isSaving}
                >
                  {isSaving ? 'Guardando…' : 'Guardar cambios'}
                </Button>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

/* ──────────────────── Section: Sorteo ──────────────────── */

const SorteoSection = ({ onBack }: { onBack: () => void }) => {
  const [campaign, setCampaign] = useState<RaffleCampaignMinimal | null>(null);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const campaigns = await fetchRaffleCampaignsV2();
        const latest = campaigns.length > 0 ? campaigns[0] : null;
        setCampaign(
          latest
            ? { id: latest.id, title: latest.title, isActive: latest.isActive }
            : null,
        );
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Error al cargar sorteos');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const toggleSorteo = async () => {
    if (!campaign) return;
    setToggling(true);
    setError(null);
    try {
      const updated = await updateRaffleCampaignV2(campaign.id, {
        isActive: !campaign.isActive,
      });
      setCampaign({ id: updated.id, title: updated.title, isActive: updated.isActive });
      setNotice(updated.isActive ? '¡Sorteo activado!' : 'Sorteo desactivado');
      setTimeout(() => setNotice(null), 3000);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al actualizar');
    } finally {
      setToggling(false);
    }
  };

  return (
    <div className="v3-section">
      <SectionHeader title="Sorteo" onBack={onBack} />

      {notice && <div className="v3-notice">{notice}</div>}
      {error && <div className="v3-error">{error}</div>}

      {loading ? (
        <div className="v3-loading">Cargando sorteo…</div>
      ) : !campaign ? (
        <Card className="v3-card">
          <h3 className="v3-card-title">
            <Gift size={18} aria-hidden="true" />
            Sin sorteo configurado
          </h3>
          <p className="v3-card-desc">
            No hay un sorteo creado todavía. Para crear una campaña nueva, usa el panel completo
            en <strong>Admin → Sorteos</strong>.
          </p>
          <p className="v3-card-desc" style={{ color: '#71717a', marginBottom: 0 }}>
            Una vez que haya un sorteo creado, aquí podrás encenderlo y apagarlo con un solo toque.
          </p>
        </Card>
      ) : (
        <Card className="v3-card">
          <h3 className="v3-card-title">
            <Gift size={18} aria-hidden="true" />
            {campaign.title || 'Sorteo'}
          </h3>
          <p className="v3-card-desc">
            {campaign.isActive
              ? 'El sorteo está activo. Los clientes están acumulando tickets con cada pedido.'
              : 'El sorteo está pausado. Los clientes no acumulan tickets.'}
          </p>
          <BigToggle
            active={campaign.isActive}
            loading={toggling}
            labelOn="Sorteo activo"
            labelOff="Sorteo apagado"
            onToggle={toggleSorteo}
          />
        </Card>
      )}
    </div>
  );
};

/* ──────────────────── Section: Menú ──────────────────── */

const MenuSection = ({ onBack }: { onBack: () => void }) => (
  <div className="v3-section">
    <SectionHeader title="Menú y Productos" onBack={onBack} />
    <CatalogAdminPanel />
  </div>
);

/* ──────────────────── Main Component ──────────────────── */

export function CatalogV3Panel() {
  const [section, setSection] = useState<V3Section>('home');

  const goHome = useCallback(() => setSection('home'), []);

  if (section === 'menu') return <MenuSection onBack={goHome} />;
  if (section === 'banners') return <BannersSection onBack={goHome} />;
  if (section === 'tienda') return <TiendaSection onBack={goHome} />;
  if (section === 'sorteo') return <SorteoSection onBack={goHome} />;

  /* ── Home: Grid 2×2 ── */
  return (
    <div className="v3-home">
      <div className="v3-home__header">
        <h2 className="v3-home__title">Centro de Control</h2>
        <p className="v3-home__desc">Administra tu catálogo público desde aquí.</p>
      </div>

      <div className="v3-grid">
        {sectionCards.map(({ key, icon: Icon, title, description }) => (
          <button
            key={key}
            type="button"
            className="v3-grid-card"
            onClick={() => setSection(key)}
          >
            <span className="v3-grid-card__icon">
              <Icon size={32} aria-hidden="true" />
            </span>
            <span className="v3-grid-card__title">{title}</span>
            <span className="v3-grid-card__desc">{description}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
