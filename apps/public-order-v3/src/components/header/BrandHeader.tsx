import React, { useState } from 'react';
import { MapPin, Clock, ChevronDown, Sparkles } from 'lucide-react';
import { useTowerAvailability, useActiveTowers, useActiveRaffleQuery, useSiteConfig } from '../../features';
import { useCheckoutStore } from '../../stores';
import { TowerScheduleModal } from './TowerScheduleModal';

export function BrandHeader() {
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const locationKey = useCheckoutStore((s) => s.form.locationKey);
  const { towers } = useActiveTowers();
  const { siteConfig } = useSiteConfig();
  const { data: activeRaffle } = useActiveRaffleQuery();

  // If no locationKey is set, default to first available tower or empty
  const activeTowerKey = locationKey || (towers[0]?.towerKey ?? '');
  const { status, tower } = useTowerAvailability(activeTowerKey);

  const brandName = siteConfig?.brandName || 'Burgers.exe';

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

          {/* Sorteo / Promo Tag (if active) */}
          {activeRaffle && (
            <div className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-bold border border-amber-500/20">
              <Sparkles className="w-3.5 h-3.5" />
              <span className="truncate max-w-[160px]">{activeRaffle.title}</span>
            </div>
          )}
        </div>

        {/* Delivery Tower & Time Status Pill */}
        <div className="flex items-center justify-between gap-2 pt-0.5">
          <button
            type="button"
            onClick={() => setIsScheduleOpen(true)}
            className="flex-1 flex items-center justify-between gap-2 px-3.5 py-2 rounded-2xl bg-surface hover:bg-surface-raised border border-line transition-colors text-left cursor-pointer min-h-[44px]"
            aria-label="Seleccionar torre y ver horarios de entrega"
          >
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-xl bg-surface-card border border-line flex items-center justify-center text-accent shrink-0">
                <MapPin className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 text-xs font-bold text-text-primary">
                  <span className="truncate">
                    {tower ? `${tower.emoji || '🏢'} ${tower.towerName}` : 'Seleccionar Torre'}
                  </span>
                  <span
                    className={`w-2 h-2 rounded-full shrink-0 ${
                      status?.isOpen
                        ? 'bg-accent'
                        : status?.isPaused
                        ? 'bg-red-500'
                        : 'bg-amber-500'
                    }`}
                  />
                </div>
                <div className="text-[11px] text-text-secondary truncate">
                  {status?.isOpen ? (
                    <span className="text-accent font-medium">
                      Recibe pedidos hoy (hasta las {status.orderEndTime})
                    </span>
                  ) : status?.isPaused ? (
                    <span className="text-red-500 font-medium">Servicio pausado</span>
                  ) : status?.isBeforeOpen ? (
                    <span>Abre a las {status.orderStartTime}</span>
                  ) : (
                    <span>Pedidos programados activos</span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1 text-text-muted shrink-0 pl-1">
              <Clock className="w-3.5 h-3.5" />
              <ChevronDown className="w-4 h-4" />
            </div>
          </button>
        </div>
      </div>

      <TowerScheduleModal
        isOpen={isScheduleOpen}
        onClose={() => setIsScheduleOpen(false)}
      />
    </header>
  );
}
