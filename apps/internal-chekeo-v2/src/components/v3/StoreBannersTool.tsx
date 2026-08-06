import { useEffect, useState, useCallback } from 'react';
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

const DAY_LABELS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

export function StoreBannersTool() {
  const [activeTab, setActiveTab] = useState<'banners' | 'schedules' | 'status' | 'sorteos'>('banners');

  // Banners State
  const [banners, setBanners] = useState<CatalogBanner[]>([]);
  const [loadingBanners, setLoadingBanners] = useState(true);
  const [newTitle, setNewTitle] = useState('');
  const [newSubtitle, setNewSubtitle] = useState('');
  const [newCtaLabel, setNewCtaLabel] = useState('');
  const [savingBanner, setSavingBanner] = useState(false);

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
      const menuData = await menuRes.json() as { publicConfig?: PublicConfig };
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

  // Create Banner
  const handleCreateBanner = async () => {
    if (!newTitle.trim()) { setError('Título de banner requerido'); return; }
    setSavingBanner(true);
    setError(null);
    try {
      const res = await fetch('/api/menu-v2-admin/catalog-banners', {
        method: 'POST',
        credentials: 'include',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          title: newTitle.trim(),
          subtitle: newSubtitle.trim() || null,
          ctaLabel: newCtaLabel.trim() || null,
          isActive: true,
          sortOrder: (banners.length + 1) * 10,
        }),
      });
      const data = (await res.json()) as { ok: boolean; error?: string };
      if (!res.ok || !data.ok) throw new Error(data.error ?? 'Error al guardar banner');
      
      setNewTitle('');
      setNewSubtitle('');
      setNewCtaLabel('');
      setNotice('Banner guardado correctamente');
      setTimeout(() => setNotice(null), 3000);
      loadBanners();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al guardar banner');
    } finally {
      setSavingBanner(false);
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
        body: JSON.stringify({ isActive: nextActive }),
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
        body: JSON.stringify({ catalogEnabled: nextState }),
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
          <h2 className="text-xl font-black text-cyan-300 flex items-center gap-2">
            🎨 Tienda, Banners & Horarios Operativos
          </h2>
          <p className="text-xs text-zinc-400">Gestiona banners visuales, horarios por Torre y estado general de la tienda.</p>
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
          {/* New Banner Card */}
          <Card className="p-4 border border-zinc-800 bg-zinc-900/80 space-y-4">
            <h3 className="text-sm font-bold text-cyan-300">Nuevo Banner Promocional</h3>
            <div className="grid sm:grid-cols-3 gap-3">
              <input
                className="px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-100 outline-none font-bold"
                placeholder="Título del banner (ej. ⚡ ENVÍO GRATIS $0)"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
              />
              <input
                className="px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-100 outline-none"
                placeholder="Subtítulo corto"
                value={newSubtitle}
                onChange={(e) => setNewSubtitle(e.target.value)}
              />
              <input
                className="px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-100 outline-none"
                placeholder="Texto Botón CTA (ej. Pedir ahora)"
                value={newCtaLabel}
                onChange={(e) => setNewCtaLabel(e.target.value)}
              />
            </div>
            <div className="flex justify-end">
              <Button
                type="button"
                className="bg-cyan-400 text-zinc-950 font-bold text-xs py-1.5 min-h-0 disabled:opacity-40"
                disabled={savingBanner}
                onClick={handleCreateBanner}
              >
                {savingBanner ? "Guardando…" : "+ Crear Banner"}
              </Button>
            </div>
          </Card>

          {/* List of Banners */}
          {loadingBanners ? (
            <Card className="p-6 text-center text-xs text-zinc-400">Cargando banners...</Card>
          ) : (
            <div className="grid gap-3">
              {banners.map((b) => (
                <Card key={b.id} className="p-4 border border-zinc-800 bg-zinc-900/60 flex items-center justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <h4 className="font-bold text-zinc-100 text-sm truncate">{b.title}</h4>
                    {b.subtitle ? <p className="text-xs text-zinc-400 truncate mt-0.5">{b.subtitle}</p> : null}
                  </div>
                  <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                    b.isActive ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
                  }`}>
                    {b.isActive ? 'Activo' : 'Inactivo'}
                  </span>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

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
                      <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                        sch.isActive ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
                      }`}>
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
          <p className="text-xs text-zinc-400">
            Controla si la tienda en línea permite navegar el catálogo e ingresar pedidos.
          </p>

          <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-zinc-200 block">Modo Catálogo Activo</span>
              <span className="text-[11px] text-zinc-400">
                {catalogEnabled ? "La tienda está abierta al público." : "La tienda está cerrada temporalmente."}
              </span>
            </div>
            <Button
              type="button"
              className={`font-bold text-xs py-2 px-4 ${
                catalogEnabled ? "bg-rose-950 border border-rose-700 text-rose-200" : "bg-emerald-500 text-zinc-950"
              }`}
              disabled={savingConfig}
              onClick={handleToggleStoreMode}
            >
              {savingConfig ? "Cambiando…" : catalogEnabled ? "Cerrar Tienda" : "Abrir Tienda"}
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
                  {raffleActive ? "Los clientes acumulan boletos en cada pedido." : "El sorteo está pausado actualmente."}
                </span>
              </div>
              <Button
                type="button"
                className={`font-bold text-xs py-2 px-4 ${
                  raffleActive ? "bg-rose-950 border border-rose-700 text-rose-200" : "bg-emerald-500 text-zinc-950"
                }`}
                disabled={togglingRaffle}
                onClick={handleToggleRaffle}
              >
                {togglingRaffle ? "Cambiando…" : raffleActive ? "Pausar Sorteo" : "Activar Sorteo"}
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
