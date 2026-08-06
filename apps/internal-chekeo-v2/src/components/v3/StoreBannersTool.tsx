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
  { key: 'gradient-dark', label: '🖤 Carbón Premium', style: 'linear-gradient(135deg, #18181B 0%, #27272A 100%)', border: 'border-zinc-700' },
];

const BADGE_COLORS: Array<{ key: string; label: string; badgeStyle: string }> = [
  { key: 'cyan', label: '🩵 Cyan', badgeStyle: 'bg-cyan-400 text-zinc-950 font-black' },
  { key: 'amber', label: '💛 Ámbar', badgeStyle: 'bg-amber-400 text-zinc-950 font-black' },
  { key: 'rose', label: '🩷 Rose', badgeStyle: 'bg-rose-500 text-white font-black' },
  { key: 'emerald', label: '💚 Verde', badgeStyle: 'bg-emerald-400 text-zinc-950 font-black' },
  { key: 'purple', label: '💜 Morado', badgeStyle: 'bg-indigo-400 text-white font-black' },
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

export function StoreBannersTool() {
  const [activeTab, setActiveTab] = useState<'banners' | 'schedules' | 'status' | 'sorteos'>('banners');

  // Banners List State
  const [banners, setBanners] = useState<CatalogBanner[]>([]);
  const [loadingBanners, setLoadingBanners] = useState(true);

  // Banner Modal State
  const [bannerModalForm, setBannerModalForm] = useState<CatalogBannerForm | null>(null);
  const [bannerModalSaving, setBannerModalSaving] = useState(false);
  const [bannerModalUploading, setBannerModalUploading] = useState(false);
  const [bannerModalRemovingImage, setBannerModalRemovingImage] = useState(false);
  const [selectedBannerFile, setSelectedBannerFile] = useState<File | null>(null);
  const [bannerModalError, setBannerModalError] = useState<string | null>(null);
  const bannerFileInputRef = useRef<HTMLInputElement | null>(null);

  // Schedules State
  const [schedules, setSchedules] = useState<TowerSchedule[]>([]);
  const [loadingSchedules, setLoadingSchedules] = useState(true);
  const [savingScheduleId, setSavingScheduleId] = useState<string | null>(null);

  // Store Status State
  const [catalogEnabled, setCatalogEnabled] = useState(true);
  const [savingConfig, setSavingConfig] = useState(false);

  // Raffle State
  const [raffleActive, setRaffleActive] = useState(false);
  const [raffleCampaignId, setRaffleCampaignId] = useState<string | null>(null);
  const [raffleTitle, setRaffleTitle] = useState('');
  const [togglingRaffle, setTogglingRaffle] = useState(false);

  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Load Store Banners
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

  // Load Schedules
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

  // Load Config & Raffle
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

  // Modal Triggers
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
  };

  const beginEditBannerModal = (b: CatalogBanner) => {
    setBannerModalForm({
      id: b.id,
      title: b.title,
      subtitle: b.subtitle || '',
      ctaLabel: b.ctaLabel || '',
      isActive: b.isActive,
      sortOrder: String(b.sortOrder),
      imageUrl: b.imageUrl || '',
      imageKey: b.imageKey || '',
      bgPreset: b.bgPreset || 'gradient-cyan',
      badgeText: b.badgeText || '',
      badgeColor: b.badgeColor || 'cyan',
      ctaActionType: b.ctaActionType || 'none',
      ctaTarget: b.ctaTarget || ''
    });
    setSelectedBannerFile(null);
    setBannerModalError(null);
  };

  const closeBannerModal = () => {
    setBannerModalForm(null);
    setSelectedBannerFile(null);
    setBannerModalError(null);
  };

  // Save Banner Modal Handler
  const handleSaveBannerModal = async () => {
    if (!bannerModalForm) return;
    const { id, title, subtitle, ctaLabel, isActive, sortOrder, bgPreset, badgeText, badgeColor, ctaActionType, ctaTarget } = bannerModalForm;
    if (!title.trim()) { setBannerModalError('El título es requerido'); return; }
    if (!Number.isInteger(Number(sortOrder))) { setBannerModalError('Orden debe ser un número entero'); return; }

    setBannerModalSaving(true);
    setBannerModalError(null);
    try {
      const endpoint = id ? `/api/menu-v2-admin/catalog-banners/${encodeURIComponent(id)}` : '/api/menu-v2-admin/catalog-banners';
      const method = id ? 'PATCH' : 'POST';
      const res = await fetch(endpoint, {
        method,
        credentials: 'include',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          subtitle: subtitle.trim() || null,
          ctaLabel: ctaLabel.trim() || null,
          bgPreset: bgPreset || null,
          badgeText: badgeText.trim() || null,
          badgeColor: badgeColor || null,
          ctaActionType: ctaActionType || null,
          ctaTarget: ctaTarget.trim() || null,
          isActive,
          sortOrder: Number(sortOrder)
        })
      });
      const data = (await res.json()) as CatalogBannerMutationResponse;
      if (!res.ok || !data.ok || !data.banner) throw new Error(data.error ?? 'Error al guardar banner del catálogo');

      setNotice(id ? 'Banner actualizado' : 'Banner creado');
      setTimeout(() => setNotice(null), 3000);
      if (!id && data.banner) {
        setBannerModalForm({
          id: data.banner.id,
          title: data.banner.title,
          subtitle: data.banner.subtitle || '',
          ctaLabel: data.banner.ctaLabel || '',
          isActive: data.banner.isActive,
          sortOrder: String(data.banner.sortOrder),
          imageUrl: data.banner.imageUrl || '',
          imageKey: data.banner.imageKey || '',
          bgPreset: data.banner.bgPreset || 'gradient-cyan',
          badgeText: data.banner.badgeText || '',
          badgeColor: data.banner.badgeColor || 'cyan',
          ctaActionType: data.banner.ctaActionType || 'none',
          ctaTarget: data.banner.ctaTarget || ''
        });
      } else {
        closeBannerModal();
      }
      loadBanners();
    } catch (e) {
      setBannerModalError(e instanceof Error ? e.message : 'Error al guardar banner');
    } finally {
      setBannerModalSaving(false);
    }
  };

  // Delete Banner Handler
  const handleDeleteBannerModal = async () => {
    if (!bannerModalForm?.id) return;
    if (!confirm('¿Seguro que deseas eliminar este banner permanentemente?')) return;
    setBannerModalSaving(true);
    setBannerModalError(null);
    try {
      const res = await fetch(`/api/menu-v2-admin/catalog-banners/${encodeURIComponent(bannerModalForm.id)}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      const data = (await res.json()) as { ok: boolean; error?: string };
      if (!res.ok || !data.ok) throw new Error(data.error ?? 'Error al eliminar banner');
      setNotice('Banner eliminado');
      setTimeout(() => setNotice(null), 3000);
      closeBannerModal();
      loadBanners();
    } catch (e) {
      setBannerModalError(e instanceof Error ? e.message : 'Error al eliminar banner');
    } finally {
      setBannerModalSaving(false);
    }
  };

  // Upload Image Handler
  const handleUploadImageModal = async () => {
    if (!bannerModalForm?.id || !selectedBannerFile) return;
    const fileErr = validateSelectedFile(selectedBannerFile);
    if (fileErr) { setBannerModalError(fileErr); return; }

    setBannerModalUploading(true);
    setBannerModalError(null);
    try {
      const body = new FormData();
      body.append('file', selectedBannerFile);
      const res = await fetch(`/api/menu-v2-admin/catalog-banners/${encodeURIComponent(bannerModalForm.id)}/image`, {
        method: 'POST',
        credentials: 'include',
        body
      });
      const data = (await res.json()) as CatalogBannerMutationResponse;
      if (!res.ok || !data.ok || !data.banner) throw new Error(data.error ?? 'No se pudo subir la imagen');

      setBannerModalForm((prev) =>
        prev
          ? {
              ...prev,
              imageUrl: data.banner?.imageUrl || '',
              imageKey: data.banner?.imageKey || ''
            }
          : null
      );
      setSelectedBannerFile(null);
      if (bannerFileInputRef.current) bannerFileInputRef.current.value = '';
      setNotice(data.warning ? `Imagen actualizada (${data.warning})` : 'Imagen de banner actualizada');
      setTimeout(() => setNotice(null), 3000);
      loadBanners();
    } catch (e) {
      setBannerModalError(e instanceof Error ? e.message : 'No se pudo subir la imagen');
    } finally {
      setBannerModalUploading(false);
    }
  };

  // Remove Image Handler
  const handleRemoveImageModal = async () => {
    if (!bannerModalForm?.id) return;
    setBannerModalRemovingImage(true);
    setBannerModalError(null);
    try {
      const res = await fetch(`/api/menu-v2-admin/catalog-banners/${encodeURIComponent(bannerModalForm.id)}/image`, {
        method: 'DELETE',
        credentials: 'include'
      });
      const data = (await res.json()) as CatalogBannerMutationResponse;
      if (!res.ok || !data.ok || !data.banner) throw new Error(data.error ?? 'No se pudo quitar la imagen');

      setBannerModalForm((prev) => (prev ? { ...prev, imageUrl: '', imageKey: '' } : null));
      setSelectedBannerFile(null);
      if (bannerFileInputRef.current) bannerFileInputRef.current.value = '';
      setNotice('Imagen quitada. El banner ahora se mostrará en modo texto estilizado.');
      setTimeout(() => setNotice(null), 3000);
      loadBanners();
    } catch (e) {
      setBannerModalError(e instanceof Error ? e.message : 'No se pudo quitar la imagen');
    } finally {
      setBannerModalRemovingImage(false);
    }
  };

  // Toggle Schedule Active
  const handleToggleSchedule = async (sch: TowerSchedule) => {
    setSavingScheduleId(sch.id);
    setError(null);
    try {
      const nextActive = !sch.isActive;
      const res = await fetch(`/api/menu-v2-admin/tower-schedules/${encodeURIComponent(sch.id)}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ isActive: nextActive })
      });
      const data = (await res.json()) as { ok: boolean; error?: string };
      if (!res.ok || !data.ok) throw new Error(data.error ?? 'Error al cambiar horario');

      setSchedules((prev) => prev.map((s) => (s.id === sch.id ? { ...s, isActive: nextActive } : s)));
      setNotice(`Horario de ${sch.towerName} ${nextActive ? 'activado' : 'pausado'}`);
      setTimeout(() => setNotice(null), 3000);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al cambiar horario');
    } finally {
      setSavingScheduleId(null);
    }
  };

  // Toggle Store Catalog Mode
  const handleToggleStoreMode = async () => {
    setSavingConfig(true);
    setError(null);
    try {
      const nextState = !catalogEnabled;
      const res = await fetch('/api/menu-v2-admin/site-config', {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ catalogEnabled: nextState })
      });
      const data = (await res.json()) as { ok: boolean; error?: string };
      if (!res.ok || !data.ok) throw new Error(data.error ?? 'Error al cambiar modo de tienda');

      setCatalogEnabled(nextState);
      setNotice(`Modo Catálogo ${nextState ? 'ENCENDIDO' : 'APAGADO'}`);
      setTimeout(() => setNotice(null), 3000);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al cambiar modo de tienda');
    } finally {
      setSavingConfig(false);
    }
  };

  // Toggle Raffle Active Status
  const handleToggleRaffle = async () => {
    if (!raffleCampaignId) return;
    setTogglingRaffle(true);
    setError(null);
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

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between border-b border-zinc-800 pb-4">
        <div>
          <h2 className="text-xl font-black text-cyan-300 flex items-center gap-2">🎨 Tienda, Banners & Horarios Operativos</h2>
          <p className="text-xs text-zinc-400">Gestiona banners visuales y de texto estilizado, horarios por Torre y estado de la tienda.</p>
        </div>
      </div>

      {notice ? <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-xs text-emerald-200">{notice}</div> : null}
      {error ? <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-700/50 text-xs text-rose-200">{error}</div> : null}

      {/* Sub Tabs */}
      <div className="flex gap-2 border-b border-zinc-800 pb-2 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('banners')}
          className={`px-3 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
            activeTab === 'banners' ? 'bg-cyan-400 text-zinc-950 shadow' : 'bg-zinc-900 text-zinc-300 hover:bg-zinc-800'
          }`}
        >
          🎨 Banners del Catálogo ({banners.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('schedules')}
          className={`px-3 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
            activeTab === 'schedules' ? 'bg-cyan-400 text-zinc-950 shadow' : 'bg-zinc-900 text-zinc-300 hover:bg-zinc-800'
          }`}
        >
          ⏰ Horarios por Torre ({schedules.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('status')}
          className={`px-3 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
            activeTab === 'status' ? 'bg-cyan-400 text-zinc-950 shadow' : 'bg-zinc-900 text-zinc-300 hover:bg-zinc-800'
          }`}
        >
          🏪 Estado de Tienda
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('sorteos')}
          className={`px-3 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
            activeTab === 'sorteos' ? 'bg-cyan-400 text-zinc-950 shadow' : 'bg-zinc-900 text-zinc-300 hover:bg-zinc-800'
          }`}
        >
          🎁 Sorteo Activo
        </button>
      </div>

      {/* TAB 1: Banners */}
      {activeTab === 'banners' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-cyan-300">Gestión de Banners Promocionales</h3>
              <p className="text-[11px] text-zinc-400">Soporta banners visuales con imagen y banners de texto con fondo estilizado degradado.</p>
            </div>
            <Button
              type="button"
              className="bg-cyan-400 text-zinc-950 font-bold text-xs py-1.5 px-3 min-h-0"
              onClick={beginCreateBannerModal}
            >
              + Crear Banner
            </Button>
          </div>

          {/* List of Banners */}
          {loadingBanners ? (
            <Card className="p-6 text-center text-xs text-zinc-400">Cargando banners...</Card>
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
                      b.isActive ? 'border-zinc-800 bg-zinc-900/80' : 'border-zinc-800/50 bg-zinc-900/40 opacity-70'
                    }`}
                  >
                    {/* Live Preview Card Box */}
                    <div className="w-full md:w-72 h-28 shrink-0 rounded-2xl border border-zinc-800 overflow-hidden relative shadow-lg flex flex-col justify-between p-3.5" style={{ background: previewUrl ? undefined : bgStyle }}>
                      {previewUrl ? (
                        <img src={previewUrl} alt={b.title} className="absolute inset-0 w-full h-full object-cover" loading="lazy" decoding="async" />
                      ) : null}

                      {/* Overlay gradient if image present */}
                      {previewUrl && <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />}

                      {/* Content inside preview */}
                      <div className="relative z-10 flex items-start justify-between gap-2">
                        {b.badgeText ? (
                          <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full shadow ${badgeStyle}`}>
                            {b.badgeText}
                          </span>
                        ) : (
                          <span className="text-[10px] bg-black/40 text-zinc-300 backdrop-blur px-2 py-0.5 rounded-full">
                            {previewUrl ? '🖼️ Imagen' : '🎨 Texto'}
                          </span>
                        )}
                        <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                          b.isActive ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 backdrop-blur' : 'bg-rose-500/20 text-rose-300 border border-rose-500/40 backdrop-blur'
                        }`}>
                          {b.isActive ? 'Activo' : 'Inactivo'}
                        </span>
                      </div>

                      <div className="relative z-10 space-y-0.5">
                        <h4 className="font-black text-white text-sm leading-tight drop-shadow truncate">{b.title}</h4>
                        {b.subtitle && <p className="text-[11px] text-zinc-200 line-clamp-1 drop-shadow-sm">{b.subtitle}</p>}
                      </div>
                    </div>

                    {/* Meta & Info */}
                    <div className="min-w-0 flex-1 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="font-bold text-zinc-100 text-sm truncate">{b.title}</h4>
                        <span className="text-[10px] bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded font-mono">
                          {previewUrl ? '🖼️ Banner con Imagen' : '🎨 Banner de Texto'}
                        </span>
                      </div>
                      {b.subtitle && <p className="text-xs text-zinc-400 line-clamp-2">{b.subtitle}</p>}
                      <div className="flex flex-wrap items-center gap-3 text-[11px] text-zinc-500 font-mono pt-1">
                        <span>Orden: <strong>{b.sortOrder}</strong></span>
                        {b.ctaLabel && <span className="text-cyan-400">CTA: <strong>{b.ctaLabel}</strong></span>}
                        {b.ctaActionType && b.ctaActionType !== 'none' && (
                          <span className="text-amber-300">Acción: <strong>{b.ctaActionType} {b.ctaTarget ? `(${b.ctaTarget})` : ''}</strong></span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <Button
                      type="button"
                      className="bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-100 text-xs py-2 px-4 rounded-xl shrink-0 font-bold self-end md:self-center min-h-0"
                      onClick={() => beginEditBannerModal(b)}
                    >
                      ✏️ Editar Banner
                    </Button>
                  </Card>
                );
              })}
              {!banners.length && (
                <Card className="p-8 text-center text-xs text-zinc-500 border border-dashed border-zinc-800">
                  No hay banners de catálogo registrados. Haz clic en "+ Crear Banner" para registrar el primero.
                </Card>
              )}
            </div>
          )}
        </div>
      )}

      {/* Banner Modal */}
      {bannerModalForm ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={closeBannerModal}>
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-zinc-950 border border-zinc-800 rounded-2xl p-6 space-y-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="font-black text-lg text-cyan-300">
                {bannerModalForm.id ? '✏️ Editar Banner del Catálogo' : '➕ Crear Nuevo Banner'}
              </h3>
              <button type="button" className="text-zinc-400 hover:text-zinc-100 p-1 text-sm font-bold" onClick={closeBannerModal}>
                ✕
              </button>
            </div>

            {/* LIVE PREVIEW BOX inside Modal */}
            <div className="space-y-2">
              <span className="text-[11px] font-black uppercase tracking-widest text-cyan-400 block">👁️ Vista Previa en Vivo (Cliente):</span>
              <div
                className="w-full h-32 rounded-2xl border border-zinc-800 overflow-hidden relative shadow-xl flex flex-col justify-between p-4 transition-all"
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
                  <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                    bannerModalForm.isActive ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 backdrop-blur' : 'bg-rose-500/20 text-rose-300 border border-rose-500/40 backdrop-blur'
                  }`}>
                    {bannerModalForm.isActive ? 'Activo' : 'Inactivo'}
                  </span>
                </div>

                <div className="relative z-10 flex items-end justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <h4 className="font-black text-white text-base leading-tight drop-shadow truncate">
                      {bannerModalForm.title || 'Título del Banner'}
                    </h4>
                    <p className="text-xs text-zinc-200 line-clamp-1 drop-shadow-sm mt-0.5">
                      {bannerModalForm.subtitle || 'Subtítulo corto de prueba...'}
                    </p>
                  </div>
                  {bannerModalForm.ctaLabel && (
                    <span className="shrink-0 px-3 py-1.5 rounded-xl bg-white text-zinc-950 font-black text-xs shadow-lg">
                      {bannerModalForm.ctaLabel}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Presets */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block">Presets Rápidos de Texto:</span>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className="px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-700 text-xs transition-colors"
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
                  className="px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-700 text-xs transition-colors"
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
                  className="px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-700 text-xs transition-colors"
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

            {/* Inputs Section */}
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider block mb-1">Título del Banner *</label>
                <input
                  className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-100 font-bold outline-none focus:border-cyan-400"
                  value={bannerModalForm.title}
                  onChange={(e) => setBannerModalForm({ ...bannerModalForm, title: e.target.value })}
                  placeholder="ej. ⚡ ENVÍO GRATIS $0"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider block mb-1">Subtítulo (Opcional)</label>
                <textarea
                  className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-100 outline-none focus:border-cyan-400"
                  rows={2}
                  value={bannerModalForm.subtitle}
                  onChange={(e) => setBannerModalForm({ ...bannerModalForm, subtitle: e.target.value })}
                  placeholder="ej. En tu primer pedido mayor a $150 con código BURGERS"
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider block mb-1">Texto del Botón CTA (Opcional)</label>
                  <input
                    className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-100 outline-none focus:border-cyan-400"
                    value={bannerModalForm.ctaLabel}
                    onChange={(e) => setBannerModalForm({ ...bannerModalForm, ctaLabel: e.target.value })}
                    placeholder="ej. Pedir Ahora"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider block mb-1">Orden Visual</label>
                  <input
                    className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-100 outline-none focus:border-cyan-400"
                    inputMode="numeric"
                    value={bannerModalForm.sortOrder}
                    onChange={(e) => setBannerModalForm({ ...bannerModalForm, sortOrder: e.target.value })}
                  />
                </div>
              </div>

              {/* Text Banner Styling Options */}
              <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/60 space-y-4">
                <h4 className="text-xs font-black uppercase tracking-wider text-cyan-300">🎨 Personalización de Banner de Texto (Sin Imagen)</h4>
                
                {/* BG Preset selector */}
                <div>
                  <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block mb-2">Fondo Degradado (BG Preset):</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {BG_PRESETS.map((preset) => (
                      <button
                        key={preset.key}
                        type="button"
                        className={`p-2.5 rounded-xl border text-xs font-bold text-white flex items-center justify-between transition-all ${
                          bannerModalForm.bgPreset === preset.key
                            ? `${preset.border} ring-2 ring-cyan-400 shadow-lg scale-[1.02]`
                            : 'border-zinc-800 hover:border-zinc-700 opacity-80'
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

                {/* Badge Text & Badge Color */}
                <div className="grid sm:grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">Texto de la Etiqueta / Badge:</label>
                    <input
                      className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-100 outline-none focus:border-cyan-400"
                      value={bannerModalForm.badgeText}
                      onChange={(e) => setBannerModalForm({ ...bannerModalForm, badgeText: e.target.value })}
                      placeholder="ej. ⚡ PROMO EXCLUSIVA"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">Color del Badge:</label>
                    <select
                      className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-100 outline-none focus:border-cyan-400"
                      value={bannerModalForm.badgeColor}
                      onChange={(e) => setBannerModalForm({ ...bannerModalForm, badgeColor: e.target.value })}
                    >
                      {BADGE_COLORS.map((c) => (
                        <option key={c.key} value={c.key}>{c.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* CTA Action Type & Target */}
                <div className="grid sm:grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">Acción al hacer Clic:</label>
                    <select
                      className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-100 outline-none focus:border-cyan-400"
                      value={bannerModalForm.ctaActionType}
                      onChange={(e) => setBannerModalForm({ ...bannerModalForm, ctaActionType: e.target.value })}
                    >
                      <option value="none">Ninguna (Informativo)</option>
                      <option value="category">Ir a Categoría del Catálogo</option>
                      <option value="url">Abrir URL Enlace Externo</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">Destino / Target:</label>
                    <input
                      className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-100 outline-none focus:border-cyan-400"
                      value={bannerModalForm.ctaTarget}
                      onChange={(e) => setBannerModalForm({ ...bannerModalForm, ctaTarget: e.target.value })}
                      placeholder={bannerModalForm.ctaActionType === 'category' ? 'ej. burgers, combos' : 'ej. https://...'}
                    />
                  </div>
                </div>
              </div>

              {/* Active Toggle Switch */}
              <div className="flex items-center gap-2 p-3 rounded-xl bg-zinc-900 border border-zinc-800">
                <label className="flex items-center gap-3 cursor-pointer text-xs font-bold text-zinc-200">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-zinc-700 bg-zinc-950 text-cyan-400 focus:ring-cyan-400"
                    checked={bannerModalForm.isActive}
                    onChange={(e) => setBannerModalForm({ ...bannerModalForm, isActive: e.target.checked })}
                  />
                  <span>Banner Activo (Visible en tienda pública)</span>
                </label>
              </div>

              {/* Image Manager (Cloudflare R2) */}
              {bannerModalForm.id ? (
                <div className="p-4 rounded-xl border border-cyan-500/30 bg-cyan-950/20 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-black uppercase tracking-wider text-cyan-300">🖼️ Imagen del Banner (Opcional - Cloudflare R2)</h4>
                    {getAssetUrl(bannerModalForm.imageUrl, bannerModalForm.imageKey) && (
                      <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded font-bold">Imagen Activa</span>
                    )}
                  </div>
                  <div className="flex flex-col sm:flex-row items-center gap-4">
                    <div className="w-32 h-20 shrink-0 rounded-xl bg-zinc-950 border border-zinc-800 overflow-hidden flex items-center justify-center">
                      {getAssetUrl(bannerModalForm.imageUrl, bannerModalForm.imageKey) ? (
                        <img src={getAssetUrl(bannerModalForm.imageUrl, bannerModalForm.imageKey)} alt="Banner Visual" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Sin Imagen</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0 space-y-2 w-full">
                      <input
                        ref={bannerFileInputRef}
                        type="file"
                        accept={ACCEPTED_IMAGE_TYPES.join(',')}
                        className="w-full text-xs text-zinc-300 file:mr-2 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-zinc-800 file:text-cyan-300 hover:file:bg-zinc-700"
                        disabled={bannerModalUploading || bannerModalRemovingImage || bannerModalSaving}
                        onChange={(e) => setSelectedBannerFile(e.target.files?.[0] ?? null)}
                      />
                      <p className="text-[11px] text-zinc-400">{ACCEPTED_IMAGE_TYPES_LABEL}</p>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          className="flex-1 bg-cyan-400 text-zinc-950 font-bold text-xs py-1.5 min-h-0 disabled:opacity-40"
                          disabled={bannerModalUploading || bannerModalRemovingImage || bannerModalSaving || !selectedBannerFile || Boolean(validateSelectedFile(selectedBannerFile))}
                          onClick={handleUploadImageModal}
                        >
                          {bannerModalUploading ? 'Subiendo…' : bannerModalForm.imageKey || bannerModalForm.imageUrl ? 'Cambiar Imagen' : 'Subir Imagen'}
                        </Button>
                        <Button
                          type="button"
                          className="flex-1 border border-rose-700/50 bg-rose-950/40 text-rose-200 text-xs py-1.5 min-h-0 disabled:opacity-40"
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
                <p className="text-xs text-zinc-400 italic">Guarda el banner primero si deseas adjuntar un archivo de imagen en R2.</p>
              )}
            </div>

            {bannerModalError ? <p className="text-xs text-rose-300 p-2 rounded bg-rose-950/50 border border-rose-800/40">{bannerModalError}</p> : null}

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-zinc-800 gap-2">
              {bannerModalForm.id ? (
                <Button
                  type="button"
                  className="border border-rose-700/60 bg-rose-950/40 text-rose-300 text-xs py-2 px-3 font-bold min-h-0"
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
                  className="border border-zinc-700 bg-zinc-900 text-zinc-300 text-xs py-2 px-4 min-h-0"
                  disabled={bannerModalSaving || bannerModalUploading || bannerModalRemovingImage}
                  onClick={closeBannerModal}
                >
                  Cancelar
                </Button>
                <Button
                  type="button"
                  className="bg-cyan-400 text-zinc-950 font-bold text-xs py-2 px-4 disabled:opacity-40 min-h-0 font-bold"
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

      {/* TAB 2: Horarios por Torre */}
      {activeTab === 'schedules' && (
        <div className="space-y-4">
          {loadingSchedules ? (
            <Card className="p-6 text-center text-xs text-zinc-400">Cargando horarios de torres...</Card>
          ) : (
            <div className="grid gap-3">
              {schedules.map((sch) => (
                <Card key={sch.id} className="p-4 border border-zinc-800 bg-zinc-900/80 flex items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{sch.emoji}</span>
                      <h4 className="font-bold text-zinc-100 text-sm">{sch.towerName}</h4>
                      <span
                        className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                          sch.isActive ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
                        }`}
                      >
                        {sch.isActive ? 'Horario Habilitado' : 'Pausado'}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-400 mt-1">
                      Pedidos: {sch.orderStartTime} - {sch.orderEndTime} | Días: {sch.activeDays.map((d) => DAY_LABELS[d]).join(', ')}
                    </p>
                  </div>
                  <Button
                    type="button"
                    className="bg-zinc-800 border border-zinc-700 text-zinc-200 text-xs py-1.5 min-h-0 disabled:opacity-40"
                    disabled={savingScheduleId === sch.id}
                    onClick={() => handleToggleSchedule(sch)}
                  >
                    {sch.isActive ? 'Pausar Horario' : 'Activar Horario'}
                  </Button>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: Estado de Tienda */}
      {activeTab === 'status' && (
        <Card className="p-6 border border-zinc-800 bg-zinc-900/80 space-y-4">
          <h3 className="font-bold text-base text-cyan-300">Interruptor Principal de la Tienda</h3>
          <p className="text-xs text-zinc-400">Controla si la tienda en línea permite navegar el catálogo e ingresar pedidos.</p>

          <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-zinc-200 block">Modo Catálogo Activo</span>
              <span className="text-[11px] text-zinc-400">
                {catalogEnabled ? 'La tienda está abierta al público.' : 'La tienda está cerrada temporalmente.'}
              </span>
            </div>
            <Button
              type="button"
              className={`font-bold text-xs py-2 px-4 min-h-0 ${
                catalogEnabled ? 'bg-rose-950 border border-rose-700 text-rose-200' : 'bg-emerald-500 text-zinc-950'
              }`}
              disabled={savingConfig}
              onClick={handleToggleStoreMode}
            >
              {savingConfig ? 'Cambiando…' : catalogEnabled ? 'Cerrar Tienda' : 'Abrir Tienda'}
            </Button>
          </div>
        </Card>
      )}

      {/* TAB 4: Sorteo */}
      {activeTab === 'sorteos' && (
        <Card className="p-6 border border-zinc-800 bg-zinc-900/80 space-y-4">
          <h3 className="font-bold text-base text-cyan-300">Campaña de Sorteo Activa</h3>
          {raffleCampaignId ? (
            <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-zinc-200 block">🎁 {raffleTitle}</span>
                <span className="text-[11px] text-zinc-400">
                  {raffleActive ? 'Los clientes acumulan boletos en cada pedido.' : 'El sorteo está pausado actualmente.'}
                </span>
              </div>
              <Button
                type="button"
                className={`font-bold text-xs py-2 px-4 min-h-0 ${
                  raffleActive ? 'bg-rose-950 border border-rose-700 text-rose-200' : 'bg-emerald-500 text-zinc-950'
                }`}
                disabled={togglingRaffle}
                onClick={handleToggleRaffle}
              >
                {togglingRaffle ? 'Cambiando…' : raffleActive ? 'Pausar Sorteo' : 'Activar Sorteo'}
              </Button>
            </div>
          ) : (
            <p className="text-xs text-zinc-400">No hay campañas de sorteo registradas.</p>
          )}
        </Card>
      )}
    </div>
  );
}
