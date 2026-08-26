import React, { useState, useEffect } from 'react';
import { Sun, Moon, Info, Sparkles } from 'lucide-react';
import { useActiveTowers, useActiveRaffleQuery, useSiteConfig, getMexicoCityDateTime } from '../../features';
import { useCheckoutStore } from '../../stores';
import { TowerScheduleModal } from './TowerScheduleModal';

export function BrandHeader() {
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [selectedTowerForModal, setSelectedTowerForModal] = useState<string | null>(null);
  const [isDark, setIsDark] = useState(false);
  const locationKey = useCheckoutStore((s) => s.form.locationKey);
  const { towers } = useActiveTowers();
  const { siteConfig } = useSiteConfig();
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

  // Si no hay torre seleccionada en checkoutStore, la primera de la lista actúa como activa
  const currentActiveKey = locationKey || towers[0]?.towerName || '';

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
              <h1 className="text-xl font-extrabold tracking-tight text-text-primary leading-tight">
                {brandName}
              </h1>
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

        {/* Sub-Barra de Torres & Rutas Corporativas (Directo & Visible) */}
        <div className="pt-1 border-t border-line/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-xs text-text-secondary font-semibold shrink-0">
            <span className="text-sm" aria-hidden="true">🏢</span>
            <span>Entregas en:</span>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
            {towers.map((t) => {
              const isSelected =
                currentActiveKey.toLowerCase() === t.towerName.toLowerCase() ||
                currentActiveKey.toLowerCase() === t.towerKey.toLowerCase();
              const isConfigActive = t.isActive !== false;
              const isToday =
                Array.isArray(t.activeDays) && t.activeDays.includes(mxNow.dayOfWeek);
              const [endH, endM] = (t.orderEndTime || '13:30')
                .split(':')
                .map((v) => parseInt(v, 10));
              const isPastCutoff =
                mxNow.hours > endH || (mxNow.hours === endH && mxNow.minutes >= endM);
              const isOpenToday = isConfigActive && isToday && !isPastCutoff;

              return (
                <button
                  key={t.towerKey}
                  type="button"
                  onClick={() => handleOpenTowerModal(t.towerKey)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-2xl text-xs font-bold transition-all cursor-pointer min-h-[40px] shrink-0 select-none border focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none ${
                    isSelected
                      ? 'bg-accent/10 border-accent text-text-primary shadow-xs ring-1 ring-accent/30'
                      : 'bg-surface hover:bg-surface-raised border-line text-text-secondary hover:text-text-primary'
                  }`}
                  aria-label={`Ver ruta y horario de ${t.towerName}`}
                  title={`Ver horario de ${t.towerName}`}
                >
                  <span className="text-sm" aria-hidden="true">{t.emoji || '🏢'}</span>
                  <span className="font-extrabold">{t.towerName}</span>
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      !isConfigActive
                        ? 'bg-red-500/15 text-red-600'
                        : isOpenToday
                        ? 'bg-accent text-white shadow-xs'
                        : 'bg-amber-500/15 text-amber-700 dark:text-amber-400'
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        isOpenToday
                          ? 'bg-white animate-pulse'
                          : !isConfigActive
                          ? 'bg-red-500'
                          : 'bg-amber-500'
                      }`}
                    />
                    <span>{isOpenToday ? 'Hoy' : !isConfigActive ? 'Pausada' : 'Programar'}</span>
                  </span>
                </button>
              );
            })}

            <button
              type="button"
              onClick={() => handleOpenTowerModal()}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-2xl text-[11px] font-semibold text-text-muted hover:text-text-primary hover:bg-surface transition-colors cursor-pointer shrink-0 min-h-[36px] focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none ml-auto"
              aria-label="Consultar todos los horarios y rutas de entrega"
            >
              <Info className="w-3.5 h-3.5 text-accent" />
              <span>Horarios</span>
            </button>
          </div>
        </div>
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
