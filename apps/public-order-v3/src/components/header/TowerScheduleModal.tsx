import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Building2, Clock, Calendar, Check, Info } from 'lucide-react';
import { useTowerSchedulesQuery, getMexicoCityDateTime } from '../../features';
import { useCheckoutStore } from '../../stores';
import type { TowerSchedulePublic } from '@config/contracts';

export interface TowerScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTower?: (towerKey: string) => void;
}

const DAY_NAMES = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

function formatActiveDays(activeDays: number[]): string {
  if (!activeDays || activeDays.length === 0) return 'Sin días asignados';
  if (activeDays.length === 7) return 'Todos los días';
  const sorted = [...activeDays].sort((a, b) => a - b);
  const names = sorted.map((d) => DAY_NAMES[d] ?? '');
  if (names.length === 1) return names[0] ?? '';
  if (names.length === 2) return `${names[0]} y ${names[1]}`;
  return `${names.slice(0, -1).join(', ')} y ${names[names.length - 1]}`;
}

export function TowerScheduleModal({ isOpen, onClose, onSelectTower }: TowerScheduleModalProps) {
  const { data: towers = [], isLoading } = useTowerSchedulesQuery();
  const selectedLocationKey = useCheckoutStore((s) => s.form.locationKey);
  const updateField = useCheckoutStore((s) => s.updateField);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const mxNow = getMexicoCityDateTime();

  const handleSelect = (tower: TowerSchedulePublic) => {
    updateField('locationKey', tower.towerKey);
    onSelectTower?.(tower.towerKey);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Modal Card */}
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="tower-schedule-title"
            className="relative z-50 w-full max-w-md rounded-3xl bg-surface-card border border-line p-6 shadow-floating max-h-[90vh] overflow-y-auto flex flex-col gap-4"
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 16 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-3 border-b border-line pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-accent/10 text-accent flex items-center justify-center font-bold">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 id="tower-schedule-title" className="text-lg font-bold text-text-primary">
                    Horarios y Torres
                  </h3>
                  <p className="text-xs text-text-secondary">
                    Rutas de entrega programada a corporativos
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-full p-2 text-text-secondary hover:bg-surface hover:text-text-primary transition-colors cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
                aria-label="Cerrar modal de horarios"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content List */}
            <div className="space-y-3">
              <p className="text-xs text-text-secondary">
                Entregamos pedidos recién hechos y calientes directo a tu edificio:
              </p>

              {isLoading ? (
                <div className="space-y-2 py-4">
                  <div className="h-16 rounded-2xl bg-surface animate-pulse" />
                  <div className="h-16 rounded-2xl bg-surface animate-pulse" />
                </div>
              ) : towers.length === 0 ? (
                <div className="text-center py-6 text-sm text-text-muted">
                  No hay horarios de torres configurados por el momento.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {towers.map((tower) => {
                    const isSelected = selectedLocationKey.toLowerCase() === tower.towerKey.toLowerCase();
                    const isConfigActive = tower.isActive !== false;
                    const isTodayActive = Array.isArray(tower.activeDays) && tower.activeDays.includes(mxNow.dayOfWeek);

                    const [endH, endM] = (tower.orderEndTime || '13:30').split(':').map((v) => parseInt(v, 10));
                    const isPastCutoff = mxNow.hours > endH || (mxNow.hours === endH && mxNow.minutes >= endM);
                    const isOpenToday = isConfigActive && isTodayActive && !isPastCutoff;

                    return (
                      <div
                        key={tower.towerKey}
                        className={`p-4 rounded-2xl border transition-all ${
                          isSelected
                            ? 'border-accent bg-accent/5 ring-2 ring-accent/20'
                            : 'border-line bg-surface-card hover:border-text-muted/30'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3">
                            <span className="text-2xl pt-0.5" aria-hidden="true">
                              {tower.emoji || '🏢'}
                            </span>
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="font-bold text-sm text-text-primary">
                                  {tower.towerName}
                                </h4>
                                {isSelected && (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-accent text-white text-[10px] font-bold">
                                    <Check className="w-3 h-3" /> Seleccionada
                                  </span>
                                )}
                              </div>
                              <div className="mt-1 flex items-center gap-1.5 text-xs text-text-secondary">
                                <Calendar className="w-3.5 h-3.5 text-text-muted shrink-0" />
                                <span>{formatActiveDays(tower.activeDays)}</span>
                              </div>
                              <div className="mt-0.5 flex items-center gap-1.5 text-xs text-text-secondary">
                                <Clock className="w-3.5 h-3.5 text-text-muted shrink-0" />
                                <span>
                                  Pedidos: {tower.orderStartTime} a {tower.orderEndTime} · Entrega: {tower.deliveryLabel || `${tower.deliveryStartTime} - ${tower.deliveryEndTime}`}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="shrink-0 flex flex-col items-end gap-2">
                            {/* Status badge */}
                            <span
                              className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                                !isConfigActive
                                  ? 'bg-red-500/10 text-red-600'
                                  : isOpenToday
                                  ? 'bg-accent/15 text-accent'
                                  : 'bg-amber-500/15 text-amber-700 dark:text-amber-400'
                              }`}
                            >
                              {!isConfigActive
                                ? '🔴 Pausado'
                                : isOpenToday
                                ? '🟢 Disponible Hoy'
                                : '📅 Programar'}
                            </span>

                            <button
                              type="button"
                              onClick={() => handleSelect(tower)}
                              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer min-h-[36px] flex items-center justify-center ${
                                isSelected
                                  ? 'bg-accent text-white hover:bg-accent-dark'
                                  : 'bg-surface text-text-primary hover:bg-surface-raised border border-line'
                              }`}
                            >
                              {isSelected ? 'Confirmar' : 'Elegir Torre'}
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Note banner */}
            <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-surface border border-line text-xs text-text-secondary mt-1">
              <Info className="w-4 h-4 text-accent shrink-0 mt-0.5" />
              <p>
                Puedes realizar pedidos programados en cualquier momento. Los cocinamos el día de entrega para que lleguen frescos.
              </p>
            </div>

            {/* Footer action */}
            <button
              type="button"
              onClick={onClose}
              className="w-full py-3 px-4 rounded-2xl bg-accent text-white font-bold text-sm hover:bg-accent-dark transition-colors cursor-pointer min-h-[44px] flex items-center justify-center"
            >
              Cerrar
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
