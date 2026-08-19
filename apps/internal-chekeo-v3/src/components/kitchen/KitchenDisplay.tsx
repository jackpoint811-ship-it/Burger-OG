/**
 * KitchenDisplay.tsx — PR-V3-10
 *
 * Pantalla KDS principal de Cocina con vista Kanban de alto contraste:
 * - 3 Columnas operativas: Nuevos / En Plancha / Listos para Empacar
 * - Filtros por estación de preparación (Todas, Parrilla/Burgers, Freidora/Guarniciones)
 * - Botones de acción rápida de 1-clic con avance de estado
 * - Semáforo de tiempos y temporizadores activos en tiempo real
 * - Soporte de pantalla completa y alerta sonora
 */

import React, { useState } from 'react';
import {
  Flame,
  Utensils,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  RefreshCw,
  Clock,
  Sparkles,
  Inbox,
  CheckCircle,
  Package,
} from 'lucide-react';
import { Badge } from '@ui/badge';
import { Button } from '@ui/button';
import { Skeleton } from '@ui/skeleton';
import { KitchenTicketCard } from './KitchenTicketCard';
import {
  useKitchenDisplay,
  type KitchenStation,
} from '../../features/kitchen';

export function KitchenDisplay() {
  const [stationFilter, setStationFilter] = useState<KitchenStation>('all');
  const [isFullscreen, setIsFullscreen] = useState(false);

  const {
    tickets,
    newTickets,
    preparingTickets,
    readyTickets,
    isLoading,
    isRefetching,
    refetch,
    soundEnabled,
    toggleSound,
    advanceTicketStatus,
    revertTicketStatus,
    isUpdating,
  } = useKitchenDisplay({ autoRefresh: true, refetchIntervalMs: 10000 });

  // Toggle de pantalla completa
  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch {
      // Ignorar restricciones de fullscreen
    }
  };

  // Filtrar comandas según la estación activa
  const filterByStation = (ticketList: typeof tickets) => {
    if (stationFilter === 'all') return ticketList;
    if (stationFilter === 'grill') {
      return ticketList.filter((t) => t.totalBurgersCount > 0);
    }
    if (stationFilter === 'fryer') {
      return ticketList.filter((t) => t.totalGarnishesCount > 0);
    }
    return ticketList;
  };

  const filteredNew = filterByStation(newTickets);
  const filteredPreparing = filterByStation(preparingTickets);
  const filteredReady = filterByStation(readyTickets);

  return (
    <div className="space-y-5 animate-in fade-in duration-300">
      {/* ─── Barra Superior de Control KDS ────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3.5 bg-surface-card p-4 rounded-3xl border border-line shadow-xs">
        {/* Selector de Estación */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 no-scrollbar">
          <div className="flex items-center gap-1.5 font-black text-xs text-text-primary mr-1 shrink-0">
            <Flame className="w-4 h-4 text-accent" />
            <span className="uppercase tracking-wider">Estación:</span>
          </div>

          {[
            { id: 'all' as KitchenStation, label: 'Todas las Estaciones', count: tickets.length },
            {
              id: 'grill' as KitchenStation,
              label: '🥩 Parrilla / Burgers',
              count: tickets.filter((t) => t.totalBurgersCount > 0).length,
            },
            {
              id: 'fryer' as KitchenStation,
              label: '🍟 Freidora / Guarniciones',
              count: tickets.filter((t) => t.totalGarnishesCount > 0).length,
            },
          ].map((st) => (
            <button
              key={st.id}
              type="button"
              onClick={() => setStationFilter(st.id)}
              className={`px-3 py-2 rounded-2xl text-xs font-black whitespace-nowrap flex items-center gap-2 transition-all cursor-pointer ${
                stationFilter === st.id
                  ? 'bg-text-primary text-surface-card shadow-xs'
                  : 'bg-surface-raised border border-line text-text-secondary hover:text-text-primary'
              }`}
            >
              <span>{st.label}</span>
              <span
                className={`px-2 py-0.5 rounded-full text-[11px] font-black ${
                  stationFilter === st.id
                    ? 'bg-surface-card/20 text-surface-card'
                    : 'bg-surface text-text-muted'
                }`}
              >
                {st.count}
              </span>
            </button>
          ))}
        </div>

        {/* Leyenda de Tiempos y Controles de Pantalla */}
        <div className="flex items-center gap-2 self-end md:self-auto shrink-0">
          {/* Semáforo de Tiempos */}
          <div className="hidden lg:flex items-center gap-2.5 text-[11px] font-black text-text-muted px-3 py-1.5 rounded-2xl bg-surface-raised border border-line">
            <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> &lt;10m
            </span>
            <span className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> 10-20m
            </span>
            <span className="flex items-center gap-1.5 text-red-600 dark:text-red-400">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse"></span> &gt;20m
            </span>
          </div>

          {/* Toggle de Alerta Sonora */}
          <Button
            variant="secondary"
            size="sm"
            onClick={toggleSound}
            className="flex items-center gap-1.5 text-xs font-extrabold rounded-2xl h-10 px-3.5"
            title={soundEnabled ? 'Silenciar alertas sonoras' : 'Activar sonido KDS'}
          >
            {soundEnabled ? (
              <>
                <Volume2 className="w-4 h-4 text-accent" />
                <span className="hidden sm:inline">Audio KDS</span>
              </>
            ) : (
              <>
                <VolumeX className="w-4 h-4 text-text-muted" />
                <span className="hidden sm:inline text-text-muted">Silenciado</span>
              </>
            )}
          </Button>

          {/* Botón de Pantalla Completa */}
          <Button
            variant="outline"
            size="sm"
            onClick={toggleFullscreen}
            className="flex items-center gap-1.5 text-xs font-extrabold rounded-2xl h-10 px-3.5 border-line"
            title={isFullscreen ? 'Salir de pantalla completa' : 'Ver a pantalla completa'}
          >
            {isFullscreen ? (
              <Minimize2 className="w-4 h-4 text-text-primary" />
            ) : (
              <Maximize2 className="w-4 h-4 text-text-primary" />
            )}
          </Button>

          {/* Botón de Refresco Manual */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isRefetching}
            className="h-10 w-10 p-0 rounded-2xl border-line"
            title="Refrescar comandas"
          >
            <RefreshCw
              className={`w-4 h-4 text-text-primary ${isRefetching ? 'animate-spin' : ''}`}
            />
          </Button>
        </div>
      </div>

      {/* ─── Grid de Columnas Kanban (Nuevos / En Plancha / Listos) ───────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">
        {/* ─── Columna 1: Nuevos / Por Atender ──────────────────────────────── */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-blue-500/10 border-2 border-blue-500/30">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-blue-500"></span>
              <h3 className="font-black text-sm uppercase tracking-wider text-blue-700 dark:text-blue-300">
                1. Nuevos / Por Atender
              </h3>
            </div>
            <span className="px-2.5 py-0.5 rounded-xl bg-blue-600 text-white font-black text-xs">
              {filteredNew.length}
            </span>
          </div>

          <div className="space-y-4">
            {isLoading ? (
              Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="p-5 rounded-3xl bg-surface-card border border-line space-y-3">
                  <Skeleton className="h-8 w-1/2 rounded-xl" />
                  <Skeleton className="h-20 w-full rounded-2xl" />
                  <Skeleton className="h-11 w-full rounded-2xl" />
                </div>
              ))
            ) : filteredNew.length > 0 ? (
              filteredNew.map((ticket) => (
                <KitchenTicketCard
                  key={ticket.id}
                  ticket={ticket}
                  onAdvance={advanceTicketStatus}
                  onRevert={revertTicketStatus}
                  isUpdating={isUpdating}
                />
              ))
            ) : (
              <div className="p-8 rounded-3xl bg-surface-card/60 border-2 border-dashed border-line text-center flex flex-col items-center justify-center gap-2 text-text-muted">
                <Inbox className="w-8 h-8 stroke-1" />
                <p className="text-sm font-bold">Sin comandas nuevas</p>
              </div>
            )}
          </div>
        </div>

        {/* ─── Columna 2: En Plancha / Preparación ──────────────────────────── */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-amber-500/10 border-2 border-amber-500/30">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-amber-500 animate-pulse"></span>
              <h3 className="font-black text-sm uppercase tracking-wider text-amber-700 dark:text-amber-300">
                2. En Plancha / Preparación
              </h3>
            </div>
            <span className="px-2.5 py-0.5 rounded-xl bg-amber-600 text-white font-black text-xs">
              {filteredPreparing.length}
            </span>
          </div>

          <div className="space-y-4">
            {isLoading ? (
              Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="p-5 rounded-3xl bg-surface-card border border-line space-y-3">
                  <Skeleton className="h-8 w-1/2 rounded-xl" />
                  <Skeleton className="h-20 w-full rounded-2xl" />
                  <Skeleton className="h-11 w-full rounded-2xl" />
                </div>
              ))
            ) : filteredPreparing.length > 0 ? (
              filteredPreparing.map((ticket) => (
                <KitchenTicketCard
                  key={ticket.id}
                  ticket={ticket}
                  onAdvance={advanceTicketStatus}
                  onRevert={revertTicketStatus}
                  isUpdating={isUpdating}
                />
              ))
            ) : (
              <div className="p-8 rounded-3xl bg-surface-card/60 border-2 border-dashed border-line text-center flex flex-col items-center justify-center gap-2 text-text-muted">
                <Flame className="w-8 h-8 stroke-1" />
                <p className="text-sm font-bold">Plancha libre por ahora</p>
              </div>
            )}
          </div>
        </div>

        {/* ─── Columna 3: Listos para Empacar ──────────────────────────────── */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-emerald-500/10 border-2 border-emerald-500/30">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
              <h3 className="font-black text-sm uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
                3. Listos para Empacar
              </h3>
            </div>
            <span className="px-2.5 py-0.5 rounded-xl bg-emerald-600 text-white font-black text-xs">
              {filteredReady.length}
            </span>
          </div>

          <div className="space-y-4">
            {isLoading ? (
              Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="p-5 rounded-3xl bg-surface-card border border-line space-y-3">
                  <Skeleton className="h-8 w-1/2 rounded-xl" />
                  <Skeleton className="h-20 w-full rounded-2xl" />
                  <Skeleton className="h-11 w-full rounded-2xl" />
                </div>
              ))
            ) : filteredReady.length > 0 ? (
              filteredReady.map((ticket) => (
                <KitchenTicketCard
                  key={ticket.id}
                  ticket={ticket}
                  onAdvance={advanceTicketStatus}
                  onRevert={revertTicketStatus}
                  isUpdating={isUpdating}
                />
              ))
            ) : (
              <div className="p-8 rounded-3xl bg-surface-card/60 border-2 border-dashed border-line text-center flex flex-col items-center justify-center gap-2 text-text-muted">
                <CheckCircle className="w-8 h-8 stroke-1" />
                <p className="text-sm font-bold">Sin pedidos esperando empaque</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
