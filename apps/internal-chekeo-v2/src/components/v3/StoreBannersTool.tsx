import { useEffect, useState, useCallback, useRef } from 'react';
import type { CatalogBanner, PublicConfig } from '@config/index';
import { Button, Card } from '@ui/index';
import { fetchRaffleCampaignsV2, updateRaffleCampaignV2 } from '../../lib/raffles-v2-admin';

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

type CatalogBannerForm = {
  id?: string;
  title: string;
  subtitle: string;
  ctaLabel: string;
  isActive: boolean;
  sortOrder: string;
  imageUrl: string;
  imageKey: string;
  bgPreset: string;
  badgeText: string;
  badgeColor: string;
  ctaActionType: string;
  ctaTarget: string;
};

type CatalogBannerMutationResponse = {
  ok?: boolean;
  error?: string;
  warning?: string;
  banner?: CatalogBanner;
  imageKey?: string | null;
  assetUrl?: string | null;
  removed?: boolean;
};

const DAY_LABELS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];
const ACCEPTED_IMAGE_TYPES_LABEL = 'JPG, PNG, WEBP o AVIF (máx. 5 MB)';
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

const BG_PRESETS: Array<{ key: string; label: string; style: string; border: string }> = [
  { key: 'gradient-cyan', label: '🩵 Cyan Neón', style: 'linear-gradient(135deg, #0891B2 0%, #06B6D4 100%)', border: 'border-cyan-400' },
  { key: 'gradient-emerald', label: '💚 Verde Smash', style: 'linear-gradient(135deg, #15803D 0%, #16A34A 100%)', border: 'border-emerald-400' },
  { key: 'gradient-amber', label: '🟧 Fuego Ámbar', style: 'linear-gradient(135deg, #C2410C 0%, #EA580C 100%)', border: 'border-amber-400' },
  { key: 'gradient-indigo', label: '🍇 Índigo Místico', style: 'linear-gradient(135deg, #4338CA 0%, #6366F1 100%)', border: 'border-indigo-400' },
  { key: 'gradient-rose', label: '🩷 Smash Rose', style: 'linear-gradient(135deg, #BE185D 0%, #E11D48 100%)', border: 'border-rose-400' },
  { key: 'gradient-dark', label: '🖤 Carbón Premium', style: 'linear-gradient(135deg, #18181B 0%, #27272A 100%)', border: 'border-neutral-600' },
];

const BADGE_COLORS: Array<{ key: string; label: string; badgeStyle: string }> = [
  { key: 'cyan', label: '🩵 Cyan', badgeStyle: 'bg-cyan-100 text-cyan-800 font-bold' },
  { key: 'amber', label: '💛 Ámbar', badgeStyle: 'bg-amber-100 text-amber-800 font-bold' },
  { key: 'rose', label: '🩷 Rose', badgeStyle: 'bg-rose-100 text-rose-800 font-bold' },
  { key: 'emerald', label: '💚 Verde', badgeStyle: 'bg-emerald-100 text-emerald-800 font-bold' },
  { key: 'purple', label: '💜 Morado', badgeStyle: 'bg-indigo-100 text-indigo-800 font-bold' },
];

const validateSelectedFile = (file: File | null): string | null => {
  if (!file) return 'Selecciona una imagen primero';
  if (file.size > MAX_IMAGE_BYTES) return 'La imagen debe pesar 5 MB o menos';
  if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) return `Tipo no permitido. Usa ${ACCEPTED_IMAGE_TYPES_LABEL}.`;
  return null;
};

const getAssetUrl = (imageUrl?: string, imageKey?: string): string | undefined => {
  const trimmedUrl = imageUrl?.trim();
  if (trimmedUrl && ((trimmedUrl.startsWith('/') && !trimmedUrl.startsWith('//')) || trimmedUrl.startsWith('https://'))) return trimmedUrl;
  const trimmedKey = imageKey?.trim();
  if (!trimmedKey) return undefined;
  return `/api/assets-v2/${trimmedKey.split('/').map((segment) => encodeURIComponent(segment)).join('/')}`;
};

const getPresetBackgroundStyle = (presetKey?: string | null) => {
  const match = BG_PRESETS.find((p) => p.key === presetKey);
  if (match) return match.style;
  if (presetKey && presetKey.startsWith('linear-gradient')) return presetKey;
  return BG_PRESETS[0]!.style;
};

const getBadgeStyle = (colorKey?: string | null) => {
  const match = BADGE_COLORS.find((c) => c.key === colorKey);
  return match ? match.badgeStyle : BADGE_COLORS[0]!.badgeStyle;
};

export interface StoreBannersToolProps {
  initialSubView?: 'grid' | 'banners' | 'schedules' | 'status' | 'sorteos';
  onBackToLauncher?: () => void;
}

export function StoreBannersTool({ initialSubView = 'grid', onBackToLauncher }: StoreBannersToolProps = {}) {
  const [subMenuView, setSubMenuView] = useState<'grid' | 'banners' | 'schedules' | 'status' | 'sorteos'>(initialSubView);
  const activeTab = subMenuView === 'grid' ? 'banners' : subMenuView;

  const [banners, setBanners] = useState<CatalogBanner[]>([]);
  const [loadingBanners, setLoadingBanners] = useState(true);

  const [bannerModalForm, setBannerModalForm] = useState<CatalogBannerForm | null>(null);
  const [bannerModalSaving, setBannerModalSaving] = useState(false);
  const [bannerModalUploading, setBannerModalUploading] = useState(false);
  const [bannerModalRemovingImage, setBannerModalRemovingImage] = useState(false);
  const [selectedBannerFile, setSelectedBannerFile] = useState<File | null>(null);
  const [bannerModalError, setBannerModalError] = useState<string | null>(null);
  const bannerFileInputRef = useRef<HTMLInputElement | null>(null);

  const [schedules, setSchedules] = useState<TowerSchedule[]>([]);
  const [loadingSchedules, setLoadingSchedules] = useState(true);
  const [savingScheduleId, setSavingScheduleId] = useState<string | null>(null);
  const [editingSchedule, setEditingSchedule] = useState<TowerSchedule | null>(null);

  const [catalogEnabled, setCatalogEnabled] = useState(true);
  const [savingConfig, setSavingConfig] = useState(false);

  const [raffleActive, setRaffleActive] = useState(false);
  const [raffleCampaignId, setRaffleCampaignId] = useState<string | null>(null);
  const [raffleTitle, setRaffleTitle] = useState('');
  const [togglingRaffle, setTogglingRaffle] = useState(false);

  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadBanners = useCallback(async () => {
    setLoadingBanners(true);
    try {
      const res = await fetch('/api/menu-v2-admin/catalog-banners', { credentials: 'include' });
      const data = (await res.json()) as { ok: boolean; banners?: CatalogBanner[] };
      setBanners(data.banners ?? []);
    } catch {
      /* noop */
    } finally {
      setLoadingBanners(false);
    }
  }, []);

  const loadSchedules = useCallback(async () => {
    setLoadingSchedules(true);
    try {
      const res = await fetch('/api/menu-v2-admin/tower-schedules', { credentials: 'include' });
      const data = (await res.json()) as { ok: boolean; schedules?: TowerSchedule[] };
      setSchedules(data.schedules ?? []);
    } catch {
      /* noop */
    } finally {
      setLoadingSchedules(false);
    }
  }, []);

  const loadConfigAndRaffles = useCallback(async () => {
    try {
      const [menuRes, raffles] = await Promise.all([
        fetch('/api/menu-v2', { credentials: 'include' }),
        fetchRaffleCampaignsV2()
      ]);
      const menuData = (await menuRes.json()) as { publicConfig?: PublicConfig };
      if (menuData.publicConfig?.catalogEnabled != null) {
        setCatalogEnabled(menuData.publicConfig.catalogEnabled);
      }

      if (raffles && raffles.length > 0) {
        const primary = raffles[0]!;
        setRaffleCampaignId(primary.id);
        setRaffleTitle(primary.title);
        setRaffleActive(primary.isActive);
      }
    } catch {
      /* noop */
    }
  }, []);

  useEffect(() => {
    loadBanners();
    loadSchedules();
    loadConfigAndRaffles();
  }, [loadBanners, loadSchedules, loadConfigAndRaffles]);

  const beginCreateBannerModal = () => {
    setBannerModalForm({
      title: '',
      subtitle: '',
      ctaLabel: '',
      isActive: true,
      sortOrder: String((banners.length + 1) * 10),
      imageUrl: '',
      imageKey: '',
      bgPreset: 'gradient-cyan',
      badgeText: '',
      badgeColor: 'cyan',
      ctaActionType: 'none',
      ctaTarget: ''
    });
    setSelectedBannerFile(null);
    setBannerModalError(null);
    if (bannerFileInputRef.current) bannerFileInputRef.current.value = '';
  };

  const beginEditBannerModal = (banner: CatalogBanner) => {
    setBannerModalForm({
      id: banner.id,
      title: banner.title,
      subtitle: banner.subtitle || '',
      ctaLabel: banner.ctaLabel || '',
      isActive: banner.isActive,
      sortOrder: String(banner.sortOrder),
      imageUrl: banner.imageUrl || '',
      imageKey: banner.imageKey || '',
      bgPreset: banner.bgPreset || 'gradient-cyan',
      badgeText: banner.badgeText || '',
      badgeColor: banner.badgeColor || 'cyan',
      ctaActionType: banner.ctaActionType || 'none',
      ctaTarget: banner.ctaTarget || ''
    });
    setSelectedBannerFile(null);
    setBannerModalError(null);
    if (bannerFileInputRef.current) bannerFileInputRef.current.value = '';
  };

  const closeBannerModal = () => {
    setBannerModalForm(null);
    setSelectedBannerFile(null);
    setBannerModalError(null);
    if (bannerFileInputRef.current) bannerFileInputRef.current.value = '';
  };

  const handleSaveBannerModal = async () => {
    if (!bannerModalForm) return;
    if (!bannerModalForm.title.trim()) {
      setBannerModalError('El título del banner es requerido.');
      return;
    }
    setBannerModalSaving(true);
    setBannerModalError(null);
    try {
      const url = bannerModalForm.id
        ? `/api/menu-v2-admin/catalog-banners/${encodeURIComponent(bannerModalForm.id)}`
        : '/api/menu-v2-admin/catalog-banners';
      const method = bannerModalForm.id ? 'PATCH' : 'POST';
      const res = await fetch(url, {
        method,
        credentials: 'include',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          title: bannerModalForm.title.trim(),
          subtitle: bannerModalForm.subtitle.trim(),
          ctaLabel: bannerModalForm.ctaLabel.trim(),
          isActive: bannerModalForm.isActive,
          sortOrder: Number(bannerModalForm.sortOrder) || 0,
          bgPreset: bannerModalForm.bgPreset,
          badgeText: bannerModalForm.badgeText.trim(),
          badgeColor: bannerModalForm.badgeColor,
          ctaActionType: bannerModalForm.ctaActionType,
          ctaTarget: bannerModalForm.ctaTarget.trim(),
        }),
      });
      const data = (await res.json()) as CatalogBannerMutationResponse;
      if (!res.ok || !data.ok) throw new Error(data.error ?? 'Error al guardar banner');
      setNotice('Banner guardado correctamente');
      setTimeout(() => setNotice(null), 3000);
      closeBannerModal();
      loadBanners();
    } catch (e) {
      setBannerModalError(e instanceof Error ? e.message : 'Error al guardar banner');
    } finally {
      setBannerModalSaving(false);
    }
  };

  const handleDeleteBannerModal = async () => {
    if (!bannerModalForm?.id) return;
    if (!confirm('¿Eliminar este banner permanentemente?')) return;
    setBannerModalSaving(true);
    setBannerModalError(null);
    try {
      const res = await fetch(`/api/menu-v2-admin/catalog-banners/${encodeURIComponent(bannerModalForm.id)}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      const data = (await res.json()) as CatalogBannerMutationResponse;
      if (!res.ok || !data.ok) throw new Error(data.error ?? 'Error al eliminar banner');
      setNotice('Banner eliminado correctamente');
      setTimeout(() => setNotice(null), 3000);
      closeBannerModal();
      loadBanners();
    } catch (e) {
      setBannerModalError(e instanceof Error ? e.message : 'Error al eliminar banner');
    } finally {
      setBannerModalSaving(false);
    }
  };

  const handleUploadImageModal = async () => {
    if (!bannerModalForm?.id || !selectedBannerFile) return;
    const fileError = validateSelectedFile(selectedBannerFile);
    if (fileError) {
      setBannerModalError(fileError);
      return;
    }
    setBannerModalUploading(true);
    setBannerModalError(null);
    try {
      const formData = new FormData();
      formData.append('file', selectedBannerFile);
      const res = await fetch(`/api/menu-v2-admin/catalog-banners/${encodeURIComponent(bannerModalForm.id)}/image`, {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });
      const data = (await res.json()) as CatalogBannerMutationResponse;
      if (!res.ok || !data.ok) throw new Error(data.error ?? 'Error al subir imagen');
      setBannerModalForm({
        ...bannerModalForm,
        imageKey: data.imageKey ?? bannerModalForm.imageKey,
        imageUrl: data.assetUrl ?? bannerModalForm.imageUrl,
      });
      setSelectedBannerFile(null);
      if (bannerFileInputRef.current) bannerFileInputRef.current.value = '';
      setNotice('Imagen subida correctamente');
      setTimeout(() => setNotice(null), 3000);
    } catch (e) {
      setBannerModalError(e instanceof Error ? e.message : 'Error al subir imagen');
    } finally {
      setBannerModalUploading(false);
    }
  };

  const handleRemoveImageModal = async () => {
    if (!bannerModalForm?.id) return;
    setBannerModalRemovingImage(true);
    setBannerModalError(null);
    try {
      const res = await fetch(`/api/menu-v2-admin/catalog-banners/${encodeURIComponent(bannerModalForm.id)}/image`, {
        method: 'DELETE',
        credentials: 'include',
      });
      const data = (await res.json()) as CatalogBannerMutationResponse;
      if (!res.ok || !data.ok) throw new Error(data.error ?? 'Error al quitar imagen');
      setBannerModalForm({
        ...bannerModalForm,
        imageKey: '',
        imageUrl: '',
      });
      setNotice('Imagen eliminada correctamente');
      setTimeout(() => setNotice(null), 3000);
    } catch (e) {
      setBannerModalError(e instanceof Error ? e.message : 'Error al quitar imagen');
    } finally {
      setBannerModalRemovingImage(false);
    }
  };

  const handleToggleSchedule = async (schedule: TowerSchedule) => {
    setSavingScheduleId(schedule.id);
    setNotice(null);
    try {
      const res = await fetch(`/api/menu-v2-admin/tower-schedules/${encodeURIComponent(schedule.id)}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ isActive: !schedule.isActive }),
      });
      const data = await res.json() as { ok: boolean; error?: string };
      if (!res.ok || !data.ok) throw new Error(data.error ?? 'Error al actualizar horario');
      setSchedules((prev) => prev.map((s) => s.id === schedule.id ? { ...s, isActive: !s.isActive } : s));
      setNotice(`Horario de ${schedule.towerName} ${schedule.isActive ? 'pausado' : 'activado'}`);
      setTimeout(() => setNotice(null), 3000);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al actualizar horario');
    } finally {
      setSavingScheduleId(null);
    }
  };

  // Save Full Schedule
  const handleSaveFullSchedule = async (draft: TowerSchedule) => {
    setSavingScheduleId(draft.id);
    setError(null);
    try {
      const res = await fetch(`/api/menu-v2-admin/tower-schedules/${encodeURIComponent(draft.id)}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          towerName: draft.towerName,
          emoji: draft.emoji,
          activeDays: draft.activeDays,
          orderStartTime: draft.orderStartTime,
          orderEndTime: draft.orderEndTime,
          deliveryStartTime: draft.deliveryStartTime,
          deliveryEndTime: draft.deliveryEndTime,
          deliveryLabel: draft.deliveryLabel,
          isActive: draft.isActive,
        })
      });
      const data = (await res.json()) as { ok: boolean; tower?: TowerSchedule; error?: string };
      if (!res.ok || !data.ok || !data.tower) throw new Error(data.error ?? 'Error al actualizar horario');

      setSchedules((prev) => prev.map((s) => (s.id === draft.id ? data.tower! : s)));
      setEditingSchedule(null);
      setNotice(`🎉 Horario de ${draft.towerName} actualizado exitosamente`);
      setTimeout(() => setNotice(null), 3000);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al guardar horario');
    } finally {
      setSavingScheduleId(null);
    }
  };

  // Toggle Store Catalog Mode
  const handleToggleStoreMode = async () => {
    setSavingConfig(true);
    setNotice(null);
    try {
      const next = !catalogEnabled;
      const res = await fetch('/api/menu-v2-admin/site-config', {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ publicMode: 'catalog', catalogEnabled: next }),
      });
      const data = await res.json() as { ok: boolean; error?: string };
      if (!res.ok || !data.ok) throw new Error(data.error ?? 'Error al cambiar estado de tienda');
      setCatalogEnabled(next);
      setNotice(next ? 'Tienda abierta al público' : 'Tienda cerrada temporalmente');
      setTimeout(() => setNotice(null), 3000);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al cambiar estado de tienda');
    } finally {
      setSavingConfig(false);
    }
  };

  const handleToggleRaffle = async () => {
    if (!raffleCampaignId) return;
    setTogglingRaffle(true);
    setNotice(null);
    try {
      const nextState = !raffleActive;
      await updateRaffleCampaignV2(raffleCampaignId, { isActive: nextState });
      setRaffleActive(nextState);
      setNotice(`Sorteo ${nextState ? 'ACTIVADO' : 'PAUSADO'}`);
      setTimeout(() => setNotice(null), 3000);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al cambiar estado del sorteo');
    } finally {
      setTogglingRaffle(false);
    }
  };

  // Submenu Cards config
  const subMenuCards = [
    {
      id: 'banners',
      title: 'Banners del Catálogo',
      icon: '🎨',
      description: 'Carruseles de imágenes y tarjetas de texto promocionales estilizadas.',
      statusLabel: loadingBanners ? 'Cargando...' : `${banners.length} Banners`,
    },
    {
      id: 'schedules',
      title: 'Horarios por Torre',
      icon: '⏰',
      description: 'Configuración de días activos y ventanas de recepción/entrega por torre.',
      statusLabel: loadingSchedules ? 'Cargando...' : `${schedules.length} Torres`,
    },
    {
      id: 'status',
      title: 'Estado de la Tienda',
      icon: '🏪',
      description: 'Interruptor general para abrir la tienda o pausar los pedidos en vivo.',
      statusLabel: catalogEnabled ? 'Abierta' : 'Cerrada',
    },
    {
      id: 'sorteos',
      title: 'Sorteo Promocional',
      icon: '🎁',
      description: 'Gestión de sorteo activo, boletos digitales y asignación de códigos.',
      statusLabel: raffleActive ? 'En Vivo' : 'Pausado',
    },
  ];

  return (
    <div className="space-y-6">
      {notice ? <div className="p-3 rounded-xl bg-green-50 border border-green-200 text-xs text-green-800">{notice}</div> : null}
      {error ? <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700">{error}</div> : null}

      {/* ── VISTA 1: SUBMENÚ CUADRADO (GRID DE 4 OPCIONES) ── */}
      {subMenuView === 'grid' ? (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm">
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                Submenú Configuración
              </span>
              <h2 className="text-xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight mt-1.5">
                Sucursal, Banners & Horarios
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                Selecciona una sección para administrar banners, disponibilidad o sorteos.
              </p>
            </div>
            {onBackToLauncher && (
              <Button
                type="button"
                className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 font-bold px-3 py-1.5 text-xs hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all shrink-0"
                onClick={onBackToLauncher}
              >
                ← Menú Principal
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {subMenuCards.map((card) => (
              <button
                key={card.id}
                type="button"
                onClick={() => setSubMenuView(card.id as any)}
                className="group relative flex flex-col items-center justify-center text-center p-6 rounded-2xl bg-white dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-800 shadow-sm hover:shadow-md hover:border-emerald-500/50 dark:hover:border-emerald-500/50 transition-all duration-200 w-full min-h-[190px] focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              >
                <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 dark:bg-emerald-500/20 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform mb-3">
                  {card.icon}
                </div>
                <h4 className="text-base font-black text-zinc-900 dark:text-zinc-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                  {card.title}
                </h4>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1.5 leading-relaxed font-normal max-w-[220px]">
                  {card.description}
                </p>
                <span className="mt-3 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  {card.statusLabel}
                </span>
              </button>
            ))}
          </div>
        </div>
      ) : (
        /* ── VISTA 2: NAVEGACIÓN Y DETALLE DE HERRAMIENTA SELECCIONADA ── */
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm">
            <div className="flex items-center gap-3">
              <Button
                type="button"
                className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 font-extrabold px-3 py-1.5 text-xs hover:bg-emerald-500/20 transition-all shadow-sm"
                onClick={() => setSubMenuView('grid')}
              >
                ← Volver al Submenú
              </Button>
              <h3 className="text-sm font-black text-zinc-900 dark:text-zinc-100">
                {subMenuView === 'banners' && '🎨 Banners del Catálogo'}
                {subMenuView === 'schedules' && '⏰ Horarios por Torre'}
                {subMenuView === 'status' && '🏪 Estado de la Tienda'}
                {subMenuView === 'sorteos' && '🎁 Sorteo Promocional'}
              </h3>
            </div>

            {/* Quick Switch Pills */}
            <div className="flex items-center gap-1 overflow-x-auto">
              {subMenuCards.map((card) => {
                const isActive = subMenuView === card.id;
                return (
                  <button
                    key={card.id}
                    type="button"
                    onClick={() => setSubMenuView(card.id as any)}
                    className={`px-3 py-1.5 rounded-xl text-[11px] font-extrabold transition-all shrink-0 ${
                      isActive
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                    }`}
                  >
                    {card.icon} {card.title.split(' ')[0]}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'banners' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-neutral-800">Gestión de Banners Promocionales</h3>
              <p className="text-[11px] text-neutral-500">Soporta banners visuales con imagen y banners de texto con fondo estilizado degradado.</p>
            </div>
            <Button
              type="button"
              className="bg-[#16A34A] text-white font-semibold text-xs py-1.5 px-3 min-h-0"
              onClick={beginCreateBannerModal}
            >
              + Crear Banner
            </Button>
          </div>

          {loadingBanners ? (
            <Card className="p-6 text-center text-xs text-neutral-500">Cargando banners...</Card>
          ) : (
            <div className="grid gap-4">
              {banners.map((b) => {
                const previewUrl = getAssetUrl(b.imageUrl, b.imageKey);
                const bgStyle = getPresetBackgroundStyle(b.bgPreset);
                const badgeStyle = getBadgeStyle(b.badgeColor);

                return (
                  <Card
                    key={b.id}
                    className={`p-4 border flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 transition-all ${
                      b.isActive ? 'border-neutral-200 bg-white' : 'border-neutral-200/50 bg-neutral-50 opacity-70'
                    }`}
                  >
                    <div className="w-full md:w-72 h-28 shrink-0 rounded-2xl border border-neutral-200 overflow-hidden relative shadow-sm flex flex-col justify-between p-3.5" style={{ background: previewUrl ? undefined : bgStyle }}>
                      {previewUrl ? (
                        <img src={previewUrl} alt={b.title} className="absolute inset-0 w-full h-full object-cover" loading="lazy" decoding="async" />
                      ) : null}

                      {previewUrl && <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />}

                      <div className="relative z-10 flex items-start justify-between gap-2">
                        {b.badgeText ? (
                          <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full shadow ${badgeStyle}`}>
                            {b.badgeText}
                          </span>
                        ) : (
                          <span className="text-[10px] bg-black/40 text-white backdrop-blur px-2 py-0.5 rounded-full">
                            {previewUrl ? '🖼️ Imagen' : '🎨 Texto'}
                          </span>
                        )}
                        <span className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full ${
                          b.isActive ? 'bg-green-100 text-green-700 border border-green-200 backdrop-blur' : 'bg-red-100 text-red-700 border border-red-200 backdrop-blur'
                        }`}>
                          {b.isActive ? 'Activo' : 'Inactivo'}
                        </span>
                      </div>

                      <div className="relative z-10 space-y-0.5">
                        <h4 className="font-bold text-white text-sm leading-tight drop-shadow truncate">{b.title}</h4>
                        {b.subtitle && <p className="text-[11px] text-white/90 line-clamp-1 drop-shadow-sm">{b.subtitle}</p>}
                      </div>
                    </div>

                    <div className="min-w-0 flex-1 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="font-semibold text-neutral-800 text-sm truncate">{b.title}</h4>
                        <span className="text-[10px] bg-neutral-100 text-neutral-600 px-2 py-0.5 rounded font-mono">
                          {previewUrl ? '🖼️ Banner con Imagen' : '🎨 Banner de Texto'}
                        </span>
                      </div>
                      {b.subtitle && <p className="text-xs text-neutral-500 line-clamp-2">{b.subtitle}</p>}
                      <div className="flex flex-wrap items-center gap-3 text-[11px] text-neutral-500 font-mono pt-1">
                        <span>Orden: <strong>{b.sortOrder}</strong></span>
                        {b.ctaLabel && <span className="text-[#16A34A]">CTA: <strong>{b.ctaLabel}</strong></span>}
                        {b.ctaActionType && b.ctaActionType !== 'none' && (
                          <span className="text-amber-600">Acción: <strong>{b.ctaActionType} {b.ctaTarget ? `(${b.ctaTarget})` : ''}</strong></span>
                        )}
                      </div>
                    </div>

                    <Button
                      type="button"
                      className="bg-neutral-100 hover:bg-neutral-200 border border-neutral-300 text-neutral-700 text-xs py-2 px-4 rounded-xl shrink-0 font-semibold self-end md:self-center min-h-0"
                      onClick={() => beginEditBannerModal(b)}
                    >
                      ✏️ Editar Banner
                    </Button>
                  </Card>
                );
              })}
              {!banners.length && (
                <Card className="p-8 text-center text-xs text-neutral-400 border border-dashed border-neutral-300">
                  No hay banners de catálogo registrados. Haz clic en "+ Crear Banner" para registrar el primero.
                </Card>
              )}
            </div>
          )}
        </div>
      )}

      {bannerModalForm ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={closeBannerModal}>
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white border border-neutral-200 rounded-2xl p-6 space-y-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-neutral-200 pb-3">
              <h3 className="font-bold text-lg text-neutral-800">
                {bannerModalForm.id ? '✏️ Editar Banner del Catálogo' : '➕ Crear Nuevo Banner'}
              </h3>
              <button type="button" className="text-neutral-400 hover:text-neutral-600 p-1 text-sm font-semibold" onClick={closeBannerModal}>
                ✕
              </button>
            </div>

            <div className="space-y-2">
              <span className="text-[11px] font-semibold uppercase tracking-widest text-[#16A34A] block">👁️ Vista Previa en Vivo (Cliente):</span>
              <div
                className="w-full h-32 rounded-2xl border border-neutral-200 overflow-hidden relative shadow-sm flex flex-col justify-between p-4 transition-all"
                style={{
                  background: getAssetUrl(bannerModalForm.imageUrl, bannerModalForm.imageKey)
                    ? undefined
                    : getPresetBackgroundStyle(bannerModalForm.bgPreset)
                }}
              >
                {getAssetUrl(bannerModalForm.imageUrl, bannerModalForm.imageKey) ? (
                  <img
                    src={getAssetUrl(bannerModalForm.imageUrl, bannerModalForm.imageKey)}
                    alt="Banner Preview"
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                ) : null}

                {getAssetUrl(bannerModalForm.imageUrl, bannerModalForm.imageKey) && (
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                )}

                <div className="relative z-10 flex items-start justify-between">
                  {bannerModalForm.badgeText ? (
                    <span className={`text-xs uppercase tracking-wider px-2.5 py-0.5 rounded-full shadow ${getBadgeStyle(bannerModalForm.badgeColor)}`}>
                      {bannerModalForm.badgeText}
                    </span>
                  ) : <div />}
                  <span className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full ${
                    bannerModalForm.isActive ? 'bg-green-100 text-green-700 border border-green-200 backdrop-blur' : 'bg-red-100 text-red-700 border border-red-200 backdrop-blur'
                  }`}>
                    {bannerModalForm.isActive ? 'Activo' : 'Inactivo'}
                  </span>
                </div>

                <div className="relative z-10 flex items-end justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <h4 className="font-bold text-white text-base leading-tight drop-shadow truncate">
                      {bannerModalForm.title || 'Título del Banner'}
                    </h4>
                    <p className="text-xs text-white/90 line-clamp-1 drop-shadow-sm mt-0.5">
                      {bannerModalForm.subtitle || 'Subtítulo corto de prueba...'}
                    </p>
                  </div>
                  {bannerModalForm.ctaLabel && (
                    <span className="shrink-0 px-3 py-1.5 rounded-xl bg-white text-neutral-900 font-bold text-xs shadow-lg">
                      {bannerModalForm.ctaLabel}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <span className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider block">Presets Rápidos de Texto:</span>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className="px-2.5 py-1 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-700 border border-neutral-300 text-xs transition-colors"
                  onClick={() =>
                    setBannerModalForm({
                      ...bannerModalForm,
                      title: '⚡ ENVÍO GRATIS $0',
                      subtitle: 'En tu primer pedido mayor a $150 con código BURGERS',
                      ctaLabel: 'Copiar código BURGERS',
                      badgeText: 'ENVÍO GRATIS',
                      badgeColor: 'emerald',
                      bgPreset: 'gradient-emerald'
                    })
                  }
                >
                  ⚡ Envío Gratis
                </button>
                <button
                  type="button"
                  className="px-2.5 py-1 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-700 border border-neutral-300 text-xs transition-colors"
                  onClick={() =>
                    setBannerModalForm({
                      ...bannerModalForm,
                      title: '🔥 DOBLE SMASH 2x1',
                      subtitle: 'Aprovecha 2 hamburguesas dobles al precio de 1',
                      ctaLabel: 'Ver Combos',
                      badgeText: '🔥 PROMO 2X1',
                      badgeColor: 'amber',
                      bgPreset: 'gradient-amber'
                    })
                  }
                >
                  🔥 2x1 Smash
                </button>
                <button
                  type="button"
                  className="px-2.5 py-1 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-700 border border-neutral-300 text-xs transition-colors"
                  onClick={() =>
                    setBannerModalForm({
                      ...bannerModalForm,
                      title: '🏆 COMBOS GRATIS',
                      subtitle: 'Participa por un año de combos en cada pedido',
                      ctaLabel: 'Ver Sorteo',
                      badgeText: '🎁 SORTEO',
                      badgeColor: 'cyan',
                      bgPreset: 'gradient-cyan'
                    })
                  }
                >
                  🏆 Sorteo Combos
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-neutral-700 uppercase tracking-wider block mb-1">Título del Banner *</label>
                <input
                  className="w-full px-3 py-2 rounded-xl bg-[#F5F2EE] border border-neutral-200 text-xs text-neutral-800 font-semibold outline-none focus:border-[#16A34A]"
                  value={bannerModalForm.title}
                  onChange={(e) => setBannerModalForm({ ...bannerModalForm, title: e.target.value })}
                  placeholder="ej. ⚡ ENVÍO GRATIS $0"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-neutral-700 uppercase tracking-wider block mb-1">Subtítulo (Opcional)</label>
                <textarea
                  className="w-full px-3 py-2 rounded-xl bg-[#F5F2EE] border border-neutral-200 text-xs text-neutral-800 outline-none focus:border-[#16A34A]"
                  rows={2}
                  value={bannerModalForm.subtitle}
                  onChange={(e) => setBannerModalForm({ ...bannerModalForm, subtitle: e.target.value })}
                  placeholder="ej. En tu primer pedido mayor a $150 con código BURGERS"
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-neutral-700 uppercase tracking-wider block mb-1">Texto del Botón CTA (Opcional)</label>
                  <input
                    className="w-full px-3 py-2 rounded-xl bg-[#F5F2EE] border border-neutral-200 text-xs text-neutral-800 outline-none focus:border-[#16A34A]"
                    value={bannerModalForm.ctaLabel}
                    onChange={(e) => setBannerModalForm({ ...bannerModalForm, ctaLabel: e.target.value })}
                    placeholder="ej. Pedir Ahora"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-neutral-700 uppercase tracking-wider block mb-1">Orden Visual</label>
                  <input
                    className="w-full px-3 py-2 rounded-xl bg-[#F5F2EE] border border-neutral-200 text-xs text-neutral-800 outline-none focus:border-[#16A34A]"
                    inputMode="numeric"
                    value={bannerModalForm.sortOrder}
                    onChange={(e) => setBannerModalForm({ ...bannerModalForm, sortOrder: e.target.value })}
                  />
                </div>
              </div>

              <div className="p-4 rounded-xl border border-neutral-200 bg-[#F5F2EE] space-y-4">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-[#16A34A]">🎨 Personalización de Banner de Texto (Sin Imagen)</h4>

                <div>
                  <label className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider block mb-2">Fondo Degradado (BG Preset):</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {BG_PRESETS.map((preset) => (
                      <button
                        key={preset.key}
                        type="button"
                        className={`p-2.5 rounded-xl border text-xs font-semibold text-white flex items-center justify-between transition-all ${
                          bannerModalForm.bgPreset === preset.key
                            ? `${preset.border} ring-2 ring-[#16A34A] shadow-lg scale-[1.02]`
                            : 'border-neutral-300 hover:border-neutral-400 opacity-80'
                        }`}
                        style={{ background: preset.style }}
                        onClick={() => setBannerModalForm({ ...bannerModalForm, bgPreset: preset.key })}
                      >
                        <span>{preset.label}</span>
                        {bannerModalForm.bgPreset === preset.key && <span>✓</span>}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider block mb-1">Texto de la Etiqueta / Badge:</label>
                    <input
                      className="w-full px-3 py-2 rounded-xl bg-white border border-neutral-200 text-xs text-neutral-800 outline-none focus:border-[#16A34A]"
                      value={bannerModalForm.badgeText}
                      onChange={(e) => setBannerModalForm({ ...bannerModalForm, badgeText: e.target.value })}
                      placeholder="ej. ⚡ PROMO EXCLUSIVA"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider block mb-1">Color del Badge:</label>
                    <select
                      className="w-full px-3 py-2 rounded-xl bg-white border border-neutral-200 text-xs text-neutral-800 outline-none focus:border-[#16A34A]"
                      value={bannerModalForm.badgeColor}
                      onChange={(e) => setBannerModalForm({ ...bannerModalForm, badgeColor: e.target.value })}
                    >
                      {BADGE_COLORS.map((c) => (
                        <option key={c.key} value={c.key}>{c.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider block mb-1">Acción al hacer Clic:</label>
                    <select
                      className="w-full px-3 py-2 rounded-xl bg-white border border-neutral-200 text-xs text-neutral-800 outline-none focus:border-[#16A34A]"
                      value={bannerModalForm.ctaActionType}
                      onChange={(e) => setBannerModalForm({ ...bannerModalForm, ctaActionType: e.target.value })}
                    >
                      <option value="none">Ninguna (Informativo)</option>
                      <option value="category">Ir a Categoría del Catálogo</option>
                      <option value="url">Abrir URL Enlace Externo</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider block mb-1">Destino / Target:</label>
                    <input
                      className="w-full px-3 py-2 rounded-xl bg-white border border-neutral-200 text-xs text-neutral-800 outline-none focus:border-[#16A34A]"
                      value={bannerModalForm.ctaTarget}
                      onChange={(e) => setBannerModalForm({ ...bannerModalForm, ctaTarget: e.target.value })}
                      placeholder={bannerModalForm.ctaActionType === 'category' ? 'ej. burgers, combos' : 'ej. https://...'}
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 p-3 rounded-xl bg-[#F5F2EE] border border-neutral-200">
                <label className="flex items-center gap-3 cursor-pointer text-xs font-semibold text-neutral-700">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-neutral-300 bg-white text-[#16A34A] focus:ring-[#16A34A]"
                    checked={bannerModalForm.isActive}
                    onChange={(e) => setBannerModalForm({ ...bannerModalForm, isActive: e.target.checked })}
                  />
                  <span>Banner Activo (Visible en tienda pública)</span>
                </label>
              </div>

              {bannerModalForm.id ? (
                <div className="p-4 rounded-xl border border-green-300 bg-green-50 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-[#16A34A]">🖼️ Imagen del Banner (Opcional - Cloudflare R2)</h4>
                    {getAssetUrl(bannerModalForm.imageUrl, bannerModalForm.imageKey) && (
                      <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded font-semibold">Imagen Activa</span>
                    )}
                  </div>
                  <div className="flex flex-col sm:flex-row items-center gap-4">
                    <div className="w-32 h-20 shrink-0 rounded-xl bg-[#F5F2EE] border border-neutral-200 overflow-hidden flex items-center justify-center">
                      {getAssetUrl(bannerModalForm.imageUrl, bannerModalForm.imageKey) ? (
                        <img src={getAssetUrl(bannerModalForm.imageUrl, bannerModalForm.imageKey)} alt="Banner Visual" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-[10px] text-neutral-400 font-semibold uppercase tracking-wider">Sin Imagen</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0 space-y-2 w-full">
                      <input
                        ref={bannerFileInputRef}
                        type="file"
                        accept={ACCEPTED_IMAGE_TYPES.join(',')}
                        className="w-full text-xs text-neutral-500 file:mr-2 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-neutral-100 file:text-[#16A34A] hover:file:bg-neutral-200"
                        disabled={bannerModalUploading || bannerModalRemovingImage || bannerModalSaving}
                        onChange={(e) => setSelectedBannerFile(e.target.files?.[0] ?? null)}
                      />
                      <p className="text-[11px] text-neutral-500">{ACCEPTED_IMAGE_TYPES_LABEL}</p>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          className="flex-1 bg-[#16A34A] text-white font-semibold text-xs py-1.5 min-h-0 disabled:opacity-40"
                          disabled={bannerModalUploading || bannerModalRemovingImage || bannerModalSaving || !selectedBannerFile || Boolean(validateSelectedFile(selectedBannerFile))}
                          onClick={handleUploadImageModal}
                        >
                          {bannerModalUploading ? 'Subiendo…' : bannerModalForm.imageKey || bannerModalForm.imageUrl ? 'Cambiar Imagen' : 'Subir Imagen'}
                        </Button>
                        <Button
                          type="button"
                          className="flex-1 border border-red-300 bg-red-50 text-red-700 text-xs py-1.5 min-h-0 disabled:opacity-40"
                          disabled={bannerModalUploading || bannerModalRemovingImage || bannerModalSaving || (!bannerModalForm.imageKey && !bannerModalForm.imageUrl)}
                          onClick={handleRemoveImageModal}
                        >
                          {bannerModalRemovingImage ? 'Quitando…' : 'Quitar Imagen'}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-neutral-500 italic">Guarda el banner primero si deseas adjuntar un archivo de imagen en R2.</p>
              )}
            </div>

            {bannerModalError ? <p className="text-xs text-red-600 p-2 rounded bg-red-50 border border-red-200">{bannerModalError}</p> : null}

            <div className="flex items-center justify-between pt-3 border-t border-neutral-200 gap-2">
              {bannerModalForm.id ? (
                <Button
                  type="button"
                  className="border border-red-300 bg-red-50 text-red-700 text-xs py-2 px-3 font-semibold min-h-0"
                  disabled={bannerModalSaving || bannerModalUploading || bannerModalRemovingImage}
                  onClick={handleDeleteBannerModal}
                >
                  🗑️ Eliminar Banner
                </Button>
              ) : (
                <div />
              )}
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  className="border border-neutral-300 bg-white text-neutral-700 text-xs py-2 px-4 min-h-0"
                  disabled={bannerModalSaving || bannerModalUploading || bannerModalRemovingImage}
                  onClick={closeBannerModal}
                >
                  Cancelar
                </Button>
                <Button
                  type="button"
                  className="bg-[#16A34A] text-white font-semibold text-xs py-2 px-4 disabled:opacity-40 min-h-0"
                  disabled={bannerModalSaving || bannerModalUploading || bannerModalRemovingImage}
                  onClick={handleSaveBannerModal}
                >
                  {bannerModalSaving ? 'Guardando…' : 'Guardar Banner'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {activeTab === 'schedules' && (
        <div className="space-y-4">
          {loadingSchedules ? (
            <Card className="p-6 text-center text-xs text-neutral-500">Cargando horarios de torres...</Card>
          ) : (
            <div className="grid gap-3">
              {schedules.map((sch) => (
                <Card key={sch.id} className="p-4 border border-neutral-200 bg-white flex items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{sch.emoji}</span>
                      <h4 className="font-bold text-neutral-800 text-sm">{sch.towerName}</h4>
                      <span
                        className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                          sch.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {sch.isActive ? '🟢 Servicio Habilitado' : '🔴 Pausado'}
                      </span>
                    </div>
                    <p className="text-xs text-neutral-600 mt-2 font-medium">
                      ⏰ Pedidos: <span className="text-neutral-800 font-bold">{sch.orderStartTime} - {sch.orderEndTime}</span> | 🚚 Reparto: <span className="text-neutral-800 font-bold">{sch.deliveryStartTime} - {sch.deliveryEndTime}</span>
                    </p>
                    <p className="text-[11px] text-neutral-500 mt-1">
                      📅 Días: <span className="text-neutral-700">{sch.activeDays.length ? sch.activeDays.map((d) => DAY_LABELS[d]).join(', ') : 'Ningún día'}</span>
                    </p>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Button
                      type="button"
                      className="bg-neutral-100 border border-neutral-300 text-neutral-700 hover:bg-neutral-200 text-xs py-1.5 px-3 min-h-0 font-medium"
                      onClick={() => setEditingSchedule({ ...sch, activeDays: [...sch.activeDays] })}
                    >
                      ⚙️ Configurar
                    </Button>
                    <Button
                      type="button"
                      className="bg-neutral-800 border border-neutral-700 text-white hover:bg-neutral-900 text-xs py-1.5 px-3 min-h-0 disabled:opacity-40 font-medium"
                      disabled={savingScheduleId === sch.id}
                      onClick={() => handleToggleSchedule(sch)}
                    >
                      {sch.isActive ? 'Pausar' : 'Activar'}
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {/* Interactive Schedule Editor Modal */}
          {editingSchedule && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
              <div className="w-full max-w-lg rounded-2xl border border-cyan-500/30 bg-zinc-950 p-6 shadow-2xl space-y-5">
                <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{editingSchedule.emoji}</span>
                    <div>
                      <h3 className="font-extrabold text-base text-zinc-100">Editar Horario: {editingSchedule.towerName}</h3>
                      <p className="text-xs text-zinc-400">Configura días de atención, toma de pedido y entrega</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="text-zinc-400 hover:text-zinc-100 text-lg font-bold"
                    onClick={() => setEditingSchedule(null)}
                  >
                    ✕
                  </button>
                </div>

                {/* Emoji & Name */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-300 block">Icono Emoji & Nombre de Ubicación</label>
                  <div className="flex gap-2 items-center">
                    <div className="flex gap-1 bg-zinc-900 p-1 rounded-xl border border-zinc-800">
                      {['🏢', '🏙️', '🏬', '🗼', '🍔', '🚀'].map((em) => (
                        <button
                          key={em}
                          type="button"
                          className={`p-1.5 text-lg rounded-lg transition-transform ${editingSchedule.emoji === em ? 'bg-cyan-500/20 border border-cyan-400 scale-110' : 'opacity-60 hover:opacity-100'}`}
                          onClick={() => setEditingSchedule({ ...editingSchedule, emoji: em })}
                        >
                          {em}
                        </button>
                      ))}
                    </div>
                    <input
                      type="text"
                      className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-100 font-bold focus:border-cyan-400 outline-none"
                      value={editingSchedule.towerName}
                      onChange={(e) => setEditingSchedule({ ...editingSchedule, towerName: e.target.value })}
                    />
                  </div>
                </div>

                {/* Days Selection Chips */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-300 block">Días de Atención Habilitados</label>
                  <div className="grid grid-cols-7 gap-1.5">
                    {[
                      { d: 1, label: 'Lun' },
                      { d: 2, label: 'Mar' },
                      { d: 3, label: 'Mié' },
                      { d: 4, label: 'Jue' },
                      { d: 5, label: 'Vie' },
                      { d: 6, label: 'Sáb' },
                      { d: 0, label: 'Dom' },
                    ].map(({ d, label }) => {
                      const selected = editingSchedule.activeDays.includes(d);
                      return (
                        <button
                          key={d}
                          type="button"
                          className={`py-2 text-xs font-black rounded-xl border transition-all ${
                            selected
                              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400 shadow-sm shadow-emerald-500/20 scale-105'
                              : 'bg-zinc-900 text-zinc-500 border-zinc-800 hover:border-zinc-700'
                          }`}
                          onClick={() => {
                            const nextDays = selected
                              ? editingSchedule.activeDays.filter((day) => day !== d)
                              : [...editingSchedule.activeDays, d].sort((a, b) => a - b);
                            setEditingSchedule({ ...editingSchedule, activeDays: nextDays });
                          }}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Order Time Window */}
                <div className="grid grid-cols-2 gap-3 bg-zinc-900/50 p-3 rounded-xl border border-zinc-800">
                  <div>
                    <label className="text-[11px] font-bold text-cyan-300 block mb-1">Hora Inicio Pedidos</label>
                    <input
                      type="time"
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-2 py-1.5 text-xs text-zinc-100 font-bold outline-none focus:border-cyan-400"
                      value={editingSchedule.orderStartTime}
                      onChange={(e) => setEditingSchedule({ ...editingSchedule, orderStartTime: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-cyan-300 block mb-1">Hora Límite Pedidos</label>
                    <input
                      type="time"
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-2 py-1.5 text-xs text-zinc-100 font-bold outline-none focus:border-cyan-400"
                      value={editingSchedule.orderEndTime}
                      onChange={(e) => setEditingSchedule({ ...editingSchedule, orderEndTime: e.target.value })}
                    />
                  </div>
                </div>

                {/* Delivery Time Window */}
                <div className="grid grid-cols-2 gap-3 bg-zinc-900/50 p-3 rounded-xl border border-zinc-800">
                  <div>
                    <label className="text-[11px] font-bold text-amber-300 block mb-1">Hora Inicio Reparto</label>
                    <input
                      type="time"
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-2 py-1.5 text-xs text-zinc-100 font-bold outline-none focus:border-amber-400"
                      value={editingSchedule.deliveryStartTime}
                      onChange={(e) => setEditingSchedule({ ...editingSchedule, deliveryStartTime: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-amber-300 block mb-1">Hora Fin Reparto</label>
                    <input
                      type="time"
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-2 py-1.5 text-xs text-zinc-100 font-bold outline-none focus:border-amber-400"
                      value={editingSchedule.deliveryEndTime}
                      onChange={(e) => setEditingSchedule({ ...editingSchedule, deliveryEndTime: e.target.value })}
                    />
                  </div>
                </div>

                {/* Custom Label */}
                <div>
                  <label className="text-xs font-bold text-zinc-300 block mb-1">Etiqueta de Ventana (opcional)</label>
                  <input
                    type="text"
                    placeholder="Ej. 1:30 PM a 2:00 PM"
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-100 font-medium outline-none focus:border-cyan-400"
                    value={editingSchedule.deliveryLabel ?? ''}
                    onChange={(e) => setEditingSchedule({ ...editingSchedule, deliveryLabel: e.target.value || null })}
                  />
                </div>

                {/* Active Toggle & Modal Actions */}
                <div className="flex items-center justify-between border-t border-zinc-800 pt-4">
                  <button
                    type="button"
                    className={`text-xs font-black px-3 py-1.5 rounded-full border transition-colors ${
                      editingSchedule.isActive ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400' : 'bg-rose-500/20 text-rose-300 border-rose-400'
                    }`}
                    onClick={() => setEditingSchedule({ ...editingSchedule, isActive: !editingSchedule.isActive })}
                  >
                    {editingSchedule.isActive ? '🟢 Horario Activo' : '🔴 Horario Pausado'}
                  </button>

                  <div className="flex gap-2">
                    <Button
                      type="button"
                      className="bg-zinc-800 text-zinc-300 text-xs py-1.5 px-4 min-h-0"
                      onClick={() => setEditingSchedule(null)}
                    >
                      Cancelar
                    </Button>
                    <Button
                      type="button"
                      className="bg-cyan-400 text-zinc-950 font-extrabold text-xs py-1.5 px-5 min-h-0 disabled:opacity-40"
                      disabled={savingScheduleId === editingSchedule.id}
                      onClick={() => handleSaveFullSchedule(editingSchedule)}
                    >
                      {savingScheduleId === editingSchedule.id ? 'Guardando…' : 'Guardar Horario'}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'status' && (
        <Card className="p-6 border border-neutral-200 bg-white space-y-4">
          <h3 className="font-semibold text-base text-neutral-800">Interruptor Principal de la Tienda</h3>
          <p className="text-xs text-neutral-500">Controla si la tienda en línea permite navegar el catálogo e ingresar pedidos.</p>

          <div className="p-4 rounded-xl bg-[#F5F2EE] border border-neutral-200 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-neutral-700 block">Modo Catálogo Activo</span>
              <span className="text-[11px] text-neutral-500">
                {catalogEnabled ? 'La tienda está abierta al público.' : 'La tienda está cerrada temporalmente.'}
              </span>
            </div>
            <Button
              type="button"
              className={`font-semibold text-xs py-2 px-4 min-h-0 ${
                catalogEnabled ? 'bg-red-50 border border-red-200 text-red-700' : 'bg-[#16A34A] text-white'
              }`}
              disabled={savingConfig}
              onClick={handleToggleStoreMode}
            >
              {savingConfig ? 'Cambiando…' : catalogEnabled ? 'Cerrar Tienda' : 'Abrir Tienda'}
            </Button>
          </div>
        </Card>
      )}

      {activeTab === 'sorteos' && (
        <Card className="p-6 border border-neutral-200 bg-white space-y-4">
          <h3 className="font-semibold text-base text-neutral-800">Campaña de Sorteo Activa</h3>
          {raffleCampaignId ? (
            <div className="p-4 rounded-xl bg-[#F5F2EE] border border-neutral-200 flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-neutral-700 block">🎁 {raffleTitle}</span>
                <span className="text-[11px] text-neutral-500">
                  {raffleActive ? 'Los clientes acumulan boletos en cada pedido.' : 'El sorteo está pausado actualmente.'}
                </span>
              </div>
              <Button
                type="button"
                className={`font-semibold text-xs py-2 px-4 min-h-0 ${
                  raffleActive ? 'bg-red-50 border border-red-200 text-red-700' : 'bg-[#16A34A] text-white'
                }`}
                disabled={togglingRaffle}
                onClick={handleToggleRaffle}
              >
                {togglingRaffle ? 'Cambiando…' : raffleActive ? 'Pausar Sorteo' : 'Activar Sorteo'}
              </Button>
            </div>
          ) : (
            <p className="text-xs text-neutral-500">No hay campañas de sorteo registradas.</p>
          )}
        </Card>
      )}
    </div>
  );
}
