import React, { useState, useEffect } from 'react';
import { Sun, Moon, AlertCircle } from 'lucide-react';
import {
  useActiveTowers,
  useActiveRaffleQuery,
  useSiteConfig,
  usePublicConfig,
  getMexicoCityDateTime,
} from '../../features';
import { TowerScheduleModal } from './TowerScheduleModal';

export function BrandHeader() {
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [selectedTowerForModal, setSelectedTowerForModal] = useState<string | null>(null);
  const [isDark, setIsDark] = useState(false);
  const { towers } = useActiveTowers();
  const { siteConfig } = useSiteConfig();
  const { publicConfig } = usePublicConfig();
  const { data: activeRaffle } = useActiveRaffleQuery();

  // Inicialización de tema Dark / Light
  useEffect(() => {
    const isDarkMode =
      document.documentElement.classList.contains('theme-dark') ||
      localStorage.getItem('public_theme') === 'dark' ||
      (!('public_theme' in localStorage) &&
        window.matchMedia('(prefers-color-scheme: dark)').matches);

    setIsDark(isDarkMode);
    if (isDarkMode) {
      document.documentElement.classList.add('theme-dark');
    } else {
      document.documentElement.classList.remove('theme-dark');
    }
  }, []);

  const toggleTheme = () => {
    const nextDark = !isDark;
    setIsDark(nextDark);
    if (nextDark) {
      document.documentElement.classList.add('theme-dark');
      localStorage.setItem('public_theme', 'dark');
    } else {
      document.documentElement.classList.remove('theme-dark');
    }
  };

  const mxNow = getMexicoCityDateTime();
  const brandName = siteConfig?.brandName || 'Burgers.exe';

  const isCatalogEnabled = publicConfig?.catalogEnabled !== false;
  const isAllTowersPaused = towers.length > 0 && towers.every((t) => t.isActive === false);

  const towersOpenToday = towers.filter((t) => {
    const isConfigActive = t.isActive !== false;
    const isToday = Array.isArray(t.activeDays) && t.activeDays.includes(mxNow.dayOfWeek);
    const [endH, endM] = (t.orderEndTime || '13:30').split(':').map((v) => parseInt(v, 10));
    const isPastCutoff = mxNow.hours > endH || (mxNow.hours === endH && mxNow.minutes >= endM);
    return isConfigActive && isToday && !isPastCutoff;
  });

  const isAnyTowerOpen = towersOpenToday.length > 0;
  const isGlobalOpen = isCatalogEnabled && !isAllTowersPaused && isAnyTowerOpen;

  const handleOpenTowerModal = (towerKey?: string) => {
    setSelectedTowerForModal(towerKey || null);
    setIsScheduleOpen(true);
  };

  return (
    <header className="w-full bg-surface-card border-b border-line px-4 py-3 sm:py-4">
      <div className="max-w-[768px] mx-auto flex flex-col gap-3">
        {/* Top Brand Row */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-accent flex items-center justify-center text-white shadow-sm font-extrabold text-lg">
              🍔
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-extrabold tracking-tight text-text-primary leading-tight">
                  {brandName}
                </h1>
                {/* Badge Global de Tienda: Abierto / Cerrado */}
                <span
                  className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-extrabold border ${
                    isGlobalOpen
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-400'
                      : 'bg-red-500/10 border-red-500/30 text-red-700 dark:text-red-400'
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      isGlobalOpen ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'
                    }`}
                  />
                  <span>{isGlobalOpen ? 'Abierto' : 'Cerrado'}</span>
                </span>
              </div>
              <p className="text-xs text-text-secondary font-medium">
                Smash Burgers Artesanales
              </p>
            </div>
          </div>

          {/* Right Actions: Sorteo / Promo Tag & Theme Toggle */}
          <div className="flex items-center gap-2">
            {activeRaffle && (
              <div
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-bold border border-amber-500/20 max-w-[170px] sm:max-w-[240px]"
                title={`Sorteo activo: ${activeRaffle.title}`}
              >
                <span className="text-sm" aria-hidden="true">🎁</span>
                <span className="truncate">{activeRaffle.title}</span>
              </div>
            )}

            {/* Dark / Light Mode Switch */}
            <button
              type="button"
              onClick={toggleTheme}
              className="w-10 h-10 rounded-2xl border border-line bg-surface hover:bg-surface-raised text-text-secondary hover:text-text-primary flex items-center justify-center transition-colors cursor-pointer min-h-[44px] min-w-[44px] focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
              aria-label={isDark ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'}
              title={isDark ? 'Modo Claro' : 'Modo Oscuro'}
            >
              {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Sub-Barra de Rutas de Entrega (Sin scroll horizontal, píldoras con color semántico) */}
        <div className="pt-2 border-t border-line/60 flex items-center gap-2 flex-wrap">
          <span className="text-xs font-bold text-text-secondary shrink-0">
            📍 Entregas:
          </span>

          <div className="flex items-center gap-2 flex-wrap">
            {towers.map((t) => {
              const isConfigActive = t.isActive !== false;
              const isToday =
                Array.isArray(t.activeDays) && t.activeDays.includes(mxNow.dayOfWeek);
              const [endH, endM] = (t.orderEndTime || '13:30')
                .split(':')
                .map((v) => parseInt(v, 10));
              const isPastCutoff =
                mxNow.hours > endH || (mxNow.hours === endH && mxNow.minutes >= endM);
              const isOpenToday = isConfigActive && isToday && !isPastCutoff;

              const colorStyles = !isConfigActive
                ? 'bg-red-500/10 hover:bg-red-500/20 border-red-500/30 text-red-700 dark:text-red-300'
                : isOpenToday
                ? 'bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/30 text-emerald-800 dark:text-emerald-300'
                : 'bg-amber-500/10 hover:bg-amber-500/20 border-amber-500/30 text-amber-800 dark:text-amber-300';

              return (
                <button
                  key={t.towerKey}
                  type="button"
                  onClick={() => handleOpenTowerModal(t.towerKey)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-2xl text-xs border transition-all cursor-pointer min-h-[38px] select-none font-bold focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none ${colorStyles}`}
                  aria-label={`Ver horario y ruta de entrega para ${t.towerName}`}
                  title={`Ver horario y ruta de entrega para ${t.towerName}`}
                >
                  <span className="text-sm" aria-hidden="true">{t.emoji || '🏢'}</span>
                  <span>{t.towerName}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Banner de Aviso Crítico si la Tienda o Cocina está Cerrada/Pausada */}
        {(!isCatalogEnabled || isAllTowersPaused) && (
          <div
            role="alert"
            className="p-3 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-700 dark:text-red-300 text-xs flex items-center gap-2.5 font-medium"
          >
            <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
            <span>
              {!isCatalogEnabled
                ? 'La tienda se encuentra actualmente en mantenimiento temporal.'
                : 'La cocina ha pausado temporalmente la recepción de nuevos pedidos.'}
            </span>
          </div>
        )}
      </div>

      <TowerScheduleModal
        isOpen={isScheduleOpen}
        selectedTowerKey={selectedTowerForModal}
        onClose={() => {
          setIsScheduleOpen(false);
          setSelectedTowerForModal(null);
        }}
      />
    </header>
  );
}
