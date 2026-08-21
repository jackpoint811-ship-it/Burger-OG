/**
 * KitchenDisplay.tsx — PR-V3-10 / Refinamiento Operativo V3
 *
 * Pantalla KDS principal de Cocina con vista Kanban de alto contraste:
 * - 3 Columnas operativas: Nuevos / En Plancha / Listos para Empacar
 * - Soporte de carril operativo (Preparación / Plancha vs SideQuest / Freidora & Empaque)
 * - Botones de acción rápida de 1-clic con avance de estado
 * - Soporte de pantalla completa y alerta sonora
 * - Cero relojes de presión
 */

import React, { useState } from 'react';
import {
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  RefreshCw,
  Inbox,
  Flame,
  CheckCircle,
  LayoutGrid,
  Focus,
} from 'lucide-react';
import { Button } from '@ui/button';
import { Skeleton } from '@ui/skeleton';
import { KitchenTicketCard } from './KitchenTicketCard';
import { KitchenActiveStation } from './KitchenActiveStation';
import {
  useKitchenDisplay,
  type KitchenTicket,
} from '../../features/kitchen';
import { extractOrderTargetDate } from '../shared/HorizontalDateCalendarFilter';

export interface KitchenDisplayProps {
  laneMode?: 'prep' | 'sideQuest';
  selectedDate?: string;
}

export function KitchenDisplay({
  laneMode = 'prep',
  selectedDate = 'today',
}: KitchenDisplayProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [viewMode, setViewMode] = useState<'station' | 'kanban'>('station');

  const {
    tickets,
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

  // Filtrar comandas por fecha seleccionada y por carril operativo
  const filteredTickets = tickets.filter((ticket) => {
    // 1. Filtro de fecha
    if (selectedDate !== 'all') {
      const today = new Date();
      const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      const targetDate = ticket.scheduledDate || todayStr;

      if (selectedDate === 'today' && targetDate !== todayStr) {
        return false;
      }
      if (selectedDate === 'past' && targetDate >= todayStr) {
        return false;
      }
      if (selectedDate !== 'today' && selectedDate !== 'past' && targetDate !== selectedDate) {
        return false;
      }
    }

    // 2. Filtro de carril operativo
    if (laneMode === 'prep') {
      return ticket.totalBurgersCount > 0;
    }
    if (laneMode === 'sideQuest') {
      return ticket.totalGarnishesCount > 0 || ticket.totalDrinksCount > 0 || ticket.totalExtrasCount > 0;
    }

    return true;
  });

  const newTickets = filteredTickets.filter((t) => t.status === 'new');
  const preparingTickets = filteredTickets.filter((t) => t.status === 'preparing');
  const readyTickets = filteredTickets.filter((t) => t.status === 'ready');

  const laneTitle =
    laneMode === 'prep'
      ? '🥩 Plancha & Parrilla (Burgers)'
      : '🍟 Freidora & Empaque (Side Quest)';

  return (
    <div className="space-y-5 animate-in fade-in duration-300">
      {/* ─── Barra Superior de Control KDS ────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 bg-surface-card p-4 rounded-3xl border border-line shadow-xs">
        {/* Título de Estación Activa */}
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-accent-soft text-accent flex items-center justify-center font-bold">
            {laneMode === 'prep' ? '🍔' : '🍟'}
          </div>
          <div>
            <h3 className="text-sm font-black text-text-primary uppercase tracking-wide">
              {laneTitle}
            </h3>
            <p className="text-xs text-text-secondary">
              {filteredTickets.length} comanda{filteredTickets.length !== 1 ? 's' : ''} en cola
            </p>
          </div>
        </div>

        {/* Controles de Vista, Sonido, Pantalla Completa y Refresco */}
        <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
          {/* Toggle de Modo de Vista (Estación Foco vs Kanban) */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setViewMode((prev) => (prev === 'station' ? 'kanban' : 'station'))}
            className="flex items-center gap-1.5 text-xs font-extrabold rounded-2xl h-10 px-3.5 border-line cursor-pointer"
            title={viewMode === 'station' ? 'Cambiar a Tablero KDS (3 columnas)' : 'Cambiar a Estación en Foco'}
          >
            {viewMode === 'station' ? (
              <>
                <LayoutGrid className="w-4 h-4 text-accent" />
                <span className="hidden sm:inline">Tablero KDS</span>
              </>
            ) : (
              <>
                <Focus className="w-4 h-4 text-accent" />
                <span className="hidden sm:inline">Estación Foco</span>
              </>
            )}
          </Button>

          {/* Toggle de Alerta Sonora */}
          <Button
            variant="secondary"
            size="sm"
            onClick={toggleSound}
            className="flex items-center gap-1.5 text-xs font-extrabold rounded-2xl h-10 px-3.5 cursor-pointer"
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
            className="flex items-center gap-1.5 text-xs font-extrabold rounded-2xl h-10 px-3.5 border-line cursor-pointer"
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
            className="h-10 w-10 p-0 rounded-2xl border-line cursor-pointer"
            title="Refrescar comandas"
          >
            <RefreshCw
              className={`w-4 h-4 text-text-primary ${isRefetching ? 'animate-spin text-accent' : ''}`}
            />
          </Button>
        </div>
      </div>

      {/* ─── Renderizado según Modo de Vista (Estación en Foco vs Kanban) ──────── */}
      {viewMode === 'station' ? (
        <KitchenActiveStation
          laneMode={laneMode}
          tickets={filteredTickets}
          isLoading={isLoading}
          advanceTicketStatus={advanceTicketStatus}
          revertTicketStatus={revertTicketStatus}
          isUpdating={isUpdating}
        />
      ) : (
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
              {newTickets.length}
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
            ) : newTickets.length > 0 ? (
              newTickets.map((ticket) => (
                <KitchenTicketCard
                  key={ticket.id}
                  ticket={ticket}
                  laneMode={laneMode}
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
              <span className="w-3 h-3 rounded-full bg-amber-500"></span>
              <h3 className="font-black text-sm uppercase tracking-wider text-amber-700 dark:text-amber-300">
                2. En Plancha / Preparación
              </h3>
            </div>
            <span className="px-2.5 py-0.5 rounded-xl bg-amber-600 text-white font-black text-xs">
              {preparingTickets.length}
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
            ) : preparingTickets.length > 0 ? (
              preparingTickets.map((ticket) => (
                <KitchenTicketCard
                  key={ticket.id}
                  ticket={ticket}
                  laneMode={laneMode}
                  onAdvance={advanceTicketStatus}
                  onRevert={revertTicketStatus}
                  isUpdating={isUpdating}
                />
              ))
            ) : (
              <div className="p-8 rounded-3xl bg-surface-card/60 border-2 border-dashed border-line text-center flex flex-col items-center justify-center gap-2 text-text-muted">
                <Flame className="w-8 h-8 stroke-1" />
                <p className="text-sm font-bold">Estación libre por ahora</p>
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
              {readyTickets.length}
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
            ) : readyTickets.length > 0 ? (
              readyTickets.map((ticket) => (
                <KitchenTicketCard
                  key={ticket.id}
                  ticket={ticket}
                  laneMode={laneMode}
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
      )}
    </div>
  );
}
