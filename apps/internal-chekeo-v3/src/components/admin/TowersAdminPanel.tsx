/**
 * TowersAdminPanel.tsx — PR-V3-12
 *
 * Submódulo de Administración de Torres y Horarios de Entrega.
 * Configura horarios de apertura/cierre de pedidos, ventanas de entrega y días activos de la semana por torre.
 */

import React, { useState } from 'react';
import {
  Building2,
  Clock,
  Calendar,
  CheckCircle2,
  AlertCircle,
  PauseCircle,
  PlayCircle,
  Save,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import type { TowerSchedule } from '@config/index';
import { Button } from '@ui/button';
import { Badge } from '@ui/badge';
import { Card } from '@ui/card';
import { useAdminTowers } from '../../features/admin/hooks/use-admin';
import type { UpdateTowerSchedulePayload } from '../../features/admin/types/admin.types';

const DAYS_OF_WEEK = [
  { id: 0, label: 'Dom', full: 'Domingo' },
  { id: 1, label: 'Lun', full: 'Lunes' },
  { id: 2, label: 'Mar', full: 'Martes' },
  { id: 3, label: 'Mié', full: 'Miércoles' },
  { id: 4, label: 'Jue', full: 'Jueves' },
  { id: 5, label: 'Vie', full: 'Viernes' },
  { id: 6, label: 'Sáb', full: 'Sábado' },
];

export function TowersAdminPanel() {
  const { towers, isLoading, isError, error, refetchTowers, updateTowerMutation } = useAdminTowers();

  // Local editing states per tower
  const [editingForms, setEditingForms] = useState<Record<string, TowerSchedule>>({});
  const [savedNotice, setSavedNotice] = useState<string | null>(null);

  // Initialize or get form for a tower
  const getFormData = (tower: TowerSchedule): TowerSchedule => {
    return editingForms[tower.id] || editingForms[tower.towerKey] || tower;
  };

  const handleFieldChange = (
    towerId: string,
    field: keyof TowerSchedule,
    value: any
  ) => {
    const originalTower = towers.find((t) => t.id === towerId || t.towerKey === towerId);
    if (!originalTower) return;

    const current = getFormData(originalTower);
    setEditingForms((prev) => ({
      ...prev,
      [towerId]: {
        ...current,
        [field]: value,
      },
    }));
  };

  const handleToggleDay = (towerId: string, dayId: number) => {
    const originalTower = towers.find((t) => t.id === towerId || t.towerKey === towerId);
    if (!originalTower) return;

    const current = getFormData(originalTower);
    const activeDays = current.activeDays || [];
    const nextDays = activeDays.includes(dayId)
      ? activeDays.filter((d) => d !== dayId)
      : [...activeDays, dayId].sort();

    handleFieldChange(towerId, 'activeDays', nextDays);
  };

  const handleToggleActive = async (tower: TowerSchedule) => {
    const current = getFormData(tower);
    const nextActive = !current.isActive;
    handleFieldChange(tower.id, 'isActive', nextActive);

    try {
      await updateTowerMutation.mutateAsync({
        id: tower.id,
        payload: { isActive: nextActive },
      });
      setSavedNotice(`Torre ${tower.towerName} ${nextActive ? 'activada ✓' : 'pausada ⏸️'}`);
      setTimeout(() => setSavedNotice(null), 3000);
    } catch {
      // Handled
    }
  };

  const handleSaveTower = async (tower: TowerSchedule) => {
    const form = getFormData(tower);
    const payload: UpdateTowerSchedulePayload = {
      towerName: form.towerName,
      emoji: form.emoji,
      activeDays: form.activeDays,
      orderStartTime: form.orderStartTime,
      orderEndTime: form.orderEndTime,
      deliveryStartTime: form.deliveryStartTime,
      deliveryEndTime: form.deliveryEndTime,
      deliveryLabel: form.deliveryLabel,
      isActive: form.isActive,
    };

    try {
      await updateTowerMutation.mutateAsync({ id: tower.id, payload });
      setSavedNotice(`Horarios de ${form.towerName} guardados con éxito.`);
      setTimeout(() => setSavedNotice(null), 3000);
    } catch {
      // Handled
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Notice */}
      {savedNotice && (
        <div className="p-3 rounded-2xl bg-accent-soft border border-accent/20 text-accent text-xs font-bold flex items-center justify-between animate-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>{savedNotice}</span>
          </div>
          <button onClick={() => setSavedNotice(null)} className="opacity-70 hover:opacity-100">
            ×
          </button>
        </div>
      )}

      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-surface-card p-5 rounded-3xl border border-line shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-accent-soft text-accent flex items-center justify-center font-bold shrink-0">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-text-primary">
              Gobernanza de Torres & Horarios
            </h3>
            <p className="text-xs text-text-secondary">
              Controla las horas límite de pedido, ventanas de entrega y días operativos para cada edificio.
            </p>
          </div>
        </div>

        <Button
          type="button"
          variant="outline"
          onClick={() => refetchTowers()}
          className="text-xs font-bold h-9 px-3 self-start sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5 mr-1" />
          Actualizar Horarios
        </Button>
      </div>

      {/* Grid de Torres */}
      {isLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[1, 2].map((i) => (
            <div key={i} className="h-80 rounded-3xl bg-surface-card border border-line animate-pulse p-6" />
          ))}
        </div>
      ) : towers.length === 0 ? (
        <div className="p-12 rounded-3xl bg-surface-card border border-line text-center space-y-3">
          <Building2 className="w-10 h-10 text-text-muted mx-auto" />
          <h4 className="text-sm font-bold text-text-primary">No hay torres registradas</h4>
          <p className="text-xs text-text-secondary">Las torres se cargan automáticamente desde la base de datos D1.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {towers.map((tower) => {
            const form = getFormData(tower);
            const isPending = updateTowerMutation.isPending;

            return (
              <div
                key={tower.id}
                className={`bg-surface-card rounded-3xl border p-6 shadow-card space-y-6 transition-all ${
                  form.isActive ? 'border-line' : 'border-line opacity-85 bg-surface-raised/30'
                }`}
              >
                {/* Header Torre */}
                <div className="flex items-center justify-between gap-3 pb-4 border-b border-line">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{form.emoji || '🏢'}</span>
                    <div>
                      <h4 className="text-base font-bold text-text-primary flex items-center gap-2">
                        {form.towerName}
                        <Badge variant="outline" className="text-[10px] font-mono uppercase">
                          {tower.towerKey}
                        </Badge>
                      </h4>
                      <p className="text-xs text-text-secondary">
                        {form.isActive ? (
                          <span className="text-accent font-semibold flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                            Operativa para pedidos
                          </span>
                        ) : (
                          <span className="text-amber-500 font-semibold flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-amber-500" />
                            Pausada temporalmente
                          </span>
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Toggle Activa / Pausada */}
                  <Button
                    type="button"
                    variant={form.isActive ? 'secondary' : 'outline'}
                    onClick={() => handleToggleActive(tower)}
                    disabled={isPending}
                    className={`text-xs font-bold h-8 px-3 rounded-xl ${
                      form.isActive ? 'text-accent' : 'text-amber-500 border-amber-500/30'
                    }`}
                  >
                    {form.isActive ? (
                      <>
                        <PauseCircle className="w-3.5 h-3.5 mr-1" />
                        Pausar Torre
                      </>
                    ) : (
                      <>
                        <PlayCircle className="w-3.5 h-3.5 mr-1" />
                        Activar Torre
                      </>
                    )}
                  </Button>
                </div>

                {/* Formulario de Horarios */}
                <div className="space-y-4">
                  {/* Ventana de Pedidos (Recepción) */}
                  <div className="p-4 rounded-2xl bg-surface-raised border border-line space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-text-primary flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-accent" />
                        Ventana de Recepción de Pedidos
                      </span>
                      <span className="text-[10px] text-text-muted">Horario CDMX</span>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-text-secondary mb-1">
                          Hora de Apertura
                        </label>
                        <input
                          type="time"
                          value={form.orderStartTime}
                          onChange={(e) => handleFieldChange(tower.id, 'orderStartTime', e.target.value)}
                          className="w-full px-3 py-1.5 text-xs rounded-xl bg-surface-card border border-line text-text-primary outline-none focus:border-accent font-mono font-bold"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-text-secondary mb-1">
                          Hora Límite (Corte)
                        </label>
                        <input
                          type="time"
                          value={form.orderEndTime}
                          onChange={(e) => handleFieldChange(tower.id, 'orderEndTime', e.target.value)}
                          className="w-full px-3 py-1.5 text-xs rounded-xl bg-surface-card border border-line text-text-primary outline-none focus:border-accent font-mono font-bold"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Ventana de Entrega */}
                  <div className="p-4 rounded-2xl bg-surface-raised border border-line space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-text-primary flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-accent" />
                        Ventana de Entrega en Edificio
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-text-secondary mb-1">
                          Inicio de Entrega
                        </label>
                        <input
                          type="time"
                          value={form.deliveryStartTime}
                          onChange={(e) => handleFieldChange(tower.id, 'deliveryStartTime', e.target.value)}
                          className="w-full px-3 py-1.5 text-xs rounded-xl bg-surface-card border border-line text-text-primary outline-none focus:border-accent font-mono font-bold"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-text-secondary mb-1">
                          Fin de Entrega
                        </label>
                        <input
                          type="time"
                          value={form.deliveryEndTime}
                          onChange={(e) => handleFieldChange(tower.id, 'deliveryEndTime', e.target.value)}
                          className="w-full px-3 py-1.5 text-xs rounded-xl bg-surface-card border border-line text-text-primary outline-none focus:border-accent font-mono font-bold"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-text-secondary mb-1">
                        Etiqueta Pública de Entrega
                      </label>
                      <input
                        type="text"
                        placeholder="Ej. 1:30 PM a 2:00 PM"
                        value={form.deliveryLabel || ''}
                        onChange={(e) => handleFieldChange(tower.id, 'deliveryLabel', e.target.value)}
                        className="w-full px-3 py-1.5 text-xs rounded-xl bg-surface-card border border-line text-text-primary outline-none focus:border-accent"
                      />
                    </div>
                  </div>

                  {/* Días Activos de la Semana */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-text-primary flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-accent" />
                      Días Operativos Activos
                    </label>

                    <div className="flex flex-wrap gap-1.5">
                      {DAYS_OF_WEEK.map((day) => {
                        const isDayActive = (form.activeDays || []).includes(day.id);
                        return (
                          <button
                            key={day.id}
                            type="button"
                            onClick={() => handleToggleDay(tower.id, day.id)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                              isDayActive
                                ? 'bg-accent text-white shadow-xs'
                                : 'bg-surface-raised text-text-muted hover:text-text-primary border border-line'
                            }`}
                          >
                            {day.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Botón Guardar Cambios */}
                <div className="pt-3 border-t border-line flex items-center justify-end">
                  <Button
                    type="button"
                    onClick={() => handleSaveTower(tower)}
                    disabled={isPending}
                    className="text-xs font-bold bg-accent text-white w-full sm:w-auto px-5"
                  >
                    <Save className="w-3.5 h-3.5 mr-1.5" />
                    Guardar Horarios de {form.towerName}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
