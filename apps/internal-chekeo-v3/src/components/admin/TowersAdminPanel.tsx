/**
 * TowersAdminPanel.tsx — Chekeo V3
 *
 * Submódulo de Administración de Torres y Gobernanza de Horarios.
 * Integrado con Dynamic UI Components (@ui/kpi-card, @ui/badge, @ui/card, @ui/button),
 * Radar en vivo de apertura según hora oficial de Ciudad de México (America/Mexico_City),
 * presets rápidos de días operativos y validación inteligente de ventanas horarias.
 */

import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  Zap,
  Timer,
  Info,
} from 'lucide-react';
import type { TowerSchedule } from '@config/index';
import { Button } from '@ui/button';
import { Badge } from '@ui/badge';
import { KpiCard } from '@ui/kpi-card';
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

// Presets rápidos de días
const DAY_PRESETS = [
  { id: 'weekdays', label: '🏢 Lun a Vie', days: [1, 2, 3, 4, 5] },
  { id: 'all-week', label: '🌐 Toda la Semana', days: [0, 1, 2, 3, 4, 5, 6] },
  { id: 'weekends', label: '🍻 Fines de Semana', days: [5, 6, 0] },
];

export interface TowersAdminPanelProps {
  activeToolId?: string;
  onSelectTool?: (toolId: string) => void;
}

export function TowersAdminPanel({ activeToolId, onSelectTool }: TowersAdminPanelProps = {}) {
  const { towers, isLoading, refetchTowers, updateTowerMutation } = useAdminTowers();

  const [editingForms, setEditingForms] = useState<Record<string, TowerSchedule>>({});
  const [savedNotice, setSavedNotice] = useState<string | null>(null);
  const [cdmxTime, setCdmxTime] = useState<{ hours: number; minutes: number; day: number; formatted: string }>({
    hours: 12,
    minutes: 0,
    day: 1,
    formatted: '--:--',
  });

  // Reloj oficial CDMX en vivo
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const cdmxDateStr = now.toLocaleString('en-US', { timeZone: 'America/Mexico_City' });
      const cdmxDate = new Date(cdmxDateStr);
      const hours = cdmxDate.getHours();
      const minutes = cdmxDate.getMinutes();
      const day = cdmxDate.getDay();
      const formatted = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
      setCdmxTime({ hours, minutes, day, formatted });
    };

    updateTime();
    const interval = setInterval(updateTime, 15000);
    return () => clearInterval(interval);
  }, []);

  const getFormData = (tower: TowerSchedule): TowerSchedule => {
    return editingForms[tower.id] || editingForms[tower.towerKey] || tower;
  };

  const handleFieldChange = (towerId: string, field: keyof TowerSchedule, value: unknown) => {
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

  const handleApplyPreset = (towerId: string, days: number[]) => {
    handleFieldChange(towerId, 'activeDays', days);
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

  // Cálculo de radar en vivo por torre
  const towerStatusMap = useMemo(() => {
    const map: Record<string, { status: 'open' | 'closed' | 'paused'; message: string; badgeVariant: 'accent' | 'warning' | 'destructive' }> = {};

    towers.forEach((tower) => {
      const form = getFormData(tower);
      if (!form.isActive) {
        map[tower.id] = {
          status: 'paused',
          message: 'Pausada manualmente por administración',
          badgeVariant: 'warning',
        };
        return;
      }

      const isDayActive = (form.activeDays || []).includes(cdmxTime.day);
      if (!isDayActive) {
        map[tower.id] = {
          status: 'closed',
          message: 'Cerrada hoy por calendario operativo',
          badgeVariant: 'warning',
        };
        return;
      }

      // Comparar horas
      const currentMins = cdmxTime.hours * 60 + cdmxTime.minutes;
      const [startH, startM] = (form.orderStartTime || '11:00').split(':').map(Number);
      const [endH, endM] = (form.orderEndTime || '14:00').split(':').map(Number);
      const startMins = startH * 60 + startM;
      const endMins = endH * 60 + endM;

      if (currentMins >= startMins && currentMins < endMins) {
        const remainingMins = endMins - currentMins;
        const remH = Math.floor(remainingMins / 60);
        const remM = remainingMins % 60;
        const timeLeftStr = remH > 0 ? `${remH}h ${remM}m` : `${remM} min`;

        map[tower.id] = {
          status: 'open',
          message: `Abierta · Corte a las ${form.orderEndTime} (Quedan ${timeLeftStr})`,
          badgeVariant: 'accent',
        };
      } else if (currentMins < startMins) {
        map[tower.id] = {
          status: 'closed',
          message: `Abre hoy a las ${form.orderStartTime}`,
          badgeVariant: 'warning',
        };
      } else {
        map[tower.id] = {
          status: 'closed',
          message: `Corte superado (Cerró a las ${form.orderEndTime})`,
          badgeVariant: 'warning',
        };
      }
    });

    return map;
  }, [towers, editingForms, cdmxTime]);

  // Métricas globales para KpiCards
  const kpis = useMemo(() => {
    const total = towers.length;
    const active = towers.filter((t) => getFormData(t).isActive).length;
    const openNow = Object.values(towerStatusMap).filter((s) => s.status === 'open').length;
    const paused = total - active;
    return { total, active, openNow, paused };
  }, [towers, towerStatusMap, editingForms]);

  return (
    <div className="space-y-5 animate-in fade-in duration-300">
      {/* Toast Flotante */}
      <AnimatePresence>
        {savedNotice && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-3.5 rounded-2xl bg-accent-soft border border-accent/20 text-accent text-xs font-black flex items-center justify-between shadow-sm"
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-accent" />
              <span>{savedNotice}</span>
            </div>
            <button
              type="button"
              onClick={() => setSavedNotice(null)}
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
          title="Total Edificios"
          value={kpis.total}
          subtitle="Rutas configuradas"
          icon={<Building2 className="w-4 h-4" />}
          variant="default"
        />
        <KpiCard
          title="Tomando Pedidos"
          value={kpis.openNow}
          subtitle={`Hora CDMX: ${cdmxTime.formatted}`}
          icon={<Clock className="w-4 h-4" />}
          variant="accent"
        />
        <KpiCard
          title="Torres Habilitadas"
          value={kpis.active}
          subtitle="En servicio"
          icon={<CheckCircle2 className="w-4 h-4" />}
          variant="info"
        />
        <KpiCard
          title="Torres Pausadas"
          value={kpis.paused}
          subtitle="Desactivadas temporalmente"
          icon={<PauseCircle className="w-4 h-4" />}
          variant="warning"
        />
      </div>

      {/* 2. Banner de Radar CDMX en Vivo */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-surface-card p-4 rounded-3xl border border-line shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-accent/15 text-accent flex items-center justify-center font-bold shrink-0">
            <Timer className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-black text-text-primary">
                Radar de Horarios CDMX
              </h3>
              <Badge variant="default" className="text-[10px] font-mono bg-accent text-white">
                {cdmxTime.formatted} CDMX
              </Badge>
            </div>
            <p className="text-xs text-text-secondary">
              Los comensales solo pueden ordenar dentro de la ventana de apertura y antes de la hora de corte.
            </p>
          </div>
        </div>

        <Button
          type="button"
          variant="outline"
          onClick={() => refetchTowers()}
          className="text-xs font-bold h-9 px-3 rounded-xl self-start sm:self-auto cursor-pointer active:scale-95"
        >
          <RefreshCw className="w-3.5 h-3.5 mr-1" />
          Actualizar Horarios
        </Button>
      </div>

      {/* 3. Grid de Torres */}
      {isLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
          {towers.map((tower) => {
            const form = getFormData(tower);
            const isPending = updateTowerMutation.isPending;
            const statusInfo = towerStatusMap[tower.id] || { status: 'closed', message: '', badgeVariant: 'warning' };

            // Validación de horas cruzadas
            const hasOrderTimeError = form.orderStartTime && form.orderEndTime && form.orderStartTime >= form.orderEndTime;
            const hasDeliveryTimeError = form.deliveryStartTime && form.deliveryEndTime && form.deliveryStartTime >= form.deliveryEndTime;

            return (
              <motion.div
                key={tower.id}
                layout
                className={`bg-surface-card rounded-3xl border p-5 sm:p-6 shadow-card space-y-5 transition-all ${
                  form.isActive ? 'border-line hover:border-accent/40' : 'border-line opacity-85 bg-surface-raised/30'
                }`}
              >
                {/* Header Torre */}
                <div className="flex items-start justify-between gap-3 pb-4 border-b border-line">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-surface-raised border border-line flex items-center justify-center text-2xl shadow-xs">
                      {form.emoji || '🏢'}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-base font-black text-text-primary">
                          {form.towerName}
                        </h4>
                        <Badge variant="outline" className="text-[10px] font-mono uppercase">
                          {tower.towerKey}
                        </Badge>
                      </div>

                      {/* Radar Live Status */}
                      <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                        {statusInfo.status === 'open' ? (
                          <span className="inline-flex items-center gap-1.5 text-xs font-black text-accent">
                            <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                            {statusInfo.message}
                          </span>
                        ) : statusInfo.status === 'paused' ? (
                          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-500">
                            <span className="w-2 h-2 rounded-full bg-amber-500" />
                            Pausada manualmente
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-text-muted">
                            <span className="w-2 h-2 rounded-full bg-text-muted" />
                            {statusInfo.message}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Toggle Activa / Pausada */}
                  <Button
                    type="button"
                    variant={form.isActive ? 'secondary' : 'outline'}
                    onClick={() => handleToggleActive(tower)}
                    disabled={isPending}
                    className={`text-xs font-bold h-8.5 px-3 rounded-xl cursor-pointer active:scale-95 ${
                      form.isActive ? 'text-accent' : 'text-amber-500 border-amber-500/30'
                    }`}
                  >
                    {form.isActive ? (
                      <>
                        <PauseCircle className="w-3.5 h-3.5 mr-1" />
                        Pausar
                      </>
                    ) : (
                      <>
                        <PlayCircle className="w-3.5 h-3.5 mr-1" />
                        Activar
                      </>
                    )}
                  </Button>
                </div>

                {/* Formulario de Horarios */}
                <div className="space-y-4">
                  {/* Ventana de Pedidos (Recepción) */}
                  <div className="p-4 rounded-2xl bg-surface-raised border border-line space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-text-primary flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-accent" />
                        Ventana de Recepción de Pedidos
                      </span>
                      <span className="text-[10px] text-text-muted font-mono">CDMX</span>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-text-secondary mb-1">
                          Apertura (Inicia)
                        </label>
                        <input
                          type="time"
                          value={form.orderStartTime}
                          onChange={(e) => handleFieldChange(tower.id, 'orderStartTime', e.target.value)}
                          className="w-full px-3 py-1.5 text-xs rounded-xl bg-surface-card border border-line text-text-primary outline-none focus:border-accent font-mono font-bold"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-text-secondary mb-1">
                          Corte (Finaliza)
                        </label>
                        <input
                          type="time"
                          value={form.orderEndTime}
                          onChange={(e) => handleFieldChange(tower.id, 'orderEndTime', e.target.value)}
                          className="w-full px-3 py-1.5 text-xs rounded-xl bg-surface-card border border-line text-text-primary outline-none focus:border-accent font-mono font-bold"
                        />
                      </div>
                    </div>

                    {hasOrderTimeError && (
                      <div className="p-2 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-[11px] font-bold flex items-center gap-1.5">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        <span>La hora de corte debe ser posterior a la de apertura.</span>
                      </div>
                    )}
                  </div>

                  {/* Ventana de Entrega */}
                  <div className="p-4 rounded-2xl bg-surface-raised border border-line space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-text-primary flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-accent" />
                        Ventana de Entrega en Edificio
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-text-secondary mb-1">
                          Inicio de Reparto
                        </label>
                        <input
                          type="time"
                          value={form.deliveryStartTime}
                          onChange={(e) => handleFieldChange(tower.id, 'deliveryStartTime', e.target.value)}
                          className="w-full px-3 py-1.5 text-xs rounded-xl bg-surface-card border border-line text-text-primary outline-none focus:border-accent font-mono font-bold"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-text-secondary mb-1">
                          Fin de Reparto
                        </label>
                        <input
                          type="time"
                          value={form.deliveryEndTime}
                          onChange={(e) => handleFieldChange(tower.id, 'deliveryEndTime', e.target.value)}
                          className="w-full px-3 py-1.5 text-xs rounded-xl bg-surface-card border border-line text-text-primary outline-none focus:border-accent font-mono font-bold"
                        />
                      </div>
                    </div>

                    {hasDeliveryTimeError && (
                      <div className="p-2 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-[11px] font-bold flex items-center gap-1.5">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        <span>El fin de entrega debe ser posterior al inicio.</span>
                      </div>
                    )}

                    <div>
                      <label className="block text-[11px] font-bold text-text-secondary mb-1">
                        Etiqueta Pública para el Cliente
                      </label>
                      <input
                        type="text"
                        placeholder="Ej. 1:30 PM a 2:00 PM"
                        value={form.deliveryLabel || ''}
                        onChange={(e) => handleFieldChange(tower.id, 'deliveryLabel', e.target.value)}
                        className="w-full px-3 py-1.5 text-xs rounded-xl bg-surface-card border border-line text-text-primary outline-none focus:border-accent font-medium"
                      />
                    </div>
                  </div>

                  {/* Días Activos & Presets */}
                  <div className="p-4 rounded-2xl bg-surface-raised border border-line space-y-3">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <label className="text-xs font-black text-text-primary flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-accent" />
                        Días Operativos Activos
                      </label>

                      {/* Presets 1-Toque */}
                      <div className="flex items-center gap-1">
                        {DAY_PRESETS.map((preset) => (
                          <button
                            key={preset.id}
                            type="button"
                            onClick={() => handleApplyPreset(tower.id, preset.days)}
                            className="px-2 py-0.5 rounded-lg bg-surface-card hover:bg-surface border border-line text-[10px] font-bold text-text-secondary hover:text-text-primary cursor-pointer active:scale-95"
                          >
                            {preset.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {DAYS_OF_WEEK.map((day) => {
                        const isDayActive = (form.activeDays || []).includes(day.id);
                        return (
                          <button
                            key={day.id}
                            type="button"
                            onClick={() => handleToggleDay(tower.id, day.id)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer select-none active:scale-95 ${
                              isDayActive
                                ? 'bg-accent text-white shadow-xs'
                                : 'bg-surface-card text-text-muted hover:text-text-primary border border-line'
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
                    disabled={isPending || Boolean(hasOrderTimeError || hasDeliveryTimeError)}
                    className="text-xs font-black bg-accent text-white w-full sm:w-auto px-5 rounded-xl cursor-pointer active:scale-95"
                  >
                    <Save className="w-3.5 h-3.5 mr-1.5" />
                    Guardar Horarios de {form.towerName}
                  </Button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
