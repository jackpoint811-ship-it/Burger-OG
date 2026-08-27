/**
 * KitchenActiveStation.tsx — Chekeo V3
 *
 * Vista enfocada de estación de Cocina (Preparación / Side Quest):
 * - Comanda Activa en Foco: Nombre grande, folio, torre, nota del pedido desplegable e ítems desglosados con modificadores.
 * - Botón de acción táctil de alta visibilidad (✔ Hecha / Marcar Listo).
 * - Cola interactiva de comandas en espera.
 * - Acordeón colapsable de comandas listas con función de reversión rápida.
 */

import React, { useState, useMemo } from 'react';
import {
  RotateCcw,
  MapPin,
  ChevronDown,
  ChevronUp,
  Inbox,
  Loader2,
} from 'lucide-react';
import { Badge } from '@ui/badge';
import { Button } from '@ui/button';
import {
  formatKitchenLocation,
  type KitchenTicket,
  useKitchenItemTracking,
} from '../../features/kitchen';
import { KitchenTicketCard } from './KitchenTicketCard';

export interface KitchenActiveStationProps {
  laneMode: 'prep' | 'sideQuest';
  tickets: KitchenTicket[];
  isLoading: boolean;
  advanceTicketStatus: (ticketId: string, currentStatus: KitchenTicket['status']) => Promise<void>;
  revertTicketStatus: (ticketId: string, currentStatus: KitchenTicket['status']) => Promise<void>;
  isUpdating?: boolean;
}

export function KitchenActiveStation({
  laneMode,
  tickets,
  isLoading,
  advanceTicketStatus,
  revertTicketStatus,
  isUpdating = false,
}: KitchenActiveStationProps) {
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [isReadySectionOpen, setIsReadySectionOpen] = useState<boolean>(false);
  const [localBusyId, setLocalBusyId] = useState<string | null>(null);

  const {
    isStationDone,
    markStationDone,
    revertStationDone,
    isUnitDone,
    toggleUnitDone,
  } = useKitchenItemTracking();

  // Filtrar tickets correspondientes a esta estación de forma estricta por productionUnits
  const stationTickets = useMemo(() => {
    return tickets.filter((t) => {
      if (laneMode === 'prep') {
        return (t.productionUnits || []).some((u) => u.station === 'prep');
      }
      if (laneMode === 'sideQuest') {
        return (t.productionUnits || []).some((u) => u.station === 'sideQuest');
      }
      return true;
    });
  }, [tickets, laneMode]);

  // Separar pendientes vs listos para esta estación específica
  const pendingTickets = useMemo(() => {
    return stationTickets.filter((t) => {
      if (t.status === 'ready' || t.status === 'delivered') return false;
      if (isStationDone(t.id, laneMode)) return false;
      return true;
    });
  }, [stationTickets, laneMode, isStationDone]);

  const readyTickets = useMemo(() => {
    return stationTickets.filter((t) => {
      if (t.status === 'ready' || t.status === 'delivered') return true;
      if (isStationDone(t.id, laneMode)) return true;
      return false;
    });
  }, [stationTickets, laneMode, isStationDone]);

  // Ticket activo en foco
  const activeTicket = useMemo(() => {
    if (selectedTicketId) {
      const found = pendingTickets.find((t) => t.id === selectedTicketId);
      if (found) return found;
    }
    return pendingTickets[0] || null;
  }, [pendingTickets, selectedTicketId]);

  // Manejador de completado de estación independiente
  const handleCompleteStation = async (ticketId: string, station: 'prep' | 'sideQuest') => {
    const targetTicket = tickets.find((t) => t.id === ticketId);
    if (!targetTicket) return;

    try {
      setLocalBusyId(ticketId);

      // 1. Marcar todas las unidades de esta estación como chequeadas
      const stationUnits = (targetTicket.productionUnits || []).filter((u) => u.station === station);
      stationUnits.forEach((u) => {
        if (!isUnitDone(u.unitKey)) {
          toggleUnitDone(u.unitKey);
        }
      });

      // 2. Registrar el despacho local de esta estación
      markStationDone(ticketId, station);

      // 3. Comprobar si la otra estación también está terminada o no tiene ítems
      const otherStation = station === 'prep' ? 'sideQuest' : 'prep';
      const otherStationHasUnits = (targetTicket.productionUnits || []).some(
        (u) => u.station === otherStation
      );

      const isOtherDone = !otherStationHasUnits || isStationDone(ticketId, otherStation);

      // 4. Si ambas estaciones terminaron (o no hay otra), promover a 'ready' en base de datos
      if (isOtherDone) {
        await advanceTicketStatus(ticketId, targetTicket.status);
      }

      setSelectedTicketId(null);
    } finally {
      setLocalBusyId(null);
    }
  };

  // Manejador de reversión de una comanda lista
  const handleRevertTicket = async (ticketId: string, currentStatus: KitchenTicket['status']) => {
    try {
      setLocalBusyId(ticketId);
      revertStationDone(ticketId, laneMode);
      if (currentStatus === 'ready') {
        await revertTicketStatus(ticketId, currentStatus);
      }
    } finally {
      setLocalBusyId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-14 bg-surface-card rounded-3xl border border-line" />
        <div className="h-64 bg-surface-card rounded-3xl border border-line" />
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-in fade-in duration-300">
      {/* ─── Comanda Activa en Foco (PEDIDO ACTIVO) ─────────────────────────────── */}
      {activeTicket ? (
        <KitchenTicketCard
          ticket={activeTicket}
          laneMode={laneMode}
          onAdvance={advanceTicketStatus}
          onRevert={revertTicketStatus}
          onCompleteStation={handleCompleteStation}
          isUpdating={isUpdating || localBusyId === activeTicket.id}
        />
      ) : (
        <div className="p-8 rounded-3xl bg-surface-card border-2 border-dashed border-line text-center flex flex-col items-center justify-center gap-2 text-text-muted">
          <Inbox className="w-10 h-10 stroke-1 opacity-70" />
          <p className="text-base font-bold text-text-primary">Estación al día</p>
          <p className="text-xs text-text-secondary">
            No hay pedidos pendientes en cola de {laneMode === 'prep' ? 'plancha' : 'side quest / empaque'}.
          </p>
        </div>
      )}

      {/* ─── Cola de Pedidos en Espera (COLA DE PEDIDOS) ────────────────────────── */}
      {pendingTickets.length > 1 && (
        <div className="bg-surface-card p-4 sm:p-5 rounded-3xl border border-line shadow-card space-y-3">
          <h3 className="text-xs font-black uppercase tracking-wider text-text-secondary flex items-center gap-1.5">
            <span>COLA DE PEDIDOS</span>
            <span className="px-2 py-0.5 rounded-full bg-surface-raised border border-line text-[11px] text-text-primary">
              {pendingTickets.length - 1}
            </span>
          </h3>

          <div className="space-y-2">
            {pendingTickets
              .filter((t) => t.id !== activeTicket?.id)
              .map((ticket) => {
                const laneUnits = (ticket.productionUnits || []).filter((u) => u.station === laneMode);
                const laneItemsSummary = laneUnits
                  .map((u) => {
                    const mods = [
                      ...(u.removedIngredients || []).map((m) => `-${m}`),
                      ...(u.extras || []).map((e) => `+${e.name}`),
                    ];
                    return mods.length > 0 ? `${u.name} (${mods.join(', ')})` : u.name;
                  })
                  .join(' · ');

                const queueLocation = formatKitchenLocation(ticket.location);

                return (
                  <button
                    key={ticket.id}
                    type="button"
                    onClick={() => setSelectedTicketId(ticket.id)}
                    className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-surface-raised border border-line hover:border-accent/40 hover:bg-surface transition-all text-left cursor-pointer group focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none min-h-[48px]"
                  >
                    <div className="min-w-0 pr-3">
                      <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                        <span className="font-black text-sm text-text-primary group-hover:text-accent transition-colors truncate max-w-[220px]">
                          {ticket.customerName}
                        </span>
                        <span className="font-extrabold text-xs px-2 py-0.5 rounded-md bg-surface border border-line text-text-secondary">
                          #{ticket.folio}
                        </span>
                        <span className="inline-flex items-center gap-1 text-[11px] font-black text-text-muted">
                          <MapPin className="w-3 h-3 text-accent" />
                          <span>{queueLocation}</span>
                        </span>
                      </div>
                      <p className="text-xs text-text-muted truncate">
                        {laneItemsSummary || ticket.items.map((i) => `${i.qty}x ${i.name}`).join(' · ')}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant="outline" className="text-[10px]">
                        {ticket.status === 'preparing' ? 'En Plancha' : 'En Cola'}
                      </Badge>
                    </div>
                  </button>
                );
              })}
          </div>
        </div>
      )}

      {/* ─── Acordeón de Pedidos Listos (LISTAS · X PEDIDOS) ───────────────────── */}
      {readyTickets.length > 0 && (
        <div className="bg-surface-card rounded-3xl border border-line shadow-card overflow-hidden">
          <button
            type="button"
            onClick={() => setIsReadySectionOpen((prev) => !prev)}
            aria-expanded={isReadySectionOpen}
            className="w-full p-4 flex items-center justify-between text-left cursor-pointer hover:bg-surface-raised transition-colors focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
          >
            <div>
              <span className="text-xs font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                LISTAS · {readyTickets.length} PEDIDO{readyTickets.length !== 1 ? 'S' : ''}
              </span>
              <p className="text-[11px] text-text-muted font-semibold mt-0.5">
                Toca para revisar o revertir
              </p>
            </div>
            {isReadySectionOpen ? (
              <ChevronUp className="w-4 h-4 text-text-muted" />
            ) : (
              <ChevronDown className="w-4 h-4 text-text-muted" />
            )}
          </button>

          {isReadySectionOpen && (
            <div className="p-4 pt-0 border-t border-line space-y-2.5">
              {readyTickets.map((ticket) => {
                const readyItemsSummary = ticket.items
                  .filter((i) => {
                    if (laneMode === 'prep') return i.itemKind === 'burger' || i.itemKind === 'combo';
                    if (laneMode === 'sideQuest') return i.itemKind !== 'burger';
                    return true;
                  })
                  .map((i) => `${i.qty}x ${i.name}`)
                  .join(' · ');

                const readyLocation = formatKitchenLocation(ticket.location);

                return (
                  <div
                    key={ticket.id}
                    className="flex items-center justify-between p-3.5 rounded-2xl bg-surface-raised border border-line"
                  >
                    <div className="min-w-0 pr-3">
                      <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                        <span className="font-black text-sm text-text-primary truncate max-w-[220px]">
                          {ticket.customerName}
                        </span>
                        <span className="font-extrabold text-xs px-2 py-0.5 rounded-md bg-surface border border-line text-text-secondary">
                          #{ticket.folio}
                        </span>
                        <span className="inline-flex items-center gap-1 text-[11px] font-black text-text-muted">
                          <MapPin className="w-3 h-3 text-accent" />
                          <span>{readyLocation}</span>
                        </span>
                      </div>
                      <p className="text-xs text-text-muted truncate">
                        {readyItemsSummary || ticket.items.map((i) => `${i.qty}x ${i.name}`).join(' · ')}
                      </p>
                    </div>

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleRevertTicket(ticket.id, ticket.status)}
                      disabled={isUpdating || localBusyId === ticket.id}
                      className="shrink-0 text-xs font-bold rounded-xl border-line text-text-secondary hover:text-text-primary min-h-[40px] px-3.5 focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
                      title="Revertir comanda a preparación"
                    >
                      {localBusyId === ticket.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <RotateCcw className="w-3.5 h-3.5 mr-1" />
                      )}
                      <span>Revertir</span>
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
